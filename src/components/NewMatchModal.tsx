import React, { useState, useEffect } from 'react';
import { useSquash } from '../context/SquashContext';
import type { MatchFormat, MatchType, ServeSide } from '../types/squash';
import { X, Play, AlertCircle } from 'lucide-react';
import { SquashBallIcon } from './DashboardView';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
}

export const NewMatchModal: React.FC<NewMatchModalProps> = ({ isOpen, onClose, onStart }) => {
  const { players, startMatch } = useSquash();

  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');
  const [format, setFormat] = useState<MatchFormat>('BEST_OF_5');
  const [matchType, setMatchType] = useState<MatchType>('FRIENDLY');
  const [initialServerId, setInitialServerId] = useState<string>('');
  const [serveSide, setServeSide] = useState<ServeSide>('R');

  // Synchronize state when modal opens or players change
  useEffect(() => {
    if (isOpen && players.length > 0) {
      const firstP1 = players[0].id;
      const firstP2 = players.find((p) => p.id !== firstP1)?.id || players[0].id;

      if (!p1Id || !players.some((p) => p.id === p1Id)) {
        setP1Id(firstP1);
      }
      if (!p2Id || p2Id === firstP1 || !players.some((p) => p.id === p2Id)) {
        setP2Id(firstP2);
      }
    }
  }, [isOpen, players]);

  if (!isOpen) return null;

  const currentP1Id = p1Id || players[0]?.id || '';
  const currentP2Id = p2Id || players.find((p) => p.id !== currentP1Id)?.id || '';

  const isSamePlayer = currentP1Id === currentP2Id;
  const availableForP2 = players.filter((p) => p.id !== currentP1Id);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentP1Id || !currentP2Id || isSamePlayer) {
      alert('Please select two different players!');
      return;
    }

    const server = initialServerId && (initialServerId === currentP1Id || initialServerId === currentP2Id)
      ? initialServerId
      : currentP1Id;

    startMatch(currentP1Id, currentP2Id, format, matchType, server, serveSide);
    onStart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <SquashBallIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">New Squash Match</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Player 1 Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Player 1 (Home)</label>
            <select
              value={currentP1Id}
              onChange={(e) => {
                const newP1 = e.target.value;
                setP1Id(newP1);
                const alt = players.find((p) => p.id !== newP1);
                if (alt) setP2Id(alt.id);
              }}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              {players.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.countryFlag} {p.name} ({p.skillGrade})
                </option>
              ))}
            </select>
          </div>

          {/* Player 2 Selection (Excludes Player 1) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Player 2 (Opponent)</label>
            <select
              value={currentP2Id}
              onChange={(e) => setP2Id(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              {availableForP2.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.countryFlag} {p.name} ({p.skillGrade})
                </option>
              ))}
            </select>
          </div>

          {/* Alert if same player selected */}
          {isSamePlayer && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-2 text-rose-800 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>A player cannot play against themselves! Select 2 different players.</span>
            </div>
          )}

          {/* Format Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Match Format</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'BEST_OF_5', label: 'Best of 5', desc: 'First to 3 wins' },
                { id: 'BEST_OF_3', label: 'Best of 3', desc: 'First to 2 wins' },
                { id: 'SINGLE_SET', label: 'Single Set', desc: 'To 11 points' },
              ].map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFormat(f.id as MatchFormat)}
                  className={`p-2.5 rounded-xl border text-center transition-all ${
                    format === f.id
                      ? 'border-blue-900 bg-blue-50/80 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-xs">{f.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Match Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Match Type</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'FRIENDLY', label: 'Friendly' },
                { id: 'TOURNAMENT', label: 'Tournament' },
                { id: 'LEAGUE', label: 'League' },
                { id: 'PRACTICE', label: 'Practice' },
              ].map((t) => (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => setMatchType(t.id as MatchType)}
                  className={`p-2 rounded-xl border text-xs text-center transition-all ${
                    matchType === t.id
                      ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Initial Server Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">First Server</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setInitialServerId(currentP1Id)}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  (initialServerId || currentP1Id) === currentP1Id
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {players.find((p) => p.id === currentP1Id)?.name || 'Player 1'}
              </button>
              <button
                type="button"
                onClick={() => setInitialServerId(currentP2Id)}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  initialServerId === currentP2Id
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                {players.find((p) => p.id === currentP2Id)?.name || 'Player 2'}
              </button>
            </div>
          </div>

          {/* Initial Serve Side Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-600 block">Initial Serve Box</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setServeSide('L')}
                className={`flex-1 p-2 rounded-xl border text-xs font-bold transition-all ${
                  serveSide === 'L'
                    ? 'border-blue-900 bg-blue-900 text-amber-400'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Left Box (L)
              </button>
              <button
                type="button"
                onClick={() => setServeSide('R')}
                className={`flex-1 p-2 rounded-xl border text-xs font-bold transition-all ${
                  serveSide === 'R'
                    ? 'border-blue-900 bg-blue-900 text-amber-400'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Right Box (R)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSamePlayer}
            className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-slate-900 hover:from-slate-800 hover:to-blue-950 disabled:opacity-50 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98"
          >
            <Play className="w-4 h-4 fill-current ml-0.5 text-amber-400" />
            <span>Start Refereeing</span>
          </button>
        </form>
      </div>
    </div>
  );
};
