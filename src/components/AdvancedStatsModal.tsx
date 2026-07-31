import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { X, Trophy, Flame, Target, Activity, MapPin } from 'lucide-react';

interface AdvancedStatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type SortField = 'WIN_RATE' | 'WINS' | 'POINTS_WON_PCT' | 'TOTAL_MATCHES';

export const AdvancedStatsModal: React.FC<AdvancedStatsModalProps> = ({ isOpen, onClose }) => {
  const { players, matches } = useSquash();
  const [sortField, setSortField] = useState<SortField>('WIN_RATE');

  if (!isOpen) return null;

  // Calculate detailed points stats for each player across all completed matches
  const playerStats = players.map((p) => {
    let totalPointsScored = 0;
    let totalPointsConceded = 0;

    matches.forEach((m) => {
      if (m.status === 'COMPLETED') {
        m.sets.forEach((s) => {
          if (m.player1.id === p.id) {
            totalPointsScored += s.p1Score;
            totalPointsConceded += s.p2Score;
          } else if (m.player2.id === p.id) {
            totalPointsScored += s.p2Score;
            totalPointsConceded += s.p1Score;
          }
        });
      }
    });

    const totalPointsPlayed = totalPointsScored + totalPointsConceded;
    const pointsWonPct = totalPointsPlayed > 0 ? Math.round((totalPointsScored / totalPointsPlayed) * 1000) / 10 : 0;
    const winRate = p.totalMatches > 0 ? Math.round((p.wins / p.totalMatches) * 1000) / 10 : 0;

    return {
      ...p,
      winRate,
      totalPointsScored,
      totalPointsConceded,
      pointsWonPct,
    };
  });

  // Sort players dynamically based on selected tab
  const sortedPlayers = [...playerStats].sort((a, b) => {
    if (sortField === 'WIN_RATE') return b.winRate - a.winRate;
    if (sortField === 'WINS') return b.wins - a.wins;
    if (sortField === 'POINTS_WON_PCT') return b.pointsWonPct - a.pointsWonPct;
    if (sortField === 'TOTAL_MATCHES') return b.totalMatches - a.totalMatches;
    return 0;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-1.5 text-xs font-bold text-amber-600">
              <MapPin className="w-3.5 h-3.5" />
              <span>Devonport Squash Club • Auckland</span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-0.5">
              Club Analytics & Leaderboard
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sorting Tabs */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px] font-bold text-slate-600">
          <button
            onClick={() => setSortField('WIN_RATE')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              sortField === 'WIN_RATE'
                ? 'bg-white text-blue-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Flame className="w-3 h-3 text-amber-500" />
            <span>Win Rate %</span>
          </button>

          <button
            onClick={() => setSortField('WINS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              sortField === 'WINS'
                ? 'bg-white text-blue-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>Wins</span>
          </button>

          <button
            onClick={() => setSortField('POINTS_WON_PCT')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              sortField === 'POINTS_WON_PCT'
                ? 'bg-white text-blue-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Target className="w-3 h-3 text-emerald-500" />
            <span>Pts Won %</span>
          </button>

          <button
            onClick={() => setSortField('TOTAL_MATCHES')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              sortField === 'TOTAL_MATCHES'
                ? 'bg-white text-blue-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Activity className="w-3 h-3 text-blue-500" />
            <span>Matches</span>
          </button>
        </div>

        {/* Players List Table */}
        <div className="space-y-2">
          {sortedPlayers.map((p, index) => {
            const rank = index + 1;
            const isRookie = p.totalMatches === 0;

            return (
              <div
                key={p.id}
                className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between hover:bg-slate-100/80 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="w-6 text-center text-xs font-black text-slate-400">
                    #{rank}
                  </span>

                  <div className="relative">
                    <div
                      className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs"
                      style={{ backgroundColor: p.avatarBgColor }}
                    >
                      {p.name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-[10px]">
                      {p.countryFlag}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <span className="text-xs font-bold text-slate-900">{p.name}</span>
                      <span className="text-[9px] text-amber-700 font-extrabold bg-amber-100 px-1.5 py-0.5 rounded">
                        {p.skillGrade}
                      </span>
                    </div>

                    {isRookie ? (
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-md inline-block mt-0.5">
                        🌟 Rookie (0 matches)
                      </span>
                    ) : (
                      <p className="text-[10px] text-slate-500 mt-0.5">
                        {p.wins}W / {p.losses}L ({p.totalMatches} matches) • {p.totalPointsScored} pts scored
                      </p>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  {sortField === 'POINTS_WON_PCT' ? (
                    <div>
                      <span className="text-sm font-black text-emerald-600">
                        {p.pointsWonPct}%
                      </span>
                      <p className="text-[9px] text-slate-400 font-semibold">Points Won</p>
                    </div>
                  ) : sortField === 'WINS' ? (
                    <div>
                      <span className="text-sm font-black text-amber-600">
                        {p.wins} Wins
                      </span>
                      <p className="text-[9px] text-slate-400 font-semibold">{p.totalMatches} Matches</p>
                    </div>
                  ) : (
                    <div>
                      <span className="text-sm font-black text-blue-900">
                        {p.winRate}%
                      </span>
                      <p className="text-[9px] text-slate-400 font-semibold">Win Rate</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
