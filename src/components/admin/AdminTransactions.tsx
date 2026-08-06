import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Check, 
  X, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Search, 
  AlertCircle, 
  RefreshCw,
  Smartphone
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment, 
  query, 
  orderBy 
} from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminTransactions: React.FC = () => {
  const { systemConfig } = useAuth();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending_deposits' | 'pending_withdrawals' | 'processed'>('pending_deposits');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection Modal
  const [selectedTxForReject, setSelectedTxForReject] = useState<Transaction | null>(null);
  const [rejectReason, setRejectReason] = useState('Invalid Transaction ID or Sender details mismatch');
  const [processing, setProcessing] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Transaction[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as Transaction));
      setTransactions(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching admin transactions:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleAccept = async (tx: Transaction) => {
    setProcessing(true);
    try {
      if (tx.type === 'deposit') {
        // Credit user balance
        const userRef = doc(db, 'users', tx.userId);
        await updateDoc(userRef, {
          balance: increment(tx.amount),
          totalEarnings: increment(tx.amount),
          totalDeposited: increment(tx.amount)
        });
      } else if (tx.type === 'withdrawal') {
        // Track total withdrawn
        const userRef = doc(db, 'users', tx.userId);
        await updateDoc(userRef, {
          totalWithdrawn: increment(tx.amount)
        });
      }

      // Mark transaction as approved
      const txRef = doc(db, 'transactions', tx.id);
      await updateDoc(txRef, {
        status: 'approved',
        processedAt: Date.now()
      });

      setMsg({
        type: 'success',
        text: `Transaction #${tx.id.substring(0, 6)} (${tx.type.toUpperCase()} ${systemConfig.currencySymbol}${tx.amount}) approved successfully!`
      });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      console.error('Accept error:', err);
      setMsg({ type: 'error', text: err.message || 'Failed to approve transaction.' });
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTxForReject) return;

    setProcessing(true);
    try {
      const tx = selectedTxForReject;

      if (tx.type === 'withdrawal') {
        // Refund user balance on rejected withdrawal
        const userRef = doc(db, 'users', tx.userId);
        await updateDoc(userRef, {
          balance: increment(tx.amount)
        });
      }

      // Mark transaction as rejected
      const txRef = doc(db, 'transactions', tx.id);
      await updateDoc(txRef, {
        status: 'rejected',
        rejectionReason: rejectReason,
        processedAt: Date.now()
      });

      setMsg({
        type: 'success',
        text: `Transaction #${tx.id.substring(0, 6)} rejected. ${tx.type === 'withdrawal' ? 'Refunded PKR ' + tx.amount + ' back to user.' : ''}`
      });
      setSelectedTxForReject(null);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      console.error('Reject error:', err);
      setMsg({ type: 'error', text: err.message || 'Failed to reject transaction.' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredTransactions = transactions.filter(tx => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = 
      (tx.userName || '').toLowerCase().includes(q) ||
      (tx.userEmail || '').toLowerCase().includes(q) ||
      (tx.transactionId || '').toLowerCase().includes(q) ||
      (tx.accountNumber || '').toLowerCase().includes(q) ||
      (tx.userPhone || '').toLowerCase().includes(q);

    if (!matchesSearch) return false;

    if (activeFilter === 'pending_deposits') return tx.status === 'pending' && tx.type === 'deposit';
    if (activeFilter === 'pending_withdrawals') return tx.status === 'pending' && tx.type === 'withdrawal';
    if (activeFilter === 'processed') return tx.status !== 'pending';
    return true; // 'all'
  });

  const pendingDepCount = transactions.filter(t => t.status === 'pending' && t.type === 'deposit').length;
  const pendingWithCount = transactions.filter(t => t.status === 'pending' && t.type === 'withdrawal').length;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-emerald-400" /> JazzCash & EasyPaisa Payment Approvals
          </h2>
          <p className="text-xs text-slate-400">
            Manual Accept / Reject Pipeline for automated financial security.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search TID, Phone, Email, Name..."
            className="w-full bg-slate-900 border border-slate-700 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
          msg.type === 'success' 
            ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' 
            : 'bg-rose-500/20 border-rose-500/40 text-rose-300'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        
        <button
          onClick={() => setActiveFilter('pending_deposits')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeFilter === 'pending_deposits'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4" />
          Pending Deposits ({pendingDepCount})
        </button>

        <button
          onClick={() => setActiveFilter('pending_withdrawals')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeFilter === 'pending_withdrawals'
              ? 'bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
          Pending Withdrawals ({pendingWithCount})
        </button>

        <button
          onClick={() => setActiveFilter('processed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeFilter === 'processed'
              ? 'bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Processed History
        </button>

        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          All Requests ({transactions.length})
        </button>

      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Loading payment requests...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No payment requests found for selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User Details</th>
                  <th className="py-3 px-4">Type & Method</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Sender / Account Phone</th>
                  <th className="py-3 px-4">TID / Ref #</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Approve / Reject</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredTransactions.map((tx) => {
                  const isPending = tx.status === 'pending';

                  return (
                    <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                      
                      {/* User */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{tx.userName || 'User'}</span>
                        <span className="text-[10px] text-slate-400 font-mono block">{tx.userEmail}</span>
                      </td>

                      {/* Type & Method */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 font-bold">
                          {tx.type === 'deposit' ? (
                            <span className="text-emerald-400 flex items-center gap-1">
                              <ArrowDownLeft className="w-3.5 h-3.5" /> Deposit
                            </span>
                          ) : (
                            <span className="text-amber-400 flex items-center gap-1">
                              <ArrowUpRight className="w-3.5 h-3.5" /> Withdrawal
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{tx.method}</span>
                      </td>

                      {/* Amount */}
                      <td className="py-3.5 px-4 font-black font-mono text-sm text-white">
                        {systemConfig.currencySymbol}{tx.amount?.toLocaleString()}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-emerald-300 font-bold">
                        {tx.accountNumber || tx.userPhone}
                        {tx.accountTitle && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            Title: {tx.accountTitle}
                          </span>
                        )}
                      </td>

                      {/* TID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300 tracking-wider">
                        {tx.transactionId || 'N/A'}
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
                            <Clock className="w-3 h-3 text-amber-400" /> Pending
                          </span>
                        )}
                        {tx.status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 text-[10px] font-bold">
                            <XCircle className="w-3 h-3 text-rose-400" /> Rejected
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-2 shrink-0">
                        {isPending ? (
                          <>
                            <button
                              disabled={processing}
                              onClick={() => handleAccept(tx)}
                              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-3 py-1.5 rounded-lg text-xs transition-all shadow-md active:scale-95"
                            >
                              <Check className="w-3.5 h-3.5 inline mr-1" />
                              Accept
                            </button>

                            <button
                              disabled={processing}
                              onClick={() => setSelectedTxForReject(tx)}
                              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold px-3 py-1.5 rounded-lg text-xs transition-all active:scale-95"
                            >
                              <X className="w-3.5 h-3.5 inline mr-1" />
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {tx.processedAt ? new Date(tx.processedAt).toLocaleString() : 'Completed'}
                          </span>
                        )}
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REJECTION REASON MODAL */}
      {selectedTxForReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-6 text-slate-100">
            <button
              onClick={() => setSelectedTxForReject(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-1">Reject Payment Request</h3>
            <p className="text-xs text-slate-400 mb-4">
              Rejecting {selectedTxForReject.type.toUpperCase()} of {systemConfig.currencySymbol}{selectedTxForReject.amount} for {selectedTxForReject.userEmail}
            </p>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason for Rejection</label>
                <textarea
                  required
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="State reason (e.g. Invalid TID, Amount mismatch)..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white outline-none"
                />
              </div>

              {selectedTxForReject.type === 'withdrawal' && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs">
                  ℹ️ Rejecting this withdrawal will automatically refund {systemConfig.currencySymbol}{selectedTxForReject.amount} back to the user's balance.
                </div>
              )}

              <button
                type="submit"
                disabled={processing}
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-black py-3 rounded-xl text-xs"
              >
                {processing ? 'Processing Rejection...' : 'Confirm Rejection & Notify User'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
