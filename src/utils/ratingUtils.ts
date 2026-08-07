import type { Player, SquashMatch } from '../types/squash';

export interface ClubRatingEntry {
  playerId: string;
  rating: number;
  ratedMatches: number;
}

const BASE_RATING = 1000;
// Same scale ELO uses for its 400-point convention: a 400-point gap implies a 10:1
// expected-performance ratio between the two players.
const RATING_SCALE = 400;
// Faster convergence while a player's rating is still unproven, same idea as FIDE's
// provisional-rating period in chess.
const PROVISIONAL_K = 40;
const ESTABLISHED_K = 20;
const PROVISIONAL_MATCH_THRESHOLD = 10;
// How much of the "actual result" is points-ratio vs games-ratio. Weighing games in
// (not just raw points) stops someone who wins zero games but keeps every score close
// (e.g. loses 16-14, 16-14, 16-14) from scoring almost as well as an actual win.
const POINTS_WEIGHT = 0.5;
const GAMES_WEIGHT = 1 - POINTS_WEIGHT;

// Every player starts at the same base rating — there's no external grade to seed from
// (players are offline-only, self-added; see REWORK_TODO.md Phase 1). Ratings converge
// from actual rated match results instead, faster at first via PROVISIONAL_K.
const seedRating = (_player: Player): number => BASE_RATING;

/**
 * Computes each player's Club Rating from their rated match history — an ELO-style
 * system (see BACKEND_ARCHITECTURE.md discussion) where the "actual result" fed into the
 * update is a blend of points-ratio and games-ratio for the match, not just win/loss.
 * That means a narrow loss against a much stronger opponent (e.g. 14-16, 14-16, 14-16)
 * can still increase a player's rating, while a blowout loss decreases it — margin of
 * performance matters, not just who technically won the match.
 *
 * Order-dependent: unlike win/loss counts, a rating depends on the sequence of results,
 * so matches are always processed oldest-first regardless of the input order.
 *
 * Only matches with `isRated: true` participate — casual quick matches never affect this.
 */
export const computeClubRatings = (
  players: Player[],
  matches: SquashMatch[]
): Record<string, ClubRatingEntry> => {
  const ratings: Record<string, ClubRatingEntry> = {};
  players.forEach((p) => {
    ratings[p.id] = { playerId: p.id, rating: seedRating(p), ratedMatches: 0 };
  });

  const ratedMatches = matches
    .filter((m) => m.status === 'COMPLETED' && m.isRated)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const match of ratedMatches) {
    const p1 = ratings[match.player1.id];
    const p2 = ratings[match.player2.id];
    if (!p1 || !p2) continue; // a participant was removed from the roster since

    const totalGames = match.p1GamesWon + match.p2GamesWon;
    const totalPoints = match.games.reduce((acc, g) => acc + g.p1Score + g.p2Score, 0);
    if (totalGames === 0 || totalPoints === 0) continue; // nothing to rate

    const p1PointsWon = match.games.reduce((acc, g) => acc + g.p1Score, 0);
    const pointsRatioP1 = p1PointsWon / totalPoints;
    const gamesRatioP1 = match.p1GamesWon / totalGames;
    const performanceP1 = POINTS_WEIGHT * pointsRatioP1 + GAMES_WEIGHT * gamesRatioP1;

    const expectedP1 = 1 / (1 + Math.pow(10, (p2.rating - p1.rating) / RATING_SCALE));

    const kP1 = p1.ratedMatches < PROVISIONAL_MATCH_THRESHOLD ? PROVISIONAL_K : ESTABLISHED_K;
    const kP2 = p2.ratedMatches < PROVISIONAL_MATCH_THRESHOLD ? PROVISIONAL_K : ESTABLISHED_K;

    p1.rating += kP1 * (performanceP1 - expectedP1);
    p2.rating += kP2 * ((1 - performanceP1) - (1 - expectedP1));
    p1.ratedMatches += 1;
    p2.ratedMatches += 1;
  }

  return ratings;
};
