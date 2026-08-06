import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Wallet, 
  AlertCircle, 
  Zap, 
  Award, 
  ChevronRight, 
  RefreshCw, 
  ArrowRight 
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  increment, 
  getDocs, 
  setDoc 
} from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { InvestmentPlan, UserInvestment } from '../types';
import { DEFAULT_PLANS } from '../lib/defaultData';
import { logUserActivity } from '../lib/activityLogger';

interface UserPlansProps {
  onOpenDeposit: () => void;
}

export const UserPlans: React.FC<UserPlansProps> = ({ onOpenDeposit }) => {
  const { firebaseUser, userProfile, systemConfig } = useAuth();

  const [availablePlans, setAvailablePlans] = useState<InvestmentPlan[]>([]);
  const [userInvestments, setUserInvestments] = useState<UserInvestment[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [loadingInvestments, setLoadingInvestments] = useState(true);

  const [buyingPlanId, setBuyingPlanId] = useState<string | null>(null);
  const [claimingInvId, setClaimingInvId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch Available Plans from Firestore or seed defaults
  useEffect(() => {
    const plansRef = collection(db, 'plans');
    const unsubscribe = onSnapshot(plansRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default plans if empty
        try {
          for (const plan of DEFAULT_PLANS) {
            await setDoc(doc(db, 'plans', plan.id), plan);
          }
        } catch (e) {
          console.error('Error seeding plans:', e);
        }
        setAvailablePlans(DEFAULT_PLANS);
      } else {
        const fetched: InvestmentPlan[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as InvestmentPlan));
        setAvailablePlans(fetched.filter(p => p.isActive));
      }
      setLoadingPlans(false);
    }, (err) => {
      console.warn('Plans snapshot error, using defaults:', err);
      setAvailablePlans(DEFAULT_PLANS);
      setLoadingPlans(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch User Investments
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'user_investments'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const invs: UserInvestment[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as UserInvestment));
      setUserInvestments(invs);
      setLoadingInvestments(false);
    }, (err) => {
      console.error('Error fetching investments:', err);
      setLoadingInvestments(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // Handle Plan Purchase
  const handlePurchasePlan = async (plan: InvestmentPlan) => {
    if (!firebaseUser || !userProfile) return;

    if (systemConfig.maintenanceMode) {
      setMessage({
        type: 'error',
        text: '🚧 System Maintenance Active: Investment plan purchases are temporarily paused.'
      });
      return;
    }

    if (userProfile.balance < plan.price) {
      setMessage({
        type: 'error',
        text: `Insufficient balance! You need ${systemConfig.currencySymbol}${plan.price.toLocaleString()} to purchase ${plan.name}. Please deposit funds.`
      });
      return;
    }

    setBuyingPlanId(plan.id);
    setMessage(null);

    try {
      // 1. Deduct user balance in Firestore
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        balance: increment(-plan.price)
      });

      // 2. Create Transaction Record
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone,
        userName: userProfile.fullName,
        type: 'plan_purchase',
        method: 'Internal',
        amount: plan.price,
        status: 'approved',
        createdAt: Date.now(),
        adminNote: `Purchased ${plan.name}`
      });

      // 3. Create User Investment
      const now = Date.now();
      const newInv: Omit<UserInvestment, 'id'> = {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userName: userProfile.fullName,
        planId: plan.id,
        planName: plan.name,
        investedAmount: plan.price,
        dailyProfit: plan.dailyProfitAmount,
        durationDays: plan.durationDays,
        daysClaimed: 0,
        lastClaimTimestamp: 0,
        nextClaimTimestamp: now, // Can claim first daily profit immediately!
        totalClaimedAmount: 0,
        status: 'active',
        purchasedAt: now
      };

      await addDoc(collection(db, 'user_investments'), newInv);

      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'plan_purchase',
        `Subscribed to ${plan.name} for ${systemConfig.currencySymbol}${plan.price}`,
        { planId: plan.id, planName: plan.name, price: plan.price }
      );

      setMessage({
        type: 'success',
        text: `🎉 Successfully subscribed to ${plan.name}! You can now claim your daily profits!`
      });
    } catch (err: any) {
      console.error('Purchase plan error:', err);
      setMessage({ type: 'error', text: 'Failed to process plan purchase. Please try again.' });
    } finally {
      setBuyingPlanId(null);
    }
  };

  // Handle Daily Profit Claim
  const handleClaimProfit = async (inv: UserInvestment) => {
    if (!firebaseUser || !userProfile) return;
    setClaimingInvId(inv.id);
    setMessage(null);

    try {
      const now = Date.now();
      const nextClaim = now + (24 * 60 * 60 * 1000); // 24 hours
      const newDaysClaimed = inv.daysClaimed + 1;
      const isCompleted = newDaysClaimed >= inv.durationDays;

      // 1. Credit User Balance & Earnings
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        balance: increment(inv.dailyProfit),
        totalEarnings: increment(inv.dailyProfit)
      });

      // 2. Log Transaction
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone,
        userName: userProfile.fullName,
        type: 'plan_profit',
        method: 'Internal',
        amount: inv.dailyProfit,
        status: 'approved',
        createdAt: now,
        adminNote: `Daily Yield Claim #${newDaysClaimed} for ${inv.planName}`
      });

      // 3. Update Investment Record
      const invRef = doc(db, 'user_investments', inv.id);
      await updateDoc(invRef, {
        daysClaimed: newDaysClaimed,
        lastClaimTimestamp: now,
        nextClaimTimestamp: nextClaim,
        totalClaimedAmount: increment(inv.dailyProfit),
        status: isCompleted ? 'completed' : 'active'
      });

      setMessage({
        type: 'success',
        text: `💰 Claimed ${systemConfig.currencySymbol}${inv.dailyProfit.toLocaleString()} daily profit from ${inv.planName}!`
      });
    } catch (err) {
      console.error('Error claiming profit:', err);
      setMessage({ type: 'error', text: 'Failed to claim profit. Please try again.' });
    } finally {
      setClaimingInvId(null);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Alert Messages */}
      {message && (
        <div className={`p-4 rounded-2xl border text-xs font-bold flex items-center justify-between gap-3 animate-fade-in ${
          message.type === 'success'
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200'
            : 'bg-rose-500/20 border-rose-500/40 text-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
          {message.type === 'error' && (
            <button
              onClick={onOpenDeposit}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-3 py-1.5 rounded-xl font-black text-[11px] shrink-0"
            >
              Deposit Cash
            </button>
          )}
        </div>
      )}

      {/* ACTIVE USER INVESTMENTS SECTION */}
      {userInvestments.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> My Active Investment Plans
              </h2>
              <p className="text-xs text-slate-400">Claim your daily profits every 24 hours.</p>
            </div>
            <span className="text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full">
              {userInvestments.filter(i => i.status === 'active').length} Active Yields
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {userInvestments.map((inv) => {
              const now = Date.now();
              const canClaim = now >= inv.nextClaimTimestamp && inv.status === 'active';
              const progressPct = Math.min(100, Math.round((inv.daysClaimed / inv.durationDays) * 100));

              return (
                <div
                  key={inv.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    inv.status === 'completed'
                      ? 'bg-slate-950/60 border-slate-800 opacity-75'
                      : 'bg-slate-800/80 border-emerald-500/40 shadow-xl'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-mono tracking-wider font-extrabold text-emerald-400">
                        {inv.status === 'completed' ? 'Completed Plan' : 'Active VIP Contract'}
                      </span>
                      <h3 className="text-base font-black text-white">{inv.planName}</h3>
                    </div>
                    <span className="text-sm font-mono font-black text-amber-400">
                      +{systemConfig.currencySymbol}{inv.dailyProfit}/day
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Claimed Days: <strong className="text-white font-mono">{inv.daysClaimed} / {inv.durationDays}</strong></span>
                      <span className="font-mono font-bold text-emerald-400">{progressPct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-300 transition-all duration-500"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Claim Button / Status */}
                  <div className="mt-5 flex items-center justify-between gap-3 pt-3 border-t border-slate-700/60">
                    <div className="text-xs">
                      <span className="text-slate-400 block text-[10px]">Total Profit Earned</span>
                      <span className="font-mono font-bold text-emerald-300 text-sm">
                        {systemConfig.currencySymbol}{inv.totalClaimedAmount.toLocaleString()}
                      </span>
                    </div>

                    {inv.status === 'completed' ? (
                      <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Plan Finished
                      </span>
                    ) : (
                      <button
                        disabled={!canClaim || claimingInvId === inv.id}
                        onClick={() => handleClaimProfit(inv)}
                        className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                          canClaim
                            ? 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-400/20 active:scale-95 animate-bounce'
                            : 'bg-slate-950 text-slate-500 border border-slate-800 cursor-not-allowed'
                        }`}
                      >
                        {claimingInvId === inv.id ? (
                          <RefreshCw className="w-4 h-4 animate-spin text-amber-500" />
                        ) : canClaim ? (
                          <>
                            <Sparkles className="w-4 h-4" /> Claim PKR {inv.dailyProfit}
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-slate-500" /> Claim in 24h
                          </>
                        )}
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AVAILABLE INVESTMENT PLANS CATALOG */}
      <div className="space-y-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Guaranteed Daily Payouts
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Investment & Earning Packages
          </h2>
          <p className="text-xs text-slate-400">
            Subscribe to guaranteed yield packages using your JazzCash/EasyPaisa account balance.
          </p>
        </div>

        {loadingPlans ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading investment plans...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {availablePlans.map((plan) => {
              const isBuying = buyingPlanId === plan.id;

              return (
                <div
                  key={plan.id}
                  className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 group hover:-translate-y-1 relative overflow-hidden"
                >
                  {plan.badgeText && (
                    <div className="absolute top-4 right-4 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
                      {plan.badgeText}
                    </div>
                  )}

                  <div>
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                      VIP Package
                    </span>
                    <h3 className="text-lg font-black text-white group-hover:text-emerald-300 transition-colors">
                      {plan.name}
                    </h3>

                    {/* Price */}
                    <div className="my-4">
                      <span className="text-xs text-slate-400">Investment Price</span>
                      <div className="text-2xl font-black text-emerald-400 font-mono">
                        {systemConfig.currencySymbol}{plan.price.toLocaleString()}
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">
                      {plan.description}
                    </p>

                    {/* Features List */}
                    <ul className="space-y-2 border-t border-slate-800/80 pt-4 mb-6 text-xs text-slate-300">
                      <li className="flex items-center justify-between">
                        <span className="text-slate-400">Daily Return:</span>
                        <strong className="font-mono text-amber-400">{plan.dailyProfitPercent}% ({systemConfig.currencySymbol}{plan.dailyProfitAmount}/day)</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-slate-400">Duration:</span>
                        <strong className="text-white">{plan.durationDays} Days</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-slate-400">Total Profit:</span>
                        <strong className="font-mono text-emerald-400">{systemConfig.currencySymbol}{plan.totalReturnAmount.toLocaleString()} ({plan.totalReturnPercent}%)</strong>
                      </li>
                      <li className="flex items-center justify-between">
                        <span className="text-slate-400">Payout Method:</span>
                        <span className="text-xs font-semibold text-sky-400">JazzCash & EasyPaisa</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    disabled={isBuying}
                    onClick={() => handlePurchasePlan(plan)}
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                  >
                    {isBuying ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                    ) : (
                      <>
                        Subscribe Now <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
