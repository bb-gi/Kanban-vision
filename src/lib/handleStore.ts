const DB_NAME = 'kanban-handles';
const STORE_NAME = 'handles';
const DB_VERSION = 1;

interface HandleEntry {
  projectId: string;
  handle: FileSystemDirectoryHandle;
  isRootFlat: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME, { keyPath: 'projectId' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function storeHandle(
  projectId: string,
  handle: FileSystemDirectoryHandle,
  isRootFlat: boolean
): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const entry: HandleEntry = { projectId, handle, isRootFlat };
    const req = tx.objectStore(STORE_NAME).put(entry);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function getHandleInfo(
  projectId: string
): Promise<{ handle: FileSystemDirectoryHandle; isRootFlat: boolean } | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const req = tx.objectStore(STORE_NAME).get(projectId);
    req.onsuccess = () => {
      const entry: HandleEntry | undefined = req.result;
      resolve(entry ? { handle: entry.handle, isRootFlat: entry.isRootFlat } : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function removeHandle(projectId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(projectId);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function ensurePermission(
  handle: FileSystemDirectoryHandle
): Promise<boolean> {
  try {
    const perm = await (handle as any).queryPermission({ mode: 'readwrite' });
    if (perm === 'granted') return true;
    const requested = await (handle as any).requestPermission({ mode: 'readwrite' });
    return requested === 'granted';
  } catch {
    return false;
  }
}
