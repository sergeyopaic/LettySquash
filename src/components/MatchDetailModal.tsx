import React, { useState, useEffect } from 'react';
import type { SquashMatch, GameResult, Player } from '../types/squash';
import { useSquash } from '../context/SquashContext';
import { getMatchMode } from '../utils/matchModeUtils';
import { X, ShieldAlert, Calendar, Share2, Printer, Check, User, AlertTriangle, Trophy } from 'lucide-react';
import { formatFullDateTime, formatMatchDuration, getMatchDurationParts } from '../utils/dateUtils';

interface MatchDetailModalProps {
  match: SquashMatch | null;
  onClose: () => void;
  onSelectPlayerProfile?: (player: Player) => void;
  openCompetitionDetail?: (competitionId: string) => void;
}

interface RallySegment {
  idx: number;
  scorer: 'WINNER' | 'LOSER';
  winnerScore: number;
  loserScore: number;
  diff: number;
  isHandout: boolean;
  isGameBall: boolean;
}

interface GameColumnData {
  gameNumber: number;
  winnerScore: number;
  loserScore: number;
  isWinnerGameWinner: boolean;
  rallies: RallySegment[];
  winnerMaxStreak: number;
  loserMaxStreak: number;
  isEstimated: boolean;
}

const calculateGameRallyRibbon = (
  match: SquashMatch,
  gameNumber: number,
  isP1Winner: boolean
): { rallies: RallySegment[]; winnerMaxStreak: number; loserMaxStreak: number; isEstimated: boolean } => {
  const targetGame = (match.games || []).find((g) => g.gameNumber === gameNumber);
  if (!targetGame) return { rallies: [], winnerMaxStreak: 0, loserMaxStreak: 0, isEstimated: false };

  const winnerFinal = isP1Winner ? targetGame.p1Score : targetGame.p2Score;
  const loserFinal = isP1Winner ? targetGame.p2Score : targetGame.p1Score;

  // Real per-point log recorded live during the match (see SquashContext.recordPoint).
  // Matches recorded before this field existed (e.g. seed data) won't have it — those
  // fall back to a deterministic estimate below, clearly flagged via `isEstimated`.
  const gameHistory = (match.pointLog || []).filter((e) => e.gameIndex === gameNumber);
  const isEstimated = gameHistory.length === 0;

  let rawRallies: { scorer: 'WINNER' | 'LOSER'; isHandout: boolean }[] = [];

  if (gameHistory.length > 0) {
    rawRallies = gameHistory.map((h) => {
      const p1Scored = h.scoringPlayerId === (match.player1?.id || 'p1');
      const scorer = isP1Winner ? (p1Scored ? 'WINNER' : 'LOSER') : (p1Scored ? 'LOSER' : 'WINNER');
      return { scorer, isHandout: Boolean(h.isHandout) };
    });
  } else {
    // Deterministic simulation based on game score
    let w = 0;
    let l = 0;
    let server: 'WINNER' | 'LOSER' = 'WINNER';
    while (w < winnerFinal || l < loserFinal) {
      let scorer: 'WINNER' | 'LOSER';
      if (w === winnerFinal) scorer = 'LOSER';
      else if (l === loserFinal) scorer = 'WINNER';
      else {
        const wRem = winnerFinal - w;
        const lRem = loserFinal - l;
        const pWin = wRem / (wRem + lRem);
        const pseudoRand = (Math.sin(gameNumber * 100 + rawRallies.length * 13) + 1) / 2;
        scorer = pseudoRand < pWin ? 'WINNER' : 'LOSER';
      }

      if (scorer === 'WINNER') w++;
      else l++;

      const isHandout = scorer !== server;
      server = scorer;
      rawRallies.push({ scorer, isHandout });
    }
  }

  // Calculate cumulative scores, lead differentials, game balls, and max streaks
  const rallies: RallySegment[] = [];
  let wScore = 0;
  let lScore = 0;
  let winnerMaxStreak = 0;
  let loserMaxStreak = 0;
  let currentWinnerStreak = 0;
  let currentLoserStreak = 0;

  const gameBallTarget = Math.max(10, (match.targetPoints || 11) - 1);

  rawRallies.forEach((r, i) => {
    const isGameBall = wScore >= gameBallTarget || lScore >= gameBallTarget;

    if (r.scorer === 'WINNER') {
      wScore++;
      currentWinnerStreak++;
      currentLoserStreak = 0;
      if (currentWinnerStreak > winnerMaxStreak) winnerMaxStreak = currentWinnerStreak;
    } else {
      lScore++;
      currentLoserStreak++;
      currentWinnerStreak = 0;
      if (currentLoserStreak > loserMaxStreak) loserMaxStreak = currentLoserStreak;
    }

    const diff = Math.abs(wScore - lScore);

    rallies.push({
      idx: i + 1,
      scorer: r.scorer,
      winnerScore: wScore,
      loserScore: lScore,
      diff,
      isHandout: r.isHandout,
      isGameBall
    });
  });

  return { rallies, winnerMaxStreak, loserMaxStreak, isEstimated };
};

