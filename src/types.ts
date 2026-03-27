export interface FileItem {
  id: string;
  title: string;
  content: string;
  gitlabIssueIid?: number;
  tags?: string[];
  dueDate?: string; // ISO date string
}

export interface GitLabConfig {
  instanceUrl: string;
  token: string;
  projectId: number;
}

export interface Folder {
  id: string;
  originalName: string;
  displayName: string;
  color: string;
  files: FileItem[];
  subfolders: Folder[];
  gitlabLabel?: string;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  folders: Folder[];
  gitlabConfig?: GitLabConfig;
}

export interface Board {
  id: string;
  name: string;
  columnLayout: string[]; // folder IDs from any project
}

export type ThemeMode = 'dark' | 'light';

export interface AppState {
  projects: Project[];
  boards: Board[];
  activeBoardId: string | null;
  activeProjectId: string | null;
  theme: ThemeMode;
}

export const DEFAULT_STATE: AppState = {
  projects: [],
  boards: [],
  activeBoardId: null,
  activeProjectId: null,
  theme: 'dark',
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
  | { type: 'ADD_FILES_TO_FOLDER'; payload: { folderId: string; files: FileItem[] } }
  | { type: 'DELETE_FILE'; payload: { folderId: string; fileId: string } }
  | { type: 'SET_GITLAB_CONFIG'; payload: { projectId: string; config: GitLabConfig } }
  | { type: 'REMOVE_GITLAB_CONFIG'; payload: { projectId: string } }
  | { type: 'SET_FOLDER_GITLAB_LABEL'; payload: { folderId: string; label: string } }
  | { type: 'SYNC_GITLAB_ISSUES'; payload: { projectId: string; folderId: string; files: FileItem[] } }
  | { type: 'UPDATE_FILE'; payload: { folderId: string; fileId: string; title: string; content: string } }
  | { type: 'SET_FILE_TAGS'; payload: { folderId: string; fileId: string; tags: string[] } }
  | { type: 'SET_FILE_DUE_DATE'; payload: { folderId: string; fileId: string; dueDate: string | undefined } }
  | { type: 'DUPLICATE_FILE'; payload: { folderId: string; fileId: string } }
  | { type: 'CREATE_BOARD_FROM_TEMPLATE'; payload: { name: string; columns: { name: string; color: string }[] } }
  | { type: 'SET_THEME'; payload: { theme: ThemeMode } }
  | { type: 'RESTORE_STATE'; payload: AppState };
