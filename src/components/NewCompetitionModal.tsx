import React, { useState, useEffect } from 'react';
import { useSquash } from '../context/SquashContext';
import type { CompetitionFormat } from '../types/squash';
import { CLUBS_LIST } from './ClubSelectorModal';
import { getPlayersForClub } from '../utils/clubUtils';
import {
  X,
  Trophy,
  Users,
  Shield,
  Award,
  Check,
  Zap,
  ChevronDown,
} from 'lucide-react';

interface NewCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type { CompetitionFormat };

export const COMPETITION_FORMATS: {
  id: CompetitionFormat;
  title: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  {
    id: 'INTERCLUB_4VS4',
    title: 'Interclub 4 vs 4',
    desc: 'Official Club vs Club team fixture. 4 players per club matched 1vs1.',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
  },
  {
    id: 'LEAGUE',
    title: 'League (Round-Robin)',
    desc: 'Every player plays against every other player in the league.',
    icon: <Award className="w-5 h-5 text-blue-500" />,
  },
  {
    id: 'GROUPS_PLAYOFF',
    title: 'Groups + Knockout',
    desc: 'Group stage qualification followed by playoff bracket.',
    icon: <Users className="w-5 h-5 text-emerald-500" />,
  },
  {
    id: 'SINGLE_ELIMINATION',
    title: 'Single Elimination',
    desc: 'Classic knockout tournament (1 loss = eliminated).',
    icon: <Trophy className="w-5 h-5 text-purple-500" />,
  },
  {
    id: 'DOUBLE_ELIMINATION',
    title: 'Double Elimination',
    desc: 'Knockout bracket with Winners and Losers brackets.',
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
  },
];

export const COMPETITION_FORMAT_LABELS: Record<CompetitionFormat, string> = COMPETITION_FORMATS.reduce(
  (acc, f) => ({ ...acc, [f.id]: f.title }),
  {} as Record<CompetitionFormat, string>
);

export const GRADE_RANKS: Record<string, number> = {
  A1: 100,
  A2: 90,
  B1: 80,
  B2: 70,
  C1: 60,
  C2: 50,
  D1: 40,
  D2: 30,
  E1: 20,
  E2: 10,
  F: 5,
  J1: 4,
  J2: 3,
  J3: 2,
  J4: 1,
};

export const getGradeRank = (grade: string): number => {
  return GRADE_RANKS[grade] || 50;
};

