import { useRef, useCallback } from 'react';
import type { AppState } from '../types';

const MAX_HISTORY = 50;

export function useHistory() {
  const past = useRef<AppState[]>([]);
  const future = useRef<AppState[]>([]);

  const push = useCallback((state: AppState) => {
    past.current = [...past.current.slice(-(MAX_HISTORY - 1)), state];
    future.current = [];
  }, []);

  const undo = useCallback(
    (currentState: AppState): AppState | null => {
      if (past.current.length === 0) return null;
      const previous = past.current[past.current.length - 1];
      past.current = past.current.slice(0, -1);
      future.current = [currentState, ...future.current];
      return previous;
    },
    []
  );

  const redo = useCallback(
    (currentState: AppState): AppState | null => {
      if (future.current.length === 0) return null;
      const next = future.current[0];
      future.current = future.current.slice(1);
      past.current = [...past.current, currentState];
      return next;
    },
    []
  );

  const canUndo = useCallback(() => past.current.length > 0, []);
  const canRedo = useCallback(() => future.current.length > 0, []);

  return { push, undo, redo, canUndo, canRedo };
}
