export interface FileItem {
  id: string;
  title: string;
  content: string;
}

export interface Folder {
  id: string;
  originalName: string;
  displayName: string;
  color: string;
  files: FileItem[];
  subfolders: Folder[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  folders: Folder[];
}

export interface Board {
  id: string;
  name: string;
  columnLayout: string[]; // folder IDs from any project
}

export interface AppState {
  projects: Project[];
  boards: Board[];
  activeBoardId: string | null;
  activeProjectId: string | null;
}

export const DEFAULT_STATE: AppState = {
  projects: [],
  boards: [],
  activeBoardId: null,
  activeProjectId: null,
};

export type AppAction =
  | { type: 'IMPORT_PROJECT'; payload: { name: string; folders: Folder[]; color: string } }
  | { type: 'DELETE_PROJECT'; payload: { projectId: string } }
  | { type: 'RENAME_PROJECT'; payload: { projectId: string; name: string } }
  | { type: 'SET_PROJECT_COLOR'; payload: { projectId: string; color: string } }
  | { type: 'SET_ACTIVE_PROJECT'; payload: { projectId: string | null } }
  | { type: 'REFRESH_PROJECT'; payload: { projectId: string; folders: Folder[] } }
  | { type: 'ADD_FOLDER'; payload: { projectId: string; name: string; parentId?: string } }
  | { type: 'RENAME_FOLDER'; payload: { id: string; displayName: string } }
  | { type: 'SET_COLOR'; payload: { id: string; color: string } }
  | { type: 'DELETE_FOLDER'; payload: { id: string } }
  | { type: 'MOVE_FILE'; payload: { fileId: string; fromFolderId: string; toFolderId: string; index?: number } }
  | { type: 'REORDER_FILES'; payload: { folderId: string; fileIds: string[] } }
  | { type: 'CREATE_BOARD'; payload: { name: string } }
  | { type: 'RENAME_BOARD'; payload: { boardId: string; name: string } }
  | { type: 'DELETE_BOARD'; payload: { boardId: string } }
  | { type: 'SET_ACTIVE_BOARD'; payload: { boardId: string } }
  | { type: 'TOGGLE_COLUMN'; payload: { boardId: string; folderId: string } }
  | { type: 'REORDER_COLUMNS'; payload: { boardId: string; columnLayout: string[] } }
  | { type: 'ADD_FILES_TO_FOLDER'; payload: { folderId: string; files: FileItem[] } };
