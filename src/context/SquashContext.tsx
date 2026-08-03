import React, { createContext, useContext, useState, useEffect } from 'react';
import type {
  Player,
  SquashMatch,
  LiveMatchState,
  MatchFormat,
  MatchType,
  ServeSide,
  DecisionType,
  NZSquashGrade,
  Handedness,
  AppSettings,
  GameWonInfo,
} from '../types/squash';
import { INITIAL_PLAYERS, INITIAL_MATCHES } from '../data/mockData';
import { computePlayerStats } from '../utils/clubUtils';
import confetti from 'canvas-confetti';

interface SquashContextType {
  players: Player[];
  matches: SquashMatch[];
  activeMatchState: LiveMatchState | null;
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  addPlayer: (
    name: string,
    skillGrade: NZSquashGrade,
    countryFlag: string,
    countryCode: string,
    handedness: Handedness,
    avatarBgColor?: string,
    clubId?: string
  ) => Player;
  deletePlayer: (id: string) => void;
  startMatch: (
    player1Id: string,
    player2Id: string,
    format: MatchFormat,
    matchType: MatchType,
    initialServerId: string,
    serveSide: ServeSide
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
}

const SquashContext = createContext<SquashContextType | undefined>(undefined);

const LOCAL_STORAGE_PLAYERS = 'letty_squash_players_v4';
const LOCAL_STORAGE_MATCHES = 'letty_squash_matches_v4';
const LOCAL_STORAGE_SETTINGS = 'letty_squash_settings_v1';

export const SquashProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_PLAYERS);
    return saved ? JSON.parse(saved) : INITIAL_PLAYERS;
  });

  const [matches, setMatches] = useState<SquashMatch[]>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_MATCHES);
    return saved ? JSON.parse(saved) : INITIAL_MATCHES;
  });

  // Dynamically compute player W/L statistics based on actual matches in the log
  const computedPlayers = React.useMemo(() => {
    return computePlayerStats(players, matches);
  }, [players, matches]);

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS);
    return saved ? JSON.parse(saved) : { showMascotTips: true, soundEffects: true, hapticFeedback: true };
  });

  const [activeMatchState, setActiveMatchState] = useState<LiveMatchState | null>(null);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_PLAYERS, JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MATCHES, JSON.stringify(matches));
  }, [matches]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS, JSON.stringify(settings));
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

  const addPlayer = (
    name: string,
    skillGrade: NZSquashGrade,
    countryFlag: string,
    countryCode: string,
    handedness: Handedness,
    avatarBgColor?: string,
    clubId?: string
  ): Player => {
    const colors = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4'];
    const randomColor = avatarBgColor || colors[Math.floor(Math.random() * colors.length)];
    const newPlayer: Player = {
      id: `p_${Date.now()}`,
      name,
      skillGrade,
      countryFlag,
      countryCode,
      handedness,
      avatarBgColor: randomColor,
      clubId,
      totalMatches: 0,
      wins: 0,
      losses: 0,
      createdAt: new Date().toISOString(),
    };
    setPlayers((prev) => [newPlayer, ...prev]);
    return newPlayer;
  };

  const deletePlayer = (id: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
  };

  const startMatch = (
    player1Id: string,
    player2Id: string,
    format: MatchFormat,
    matchType: MatchType,
    initialServerId: string,
    serveSide: ServeSide
  ) => {
    const p1 = players.find((p) => p.id === player1Id) || players[0];
    const p2 = players.find((p) => p.id === player2Id) || players.find((p) => p.id !== p1?.id) || players[1];

    if (!p1 || !p2) {
      alert('Please add at least 2 players before starting a match!');
      return;
    }

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
      targetPoints: 11,
      status: 'IN_PROGRESS',
      totalDurationSeconds: 0,
    };

    setActiveMatchState({
      match: newMatch,
      currentGameIndex: 1,
      p1CurrentScore: 0,
      p2CurrentScore: 0,
      currentServerId: serverId,
      currentServeSide: serveSide,
      isPaused: false,
      decisions: [],
      isHandout: false,
      history: [],
      timerSeconds: 0,
      isTimerRunning: true,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      isGameBreakPaused: false,
      gameBreakTimerSeconds: 90,
      lastGameWon: null,
    });
  };

  const checkGameWinner = (p1Score: number, p2Score: number, target: number): 'p1' | 'p2' | null => {
    if (p1Score >= target && p1Score - p2Score >= 2) return 'p1';
    if (p2Score >= target && p2Score - p1Score >= 2) return 'p2';
    return null;
  };

  const recordPoint = (scoringPlayerId: string) => {
    if (!activeMatchState) return;

    const { match, currentGameIndex, p1CurrentScore, p2CurrentScore, currentServerId, currentServeSide } = activeMatchState;

    const historyEntry = {
      p1Score: p1CurrentScore,
      p2Score: p2CurrentScore,
      serverId: currentServerId,
      serveSide: currentServeSide,
      p1GamesWon: match.p1GamesWon,
      p2GamesWon: match.p2GamesWon,
      currentGameIndex,
      lastRallyLog: activeMatchState.lastRallyLog || null,
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
      scoringPlayerFlag: scoringPlayer.countryFlag,
      isHandout,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const gameWinner = checkGameWinner(newP1Score, newP2Score, match.targetPoints);

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
        newP1Score = 0;
        newP2Score = 0;
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

    setActiveMatchState({
      ...activeMatchState,
      match: {
        ...activeMatchState.match,
        decisions: updatedDecisions,
      },
    });

    if (decision === 'STROKE') {
      recordPoint(requestingPlayerId);
    }
  };

  const undoLastAction = () => {
    if (!activeMatchState || activeMatchState.history.length === 0) return;

    const previousHistory = [...activeMatchState.history];
    const lastState = previousHistory.pop();

    if (!lastState) return;

    setActiveMatchState({
      ...activeMatchState,
      p1CurrentScore: lastState.p1Score,
      p2CurrentScore: lastState.p2Score,
      currentServerId: lastState.serverId,
      currentServeSide: lastState.serveSide,
      currentGameIndex: lastState.currentGameIndex,
      lastRallyLog: lastState.lastRallyLog || null,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      isGameBreakPaused: false,
      match: {
        ...activeMatchState.match,
        p1GamesWon: lastState.p1GamesWon,
        p2GamesWon: lastState.p2GamesWon,
        status: 'IN_PROGRESS',
        winnerId: undefined,
      },
      history: previousHistory,
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
      p1CurrentScore: 0,
      p2CurrentScore: 0,
      currentServeSide: 'R',
      isHandout: false,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
    });
  };

  const resetWholeMatch = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      currentGameIndex: 1,
      p1CurrentScore: 0,
      p2CurrentScore: 0,
      currentServeSide: 'R',
      timerSeconds: 0,
      isHandout: false,
      isGameWonModalOpen: false,
      isGameBreakActive: false,
      lastGameWon: null,
      history: [],
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

  return (
    <SquashContext.Provider
      value={{
        players: computedPlayers,
        matches,
        activeMatchState,
        settings,
        updateSettings,
        addPlayer,
        deletePlayer,
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
