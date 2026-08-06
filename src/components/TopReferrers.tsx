import React from 'react';
import { Users, Award, Trophy, Sparkles, ArrowRight, Gift, ShieldCheck, Share2 } from 'lucide-react';
import { SystemConfig, UserProfile } from '../types';

interface TopReferrersProps {
  systemConfig: SystemConfig;
  userProfile: UserProfile | null;
  onOpenShareModal?: () => void;
}

export const TopReferrers: React.FC<TopReferrersProps> = ({
  systemConfig,
  userProfile,
  onOpenShareModal
}) => {
  // Sample Leaderboard of Top Referrers (In production, fetched live from Firestore)
  const topLeaderboard = [
    { rank: 1, name: 'Malik Zeeshan', count: 84, earnings: 16800, badge: '🥇 Gold Elite' },
    { rank: 2, name: 'Hamza Khan', count: 62, earnings: 12400, badge: '🥈 Silver Master' },
    { rank: 3, name: 'Usman Ali', count: 47, earnings: 9400, badge: '🥉 Bronze Champ' },
    { rank: 4, name: 'Ayesha Bibi', count: 35, earnings: 7000, badge: '⭐ Pro Affiliate' },
    { rank: 5, name: 'Bilal Ahmed', count: 28, earnings: 5600, badge: '⭐ Pro Affiliate' },
  ];

  // Bonus Brackets
  const bonusBrackets = [
    {
      tier: '🥉 Bronze Leader',
      invitesReq: '1 - 5 Invites',
      reward: `${systemConfig.currencySymbol}100 per invite`,
      perk: '5% Team Commission',
      bgColor: 'bg-amber-950/40 border-amber-800/40 text-amber-300'
    },
    {
      tier: '🥈 Silver Master',
      invitesReq: '6 - 15 Invites',
      reward: `${systemConfig.currencySymbol}150 per invite`,
      perk: '8% Team Commission + PKR 500 Special Bonus',
      bgColor: 'bg-slate-800/60 border-slate-700 text-slate-200'
    },
    {
      tier: '🥇 Gold Elite',
      invitesReq: '16 - 30 Invites',
      reward: `${systemConfig.currencySymbol}200 per invite`,
      perk: '12% Team Commission + PKR 2,000 Special Bonus',
      bgColor: 'bg-amber-500/10 border-amber-500/30 text-amber-300'
    },
    {
      tier: '💎 Diamond Director',
      invitesReq: '31+ Invites',
      reward: `${systemConfig.currencySymbol}300 per invite`,
      perk: '15% Team Commission + PKR 5,000 VIP Cash Reward',
      bgColor: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
    }
  ];

  const userInviteCount = userProfile?.referralCount || 0;

  // Determine user bracket
  let currentBracketIndex = 0;
  if (userInviteCount >= 31) currentBracketIndex = 3;
  else if (userInviteCount >= 16) currentBracketIndex = 2;
  else if (userInviteCount >= 6) currentBracketIndex = 1;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold mb-2">
            <Trophy className="w-3.5 h-3.5 text-amber-400" /> Affiliate Commission Brackets
          </div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            Top Referrers & Referral Bonus Tiers
          </h2>
          <p className="text-xs text-slate-400">
            Invite friends to {systemConfig.siteName} and unlock higher reward brackets + direct commission payouts!
          </p>
        </div>

        {onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 active:scale-95 transition-all shrink-0"
          >
            <Share2 className="w-4 h-4" /> Share My Referral Link
          </button>
        )}
      </div>

      {/* User Current Progression */}
      <div className="bg-slate-950/80 border border-emerald-500/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-medium">Your Active Referrals</div>
            <div className="text-xl font-black text-white font-mono flex items-center gap-2">
              {userInviteCount} Friends Invited
              <span className="text-xs font-sans font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                {bonusBrackets[currentBracketIndex].tier}
              </span>
            </div>
          </div>
        </div>

        <div className="text-right w-full md:w-auto">
          <div className="text-xs text-slate-400">Next Bracket Bonus</div>
          <div className="text-xs font-bold text-emerald-400 font-mono">
            {userInviteCount < 6 ? 'Reach 6 invites for +PKR 500 Bonus!' : userInviteCount < 16 ? 'Reach 16 invites for +PKR 2,000 Bonus!' : userInviteCount < 31 ? 'Reach 31 invites for +PKR 5,000 VIP Bonus!' : '🔥 Maximum Tier Unlocked!'}
          </div>
        </div>
      </div>

      {/* Bonus Brackets Grid */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Gift className="w-4 h-4 text-amber-400" /> Reward Tier Brackets
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {bonusBrackets.map((bracket, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border transition-all ${bracket.bgColor} ${
                currentBracketIndex === idx ? 'ring-2 ring-emerald-500 shadow-xl' : ''
              }`}
            >
              <div className="text-xs font-black mb-1">{bracket.tier}</div>
              <div className="text-[11px] font-mono font-bold text-slate-400 mb-2">{bracket.invitesReq}</div>
              
              <div className="text-sm font-black font-mono text-emerald-400 mb-1">{bracket.reward}</div>
              <div className="text-[10px] text-slate-300 leading-snug">{bracket.perk}</div>

              {currentBracketIndex === idx && (
                <span className="mt-3 inline-block text-[9px] font-black uppercase text-emerald-950 bg-emerald-400 px-2 py-0.5 rounded-md">
                  Current Tier
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Top Referrers Leaderboard */}
      <div>
        <h3 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" /> All-Time Top Referrers Leaderboard
        </h3>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-800/80">
            {topLeaderboard.map((item) => (
              <div key={item.rank} className="p-3.5 px-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-lg font-black text-xs flex items-center justify-center font-mono ${
                    item.rank === 1 ? 'bg-amber-500 text-slate-950' :
                    item.rank === 2 ? 'bg-slate-300 text-slate-950' :
                    item.rank === 3 ? 'bg-amber-700 text-white' :
                    'bg-slate-800 text-slate-400'
                  }`}>
                    {item.rank}
                  </span>

                  <div>
                    <span className="text-xs font-bold text-white block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{item.badge}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black text-emerald-400 font-mono block">
                    {systemConfig.currencySymbol}{item.earnings.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {item.count} Referrals
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
};
