export type NZSquashGrade = 
  | 'A1' | 'A2' 
  | 'B1' | 'B2' 
  | 'C1' | 'C2' 
  | 'D1' | 'D2' 
  | 'E1' | 'E2' 
  | 'F' 
  | 'J1' | 'J2' | 'J3' | 'J4';

export type Handedness = 'Right' | 'Left';
export type ServeSide = 'L' | 'R';
export type DecisionType = 'YES_LET' | 'STROKE' | 'NO_LET';

export interface Club {
  id: string;
  name: string;
  city: string;
  country: string;
  countryFlag: string;
}

export interface Player {
  id: string;
  name: string;
  avatarUrl?: string;
  avatarBgColor: string;
  skillGrade: NZSquashGrade;
  countryFlag: string;
  countryCode: string;
  handedness: Handedness;
  clubId?: string;
  totalMatches: number;
  wins: number;
  losses: number;
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
  // quick matches recorded via NewMatchModal never set this.
  isRated?: boolean;
  // Links this match to the Competition it's a fixture of (see utils/matchModeUtils.ts).
  // Nothing currently auto-generates fixtures from a Competition — this is only set on
  // seed data today — but the field exists so that flow has somewhere to write to later.
  competitionId?: string;
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
  scoringPlayerFlag: string;
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

export interface AppSettings {
  showMascotTips: boolean;
  soundEffects: boolean;
  hapticFeedback: boolean;
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
  player1Id: string;
  player2Id: string;
}

export interface Competition {
  id: string;
  name: string;
  format: CompetitionFormat;
  status: CompetitionStatus;
  participantIds: string[];
  clubAId?: string;
  clubBId?: string;
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
