import React, { useEffect, useRef, useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { CLUBS_LIST } from './ClubSelectorModal';
import { COMPETITION_FORMATS, COMPETITION_FORMAT_LABELS } from './NewCompetitionModal';
import { getMatchWinnerId } from '../utils/matchUtils';
import { formatMatchDateGroup } from '../utils/dateUtils';
import { computeLeagueStandings, computeStandingsForFixtures } from '../utils/standingsUtils';
import { resolveFixturePlayers, getFixtureWinnerId, getEliminationRoundLabel, findFixtureMatch } from '../utils/fixtureUtils';
import { X, Trophy, Users, Play, Check, AlertCircle, ListOrdered, LayoutList } from 'lucide-react';
import type { CompetitionFixture, SquashMatch } from '../types/squash';

interface CompetitionDetailModalProps {
  competitionId: string | null;
  onClose: () => void;
  onStartMatch?: () => void;
  onSelectMatchDetail?: (matchId: string) => void;
}

const isFixturePlayed = (fixture: CompetitionFixture, competitionId: string, matches: SquashMatch[]): boolean =>
  Boolean(findFixtureMatch(fixture, fixture.player1Id, fixture.player2Id, competitionId, matches));

const groupByRound = (fixtures: CompetitionFixture[]): [number, CompetitionFixture[]][] => {
  const map = new Map<number, CompetitionFixture[]>();
  for (const fixture of fixtures) {
    const round = fixture.round ?? 1;
    if (!map.has(round)) map.set(round, []);
    map.get(round)!.push(fixture);
  }
  return [...map.entries()].sort((a, b) => a[0] - b[0]);
};

// Fixed match-card height/gap the bracket's vertical spacing math is built around — each
// round's cards are offset so they sit at the midpoint of the two cards feeding them,
// which is what makes the columns read as a single-elimination tree rather than a plain list.
const BRACKET_CARD_HEIGHT = 60;
const BRACKET_BASE_GAP = 14;

export const CompetitionDetailModal: React.FC<CompetitionDetailModalProps> = ({
  competitionId,
  onClose,
  onStartMatch,
  onSelectMatchDetail,
}) => {
  const { competitions, matches, players, activeMatchState, startMatch } = useSquash();

  // null = "follow the current round automatically"; a number once the user taps a
  // specific round tab. Reset whenever a different competition is opened.
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'FIXTURES' | 'STANDINGS'>('FIXTURES');
  const [activeGroupIndex, setActiveGroupIndex] = useState(0);
  const activeTabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setSelectedRound(null);
    setViewMode('FIXTURES');
    setActiveGroupIndex(0);
  }, [competitionId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (competitionId) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [competitionId, onClose]);

  useEffect(() => {
    activeTabRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selectedRound, competitionId]);

  if (!competitionId) return null;
  const competition = competitions.find((c) => c.id === competitionId);
  if (!competition) return null;

  const formatMeta = COMPETITION_FORMATS.find((f) => f.id === competition.format);
  const clubA = competition.clubAId ? CLUBS_LIST.find((c) => c.id === competition.clubAId) : undefined;
  const clubB = competition.clubBId ? CLUBS_LIST.find((c) => c.id === competition.clubBId) : undefined;
  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const hasLiveMatch = Boolean(activeMatchState);

  const isArchived = competition.status === 'COMPLETED';
  const fixtureLabel = competition.format === 'INTERCLUB_4VS4' ? 'Rank' : 'Fixture';

  // Group fixtures into rounds/tours. A fixture without a round (legacy data) is treated
  // as round 1, same as single-round formats like Interclub.
  const roundsMap = new Map<number, CompetitionFixture[]>();
  for (const fixture of competition.fixtures ?? []) {
    const round = fixture.round ?? 1;
    if (!roundsMap.has(round)) roundsMap.set(round, []);
    roundsMap.get(round)!.push(fixture);
  }
  const rounds = [...roundsMap.entries()].sort((a, b) => a[0] - b[0]);

  // The "current" tab is the first round with something left to play — finished rounds
  // stay behind it, reachable by tapping back. Once everything's played, land on the last.
  const firstUnfinishedRound = rounds.find(([, fixturesInRound]) =>
    fixturesInRound.some((f) => !isFixturePlayed(f, competition.id, matches))
  );
  const currentRound = firstUnfinishedRound?.[0] ?? rounds[rounds.length - 1]?.[0] ?? 1;
  const activeRound = selectedRound ?? currentRound;
  const activeRoundFixtures = roundsMap.get(activeRound) ?? [];

  // A standings table only makes sense for round-robin formats where everyone plays
  // everyone — Interclub is a fixed set of ties, not a table of entrants.
  const isLeague = competition.format === 'LEAGUE';
  const standings = isLeague ? computeLeagueStandings(competition, matches) : [];

  const isSingleElim = competition.format === 'SINGLE_ELIMINATION';
  const isDoubleElim = competition.format === 'DOUBLE_ELIMINATION';
  const isBracket = isSingleElim || isDoubleElim;

  // Double Elimination fixtures carry a bracketSide tag (WB/LB/GF) since two different
  // rounds — one per bracket — can share the same round number; Single Elimination has
  // only one bracket, so the generic `rounds` grouping above already works for it.
  const wbRounds = isDoubleElim ? groupByRound((competition.fixtures ?? []).filter((f) => f.bracketSide === 'WB')) : [];
  const lbRounds = isDoubleElim ? groupByRound((competition.fixtures ?? []).filter((f) => f.bracketSide === 'LB')) : [];
  const gfFixture = isDoubleElim ? (competition.fixtures ?? []).find((f) => f.bracketSide === 'GF') : undefined;

  const seFinalRoundFixtures = isSingleElim && rounds.length > 0 ? rounds[rounds.length - 1][1] : [];

  // Groups + Knockout: group-stage fixtures carry groupIndex (0-based); knockout fixtures
  // are a separate track (their own round numbering, same as Single Elimination's single
  // bracket) whose players resolve to "rank R of group G" until that group finishes.
  const isGroupsFormat = competition.format === 'GROUPS_PLAYOFF';
  const groupFixturesAll = isGroupsFormat ? (competition.fixtures ?? []).filter((f) => f.stage === 'GROUP') : [];
  const groupCount = isGroupsFormat ? new Set(groupFixturesAll.map((f) => f.groupIndex)).size : 0;
  const koFixtures = isGroupsFormat ? (competition.fixtures ?? []).filter((f) => f.stage === 'KNOCKOUT') : [];
  const koRounds = isGroupsFormat ? groupByRound(koFixtures) : [];
  const groupsFinalRoundFixtures = koRounds.length > 0 ? koRounds[koRounds.length - 1][1] : [];

  const championFixture = isDoubleElim
    ? gfFixture
    : isGroupsFormat
    ? groupsFinalRoundFixtures.length === 1
      ? groupsFinalRoundFixtures[0]
      : undefined
    : seFinalRoundFixtures.length === 1
    ? seFinalRoundFixtures[0]
    : undefined;
  const championId = championFixture
    ? getFixtureWinnerId(championFixture, competition.fixtures ?? [], competition.id, matches)
    : undefined;
  const champion = championId ? getPlayer(championId) : undefined;

  const handleStartFixture = (fixture: CompetitionFixture) => {
    if (hasLiveMatch || isArchived) return;
    // TODO(backend): once real auth exists, only the two fixture participants and a
    // manager/owner of either club should be allowed to start/edit this match — see
    // BACKEND_ARCHITECTURE.md. There's no access control at all yet, so anyone using the
    // app can referee any fixture; fine for now, not fine once real clubs are onboarded.
    startMatch(
      fixture.player1Id,
      fixture.player2Id,
      competition.matchFormat ?? 'BEST_OF_5',
      'FRIENDLY',
      fixture.player1Id,
      'R',
      true,
      competition.id,
      competition.targetPoints ?? 11,
      fixture.slot
    );
    onStartMatch?.();
  };

  // Same as handleStartFixture, but for bracket fixtures whose players may only be known
  // via resolveFixturePlayers (the winner of an earlier round), not stored on the fixture.
  const handleStartBracketFixture = (fixture: CompetitionFixture) => {
    if (hasLiveMatch || isArchived) return;
    const { player1Id, player2Id } = resolveFixturePlayers(fixture, competition.fixtures ?? [], competition.id, matches);
    if (!player1Id || !player2Id) return;
    startMatch(
      player1Id,
      player2Id,
      competition.matchFormat ?? 'BEST_OF_5',
      'FRIENDLY',
      player1Id,
      'R',
      true,
      competition.id,
      competition.targetPoints ?? 11,
      fixture.slot
    );
    onStartMatch?.();
  };

  // One bracket column: cards vertically offset so each sits at the midpoint of the two
  // cards feeding it (see BRACKET_CARD_HEIGHT/BASE_GAP), shared by Single Elimination's
  // single track and Double Elimination's Winners/Losers tracks.
  const renderBracketColumn = (fixturesInRound: CompetitionFixture[], roundIdx: number, label: string) => {
    const unit = BRACKET_CARD_HEIGHT + BRACKET_BASE_GAP;
    const centerDistance = unit * 2 ** roundIdx;
    const firstOffset = (centerDistance - BRACKET_CARD_HEIGHT) / 2;
    const laterGap = centerDistance - BRACKET_CARD_HEIGHT;

    return (
      <div className="flex flex-col flex-shrink-0 w-36 mr-3 last:mr-0">
        <div className="text-[9px] font-black text-slate-500 uppercase tracking-wider text-center pb-2">{label}</div>
        <div className="flex flex-col">
          {fixturesInRound.map((fixture, idx) => {
            const { player1Id, player2Id } = resolveFixturePlayers(fixture, competition.fixtures ?? [], competition.id, matches);
            const p1 = player1Id ? getPlayer(player1Id) : undefined;
            const p2 = player2Id ? getPlayer(player2Id) : undefined;
            const playedMatch = findFixtureMatch(fixture, player1Id, player2Id, competition.id, matches);
            const winnerId = playedMatch ? getMatchWinnerId(playedMatch) : undefined;
            const bothKnown = Boolean(p1 && p2);
            const marginTop = idx === 0 ? firstOffset : laterGap;

            return (
              <div key={fixture.slot} style={{ marginTop }} className="flex items-center">
                {roundIdx > 0 && <div className="w-3 h-0.5 bg-slate-300 flex-shrink-0" />}

                {fixture.isBye ? (
                  <div
                    style={{ height: BRACKET_CARD_HEIGHT }}
                    className="flex-1 px-2 py-1 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 flex flex-col justify-center"
                  >
                    <span className="text-[8px] font-black text-amber-600 uppercase tracking-wider">Bye</span>
                    <span className="text-[11px] font-bold text-slate-800 truncate">
                      {p1 ? `${p1.countryFlag} ${p1.name}` : '—'}
                    </span>
                  </div>
                ) : playedMatch ? (
                  <button
                    onClick={() => onSelectMatchDetail?.(playedMatch.id)}
                    style={{ height: BRACKET_CARD_HEIGHT }}
                    className="flex-1 px-2 py-1 rounded-xl border border-emerald-200 bg-emerald-50/70 flex flex-col justify-center text-left hover:bg-emerald-50 transition-colors cursor-pointer"
                  >
                    <span className={`text-[11px] truncate ${winnerId === p1?.id ? 'font-black text-slate-900' : 'text-slate-500'}`}>
                      {p1 ? `${p1.countryFlag} ${p1.name}` : 'TBD'}
                    </span>
                    <span className={`text-[11px] truncate ${winnerId === p2?.id ? 'font-black text-slate-900' : 'text-slate-500'}`}>
                      {p2 ? `${p2.countryFlag} ${p2.name}` : 'TBD'}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => bothKnown && handleStartBracketFixture(fixture)}
                    disabled={!bothKnown || hasLiveMatch || isArchived}
                    style={{ height: BRACKET_CARD_HEIGHT }}
                    className="flex-1 px-2 py-1 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between text-left hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span className="min-w-0">
                      <span className="block text-[11px] font-bold text-slate-900 truncate">
                        {p1 ? `${p1.countryFlag} ${p1.name}` : 'TBD'}
                      </span>
                      <span className="block text-[11px] font-bold text-slate-900 truncate">
                        {p2 ? `${p2.countryFlag} ${p2.name}` : 'TBD'}
                      </span>
                    </span>
                    {bothKnown && !isArchived && <Play className="w-3 h-3 text-blue-700 fill-current flex-shrink-0 ml-1" />}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // A simple fixture card — direct player1Id/player2Id, no resolution needed — shared by
  // League/Interclub's fixture grid and a Groups+Knockout group's own round-robin fixtures.
  const renderSimpleFixtureCard = (fixture: CompetitionFixture, label: string) => {
    const p1 = getPlayer(fixture.player1Id);
    const p2 = getPlayer(fixture.player2Id);
    if (!p1 || !p2) return null;
    const playedMatch = findFixtureMatch(fixture, fixture.player1Id, fixture.player2Id, competition.id, matches);
    const winnerId = playedMatch ? getMatchWinnerId(playedMatch) : undefined;

    if (playedMatch) {
      const p1Games = playedMatch.player1.id === p1.id ? playedMatch.p1GamesWon : playedMatch.p2GamesWon;
      const p2Games = playedMatch.player1.id === p2.id ? playedMatch.p1GamesWon : playedMatch.p2GamesWon;

      return (
        <button
          key={fixture.slot}
          onClick={() => onSelectMatchDetail?.(playedMatch.id)}
          className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl text-left space-y-1.5 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
              <Check className="w-3 h-3" />
              <span>{label} #{fixture.slot} • Played</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`truncate ${winnerId === p1.id ? 'font-black text-slate-900' : 'text-slate-500'}`}>
              {p1.countryFlag} {p1.name}
            </span>
            <span className={`font-black ${winnerId === p1.id ? 'text-emerald-700' : 'text-slate-400'}`}>{p1Games}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className={`truncate ${winnerId === p2.id ? 'font-black text-slate-900' : 'text-slate-500'}`}>
              {p2.countryFlag} {p2.name}
            </span>
            <span className={`font-black ${winnerId === p2.id ? 'text-emerald-700' : 'text-slate-400'}`}>{p2Games}</span>
          </div>
        </button>
      );
    }

    return (
      <button
        key={fixture.slot}
        onClick={() => handleStartFixture(fixture)}
        disabled={hasLiveMatch || isArchived}
        className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
          {label} #{fixture.slot} • Not played
        </span>
        <div className="text-xs font-bold text-slate-900 truncate">
          {p1.countryFlag} {p1.name}
        </div>
        <div className="text-[10px] text-slate-400 font-bold uppercase">vs</div>
        <div className="text-xs font-bold text-slate-900 truncate">
          {p2.countryFlag} {p2.name}
        </div>
        {!isArchived && (
          <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-700 pt-0.5">
            <Play className="w-3 h-3 fill-current" />
            <span>Start Refereeing</span>
          </div>
        )}
      </button>
    );
  };

  // Grand Final: a standalone card (not part of either bracket column) pitting the
  // Winners- and Losers-bracket champions against each other, shown as soon as one or
  // both are known — see the "single decisive match" note on generateDoubleEliminationBracket.
  const renderGrandFinalCard = (fixture: CompetitionFixture) => {
    const { player1Id, player2Id } = resolveFixturePlayers(fixture, competition.fixtures ?? [], competition.id, matches);
    const p1 = player1Id ? getPlayer(player1Id) : undefined;
    const p2 = player2Id ? getPlayer(player2Id) : undefined;
    const playedMatch = findFixtureMatch(fixture, player1Id, player2Id, competition.id, matches);
    const winnerId = playedMatch ? getMatchWinnerId(playedMatch) : undefined;
    const bothKnown = Boolean(p1 && p2);

    if (playedMatch) {
      return (
        <button
          onClick={() => onSelectMatchDetail?.(playedMatch.id)}
          className="w-full p-3 rounded-2xl border border-emerald-200 bg-emerald-50/70 text-left space-y-1.5 hover:bg-emerald-50 transition-colors cursor-pointer"
        >
          <span className="text-[9px] font-black text-emerald-700 uppercase tracking-wider flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>Grand Final • Played</span>
          </span>
          <div className="flex items-center justify-between text-xs">
            <span className={`truncate ${winnerId === p1?.id ? 'font-black text-slate-900' : 'text-slate-500'}`}>
              {p1 ? `${p1.countryFlag} ${p1.name}` : 'TBD'}
            </span>
            <span className={`truncate ${winnerId === p2?.id ? 'font-black text-slate-900' : 'text-slate-500'}`}>
              {p2 ? `${p2.countryFlag} ${p2.name}` : 'TBD'}
            </span>
          </div>
        </button>
      );
    }

    return (
      <button
        onClick={() => bothKnown && handleStartBracketFixture(fixture)}
        disabled={!bothKnown || hasLiveMatch || isArchived}
        className="w-full p-3 rounded-2xl border border-amber-300 bg-amber-50/60 text-left space-y-1.5 hover:bg-amber-50 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider">Grand Final • Not played</span>
        <div className="flex items-center justify-between text-xs font-bold text-slate-900">
          <span className="truncate">{p1 ? `${p1.countryFlag} ${p1.name}` : 'TBD'}</span>
          <span className="text-slate-400 font-black text-[10px] px-1">vs</span>
          <span className="truncate">{p2 ? `${p2.countryFlag} ${p2.name}` : 'TBD'}</span>
        </div>
        {bothKnown && !isArchived && (
          <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-700 pt-0.5">
            <Play className="w-3 h-3 fill-current" />
            <span>Start Refereeing</span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm flex-shrink-0">
              {formatMeta?.icon || <Trophy className="w-4 h-4" />}
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black text-slate-900 truncate">{competition.name}</h2>
              <p className="text-[10px] text-slate-500 font-semibold">
                {COMPETITION_FORMAT_LABELS[competition.format] || competition.format}
                {competition.status === 'COMPLETED' && ' • Archived'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Meta Row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[10px] text-slate-500 font-medium px-0.5">
          {clubA && clubB ? (
            <span>{clubA.name} vs {clubB.name}</span>
          ) : (
            <span className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span>{competition.participantIds.length} participants</span>
            </span>
          )}
          <span>Created {formatMatchDateGroup(competition.createdAt)}</span>
          {competition.fixtures && competition.fixtures.length > 0 && (
            <span className="flex items-center space-x-1 bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
              <span>
                {competition.matchFormat === 'BEST_OF_3'
                  ? 'Best of 3'
                  : competition.matchFormat === 'SINGLE_GAME'
                  ? 'Single Game'
                  : 'Best of 5'}
              </span>
              <span>•</span>
              <span>PARS-{competition.targetPoints ?? 11}</span>
            </span>
          )}
        </div>

        {hasLiveMatch && !isArchived && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-[11px] font-semibold text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Finish your current live match before starting another fixture.</span>
          </div>
        )}

        {isArchived && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center space-x-2 text-[11px] font-semibold text-slate-500">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>This competition is archived — reactivate it from the Competitions list to referee new fixtures.</span>
          </div>
        )}

        {champion && (
          <div className="p-3 bg-slate-900 text-white rounded-2xl flex items-center space-x-2.5 shadow-md border border-slate-800">
            <div className="w-9 h-9 rounded-full bg-amber-400 text-slate-900 flex items-center justify-center flex-shrink-0 shadow-sm">
              <Trophy className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-wider">Champion</p>
              <p className="text-sm font-black truncate">{champion.countryFlag} {champion.name}</p>
            </div>
          </div>
        )}

        {/* Bracket (Single Elimination: one track. Double Elimination: Winners + Losers
            tracks, each rendered the same way, plus a standalone Grand Final card.) */}
        {isSingleElim && rounds.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">Bracket</h3>
            <div className="overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              <div className="flex items-start" style={{ width: 'max-content' }}>
                {rounds.map(([roundNum, fixturesInRound], roundIdx) => (
                  <React.Fragment key={roundNum}>
                    {renderBracketColumn(fixturesInRound, roundIdx, getEliminationRoundLabel(fixturesInRound.length))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {isDoubleElim && wbRounds.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">Winners Bracket</h3>
            <div className="overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              <div className="flex items-start" style={{ width: 'max-content' }}>
                {wbRounds.map(([roundNum, fixturesInRound], roundIdx) => (
                  <React.Fragment key={roundNum}>
                    {renderBracketColumn(fixturesInRound, roundIdx, getEliminationRoundLabel(fixturesInRound.length))}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {isDoubleElim && lbRounds.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">Losers Bracket</h3>
            <div className="overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
              <div className="flex items-start" style={{ width: 'max-content' }}>
                {lbRounds.map(([roundNum, fixturesInRound], roundIdx) => (
                  <React.Fragment key={roundNum}>
                    {renderBracketColumn(fixturesInRound, roundIdx, `LB Round ${roundNum}`)}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        )}

        {isDoubleElim && gfFixture && (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">Grand Final</h3>
            {renderGrandFinalCard(gfFixture)}
          </div>
        )}

        {/* Fixtures / Standings */}
        {!isBracket && !isGroupsFormat && rounds.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between px-0.5">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                {viewMode === 'STANDINGS'
                  ? 'Standings'
                  : `${rounds.length > 1 ? `Round ${activeRound} of ${rounds.length}` : 'Fixtures'} (${activeRoundFixtures.length})`}
              </h3>
              {isLeague && (
                <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
                  <button
                    onClick={() => setViewMode('FIXTURES')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                      viewMode === 'FIXTURES' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <LayoutList className="w-3 h-3" />
                    <span>Fixtures</span>
                  </button>
                  <button
                    onClick={() => setViewMode('STANDINGS')}
                    className={`flex items-center space-x-1 px-2 py-1 rounded-md text-[10px] font-bold transition-colors cursor-pointer ${
                      viewMode === 'STANDINGS' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'
                    }`}
                  >
                    <ListOrdered className="w-3 h-3" />
                    <span>Table</span>
                  </button>
                </div>
              )}
            </div>

            {viewMode === 'STANDINGS' ? (
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="text-left pl-3 pr-1 py-2 w-6">#</th>
                      <th className="text-left px-1 py-2">Player</th>
                      <th className="text-center px-1 py-2 w-8">P</th>
                      <th className="text-center px-1 py-2 w-8">W</th>
                      <th className="text-center px-1 py-2 w-8">L</th>
                      <th className="text-center pl-1 pr-3 py-2 w-14">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, idx) => {
                      const p = getPlayer(row.playerId);
                      if (!p) return null;
                      return (
                        <tr key={row.playerId} className="border-b border-slate-100 last:border-0">
                          <td className="pl-3 pr-1 py-2 font-black text-slate-400">{idx + 1}</td>
                          <td className="px-1 py-2 font-bold text-slate-900 truncate max-w-[120px]">
                            {p.countryFlag} {p.name}
                          </td>
                          <td className="text-center px-1 py-2 text-slate-600">{row.played}</td>
                          <td className="text-center px-1 py-2 font-bold text-emerald-700">{row.wins}</td>
                          <td className="text-center px-1 py-2 font-bold text-red-600">{row.losses}</td>
                          <td className="text-center pl-1 pr-3 py-2 text-slate-500 font-semibold">
                            {row.gamesWon}-{row.gamesLost}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <>
            {/* Round/Tour Tabs — only shown for multi-round formats (e.g. League). Played
                rounds stay reachable behind the current one, which is selected by default. */}
            {rounds.length > 1 && (
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                {rounds.map(([roundNum, fixturesInRound]) => {
                  const allPlayed = fixturesInRound.every((f) => isFixturePlayed(f, competition.id, matches));
                  const isSelected = activeRound === roundNum;
                  return (
                    <button
                      key={roundNum}
                      ref={isSelected ? activeTabRef : undefined}
                      onClick={() => setSelectedRound(roundNum)}
                      className={`flex-shrink-0 flex items-center space-x-1 px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 text-amber-400 shadow-sm'
                          : allPlayed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {allPlayed && <Check className="w-3 h-3" />}
                      <span>Round {roundNum}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {activeRoundFixtures.map((fixture) => renderSimpleFixtureCard(fixture, fixtureLabel))}
            </div>
              </>
            )}
          </div>
        ) : isGroupsFormat && groupCount > 0 ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">Groups</h3>
              <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 no-scrollbar">
                {Array.from({ length: groupCount }, (_, idx) => idx).map((idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveGroupIndex(idx)}
                    className={`flex-shrink-0 px-2.5 py-1.5 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      activeGroupIndex === idx
                        ? 'bg-slate-900 text-amber-400 shadow-sm'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    Group {String.fromCharCode(65 + idx)}
                  </button>
                ))}
              </div>

              {(() => {
                const activeGroupFixtures = groupFixturesAll.filter((f) => f.groupIndex === activeGroupIndex);
                const groupParticipantIds = [...new Set(activeGroupFixtures.flatMap((f) => [f.player1Id, f.player2Id]))];
                const groupStandings = computeStandingsForFixtures(groupParticipantIds, competition.id, matches);

                return (
                  <div className="space-y-2">
                    <div className="border border-slate-200 rounded-2xl overflow-hidden">
                      <table className="w-full text-[11px]">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                            <th className="text-left pl-3 pr-1 py-2 w-6">#</th>
                            <th className="text-left px-1 py-2">Player</th>
                            <th className="text-center px-1 py-2 w-8">P</th>
                            <th className="text-center px-1 py-2 w-8">W</th>
                            <th className="text-center px-1 py-2 w-8">L</th>
                            <th className="text-center pl-1 pr-3 py-2 w-14">Games</th>
                          </tr>
                        </thead>
                        <tbody>
                          {groupStandings.map((row, idx) => {
                            const p = getPlayer(row.playerId);
                            if (!p) return null;
                            const qualifies = groupCount === 1 ? idx < Math.min(4, groupParticipantIds.length) : idx < 2;
                            return (
                              <tr
                                key={row.playerId}
                                className={`border-b border-slate-100 last:border-0 ${qualifies ? 'bg-emerald-50/40' : ''}`}
                              >
                                <td className="pl-3 pr-1 py-2 font-black text-slate-400">{idx + 1}</td>
                                <td className="px-1 py-2 font-bold text-slate-900 truncate max-w-[120px]">
                                  {p.countryFlag} {p.name}
                                </td>
                                <td className="text-center px-1 py-2 text-slate-600">{row.played}</td>
                                <td className="text-center px-1 py-2 font-bold text-emerald-700">{row.wins}</td>
                                <td className="text-center px-1 py-2 font-bold text-red-600">{row.losses}</td>
                                <td className="text-center pl-1 pr-3 py-2 text-slate-500 font-semibold">
                                  {row.gamesWon}-{row.gamesLost}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {activeGroupFixtures.map((fixture) => renderSimpleFixtureCard(fixture, 'Match'))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {koRounds.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">Knockout</h3>
                <div className="overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
                  <div className="flex items-start" style={{ width: 'max-content' }}>
                    {koRounds.map(([roundNum, fixturesInRound], roundIdx) => (
                      <React.Fragment key={roundNum}>
                        {renderBracketColumn(fixturesInRound, roundIdx, getEliminationRoundLabel(fixturesInRound.length))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : !isBracket && !isGroupsFormat && rounds.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200">
No fixtures have been generated for this competition yet.
          </div>
        ) : null}
      </div>
    </div>
  );
};
