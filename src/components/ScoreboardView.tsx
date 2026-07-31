import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { LettyBanner } from './LettyBanner';
import type { DecisionType } from '../types/squash';
import {
  RotateCcw,
  Pause,
  Play,
  CheckCircle2,
  ShieldAlert,
  HelpCircle,
  XCircle,
  Plus,
  Clock,
  ChevronRight,
  Trophy,
  Award,
} from 'lucide-react';
import { SquashBallIcon } from './DashboardView';

interface ScoreboardViewProps {
  openNewMatchModal?: () => void;
}

export const ScoreboardView: React.FC<ScoreboardViewProps> = ({ openNewMatchModal }) => {
  const {
    activeMatchState,
    recordPoint,
    recordDecision,
    undoLastAction,
    toggleTimer,
    proceedToSetBreak,
    skipSetBreak,
    toggleSetBreakPause,
    finishActiveMatch,
    cancelActiveMatch,
  } = useSquash();

  const [showDecisionModal, setShowDecisionModal] = useState<boolean>(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState<string | null>(null);

  if (!activeMatchState) {
    return (
      <div className="pb-24 pt-4 px-4 max-w-md mx-auto space-y-5 animate-in fade-in duration-300">
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-900 mx-auto flex items-center justify-center shadow-lg ring-4 ring-slate-100">
            <SquashBallIcon className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Court Referee Counter</h2>
          <p className="text-xs text-slate-500 max-w-xs mx-auto">
            Live referee counter for World Squash Federation PARS 11 matches.
          </p>
        </div>

        <LettyBanner
          variant="home"
          customMessage="No active game on court! Tap below to start refereeing a new squash match."
        />

        <div className="ios-card p-6 text-center space-y-4 bg-gradient-to-br from-white via-slate-50 to-blue-50/50">
          <div className="w-16 h-16 rounded-full bg-blue-900/10 text-blue-900 mx-auto flex items-center justify-center">
            <Play className="w-8 h-8 fill-current ml-1" />
          </div>

          <div>
            <h3 className="font-bold text-slate-900 text-base">Start a New Match</h3>
            <p className="text-xs text-slate-500 mt-1">Select players, serve box & match format</p>
          </div>

          <button
            onClick={openNewMatchModal}
            className="w-full py-3.5 bg-blue-900 hover:bg-slate-800 text-white font-extrabold text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Setup New Match</span>
          </button>
        </div>
      </div>
    );
  }

  const {
    match,
    currentSetIndex,
    p1CurrentScore,
    p2CurrentScore,
    currentServerId,
    currentServeSide,
    isTimerRunning,
    timerSeconds,
    isSetWonModalOpen,
    isSetBreakActive,
    isSetBreakPaused,
    setBreakTimerSeconds,
    lastSetWon,
  } = activeMatchState;

  const isP1Serving = currentServerId === match.player1.id;
  const isMatchCompleted = match.status === 'COMPLETED' && Boolean(match.winnerId);
  const matchWinnerName = match.winnerId === match.player1.id ? match.player1.name : match.player2.name;
  const matchWinnerFlag = match.winnerId === match.player1.id ? match.player1.countryFlag : match.player2.countryFlag;

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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

  const getLettyCommentary = () => {
    if (isMatchCompleted) {
      return `🎉 Match Victory! ${matchWinnerName} won the match!`;
    }
    if (p1CurrentScore >= 10 && p2CurrentScore >= 10) {
      return '🔥 Tie-break! Win by 2 points!';
    }
    if (p1CurrentScore >= 10 && p1CurrentScore - p2CurrentScore === 1) {
      return `⚡ Set ball for ${match.player1.name}!`;
    }
    if (p2CurrentScore >= 10 && p2CurrentScore - p1CurrentScore === 1) {
      return `⚡ Set ball for ${match.player2.name}!`;
    }
    const serverName = isP1Serving ? match.player1.name : match.player2.name;
    const sideName = currentServeSide === 'L' ? 'Left' : 'Right';
    return `${serverName} serving from ${sideName} box.`;
  };

  return (
    <div className="pb-24 pt-2 px-3 space-y-3 max-w-md mx-auto">
      {/* Match Header Controls */}
      <div className="ios-glass-card rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 bg-blue-900 text-amber-400 font-black text-[10px] rounded-md uppercase tracking-wider">
            Set {currentSetIndex}
          </span>
          <span className="text-xs font-semibold text-slate-600">
            {match.matchFormat === 'BEST_OF_5' ? 'Best of 5' : match.matchFormat === 'BEST_OF_3' ? 'Best of 3' : 'Single Set'}
          </span>
        </div>

        {/* Timer */}
        <div className="flex items-center space-x-2">
          <button
            onClick={toggleTimer}
            className="p-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
          >
            {isTimerRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-current" />}
          </button>
          <span className="font-mono font-bold text-xs text-slate-800 bg-slate-100 px-2 py-1 rounded-lg">
            {formatTimer(timerSeconds)}
          </span>
        </div>
      </div>

      {/* COMPACT Letty Match Status Bar (using letty_play.png with NO title tag) */}
      <LettyBanner
        customMessage={getLettyCommentary()}
        variant="match"
      />

      {/* Sets Won Score Bar */}
      <div className="flex items-center justify-between px-2 text-[11px] font-bold text-slate-500">
        <span>Sets Won: {match.p1SetsWon}</span>
        <span className="text-amber-600 font-extrabold">PARS 11</span>
        <span>Sets Won: {match.p2SetsWon}</span>
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
          {/* Dynamic Serve Box Badge */}
          {isP1Serving && (
            <div
              className={`absolute ${
                currentServeSide === 'L' ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'
              } bg-amber-400 text-blue-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ring-1 ring-amber-500/40 serve-glow animate-pulse z-10`}
            >
              {currentServeSide === 'L' ? 'Left' : 'Right'}
            </div>
          )}

          <div className="mt-4 flex flex-col items-center">
            <div className="relative mb-1">
              <div
                className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white"
                style={{ backgroundColor: match.player1.avatarBgColor }}
              >
                {match.player1.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-2xs">
                {match.player1.countryFlag}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-xs line-clamp-1 mt-1">{match.player1.name}</h3>
            <span className="text-[9px] text-amber-700 font-extrabold bg-amber-100/80 px-2 py-0.5 rounded-md mt-0.5">
              {match.player1.skillGrade}
            </span>
          </div>

          {/* GIANT SCORE NUMBER */}
          <div className="my-3 py-1 px-4 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs min-w-[90px]">
            <span className="text-7xl font-black text-slate-900 tracking-tighter leading-none drop-shadow-2xs">
              {p1CurrentScore}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDecisionClick(match.player1.id);
            }}
            className="w-full py-1.5 bg-slate-100/90 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl flex items-center justify-center space-x-1 border border-slate-200/60 transition-colors"
          >
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>Appeal LET / STROKE</span>
          </button>
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
          {/* Dynamic Serve Box Badge */}
          {!isP1Serving && (
            <div
              className={`absolute ${
                currentServeSide === 'L' ? 'top-2.5 left-2.5' : 'top-2.5 right-2.5'
              } bg-amber-400 text-blue-950 font-black text-[9px] px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm ring-1 ring-amber-500/40 serve-glow animate-pulse z-10`}
            >
              {currentServeSide === 'L' ? 'Left' : 'Right'}
            </div>
          )}

          <div className="mt-4 flex flex-col items-center">
            <div className="relative mb-1">
              <div
                className="w-12 h-12 rounded-full text-white font-bold flex items-center justify-center text-sm shadow-md ring-2 ring-white"
                style={{ backgroundColor: match.player2.avatarBgColor }}
              >
                {match.player2.name.charAt(0)}
              </div>
              <span className="absolute -bottom-1 -right-1 text-xs bg-white rounded-full p-0.5 shadow-2xs">
                {match.player2.countryFlag}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-xs line-clamp-1 mt-1">{match.player2.name}</h3>
            <span className="text-[9px] text-amber-700 font-extrabold bg-amber-100/80 px-2 py-0.5 rounded-md mt-0.5">
              {match.player2.skillGrade}
            </span>
          </div>

          {/* GIANT SCORE NUMBER */}
          <div className="my-3 py-1 px-4 rounded-2xl bg-white/70 border border-slate-100 shadow-2xs min-w-[90px]">
            <span className="text-7xl font-black text-slate-900 tracking-tighter leading-none drop-shadow-2xs">
              {p2CurrentScore}
            </span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDecisionClick(match.player2.id);
            }}
            className="w-full py-1.5 bg-slate-100/90 hover:bg-slate-200 text-slate-700 font-bold text-[10px] rounded-xl flex items-center justify-center space-x-1 border border-slate-200/60 transition-colors"
          >
            <ShieldAlert className="w-3 h-3 text-amber-600" />
            <span>Appeal LET / STROKE</span>
          </button>
        </div>
      </div>

      {/* Referee Controls Footer Toolbar */}
      <div className="ios-glass-card rounded-2xl p-2.5 flex items-center justify-between shadow-xs">
        <button
          onClick={undoLastAction}
          disabled={activeMatchState.history.length === 0}
          className="flex items-center space-x-1 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:text-slate-900 px-2.5 py-1.5 rounded-xl hover:bg-slate-100"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Undo</span>
        </button>

        {isMatchCompleted ? (
          <button
            onClick={finishActiveMatch}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-sm flex items-center space-x-1"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Save to History</span>
          </button>
        ) : (
          <button
            onClick={finishActiveMatch}
            className="bg-blue-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl shadow-sm"
          >
            Finish Match
          </button>
        )}

        <button
          onClick={cancelActiveMatch}
          className="text-xs font-semibold text-rose-500 hover:text-rose-700 px-2.5 py-1.5 rounded-xl hover:bg-rose-50"
        >
          Reset
        </button>
      </div>

      {/* Previous Sets Breakdown Summary */}
      {match.sets.length > 0 && (
        <div className="ios-card p-3 space-y-2">
          <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Completed Sets Results
          </h4>
          <div className="space-y-1">
            {match.sets.map((s) => (
              <div
                key={s.setNumber}
                className="flex items-center justify-between text-xs p-2 bg-slate-50 rounded-xl border border-slate-100"
              >
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-600">Set #{s.setNumber}</span>
                </div>
                <span className="font-mono font-bold text-slate-900">
                  {s.p1Score} : {s.p2Score}
                </span>
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Winner: {s.winnerId === match.player1.id ? match.player1.name : match.player2.name}
                </span>
              </div>
            ))}
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

      {/* SCREEN 1: SET VICTORY CONGRATULATION MODAL (Static letty_thumbs_up.png) */}
      {isSetWonModalOpen && lastSetWon && !isMatchCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Mascot Thumbs Up Artwork (STATIC: no letty-bounce) */}
            <div className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden shadow-xl border-2 border-amber-400 bg-amber-50">
              <img
                src="/assets/letty_thumbs_up.png"
                alt="Letty Set Won Thumbs Up"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-amber-400 text-blue-950 p-1.5 rounded-full shadow">
                <Trophy className="w-4 h-4" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-950 bg-amber-400 px-3 py-1 rounded-full shadow-xs">
                Set {lastSetWon.setNumber} Completed 🎉
              </span>
              <h3 className="text-xl font-black text-slate-900 mt-2">
                Set Won by {lastSetWon.winnerName}!
              </h3>
              <p className="text-sm font-extrabold text-blue-900 mt-1 bg-blue-50 py-1 px-3 rounded-xl inline-block border border-blue-100">
                Final Set Score: {lastSetWon.p1Score} - {lastSetWon.p2Score}
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
              Great play! Tap below to start the official 90-second WSF rest break before Set {currentSetIndex}.
            </p>

            <div className="space-y-2">
              <button
                onClick={proceedToSetBreak}
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
              >
                <span>Proceed to 90s Rest Break</span>
                <ChevronRight className="w-4 h-4 stroke-[3]" />
              </button>

              <button
                onClick={skipSetBreak}
                className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Skip Break & Play Set {currentSetIndex} Immediately
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: BETWEEN-SETS REST BREAK MODAL (Single container featuring letty_break.png) */}
      {isSetBreakActive && !isMatchCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Single Container featuring letty_break.png */}
            <div className="relative w-32 h-32 mx-auto rounded-3xl overflow-hidden shadow-lg border-2 border-amber-400 bg-slate-100">
              <img
                src="/assets/letty_break.png"
                alt="Letty Rest Break"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-blue-900 text-amber-400 p-1.5 rounded-full shadow">
                <Clock className={`w-4 h-4 ${isSetBreakPaused ? '' : 'animate-spin'}`} />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-full">
                WSF Rest Break • 90 Seconds
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-1">Between-Sets Interval</h3>
              {lastSetWon && (
                <p className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg inline-block mt-1">
                  Previous Set Won by {lastSetWon.winnerName} ({lastSetWon.p1Score} - {lastSetWon.p2Score})
                </p>
              )}
            </div>

            {/* Countdown Timer Display & Working Pause Button */}
            <div className="bg-slate-900 text-white p-3 rounded-2xl flex items-center justify-between px-5 shadow-inner">
              <div className="text-left">
                <span className="text-4xl font-mono font-black text-amber-400 tracking-wider">
                  {formatTimer(setBreakTimerSeconds)}
                </span>
                <p className="text-[10px] text-slate-400 font-semibold">
                  {isSetBreakPaused ? '⏸ Rest Timer Paused' : '⏱ Rest Time Remaining'}
                </p>
              </div>

              <button
                onClick={toggleSetBreakPause}
                className={`p-3 rounded-xl flex items-center space-x-1.5 font-bold text-xs transition-all ${
                  isSetBreakPaused
                    ? 'bg-amber-400 text-slate-950 hover:bg-amber-300 font-black scale-105'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title={isSetBreakPaused ? 'Resume Rest Break' : 'Pause Rest Break'}
              >
                {isSetBreakPaused ? <Play className="w-4 h-4 fill-current text-slate-950" /> : <Pause className="w-4 h-4" />}
                <span>{isSetBreakPaused ? 'Resume' : 'Pause'}</span>
              </button>
            </div>

            {/* Mascot Advice */}
            <p className="text-xs font-medium text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
              💡 <span className="font-bold text-slate-900">Letty's Rest Tip:</span> Drink water, towel off sweat, and discuss strategy before Set {currentSetIndex}!
            </p>

            {/* Skip Break Action Button */}
            <button
              onClick={skipSetBreak}
              className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-slate-900 hover:from-slate-800 hover:to-blue-950 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98"
            >
              <span>Skip Rest & Start Set {currentSetIndex}</span>
              <ChevronRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      )}

      {/* MATCH VICTORY MODAL (STATIC: letty_winner.png) */}
      {isMatchCompleted && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl space-y-4 text-center animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Mascot Victory Artwork (STATIC: no letty-bounce) */}
            <div className="relative w-36 h-36 mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-amber-400 bg-amber-50">
              <img
                src="/assets/letty_winner.png"
                alt="Letty Match Champion"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-amber-400 text-slate-950 p-1.5 rounded-full shadow">
                <Trophy className="w-5 h-5 fill-current" />
              </div>
            </div>

            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-950 bg-amber-400 px-3 py-1 rounded-full shadow-sm">
                MATCH CHAMPION 🏆
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2 flex items-center justify-center space-x-1.5">
                <span>{matchWinnerFlag}</span>
                <span>{matchWinnerName}</span>
              </h2>
              <p className="text-sm font-extrabold text-blue-900 mt-1 bg-blue-50 py-1.5 px-4 rounded-xl inline-block border border-blue-100">
                Sets Won: {match.p1SetsWon} : {match.p2SetsWon}
              </p>
            </div>

            {/* Set Scores Breakdown */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1 text-xs">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Final Match Summary
              </p>
              {match.sets.map((s) => (
                <div key={s.setNumber} className="flex justify-between items-center px-2 py-0.5 text-slate-700 font-semibold">
                  <span>Set {s.setNumber}</span>
                  <span className="font-mono font-bold text-slate-900">{s.p1Score} - {s.p2Score}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                onClick={finishActiveMatch}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98"
              >
                <Award className="w-4 h-4" />
                <span>Save Match to History</span>
              </button>

              <button
                onClick={() => {
                  finishActiveMatch();
                  if (openNewMatchModal) openNewMatchModal();
                }}
                className="w-full py-2.5 text-xs font-bold text-blue-900 hover:underline"
              >
                Start New Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
