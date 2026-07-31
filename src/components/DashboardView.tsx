import React, { useState, useEffect } from 'react';
import { useSquash } from '../context/SquashContext';
import { LettyBanner } from './LettyBanner';
import { ClubSelectorModal, CLUBS_LIST } from './ClubSelectorModal';
import type { Club } from '../types/squash';
import { Play, Plus, Activity, ChevronRight, ChevronDown, Clock, Settings, Trophy, MapPin, BarChart3 } from 'lucide-react';

interface DashboardViewProps {
  openNewMatchModal: () => void;
  openNewCompetitionModal: () => void;
  openAddPlayerModal: () => void;
  openSettingsModal: () => void;
  openAdvancedStatsModal: () => void;
  setActiveTab: (tab: 'home' | 'match' | 'players' | 'history') => void;
  selectMatchDetail: (matchId: string) => void;
}

export const SquashBallIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg className={className} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="16" cy="16" r="14" fill="#0F172A" stroke="#334155" strokeWidth="2" />
    <circle cx="12" cy="14" r="2" fill="#FACC15" />
    <circle cx="18" cy="14" r="2" fill="#FACC15" />
  </svg>
);

export const DashboardView: React.FC<DashboardViewProps> = ({
  openNewMatchModal,
  openNewCompetitionModal,
  openAddPlayerModal,
  openSettingsModal,
  openAdvancedStatsModal,
  setActiveTab,
  selectMatchDetail,
}) => {
  const { matches, players, activeMatchState } = useSquash();

  const [activeClub, setActiveClub] = useState<Club>(CLUBS_LIST[0]);
  const [isClubSelectorOpen, setIsClubSelectorOpen] = useState<boolean>(false);

  const [randomFact, setRandomFact] = useState<{
    firstName: string;
    lastName: string;
    flag: string;
    subtitle: string;
  } | null>(null);

  const recentMatches = matches.slice(0, 3);
  const topPlayers = [...players].sort((a, b) => b.wins - a.wins).slice(0, 3);

  // Generate randomized club highlight fact on mount/render
  useEffect(() => {
    const topWinRatePlayer = [...players]
      .filter((p) => p.totalMatches > 0)
      .sort((a, b) => b.wins / b.totalMatches - a.wins / a.totalMatches)[0];

    const mostWinsPlayer = [...players].sort((a, b) => b.wins - a.wins)[0];
    const rookiePlayer = players.find((p) => p.totalMatches === 0);

    const facts = [];

    if (topWinRatePlayer) {
      const wr = Math.round((topWinRatePlayer.wins / topWinRatePlayer.totalMatches) * 100);
      const parts = topWinRatePlayer.name.split(' ');
      facts.push({
        firstName: parts[0] || topWinRatePlayer.name,
        lastName: parts.slice(1).join(' '),
        flag: topWinRatePlayer.countryFlag,
        subtitle: `🔥 Win Rate (${wr}%)`,
      });
    }

    if (mostWinsPlayer) {
      const parts = mostWinsPlayer.name.split(' ');
      facts.push({
        firstName: parts[0] || mostWinsPlayer.name,
        lastName: parts.slice(1).join(' '),
        flag: mostWinsPlayer.countryFlag,
        subtitle: `🏆 Wins Leader (${mostWinsPlayer.wins}W)`,
      });
    }

    if (rookiePlayer) {
      const parts = rookiePlayer.name.split(' ');
      facts.push({
        firstName: parts[0] || rookiePlayer.name,
        lastName: parts.slice(1).join(' '),
        flag: rookiePlayer.countryFlag,
        subtitle: `🌟 Rookie Spotlight`,
      });
    }

    const selected = facts[Math.floor(Math.random() * facts.length)] || {
      firstName: 'Devonport',
      lastName: 'Squash',
      flag: '🇳🇿',
      subtitle: 'Auckland NZ',
    };

    setRandomFact(selected);
  }, [players]);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* Clean Top Header: Title FIRST with SquashBallIcon next to it, ONLY Settings button on top right */}
      <div className="flex items-center justify-between pt-1 mb-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center space-x-2">
            <span>Letty Squash</span>
            <SquashBallIcon className="w-6 h-6 inline-block" />
          </h1>

          {/* Clickable Club Selector with Chevron & Truncation */}
          <button
            onClick={() => setIsClubSelectorOpen(true)}
            className="group flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors pt-0.5"
            title="Switch Active Club"
          >
            <MapPin className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-500 transition-colors flex-shrink-0" />
            <span className="truncate max-w-[170px] sm:max-w-[240px]">
              {activeClub.name}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0" />
          </button>
        </div>

        {/* ONLY Settings Button in Top-Right Corner */}
        <button
          onClick={openSettingsModal}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Mascot Banner: 24px Banner Radius */}
      <LettyBanner variant="home" />

      {/* Centered Main Actions Section (16px Button Radius, 48px HIG Touch Target) */}
      <div className="flex flex-col items-center justify-center space-y-3 text-center pt-0 pb-1">
        {/* Primary Action Button (16px Radius) */}
        <button
          onClick={openNewMatchModal}
          className="w-full min-h-[48px] py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 border border-slate-800"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start New Match</span>
        </button>

        {/* Secondary Action Button (16px Radius) */}
        <button
          onClick={openNewCompetitionModal}
          className="w-full min-h-[48px] py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-black text-sm rounded-2xl shadow-2xs border-2 border-slate-900 flex items-center justify-center space-x-2 transition-all active:scale-98"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Create Competition</span>
        </button>
      </div>

      {/* Active Game Alert Banner (if match in progress) */}
      {activeMatchState && (
        <div className="ios-card rounded-2xl bg-slate-900 text-white p-4 relative overflow-hidden shadow-lg border-none">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-4 translate-y-4">
            <Activity className="w-36 h-36" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                Match Live • Set {activeMatchState.currentSetIndex}
              </span>
              <span className="text-xs font-mono text-slate-300">
                {Math.floor(activeMatchState.timerSeconds / 60)}:
                {String(activeMatchState.timerSeconds % 60).padStart(2, '0')}
              </span>
            </div>

            <div className="flex items-center justify-between my-3">
              <div className="text-left">
                <p className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                  <span>{activeMatchState.match.player1.countryFlag}</span>
                  <span>{activeMatchState.match.player1.name}</span>
                </p>
                <p className="text-2xl font-black text-amber-400">{activeMatchState.p1CurrentScore}</p>
              </div>

              <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-slate-300">
                {activeMatchState.match.p1SetsWon} : {activeMatchState.match.p2SetsWon}
              </div>

              <div className="text-right">
                <p className="text-sm font-bold text-slate-100 flex items-center justify-end space-x-1">
                  <span>{activeMatchState.match.player2.name}</span>
                  <span>{activeMatchState.match.player2.countryFlag}</span>
                </p>
                <p className="text-2xl font-black text-amber-400">{activeMatchState.p2CurrentScore}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveTab('match')}
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-transform active:scale-98 shadow-sm"
            >
              <span>Resume Refereeing</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 1. Recent Matches Activity (16px Card Radius, 12px Inner Item Radius) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">Recent Matches</h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-bold text-slate-900 hover:underline flex items-center"
          >
            <span>Match Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentMatches.map((m) => (
            <div
              key={m.id}
              onClick={() => selectMatchDetail(m.id)}
              className="ios-card rounded-2xl p-3 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-slate-900">
                    {m.player1.countryFlag} {m.player1.name}
                  </span>
                  <span className="text-xs text-slate-400 font-bold">vs</span>
                  <span className="text-xs font-bold text-slate-900">
                    {m.player2.countryFlag} {m.player2.name}
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500">
                  <span className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatDuration(m.totalDurationSeconds)}</span>
                  </span>
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-semibold">
                    {m.matchFormat === 'BEST_OF_5' ? 'Best of 5' : 'Best of 3'}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-base font-black text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                  {m.p1SetsWon} : {m.p2SetsWon}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Top Players Highlight (Court Leaders - 16px Card Radius) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">Court Leaders</h3>
          <button
            onClick={() => setActiveTab('players')}
            className="text-xs font-bold text-slate-900 hover:underline flex items-center"
          >
            <span>All Profiles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ios-card rounded-2xl divide-y divide-slate-100 p-0 overflow-hidden">
          {topPlayers.map((player) => {
            const winRate =
              player.totalMatches > 0
                ? Math.round((player.wins / player.totalMatches) * 100)
                : 0;

            return (
              <div
                key={player.id}
                className="p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs"
                    style={{ backgroundColor: player.avatarBgColor }}
                  >
                    {player.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-sm font-bold text-slate-900">
                        {player.name}
                      </span>
                      <span className="text-xs">{player.countryFlag}</span>
                      <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-lg">
                        {player.skillGrade}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {player.wins}W / {player.losses}L • Win Rate {winRate}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Club Statistics (16px Card Radius, 12px Sub-tile Radius) */}
      <div className="ios-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center space-x-1 truncate">
              <span>{activeClub.name} Stats</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{activeClub.city}, {activeClub.country}</p>
          </div>

          <button
            onClick={openAdvancedStatsModal}
            className="text-xs font-bold text-slate-900 hover:bg-slate-200 flex items-center space-x-1 bg-slate-100 px-2.5 py-1 rounded-xl transition-colors flex-shrink-0"
          >
            <BarChart3 className="w-3.5 h-3.5 text-amber-500" />
            <span>Full Stats</span>
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <p className="text-lg font-black text-slate-900">{matches.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Club Matches</p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <p className="text-lg font-black text-amber-500">{players.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Club Roster</p>
          </div>

          {/* Dynamic Highlight Fact Tile (12px Radius) */}
          <div className="bg-amber-50 p-2 rounded-xl border border-amber-200 flex flex-col justify-between items-center text-center overflow-hidden min-h-[64px]">
            <p className="text-[9px] font-black uppercase tracking-wider text-amber-800 leading-tight">
              {randomFact?.subtitle || '🔥 Win Rate'}
            </p>

            <div className="my-auto py-0.5 w-full">
              <div className="flex items-center justify-center space-x-1">
                <span className="text-xs">{randomFact?.flag}</span>
                <span className="text-[11px] font-black text-slate-900 leading-none">
                  {randomFact?.firstName}
                </span>
              </div>
              {randomFact?.lastName && (
                <span className="text-[10px] font-extrabold text-slate-800 leading-tight block mt-0.5">
                  {randomFact?.lastName}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 4. Tips from Letty Card (Positioned at bottom of main feed) */}
      <LettyBanner variant="tips" />

      {/* Small Compact Button Row to Add Player Profile (Bottom string row) */}
      <div className="text-center pt-2">
        <button
          onClick={openAddPlayerModal}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 hover:bg-slate-100 py-1.5 px-3 rounded-full transition-colors border border-dashed border-slate-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Player Profile</span>
        </button>
      </div>

      {/* Club Selector Modal */}
      <ClubSelectorModal
        isOpen={isClubSelectorOpen}
        activeClubId={activeClub.id}
        onSelectClub={(c) => setActiveClub(c)}
        onClose={() => setIsClubSelectorOpen(false)}
      />
    </div>
  );
};