export const MatchDetailModal: React.FC<MatchDetailModalProps> = ({
  match,
  onClose,
  onSelectPlayerProfile,
  openCompetitionDetail,
}) => {
  const { competitions } = useSquash();
  const [copied, setCopied] = useState<boolean>(false);
  const [showRallyFlow, setShowRallyFlow] = useState<boolean>(false);
  const [activeRallyKey, setActiveRallyKey] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (match) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match, onClose]);

  if (!match) return null;

  const { meta: modeMeta, competition } = getMatchMode(match, competitions);

  const player1 = match.player1 || { id: 'p1', name: 'Player 1', avatarBgColor: '#0F172A' };
  const player2 = match.player2 || { id: 'p2', name: 'Player 2', avatarBgColor: '#0F172A' };

  // STRICT CONSISTENT ORDER: Winner is ALWAYS pWinner on TOP, Loser is ALWAYS pLoser on BOTTOM.
  // isP1Winner is only a display-ordering tie-break (player1 goes on top by default) — it
  // does NOT mean "player1 actually won". Whether the match has a real result at all is
  // isDecided, below; nothing should render pWinner as an actual winner unless that's true.
  const isP1Winner = match.winnerId ? match.winnerId === player1.id : (match.p1GamesWon ?? 0) >= (match.p2GamesWon ?? 0);
  // No winnerId and level games (e.g. saved early via "Save & Exit") means no decided
  // outcome — same rule PlayerProfileModal uses so a match doesn't show a winner in one
  // screen and "no result" in another.
  const isDecided = Boolean(match.winnerId) || (match.p1GamesWon ?? 0) !== (match.p2GamesWon ?? 0);
  const pWinner = isP1Winner ? player1 : player2;
  const pLoser = isP1Winner ? player2 : player1;

  const winnerGames = isP1Winner ? (match.p1GamesWon ?? 0) : (match.p2GamesWon ?? 0);
  const loserGames = isP1Winner ? (match.p2GamesWon ?? 0) : (match.p1GamesWon ?? 0);

  const games = match.games || [];
  const decisions = match.decisions || [];

  const totalRallies = games.reduce((acc, g) => acc + (g.p1Score ?? 0) + (g.p2Score ?? 0), 0);
  const durationText = formatMatchDuration(match.totalDurationSeconds || 0);

  const letsCount = decisions.filter((d) => d.decision === 'YES_LET').length;
  const strokesCount = decisions.filter((d) => d.decision === 'STROKE').length;
  const noLetsCount = decisions.filter((d) => d.decision === 'NO_LET').length;

  const handleCopySummary = () => {
    const resultLine = isDecided
      ? `${pWinner.name} def. ${pLoser.name} (${winnerGames}-${loserGames})`
      : `${pWinner.name} vs ${pLoser.name} (${winnerGames}-${loserGames}) — no result`;
    const summaryText = `Squash Match Scorecard\n${resultLine}\nDuration: ${durationText} | Rallies: ${totalRallies}\nDate: ${formatFullDateTime(match.date)}`;
    navigator.clipboard.writeText(summaryText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  // Build vertical columns for all games
  const gameColumns: GameColumnData[] = games.map((g) => {
    const winnerScore = isP1Winner ? g.p1Score : g.p2Score;
    const loserScore = isP1Winner ? g.p2Score : g.p1Score;
    const isWinnerGameWinner = winnerScore > loserScore;

    const { rallies, winnerMaxStreak, loserMaxStreak, isEstimated } = calculateGameRallyRibbon(
      match,
      g.gameNumber,
      isP1Winner
    );

    return {
      gameNumber: g.gameNumber,
      winnerScore,
      loserScore,
      isWinnerGameWinner,
      rallies,
      winnerMaxStreak,
      loserMaxStreak,
      isEstimated
    };
  });

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in slide-in-from-bottom duration-200 cursor-default overflow-hidden"
      >
        {/* 1. Full-Width Navy Header Banner (Structural Cover) */}
        <div className="bg-slate-900 rounded-t-3xl p-5 text-white shadow-md space-y-3.5 border-b border-slate-800">
          {/* Top Row: Format Tag & Close Button */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="font-extrabold text-amber-400 uppercase tracking-wider font-mono text-[10px]">
                {match.matchFormat === 'BEST_OF_5'
                  ? `Best of 5 (PARS-${match.targetPoints})`
                  : match.matchFormat === 'BEST_OF_3'
                  ? `Best of 3 (PARS-${match.targetPoints})`
                  : `Single Game (PARS-${match.targetPoints})`}
              </span>
              {/* One of the 7 match modes (see utils/matchModeUtils.ts) — always shown here,
                  styled consistently against the navy header regardless of which mode. */}
              <span
                className="flex items-center space-x-1 bg-amber-400/15 text-amber-400 border border-amber-400/40 rounded-md px-1.5 py-0.5 font-extrabold uppercase tracking-wider font-mono text-[9px]"
                title={competition ? `Fixture of ${competition.name}` : modeMeta.label}
              >
                <span>{modeMeta.shortLabel}</span>
              </span>
              {(match.p1HandicapStart || match.p2HandicapStart) ? (
                <span
                  className="bg-amber-400/15 text-amber-400 border border-amber-400/40 rounded-md px-1.5 py-0.5 font-extrabold uppercase tracking-wider font-mono text-[9px]"
                  title={`${match.player1.name} started +${match.p1HandicapStart ?? 0}, ${match.player2.name} started +${match.p2HandicapStart ?? 0}`}
                >
                  Handicap
                </span>
              ) : null}
              {!isDecided && (
                <span
                  className="bg-slate-700/60 text-slate-300 border border-slate-600/60 rounded-md px-1.5 py-0.5 font-extrabold uppercase tracking-wider font-mono text-[9px]"
                  title="Saved without a winner and level on games — no decided outcome, not a loss for either player"
                >
                  No Result
                </span>
              )}
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 flex items-center justify-center cursor-pointer transition-colors -mr-1"
              aria-label="Close Match Scorecard"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Document Title & Date inside Navy Cover */}
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight leading-none">
              Match Scorecard
            </h2>
            <span className="text-xs font-medium text-slate-400 flex items-center space-x-1.5 mt-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{formatFullDateTime(match.date)}</span>
            </span>
            {competition && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  openCompetitionDetail?.(competition.id);
                }}
                className="text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center space-x-1.5 mt-1 transition-colors"
                title={`Open ${competition.name} in Competitions`}
              >
                <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                <span className="truncate">{competition.name}</span>
              </button>
            )}
          </div>

          {/* Vertical Winner & Loser Clickable Scorecard Panel */}
          <div className="bg-slate-800/90 rounded-xl p-3.5 border border-slate-700/80 space-y-2.5">
            {/* Top Row: Clickable Winner Profile */}
            <div
              onClick={() => onSelectPlayerProfile?.(pWinner)}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-700/60 p-1.5 -mx-1.5 rounded-lg transition-colors group"
              title={`View ${pWinner.name}'s profile`}
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                <div
                  className={`w-8 h-8 rounded-full text-white font-bold flex items-center justify-center text-xs shadow-xs flex-shrink-0 group-hover:scale-105 transition-transform ${
                    isDecided ? 'ring-2 ring-amber-400' : 'ring-2 ring-slate-600'
                  }`}
                  style={{ backgroundColor: pWinner.avatarBgColor || '#0F172A' }}
                >
                  {pWinner.name ? pWinner.name.charAt(0) : 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-black text-white text-sm leading-tight break-words flex items-center space-x-1.5 flex-wrap transition-colors ${
                      isDecided ? 'group-hover:text-amber-400' : 'group-hover:text-slate-300'
                    }`}
                  >
                    <span>{pWinner.name}</span>
                    <User className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  {/* Only ever labels THIS player as the winner — never rendered when the
                      match isn't decided, so it can't read as "this one has a result and
                      the other doesn't" (that status is match-level, shown once in the
                      header tags above, not attached to either player's row). */}
                  {isDecided && <span className="text-[9px] font-bold block mt-0.5 text-amber-400">✓ WINNER</span>}
                </div>
              </div>

              {/* Winner Score */}
              <span className={`text-3xl font-sans font-black flex-shrink-0 pl-2 ${isDecided ? 'text-amber-400' : 'text-slate-300'}`}>
                {winnerGames}
              </span>
            </div>

            {/* Divider Line */}
            <div className="border-t border-slate-700/70" />

            {/* Bottom Row: Clickable Loser Profile */}
            <div
              onClick={() => onSelectPlayerProfile?.(pLoser)}
              className="flex items-center justify-between cursor-pointer hover:bg-slate-700/60 p-1.5 -mx-1.5 rounded-lg transition-colors group"
              title={`View ${pLoser.name}'s profile`}
            >
              <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                <div
                  className="w-8 h-8 rounded-full text-slate-200 font-semibold flex items-center justify-center text-xs flex-shrink-0 group-hover:scale-105 transition-transform"
                  style={{ backgroundColor: pLoser.avatarBgColor || '#334155' }}
                >
                  {pLoser.name ? pLoser.name.charAt(0) : 'P'}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-slate-300 text-xs leading-tight break-words flex items-center space-x-1.5 flex-wrap group-hover:text-white transition-colors">
                    <span>{pLoser.name}</span>
                    <User className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </div>

              {/* Loser Score */}
              <span className="text-2xl font-sans font-extrabold text-slate-300 flex-shrink-0 pl-2">
                {loserGames}
              </span>
            </div>
          </div>
        </div>

        {/* 2. White Modal Body */}
        <div className="p-5 space-y-4">
          {/* 3. Deep Match Analytics Row (Lightweight Divided Metrics) */}
          {(() => {
            const durationParts = getMatchDurationParts(match.totalDurationSeconds || 0);
            return (
              <div className="grid grid-cols-3 divide-x divide-slate-100 py-1 text-center">
                <div className="px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Duration</span>
                  <span className="font-extrabold text-slate-900 text-xl leading-tight mt-0.5 inline-flex items-baseline space-x-0.5 justify-center">
                    <span>{durationParts.val}</span>
                    <span className="text-xs font-semibold text-slate-400 ml-0.5">{durationParts.unit}</span>
                  </span>
                </div>

                <div className="px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rallies</span>
                  <span className="font-extrabold text-slate-900 text-xl leading-tight mt-0.5 block">{totalRallies}</span>
                </div>

                <div className="px-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Appeals</span>
                  <span className="font-extrabold text-slate-900 text-xl leading-tight mt-0.5 block">{decisions.length}</span>
                </div>
              </div>
            );
          })()}

          {/* 4. Games Breakdown Table + Dedicated Rally Flow Toggle */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center space-x-2">
                <span className="w-1.5 h-3.5 bg-amber-400 rounded-full shadow-2xs flex-shrink-0" />
                <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                  Games Breakdown
                </h4>
              </div>

              {/* Dedicated Rally Flow Toggle Button */}
              <button
                onClick={() => setShowRallyFlow(!showRallyFlow)}
                className="py-1 px-2.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-[10px] rounded-lg transition-colors cursor-pointer flex items-center space-x-1 shadow-2xs print:hidden"
              >
                <span>{showRallyFlow ? 'Hide Rally Flow ↑' : '📊 Rally Flow ↓'}</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
              {/* Table Header with Clickable Player Names */}
              <div className="grid grid-cols-5 text-[10px] font-extrabold text-slate-500 bg-slate-100/90 py-2 px-3 text-center uppercase tracking-wider border-b border-slate-200">
                <span className="col-span-1 text-left">GAME</span>
                <span
                  onClick={() => onSelectPlayerProfile?.(pWinner)}
                  className="col-span-2 truncate text-slate-900 cursor-pointer hover:underline hover:text-amber-600 transition-colors"
                  title={`View ${pWinner.name}'s profile`}
                >
                  {pWinner.name}
                </span>
                <span
                  onClick={() => onSelectPlayerProfile?.(pLoser)}
                  className="col-span-2 truncate text-amber-600 cursor-pointer hover:underline hover:text-amber-700 transition-colors"
                  title={`View ${pLoser.name}'s profile`}
                >
                  {pLoser.name}
                </span>
              </div>

              {/* Table Summary Rows */}
              {games.length === 0 ? (
                <div className="p-3 text-center text-xs text-slate-400">
                  No game stats recorded for this match
                </div>
              ) : (
                games.map((g: GameResult) => {
                  const winnerScore = isP1Winner ? g.p1Score : g.p2Score;
                  const loserScore = isP1Winner ? g.p2Score : g.p1Score;
                  const isWinnerGameWinner = winnerScore > loserScore;

                  return (
                    <div
                      key={g.gameNumber}
                      className="grid grid-cols-5 text-xs py-3 px-3 border-b border-slate-100 last:border-0 items-center text-center font-sans"
                    >
                      <div className="col-span-1 text-left font-bold text-slate-500 text-[11px]">
                        G{g.gameNumber}
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span
                          className={
                            isWinnerGameWinner
                              ? 'font-black text-slate-900 text-sm'
                              : 'font-medium text-slate-400 text-xs'
                          }
                        >
                          {winnerScore}
                        </span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span
                          className={
                            !isWinnerGameWinner
                              ? 'font-black text-amber-600 text-sm'
                              : 'font-medium text-slate-400 text-xs'
                          }
                        >
                          {loserScore}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* 5. Clean Vertical Match Rally Flow Panel (Opens on [ Rally Flow ] button, hidden in print) */}
          {showRallyFlow && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 print:hidden">
              {/* Legend & Header */}
              <div className="flex items-center justify-between text-[10px] font-bold pb-2.5 border-b border-slate-200 uppercase tracking-wider">
                <div className="flex items-center space-x-3">
                  <div
                    onClick={() => onSelectPlayerProfile?.(pWinner)}
                    className="flex items-center space-x-1.5 text-slate-900 cursor-pointer hover:underline"
                    title={`View ${pWinner.name}'s profile`}
                  >
                    <span className="w-2.5 h-2.5 bg-slate-900 rounded-2xs inline-block shadow-2xs" />
                    <span>{pWinner.name}</span>
                  </div>
                  <div
                    onClick={() => onSelectPlayerProfile?.(pLoser)}
                    className="flex items-center space-x-1.5 text-amber-600 cursor-pointer hover:underline"
                    title={`View ${pLoser.name}'s profile`}
                  >
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-2xs inline-block shadow-2xs" />
                    <span>{pLoser.name}</span>
                  </div>
                </div>

                {/* Game Ball: Left Outer Accent Line Marker */}
                <div className="flex items-center space-x-1.5 text-slate-600 font-mono text-[9px] font-extrabold bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                  <span className="w-1 h-3 bg-amber-400 rounded-full inline-block" />
                  <span>GAME BALL</span>
                </div>
              </div>

              {/* Estimated-data note: only fires for matches with no stored point-by-point
                  log (e.g. legacy data from before this was tracked). A quiet inline badge,
                  not an alert — this is now the rare exception rather than the norm. */}
              {gameColumns.some((c) => c.isEstimated) && (
                <div
                  className="inline-flex items-center space-x-1 text-[9px] text-slate-400 font-semibold normal-case tracking-normal"
                  title="No point-by-point log was recorded for this match — the rally sequence shown is an estimate reconstructed from the final game scores, not the real order of play."
                >
                  <AlertTriangle className="w-3 h-3 text-slate-400 flex-shrink-0" />
                  <span>Estimated rally sequence (no point-by-point log on record)</span>
                </div>
              )}

              {/* All Game Columns Side-by-Side (Clean Top Alignment, Single-Line Footer Labels) */}
              <div className="flex justify-around items-end gap-1.5 pt-2 pb-1 w-full overflow-x-auto min-h-[180px]">
                {gameColumns.map((col) => (
                  <div
                    key={col.gameNumber}
                    className="flex flex-col items-center space-y-1.5 flex-1 min-w-[40px] max-w-[68px]"
                  >
                    {/* Vertical Stack Column (Bottom-to-Top flex-col-reverse) */}
                    <div className="w-full bg-white rounded-lg p-1 border border-slate-200/90 shadow-2xs flex flex-col-reverse gap-0 relative overflow-visible">
                      {col.rallies.map((r, idx) => {
                        const isWinnerPoint = r.scorer === 'WINNER';
                        const rallyKey = `${col.gameNumber}-${idx}`;
                        const isRallySelected = activeRallyKey === rallyKey;

                        const isOwnerChange = idx > 0 && col.rallies[idx - 1].scorer !== r.scorer;
                        const showOwnerDivider = isOwnerChange || r.isHandout;

                        // Internal 1px 15% opacity hairline quantization notch
                        const internalNotchClass = isWinnerPoint
                          ? 'border-b border-white/15'
                          : 'border-b border-slate-950/15';

                        return (
                          <div
                            key={idx}
                            onClick={() => setActiveRallyKey(isRallySelected ? null : rallyKey)}
                            style={{ height: '14px' }}
                            className={`w-full transition-all relative cursor-pointer ${
                              isWinnerPoint ? 'bg-slate-900 hover:bg-slate-800' : 'bg-amber-400 hover:bg-amber-500'
                            } ${showOwnerDivider ? 'border-b-2 border-white' : internalNotchClass} ${
                              isRallySelected ? 'ring-2 ring-white shadow-lg z-30' : ''
                            }`}
                          >
                            {/* Game Ball: Left Outer Accent Bar (Zero column score distortion!) */}
                            {r.isGameBall && (
                              <span
                                className="absolute -left-1.5 top-0.5 bottom-0.5 w-[3px] bg-amber-400 rounded-full shadow-2xs z-20"
                                title="Game Ball Rally"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Bottom Unified Label: G1 · 11-8 (whitespace-nowrap prevents 2-line wrap layout distortion) */}
                    <div className="font-mono text-center text-[10px] whitespace-nowrap flex items-center space-x-0.5 justify-center pt-0.5 w-full">
                      <span className="text-slate-500 font-bold text-[9px]">G{col.gameNumber}·</span>
                      <span
                        className={
                          col.isWinnerGameWinner
                            ? 'font-black text-slate-900'
                            : 'font-medium text-slate-400'
                        }
                      >
                        {col.winnerScore}
                      </span>
                      <span className="text-slate-300 font-normal">-</span>
                      <span
                        className={
                          !col.isWinnerGameWinner
                            ? 'font-black text-amber-600'
                            : 'font-medium text-slate-400'
                        }
                      >
                        {col.loserScore}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Active Tap Rally Detail Bar (Left-Grouped) */}
              {activeRallyKey && (() => {
                const [gNum, rIdxStr] = activeRallyKey.split('-');
                const gNumNum = parseInt(gNum, 10);
                const rIdx = parseInt(rIdxStr, 10);
                const targetCol = gameColumns.find((c) => c.gameNumber === gNumNum);
                const r = targetCol ? targetCol.rallies[rIdx] : null;
                if (!r) return null;

                const isWinnerScored = r.scorer === 'WINNER';

                return (
                  <div className="py-1.5 px-3 bg-slate-900 text-white rounded-xl text-xs flex items-center space-x-2 font-mono animate-in fade-in duration-100 shadow-md">
                    <span className="text-slate-300">
                      G{gNumNum} Rally #{r.idx} · {isWinnerScored ? pWinner.name : pLoser.name}
                    </span>
                    <span className="text-amber-400 font-bold ml-2">
                      {r.winnerScore} — {r.loserScore}
                    </span>
                    {r.isHandout && (
                      <span className="text-[10px] text-amber-400 font-bold ml-1">• Handout</span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 6. Referee Decision Logs if any */}
          {decisions && decisions.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center space-x-2">
                  <span className="w-1.5 h-3.5 bg-amber-400 rounded-full shadow-2xs flex-shrink-0" />
                  <h4 className="text-xs font-black text-slate-900 tracking-tight uppercase">
                    Referee Appeals Log
                  </h4>
                </div>
                <span className="text-[10px] font-semibold text-slate-500">
                  {letsCount} Let • {strokesCount} Stroke • {noLetsCount} No Let
                </span>
              </div>

              <div className="space-y-1.5">
                {decisions.map((d) => (
                  <div
                    key={d.id}
                    className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-xs"
                  >
                    <div className="flex items-center space-x-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span className="font-bold text-slate-800">
                        {d.decision === 'YES_LET' ? 'YES LET (Replay)' : d.decision === 'STROKE' ? 'STROKE (Point Awarded)' : 'NO LET (Denied)'}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                      Game {d.gameIndex} ({d.p1Score}-{d.p2Score})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 7. Action Footer Toolbar */}
          <div className="pt-2 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleCopySummary}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200/80 flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4 text-slate-500" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handlePrint}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-1.5 transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Print / Export</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-700 transition-colors cursor-pointer text-center"
            >
              Close Scorecard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
