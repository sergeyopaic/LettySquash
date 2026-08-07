import type { CompetitionFixture, SquashMatch } from '../types/squash';
import { getMatchWinnerId } from './matchUtils';
import { computeStandingsForFixtures } from './standingsUtils';

/**
 * Single-leg round-robin via the standard "circle method": every participant plays every
 * other exactly once, split into rounds where nobody plays twice in the same round.
 *
 * - Even N -> N-1 rounds, N/2 matches per round, nobody sits out.
 * - Odd N -> N rounds, (N-1)/2 matches per round, exactly one participant has a bye each
 *   round (a virtual empty slot is added to make the pairing math work, then dropped).
 *
 * This is deliberately the real scheduling algorithm, not just "N-1 rounds" for every N —
 * that shortcut only holds for even N. Odd N needs a full N rounds to cover every pair.
 */
const generateSingleLeg = (participantIds: string[]): CompetitionFixture[] => {
  const BYE = null;
  const slots: (string | null)[] = [...participantIds];
  if (slots.length % 2 !== 0) slots.push(BYE);

  const n = slots.length;
  if (n < 2) return [];

  const totalRounds = n - 1;
  const fixtures: CompetitionFixture[] = [];
  let slotCounter = 1;
  let arrangement = [...slots];

  for (let round = 1; round <= totalRounds; round++) {
    for (let i = 0; i < n / 2; i++) {
      const p1 = arrangement[i];
      const p2 = arrangement[n - 1 - i];
      if (p1 !== null && p2 !== null) {
        fixtures.push({ slot: slotCounter++, round, player1Id: p1, player2Id: p2 });
      }
    }
    // Rotate everyone except the fixed first slot by one position, so each round pairs
    // participants up differently while nobody repeats an opponent.
    const fixed = arrangement[0];
    const rest = arrangement.slice(1);
    rest.unshift(rest.pop() as string | null);
    arrangement = [fixed, ...rest];
  }

  return fixtures;
};

/**
 * Round-robin scheduling. With `doubleRound: true`, appends a second leg — the same
 * pairings again, sides swapped (the "return match") — as a fresh block of rounds
 * continuing right after the first leg, doubling both the fixture count and round count.
 */
export const generateRoundRobinFixtures = (
  participantIds: string[],
  options?: { doubleRound?: boolean }
): CompetitionFixture[] => {
  const firstLeg = generateSingleLeg(participantIds);
  if (!options?.doubleRound || firstLeg.length === 0) return firstLeg;

  const roundsInFirstLeg = Math.max(...firstLeg.map((f) => f.round ?? 1));
  const secondLeg: CompetitionFixture[] = firstLeg.map((f) => ({
    slot: 0, // reassigned below once both legs are combined
    round: (f.round ?? 1) + roundsInFirstLeg,
    player1Id: f.player2Id,
    player2Id: f.player1Id,
  }));

  return [...firstLeg, ...secondLeg].map((f, i) => ({ ...f, slot: i + 1 }));
};

export const nextPowerOfTwo = (n: number): number => {
  let p = 1;
  while (p < n) p *= 2;
  return p;
};

// The standard tournament bracket seeding order: seed 1 meets the lowest seed, seed 2
// meets the second-lowest, and so on, recursively, so that (barring upsets) the top two
// seeds can only meet in the final. E.g. size 8 -> [1,8,4,5,2,7,3,6], read in pairs:
// (1v8, 4v5, 2v7, 3v6).
const standardSeedOrder = (size: number): number[] => {
  if (size === 1) return [1];
  const prev = standardSeedOrder(size / 2);
  const result: number[] = [];
  for (const s of prev) result.push(s, size + 1 - s);
  return result;
};

/**
 * Single-elimination bracket generation, seeded best-to-worst (index 0 = top seed).
 *
 * The field is padded to the next power of two with byes, and byes are handed to the
 * top seeds via the standard seed order above — the same fix real tournaments use when
 * the entry count isn't a power of two (e.g. 5 -> bracket of 8, top 3 seeds get a bye
 * into round 2). A bye fixture has `isBye: true` and no player2Id; it resolves to its
 * player1Id immediately, without anyone refereeing a match.
 *
 * Rounds after the first don't know their participants yet — they're generated as
 * placeholder fixtures with player1FromSlot/player2FromSlot pointing at the two round-N
 * fixtures that feed them, resolved on demand (see resolveFixturePlayers below).
 */
