import React from 'react';
import type { Player } from '../types/squash';
import { useSquash } from '../context/SquashContext';
import { X, Trophy, Flame, Activity, Clock } from 'lucide-react';

interface PlayerProfileModalProps {
  player: Player | null;
  onClose: () => void;
  onSelectMatchDetail?: (matchId: string) => void;
}

export const PlayerProfileModal: React.FC<PlayerProfileModalProps> = ({
  player,
  onClose,
  onSelectMatchDetail,
}) => {
  const { matches } = useSquash();

  if (!player) return null;

  const winRate =
    player.totalMatches > 0
      ? Math.round((player.wins / player.totalMatches) * 100)
      : 0;

  // Filter completed matches involving this player
  const playerMatches = matches.filter(
    (m) => m.player1.id === player.id || m.player2.id === player.id
  );

  const formatDuration = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    return `${mins} min`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Player Profile Card
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Identity Hero Block */}
        <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div
            className="w-14 h-14 rounded-2xl text-white font-black text-xl flex items-center justify-center shadow-md flex-shrink-0 relative"
            style={{ backgroundColor: player.avatarBgColor }}
          >
            {player.name.charAt(0)}
            <span className="absolute -bottom-1 -right-1 text-sm bg-white p-0.5 rounded-full shadow-2xs">
              {player.countryFlag}
            </span>
          </div>

          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-black text-slate-900 truncate">
                {player.name}
              </h2>
              <span className="text-[10px] text-amber-700 font-extrabold bg-amber-100 px-2 py-0.5 rounded-lg flex-shrink-0">
                Grade {player.skillGrade}
              </span>
            </div>
            <p className="text-xs font-medium text-slate-500">
              {player.countryCode} • {player.handedness}-handed Player
            </p>
          </div>
        </div>

        {/* Player Performance Stats Grid */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
            <div className="flex items-center justify-center space-x-1 text-slate-900">
              <Activity className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-base font-black">{player.totalMatches}</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">Matches</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
            <div className="flex items-center justify-center space-x-1 text-slate-900">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-base font-black">{player.wins}W / {player.losses}L</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">Record</p>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5">
            <div className="flex items-center justify-center space-x-1 text-amber-600">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-base font-black">{winRate}%</span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">Win Rate</p>
          </div>
        </div>

        {/* Player Recent Matches History */}
        <div className="space-y-2 pt-1">
          <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
            Player Match History ({playerMatches.length})
          </h3>

          {playerMatches.length === 0 ? (
            <div className="p-4 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200">
              No recorded matches yet for {player.name}
            </div>
          ) : (
            <div className="space-y-2">
              {playerMatches.map((m) => {
                const isWinner = m.winnerId === player.id;
                const opponent = m.player1.id === player.id ? m.player2 : m.player1;

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onSelectMatchDetail) {
                        onClose();
                        onSelectMatchDetail(m.id);
                      }
                    }}
                    className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-2xl border border-slate-100 flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-slate-900">
                          vs {opponent.countryFlag} {opponent.name}
                        </span>
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg ${
                            isWinner
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {isWinner ? 'WON' : 'LOST'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(m.totalDurationSeconds)}</span>
                        </span>
                        <span>• {m.matchFormat === 'BEST_OF_5' ? 'Best of 5 Games' : 'Best of 3 Games'}</span>
                      </p>
                    </div>

                    <span className="text-sm font-black text-slate-900 bg-white px-2.5 py-1 rounded-xl shadow-2xs">
                      {m.p1GamesWon} : {m.p2GamesWon}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
