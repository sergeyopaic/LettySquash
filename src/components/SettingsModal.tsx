import React from 'react';
import { useSquash } from '../context/SquashContext';
import { X, Sparkles, Volume2, Smartphone, BookOpen, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenHowToPlay?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onOpenHowToPlay }) => {
  const { settings, updateSettings } = useSquash();

  if (!isOpen) return null;

  const handleResetWelcomeBanner = () => {
    localStorage.removeItem('welcomeBannerDismissed');
    alert('Welcome Onboarding Banner restored!');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-lg font-black text-slate-900">App Settings</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3">
          {/* How to Play Guide Button */}
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

          {/* Letty Tips Toggle */}
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

          {/* Sound Effects */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-slate-900 flex items-center justify-center">
                <Volume2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Sound Effects</p>
                <p className="text-[10px] text-slate-500">Audio cues during refereeing</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.soundEffects}
                onChange={(e) => updateSettings({ soundEffects: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Haptic Feedback */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-900 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">Haptic Feedback</p>
                <p className="text-[10px] text-slate-500">Vibration feedback on tap</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => updateSettings({ hapticFeedback: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
            </label>
          </div>

          {/* Reset Onboarding Banner */}
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
