import type { CompetitionFixture, SquashMatch } from '../types/squash';
import { getMatchWinnerId } from './matchUtils';

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

const resolveSlotPlayer = (
  directId: string,
  fromSlot: number | undefined,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): string | undefined => {
  if (directId) return directId;
  if (fromSlot == null) return undefined;
  const feeder = allFixtures.find((f) => f.slot === fromSlot);
  return feeder ? getFixtureWinnerId(feeder, allFixtures, competitionId, matches) : undefined;
};

// Resolves both sides of a fixture, following player1FromSlot/player2FromSlot chains back
// through however many rounds it takes to reach known seeds. Bracket-only — round-robin
// and Interclub fixtures always have their players set directly, so this is a no-op there.
export const resolveFixturePlayers = (
  fixture: CompetitionFixture,
  allFixtures: CompetitionFixture[],
  competitionId: string,
  matches: SquashMatch[]
): ResolvedFixturePlayers => ({
  player1Id: resolveSlotPlayer(fixture.player1Id, fixture.player1FromSlot, allFixtures, competitionId, matches),
  player2Id: resolveSlotPlayer(fixture.player2Id, fixture.player2FromSlot, allFixtures, competitionId, matches),
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

  const match = matches.find(
    (m) =>
      m.competitionId === competitionId &&
      m.status === 'COMPLETED' &&
      ((m.player1.id === player1Id && m.player2.id === player2Id) ||
        (m.player1.id === player2Id && m.player2.id === player1Id))
  );
  return match ? getMatchWinnerId(match) : undefined;
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
