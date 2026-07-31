import React from 'react';
import type { SquashMatch, GameResult } from '../types/squash';
import { X, Award, ShieldAlert } from 'lucide-react';

interface MatchDetailModalProps {
  match: SquashMatch | null;
  onClose: () => void;
}

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({ match, onClose }) => {
  if (!match) return null;

  const winnerName = match.winnerId === match.player1.id ? match.player1.name : match.player2.name;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <span className="text-[10px] font-bold text-slate-900 bg-amber-100 px-2 py-0.5 rounded-md uppercase">
              Match Details #{match.id.slice(-4)}
            </span>
            <h2 className="text-base font-black text-slate-900 mt-1">Match Summary Report</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Winner Hero Banner */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-2xl p-4 text-slate-950 flex items-center justify-between shadow-sm">
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-slate-900/80">Winner</p>
            <h3 className="text-lg font-black text-slate-950 mt-0.5">{winnerName}</h3>
            <p className="text-xs font-semibold text-slate-900/90 mt-0.5">
              Games Score {match.p1GamesWon} : {match.p2GamesWon}
            </p>
          </div>
          <Award className="w-10 h-10 text-slate-950/80" />
        </div>

        {/* Player Score Comparison */}
        <div className="ios-card p-4 flex items-center justify-between">
          <div className="text-center flex-1">
            <div className="relative inline-block mb-1">
              <div
                className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm"
                style={{ backgroundColor: match.player1.avatarBgColor }}
              >
                {match.player1.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {match.player1.countryFlag}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900">{match.player1.name}</p>
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {match.player1.skillGrade}
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{match.p1GamesWon}</p>
          </div>

          <div className="px-3 text-xs font-bold text-slate-400">VS</div>

          <div className="text-center flex-1">
            <div className="relative inline-block mb-1">
              <div
                className="w-10 h-10 rounded-full text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm"
                style={{ backgroundColor: match.player2.avatarBgColor }}
              >
                {match.player2.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs">
                {match.player2.countryFlag}
              </span>
            </div>
            <p className="text-xs font-bold text-slate-900">{match.player2.name}</p>
            <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
              {match.player2.skillGrade}
            </span>
            <p className="text-2xl font-black text-slate-900 mt-1">{match.p2GamesWon}</p>
          </div>
        </div>

        {/* Game Breakdown */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Game Breakdown</h4>
          <div className="space-y-1.5">
            {match.games.map((g: GameResult) => (
              <div
                key={g.gameNumber}
                className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs"
              >
                <span className="font-bold text-slate-700">Game {g.gameNumber}</span>
                <span className="font-mono font-bold text-slate-900">
                  {g.p1Score} : {g.p2Score}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  {Math.floor(g.durationSeconds / 60)} min
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Decision Logs */}
        {match.decisions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Referee Appeals & Decisions
            </h4>
            <div className="space-y-1.5">
              {match.decisions.map((d) => (
                <div
                  key={d.id}
                  className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-100 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span className="font-semibold text-slate-700">
                      {d.decision === 'YES_LET' ? 'YES LET' : d.decision === 'STROKE' ? 'STROKE' : 'NO LET'}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Game {d.gameIndex} • {d.p1Score}:{d.p2Score}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
