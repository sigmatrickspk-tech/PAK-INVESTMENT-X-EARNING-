import React, { useState, useEffect } from 'react';
import { Trophy, Award, Crown, Flame, TrendingUp, Sparkles, ShieldCheck, RefreshCw } from 'lucide-react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

export const TopEarners: React.FC = () => {
  const { systemConfig } = useAuth();
  const [earners, setEarners] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'users'),
      orderBy('totalEarnings', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: UserProfile[] = snapshot.docs.map(docSnap => ({
        uid: docSnap.id,
        ...docSnap.data()
      } as UserProfile));
      setEarners(list);
      setLoading(false);
    }, (err) => {
      console.warn('Top earners query warning:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Helper to mask phone or name for privacy
  const formatName = (name: string, email: string) => {
    if (name && name.trim()) return name;
    if (email) {
      const parts = email.split('@');
      return `${parts[0].slice(0, 3)}***@${parts[1] || 'gmail.com'}`;
    }
    return 'Investor Member';
  };

  const getRankBadge = (index: number) => {
    switch (index) {
      case 0:
        return {
          icon: <Crown className="w-5 h-5 text-amber-300 animate-bounce" />,
          bg: 'bg-gradient-to-r from-amber-500/20 via-yellow-500/10 to-amber-500/20 border-amber-500/50',
          badge: '🥇 1st Place Champion',
          textCol: 'text-amber-300'
        };
      case 1:
        return {
          icon: <Trophy className="w-4 h-4 text-slate-300" />,
          bg: 'bg-gradient-to-r from-slate-400/20 via-slate-500/10 to-slate-400/20 border-slate-400/40',
          badge: '🥈 2nd Place Elite',
          textCol: 'text-slate-200'
        };
      case 2:
        return {
          icon: <Award className="w-4 h-4 text-amber-600" />,
          bg: 'bg-gradient-to-r from-amber-700/20 via-amber-800/10 to-amber-700/20 border-amber-700/40',
          badge: '🥉 3rd Place Master',
          textCol: 'text-amber-400'
        };
      default:
        return {
          icon: <span className="text-xs font-mono font-black text-slate-400">#{index + 1}</span>,
          bg: 'bg-slate-950/60 border-slate-800',
          badge: `Rank #${index + 1}`,
          textCol: 'text-slate-300'
        };
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-bold mb-2">
            <Flame className="w-3.5 h-3.5 text-amber-400" /> Platform Leaderboard
          </div>
          <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
            Top Platform Earners
          </h2>
          <p className="text-xs text-slate-400">
            Real-time rankings of top performing investors and daily profit earners.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 px-3.5 py-1.5 rounded-full text-xs font-mono text-emerald-400">
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Real-time Live Sync</span>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> Loading top earners leaderboard...
        </div>
      ) : earners.length === 0 ? (
        <div className="py-10 text-center border border-dashed border-slate-800 rounded-2xl p-6 text-slate-400 text-xs">
          <Trophy className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          No earner data available yet. Be the first to reach the leaderboard!
        </div>
      ) : (
        <div className="space-y-3">
          {earners.map((user, idx) => {
            const rankInfo = getRankBadge(idx);
            return (
              <div
                key={user.uid || idx}
                className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${rankInfo.bg} hover:border-amber-500/40`}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-700/80 flex items-center justify-center shrink-0 shadow-inner">
                    {rankInfo.icon}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-white truncate">
                        {formatName(user.fullName, user.email)}
                      </h4>
                      {idx === 0 && (
                        <span className="hidden sm:inline-block px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                          Top Investor
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="font-mono text-slate-400">
                        {user.phone ? `${user.phone.slice(0, 4)}****${user.phone.slice(-3)}` : 'Verified Member'}
                      </span>
                      <span>•</span>
                      <span className="text-emerald-400 font-medium">{rankInfo.badge}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className={`text-sm sm:text-base font-black font-mono ${rankInfo.textCol}`}>
                    {systemConfig.currencySymbol}{(user.totalEarnings || 0).toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Total Profits
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Banner */}
      <div className="pt-2 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2 border-t border-slate-800/80">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Earn daily returns from plans & pools to secure your spot on the top list!</span>
      </div>
    </div>
  );
};
