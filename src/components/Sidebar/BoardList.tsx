import { useState } from 'react';
import { Plus, Trash2, Pencil, Check, X, LayoutDashboard } from 'lucide-react';
import type { Board } from '../../types';
import { useApp } from '../../context/AppContext';

interface BoardListProps {
  boards: Board[];
  activeBoardId: string | null;
}

export function BoardList({ boards, activeBoardId }: BoardListProps) {
  const { dispatch } = useApp();
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
    <div>
      <div className="flex items-center justify-between px-3 py-2">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Tableaux
        </h3>
        <button
          onClick={() => setIsCreating(true)}
          className="text-gray-400 hover:text-white transition-colors"
          title="Nouveau tableau"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Create form */}
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
            className="bg-gray-800 text-white text-sm px-2 py-1 rounded border border-gray-600 flex-1 min-w-0"
            onKeyDown={(e) => { if (e.key === 'Escape') setIsCreating(false); }}
          />
          <button type="submit" className="text-green-400 hover:text-green-300 p-1">
            <Check size={14} />
          </button>
          <button type="button" onClick={() => setIsCreating(false)} className="text-red-400 hover:text-red-300 p-1">
            <X size={14} />
          </button>
        </form>
      )}

      {/* Board list */}
      {boards.length === 0 && !isCreating && (
        <p className="px-3 py-2 text-xs text-gray-500">
          Aucun tableau. Cliquez + pour en créer un.
        </p>
      )}

      {boards.map((board) => (
        <div
          key={board.id}
          className={`group flex items-center gap-2 px-3 py-1.5 cursor-pointer transition-colors ${
            board.id === activeBoardId
              ? 'bg-indigo-500/20 text-indigo-300 border-r-2 border-indigo-500'
              : 'text-gray-300 hover:bg-gray-700/50'
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
                className="bg-gray-800 text-white text-sm px-1 py-0 rounded border border-gray-600 flex-1 min-w-0"
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
              className="p-1 text-gray-400 hover:text-white"
              title="Renommer"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                dispatch({ type: 'DELETE_BOARD', payload: { boardId: board.id } });
              }}
              className="p-1 text-gray-400 hover:text-red-400"
              title="Supprimer"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
