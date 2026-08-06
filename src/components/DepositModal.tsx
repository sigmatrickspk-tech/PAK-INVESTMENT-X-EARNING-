import React, { useState } from 'react';
import { Smartphone, Copy, Check, ArrowDownLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import { collection, addDoc } from 'firebase/firestore';

import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { PaymentMethod } from '../types';
import { logUserActivity } from '../lib/activityLogger';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DepositModal: React.FC<DepositModalProps> = ({ isOpen, onClose }) => {
  const { userProfile, systemConfig, firebaseUser } = useAuth();

  const [method, setMethod] = useState<PaymentMethod>('JazzCash');
  const [amount, setAmount] = useState<number>(systemConfig.minDeposit || 500);
  const [senderPhone, setSenderPhone] = useState(userProfile?.phone || '');
  const [transactionId, setTransactionId] = useState('');
  
  const [copiedAcc, setCopiedAcc] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const activeNumber = method === 'JazzCash' ? systemConfig.jazzcashNumber : systemConfig.easypaisaNumber;
  const activeTitle = method === 'JazzCash' ? systemConfig.jazzcashTitle : systemConfig.easypaisaTitle;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(activeNumber);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (systemConfig.maintenanceMode) {
      setError('🚧 System Maintenance Active: Deposit activities are temporarily paused.');
      return;
    }

    if (!firebaseUser || !userProfile) {
      setError('Please sign in to submit a deposit.');
      return;
    }

    if (amount < (systemConfig.minDeposit || 500)) {
      setError(`Minimum deposit amount is ${systemConfig.currencySymbol}${systemConfig.minDeposit}.`);
      return;
    }

    if (!senderPhone || senderPhone.length < 10) {
      setError('Please enter a valid sender phone number.');
      return;
    }

    if (!transactionId || transactionId.trim().length < 6) {
      setError('Please enter a valid Transaction ID (TID / Reference number).');
      return;
    }

    setSubmitting(true);

    try {
      await addDoc(collection(db, 'transactions'), {
        userId: firebaseUser.uid,
        userEmail: userProfile.email,
        userPhone: userProfile.phone || senderPhone,
        userName: userProfile.fullName,
        type: 'deposit',
        method,
        amount: Number(amount),
        accountNumber: activeNumber,
        accountTitle: activeTitle,
        transactionId: transactionId.trim().toUpperCase(),
        status: 'pending',
        createdAt: Date.now()
      });

      logUserActivity(
        firebaseUser.uid,
        userProfile.email,
        'deposit_request',
        `Requested ${method} deposit of ${systemConfig.currencySymbol}${amount} (TID: ${transactionId.trim()})`,
        { amount, method, transactionId: transactionId.trim() }
      );

      setSuccess(true);
    } catch (err: any) {
      console.error('Deposit submit error:', err);
      setError('Failed to submit deposit request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSuccess(false);
    setTransactionId('');
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
            <h3 className="text-xl font-black text-white">Deposit Submitted Successfully!</h3>
            <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
              Your deposit request of <span className="font-extrabold text-emerald-300">{systemConfig.currencySymbol}{amount}</span> via {method} (TID: <span className="font-mono text-amber-300">{transactionId}</span>) has been received.
            </p>
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-300 text-xs">
              ⚡ Admin will verify your Transaction ID and approve balance within 5-15 minutes.
            </div>
            <button
              onClick={handleReset}
              className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl shadow-lg shadow-emerald-500/20"
            >
              Done & Return to Dashboard
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                <ArrowDownLeft className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">Deposit Funds</h2>
                <p className="text-xs text-slate-400">Manual JazzCash & EasyPaisa Deposit System</p>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-4">
              <label className="block text-xs font-bold text-slate-300">Select Payment Method</label>
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

              {/* Account details box */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Official {method} Account Title</span>
                  <span className="font-extrabold text-white">{activeTitle}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="font-mono font-black text-lg text-amber-300 tracking-wider">
                    {activeNumber}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAccount}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    {copiedAcc ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedAcc ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                  ⚠️ Send the requested amount to this account in your {method} mobile app.
                </p>
              </div>

              {/* Submission Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Deposit Amount ({systemConfig.currencySymbol})
                  </label>
                  <input
                    type="number"
                    required
                    min={systemConfig.minDeposit || 500}
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white font-mono outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Minimum deposit limit: {systemConfig.currencySymbol}{systemConfig.minDeposit || 500}
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Your Sender Phone Number
                  </label>
                  <input
                    type="tel"
                    required
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Transaction ID (TID / Reference Number)
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. 029384910283"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 px-4 text-sm text-amber-300 font-mono tracking-wider outline-none"
                  />
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Check the confirmation SMS sent by {method} for your TID.
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
                      Submit Deposit for Verification
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
