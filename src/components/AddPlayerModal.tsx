import React, { useEffect, useState } from 'react';
import { useSquash } from '../context/SquashContext';
import type { Handedness, Folder, Player } from '../types/squash';
import { X, UserPlus, Pencil } from 'lucide-react';

interface AddPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeFolder?: Folder;
  // When set, the modal edits this existing profile instead of creating a new one — same
  // form, pre-filled, and the save also backfills the name/avatar into every match this
  // player already played (see updatePlayer in SquashContext).
  editingPlayer?: Player | null;
}

export const AddPlayerModal: React.FC<AddPlayerModalProps> = ({ isOpen, onClose, activeFolder, editingPlayer }) => {
  const { addPlayer, updatePlayer, folders } = useSquash();
  const isEditMode = Boolean(editingPlayer);

  const [name, setName] = useState('');
  const [nickname, setNickname] = useState('');
  const [notes, setNotes] = useState('');
  const [handedness, setHandedness] = useState<Handedness>('Right');
  const [folderId, setFolderId] = useState<string>(activeFolder?.id ?? '');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');

  // Re-seed the form fields every time a different profile is opened for editing (or the
  // modal is reopened in "add" mode) — the form's own state otherwise carries over stale
  // values from whatever was open before.
  useEffect(() => {
    if (!isOpen) return;
    if (editingPlayer) {
      setName(editingPlayer.name);
      setNickname(editingPlayer.nickname ?? '');
      setNotes(editingPlayer.notes ?? '');
      setHandedness(editingPlayer.handedness ?? 'Right');
      setFolderId(editingPlayer.folderId ?? '');
      setSelectedColor(editingPlayer.avatarBgColor || '#3B82F6');
    } else {
      setName('');
      setNickname('');
      setNotes('');
      setHandedness('Right');
      setFolderId(activeFolder?.id ?? '');
      setSelectedColor('#3B82F6');
    }
  }, [isOpen, editingPlayer, activeFolder]);

  if (!isOpen) return null;

  const colorOptions = ['#3B82F6', '#EC4899', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#6366F1'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      alert('Please enter player name!');
      return;
    }
    const options = {
      nickname: nickname.trim() || undefined,
      notes: notes.trim() || undefined,
      handedness,
      avatarBgColor: selectedColor,
      folderId: folderId || undefined,
    };
    if (editingPlayer) {
      updatePlayer(editingPlayer.id, { name: name.trim(), ...options });
    } else {
      addPlayer(name.trim(), options);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full max-h-[90vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center font-bold">
              {isEditMode ? <Pencil className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <h2 className="text-lg font-black text-slate-900">
              {isEditMode ? 'Edit Player Profile' : 'New Player Profile'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Full Name</label>
            <input
              type="text"
              placeholder="e.g. Liam Walker"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Nickname (optional)</label>
            <input
              type="text"
              placeholder="e.g. Squashinator"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            />
          </div>

          {/* Handedness */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Handedness</label>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setHandedness('Right')}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  handedness === 'Right'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Right-handed
              </button>
              <button
                type="button"
                onClick={() => setHandedness('Left')}
                className={`flex-1 p-2.5 rounded-xl border text-xs font-bold transition-all ${
                  handedness === 'Left'
                    ? 'border-amber-500 bg-amber-50 text-amber-950'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Left-handed
              </button>
            </div>
          </div>

          {/* Folder */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Folder (optional)</label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="">No folder</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Notes (optional)</label>
            <textarea
              placeholder="e.g. Plays left-wall drops well"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 resize-none"
            />
          </div>

          {/* Color options */}
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 block">Avatar Color</label>
            <div className="flex space-x-2">
              {colorOptions.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setSelectedColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    selectedColor === c ? 'scale-125 ring-2 ring-slate-900 ring-offset-2' : 'hover:scale-110'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-blue-900 hover:bg-slate-800 text-white font-black text-xs rounded-xl shadow-md transition-transform active:scale-98"
          >
            {isEditMode ? 'Save Changes' : 'Save Player Profile'}
          </button>
        </form>
      </div>
    </div>
  );
};
