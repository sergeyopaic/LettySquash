import React, { useEffect, useRef, useState } from 'react';
import type { Competition, SquashMatch } from '../types/squash';
import {
  EXPORT_NAVY_TEMPLATE_ID,
  EXPORT_TEMPLATE_URLS,
  exportMatchAsImage,
  renderMatchExportCanvas,
} from '../utils/matchExportUtils';
import { X, Loader2, Camera } from 'lucide-react';

interface ExportPhotoPickerModalProps {
  match: SquashMatch | null;
  competitions: Competition[];
  onClose: () => void;
}

// The four mascot backgrounds, plus a plain-navy no-mascot option for anyone sharing
// somewhere the court art doesn't fit. All five ids resolve through the same
// renderMatchExportCanvas({ templateUrl }) call — see matchExportUtils.
const TEMPLATE_IDS = [...EXPORT_TEMPLATE_URLS, EXPORT_NAVY_TEMPLATE_ID];

const loadImageFromFile = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load the selected photo'));
    img.src = url;
  });

// A 2x2 grid of the mascot backgrounds plus one wide "no mascots" tile below, each
// rendered with this match's real data so the user picks a look rather than getting
// whatever the random default landed on. Previews render at full export resolution
// (see matchExportUtils) and are just scaled down by CSS here — same pixels that get
// shared once picked.
export const ExportPhotoPickerModal: React.FC<ExportPhotoPickerModalProps> = ({
  match,
  competitions,
  onClose,
}) => {
  const [previews, setPreviews] = useState<(string | null)[]>([]);
  const [sendingUrl, setSendingUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isBusy = Boolean(sendingUrl) || isProcessingPhoto;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (match) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [match, onClose]);

  useEffect(() => {
    if (!match) return;
    let cancelled = false;
    setPreviews(TEMPLATE_IDS.map(() => null));

    // Rendered one at a time (not Promise.all) so previews pop in as they finish
    // instead of the whole grid staying blank until the slowest one is done.
    (async () => {
      for (let i = 0; i < TEMPLATE_IDS.length; i++) {
        const canvas = await renderMatchExportCanvas({
          match,
          competitions,
          templateUrl: TEMPLATE_IDS[i],
        });
        if (cancelled) return;
        const dataUrl = canvas.toDataURL('image/png');
        setPreviews((prev) => {
          const next = [...prev];
          next[i] = dataUrl;
          return next;
        });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [match, competitions]);

  if (!match) return null;

  const handlePick = async (url: string) => {
    if (sendingUrl) return;
    setSendingUrl(url);
    try {
      await exportMatchAsImage(match, competitions, url);
      onClose();
    } catch (err) {
      console.error('Failed to export match photo', err);
      alert('Could not generate the match photo. Please try again.');
    } finally {
      setSendingUrl(null);
    }
  };

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // Reset so picking the exact same file a second time still fires onChange.
    e.target.value = '';
    if (!file || isBusy) return;

    setIsProcessingPhoto(true);
    let objectUrl: string | null = null;
    try {
      const img = await loadImageFromFile(file);
      objectUrl = img.src;
      await exportMatchAsImage(match, competitions, undefined, img);
      onClose();
    } catch (err) {
      console.error('Failed to export match photo', err);
      alert('Could not generate the match photo. Please try again.');
    } finally {
      setIsProcessingPhoto(false);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
  };

  const mascotIds = TEMPLATE_IDS.slice(0, EXPORT_TEMPLATE_URLS.length);
  const navyIndex = TEMPLATE_IDS.length - 1;

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[70] bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[88vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">Choose a Style</h2>
            <p className="text-xs text-slate-500 mt-0.5">Pick a background for the match photo</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center -mr-1 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {mascotIds.map((url, i) => (
            <button
              key={url}
              onClick={() => handlePick(url)}
              disabled={!previews[i] || isBusy}
              className="relative aspect-[2/3] rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-amber-400 transition-colors disabled:cursor-wait bg-slate-100"
            >
              {previews[i] ? (
                <img src={previews[i] ?? undefined} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
                </div>
              )}
              {sendingUrl === url && (
                <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>

        {/* No-mascots option — a distinct wide tile since it's a different (closer to
            square) aspect ratio than the four court photos above, not another random skin. */}
        <div>
          <button
            onClick={() => handlePick(EXPORT_NAVY_TEMPLATE_ID)}
            disabled={!previews[navyIndex] || isBusy}
            className="relative w-full aspect-[842/680] rounded-2xl overflow-hidden border-2 border-slate-200 hover:border-amber-400 transition-colors disabled:cursor-wait bg-slate-100"
          >
            {previews[navyIndex] ? (
              <img src={previews[navyIndex] ?? undefined} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
              </div>
            )}
            {sendingUrl === EXPORT_NAVY_TEMPLATE_ID && (
              <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-amber-400 animate-spin" />
              </div>
            )}
          </button>
        </div>

        {/* Camera option — take (or pick) your own photo, and the same result card gets
            appended below it instead of overlaid on top, since a real photo doesn't have
            a deliberately empty lower half the way the mascot art does. */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={handlePhotoSelected}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isBusy}
          className="relative w-full py-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-amber-400 transition-colors flex items-center justify-center space-x-2 text-slate-500 hover:text-slate-700 disabled:cursor-wait bg-slate-50"
        >
          {isProcessingPhoto ? (
            <Loader2 className="w-5 h-5 animate-spin text-amber-500" />
          ) : (
            <Camera className="w-5 h-5" />
          )}
          <span className="text-xs font-bold">
            {isProcessingPhoto ? 'Generating…' : 'Take a Photo'}
          </span>
        </button>
      </div>
    </div>
  );
};
