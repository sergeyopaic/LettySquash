import React, { useEffect } from 'react';
import type { SquashMatch, GameResult } from '../types/squash';
import { X, ShieldAlert, Clock, Calendar, Trophy } from 'lucide-react';
import { formatMatchDateGroup } from '../utils/dateUtils';

interface MatchDetailModalProps {
  match: SquashMatch | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (match) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match, onClose]);

  if (!match) return null;

  const player1 = match.player1 || { id: 'p1', name: 'Player 1', countryFlag: '🎾', avatarBgColor: '#0F172A', skillGrade: 'C1' };
  const player2 = match.player2 || { id: 'p2', name: 'Player 2', countryFlag: '🎾', avatarBgColor: '#0F172A', skillGrade: 'C1' };

  const isP1Winner = match.winnerId ? match.winnerId === player1.id : (match.p1GamesWon ?? 0) >= (match.p2GamesWon ?? 0);
  const winner = isP1Winner ? player1 : player2;

  const games = match.games || [];
  const decisions = match.decisions || [];

  const formatDuration = (totalSec: number = 0) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
                Official Match Scorecard
              </span>
              <span className="text-[10px] font-bold text-slate-500 flex items-center space-x-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>{formatMatchDateGroup(match.date)}</span>
              </span>
            </div>
            <h2 className="text-lg font-black text-slate-900 mt-1 leading-tight">
              Match Report
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-2 cursor-pointer"
            aria-label="Close match details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Winner Hero Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-4 text-white flex items-center justify-between shadow-md border border-slate-800">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md">
              MATCH CHAMPION 🏆
            </span>
            <h3 className="text-xl font-black text-white flex items-center space-x-1.5 pt-0.5">
              <span>{winner.countryFlag}</span>
              <span>{winner.name}</span>
            </h3>
            <p className="text-xs font-bold text-amber-300">
              Games Won: {match.p1GamesWon ?? 0} - {match.p2GamesWon ?? 0} • {match.matchFormat === 'BEST_OF_5' ? 'Best of 5' : 'Best of 3'}
            </p>
          </div>

          <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-lg flex-shrink-0">
            <Trophy className="w-6 h-6 fill-current" />
          </div>
        </div>

        {/* Scorecard Players Comparison */}
        <div className="ios-card p-4 grid grid-cols-2 gap-3 divide-x divide-slate-100 relative">
          {/* Player 1 Column */}
          <div className="flex flex-col items-center text-center space-y-1.5 pr-2">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md"
                style={{ backgroundColor: player1.avatarBgColor || '#0F172A' }}
              >
                {player1.name ? player1.name.charAt(0) : 'P'}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {player1.countryFlag}
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{player1.name}</p>
              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                Grade {player1.skillGrade}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-3xl font-black text-slate-900">{match.p1GamesWon ?? 0}</span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Games</span>
            </div>
          </div>

          {/* Player 2 Column */}
          <div className="flex flex-col items-center text-center space-y-1.5 pl-2">
            <div className="relative">
              <div
                className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md"
                style={{ backgroundColor: player2.avatarBgColor || '#0F172A' }}
              >
                {player2.name ? player2.name.charAt(0) : 'P'}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {player2.countryFlag}
              </span>
            </div>

            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900 line-clamp-1">{player2.name}</p>
              <span className="text-[9px] font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                Grade {player2.skillGrade}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-3xl font-black text-slate-900">{match.p2GamesWon ?? 0}</span>
              <span className="text-[10px] text-slate-400 font-bold block uppercase">Games</span>
            </div>
          </div>
        </div>

        {/* Game Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
              Completed Games Breakdown
            </h4>
            <span className="text-[10px] font-semibold text-slate-500 flex items-center space-x-1">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Total Duration: {formatDuration(match.totalDurationSeconds)}</span>
            </span>
          </div>

          <div className="space-y-1.5">
            {games.length === 0 ? (
              <div className="p-3 bg-slate-50 rounded-2xl text-center text-xs text-slate-400">
                No game stats recorded for this match
              </div>
            ) : (
              games.map((g: GameResult) => {
                const isP1GameWinner = g.winnerId === player1.id || g.p1Score > g.p2Score;
                const gameWinnerName = isP1GameWinner ? player1.name : player2.name;

                return (
                  <div
                    key={g.gameNumber}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="font-extrabold text-slate-900">Game #{g.gameNumber}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-black text-slate-900 text-sm bg-white px-2.5 py-0.5 rounded-lg border border-slate-200/80 shadow-2xs">
                        {g.p1Score} - {g.p2Score}
                      </span>

                      <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Winner: {gameWinnerName}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Referee Decision Logs if any */}
        {decisions && decisions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase px-1">
              Referee Appeals Log
            </h4>
            <div className="space-y-1.5">
              {decisions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2.5 bg-amber-50/50 rounded-xl border border-amber-100 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="font-bold text-slate-800">
                      {d.decision === 'YES_LET' ? 'YES LET (Replay)' : d.decision === 'STROKE' ? 'STROKE (Point Awarded)' : 'NO LET (Denied)'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200/60">
                    Game {d.gameIndex} ({d.p1Score}-{d.p2Score})
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors cursor-pointer"
          >
            Close Scorecard Report
          </button>
        </div>
      </div>
    </div>
  );
};

