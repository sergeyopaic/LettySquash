import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import type { MatchFormat, Player, ServeSide } from '../types/squash';
import { Search, Plus, X, ChevronDown, Play, Settings as SettingsIcon } from 'lucide-react';
import { SquashBallIcon } from './DashboardView';

interface QuickMatchCardProps {
  onStart: () => void;
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

// Jersey colors a referee can pick from for a one-off match override. Kept to a compact
// grid (fits without scrolling in a small popover) but wide enough to tell any two
// players apart on court.
const COLOR_PALETTE = [
  '#0F172A', '#334155', '#2563EB', '#0EA5E9',
  '#06B6D4', '#10B981', '#16A34A', '#65A30D',
  '#F59E0B', '#D97706', '#EF4444', '#DC2626',
  '#EC4899', '#9333EA', '#6366F1', '#DB2777',
];

// lucide-react has no squash-racket glyph — a small hand-drawn one, same approach as
// SquashBallIcon: oval head, a couple of crossing strings for texture, angled handle.
// At icon sizes (~14px) a thin-outline oval-plus-handle is indistinguishable from a
// magnifying glass — there's no room left for string texture to read as "racket". Using a
// thick stroke + a solid filled grip (instead of a thin handle line) gives it a distinct
// "paddle" silhouette instead; the "1st" text label on the active chip (see MatchPlayerSlot)
// removes any remaining ambiguity for the case that actually matters.
const RacketIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg className={className} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <ellipse cx="9.5" cy="8.5" rx="6" ry="7" fill="none" stroke="currentColor" strokeWidth="3" />
    <rect x="14.5" y="14" width="3" height="10" rx="1.5" fill="currentColor" transform="rotate(38 16 14)" />
  </svg>
);

