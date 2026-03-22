import { useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, FileText } from 'lucide-react';
import type { FileItem } from '../types';

interface MarkdownViewerProps {
  file: FileItem;
  onClose: () => void;
}

export function MarkdownViewer({ file, onClose }: MarkdownViewerProps) {
  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 border border-gray-700 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700 shrink-0">
          <FileText size={18} className="text-gray-400" />
          <h3 className="text-base font-semibold text-white flex-1 truncate">
            {file.title}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
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
            <ReactMarkdown>{file.content}</ReactMarkdown>
          </div>
        </div>
      </div>
    </div>
  );
}
