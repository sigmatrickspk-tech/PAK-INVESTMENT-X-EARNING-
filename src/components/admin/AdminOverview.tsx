import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Wallet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  ShieldCheck, 
  Clock, 
  AlertTriangle,
  Download,
  Power,
  RefreshCw,
  CheckCircle2,
  Lock,
  FileJson,
  Activity
} from 'lucide-react';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';

import { db } from '../../lib/firebase';
import { UserProfile, Transaction } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const AdminOverview: React.FC<{ onNavigate: (tab: string) => void }> = ({ onNavigate }) => {
  const { systemConfig, updateConfigInFirestore } = useAuth();

  const [totalUsers, setTotalUsers] = useState(0);
  const [totalUserBalance, setTotalUserBalance] = useState(0);
  const [pendingDeposits, setPendingDeposits] = useState<Transaction[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<Transaction[]>([]);
  const [approvedVolume, setApprovedVolume] = useState(0);

  const [exporting, setExporting] = useState(false);
  const [togglingMaintenance, setTogglingMaintenance] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    // 1. Listen to Users
    const unsubsUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setTotalUsers(snap.size);
      let sumBal = 0;
      snap.forEach(doc => {
        const u = doc.data() as UserProfile;
        sumBal += u.balance || 0;
      });
      setTotalUserBalance(sumBal);
    });

    // 2. Listen to Transactions
    const unsubsTx = onSnapshot(collection(db, 'transactions'), (snap) => {
      const pDep: Transaction[] = [];
      const pWith: Transaction[] = [];
      let vol = 0;

      snap.forEach(docSnap => {
        const tx = { id: docSnap.id, ...docSnap.data() } as Transaction;
        if (tx.status === 'pending') {
          if (tx.type === 'deposit') pDep.push(tx);
          if (tx.type === 'withdrawal') pWith.push(tx);
        }
        if (tx.status === 'approved') {
          vol += tx.amount || 0;
        }
      });

      setPendingDeposits(pDep);
      setPendingWithdrawals(pWith);
      setApprovedVolume(vol);
    });

    return () => {
      unsubsUsers();
      unsubsTx();
    };
  }, []);

  const handleToggleMaintenance = async () => {
    setTogglingMaintenance(true);
    try {
      const nextMode = !systemConfig.maintenanceMode;
      await updateConfigInFirestore({
        ...systemConfig,
        maintenanceMode: nextMode
      });
    } catch (err) {
      console.error('Error updating maintenance mode:', err);
    } finally {
      setTogglingMaintenance(false);
    }
  };

  const handleExportBackup = async () => {
    setExporting(true);
    setExportSuccessMsg(null);
    try {
      const [usersSnap, txSnap, logsSnap, ticketsSnap, promoSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'transactions')),
        getDocs(collection(db, 'activityLogs')),
        getDocs(collection(db, 'tickets')),
        getDocs(collection(db, 'promocodes'))
      ]);

      const users = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const transactions = txSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const activityLogs = logsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const tickets = ticketsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const promocodes = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const backupData = {
        exportTimestamp: new Date().toISOString(),
        siteName: systemConfig.siteName,
        systemConfig: systemConfig,
        summaryStats: {
          totalUsers: users.length,
          totalUserBalance: totalUserBalance,
          approvedTransactionVolume: approvedVolume,
          pendingDepositsCount: pendingDeposits.length,
          pendingWithdrawalsCount: pendingWithdrawals.length
        },
        collections: {
          users,
          transactions,
          activityLogs,
          tickets,
          promocodes
        }
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const sanitizeName = (systemConfig.siteName || 'PAK_INVESTMENT_X_EARNING').replace(/\s+/g, '_');
      link.download = `${sanitizeName}_backup_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setExportSuccessMsg(`✅ Downloaded JSON backup with ${users.length} users and ${transactions.length} transactions!`);
      setTimeout(() => setExportSuccessMsg(null), 5000);
    } catch (err) {
      console.error('Error exporting backup:', err);
      alert('Failed to generate JSON backup: ' + (err as Error).message);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Maintenance Mode & Export Control Header Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className={`p-3.5 rounded-2xl border ${
            systemConfig.maintenanceMode 
              ? 'bg-rose-500/20 border-rose-500/40 text-rose-400 animate-pulse' 
              : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
          }`}>
            <Power className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-black text-white">System Status:</h3>
              {systemConfig.maintenanceMode ? (
                <span className="px-3 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-black uppercase tracking-wider">
                  🔴 Maintenance Mode Active
                </span>
              ) : (
                <span className="px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black uppercase tracking-wider">
                  🟢 Normal Operations
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {systemConfig.maintenanceMode 
                ? 'All deposits, cashouts, promo code claims & plan purchases are currently locked.' 
                : 'Platform active for user registrations, deposits, and payouts.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Maintenance Switch Button */}
          <button
            onClick={handleToggleMaintenance}
            disabled={togglingMaintenance}
            className={`flex-1 md:flex-none px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
              systemConfig.maintenanceMode
                ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20'
                : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
            }`}
          >
            {togglingMaintenance ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : systemConfig.maintenanceMode ? (
              <>
                <Power className="w-4 h-4" /> Disable Maintenance
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" /> Enable Maintenance Mode
              </>
            )}
          </button>

          {/* Backup Export Button */}
          <button
            onClick={handleExportBackup}
            disabled={exporting}
            className="flex-1 md:flex-none bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <FileJson className="w-4 h-4" />
            )}
            {exporting ? 'Generating JSON...' : 'Export System JSON Backup'}
          </button>
        </div>
      </div>

      {/* Export Success Notification */}
      {exportSuccessMsg && (
        <div className="p-4 bg-emerald-500/20 border border-emerald-500/40 rounded-2xl text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{exportSuccessMsg}</span>
        </div>
      )}

      {/* Alert Banner for pending tasks */}
      {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-between gap-4 text-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <h4 className="text-xs font-bold">Action Required: Pending Financial Requests</h4>
              <p className="text-[11px] text-amber-300/80">
                You have {pendingDeposits.length} pending deposits and {pendingWithdrawals.length} pending withdrawals waiting for review.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('transactions')}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black px-3.5 py-2 rounded-xl shrink-0"
          >
            Review Now →
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total Registered Users</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">{totalUsers}</div>
          <span className="text-[10px] text-slate-500 mt-1 block">Active Platform Members</span>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400">Total User Balances</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 font-mono">
            {systemConfig.currencySymbol}{totalUserBalance.toLocaleString()}
          </div>
          <span className="text-[10px] text-slate-500 mt-1 block">Liability across all accounts</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300">Pending Deposits</span>
            <ArrowDownLeft className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{pendingDeposits.length}</div>
          <span className="text-[10px] text-amber-300/70 mt-1 block">JazzCash & EasyPaisa</span>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-amber-300">Pending Withdrawals</span>
            <ArrowUpRight className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 font-mono">{pendingWithdrawals.length}</div>
          <span className="text-[10px] text-amber-300/70 mt-1 block">Cashout approvals</span>
        </div>

      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        <div 
          onClick={() => onNavigate('users')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition-all group"
        >
          <Users className="w-8 h-8 text-emerald-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white mb-1">User Management</h3>
          <p className="text-xs text-slate-400">
            View user emails, phone numbers, stored passwords, add/deduct balances, ban or unban accounts, and reset credentials.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('transactions')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition-all group"
        >
          <ArrowDownLeft className="w-8 h-8 text-amber-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white mb-1">Payment Approvals</h3>
          <p className="text-xs text-slate-400">
            Review JazzCash & EasyPaisa deposits with TID checks, approve withdrawals, or reject with custom administrative notes.
          </p>
        </div>

        <div 
          onClick={() => onNavigate('settings')}
          className="bg-slate-900 border border-slate-800 hover:border-emerald-500/50 p-6 rounded-2xl cursor-pointer transition-all group"
        >
          <ShieldCheck className="w-8 h-8 text-teal-400 mb-3 group-hover:scale-110 transition-transform" />
          <h3 className="text-sm font-bold text-white mb-1">System Settings & APIs</h3>
          <p className="text-xs text-slate-400">
            Configure platform title ({systemConfig.siteName}), official payment accounts, API credentials, and external links.
          </p>
        </div>

      </div>

    </div>
  );
};
