import { FolderSearch, RefreshCw, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BoardList } from './BoardList';
import { FolderTree } from './FolderTree';
import { pickAndReadDirectory, refreshFolderContents } from '../../lib/fileReader';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { state, dispatch } = useApp();

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId) ?? null;

  const handleScanDirectory = async () => {
    try {
      const folders = await pickAndReadDirectory();
      if (folders.length > 0) {
        dispatch({ type: 'IMPORT_FOLDERS', payload: folders });
      }
    } catch (err) {
      console.error('Failed to read directory:', err);
    }
  };

  const handleRefresh = async () => {
    try {
      const refreshed = await refreshFolderContents(state.folders);
      dispatch({ type: 'REFRESH_FOLDERS', payload: refreshed });
    } catch (err) {
      console.error('Failed to refresh:', err);
    }
  };

  if (!isOpen) {
    return (
      <div className="w-10 bg-gray-900 border-r border-gray-700 flex flex-col items-center pt-3">
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white p-1.5 rounded hover:bg-gray-700 transition-colors"
          title="Ouvrir la sidebar"
        >
          <PanelLeft size={18} />
        </button>
      </div>
    );
  }

  return (
    <div className="w-72 bg-gray-900 border-r border-gray-700 flex flex-col shrink-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-gray-700">
        <h2 className="text-sm font-bold text-white tracking-wide">Kanban Vision</h2>
        <button
          onClick={onToggle}
          className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
          title="Fermer la sidebar"
        >
          <PanelLeftClose size={16} />
        </button>
      </div>

      {/* Boards section */}
      <div className="border-b border-gray-700 py-2">
        <BoardList boards={state.boards} activeBoardId={state.activeBoardId} />
      </div>

      {/* Scan / Refresh buttons */}
      <div className="flex gap-2 px-3 py-3 border-b border-gray-700">
        <button
          onClick={handleScanDirectory}
          className="flex items-center gap-2 flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded transition-colors"
        >
          <FolderSearch size={14} />
          Scanner
        </button>
        {state.folders.length > 0 && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors"
            title="Rafraîchir le contenu des dossiers"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Folder tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Explorateur
          </h3>
        </div>
        <FolderTree folders={state.folders} activeBoard={activeBoard} />
      </div>
    </div>
  );
}
