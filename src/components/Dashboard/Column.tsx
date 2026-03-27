import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Upload, Plus, Loader2, Filter, X } from 'lucide-react';
import type { Folder, FileItem } from '../../types';
import { FileCard } from './FileCard';
import { useApp } from '../../context/AppContext';
import { readDroppedFiles } from '../../lib/fileReader';
import { useState, useMemo } from 'react';
import type { DragEvent } from 'react';
import { getTagColor } from '../TagEditor';

interface ColumnProps {
  folder: Folder;
  onFileClick: (file: FileItem, folderId?: string) => void;
  onCreateFile: (folderId: string) => void;
}

export function Column({ folder, onFileClick, onCreateFile }: ColumnProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDropLoading, setIsDropLoading] = useState(false);
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [showTagFilter, setShowTagFilter] = useState(false);

  // Collect all unique tags from files in this column
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    for (const file of folder.files) {
      if (file.tags) file.tags.forEach((t) => tags.add(t));
    }
    return Array.from(tags).sort();
  }, [folder.files]);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `column::${folder.id}`,
    data: { type: 'column', folderId: folder.id },
  });

  const { setNodeRef: setDropRef } = useDroppable({
    id: `droppable::${folder.id}`,
    data: { type: 'column-drop', folderId: folder.id },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const fileIds = folder.files.map((f) => `${folder.id}::${f.id}`);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files.length > 0) {
      setIsDropLoading(true);
      try {
        const files = await readDroppedFiles(e.dataTransfer);
        if (files.length > 0) {
          dispatch({
            type: 'ADD_FILES_TO_FOLDER',
            payload: { folderId: folder.id, files },
          });
        }
      } finally {
        setIsDropLoading(false);
      }
    }
  };

  const filteredCount = activeTagFilter
    ? folder.files.filter((f) => f.tags?.includes(activeTagFilter)).length
    : folder.files.length;

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={`w-72 shrink-0 flex flex-col rounded-lg border max-h-full transition-colors ${
        isDark
          ? 'bg-gray-800 border-gray-700'
          : 'bg-white border-gray-200 shadow-sm'
      }`}
      role="region"
      aria-label={`Colonne ${folder.displayName}`}
    >
      {/* Column header */}
      <div
        className={`flex items-center gap-2 px-3 py-2.5 rounded-t-lg border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}
        style={{ backgroundColor: folder.color + (isDark ? '20' : '15') }}
      >
        <button
          {...attributes}
          {...listeners}
          className={`shrink-0 cursor-grab active:cursor-grabbing ${
            isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'
          }`}
          aria-label={`Deplacer la colonne ${folder.displayName}`}
        >
          <GripHorizontal size={14} />
        </button>
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        <h3 className={`text-sm font-semibold truncate flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          {folder.displayName}
        </h3>
        <span className={`text-xs shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {activeTagFilter ? `${filteredCount}/${folder.files.length}` : folder.files.length}
        </span>
        {allTags.length > 0 && (
          <button
            onClick={() => setShowTagFilter(!showTagFilter)}
            className={`shrink-0 transition-colors p-0.5 rounded ${
              activeTagFilter
                ? 'text-indigo-400'
                : isDark
                  ? 'text-gray-400 hover:text-white hover:bg-gray-600'
                  : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
            }`}
            aria-label="Filtrer par tag"
          >
            <Filter size={12} />
          </button>
        )}
        <button
          onClick={() => onCreateFile(folder.id)}
          className={`shrink-0 transition-colors p-0.5 rounded ${
            isDark
              ? 'text-gray-400 hover:text-white hover:bg-gray-600'
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-200'
          }`}
          aria-label={`Nouveau fichier dans ${folder.displayName}`}
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Tag filter bar */}
      {showTagFilter && allTags.length > 0 && (
        <div className={`px-2 py-1.5 flex items-center gap-1 flex-wrap border-b ${
          isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'
        }`}>
          {activeTagFilter && (
            <button
              onClick={() => setActiveTagFilter(null)}
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
              }`}
            >
              <X size={8} />
              Tous
            </button>
          )}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
              className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                activeTagFilter === tag ? 'ring-2 ring-white/30 scale-105' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: getTagColor(tag) + 'cc', color: 'white' }}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* File list */}
      <div
        ref={setDropRef}
        className={`flex-1 overflow-y-auto p-2 space-y-1 min-h-[60px] transition-colors ${
          isDragOver ? 'bg-indigo-500/10 ring-2 ring-indigo-500/30 ring-inset rounded-b-lg' : ''
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <SortableContext items={fileIds} strategy={verticalListSortingStrategy}>
          {folder.files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              folderId={folder.id}
              onClick={() => onFileClick(file, folder.id)}
              tagFilter={activeTagFilter}
            />
          ))}
        </SortableContext>

        {isDropLoading && (
          <div className="flex flex-col items-center justify-center py-4 text-indigo-400 text-xs">
            <Loader2 size={16} className="animate-spin mb-1" />
            <p>Importation...</p>
          </div>
        )}

        {folder.files.length === 0 && !isDropLoading && (
          <div className={`flex flex-col items-center justify-center py-4 text-xs ${
            isDark ? 'text-gray-500' : 'text-gray-400'
          }`}>
            <Upload size={16} className="mb-1" />
            <p>Glissez des fichiers .md ici</p>
          </div>
        )}
      </div>
    </div>
  );
}
