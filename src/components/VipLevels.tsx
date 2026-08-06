import React from 'react';
import { Crown, Zap, ShieldCheck, ArrowUpRight, CheckCircle2, Star, Award, Lock } from 'lucide-react';
import { SystemConfig } from '../types';

export interface VipTier {
  level: number;
  name: string;
  minInvested: number;
  dailyWithdrawLimit: number;
  feePercentage: number;
  badgeColor: string;
  perks: string[];
}

export const VIP_TIERS: VipTier[] = [
  {
    level: 0,
    name: 'Standard Member',
    minInvested: 0,
    dailyWithdrawLimit: 25000,
    feePercentage: 5.0,
    badgeColor: 'text-slate-400 bg-slate-800 border-slate-700',
    perks: ['Standard 24h Payouts', '5% Withdrawal Fee', 'Standard Support']
  },
  {
    level: 1,
    name: 'VIP 1 Bronze',
    minInvested: 2000,
    dailyWithdrawLimit: 50000,
    feePercentage: 4.0,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
    perks: ['4% Withdrawal Fee', '50,000 PKR Daily Limit', 'Fast-Track Verification']
  },
  {
    level: 2,
    name: 'VIP 2 Silver',
    minInvested: 10000,
    dailyWithdrawLimit: 100000,
    feePercentage: 3.0,
    badgeColor: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
    perks: ['3% Withdrawal Fee', '100,000 PKR Daily Limit', 'Priority AI Chat Support']
  },
  {
    level: 3,
    name: 'VIP 3 Gold',
    minInvested: 25000,
    dailyWithdrawLimit: 200000,
    feePercentage: 2.0,
    badgeColor: 'text-amber-300 bg-amber-400/20 border-amber-400/40',
    perks: ['2% Withdrawal Fee', '200,000 PKR Daily Limit', 'Dedicated VIP Manager']
  },
  {
    level: 4,
    name: 'VIP 4 Diamond',
    minInvested: 50000,
    dailyWithdrawLimit: 350000,
    feePercentage: 1.0,
    badgeColor: 'text-purple-300 bg-purple-500/20 border-purple-400/40',
    perks: ['1% Withdrawal Fee', '350,000 PKR Daily Limit', 'Instant Automated Payouts']
  },
  {
    level: 5,
    name: 'VIP 5 Platinum Royal',
    minInvested: 100000,
    dailyWithdrawLimit: 500000,
    feePercentage: 0.0,
    badgeColor: 'text-emerald-300 bg-emerald-500/20 border-emerald-400/50',
    perks: ['0% ZERO Withdrawal Fee', '500,000 PKR Daily Limit', 'VIP Instant Priority Clearance']
  }
];

export const getVipTierForAmount = (totalInvested: number): VipTier => {
  let matched = VIP_TIERS[0];
  for (const tier of VIP_TIERS) {
    if (totalInvested >= tier.minInvested) {
      matched = tier;
    }
  }
  return matched;
};

interface VipLevelsProps {
  totalInvested: number;
  systemConfig: SystemConfig;
  onOpenPlans: () => void;
}

export const VipLevels: React.FC<VipLevelsProps> = ({
  totalInvested,
  systemConfig,
  onOpenPlans
}) => {
  const currentTier = getVipTierForAmount(totalInvested);
  const nextTier = VIP_TIERS.find(t => t.level === currentTier.level + 1);

  // Calculate Progress to Next Tier
  let progressPercent = 100;
  let amountNeeded = 0;

  if (nextTier) {
    const range = nextTier.minInvested - currentTier.minInvested;
    const currentInRange = totalInvested - currentTier.minInvested;
    progressPercent = Math.min(100, Math.max(0, Math.floor((currentInRange / range) * 100)));
    amountNeeded = nextTier.minInvested - totalInvested;
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <Crown className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white flex items-center gap-2">
              VIP Tier Benefits & Limits
            </h2>
            <p className="text-xs text-slate-400">
              Unlock higher daily withdrawal limits and lower fees as your investments grow.
            </p>
          </div>
        </div>

        <div className="self-start sm:self-auto">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black border ${currentTier.badgeColor}`}>
            <Star className="w-3.5 h-3.5 fill-current" /> {currentTier.name}
          </span>
        </div>
      </div>

      {/* Current Level Status Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-4 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Your Cumulative Investment</span>
            <span className="text-2xl font-black text-amber-400 font-mono">
              {systemConfig.currencySymbol}{totalInvested.toLocaleString()}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Withdrawal Fee Rate</span>
            <span className="text-xl font-black text-emerald-400 font-mono">
              {currentTier.feePercentage}% {currentTier.feePercentage === 0 && ' (ZERO FEE!)'}
            </span>
          </div>
        </div>

        {/* Progress Bar to Next Tier */}
        {nextTier ? (
          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
            <div className="flex justify-between text-xs font-bold text-slate-300">
              <span>Progress to <strong className="text-amber-300">{nextTier.name}</strong></span>
              <span className="font-mono text-emerald-400">{progressPercent}%</span>
            </div>
            <div className="bg-slate-950 h-3 rounded-full overflow-hidden border border-slate-800 p-0.5">
              <div 
                className="bg-gradient-to-r from-amber-500 via-emerald-400 to-emerald-500 h-full rounded-full transition-all duration-500 shadow-md shadow-emerald-500/20"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
              <span>Invest <strong className="text-white font-mono">{systemConfig.currencySymbol}{amountNeeded.toLocaleString()}</strong> more to level up</span>
              <button 
                onClick={onOpenPlans}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline flex items-center gap-1"
              >
                Invest Now <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center text-xs text-emerald-300 font-bold">
            👑 Congratulations! You have reached the highest Platinum Royal VIP Status!
          </div>
        )}
      </div>

      {/* Tier Comparison Table */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">All VIP Level Perks Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {VIP_TIERS.map((tier) => {
            const isCurrent = currentTier.level === tier.level;
            const isUnlocked = totalInvested >= tier.minInvested;

            return (
              <div
                key={tier.level}
                className={`p-4 rounded-2xl border transition-all ${
                  isCurrent
                    ? 'bg-slate-800/90 border-amber-500/60 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/30'
                    : isUnlocked
                    ? 'bg-slate-950/60 border-emerald-500/30'
                    : 'bg-slate-950/30 border-slate-800 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${tier.badgeColor}`}>
                    {tier.name}
                  </span>
                  {isCurrent ? (
                    <span className="text-[10px] font-black bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full">ACTIVE</span>
                  ) : isUnlocked ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Lock className="w-3.5 h-3.5 text-slate-600" />
                  )}
                </div>

                <div className="space-y-1.5 my-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Min Investment:</span>
                    <strong className="text-white font-mono">{systemConfig.currencySymbol}{tier.minInvested.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Daily Withdrawal:</span>
                    <strong className="text-emerald-400 font-mono">{systemConfig.currencySymbol}{tier.dailyWithdrawLimit.toLocaleString()}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Withdrawal Fee:</span>
                    <strong className="text-amber-300 font-mono">{tier.feePercentage}%</strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/60 space-y-1">
                  {tier.perks.map((p, idx) => (
                    <div key={idx} className="text-[10px] text-slate-300 flex items-center gap-1">
                      <span className="text-emerald-400">•</span> {p}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
