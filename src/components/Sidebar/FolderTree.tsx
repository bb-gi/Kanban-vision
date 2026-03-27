import { useState, useCallback } from 'react';
import type { Folder, Board } from '../../types';
import { FolderItem } from './FolderItem';
import { FolderOpen, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { collectAllFolderIds } from '../../lib/folderUtils';
import { useApp } from '../../context/AppContext';

interface FolderTreeProps {
  folders: Folder[];
  activeBoard: Board | null;
}

export function FolderTree({ folders, activeBoard }: FolderTreeProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleFolder = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    setExpandedIds(new Set(collectAllFolderIds(folders)));
  }, [folders]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  if (folders.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        <FolderOpen size={32} className={`mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
        <p>Aucun dossier</p>
        <p className={`text-xs mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
          Utilisez le bouton ci-dessus pour scanner un dossier
        </p>
      </div>
    );
  }

  return (
    <div className="py-1">
      <div className="flex items-center justify-end gap-1 px-2 pb-1">
        <button
          onClick={expandAll}
          className={`p-1 transition-colors rounded ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Tout déplier"
          title="Tout déplier"
        >
          <ChevronsUpDown size={14} />
        </button>
        <button
          onClick={collapseAll}
          className={`p-1 transition-colors rounded ${
            isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
          }`}
          aria-label="Tout plier"
          title="Tout plier"
        >
          <ChevronsDownUp size={14} />
        </button>
      </div>
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          depth={0}
          activeBoard={activeBoard}
          isOpen={expandedIds.has(folder.id)}
          onToggle={toggleFolder}
          expandedIds={expandedIds}
        />
      ))}
    </div>
  );
}
