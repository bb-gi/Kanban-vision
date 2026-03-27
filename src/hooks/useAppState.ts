import { useReducer, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, AppAction, Folder } from '../types';
import { DEFAULT_STATE } from '../types';
import { useIndexedDB } from './useIndexedDB';
import { useHistory } from './useHistory';
import {
  updateFolderById,
  removeFolderById,
  moveFile,
  reorderFiles,
  collectAllFolderIds,
} from '../lib/folderUtils';

// Actions that should be tracked in undo history
const UNDOABLE_ACTIONS = new Set([
  'DELETE_PROJECT', 'RENAME_PROJECT', 'DELETE_FOLDER', 'RENAME_FOLDER',
  'MOVE_FILE', 'REORDER_FILES', 'DELETE_BOARD', 'RENAME_BOARD',
  'TOGGLE_COLUMN', 'REORDER_COLUMNS', 'ADD_FILES_TO_FOLDER',
  'DELETE_FILE', 'IMPORT_PROJECT', 'CREATE_BOARD', 'ADD_FOLDER',
  'SET_FILE_TAGS', 'CREATE_BOARD_FROM_TEMPLATE',
  'UPDATE_FILE', 'SET_FILE_DUE_DATE', 'DUPLICATE_FILE',
]);

// Helper: apply a folder operation across all projects
function mapAllFolders(
  state: AppState,
  fn: (folders: Folder[]) => Folder[]
): AppState {
  return {
    ...state,
    projects: state.projects.map((p) => ({
      ...p,
      folders: fn(p.folders),
    })),
  };
}

// Helper: find a folder across all projects
function findInAllProjects(state: AppState, id: string): Folder | null {
  for (const project of state.projects) {
    const found = findInFolders(project.folders, id);
    if (found) return found;
  }
  return null;
}

