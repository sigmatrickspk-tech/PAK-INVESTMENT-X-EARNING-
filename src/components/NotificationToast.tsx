import React, { useEffect, useState, useRef } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  X, 
  Bell, 
  Sparkles, 
  ArrowDownLeft, 
  ArrowUpRight 
} from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Transaction, NotificationToastItem } from '../types';

export const NotificationToast: React.FC = () => {
  const { firebaseUser, systemConfig } = useAuth();
  const [notifications, setNotifications] = useState<NotificationToastItem[]>([]);
  const seenTxIdsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!firebaseUser) return;

    // Listen to user's real-time transactions
    const q = query(
      collection(db, 'transactions'),
      where('userId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        const tx = { id: change.doc.id, ...change.doc.data() } as Transaction;

        // Skip non deposit/withdrawal
        if (tx.type !== 'deposit' && tx.type !== 'withdrawal') return;

        // Check if status changed or processed recently (within last 1 hour)
        if (tx.status === 'approved' || tx.status === 'rejected') {
          const isRecentlyProcessed = tx.processedAt && (Date.now() - tx.processedAt < 3600000);
          
          // Check if we already alerted on this status for this tx
          const prevStatus = seenTxIdsRef.current[tx.id];
          if (prevStatus !== tx.status && (isRecentlyProcessed || change.type === 'modified')) {
            const newItem: NotificationToastItem = {
              id: `${tx.id}-${Date.now()}`,
              txId: tx.id,
              type: tx.type,
              status: tx.status,
              amount: tx.amount,
              method: tx.method,
              rejectionReason: tx.rejectionReason,
              timestamp: Date.now()
            };

            setNotifications(prev => [newItem, ...prev.slice(0, 4)]);
            
            // Mark as seen
            seenTxIdsRef.current[tx.id] = tx.status;
          }
        } else if (tx.status === 'pending') {
          seenTxIdsRef.current[tx.id] = 'pending';
        }
      });
    }, (err) => {
      console.warn('Realtime toast listener warning:', err);
    });

    return () => unsubscribe();
  }, [firebaseUser]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {notifications.map((item) => {
        const isApproved = item.status === 'approved';
        const isDeposit = item.type === 'deposit';

        return (
          <div
            key={item.id}
            className={`pointer-events-auto p-4 rounded-2xl shadow-2xl border backdrop-blur-xl transform transition-all duration-300 animate-slide-in ${
              isApproved 
                ? 'bg-slate-900/95 border-emerald-500/50 text-white shadow-emerald-500/10' 
                : 'bg-slate-900/95 border-rose-500/50 text-white shadow-rose-500/10'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${
                  isApproved 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  {isApproved ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <XCircle className="w-5 h-5" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-black tracking-wide uppercase">
                      {isApproved ? '🎉 Transaction Approved!' : '⚠️ Request Rejected'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-1 font-medium leading-snug">
                    Your <span className="font-bold text-white">{item.method}</span> {isDeposit ? 'Deposit' : 'Withdrawal'} of{' '}
                    <span className="font-mono font-bold text-emerald-400">
                      {systemConfig.currencySymbol}{item.amount.toLocaleString()}
                    </span>{' '}
                    has been {isApproved ? 'approved and processed!' : 'rejected by admin.'}
                  </p>

                  {!isApproved && item.rejectionReason && (
                    <p className="text-[11px] text-rose-300 bg-rose-950/50 p-1.5 rounded-lg border border-rose-800/40 mt-1.5">
                      <span className="font-bold">Reason:</span> {item.rejectionReason}
                    </p>
                  )}

                  <span className="text-[10px] text-slate-500 block mt-1">
                    Just now • Live Firestore Update
                  </span>
                </div>
              </div>

              <button
                onClick={() => removeNotification(item.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
