import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, LayoutDashboard } from 'lucide-react';
import type { Board } from '../../types';
import { useApp } from '../../context/AppContext';

interface BoardListProps {
  boards: Board[];
  activeBoardId: string | null;
}

export function BoardList({ boards, activeBoardId }: BoardListProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const handleCreate = () => {
    if (newName.trim()) {
      dispatch({ type: 'CREATE_BOARD', payload: { name: newName.trim() } });
      setNewName('');
      setIsCreating(false);
    }
  };

  const handleRename = (boardId: string) => {
    if (editName.trim()) {
      dispatch({ type: 'RENAME_BOARD', payload: { boardId, name: editName.trim() } });
    }
    setEditingId(null);
  };

  return (
    <div role="list" aria-label="Tableaux">
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Tableaux
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className={`transition-colors ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'}`}
          aria-label="Nouveau tableau"
        >
          <Plus size={14} />
        </button>
      </div>

      {isCreating && (
        <form
          onSubmit={(e) => { e.preventDefault(); handleCreate(); }}
          className="px-3 pb-2 flex items-center gap-1"
        >
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nom du tableau..."
            className={`text-sm px-2 py-1 rounded border flex-1 min-w-0 ${
              isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
            }`}
            onKeyDown={(e) => { if (e.key === 'Escape') setIsCreating(false); }}
            aria-label="Nom du nouveau tableau"
          />
          <button type="submit" className="text-green-400 hover:text-green-300 p-1" aria-label="Confirmer">
            <Check size={14} />
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="text-red-400 hover:text-red-300 p-1" aria-label="Annuler">
            <X size={14} />
          </button>
        </form>
      )}

      {boards.length === 0 && !isCreating && (
        <p className={`px-3 py-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Aucun tableau. Cliquez + pour en créer un.
        </p>
      )}

      {boards.map((board) => (
        <div
          key={board.id}
          role="listitem"
          className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
            board.id === activeBoardId
              ? 'bg-indigo-500/20 text-indigo-300 border-r-2 border-indigo-500'
              : isDark
                ? 'text-gray-300 hover:bg-gray-700/50'
                : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => dispatch({ type: 'SET_ACTIVE_BOARD', payload: { boardId: board.id } })}
        >
          <LayoutDashboard size={14} className="shrink-0" />

          {editingId === board.id ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handleRename(board.id); }}
              className="flex items-center gap-1 flex-1 min-w-0"
              onClick={(e) => e.stopPropagation()}
            >
              <input
                autoFocus
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={() => handleRename(board.id)}
                className={`text-sm px-1 py-0 rounded border flex-1 min-w-0 ${
                  isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}
                onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
              />
            </form>
          ) : (
            <span className="flex-1 min-w-0 truncate text-sm">{board.name}</span>
          )}

          <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(board.id);
                setEditName(board.name);
              }}
              className={`p-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
              aria-label={`Renommer ${board.name}`}
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'DELETE_BOARD', payload: { boardId: board.id } });
              }}
              className={`p-1 ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
              aria-label={`Supprimer ${board.name}`}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
