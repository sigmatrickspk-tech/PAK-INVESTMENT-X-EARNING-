import React, { useState, useEffect } from 'react';
import { Gift, Plus, Trash2, CheckCircle2, AlertCircle, Copy, Check, Sparkles } from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { PromoCode } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminPromoCodes: React.FC = () => {
  const { systemConfig } = useAuth();

  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Code Form
  const [code, setCode] = useState('');
  const [rewardAmount, setRewardAmount] = useState<number>(100);
  const [maxUses, setMaxUses] = useState<number>(100);
  const [creating, setCreating] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'promocodes'), (snapshot) => {
      const list: PromoCode[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as PromoCode));
      setPromoCodes(list);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching promo codes:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePromoCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = code.trim().toUpperCase();

    if (!cleanCode) {
      setMsg({ type: 'error', text: 'Please enter a valid code string.' });
      return;
    }

    setCreating(true);

    try {
      await addDoc(collection(db, 'promocodes'), {
        code: cleanCode,
        rewardAmount: Number(rewardAmount),
        maxUses: Number(maxUses),
        usedCount: 0,
        usedByUsers: [],
        isActive: true,
        createdAt: Date.now()
      });

      setMsg({ type: 'success', text: `Promo code ${cleanCode} created successfully!` });
      setCode('');
      setRewardAmount(100);
      setMaxUses(100);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      console.error('Error creating promo code:', err);
      setMsg({ type: 'error', text: err.message || 'Failed to create promo code.' });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (p: PromoCode) => {
    try {
      await updateDoc(doc(db, 'promocodes', p.id), {
        isActive: !p.isActive
      });
    } catch (err) {
      console.error('Error toggling active state:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this promo code?')) return;
    try {
      await deleteDoc(doc(db, 'promocodes', id));
      setMsg({ type: 'success', text: 'Promo code deleted.' });
      setTimeout(() => setMsg(null), 3000);
    } catch (err) {
      console.error('Error deleting promo code:', err);
    }
  };

  const handleCopy = (c: string) => {
    navigator.clipboard.writeText(c);
    setCopiedCode(c);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-black text-white flex items-center gap-2">
          <Gift className="w-5 h-5 text-amber-400" /> Promo Code Generator & Manager
        </h2>
        <p className="text-xs text-slate-400">
          Create voucher codes for promotional events, Telegram giveaways, and cash rewards.
        </p>
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

      {/* Creation Box */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4 text-emerald-400" /> Generate New Promo Code
        </h3>

        <form onSubmit={handleCreatePromoCode} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Code Text</label>
            <input
              type="text"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. MEGA2026"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-amber-300 font-mono tracking-wider outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Reward ({systemConfig.currencySymbol})</label>
            <input
              type="number"
              required
              min={1}
              value={rewardAmount}
              onChange={(e) => setRewardAmount(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">Max Uses Limit</label>
            <input
              type="number"
              required
              min={1}
              value={maxUses}
              onChange={(e) => setMaxUses(Number(e.target.value))}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white font-mono outline-none"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={creating}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/10"
            >
              <Sparkles className="w-4 h-4" />
              {creating ? 'Creating...' : 'Create Code'}
            </button>
          </div>
        </form>
      </div>

      {/* Codes List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4">Active System Promo Codes ({promoCodes.length})</h3>

        {loading ? (
          <div className="py-8 text-center text-slate-500 text-xs">Loading promo codes...</div>
        ) : promoCodes.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-xs border border-dashed border-slate-800 rounded-xl p-4">
            No active custom promo codes created yet. Users can still redeem default codes like SIGMA2026.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Reward</th>
                  <th className="py-3 px-4">Redemptions</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {promoCodes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-300 tracking-wider">
                      {p.code}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-extrabold text-white">
                      {systemConfig.currencySymbol}{p.rewardAmount}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-300">
                      {p.usedCount || 0} / {p.maxUses}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleActive(p)}
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          p.isActive
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {p.isActive ? 'Active' : 'Disabled'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleCopy(p.code)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                        title="Copy code"
                      >
                        {copiedCode === p.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs"
                        title="Delete code"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
