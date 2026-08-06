import React, { useState } from 'react';
import { Eye, EyeOff, ShieldCheck, Zap, Lock, Mail, Phone, User, Gift, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralCode, setReferralCode] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login, register, systemConfig } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        if (!email || !password) {
          throw new Error('Please fill in both email and password.');
        }
        await login(email, password);
      } else {
        if (!fullName || !email || !phone || !password) {
          throw new Error('Please complete all required fields.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        await register(fullName, email, phone, password, referralCode);
      }
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = err.message || 'Authentication failed. Please check details.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password. Please verify and try again.';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = 'An account with this email already exists. Try logging in.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all">
      <div className="relative w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl shadow-2xl shadow-emerald-950/50 p-6 md:p-8 overflow-hidden text-slate-100">
        
        {/* Decorative Top Glow */}
        <div className="absolute -top-20 -left-20 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800/60 p-2 rounded-full transition-colors"
        >
          ✕
        </button>

        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-2">
            <Zap className="w-3.5 h-3.5 animate-pulse" /> Official Earning Portal
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white uppercase font-sans">
            {systemConfig.siteName}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {mode === 'login' ? 'Welcome back! Sign in to access your earnings.' : 'Create account & get PKR 100 Sign-Up Bonus!'}
          </p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-slate-800/80 p-1 rounded-xl mb-6 border border-slate-700/60">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'login'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              mode === 'register'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Register
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-rose-300 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Muhammad Ali"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Phone Number (JazzCash / EasyPaisa)</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="03001234567"
                    className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-400 hover:text-emerald-400 transition-colors"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Password Strength Meter (Registration Mode) */}
            {mode === 'register' && password.length > 0 && (() => {
              const hasMinLen = password.length >= 6;
              const hasLongLen = password.length >= 10;
              const hasUpperLower = /[a-z]/.test(password) && /[A-Z]/.test(password);
              const hasNumSymbol = /[0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password);

              let score = 0;
              if (hasMinLen) score += 1;
              if (hasLongLen) score += 1;
              if (hasUpperLower) score += 1;
              if (hasNumSymbol) score += 1;

              let label = 'Weak';
              let colorClass = 'bg-rose-500 text-rose-400';
              let barBg = 'bg-rose-500';

              if (score === 3) {
                label = 'Medium';
                colorClass = 'bg-amber-500 text-amber-400';
                barBg = 'bg-amber-500';
              } else if (score >= 4) {
                label = 'Strong';
                colorClass = 'bg-emerald-500 text-emerald-400';
                barBg = 'bg-emerald-500';
              }

              return (
                <div className="mt-2.5 p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-[11px]">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Password Strength:</span>
                    <span className={`font-mono font-bold ${colorClass.split(' ')[1]}`}>
                      {label}
                    </span>
                  </div>

                  {/* 4-segment progress bar */}
                  <div className="grid grid-cols-4 gap-1 h-1.5 w-full">
                    <div className={`rounded-full transition-all duration-300 ${score >= 1 ? barBg : 'bg-slate-800'}`} />
                    <div className={`rounded-full transition-all duration-300 ${score >= 2 ? barBg : 'bg-slate-800'}`} />
                    <div className={`rounded-full transition-all duration-300 ${score >= 3 ? barBg : 'bg-slate-800'}`} />
                    <div className={`rounded-full transition-all duration-300 ${score >= 4 ? barBg : 'bg-slate-800'}`} />
                  </div>

                  {/* Checklist criteria */}
                  <div className="grid grid-cols-2 gap-1 pt-1 text-[10px]">
                    <span className={hasMinLen ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {hasMinLen ? '✓' : '○'} At least 6 characters
                    </span>
                    <span className={hasUpperLower ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {hasUpperLower ? '✓' : '○'} Upper & lowercase
                    </span>
                    <span className={hasNumSymbol ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {hasNumSymbol ? '✓' : '○'} Number or symbol
                    </span>
                    <span className={hasLongLen ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                      {hasLongLen ? '✓' : '○'} 10+ chars (ideal)
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Referral / Promo Code <span className="text-slate-500 font-normal">(Optional)</span>
              </label>
              <div className="relative">
                <Gift className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="e.g. PAK2026"
                  className="w-full bg-slate-800/90 border border-slate-700 focus:border-emerald-500 rounded-xl py-2.5 pl-10 pr-4 text-sm text-amber-400 font-mono tracking-wider placeholder-slate-500 outline-none transition-all"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold py-3 px-4 rounded-xl shadow-lg shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {mode === 'login' ? 'Sign In to Dashboard' : 'Create Account & Claim PKR 100'}
              </>
            )}
          </button>
        </form>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-slate-800 text-center text-xs text-slate-400">
          <p>🔒 256-Bit SSL Encrypted & Real-time Firebase Sync</p>
          <p className="mt-1 text-[11px] text-slate-500">JazzCash & EasyPaisa Verified Financial Portal</p>
        </div>

      </div>
    </div>
  );
};
