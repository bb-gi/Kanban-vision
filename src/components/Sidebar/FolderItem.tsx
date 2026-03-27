import { useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder as FolderIcon,
  Pencil,
  Trash2,
  Check,
  X,
} from 'lucide-react';
import type { Folder, Board } from '../../types';
import { useApp } from '../../context/AppContext';
import { ColorPicker } from './ColorPicker';

interface FolderItemProps {
  folder: Folder;
  depth: number;
  activeBoard: Board | null;
  isOpen: boolean;
  onToggle: (id: string) => void;
  expandedIds: Set<string>;
}

export function FolderItem({ folder, depth, activeBoard, isOpen, onToggle, expandedIds }: FolderItemProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(folder.displayName);

  const hasChildren = folder.subfolders.length > 0;
  const isOnBoard = activeBoard?.columnLayout.includes(folder.id) ?? false;

  const handleRename = () => {
    if (editName.trim()) {
      dispatch({
        type: 'RENAME_FOLDER',
        payload: { id: folder.id, displayName: editName.trim() },
      });
    }
    setIsEditing(false);
  };

  const handleToggleColumn = () => {
    if (!activeBoard) return;
    dispatch({
      type: 'TOGGLE_COLUMN',
      payload: { boardId: activeBoard.id, folderId: folder.id },
    });
  };

  return (
    <div>
      <div
        className={`group flex items-center gap-1 py-1 px-2 rounded cursor-pointer text-sm transition-colors ${
          isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-100'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        <button
          onClick={() => onToggle(folder.id)}
          className={`shrink-0 w-4 h-4 flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
          aria-expanded={hasChildren ? isOpen : undefined}
          aria-label={hasChildren ? (isOpen ? 'Réduire' : 'Développer') : undefined}
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        <FolderIcon size={14} style={{ color: folder.color }} className="shrink-0" />

        {isEditing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleRename(); }}
            className="flex items-center gap-1 flex-1 min-w-0"
          >
            <input
              autoFocus
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              className={`text-sm px-1 py-0 rounded border flex-1 min-w-0 ${
                isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
              }`}
              onKeyDown={(e) => { if (e.key === 'Escape') setIsEditing(false); }}
            />
            <button type="submit" className="text-green-400 hover:text-green-300" aria-label="Confirmer">
              <Check size={12} />
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-red-400 hover:text-red-300" aria-label="Annuler">
              <X size={12} />
            </button>
          </form>
        ) : (
          <span
            className={`flex-1 min-w-0 truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
            onDoubleClick={() => { setEditName(folder.displayName); setIsEditing(true); }}
          >
            {folder.displayName}
          </span>
        )}

        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {activeBoard && (
              <button
                onClick={handleToggleColumn}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isOnBoard
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : isDark ? 'border-gray-500 hover:border-gray-300' : 'border-gray-400 hover:border-gray-500'
                }`}
                aria-label={isOnBoard ? `Retirer ${folder.displayName} du tableau` : `Ajouter ${folder.displayName} au tableau`}
              >
                {isOnBoard && <Check size={10} />}
              </button>
            )}

            <ColorPicker
              color={folder.color}
              onChange={(color) =>
                dispatch({ type: 'SET_COLOR', payload: { id: folder.id, color } })
              }
            />

            <button
              onClick={() => { setEditName(folder.displayName); setIsEditing(true); }}
              className={`p-1 transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
              aria-label={`Renommer ${folder.displayName}`}
            >
              <Pencil size={12} />
            </button>

            <button
              onClick={() => dispatch({ type: 'DELETE_FOLDER', payload: { id: folder.id } })}
              className={`p-1 transition-colors ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
              aria-label={`Supprimer ${folder.displayName}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {isOpen && hasChildren && (
        <div>
          {folder.subfolders.map((sub) => (
            <FolderItem
              key={sub.id}
              folder={sub}
              depth={depth + 1}
              activeBoard={activeBoard}
              isOpen={expandedIds.has(sub.id)}
              onToggle={onToggle}
              expandedIds={expandedIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}
