import type { Player, SquashMatch } from '../types/squash';

/**
 * Returns a guaranteed clubId for any player object,
 * using fallback mapping if player.clubId is undefined.
 */
export const getPlayerClubId = (player: Player | undefined): string => {
  if (!player) return 'c1';
  if (player.clubId) return player.clubId;

  const id = player.id;
  if (id.startsWith('dev') || id === 'p9' || id === 'p10') return 'c1'; // Devonport
  if (id.startsWith('syd')) return 'c4'; // Sydney
  if (['p2', 'p3', 'p5', 'p7'].includes(id)) return 'c3'; // Belmont
  return 'c2'; // Remuera (default fallback)
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

    playerMatches.forEach((m) => {
      const isP1 = m.player1.id === player.id;
      const isWinner = m.winnerId
        ? m.winnerId === player.id
        : isP1
        ? m.p1GamesWon > m.p2GamesWon
        : m.p2GamesWon > m.p1GamesWon;

      if (isWinner) {
        wins += 1;
      } else {
        losses += 1;
      }
    });

    return {
      ...player,
      totalMatches: playerMatches.length,
      wins,
      losses,
    };
  });
};

/**
 * Filters players belonging to a specific club
 */
export const getPlayersForClub = (players: Player[], clubId: string): Player[] => {
  return players.filter((p) => getPlayerClubId(p) === clubId);
};

/**
 * Filters matches for a specific club (internal matches + interclub matches where a club member played)
 */
export const getMatchesForClub = (matches: SquashMatch[], clubId: string): SquashMatch[] => {
  return matches.filter(
    (m) => getPlayerClubId(m.player1) === clubId || getPlayerClubId(m.player2) === clubId
  );
};
