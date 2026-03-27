import { useState } from 'react';
import { Trash2, Pencil, Check, X, FolderKanban, ChevronRight, ChevronDown } from 'lucide-react';
import type { Project, Board } from '../../types';
import { useApp } from '../../context/AppContext';
import { ColorPicker } from './ColorPicker';
import { FolderTree } from './FolderTree';

interface ProjectListProps {
  projects: Project[];
  activeProjectId: string | null;
  activeBoard: Board | null;
}

export function ProjectList({ projects, activeProjectId, activeBoard }: ProjectListProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRename = (projectId: string) => {
    if (editName.trim()) {
      dispatch({ type: 'RENAME_PROJECT', payload: { projectId, name: editName.trim() } });
    }
    setEditingId(null);
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <div role="list" aria-label="Projets">
      {projects.map((project) => {
        const isExpanded = expandedIds.has(project.id);
        const isActive = project.id === activeProjectId;

        return (
          <div key={project.id} role="listitem">
            {/* Project header */}
            <div
              className={`group flex items-center gap-1.5 px-2 py-1.5 cursor-pointer transition-colors text-sm ${
                isActive
                  ? isDark ? 'bg-gray-700/70 text-white' : 'bg-indigo-50 text-indigo-900'
                  : isDark ? 'text-gray-300 hover:bg-gray-700/40' : 'text-gray-700 hover:bg-gray-100'
              }`}
              onClick={() => {
                dispatch({ type: 'SET_ACTIVE_PROJECT', payload: { projectId: project.id } });
                if (!isExpanded) toggleExpanded(project.id);
              }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded(project.id);
                }}
                className={`shrink-0 w-4 h-4 flex items-center justify-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                aria-expanded={isExpanded}
                aria-label={isExpanded ? 'Réduire' : 'Développer'}
              >
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </button>

              <div
                className="w-2.5 h-2.5 rounded shrink-0"
                style={{ backgroundColor: project.color }}
              />

              {editingId === project.id ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handleRename(project.id); }}
                  className="flex items-center gap-1 flex-1 min-w-0"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRename(project.id)}
                    className={`text-sm px-1 py-0 rounded border flex-1 min-w-0 ${
                      isDark ? 'bg-gray-800 text-white border-gray-600' : 'bg-gray-50 text-gray-900 border-gray-300'
                    }`}
                    onKeyDown={(e) => { if (e.key === 'Escape') setEditingId(null); }}
                  />
                  <button type="submit" className="text-green-400 hover:text-green-300" aria-label="Confirmer">
                    <Check size={12} />
                  </button>
                  <button type="button" onClick={() => setEditingId(null)} className="text-red-400 hover:text-red-300" aria-label="Annuler">
                    <X size={12} />
                  </button>
                </form>
              ) : (
                <>
                  <FolderKanban size={14} className="shrink-0" style={{ color: project.color }} />
                  <span className="flex-1 min-w-0 truncate font-medium">{project.name}</span>
                </>
              )}

              {editingId !== project.id && (
                <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                  <ColorPicker
                    color={project.color}
                    onChange={(color) =>
                      dispatch({ type: 'SET_PROJECT_COLOR', payload: { projectId: project.id, color } })
                    }
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(project.id);
                      setEditName(project.name);
                    }}
                    className={`p-1 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-700'}`}
                    aria-label={`Renommer ${project.name}`}
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      dispatch({ type: 'DELETE_PROJECT', payload: { projectId: project.id } });
                    }}
                    className={`p-1 ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                    aria-label={`Supprimer ${project.name}`}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}
            </div>

            {/* Folder tree (expanded) */}
            {isExpanded && (
              <div className={`ml-2 border-l ${isDark ? 'border-gray-700/50' : 'border-gray-200'}`}>
                <FolderTree folders={project.folders} activeBoard={activeBoard} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
