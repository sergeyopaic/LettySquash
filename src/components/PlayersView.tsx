import React from 'react';
import { useSquash } from '../context/SquashContext';
import type { Player } from '../types/squash';
import { Plus, Trash2, ChevronRight } from 'lucide-react';

interface PlayersViewProps {
  openAddPlayerModal: () => void;
  onSelectPlayerProfile?: (player: Player) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({ openAddPlayerModal, onSelectPlayerProfile }) => {
  const { players, deletePlayer } = useSquash();

  const getWinRate = (wins: number, total: number) => {
    if (!total) return '0%';
    return `${Math.round((wins / total) * 100)}%`;
  };

  return (
    <div className="pb-24 pt-2 px-4 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Players</h1>
          <p className="text-xs text-slate-500">{players.length} active profiles</p>
        </div>
        <button
          onClick={openAddPlayerModal}
          className="bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-sm transition-transform active:scale-95 border border-slate-800"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Add Player</span>
        </button>
      </div>

      <div className="space-y-3">
        {players.map((player) => {
          const winRate = getWinRate(player.wins, player.totalMatches);
          return (
            <div
              key={player.id}
              onClick={() => {
                if (onSelectPlayerProfile) onSelectPlayerProfile(player);
              }}
              className="group ios-card p-4 space-y-3 hover:border-slate-300 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div
                      className="w-12 h-12 rounded-2xl text-white font-black flex items-center justify-center text-lg shadow-md"
                      style={{ backgroundColor: player.avatarBgColor }}
                    >
                      {player.name.charAt(0)}
                    </div>
                    <span className="absolute -bottom-1 -right-1 text-sm bg-white rounded-full p-0.5 shadow-xs">
                      {player.countryFlag || '🇳🇿'}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center space-x-1.5">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-amber-700 transition-colors">
                        {player.name}
                      </h3>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-500 mt-0.5">
                      <span className="bg-slate-900 text-amber-400 font-extrabold px-2 py-0.5 rounded-lg">
                        {player.skillGrade}
                      </span>
                      <span>•</span>
                      <span>{player.handedness === 'Right' ? 'Right-handed' : 'Left-handed'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(`Delete profile for ${player.name}?`)) {
                        deletePlayer(player.id);
                      }
                    }}
                    className="text-slate-300 hover:text-rose-500 p-1.5 rounded-lg transition-colors mr-1"
                    title="Delete profile"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition-transform flex-shrink-0" />
                </div>
              </div>

              {/* Player Stats Grid */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-center">
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-400">Matches</p>
                  <p className="text-xs font-bold text-slate-800 mt-0.5">{player.totalMatches}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-xl">
                  <p className="text-[10px] font-semibold text-slate-400">Wins / Losses</p>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {player.wins} W / {player.losses} L
                  </p>
                </div>
                <div className="bg-amber-50 p-2 rounded-xl border border-amber-100">
                  <p className="text-[10px] font-semibold text-amber-800">Win Rate</p>
                  <p className="text-xs font-bold text-amber-900 mt-0.5">{winRate}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
