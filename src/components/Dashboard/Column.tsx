import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripHorizontal, Upload, Plus } from 'lucide-react';
import type { Folder, FileItem } from '../../types';
import { FileCard } from './FileCard';
import { useApp } from '../../context/AppContext';
import { readDroppedFiles } from '../../lib/fileReader';
import { useState } from 'react';
import type { DragEvent } from 'react';

interface ColumnProps {
  folder: Folder;
  onFileClick: (file: FileItem) => void;
  onCreateFile: (folderId: string) => void;
}

export function Column({ folder, onFileClick, onCreateFile }: ColumnProps) {
  const { dispatch } = useApp();
  const [isDragOver, setIsDragOver] = useState(false);

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

  // Handle OS file drop
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

    // Only process OS file drops (not @dnd-kit internal)
    if (e.dataTransfer.files.length > 0) {
      const files = await readDroppedFiles(e.dataTransfer);
      if (files.length > 0) {
        dispatch({
          type: 'ADD_FILES_TO_FOLDER',
          payload: { folderId: folder.id, files },
        });
      }
    }
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className="w-72 shrink-0 flex flex-col bg-gray-800 rounded-lg border border-gray-700 max-h-full"
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-t-lg border-b border-gray-700"
        style={{ backgroundColor: folder.color + '20' }}
      >
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 text-gray-400 hover:text-gray-200 cursor-grab active:cursor-grabbing"
        >
          <GripHorizontal size={14} />
        </button>
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{ backgroundColor: folder.color }}
        />
        <h3 className="text-sm font-semibold text-white truncate flex-1">
          {folder.displayName}
        </h3>
        <span className="text-xs text-gray-400 shrink-0">
          {folder.files.length}
        </span>
        <button
          onClick={() => onCreateFile(folder.id)}
          className="shrink-0 text-gray-400 hover:text-white transition-colors p-0.5 rounded hover:bg-gray-600"
          title="Nouveau fichier"
        >
          <Plus size={14} />
        </button>
      </div>

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
              onClick={() => onFileClick(file)}
            />
          ))}
        </SortableContext>

        {folder.files.length === 0 && (
          <div className="flex flex-col items-center justify-center py-4 text-gray-500 text-xs">
            <Upload size={16} className="mb-1" />
            <p>Glissez des fichiers .md ici</p>
          </div>
        )}
      </div>
    </div>
  );
}
