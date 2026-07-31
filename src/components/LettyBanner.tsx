import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { LETTY_TIPS } from '../data/mockData';
import { RefreshCw, Play } from 'lucide-react';

interface LettyBannerProps {
  customMessage?: string;
  variant?: 'home' | 'match' | 'tips' | 'victory';
  onStartMatch?: () => void;
}

export const LettyBanner: React.FC<LettyBannerProps> = ({ customMessage, variant = 'home', onStartMatch }) => {
  const { settings } = useSquash();
  const [tipIndex, setTipIndex] = useState(0);

  if (!settings.showMascotTips && variant === 'tips') {
    return null;
  }

  const nextTip = () => {
    setTipIndex((prev) => (prev + 1) % LETTY_TIPS.length);
  };

  // Dedicated compact live match status bar (uses letty_play.png with NO title tag)
  if (variant === 'match') {
    return (
      <div className="ios-glass-card rounded-2xl p-2.5 mb-2 border border-slate-200/80 shadow-2xs flex items-center space-x-3 bg-gradient-to-r from-white via-amber-50/20 to-blue-50/20">
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-xs ring-1 ring-amber-500/30 bg-slate-100 flex-shrink-0">
          <img
            src="/assets/letty_play.png"
            alt="Letty Play"
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-800 leading-tight">
            {customMessage || LETTY_TIPS[0]}
          </p>
        </div>
      </div>
    );
  }

  // Hero Home Banner: Peeking Letty + Greeting + Striking "Start New Match" CTA Button inside the SINGLE card!
  if (variant === 'home') {
    return (
      <div className="relative rounded-3xl p-4 min-h-[115px] overflow-hidden bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-blue-950 shadow-xl border border-amber-300/80 flex items-center mb-3">
        {/* Ambient background glow */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-white/20 rounded-full blur-xl pointer-events-none" />

        {/* Letty peeking from far left edge */}
        <div className="absolute -left-1 bottom-0 h-full flex items-end z-10 pointer-events-none">
          <img
            src="/assets/letty_wants_to_play.png"
            alt="Letty Peeking"
            className="h-[115px] w-auto object-contain drop-shadow-md"
          />
        </div>

        {/* Greeting Text + High-Contrast Start Match CTA Button */}
        <div className="pl-14 sm:pl-16 pr-1 flex-1 z-20 space-y-1">
          <h2 className="text-base sm:text-lg font-black text-blue-950 leading-tight tracking-tight">
            Hi, I'm Letty! Let's play together!
          </h2>
          <p className="text-[11px] font-bold text-blue-950/80">
            Court referee counter & match scorekeeper
          </p>

          {/* Integrated High-Contrast CTA Button */}
          {onStartMatch && (
            <button
              onClick={onStartMatch}
              className="mt-2 py-2.5 px-4 bg-blue-950 hover:bg-slate-900 text-amber-400 font-black text-xs rounded-xl shadow-md flex items-center space-x-2 transition-transform active:scale-98 border border-blue-900/40"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start New Match</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  // Separate Letty Tips Card (Standalone)
  return (
    <div className="ios-glass-card rounded-2xl p-3.5 mb-3 border border-slate-200/80 shadow-sm bg-gradient-to-br from-white via-amber-50/20 to-blue-50/20">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-900 bg-blue-100/90 px-2.5 py-0.5 rounded-md">
          Tips from Letty
        </span>
        <button
          onClick={nextTip}
          className="text-slate-400 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-slate-100"
          title="Next tip"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl overflow-hidden shadow-xs ring-1 ring-amber-500/20 bg-slate-100 flex-shrink-0">
          <img
            src="/assets/letty_avatar.jpg"
            alt="Letty Mascot"
            className="w-full h-full object-cover"
          />
        </div>
        <p className="text-xs font-medium text-slate-700 leading-relaxed flex-1">
          {customMessage || LETTY_TIPS[tipIndex]}
        </p>
      </div>
    </div>
  );
};
