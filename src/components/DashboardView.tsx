import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { LettyBanner } from './LettyBanner';
import { ClubSelectorModal, CLUBS_LIST } from './ClubSelectorModal';
import type { Club, Player } from '../types/squash';
import { Play, Plus, Activity, ChevronRight, ChevronDown, Clock, Settings, Trophy, MapPin, Check } from 'lucide-react';
import { formatMatchDateGroup } from '../utils/dateUtils';
import { getPlayersForClub, getMatchesForClub } from '../utils/clubUtils';
import { getMatchWinnerId, sortMatchesByDateDesc } from '../utils/matchUtils';
import { computeClubRatings } from '../utils/ratingUtils';
import { getMatchMode } from '../utils/matchModeUtils';
import { COMPETITION_FORMAT_LABELS } from './NewCompetitionModal';

interface DashboardViewProps {
  openNewMatchModal: () => void;
  openNewCompetitionModal: () => void;
  openAddPlayerModal: () => void;
  openSettingsModal: () => void;
  openAdvancedStatsModal: () => void;
  openHowToPlayModal: () => void;
  openHowToUseAppModal?: () => void;
  openCompetitionsListModal: () => void;
  openCompetitionDetail: (competitionId: string) => void;
  onSelectPlayerProfile: (player: Player) => void;
  setActiveTab: (tab: 'home' | 'match' | 'players' | 'history') => void;
  selectMatchDetail: (matchId: string) => void;
  activeClub?: Club;
  onSelectClub?: (club: Club) => void;
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
  openHowToPlayModal,
  openHowToUseAppModal,
  openCompetitionsListModal,
  openCompetitionDetail,
  onSelectPlayerProfile,
  setActiveTab,
  selectMatchDetail,
  activeClub: propActiveClub,
  onSelectClub,
}) => {
  const { matches, players, competitions, activeMatchState } = useSquash();
  const activeCompetitions = competitions.filter((c) => c.status === 'ACTIVE');

  const [internalClub, setInternalClub] = useState<Club>(CLUBS_LIST[0]);
  const activeClub = propActiveClub || internalClub;

  const handleSelectClub = (club: Club) => {
    setInternalClub(club);
    if (onSelectClub) onSelectClub(club);
  };

  const [isClubSelectorOpen, setIsClubSelectorOpen] = useState<boolean>(false);

  // Retrieve players and matches belonging to active club
  const activePlayers = getPlayersForClub(players, activeClub.id);
  const clubMatches = getMatchesForClub(matches, activeClub.id);

  const recentMatches = sortMatchesByDateDesc(clubMatches).slice(0, 3);

  // Club Rating (see utils/ratingUtils.ts) is the single ranking used everywhere on this
  // screen — Court Leaders and the Spotlight card used to rank by two different metrics
  // (win count vs. win rate) and could disagree on who's "best"; now both agree.
  const clubRatings = computeClubRatings(activePlayers, clubMatches);
  const topPlayers = [...activePlayers]
    .sort((a, b) => (clubRatings[b.id]?.rating ?? 0) - (clubRatings[a.id]?.rating ?? 0))
    .slice(0, 3);

  // Calculate average match duration in minutes for active club
  const avgMatchDurationMins =
    clubMatches.length > 0
      ? Math.round(
          clubMatches.reduce((acc, m) => acc + m.totalDurationSeconds, 0) / clubMatches.length / 60
        )
      : 32;

  const spotlightLeader = topPlayers.length > 0
    ? {
        fullName: topPlayers[0].name,
        flag: topPlayers[0].countryFlag,
        subtitle: `Club Rating Leader (${Math.round(clubRatings[topPlayers[0].id]?.rating ?? 0)})`,
        icon: '👑',
        playerObj: topPlayers[0],
      }
    : null;

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      {/* Clean Top Header */}
      <div className="flex items-center justify-between pt-1 mb-1">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none flex items-center space-x-2">
            <span>Letty Squash</span>
            <SquashBallIcon className="w-6 h-6 inline-block" />
          </h1>

          {/* Clickable Club Selector */}
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

        {/* Settings Button */}
        <button
          onClick={openSettingsModal}
          className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Hero Mascot Banner */}
      <LettyBanner
        variant="home"
        onOpenHowToPlay={openHowToPlayModal}
        onOpenHowToUseApp={openHowToUseAppModal}
      />

      {/* Centered Main Actions Section */}
      <div className="flex flex-col items-center justify-center space-y-3 text-center pt-0 pb-1">
        <button
          onClick={openNewMatchModal}
          className="w-full min-h-[48px] py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 border border-slate-800"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Start New Match</span>
        </button>

        <button
          onClick={openNewCompetitionModal}
          className="w-full min-h-[48px] py-3.5 bg-white hover:bg-slate-50 text-slate-900 font-black text-sm rounded-2xl shadow-2xs border-2 border-slate-900 flex items-center justify-center space-x-2 transition-all active:scale-98"
        >
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Create Competition</span>
        </button>
      </div>

      {/* Active Game Alert Banner (if match in progress).
          Deliberately NOT using the shared .ios-card class here — it sets a near-opaque
          white `background` in app.css that (being equal CSS specificity to a single
          Tailwind class) was winning over `bg-slate-900` and silently painting this
          banner white, making the white/light-gray text on it unreadable. */}
      {activeMatchState && (() => {
        const { meta: liveModeMeta, competition: liveCompetition } = getMatchMode(activeMatchState.match, competitions);
        return (
        <div className="rounded-2xl bg-slate-900 text-white p-4 relative overflow-hidden shadow-lg border border-slate-800">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-4 translate-y-4">
            <Activity className="w-36 h-36" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center flex-wrap gap-1.5">
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                  Match Live • Game {activeMatchState.currentGameIndex || 1}
                </span>
                <span
                  className="bg-white/10 text-white text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-lg border border-white/15"
                  title={liveCompetition ? `Fixture of ${liveCompetition.name}` : liveModeMeta.label}
                >
                  {liveModeMeta.shortLabel}
                </span>
              </div>
              <span className="text-xs font-mono text-slate-300">
                {Math.floor(activeMatchState.timerSeconds / 60)}:
                {String(activeMatchState.timerSeconds % 60).padStart(2, '0')}
              </span>
            </div>
            {liveCompetition && (
              <p className="text-[11px] font-bold text-amber-400/90 -mt-1 mb-2 truncate">
                {liveCompetition.name}
              </p>
            )}

            <div className="flex items-center justify-between my-3">
              <div className="text-left">
                <p className="text-sm font-bold text-slate-100 flex items-center space-x-1">
                  <span>{activeMatchState.match.player1.countryFlag}</span>
                  <span>{activeMatchState.match.player1.name}</span>
                </p>
                <p className="text-2xl font-black text-amber-400">{activeMatchState.p1CurrentScore}</p>
              </div>

              <div className="px-3 py-1 bg-white/10 rounded-xl text-xs font-bold text-slate-300">
                {activeMatchState.match.p1GamesWon} : {activeMatchState.match.p2GamesWon}
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
        );
      })()}

      {/* Active Competitions Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Competitions</h3>
          <button
            onClick={openCompetitionsListModal}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center space-x-0.5 transition-colors"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activeCompetitions.length === 0 ? (
          <button
            onClick={openCompetitionsListModal}
            className="w-full ios-card rounded-2xl p-4 flex items-center justify-between text-left hover:border-slate-300 transition-colors"
          >
            <span className="text-xs font-semibold text-slate-400">
              No active competitions — view archive
            </span>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>
        ) : (
          <div className="space-y-2">
            {activeCompetitions.slice(0, 2).map((c) => (
              <button
                key={c.id}
                onClick={() => openCompetitionDetail(c.id)}
                className="w-full ios-card rounded-2xl p-3 flex items-center justify-between text-left hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Trophy className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-black text-slate-900 truncate">{c.name}</p>
                    <p className="text-[10px] text-slate-500 font-semibold">
                      {COMPETITION_FORMAT_LABELS[c.format] || c.format} • {c.participantIds.length} players
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 1. Recent Matches Activity (Standard Sports Scorecard Layout with Clear Winner Highlight) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Recent Matches</h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center space-x-0.5 transition-colors"
          >
            <span>Match Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2">
          {recentMatches.map((m) => {
            const matchWinnerId = getMatchWinnerId(m);
            const isP1Winner = matchWinnerId === m.player1.id;
            const isP2Winner = matchWinnerId === m.player2.id;
            const { meta: modeMeta, competition } = getMatchMode(m, competitions);

            return (
              <div
                key={m.id}
                onClick={() => selectMatchDetail(m.id)}
                className={`group ios-card rounded-2xl p-3 space-y-2 hover:border-slate-300 transition-colors cursor-pointer ${modeMeta.accentBorderClass}`}
              >
                {/* Match Mode Pill (one of 7 — Casual/Rated, or the Competition's format) */}
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider ${modeMeta.pillClasses}`}>
                    {modeMeta.shortLabel}
                  </span>
                  {competition && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCompetitionDetail(competition.id);
                      }}
                      className="flex items-center space-x-1 text-[10px] font-bold text-slate-500 hover:text-amber-700 transition-colors truncate max-w-[65%]"
                      title={`Open ${competition.name}`}
                    >
                      <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span className="truncate">{competition.name}</span>
                    </button>
                  )}
                </div>

                {/* Meta Header Row */}
                <div className="flex items-center justify-between text-[10px] text-slate-500 pb-1.5 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-slate-800 bg-amber-100/90 text-amber-900 px-2 py-0.5 rounded-lg">
                      {formatMatchDateGroup(m.date)}
                    </span>
                    <span className="flex items-center space-x-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDuration(m.totalDurationSeconds)}</span>
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg font-bold">
                      {m.matchFormat === 'BEST_OF_5' ? 'Best of 5' : 'Best of 3'}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0" />
                  </div>
                </div>

                {/* Scorecard Players & Score Rows */}
                <div className="space-y-1">
                  {/* Player 1 Row */}
                  <div
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                      isP1Winner
                        ? 'bg-amber-500/10 border border-amber-300/70 font-black text-slate-900'
                        : 'bg-slate-50/60 text-slate-600 font-semibold'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-xs">{m.player1.countryFlag}</span>
                      <span className="text-xs truncate">{m.player1.name}</span>
                      {isP1Winner && (
                        <span className="inline-flex items-center justify-center bg-amber-200/90 text-amber-950 p-0.5 rounded-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-black ${isP1Winner ? 'text-slate-900' : 'text-slate-400'}`}>
                      {m.p1GamesWon}
                    </span>
                  </div>

                  {/* Player 2 Row */}
                  <div
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                      isP2Winner
                        ? 'bg-amber-500/10 border border-amber-300/70 font-black text-slate-900'
                        : 'bg-slate-50/60 text-slate-600 font-semibold'
                    }`}
                  >
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className="text-xs">{m.player2.countryFlag}</span>
                      <span className="text-xs truncate">{m.player2.name}</span>
                      {isP2Winner && (
                        <span className="inline-flex items-center justify-center bg-amber-200/90 text-amber-950 p-0.5 rounded-md">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <span className={`text-sm font-black ${isP2Winner ? 'text-slate-900' : 'text-slate-400'}`}>
                      {m.p2GamesWon}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Top Players Highlight (Court Leaders) */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black text-slate-900 tracking-tight">Court Leaders</h3>
          <button
            onClick={() => setActiveTab('players')}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center space-x-0.5 transition-colors"
          >
            <span>All Profiles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ios-card rounded-2xl divide-y divide-slate-100 p-0 overflow-hidden">
          {topPlayers.map((player) => {
            const rating = clubRatings[player.id];

            return (
              <div
                key={player.id}
                onClick={() => onSelectPlayerProfile(player)}
                className="group p-3 flex items-center justify-between hover:bg-slate-50/80 transition-colors cursor-pointer"
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
                      <span className="text-xs font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                        {player.name}
                      </span>
                      <span className="text-xs">{player.countryFlag}</span>
                      <span className="text-[10px] text-amber-700 font-extrabold bg-amber-50 px-2 py-0.5 rounded-lg">
                        {player.skillGrade}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {player.wins}W / {player.losses}L
                      {rating && rating.ratedMatches > 0 && (
                        <> • {Math.round(rating.rating)} Club Rating</>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Active Club Statistics */}
      <div className="ios-card rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="min-w-0 pr-2">
            <h3 className="text-sm font-black text-slate-900 tracking-tight truncate">
              {activeClub.name} Stats
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold truncate">{activeClub.city}, {activeClub.country}</p>
          </div>

          <button
            onClick={openAdvancedStatsModal}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 inline-flex items-center space-x-0.5 transition-colors flex-shrink-0"
          >
            <span>Full Stats</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 3-Tile Aggregate Metrics Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <p className="text-lg font-black text-slate-900">{clubMatches.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Club Matches</p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <p className="text-lg font-black text-amber-500">{activePlayers.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Club Roster</p>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 flex flex-col justify-center">
            <p className="text-lg font-black text-slate-900">{avgMatchDurationMins} min</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Avg Match Duration</p>
          </div>
        </div>

        {/* Dedicated Separate "Club Spotlight Leader" Card */}
        {spotlightLeader && (
          <div
            onClick={() => spotlightLeader.playerObj && onSelectPlayerProfile(spotlightLeader.playerObj)}
            className="group bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 p-3 rounded-xl border border-amber-200/80 flex items-center justify-between cursor-pointer hover:border-amber-300 transition-colors"
          >
            <div className="flex items-center space-x-2.5 min-w-0">
              <span className="text-base flex-shrink-0">{spotlightLeader.icon}</span>
              <div className="min-w-0">
                <span className="text-[9px] font-black uppercase tracking-wider text-amber-800 block">
                  {spotlightLeader.subtitle}
                </span>
                <p className="text-xs font-bold text-slate-900 truncate">
                  {spotlightLeader.flag} {spotlightLeader.fullName}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1 flex-shrink-0">
              <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg">
                Profile
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 transition-transform" />
            </div>
          </div>
        )}
      </div>

      {/* 4. Tips from Letty Card */}
      <LettyBanner variant="tips" />

      {/* Small Compact Button Row to Add Player Profile */}
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
        onSelectClub={handleSelectClub}
        onClose={() => setIsClubSelectorOpen(false)}
      />
    </div>
  );
};
