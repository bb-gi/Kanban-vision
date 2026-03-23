import { FolderSearch, RefreshCw, PanelLeftClose, PanelLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { useApp } from '../../context/AppContext';
import { BoardList } from './BoardList';
import { ProjectList } from './ProjectList';
import { pickAndReadDirectory, readDirectoryFromHandle } from '../../lib/fileReader';
import { getNextColor } from '../../lib/folderUtils';
import { storeHandle, getHandleInfo, ensurePermission } from '../../lib/handleStore';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { state, dispatch } = useApp();

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId) ?? null;
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId) ?? null;

  const handleScanDirectory = async () => {
    try {
      const result = await pickAndReadDirectory();
      if (result.folders.length > 0) {
        const projectId = uuidv4();
        await storeHandle(projectId, result.handle, result.isRootFlat);
        dispatch({
          type: 'IMPORT_PROJECT',
          payload: {
            id: projectId,
            name: result.rootName,
            folders: result.folders,
            color: getNextColor(),
            isRootFlat: result.isRootFlat,
          },
        });
      }
    } catch (err) {
      console.error('Failed to read directory:', err);
    }
  };

  const handleRefresh = async () => {
    if (!activeProject) return;
    try {
      const info = await getHandleInfo(activeProject.id);
      if (info && (await ensurePermission(info.handle))) {
        const folders = await readDirectoryFromHandle(info.handle);
        const merged = mergeRefreshedFolders(activeProject.folders, folders);
        dispatch({
          type: 'REFRESH_PROJECT',
          payload: { projectId: activeProject.id, folders: merged },
        });
        return;
      }
      // Fallback: re-ask user
      const result = await pickAndReadDirectory();
      if (result.folders.length > 0) {
        await storeHandle(activeProject.id, result.handle, result.isRootFlat);
        const merged = mergeRefreshedFolders(activeProject.folders, result.folders);
        dispatch({
          type: 'REFRESH_PROJECT',
          payload: { projectId: activeProject.id, folders: merged },
        });
      }
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
          Nouveau projet
        </button>
        {activeProject && (
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors"
            title="Rafraîchir le projet actif"
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>

      {/* Projects & folder tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Projets
          </h3>
        </div>
        {state.projects.length === 0 ? (
          <div className="px-3 py-4 text-center text-gray-500 text-sm">
            <p>Aucun projet</p>
            <p className="text-xs text-gray-600 mt-1">
              Scannez un dossier pour créer un projet
            </p>
          </div>
        ) : (
          <ProjectList
            projects={state.projects}
            activeProjectId={state.activeProjectId}
            activeBoard={activeBoard}
          />
        )}
      </div>
    </div>
  );
}

// Merge refreshed folders with existing ones (keep IDs, displayNames, colors)
import type { Folder } from '../../types';

function mergeRefreshedFolders(existing: Folder[], fresh: Folder[]): Folder[] {
  return fresh.map((freshFolder) => {
    const match = existing.find((e) => e.originalName === freshFolder.originalName);
    if (match) {
      return {
        ...freshFolder,
        id: match.id,
        displayName: match.displayName,
        color: match.color,
        subfolders: mergeRefreshedFolders(match.subfolders, freshFolder.subfolders),
      };
    }
    return freshFolder;
  });
}
