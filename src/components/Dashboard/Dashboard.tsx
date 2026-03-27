import { useState, useCallback, useEffect } from 'react';
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
import { LayoutDashboard, Columns3, List, Grid3X3 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { findFolderById } from '../../lib/folderUtils';
import { Column } from './Column';
import { ListView } from './ListView';
import { GridView } from './GridView';
import { MarkdownViewer } from '../MarkdownViewer';
import { MarkdownEditor } from '../MarkdownEditor';
import type { FileItem, Folder } from '../../types';

type ViewMode = 'kanban' | 'list' | 'grid';

function findFolderAcrossProjects(state: { projects: { folders: Folder[] }[] }, id: string): Folder | null {
  for (const project of state.projects) {
    const found = findFolderById(project.folders, id);
    if (found) return found;
  }
  return null;
}

interface DashboardProps {
  externalViewFile?: FileItem | null;
  externalViewFolderId?: string;
  onClearExternalView?: () => void;
}

export function Dashboard({ externalViewFile, externalViewFolderId, onClearExternalView }: DashboardProps) {
  const { state, dispatch } = useApp();
  const [selectedFile, setSelectedFile] = useState<{ file: FileItem; folderId?: string } | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [creatingInFolderId, setCreatingInFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const isDark = state.theme === 'dark';

  useEffect(() => {
    if (externalViewFile) {
      setSelectedFile({ file: externalViewFile, folderId: externalViewFolderId });
    }
  }, [externalViewFile, externalViewFolderId]);

  const handleFileClick = useCallback((file: FileItem, folderId?: string) => {
    setSelectedFile({ file, folderId });
  }, []);

  const handleCloseViewer = useCallback(() => {
    setSelectedFile(null);
    onClearExternalView?.();
  }, [onClearExternalView]);

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

      let targetFolderId: string | null = null;
      if (overData?.type === 'file') targetFolderId = overData.folderId;
      else if (overData?.type === 'column-drop') targetFolderId = overData.folderId;

      if (targetFolderId && targetFolderId !== activeData.folderId) {
        dispatch({
          type: 'MOVE_FILE',
          payload: { fileId: activeData.fileId, fromFolderId: activeData.folderId, toFolderId: targetFolderId },
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

      if (activeData?.type === 'column' && overData?.type === 'column') {
        const oldIndex = activeBoard.columnLayout.indexOf(activeData.folderId);
        const newIndex = activeBoard.columnLayout.indexOf(overData.folderId);
        if (oldIndex !== newIndex) {
          dispatch({
            type: 'REORDER_COLUMNS',
            payload: { boardId: activeBoard.id, columnLayout: arrayMove(activeBoard.columnLayout, oldIndex, newIndex) },
          });
        }
        return;
      }

      if (activeData?.type === 'file' && overData?.type === 'file') {
        if (activeData.folderId === overData.folderId) {
          const folder = findFolderAcrossProjects(state, activeData.folderId);
          if (folder) {
            const oldIndex = folder.files.findIndex((f) => f.id === activeData.fileId);
            const newIndex = folder.files.findIndex((f) => f.id === overData.fileId);
            if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
              dispatch({
                type: 'REORDER_FILES',
                payload: { folderId: activeData.folderId, fileIds: arrayMove(folder.files.map((f) => f.id), oldIndex, newIndex) },
              });
            }
          }
        }
      }
    },
    [activeBoard, state.projects, dispatch]
  );

  if (!activeBoard) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'text-gray-500 bg-gray-950' : 'text-gray-400 bg-gray-50'}`}>
        <LayoutDashboard size={48} className={`mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Aucun tableau selectionne</p>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Creez un tableau dans la sidebar pour commencer
        </p>
      </div>
    );
  }

  if (columns.length === 0) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center ${isDark ? 'text-gray-500 bg-gray-950' : 'text-gray-400 bg-gray-50'}`}>
        <LayoutDashboard size={48} className={`mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{activeBoard.name}</p>
        <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          Cochez des dossiers dans l'explorateur pour les ajouter comme colonnes
        </p>
      </div>
    );
  }

  const viewButtons: { mode: ViewMode; icon: React.ReactNode; label: string }[] = [
    { mode: 'kanban', icon: <Columns3 size={14} />, label: 'Kanban' },
    { mode: 'list', icon: <List size={14} />, label: 'Liste' },
    { mode: 'grid', icon: <Grid3X3 size={14} />, label: 'Grille' },
  ];

  return (
    <div className={`flex-1 flex flex-col overflow-hidden ${isDark ? 'bg-gray-950' : 'bg-gray-50'}`}>
      {/* Board header with view toggle */}
      <div className={`px-4 sm:px-6 py-3 border-b flex items-center gap-3 ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <h2 className={`text-lg font-semibold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{activeBoard.name}</h2>
        <div className={`flex items-center rounded-lg p-0.5 ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
          {viewButtons.map((v) => (
            <button
              key={v.mode}
              onClick={() => setViewMode(v.mode)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                viewMode === v.mode
                  ? isDark ? 'bg-gray-700 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-600 hover:text-gray-800'
              }`}
              aria-label={`Vue ${v.label}`}
            >
              {v.icon}
              <span className="hidden sm:inline">{v.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'kanban' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden p-4 h-full">
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
                      onFileClick={handleFileClick}
                      onCreateFile={setCreatingInFolderId}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeId ? (
                  <div className="bg-gray-700 rounded px-3 py-2 text-sm text-white shadow-xl opacity-80">
                    Deplacement...
                  </div>
                ) : null}
              </DragOverlay>
            </DndContext>
          </div>
        )}

        {viewMode === 'list' && (
          <ListView columns={columns} onFileClick={handleFileClick} />
        )}

        {viewMode === 'grid' && (
          <GridView columns={columns} onFileClick={handleFileClick} />
        )}
      </div>

      {selectedFile && (
        <MarkdownViewer file={selectedFile.file} folderId={selectedFile.folderId} onClose={handleCloseViewer} />
      )}

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
