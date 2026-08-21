import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Player,
  SquashMatch,
  LiveMatchState,
  MatchFormat,
  MatchType,
  ServeSide,
  DecisionType,
  Handedness,
  AppSettings,
  GameWonInfo,
  RefereeDecision,
  Competition,
  CompetitionFormat,
  CompetitionStatus,
  CompetitionFixture,
  PointEvent,
  Folder,
  PointHistoryEntry,
  DecisionHistoryEntry,
} from '../types/squash';
import { INITIAL_PLAYERS, INITIAL_MATCHES, INITIAL_COMPETITIONS, INITIAL_FOLDERS } from '../data/mockData';
import { computePlayerStats } from '../utils/folderUtils';
import confetti from 'canvas-confetti';

export interface AddPlayerInput {
  nickname?: string;
  handedness?: Handedness;
  notes?: string;
  avatarBgColor?: string;
  folderId?: string;
}

interface SquashContextType {
  players: Player[];
  matches: SquashMatch[];
  competitions: Competition[];
  folders: Folder[];
  activeMatchState: LiveMatchState | null;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addPlayer: (name: string, options?: AddPlayerInput) => Player;
  updatePlayer: (playerId: string, updates: AddPlayerInput & { name: string; avatarBgColor: string }) => void;
  deletePlayer: (id: string) => void;
  updatePlayerFolder: (playerId: string, folderId: string) => void;
  addFolder: (name: string) => Folder;
  updateFolder: (folderId: string, name: string) => void;
  deleteFolder: (folderId: string) => void;
  startMatch: (
    player1Id: string,
    player2Id: string,
    format: MatchFormat,
    matchType: MatchType,
    initialServerId: string,
    serveSide: ServeSide,
    isRated?: boolean,
    competitionId?: string,
    targetPoints?: number,
    fixtureSlot?: number,
    twoPointGap?: boolean,
    // Per-match jersey-color overrides. Only this match's player1/player2 snapshot uses
    // them (SquashMatch stores a full copy, not a reference) — the roster Player's own
    // avatarBgColor, shown everywhere else, is never touched. Next time this player is
    // picked, their own default color is back.
    player1Color?: string,
    player2Color?: string,
    p1HandicapStart?: number,
    p2HandicapStart?: number
  ) => void;
  recordPoint: (scoringPlayerId: string) => void;
  recordDecision: (requestingPlayerId: string, decision: DecisionType) => void;
  undoLastAction: () => void;
  toggleTimer: () => void;
  proceedToGameBreak: () => void;
  skipGameBreak: () => void;
  toggleGameBreakPause: () => void;
  addGameBreakTime: (secondsToAdd?: number) => void;
  toggleServeSide: () => void;
  resetCurrentGame: () => void;
  resetWholeMatch: () => void;
  finishActiveMatch: () => void;
  cancelActiveMatch: () => void;
  deleteMatch: (matchId: string) => void;
  getMatchById: (matchId: string) => SquashMatch | undefined;
  getPlayerById: (playerId: string) => Player | undefined;
  addCompetition: (input: {
    name: string;
    format: CompetitionFormat;
    participantIds: string[];
    folderAId?: string;
    folderBId?: string;
    fixtures?: CompetitionFixture[];
    matchFormat?: MatchFormat;
    targetPoints?: number;
  }) => Competition;
  setCompetitionStatus: (competitionId: string, status: CompetitionStatus) => void;
  deleteCompetition: (competitionId: string) => void;
}

const SquashContext = createContext<SquashContextType | undefined>(undefined);

const LOCAL_STORAGE_PLAYERS = 'letty_squash_players_v5';
const LOCAL_STORAGE_MATCHES = 'letty_squash_matches_v7';
const LOCAL_STORAGE_SETTINGS = 'letty_squash_settings_v2';
const LOCAL_STORAGE_COMPETITIONS = 'letty_squash_competitions_v4';
const LOCAL_STORAGE_ACTIVE_MATCH = 'letty_squash_active_match_v1';
const LOCAL_STORAGE_FOLDERS = 'letty_squash_folders_v1';

