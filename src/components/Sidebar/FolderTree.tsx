import type { Folder, Board } from '../../types';
import { FolderItem } from './FolderItem';
import { FolderOpen } from 'lucide-react';

interface FolderTreeProps {
  folders: Folder[];
  activeBoard: Board | null;
}

export function FolderTree({ folders, activeBoard }: FolderTreeProps) {
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
      {folders.map((folder) => (
        <FolderItem
          key={folder.id}
          folder={folder}
          depth={0}
          activeBoard={activeBoard}
        />
      ))}
    </div>
  );
}
