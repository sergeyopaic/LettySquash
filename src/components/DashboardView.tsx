import React from 'react';
import { useSquash } from '../context/SquashContext';
import { LettyBanner } from './LettyBanner';
import { Play, Plus, Activity, ChevronRight, Clock, Settings, Trophy } from 'lucide-react';

interface DashboardViewProps {
  openNewMatchModal: () => void;
  openNewCompetitionModal: () => void;
  openAddPlayerModal: () => void;
  openSettingsModal: () => void;
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
  setActiveTab,
  selectMatchDetail,
}) => {
  const { matches, players, activeMatchState } = useSquash();

  const recentMatches = matches.slice(0, 3);
  const topPlayers = [...players].sort((a, b) => b.wins - a.wins).slice(0, 3);

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-widest">
              Squash Scorekeeper
            </span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            Letty Squash
          </h1>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={openSettingsModal}
            className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center shadow-md">
            <SquashBallIcon className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Mascot Banner */}
      <LettyBanner variant="home" />

      {/* Active Game Alert Banner (if match in progress) */}
      {activeMatchState && (
        <div className="ios-card bg-gradient-to-r from-blue-900 to-slate-800 text-white p-4 relative overflow-hidden shadow-lg border-none">
          <div className="absolute right-0 bottom-0 opacity-15 translate-x-4 translate-y-4">
            <Activity className="w-36 h-36" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="bg-amber-400 text-blue-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full">
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

              <div className="px-3 py-1 bg-white/10 rounded-lg text-xs font-bold text-slate-300">
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
              className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-blue-950 font-bold rounded-xl text-sm flex items-center justify-center space-x-2 transition-transform active:scale-98 shadow-sm"
            >
              <span>Resume Refereeing</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Action Callouts: New Match (Left) & New Competition (Right) */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={openNewMatchModal}
          className="ios-card p-4 text-left flex flex-col justify-between hover:border-blue-900/30 transition-all group shadow-sm bg-gradient-to-br from-white to-blue-50/50"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
            <Play className="w-5 h-5 fill-current ml-0.5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">New Match</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Start & referee game</p>
          </div>
        </button>

        <button
          onClick={openNewCompetitionModal}
          className="ios-card p-4 text-left flex flex-col justify-between hover:border-amber-500/30 transition-all group shadow-sm bg-gradient-to-br from-white to-amber-50/40"
        >
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mb-3 shadow-md group-hover:scale-105 transition-transform">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">New Competition</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">League, Playoff & Cups</p>
          </div>
        </button>
      </div>

      {/* Overview Stats */}
      <div className="ios-card p-4 space-y-3">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Club Statistics
        </h3>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-lg font-black text-blue-900">{matches.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Total Matches</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-lg font-black text-amber-600">{players.length}</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">Players</p>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
            <p className="text-lg font-black text-emerald-600">Squash NZ</p>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5">A1 – J4 Grades</p>
          </div>
        </div>
      </div>

      {/* Top Players Highlight */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">Court Leaders</h3>
          <button
            onClick={() => setActiveTab('players')}
            className="text-xs font-semibold text-blue-900 hover:underline flex items-center"
          >
            <span>All Profiles</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="ios-card divide-y divide-slate-100 p-0 overflow-hidden">
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
                      <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded">
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

      {/* Recent Matches Activity */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-bold text-slate-900">Recent Matches</h3>
          <button
            onClick={() => setActiveTab('history')}
            className="text-xs font-semibold text-blue-900 hover:underline flex items-center"
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
              className="ios-card p-3 flex items-center justify-between hover:border-slate-300 transition-colors cursor-pointer"
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
                  <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-semibold">
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

      {/* Small Compact Button Row to Add Player Profile (Bottom string row) */}
      <div className="text-center pt-2">
        <button
          onClick={openAddPlayerModal}
          className="inline-flex items-center space-x-1.5 text-xs font-semibold text-slate-500 hover:text-blue-900 hover:bg-slate-100 py-1.5 px-3 rounded-full transition-colors border border-dashed border-slate-200"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add New Player Profile</span>
        </button>
      </div>
    </div>
  );
};
