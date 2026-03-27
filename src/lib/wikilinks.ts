import type { FileItem, Folder } from '../types';

export interface WikiLink {
  from: string; // file id
  to: string;   // file id
  fromTitle: string;
  toTitle: string;
}

export interface FileNode {
  id: string;
  title: string;
  folderId: string;
  folderName: string;
  links: string[]; // file ids this links to
  backlinks: string[]; // file ids that link to this
}

// Extract [[wikilink]] patterns from content
export function extractWikiLinks(content: string): string[] {
  const regex = /\[\[([^\]]+)\]\]/g;
  const links: string[] = [];
  let match;
  while ((match = regex.exec(content)) !== null) {
    links.push(match[1].trim());
  }
  return links;
}

// Build a graph of file connections
export function buildFileGraph(folders: Folder[]): { nodes: FileNode[]; edges: WikiLink[] } {
  const nodes: FileNode[] = [];
  const edges: WikiLink[] = [];

  // Collect all files with folder info
  function traverse(folders: Folder[]) {
    for (const folder of folders) {
      for (const file of folder.files) {
        nodes.push({
          id: file.id,
          title: file.title.replace(/\.md$/, ''),
          folderId: folder.id,
          folderName: folder.displayName,
          links: [],
          backlinks: [],
        });
      }
      traverse(folder.subfolders);
    }
  }
  traverse(folders);

  // Build title-to-id map
  const titleMap = new Map<string, string>();
  for (const node of nodes) {
    titleMap.set(node.title.toLowerCase(), node.id);
  }

  // Extract links
  function getFiles(folders: Folder[]): FileItem[] {
    const files: FileItem[] = [];
    for (const folder of folders) {
      files.push(...folder.files);
      files.push(...getFiles(folder.subfolders));
    }
    return files;
  }

  const allFiles = getFiles(folders);

  for (const file of allFiles) {
    const wikilinks = extractWikiLinks(file.content);
    const sourceNode = nodes.find((n) => n.id === file.id);
    if (!sourceNode) continue;

    for (const linkText of wikilinks) {
      const targetId = titleMap.get(linkText.toLowerCase());
      if (targetId && targetId !== file.id) {
        sourceNode.links.push(targetId);
        const targetNode = nodes.find((n) => n.id === targetId);
        if (targetNode) {
          targetNode.backlinks.push(file.id);
        }
        edges.push({
          from: file.id,
          to: targetId,
          fromTitle: sourceNode.title,
          toTitle: targetNode?.title || linkText,
        });
      }
    }
  }

  return { nodes, edges };
}
