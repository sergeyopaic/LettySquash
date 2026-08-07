import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import type { MatchFormat, Player, ServeSide } from '../types/squash';
import { X, Play, Search, Plus, Settings as SettingsIcon } from 'lucide-react';
import { SquashBallIcon } from './DashboardView';

interface NewMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  mode?: 'quick' | 'custom';
  openSettingsModal?: () => void;
}

const FORMAT_OPTIONS: { id: MatchFormat; label: string; desc: string }[] = [
  { id: 'BEST_OF_3', label: 'Best of 3', desc: 'First to 2 games' },
  { id: 'BEST_OF_5', label: 'Best of 5', desc: 'First to 3 games' },
  { id: 'SINGLE_GAME', label: 'Single Game', desc: 'One game decides it' },
];

const FORMAT_SHORT_LABEL: Record<MatchFormat, string> = {
  BEST_OF_3: 'Best of 3',
  BEST_OF_5: 'Best of 5',
  SINGLE_GAME: 'Single Game',
};

// A single "search or pick a player" slot, used twice (Player 1 / Player 2). Renders as
// a text input + dropdown while nothing is picked yet, and collapses to a chip once a
// player is selected — no focus/blur bookkeeping needed since only one of those two
// states is ever rendered at a time.
const PlayerSlot: React.FC<{
  label: string;
  autoFocus?: boolean;
  players: Player[];
  excludeId?: string;
  selectedId: string;
  onSelect: (player: Player) => void;
  onClear: () => void;
  onCreate: (name: string) => Player;
}> = ({ label, autoFocus, players, excludeId, selectedId, onSelect, onClear, onCreate }) => {
  const [query, setQuery] = useState('');
  const selected = players.find((p) => p.id === selectedId);

  const pool = players.filter((p) => p.id !== excludeId);
  const trimmed = query.trim();
  const filtered = trimmed
    ? pool.filter((p) => p.name.toLowerCase().includes(trimmed.toLowerCase())).slice(0, 6)
    : [...pool].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const hasExactMatch = pool.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());

  const handleCreate = () => {
    if (!trimmed) return;
    const created = onCreate(trimmed);
    setQuery('');
    onSelect(created);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();
    const exact = pool.find((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exact) {
      setQuery('');
      onSelect(exact);
    } else if (trimmed) {
      handleCreate();
    }
  };

  if (selected) {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-600 block">{label}</label>
        <div className="w-full p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center space-x-2 min-w-0">
            <div
              className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0"
              style={{ backgroundColor: selected.avatarBgColor }}
            >
              {selected.name.charAt(0)}
            </div>
            <span className="text-xs font-bold text-slate-900 truncate">{selected.name}</span>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/70 flex-shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-600 block">{label}</label>
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search or type a new name..."
          className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>

      {(filtered.length > 0 || trimmed) && (
        <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
          {!trimmed && filtered.length > 0 && (
            <div className="px-3 py-1 text-[9px] font-black uppercase tracking-wider text-slate-400 bg-slate-50">
              Recent
            </div>
          )}
          {filtered.map((p) => (
            <button
              type="button"
              key={p.id}
              onClick={() => {
                setQuery('');
                onSelect(p);
              }}
              className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-slate-50 text-left transition-colors"
            >
              <div
                className="w-6 h-6 rounded-full text-white font-bold flex items-center justify-center text-[9px] flex-shrink-0"
                style={{ backgroundColor: p.avatarBgColor }}
              >
                {p.name.charAt(0)}
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate">{p.name}</span>
            </button>
          ))}
          {trimmed && !hasExactMatch && (
            <button
              type="button"
              onClick={handleCreate}
              className="w-full px-3 py-2 flex items-center space-x-2 hover:bg-amber-50 text-left transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center flex-shrink-0">
                <Plus className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-amber-800">Create "{trimmed}"</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const NewMatchModal: React.FC<NewMatchModalProps> = ({
  isOpen,
  onClose,
  onStart,
  mode = 'quick',
  openSettingsModal,
}) => {
  const { players, addPlayer, startMatch, settings } = useSquash();

  const [p1Id, setP1Id] = useState<string>('');
  const [p2Id, setP2Id] = useState<string>('');
  const [initialServerId, setInitialServerId] = useState<string>('');
  const [serveSide, setServeSide] = useState<ServeSide>('R');

  // Custom Match's one-off rule pickers — pre-filled from the Quick Match defaults
  // (so the user isn't starting from nothing) but never written back to settings.
  const [customFormat, setCustomFormat] = useState<MatchFormat>(settings.quickMatchFormat);
  const [customTargetPoints, setCustomTargetPoints] = useState<number>(settings.quickMatchTargetPoints);
  const [customTwoPointGap, setCustomTwoPointGap] = useState<boolean>(settings.quickMatchTwoPointGap);

  if (!isOpen) return null;

  const format = mode === 'quick' ? settings.quickMatchFormat : customFormat;
  const targetPoints = mode === 'quick' ? settings.quickMatchTargetPoints : customTargetPoints;
  const twoPointGap = mode === 'quick' ? settings.quickMatchTwoPointGap : customTwoPointGap;

  const p1 = players.find((p) => p.id === p1Id);
  const p2 = players.find((p) => p.id === p2Id);
  const bothSelected = Boolean(p1 && p2);

  const resetAndClose = () => {
    setP1Id('');
    setP2Id('');
    setInitialServerId('');
    setServeSide('R');
    onClose();
  };

  const handleStart = () => {
    if (!p1 || !p2) return;
    const server = initialServerId === p1.id || initialServerId === p2.id ? initialServerId : p1.id;
    startMatch(p1.id, p2.id, format, 'FRIENDLY', server, serveSide, false, undefined, targetPoints, undefined, twoPointGap);
    onStart();
    resetAndClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-5 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center">
              <SquashBallIcon className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-slate-900">
              {mode === 'quick' ? 'Quick Match' : 'Custom Match'}
            </h2>
          </div>
          <button
            onClick={resetAndClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <PlayerSlot
            label="Player 1"
            autoFocus
            players={players}
            excludeId={p2Id}
            selectedId={p1Id}
            onSelect={(p) => setP1Id(p.id)}
            onClear={() => setP1Id('')}
            onCreate={(name) => addPlayer(name)}
          />

          <PlayerSlot
            label="Player 2"
            players={players}
            excludeId={p1Id}
            selectedId={p2Id}
            onSelect={(p) => setP2Id(p.id)}
            onClear={() => setP2Id('')}
            onCreate={(name) => addPlayer(name)}
          />

          {mode === 'quick' ? (
            <button
              type="button"
              onClick={() => openSettingsModal?.()}
              className="w-full flex items-center justify-center space-x-1.5 text-[10px] font-semibold text-slate-400 hover:text-slate-700 transition-colors"
            >
              <SettingsIcon className="w-3 h-3" />
              <span>
                {FORMAT_SHORT_LABEL[format]} • PARS-{targetPoints}
                {twoPointGap ? ' • 2-point gap' : ''}
              </span>
            </button>
          ) : (
            <div className="space-y-4 pt-1 border-t border-slate-100">
              <div className="space-y-1.5 pt-3">
                <label className="text-xs font-bold text-slate-600 block">Match Format</label>
                <div className="grid grid-cols-3 gap-2">
                  {FORMAT_OPTIONS.map((f) => (
                    <button
                      type="button"
                      key={f.id}
                      onClick={() => setCustomFormat(f.id)}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        customFormat === f.id
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

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Points per Game</label>
                <div className="grid grid-cols-2 gap-2">
                  {[11, 15].map((pts) => (
                    <button
                      type="button"
                      key={pts}
                      onClick={() => setCustomTargetPoints(pts)}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        customTargetPoints === pts
                          ? 'border-amber-500 bg-amber-50 text-amber-950'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      PARS-{pts}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setCustomTwoPointGap(!customTwoPointGap)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                  customTwoPointGap ? 'border-blue-900 bg-blue-50/80' : 'border-slate-200 bg-slate-50/70'
                }`}
              >
                <span className="text-xs font-bold text-slate-900">Two-point gap at deuce</span>
                <div
                  className={`w-9 h-5 rounded-full flex-shrink-0 flex items-center px-0.5 transition-colors ${
                    customTwoPointGap ? 'bg-blue-900 justify-end' : 'bg-slate-300 justify-start'
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
                </div>
              </button>
            </div>
          )}

          {bothSelected && (
            <div className="space-y-4 pt-1 border-t border-slate-100">
              <div className="space-y-1.5 pt-3">
                <label className="text-xs font-bold text-slate-600 block">First Server</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setInitialServerId(p1!.id)}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all truncate ${
                      (initialServerId || p1!.id) === p1!.id
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {p1!.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => setInitialServerId(p2!.id)}
                    className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all truncate ${
                      initialServerId === p2!.id
                        ? 'border-amber-500 bg-amber-50 text-amber-950'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    {p2!.name}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-600 block">Initial Serve Box</label>
                <div className="flex space-x-2">
                  <button
                    type="button"
                    onClick={() => setServeSide('L')}
                    className={`flex-1 p-2 rounded-xl border text-xs font-bold transition-all ${
                      serveSide === 'L' ? 'border-blue-900 bg-blue-900 text-amber-400' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Left Box (L)
                  </button>
                  <button
                    type="button"
                    onClick={() => setServeSide('R')}
                    className={`flex-1 p-2 rounded-xl border text-xs font-bold transition-all ${
                      serveSide === 'R' ? 'border-blue-900 bg-blue-900 text-amber-400' : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Right Box (R)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleStart}
                className="w-full py-3.5 bg-gradient-to-r from-blue-900 to-slate-900 hover:from-slate-800 hover:to-blue-950 text-white font-black text-sm rounded-2xl shadow-lg flex items-center justify-center space-x-2 transition-transform active:scale-98"
              >
                <Play className="w-4 h-4 fill-current ml-0.5 text-amber-400" />
                <span>Start Refereeing</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