const ColorSwatchButton: React.FC<{ color: string; onChange: (c: string) => void }> = ({ color, onChange }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative flex-shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Jersey color for this match"
        className="w-5 h-5 rounded-full ring-2 ring-white shadow-xs"
        style={{ backgroundColor: color }}
      />
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 top-7 right-0 bg-white rounded-xl shadow-lg border border-slate-200 p-2 grid grid-cols-4 gap-1.5 w-[136px]">
            {COLOR_PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  onChange(c);
                  setOpen(false);
                }}
                className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                style={{
                  backgroundColor: c,
                  boxShadow: c === color ? '0 0 0 2px white, 0 0 0 3.5px #0F172A' : 'none',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const MatchPlayerSlot: React.FC<{
  label: string;
  players: Player[];
  excludeId?: string;
  selectedId: string;
  onSelect: (player: Player) => void;
  onClear: () => void;
  onCreate: (name: string) => Player;
  isServer: boolean;
  onMakeServer: () => void;
  color: string;
  onChangeColor: (c: string) => void;
}> = ({
  label,
  players,
  excludeId,
  selectedId,
  onSelect,
  onClear,
  onCreate,
  isServer,
  onMakeServer,
  color,
  onChangeColor,
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
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
      <div className="w-full p-2 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between">
        <div className="flex items-center space-x-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-[10px] flex-shrink-0"
            style={{ backgroundColor: color }}
          >
            {selected.name.charAt(0)}
          </div>
          <span className="text-xs font-bold text-slate-900 truncate">{selected.name}</span>
        </div>
        <div className="flex items-center space-x-1.5 flex-shrink-0 pl-2">
          <button
            type="button"
            onClick={onMakeServer}
            title={isServer ? 'Serves first' : 'Make this player serve first'}
            className={`h-6 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
              isServer
                ? 'bg-amber-400 text-slate-950 px-2 space-x-1'
                : 'w-6 bg-white text-slate-400 hover:text-slate-600 border border-slate-200'
            }`}
          >
            <RacketIcon className="w-3.5 h-3.5" />
            {isServer && <span className="text-[9px] font-black uppercase tracking-wide">1st</span>}
          </button>
          <ColorSwatchButton color={color} onChange={onChangeColor} />
          <button
            type="button"
            onClick={onClear}
            className="p-0.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-white/70"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          // Delayed so a click on a dropdown option (Recent item / Create) still
          // registers before the dropdown unmounts out from under it.
          onBlur={() => setTimeout(() => setIsFocused(false), 150)}
          placeholder={label}
          className="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
        />
      </div>

      {(isFocused || trimmed) && (filtered.length > 0 || trimmed) && (
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

export const QuickMatchCard: React.FC<QuickMatchCardProps> = ({ onStart, openSettingsModal }) => {
  const { players, addPlayer, startMatch, settings } = useSquash();

  const [p1Id, setP1Id] = useState('');
  const [p2Id, setP2Id] = useState('');
  const [p1ColorOverride, setP1ColorOverride] = useState<string | undefined>(undefined);
  const [p2ColorOverride, setP2ColorOverride] = useState<string | undefined>(undefined);
  const [initialServerId, setInitialServerId] = useState('');
  const [serveSide, setServeSide] = useState<ServeSide>('R');

  const [isFormatExpanded, setIsFormatExpanded] = useState(false);
  const [format, setFormat] = useState<MatchFormat>(settings.quickMatchFormat);
  const [targetPoints, setTargetPoints] = useState<number>(settings.quickMatchTargetPoints);
  const [twoPointGap, setTwoPointGap] = useState<boolean>(settings.quickMatchTwoPointGap);

  const p1 = players.find((p) => p.id === p1Id);
  const p2 = players.find((p) => p.id === p2Id);
  const bothSelected = Boolean(p1 && p2);
  const p1Color = p1ColorOverride ?? p1?.avatarBgColor ?? '#3B82F6';
  const p2Color = p2ColorOverride ?? p2?.avatarBgColor ?? '#3B82F6';
  // Once both players are known, someone has to serve first — default that to Player 1
  // rather than leaving the racket in limbo until explicitly tapped.
  const serverId = initialServerId || p1Id;

  const resetForm = () => {
    setP1Id('');
    setP2Id('');
    setP1ColorOverride(undefined);
    setP2ColorOverride(undefined);
    setInitialServerId('');
    setServeSide('R');
  };

  const handleStart = () => {
    if (!p1 || !p2) return;
    const server = serverId === p1.id || serverId === p2.id ? serverId : p1.id;
    startMatch(
      p1.id,
      p2.id,
      format,
      'FRIENDLY',
      server,
      serveSide,
      false,
      undefined,
      targetPoints,
      undefined,
      twoPointGap,
      p1ColorOverride,
      p2ColorOverride
    );
    resetForm();
    onStart();
  };

  return (
    <div className="ios-card rounded-2xl p-4 space-y-3">
      <div className="flex items-center space-x-2">
        <SquashBallIcon className="w-5 h-5" />
        <h3 className="text-sm font-black text-slate-900 tracking-tight">Quick Match</h3>
      </div>

      <MatchPlayerSlot
        label="Player 1"
        players={players}
        excludeId={p2Id}
        selectedId={p1Id}
        onSelect={(p) => {
          setP1Id(p.id);
          setP1ColorOverride(undefined);
        }}
        onClear={() => {
          setP1Id('');
          setP1ColorOverride(undefined);
          if (initialServerId === p1Id) setInitialServerId('');
        }}
        onCreate={(name) => addPlayer(name)}
        isServer={Boolean(p1Id) && serverId === p1Id}
        onMakeServer={() => setInitialServerId(p1Id)}
        color={p1Color}
        onChangeColor={setP1ColorOverride}
      />

      <MatchPlayerSlot
        label="Player 2"
        players={players}
        excludeId={p1Id}
        selectedId={p2Id}
        onSelect={(p) => {
          setP2Id(p.id);
          setP2ColorOverride(undefined);
        }}
        onClear={() => {
          setP2Id('');
          setP2ColorOverride(undefined);
          if (initialServerId === p2Id) setInitialServerId('');
        }}
        onCreate={(name) => addPlayer(name)}
        isServer={Boolean(p2Id) && serverId === p2Id}
        onMakeServer={() => setInitialServerId(p2Id)}
        color={p2Color}
        onChangeColor={setP2ColorOverride}
      />

      <div>
        <button
          type="button"
          onClick={() => setIsFormatExpanded((e) => !e)}
          className="w-full flex items-center justify-between text-[11px] font-semibold text-slate-500 hover:text-slate-800 transition-colors py-0.5"
        >
          <span className="flex items-center space-x-1.5">
            <SettingsIcon className="w-3 h-3" />
            <span>
              {FORMAT_SHORT_LABEL[format]} • PARS-{targetPoints}
              {twoPointGap ? ' • 2-point gap' : ''}
            </span>
          </span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isFormatExpanded ? 'rotate-180' : ''}`} />
        </button>

        {isFormatExpanded && (
          <div className="space-y-3 pt-3">
            <div className="grid grid-cols-3 gap-2">
              {FORMAT_OPTIONS.map((f) => (
                <button
                  type="button"
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`p-2 rounded-xl border text-center transition-all ${
                    format === f.id
                      ? 'border-blue-900 bg-blue-50/80 text-blue-900 font-bold shadow-sm'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <p className="text-[11px]">{f.label}</p>
                  <p className="text-[9px] text-slate-400 mt-0.5">{f.desc}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {[11, 15].map((pts) => (
                <button
                  type="button"
                  key={pts}
                  onClick={() => setTargetPoints(pts)}
                  className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                    targetPoints === pts
                      ? 'border-amber-500 bg-amber-50 text-amber-950'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  PARS-{pts}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setTwoPointGap(!twoPointGap)}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                twoPointGap ? 'border-blue-900 bg-blue-50/80' : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <span className="text-xs font-bold text-slate-900">Two-point gap at deuce</span>
              <div
                className={`w-9 h-5 rounded-full flex-shrink-0 flex items-center px-0.5 transition-colors ${
                  twoPointGap ? 'bg-blue-900 justify-end' : 'bg-slate-300 justify-start'
                }`}
              >
                <div className="w-4 h-4 rounded-full bg-white shadow-2xs" />
              </div>
            </button>

            {openSettingsModal && (
              <button
                type="button"
                onClick={openSettingsModal}
                className="text-[10px] font-semibold text-blue-700 hover:underline"
              >
                Manage my default format in Settings →
              </button>
            )}
          </div>
        )}
      </div>

      {bothSelected && (
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-600">Initial Serve Box</span>
            <div className="flex space-x-1.5">
              <button
                type="button"
                onClick={() => setServeSide('L')}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                  serveSide === 'L' ? 'border-blue-900 bg-blue-900 text-amber-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                Left
              </button>
              <button
                type="button"
                onClick={() => setServeSide('R')}
                className={`px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-all ${
                  serveSide === 'R' ? 'border-blue-900 bg-blue-900 text-amber-400' : 'border-slate-200 text-slate-600'
                }`}
              >
                Right
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
  );
};
