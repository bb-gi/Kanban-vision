import { FileText, GitBranch } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { FileItem, Folder } from '../../types';
import { useApp } from '../../context/AppContext';
import { TagEditor } from '../TagEditor';

interface GridViewProps {
  columns: Folder[];
  onFileClick: (file: FileItem, folderId?: string) => void;
}

export function GridView({ columns, onFileClick }: GridViewProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';

  const allFiles = columns.flatMap((folder) =>
    folder.files.map((file) => ({ file, folder }))
  );

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {allFiles.map(({ file, folder }) => {
          const tags = file.tags || [];
          return (
            <div
              key={file.id}
              onClick={() => onFileClick(file, folder.id)}
              className={`rounded-lg border cursor-pointer transition-all hover:scale-[1.01] group ${
                isDark
                  ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm hover:shadow'
              }`}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter') onFileClick(file, folder.id); }}
            >
              {/* Card header */}
              <div className={`flex items-center gap-2 px-3 py-2 border-b ${
                isDark ? 'border-gray-700' : 'border-gray-200'
              }`}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: folder.color }} />
                {file.gitlabIssueIid ? (
                  <GitBranch size={14} className="shrink-0 text-orange-400" />
                ) : (
                  <FileText size={14} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                )}
                <span className={`text-sm font-medium truncate flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                  {file.title.replace(/\.md$/, '')}
                </span>
              </div>

              {/* Card body - markdown preview */}
              <div className="px-3 py-2 h-32 overflow-hidden">
                <div className={`prose prose-sm max-w-none text-xs leading-relaxed ${
                  isDark ? 'prose-invert text-gray-400' : 'text-gray-500'
                }`} style={{ fontSize: '11px' }}>
                  <ReactMarkdown>{file.content.slice(0, 500)}</ReactMarkdown>
                </div>
                <div className={`h-8 bg-gradient-to-t ${
                  isDark ? 'from-gray-800' : 'from-white'
                } absolute bottom-0 left-0 right-0`} style={{ position: 'relative', marginTop: '-32px' }} />
              </div>

              {/* Tags */}
              {tags.length > 0 && (
                <div className={`px-3 py-1.5 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <TagEditor tags={tags} folderId={folder.id} fileId={file.id} compact />
                </div>
              )}
            </div>
          );
        })}
      </div>
      {allFiles.length === 0 && (
        <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Aucun fichier a afficher
        </p>
      )}
    </div>
  );
}
