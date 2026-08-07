import React from 'react';
import { Home, Play, Users, History } from 'lucide-react';

export type TabType = 'home' | 'match' | 'players' | 'history';

interface NavigationTabBarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  hasActiveMatch: boolean;
  // Quick Match lives inline on the Home tab (see DashboardView -> QuickMatchCard) — this
  // just navigates there, it doesn't open anything itself.
  goToNewMatch: () => void;
}

export const NavigationTabBar: React.FC<NavigationTabBarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveMatch,
  goToNewMatch,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 max-w-md mx-auto z-40 bg-white/95 backdrop-blur-xl border-t border-slate-200/80 px-4 py-2 flex justify-around items-center shadow-lg">
      <button
        onClick={() => setActiveTab('home')}
        className={`flex flex-col items-center space-y-0.5 transition-colors ${
          activeTab === 'home' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px]">Home</span>
        {activeTab === 'home' && <div className="w-1 h-1 rounded-full bg-amber-500" />}
      </button>

      <button
        onClick={() => {
          if (hasActiveMatch) {
            setActiveTab('match');
          } else {
            goToNewMatch();
          }
        }}
        className="relative group -mt-5"
      >
        <div className={`w-13 h-13 rounded-full p-0.5 shadow-md flex items-center justify-center transition-transform active:scale-95 ${
          hasActiveMatch 
            ? 'bg-gradient-to-r from-amber-400 to-amber-500 ring-4 ring-amber-100 animate-pulse'
            : 'bg-slate-900 border-2 border-slate-800'
        }`}>
          <div className="w-full h-full rounded-full flex flex-col items-center justify-center text-amber-400">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-800 block text-center mt-1">
          {hasActiveMatch ? 'Live Match' : 'New Match'}
        </span>
      </button>

      <button
        onClick={() => setActiveTab('players')}
        className={`flex flex-col items-center space-y-0.5 transition-colors ${
          activeTab === 'players' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[10px]">Players</span>
        {activeTab === 'players' && <div className="w-1 h-1 rounded-full bg-amber-500" />}
      </button>

      <button
        onClick={() => setActiveTab('history')}
        className={`flex flex-col items-center space-y-0.5 transition-colors ${
          activeTab === 'history' ? 'text-slate-900 font-bold' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        <History className="w-5 h-5" />
        <span className="text-[10px]">History</span>
        {activeTab === 'history' && <div className="w-1 h-1 rounded-full bg-amber-500" />}
      </button>
    </div>
  );
};
