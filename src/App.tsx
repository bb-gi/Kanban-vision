import { useState, useEffect, useCallback } from 'react';
import { AppProvider } from './context/AppContext';
import { Sidebar } from './components/Sidebar/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { SearchBar } from './components/SearchBar';
import { WelcomePage } from './components/WelcomePage';
import { TemplatePicker } from './components/TemplatePicker';
import { AIPanel } from './components/AIPanel';
import { GraphView } from './components/GraphView';
import { KeyboardShortcuts } from './components/KeyboardShortcuts';
import { StatsPanel } from './components/StatsPanel';
import { ToastProvider, useToast } from './components/Toast';
import { useApp } from './context/AppContext';
import { pickAndReadDirectory } from './lib/fileReader';
import { getNextColor } from './lib/folderUtils';
import type { FileItem } from './types';

function AppContent() {
  const { state, dispatch, undo, redo } = useApp();
  const { toast } = useToast();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [viewingFile, setViewingFile] = useState<{ file: FileItem; folderId?: string } | null>(null);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [graphOpen, setGraphOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(false);
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

      if (mod && e.key === 'k') { e.preventDefault(); setSearchOpen((v) => !v); return; }
      if (mod && !e.shiftKey && e.key === 'z') { e.preventDefault(); undo(); return; }
      if ((mod && e.shiftKey && e.key === 'z') || (mod && e.key === 'y')) { e.preventDefault(); redo(); return; }
      if (mod && e.key === 'i') { e.preventDefault(); setAiOpen((v) => !v); return; }
      if (mod && e.key === 'g') { e.preventDefault(); setGraphOpen((v) => !v); return; }
      if (e.key === '?' && !mod && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement)) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
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
    toast('Donnees exportees', 'success');
  }, [state, toast]);

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
          toast('Donnees importees avec succes', 'success');
        }
      } catch {
        toast('Fichier JSON invalide', 'error');
      }
    };
    input.click();
  }, [dispatch, state.theme, toast]);

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
        toast(`Projet "${result.rootName}" importe`, 'success');
      }
    } catch (err) {
      toast('Erreur lors de l\'import', 'error');
      console.error('Failed to read directory:', err);
    } finally {
      setIsScanning(false);
    }
  }, [isScanning, dispatch, toast]);

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
        onOpenStats={() => setStatsOpen(true)}
      />

      {isEmpty ? (
        <WelcomePage
          onScanDirectory={handleScanDirectory}
          onOpenTemplates={() => setTemplateOpen(true)}
          isScanning={isScanning}
        />
      ) : (
        <Dashboard
          externalViewFile={viewingFile?.file ?? null}
          externalViewFolderId={viewingFile?.folderId}
          onClearExternalView={() => setViewingFile(null)}
        />
      )}

      <SearchBar
        isOpen={searchOpen}
        onClose={() => setSearchOpen(false)}
        onFileSelect={(file) => setViewingFile({ file })}
      />
      <TemplatePicker isOpen={templateOpen} onClose={() => setTemplateOpen(false)} />
      <AIPanel isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      <GraphView isOpen={graphOpen} onClose={() => setGraphOpen(false)} />
      <KeyboardShortcuts isOpen={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <StatsPanel isOpen={statsOpen} onClose={() => setStatsOpen(false)} />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AppProvider>
  );
}

export default App;