// Corrupted/manually-edited localStorage (or a browser blocking storage entirely, e.g.
// strict private-browsing modes) must never crash the app on load — fall back to defaults.
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (err) {
    console.warn(`Letty Squash: failed to load "${key}" from localStorage, using defaults.`, err);
    return fallback;
  }
};

const saveToStorage = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.warn(`Letty Squash: failed to save "${key}" to localStorage.`, err);
  }
};

export const SquashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() =>
    loadFromStorage(LOCAL_STORAGE_PLAYERS, INITIAL_PLAYERS)
  );

  const [matches, setMatches] = useState<SquashMatch[]>(() =>
    loadFromStorage(LOCAL_STORAGE_MATCHES, INITIAL_MATCHES)
  );

  const [competitions, setCompetitions] = useState<Competition[]>(() =>
    loadFromStorage(LOCAL_STORAGE_COMPETITIONS, INITIAL_COMPETITIONS)
  );

  const [folders, setFolders] = useState<Folder[]>(() =>
    loadFromStorage(LOCAL_STORAGE_FOLDERS, INITIAL_FOLDERS)
  );

  // Dynamically compute player W/L statistics based on actual matches in the log
  const computedPlayers = React.useMemo(() => {
    return computePlayerStats(players, matches);
  }, [players, matches]);

  const [settings, setSettings] = useState<AppSettings>(() =>
    loadFromStorage(LOCAL_STORAGE_SETTINGS, {
      showMascotTips: true,
      quickMatchFormat: 'BEST_OF_3' as MatchFormat,
      quickMatchTargetPoints: 11,
      quickMatchTwoPointGap: true,
    })
  );

  // Persisted so an in-progress match (and its point-by-point log) survives a page
  // reload/tab crash instead of being silently lost — previously this was purely
  // in-memory state.
  const [activeMatchState, setActiveMatchState] = useState<LiveMatchState | null>(() =>
    loadFromStorage(LOCAL_STORAGE_ACTIVE_MATCH, null)
  );

  useEffect(() => {
    saveToStorage(LOCAL_STORAGE_PLAYERS, players);
  }, [players]);

  useEffect(() => {
    saveToStorage(LOCAL_STORAGE_MATCHES, matches);
  }, [matches]);

  useEffect(() => {
    saveToStorage(LOCAL_STORAGE_COMPETITIONS, competitions);
  }, [competitions]);

  useEffect(() => {
    saveToStorage(LOCAL_STORAGE_FOLDERS, folders);
  }, [folders]);

  useEffect(() => {
    saveToStorage(LOCAL_STORAGE_ACTIVE_MATCH, activeMatchState);
  }, [activeMatchState]);

  useEffect(() => {
    saveToStorage(LOCAL_STORAGE_SETTINGS, settings);
  }, [settings]);

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // Timer Effect handling match time & break countdown
  useEffect(() => {
    let interval: any = null;

    if (activeMatchState && activeMatchState.match.status === 'IN_PROGRESS') {
      if (activeMatchState.isGameBreakActive && !activeMatchState.isGameBreakPaused) {
        interval = setInterval(() => {
          setActiveMatchState((prev: any) => {
            if (!prev || !prev.isGameBreakActive || prev.isGameBreakPaused) return prev;
            if ((prev.gameBreakTimerSeconds ?? 90) <= 1) {
              return {
                ...prev,
                isGameBreakActive: false,
                isGameBreakPaused: false,
                gameBreakTimerSeconds: 0,
                isTimerRunning: true,
              };
            }
            return {
              ...prev,
              gameBreakTimerSeconds: (prev.gameBreakTimerSeconds ?? 90) - 1,
            };
          });
        }, 1000);
      } else if (activeMatchState.isTimerRunning && !activeMatchState.isGameWonModalOpen && !activeMatchState.isGameBreakActive) {
        interval = setInterval(() => {
          setActiveMatchState((prev: any) => {
            if (!prev || prev.isGameWonModalOpen || prev.isGameBreakActive) return prev;
            return {
              ...prev,
              timerSeconds: prev.timerSeconds + 1,
              match: {
                ...prev.match,
                totalDurationSeconds: prev.match.totalDurationSeconds + 1,
              },
            };
          });
        }, 1000);
      }
    }

    return () => clearInterval(interval);
  }, [
    activeMatchState?.isTimerRunning,
    activeMatchState?.isGameBreakActive,
    activeMatchState?.isGameBreakPaused,
    activeMatchState?.isGameWonModalOpen,
    activeMatchState?.match.status,
  ]);

  const addPlayer = (name: string, options: AddPlayerInput = {}): Player => {
    const colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
    const randomColor = options.avatarBgColor || colors[Math.floor(Math.random() * colors.length)];
    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      uuid: `local_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      name,
      nickname: options.nickname,
      handedness: options.handedness,
      notes: options.notes,
      avatarBgColor: randomColor,
      folderId: options.folderId,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
    };
    setPlayers((prev) => [newPlayer, ...prev]);
    return newPlayer;
  };

  // Edits the roster profile AND backfills every already-played match's player1/player2
  // snapshot (SquashMatch stores a full Player copy at match-creation time, not a live
  // reference — see startMatch — so without this, a rename would only show up going
  // forward and every past match would keep displaying the old name/avatar forever).
  const updatePlayer = (playerId: string, updates: AddPlayerInput & { name: string; avatarBgColor: string }) => {
    const patch = {
      name: updates.name,
      nickname: updates.nickname,
      handedness: updates.handedness,
      notes: updates.notes,
      avatarBgColor: updates.avatarBgColor,
      folderId: updates.folderId,
    };
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, ...patch } : p)));
    setMatches((prev) =>
      prev.map((m) => {
        const isP1 = m.player1 && m.player1.id === playerId;
        const isP2 = m.player2 && m.player2.id === playerId;
        if (!isP1 && !isP2) return m;
        return {
          ...m,
          player1: isP1 ? { ...m.player1, ...patch } : m.player1,
          player2: isP2 ? { ...m.player2, ...patch } : m.player2,
        };
      })
    );
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const updatePlayerFolder = (playerId: string, folderId: string) => {
    setPlayers((prev) => prev.map((p) => (p.id === playerId ? { ...p, folderId } : p)));
  };

  const addFolder = (name: string): Folder => {
    const newFolder: Folder = {
      id: `f_${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setFolders((prev) => [newFolder, ...prev]);
    return newFolder;
  };

  const updateFolder = (folderId: string, name: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === folderId ? { ...f, name, updatedAt: new Date().toISOString() } : f))
    );
  };

  const deleteFolder = (folderId: string) => {
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    // Players in a deleted folder aren't deleted — they just fall back to unsorted,
    // same as a player who was never filed into a folder at all.
    setPlayers((prev) =>
      prev.map((p) => (p.folderId === folderId ? { ...p, folderId: undefined } : p))
    );
  };

  const startMatch = (
    player1Id: string,
    player2Id: string,
    format: MatchFormat,
    matchType: MatchType,
    initialServerId: string,
    serveSide: ServeSide,
    isRated: boolean = false,
    competitionId?: string,
    targetPoints: number = 11,
    fixtureSlot?: number,
    twoPointGap: boolean = true,
    player1Color?: string,
    player2Color?: string,
    p1HandicapStart: number = 0,
    p2HandicapStart: number = 0
  ) => {
    const foundP1 = players.find((p) => p.id === player1Id) || players[0];
    const foundP2 = players.find((p) => p.id === player2Id) || players.find((p) => p.id !== foundP1?.id) || players[1];

    if (!foundP1 || !foundP2) {
      alert('Please add at least 2 players before starting a match!');
      return;
    }

    // Match-only jersey-color override: applied to this match's player snapshot, never to
    // the roster record (foundP1/foundP2 in `players` stay exactly as they were).
    const p1 = player1Color ? { ...foundP1, avatarBgColor: player1Color } : foundP1;
    const p2 = player2Color ? { ...foundP2, avatarBgColor: player2Color } : foundP2;

    const serverId = initialServerId && (initialServerId === p1.id || initialServerId === p2.id) ? initialServerId : p1.id;

    const newMatch: SquashMatch = {
      id: `m_${Date.now()}`,
      date: new Date().toISOString(),
      player1: p1,
      player2: p2,
      p1GamesWon: 0,
      p2GamesWon: 0,
      games: [],
      decisions: [],
      matchFormat: format,
      matchType: matchType,
      targetPoints,
      twoPointGap,
      p1HandicapStart: p1HandicapStart || undefined,
      p2HandicapStart: p2HandicapStart || undefined,
      status: 'IN_PROGRESS',
      totalDurationSeconds: 0,
      isRated,
      competitionId,
      fixtureSlot,
    };

    setActiveMatchState({
      match: newMatch,
      currentGameIndex: 1,
      p1CurrentScore: p1HandicapStart,
      p2CurrentScore: p2HandicapStart,
      currentServerId: serverId,
      currentServeSide: serveSide,
      isPaused: false,
      decisions: [],
      isHandout: false,
      history: [],
      pointLog: [],
      timerSeconds: 0,
      isTimerRunning: true,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      isGameBreakPaused: false,
      gameBreakTimerSeconds: 90,
      lastGameWon: null,
    });
  };

  const checkGameWinner = (
    p1Score: number,
    p2Score: number,
    target: number,
    requireTwoPointGap: boolean
  ): 'p1' | 'p2' | null => {
    if (requireTwoPointGap) {
      if (p1Score >= target && p1Score - p2Score >= 2) return 'p1';
      if (p2Score >= target && p2Score - p1Score >= 2) return 'p2';
    } else {
      if (p1Score >= target) return 'p1';
      if (p2Score >= target) return 'p2';
    }
    return null;
  };

  const recordPoint = (scoringPlayerId: string, decisionsOverride?: RefereeDecision[]) => {
    if (!activeMatchState) return;

    const { match, currentGameIndex, p1CurrentScore, p2CurrentScore, currentServerId, currentServeSide } = activeMatchState;

    const historyEntry: PointHistoryEntry = {
      type: 'POINT',
      p1Score: p1CurrentScore,
      p2Score: p2CurrentScore,
      serverId: currentServerId,
      serveSide: currentServeSide,
      p1GamesWon: match.p1GamesWon,
      p2GamesWon: match.p2GamesWon,
      currentGameIndex,
      lastRallyLog: activeMatchState.lastRallyLog || null,
      decisionsCountBefore: match.decisions.length,
      isTimerRunningBefore: activeMatchState.isTimerRunning ?? true,
    };

    let newP1Score = p1CurrentScore;
    let newP2Score = p2CurrentScore;
    let newServerId = currentServerId;
    let newServeSide = currentServeSide;
    let isHandout = false;

    if (scoringPlayerId === match.player1.id) {
      newP1Score += 1;
    } else {
      newP2Score += 1;
    }

    if (scoringPlayerId === currentServerId) {
      newServeSide = currentServeSide === 'L' ? 'R' : 'L';
    } else {
      newServerId = scoringPlayerId;
      newServeSide = 'R';
      isHandout = true;
    }

    const scoringPlayer = scoringPlayerId === match.player1.id ? match.player1 : match.player2;
    const rallyLog = {
      p1Score: newP1Score,
      p2Score: newP2Score,
      scoringPlayerName: scoringPlayer.name,
      isHandout,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // Real point-by-point record for this rally, kept for an accurate post-match Rally Flow.
    // Captured before any next-game score reset below, so it reflects the actual in-game score.
    const pointEvent: PointEvent = {
      gameIndex: currentGameIndex,
      scoringPlayerId,
      p1Score: newP1Score,
      p2Score: newP2Score,
      isHandout,
      timestamp: new Date().toISOString(),
    };

    const gameWinner = checkGameWinner(newP1Score, newP2Score, match.targetPoints, match.twoPointGap ?? true);

    let updatedP1GamesWon = match.p1GamesWon;
    let updatedP2GamesWon = match.p2GamesWon;
    let updatedGames = [...match.games];
    let nextGameIndex = currentGameIndex;
    let matchWinnerId: string | undefined = undefined;
    let isMatchCompleted = false;
    let gameWonInfo: GameWonInfo | null = activeMatchState.lastGameWon || null;
    let shouldOpenGameWonModal = false;

    if (gameWinner) {
      const winnerPlayerId = gameWinner === 'p1' ? match.player1.id : match.player2.id;
      const winnerPlayerName = gameWinner === 'p1' ? match.player1.name : match.player2.name;

      updatedGames.push({
        gameNumber: currentGameIndex,
        p1Score: newP1Score,
        p2Score: newP2Score,
        winnerId: winnerPlayerId,
        durationSeconds: activeMatchState.timerSeconds,
      });

      if (gameWinner === 'p1') updatedP1GamesWon += 1;
      else updatedP2GamesWon += 1;

      gameWonInfo = {
        gameNumber: currentGameIndex,
        winnerId: winnerPlayerId,
        winnerName: winnerPlayerName,
        p1Score: newP1Score,
        p2Score: newP2Score,
      };

      const gamesNeeded = match.matchFormat === 'BEST_OF_5' ? 3 : match.matchFormat === 'BEST_OF_3' ? 2 : 1;

      if (updatedP1GamesWon >= gamesNeeded) {
        matchWinnerId = match.player1.id;
        isMatchCompleted = true;
      } else if (updatedP2GamesWon >= gamesNeeded) {
        matchWinnerId = match.player2.id;
        isMatchCompleted = true;
      } else {
        nextGameIndex += 1;
        newP1Score = match.p1HandicapStart ?? 0;
        newP2Score = match.p2HandicapStart ?? 0;
        shouldOpenGameWonModal = true;
      }
    }

    if (isMatchCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else if (gameWinner) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
      });
    }

    const updatedMatch: SquashMatch = {
      ...match,
      p1GamesWon: updatedP1GamesWon,
      p2GamesWon: updatedP2GamesWon,
      games: updatedGames,
      decisions: decisionsOverride ?? match.decisions,
      status: isMatchCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      winnerId: matchWinnerId,
    };

    setActiveMatchState({
      ...activeMatchState,
      match: updatedMatch,
      currentGameIndex: nextGameIndex,
      p1CurrentScore: newP1Score,
      p2CurrentScore: newP2Score,
      currentServerId: newServerId,
      currentServeSide: newServeSide,
      isHandout,
      history: [...activeMatchState.history, historyEntry],
      pointLog: [...activeMatchState.pointLog, pointEvent],
      isTimerRunning: !isMatchCompleted && !shouldOpenGameWonModal,
      isGameWonModalOpen: shouldOpenGameWonModal,
      isGameBreakActive: false,
      isGameBreakPaused: false,
      gameBreakTimerSeconds: 90,
      lastGameWon: gameWonInfo,
      lastRallyLog: rallyLog,
    });
  };

  const recordDecision = (requestingPlayerId: string, decision: DecisionType) => {
    if (!activeMatchState) return;

    const newDecision = {
      id: `d_${Date.now()}`,
      timestamp: new Date().toISOString(),
      gameIndex: activeMatchState.currentGameIndex,
      requestingPlayerId,
      decision,
      p1Score: activeMatchState.p1CurrentScore,
      p2Score: activeMatchState.p2CurrentScore,
    };

    const updatedDecisions = [...activeMatchState.match.decisions, newDecision];

    if (decision === 'STROKE') {
      // recordPoint rebuilds `match` from this same activeMatchState closure, so the
      // updated decisions list must be threaded through it rather than written via a
      // separate setActiveMatchState call here, which recordPoint's own update would clobber.
      recordPoint(requestingPlayerId, updatedDecisions);
      return;
    }

    // YES_LET / NO_LET don't touch the score, but a referee call is still worth being
    // able to take back — push a marker onto the same undo stack points use, so the one
    // Undo button covers this too instead of only ever affecting scores.
    const decisionEntry: DecisionHistoryEntry = { type: 'DECISION' };

    setActiveMatchState({
      ...activeMatchState,
      match: {
        ...activeMatchState.match,
        decisions: updatedDecisions,
      },
      history: [...activeMatchState.history, decisionEntry],
    });
  };

  const undoLastAction = () => {
    if (!activeMatchState || activeMatchState.history.length === 0) return;

    const previousHistory = [...activeMatchState.history];
    const lastEntry = previousHistory.pop();

    if (!lastEntry) return;

    if (lastEntry.type === 'DECISION') {
      // No score/server/game state to restore — just drop the most recent referee call.
      setActiveMatchState({
        ...activeMatchState,
        history: previousHistory,
        match: {
          ...activeMatchState.match,
          decisions: activeMatchState.match.decisions.slice(0, -1),
        },
      });
      return;
    }

    const lastState = lastEntry;

    const previousPointLog = [...activeMatchState.pointLog];
    previousPointLog.pop();

    // If the undone point completed a game (games-won total is higher now than it was
    // before that point), the GameResult it pushed onto `match.games` must be undone too,
    // otherwise it lingers as a phantom entry and a later replay of that game duplicates it.
    const gamesWonBeforeUndonePoint = lastState.p1GamesWon + lastState.p2GamesWon;
    const gamesWonNow = activeMatchState.match.p1GamesWon + activeMatchState.match.p2GamesWon;
    const undonePointWonAGame = gamesWonNow > gamesWonBeforeUndonePoint;
    const restoredGames = undonePointWonAGame
      ? activeMatchState.match.games.slice(0, -1)
      : activeMatchState.match.games;

    setActiveMatchState({
      ...activeMatchState,
      p1CurrentScore: lastState.p1Score,
      p2CurrentScore: lastState.p2Score,
      currentServerId: lastState.serverId,
      currentServeSide: lastState.serveSide,
      currentGameIndex: lastState.currentGameIndex,
      lastRallyLog: lastState.lastRallyLog || null,
      // A point that finished a game/match always pauses the timer (recordPoint) — restore
      // whatever it actually was right before that point, instead of leaving it silently
      // paused now that the match is back to IN_PROGRESS with nothing on screen to explain
      // why the clock isn't running.
      isTimerRunning: lastState.isTimerRunningBefore,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      isGameBreakPaused: false,
      match: {
        ...activeMatchState.match,
        p1GamesWon: lastState.p1GamesWon,
        p2GamesWon: lastState.p2GamesWon,
        games: restoredGames,
        // A STROKE call awards its point through this same POINT entry (see
        // recordDecision) instead of a separate DECISION one, so undoing the point must
        // also drop the STROKE record it carried — otherwise it lingers in the final
        // scorecard's stroke count even though the point that came with it was undone.
        decisions: activeMatchState.match.decisions.slice(0, lastState.decisionsCountBefore),
        // Undoing a match- or game-winning point un-completes the match — its status was
        // only ever COMPLETED because that specific point pushed it there.
        status: 'IN_PROGRESS',
        winnerId: undefined,
      },
      history: previousHistory,
      pointLog: previousPointLog,
    });
  };

  const toggleTimer = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isTimerRunning: !activeMatchState.isTimerRunning,
    });
  };

  const proceedToGameBreak = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isGameWonModalOpen: false,
      isGameBreakActive: true,
      isGameBreakPaused: false,
      gameBreakTimerSeconds: 90,
    });
  };

  const toggleGameBreakPause = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isGameBreakPaused: !activeMatchState.isGameBreakPaused,
    });
  };

  const addGameBreakTime = (secondsToAdd: number = 30) => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      gameBreakTimerSeconds: Math.max(0, (activeMatchState.gameBreakTimerSeconds || 0) + secondsToAdd),
    });
  };

  const toggleServeSide = () => {
    if (!activeMatchState) return;
    const newSide: ServeSide = activeMatchState.currentServeSide === 'L' ? 'R' : 'L';
    setActiveMatchState({
      ...activeMatchState,
      currentServeSide: newSide,
    });
  };

  const skipGameBreak = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      isGameBreakPaused: false,
      isTimerRunning: true,
    });
  };

  const resetCurrentGame = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      p1CurrentScore: activeMatchState.match.p1HandicapStart ?? 0,
      p2CurrentScore: activeMatchState.match.p2HandicapStart ?? 0,
      currentServeSide: 'R',
      isHandout: false,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      pointLog: activeMatchState.pointLog.filter((e) => e.gameIndex !== activeMatchState.currentGameIndex),
    });
  };

  const resetWholeMatch = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      currentGameIndex: 1,
      p1CurrentScore: activeMatchState.match.p1HandicapStart ?? 0,
      p2CurrentScore: activeMatchState.match.p2HandicapStart ?? 0,
      currentServeSide: 'R',
      timerSeconds: 0,
      isHandout: false,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      lastGameWon: null,
      history: [],
      pointLog: [],
      match: {
        ...activeMatchState.match,
        p1GamesWon: 0,
        p2GamesWon: 0,
        games: [],
        decisions: [],
        status: 'IN_PROGRESS',
        winnerId: undefined,
        totalDurationSeconds: 0,
      },
    });
  };

  const finishActiveMatch = () => {
    if (!activeMatchState) return;

    const finalMatch = {
      ...activeMatchState.match,
      status: 'COMPLETED' as const,
      pointLog: activeMatchState.pointLog,
    };

    setMatches((prev) => [finalMatch, ...prev]);

    if (finalMatch.winnerId) {
      setPlayers((prev) =>
        prev.map((p) => {
          if (p.id === finalMatch.player1.id) {
            const won = finalMatch.winnerId === p.id;
            return { ...p, totalMatches: p.totalMatches + 1, wins: won ? p.wins + 1 : p.wins, losses: won ? p.losses : p.losses + 1 };
          }
          if (p.id === finalMatch.player2.id) {
            const won = finalMatch.winnerId === p.id;
            return { ...p, totalMatches: p.totalMatches + 1, wins: won ? p.wins + 1 : p.wins, losses: won ? p.losses : p.losses + 1 };
          }
          return p;
        })
      );
    }

    setActiveMatchState(null);
  };

  const cancelActiveMatch = () => {
    setActiveMatchState(null);
  };

  const deleteMatch = (matchId: string) => {
    setMatches((prev) => prev.filter((m) => m.id !== matchId));
  };

  const getMatchById = (matchId: string) => matches.find((m) => m.id === matchId);
  const getPlayerById = (playerId: string) => computedPlayers.find((p) => p.id === playerId);

  const addCompetition = (input: {
    name: string;
    format: CompetitionFormat;
    participantIds: string[];
    folderAId?: string;
    folderBId?: string;
    fixtures?: CompetitionFixture[];
    matchFormat?: MatchFormat;
    targetPoints?: number;
  }): Competition => {
    const newCompetition: Competition = {
      id: `comp_${Date.now()}`,
      name: input.name,
      format: input.format,
      status: 'ACTIVE',
      participantIds: input.participantIds,
      folderAId: input.folderAId,
      folderBId: input.folderBId,
      fixtures: input.fixtures,
      matchFormat: input.matchFormat,
      targetPoints: input.targetPoints,
      createdAt: new Date().toISOString(),
    };
    setCompetitions((prev) => [newCompetition, ...prev]);
    return newCompetition;
  };

  const setCompetitionStatus = (competitionId: string, status: CompetitionStatus) => {
    setCompetitions((prev) =>
      prev.map((c) => (c.id === competitionId ? { ...c, status } : c))
    );
  };

  const deleteCompetition = (competitionId: string) => {
    setCompetitions((prev) => prev.filter((c) => c.id !== competitionId));
  };

  return (
    <SquashContext.Provider
      value={{
        players: computedPlayers,
        matches,
        competitions,
        folders,
        activeMatchState,
        settings,
        updateSettings,
        addPlayer,
        updatePlayer,
        deletePlayer,
        updatePlayerFolder,
        addFolder,
        updateFolder,
        deleteFolder,
        startMatch,
        recordPoint,
        recordDecision,
        undoLastAction,
        toggleTimer,
        proceedToGameBreak,
        skipGameBreak,
        toggleGameBreakPause,
        addGameBreakTime,
        toggleServeSide,
        resetCurrentGame,
        resetWholeMatch,
        finishActiveMatch,
        cancelActiveMatch,
        deleteMatch,
        getMatchById,
        getPlayerById,
        addCompetition,
        setCompetitionStatus,
        deleteCompetition,
      }}
    >
      {children}
    </SquashContext.Provider>
  );
};

export const useSquash = () => {
  const context = useContext(SquashContext);
  if (!context) {
    throw new Error('useSquash must be used within a SquashProvider');
  }
  return context;
};
