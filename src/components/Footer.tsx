import React from 'react';
import { Zap, ShieldCheck, Heart, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Footer: React.FC = () => {
  const { systemConfig } = useAuth();

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
        
        {/* Col 1: Brand */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 p-0.5 flex items-center justify-center text-slate-950 font-black">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <span className="text-base font-black text-white tracking-wider uppercase font-sans">
              {systemConfig.siteName}
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Leading financial earning platform with instant manual JazzCash & EasyPaisa deposits & withdrawals, daily task rewards, and real-time live support.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Secured Platform
          </div>
        </div>

        {/* Col 2: Payment Gateways */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Accepted Payment Methods</h4>
          <ul className="space-y-2 text-xs">
            <li className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span> JazzCash Mobile Wallet
            </li>
            <li className="flex items-center gap-2 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span> EasyPaisa Mobile Wallet
            </li>
            <li className="text-[11px] text-slate-500 pt-1">
              Manual verification pipeline ensures 100% financial protection against duplicate or fraudulent TIDs.
            </li>
          </ul>
        </div>

        {/* Col 3: Quick Links */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Community & Socials</h4>
          <div className="space-y-2 text-xs">
            {systemConfig.externalLinks?.TELEGRAM_OFFICIAL && (
              <a
                href={systemConfig.externalLinks.TELEGRAM_OFFICIAL}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:underline"
              >
                <Send className="w-3.5 h-3.5" /> Official Telegram Channel
              </a>
            )}
            {systemConfig.externalLinks?.WHATSAPP_COMMUNITY && (
              <a
                href={systemConfig.externalLinks.WHATSAPP_COMMUNITY}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-emerald-400 hover:underline"
              >
                <MessageCircle className="w-3.5 h-3.5" /> Official WhatsApp Group
              </a>
            )}
            <p className="text-[11px] text-slate-500 pt-1">
              Join our Telegram channel for daily exclusive promo code giveaways!
            </p>
          </div>
        </div>

        {/* Col 4: Support */}
        <div>
          <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Direct Support</h4>
          <p className="text-xs text-slate-400 mb-1">
            WhatsApp: <span className="text-emerald-300 font-mono font-bold">{systemConfig.supportWhatsApp}</span>
          </p>
          <p className="text-xs text-slate-400 mb-1">
            Email: <span className="text-emerald-300 font-mono">{systemConfig.supportEmail}</span>
          </p>
          <p className="text-[10px] text-slate-500 mt-2">
            24/7 Live Chat available via top navigation bar.
          </p>
        </div>

      </div>

      <div className="max-w-7xl mx-auto pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
        <p>© {new Date().getFullYear()} PAK INVESTMENT X EARNING. All rights reserved.</p>
        <p className="flex items-center gap-1 font-bold text-emerald-400">
          Made by PAK INVESTMENT X EARNING TEAM
        </p>
      </div>
    </footer>
  );
};
