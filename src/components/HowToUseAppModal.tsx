import React, { useState } from 'react';
import { X, Smartphone, Play, RotateCcw, ShieldAlert, RefreshCw, MoreVertical } from 'lucide-react';

interface HowToUseAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  openNewMatch?: () => void;
}

export const HowToUseAppModal: React.FC<HowToUseAppModalProps> = ({ isOpen, onClose, openNewMatch }) => {
  const [activeTab, setActiveTab] = useState<'STARTING' | 'SCORING' | 'RESETS' | 'DECISIONS'>('STARTING');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-amber-400 flex items-center justify-center shadow-xs flex-shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                How to Use Letty App
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Referee Scorekeeper & Match Features Guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-2"
            aria-label="Close app guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mascot Intro Banner */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-slate-50 p-3 rounded-2xl border border-amber-200/80 flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xs flex-shrink-0 bg-slate-100">
            <img src="/assets/letty_think.png" alt="Letty Guide" className="w-full h-full object-cover" />
          </div>
          <div className="text-xs">
            <span className="font-extrabold text-amber-950 block">Letty's Referee Tip:</span>
            <p className="text-slate-600 font-medium leading-tight">
              Tap any score card to add a point. Use top-right <strong className="text-slate-900">•••</strong> for match settings.
            </p>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px] font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('STARTING')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-0.5 transition-all ${
              activeTab === 'STARTING'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Start Match</span>
          </button>

          <button
            onClick={() => setActiveTab('SCORING')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-0.5 transition-all ${
              activeTab === 'SCORING'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Scoring</span>
          </button>

          <button
            onClick={() => setActiveTab('RESETS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-0.5 transition-all ${
              activeTab === 'RESETS'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Resets & Undo</span>
          </button>

          <button
            onClick={() => setActiveTab('DECISIONS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-0.5 transition-all ${
              activeTab === 'DECISIONS'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <span>Appeals</span>
          </button>
        </div>

        {/* TAB 1: STARTING A MATCH */}
        {activeTab === 'STARTING' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                <h3 className="font-bold text-slate-900 text-sm">Search or Create a Player</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Type a name in the Quick Match box on Home. Tap a match to select them, or tap <strong className="text-amber-800">Create</strong> to add a brand-new player instantly.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                <h3 className="font-bold text-slate-900 text-sm">Set Who Serves First</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Tap the racket icon on either player's chip — it jumps between them to show who's serving first.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                <h3 className="font-bold text-slate-900 text-sm">Pick a Jersey Color (Optional)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Tap the color dot next to a selected player to give them a distinct color just for this match — their profile color stays the same next time.
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">4</span>
                <h3 className="font-bold text-slate-900 text-sm">Adjust the Format (Optional)</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Tap the small format line (e.g. "Best of 3 • PARS-11") to change games, points, or the two-point-gap rule — just for this match.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SCORING */}
        {activeTab === 'SCORING' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">1</span>
                <h3 className="font-bold text-slate-900 text-sm">Tap Player Card to Score</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                Simply tap anywhere on Player 1 or Player 2's card (or giant 77pt score number) to record +1 point under PARS rules (11 or 15, depending on your match settings).
              </p>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2">
                <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center">2</span>
                <h3 className="font-bold text-slate-900 text-sm">Automatic Hand-Out & Rally Log</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed pl-8">
                When a receiver wins a rally, the app automatically switches service (<strong className="text-rose-600">hand-out 🔄</strong>) and logs the outcome in the Rally Ticker.
              </p>
            </div>

            <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center space-x-2">
                <RefreshCw className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-amber-950 text-sm">Manual Tap-to-Switch Serve Box</h3>
              </div>
              <p className="text-xs text-amber-900 leading-relaxed">
                Need to correct the serve side? Tap the glowing <strong className="bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">RIGHT ⇄</strong> or <strong className="bg-amber-400 text-blue-950 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">LEFT ⇄</strong> badge directly on the server's card to switch serve boxes instantly without rolling back points!
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: RESETS & UNDO */}
        {activeTab === 'RESETS' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900">
                <RotateCcw className="w-4 h-4 text-slate-700" />
                <h3 className="font-bold text-sm">Undo Last Point</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tap <strong className="text-slate-900">Undo Point</strong> in the bottom toolbar to rollback misclicked points or decisions.
              </p>
            </div>

            <div className="p-3.5 bg-rose-50/70 rounded-2xl border border-rose-200/80 space-y-2">
              <div className="flex items-center space-x-2 text-rose-950">
                <MoreVertical className="w-4 h-4 text-rose-600" />
                <h3 className="font-bold text-sm">Top-Right Overflow Menu (•••)</h3>
              </div>
              <p className="text-xs text-rose-900 leading-relaxed">
                Destructive actions are isolated in the top-right <strong className="text-slate-900">•••</strong> menu. Choose between <strong className="text-amber-800">Reset Current Game (0-0)</strong>, <strong className="text-rose-700">Reset Whole Match</strong>, or <strong className="text-slate-700">Abandon & Exit</strong> with mandatory confirmation dialogs.
              </p>
            </div>
          </div>
        )}

        {/* TAB 4: APPEALS */}
        {activeTab === 'DECISIONS' && (
          <div className="space-y-3 animate-in fade-in duration-150">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center space-x-2 text-slate-900">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm">Official WSF Referee Decisions</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Tap <strong className="text-slate-900">Appeal LET / STROKE</strong> on any player card to log official WSF referee rulings:
              </p>

              <div className="space-y-1.5 pt-1 text-[11px]">
                <div className="p-2 bg-amber-100/70 rounded-xl font-bold text-amber-950 flex items-center justify-between">
                  <span>YES LET</span>
                  <span className="text-[10px] font-normal text-amber-800">Replay point</span>
                </div>

                <div className="p-2 bg-emerald-100/70 rounded-xl font-bold text-emerald-950 flex items-center justify-between">
                  <span>STROKE</span>
                  <span className="text-[10px] font-normal text-emerald-800">Point awarded</span>
                </div>

                <div className="p-2 bg-rose-100/70 rounded-xl font-bold text-rose-950 flex items-center justify-between">
                  <span>NO LET</span>
                  <span className="text-[10px] font-normal text-rose-800">Appeal denied</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 space-y-2">
          {openNewMatch && (
            <button
              onClick={() => {
                onClose();
                openNewMatch();
              }}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 border border-slate-800"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start Match Refereeing Now</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 text-xs font-bold text-slate-500 hover:text-slate-800 text-center"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
