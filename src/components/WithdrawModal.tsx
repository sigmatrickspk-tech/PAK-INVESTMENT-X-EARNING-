import React, { useState } from 'react';
import { Smartphone, ArrowUpRight, AlertCircle, ShieldCheck, Check } from 'lucide-react';
import { collection, addDoc, doc, updateDoc, increment } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { PaymentMethod } from '../types';
import { logUserActivity } from '../lib/activityLogger';

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WithdrawModal: React.FC<WithdrawModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, systemConfig, firebaseUser } = useAuth();

  const [method, setMethod] = useState<PaymentMethod>('JazzCash');
  const [accountTitle, setAccountTitle] = useState(userProfile?.fullName || '');
  const [accountNumber, setAccountNumber] = useState(userProfile?.phone || '');
  const [amount, setAmount] = useState<number>(systemConfig.minWithdrawal || 300);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (systemConfig.maintenanceMode) {
      setError('🚧 System Maintenance Active: Cashouts are temporarily paused for maintenance.');
      return;
    }

    if (!firebaseUser || !userProfile) {
      setError('Please sign in to process withdrawal.');
      return;
    }

    if (amount < (systemConfig.minWithdrawal || 300)) {
      setError(`Minimum withdrawal limit is ${systemConfig.currencySymbol}${systemConfig.minWithdrawal}.`);
      return;
    }

    if (userProfile.balance < amount) {
      setError(`Insufficient balance. Available: ${systemConfig.currencySymbol}${userProfile.balance}`);
      return;
    }

    if (!accountTitle.trim()) {
      setError('Please provide your exact Account Title.');
      return;
    }

    if (!accountNumber || accountNumber.length < 10) {
      setError('Please provide a valid Account Number.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Hold/Deduct user balance immediately
      const userRef = doc(db, 'users', firebaseUser.uid);
      await updateDoc(userRef, {
        balance: increment(-amount)
      });

      // 2. Add withdrawal transaction record with 'pending' status
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone || accountNumber,
        userName: userProfile.fullName,
        type: 'withdrawal',
        method,
        accountTitle,
        accountNumber,
        amount: Number(amount),
        status: 'pending',
        createdAt: Date.now()
      });

      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'withdrawal_request',
        `Requested ${method} cashout of ${systemConfig.currencySymbol}${amount} to ${accountTitle} (${accountNumber})`,
        { amount, method, accountTitle, accountNumber }
      );

      setSuccess(true);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError('Failed to process withdrawal request. Please check your connection.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-lg bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl p-6 md:p-8 text-slate-100 max-h-[90vh] overflow-y-auto">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-full transition-colors"
        >
          ✕
        </button>

        {success ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto border border-emerald-500/40 animate-bounce">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-white">Withdrawal Request Received!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your request for <span className="font-extrabold text-emerald-300">{systemConfig.currencySymbol}{amount}</span> to {method} ({accountTitle} - {accountNumber}) is pending admin approval.
            </p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
              ⏱ Payouts are manually processed and transferred within 1 to 2 hours.
            </div>
            <button
              onClick={handleReset}
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Back to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl">
                <ArrowUpRight className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Withdraw Cash</h2>
                <p className="text-xs text-slate-400">Transfer earnings to JazzCash or EasyPaisa</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Current Balance Notice */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex items-center justify-between mb-4">
              <span className="text-xs text-slate-400">Your Current Balance:</span>
              <span className="font-mono font-black text-emerald-400 text-lg">
                {systemConfig.currencySymbol}{userProfile?.balance?.toLocaleString() || 0}
              </span>
            </div>

            {/* Method selection */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">Select Payout Method</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setMethod('JazzCash')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'JazzCash'
                      ? 'bg-rose-950/30 border-rose-500 text-rose-300 shadow-md shadow-rose-950/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-rose-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">JazzCash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMethod('EasyPaisa')}
                  className={`p-4 rounded-xl border flex flex-col items-center gap-1.5 transition-all ${
                    method === 'EasyPaisa'
                      ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-950/50'
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-extrabold uppercase tracking-wider">EasyPaisa</span>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Account Title (Exact Name in App)
                  </label>
                  <input
                    type="text"
                    required
                    value={accountTitle}
                    onChange={(e) => setAccountTitle(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    {method} Mobile Account Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Withdrawal Amount ({systemConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min={systemConfig.minWithdrawal || 300}
                    max={userProfile?.balance || 0}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white font-mono outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Min withdrawal: {systemConfig.currencySymbol}{systemConfig.minWithdrawal || 300}
                  </span>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      Request Withdrawal
                    </>
                  )}
                </button>
              </form>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
