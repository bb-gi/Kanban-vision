import { v4 as uuidv4 } from 'uuid';
import type { Folder, FileItem } from '../types';
import { getNextColor } from './folderUtils';

async function readDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<Folder> {
  const folder: Folder = {
    id: uuidv4(),
    originalName: handle.name,
    displayName: handle.name,
    color: getNextColor(),
    files: [],
    subfolders: [],
  };

  for await (const entry of (handle as any).values()) {
    if (entry.kind === 'file') {
      const file: File = await entry.getFile();
      if (file.name.endsWith('.md')) {
        const content = await file.text();
        folder.files.push({
          id: uuidv4(),
          title: file.name,
          content,
        });
      }
    } else if (entry.kind === 'directory') {
      const subfolder = await readDirectoryHandle(entry);
      folder.subfolders.push(subfolder);
    }
  }

  // Sort files and subfolders alphabetically
  folder.files.sort((a, b) => a.title.localeCompare(b.title));
  folder.subfolders.sort((a, b) => a.originalName.localeCompare(b.originalName));

  return folder;
}

export async function pickAndReadDirectory(): Promise<Folder[]> {
  try {
    const handle = await (window as any).showDirectoryPicker();
    const rootFolder = await readDirectoryHandle(handle);
    // Return the children of the selected root (the projects inside)
    // If root has subfolders, return them; otherwise return the root itself
    if (rootFolder.subfolders.length > 0) {
      return rootFolder.subfolders;
    }
    return [rootFolder];
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return []; // User cancelled
    }
    throw err;
  }
}

export async function refreshFolderContents(
  existingFolders: Folder[]
): Promise<Folder[]> {
  // Re-pick and re-read directory, then merge metadata
  const freshFolders = await pickAndReadDirectory();
  return mergeFolders(existingFolders, freshFolders);
}

function mergeFolders(existing: Folder[], fresh: Folder[]): Folder[] {
  return fresh.map((freshFolder) => {
    const match = existing.find(
      (e) => e.originalName === freshFolder.originalName
    );
    if (match) {
      return {
        ...freshFolder,
        id: match.id,
        displayName: match.displayName,
        color: match.color,
        subfolders: mergeFolders(match.subfolders, freshFolder.subfolders),
      };
    }
    return freshFolder;
  });
}

// For drag-and-drop from OS file explorer
export async function readDroppedFiles(
  dataTransfer: DataTransfer
): Promise<FileItem[]> {
  const files: FileItem[] = [];
  const items = Array.from(dataTransfer.items);

  for (const item of items) {
    if (item.kind === 'file') {
      const file = item.getAsFile();
      if (file && file.name.endsWith('.md')) {
        const content = await file.text();
        files.push({
          id: uuidv4(),
          title: file.name,
          content,
        });
      }
    }
  }

  return files;
}
