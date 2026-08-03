import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import type { NZSquashGrade, Handedness, Club } from '../types/squash';
import { WORLD_COUNTRIES, DEFAULT_COUNTRY } from '../utils/countries';
import { X, UserPlus, Search, Globe } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClub?: Club;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, activeClub }) => {
  const { addPlayer } = useSquash();

  const [name, setName] = useState('');
  const [skillGrade, setSkillGrade] = useState<NZSquashGrade>('C1');
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [countrySearch, setCountrySearch] = useState('');
  const [isCountryPickerOpen, setIsCountryPickerOpen] = useState(false);
  const [handedness, setHandedness] = useState<Handedness>('Right');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  if (!isOpen) return null;

  const colorOptions = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#6366F1'];

  // Official NZ Squash Grades: A1, A2, B1, B2, C1, C2, D1, D2, E1, E2, F, J1, J2, J3, J4
  const nzGrades: NZSquashGrade[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'D1', 'D2', 'E1', 'E2', 'F', 'J1', 'J2', 'J3', 'J4'];

  const filteredCountries = WORLD_COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) || c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter player name!');
      return;
    }
    addPlayer(
      name.trim(),
      skillGrade,
      selectedCountry.flag,
      selectedCountry.code,
      handedness,
      selectedColor,
      activeClub?.id
    );
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center font-bold">
              <UserPlus className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-black text-slate-900">New Player Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Liam Walker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              required
            />
          </div>

          {/* Country Flag Selection */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Nationality / Flag</label>
            <button
              type="button"
              onClick={() => setIsCountryPickerOpen(true)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 flex items-center justify-between hover:bg-slate-100 transition-colors"
            >
              <div className="flex items-center space-x-2.5">
                <span className="text-xl">{selectedCountry.flag}</span>
                <span>{selectedCountry.name} ({selectedCountry.code})</span>
              </div>
              <Globe className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* NZ Squash Exact Grade Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 block">Squash NZ Grade</label>
              <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-2 py-0.5 rounded-md">
                {skillGrade}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {nzGrades.map((g) => (
                <button
                  type="button"
                  key={g}
                  onClick={() => setSkillGrade(g)}
                  className={`py-2 rounded-xl border text-xs font-black text-center transition-all ${
                    skillGrade === g
                      ? 'border-blue-900 bg-blue-900 text-amber-400 shadow-sm scale-105'
                      : 'border-slate-200 text-slate-700 bg-slate-50 hover:bg-slate-100'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {/* Handedness */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Handedness</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setHandedness('Right')}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  handedness === 'Right'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Right-handed
              </button>
              <button
                type="button"
                onClick={() => setHandedness('Left')}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  handedness === 'Left'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Left-handed
              </button>
            </div>
          </div>

          {/* Color options */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Avatar Color</label>
            <div className="flex space-x-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-98"
          >
            Save Player Profile
          </button>
        </form>
      </div>

      {/* Country Selection Modal */}
      {isCountryPickerOpen && (
        <div className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-4 max-w-xs w-full max-h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 mb-2">
              <h3 className="text-sm font-bold text-slate-900">Select Country Flag</h3>
              <button
                onClick={() => setIsCountryPickerOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative mb-2">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search country..."
                value={countrySearch}
                onChange={(e) => setCountrySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-1 pr-1">
              {filteredCountries.map((c) => (
                <button
                  key={c.code}
                  onClick={() => {
                    setSelectedCountry(c);
                    setIsCountryPickerOpen(false);
                    setCountrySearch('');
                  }}
                  className={`w-full p-2.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    selectedCountry.code === c.code
                      ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <span className="text-xl">{c.flag}</span>
                    <span>{c.name}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">{c.code}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
