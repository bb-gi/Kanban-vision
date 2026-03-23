import { useState, useCallback } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
} from '@dnd-kit/core';
import type { DragEndEvent, DragOverEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { LayoutDashboard } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { findFolderById } from '../../lib/folderUtils';
import { Column } from './Column';
import { MarkdownViewer } from '../MarkdownViewer';
import { MarkdownEditor } from '../MarkdownEditor';
import type { FileItem, Folder } from '../../types';

function findFolderAcrossProjects(state: { projects: { folders: Folder[] }[] }, id: string): Folder | null {
  for (const project of state.projects) {
    const found = findFolderById(project.folders, id);
    if (found) return found;
  }
  return null;
}

export function Dashboard() {
  const { state, dispatch } = useApp();
  const [selectedFile, setSelectedFile] = useState<FileItem | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null>(null);

  const handleSaveNewFile = useCallback((folderId: string, file: FileItem) => {
    dispatch({
      type: 'ADD_FILES_TO_FOLDER',
      payload: { folderId, files: [file] },
    });
  }, [dispatch]);

  const activeBoard = state.boards.find((b) => b.id === state.activeBoardId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const columns = activeBoard
    ? activeBoard.columnLayout
        .map((id) => findFolderAcrossProjects(state, id))
        .filter((f): f is NonNullable<typeof f> => f !== null)
    : [];

  const columnIds = columns.map((c) => `column::${c.id}`);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over || !activeBoard) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      if (!activeData || activeData.type !== 'file') return;

      // Determine target folder
      let targetFolderId: string | null = null;

      if (overData?.type === 'file') {
        targetFolderId = overData.folderId;
      } else if (overData?.type === 'column-drop') {
        targetFolderId = overData.folderId;
      }

      if (targetFolderId && targetFolderId !== activeData.folderId) {
        dispatch({
          type: 'MOVE_FILE',
          payload: {
            fileId: activeData.fileId,
            fromFolderId: activeData.folderId,
            toFolderId: targetFolderId,
          },
        });
      }
    },
    [activeBoard, dispatch]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over || !activeBoard) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Column reorder
      if (activeData?.type === 'column' && overData?.type === 'column') {
        const oldIndex = activeBoard.columnLayout.indexOf(activeData.folderId);
        const newIndex = activeBoard.columnLayout.indexOf(overData.folderId);
        if (oldIndex !== newIndex) {
          dispatch({
            type: 'REORDER_COLUMNS',
            payload: {
              boardId: activeBoard.id,
              columnLayout: arrayMove(activeBoard.columnLayout, oldIndex, newIndex),
            },
          });
        }
        return;
      }

      // File reorder within same column
      if (activeData?.type === 'file' && overData?.type === 'file') {
        if (activeData.folderId === overData.folderId) {
          const folder = findFolderAcrossProjects(state, activeData.folderId);
          if (folder) {
            const oldIndex = folder.files.findIndex((f) => f.id === activeData.fileId);
            const newIndex = folder.files.findIndex((f) => f.id === overData.fileId);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              dispatch({
                type: 'REORDER_FILES',
                payload: {
                  folderId: activeData.folderId,
                  fileIds: arrayMove(
                    folder.files.map((f) => f.id),
                    oldIndex,
                    newIndex
                  ),
                },
              });
            }
          }
        }
      }
    },
    [activeBoard, state.projects, dispatch]
  );

  // No board selected
  if (!activeBoard) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-950">
        <LayoutDashboard size={48} className="mb-4 text-gray-600" />
        <p className="text-lg text-gray-400">Aucun tableau sélectionné</p>
        <p className="text-sm mt-1">
          Créez un tableau dans la sidebar pour commencer
        </p>
      </div>
    );
  }

  // Board with no columns
  if (columns.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 bg-gray-950">
        <LayoutDashboard size={48} className="mb-4 text-gray-600" />
        <p className="text-lg text-gray-400">{activeBoard.name}</p>
        <p className="text-sm mt-1">
          Cochez des dossiers dans l'explorateur pour les ajouter comme colonnes
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-gray-950 flex flex-col overflow-hidden">
      {/* Board name header */}
      <div className="px-6 py-3 border-b border-gray-800">
        <h2 className="text-lg font-semibold text-white">{activeBoard.name}</h2>
      </div>

      {/* Columns area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-4">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={columnIds} strategy={horizontalListSortingStrategy}>
            <div className="flex gap-4 h-full items-start">
              {columns.map((folder) => (
                <Column
                  key={folder.id}
                  folder={folder}
                  onFileClick={setSelectedFile}
                  onCreateFile={setCreatingInFolderId}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeId ? (
              <div className="bg-gray-700 rounded px-3 py-2 text-sm text-white shadow-xl opacity-80">
                Déplacement...
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Markdown viewer modal */}
      {selectedFile && (
        <MarkdownViewer
          file={selectedFile}
          onClose={() => setSelectedFile(null)}
        />
      )}

      {/* Markdown editor modal */}
      {creatingInFolderId && (
        <MarkdownEditor
          folderId={creatingInFolderId}
          onClose={() => setCreatingInFolderId(null)}
          onSave={handleSaveNewFile}
        />
      )}
    </div>
  );
}
