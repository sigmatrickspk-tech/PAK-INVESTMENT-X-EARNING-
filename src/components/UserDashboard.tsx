import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  TrendingUp, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Gift, 
  CalendarCheck, 
  Share2, 
  Copy, 
  Check, 
  PlayCircle, 
  CheckSquare, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  RefreshCw,
  ExternalLink,
  Layers,
  BarChart3,
  MessageCircle,
  Zap
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  increment 
} from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { Transaction, EarningTask } from '../types';
import { db } from '../lib/firebase';
import { DEFAULT_TASKS } from '../lib/defaultData';
import { InvestmentPools } from './InvestmentPools';
import { UserPlans } from './UserPlans';
import { TeamCenter } from './TeamCenter';
import { WithdrawalProofs } from './WithdrawalProofs';
import { GamesView } from './GamesView';
import { BottomNav, ActiveNavTab } from './BottomNav';
import { UserAnalyticsChart } from './UserAnalyticsChart';
import { UserActivityLogComponent } from './UserActivityLog';
import { TopEarners } from './TopEarners';
import { logUserActivity } from '../lib/activityLogger';

interface UserDashboardProps {
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenPromo: () => void;
  onOpenSupport: () => void;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({
  onOpenDeposit,
  onOpenWithdraw,
  onOpenPromo,
  onOpenSupport
}) => {
  const { userProfile, systemConfig, updateProfileData, firebaseUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'plans' | 'pools' | 'team' | 'proofs' | 'games'>('overview');
  const [bottomNavTab, setBottomNavTab] = useState<ActiveNavTab>('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loadingTx, setLoadingTx] = useState(true);
  const [copiedRef, setCopiedRef] = useState(false);
  const [activeTaskTimer, setActiveTaskTimer] = useState<{ taskId: string; secondsLeft: number } | null>(null);
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Fetch Realtime User Transactions
  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', firebaseUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const txs: Transaction[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Transaction));
      setTransactions(txs);
      setLoadingTx(false);
    }, (err) => {
      console.error('Error fetching user transactions:', err);
      setLoadingTx(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  // Handle Task Timer
  useEffect(() => {
    if (!activeTaskTimer) return;
    if (activeTaskTimer.secondsLeft <= 0) {
      // Complete Task
      completeTask(activeTaskTimer.taskId);
      setActiveTaskTimer(null);
      return;
    }

    const interval = setInterval(() => {
      setActiveTaskTimer(prev => prev ? { ...prev, secondsLeft: prev.secondsLeft - 1 } : null);
    }, 1000);

    return () => clearInterval(interval);
  }, [activeTaskTimer]);

  const refUrl = `${window.location.origin}?ref=${userProfile?.referralCode || ''}`;

  const handleCopyReferral = () => {
    if (!userProfile?.referralCode) return;
    navigator.clipboard.writeText(refUrl);
    setCopiedRef(true);
    setTimeout(() => setCopiedRef(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`🔥 Join SIGMAXEARNINGS! Earn daily profits with instant JazzCash & EasyPaisa payouts. Register now using my referral link: ${refUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;
  const lastCheckinTime = userProfile?.lastCheckinTimestamp || 0;
  const timeSinceLastCheckin = Date.now() - lastCheckinTime;
  const canClaimDailyCheckin = timeSinceLastCheckin >= TWENTY_FOUR_HOURS;

  const getCheckinCountdownText = () => {
    if (canClaimDailyCheckin) return null;
    const msLeft = TWENTY_FOUR_HOURS - timeSinceLastCheckin;
    const hours = Math.floor(msLeft / (1000 * 60 * 60));
    const mins = Math.floor((msLeft % (1000 * 60 * 60)) / (1000 * 60));
    return `Next check-in in ${hours}h ${mins}m`;
  };

  const handleDailyCheckin = async () => {
    if (!firebaseUser || !userProfile) return;
    if (!canClaimDailyCheckin) {
      setActionSuccessMsg(`⏱️ ${getCheckinCountdownText()}. Please come back later!`);
      setTimeout(() => setActionSuccessMsg(null), 3000);
      return;
    }

    const reward = systemConfig.dailyCheckinReward || 50;

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        balance: increment(reward),
        totalEarnings: increment(reward),
        lastCheckinTimestamp: Date.now()
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone,
        userName: userProfile.fullName,
        type: 'task_earning',
        method: 'Internal',
        amount: reward,
        status: 'approved',
        createdAt: Date.now(),
        adminNote: '24-Hour Daily Check-in Bonus'
      });

      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'task_claim',
        `Claimed 24-Hour Daily Attendance Bonus of ${systemConfig.currencySymbol}${reward}`,
        { rewardAmount: reward }
      );

      setClaimedTasks(prev => [...prev, 'task-1']);
      setActionSuccessMsg(`🎉 Claimed ${systemConfig.currencySymbol}${reward} Daily Check-in Bonus!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Error claiming daily reward:', err);
    }
  };

  const startTask = (task: EarningTask) => {
    if (claimedTasks.includes(task.id)) return;
    if (task.timerSeconds > 0) {
      setActiveTaskTimer({ taskId: task.id, secondsLeft: task.timerSeconds });
    } else {
      completeTask(task.id);
    }
  };

  const getTaskReward = (task: EarningTask) => {
    if (task.category === 'daily_checkin') return systemConfig.dailyCheckinReward || 50;
    if (task.category === 'ad_watch') return systemConfig.videoAdReward || 30;
    if (task.category === 'survey') return systemConfig.surveyReward || 45;
    if (task.category === 'task') return systemConfig.appReviewReward || 60;
    return task.reward;
  };

  const completeTask = async (taskId: string) => {
    if (!firebaseUser || !userProfile) return;
    const task = DEFAULT_TASKS.find(t => t.id === taskId);
    if (!task) return;

    const reward = getTaskReward(task);

    try {
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        balance: increment(reward),
        totalEarnings: increment(reward)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone,
        userName: userProfile.fullName,
        type: 'task_earning',
        method: 'Internal',
        amount: reward,
        status: 'approved',
        createdAt: Date.now(),
        adminNote: `Completed Task: ${task.title}`
      });

      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'task_claim',
        `Completed Task "${task.title}" for ${systemConfig.currencySymbol}${reward}`,
        { taskId: task.id, rewardAmount: reward }
      );

      setClaimedTasks(prev => [...prev, taskId]);
      setActionSuccessMsg(`✅ Completed "${task.title}" and earned ${systemConfig.currencySymbol}${reward}!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
    } catch (err) {
      console.error('Task error:', err);
    }
  };

  const getTaskIcon = (iconName?: string) => {
    switch (iconName) {
      case 'CalendarCheck': return <CalendarCheck className="w-5 h-5 text-emerald-400" />;
      case 'PlayCircle': return <PlayCircle className="w-5 h-5 text-amber-400" />;
      case 'CheckSquare': return <CheckSquare className="w-5 h-5 text-teal-400" />;
      case 'Send': return <Send className="w-5 h-5 text-sky-400" />;
      default: return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Welcome Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Member Account Active
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">{userProfile?.fullName || 'User'}</span>!
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Track your earnings, manage JazzCash/EasyPaisa payouts, and complete daily tasks.
            </p>
          </div>

          {/* Action Hub */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <button
              onClick={onOpenDeposit}
              className="flex-1 md:flex-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <ArrowDownLeft className="w-4 h-4" />
              Deposit Funds
            </button>
            <button
              onClick={onOpenWithdraw}
              className="flex-1 md:flex-none bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-emerald-500/30 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw Cash
            </button>
            <button
              onClick={onOpenPromo}
              className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold px-3 py-2.5 rounded-xl text-xs flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <Gift className="w-4 h-4 text-amber-400" />
              Promo Code
            </button>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto no-scrollbar">
        <button
          onClick={() => { setActiveTab('overview'); setBottomNavTab('home'); }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Dashboard
        </button>

        <button
          onClick={() => { setActiveTab('plans'); setBottomNavTab('pools'); }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === 'plans'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          VIP Packages
        </button>

        <button
          onClick={() => { setActiveTab('pools'); setBottomNavTab('pools'); }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === 'pools'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-400" />
          Yield Pools
        </button>

        <button
          onClick={() => { setActiveTab('team'); setBottomNavTab('team'); }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === 'team'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4 text-teal-300" />
          Team Network
        </button>

        <button
          onClick={() => { setActiveTab('proofs'); setBottomNavTab('home'); }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === 'proofs'
              ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-sky-300" />
          Withdrawal Proofs
        </button>

        <button
          onClick={() => { setActiveTab('games'); setBottomNavTab('home'); }}
          className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
            activeTab === 'games'
              ? 'bg-purple-500 text-slate-950 shadow-lg shadow-purple-500/20'
              : 'text-purple-300 hover:text-white'
          }`}
        >
          <Zap className="w-4 h-4 text-pink-400" />
          Arcade Games
        </button>
      </div>

      {/* TAB CONTENT: PLANS */}
      {activeTab === 'plans' && (
        <UserPlans onOpenDeposit={onOpenDeposit} />
      )}

      {/* TAB CONTENT: POOLS */}
      {activeTab === 'pools' && (
        <InvestmentPools onOpenDeposit={onOpenDeposit} />
      )}

      {/* TAB CONTENT: TEAM */}
      {activeTab === 'team' && (
        <TeamCenter />
      )}

      {/* TAB CONTENT: PROOFS */}
      {activeTab === 'proofs' && (
        <WithdrawalProofs />
      )}

      {/* TAB CONTENT: GAMES */}
      {activeTab === 'games' && (
        <GamesView />
      )}

      {/* TAB CONTENT: OVERVIEW */}
      {activeTab === 'overview' && (
        <>
          {/* Financial Overview Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            
            <div className="bg-slate-900/90 border border-emerald-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Available Balance</span>
                <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Wallet className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {systemConfig.currencySymbol}{userProfile?.balance?.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-semibold">
                ● Ready for withdrawal
              </span>
            </div>

            <div className="bg-slate-900/90 border border-teal-500/30 p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Earnings</span>
                <div className="p-2 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {systemConfig.currencySymbol}{userProfile?.totalEarnings?.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-teal-400 flex items-center gap-1 mt-1 font-semibold">
                ▲ Includes yields & tasks
              </span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Deposited</span>
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-sky-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {systemConfig.currencySymbol}{userProfile?.totalDeposited?.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">JazzCash & EasyPaisa</span>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">Total Withdrawn</span>
                <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-amber-400">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-black text-white font-mono">
                {systemConfig.currencySymbol}{userProfile?.totalWithdrawn?.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">Approved Payouts</span>
            </div>

          </div>

          {/* Referral Link & Share Section */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 relative">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shrink-0">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Invite Friends & Earn PKR {systemConfig.referralBonusAmount || 100} Per Referral
                  </h3>
                  {copiedRef && (
                    <span className="animate-bounce text-[10px] font-black text-emerald-300 bg-emerald-500/20 px-2.5 py-0.5 rounded-full border border-emerald-500/40">
                      ✓ Link Copied!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400">
                  Your Referral Code: <span className="font-mono font-bold text-amber-300">{userProfile?.referralCode || 'N/A'}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <input
                type="text"
                readOnly
                value={refUrl}
                className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-slate-300 w-full md:w-60 outline-none"
              />
              <button
                onClick={handleCopyReferral}
                className={`font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all ${
                  copiedRef
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-105'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                }`}
              >
                {copiedRef ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiedRef ? 'Copied!' : 'Copy'}
              </button>
              <button
                onClick={handleShareWhatsApp}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp
              </button>
            </div>
          </div>

          {/* Recharts Visual Transaction Analytics Chart */}
          <UserAnalyticsChart transactions={transactions} systemConfig={systemConfig} />

          {/* Daily Tasks & Earning Center */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-400" /> Daily Task Center
                </h2>
                <p className="text-xs text-slate-400">Complete tasks & daily check-ins to credit earnings straight to your balance.</p>
              </div>
              <span className="text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full">
                4 Active Offers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULT_TASKS.map((task) => {
                const isCheckin = task.category === 'daily_checkin';
                const isClaimed = isCheckin ? !canClaimDailyCheckin : claimedTasks.includes(task.id);
                const isTimerRunning = activeTaskTimer?.taskId === task.id;

                return (
                  <div 
                    key={task.id}
                    className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                      isClaimed 
                        ? 'bg-slate-950/40 border-slate-800 opacity-70' 
                        : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700">
                        {getTaskIcon(task.iconName)}
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-white">{task.title}</h4>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {isCheckin && !canClaimDailyCheckin 
                            ? getCheckinCountdownText()
                            : task.description}
                        </p>
                        <span className="inline-block mt-1 text-xs font-extrabold text-emerald-400 font-mono">
                          +{systemConfig.currencySymbol}{getTaskReward(task)}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={isClaimed || isTimerRunning}
                      onClick={() => {
                        if (isCheckin) {
                          handleDailyCheckin();
                        } else {
                          startTask(task);
                        }
                      }}
                      className={`px-3.5 py-2 rounded-xl text-xs font-extrabold shrink-0 transition-all ${
                        isClaimed
                          ? 'bg-slate-800 text-slate-400 border border-slate-700/60 cursor-not-allowed'
                          : isTimerRunning
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 cursor-wait animate-pulse'
                          : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md shadow-emerald-500/10'
                      }`}
                    >
                      {isCheckin && !canClaimDailyCheckin ? (
                        <span className="flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-3.5 h-3.5 text-amber-400" /> Done for today
                        </span>
                      ) : isClaimed ? (
                        <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Claimed</span>
                      ) : isTimerRunning ? (
                        <span className="flex items-center gap-1 font-mono">
                          <Clock className="w-3.5 h-3.5 animate-spin" /> {activeTaskTimer.secondsLeft}s
                        </span>
                      ) : (
                        'Claim Reward'
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Leaderboard - Top Earners */}
          <TopEarners />

          {/* User Activity Audit Log */}
          <UserActivityLogComponent />

          {/* Transaction History & Status Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-400" /> Transaction & Payout History
                </h2>
                <p className="text-xs text-slate-400">Real-time status of your deposits, withdrawals & earnings.</p>
              </div>
              <button
                onClick={onOpenSupport}
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1 self-start sm:self-auto"
              >
                Need help with a transaction? Contact Support →
              </button>
            </div>

            {loadingTx ? (
              <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading transaction ledger...
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-800 rounded-xl p-8">
                <Wallet className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400">No transactions recorded yet.</p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Make a deposit or claim a daily task to see activity here!
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Method / Details</th>
                      <th className="py-3 px-4">TID / Ref</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Date & Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {transactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-800/40 transition-colors">
                        
                        {/* Type */}
                        <td className="py-3.5 px-4 font-bold capitalize">
                          {tx.type === 'deposit' && (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
                            </span>
                          )}
                          {tx.type === 'withdrawal' && (
                            <span className="text-amber-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Withdrawal
                            </span>
                          )}
                          {tx.type === 'task_earning' && (
                            <span className="text-teal-300 flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5" /> Task Reward
                            </span>
                          )}
                          {tx.type === 'promo_reward' && (
                            <span className="text-purple-400 flex items-center gap-1">
                              <Gift className="w-3.5 h-3.5" /> Promo Bonus
                            </span>
                          )}
                          {tx.type === 'plan_purchase' && (
                            <span className="text-indigo-400 flex items-center gap-1">
                              <Layers className="w-3.5 h-3.5" /> VIP Subscription
                            </span>
                          )}
                          {tx.type === 'plan_profit' && (
                            <span className="text-emerald-300 flex items-center gap-1">
                              <TrendingUp className="w-3.5 h-3.5" /> Yield Profit
                            </span>
                          )}
                          {tx.type === 'referral_bonus' && (
                            <span className="text-amber-300 flex items-center gap-1">
                              <Share2 className="w-3.5 h-3.5" /> Referral Bonus
                            </span>
                          )}
                        </td>

                        {/* Method */}
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-white">{tx.method}</span>
                          {tx.accountNumber && (
                            <span className="block text-[10px] text-slate-400 font-mono">
                              {tx.accountTitle ? `${tx.accountTitle} (${tx.accountNumber})` : tx.accountNumber}
                            </span>
                          )}
                        </td>

                        {/* TID */}
                        <td className="py-3.5 px-4 font-mono text-slate-300">
                          {tx.transactionId || 'N/A'}
                        </td>

                        {/* Amount */}
                        <td className="py-3.5 px-4 font-black text-sm font-mono text-white">
                          {systemConfig.currencySymbol}{tx.amount.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="py-3.5 px-4">
                          {tx.status === 'approved' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Approved
                            </span>
                          )}
                          {tx.status === 'pending' && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[10px] font-bold animate-pulse">
                              <Clock className="w-3 h-3 text-amber-400" /> Pending Review
                            </span>
                          )}
                          {tx.status === 'rejected' && (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                                <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                              </span>
                              {tx.rejectionReason && (
                                <span className="block text-[10px] text-rose-400/80 mt-0.5">
                                  Reason: {tx.rejectionReason}
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-right text-[11px] text-slate-400 font-mono">
                          {new Date(tx.createdAt).toLocaleString()}
                        </td>

                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Floating Mobile/Desktop Bottom Navigation Bar */}
      <BottomNav
        activeTab={bottomNavTab}
        setActiveTab={(tab) => {
          setBottomNavTab(tab);
          if (tab === 'home') setActiveTab('overview');
          if (tab === 'pools') setActiveTab('pools');
          if (tab === 'team') setActiveTab('team');
          if (tab === 'invite') setActiveTab('overview');
          if (tab === 'profile') setActiveTab('overview');
        }}
      />

    </div>
  );
};
