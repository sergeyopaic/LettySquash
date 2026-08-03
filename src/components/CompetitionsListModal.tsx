import React, { useEffect, useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { CLUBS_LIST } from './ClubSelectorModal';
import { COMPETITION_FORMATS, COMPETITION_FORMAT_LABELS } from './NewCompetitionModal';
import { formatMatchDateGroup } from '../utils/dateUtils';
import { X, Trophy, Users, Archive, RotateCcw, Trash2 } from 'lucide-react';
import type { CompetitionStatus } from '../types/squash';

interface CompetitionsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDetail?: (competitionId: string) => void;
}

export const CompetitionsListModal: React.FC<CompetitionsListModalProps> = ({ isOpen, onClose, onOpenDetail }) => {
  const { competitions, setCompetitionStatus, deleteCompetition } = useSquash();
  const [statusFilter, setStatusFilter] = useState<CompetitionStatus>('ACTIVE');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = competitions
    .filter((c) => c.status === statusFilter)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const activeCount = competitions.filter((c) => c.status === 'ACTIVE').length;
  const archivedCount = competitions.filter((c) => c.status === 'COMPLETED').length;

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
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center shadow-sm">
              <Trophy className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">Competitions</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex space-x-2">
          <button
            onClick={() => setStatusFilter('ACTIVE')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'ACTIVE'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('COMPLETED')}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
              statusFilter === 'COMPLETED'
                ? 'bg-slate-900 text-amber-400 shadow-sm'
                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            Archive ({archivedCount})
          </button>
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-400 font-semibold border border-dashed border-slate-200">
            {statusFilter === 'ACTIVE'
              ? 'No active competitions yet. Create one from the Home screen.'
              : 'No archived competitions yet.'}
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((c) => {
              const formatMeta = COMPETITION_FORMATS.find((f) => f.id === c.format);
              const clubA = c.clubAId ? CLUBS_LIST.find((club) => club.id === c.clubAId) : undefined;
              const clubB = c.clubBId ? CLUBS_LIST.find((club) => club.id === c.clubBId) : undefined;

              return (
                <div
                  key={c.id}
                  onClick={() => onOpenDetail?.(c.id)}
                  className={`p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 ${
                    onOpenDetail ? 'cursor-pointer hover:bg-slate-100/80 transition-colors' : ''
                  }`}
                >
                  <div className="flex items-start justify-between space-x-2">
                    <div className="flex items-start space-x-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-white shadow-2xs flex-shrink-0 mt-0.5">
                        {formatMeta?.icon || <Trophy className="w-5 h-5 text-slate-400" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">{c.name}</p>
                        <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                          {COMPETITION_FORMAT_LABELS[c.format] || c.format}
                        </p>
                        {clubA && clubB && (
                          <p className="text-[10px] text-slate-400 font-medium mt-0.5 truncate">
                            {clubA.name} vs {clubB.name}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete competition "${c.name}"?`)) {
                          deleteCompetition(c.id);
                        }
                      }}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded transition-colors cursor-pointer flex-shrink-0"
                      title="Delete competition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/70">
                    <div className="flex items-center space-x-3 text-[10px] text-slate-500 font-medium">
                      <span className="flex items-center space-x-1">
                        <Users className="w-3 h-3 text-slate-400" />
                        <span>{c.participantIds.length} players</span>
                      </span>
                      <span>{formatMatchDateGroup(c.createdAt)}</span>
                    </div>

                    {c.status === 'ACTIVE' ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompetitionStatus(c.id, 'COMPLETED');
                        }}
                        className="text-[10px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <Archive className="w-3 h-3" />
                        <span>Archive</span>
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCompetitionStatus(c.id, 'ACTIVE');
                        }}
                        className="text-[10px] font-bold text-amber-700 hover:text-amber-900 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg flex items-center space-x-1 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reactivate</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
