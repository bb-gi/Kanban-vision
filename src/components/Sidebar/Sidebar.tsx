import { useState } from 'react';
import {
  FolderSearch, RefreshCw, PanelLeftClose, PanelLeft, Loader2,
  GitBranch, Sun, Moon, Download, Upload, Search, Undo2, Redo2,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { BoardList } from './BoardList';
import { ProjectList } from './ProjectList';
import { GitLabSettings } from './GitLabSettings';
import { pickAndReadDirectory } from '../../lib/fileReader';
import { getNextColor } from '../../lib/folderUtils';
import type { Folder } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onExport: () => void;
  onImport: () => void;
  onSearch: () => void;
}

export function Sidebar({ isOpen, onToggle, onExport, onImport, onSearch }: SidebarProps) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useApp();

  const isDark = state.theme === 'dark';
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

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', payload: { theme: isDark ? 'light' : 'dark' } });
  };

  if (!isOpen) {
    return (
      <div className={`w-10 border-r flex flex-col items-center pt-3 gap-2 transition-colors ${
        isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <button
          onClick={onToggle}
          className={`p-1.5 rounded transition-colors ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Ouvrir la sidebar"
        >
          <PanelLeft size={18} />
        </button>
        <button
          onClick={onSearch}
          className={`p-1.5 rounded transition-colors ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Rechercher"
        >
          <Search size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className={`w-72 border-r flex flex-col shrink-0 overflow-hidden transition-colors ${
      isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-3 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <h2 className={`text-sm font-bold tracking-wide ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Kanban Vision
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-yellow-400 hover:bg-gray-700' : 'text-gray-500 hover:text-indigo-600 hover:bg-gray-100'
            }`}
            aria-label={isDark ? 'Mode clair' : 'Mode sombre'}
            title={isDark ? 'Mode clair' : 'Mode sombre'}
          >
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
          <button
            onClick={onToggle}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Fermer la sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>
      </div>

      {/* Search bar trigger */}
      <button
        onClick={onSearch}
        className={`mx-3 mt-3 mb-1 flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
          isDark
            ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
        }`}
        aria-label="Rechercher des fichiers"
      >
        <Search size={14} />
        <span className="flex-1 text-left">Rechercher...</span>
        <kbd className={`text-xs px-1.5 py-0.5 rounded border ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
        }`}>
          {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}K
        </kbd>
      </button>

      {/* Toolbar: undo/redo + export/import */}
      <div className={`flex items-center gap-1 px-3 py-2 border-b ${
        isDark ? 'border-gray-700' : 'border-gray-200'
      }`}>
        <button
          onClick={undo}
          disabled={!canUndo()}
          className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Annuler"
          title="Annuler (Ctrl+Z)"
        >
          <Undo2 size={14} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className={`p-1.5 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Rétablir"
          title="Rétablir (Ctrl+Shift+Z)"
        >
          <Redo2 size={14} />
        </button>
        <div className="flex-1" />
        <button
          onClick={onExport}
          className={`p-1.5 rounded transition-colors ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Exporter les données"
          title="Exporter (JSON)"
        >
          <Download size={14} />
        </button>
        <button
          onClick={onImport}
          className={`p-1.5 rounded transition-colors ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Importer des données"
          title="Importer (JSON)"
        >
          <Upload size={14} />
        </button>
      </div>

      {/* Boards section */}
      <div className={`border-b py-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
        <BoardList boards={state.boards} activeBoardId={state.activeBoardId} />
      </div>

      {/* Scan / Refresh / GitLab buttons */}
      <div className={`flex gap-2 px-3 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
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
          {isScanning ? 'Chargement...' : 'Nouveau projet'}
        </button>
        {activeProject && (
          <>
            <button
              onClick={handleRefresh}
              disabled={isScanning}
              className={`flex items-center gap-1 text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              aria-label="Rafraîchir le projet actif"
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
                  : isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
              aria-label="Paramètres GitLab"
            >
              <GitBranch size={14} />
            </button>
          </>
        )}
      </div>

      {/* Projects & folder tree */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-3 py-2">
          <h3 className={`text-xs font-semibold uppercase tracking-wider ${
            isDark ? 'text-gray-400' : 'text-gray-500'
          }`}>
            Projets
          </h3>
        </div>
        {state.projects.length === 0 ? (
          <div className={`px-3 py-4 text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            <p>Aucun projet</p>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
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
