import React from 'react';
import { 
  Home, 
  BarChart2, 
  Users, 
  Share2, 
  User 
} from 'lucide-react';

export type ActiveNavTab = 'home' | 'pools' | 'team' | 'invite' | 'profile';

interface BottomNavProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  teamCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  teamCount = 0
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 dark:bg-slate-950/95 light:bg-white/95 backdrop-blur-lg border-t border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 px-3 py-2 max-w-md mx-auto sm:max-w-xl md:max-w-2xl lg:max-w-4xl shadow-2xl">
      <div className="flex items-center justify-around relative">
        
        {/* Home Tab */}
        <button
          onClick={() => setActiveTab('home')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'home'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className={`w-5 h-5 ${activeTab === 'home' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] font-medium tracking-tight">Home</span>
        </button>

        {/* Pools Tab */}
        <button
          onClick={() => setActiveTab('pools')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'pools'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart2 className={`w-5 h-5 ${activeTab === 'pools' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] font-medium tracking-tight">Pools</span>
        </button>

        {/* Team Center Floating Tab */}
        <div className="relative -top-5">
          <button
            onClick={() => setActiveTab('team')}
            className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl border-4 transition-all ${
              activeTab === 'team'
                ? 'bg-emerald-500 border-slate-950 text-slate-950 scale-110 shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-emerald-600 via-teal-500 to-emerald-400 border-slate-950 text-slate-950 hover:scale-105'
            }`}
          >
            <Users className="w-6 h-6 fill-slate-950/20" />
            {teamCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-950 font-mono">
                {teamCount > 99 ? '99+' : teamCount}
              </span>
            )}
          </button>
        </div>

        {/* Invite Tab */}
        <button
          onClick={() => setActiveTab('invite')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'invite'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className={`w-5 h-5 ${activeTab === 'invite' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] font-medium tracking-tight">Invite</span>
        </button>

        {/* Profile Tab */}
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all ${
            activeTab === 'profile'
              ? 'text-emerald-400 font-extrabold scale-105'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'text-emerald-400' : ''}`} />
          <span className="text-[10px] font-medium tracking-tight">Profile</span>
        </button>

      </div>
    </div>
  );
};
