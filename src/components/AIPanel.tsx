import { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Loader2, Key, Send, FileText, Tag, Wand2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { summarizeFile, generateContent, suggestTags } from '../lib/aiApi';
import type { AIConfig } from '../lib/aiApi';
import type { FileItem } from '../types';
import { getAllFiles } from '../lib/search';
import { v4 as uuidv4 } from 'uuid';

interface AIPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

type AIMode = 'chat' | 'summarize' | 'generate' | 'tags';

export function AIPanel({ isOpen, onClose }: AIPanelProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('kv-ai-key') || '');
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [mode, setMode] = useState<AIMode>('chat');
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFileId, setSelectedFileId] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const allFolders = state.projects.flatMap((p) => p.folders);
  const allFiles = getAllFiles(allFolders);
  const config: AIConfig = { apiKey };

  useEffect(() => {
    if (isOpen && !apiKey) setShowKeyInput(true);
  }, [isOpen, apiKey]);

  const saveKey = () => {
    localStorage.setItem('kv-ai-key', apiKey);
    setShowKeyInput(false);
  };

  const selectedFileInfo = allFiles.find((f) => f.file.id === selectedFileId);

  const handleSummarize = async () => {
    if (!selectedFileInfo || !apiKey) return;
    setIsLoading(true);
    setError('');
    try {
      const summary = await summarizeFile(config, selectedFileInfo.file);
      setResult(summary);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || !apiKey) return;
    setIsLoading(true);
    setError('');
    try {
      const content = await generateContent(config, prompt);
      setResult(content);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestTags = async () => {
    if (!selectedFileInfo || !apiKey) return;
    setIsLoading(true);
    setError('');
    try {
      const tags = await suggestTags(config, selectedFileInfo.file);
      setResult(`Tags suggeres: ${tags.join(', ')}`);
      // Auto-apply tags
      const existing = selectedFileInfo.file.tags || [];
      const merged = [...new Set([...existing, ...tags])];
      dispatch({
        type: 'SET_FILE_TAGS',
        payload: { folderId: selectedFileInfo.folderId, fileId: selectedFileInfo.file.id, tags: merged },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erreur');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveGenerated = () => {
    if (!result) return;
    const firstFolderId = allFiles[0]?.folderId;
    if (!firstFolderId) return;
    const title = prompt.slice(0, 40).replace(/[^a-zA-Z0-9\s-]/g, '') || 'nouveau-fichier';
    const file: FileItem = {
      id: uuidv4(),
      title: `${title}.md`,
      content: result,
    };
    dispatch({ type: 'ADD_FILES_TO_FOLDER', payload: { folderId: firstFolderId, files: [file] } });
    setResult('');
    setPrompt('');
  };

  const handleSubmit = () => {
    if (mode === 'summarize') handleSummarize();
    else if (mode === 'generate') handleGenerate();
    else if (mode === 'tags') handleSuggestTags();
    else handleGenerate();
  };

  if (!isOpen) return null;

  const modes: { id: AIMode; label: string; icon: React.ReactNode }[] = [
    { id: 'generate', label: 'Generer', icon: <Wand2 size={14} /> },
    { id: 'summarize', label: 'Resumer', icon: <FileText size={14} /> },
    { id: 'tags', label: 'Tags IA', icon: <Tag size={14} /> },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Assistant IA"
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 animate-slideDown ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <Sparkles size={18} className="text-purple-400" />
          <h2 className={`text-base font-semibold flex-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Assistant IA
          </h2>
          <button
            onClick={() => setShowKeyInput(!showKeyInput)}
            className={`p-1.5 rounded transition-colors ${
              apiKey
                ? 'text-green-400 hover:bg-green-500/10'
                : 'text-yellow-400 hover:bg-yellow-500/10'
            }`}
            aria-label="Configurer la cle API"
            title={apiKey ? 'Cle API configuree' : 'Configurer la cle API'}
          >
            <Key size={14} />
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* API Key input */}
        {showKeyInput && (
          <div className={`px-5 py-3 border-b ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Cle API Anthropic (Claude)
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-ant-api03-..."
                className={`flex-1 text-sm px-3 py-1.5 rounded border focus:border-indigo-500 focus:outline-none ${
                  isDark ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
              <button
                onClick={saveKey}
                disabled={!apiKey}
                className="px-3 py-1.5 rounded text-sm bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 transition-colors"
              >
                Sauver
              </button>
            </div>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              La cle est stockee localement dans votre navigateur uniquement.
            </p>
          </div>
        )}

        {/* Mode selector */}
        <div className={`flex items-center gap-1 px-5 py-2 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {modes.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setResult(''); setError(''); }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                mode === m.id
                  ? 'bg-purple-500/20 text-purple-400'
                  : isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              {m.icon}
              {m.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {/* File selector (for summarize and tags) */}
          {(mode === 'summarize' || mode === 'tags') && (
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Fichier a analyser
              </label>
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className={`w-full text-sm px-3 py-2 rounded border focus:border-indigo-500 focus:outline-none ${
                  isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}
              >
                <option value="">Choisir un fichier...</option>
                {allFiles.map((f) => (
                  <option key={f.file.id} value={f.file.id}>
                    {f.file.title} ({f.folderName})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Prompt input (for generate) */}
          {mode === 'generate' && (
            <div>
              <label className={`text-xs font-medium mb-1 block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Decrivez ce que vous voulez generer
              </label>
              <textarea
                ref={inputRef}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Ex: Ecris un guide sur les bonnes pratiques Git en Markdown..."
                rows={3}
                className={`w-full text-sm px-3 py-2 rounded border focus:border-indigo-500 focus:outline-none resize-none ${
                  isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                }`}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading || !apiKey || (mode === 'generate' && !prompt.trim()) || ((mode === 'summarize' || mode === 'tags') && !selectedFileId)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            {isLoading ? 'En cours...' : mode === 'summarize' ? 'Resumer' : mode === 'tags' ? 'Suggerer des tags' : 'Generer'}
          </button>

          {/* Error */}
          {error && (
            <div className="px-3 py-2 rounded bg-red-900/30 text-red-400 text-xs" role="alert">
              {error}
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`rounded-lg border p-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Resultat</span>
                {mode === 'generate' && (
                  <button
                    onClick={handleSaveGenerated}
                    className="text-xs px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
                  >
                    Sauver comme fichier
                  </button>
                )}
              </div>
              <div className={`text-sm whitespace-pre-wrap ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                {result}
              </div>
            </div>
          )}

          {/* No API key warning */}
          {!apiKey && !showKeyInput && (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Sparkles size={32} className="mx-auto mb-3 opacity-50" />
              <p className="text-sm mb-1">Configurez votre cle API pour commencer</p>
              <p className="text-xs">Cliquez sur l'icone de cle en haut a droite</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