export const generateSingleEliminationBracket = (seededParticipantIds: string[]): CompetitionFixture[] => {
  const n = seededParticipantIds.length;
  if (n < 2) return [];

  const bracketSize = nextPowerOfTwo(n);
  const seedOrder = standardSeedOrder(bracketSize);
  const seedToPlayer = (seed: number): string | undefined =>
    seed <= n ? seededParticipantIds[seed - 1] : undefined;

  const fixtures: CompetitionFixture[] = [];
  let slotCounter = 1;
  const totalRounds = Math.log2(bracketSize);

  let prevRoundSlots: number[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const a = seedToPlayer(seedOrder[i]);
    const b = seedToPlayer(seedOrder[i + 1]);
    const slot = slotCounter++;
    const player = a ?? b; // whichever side is real when the other is a bye
    if (a && b) {
      fixtures.push({ slot, round: 1, player1Id: a, player2Id: b });
    } else if (player) {
      fixtures.push({ slot, round: 1, player1Id: player, player2Id: '', isBye: true });
    }
    prevRoundSlots.push(slot);
  }

  for (let round = 2; round <= totalRounds; round++) {
    const currentRoundSlots: number[] = [];
    for (let i = 0; i < prevRoundSlots.length; i += 2) {
      const slot = slotCounter++;
      fixtures.push({
        slot,
        round,
        player1Id: '',
        player2Id: '',
        player1FromSlot: prevRoundSlots[i],
        player2FromSlot: prevRoundSlots[i + 1],
      });
      currentRoundSlots.push(slot);
    }
    prevRoundSlots = currentRoundSlots;
  }

  return fixtures;
};

export interface ResolvedFixturePlayers {
  player1Id: string | undefined;
  player2Id: string | undefined;
}

// Finds the completed match (if any) that fulfills this fixture. Prefers matching by
// fixtureSlot — the only reliable way to tell apart two matches between the SAME pair of
// players within one competition (a League double round-robin's return leg, or Double
// Elimination's Grand Final rematching an earlier round). Falls back to the old
// player-pair lookup only for matches recorded before fixtureSlot existed; that's exactly
// wrong for a genuine rematch, but those never occurred before Double Elimination/double
// round-robin existed, so no pre-existing data can actually hit the ambiguous case.
export const findFixtureMatch = (
  fixture: CompetitionFixture,
  resolvedPlayer1Id: string | undefined,
  resolvedPlayer2Id: string | undefined,
  competitionId: string,
  matches: SquashMatch[]
): SquashMatch | undefined => {
  const bySlot = matches.find(
    (m) => m.competitionId === competitionId && m.status === 'COMPLETED' && m.fixtureSlot === fixture.slot
  );
  if (bySlot) return bySlot;
  if (!resolvedPlayer1Id || !resolvedPlayer2Id) return undefined;
  return matches.find(
    (m) =>
      m.competitionId === competitionId &&
      m.status === 'COMPLETED' &&
      m.fixtureSlot == null &&
      ((m.player1.id === resolvedPlayer1Id && m.player2.id === resolvedPlayer2Id) ||
        (m.player1.id === resolvedPlayer2Id && m.player2.id === resolvedPlayer1Id))
  );
};

// The player who finishes rank `rank` (1 = 1st) of group `groupIndex`, once every fixture
// in that group is complete — before that, undefined (no early-clinching logic, same
// "wait for it to actually be decided" philosophy as everything else in this file). The
// group's roster isn't stored anywhere separately; it's recovered from whichever fixtures
// were tagged with this groupIndex at generation time.
const resolveGroupQualifier = (
  groupIndex: number,
  rank: number,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): string | undefined => {
  const groupFixtures = allFixtures.filter((f) => f.stage === 'GROUP' && f.groupIndex === groupIndex);
  const allPlayed = groupFixtures.every((f) => findFixtureMatch(f, f.player1Id, f.player2Id, competitionId, matches));
  if (!allPlayed) return undefined;

  const groupParticipantIds = [...new Set(groupFixtures.flatMap((f) => [f.player1Id, f.player2Id]))];
  const standings = computeStandingsForFixtures(groupParticipantIds, competitionId, matches);
  return standings[rank - 1]?.playerId;
};

