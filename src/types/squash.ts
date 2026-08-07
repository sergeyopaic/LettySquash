export type Handedness = 'Right' | 'Left';
export type ServeSide = 'L' | 'R';
export type DecisionType = 'YES_LET' | 'STROKE' | 'NO_LET';

// A user-defined container for players — replaces the old fixed "Club" concept.
// The user decides what it means: a real club roster, a weekly hit-around group,
// a tournament's entrant list, or nothing at all (players can have no folder).
export interface Folder {
  id: string;
  name: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Player {
  id: string;
  // Present once this player has been through the (not-yet-built) cloud sync flow.
  // Optional for now — see SyncMetadata below — so nothing here is a real dependency
  // on Phase 2 shipping.
  uuid?: string;
  name: string;
  nickname?: string;
  avatarBgColor: string;
  handedness?: Handedness;
  notes?: string;
  folderId?: string;
  totalMatches: number;
  wins: number;
  losses: number;
  createdAt: string;
}

// Not wired up anywhere yet — laid down now so the future cloud-sync work (Phase 2)
// doesn't require reshaping Player/Match/Competition/Folder records again. A record
// with isDirty: true has local changes a future sync pass still needs to push up.
export interface SyncMetadata {
  localUUID: string;
  cloudUUID?: string;
  lastSyncedAt?: string;
  isDirty: boolean;
}

// Placeholder shape for a future optional identity layer (Apple ID, etc.). Not used
// anywhere yet — the app has no accounts in Phase 1.
export interface UserProfile {
  id?: string;
  displayName: string;
  createdAt: string;
}

export interface PointEvent {
  gameIndex: number;
  scoringPlayerId: string;
  p1Score: number;
  p2Score: number;
  isHandout: boolean;
  timestamp: string;
}

export interface RefereeDecision {
  id: string;
  timestamp: string;
  gameIndex: number;
  requestingPlayerId: string;
  decision: DecisionType;
  p1Score: number;
  p2Score: number;
}

export interface GameResult {
  gameNumber: number;
  p1Score: number;
  p2Score: number;
  winnerId: string;
  durationSeconds: number;
}

export type MatchFormat = 'BEST_OF_5' | 'BEST_OF_3' | 'SINGLE_GAME';
export type MatchType = 'FRIENDLY' | 'TOURNAMENT' | 'LEAGUE' | 'PRACTICE';
export type MatchStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface SquashMatch {
  id: string;
  date: string;
  player1: Player;
  player2: Player;
  p1GamesWon: number;
  p2GamesWon: number;
  games: GameResult[];
  decisions: RefereeDecision[];
  matchFormat: MatchFormat;
  matchType: MatchType;
  targetPoints: number; // 11 (PARS)
  // Whether a game past targetPoints still needs a 2-clear margin to end (standard PARS
  // sudden-death) or ends the instant either side reaches targetPoints. Absent on matches
  // recorded before this field existed — those default to true (the universal PARS rule)
  // at every read site, since that's what the engine always enforced back then.
  twoPointGap?: boolean;
  status: MatchStatus;
  winnerId?: string;
  totalDurationSeconds: number;
  notes?: string;
  // Real per-point log recorded live during the match, used to render an accurate
  // Rally Flow. Absent on matches recorded before this field existed (e.g. seed data) —
  // those fall back to an estimated reconstruction, clearly labeled as such in the UI.
  pointLog?: PointEvent[];
  // Whether this match counts toward each player's Club Rating (see utils/ratingUtils.ts).
  // Independent of matchType — a rated match can still be a "friendly" in context; casual
  // quick matches recorded via QuickMatchCard never set this.
  isRated?: boolean;
  // Links this match to the Competition it's a fixture of (see utils/matchModeUtils.ts).
  // Nothing currently auto-generates fixtures from a Competition — this is only set on
  // seed data today — but the field exists so that flow has somewhere to write to later.
  competitionId?: string;
  // Which CompetitionFixture.slot this match fulfills. Needed because the same two
  // players can legitimately face each other twice within one competition — a League's
  // double round-robin return leg, or Double Elimination's Grand Final rematching the
  // Winners-bracket final — so "the completed match between these two players" alone is
  // ambiguous. Matches recorded before this field existed fall back to that ambiguous
  // player-pair lookup (see findFixtureMatch in fixtureUtils.ts); harmless for every
  // format except the rematch cases above.
  fixtureSlot?: number;
}

export interface GameWonInfo {
  gameNumber: number;
  winnerId: string;
  winnerName: string;
  p1Score: number;
  p2Score: number;
}

export interface RallyEventLog {
  p1Score: number;
  p2Score: number;
  scoringPlayerName: string;
  isHandout: boolean;
  timestamp: string;
}

export interface LiveMatchState {
  match: SquashMatch;
  currentGameIndex: number;
  p1CurrentScore: number;
  p2CurrentScore: number;
  currentServerId: string;
  currentServeSide: ServeSide;
  timerSeconds: number;
  isPaused: boolean;
  isTimerRunning?: boolean;
  isGameWonModalOpen?: boolean;
  isGameBreakActive?: boolean;
  isGameBreakPaused?: boolean;
  gameBreakTimerSeconds?: number;
  lastGameWon?: GameWonInfo | null;
  lastRallyLog?: RallyEventLog | null;
  isHandout?: boolean;
  history: any[];
  decisions: RefereeDecision[];
  pointLog: PointEvent[];
}

// Defaults applied to every Quick Match (see QuickMatchCard) until changed in Settings.
// Custom Match reads these as its starting point but never writes back to them — a
// one-off different format there shouldn't silently change the user's standing default.
export interface AppSettings {
  showMascotTips: boolean;
  quickMatchFormat: MatchFormat;
  quickMatchTargetPoints: number;
  quickMatchTwoPointGap: boolean;
}

export interface LettyTipItem {
  category: 'RULE' | 'TACTIC' | 'FACT';
  categoryLabel: string;
  title: string;
  text: string;
}

export type CompetitionFormat =
  | 'INTERCLUB_4VS4'
  | 'LEAGUE'
  | 'GROUPS_PLAYOFF'
  | 'SINGLE_ELIMINATION'
  | 'DOUBLE_ELIMINATION';

export type CompetitionStatus = 'ACTIVE' | 'COMPLETED';

// A single fixture pairing within a competition (e.g. Interclub rank #1 vs rank #1).
// Whether it's been played is never stored here — it's derived by looking for a completed
// match with this competitionId and this exact player pair (see matchModeUtils.ts /
// CompetitionDetailModal), the same "derive, don't duplicate" pattern the rest of the app
// uses for stats. Frozen at competition-creation time — later roster/grade changes don't
// reshuffle an already-declared fixture.
export interface CompetitionFixture {
  slot: number;
  // Groups fixtures into tours for round-robin-style formats (each participant plays at
  // most once per round), or into bracket rounds for elimination formats. Absent/1 means
  // a single-round format like Interclub 4v4.
  round?: number;
  // For elimination brackets: player1Id/player2Id are '' (empty) when the participant
  // isn't known yet — it's whoever wins the fixture referenced by player1FromSlot /
  // player2FromSlot (or LOSES the fixture referenced by player1LoserFromSlot /
  // player2LoserFromSlot, used by Double Elimination to drop Winners-bracket losers into
  // the Losers bracket). Resolved on demand via resolveFixturePlayers/getFixtureWinnerId/
  // getFixtureLoserId in fixtureUtils.ts, never stored, so it can't drift out of sync as
  // earlier rounds finish.
  player1Id: string;
  player2Id: string;
  player1FromSlot?: number;
  player2FromSlot?: number;
  player1LoserFromSlot?: number;
  player2LoserFromSlot?: number;
  // A walkover: player1Id advances automatically (player2Id is '') because this side of
  // the bracket was padded (with a phantom seed, or an odd Losers-bracket entrant count)
  // and drew no opponent. No real match is ever created for a bye fixture, and — since a
  // walkover was never actually played — it never produces a loser either.
  isBye?: boolean;
  // Double Elimination only: which bracket this fixture belongs to. A Winners-bracket loss
  // drops a player into the Losers bracket instead of eliminating them outright; the Grand
  // Final pits the two bracket champions against each other. Undefined for every other
  // format (including Single Elimination, which has only one bracket).
  bracketSide?: 'WB' | 'LB' | 'GF';
  // Groups + Knockout only: which stage this fixture belongs to, and — for a GROUP-stage
  // fixture — which group (0-based). A KNOCKOUT-stage fixture's players may instead be
  // "whoever finishes rank R in group G", via player1GroupIndex/player1GroupRank (and the
  // player2 equivalents) — resolved once every fixture in that group is complete, the same
  // on-demand pattern as player1FromSlot/player1LoserFromSlot above.
  stage?: 'GROUP' | 'KNOCKOUT';
  groupIndex?: number;
  player1GroupIndex?: number;
  player1GroupRank?: number;
  player2GroupIndex?: number;
  player2GroupRank?: number;
}

export interface Competition {
  id: string;
  name: string;
  format: CompetitionFormat;
  status: CompetitionStatus;
  participantIds: string[];
  // Interclub 4v4 only: the two rosters facing off. Was clubAId/clubBId when Club was
  // a fixed real-world entity — now just references two Folders, same as any other
  // player grouping.
  folderAId?: string;
  folderBId?: string;
  createdAt: string;
  // Only populated for formats whose fixtures can be generated deterministically at
  // creation time (currently just Interclub 4v4's rank-vs-rank pairing). Other formats
  // (League round-robin, brackets) need real scheduling logic — not built yet.
  fixtures?: CompetitionFixture[];
  // Match ruleset applied to every fixture generated from this competition (e.g. some
  // interclub ties are played to 15, not the standard PARS-11). Optional + defaulted at
  // the read site (BEST_OF_5 / 11) so competitions created before this existed still work.
  matchFormat?: MatchFormat;
  targetPoints?: number;
}
