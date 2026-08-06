import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, Key, Gift, ArrowDownLeft, ArrowUpRight, CheckCircle2, Zap, RefreshCw, Activity, Layers } from 'lucide-react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { UserActivityLog } from '../types';

export const UserActivityLogComponent: React.FC = () => {
  const { firebaseUser } = useAuth();
  const [activities, setActivities] = useState<UserActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firebaseUser) return;

    const q = query(
      collection(db, 'activityLogs'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logs: UserActivityLog[] = snapshot.docs
        .map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as UserActivityLog))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setActivities(logs);
      setLoading(false);
    }, (err) => {
      console.warn('Activity log listener warning:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'login': return <Key className="w-4 h-4 text-sky-400" />;
      case 'promo_claim': return <Gift className="w-4 h-4 text-purple-400" />;
      case 'deposit_request': return <ArrowDownLeft className="w-4 h-4 text-emerald-400" />;
      case 'withdrawal_request': return <ArrowUpRight className="w-4 h-4 text-amber-400" />;
      case 'plan_purchase': return <Layers className="w-4 h-4 text-indigo-400" />;
      case 'pool_investment': return <Zap className="w-4 h-4 text-amber-300" />;
      default: return <Activity className="w-4 h-4 text-emerald-400" />;
    }
  };

  const getActivityBadge = (type: string) => {
    switch (type) {
      case 'login': return 'bg-sky-500/20 text-sky-300 border-sky-500/40';
      case 'promo_claim': return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'deposit_request': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'withdrawal_request': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'plan_purchase': return 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40';
      case 'pool_investment': return 'bg-amber-400/20 text-amber-200 border-amber-400/40';
      default: return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> Security Audit Log & Activity Trail
          </h2>
          <p className="text-xs text-slate-400">
            Transparent immutable timestamps of account logins, deposit requests, cashout submissions, and promo redemptions.
          </p>
        </div>
        <span className="text-xs font-mono font-bold bg-slate-950 text-slate-300 border border-slate-800 px-3 py-1 rounded-full">
          {activities.length} Events
        </span>
      </div>

      {loading ? (
        <div className="py-8 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading activity logs...
        </div>
      ) : activities.length === 0 ? (
        <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl p-6">
          <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">No recent activity logged yet.</p>
          <p className="text-[11px] text-slate-500 mt-1">
            Logins, promo claims, and transactions will appear here automatically.
          </p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {activities.map((act) => (
            <div
              key={act.id || act.timestamp}
              className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg border ${getActivityBadge(act.actionType)}`}>
                  {getActivityIcon(act.actionType)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{act.description}</h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Type: <span className="uppercase text-slate-300">{act.actionType}</span>
                  </span>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 font-mono block">
                  {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
                <span className="text-[10px] text-slate-500 font-mono block">
                  {new Date(act.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
