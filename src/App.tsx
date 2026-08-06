import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationToast } from './components/NotificationToast';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { UserDashboard } from './components/UserDashboard';
import { DepositModal } from './components/DepositModal';
import { WithdrawModal } from './components/WithdrawModal';
import { PromoCodeModal } from './components/PromoCodeModal';
import { SupportHelpCenter } from './components/SupportHelpCenter';
import { AdminPanel } from './components/admin/AdminPanel';
import { 
  Zap, 
  ShieldCheck, 
  Smartphone, 
  Gift, 
  ArrowRight, 
  CheckCircle2, 
  Sparkles, 
  Wallet, 
  TrendingUp 
} from 'lucide-react';

function AppContent() {
  const { firebaseUser, userProfile, systemConfig, loading } = useAuth();

  const [currentTab, setCurrentTab] = useState<'dashboard' | 'admin' | 'support' | 'faq'>('dashboard');
  
  // Modals state
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login'
  });
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [showPromo, setShowPromo] = useState(false);

  const openAuth = (mode: 'login' | 'register') => {
    setAuthModal({ isOpen: true, mode });
  };

  const handleOpenDeposit = () => {
    if (!firebaseUser) {
      openAuth('login');
    } else {
      setShowDeposit(true);
    }
  };

  const handleOpenWithdraw = () => {
    if (!firebaseUser) {
      openAuth('login');
    } else {
      setShowWithdraw(true);
    }
  };

  const handleOpenPromo = () => {
    if (!firebaseUser) {
      openAuth('login');
    } else {
      setShowPromo(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-black uppercase tracking-widest text-emerald-400 font-sans">
          SIGMAXEARNINGS
        </h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to Realtime Firebase Financial Ledger...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-slate-950 light:bg-slate-50 text-slate-100 dark:text-slate-100 light:text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 transition-colors">
      
      {/* Realtime Payout & Deposit Status Toasts */}
      <NotificationToast />

      <Navbar
        onOpenAuth={openAuth}
        onOpenDeposit={handleOpenDeposit}
        onOpenWithdraw={handleOpenWithdraw}
        onOpenPromo={handleOpenPromo}
        onOpenSupport={() => setCurrentTab('support')}
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        
        {/* Main View Router */}
        {currentTab === 'admin' ? (
          <AdminPanel onReturnToUserDashboard={() => setCurrentTab('dashboard')} />
        ) : currentTab === 'support' || currentTab === 'faq' ? (
          <SupportHelpCenter />
        ) : firebaseUser ? (
          <UserDashboard
            onOpenDeposit={handleOpenDeposit}
            onOpenWithdraw={handleOpenWithdraw}
            onOpenPromo={handleOpenPromo}
            onOpenSupport={() => setCurrentTab('support')}
          />
        ) : (
          /* Public Hero Section when signed out */
          <div className="space-y-12 py-8">
            
            {/* Hero Main */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-emerald-950 to-slate-950 border border-emerald-500/30 rounded-3xl p-8 md:p-12 shadow-2xl text-center max-w-4xl mx-auto">
              <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                  <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
                  Official Pakistan Earning Platform
                </div>

                <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight uppercase leading-tight font-sans">
                  Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300">{systemConfig.siteName}</span>
                </h1>

                <p className="text-sm md:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
                  Earn daily cash rewards with instant manual <strong className="text-rose-400">JazzCash</strong> & <strong className="text-emerald-400">EasyPaisa</strong> payouts. Sign up today and receive an instant <strong className="text-amber-300 font-mono">PKR 100 Sign-Up Bonus</strong>!
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                  <button
                    onClick={() => openAuth('register')}
                    className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm px-8 py-4 rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    Get Started & Claim PKR 100
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => openAuth('login')}
                    className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-extrabold text-sm px-8 py-4 rounded-2xl transition-all"
                  >
                    Already Member? Sign In
                  </button>
                </div>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 p-6 rounded-2xl">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Smartphone className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 mb-2">JazzCash & EasyPaisa Payouts</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                  Manual accept/reject pipeline ensures instant verification of Transaction IDs (TID) and 100% safe direct transfers.
                </p>
              </div>

              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 p-6 rounded-2xl">
                <div className="p-3 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <Gift className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 mb-2">Daily Rewards & Promo Codes</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                  Claim attendance check-in rewards, watch video offers, and redeem exclusive giveaway promo codes from our Telegram group.
                </p>
              </div>

              <div className="bg-slate-900 dark:bg-slate-900 light:bg-white border border-slate-800 light:border-slate-200 p-6 rounded-2xl">
                <div className="p-3 bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-xl w-12 h-12 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white dark:text-white light:text-slate-900 mb-2">Real-Time Admin Support</h3>
                <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 leading-relaxed">
                  Open live support chat tickets directly with platform administrators for immediate issue resolution.
                </p>
              </div>

            </div>

          </div>
        )}

      </main>

      <Footer />

      {/* Global Modals */}
      <AuthModal
        isOpen={authModal.isOpen}
        onClose={() => setAuthModal({ ...authModal, isOpen: false })}
        initialMode={authModal.mode}
      />

      <DepositModal
        isOpen={showDeposit}
        onClose={() => setShowDeposit(false)}
      />

      <WithdrawModal
        isOpen={showWithdraw}
        onClose={() => setShowWithdraw(false)}
      />

      <PromoCodeModal
        isOpen={showPromo}
        onClose={() => setShowPromo(false)}
      />

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