export const NewCompetitionModal: React.FC<NewCompetitionModalProps> = ({ isOpen, onClose }) => {
  const { players, addCompetition } = useSquash();

  const [competitionName, setCompetitionName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<CompetitionFormat>('INTERCLUB_4VS4');
  
  // Standard format selected players
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(players.map((p) => p.id));

  // Interclub 4vs4 club selection IDs
  const [selectedClubAId, setSelectedClubAId] = useState<string>('c2');
  const [selectedClubBId, setSelectedClubBId] = useState<string>('c3');

  const clubA = CLUBS_LIST.find((c) => c.id === selectedClubAId) || CLUBS_LIST[1];
  const clubB = CLUBS_LIST.find((c) => c.id === selectedClubBId) || CLUBS_LIST[2];

  const clubAName = clubA ? clubA.name : 'Club A';
  const clubBName = clubB ? clubB.name : 'Club B';

  // Top 4 players per club by grade, drawn from the real live roster (not a mock snapshot)
  const teamAPlayers = getPlayersForClub(players, selectedClubAId)
    .sort((a, b) => getGradeRank(b.skillGrade) - getGradeRank(a.skillGrade))
    .slice(0, 4);

  const teamBPlayers = getPlayersForClub(players, selectedClubBId)
    .sort((a, b) => getGradeRank(b.skillGrade) - getGradeRank(a.skillGrade))
    .slice(0, 4);

  const [isCreatedToast, setIsCreatedToast] = useState(false);

  // Auto-generate tournament name when Interclub format or club names change
  useEffect(() => {
    if (selectedFormat === 'INTERCLUB_4VS4' && clubAName && clubBName) {
      setCompetitionName(`${clubAName} vs ${clubBName}`);
    }
  }, [selectedFormat, selectedClubAId, selectedClubBId, clubAName, clubBName]);

  if (!isOpen) return null;

  const formats = COMPETITION_FORMATS;

  const handleToggleStandardPlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      if (selectedPlayerIds.length > 2) {
        setSelectedPlayerIds(selectedPlayerIds.filter((pId) => pId !== id));
      } else {
        alert('Competition requires at least 2 players!');
      }
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const executeCreate = () => {
    const participantIds =
      selectedFormat === 'INTERCLUB_4VS4'
        ? [...teamAPlayers, ...teamBPlayers].map((p) => p.id)
        : selectedPlayerIds;

    addCompetition({
      name: competitionName.trim(),
      format: selectedFormat,
      participantIds,
      clubAId: selectedFormat === 'INTERCLUB_4VS4' ? selectedClubAId : undefined,
      clubBId: selectedFormat === 'INTERCLUB_4VS4' ? selectedClubBId : undefined,
    });

    setIsCreatedToast(true);
    setTimeout(() => {
      setIsCreatedToast(false);
      onClose();
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionName.trim()) {
      alert('Please enter a competition name!');
      return;
    }
    if (selectedFormat === 'INTERCLUB_4VS4' && (teamAPlayers.length === 0 || teamBPlayers.length === 0)) {
      alert('Both clubs need at least 1 registered player to start an Interclub fixture!');
      return;
    }
    executeCreate();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer">
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-bold shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-none">
                Create Competition
              </h2>
              <span className="text-[10px] font-bold text-amber-600 block mt-0.5">
                Official WSF / NZ Squash Formats
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Toast */}
        {isCreatedToast ? (
          <div className="p-6 text-center space-y-3 animate-in zoom-in duration-200">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900">Competition Created!</h3>
            <p className="text-xs text-slate-500 font-medium">
              "{competitionName}" has been successfully configured.
            </p>
          </div>
        ) : (
          /* Main Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Competition Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Competition Name</label>
              <input
                type="text"
                placeholder="e.g. Remuera Rackets Club vs Belmont Squash Club"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            {/* Competition Formats Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Competition Format</label>
              <div className="space-y-2">
                {formats.map((f) => {
                  const isSelected = selectedFormat === f.id;
                  return (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setSelectedFormat(f.id)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-slate-900 bg-slate-900 text-white shadow-md ring-2 ring-amber-400'
                          : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100 text-slate-900'
                      }`}
                    >
                      <div className={`p-2 rounded-xl flex-shrink-0 mt-0.5 ${isSelected ? 'bg-slate-800' : 'bg-white shadow-2xs'}`}>
                        {f.icon}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                            {f.title}
                          </p>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center text-[10px] font-black">
                              ✓
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] mt-1 leading-relaxed ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {f.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* INTERCLUB 4VS4 SPECIAL CONFIGURATOR                           */}
            {/* ------------------------------------------------------------- */}
            {selectedFormat === 'INTERCLUB_4VS4' ? (
              <div className="space-y-4 pt-2 border-t border-slate-200">
                {/* Club Select Dropdowns */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Club A Select Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Club A
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClubAId}
                        onChange={(e) => {
                          const newAId = e.target.value;
                          setSelectedClubAId(newAId);
                          if (newAId === selectedClubBId) {
                            const other = CLUBS_LIST.find((c) => c.id !== newAId);
                            if (other) setSelectedClubBId(other.id);
                          }
                        }}
                        className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none pr-8 cursor-pointer truncate"
                      >
                        {CLUBS_LIST.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.countryFlag} {club.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>

                  {/* Club B Select Dropdown */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                      Club B
                    </label>
                    <div className="relative">
                      <select
                        value={selectedClubBId}
                        onChange={(e) => {
                          const newBId = e.target.value;
                          setSelectedClubBId(newBId);
                          if (newBId === selectedClubAId) {
                            const other = CLUBS_LIST.find((c) => c.id !== newBId);
                            if (other) setSelectedClubAId(other.id);
                          }
                        }}
                        className="w-full p-2.5 bg-amber-50/60 border border-amber-300 rounded-xl text-xs font-bold text-amber-900 focus:outline-none focus:ring-2 focus:ring-amber-500 appearance-none pr-8 cursor-pointer truncate"
                      >
                        {CLUBS_LIST.map((club) => (
                          <option key={club.id} value={club.id}>
                            {club.countryFlag} {club.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 text-amber-600 absolute right-2.5 top-3 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Team Rosters Overview (4 dedicated independent players per club) */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Club A Roster */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-700 uppercase truncate max-w-[120px]">
                        {clubAName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded-md">
                        {teamAPlayers.length}/4 Lineup
                      </span>
                    </div>

                    <div className="space-y-1 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {teamAPlayers.length === 0 ? (
                        <div className="p-2 text-[10px] text-slate-400 font-semibold text-center">
                          No registered players in this club yet
                        </div>
                      ) : (
                        teamAPlayers.map((p, idx) => (
                          <div
                            key={p.id}
                            className="p-1.5 rounded-lg text-xs bg-slate-900 text-white font-bold flex items-center justify-between shadow-2xs"
                          >
                            <span className="truncate text-[11px]">
                              <strong className="text-slate-400 font-mono mr-1">#{idx + 1}</strong>
                              {p.countryFlag} {p.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-amber-400 ml-1">
                              {p.skillGrade}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Club B Roster */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-700 uppercase truncate max-w-[120px]">
                        {clubBName}
                      </span>
                      <span className="text-[10px] font-mono font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                        {teamBPlayers.length}/4 Lineup
                      </span>
                    </div>

                    <div className="space-y-1 p-1.5 bg-slate-50 border border-slate-200 rounded-xl">
                      {teamBPlayers.length === 0 ? (
                        <div className="p-2 text-[10px] text-slate-400 font-semibold text-center">
                          No registered players in this club yet
                        </div>
                      ) : (
                        teamBPlayers.map((p, idx) => (
                          <div
                            key={p.id}
                            className="p-1.5 rounded-lg text-xs bg-amber-500 text-slate-950 font-bold flex items-center justify-between shadow-2xs"
                          >
                            <span className="truncate text-[11px]">
                              <strong className="text-slate-900 font-mono mr-1">#{idx + 1}</strong>
                              {p.countryFlag} {p.name}
                            </span>
                            <span className="text-[9px] font-mono font-bold text-slate-900 ml-1">
                              {p.skillGrade}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {(teamAPlayers.length < 4 || teamBPlayers.length < 4) && (
                  <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-2.5 py-1.5 font-medium leading-snug">
                    Interclub 4v4 needs 4 registered players per club — add more players to {teamAPlayers.length < 4 ? clubAName : clubBName} first.
                  </div>
                )}

                {/* 1vs1 Automated Interclub Fixtures Preview Table */}
                <div className="space-y-1.5 bg-slate-900 text-white p-3 rounded-2xl shadow-md border border-slate-800">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center space-x-1">
                      <span>⚖️ 1vs1 Interclub Fixtures (#1 vs #1 ... #4 vs #4)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">
                      4 Matches
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1 text-xs">
                    {[0, 1, 2, 3].map((idx) => {
                      const pA = teamAPlayers[idx];
                      const pB = teamBPlayers[idx];

                      return (
                        <div
                          key={idx}
                          className="p-2 rounded-xl border bg-slate-800/80 border-slate-700/80 text-white flex items-center justify-between transition-colors"
                        >
                          <span className="text-[10px] font-mono font-bold text-slate-400 w-12 flex-shrink-0">
                            Rank #{idx + 1}
                          </span>

                          <div className="flex items-center justify-between flex-1 px-2 font-mono">
                            {/* Player A */}
                            <span className="font-bold text-white text-xs truncate max-w-[110px]">
                              {pA ? `${pA.name} (${pA.skillGrade})` : '—'}
                            </span>

                            <span className="text-amber-400 font-black text-xs px-1">vs</span>

                            {/* Player B */}
                            <span className="font-bold text-amber-400 text-xs truncate max-w-[110px] text-right">
                              {pB ? `${pB.name} (${pB.skillGrade})` : '—'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Standard Participants Selector for non-Interclub formats */
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-600 block">Participants</label>
                  <span className="text-[10px] font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">
                    {selectedPlayerIds.length} / {players.length} Players
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-200 rounded-xl p-2 bg-slate-50">
                  {players.map((p) => {
                    const isSelected = selectedPlayerIds.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => handleToggleStandardPlayer(p.id)}
                        className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200'
                            : 'text-slate-500 opacity-60'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span>{p.countryFlag}</span>
                          <span>{p.name}</span>
                        </div>
                        <span className="text-[10px] font-mono text-amber-600 font-bold">{p.skillGrade}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-xl shadow-md transition-transform active:scale-98 cursor-pointer flex items-center justify-center space-x-2 border border-slate-800"
            >
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Create Competition</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
