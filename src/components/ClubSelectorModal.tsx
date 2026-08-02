import React from 'react';
import type { Club } from '../types/squash';
import { X, MapPin, Check, Plus } from 'lucide-react';

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
  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Select Active Club
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Choose your home court location
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          {CLUBS_LIST.map((club) => {
            const isSelected = club.id === activeClubId;

            return (
              <div
                key={club.id}
                onClick={() => {
                  onSelectClub(club);
                  onClose();
                }}
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

        <div className="pt-2 border-t border-slate-100 text-center">
          <button
            onClick={() => {
              alert('Custom club registration feature coming soon!');
            }}
            className="text-xs font-semibold text-slate-500 hover:text-blue-900 inline-flex items-center space-x-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register New Squash Club</span>
          </button>
        </div>
      </div>
    </div>
  );
};
