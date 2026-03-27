import { useState, useEffect, useCallback, useRef } from 'react';
import { get, set } from 'idb-keyval';

export function useIndexedDB<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);
  const isInitialLoad = useRef(true);

  // Load from IndexedDB on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const item = await get<T>(key);
        if (!cancelled) {
          if (item !== undefined) {
            setStoredValue(item);
          } else {
            // Try migrating from localStorage
            try {
              const lsItem = window.localStorage.getItem(key);
              if (lsItem) {
                const parsed = JSON.parse(lsItem) as T;
                setStoredValue(parsed);
                // Save to IndexedDB and clean localStorage
                await set(key, parsed);
                window.localStorage.removeItem(key);
              }
            } catch {
              // Ignore localStorage migration errors
            }
          }
          setIsLoaded(true);
          isInitialLoad.current = false;
        }
      } catch {
        if (!cancelled) {
          // Fallback to localStorage
          try {
            const lsItem = window.localStorage.getItem(key);
            if (lsItem) {
              setStoredValue(JSON.parse(lsItem) as T);
            }
          } catch {
            // Use initial value
          }
          setIsLoaded(true);
          isInitialLoad.current = false;
        }
      }
    })();
    return () => { cancelled = true; };
  }, [key, initialValue]);

  // Persist to IndexedDB on changes (after initial load)
  const setPersisted = useCallback(
    (value: React.SetStateAction<T>) => {
      setStoredValue((prev) => {
        const nextValue = typeof value === 'function'
          ? (value as (prev: T) => T)(prev)
          : value;
        // Async save to IndexedDB
        set(key, nextValue).catch(() => {
          // Fallback to localStorage
          try {
            window.localStorage.setItem(key, JSON.stringify(nextValue));
          } catch {
            console.warn('Failed to save to both IndexedDB and localStorage');
          }
        });
        return nextValue;
      });
    },
    [key]
  );

  return [storedValue, setPersisted, isLoaded];
}
