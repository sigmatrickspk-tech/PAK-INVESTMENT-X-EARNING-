import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Eye, 
  EyeOff, 
  Plus, 
  Minus, 
  Key, 
  Ban, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw,
  Wallet,
  ShieldCheck
} from 'lucide-react';
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc, 
  increment 
} from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { UserProfile } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminUsers: React.FC = () => {
  const { systemConfig, userProfile: currentUser } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Balance Modal
  const [selectedUserForBal, setSelectedUserForBal] = useState<UserProfile | null>(null);
  const [balanceAmount, setBalanceAmount] = useState<number>(100);
  const [balanceAction, setBalanceAction] = useState<'add' | 'deduct'>('add');
  const [balanceReason, setBalanceReason] = useState('Admin Bonus Adjustment');
  const [updatingBal, setUpdatingBal] = useState(false);

  // Reset Password Modal
  const [selectedUserForPwd, setSelectedUserForPwd] = useState<UserProfile | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [updatingPwd, setUpdatingPwd] = useState(false);

  // Alert
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'users'), (snapshot) => {
      const uList: UserProfile[] = snapshot.docs.map(docSnap => ({
        ...docSnap.data()
      } as UserProfile));
      setUsers(uList);
      setLoading(false);
    }, (err) => {
      console.error('Error fetching users for admin:', err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const togglePasswordVisibility = (uid: string) => {
    setVisiblePasswords(prev => ({ ...prev, [uid]: !prev[uid] }));
  };

  const filteredUsers = users.filter(u => {
    const q = searchQuery.toLowerCase();
    return (
      (u.fullName || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.phone || '').toLowerCase().includes(q) ||
      (u.uid || '').toLowerCase().includes(q)
    );
  });

  const handleToggleBan = async (user: UserProfile) => {
    try {
      const newStatus = user.status === 'banned' ? 'active' : 'banned';
      await updateDoc(doc(db, 'users', user.uid), { status: newStatus });
      setMsg({
        type: 'success',
        text: `User ${user.email} status changed to ${newStatus.toUpperCase()}`
      });
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update user status.' });
    }
  };

  const handleAdjustBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForBal) return;

    if (balanceAmount <= 0) {
      setMsg({ type: 'error', text: 'Please enter a valid amount greater than 0.' });
      return;
    }

    setUpdatingBal(true);

    try {
      const adjustVal = balanceAction === 'add' ? balanceAmount : -balanceAmount;
      
      // Update user doc
      await updateDoc(doc(db, 'users', selectedUserForBal.uid), {
        balance: increment(adjustVal),
        totalEarnings: balanceAction === 'add' ? increment(balanceAmount) : increment(0)
      });

      // Record transaction
      await addDoc(collection(db, 'transactions'), {
        userId: selectedUserForBal.uid,
        userEmail: selectedUserForBal.email,
        userPhone: selectedUserForBal.phone,
        userName: selectedUserForBal.fullName,
        type: 'admin_adjustment',
        method: 'Internal',
        amount: Math.abs(adjustVal),
        status: 'approved',
        createdAt: Date.now(),
        adminNote: `Admin ${balanceAction === 'add' ? 'Added' : 'Deducted'} Balance: ${balanceReason}`
      });

      setMsg({
        type: 'success',
        text: `Successfully ${balanceAction === 'add' ? 'added' : 'deducted'} ${systemConfig.currencySymbol}${balanceAmount} for ${selectedUserForBal.email}.`
      });
      setSelectedUserForBal(null);
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Balance update failed.' });
    } finally {
      setUpdatingBal(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPwd) return;

    if (!newPassword || newPassword.length < 6) {
      setMsg({ type: 'error', text: 'Password must be at least 6 characters long.' });
      return;
    }

    setUpdatingPwd(true);

    try {
      // Update stored password text in Firestore
      await updateDoc(doc(db, 'users', selectedUserForPwd.uid), {
        passwordText: newPassword
      });

      setMsg({
        type: 'success',
        text: `Password reset successfully for ${selectedUserForPwd.email}! New password saved to database.`
      });
      setSelectedUserForPwd(null);
      setNewPassword('');
      setTimeout(() => setMsg(null), 3000);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Password reset failed.' });
    } finally {
      setUpdatingPwd(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> Platform User Manager
          </h2>
          <p className="text-xs text-slate-400">
            View emails, phone numbers, stored passwords, adjust balances & manage bans.
          </p>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone, UID..."
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

      {/* User Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        {loading ? (
          <div className="py-12 text-center text-slate-500 text-xs flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" /> Fetching registered user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs">
            No matching users found in database.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">User Name & UID</th>
                  <th className="py-3 px-4">Email Address</th>
                  <th className="py-3 px-4">Phone Number</th>
                  <th className="py-3 px-4">Password (Admin View)</th>
                  <th className="py-3 px-4">Balance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filteredUsers.map((u) => {
                  const showPwd = visiblePasswords[u.uid] || false;
                  const isBanned = u.status === 'banned';

                  return (
                    <tr key={u.uid} className="hover:bg-slate-800/50 transition-colors">
                      
                      {/* Name & UID */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-white block">{u.fullName || 'Unnamed'}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">UID: {u.uid.substring(0, 8)}...</span>
                        {u.role === 'admin' && (
                          <span className="inline-block mt-0.5 text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono">
                            ADMIN
                          </span>
                        )}
                      </td>

                      {/* Email */}
                      <td className="py-3.5 px-4 font-mono text-slate-200">
                        {u.email}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 font-mono text-emerald-400 font-semibold">
                        {u.phone || 'Not provided'}
                      </td>

                      {/* Password View & Toggle */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-amber-300 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs">
                            {showPwd ? (u.passwordText || '••••••••') : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(u.uid)}
                            className="p-1 text-slate-400 hover:text-white bg-slate-800 rounded transition-colors"
                            title={showPwd ? 'Hide password' : 'Show user password'}
                          >
                            {showPwd ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Balance */}
                      <td className="py-3.5 px-4 font-mono font-black text-sm text-white">
                        {systemConfig.currencySymbol}{u.balance?.toLocaleString() || 0}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          isBanned
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        }`}>
                          {isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right space-x-1.5 shrink-0">
                        
                        {/* Adjust Balance */}
                        <button
                          onClick={() => setSelectedUserForBal(u)}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 p-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Add or Deduct Balance"
                        >
                          <Wallet className="w-3.5 h-3.5 inline mr-1" />
                          Balance
                        </button>

                        {/* Reset Password */}
                        <button
                          onClick={() => setSelectedUserForPwd(u)}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 p-1.5 rounded-lg text-xs font-bold transition-all"
                          title="Reset User Password"
                        >
                          <Key className="w-3.5 h-3.5 inline mr-1" />
                          Reset Pwd
                        </button>

                        {/* Ban / Unban */}
                        <button
                          onClick={() => handleToggleBan(u)}
                          className={`p-1.5 rounded-lg text-xs font-bold border transition-all ${
                            isBanned
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30 hover:bg-rose-500/20'
                          }`}
                          title={isBanned ? 'Unban User' : 'Ban User'}
                        >
                          <Ban className="w-3.5 h-3.5 inline" />
                        </button>

                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* BALANCE ADJUSTMENT MODAL */}
      {selectedUserForBal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-slate-100">
            <button
              onClick={() => setSelectedUserForBal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-1">Adjust User Balance</h3>
            <p className="text-xs text-slate-400 mb-4">
              User: <span className="text-emerald-400 font-bold">{selectedUserForBal.email}</span> (Current: {systemConfig.currencySymbol}{selectedUserForBal.balance})
            </p>

            <form onSubmit={handleAdjustBalance} className="space-y-4">
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setBalanceAction('add')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    balanceAction === 'add'
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  + Add Balance
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceAction('deduct')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                    balanceAction === 'deduct'
                      ? 'bg-rose-500 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  - Deduct Balance
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Amount ({systemConfig.currencySymbol})</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={balanceAmount}
                  onChange={(e) => setBalanceAmount(Number(e.target.value))}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-white font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Reason / Note</label>
                <input
                  type="text"
                  required
                  value={balanceReason}
                  onChange={(e) => setBalanceReason(e.target.value)}
                  placeholder="e.g. Manual Cash Bonus or Adjustment"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updatingBal}
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {updatingBal ? 'Updating Balance...' : 'Confirm Balance Adjustment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {selectedUserForPwd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-slate-100">
            <button
              onClick={() => setSelectedUserForPwd(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              ✕
            </button>

            <h3 className="text-lg font-black text-white mb-1">Reset User Password</h3>
            <p className="text-xs text-slate-400 mb-4">
              Resetting password for: <span className="text-amber-300 font-bold">{selectedUserForPwd.email}</span>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2.5 px-3 text-sm text-amber-300 font-mono outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={updatingPwd}
                className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl text-xs"
              >
                {updatingPwd ? 'Resetting...' : 'Save New Password'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
