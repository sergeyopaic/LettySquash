import React, { useState } from 'react';
import { SquashProvider, useSquash } from './context/SquashContext';
import { DashboardView } from './components/DashboardView';
import { ScoreboardView } from './components/ScoreboardView';
import { PlayersView } from './components/PlayersView';
import { MatchHistoryView } from './components/MatchHistoryView';
import { NavigationTabBar } from './components/NavigationTabBar';
import type { TabType } from './components/NavigationTabBar';
import { NewMatchModal } from './components/NewMatchModal';
import { NewCompetitionModal } from './components/NewCompetitionModal';
import { AddPlayerModal } from './components/AddPlayerModal';
import { MatchDetailModal } from './components/MatchDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AdvancedStatsModal } from './components/AdvancedStatsModal';
import { Smartphone, Monitor } from 'lucide-react';

const MainContainer: React.FC = () => {
  const { activeMatchState, getMatchById } = useSquash();

  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isNewMatchOpen, setIsNewMatchOpen] = useState<boolean>(false);
  const [isNewCompetitionOpen, setIsNewCompetitionOpen] = useState<boolean>(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAdvancedStatsOpen, setIsAdvancedStatsOpen] = useState<boolean>(false);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [isPhoneFrame, setIsPhoneFrame] = useState<boolean>(true);

  const selectedMatch = selectedMatchId ? getMatchById(selectedMatchId) || null : null;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-0 sm:p-6 font-sans">
      {/* Top Device Toggle Bar (for desktop preview) */}
      <div className="hidden sm:flex items-center space-x-3 mb-4 text-xs font-semibold text-slate-400 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800 shadow-lg">
        <span>Preview Mode:</span>
        <button
          onClick={() => setIsPhoneFrame(true)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
            isPhoneFrame ? 'bg-amber-400 text-slate-950 font-bold' : 'hover:text-white'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iPhone 16 Pro Frame</span>
        </button>
        <button
          onClick={() => setIsPhoneFrame(false)}
          className={`flex items-center space-x-1 px-3 py-1 rounded-full transition-all ${
            !isPhoneFrame ? 'bg-amber-400 text-slate-950 font-bold' : 'hover:text-white'
          }`}
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Fullscreen</span>
        </button>
      </div>

      {/* Screen Frame Container */}
      <div
        className={`${
          isPhoneFrame
            ? 'iphone-frame shadow-2xl relative'
            : 'w-full max-w-md min-h-screen sm:min-h-[852px] bg-slate-50 sm:rounded-[44px] shadow-2xl relative overflow-hidden flex flex-col'
        }`}
      >
        {/* Dynamic Island on iPhone Frame */}
        {isPhoneFrame && (
          <div className="dynamic-island">
            <span className="text-[10px] text-slate-400 font-mono">9:41</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
        )}

        {/* Status Bar spacing */}
        <div className="h-10 bg-white/80 backdrop-blur-md flex-shrink-0" />

        {/* Scrollable View Content with Rich Ambient Mesh Background */}
        <div className="flex-1 overflow-y-auto app-bg-gradient relative">
          {activeTab === 'home' && (
            <DashboardView
              openNewMatchModal={() => setIsNewMatchOpen(true)}
              openNewCompetitionModal={() => setIsNewCompetitionOpen(true)}
              openAddPlayerModal={() => setIsAddPlayerOpen(true)}
              openSettingsModal={() => setIsSettingsOpen(true)}
              openAdvancedStatsModal={() => setIsAdvancedStatsOpen(true)}
              setActiveTab={setActiveTab}
              selectMatchDetail={(id) => setSelectedMatchId(id)}
            />
          )}

          {activeTab === 'match' && (
            <ScoreboardView openNewMatchModal={() => setIsNewMatchOpen(true)} />
          )}

          {activeTab === 'players' && (
            <PlayersView openAddPlayerModal={() => setIsAddPlayerOpen(true)} />
          )}

          {activeTab === 'history' && (
            <MatchHistoryView selectMatchDetail={(id) => setSelectedMatchId(id)} />
          )}
        </div>

        {/* Bottom Tab Bar Navigation */}
        <NavigationTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasActiveMatch={Boolean(activeMatchState)}
          openNewMatchModal={() => setIsNewMatchOpen(true)}
        />
      </div>

      {/* Modals */}
      <NewMatchModal
        isOpen={isNewMatchOpen}
        onClose={() => setIsNewMatchOpen(false)}
        onStart={() => {
          setIsNewMatchOpen(false);
          setActiveTab('match');
        }}
      />

      <NewCompetitionModal
        isOpen={isNewCompetitionOpen}
        onClose={() => setIsNewCompetitionOpen(false)}
      />

      <AddPlayerModal
        isOpen={isAddPlayerOpen}
        onClose={() => setIsAddPlayerOpen(false)}
      />

      <MatchDetailModal
        match={selectedMatch}
        onClose={() => setSelectedMatchId(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <AdvancedStatsModal
        isOpen={isAdvancedStatsOpen}
        onClose={() => setIsAdvancedStatsOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <SquashProvider>
      <MainContainer />
    </SquashProvider>
  );
}
