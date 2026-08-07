import React, { useState } from 'react';
import { useSquash } from '../context/SquashContext';
import type { MatchFormat } from '../types/squash';
import { X, Sparkles, Zap, Info, BookOpen, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHowToPlay?: () => void;
}

type SettingsTab = 'MASCOT' | 'QUICK_MATCH' | 'ABOUT';

const FORMAT_OPTIONS: { id: MatchFormat; label: string; desc: string }[] = [
  { id: 'BEST_OF_3', label: 'Best of 3', desc: 'First to 2 games' },
  { id: 'BEST_OF_5', label: 'Best of 5', desc: 'First to 3 games' },
  { id: 'SINGLE_GAME', label: 'Single Game', desc: 'One game decides it' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenHowToPlay }) => {
  const { settings, updateSettings } = useSquash();
  // Quick Match is the tab people actually get sent here for (from the "Manage my
  // default format" link in the match starter) — it's the default and leads the tab
  // order; Mascot Tips is a minor toggle, not the first thing worth showing.
  const [tab, setTab] = useState<SettingsTab>('QUICK_MATCH');

  if (!isOpen) return null;

  const handleResetWelcomeBanner = () => {
    localStorage.removeItem('welcomeBannerDismissed');
    alert('Welcome Onboarding Banner restored!');
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    { id: 'QUICK_MATCH', label: 'Quick Match', icon: <Zap className="w-3.5 h-3.5" /> },
    { id: 'MASCOT', label: 'Mascot Tips', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { id: 'ABOUT', label: 'About', icon: <Info className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl text-[11px] font-bold text-slate-600">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`py-2 rounded-xl flex items-center justify-center space-x-1 transition-all ${
                tab === t.id ? 'bg-white text-blue-900 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* MASCOT TIPS TAB */}
        {tab === 'MASCOT' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Tips from Letty</p>
                  <p className="text-[10px] text-slate-500">Show court advice & rules tips from Letty</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.showMascotTips}
                  onChange={(e) => updateSettings({ showMascotTips: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>
          </div>
        )}

        {/* QUICK MATCH TAB */}
        {tab === 'QUICK_MATCH' && (
          <div className="space-y-4">
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed px-0.5">
              These are the defaults Quick Match uses so you never have to pick a format again.
              Need something different just once? Use Custom Match instead — it won't touch these.
            </p>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-600 block">Match Format</label>
              <div className="grid grid-cols-3 gap-2">
                {FORMAT_OPTIONS.map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => updateSettings({ quickMatchFormat: f.id })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      settings.quickMatchFormat === f.id
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
                {[
                  { pts: 11, label: 'PARS-11', desc: 'Standard scoring' },
                  { pts: 15, label: 'Traditional-15', desc: 'Some interclub leagues' },
                ].map((opt) => (
                  <button
                    key={opt.pts}
                    type="button"
                    onClick={() => updateSettings({ quickMatchTargetPoints: opt.pts })}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      settings.quickMatchTargetPoints === opt.pts
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-bold'
                        : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-xs">{opt.label}</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="pr-2">
                <p className="text-xs font-bold text-slate-900">Two-Point Gap Rule</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  If tied at {settings.quickMatchTargetPoints - 1}-{settings.quickMatchTargetPoints - 1}, play until
                  one player leads by 2. Off means first to {settings.quickMatchTargetPoints} wins outright.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input
                  type="checkbox"
                  checked={settings.quickMatchTwoPointGap}
                  onChange={(e) => updateSettings({ quickMatchTwoPointGap: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
              </label>
            </div>
          </div>
        )}

        {/* ABOUT TAB */}
        {tab === 'ABOUT' && (
          <div className="space-y-3">
            {onOpenHowToPlay && (
              <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">How to Play & Rules Guide</p>
                    <p className="text-[10px] text-slate-500">WSF rules, scoring, and Letty app guide</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onOpenHowToPlay();
                  }}
                  className="text-xs font-black text-slate-950 bg-amber-400 px-3 py-1.5 rounded-xl hover:bg-amber-300 transition-colors shadow-2xs"
                >
                  Open Guide
                </button>
              </div>
            )}

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <p className="text-xs font-bold text-slate-900">Letty Squash</p>
              <p className="text-[10px] text-slate-500 mt-0.5">Version 1.0.0 — offline referee companion</p>
            </div>

            <div className="pt-1 text-center">
              <button
                onClick={handleResetWelcomeBanner}
                className="text-[11px] font-semibold text-slate-400 hover:text-slate-700 inline-flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Restore Welcome Banner</span>
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3 bg-slate-900 text-white font-bold text-xs rounded-xl shadow-sm"
        >
          Done
        </button>
      </div>
    </div>
  );
};
