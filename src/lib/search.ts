import type { Folder, FileItem } from '../types';

export interface SearchResult {
  file: FileItem;
  folderId: string;
  folderName: string;
  matchType: 'title' | 'content';
}

export function searchFiles(
  folders: Folder[],
  query: string
): SearchResult[] {
  if (!query.trim()) return [];
  const lower = query.toLowerCase();
  const results: SearchResult[] = [];

  function traverse(folders: Folder[]) {
    for (const folder of folders) {
      for (const file of folder.files) {
        const titleMatch = file.title.toLowerCase().includes(lower);
        const contentMatch = file.content.toLowerCase().includes(lower);
        if (titleMatch || contentMatch) {
          results.push({
            file,
            folderId: folder.id,
            folderName: folder.displayName,
            matchType: titleMatch ? 'title' : 'content',
          });
        }
      }
      traverse(folder.subfolders);
    }
  }

  traverse(folders);
  return results;
}

export function getAllFiles(folders: Folder[]): { file: FileItem; folderId: string; folderName: string }[] {
  const results: { file: FileItem; folderId: string; folderName: string }[] = [];

  function traverse(folders: Folder[]) {
    for (const folder of folders) {
      for (const file of folder.files) {
        results.push({ file, folderId: folder.id, folderName: folder.displayName });
      }
      traverse(folder.subfolders);
    }
  }

  traverse(folders);
  return results;
}
