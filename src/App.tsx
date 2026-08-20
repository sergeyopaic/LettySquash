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
import { CompetitionDetailModal } from './components/CompetitionDetailModal';
import { AddPlayerModal } from './components/AddPlayerModal';
import { MatchDetailModal } from './components/MatchDetailModal';
import { SettingsModal } from './components/SettingsModal';
import { AdvancedStatsModal } from './components/AdvancedStatsModal';
import { HowToPlayModal } from './components/HowToPlayModal';
import { HowToUseAppModal } from './components/HowToUseAppModal';
import { PlayerProfileModal } from './components/PlayerProfileModal';
import type { Player } from './types/squash';
import { Smartphone, Monitor, Wifi, Signal, BatteryMedium, Activity } from 'lucide-react';

const MainContainer: React.FC = () => {
  const { activeMatchState, getMatchById, folders, cancelActiveMatch } = useSquash();

  const [activeFolderId, setActiveFolderId] = useState<string>(() => folders[0]?.id ?? '');
  const activeFolder = folders.find((f) => f.id === activeFolderId) ?? folders[0];
  const [activeTab, setActiveTab] = useState<TabType>('home');
  // A match survives an app restart via localStorage (see SquashContext — every point,
  // decision, and even the timer tick persists it immediately). This only needs to ask
  // once, right at launch, whether there actually was one sitting in storage — it must
  // NOT re-open every time activeMatchState changes during normal play, so it's seeded
  // once from a lazy initializer instead of reacting to the live value.
  const [showResumePrompt, setShowResumePrompt] = useState<boolean>(() => Boolean(activeMatchState));
  // Quick Match lives inline on the Home tab (see DashboardView -> QuickMatchCard) for the
  // fast path. Every other "start a match" entry point — nav bar, How to Play/Use guides —
  // is reachable from ANY tab, so it opens the global NewMatchModal instead (same form,
  // shown with the format panel expanded by default).
  const [isNewMatchOpen, setIsNewMatchOpen] = useState<boolean>(false);
  const [isNewCompetitionOpen, setIsNewCompetitionOpen] = useState<boolean>(false);
  const [isCompetitionsListOpen, setIsCompetitionsListOpen] = useState<boolean>(false);
  const [openCompetitionId, setOpenCompetitionId] = useState<string | null>(null);
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
              activeFolder={activeFolder}
              onSelectFolder={(f) => setActiveFolderId(f.id)}
              openNewCompetitionModal={() => setIsNewCompetitionOpen(true)}
              openAddPlayerModal={() => setIsAddPlayerOpen(true)}
              openSettingsModal={() => setIsSettingsOpen(true)}
              openAdvancedStatsModal={() => setIsAdvancedStatsOpen(true)}
              openHowToPlayModal={() => setIsHowToPlayOpen(true)}
              openHowToUseAppModal={() => setIsHowToUseAppOpen(true)}
              openCompetitionsListModal={() => setIsCompetitionsListOpen(true)}
              openCompetitionDetail={(id) => setOpenCompetitionId(id)}
              onSelectPlayerProfile={(p) => setSelectedPlayerProfile(p)}
              setActiveTab={setActiveTab}
              selectMatchDetail={(id) => setSelectedMatchId(id)}
            />
          )}

          {activeTab === 'match' && (
            <ScoreboardView
              onExitToHome={(competitionId) => {
                setActiveTab('home');
                if (competitionId) setOpenCompetitionId(competitionId);
              }}
              onSelectPlayerProfile={(p) => setSelectedPlayerProfile(p)}
            />
          )}

          {activeTab === 'players' && (
            <PlayersView
              activeFolder={activeFolder}
              openAddPlayerModal={() => setIsAddPlayerOpen(true)}
              onSelectPlayerProfile={(p) => setSelectedPlayerProfile(p)}
            />
          )}

          {activeTab === 'history' && (
            <MatchHistoryView
              selectMatchDetail={(id) => setSelectedMatchId(id)}
              openCompetitionDetail={(id) => setOpenCompetitionId(id)}
            />
          )}
        </div>

        {/* Resume-match prompt — only ever shown once, right at launch, if a live match
            was restored from storage (see showResumePrompt above). */}
        {showResumePrompt && activeMatchState && (
          <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <Activity className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900">Resume Match?</h2>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {activeMatchState.match.player1.name} vs {activeMatchState.match.player2.name} — Game{' '}
                  {activeMatchState.currentGameIndex}, {activeMatchState.p1CurrentScore}-{activeMatchState.p2CurrentScore}
                </p>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowResumePrompt(false);
                    setActiveTab('match');
                  }}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-sm rounded-xl shadow-sm transition-transform active:scale-98 border border-slate-800"
                >
                  Resume Match
                </button>
                <button
                  onClick={() => {
                    cancelActiveMatch();
                    setShowResumePrompt(false);
                  }}
                  className="w-full py-2.5 text-xs font-semibold text-slate-400 hover:text-rose-600 transition-colors"
                >
                  Discard This Match
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modals Container inside Phone Frame */}
        <NewMatchModal
          isOpen={isNewMatchOpen}
          onClose={() => setIsNewMatchOpen(false)}
          onStart={() => setActiveTab('match')}
          openSettingsModal={() => setIsSettingsOpen(true)}
        />

        <NewCompetitionModal
          isOpen={isNewCompetitionOpen}
          onClose={() => setIsNewCompetitionOpen(false)}
          onCreated={(competition) => setOpenCompetitionId(competition.id)}
        />

        <CompetitionsListModal
          isOpen={isCompetitionsListOpen}
          onClose={() => setIsCompetitionsListOpen(false)}
          onOpenDetail={(id) => {
            setIsCompetitionsListOpen(false);
            setOpenCompetitionId(id);
          }}
        />

        <CompetitionDetailModal
          competitionId={openCompetitionId}
          onClose={() => setOpenCompetitionId(null)}
          onStartMatch={() => {
            setOpenCompetitionId(null);
            setActiveTab('match');
          }}
          onSelectMatchDetail={(id) => setSelectedMatchId(id)}
        />

        <AddPlayerModal
          isOpen={isAddPlayerOpen}
          onClose={() => setIsAddPlayerOpen(false)}
          activeFolder={activeFolder}
        />

        <MatchDetailModal
          match={selectedMatch}
          onClose={() => setSelectedMatchId(null)}
          onSelectPlayerProfile={(player) => setSelectedPlayerProfile(player)}
          openCompetitionDetail={(id) => setOpenCompetitionId(id)}
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
          onOpenHowToUseApp={() => setIsHowToUseAppOpen(true)}
        />

        <AdvancedStatsModal
          isOpen={isAdvancedStatsOpen}
          onClose={() => setIsAdvancedStatsOpen(false)}
          activeFolder={activeFolder}
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
          goToNewMatch={() => setIsNewMatchOpen(true)}
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
