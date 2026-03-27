import { v4 as uuidv4 } from 'uuid';
import type { Folder, FileItem } from '../types';
import { getNextColor } from './folderUtils';

export interface DirectoryReadResult {
  rootName: string;
  folders: Folder[];
}

// Check if File System Access API is available
export function hasFileSystemAccess(): boolean {
  return typeof (window as any).showDirectoryPicker === 'function';
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

// Modern File System Access API (Chrome/Edge)
async function pickDirectoryModern(): Promise<DirectoryReadResult> {
  const handle = await (window as any).showDirectoryPicker();
  const rootFolder = await readDirectoryHandle(handle);
  const rootName = handle.name;

  if (rootFolder.subfolders.length > 0) {
    return { rootName, folders: rootFolder.subfolders };
  }
  return { rootName, folders: [rootFolder] };
}

// Fallback for Safari/Firefox using <input webkitdirectory>
function pickDirectoryFallback(): Promise<DirectoryReadResult> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', '');
    input.setAttribute('directory', '');
    input.multiple = true;
    input.accept = '.md';

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        resolve({ rootName: '', folders: [] });
        return;
      }

      try {
        const fileList = Array.from(input.files);
        // Build folder structure from relative paths
        const folderMap = new Map<string, Folder>();
        let rootName = '';

        for (const file of fileList) {
          if (!file.name.endsWith('.md')) continue;

          const relativePath = (file as any).webkitRelativePath as string;
          if (!relativePath) continue;

          const parts = relativePath.split('/');
          if (!rootName && parts.length > 0) rootName = parts[0];

          // Get the folder path (excluding root and filename)
          const folderPath = parts.length > 2
            ? parts.slice(1, -1).join('/')
            : parts.length > 1
              ? parts.slice(1, -1).join('/') || parts[1] === file.name ? '' : parts[1]
              : '';

          const folderKey = folderPath || '__root__';

          if (!folderMap.has(folderKey)) {
            const displayName = folderPath
              ? folderPath.split('/').pop() || folderPath
              : rootName;
            folderMap.set(folderKey, {
              id: uuidv4(),
              originalName: displayName,
              displayName,
              color: getNextColor(),
              files: [],
              subfolders: [],
            });
          }

          const content = await file.text();
          folderMap.get(folderKey)!.files.push({
            id: uuidv4(),
            title: file.name,
            content,
          });
        }

        // Sort files in each folder
        for (const folder of folderMap.values()) {
          folder.files.sort((a, b) => a.title.localeCompare(b.title));
        }

        const folders = Array.from(folderMap.values());
        resolve({ rootName: rootName || 'Imported', folders });
      } catch (err) {
        reject(err);
      }
    };

    input.oncancel = () => resolve({ rootName: '', folders: [] });

    // Timeout fallback for browsers that don't fire oncancel
    input.click();
  });
}

export async function pickAndReadDirectory(): Promise<DirectoryReadResult> {
  try {
    if (hasFileSystemAccess()) {
      return await pickDirectoryModern();
    }
    return await pickDirectoryFallback();
  } catch (err) {
    if ((err as Error).name === 'AbortError') {
      return { rootName: '', folders: [] };
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

// Import multiple .md files via file picker (works on all browsers)
export function pickMarkdownFiles(): Promise<FileItem[]> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = '.md,text/markdown';

    input.onchange = async () => {
      if (!input.files || input.files.length === 0) {
        resolve([]);
        return;
      }

      const files: FileItem[] = [];
      for (const file of Array.from(input.files)) {
        if (file.name.endsWith('.md')) {
          const content = await file.text();
          files.push({
            id: uuidv4(),
            title: file.name,
            content,
          });
        }
      }
      resolve(files);
    };

    input.oncancel = () => resolve([]);
    input.click();
  });
}