const resolveSlotPlayer = (
  directId: string,
  winnerFromSlot: number | undefined,
  loserFromSlot: number | undefined,
  groupIndex: number | undefined,
  groupRank: number | undefined,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): string | undefined => {
  if (directId) return directId;
  if (winnerFromSlot != null) {
    const feeder = allFixtures.find((f) => f.slot === winnerFromSlot);
    return feeder ? getFixtureWinnerId(feeder, allFixtures, competitionId, matches) : undefined;
  }
  if (loserFromSlot != null) {
    const feeder = allFixtures.find((f) => f.slot === loserFromSlot);
    return feeder ? getFixtureLoserId(feeder, allFixtures, competitionId, matches) : undefined;
  }
  if (groupIndex != null && groupRank != null) {
    return resolveGroupQualifier(groupIndex, groupRank, allFixtures, competitionId, matches);
  }
  return undefined;
};

// Resolves both sides of a fixture, following player1FromSlot/player2FromSlot (winner),
// player1LoserFromSlot/player2LoserFromSlot (loser, Double Elimination's Losers-bracket
// drop-in), or player1GroupIndex+Rank/player2GroupIndex+Rank (Groups+Knockout's knockout
// stage) chains through however many steps it takes to reach known seeds. Bracket/group-
// only — round-robin and Interclub fixtures always have their players set directly, so
// this is a no-op there.
export const resolveFixturePlayers = (
  fixture: CompetitionFixture,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): ResolvedFixturePlayers => ({
  player1Id: resolveSlotPlayer(
    fixture.player1Id,
    fixture.player1FromSlot,
    fixture.player1LoserFromSlot,
    fixture.player1GroupIndex,
    fixture.player1GroupRank,
    allFixtures,
    competitionId,
    matches
  ),
  player2Id: resolveSlotPlayer(
    fixture.player2Id,
    fixture.player2FromSlot,
    fixture.player2LoserFromSlot,
    fixture.player2GroupIndex,
    fixture.player2GroupRank,
    allFixtures,
    competitionId,
    matches
  ),
});

// The winner who advances out of this fixture: for a bye, that's player1Id immediately;
// otherwise it's whoever won the completed match between the two resolved players, or
// undefined if that match hasn't been played (or the opponent isn't decided yet).
export const getFixtureWinnerId = (
  fixture: CompetitionFixture,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): string | undefined => {
  const { player1Id, player2Id } = resolveFixturePlayers(fixture, allFixtures, competitionId, matches);
  if (fixture.isBye) return player1Id;
  if (!player1Id || !player2Id) return undefined;

  const match = findFixtureMatch(fixture, player1Id, player2Id, competitionId, matches);
  return match ? getMatchWinnerId(match) : undefined;
};

// The player eliminated from this fixture's bracket side — used to drop Winners-bracket
// losers into the Losers bracket. A bye was never actually played, so it never produces a
// loser (undefined, same as "not decided yet" — nothing should ever ask a bye for one,
// since byes only ever occur in round 1 of a bracket and are excluded from the Losers
// bracket's round-1 seed by construction).
export const getFixtureLoserId = (
  fixture: CompetitionFixture,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): string | undefined => {
  if (fixture.isBye) return undefined;
  const { player1Id, player2Id } = resolveFixturePlayers(fixture, allFixtures, competitionId, matches);
  if (!player1Id || !player2Id) return undefined;

  const match = findFixtureMatch(fixture, player1Id, player2Id, competitionId, matches);
  if (!match) return undefined;
  const winnerId = getMatchWinnerId(match);
  if (!winnerId) return undefined;
  return winnerId === player1Id ? player2Id : player1Id;
};

// A not-yet-materialized bracket entrant: either a known player (only possible for a
// round-1 bye winner, resolvable at generation time), a reference to "whoever wins/loses
// fixture N" (resolved lazily, once that fixture is actually played), or — Groups+
// Knockout only — "whoever finishes rank R in group G" (resolved once that group's
// round-robin is complete).
type BracketToken =
  | { type: 'PLAYER'; id: string }
  | { type: 'WINNER'; slot: number }
  | { type: 'LOSER'; slot: number }
  | { type: 'GROUP_QUALIFIER'; groupIndex: number; rank: number };

type Player1TokenFields = Pick<
  CompetitionFixture,
  'player1Id' | 'player1FromSlot' | 'player1LoserFromSlot' | 'player1GroupIndex' | 'player1GroupRank'
>;
type Player2TokenFields = Pick<
  CompetitionFixture,
  'player2Id' | 'player2FromSlot' | 'player2LoserFromSlot' | 'player2GroupIndex' | 'player2GroupRank'
