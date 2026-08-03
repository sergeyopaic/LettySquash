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
import { CompetitionsListModal } from './components/CompetitionsListModal';
import { AddPlayerModal } from './components/AddPlayerModal';
import { MatchDetailModal } from './components/MatchDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AdvancedStatsModal } from './components/AdvancedStatsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { HowToUseAppModal } from './components/HowToUseAppModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import { CLUBS_LIST } from './components/ClubSelectorModal';
import type { Player, Club } from './types/squash';
import { Smartphone, Monitor, Wifi, Signal, BatteryMedium } from 'lucide-react';

const MainContainer: React.FC = () => {
  const { activeMatchState, getMatchById } = useSquash();

  const [activeClub, setActiveClub] = useState<Club>(CLUBS_LIST[0]);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isNewMatchOpen, setIsNewMatchOpen] = useState<boolean>(false);
  const [isNewCompetitionOpen, setIsNewCompetitionOpen] = useState<boolean>(false);
  const [isCompetitionsListOpen, setIsCompetitionsListOpen] = useState<boolean>(false);
  const [isAddPlayerOpen, setIsAddPlayerOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isAdvancedStatsOpen, setIsAdvancedStatsOpen] = useState<boolean>(false);
  const [isHowToPlayOpen, setIsHowToPlayOpen] = useState<boolean>(false);
  const [isHowToUseAppOpen, setIsHowToUseAppOpen] = useState<boolean>(false);
  const [selectedPlayerProfile, setSelectedPlayerProfile] = useState<Player | null>(null);
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

      {/* Screen Frame Container Matching Main Window Color #F1F5F9 */}
      <div
        className={`${
          isPhoneFrame
            ? 'iphone-frame bg-[#F1F5F9] shadow-2xl relative'
            : 'w-full max-w-md min-h-screen sm:min-h-[852px] bg-[#F1F5F9] sm:rounded-[44px] shadow-2xl relative overflow-hidden flex flex-col'
        }`}
      >
        {/* Transparent Native iPhone Dynamic Island & Status Bar Area over #F1F5F9 */}
        {isPhoneFrame ? (
          <div className="h-[50px] bg-[#F1F5F9] flex items-center justify-between px-7 relative flex-shrink-0 z-30 select-none">
            {/* Left: iOS Clock */}
            <span className="text-xs font-black text-slate-900 tracking-tight font-mono">9:41</span>

            {/* Center: Dynamic Island Pill */}
            <div className="dynamic-island flex items-center justify-between px-3">
              <div className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-800" />
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </div>

            {/* Right: iOS System Icons (Signal, Wifi, Battery) */}
            <div className="flex items-center space-x-1.5 text-slate-900">
              <Signal className="w-3.5 h-3.5 fill-current" />
              <Wifi className="w-3.5 h-3.5" />
              <BatteryMedium className="w-4 h-4 fill-current" />
            </div>
          </div>
        ) : (
          <div className="h-3 bg-[#F1F5F9] flex-shrink-0" />
        )}

        {/* Scrollable View Content with Unified #F1F5F9 Background */}
        <div className="flex-1 overflow-y-auto app-bg-gradient relative">
          {activeTab === 'home' && (
            <DashboardView
              activeClub={activeClub}
              onSelectClub={(c) => setActiveClub(c)}
              openNewMatchModal={() => setIsNewMatchOpen(true)}
              openNewCompetitionModal={() => setIsNewCompetitionOpen(true)}
              openAddPlayerModal={() => setIsAddPlayerOpen(true)}
              openSettingsModal={() => setIsSettingsOpen(true)}
              openAdvancedStatsModal={() => setIsAdvancedStatsOpen(true)}
              openHowToPlayModal={() => setIsHowToPlayOpen(true)}
              openHowToUseAppModal={() => setIsHowToUseAppOpen(true)}
              openCompetitionsListModal={() => setIsCompetitionsListOpen(true)}
              onSelectPlayerProfile={(p) => setSelectedPlayerProfile(p)}
              setActiveTab={setActiveTab}
              selectMatchDetail={(id) => setSelectedMatchId(id)}
            />
          )}

          {activeTab === 'match' && (
            <ScoreboardView
              openNewMatchModal={() => setIsNewMatchOpen(true)}
              onExitToHome={() => setActiveTab('home')}
              onSelectPlayerProfile={(p) => setSelectedPlayerProfile(p)}
            />
          )}

          {activeTab === 'players' && (
            <PlayersView
              activeClub={activeClub}
              openAddPlayerModal={() => setIsAddPlayerOpen(true)}
              onSelectPlayerProfile={(p) => setSelectedPlayerProfile(p)}
            />
          )}

          {activeTab === 'history' && (
            <MatchHistoryView
              activeClub={activeClub}
              selectMatchDetail={(id) => setSelectedMatchId(id)}
            />
          )}
        </div>

        {/* Modals Container inside Phone Frame */}
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

        <CompetitionsListModal
          isOpen={isCompetitionsListOpen}
          onClose={() => setIsCompetitionsListOpen(false)}
        />

        <AddPlayerModal
          isOpen={isAddPlayerOpen}
          onClose={() => setIsAddPlayerOpen(false)}
          activeClub={activeClub}
        />

        <MatchDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatchId(null)}
          onSelectPlayerProfile={(player) => setSelectedPlayerProfile(player)}
        />

        <PlayerProfileModal
          player={selectedPlayerProfile}
          onClose={() => setSelectedPlayerProfile(null)}
          onSelectMatchDetail={(id) => setSelectedMatchId(id)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          onOpenHowToPlay={() => setIsHowToPlayOpen(true)}
        />

        <AdvancedStatsModal
          isOpen={isAdvancedStatsOpen}
          onClose={() => setIsAdvancedStatsOpen(false)}
          activeClub={activeClub}
        />

        <HowToPlayModal
          isOpen={isHowToPlayOpen}
          onClose={() => setIsHowToPlayOpen(false)}
          openNewMatch={() => setIsNewMatchOpen(true)}
        />

        <HowToUseAppModal
          isOpen={isHowToUseAppOpen}
          onClose={() => setIsHowToUseAppOpen(false)}
          openNewMatch={() => setIsNewMatchOpen(true)}
        />

        {/* Bottom Tab Bar Navigation */}
        <NavigationTabBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          hasActiveMatch={Boolean(activeMatchState)}
          openNewMatchModal={() => setIsNewMatchOpen(true)}
        />
      </div>
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
