import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Smartphone, 
  Gift, 
  MessageSquare, 
  ShieldCheck, 
  ShieldAlert,
  ArrowLeft,
  Layers
} from 'lucide-react';

import { AdminOverview } from './AdminOverview';
import { AdminUsers } from './AdminUsers';
import { AdminTransactions } from './AdminTransactions';
import { AdminPlans } from './AdminPlans';
import { AdminPromoCodes } from './AdminPromoCodes';
import { AdminSupport } from './AdminSupport';
import { AdminSettings } from './AdminSettings';
import { useAuth } from '../../context/AuthContext';

interface AdminPanelProps {
  onReturnToUserDashboard: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onReturnToUserDashboard }) => {
  const { systemConfig, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'transactions' | 'plans' | 'promocodes' | 'support' | 'settings'>('overview');

  return (
    <div className="space-y-6 pb-12">
      
      {/* Admin Panel Top Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-2xl shrink-0">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight">
                {systemConfig.siteName} Master Admin Control Panel
              </h1>
              <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full uppercase">
                Admin
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage user accounts, approve JazzCash & EasyPaisa deposits/withdrawals, edit investment plans, generate promo codes, and edit system config.
            </p>
          </div>
        </div>

        <button
          onClick={onReturnToUserDashboard}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          Return to User View
        </button>
      </div>

      {/* Admin Tab Navigation Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800">
        
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          Overview
        </button>

        <button
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'users'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          User Management
        </button>

        <button
          onClick={() => setActiveTab('transactions')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'transactions'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          JazzCash / EasyPaisa
        </button>

        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'plans'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          Investment Plans
        </button>

        <button
          onClick={() => setActiveTab('promocodes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'promocodes'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4" />
          Promo Codes
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'support'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Support Tickets
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'settings'
              ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/10'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          System Config & APIs
        </button>

      </div>

      {/* Tab Content Display */}
      {activeTab === 'overview' && <AdminOverview onNavigate={(t) => setActiveTab(t as any)} />}
      {activeTab === 'users' && <AdminUsers />}
      {activeTab === 'transactions' && <AdminTransactions />}
      {activeTab === 'plans' && <AdminPlans systemConfig={systemConfig} />}
      {activeTab === 'promocodes' && <AdminPromoCodes />}
      {activeTab === 'support' && <AdminSupport />}
      {activeTab === 'settings' && <AdminSettings />}

    </div>
  );
};