>;

const tokenAsPlayer1Fields = (token: BracketToken): Player1TokenFields => {
  if (token.type === 'PLAYER') return { player1Id: token.id };
  if (token.type === 'WINNER') return { player1Id: '', player1FromSlot: token.slot };
  if (token.type === 'LOSER') return { player1Id: '', player1LoserFromSlot: token.slot };
  return { player1Id: '', player1GroupIndex: token.groupIndex, player1GroupRank: token.rank };
};

const tokenAsPlayer2Fields = (token: BracketToken): Player2TokenFields => {
  if (token.type === 'PLAYER') return { player2Id: token.id };
  if (token.type === 'WINNER') return { player2Id: '', player2FromSlot: token.slot };
  if (token.type === 'LOSER') return { player2Id: '', player2LoserFromSlot: token.slot };
  return { player2Id: '', player2GroupIndex: token.groupIndex, player2GroupRank: token.rank };
};

// `extra` carries whichever tagging fields distinguish this fixture's stage — bracketSide
// for Double Elimination (WB/LB/GF), stage for Groups+Knockout (GROUP/KNOCKOUT) — merged
// in alongside the resolved token fields.
const makeTokenFixture = (
  slot: number,
  round: number,
  extra: Partial<CompetitionFixture>,
  t1: BracketToken,
  t2: BracketToken | undefined
): CompetitionFixture => {
  if (!t2) {
    return { slot, round, ...extra, isBye: true, ...tokenAsPlayer1Fields(t1), player2Id: '' };
  }
  return { slot, round, ...extra, ...tokenAsPlayer1Fields(t1), ...tokenAsPlayer2Fields(t2) };
};

// Pairs up a list of bracket entrants sequentially, one fixture per pair — an odd entrant
// left over gets a bye fixture (auto-advances, no match played). Used throughout the
// Losers bracket, where byes/uneven counts can crop up at any round once the field isn't
// a clean power of two.
const pairEntrantsWithByes = (
  tokens: BracketToken[],
  round: number,
  extra: Partial<CompetitionFixture>,
  nextSlot: () => number,
  fixtures: CompetitionFixture[]
): BracketToken[] => {
  const winners: BracketToken[] = [];
  for (let i = 0; i < tokens.length; i += 2) {
    const slot = nextSlot();
    fixtures.push(makeTokenFixture(slot, round, extra, tokens[i], tokens[i + 1]));
    winners.push({ type: 'WINNER', slot });
  }
  return winners;
};

/**
 * Double-elimination bracket: a Winners bracket seeded exactly like
 * generateSingleEliminationBracket (top seeds get byes when the field isn't a power of
 * two), plus a Losers bracket that catches every Winners-bracket loser, plus a single
 * Grand Final between the two bracket champions.
 *
 * Losers-bracket shape: round 1 pairs up Winners-round-1's real losers (byes produce no
 * loser, so they contribute nothing). For every later Winners round, its losers "drop in"
 * against the current Losers-bracket survivors, then — for every Winners round except the
 * final — the drop-in round's winners get one more "consolidation" round pairing them
 * among themselves. This is the standard alternation real double-elim brackets use, and
 * (with byes at 0) reproduces the textbook round count exactly. A trailing loop keeps
 * consolidating past that point if byes ever leave more than one Losers-bracket survivor
 * once the Winners bracket has finished feeding it — which guarantees the Losers bracket
 * always converges to exactly one champion, however lopsided the byes were.
 *
 * Simplification: the Grand Final is a single decisive match. A "true" double-elimination
 * bracket resets (plays a second Grand Final) if the Losers-bracket entrant wins it, since
 * the Winners-bracket entrant would then have their first loss — but that's a fixture that
 * only exists conditionally on a result, which doesn't fit this app's "freeze every
 * fixture at competition-creation time" model (see the comment on CompetitionFixture).
 */
