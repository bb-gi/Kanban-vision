import { useReducer, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { AppState, AppAction, Folder } from '../types';
import { DEFAULT_STATE } from '../types';
import { useLocalStorage } from './useLocalStorage';
import {
  updateFolderById,
  removeFolderById,
  moveFile,
  reorderFiles,
  collectAllFolderIds,
} from '../lib/folderUtils';

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

    default:
      return state;
  }
}

export function useAppState() {
  const [persisted, setPersisted] = useLocalStorage<AppState>(
    'kanban-vision-data',
    DEFAULT_STATE
  );
  const [state, dispatch] = useReducer(appReducer, persisted);

  useEffect(() => {
    setPersisted(state);
  }, [state, setPersisted]);

  return { state, dispatch };
}
