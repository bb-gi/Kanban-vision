import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { FilePlus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { FileItem } from '../types';

interface MarkdownEditorProps {
  folderId: string;
  onClose: () => void;
  onSave: (folderId: string, file: FileItem) => void;
}

export function MarkdownEditor({ folderId, onClose, onSave }: MarkdownEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  // Close on Escape
  useEffect(() => {
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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl max-h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 shrink-0">
          <FilePlus size={18} className="text-indigo-400 shrink-0" />
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Nom du fichier"
            autoFocus
            className="flex-1 bg-gray-800 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
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
          <div className="flex-1 flex flex-col border-r border-gray-700">
            <div className="px-4 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">
              Markdown
            </div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Écrivez votre contenu markdown ici..."
              className="flex-1 bg-gray-800 text-gray-200 text-sm font-mono p-4 resize-none focus:outline-none"
            />
          </div>

          {/* Preview */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2 text-xs font-medium text-gray-400 border-b border-gray-700">
              Aperçu
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-gray-100
                prose-p:text-gray-300
                prose-a:text-indigo-400
                prose-strong:text-gray-200
                prose-code:text-indigo-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700
                prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400
                prose-li:text-gray-300
                prose-hr:border-gray-700
                prose-img:rounded-lg
                prose-table:text-gray-300
                prose-th:text-gray-200
                prose-td:border-gray-700
                prose-th:border-gray-700
              ">
                {content ? (
                  <ReactMarkdown>{content}</ReactMarkdown>
                ) : (
                  <p className="text-gray-500 italic">L'aperçu apparaîtra ici...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
