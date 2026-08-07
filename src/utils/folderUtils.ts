import type { Player, SquashMatch } from '../types/squash';
import { getMatchWinnerId } from './matchUtils';

/**
 * Returns a player's folder id, or undefined if they haven't been filed into one.
 * Unlike the old club system, a player with no folder is a normal, expected state.
 */
export const getPlayerFolderId = (player: Player | undefined): string | undefined => {
  return player?.folderId;
};

/**
 * Computes dynamic player W/L statistics directly from real recorded matches in the log.
 */
export const computePlayerStats = (players: Player[], matches: SquashMatch[]): Player[] => {
  const completedMatches = matches.filter((m) => m.status === 'COMPLETED');

  return players.map((player) => {
    const playerMatches = completedMatches.filter(
      (m) => m.player1.id === player.id || m.player2.id === player.id
    );

    let wins = 0;
    let losses = 0;
    let decidedMatches = 0;

    playerMatches.forEach((m) => {
      const winnerId = getMatchWinnerId(m);
      // No decided outcome (e.g. saved early via "Save & Exit" while games were level) —
      // count it neither as a win nor a loss for either player.
      if (!winnerId) return;

      decidedMatches += 1;
      if (winnerId === player.id) {
        wins += 1;
      } else {
        losses += 1;
      }
    });

    return {
      ...player,
      totalMatches: decidedMatches,
      wins,
      losses,
    };
  });
};

/**
 * Filters players belonging to a specific folder
 */
export const getPlayersForFolder = (players: Player[], folderId: string): Player[] => {
  return players.filter((p) => getPlayerFolderId(p) === folderId);
};

/**
 * Filters matches for a specific folder (matches where a member of that folder played)
 */
export const getMatchesForFolder = (matches: SquashMatch[], folderId: string): SquashMatch[] => {
  return matches.filter(
    (m) => getPlayerFolderId(m.player1) === folderId || getPlayerFolderId(m.player2) === folderId
  );
};
