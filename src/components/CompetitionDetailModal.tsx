import React, { useEffect } from 'react';
import { useSquash } from '../context/SquashContext';
import { CLUBS_LIST } from './ClubSelectorModal';
import { COMPETITION_FORMATS, COMPETITION_FORMAT_LABELS } from './NewCompetitionModal';
import { getMatchWinnerId } from '../utils/matchUtils';
import { formatMatchDateGroup } from '../utils/dateUtils';
import { X, Trophy, Users, Play, Check, AlertCircle } from 'lucide-react';
import type { CompetitionFixture, SquashMatch } from '../types/squash';

interface CompetitionDetailModalProps {
  competitionId: string | null;
  onClose: () => void;
  onStartMatch?: () => void;
  onSelectMatchDetail?: (matchId: string) => void;
}

// Finds the completed match (if any) that fulfills this fixture — never stored on the
// fixture itself, always derived from `matches`, so it can't drift out of sync (see the
// comment on CompetitionFixture in types/squash.ts).
const findFixtureMatch = (
  fixture: CompetitionFixture,
  competitionId: string,
  matches: SquashMatch[]
): SquashMatch | undefined => {
  return matches.find(
    (m) =>
      m.competitionId === competitionId &&
      m.status === 'COMPLETED' &&
      ((m.player1.id === fixture.player1Id && m.player2.id === fixture.player2Id) ||
        (m.player1.id === fixture.player2Id && m.player2.id === fixture.player1Id))
  );
};

export const CompetitionDetailModal: React.FC<CompetitionDetailModalProps> = ({
  competitionId,
  onClose,
  onStartMatch,
  onSelectMatchDetail,
}) => {
  const { competitions, matches, players, activeMatchState, startMatch } = useSquash();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (competitionId) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [competitionId, onClose]);

  if (!competitionId) return null;
  const competition = competitions.find((c) => c.id === competitionId);
  if (!competition) return null;

  const formatMeta = COMPETITION_FORMATS.find((f) => f.id === competition.format);
  const clubA = competition.clubAId ? CLUBS_LIST.find((c) => c.id === competition.clubAId) : undefined;
  const clubB = competition.clubBId ? CLUBS_LIST.find((c) => c.id === competition.clubBId) : undefined;
  const getPlayer = (id: string) => players.find((p) => p.id === id);
  const hasLiveMatch = Boolean(activeMatchState);

  const handleStartFixture = (fixture: CompetitionFixture) => {
    if (hasLiveMatch) return;
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
      competition.targetPoints ?? 11
    );
    onStartMatch?.();
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

        {hasLiveMatch && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-[11px] font-semibold text-amber-800">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span>Finish your current live match before starting another fixture.</span>
          </div>
        )}

        {/* Fixtures */}
        {competition.fixtures && competition.fixtures.length > 0 ? (
          <div className="space-y-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider px-0.5">
              Fixtures ({competition.fixtures.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {competition.fixtures.map((fixture) => {
                const p1 = getPlayer(fixture.player1Id);
                const p2 = getPlayer(fixture.player2Id);
                const playedMatch = findFixtureMatch(fixture, competition.id, matches);
                const winnerId = playedMatch ? getMatchWinnerId(playedMatch) : undefined;

                if (!p1 || !p2) return null;

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
                          <span>Rank #{fixture.slot} • Played</span>
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
                    disabled={hasLiveMatch}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left space-y-1.5 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">
                      Rank #{fixture.slot} • Not played
                    </span>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {p1.countryFlag} {p1.name}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">vs</div>
                    <div className="text-xs font-bold text-slate-900 truncate">
                      {p2.countryFlag} {p2.name}
                    </div>
                    <div className="flex items-center space-x-1 text-[10px] font-bold text-blue-700 pt-0.5">
                      <Play className="w-3 h-3 fill-current" />
                      <span>Start Refereeing</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200">
            Fixture generation for {COMPETITION_FORMAT_LABELS[competition.format] || 'this format'} isn't built yet —
            only Interclub 4v4 auto-generates matches today.
          </div>
        )}
      </div>
    </div>
  );
};
