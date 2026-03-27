import { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SearchBar } from './components/SearchBar';
import { WelcomePage } from './components/WelcomePage';
import { TemplatePicker } from './components/TemplatePicker';
import { AIPanel } from './components/AIPanel';
import { GraphView } from './components/GraphView';
import { useApp } from './context/AppContext';
import { pickAndReadDirectory } from './lib/fileReader';
import { getNextColor } from './lib/folderUtils';
import type { FileItem } from './types';

function AppContent() {
  const { state, dispatch, undo, redo } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const isDark = state.theme === 'dark';
  const isEmpty = state.projects.length === 0 && state.boards.length === 0;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.classList.toggle('light', !isDark);
  }, [isDark]);

  const handleGlobalKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
        return;
      }
      if (mod && !e.shiftKey && e.key === 'z') {
        e.preventDefault();
        undo();
        return;
      }
      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) {
        e.preventDefault();
        redo();
        return;
      }
      // Cmd+I - AI Panel
      if (mod && e.key === 'i') {
        e.preventDefault();
        setAiOpen((v) => !v);
        return;
      }
      // Cmd+G - Graph
      if (mod && e.key === 'g') {
        e.preventDefault();
        setGraphOpen((v) => !v);
        return;
      }
    },
    [undo, redo]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [handleGlobalKeyDown]);

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

  const handleScanDirectory = useCallback(async () => {
    if (isScanning) return;
    setIsScanning(true);
    try {
      const result = await pickAndReadDirectory();
      if (result.folders.length > 0) {
        dispatch({
          type: 'IMPORT_PROJECT',
          payload: { name: result.rootName, folders: result.folders, color: getNextColor() },
        });
      }
    } catch (err) {
      console.error('Failed to read directory:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, dispatch]);

  // Collapse sidebar on small screens
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    if (mq.matches) setSidebarOpen(false);
    const handler = (e: MediaQueryListEvent) => { if (e.matches) setSidebarOpen(false); };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-200 ${
      isDark ? 'bg-gray-950 text-gray-100' : 'bg-gray-50 text-gray-900'
    }`}>
      <Sidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onExport={handleExport}
        onImport={handleImport}
        onSearch={() => setSearchOpen(true)}
        onOpenTemplates={() => setTemplateOpen(true)}
        onOpenAI={() => setAiOpen(true)}
        onOpenGraph={() => setGraphOpen(true)}
      />

      {isEmpty ? (
        <WelcomePage
          onScanDirectory={handleScanDirectory}
          onOpenTemplates={() => setTemplateOpen(true)}
          isScanning={isScanning}
        />
      ) : (
        <Dashboard
          externalViewFile={viewingFile}
          onClearExternalView={() => setViewingFile(null)}
        />
      )}

      <SearchBar
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onFileSelect={(file) => setViewingFile(file)}
      />
      <TemplatePicker isOpen={templateOpen} onClose={() => setTemplateOpen(false)} />
      <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      <GraphView isOpen={graphOpen} onClose={() => setGraphOpen(false)} />
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
