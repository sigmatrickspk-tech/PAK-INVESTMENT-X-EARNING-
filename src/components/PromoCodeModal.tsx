import React, { useState } from 'react';
import { Gift, Sparkles, Check, AlertCircle } from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc, 
  addDoc, 
  increment, 
  arrayUnion 
} from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { DEFAULT_PROMOCODES } from '../lib/defaultData';
import { logUserActivity } from '../lib/activityLogger';

interface PromoCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PromoCodeModal: React.FC<PromoCodeModalProps> = ({ isOpen, onClose }) => {
  const { firebaseUser, userProfile, systemConfig } = useAuth();

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rewardClaimed, setRewardClaimed] = useState<number | null>(null);

  if (!isOpen) return null;

  const handleRedeem = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (systemConfig.maintenanceMode) {
      setError('🚧 System Maintenance Active: Promo code redemptions are temporarily paused.');
      return;
    }

    if (!firebaseUser || !userProfile) {
      setError('Please sign in to redeem promo codes.');
      return;
    }

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setError('Please enter a valid promo code.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Search in Firestore
      const q = query(collection(db, 'promocodes'), where('code', '==', cleanCode));
      const snap = await getDocs(q);

      let promoDocId: string | null = null;
      let rewardAmount = 0;
      let usedByUsers: string[] = [];

      if (!snap.empty) {
        const pData = snap.docs[0].data();
        promoDocId = snap.docs[0].id;
        if (!pData.isActive) {
          throw new Error('This promo code is no longer active.');
        }
        if (pData.usedCount >= pData.maxUses) {
          throw new Error('This promo code limit has been reached.');
        }
        usedByUsers = pData.usedByUsers || [];
        if (usedByUsers.includes(firebaseUser.uid)) {
          throw new Error('You have already redeemed this promo code!');
        }
        rewardAmount = pData.rewardAmount;
      } else {
        // Fallback to default promo codes
        const defaultMatch = DEFAULT_PROMOCODES.find(p => p.code === cleanCode && p.isActive);
        if (!defaultMatch) {
          throw new Error('Invalid promo code. Please check and try again.');
        }
        rewardAmount = defaultMatch.rewardAmount;
      }

      // 2. Credit reward to user balance
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        balance: increment(rewardAmount),
        totalEarnings: increment(rewardAmount)
      });

      // 3. Update promo code document if exists in firestore
      if (promoDocId) {
        const promoRef = doc(db, 'promocodes', promoDocId);
        await updateDoc(promoRef, {
          usedCount: increment(1),
          usedByUsers: arrayUnion(firebaseUser.uid)
        });
      }

      // 4. Record transaction log
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone,
        userName: userProfile.fullName,
        type: 'promo_reward',
        method: 'Internal',
        amount: rewardAmount,
        status: 'approved',
        transactionId: `PROMO-${cleanCode}`,
        createdAt: Date.now(),
        adminNote: `Redeemed promo code ${cleanCode}`
      });

      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'promo_claim',
        `Redeemed promo code "${cleanCode}" for ${systemConfig.currencySymbol}${rewardAmount} bonus`,
        { code: cleanCode, rewardAmount }
      );

      setRewardClaimed(rewardAmount);
    } catch (err: any) {
      console.error('Promo error:', err);
      setError(err.message || 'Failed to redeem promo code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDone = () => {
    setRewardClaimed(null);
    setCode('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
        >
          ✕
        </button>

        {rewardClaimed !== null ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-amber-500/20 text-amber-400 rounded-full flex items-center justify-center mx-auto border border-amber-500/40 animate-bounce">
              <Gift className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Promo Code Redeemed!</h3>
            <p className="text-xs text-slate-300">
              <span className="font-extrabold text-amber-300 text-lg">{systemConfig.currencySymbol}{rewardClaimed}</span> has been added to your balance.
            </p>
            <button
              onClick={handleDone}
              className="mt-4 w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-amber-500/20"
            >
              Claim More Rewards
            </button>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl w-12 h-12 flex items-center justify-center mx-auto mb-3">
                <Gift className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-black text-white">Redeem Promo Code</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter official voucher code for instant balance rewards. Try <span className="font-mono text-amber-400 font-bold">SIGMA2026</span>
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleRedeem} className="space-y-4">
              <div>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Enter Code (e.g. SIGMA2026)"
                  className="w-full bg-slate-950 border border-slate-700 focus:border-amber-500 rounded-xl py-3 px-4 text-center text-lg font-mono tracking-widest text-amber-300 uppercase placeholder-slate-600 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg shadow-amber-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Redeem Code Now
                  </>
                )}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};
