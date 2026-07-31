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
  timestamp: string;
  scoringPlayerId: string;
  p1Score: number;
  p2Score: number;
  serverPlayerId: string;
  serveSide: ServeSide;
  setIndex: number;
  serverId?: string;
  currentSetIndex?: number;
  p1SetsWon?: number;
  p2SetsWon?: number;
}

export interface RefereeDecision {
  id: string;
  timestamp: string;
  setIndex: number;
  requestingPlayerId: string;
  decision: DecisionType;
  p1Score: number;
  p2Score: number;
}

export interface SetResult {
  setNumber: number;
  p1Score: number;
  p2Score: number;
  winnerId: string;
  durationSeconds: number;
}

export type MatchFormat = 'BEST_OF_5' | 'BEST_OF_3' | 'SINGLE_SET';
export type MatchType = 'FRIENDLY' | 'TOURNAMENT' | 'LEAGUE' | 'PRACTICE';
export type MatchStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';

export interface SquashMatch {
  id: string;
  date: string;
  player1: Player;
  player2: Player;
  p1SetsWon: number;
  p2SetsWon: number;
  sets: SetResult[];
  decisions: RefereeDecision[];
  matchFormat: MatchFormat;
  matchType: MatchType;
  targetPoints: number; // 11 (PARS)
  status: MatchStatus;
  winnerId?: string;
  totalDurationSeconds: number;
  notes?: string;
}

export interface SetWonInfo {
  setNumber: number;
  winnerId: string;
  winnerName: string;
  p1Score: number;
  p2Score: number;
}

export interface LiveMatchState {
  match: SquashMatch;
  currentSetIndex: number;
  p1CurrentScore: number;
  p2CurrentScore: number;
  currentServerId: string;
  currentServeSide: ServeSide;
  timerSeconds: number;
  isPaused: boolean;
  isTimerRunning?: boolean;
  isSetWonModalOpen?: boolean;
  isSetBreakActive?: boolean;
  isSetBreakPaused?: boolean;
  setBreakTimerSeconds?: number;
  lastSetWon?: SetWonInfo | null;
  isHandout?: boolean;
  history: any[];
  decisions: RefereeDecision[];
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
