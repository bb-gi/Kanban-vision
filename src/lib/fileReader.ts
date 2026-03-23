import { v4 as uuidv4 } from 'uuid';
import type { Folder, FileItem } from '../types';
import { getNextColor } from './folderUtils';

export interface DirectoryReadResult {
  rootName: string;
  folders: Folder[];
  handle: FileSystemDirectoryHandle;
  isRootFlat: boolean;
}

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

  folder.files.sort((a, b) => a.title.localeCompare(b.title));
  folder.subfolders.sort((a, b) => a.originalName.localeCompare(b.originalName));

  return folder;
}

// Read a directory from a stored handle without prompting the user
export async function readDirectoryFromHandle(
  handle: FileSystemDirectoryHandle
): Promise<Folder[]> {
  const rootFolder = await readDirectoryHandle(handle);
  if (rootFolder.subfolders.length > 0) {
    return rootFolder.subfolders;
  }
  return [rootFolder];
}

export async function pickAndReadDirectory(): Promise<DirectoryReadResult> {
  try {
    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
    const rootFolder = await readDirectoryHandle(handle);
    const rootName = handle.name;
    const isRootFlat = rootFolder.subfolders.length === 0;

    if (!isRootFlat) {
      return { rootName, folders: rootFolder.subfolders, handle, isRootFlat };
    }
    return { rootName, folders: [rootFolder], handle, isRootFlat };
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { rootName: '', folders: [], handle: null as any, isRootFlat: false };
    }
    throw err;
  }
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
