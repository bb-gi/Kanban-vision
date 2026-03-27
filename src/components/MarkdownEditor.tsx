import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { FilePlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { FileItem } from '../types';
import { useApp } from '../context/AppContext';

interface MarkdownEditorProps {
  folderId: string;
  onClose: () => void;
  onSave: (folderId: string, file: FileItem) => void;
}

export function MarkdownEditor({ folderId, onClose, onSave }: MarkdownEditorProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const titleRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleSave = () => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;

    const file: FileItem = {
      id: uuidv4(),
      title: trimmedTitle.endsWith('.md') ? trimmedTitle : trimmedTitle + '.md',
      content,
    };

    onSave(folderId, file);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Créer un nouveau fichier"
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col mx-4 animate-slideDown ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <FilePlus size={18} className="text-indigo-400 shrink-0" />
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nom du fichier"
            className={`flex-1 text-sm px-3 py-1.5 rounded border focus:border-indigo-500 focus:outline-none ${
              isDark
                ? 'bg-gray-800 text-white border-gray-600'
                : 'bg-gray-50 text-gray-900 border-gray-300'
            }`}
            aria-label="Nom du fichier"
          />
          <button
            onClick={onClose}
            className={`text-sm px-3 py-1.5 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim()}
            className="text-sm px-3 py-1.5 rounded font-medium transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Créer
          </button>
        </div>

        {/* Body: Editor + Preview */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* Textarea */}
          <div className={`flex-1 flex flex-col border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <div className={`px-4 py-2 text-xs font-medium border-b ${
              isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
            }`}>
              Markdown
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre contenu markdown ici..."
              className={`flex-1 text-sm font-mono p-4 resize-none focus:outline-none ${
                isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'
              }`}
              aria-label="Contenu markdown"
            />
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col">
            <div className={`px-4 py-2 text-xs font-medium border-b ${
              isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
            }`}>
              Aperçu
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className={`prose prose-sm max-w-none ${
                isDark
                  ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-indigo-400 prose-strong:text-gray-200 prose-code:text-indigo-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400 prose-li:text-gray-300 prose-hr:border-gray-700 prose-img:rounded-lg prose-table:text-gray-300 prose-th:text-gray-200 prose-td:border-gray-700 prose-th:border-gray-700'
                  : 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-indigo-600 prose-strong:text-gray-800 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-indigo-400 prose-blockquote:text-gray-500 prose-li:text-gray-700 prose-hr:border-gray-200 prose-img:rounded-lg prose-table:text-gray-700 prose-th:text-gray-800 prose-td:border-gray-200 prose-th:border-gray-200'
              }`}>
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className={`italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    L'aperçu apparaîtra ici...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
