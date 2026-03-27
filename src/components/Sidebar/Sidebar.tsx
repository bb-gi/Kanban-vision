import { useState } from 'react';
import { FolderSearch, RefreshCw, PanelLeftClose, PanelLeft, Loader2, GitBranch } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BoardList } from './BoardList';
import { ProjectList } from './ProjectList';
import { GitLabSettings } from './GitLabSettings';
import { pickAndReadDirectory } from '../../lib/fileReader';
import { getNextColor } from '../../lib/folderUtils';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const { state, dispatch } = useApp();

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId) ?? null;
  const activeProject = state.projects.find((p) => p.id === state.activeProjectId) ?? null;
  const [isScanning, setIsScanning] = useState(false);
  const [showGitLab, setShowGitLab] = useState(false);

  const handleScanDirectory = async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const result = await pickAndReadDirectory();
      if (result.folders.length > 0) {
        dispatch({
          type: 'IMPORT_PROJECT',
          payload: {
            name: result.rootName,
            folders: result.folders,
            color: getNextColor(),
          },
        });
      }
    } catch (err) {
      console.error('Failed to read directory:', err);
    } finally {
      setIsScanning(false);
    }
  };

  const handleRefresh = async () => {
    if (!activeProject || isScanning) return;
    setIsScanning(true);
    try {
      const result = await pickAndReadDirectory();
      if (result.folders.length > 0) {
        const merged = mergeRefreshedFolders(activeProject.folders, result.folders);
        dispatch({
          type: 'REFRESH_PROJECT',
          payload: { projectId: activeProject.id, folders: merged },
        });
      }
    } catch (err) {
      console.error('Failed to refresh:', err);
    } finally {
      setIsScanning(false);
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

      {/* Scan / Refresh / GitLab buttons */}
      <div className="flex gap-2 px-3 py-3 border-b border-gray-700">
        <button
          onClick={handleScanDirectory}
          disabled={isScanning}
          className="flex items-center gap-2 flex-1 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isScanning ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <FolderSearch size={14} />
          )}
          {isScanning ? 'Chargement…' : 'Nouveau projet'}
        </button>
        {activeProject && (
          <>
            <button
              onClick={handleRefresh}
              disabled={isScanning}
              className="flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Rafraîchir le projet actif"
            >
              {isScanning ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
            </button>
            <button
              onClick={() => setShowGitLab(true)}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded transition-colors ${
                activeProject.gitlabConfig
                  ? 'bg-orange-600/20 text-orange-400 hover:bg-orange-600/40'
                  : 'bg-gray-700 hover:bg-gray-600 text-white'
              }`}
              title="Paramètres GitLab"
            >
              <GitBranch size={14} />
            </button>
          </>
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

      {/* GitLab settings modal */}
      {showGitLab && activeProject && (
        <GitLabSettings
          project={activeProject}
          onClose={() => setShowGitLab(false)}
        />
      )}
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
