import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { X, Trophy, Users, Shield, Award, Check } from 'lucide-react';

interface NewCompetitionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type CompetitionFormat = 'LEAGUE' | 'GROUPS_PLAYOFF' | 'SINGLE_ELIMINATION' | 'DOUBLE_ELIMINATION';

export const NewCompetitionModal: React.FC<NewCompetitionModalProps> = ({ isOpen, onClose }) => {
  const { players } = useSquash();

  const [competitionName, setCompetitionName] = useState('');
  const [selectedFormat, setSelectedFormat] = useState<CompetitionFormat>('LEAGUE');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(players.map((p) => p.id));
  const [isCreatedToast, setIsCreatedToast] = useState(false);

  if (!isOpen) return null;

  const formats: { id: CompetitionFormat; title: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'LEAGUE',
      title: 'League (Round-Robin)',
      desc: 'Every player plays against every other player in the league.',
      icon: <Award className="w-5 h-5 text-amber-500" />,
    },
    {
      id: 'GROUPS_PLAYOFF',
      title: 'Groups + Knockout',
      desc: 'Group stage qualification followed by playoff bracket.',
      icon: <Users className="w-5 h-5 text-blue-500" />,
    },
    {
      id: 'SINGLE_ELIMINATION',
      title: 'Single Elimination',
      desc: 'Classic knockout tournament (1 loss = eliminated).',
      icon: <Trophy className="w-5 h-5 text-emerald-500" />,
    },
    {
      id: 'DOUBLE_ELIMINATION',
      title: 'Double Elimination',
      desc: 'Knockout bracket with Winners and Losers brackets.',
      icon: <Shield className="w-5 h-5 text-purple-500" />,
    },
  ];

  const handleTogglePlayer = (id: string) => {
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

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitionName.trim()) {
      alert('Please enter a competition name!');
      return;
    }
    // Mock success banner (no backend logic for now as requested)
    setIsCreatedToast(true);
    setTimeout(() => {
      setIsCreatedToast(false);
      setCompetitionName('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center font-bold shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Create Competition</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isCreatedToast ? (
          <div className="p-6 text-center space-y-3 animate-in zoom-in duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <Check className="w-8 h-8 stroke-[3]" />
            </div>
            <h3 className="text-base font-black text-slate-900">Competition Created!</h3>
            <p className="text-xs text-slate-500">
              "{competitionName}" has been successfully configured.
            </p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            {/* Competition Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-600 block">Competition Name</label>
              <input
                type="text"
                placeholder="e.g. Auckland Squash Open 2026"
                value={competitionName}
                onChange={(e) => setCompetitionName(e.target.value)}
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
                required
              />
            </div>

            {/* 4 Competition Formats */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Competition Format</label>
              <div className="space-y-2">
                {formats.map((f) => (
                  <button
                    type="button"
                    key={f.id}
                    onClick={() => setSelectedFormat(f.id)}
                    className={`w-full p-3 rounded-2xl border text-left flex items-start space-x-3 transition-all ${
                      selectedFormat === f.id
                        ? 'border-blue-900 bg-blue-50/80 shadow-xs ring-1 ring-blue-900'
                        : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="p-2 rounded-xl bg-white shadow-2xs flex-shrink-0 mt-0.5">
                      {f.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900">{f.title}</p>
                        {selectedFormat === f.id && (
                          <span className="w-4 h-4 rounded-full bg-blue-900 text-white flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{f.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Participants */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-600 block">Participants</label>
                <span className="text-[10px] font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded-md">
                  {selectedPlayerIds.length} / {players.length} Players
                </span>
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50">
                {players.map((p) => {
                  const isSelected = selectedPlayerIds.includes(p.id);
                  return (
                    <button
                      type="button"
                      key={p.id}
                      onClick={() => handleTogglePlayer(p.id)}
                      className={`w-full p-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                        isSelected ? 'bg-white text-slate-900 font-bold shadow-2xs border border-slate-200' : 'text-slate-500 opacity-60'
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

            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-transform active:scale-98"
            >
              Create Competition
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
