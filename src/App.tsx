import { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SearchBar } from './components/SearchBar';
import { useApp } from './context/AppContext';
import type { FileItem } from './types';

function AppContent() {
  const { state, dispatch, undo, redo } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);

  const isDark = state.theme === 'dark';

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  // Global keyboard shortcuts
  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      // Cmd+K - Search
      if (mod && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      // Cmd+Z - Undo
      if (mod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      // Cmd+Shift+Z / Cmd+Y - Redo
      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
    },
    [undo, redo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

  // Export data
  const handleExport = useCallback(() => {
    const data = JSON.stringify(state, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `kanban-vision-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [state]);

  // Import data
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        if (data.projects && data.boards) {
          dispatch({ type: 'RESTORE_STATE', payload: { ...data, theme: data.theme ?? state.theme } });
        }
      } catch {
        console.error('Invalid JSON file');
      }
    };
    input.click();
  }, [dispatch, state.theme]);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${
      isDark
        ? 'bg-gray-950 text-gray-100'
        : 'bg-gray-50 text-gray-900'
    }`}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onExport={handleExport}
        onImport={handleImport}
        onSearch={() => setSearchOpen(true)}
      />
      <Dashboard
        externalViewFile={viewingFile}
        onClearExternalView={() => setViewingFile(null)}
      />
      <SearchBar
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onFileSelect={(file) => setViewingFile(file)}
      />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

export default App;
