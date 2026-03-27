import { FileText, GitBranch, FolderOpen, Trash2 } from 'lucide-react';
import type { FileItem, Folder } from '../../types';
import { useApp } from '../../context/AppContext';
import { TagEditor } from '../TagEditor';

interface ListViewProps {
  columns: Folder[];
  onFileClick: (file: FileItem, folderId?: string) => void;
}

function getPreview(content: string): string {
  if (!content) return '';
  return content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/\n{2,}/g, ' ')
    .trim()
    .slice(0, 200);
}

export function ListView({ columns, onFileClick }: ListViewProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';

  return (
    <div className="space-y-1 p-4 max-w-4xl mx-auto">
      {columns.map((folder) => (
        <div key={folder.id} className="mb-4">
          <div className="flex items-center gap-2 mb-2 px-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: folder.color }} />
            <h3 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {folder.displayName}
            </h3>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {folder.files.length} fichiers
            </span>
          </div>
          {folder.files.map((file) => {
            const preview = getPreview(file.content);
            const tags = file.tags || [];
            return (
              <div
                key={file.id}
                onClick={() => onFileClick(file, folder.id)}
                className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors group ${
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-100'
                }`}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onFileClick(file, folder.id); }}
              >
                {file.gitlabIssueIid ? (
                  <GitBranch size={16} className="shrink-0 mt-0.5 text-orange-400" />
                ) : (
                  <FileText size={16} className={`shrink-0 mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {file.title.replace(/\.md$/, '')}
                    </span>
                    <FolderOpen size={10} className={isDark ? 'text-gray-600' : 'text-gray-400'} />
                    <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                      {folder.displayName}
                    </span>
                  </div>
                  {preview && (
                    <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {preview}
                    </p>
                  )}
                  {tags.length > 0 && (
                    <div className="mt-1">
                      <TagEditor tags={tags} folderId={folder.id} fileId={file.id} compact />
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({ type: 'DELETE_FILE', payload: { folderId: folder.id, fileId: file.id } });
                  }}
                  className={`shrink-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    isDark ? 'text-gray-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
                  }`}
                  aria-label={`Supprimer ${file.title}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
          {folder.files.length === 0 && (
            <p className={`px-3 py-2 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
              Aucun fichier
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
