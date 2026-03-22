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

export interface Board {
  id: string;
  name: string;
  columnLayout: string[];
}

export interface AppState {
  folders: Folder[];
  boards: Board[];
  activeBoardId: string | null;
}

export const DEFAULT_STATE: AppState = {
  folders: [],
  boards: [],
  activeBoardId: null,
};

export type AppAction =
  | { type: 'IMPORT_FOLDERS'; payload: Folder[] }
  | { type: 'REFRESH_FOLDERS'; payload: Folder[] }
  | { type: 'ADD_FOLDER'; payload: { name: string; parentId?: string } }
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
