import { useState, useCallback } from 'react';
import type { Folder, Board } from '../../types';
import { FolderItem } from './FolderItem';
import { FolderOpen, ChevronsUpDown, ChevronsDownUp } from 'lucide-react';
import { collectAllFolderIds } from '../../lib/folderUtils';

interface FolderTreeProps {
  folders: Folder[];
  activeBoard: Board | null;
}

export function FolderTree({ folders, activeBoard }: FolderTreeProps) {
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
      <div className="flex flex-col items-center justify-center py-8 text-gray-500 text-sm">
        <FolderOpen size={32} className="mb-2 text-gray-600" />
        <p>Aucun dossier</p>
        <p className="text-xs text-gray-600 mt-1">
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
          className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-700"
          title="Tout déplier"
        >
          <ChevronsUpDown size={14} />
        </button>
        <button
          onClick={collapseAll}
          className="p-1 text-gray-400 hover:text-white transition-colors rounded hover:bg-gray-700"
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
