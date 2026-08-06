import React, { useState, useEffect } from 'react';
import { 
  BarChart2, 
  Sparkles, 
  Clock, 
  Layers, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  Zap, 
  Filter, 
  Info 
} from 'lucide-react';
import { collection, onSnapshot, setDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { InvestmentPool } from '../types';
import { DEFAULT_POOLS } from '../lib/defaultData';
import { useAuth } from '../context/AuthContext';
import { logUserActivity } from '../lib/activityLogger';

interface InvestmentPoolsProps {
  onOpenDeposit: () => void;
}

export const InvestmentPools: React.FC<InvestmentPoolsProps> = ({ onOpenDeposit }) => {
  const { systemConfig, firebaseUser, userProfile } = useAuth();
  const [pools, setPools] = useState<InvestmentPool[]>(DEFAULT_POOLS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [investingPool, setInvestingPool] = useState<InvestmentPool | null>(null);
  const [investAmount, setInvestAmount] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load Investment Pools from Firestore in real time
  useEffect(() => {
    const poolsRef = collection(db, 'pools');
    const unsubscribe = onSnapshot(poolsRef, async (snapshot) => {
      if (snapshot.empty) {
        // Seed default pools to Firestore
        for (const p of DEFAULT_POOLS) {
          await setDoc(doc(db, 'pools', p.id), p);
        }
        setPools(DEFAULT_POOLS);
      } else {
        const fetched: InvestmentPool[] = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as InvestmentPool));
        setPools(fetched);
      }
    }, (err) => {
      console.error('Error listening to pools:', err);
    });

    return () => unsubscribe();
  }, []);

  const filteredPools = selectedCategory === 'all' 
    ? pools 
    : pools.filter(p => p.category?.toLowerCase() === selectedCategory.toLowerCase());

  const handleInvest = (pool: InvestmentPool) => {
    setInvestingPool(pool);
    setInvestAmount(pool.minInvestment.toString());
  };

  const confirmInvest = () => {
    if (!investingPool) return;
    if (systemConfig.maintenanceMode) {
      setSuccessMsg('🚧 System Maintenance Active: Pool allocations are temporarily paused.');
      setInvestingPool(null);
      return;
    }
    const amt = Number(investAmount);
    setSuccessMsg(`🎉 Successfully allocated PKR ${amt.toLocaleString()} into ${investingPool.name}! Yield starts generating immediately.`);
    if (firebaseUser && userProfile) {
      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'pool_investment',
        `Allocated ${systemConfig.currencySymbol}${amt} into ${investingPool.name}`,
        { poolId: investingPool.id, poolName: investingPool.name, amount: amt }
      );
    }
    setInvestingPool(null);
    setTimeout(() => setSuccessMsg(null), 5000);
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <BarChart2 className="w-3.5 h-3.5 text-amber-400" /> Guaranteed Yield Pools
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            High-Yield Investment Pools
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Select high-capacity crowdsourced investment pools with automated daily profits directly into your account balance.
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {['all', 'High Growth', 'VIP Yield', 'Starter Pool', 'Super Vault'].map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat === 'all' ? 'All Pools' : cat}
          </button>
        ))}
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredPools.map((pool) => (
          <div
            key={pool.id}
            className="bg-slate-900 border border-slate-800 hover:border-emerald-500/40 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 flex flex-col justify-between"
          >
            {/* Pool Image Banner */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={pool.bannerImage}
                alt={pool.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
              
              {pool.isFeatured && (
                <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full shadow-md">
                  HOT POOL
                </div>
              )}

              <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                <div>
                  <span className="text-[10px] text-emerald-300 font-mono font-bold uppercase tracking-widest block">
                    {pool.category || 'Standard'}
                  </span>
                  <h3 className="text-lg font-black text-white">{pool.name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Daily Yield</span>
                  <span className="text-lg font-mono font-black text-amber-400">{pool.dailyReturnPercent}%</span>
                </div>
              </div>
            </div>

            {/* Pool Metrics */}
            <div className="p-5 space-y-4">
              
              {/* Funded Progress */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Raised: <strong className="text-white font-mono">{systemConfig.currencySymbol}{pool.totalRaised.toLocaleString()}</strong></span>
                  <span className="font-mono font-extrabold text-emerald-400">{pool.fundedPercent}% Funded</span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 transition-all duration-500"
                    style={{ width: `${pool.fundedPercent}%` }}
                  />
                </div>
              </div>

              {/* Pool Details List */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                <div>
                  <span className="text-[10px] text-slate-400 block">Min Investment</span>
                  <span className="font-mono font-bold text-white">{systemConfig.currencySymbol}{pool.minInvestment.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Duration</span>
                  <span className="font-bold text-white">{pool.durationDays} Days</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Total ROI</span>
                  <span className="font-mono font-extrabold text-emerald-400">{pool.totalReturnPercent}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Payout Frequency</span>
                  <span className="font-semibold text-sky-300">Every 24 Hours</span>
                </div>
              </div>

              {/* Invest Button */}
              <button
                onClick={() => handleInvest(pool)}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Participate in Pool <ArrowRight className="w-4 h-4" />
              </button>

            </div>
          </div>
        ))}
      </div>

      {/* Invest Modal */}
      {investingPool && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl animate-fade-in">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" /> Join {investingPool.name}
            </h3>
            
            <p className="text-xs text-slate-400">
              Enter investment amount in {systemConfig.currencySymbol}. Daily returns will be added to your balance.
            </p>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-300">Investment Amount</label>
              <input
                type="number"
                value={investAmount}
                onChange={(e) => setInvestAmount(e.target.value)}
                min={investingPool.minInvestment}
                max={investingPool.maxInvestment}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm font-mono text-white outline-none focus:border-emerald-500"
              />
              <span className="text-[10px] text-slate-500 block">
                Min: {systemConfig.currencySymbol}{investingPool.minInvestment} | Max: {systemConfig.currencySymbol}{investingPool.maxInvestment.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => setInvestingPool(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2.5 rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={confirmInvest}
                className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-2.5 rounded-xl text-xs shadow-lg shadow-emerald-500/20"
              >
                Confirm Allocation
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
