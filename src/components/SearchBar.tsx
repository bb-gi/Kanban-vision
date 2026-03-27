import { useState, useEffect, useRef, useMemo } from 'react';
import { Search, X, FileText, FolderOpen } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { searchFiles } from '../lib/search';
import type { SearchResult } from '../lib/search';
import type { FileItem } from '../types';

interface SearchBarProps {
  isOpen: boolean;
  onClose: () => void;
  onFileSelect: (file: FileItem) => void;
}

export function SearchBar({ isOpen, onClose, onFileSelect }: SearchBarProps) {
  const { state } = useApp();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const allFolders = useMemo(
    () => state.projects.flatMap((p) => p.folders),
    [state.projects]
  );

  const results: SearchResult[] = useMemo(
    () => searchFiles(allFolders, query).slice(0, 20),
    [allFolders, query]
  );

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const item = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onFileSelect(results[selectedIndex].file);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Recherche de fichiers"
    >
      <div
        className="bg-gray-900 dark:bg-gray-900 light:bg-white border border-gray-700 rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden animate-slideDown"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher dans les fichiers..."
            className="flex-1 bg-transparent text-gray-100 text-sm placeholder-gray-500 focus:outline-none"
            aria-label="Rechercher dans les fichiers"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="text-gray-400 hover:text-white transition-colors"
              aria-label="Effacer la recherche"
            >
              <X size={16} />
            </button>
          )}
          <kbd className="hidden sm:inline text-xs text-gray-500 bg-gray-800 px-1.5 py-0.5 rounded border border-gray-700">
            Esc
          </kbd>
        </div>

        {query.trim() && (
          <div ref={listRef} className="max-h-72 overflow-y-auto" role="listbox">
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-gray-500 text-sm">
                Aucun résultat pour &quot;{query}&quot;
              </div>
            ) : (
              results.map((result, i) => (
                <button
                  key={`${result.folderId}-${result.file.id}`}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                    i === selectedIndex
                      ? 'bg-indigo-500/20 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                  onClick={() => {
                    onFileSelect(result.file);
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(i)}
                  role="option"
                  aria-selected={i === selectedIndex}
                >
                  <FileText size={14} className="shrink-0 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">
                      {result.file.title.replace(/\.md$/, '')}
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <FolderOpen size={10} />
                      <span className="truncate">{result.folderName}</span>
                      {result.matchType === 'content' && (
                        <span className="ml-1 text-indigo-400">contenu</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {!query.trim() && (
          <div className="px-4 py-4 text-center text-gray-500 text-xs">
            Tapez pour rechercher dans les titres et le contenu des fichiers
          </div>
        )}
      </div>
    </div>
  );
}
