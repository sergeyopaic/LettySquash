import React, { useEffect } from 'react';
import type { Player } from '../types/squash';
import { useSquash } from '../context/SquashContext';
import { getPlayerClubId, getPlayersForClub, getMatchesForClub } from '../utils/clubUtils';
import { sortMatchesByDateDesc } from '../utils/matchUtils';
import { computeClubRatings } from '../utils/ratingUtils';
import { CLUBS_LIST } from './ClubSelectorModal';
import { X, Trophy, Flame, Activity, Clock, MapPin, TrendingUp } from 'lucide-react';

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
  const { players, matches } = useSquash();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (player) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player, onClose]);

  if (!player) return null;

  const winRate =
    player.totalMatches > 0
      ? Math.round((player.wins / player.totalMatches) * 100)
      : 0;

  const playerClubId = getPlayerClubId(player);
  const club = CLUBS_LIST.find((c) => c.id === playerClubId);

  // Club Rating is relative to the rest of the club, so it's computed from the club's
  // full roster/match history, not just this one player.
  const clubRatings = computeClubRatings(
    getPlayersForClub(players, playerClubId),
    getMatchesForClub(matches, playerClubId)
  );
  const clubRating = clubRatings[player.id];

  // Filter completed matches involving this player, most recent first
  const playerMatches = sortMatchesByDateDesc(
    matches.filter(
      (m) => (m.player1 && m.player1.id === player.id) || (m.player2 && m.player2.id === player.id)
    )
  );

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
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black uppercase tracking-wider text-slate-400">
            Player Profile Card
          </span>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Player Identity Hero Block */}
        <div className="flex items-center space-x-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <div
            className="w-14 h-14 rounded-2xl text-white font-black text-xl flex items-center justify-center shadow-md flex-shrink-0 relative"
            style={{ backgroundColor: player.avatarBgColor || '#0F172A' }}
          >
            {player.name ? player.name.charAt(0) : 'P'}
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
            {club && (
              <p className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 pt-0.5">
                <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                <span className="truncate">{club.name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Player Performance Stats Grid */}
        <div className="grid grid-cols-2 gap-2 text-center">
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

          <div
            className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-0.5"
            title="Club Rating — calculated from rated matches recorded in this app. Not an official NZ Squash rating."
          >
            <div className="flex items-center justify-center space-x-1 text-blue-700">
              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-base font-black">
                {clubRating.ratedMatches > 0 ? Math.round(clubRating.rating) : 'New'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500">Club Rating</p>
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
                const p1 = m.player1 || { id: 'p1', name: 'Player 1', countryFlag: '🇳🇿' };
                const p2 = m.player2 || { id: 'p2', name: 'Player 2', countryFlag: '🇳🇿' };
                const isP1 = p1.id === player.id;
                const opponent = isP1 ? p2 : p1;

                // Games won from this player's perspective, not raw p1/p2 order
                const playerGamesWon = isP1 ? m.p1GamesWon ?? 0 : m.p2GamesWon ?? 0;
                const opponentGamesWon = isP1 ? m.p2GamesWon ?? 0 : m.p1GamesWon ?? 0;
                // No winnerId and level games (e.g. saved early via "Save & Exit") means
                // no decided outcome — don't show it as a loss for either player.
                const isDecided = Boolean(m.winnerId) || playerGamesWon !== opponentGamesWon;
                const isWinner = m.winnerId
                  ? m.winnerId === player.id
                  : playerGamesWon > opponentGamesWon;

                return (
                  <div
                    key={m.id}
                    onClick={() => {
                      if (onSelectMatchDetail) {
                        onClose();
                        onSelectMatchDetail(m.id);
                      }
                    }}
                    className={`p-3 rounded-2xl border flex items-center justify-between transition-colors cursor-pointer ${
                      !isDecided
                        ? 'bg-slate-50 border-slate-200 hover:bg-slate-100/80'
                        : isWinner
                        ? 'bg-emerald-50/60 border-emerald-200 hover:bg-emerald-50'
                        : 'bg-rose-50/50 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] font-extrabold px-2 py-0.5 rounded-lg flex-shrink-0 ${
                            !isDecided
                              ? 'bg-slate-200 text-slate-600'
                              : isWinner
                              ? 'bg-emerald-100 text-emerald-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          {!isDecided ? 'NO RESULT' : isWinner ? 'WON' : 'LOST'}
                        </span>
                        <span className="text-xs font-bold text-slate-900 truncate">
                          vs {opponent.countryFlag} {opponent.name}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 flex items-center space-x-2">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDuration(m.totalDurationSeconds || 0)}</span>
                        </span>
                        <span>• {m.matchFormat === 'BEST_OF_5' ? 'Best of 5 Games' : 'Best of 3 Games'}</span>
                      </p>
                    </div>

                    <span
                      className={`text-sm font-black px-2.5 py-1 rounded-xl shadow-2xs flex-shrink-0 ${
                        isDecided && isWinner ? 'bg-emerald-500 text-white' : 'bg-white text-slate-900'
                      }`}
                      title={`${player.name} ${playerGamesWon} - ${opponentGamesWon} ${opponent.name}`}
                    >
                      {playerGamesWon} - {opponentGamesWon}
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
