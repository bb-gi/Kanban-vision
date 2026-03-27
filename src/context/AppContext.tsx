import { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import type { AppState, AppAction } from '../types';
import { useAppState } from '../hooks/useAppState';

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const { state, dispatch, undo, redo, canUndo, canRedo } = useAppState();

  return (
    <AppContext.Provider value={{ state, dispatch, undo, redo, canUndo, canRedo }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
