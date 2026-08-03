import type { SquashMatch, Competition, CompetitionFormat } from '../types/squash';

// The 7 mutually-exclusive "kinds" of match the app recognizes: the 2 modes offered on
// the simplified New Match screen (Casual/Rated), plus the 5 Competition formats. A match
// belongs to exactly one — competition membership (via competitionId) takes precedence
// over the casual/rated distinction, since it's the more specific classification.
export type MatchModeKey = 'CASUAL' | 'RATED' | CompetitionFormat;

export interface MatchModeMeta {
  key: MatchModeKey;
  label: string;
  shortLabel: string;
  pillClasses: string;
  // Left-edge accent used on match cards that belong to a named Competition, so the whole
  // card visually signals "this is a competition fixture" beyond just the pill text.
  accentBorderClass: string;
}

export const MATCH_MODE_META: Record<MatchModeKey, MatchModeMeta> = {
  CASUAL: {
    key: 'CASUAL',
    label: 'Casual',
    shortLabel: 'Casual',
    pillClasses: 'bg-slate-900 text-amber-400',
    accentBorderClass: '',
  },
  RATED: {
    key: 'RATED',
    label: 'Rated',
    shortLabel: 'Rated',
    pillClasses: 'bg-amber-50 text-amber-700 border border-amber-200',
    accentBorderClass: '',
  },
  INTERCLUB_4VS4: {
    key: 'INTERCLUB_4VS4',
    label: 'Interclub',
    shortLabel: 'Interclub',
    pillClasses: 'bg-blue-50 text-blue-700 border border-blue-200',
    accentBorderClass: 'border-l-4 border-l-blue-400',
  },
  LEAGUE: {
    key: 'LEAGUE',
    label: 'League',
    shortLabel: 'League',
    pillClasses: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    accentBorderClass: 'border-l-4 border-l-emerald-400',
  },
  GROUPS_PLAYOFF: {
    key: 'GROUPS_PLAYOFF',
    label: 'Groups + Knockout',
    shortLabel: 'G+PO',
    pillClasses: 'bg-cyan-50 text-cyan-700 border border-cyan-200',
    accentBorderClass: 'border-l-4 border-l-cyan-400',
  },
  SINGLE_ELIMINATION: {
    key: 'SINGLE_ELIMINATION',
    label: 'Single Elimination',
    shortLabel: 'SE',
    pillClasses: 'bg-purple-50 text-purple-700 border border-purple-200',
    accentBorderClass: 'border-l-4 border-l-purple-400',
  },
  DOUBLE_ELIMINATION: {
    key: 'DOUBLE_ELIMINATION',
    label: 'Double Elimination',
    shortLabel: 'DE',
    pillClasses: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    accentBorderClass: 'border-l-4 border-l-indigo-400',
  },
};

export interface MatchMode {
  meta: MatchModeMeta;
  competition?: Competition;
}

/**
 * Resolves which of the 7 modes a match belongs to. A match linked to a Competition is
 * always classified by that competition's format (e.g. "SE"), regardless of isRated —
 * competition membership is the more specific fact. Otherwise it's Casual or Rated.
 */
export const getMatchMode = (match: SquashMatch, competitions: Competition[]): MatchMode => {
  if (match.competitionId) {
    const competition = competitions.find((c) => c.id === match.competitionId);
    if (competition) {
      return { meta: MATCH_MODE_META[competition.format], competition };
    }
  }
  return { meta: match.isRated ? MATCH_MODE_META.RATED : MATCH_MODE_META.CASUAL };
};
