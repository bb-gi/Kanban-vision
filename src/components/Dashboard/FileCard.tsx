import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, Trash2, GitBranch } from 'lucide-react';
import type { FileItem } from '../../types';
import { useApp } from '../../context/AppContext';
import { TagEditor } from '../TagEditor';

interface FileCardProps {
  file: FileItem;
  folderId: string;
  onClick: () => void;
  tagFilter?: string | null;
}

function getPreview(content: string): string {
  if (!content) return '';
  const cleaned = content
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/!\[.*?\]\(.*?\)/g, '')
    .replace(/\[([^\]]*)\]\(.*?\)/g, '$1')
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/[*_~]{1,3}/g, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\n{2,}/g, '\n')
    .trim();
  return cleaned.slice(0, 120);
}

export function FileCard({ file, folderId, onClick, tagFilter }: FileCardProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const sortableId = `${folderId}::${file.id}`;
  const tags = file.tags || [];

  // Hide if tag filter is active and doesn't match
  if (tagFilter && !tags.includes(tagFilter)) {
    return null;
  }

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: sortableId,
    data: { type: 'file', fileId: file.id, folderId },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch({ type: 'DELETE_FILE', payload: { folderId, fileId: file.id } });
  };

  const preview = getPreview(file.content);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-1 rounded px-2.5 py-2 cursor-pointer group transition-all duration-150 border animate-cardIn ${
        isDark
          ? 'bg-gray-700/50 hover:bg-gray-700 border-gray-600/50'
          : 'bg-white hover:bg-gray-50 border-gray-200 shadow-sm'
      }`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      aria-label={`Fichier ${file.title}`}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
    >
      <div className="flex items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          className={`shrink-0 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity ${
            isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
          }`}
          onClick={(e) => e.stopPropagation()}
          aria-label="Deplacer le fichier"
        >
          <GripVertical size={12} />
        </button>
        {file.gitlabIssueIid ? (
          <GitBranch size={14} className="shrink-0 text-orange-400" />
        ) : (
          <FileText size={14} className={`shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
        )}
        <span className={`text-sm truncate flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {file.gitlabIssueIid ? `#${file.gitlabIssueIid} ` : ''}
          {file.title.replace(/\.md$/, '')}
        </span>
        <button
          onClick={handleDelete}
          className={`shrink-0 p-1 transition-colors opacity-0 group-hover:opacity-100 ${
            isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'
          }`}
          aria-label={`Supprimer ${file.title}`}
        >
          <Trash2 size={12} />
        </button>
      </div>
      {tags.length > 0 && (
        <div className="pl-6">
          <TagEditor tags={tags} folderId={folderId} fileId={file.id} compact />
        </div>
      )}
      {preview && (
        <p className={`text-xs leading-relaxed line-clamp-2 pl-6 ${
          isDark ? 'text-gray-400' : 'text-gray-500'
        }`}>
          {preview}
        </p>
      )}
      {/* Tag editor on hover */}
      <div className="pl-6 opacity-0 group-hover:opacity-100 transition-opacity">
        <TagEditor tags={tags} folderId={folderId} fileId={file.id} />
      </div>
    </div>
  );
}