export const generateDoubleEliminationBracket = (seededParticipantIds: string[]): CompetitionFixture[] => {
  const n = seededParticipantIds.length;
  if (n < 2) return [];

  const bracketSize = nextPowerOfTwo(n);
  const totalWbRounds = Math.log2(bracketSize);
  const seedOrder = standardSeedOrder(bracketSize);
  const seedToPlayer = (seed: number): string | undefined =>
    seed <= n ? seededParticipantIds[seed - 1] : undefined;

  const fixtures: CompetitionFixture[] = [];
  let slotCounter = 1;
  const nextSlot = () => slotCounter++;

  // ---- Winners bracket ----
  let wbWinners: BracketToken[] = [];
  const wbLosersByRound: BracketToken[][] = [];

  const round1Losers: BracketToken[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const a = seedToPlayer(seedOrder[i]);
    const b = seedToPlayer(seedOrder[i + 1]);
    const slot = nextSlot();
    if (a && b) {
      fixtures.push({ slot, round: 1, bracketSide: 'WB', player1Id: a, player2Id: b });
      wbWinners.push({ type: 'WINNER', slot });
      round1Losers.push({ type: 'LOSER', slot });
    } else {
      const player = (a ?? b) as string; // guaranteed real — nextPowerOfTwo(n) keeps n > bracketSize/2
      fixtures.push({ slot, round: 1, bracketSide: 'WB', player1Id: player, player2Id: '', isBye: true });
      wbWinners.push({ type: 'PLAYER', id: player });
      // No loser — a bye was never played.
    }
  }
  wbLosersByRound.push(round1Losers);

  for (let round = 2; round <= totalWbRounds; round++) {
    const prevWinners = wbWinners;
    const roundWinners: BracketToken[] = [];
    const roundLosers: BracketToken[] = [];
    for (let i = 0; i < prevWinners.length; i += 2) {
      const slot = nextSlot();
      fixtures.push(makeTokenFixture(slot, round, { bracketSide: 'WB' }, prevWinners[i], prevWinners[i + 1]));
      roundWinners.push({ type: 'WINNER', slot });
      roundLosers.push({ type: 'LOSER', slot });
    }
    wbWinners = roundWinners;
    wbLosersByRound.push(roundLosers);
  }
  const wbChampion = wbWinners[0];

  // ---- Losers bracket ----
  let lbRound = 1;
  let lbPool = pairEntrantsWithByes(wbLosersByRound[0], lbRound++, { bracketSide: 'LB' }, nextSlot, fixtures);

  for (let wbRound = 2; wbRound <= totalWbRounds; wbRound++) {
    const merged = [...lbPool, ...wbLosersByRound[wbRound - 1]];
    lbPool = pairEntrantsWithByes(merged, lbRound++, { bracketSide: 'LB' }, nextSlot, fixtures);
    if (wbRound < totalWbRounds) {
      lbPool = pairEntrantsWithByes(lbPool, lbRound++, { bracketSide: 'LB' }, nextSlot, fixtures);
    }
  }
  while (lbPool.length > 1) {
    lbPool = pairEntrantsWithByes(lbPool, lbRound++, { bracketSide: 'LB' }, nextSlot, fixtures);
  }
  const lbChampion = lbPool[0];

  // ---- Grand Final ----
  fixtures.push(makeTokenFixture(nextSlot(), 1, { bracketSide: 'GF' }, wbChampion, lbChampion));

  return fixtures;
};

/**
 * How many groups a Groups+Knockout field of `n` splits into. Targets groups of 3-4 —
 * the standard real-tournament group size — and picks the FEWEST groups that keep every
 * group at least 3 players, so an awkward count (7, 11, 13 — exactly the primes that
 * can't split evenly) still lands on sensibly-sized, near-even groups instead of leaving
 * a degenerate group of 1-2:
 *
 *   4 -> 1 group of 4        9 -> 3 groups of 3,3,3      13 -> 4 groups of 4,3,3,3
 *   5 -> 1 group of 5       10 -> 3 groups of 4,3,3      14 -> 4 groups of 4,4,3,3
 *   6 -> 2 groups of 3,3    11 -> 3 groups of 4,4,3      15 -> 4 groups of 4,4,4,3
 *   7 -> 2 groups of 4,3    12 -> 3 groups of 4,4,4      16 -> 4 groups of 4,4,4,4
 *   8 -> 2 groups of 4,4
 *
 * (group sizes are as even as possible for a given count — see the size-distribution
 * loop in generateGroupsPlayoffBracket.)
 */
export const computeGroupCount = (n: number): number => {
  let groups = Math.ceil(n / 4);
  while (groups > 1 && Math.floor(n / groups) < 3) groups--;
  return groups;
};

