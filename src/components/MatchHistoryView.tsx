import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { Clock, Trash2, Trophy, Calendar, Check } from 'lucide-react';
import { formatMatchDateGroup, formatMatchTime } from '../utils/dateUtils';
import type { SquashMatch, Club } from '../types/squash';
import { getMatchesForClub } from '../utils/clubUtils';
import { sortMatchesByDateDesc } from '../utils/matchUtils';

interface MatchHistoryViewProps {
  selectMatchDetail: (matchId: string) => void;
  activeClub?: Club;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({ selectMatchDetail, activeClub }) => {
  const { matches, deleteMatch } = useSquash();
  const [filterType, setFilterType] = useState<string>('ALL');

  const clubMatches = activeClub ? getMatchesForClub(matches, activeClub.id) : matches;

  const filteredMatches = sortMatchesByDateDesc(clubMatches).filter((m) => {
    if (filterType === 'ALL') return true;
    return m.matchType === filterType;
  });

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  // Group matches by date label (Today, Yesterday, 28 Jul, etc.)
  const groupedMatches = filteredMatches.reduce<Record<string, SquashMatch[]>>((acc, match) => {
    const groupLabel = formatMatchDateGroup(match.date);
    if (!acc[groupLabel]) acc[groupLabel] = [];
    acc[groupLabel].push(match);
    return acc;
  }, {});

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">History</h1>
        <p className="text-xs text-slate-500">{clubMatches.length} recorded matches</p>
      </div>

      {/* Filter Chips */}
      <div className="flex space-x-2 overflow-x-auto pb-1 no-scrollbar">
        {[
          { id: 'ALL', label: 'All Matches' },
          { id: 'FRIENDLY', label: 'Friendly' },
          { id: 'TOURNAMENT', label: 'Tournament' },
          { id: 'LEAGUE', label: 'League' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setFilterType(chip.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterType === chip.id
                ? 'bg-slate-900 text-amber-400 font-bold shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Grouped Match List by Date */}
      {Object.keys(groupedMatches).length === 0 ? (
        <div className="ios-card p-8 text-center text-slate-400 space-y-2">
          <Trophy className="w-10 h-10 mx-auto text-slate-300" />
          <p className="text-xs font-semibold">No matches recorded for selected filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedMatches).map(([dateGroup, groupMatches]) => (
            <div key={dateGroup} className="space-y-2">
              {/* Date Group Header Banner */}
              <div className="flex items-center space-x-2 px-1 pt-1">
                <Calendar className="w-3.5 h-3.5 text-amber-500" />
                <h2 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  {dateGroup}
                </h2>
                <div className="flex-1 h-[1px] bg-slate-200" />
              </div>

              {/* Match Items under Date Group */}
              <div className="space-y-2">
                {groupMatches.map((match) => {
                  const p1 = match.player1 || { id: 'p1', name: 'Player 1', countryFlag: '🇳🇿' };
                  const p2 = match.player2 || { id: 'p2', name: 'Player 2', countryFlag: '🇳🇿' };
                  const p1Games = match.p1GamesWon ?? 0;
                  const p2Games = match.p2GamesWon ?? 0;
                  // Same winnerId → games-won priority as getMatchWinnerId, inlined here
                  // to keep working with the defensive p1/p2 fallback objects above.
                  const matchWinnerId =
                    match.winnerId ?? (p1Games > p2Games ? p1.id : p2Games > p1Games ? p2.id : undefined);
                  const isP1Winner = matchWinnerId === p1.id;
                  const isP2Winner = matchWinnerId === p2.id;

                  return (
                    <div
                      key={match.id}
                      onClick={() => selectMatchDetail(match.id)}
                      className="group ios-card p-3.5 hover:border-slate-300 transition-colors cursor-pointer space-y-2 rounded-2xl border border-slate-200/90"
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-100 pb-2">
                        <div className="flex items-center space-x-2">
                          <span className="bg-slate-900 text-amber-400 font-extrabold px-2 py-0.5 rounded-lg text-[9px] uppercase tracking-wider">
                            {match.matchType === 'FRIENDLY'
                              ? 'Friendly'
                              : match.matchType === 'TOURNAMENT'
                              ? 'Tournament'
                              : match.matchType === 'LEAGUE'
                              ? 'League'
                              : 'Practice'}
                          </span>
                          <span className="font-semibold text-slate-600">
                            {formatMatchDateGroup(match.date)} • {formatMatchTime(match.date)}
                          </span>
                        </div>

                        <div className="flex items-center space-x-2">
                          <div className="flex items-center space-x-1 font-medium text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{formatDuration(match.totalDurationSeconds || 0)}</span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm('Delete this match record?')) {
                                deleteMatch(match.id);
                              }
                            }}
                            className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer"
                            title="Delete match"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Scorecard Players & Games Score Rows */}
                      <div className="space-y-1 pt-0.5">
                        {/* Player 1 Row */}
                        <div
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl transition-colors ${
                            isP1Winner
                              ? 'bg-amber-500/10 border border-amber-300/70 font-black text-slate-900'
                              : 'bg-slate-50/60 text-slate-600 font-semibold'
                          }`}
                        >
                          <div className="flex items-center space-x-2 min-w-0">
                            <span className="text-xs">{p1.countryFlag}</span>
                            <span className="text-xs truncate">{p1.name}</span>
                            {isP1Winner && (
                              <span className="inline-flex items-center justify-center bg-amber-200/90 text-amber-950 p-0.5 rounded-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-black ${isP1Winner ? 'text-slate-900' : 'text-slate-400'}`}>
                            {p1Games}
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
                            <span className="text-xs">{p2.countryFlag}</span>
                            <span className="text-xs truncate">{p2.name}</span>
                            {isP2Winner && (
                              <span className="inline-flex items-center justify-center bg-amber-200/90 text-amber-950 p-0.5 rounded-md">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </span>
                            )}
                          </div>
                          <span className={`text-sm font-black ${isP2Winner ? 'text-slate-900' : 'text-slate-400'}`}>
                            {p2Games}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
