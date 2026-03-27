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
  const { dispatch } = useApp();
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
        className="group flex items-center gap-1 py-1 px-2 hover:bg-gray-700/50 rounded cursor-pointer text-sm"
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/Collapse */}
        <button
          onClick={() => onToggle(folder.id)}
          className="shrink-0 w-4 h-4 flex items-center justify-center text-gray-400"
        >
          {hasChildren ? (
            isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />
          ) : (
            <span className="w-3.5" />
          )}
        </button>

        {/* Folder icon with color */}
        <FolderIcon size={14} style={{ color: folder.color }} className="shrink-0" />

        {/* Name */}
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
              className="bg-gray-800 text-white text-sm px-1 py-0 rounded border border-gray-600 flex-1 min-w-0"
              onKeyDown={(e) => { if (e.key === 'Escape') setIsEditing(false); }}
            />
            <button type="submit" className="text-green-400 hover:text-green-300">
              <Check size={12} />
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-red-400 hover:text-red-300">
              <X size={12} />
            </button>
          </form>
        ) : (
          <span
            className="flex-1 min-w-0 truncate text-gray-200"
            onDoubleClick={() => { setEditName(folder.displayName); setIsEditing(true); }}
          >
            {folder.displayName}
          </span>
        )}

        {/* Actions (visible on hover) */}
        {!isEditing && (
          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            {/* Checkbox: add to board */}
            {activeBoard && (
              <button
                onClick={handleToggleColumn}
                className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  isOnBoard
                    ? 'bg-indigo-500 border-indigo-500 text-white'
                    : 'border-gray-500 hover:border-gray-300'
                }`}
                title={isOnBoard ? 'Retirer du tableau' : 'Ajouter au tableau'}
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
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Renommer"
            >
              <Pencil size={12} />
            </button>

            <button
              onClick={() => dispatch({ type: 'DELETE_FOLDER', payload: { id: folder.id } })}
              className="p-1 text-gray-400 hover:text-red-400 transition-colors"
              title="Supprimer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Children */}
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
