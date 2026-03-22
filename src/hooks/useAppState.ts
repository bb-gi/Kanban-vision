import { useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, AppAction } from '../types';
import { DEFAULT_STATE } from '../types';
import { useLocalStorage } from './useLocalStorage';
import {
  updateFolderById,
  removeFolderById,
  moveFile,
  reorderFiles,
  collectAllFolderIds,
} from '../lib/folderUtils';

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'IMPORT_FOLDERS':
      return {
        ...state,
        folders: [...state.folders, ...action.payload],
      };

    case 'REFRESH_FOLDERS':
      return {
        ...state,
        folders: action.payload,
      };

    case 'ADD_FOLDER': {
      const { name, parentId } = action.payload;
      const newFolder = {
        id: uuidv4(),
        originalName: name,
        displayName: name,
        color: '#6366f1',
        files: [],
        subfolders: [],
      };
      if (parentId) {
        return {
          ...state,
          folders: updateFolderById(state.folders, parentId, (f) => ({
            ...f,
            subfolders: [...f.subfolders, newFolder],
          })),
        };
      }
      return { ...state, folders: [...state.folders, newFolder] };
    }

    case 'RENAME_FOLDER':
      return {
        ...state,
        folders: updateFolderById(state.folders, action.payload.id, (f) => ({
          ...f,
          displayName: action.payload.displayName,
        })),
      };

    case 'SET_COLOR':
      return {
        ...state,
        folders: updateFolderById(state.folders, action.payload.id, (f) => ({
          ...f,
          color: action.payload.color,
        })),
      };

    case 'DELETE_FOLDER': {
      const deletedIds = new Set([action.payload.id]);
      // Collect all child folder IDs too
      const folder = findInFolders(state.folders, action.payload.id);
      if (folder) {
        collectAllFolderIds(folder.subfolders).forEach((id) => deletedIds.add(id));
      }
      return {
        ...state,
        folders: removeFolderById(state.folders, action.payload.id),
        boards: state.boards.map((board) => ({
          ...board,
          columnLayout: board.columnLayout.filter((id) => !deletedIds.has(id)),
        })),
      };
    }

    case 'MOVE_FILE':
      return {
        ...state,
        folders: moveFile(
          state.folders,
          action.payload.fileId,
          action.payload.fromFolderId,
          action.payload.toFolderId,
          action.payload.index
        ),
      };

    case 'REORDER_FILES':
      return {
        ...state,
        folders: reorderFiles(
          state.folders,
          action.payload.folderId,
          action.payload.fileIds
        ),
      };

    case 'CREATE_BOARD': {
      const newBoard = {
        id: uuidv4(),
        name: action.payload.name,
        columnLayout: [],
      };
      return {
        ...state,
        boards: [...state.boards, newBoard],
        activeBoardId: newBoard.id,
      };
    }

    case 'RENAME_BOARD':
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? { ...b, name: action.payload.name }
            : b
        ),
      };

    case 'DELETE_BOARD': {
      const remaining = state.boards.filter((b) => b.id !== action.payload.boardId);
      return {
        ...state,
        boards: remaining,
        activeBoardId:
          state.activeBoardId === action.payload.boardId
            ? remaining[0]?.id ?? null
            : state.activeBoardId,
      };
    }

    case 'SET_ACTIVE_BOARD':
      return { ...state, activeBoardId: action.payload.boardId };

    case 'TOGGLE_COLUMN': {
      const { boardId, folderId } = action.payload;
      return {
        ...state,
        boards: state.boards.map((b) => {
          if (b.id !== boardId) return b;
          const has = b.columnLayout.includes(folderId);
          return {
            ...b,
            columnLayout: has
              ? b.columnLayout.filter((id) => id !== folderId)
              : [...b.columnLayout, folderId],
          };
        }),
      };
    }

    case 'REORDER_COLUMNS':
      return {
        ...state,
        boards: state.boards.map((b) =>
          b.id === action.payload.boardId
            ? { ...b, columnLayout: action.payload.columnLayout }
            : b
        ),
      };

    case 'ADD_FILES_TO_FOLDER':
      return {
        ...state,
        folders: updateFolderById(state.folders, action.payload.folderId, (f) => ({
          ...f,
          files: [...f.files, ...action.payload.files],
        })),
      };

    default:
      return state;
  }
}

function findInFolders(folders: AppState['folders'], id: string): AppState['folders'][0] | null {
  for (const f of folders) {
    if (f.id === id) return f;
    const found = findInFolders(f.subfolders, id);
    if (found) return found;
  }
  return null;
}

export function useAppState() {
  const [persisted, setPersisted] = useLocalStorage<AppState>(
    'kanban-vision-data',
    DEFAULT_STATE
  );
  const [state, dispatch] = useReducer(appReducer, persisted);

  // Sync reducer state back to localStorage
  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  return { state, dispatch };
}
