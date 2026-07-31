import React, { useState } from 'react';
import { X, BookOpen, Award, ShieldAlert, Trophy, Play, CheckCircle2 } from 'lucide-react';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  openNewMatch?: () => void;
}

type GuideTab = 'BASICS' | 'SCORING' | 'DECISIONS' | 'FORMATS';

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, openNewMatch }) => {
  const [activeGuideTab, setActiveGuideTab] = useState<GuideTab>('BASICS');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-xs flex-shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                Squash Guide & Rules
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Official WSF Rules & Letty App Guide
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-2"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px] font-bold text-slate-600">
          <button
            onClick={() => setActiveGuideTab('BASICS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeGuideTab === 'BASICS'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3 h-3 text-amber-500" />
            <span>Basics</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('SCORING')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeGuideTab === 'SCORING'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Award className="w-3 h-3 text-amber-500" />
            <span>Scoring</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('DECISIONS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeGuideTab === 'DECISIONS'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3 h-3 text-amber-500" />
            <span>Ref Decisions</span>
          </button>

          <button
            onClick={() => setActiveGuideTab('FORMATS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeGuideTab === 'FORMATS'
                ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                : 'hover:text-slate-900'
            }`}
          >
            <Trophy className="w-3 h-3 text-amber-500" />
            <span>Formats</span>
          </button>
        </div>

        {/* Tab Content Panels */}
        <div className="space-y-3 min-h-[220px]">
          {activeGuideTab === 'BASICS' && (
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 space-y-1">
                <h4 className="font-extrabold text-slate-900 flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-amber-600" />
                  <span>How Letty Works</span>
                </h4>
                <p>
                  Letty is your court referee assistant! Select two players, choose your set format (Best of 3 or 5), and let Letty track serve box alternation, scores, rest intervals, and referee decisions.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-extrabold text-slate-900">Serve Box Rule (WSF 7.3)</h4>
                <p>
                  The server must keep at least one foot entirely inside the service box without touching its boundary lines. The ball must hit the front wall above the service line and land in the opposite back quarter court.
                </p>
              </div>
            </div>
          )}

          {activeGuideTab === 'SCORING' && (
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200/80 space-y-1">
                <h4 className="font-extrabold text-slate-900">PARS 11 Scoring System</h4>
                <p>
                  Matches use Point-a-Rally Scoring (PARS) up to 11 points. Every rally wins a point regardless of who served.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-extrabold text-slate-900">2-Point Advantage Rule</h4>
                <p>
                  If a set reaches 10-10, play continues until one player gains a 2-point lead (e.g. 12-10, 15-13).
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-extrabold text-slate-900">90s Between-Sets Rest Break</h4>
                <p>
                  A standard 90-second rest interval is granted between consecutive sets for recovery and coaching advice.
                </p>
              </div>
            </div>
          )}

          {activeGuideTab === 'DECISIONS' && (
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="bg-blue-50 p-3 rounded-2xl border border-blue-200/80 space-y-1">
                <h4 className="font-extrabold text-slate-900 text-blue-950">YES LET (Point Replay)</h4>
                <p>
                  Awarded when a player stops play out of reasonable safety fears of hitting an opponent, or when non-deliberate interference occurs.
                </p>
              </div>

              <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200/80 space-y-1">
                <h4 className="font-extrabold text-slate-900 text-emerald-950">STROKE (Point Awarded)</h4>
                <p>
                  Awarded to the striker if the opponent prevents a fair swing or blocks the direct line of shot to the front wall.
                </p>
              </div>

              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-200/80 space-y-1">
                <h4 className="font-extrabold text-slate-900 text-rose-950">NO LET (No Replay)</h4>
                <p>
                  Given if the player could not have made a good return or created their own interference.
                </p>
              </div>
            </div>
          )}

          {activeGuideTab === 'FORMATS' && (
            <div className="space-y-2 text-xs text-slate-700 leading-relaxed">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-extrabold text-slate-900">League (Round-Robin)</h4>
                <p>
                  All players play against every other participant. Standings are ranked by total points and set differentials.
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 space-y-1">
                <h4 className="font-extrabold text-slate-900">Knockout (Single & Double Elimination)</h4>
                <p>
                  Bracket tournament where winners advance. Double Elimination offers a second chance bracket for defeated players.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Bottom CTA Action Button */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              if (openNewMatch) openNewMatch();
            }}
            className="w-full min-h-[48px] py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Ready? Start Match Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};
