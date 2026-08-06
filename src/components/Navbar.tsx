import React from 'react';
import { 
  Zap, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ShieldAlert, 
  MessageSquare, 
  LogOut, 
  User, 
  HelpCircle, 
  Gift, 
  LayoutDashboard,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface NavbarProps {
  onOpenAuth: (mode: 'login' | 'register') => void;
  onOpenDeposit: () => void;
  onOpenWithdraw: () => void;
  onOpenPromo: () => void;
  onOpenSupport: () => void;
  currentTab: 'dashboard' | 'admin' | 'support' | 'faq';
  setCurrentTab: (tab: 'dashboard' | 'admin' | 'support' | 'faq') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenAuth,
  onOpenDeposit,
  onOpenWithdraw,
  onOpenPromo,
  onOpenSupport,
  currentTab,
  setCurrentTab
}) => {
  const { firebaseUser, userProfile, systemConfig, logout, isAdmin, switchToAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 dark:bg-slate-950/90 light:bg-white/90 backdrop-blur-md border-b border-emerald-500/20 text-slate-100 dark:text-slate-100 light:text-slate-900 transition-colors">
      {/* Top Announcement Ticker */}
      {systemConfig.announcementBanner && (
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-950 dark:from-emerald-950 dark:via-teal-900 dark:to-slate-950 light:from-emerald-700 light:via-teal-600 light:to-emerald-800 text-emerald-300 dark:text-emerald-300 light:text-white text-xs py-1.5 px-4 font-medium border-b border-emerald-500/10 flex items-center justify-between overflow-hidden">
          <div className="flex items-center gap-2 truncate max-w-7xl mx-auto w-full">
            <span className="bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
              Notice
            </span>
            <span className="truncate">{systemConfig.announcementBanner}</span>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div 
          onClick={() => setCurrentTab('dashboard')} 
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-emerald-400 p-0.5 shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-400 fill-emerald-400/20" />
            </div>
          </div>
          <div>
            <span className="text-lg font-black tracking-wider text-white dark:text-white light:text-slate-900 uppercase block font-sans">
              {systemConfig.siteName}
            </span>
            <span className="text-[10px] tracking-widest text-emerald-400 font-mono font-bold uppercase -mt-1 block">
              Earning Platform
            </span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 dark:bg-slate-900/60 light:bg-slate-100 p-1 rounded-xl border border-slate-800 light:border-slate-200">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'dashboard'
                ? 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/30'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            Dashboard
          </button>

          <button
            onClick={() => setCurrentTab('support')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'support'
                ? 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/30'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Live Support
          </button>

          <button
            onClick={() => setCurrentTab('faq')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === 'faq'
                ? 'bg-emerald-500/20 text-emerald-300 dark:text-emerald-300 light:text-emerald-700 border border-emerald-500/30'
                : 'text-slate-400 dark:text-slate-400 light:text-slate-600 hover:text-white dark:hover:text-white light:hover:text-slate-900'
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help Center
          </button>

          {/* Admin Panel Button */}
          {firebaseUser && (
            <button
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                currentTab === 'admin'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              Admin Panel
              {isAdmin && (
                <span className="ml-1 bg-amber-500 text-slate-950 text-[9px] px-1.5 py-0.2 rounded font-mono uppercase">
                  PRO
                </span>
              )}
            </button>
          )}
        </nav>

        {/* Right User Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 text-amber-400 dark:text-amber-400 light:text-slate-700 hover:bg-slate-800 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {firebaseUser ? (
            <>
              {/* User Balance Chip */}
              <div className="hidden sm:flex items-center gap-2 bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs">
                <Wallet className="w-4 h-4 text-emerald-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-600 leading-none">Available Balance</span>
                  <span className="font-extrabold text-emerald-300 dark:text-emerald-300 light:text-emerald-700 text-sm font-mono leading-tight">
                    {systemConfig.currencySymbol}{userProfile?.balance?.toLocaleString() || 0}
                  </span>
                </div>
              </div>

              {/* Deposit / Withdraw Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenDeposit}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1 shadow-md shadow-emerald-500/10 active:scale-95 transition-all"
                >
                  <ArrowDownLeft className="w-3.5 h-3.5" />
                  Deposit
                </button>

                <button
                  onClick={onOpenWithdraw}
                  className="bg-slate-800 dark:bg-slate-800 light:bg-slate-200 text-emerald-300 dark:text-emerald-300 light:text-slate-900 border border-emerald-500/30 font-extrabold text-xs px-3 py-2 rounded-xl flex items-center gap-1 active:scale-95 transition-all"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  Withdraw
                </button>

                <button
                  onClick={onOpenPromo}
                  className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold text-xs p-2 rounded-xl active:scale-95 transition-all"
                  title="Redeem Promo Code"
                >
                  <Gift className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Admin Toggle for easy switching */}
              <button
                onClick={switchToAdmin}
                className="text-[10px] bg-slate-800 dark:bg-slate-800 light:bg-slate-200 border border-slate-700 text-slate-300 dark:text-slate-300 light:text-slate-800 px-2 py-1 rounded-lg hidden lg:block"
                title="Toggle Admin role for testing"
              >
                Role: <span className="font-bold text-amber-400">{userProfile?.role}</span> (Switch)
              </button>

              {/* Logout Button */}
              <button
                onClick={logout}
                className="text-slate-400 hover:text-rose-400 p-2 rounded-xl bg-slate-900 dark:bg-slate-900 light:bg-slate-100 border border-slate-800 light:border-slate-300 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenAuth('login')}
                className="text-xs font-bold text-slate-200 dark:text-slate-200 light:text-slate-800 hover:text-white px-3 py-2 rounded-xl hover:bg-slate-800 light:hover:bg-slate-200 transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md shadow-emerald-500/20 active:scale-95 transition-all"
              >
                Register & Get PKR 100
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  );
};
