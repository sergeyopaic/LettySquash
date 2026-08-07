import React, { useState } from 'react';
import type { Folder } from '../types/squash';
import { X, FolderIcon, Check, Plus, RefreshCw } from 'lucide-react';

interface FolderSelectorModalProps {
  isOpen: boolean;
  folders: Folder[];
  activeFolderId: string;
  onSelectFolder: (folder: Folder) => void;
  onCreateFolder: (name: string) => Folder;
  onClose: () => void;
}

export const FolderSelectorModal: React.FC<FolderSelectorModalProps> = ({
  isOpen,
  folders,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onClose,
}) => {
  const [pendingFolder, setPendingFolder] = useState<Folder | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  if (!isOpen) return null;

  const currentFolder = folders.find((f) => f.id === activeFolderId) || folders[0];

  const handleSelectClick = (folder: Folder) => {
    if (folder.id === activeFolderId) {
      onClose();
      return;
    }
    setPendingFolder(folder);
  };

  const handleConfirmSwitch = () => {
    if (pendingFolder) {
      onSelectFolder(pendingFolder);
      setPendingFolder(null);
      onClose();
    }
  };

  const handleCreateSubmit = () => {
    const trimmed = newFolderName.trim();
    if (!trimmed) return;
    const created = onCreateFolder(trimmed);
    setNewFolderName('');
    setIsCreating(false);
    onSelectFolder(created);
    onClose();
  };

  return (
    <div
      onClick={() => {
        setPendingFolder(null);
        setIsCreating(false);
        onClose();
      }}
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl p-5 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-2xl space-y-4 animate-in slide-in-from-bottom duration-200 cursor-default"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Select Folder
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Choose the active folder for your dashboard
            </p>
          </div>
          <button
            onClick={() => {
              setPendingFolder(null);
              setIsCreating(false);
              onClose();
            }}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {pendingFolder ? (
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl space-y-3 animate-in zoom-in duration-150">
            <div className="flex items-center space-x-2 text-amber-900">
              <RefreshCw className="w-5 h-5 text-amber-600 flex-shrink-0 animate-spin" />
              <h4 className="font-black text-xs uppercase tracking-wider">
                Confirm Folder Switch
              </h4>
            </div>

            <p className="text-xs text-amber-950 font-medium leading-relaxed">
              Switching from <strong>"{currentFolder?.name}"</strong> to{' '}
              <strong>"{pendingFolder.name}"</strong> will reload your dashboard, recent match history, and player list for {pendingFolder.name}.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setPendingFolder(null)}
                className="py-2.5 px-3 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 text-center transition-colors cursor-pointer"
              >
                Keep {currentFolder?.name}
              </button>

              <button
                type="button"
                onClick={handleConfirmSwitch}
                className="py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold text-xs rounded-xl shadow-xs text-center transition-colors cursor-pointer"
              >
                Switch Folder
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {folders.map((folder) => {
              const isSelected = folder.id === activeFolderId;

              return (
                <div
                  key={folder.id}
                  onClick={() => handleSelectClick(folder)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'bg-amber-50/80 border-amber-300 ring-1 ring-amber-400/50'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100/80'
                  }`}
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-sm shadow-xs flex-shrink-0">
                      {folder.icon || <FolderIcon className="w-4 h-4 text-slate-400" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {folder.name}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-amber-500 text-blue-950 flex items-center justify-center flex-shrink-0 shadow-2xs">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="pt-2 border-t border-slate-100">
          {isCreating ? (
            <div className="flex items-center space-x-2">
              <input
                autoFocus
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateSubmit()}
                placeholder="Folder name..."
                className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
              <button
                onClick={handleCreateSubmit}
                className="px-3 py-2 bg-slate-900 text-amber-400 text-xs font-bold rounded-xl cursor-pointer"
              >
                Add
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full text-xs font-semibold text-slate-500 hover:text-blue-900 inline-flex items-center justify-center space-x-1 cursor-pointer py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Folder</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
