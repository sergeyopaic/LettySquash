import React, { useState } from 'react';
import type { Club } from '../types/squash';
import { X, MapPin, Check, Plus, RefreshCw } from 'lucide-react';

export const CLUBS_LIST: Club[] = [
  {
    id: 'c1',
    name: 'Devonport Squash Club',
    city: 'Auckland',
    country: 'New Zealand',
    countryFlag: '🇳🇿',
  },
  {
    id: 'c2',
    name: 'Remuera Rackets Club',
    city: 'Auckland',
    country: 'New Zealand',
    countryFlag: '🇳🇿',
  },
  {
    id: 'c3',
    name: 'Belmont Squash Club',
    city: 'North Shore',
    country: 'New Zealand',
    countryFlag: '🇳🇿',
  },
  {
    id: 'c4',
    name: 'Sydney Squash Centre',
    city: 'Sydney',
    country: 'Australia',
    countryFlag: '🇦🇺',
  },
];

interface ClubSelectorModalProps {
  isOpen: boolean;
  activeClubId: string;
  onSelectClub: (club: Club) => void;
  onClose: () => void;
}

export const ClubSelectorModal: React.FC<ClubSelectorModalProps> = ({
  isOpen,
  activeClubId,
  onSelectClub,
  onClose,
}) => {
  const [pendingClub, setPendingClub] = useState<Club | null>(null);

  if (!isOpen) return null;

  const currentClub = CLUBS_LIST.find((c) => c.id === activeClubId) || CLUBS_LIST[0];

  const handleSelectClick = (club: Club) => {
    if (club.id === activeClubId) {
      onClose();
      return;
    }
    // Open confirmation prompt before switching main home club
    setPendingClub(club);
  };

  const handleConfirmSwitch = () => {
    if (pendingClub) {
      onSelectClub(pendingClub);
      setPendingClub(null);
      onClose();
    }
  };

  return (
    <div
      onClick={() => {
        setPendingClub(null);
        onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Select Home Club
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Choose active club location for your dashboard
            </p>
          </div>
          <button
            onClick={() => {
              setPendingClub(null);
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Confirmation Screen when Switching Home Club */}
        {pendingClub ? (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 animate-in zoom-in duration-150">
            <div className="flex items-center space-x-2 text-amber-900">
              <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 animate-spin" />
              <h4 className="font-black text-xs uppercase tracking-wider">
                Confirm Home Club Switch
              </h4>
            </div>

            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              Switching home club from <strong>"{currentClub.name}"</strong> to{' '}
              <strong>"{pendingClub.name}"</strong> will reload your main dashboard, recent match history, and active player roster for {pendingClub.name}.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingClub(null)}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
              >
                Keep {currentClub.name}
              </button>

              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs text-center transition-colors cursor-pointer"
              >
                Switch Home Club
              </button>
            </div>
          </div>
        ) : (
          /* Club List */
          <div className="space-y-2">
            {CLUBS_LIST.map((club) => {
              const isSelected = club.id === activeClubId;

              return (
                <div
                  key={club.id}
                  onClick={() => handleSelectClick(club)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      {club.countryFlag}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {club.name}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-500 flex items-center space-x-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate">{club.city}, {club.country}</span>
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              alert('Custom club registration feature coming soon!');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-blue-900 inline-flex items-center space-x-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Squash Club</span>
          </button>
        </div>
      </div>
    </div>
  );
};