/**
 * Groups + Knockout: split the (grade-seeded) field into computeGroupCount(n) groups via
 * snake draft — group 1 gets seed 1, group 2 seed 2, ..., then it reverses (last group
 * gets seed G+1, ..., group 1 gets seed 2G), and so on — so every group gets a mix of
 * strong and weak seeds instead of the top seeds all landing in one group. Each group
 * plays a single round-robin leg (generateRoundRobinFixtures, reused as-is).
 *
 * The top 2 finishers per group (or, for a single group — a field of 4 or 5 — the top 4,
 * so a small field still gets a real 2-round bracket rather than a single final) advance
 * to a knockout bracket, seeded group-winners-first (seed 1 = group 1's winner, ..., seed
 * G = group G's winner, seed G+1 = group 1's runner-up, ...) and padded to the next power
 * of two exactly like generateSingleEliminationBracket. Since who actually qualifies isn't
 * known until the group stage finishes, knockout fixtures reference "rank R of group G"
 * rather than a player id — see player1GroupIndex/player1GroupRank and
 * resolveGroupQualifier above.
 */
export const generateGroupsPlayoffBracket = (seededParticipantIds: string[]): CompetitionFixture[] => {
  const n = seededParticipantIds.length;
  if (n < 4) return [];

  const groupCount = computeGroupCount(n);
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  let groupIndex = 0;
  let direction: 1 | -1 = 1;
  for (const id of seededParticipantIds) {
    groups[groupIndex].push(id);
    if (groupCount > 1) {
      if (direction === 1) {
        if (groupIndex === groupCount - 1) direction = -1;
        else groupIndex++;
      } else {
        if (groupIndex === 0) direction = 1;
        else groupIndex--;
      }
    }
  }

  const fixtures: CompetitionFixture[] = [];
  let slotCounter = 1;
  const nextSlot = () => slotCounter++;

  groups.forEach((groupIds, idx) => {
    for (const groupFixture of generateRoundRobinFixtures(groupIds)) {
      fixtures.push({ ...groupFixture, slot: nextSlot(), stage: 'GROUP', groupIndex: idx });
    }
  });

  const qualifiersPerGroup = groupCount === 1 ? Math.min(4, n) : 2;
  const qualifierTokens: BracketToken[] = [];
  for (let rank = 1; rank <= qualifiersPerGroup; rank++) {
    for (let g = 0; g < groupCount; g++) {
      qualifierTokens.push({ type: 'GROUP_QUALIFIER', groupIndex: g, rank });
    }
  }

  const bracketSize = nextPowerOfTwo(qualifierTokens.length);
  const seedOrder = standardSeedOrder(bracketSize);
  const seedToToken = (seed: number): BracketToken | undefined =>
    seed <= qualifierTokens.length ? qualifierTokens[seed - 1] : undefined;

  let koWinners: BracketToken[] = [];
  for (let i = 0; i < bracketSize; i += 2) {
    const a = seedToToken(seedOrder[i]);
    const b = seedToToken(seedOrder[i + 1]);
    const slot = nextSlot();
    if (a && b) {
      fixtures.push(makeTokenFixture(slot, 1, { stage: 'KNOCKOUT' }, a, b));
      koWinners.push({ type: 'WINNER', slot });
    } else {
      const only = (a ?? b) as BracketToken; // guaranteed — same nextPowerOfTwo invariant as Single Elimination
      fixtures.push(makeTokenFixture(slot, 1, { stage: 'KNOCKOUT' }, only, undefined));
      koWinners.push(only);
    }
  }

  for (let round = 2; round <= Math.log2(bracketSize); round++) {
    const prevWinners = koWinners;
    const roundWinners: BracketToken[] = [];
    for (let i = 0; i < prevWinners.length; i += 2) {
      const slot = nextSlot();
      fixtures.push(makeTokenFixture(slot, round, { stage: 'KNOCKOUT' }, prevWinners[i], prevWinners[i + 1]));
      roundWinners.push({ type: 'WINNER', slot });
    }
    koWinners = roundWinners;
  }

  return fixtures;
};

// Human label for a bracket round, based on how many matches it contains (1 = Final, 2 =
// Semifinal, ...), falling back to a plain "Round N" once it's bigger than named rounds go.
export const getEliminationRoundLabel = (fixturesInRound: number): string => {
  switch (fixturesInRound) {
    case 1:
      return 'Final';
    case 2:
      return 'Semifinal';
    case 4:
      return 'Quarterfinal';
    case 8:
      return 'Round of 16';
    case 16:
      return 'Round of 32';
    default:
      return `Round of ${fixturesInRound * 2}`;
  }
};
