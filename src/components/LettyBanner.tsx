import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import { LETTY_TIPS } from '../data/mockData';
import { Sparkles, RefreshCw } from 'lucide-react';

interface LettyBannerProps {
  customMessage?: string;
  variant?: 'home' | 'match' | 'victory';
}

export const LettyBanner: React.FC<LettyBannerProps> = ({ customMessage, variant = 'home' }) => {
  const { settings } = useSquash();
  const [tipIndex, setTipIndex] = useState(0);

  if (!settings.showMascotTips && variant === 'home') {
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

  const getMascotSrc = () => {
    if (variant === 'victory') {
      return '/assets/letty_winner.jpg';
    }
    return '/assets/letty_avatar.jpg';
  };

  return (
    <div className="ios-glass-card rounded-2xl p-4 mb-5 border border-slate-200/80 shadow-md relative overflow-hidden bg-gradient-to-br from-white via-amber-50/20 to-blue-50/30">
      <div className="flex items-start space-x-3.5">
        <div className="relative flex-shrink-0">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-md ring-2 ring-amber-500/20 bg-slate-100 flex items-center justify-center">
            <img
              src={getMascotSrc()}
              alt="Letty"
              className="w-full h-full object-cover letty-bounce"
            />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-amber-400 text-blue-950 p-1 rounded-full text-[10px] font-black shadow">
            <Sparkles className="w-3 h-3" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-900 bg-blue-100/90 px-2.5 py-0.5 rounded-lg shadow-2xs">
                Tips from Letty
              </span>
            </div>
            {variant === 'home' && (
              <button
                onClick={nextTip}
                className="text-slate-400 hover:text-blue-900 transition-colors p-1 rounded-full hover:bg-slate-100"
                title="Next tip"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-xs font-medium text-slate-700 mt-1.5 leading-relaxed">
            {customMessage || LETTY_TIPS[tipIndex]}
          </p>
        </div>
      </div>
    </div>
  );
};