function findInFolders(folders: Folder[], id: string): Folder | null {
  for (const f of folders) {
    if (f.id === id) return f;
    const found = findInFolders(f.subfolders, id);
    if (found) return found;
  }
  return null;
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    // === Project actions ===
    case 'IMPORT_PROJECT': {
      const newProject = {
        id: uuidv4(),
        name: action.payload.name,
        color: action.payload.color,
        folders: action.payload.folders,
      };
      return {
        ...state,
        projects: [...state.projects, newProject],
        activeProjectId: newProject.id,
      };
    }

    case 'DELETE_PROJECT': {
      // Collect all folder IDs from this project to clean boards
      const project = state.projects.find((p) => p.id === action.payload.projectId);
      const folderIds = project ? new Set(collectAllFolderIds(project.folders)) : new Set<string>();
      const remaining = state.projects.filter((p) => p.id !== action.payload.projectId);
      return {
        ...state,
        projects: remaining,
        activeProjectId:
          state.activeProjectId === action.payload.projectId
            ? remaining[0]?.id ?? null
            : state.activeProjectId,
        boards: state.boards.map((board) => ({
          ...board,
          columnLayout: board.columnLayout.filter((id) => !folderIds.has(id)),
        })),
      };
    }

    case 'RENAME_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, name: action.payload.name }
            : p
        ),
      };

    case 'SET_PROJECT_COLOR':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, color: action.payload.color }
            : p
        ),
      };

    case 'SET_ACTIVE_PROJECT':
      return { ...state, activeProjectId: action.payload.projectId };

    case 'REFRESH_PROJECT':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, folders: action.payload.folders }
            : p
        ),
      };

    // === Folder actions (operate across all projects) ===
    case 'ADD_FOLDER': {
      const { projectId, name, parentId } = action.payload;
      const newFolder: Folder = {
        id: uuidv4(),
        originalName: name,
        displayName: name,
        color: '#6366f1',
        files: [],
        subfolders: [],
      };
      if (parentId) {
        return mapAllFolders(state, (folders) =>
          updateFolderById(folders, parentId, (f) => ({
            ...f,
            subfolders: [...f.subfolders, newFolder],
          }))
        );
      }
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, folders: [...p.folders, newFolder] }
            : p
        ),
      };
    }

    case 'RENAME_FOLDER':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.id, (f) => ({
          ...f,
          displayName: action.payload.displayName,
        }))
      );

    case 'SET_COLOR':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.id, (f) => ({
          ...f,
          color: action.payload.color,
        }))
      );

    case 'DELETE_FOLDER': {
      const deletedIds = new Set([action.payload.id]);
      const folder = findInAllProjects(state, action.payload.id);
      if (folder) {
        collectAllFolderIds(folder.subfolders).forEach((id) => deletedIds.add(id));
      }
      const updated = mapAllFolders(state, (folders) =>
        removeFolderById(folders, action.payload.id)
      );
      return {
        ...updated,
        boards: updated.boards.map((board) => ({
          ...board,
          columnLayout: board.columnLayout.filter((id) => !deletedIds.has(id)),
        })),
      };
    }

    case 'MOVE_FILE':
      return mapAllFolders(state, (folders) =>
        moveFile(
          folders,
          action.payload.fileId,
          action.payload.fromFolderId,
          action.payload.toFolderId,
          action.payload.index
        )
      );

    case 'REORDER_FILES':
      return mapAllFolders(state, (folders) =>
        reorderFiles(
          folders,
          action.payload.folderId,
          action.payload.fileIds
        )
      );

    // === Board actions ===
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
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => ({
          ...f,
          files: [...f.files, ...action.payload.files],
        }))
      );

    case 'DELETE_FILE':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => ({
          ...f,
          files: f.files.filter((file) => file.id !== action.payload.fileId),
        }))
      );

    // === GitLab actions ===
    case 'SET_GITLAB_CONFIG':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, gitlabConfig: action.payload.config }
            : p
        ),
      };

    case 'REMOVE_GITLAB_CONFIG':
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === action.payload.projectId
            ? { ...p, gitlabConfig: undefined }
            : p
        ),
      };

    case 'SET_FOLDER_GITLAB_LABEL':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => ({
          ...f,
          gitlabLabel: action.payload.label || undefined,
        }))
      );

    case 'SYNC_GITLAB_ISSUES': {
      const { projectId, folderId, files } = action.payload;
      return {
        ...state,
        projects: state.projects.map((p) => {
          if (p.id !== projectId) return p;
          return {
            ...p,
            folders: updateFolderById(p.folders, folderId, (f) => {
              // Merge: keep existing non-gitlab files, update existing gitlab files, add new ones
              const existingGitlabMap = new Map(
                f.files
                  .filter((file) => file.gitlabIssueIid !== undefined)
                  .map((file) => [file.gitlabIssueIid!, file])
              );
              const nonGitlabFiles = f.files.filter((file) => file.gitlabIssueIid === undefined);
              const mergedGitlabFiles = files.map((newFile) => {
                const existing = newFile.gitlabIssueIid !== undefined
                  ? existingGitlabMap.get(newFile.gitlabIssueIid)
                  : undefined;
                if (existing) {
                  return { ...existing, title: newFile.title, content: newFile.content };
                }
                return newFile;
              });
              return { ...f, files: [...nonGitlabFiles, ...mergedGitlabFiles] };
            }),
          };
        }),
      };
    }

    case 'UPDATE_FILE':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => ({
          ...f,
          files: f.files.map((file) =>
            file.id === action.payload.fileId
              ? { ...file, title: action.payload.title, content: action.payload.content }
              : file
          ),
        }))
      );

    case 'SET_FILE_DUE_DATE':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => ({
          ...f,
          files: f.files.map((file) =>
            file.id === action.payload.fileId
              ? { ...file, dueDate: action.payload.dueDate }
              : file
          ),
        }))
      );

    case 'DUPLICATE_FILE': {
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => {
          const original = f.files.find((file) => file.id === action.payload.fileId);
          if (!original) return f;
          const copy = {
            ...original,
            id: uuidv4(),
            title: original.title.replace(/\.md$/, ' (copie).md'),
            dueDate: undefined,
          };
          return { ...f, files: [...f.files, copy] };
        })
      );
    }

    case 'SET_FILE_TAGS':
      return mapAllFolders(state, (folders) =>
        updateFolderById(folders, action.payload.folderId, (f) => ({
          ...f,
          files: f.files.map((file) =>
            file.id === action.payload.fileId
              ? { ...file, tags: action.payload.tags }
              : file
          ),
        }))
      );

    case 'CREATE_BOARD_FROM_TEMPLATE': {
      const { name, columns } = action.payload;
      const projectId = state.activeProjectId || uuidv4();
      const newFolders: Folder[] = columns.map((col) => ({
        id: uuidv4(),
        originalName: col.name,
        displayName: col.name,
        color: col.color,
        files: [],
        subfolders: [],
      }));
      const newBoard = {
        id: uuidv4(),
        name,
        columnLayout: newFolders.map((f) => f.id),
      };
      // If no active project, create one
      const hasProject = state.projects.some((p) => p.id === projectId);
      if (!hasProject) {
        const newProject = {
          id: projectId,
          name,
          color: columns[0]?.color || '#6366f1',
          folders: newFolders,
        };
        return {
          ...state,
          projects: [...state.projects, newProject],
          boards: [...state.boards, newBoard],
          activeBoardId: newBoard.id,
          activeProjectId: projectId,
        };
      }
      // Add folders to existing project
      return {
        ...state,
        projects: state.projects.map((p) =>
          p.id === projectId
            ? { ...p, folders: [...p.folders, ...newFolders] }
            : p
        ),
        boards: [...state.boards, newBoard],
        activeBoardId: newBoard.id,
      };
    }

    case 'SET_THEME':
      return { ...state, theme: action.payload.theme };

    case 'RESTORE_STATE':
      return action.payload;

    default:
      return state;
  }
}

export function useAppState() {
  const [persisted, setPersisted, isLoaded] = useIndexedDB<AppState>(
    'kanban-vision-data',
    DEFAULT_STATE
  );
  // Ensure theme field exists for old persisted data
  const initialState: AppState = { ...DEFAULT_STATE, ...persisted, theme: persisted.theme ?? 'dark' };
  const [state, rawDispatch] = useReducer(appReducer, initialState);
  const hasHydratedRef = useRef(false);

  // Hydrate from IndexedDB when loaded
  useEffect(() => {
    if (isLoaded && !hasHydratedRef.current) {
      hasHydratedRef.current = true;
      const hydrated: AppState = { ...DEFAULT_STATE, ...persisted, theme: persisted.theme ?? 'dark' };
      rawDispatch({ type: 'RESTORE_STATE', payload: hydrated });
    }
  }, [isLoaded, persisted]);
  const history = useHistory();
  const stateRef = useRef(state);
  stateRef.current = state;

  const dispatch = useCallback(
    (action: AppAction) => {
      if (UNDOABLE_ACTIONS.has(action.type)) {
        history.push(stateRef.current);
      }
      rawDispatch(action);
    },
    [history]
  );

  const undo = useCallback(() => {
    const prev = history.undo(stateRef.current);
    if (prev) rawDispatch({ type: 'RESTORE_STATE', payload: prev });
  }, [history]);

  const redo = useCallback(() => {
    const next = history.redo(stateRef.current);
    if (next) rawDispatch({ type: 'RESTORE_STATE', payload: next });
  }, [history]);

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  return { state, dispatch, undo, redo, canUndo: history.canUndo, canRedo: history.canRedo };
}
