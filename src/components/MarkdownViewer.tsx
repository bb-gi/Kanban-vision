import { useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, FileText } from 'lucide-react';
import type { FileItem } from '../types';
import { useApp } from '../context/AppContext';

interface MarkdownViewerProps {
  file: FileItem;
  onClose: () => void;
}

export function MarkdownViewer({ file, onClose }: MarkdownViewerProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';
  const closeRef = useRef<HTMLButtonElement>(null);

  // Focus trap + close on Escape
  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`Aperçu de ${file.title}`}
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4 animate-slideDown ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <FileText size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          <h3 className={`text-base font-semibold flex-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {file.title}
          </h3>
          <button
            ref={closeRef}
            onClick={onClose}
            className={`p-1 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className={`prose prose-sm max-w-none ${
            isDark
              ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-indigo-400 prose-strong:text-gray-200 prose-code:text-indigo-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400 prose-li:text-gray-300 prose-hr:border-gray-700 prose-img:rounded-lg prose-table:text-gray-300 prose-th:text-gray-200 prose-td:border-gray-700 prose-th:border-gray-700'
              : 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-indigo-600 prose-strong:text-gray-800 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-indigo-400 prose-blockquote:text-gray-500 prose-li:text-gray-700 prose-hr:border-gray-200 prose-img:rounded-lg prose-table:text-gray-700 prose-th:text-gray-800 prose-td:border-gray-200 prose-th:border-gray-200'
          }`}>
            <ReactMarkdown>{file.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
