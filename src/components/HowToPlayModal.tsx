import React, { useState, useEffect } from 'react';
import { X, Award, ShieldAlert, Play, CheckCircle2, AlertTriangle, HelpCircle, RefreshCw, Target, Flame } from 'lucide-react';
import { SquashBallIcon } from './DashboardView';
import { FrontWallDiagram, CourtPlanDiagram, BoastDiagram } from './SquashCourtDiagrams';

interface HowToPlayModalProps {
  isOpen: boolean;
  onClose: () => void;
  openNewMatch?: () => void;
}

type GuideTab = 'BASICS' | 'MATCH_RULES' | 'SERVICE' | 'APPEALS';

export const HowToPlayModal: React.FC<HowToPlayModalProps> = ({ isOpen, onClose, openNewMatch }) => {
  const [activeTab, setActiveTab] = useState<GuideTab>('BASICS');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

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
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-xs flex-shrink-0">
              <SquashBallIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 leading-tight">
                World Squash Rules
              </h2>
              <p className="text-xs text-slate-500 font-semibold">
                Official WSF Rules & Interactive Court Diagrams
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-2 cursor-pointer"
            aria-label="Close rules guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-4 gap-1 bg-slate-100 p-1 rounded-2xl text-[10px] font-bold text-slate-600">
          <button
            onClick={() => setActiveTab('BASICS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'BASICS'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Basics & Shots</span>
          </button>

          <button
            onClick={() => setActiveTab('MATCH_RULES')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'MATCH_RULES'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Scoring & Match</span>
          </button>

          <button
            onClick={() => setActiveTab('SERVICE')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'SERVICE'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>Service Box</span>
          </button>

          <button
            onClick={() => setActiveTab('APPEALS')}
            className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
              activeTab === 'APPEALS'
                ? 'bg-white text-slate-900 shadow-xs font-black'
                : 'hover:text-slate-900'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>WSF Appeals</span>
          </button>
        </div>

        {/* TAB 0: BASICS (How Points Are Won, How to Hit, Where to Hit) */}
        {activeTab === 'BASICS' && (
          <div className="space-y-3 animate-in fade-in duration-150 text-xs text-slate-700">
            {/* 1. How Points Are Won */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 via-white to-amber-50/40 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Target className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  <span>1. How Points Are Won (Rally)</span>
                </h3>
                <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  BASICS
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Players alternate hitting the ball. Every rally won awards <strong className="text-slate-900">1 point (PARS 11)</strong> regardless of who served.
              </p>
              <div className="bg-white p-2.5 rounded-xl border border-amber-200/60 space-y-1 text-[11px]">
                <p className="font-extrabold text-slate-800">You win a point if your opponent:</p>
                <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                  <li>Allows <strong className="text-slate-800">2 floor bounces</strong> before striking.</li>
                  <li>Hits the ball out of court (Out) or into the bottom Tin panel.</li>
                  <li>Commits a service fault or causes severe interference (Stroke).</li>
                </ul>
              </div>
            </div>

            {/* 2. How to Hit the Ball */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <Flame className="w-4 h-4 text-amber-500 flex-shrink-0" />
                  <span>2. How to Hit the Ball</span>
                </h3>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  STRIKING
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                The ball must be struck cleanly with the racket in a single continuous stroke.
              </p>
              <ul className="list-disc list-inside text-slate-600 space-y-1 text-[11px]">
                <li><strong className="text-slate-800">Bounces:</strong> Strike <strong className="text-slate-900">on the volley</strong> before the floor OR after <strong className="text-slate-900">exactly 1 floor bounce</strong>.</li>
                <li><strong className="text-slate-800">Clean Contact:</strong> Double hits or carrying the ball on racket strings are faults.</li>
                <li><strong className="text-slate-800">Wall Rebounds:</strong> You may hit the front wall directly or via side/back wall rebounds (Boast).</li>
              </ul>

              {/* Boast Shot Trajectory Diagram */}
              <div className="pt-2">
                <BoastDiagram animated={true} />
              </div>
            </div>

            {/* 3. Where to Hit */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm flex items-center space-x-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>3. Where to Hit (Court Targets)</span>
                </h3>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  BOUNDARIES
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Every return must reach the <strong className="text-slate-900">front wall</strong> before touching the floor.
              </p>
              <div className="space-y-1.5 text-[11px]">
                <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100 space-y-0.5">
                  <span className="font-bold text-emerald-900 block">IN PLAY (Good Return):</span>
                  <p className="text-emerald-800">The ball hits the front wall <strong className="text-emerald-950">ABOVE the Tin (17″ / 43cm)</strong> and <strong className="text-emerald-950">BELOW the top Out line</strong>.</p>
                </div>
                <div className="p-2 bg-rose-50 rounded-xl border border-rose-100 space-y-0.5">
                  <span className="font-bold text-rose-900 block">OUT OF BOUNDS (Loss of Point):</span>
                  <p className="text-rose-800">Hitting the bottom Tin board, touching any out line, or landing above out lines on any wall.</p>
                </div>
              </div>

              {/* Front Wall Specifications Diagram */}
              <div className="pt-2">
                <FrontWallDiagram highlight="good-area" caption="Front Wall Dimensions: Hit above Tin (0.48m) and below Out Line (4.57m)" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MATCH RULES */}
        {activeTab === 'MATCH_RULES' && (
          <div className="space-y-3 animate-in fade-in duration-150 text-xs text-slate-700">
            {/* PARS 11 Scoring */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center space-x-1.5">
                  <span>PARS 11 Scoring System</span>
                </h3>
                <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  WSF Rule 2
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Matches use <strong className="text-slate-900">Point-a-Rally Scoring (PARS)</strong> up to 11 points per game. Every rally wins a point regardless of who served.
              </p>
            </div>

            {/* Tie-Break Rule */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">2-Point Advantage (Deuce)</h3>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  10-10 Tie-Break
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                If the score reaches <strong className="text-slate-900">10-10</strong>, play continues until one player leads by 2 clear points (e.g. 12-10, 15-13).
              </p>
            </div>

            {/* Match Format & Rest Break */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-sm">Best of 5 / 3 Games & Rest Intervals</h3>
                <span className="text-[9px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md">
                  90s Rest
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                Official matches are played as <strong className="text-slate-900">Best of 5 Games</strong> (first to 3 games) or Best of 3 Games. A standard <strong className="text-slate-900">90-second rest break</strong> is granted between games.
              </p>
            </div>
          </div>
        )}

        {/* TAB 2: SERVICE BOX */}
        {activeTab === 'SERVICE' && (
          <div className="space-y-3 animate-in fade-in duration-150 text-xs text-slate-700">
            {/* Foot Placement & Serve */}
            <div className="p-3.5 bg-gradient-to-r from-amber-50 to-white rounded-2xl border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm">Service Box Requirements</h3>
                <span className="text-[9px] font-black uppercase text-amber-900 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  WSF Rule 7.3
                </span>
              </div>
              <p className="leading-relaxed text-slate-600">
                At the moment of striking the ball, the server must keep <strong className="text-slate-900">at least one foot entirely inside the service box</strong> without touching any boundary line.
              </p>
            </div>

            {/* Court Plan Top View Diagram */}
            <div className="pt-1">
              <CourtPlanDiagram highlight="target-quarter" />
            </div>

            {/* Serve Target Box */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Correct Serve Path</h3>
              <p className="leading-relaxed text-slate-600">
                The served ball must hit the front wall <strong className="text-slate-900">above the cut line (service line)</strong> and below the out line, landing in the opposite back-quarter court unless volleyed.
              </p>
            </div>

            {/* Alternating & Hand-Out */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1.5">
              <h3 className="font-bold text-slate-900 text-sm">Box Alternation & Hand-Out</h3>
              <p className="leading-relaxed text-slate-600">
                When serving consecutively, the server <strong className="text-slate-900">alternates boxes (Left ↔ Right)</strong>. When a receiver wins a rally (<strong className="text-rose-600">hand-out</strong>), they gain serve and choose their starting box.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: WSF APPEALS */}
        {activeTab === 'APPEALS' && (
          <div className="space-y-3 animate-in fade-in duration-150 text-xs text-slate-700">
            {/* Intro */}
            <div className="p-3 bg-slate-900 text-white rounded-2xl space-y-1 shadow-xs">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider">WSF Rule 8 • Interference</span>
              <p className="text-xs text-slate-200 leading-tight">
                Players must make every effort to provide the opponent with fair view, direct access to the ball, and freedom to strike.
              </p>
            </div>

            {/* YES LET */}
            <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200/80 space-y-1">
              <div className="flex items-center space-x-2 text-amber-950">
                <HelpCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <h4 className="font-black text-sm">YES LET (Replay Point)</h4>
              </div>
              <p className="text-slate-700 leading-relaxed pl-6">
                Awarded when a player stops play out of reasonable safety fears of hitting an opponent, or when minor, non-deliberate interference occurred.
              </p>
            </div>

            {/* STROKE */}
            <div className="p-3.5 bg-emerald-50/80 rounded-2xl border border-emerald-200/80 space-y-1">
              <div className="flex items-center space-x-2 text-emerald-950">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <h4 className="font-black text-sm">STROKE (Point to Appealing Player)</h4>
              </div>
              <p className="text-slate-700 leading-relaxed pl-6">
                Awarded if the opponent failed to make every effort to clear, blocked a direct line of shot to the front wall, or prevented a full swing.
              </p>
            </div>

            {/* NO LET */}
            <div className="p-3.5 bg-rose-50/80 rounded-2xl border border-rose-200/80 space-y-1">
              <div className="flex items-center space-x-2 text-rose-950">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                <h4 className="font-black text-sm">NO LET (Appeal Denied)</h4>
              </div>
              <p className="text-slate-700 leading-relaxed pl-6">
                Given if the appealing player created their own interference, could not have reached the ball, or accepted the interference and played on.
              </p>
            </div>
          </div>
        )}

        {/* Footer Action */}
        <div className="pt-2 border-t border-slate-100">
          <button
            onClick={() => {
              onClose();
              if (openNewMatch) openNewMatch();
            }}
            className="w-full min-h-[48px] py-3.5 bg-slate-900 hover:bg-slate-800 text-amber-400 font-black text-xs rounded-2xl shadow-md flex items-center justify-center space-x-2 transition-transform active:scale-98 border border-slate-800 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Setup New Squash Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
