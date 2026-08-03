import type { Competition, SquashMatch } from '../types/squash';
import { getMatchWinnerId } from './matchUtils';

export interface StandingRow {
  playerId: string;
  played: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  pointsWon: number;
  pointsLost: number;
}

/**
 * League table computed from completed matches, never stored — same "derive, don't
 * duplicate" pattern as fixture-played status. Every participant gets a row (even 0
 * played), so the table doesn't shrink as the tour progresses.
 *
 * Sort: wins desc, then game difference desc, then point difference desc — the standard
 * round-robin tiebreak order (games/points only matter once win counts are equal).
 */
export const computeLeagueStandings = (competition: Competition, matches: SquashMatch[]): StandingRow[] => {
  const rows = new Map<string, StandingRow>();
  for (const playerId of competition.participantIds) {
    rows.set(playerId, {
      playerId,
      played: 0,
      wins: 0,
      losses: 0,
      gamesWon: 0,
      gamesLost: 0,
      pointsWon: 0,
      pointsLost: 0,
    });
  }

  const relevantMatches = matches.filter((m) => m.competitionId === competition.id && m.status === 'COMPLETED');

  for (const match of relevantMatches) {
    const winnerId = getMatchWinnerId(match);
    for (const [selfId, oppId] of [
      [match.player1.id, match.player2.id],
      [match.player2.id, match.player1.id],
    ] as const) {
      const row = rows.get(selfId);
      if (!row || !rows.has(oppId)) continue;

      const selfGames = selfId === match.player1.id ? match.p1GamesWon : match.p2GamesWon;
      const oppGames = selfId === match.player1.id ? match.p2GamesWon : match.p1GamesWon;
      const selfPoints = match.games.reduce(
        (sum, g) => sum + (selfId === match.player1.id ? g.p1Score : g.p2Score),
        0
      );
      const oppPoints = match.games.reduce(
        (sum, g) => sum + (selfId === match.player1.id ? g.p2Score : g.p1Score),
        0
      );

      row.played += 1;
      row.gamesWon += selfGames;
      row.gamesLost += oppGames;
      row.pointsWon += selfPoints;
      row.pointsLost += oppPoints;
      if (winnerId === selfId) row.wins += 1;
      else if (winnerId === oppId) row.losses += 1;
    }
  }

  return [...rows.values()].sort((a, b) => {
    if (b.wins !== a.wins) return b.wins - a.wins;
    const gameDiffA = a.gamesWon - a.gamesLost;
    const gameDiffB = b.gamesWon - b.gamesLost;
    if (gameDiffB !== gameDiffA) return gameDiffB - gameDiffA;
    const pointDiffA = a.pointsWon - a.pointsLost;
    const pointDiffB = b.pointsWon - b.pointsLost;
    return pointDiffB - pointDiffA;
  });
};
