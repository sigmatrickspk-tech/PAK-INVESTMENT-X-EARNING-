import React, { useState } from 'react';
import { 
  Users, 
  Share2, 
  Copy, 
  Check, 
  MessageCircle, 
  Award, 
  TrendingUp, 
  DollarSign, 
  Zap, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_TEAM_MEMBERS } from '../lib/defaultData';
import { TeamMember } from '../types';

export const TeamCenter: React.FC = () => {
  const { userProfile, systemConfig } = useAuth();
  const [team, setTeam] = useState<TeamMember[]>(DEFAULT_TEAM_MEMBERS);
  const [activeLevel, setActiveLevel] = useState<number>(1);
  const [copied, setCopied] = useState(false);

  const refUrl = `${window.location.origin}?ref=${userProfile?.referralCode || 'PAK100'}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(refUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredTeam = team.filter(m => m.level === activeLevel);
  const totalCommission = team.reduce((acc, curr) => acc + curr.commissionEarned, 0);
  const totalInvested = team.reduce((acc, curr) => acc + curr.investedAmount, 0);

  return (
    <div className="space-y-6 pb-20">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Multi-Tier Affiliate Commissions
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Team Network & Referral Earnings
          </h2>
          <p className="text-xs text-slate-300 max-w-xl">
            Invite friends to build a 5-tier earning network and automatically accumulate passive team commissions.
          </p>
        </div>
      </div>

      {/* Network Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 block mb-1">Total Team Members</span>
          <div className="text-xl font-black text-white font-mono">{team.length} Members</div>
        </div>
        <div className="bg-slate-900/90 border border-emerald-500/30 p-4 rounded-2xl">
          <span className="text-[10px] text-emerald-400 block mb-1">Total Network Volume</span>
          <div className="text-xl font-black text-emerald-300 font-mono">
            {systemConfig.currencySymbol}{totalInvested.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-2xl">
          <span className="text-[10px] text-amber-400 block mb-1">Commissions Earned</span>
          <div className="text-xl font-black text-amber-300 font-mono">
            {systemConfig.currencySymbol}{totalCommission.toFixed(2)}
          </div>
        </div>
        <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl">
          <span className="text-[10px] text-slate-400 block mb-1">Direct Commission Rate</span>
          <div className="text-xl font-black text-white font-mono">6.0% Level 1</div>
        </div>
      </div>

      {/* Referral Link Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl shrink-0">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">Your Unique Referral Invite Link</h4>
            <p className="text-[11px] text-slate-400">Share on WhatsApp or social media to claim instant signup rewards.</p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <input
            type="text"
            readOnly
            value={refUrl}
            className="bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-xs font-mono text-slate-300 w-full md:w-64 outline-none"
          />
          <button
            onClick={handleCopy}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shrink-0"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </div>

      {/* 5-Tier Level Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
          {[1, 2, 3, 4, 5].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setActiveLevel(lvl)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                activeLevel === lvl
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white bg-slate-900/60'
              }`}
            >
              Level {lvl} ({lvl === 1 ? '6%' : lvl === 2 ? '3%' : lvl === 3 ? '2%' : '1%'})
            </button>
          ))}
        </div>

        {/* Team Members Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Member Name</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Invested Amount</th>
                  <th className="py-3 px-4">Commission Earned</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredTeam.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-bold text-white">{m.name}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{m.phone}</td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                      {systemConfig.currencySymbol}{m.investedAmount.toLocaleString()}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">
                      +{systemConfig.currencySymbol}{m.commissionEarned.toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">{m.joinedDate}</td>
                    <td className="py-3 px-4 text-right">
                      {m.status === 'invested' ? (
                        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          Active Investor
                        </span>
                      ) : (
                        <span className="bg-slate-800 text-slate-500 text-[10px] font-medium px-2 py-0.5 rounded-full">
                          Not Invested
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
