import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { MatchStarterForm } from './QuickMatchCard';
import { SquashBallIcon } from './DashboardView';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  openSettingsModal?: () => void;
}

// The global "start a match" entry point — reachable from any tab via the bottom nav
// bar, unlike QuickMatchCard which only lives inline on the Home dashboard. Shares all
// of its player-search/racket/color/format logic with QuickMatchCard through
// MatchStarterForm; the only difference is this shell (a modal, format panel expanded
// by default) versus that one (inline card, collapsed by default).
export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  onStart,
  openSettingsModal,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <SquashBallIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">New Match</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <MatchStarterForm
          onStart={() => {
            onStart();
            onClose();
          }}
          openSettingsModal={openSettingsModal}
          defaultFormatExpanded
          alwaysShowRecent
        />
      </div>
    </div>
  );
};
