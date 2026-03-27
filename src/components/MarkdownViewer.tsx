import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { X, FileText, Pencil, Eye, Save, Copy, Calendar, Tag } from 'lucide-react';
import type { FileItem } from '../types';
import { useApp } from '../context/AppContext';
import { useToast } from './Toast';
import { TagEditor } from './TagEditor';

interface MarkdownViewerProps {
  file: FileItem;
  folderId?: string;
  onClose: () => void;
}

export function MarkdownViewer({ file, folderId, onClose }: MarkdownViewerProps) {
  const { state, dispatch } = useApp();
  const { toast } = useToast();
  const isDark = state.theme === 'dark';
  const closeRef = useRef<HTMLButtonElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(file.title);
  const [editContent, setEditContent] = useState(file.content);
  const [showDueDate, setShowDueDate] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) setIsEditing(false);
        else onClose();
      }
      // Ctrl+E to toggle edit
      if ((e.metaKey || e.ctrlKey) && e.key === 'e') {
        e.preventDefault();
        setIsEditing((v) => !v);
      }
      // Ctrl+S to save
      if ((e.metaKey || e.ctrlKey) && e.key === 's' && isEditing) {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, isEditing, editTitle, editContent]);

  const handleSave = () => {
    if (!folderId) return;
    dispatch({
      type: 'UPDATE_FILE',
      payload: { folderId, fileId: file.id, title: editTitle, content: editContent },
    });
    toast('Fichier sauvegarde', 'success');
    setIsEditing(false);
  };

  const handleDuplicate = () => {
    if (!folderId) return;
    dispatch({ type: 'DUPLICATE_FILE', payload: { folderId, fileId: file.id } });
    toast('Fichier duplique', 'success');
  };

  const handleSetDueDate = (date: string) => {
    if (!folderId) return;
    dispatch({
      type: 'SET_FILE_DUE_DATE',
      payload: { folderId, fileId: file.id, dueDate: date || undefined },
    });
    toast(date ? 'Echeance definie' : 'Echeance retiree', 'info');
    setShowDueDate(false);
  };

  const proseClasses = isDark
    ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-indigo-400 prose-strong:text-gray-200 prose-code:text-indigo-300 prose-code:bg-gray-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-800 prose-pre:border prose-pre:border-gray-700 prose-blockquote:border-indigo-500 prose-blockquote:text-gray-400 prose-li:text-gray-300 prose-hr:border-gray-700 prose-img:rounded-lg prose-table:text-gray-300 prose-th:text-gray-200 prose-td:border-gray-700 prose-th:border-gray-700'
    : 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-indigo-600 prose-strong:text-gray-800 prose-code:text-indigo-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-blockquote:border-indigo-400 prose-blockquote:text-gray-500 prose-li:text-gray-700 prose-hr:border-gray-200 prose-img:rounded-lg prose-table:text-gray-700 prose-th:text-gray-800 prose-td:border-gray-200 prose-th:border-gray-200';

  const tags = file.tags || [];
  const isOverdue = file.dueDate && new Date(file.dueDate) < new Date();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${isEditing ? 'Edition' : 'Apercu'} de ${file.title}`}
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-h-[85vh] flex flex-col mx-4 animate-slideDown ${
          isEditing ? 'max-w-5xl' : 'max-w-3xl'
        } ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center gap-3 px-5 py-3 border-b shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <FileText size={18} className={isDark ? 'text-gray-400' : 'text-gray-500'} />

          {isEditing ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={`flex-1 text-base font-semibold px-2 py-0.5 rounded border focus:border-indigo-500 focus:outline-none ${
                isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
              }`}
            />
          ) : (
            <h3 className={`text-base font-semibold flex-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {file.title}
            </h3>
          )}

          {/* Meta info */}
          {file.dueDate && !isEditing && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              isOverdue
                ? 'bg-red-500/20 text-red-400'
                : 'bg-indigo-500/20 text-indigo-400'
            }`}>
              {new Date(file.dueDate).toLocaleDateString('fr-FR')}
            </span>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {folderId && (
              <>
                {isEditing ? (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className={`p-1.5 rounded transition-colors ${
                        isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      aria-label="Voir l'apercu"
                      title="Apercu (Esc)"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={handleSave}
                      className="p-1.5 rounded transition-colors text-green-400 hover:text-green-300 hover:bg-green-500/10"
                      aria-label="Sauvegarder"
                      title="Sauvegarder (Ctrl+S)"
                    >
                      <Save size={16} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(true)}
                      className={`p-1.5 rounded transition-colors ${
                        isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      aria-label="Editer"
                      title="Editer (Ctrl+E)"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={handleDuplicate}
                      className={`p-1.5 rounded transition-colors ${
                        isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      aria-label="Dupliquer"
                      title="Dupliquer"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => setShowDueDate(!showDueDate)}
                      className={`p-1.5 rounded transition-colors ${
                        file.dueDate
                          ? 'text-indigo-400 hover:text-indigo-300'
                          : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                      }`}
                      aria-label="Echeance"
                      title="Definir une echeance"
                    >
                      <Calendar size={16} />
                    </button>
                  </>
                )}
              </>
            )}
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
        </div>

        {/* Due date picker */}
        {showDueDate && folderId && (
          <div className={`px-5 py-2 border-b flex items-center gap-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Calendar size={14} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
            <input
              type="date"
              value={file.dueDate || ''}
              onChange={(e) => handleSetDueDate(e.target.value)}
              className={`text-sm px-2 py-1 rounded border focus:border-indigo-500 focus:outline-none ${
                isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
              }`}
            />
            {file.dueDate && (
              <button
                onClick={() => handleSetDueDate('')}
                className="text-xs text-red-400 hover:text-red-300"
              >
                Retirer
              </button>
            )}
          </div>
        )}

        {/* Tags bar */}
        {folderId && (tags.length > 0 || !isEditing) && (
          <div className={`px-5 py-1.5 border-b flex items-center gap-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Tag size={12} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
            <TagEditor tags={tags} folderId={folderId} fileId={file.id} />
          </div>
        )}

        {/* Content */}
        {isEditing ? (
          <div className="flex-1 flex overflow-hidden min-h-0">
            <div className={`flex-1 flex flex-col border-r ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <div className={`px-4 py-1.5 text-xs font-medium border-b ${
                isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
              }`}>
                Markdown
              </div>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className={`flex-1 text-sm font-mono p-4 resize-none focus:outline-none ${
                  isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-50 text-gray-800'
                }`}
                aria-label="Contenu markdown"
              />
            </div>
            <div className="flex-1 flex flex-col">
              <div className={`px-4 py-1.5 text-xs font-medium border-b ${
                isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
              }`}>
                Apercu
              </div>
              <div className="flex-1 overflow-y-auto px-6 py-4">
                <div className={`prose prose-sm max-w-none ${proseClasses}`}>
                  {editContent ? <ReactMarkdown>{editContent}</ReactMarkdown> : (
                    <p className={`italic ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Apercu vide</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <div className={`prose prose-sm max-w-none ${proseClasses}`}>
              <ReactMarkdown>{file.content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
