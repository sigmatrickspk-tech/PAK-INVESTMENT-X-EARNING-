import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Edit2, 
  CheckCircle2, 
  XCircle, 
  TrendingUp, 
  DollarSign, 
  Sparkles, 
  RefreshCw, 
  Save, 
  X,
  Layers
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  doc, 
  updateDoc, 
  deleteDoc, 
  setDoc 
} from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { InvestmentPlan, InvestmentPool, SystemConfig } from '../../types';
import { DEFAULT_PLANS, DEFAULT_POOLS } from '../../lib/defaultData';

interface AdminPlansProps {
  systemConfig: SystemConfig;
}

export const AdminPlans: React.FC<AdminPlansProps> = ({ systemConfig }) => {
  const [activeSubTab, setActiveSubTab] = useState<'plans' | 'pools'>('plans');
  
  // Plans state
  const [plans, setPlans] = useState<InvestmentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPlan, setEditingPlan] = useState<Partial<InvestmentPlan> | null>(null);
  const [isNewPlan, setIsNewPlan] = useState(false);

  // Pools state
  const [pools, setPools] = useState<InvestmentPool[]>([]);
  const [editingPool, setEditingPool] = useState<Partial<InvestmentPool> | null>(null);
  const [isNewPool, setIsNewPool] = useState(false);

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Real-time Plans Sync
  useEffect(() => {
    const plansRef = collection(db, 'plans');
    const unsubscribe = onSnapshot(plansRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const p of DEFAULT_PLANS) {
          await setDoc(doc(db, 'plans', p.id), p);
        }
        setPlans(DEFAULT_PLANS);
      } else {
        const fetched: InvestmentPlan[] = snapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        } as InvestmentPlan));
        setPlans(fetched);
      }
      setLoading(false);
    }, (err) => {
      console.error('Error fetching plans:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Real-time Pools Sync
  useEffect(() => {
    const poolsRef = collection(db, 'pools');
    const unsubscribe = onSnapshot(poolsRef, async (snapshot) => {
      if (snapshot.empty) {
        for (const pool of DEFAULT_POOLS) {
          await setDoc(doc(db, 'pools', pool.id), pool);
        }
        setPools(DEFAULT_POOLS);
      } else {
        const fetchedPools = snapshot.docs.map(d => ({
          id: d.id,
          ...d.data()
        } as InvestmentPool));
        setPools(fetchedPools);
      }
    }, (err) => {
      console.error('Error fetching pools:', err);
    });

    return () => unsubscribe();
  }, []);

  // Handlers for Pools
  const handleOpenCreatePool = () => {
    setIsNewPool(true);
    setEditingPool({
      name: '',
      dailyReturnPercent: 5.0,
      durationDays: 50,
      totalReturnPercent: 250,
      fundedPercent: 0,
      bannerImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      minInvestment: 500,
      maxInvestment: 50000,
      status: 'open',
      totalRaised: 0,
      targetAmount: 500000,
      category: 'High Growth'
    });
  };

  const handleOpenEditPool = (pool: InvestmentPool) => {
    setIsNewPool(false);
    setEditingPool({ ...pool });
  };

  const handleSavePool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPool?.name) return;

    try {
      const dailyReturnPercent = Number(editingPool.dailyReturnPercent || 5);
      const durationDays = Number(editingPool.durationDays || 50);
      const totalReturnPercent = Math.round(dailyReturnPercent * durationDays);

      const poolData = {
        name: editingPool.name,
        dailyReturnPercent,
        durationDays,
        totalReturnPercent,
        fundedPercent: Number(editingPool.fundedPercent || 0),
        bannerImage: editingPool.bannerImage || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        isFeatured: editingPool.isFeatured ?? true,
        minInvestment: Number(editingPool.minInvestment || 500),
        maxInvestment: Number(editingPool.maxInvestment || 50000),
        status: editingPool.status || 'open',
        totalRaised: Number(editingPool.totalRaised || 0),
        targetAmount: Number(editingPool.targetAmount || 500000),
        category: editingPool.category || 'High Growth'
      };

      if (isNewPool) {
        await addDoc(collection(db, 'pools'), poolData);
        setMessage({ type: 'success', text: 'New Investment Pool created!' });
      } else if (editingPool.id) {
        await updateDoc(doc(db, 'pools', editingPool.id), poolData);
        setMessage({ type: 'success', text: 'Investment Pool updated!' });
      }

      setEditingPool(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving pool:', err);
      setMessage({ type: 'error', text: 'Failed to save pool.' });
    }
  };

  const handleDeletePool = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this pool?')) return;
    try {
      await deleteDoc(doc(db, 'pools', id));
      setMessage({ type: 'success', text: 'Pool deleted.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting pool:', err);
    }
  };

  const handleOpenCreate = () => {
    setIsNewPlan(true);
    setEditingPlan({
      name: '',
      price: 1000,
      dailyProfitPercent: 6,
      dailyProfitAmount: 60,
      durationDays: 30,
      totalReturnAmount: 1800,
      totalReturnPercent: 180,
      description: '',
      badgeText: 'New Package',
      isActive: true
    });
  };

  const handleOpenEdit = (plan: InvestmentPlan) => {
    setIsNewPlan(false);
    setEditingPlan({ ...plan });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan?.name || !editingPlan.price) return;

    try {
      const price = Number(editingPlan.price);
      const dailyPercent = Number(editingPlan.dailyProfitPercent || 6);
      const durationDays = Number(editingPlan.durationDays || 30);
      const dailyAmount = Math.round((price * dailyPercent) / 100);
      const totalAmount = dailyAmount * durationDays;
      const totalPercent = Math.round((totalAmount / price) * 100);

      const planData = {
        name: editingPlan.name,
        price,
        dailyProfitPercent: dailyPercent,
        dailyProfitAmount: dailyAmount,
        durationDays,
        totalReturnAmount: totalAmount,
        totalReturnPercent: totalPercent,
        description: editingPlan.description || '',
        badgeText: editingPlan.badgeText || '',
        isActive: editingPlan.isActive ?? true,
        createdAt: editingPlan.createdAt || Date.now()
      };

      if (isNewPlan) {
        await addDoc(collection(db, 'plans'), planData);
        setMessage({ type: 'success', text: 'New Investment Package created successfully!' });
      } else if (editingPlan.id) {
        await updateDoc(doc(db, 'plans', editingPlan.id), planData);
        setMessage({ type: 'success', text: 'Investment Package updated successfully!' });
      }

      setEditingPlan(null);
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error saving plan:', err);
      setMessage({ type: 'error', text: 'Failed to save plan.' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this investment package?')) return;
    try {
      await deleteDoc(doc(db, 'plans', id));
      setMessage({ type: 'success', text: 'Package deleted.' });
      setTimeout(() => setMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting plan:', err);
    }
  };

  const handleToggleActive = async (plan: InvestmentPlan) => {
    try {
      await updateDoc(doc(db, 'plans', plan.id), {
        isActive: !plan.isActive
      });
    } catch (err) {
      console.error('Error toggling plan status:', err);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Sub-Tab Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            Investment Plans & Dynamic Pools
          </h2>
          <p className="text-xs text-slate-400">
            Configure daily yield packages and crowdsourced investment pools (banners, min/max limits, status).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1">
            <button
              onClick={() => setActiveSubTab('plans')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'plans'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              VIP Packages
            </button>
            <button
              onClick={() => setActiveSubTab('pools')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeSubTab === 'pools'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Investment Pools
            </button>
          </div>

          {activeSubTab === 'plans' ? (
            <button
              onClick={handleOpenCreate}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Package
            </button>
          ) : (
            <button
              onClick={handleOpenCreatePool}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4" /> Add Pool
            </button>
          )}
        </div>
      </div>

      {message && (
        <div className={`p-3.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
        }`}>
          <CheckCircle2 className="w-4 h-4" /> {message.text}
        </div>
      )}

      {/* SUB-TAB 1: VIP PLANS */}
      {activeSubTab === 'plans' && (
        <>
          {/* Edit / Create Plan Form Modal */}
          {editingPlan && (
            <form onSubmit={handleSave} className="bg-slate-900 border border-emerald-500/40 p-6 rounded-2xl space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  {isNewPlan ? 'Create New Investment Package' : `Edit Package: ${editingPlan.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Package Name</label>
                  <input
                    type="text"
                    required
                    value={editingPlan.name || ''}
                    onChange={e => setEditingPlan(prev => ({ ...prev!, name: e.target.value }))}
                    placeholder="e.g. Starter VIP 1 Plan"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    required
                    min="100"
                    value={editingPlan.price || 1000}
                    onChange={e => setEditingPlan(prev => ({ ...prev!, price: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Daily Profit (%)</label>
                  <input
                    type="number"
                    required
                    step="0.1"
                    min="0.1"
                    value={editingPlan.dailyProfitPercent || 6}
                    onChange={e => setEditingPlan(prev => ({ ...prev!, dailyProfitPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={editingPlan.durationDays || 30}
                    onChange={e => setEditingPlan(prev => ({ ...prev!, durationDays: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Badge Tag</label>
                  <input
                    type="text"
                    value={editingPlan.badgeText || ''}
                    onChange={e => setEditingPlan(prev => ({ ...prev!, badgeText: e.target.value }))}
                    placeholder="e.g. Starter Choice, Most Popular"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editingPlan.isActive ?? true}
                    onChange={e => setEditingPlan(prev => ({ ...prev!, isActive: e.target.checked }))}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isActive" className="text-slate-300 font-bold cursor-pointer">
                    Active & Visible to Users
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-bold text-xs mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPlan.description || ''}
                  onChange={e => setEditingPlan(prev => ({ ...prev!, description: e.target.value }))}
                  placeholder="Package highlight details..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPlan(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Package
                </button>
              </div>
            </form>
          )}

          {/* Plans List Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-4">Package</th>
                    <th className="py-3.5 px-4">Price</th>
                    <th className="py-3.5 px-4">Daily Profit</th>
                    <th className="py-3.5 px-4">Duration</th>
                    <th className="py-3.5 px-4">Total Return</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {plans.map((plan) => (
                    <tr key={plan.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-extrabold text-white block">{plan.name}</span>
                        {plan.badgeText && (
                          <span className="text-[10px] text-amber-400 font-semibold">{plan.badgeText}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-black text-emerald-400">
                        {systemConfig.currencySymbol}{plan.price.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-amber-300">
                        {plan.dailyProfitPercent}% ({systemConfig.currencySymbol}{plan.dailyProfitAmount}/day)
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-300">
                        {plan.durationDays} Days
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                        {systemConfig.currencySymbol}{plan.totalReturnAmount.toLocaleString()} ({plan.totalReturnPercent}%)
                      </td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleActive(plan)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border transition-all ${
                            plan.isActive
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          }`}
                        >
                          {plan.isActive ? 'Active' : 'Disabled'}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEdit(plan)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg transition-colors"
                            title="Edit Package"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(plan.id)}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg transition-colors"
                            title="Delete Package"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* SUB-TAB 2: DYNAMIC INVESTMENT POOLS */}
      {activeSubTab === 'pools' && (
        <>
          {/* Edit / Create Pool Form Modal */}
          {editingPool && (
            <form onSubmit={handleSavePool} className="bg-slate-900 border border-amber-500/40 p-6 rounded-2xl space-y-4 animate-fade-in shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {isNewPool ? 'Create Investment Pool' : `Edit Pool: ${editingPool.name}`}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingPool(null)}
                  className="text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Pool Name</label>
                  <input
                    type="text"
                    required
                    value={editingPool.name || ''}
                    onChange={e => setEditingPool(prev => ({ ...prev!, name: e.target.value }))}
                    placeholder="e.g. Coconut Cove Pool"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    required
                    value={editingPool.bannerImage || ''}
                    onChange={e => setEditingPool(prev => ({ ...prev!, bannerImage: e.target.value }))}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Category Tag</label>
                  <input
                    type="text"
                    value={editingPool.category || ''}
                    onChange={e => setEditingPool(prev => ({ ...prev!, category: e.target.value }))}
                    placeholder="e.g. High Growth, VIP Yield, Starter Pool"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Daily Return (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={editingPool.dailyReturnPercent || 5}
                    onChange={e => setEditingPool(prev => ({ ...prev!, dailyReturnPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    required
                    value={editingPool.durationDays || 50}
                    onChange={e => setEditingPool(prev => ({ ...prev!, durationDays: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Funded Progress (%)</label>
                  <input
                    type="number"
                    max="100"
                    value={editingPool.fundedPercent || 0}
                    onChange={e => setEditingPool(prev => ({ ...prev!, fundedPercent: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Minimum Investment ({systemConfig.currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={editingPool.minInvestment || 500}
                    onChange={e => setEditingPool(prev => ({ ...prev!, minInvestment: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Maximum Investment ({systemConfig.currencySymbol})</label>
                  <input
                    type="number"
                    required
                    value={editingPool.maxInvestment || 50000}
                    onChange={e => setEditingPool(prev => ({ ...prev!, maxInvestment: Number(e.target.value) }))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2 px-3 text-white outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="isFeatured"
                    checked={editingPool.isFeatured ?? true}
                    onChange={e => setEditingPool(prev => ({ ...prev!, isFeatured: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                  <label htmlFor="isFeatured" className="text-slate-300 font-bold cursor-pointer">
                    Featured "HOT POOL" Badge
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingPool(null)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" /> Save Pool Configuration
                </button>
              </div>
            </form>
          )}

          {/* Pools List Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pools.map((pool) => (
              <div key={pool.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl p-4 flex gap-4">
                <img
                  src={pool.bannerImage}
                  alt={pool.name}
                  className="w-24 h-24 rounded-xl object-cover shrink-0"
                />
                <div className="flex-1 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-white">{pool.name}</h3>
                    <span className="text-[10px] font-mono text-amber-400 font-bold">{pool.dailyReturnPercent}% / day</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Duration: <strong className="text-slate-200">{pool.durationDays} Days</strong> | Category: <strong className="text-emerald-400">{pool.category || 'General'}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Min Investment: <strong className="text-white font-mono">{systemConfig.currencySymbol}{pool.minInvestment}</strong> | Max: <strong className="text-white font-mono">{systemConfig.currencySymbol}{pool.maxInvestment.toLocaleString()}</strong>
                  </p>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[10px] font-mono text-slate-500">{pool.fundedPercent}% Funded</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditPool(pool)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg"
                        title="Edit Pool"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeletePool(pool.id)}
                        className="p-1.5 bg-slate-800 hover:bg-slate-700 text-rose-400 rounded-lg"
                        title="Delete Pool"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

    </div>
  );
};
