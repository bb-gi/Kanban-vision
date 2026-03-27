import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, GripVertical, Trash2, GitBranch } from 'lucide-react';
import type { FileItem } from '../../types';
import { useApp } from '../../context/AppContext';

interface FileCardProps {
  file: FileItem;
  folderId: string;
  onClick: () => void;
}

export function FileCard({ file, folderId, onClick }: FileCardProps) {
  const { dispatch } = useApp();
  const sortableId = `${folderId}::${file.id}`;
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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 bg-gray-700/50 hover:bg-gray-700 rounded px-2 py-1.5 cursor-pointer group transition-colors border border-gray-600/50"
      onClick={onClick}
    >
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 text-gray-500 hover:text-gray-300 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical size={12} />
      </button>
      {file.gitlabIssueIid ? (
        <GitBranch size={14} className="shrink-0 text-orange-400" />
      ) : (
        <FileText size={14} className="shrink-0 text-gray-400" />
      )}
      <span className="text-sm text-gray-200 truncate flex-1">
        {file.gitlabIssueIid ? `#${file.gitlabIssueIid} ` : ''}
        {file.title.replace(/\.md$/, '')}
      </span>
      <button
        onClick={handleDelete}
        className="shrink-0 p-1 text-gray-400 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
        title="Supprimer"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
