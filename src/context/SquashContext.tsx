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
  SetWonInfo,
} from '../types/squash';
import { INITIAL_PLAYERS, INITIAL_MATCHES } from '../data/mockData';
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
    avatarBgColor?: string
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
  proceedToSetBreak: () => void;
  skipSetBreak: () => void;
  toggleSetBreakPause: () => void;
  finishActiveMatch: () => void;
  cancelActiveMatch: () => void;
  deleteMatch: (matchId: string) => void;
  getMatchById: (matchId: string) => SquashMatch | undefined;
  getPlayerById: (playerId: string) => Player | undefined;
}

const SquashContext = createContext<SquashContextType | undefined>(undefined);

const LOCAL_STORAGE_PLAYERS = 'letty_squash_players_v2';
const LOCAL_STORAGE_MATCHES = 'letty_squash_matches_v2';
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
      if (activeMatchState.isSetBreakActive && !activeMatchState.isSetBreakPaused) {
        interval = setInterval(() => {
          setActiveMatchState((prev: any) => {
            if (!prev || !prev.isSetBreakActive || prev.isSetBreakPaused) return prev;
            if (prev.setBreakTimerSeconds <= 1) {
              return {
                ...prev,
                isSetBreakActive: false,
                isSetBreakPaused: false,
                setBreakTimerSeconds: 0,
                isTimerRunning: true,
              };
            }
            return {
              ...prev,
              setBreakTimerSeconds: prev.setBreakTimerSeconds - 1,
            };
          });
        }, 1000);
      } else if (activeMatchState.isTimerRunning && !activeMatchState.isSetWonModalOpen && !activeMatchState.isSetBreakActive) {
        interval = setInterval(() => {
          setActiveMatchState((prev: any) => {
            if (!prev || prev.isSetWonModalOpen || prev.isSetBreakActive) return prev;
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
    activeMatchState?.isSetBreakActive,
    activeMatchState?.isSetBreakPaused,
    activeMatchState?.isSetWonModalOpen,
    activeMatchState?.match.status,
  ]);

  const addPlayer = (
    name: string,
    skillGrade: NZSquashGrade,
    countryFlag: string,
    countryCode: string,
    handedness: Handedness,
    avatarBgColor?: string
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
      p1SetsWon: 0,
      p2SetsWon: 0,
      sets: [],
      decisions: [],
      matchFormat: format,
      matchType: matchType,
      targetPoints: 11,
      status: 'IN_PROGRESS',
      totalDurationSeconds: 0,
    };

    setActiveMatchState({
      match: newMatch,
      currentSetIndex: 1,
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
      isSetWonModalOpen: false,
      isSetBreakActive: false,
      isSetBreakPaused: false,
      setBreakTimerSeconds: 90,
      lastSetWon: null,
    });
  };

  const checkSetWinner = (p1Score: number, p2Score: number, target: number): 'p1' | 'p2' | null => {
    if (p1Score >= target && p1Score - p2Score >= 2) return 'p1';
    if (p2Score >= target && p2Score - p1Score >= 2) return 'p2';
    return null;
  };

  const recordPoint = (scoringPlayerId: string) => {
    if (!activeMatchState) return;

    const { match, currentSetIndex, p1CurrentScore, p2CurrentScore, currentServerId, currentServeSide } = activeMatchState;

    const historyEntry = {
      p1Score: p1CurrentScore,
      p2Score: p2CurrentScore,
      serverId: currentServerId,
      serveSide: currentServeSide,
      p1SetsWon: match.p1SetsWon,
      p2SetsWon: match.p2SetsWon,
      currentSetIndex,
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

    const setWinner = checkSetWinner(newP1Score, newP2Score, match.targetPoints);

    let updatedP1SetsWon = match.p1SetsWon;
    let updatedP2SetsWon = match.p2SetsWon;
    let updatedSets = [...match.sets];
    let nextSetIndex = currentSetIndex;
    let matchWinnerId: string | undefined = undefined;
    let isMatchCompleted = false;
    let setWonInfo: SetWonInfo | null = activeMatchState.lastSetWon || null;
    let shouldOpenSetWonModal = false;

    if (setWinner) {
      const winnerPlayerId = setWinner === 'p1' ? match.player1.id : match.player2.id;
      const winnerPlayerName = setWinner === 'p1' ? match.player1.name : match.player2.name;

      updatedSets.push({
        setNumber: currentSetIndex,
        p1Score: newP1Score,
        p2Score: newP2Score,
        winnerId: winnerPlayerId,
        durationSeconds: activeMatchState.timerSeconds,
      });

      if (setWinner === 'p1') updatedP1SetsWon += 1;
      else updatedP2SetsWon += 1;

      setWonInfo = {
        setNumber: currentSetIndex,
        winnerId: winnerPlayerId,
        winnerName: winnerPlayerName,
        p1Score: newP1Score,
        p2Score: newP2Score,
      };

      const setsNeeded = match.matchFormat === 'BEST_OF_5' ? 3 : match.matchFormat === 'BEST_OF_3' ? 2 : 1;

      if (updatedP1SetsWon >= setsNeeded) {
        matchWinnerId = match.player1.id;
        isMatchCompleted = true;
      } else if (updatedP2SetsWon >= setsNeeded) {
        matchWinnerId = match.player2.id;
        isMatchCompleted = true;
      } else {
        nextSetIndex += 1;
        newP1Score = 0;
        newP2Score = 0;
        shouldOpenSetWonModal = true;
      }
    }

    if (isMatchCompleted) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } else if (setWinner) {
      confetti({
        particleCount: 60,
        spread: 60,
        origin: { y: 0.5 },
      });
    }

    const updatedMatch: SquashMatch = {
      ...match,
      p1SetsWon: updatedP1SetsWon,
      p2SetsWon: updatedP2SetsWon,
      sets: updatedSets,
      status: isMatchCompleted ? 'COMPLETED' : 'IN_PROGRESS',
      winnerId: matchWinnerId,
    };

    setActiveMatchState({
      ...activeMatchState,
      match: updatedMatch,
      currentSetIndex: nextSetIndex,
      p1CurrentScore: newP1Score,
      p2CurrentScore: newP2Score,
      currentServerId: newServerId,
      currentServeSide: newServeSide,
      isHandout,
      history: [...activeMatchState.history, historyEntry],
      isTimerRunning: !isMatchCompleted && !shouldOpenSetWonModal,
      isSetWonModalOpen: shouldOpenSetWonModal,
      isSetBreakActive: false,
      isSetBreakPaused: false,
      setBreakTimerSeconds: 90,
      lastSetWon: setWonInfo,
    });
  };

  const recordDecision = (requestingPlayerId: string, decision: DecisionType) => {
    if (!activeMatchState) return;

    const newDecision = {
      id: `d_${Date.now()}`,
      timestamp: new Date().toISOString(),
      setIndex: activeMatchState.currentSetIndex,
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
      currentSetIndex: lastState.currentSetIndex,
      isSetWonModalOpen: false,
      isSetBreakActive: false,
      isSetBreakPaused: false,
      match: {
        ...activeMatchState.match,
        p1SetsWon: lastState.p1SetsWon,
        p2SetsWon: lastState.p2SetsWon,
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

  const proceedToSetBreak = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isSetWonModalOpen: false,
      isSetBreakActive: true,
      isSetBreakPaused: false,
      setBreakTimerSeconds: 90,
    });
  };

  const toggleSetBreakPause = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isSetBreakPaused: !activeMatchState.isSetBreakPaused,
    });
  };

  const skipSetBreak = () => {
    if (!activeMatchState) return;
    setActiveMatchState({
      ...activeMatchState,
      isSetWonModalOpen: false,
      isSetBreakActive: false,
      isSetBreakPaused: false,
      isTimerRunning: true,
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
  const getPlayerById = (playerId: string) => players.find((p) => p.id === playerId);

  return (
    <SquashContext.Provider
      value={{
        players,
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
        proceedToSetBreak,
        skipSetBreak,
        toggleSetBreakPause,
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
