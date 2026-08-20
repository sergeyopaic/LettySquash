import React, { useState, useEffect, useRef } from 'react';
import { useSquash } from '../context/SquashContext';
import { LettyBanner } from './LettyBanner';
import { MatchDetailModal } from './MatchDetailModal';
import type { DecisionType, GameResult, Player } from '../types/squash';
import {
  FileText,
  Plus,
  RotateCcw,
  Pause,
  Play,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  XCircle,
  ChevronRight,
  MoreVertical,
  RefreshCw,
  Trash2,
  AlertTriangle,
  User,
} from 'lucide-react';

interface ScoreboardViewProps {
  // Called with the finished/abandoned match's competitionId when it belongs to a
  // competition fixture, so the app can drop the user back on that competition's page
  // instead of plain Home.
  onExitToHome: (competitionId?: string) => void;
  onSelectPlayerProfile?: (player: Player) => void;
}

type DestructiveActionType = 'RESET_GAME' | 'RESET_MATCH' | 'ABANDON_MATCH' | null;

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({ onExitToHome, onSelectPlayerProfile }) => {
  const {
    activeMatchState,
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
  } = useSquash();

  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState<boolean>(false);
  const [confirmActionType, setConfirmActionType] = useState<DestructiveActionType>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  // Brief confirmation of what the one universal Undo button just rolled back — points
  // and game/match completions already show up as an obvious score change, but a LET/NO
  // LET call has zero other visual footprint during a live match, so without this a
  // referee undoing a decision would have no way to tell it actually did anything.
  const [undoToast, setUndoToast] = useState<string | null>(null);
  const undoToastTimerRef = useRef<number | null>(null);

  // If active match ends or is cancelled, automatically return to main Home screen
  useEffect(() => {
    if (!activeMatchState) {
      onExitToHome();
    }
  }, [activeMatchState, onExitToHome]);

  useEffect(() => {
    return () => {
      if (undoToastTimerRef.current) window.clearTimeout(undoToastTimerRef.current);
    };
  }, []);

  if (!activeMatchState) {
    return null;
  }

  const {
    match,
    currentGameIndex,
    p1CurrentScore,
    p2CurrentScore,
    currentServerId,
    currentServeSide,
    isTimerRunning,
    timerSeconds,
    isGameWonModalOpen,
    isGameBreakActive,
    isGameBreakPaused,
    gameBreakTimerSeconds = 90,
    lastGameWon,
    lastRallyLog,
  } = activeMatchState;

  const isP1Serving = currentServerId === match.player1.id;
  const isMatchCompleted = match.status === 'COMPLETED' && Boolean(match.winnerId);
  // What a game/match reset actually lands on — the handicap head start, if this match has
  // one, not always literally "0-0". Used in the destructive-action confirm dialog so it
  // doesn't promise a score the reset won't actually produce.
  const resetScoreLabel = `${match.p1HandicapStart ?? 0}-${match.p2HandicapStart ?? 0}`;
  const matchWinnerName = match.winnerId === match.player1.id ? match.player1.name : match.player2.name;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleUndo = () => {
    const history = activeMatchState.history;
    const lastEntry = history[history.length - 1];
    if (!lastEntry) return;

    let message: string;
    if (lastEntry.type === 'DECISION') {
      const lastDecision = match.decisions[match.decisions.length - 1];
      const label = lastDecision?.decision === 'NO_LET' ? 'NO LET' : lastDecision?.decision === 'YES_LET' ? 'LET' : 'Decision';
      message = `${label} call undone`;
    } else {
      const gamesWonBeforeThisPoint = lastEntry.p1GamesWon + lastEntry.p2GamesWon;
      const gamesWonNow = match.p1GamesWon + match.p2GamesWon;
      if (isMatchCompleted) {
        message = 'Match result undone';
      } else if (gamesWonNow > gamesWonBeforeThisPoint) {
        message = 'Game-winning point undone';
      } else {
        message = 'Point undone';
      }
    }

    undoLastAction();
    setUndoToast(message);
    if (undoToastTimerRef.current) window.clearTimeout(undoToastTimerRef.current);
    undoToastTimerRef.current = window.setTimeout(() => setUndoToast(null), 2600);
  };

  const handleDecisionClick = (playerId: string) => {
    setSelectedPlayerId(playerId);
    setShowDecisionModal(true);
  };

  const submitDecision = (decision: DecisionType) => {
    if (selectedPlayerId) {
      recordDecision(selectedPlayerId, decision);
    }
    setShowDecisionModal(false);
    setSelectedPlayerId(null);
  };

  const executeConfirmedAction = () => {
    if (confirmActionType === 'RESET_GAME') {
      resetCurrentGame();
    } else if (confirmActionType === 'RESET_MATCH') {
      resetWholeMatch();
    } else if (confirmActionType === 'ABANDON_MATCH') {
      const competitionId = match.competitionId;
      cancelActiveMatch();
      onExitToHome(competitionId);
    }
    setConfirmActionType(null);
    setIsMoreMenuOpen(false);
  };

  const handleSaveAndExit = () => {
    const competitionId = match.competitionId;
    finishActiveMatch();
    onExitToHome(competitionId);
  };

  const getLettyCommentary = () => {
    if (isMatchCompleted) {
      return `🎉 Match Victory! ${matchWinnerName} won the match!`;
    }

    // One point below the target — not always 10, matches can be played to PARS-15 (or any
    // other targetPoints). Whether that's actually "game ball" also depends on whether this
    // match plays a two-point-gap decider (deuce) or ends the instant someone hits target.
    const gameBallThreshold = match.targetPoints - 1;
    const requiresTwoPointGap = match.twoPointGap ?? true;

    if (requiresTwoPointGap) {
      if (p1CurrentScore >= gameBallThreshold && p2CurrentScore >= gameBallThreshold) {
        return '🔥 Tie-break! Win by 2 points!';
      }
      if (p1CurrentScore >= gameBallThreshold && p1CurrentScore - p2CurrentScore === 1) {
        return `⚡ Game ball for ${match.player1.name}!`;
      }
      if (p2CurrentScore >= gameBallThreshold && p2CurrentScore - p1CurrentScore === 1) {
        return `⚡ Game ball for ${match.player2.name}!`;
      }
    } else {
      // No two-point-gap rule: hitting the target wins the game outright, so sitting one
      // point below it is already game ball regardless of how far behind the opponent is.
      if (p1CurrentScore === gameBallThreshold && p2CurrentScore === gameBallThreshold) {
        return '🔥 Match point both ways — next rally wins the game!';
      }
      if (p1CurrentScore === gameBallThreshold) {
        return `⚡ Game ball for ${match.player1.name}!`;
      }
      if (p2CurrentScore === gameBallThreshold) {
        return `⚡ Game ball for ${match.player2.name}!`;
      }
    }

    const serverName = isP1Serving ? match.player1.name : match.player2.name;
    const sideName = currentServeSide === 'L' ? 'Left' : 'Right';
    return `${serverName} serving from ${sideName} box.`;
  };

  return (
    <div className="pb-24 pt-2 px-3 space-y-3 max-w-md mx-auto relative">
      {/* Match Header Controls with high z-index stacking */}
      <div className="ios-glass-card rounded-2xl p-2.5 flex items-center justify-between shadow-xs relative z-30">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-blue-900 text-amber-400 font-black text-[10px] rounded-md uppercase tracking-wider">
            Game {currentGameIndex}
          </span>
          <span className="text-xs font-semibold text-slate-600">
            {match.matchFormat === 'BEST_OF_5' ? 'Best of 5 Games' : match.matchFormat === 'BEST_OF_3' ? 'Best of 3 Games' : 'Single Game'}
          </span>
          {/* Handicap start isn't visible anywhere else on this screen — the score cards
              just show the live number, which already includes it — so without this badge
              a referee glancing mid-game has no way to tell a non-zero score is a handicap
              head start rather than points already scored. */}
          {(match.p1HandicapStart || match.p2HandicapStart) ? (
            <span
              className="px-1.5 py-0.5 bg-amber-100 text-amber-800 font-black text-[9px] rounded-md uppercase tracking-wider"
              title={`${match.player1.name} starts +${match.p1HandicapStart ?? 0}, ${match.player2.name} starts +${match.p2HandicapStart ?? 0}`}
            >
              Handicap
            </span>
          ) : null}
        </div>

        {/* Timer & Safe Overflow Menu Button */}
        <div className="flex items-center space-x-2 relative">
          <button
            onClick={toggleTimer}
            className="p-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            title={isTimerRunning ? 'Pause Match Timer' : 'Resume Match Timer'}
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>

          <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
            {formatTimer(timerSeconds)}
          </span>

          {/* Safe Top-Right Menu Button (•••) */}
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className="p-1.5 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 transition-colors ml-1"
            title="Match Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {/* Backdrop to close dropdown on tap outside */}
          {isMoreMenuOpen && (
            <div
              className="fixed inset-0 z-40 bg-transparent"
              onClick={() => setIsMoreMenuOpen(false)}
            />
          )}

          {/* Top-Right Safe Dropdown Menu (Z-50 Layering On Top of Score Cards) */}
          {isMoreMenuOpen && (
            <div className="absolute right-0 top-9 z-50 bg-white rounded-2xl p-2 shadow-2xl border border-slate-200/90 w-56 space-y-1 animate-in fade-in zoom-in-95 duration-150 ring-1 ring-slate-900/10">
              <div className="px-2.5 py-1 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                Match Management
              </div>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setConfirmActionType('RESET_GAME');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-amber-50 hover:text-amber-900 flex items-center space-x-2 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
                <span>
                  Reset Current Game ({match.p1HandicapStart ?? 0}-{match.p2HandicapStart ?? 0})
                </span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setConfirmActionType('RESET_MATCH');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center space-x-2 transition-colors"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Whole Match</span>
              </button>

              <button
                onClick={() => {
                  setIsMoreMenuOpen(false);
                  setConfirmActionType('ABANDON_MATCH');
                }}
                className="w-full text-left px-2.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 flex items-center space-x-2 transition-colors border-t border-slate-100 pt-2"
              >
                <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                <span>Abandon & Exit to Home</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* COMPACT Letty Match Status Bar */}
      <LettyBanner
        customMessage={getLettyCommentary()}
        variant="match"
      />

      {/* Rally Log Ticker (Shows exact rally outcome, score, and service transition) */}
      <div className="bg-slate-900 text-white p-2 px-3 rounded-2xl flex items-center justify-between shadow-xs border border-slate-800 text-xs font-semibold">
        <div className="flex items-center space-x-1.5 min-w-0">
          <span className="text-[9px] font-black uppercase text-amber-400 tracking-wider bg-amber-400/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
            RALLY LOG
          </span>
          {lastRallyLog ? (
            <span className="truncate text-slate-200">
              <strong className="text-amber-400 font-mono">{lastRallyLog.p1Score}-{lastRallyLog.p2Score}</strong> • {lastRallyLog.scoringPlayerName}
            </span>
          ) : (
            <span className="text-slate-400 text-[11px]">Match started • Awaiting first rally</span>
          )}
        </div>

        {lastRallyLog && (
          <span
            className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md flex-shrink-0 ml-2 ${
              lastRallyLog.isHandout
                ? 'bg-rose-500 text-white shadow-2xs font-extrabold animate-pulse'
                : 'bg-emerald-500 text-white font-extrabold'
            }`}
          >
            {lastRallyLog.isHandout ? 'hand-out 🔄' : 'serve point 🔥'}
          </span>
        )}
      </div>

      {/* Games Won Score Bar */}
      <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-500">
        <span>Games Won: {match.p1GamesWon}</span>
        <span className="text-amber-600 font-extrabold">PARS {match.targetPoints}</span>
        <span>Games Won: {match.p2GamesWon}</span>
      </div>

      {/* Premium Dynamic Scoreboard Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Player 1 Card */}
        <div
          onClick={() => match.status === 'IN_PROGRESS' && recordPoint(match.player1.id)}
          className={`rounded-3xl p-3.5 py-6 flex flex-col justify-between items-center text-center relative overflow-hidden transition-all duration-150 cursor-pointer ${
            isP1Serving
              ? 'bg-gradient-to-br from-white via-amber-50/70 to-blue-50/50 ring-2 ring-amber-400 shadow-xl shadow-amber-500/10'
              : 'bg-white/90 border border-slate-200/90 shadow-md hover:border-slate-300'
          } active:scale-95`}
        >
          {/* Dynamic Serve Box Badge (Interactive Tap-to-Switch) */}
          {isP1Serving && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleServeSide();
              }}
              className={`absolute ${
                currentServeSide === 'L' ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'
              } bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ring-1 ring-amber-500/40 serve-glow animate-pulse z-20 transition-all cursor-pointer active:scale-90 flex items-center space-x-0.5`}
              title="Tap to manually switch serve box (Left ↔ Right)"
            >
              <span>{currentServeSide === 'L' ? 'Left' : 'Right'}</span>
              <span className="opacity-70 text-[8px] font-mono">⇄</span>
            </button>
          )}

          <div className="mt-4 flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white mb-1"
              style={{ backgroundColor: match.player1.avatarBgColor }}
            >
              {match.player1.name.charAt(0)}
            </div>
            <h3 className="font-bold text-slate-900 text-xs line-clamp-1 mt-1">{match.player1.name}</h3>
          </div>

          {/* GIANT SCORE NUMBER — the Appeal button used to live right here, cramping
              this into a small card; it now lives in a shared row below the grid
              (see Appeal Decision Row) so the score digit gets the full card to itself. */}
          <div className="my-3 py-2 px-4 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs min-w-[100px]">
            <span className="text-8xl font-black text-slate-900 tracking-tighter leading-none drop-shadow-2xs">
              {p1CurrentScore}
            </span>
          </div>
        </div>

        {/* Player 2 Card */}
        <div
          onClick={() => match.status === 'IN_PROGRESS' && recordPoint(match.player2.id)}
          className={`rounded-3xl p-3.5 py-6 flex flex-col justify-between items-center text-center relative overflow-hidden transition-all duration-150 cursor-pointer ${
            !isP1Serving
              ? 'bg-gradient-to-br from-white via-amber-50/70 to-blue-50/50 ring-2 ring-amber-400 shadow-xl shadow-amber-500/10'
              : 'bg-white/90 border border-slate-200/90 shadow-md hover:border-slate-300'
          } active:scale-95`}
        >
          {/* Dynamic Serve Box Badge (Interactive Tap-to-Switch) */}
          {!isP1Serving && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleServeSide();
              }}
              className={`absolute ${
                currentServeSide === 'L' ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'
              } bg-amber-400 hover:bg-amber-300 text-blue-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ring-1 ring-amber-500/40 serve-glow animate-pulse z-20 transition-all cursor-pointer active:scale-90 flex items-center space-x-0.5`}
              title="Tap to manually switch serve box (Left ↔ Right)"
            >
              <span>{currentServeSide === 'L' ? 'Left' : 'Right'}</span>
              <span className="opacity-70 text-[8px] font-mono">⇄</span>
            </button>
          )}

          <div className="mt-4 flex flex-col items-center">
            <div
              className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white mb-1"
              style={{ backgroundColor: match.player2.avatarBgColor }}
            >
              {match.player2.name.charAt(0)}
            </div>
            <h3 className="font-bold text-slate-900 text-xs line-clamp-1 mt-1">{match.player2.name}</h3>
          </div>

          {/* GIANT SCORE NUMBER */}
          <div className="my-3 py-2 px-4 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs min-w-[100px]">
            <span className="text-8xl font-black text-slate-900 tracking-tighter leading-none drop-shadow-2xs">
              {p2CurrentScore}
            </span>
          </div>
        </div>
      </div>

      {/* Appeal Decision Row — one row shared below both score cards, columns still line
          up with the player above them, so it reads as "this player's appeal button"
          without eating into either card's own vertical space. */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleDecisionClick(match.player1.id)}
          className="py-2 bg-white/90 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200/80 shadow-2xs transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Appeal LET / STROKE</span>
        </button>
        <button
          onClick={() => handleDecisionClick(match.player2.id)}
          className="py-2 bg-white/90 hover:bg-slate-100 text-slate-700 font-bold text-[11px] rounded-xl flex items-center justify-center space-x-1.5 border border-slate-200/80 shadow-2xs transition-colors"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
          <span>Appeal LET / STROKE</span>
        </button>
      </div>

      {/* Referee Controls Footer Toolbar. There's deliberately no "exit early" button
          here anymore — leaving a match that isn't actually finished yet only happens
          through the ••• menu's "Abandon & Exit to Home", which has its own confirmation
          dialog. A one-tap, no-confirmation exit sitting right under the score cards was
          too easy to hit by accident and would silently save the match as COMPLETED
          mid-game. Save & Exit only appears once the match has genuinely finished. */}
      <div className="ios-glass-card rounded-2xl p-2.5 space-y-2 shadow-xs relative">
        {/* absolute + bottom-full so this floats above the card instead of sitting in
            normal flow — a toast that pushed the Undo button down would make a second,
            immediate tap (undoing two things back-to-back) land on the wrong spot. */}
        {undoToast && (
          <div className="absolute bottom-full left-0 right-0 mb-2 flex items-center justify-center space-x-1.5 text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200 rounded-xl py-1.5 shadow-md animate-in fade-in slide-in-from-bottom-1 duration-200 pointer-events-none">
            <RotateCcw className="w-3 h-3" />
            <span>{undoToast}</span>
          </div>
        )}

        {/* One universal Undo — covers points, STROKE calls (a point under the hood),
            LET/NO LET calls, and game/match completions, all through the same history
            stack (see SquashContext.undoLastAction). No separate undo mechanism per
            action type. */}
        <button
          onClick={handleUndo}
          disabled={activeMatchState.history.length === 0}
          className="w-full flex items-center justify-center space-x-2 text-sm font-bold text-slate-700 disabled:opacity-40 hover:text-slate-900 px-4 py-3 rounded-xl hover:bg-slate-100 transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Undo</span>
        </button>

        {isMatchCompleted && (
          <button
            onClick={handleSaveAndExit}
            className="w-full bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-sm px-4 py-3 rounded-xl shadow-sm flex items-center justify-center space-x-2 transition-transform active:scale-95 border border-slate-800"
          >
            <CheckCircle2 className="w-5 h-5 text-amber-400" />
            <span>Save & Exit to Home</span>
          </button>
        )}
      </div>

      {/* Previous Games Breakdown Summary */}
      {match.games.length > 0 && (
        <div className="ios-card p-3 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Completed Games Results
          </h4>
          <div className="space-y-1">
            {match.games.map((g: GameResult) => (
              <div
                key={g.gameNumber}
                className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-600">Game #{g.gameNumber}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {g.p1Score} : {g.p2Score}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Winner: {g.winnerId === match.player1.id ? match.player1.name : match.player2.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SAFETY CONFIRMATION MODAL OVERLAY */}
      {confirmActionType && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 text-center border border-slate-200">
            <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900">
                {confirmActionType === 'RESET_GAME'
                  ? `Reset Game ${currentGameIndex}?`
                  : confirmActionType === 'RESET_MATCH'
                  ? 'Reset Entire Match?'
                  : 'Abandon Match Session?'}
              </h3>

              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                {confirmActionType === 'RESET_GAME' &&
                  `Current game score (${p1CurrentScore} - ${p2CurrentScore}) will be reset back to ${resetScoreLabel}. Completed games will remain saved.`}
                {confirmActionType === 'RESET_MATCH' &&
                  `All completed games and current scores will be completely cleared back to Game 1 (${resetScoreLabel}).`}
                {confirmActionType === 'ABANDON_MATCH' &&
                  'The referee session will exit immediately and you will return to the main Home screen.'}
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={executeConfirmedAction}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-transform active:scale-98"
              >
                {confirmActionType === 'RESET_GAME'
                  ? `Yes, Reset Game (${resetScoreLabel})`
                  : confirmActionType === 'RESET_MATCH'
                  ? 'Yes, Reset Entire Match'
                  : 'Yes, Abandon & Return Home'}
              </button>

              <button
                onClick={() => setConfirmActionType(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
              >
                Cancel (Keep Playing)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Decision Modal Popup */}
      {showDecisionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-xs w-full shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="text-center">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600 mx-auto mb-2">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-900 text-base">WSF Referee Decision</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Appeal by{' '}
                <span className="font-bold text-blue-900">
                  {selectedPlayerId === match.player1.id ? match.player1.name : match.player2.name}
                </span>
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => submitDecision('YES_LET')}
                className="w-full p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl flex items-center space-x-3 text-left transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs text-amber-950">YES LET (Replay Point)</p>
                  <p className="text-[10px] text-amber-800">Replay allowed, score remains unchanged</p>
                </div>
              </button>

              <button
                onClick={() => submitDecision('STROKE')}
                className="w-full p-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-left transition-colors"
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs text-emerald-950">STROKE (Point Awarded)</p>
                  <p className="text-[10px] text-emerald-800">Interference in swing path, point to appealing player</p>
                </div>
              </button>

              <button
                onClick={() => submitDecision('NO_LET')}
                className="w-full p-3 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl flex items-center space-x-3 text-left transition-colors"
              >
                <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <p className="font-bold text-xs text-rose-950">NO LET (Denied)</p>
                  <p className="text-[10px] text-rose-800">No interference or player declined shot</p>
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowDecisionModal(false)}
              className="w-full py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* SCREEN 1: GAME VICTORY CONGRATULATION MODAL (Static letty_thumbs_up.png) */}
      {isGameWonModalOpen && lastGameWon && !isMatchCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Mascot Thumbs Up Artwork (STATIC: no letty-bounce).
                No colored border/corner badge here — the amber ring read as a meaningless
                "selected layer" outline (not a status/achievement indicator, and not part
                of any frame system elsewhere in the app), and the trophy badge collided
                with the established "small circle in the corner = unread notification"
                pattern, on top of low gold-on-gold contrast. The "Game N Completed" pill
                below already carries the celebratory framing — this just shows the art. */}
            <div className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden shadow-xl bg-amber-50">
              <img
                src="/assets/letty_thumbs_up.png"
                alt="Letty Game Won Thumbs Up"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-950 bg-amber-400 px-3 py-1 rounded-full shadow-xs">
                Game {lastGameWon.gameNumber} Completed 🎉
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Game Won by {lastGameWon.winnerName}!
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Final Game Score: <span className="text-slate-900 font-bold">{lastGameWon.p1Score} - {lastGameWon.p2Score}</span>
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Great play! Tap below to start the official 90-second WSF rest break before Game {currentGameIndex}.
            </p>

            <div className="space-y-2">
              <button
                onClick={proceedToGameBreak}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
              >
                <span>Proceed to 90s Rest Break</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                onClick={skipGameBreak}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Skip Break & Play Game {currentGameIndex} Immediately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: BETWEEN-GAMES REST BREAK MODAL (Hero Circular Timer + Visual Progress Ring) */}
      {isGameBreakActive && !isMatchCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Minimal Header */}
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full inline-block">
                WSF Rest Break • 90 Seconds
              </span>
              <h3 className="text-base font-black text-slate-900 mt-1">Between-Games Interval</h3>
              {lastGameWon && (
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  Previous game: <span className="text-slate-800 font-semibold">{lastGameWon.winnerName}</span> ({lastGameWon.p1Score}–{lastGameWon.p2Score})
                </p>
              )}
            </div>

            {/* HERO HERO OBJECT: GIANT CIRCULAR SVG PROGRESS TIMER */}
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center my-1">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring Track */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className="text-slate-100"
                  strokeWidth="11"
                  stroke="currentColor"
                  fill="transparent"
                />
                {/* Draining Progress Ring (Smooth Countdown) */}
                <circle
                  cx="80"
                  cy="80"
                  r="68"
                  className={`transition-all duration-1000 ease-linear ${
                    gameBreakTimerSeconds <= 15 ? 'text-rose-500' : 'text-amber-400'
                  }`}
                  strokeWidth="11"
                  strokeDasharray={427.25}
                  strokeDashoffset={427.25 * (1 - Math.max(0, gameBreakTimerSeconds) / 90)}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                />
              </svg>

              {/* CENTER DISPLAY: Giant Readable Digital Clock + Status */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-5xl font-mono font-black text-slate-900 tracking-tighter leading-none">
                  {formatTimer(gameBreakTimerSeconds)}
                </span>
                <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-widest mt-1">
                  {isGameBreakPaused ? '⏸ Paused' : '⏱ Remaining'}
                </span>
              </div>
            </div>

            {/* Secondary Utility Controls: +30s Extension & Pause / Resume */}
            <div className="flex items-center justify-center space-x-2">
              <button
                type="button"
                onClick={() => addGameBreakTime(30)}
                className="px-3 py-1.5 rounded-xl flex items-center space-x-1 font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors cursor-pointer"
                title="Add +30 seconds for injury, floor wiping, or referee discussion"
              >
                <Plus className="w-3.5 h-3.5 text-slate-500" />
                <span>+30 sec</span>
              </button>

              <button
                type="button"
                onClick={toggleGameBreakPause}
                className="px-3.5 py-1.5 rounded-xl flex items-center space-x-1.5 font-semibold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200/80 transition-colors cursor-pointer"
              >
                {isGameBreakPaused ? (
                  <Play className="w-3.5 h-3.5 fill-current text-slate-700" />
                ) : (
                  <Pause className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{isGameBreakPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>

            {/* Demoted Mascot Advice Card (Letty Avatar 40px next to tip text) */}
            <div className="bg-amber-50/80 border border-amber-200/80 p-3 rounded-2xl flex items-center space-x-3 text-left shadow-2xs">
              <img
                src="/assets/letty_break.png"
                alt="Letty Mascot"
                className="w-10 h-10 rounded-full border border-amber-300 object-cover flex-shrink-0 shadow-xs"
              />
              <div className="text-xs text-slate-700 leading-tight">
                <span className="font-extrabold text-amber-950 block text-[11px]">Letty's Rest Tip:</span>
                <p className="text-slate-600 text-[11px] mt-0.5">Drink water, towel off sweat, and review tactics for Game {currentGameIndex}!</p>
              </div>
            </div>

            {/* Skip Break Action Button */}
            <button
              onClick={skipGameBreak}
              className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-slate-900 hover:from-slate-800 hover:to-blue-950 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98"
            >
              <span>Skip Rest & Start Game {currentGameIndex}</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* MATCH VICTORY MODAL (STATIC: letty_winner.png) */}
      {isMatchCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Mascot Victory Artwork (STATIC: no letty-bounce) — same reasoning as the
                Game Won mascot above: no meaningless amber outline, "MATCH CHAMPION" pill
                below already carries the celebratory framing. */}
            <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden shadow-xl bg-amber-50">
              <img
                src="/assets/letty_winner.png"
                alt="Letty Match Champion"
                className="w-full h-full object-cover"
              />
            </div>

            {(() => {
              const isP1Winner = match.winnerId === match.player1.id;
              const winnerPlayer = isP1Winner ? match.player1 : match.player2;
              const loserPlayer = isP1Winner ? match.player2 : match.player1;
              const winnerGames = isP1Winner ? match.p1GamesWon : match.p2GamesWon;
              const loserGames = isP1Winner ? match.p2GamesWon : match.p1GamesWon;

              return (
                <>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 bg-amber-400 px-3 py-1 rounded-full shadow-xs">
                      MATCH CHAMPION
                    </span>
                    <h2
                      onClick={() => onSelectPlayerProfile?.(winnerPlayer)}
                      className="text-xl font-black text-slate-900 mt-2 flex items-center justify-center space-x-1.5 cursor-pointer hover:underline"
                      title={`View ${winnerPlayer.name}'s profile`}
                    >
                      <span>{matchWinnerName}</span>
                      <User className="w-4 h-4 text-slate-400" />
                    </h2>
                  </div>

                  {/* Winner-First Score Bar (Pure Amber + Navy palette, Zero Green, Pixel-perfect baseline & flag alignment) */}
                  <div className="bg-amber-500/10 border border-amber-300/80 p-3 rounded-2xl flex items-center justify-between px-3.5 my-2 shadow-2xs">
                    {/* Left Player (Winner) */}
                    <div
                      onClick={() => onSelectPlayerProfile?.(winnerPlayer)}
                      className="text-left min-w-0 flex-1 flex items-center space-x-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                      title={`View ${winnerPlayer.name}'s profile`}
                    >
                      <span className="font-extrabold text-slate-900 text-xs truncate hover:underline">
                        {winnerPlayer.name}
                      </span>
                    </div>

                    {/* Center Score */}
                    <div className="text-center font-mono font-black text-2xl text-slate-900 px-3 flex-shrink-0 tracking-tight">
                      {winnerGames} <span className="text-slate-400 font-normal text-lg mx-0.5">—</span> {loserGames}
                    </div>

                    {/* Right Player (Loser) */}
                    <div
                      onClick={() => onSelectPlayerProfile?.(loserPlayer)}
                      className="text-right min-w-0 flex-1 flex items-center justify-end space-x-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                      title={`View ${loserPlayer.name}'s profile`}
                    >
                      <span className="font-bold text-slate-500 text-xs truncate hover:underline">
                        {loserPlayer.name}
                      </span>
                    </div>
                  </div>

                  {/* Game Scores Breakdown Table with Headers & Winner Highlights */}
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest text-center">
                      Detailed Game Scores
                    </p>

                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xs">
                      {/* Table Header with Player Names (Strictly Winner Left, Loser Right) */}
                      <div className="grid grid-cols-5 text-[10px] font-extrabold text-slate-500 bg-slate-100/90 py-1.5 px-2 text-center uppercase tracking-wider border-b border-slate-200">
                        <span className="col-span-1 text-left">GAME</span>
                        <span
                          onClick={() => onSelectPlayerProfile?.(winnerPlayer)}
                          className="col-span-2 truncate text-slate-900 cursor-pointer hover:underline"
                          title={`View ${winnerPlayer.name}'s profile`}
                        >
                          {winnerPlayer.name}
                        </span>
                        <span
                          onClick={() => onSelectPlayerProfile?.(loserPlayer)}
                          className="col-span-2 truncate text-amber-600 cursor-pointer hover:underline"
                          title={`View ${loserPlayer.name}'s profile`}
                        >
                          {loserPlayer.name}
                        </span>
                      </div>

                      {/* Table Rows per Game */}
                      {match.games.map((g: GameResult) => {
                        const winnerScore = isP1Winner ? g.p1Score : g.p2Score;
                        const loserScore = isP1Winner ? g.p2Score : g.p1Score;
                        const isWinnerGameWinner = winnerScore > loserScore;

                        return (
                          <div
                            key={g.gameNumber}
                            className="grid grid-cols-5 text-xs py-1.5 px-2 border-b border-slate-100 last:border-0 items-center text-center font-mono"
                          >
                            <span className="col-span-1 text-left font-bold text-slate-400 text-[11px] font-sans">
                              #{g.gameNumber}
                            </span>
                            <div className="col-span-2 flex justify-center">
                              <span
                                className={
                                  isWinnerGameWinner
                                    ? 'font-black text-slate-900 text-sm font-mono'
                                    : 'font-medium text-slate-400 text-xs font-mono'
                                }
                              >
                                {winnerScore}
                              </span>
                            </div>
                            <div className="col-span-2 flex justify-center">
                              <span
                                className={
                                  !isWinnerGameWinner
                                    ? 'font-black text-amber-600 text-sm font-mono'
                                    : 'font-medium text-slate-400 text-xs font-mono'
                                }
                              >
                                {loserScore}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Match Meta Details Summary Line */}
                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-center space-x-2 text-[11px] font-medium text-slate-500">
                      <span>{Math.max(1, Math.round((match.totalDurationSeconds || timerSeconds || 0) / 60))} min</span>
                      <span>•</span>
                      <span>
                        {match.matchFormat === 'BEST_OF_5'
                          ? 'Best of 5'
                          : match.matchFormat === 'BEST_OF_3'
                          ? 'Best of 3'
                          : 'Single Game'}
                      </span>
                      <span>•</span>
                      <span>{match.games.reduce((acc, g) => acc + g.p1Score + g.p2Score, 0)} rallies</span>
                    </div>
                  </div>
                </>
              );
            })()}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-2xl shadow-lg border border-slate-800 flex items-center justify-center space-x-2 transition-transform active:scale-98 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>View Detailed Match Report</span>
              </button>

              <button
                onClick={handleSaveAndExit}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl border border-slate-200/80 transition-colors cursor-pointer"
              >
                <span>Save Match & Exit to Home</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MATCH REPORT DETAIL MODAL */}
      {isReportModalOpen && (
        <MatchDetailModal
          match={match}
          onClose={() => setIsReportModalOpen(false)}
        />
      )}
    </div>
  );
};
