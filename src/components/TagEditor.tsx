import { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';

const TAG_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#6366f1', '#8b5cf6', '#a855f7', '#ec4899',
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

interface TagEditorProps {
  tags: string[];
  folderId: string;
  fileId: string;
  compact?: boolean;
}

export function TagEditor({ tags, folderId, fileId, compact }: TagEditorProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const [isAdding, setIsAdding] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding) inputRef.current?.focus();
  }, [isAdding]);

  const handleAddTag = () => {
    const trimmed = newTag.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      dispatch({
        type: 'SET_FILE_TAGS',
        payload: { folderId, fileId, tags: [...tags, trimmed] },
      });
    }
    setNewTag('');
    setIsAdding(false);
  };

  const handleRemoveTag = (tag: string) => {
    dispatch({
      type: 'SET_FILE_TAGS',
      payload: { folderId, fileId, tags: tags.filter((t) => t !== tag) },
    });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1 flex-wrap">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center px-1.5 py-0 rounded-full text-[10px] font-medium text-white"
            style={{ backgroundColor: getTagColor(tag) + 'cc' }}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 flex-wrap" onClick={(e) => e.stopPropagation()}>
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium text-white group/tag"
          style={{ backgroundColor: getTagColor(tag) + 'cc' }}
        >
          {tag}
          <button
            onClick={(e) => { e.stopPropagation(); handleRemoveTag(tag); }}
            className="opacity-0 group-hover/tag:opacity-100 transition-opacity"
            aria-label={`Retirer le tag ${tag}`}
          >
            <X size={8} />
          </button>
        </span>
      ))}
      {isAdding ? (
        <form
          onSubmit={(e) => { e.preventDefault(); handleAddTag(); }}
          className="inline-flex"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            ref={inputRef}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onBlur={handleAddTag}
            onKeyDown={(e) => { if (e.key === 'Escape') { setIsAdding(false); setNewTag(''); } }}
            placeholder="tag..."
            className={`w-16 text-[10px] px-1.5 py-0.5 rounded-full border focus:outline-none focus:border-indigo-500 ${
              isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-gray-100 text-gray-800 border-gray-300'
            }`}
          />
        </form>
      ) : (
        <button
          onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
          className={`inline-flex items-center gap-0.5 px-1 py-0.5 rounded-full text-[10px] transition-colors opacity-0 group-hover:opacity-100 ${
            isDark
              ? 'text-gray-500 hover:text-gray-300 hover:bg-gray-700'
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-200'
          }`}
          aria-label="Ajouter un tag"
        >
          <Plus size={8} />
        </button>
      )}
    </div>
  );
}

export { getTagColor };
