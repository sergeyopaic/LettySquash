import type { SquashMatch } from '../types/squash';

/**
 * Single source of truth for "who won this match" — prefers the explicit winnerId,
 * falling back to whoever has more games won. Returns undefined for a match with no
 * decided outcome (e.g. saved early via "Save & Exit" while games were still level).
 */
export const getMatchWinnerId = (match: SquashMatch): string | undefined => {
  if (match.winnerId) return match.winnerId;
  if (match.p1GamesWon > match.p2GamesWon) return match.player1.id;
  if (match.p2GamesWon > match.p1GamesWon) return match.player2.id;
  return undefined;
};

/**
 * Sorts matches most-recent-first by their `date` field. Returns a new array.
 */
export const sortMatchesByDateDesc = (matches: SquashMatch[]): SquashMatch[] => {
  return [...matches].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};
