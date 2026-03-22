import type { Folder, FileItem } from '../types';

export function findFolderById(folders: Folder[], id: string): Folder | null {
  for (const folder of folders) {
    if (folder.id === id) return folder;
    const found = findFolderById(folder.subfolders, id);
    if (found) return found;
  }
  return null;
}

export function updateFolderById(
  folders: Folder[],
  id: string,
  updater: (folder: Folder) => Folder
): Folder[] {
  return folders.map((folder) => {
    if (folder.id === id) return updater(folder);
    return {
      ...folder,
      subfolders: updateFolderById(folder.subfolders, id, updater),
    };
  });
}

export function removeFolderById(folders: Folder[], id: string): Folder[] {
  return folders
    .filter((folder) => folder.id !== id)
    .map((folder) => ({
      ...folder,
      subfolders: removeFolderById(folder.subfolders, id),
    }));
}

export function flattenFolders(folders: Folder[]): Folder[] {
  const result: Folder[] = [];
  for (const folder of folders) {
    result.push(folder);
    result.push(...flattenFolders(folder.subfolders));
  }
  return result;
}

export function moveFile(
  folders: Folder[],
  fileId: string,
  fromFolderId: string,
  toFolderId: string,
  index?: number
): Folder[] {
  let movedFile: FileItem | null = null;

  // Remove file from source
  let updated = updateFolderById(folders, fromFolderId, (folder) => {
    const fileIndex = folder.files.findIndex((f) => f.id === fileId);
    if (fileIndex === -1) return folder;
    movedFile = folder.files[fileIndex];
    return {
      ...folder,
      files: folder.files.filter((f) => f.id !== fileId),
    };
  });

  if (!movedFile) return folders;

  // Add file to target
  updated = updateFolderById(updated, toFolderId, (folder) => {
    const newFiles = [...folder.files];
    if (index !== undefined && index >= 0) {
      newFiles.splice(index, 0, movedFile!);
    } else {
      newFiles.push(movedFile!);
    }
    return { ...folder, files: newFiles };
  });

  return updated;
}

export function reorderFiles(
  folders: Folder[],
  folderId: string,
  fileIds: string[]
): Folder[] {
  return updateFolderById(folders, folderId, (folder) => {
    const fileMap = new Map(folder.files.map((f) => [f.id, f]));
    const reordered = fileIds
      .map((id) => fileMap.get(id))
      .filter((f): f is FileItem => f !== undefined);
    return { ...folder, files: reordered };
  });
}

const PASTEL_COLORS = [
  '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
  '#ec4899', '#f43f5e', '#ef4444', '#f97316',
  '#f59e0b', '#eab308', '#84cc16', '#22c55e',
  '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
];

let colorIndex = 0;

export function getNextColor(): string {
  const color = PASTEL_COLORS[colorIndex % PASTEL_COLORS.length];
  colorIndex++;
  return color;
}

export function collectAllFolderIds(folders: Folder[]): string[] {
  const ids: string[] = [];
  for (const folder of folders) {
    ids.push(folder.id);
    ids.push(...collectAllFolderIds(folder.subfolders));
  }
  return ids;
}
