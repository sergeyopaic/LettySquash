import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { Clock, Trash2, Trophy } from 'lucide-react';

interface MatchHistoryViewProps {
  selectMatchDetail: (matchId: string) => void;
}

export const MatchHistoryView: React.FC<MatchHistoryViewProps> = ({ selectMatchDetail }) => {
  const { matches, deleteMatch } = useSquash();
  const [filterType, setFilterType] = useState<string>('ALL');

  const filteredMatches = matches.filter((m) => {
    if (filterType === 'ALL') return true;
    return m.matchType === filterType;
  });

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      <div>
        <h1 className="text-xl font-black text-slate-900 tracking-tight">Match History</h1>
        <p className="text-xs text-slate-500">{matches.length} recorded matches</p>
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
                ? 'bg-blue-900 text-amber-400 font-bold shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Match List */}
      <div className="space-y-3">
        {filteredMatches.length === 0 ? (
          <div className="ios-card p-8 text-center text-slate-400 space-y-2">
            <Trophy className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs">No matches found for selected filter</p>
          </div>
        ) : (
          filteredMatches.map((match) => (
            <div
              key={match.id}
              onClick={() => selectMatchDetail(match.id)}
              className="ios-card p-4 hover:shadow-md transition-all cursor-pointer space-y-3 border border-slate-100"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-100 pb-2">
                <div className="flex items-center space-x-2">
                  <span className="bg-slate-100 font-bold text-slate-700 px-2 py-0.5 rounded-md uppercase text-[9px]">
                    {match.matchType === 'FRIENDLY'
                      ? 'Friendly'
                      : match.matchType === 'TOURNAMENT'
                      ? 'Tournament'
                      : match.matchType === 'LEAGUE'
                      ? 'League'
                      : 'Practice'}
                  </span>
                  <span>{new Date(match.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>{formatDuration(match.totalDurationSeconds)}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this match record?')) {
                        deleteMatch(match.id);
                      }
                    }}
                    className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Match Players & Score */}
              <div className="flex items-center justify-between">
                {/* Player 1 */}
                <div className="flex-1 flex items-center space-x-2.5">
                  <div
                    className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm"
                    style={{ backgroundColor: match.player1.avatarBgColor }}
                  >
                    {match.player1.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      className={`text-xs flex items-center space-x-1 ${
                        match.winnerId === match.player1.id ? 'font-black text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      <span>{match.player1.countryFlag}</span>
                      <span>{match.player1.name}</span>
                    </p>
                    <p className="text-[10px] font-bold text-amber-600">{match.player1.skillGrade}</p>
                  </div>
                </div>

                {/* Score badge */}
                <div className="px-3.5 py-1.5 bg-blue-900 text-amber-400 rounded-xl font-mono font-black text-sm shadow-sm">
                  {match.p1SetsWon} : {match.p2SetsWon}
                </div>

                {/* Player 2 */}
                <div className="flex-1 flex items-center justify-end space-x-2.5">
                  <div className="text-right">
                    <p
                      className={`text-xs flex items-center justify-end space-x-1 ${
                        match.winnerId === match.player2.id ? 'font-black text-slate-900' : 'text-slate-500'
                      }`}
                    >
                      <span>{match.player2.name}</span>
                      <span>{match.player2.countryFlag}</span>
                    </p>
                    <p className="text-[10px] font-bold text-amber-600">{match.player2.skillGrade}</p>
                  </div>
                  <div
                    className="w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-sm"
                    style={{ backgroundColor: match.player2.avatarBgColor }}
                  >
                    {match.player2.name.charAt(0)}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
