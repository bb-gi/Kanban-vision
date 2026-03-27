import { useMemo } from 'react';
import { X, FileText, FolderOpen, Layout, Tag, Calendar, GitBranch } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { flattenFolders } from '../lib/folderUtils';

interface StatsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';

  const stats = useMemo(() => {
    const allFolders = state.projects.flatMap((p) => flattenFolders(p.folders));
    const allFiles = allFolders.flatMap((f) => f.files);
    const totalWords = allFiles.reduce((sum, f) => sum + f.content.split(/\s+/).filter(Boolean).length, 0);
    const totalChars = allFiles.reduce((sum, f) => sum + f.content.length, 0);
    const allTags = new Set(allFiles.flatMap((f) => f.tags || []));
    const tagCounts = new Map<string, number>();
    for (const file of allFiles) {
      for (const tag of file.tags || []) {
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
      }
    }
    const topTags = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    const withDueDate = allFiles.filter((f) => f.dueDate);
    const overdue = withDueDate.filter((f) => new Date(f.dueDate!) < new Date());
    const gitlabFiles = allFiles.filter((f) => f.gitlabIssueIid);
    const avgWordsPerFile = allFiles.length > 0 ? Math.round(totalWords / allFiles.length) : 0;

    // Files per folder
    const folderSizes = allFolders.map((f) => ({ name: f.displayName, count: f.files.length, color: f.color }))
      .filter((f) => f.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);

    return {
      projects: state.projects.length,
      boards: state.boards.length,
      folders: allFolders.length,
      files: allFiles.length,
      totalWords,
      totalChars,
      avgWordsPerFile,
      tags: allTags.size,
      topTags,
      withDueDate: withDueDate.length,
      overdue: overdue.length,
      gitlabFiles: gitlabFiles.length,
      folderSizes,
    };
  }, [state]);

  if (!isOpen) return null;

  const statCards = [
    { icon: <Layout size={16} />, label: 'Projets', value: stats.projects, color: 'text-indigo-400' },
    { icon: <Layout size={16} />, label: 'Tableaux', value: stats.boards, color: 'text-blue-400' },
    { icon: <FolderOpen size={16} />, label: 'Dossiers', value: stats.folders, color: 'text-yellow-400' },
    { icon: <FileText size={16} />, label: 'Fichiers', value: stats.files, color: 'text-green-400' },
    { icon: <Tag size={16} />, label: 'Tags uniques', value: stats.tags, color: 'text-purple-400' },
    { icon: <GitBranch size={16} />, label: 'Issues GitLab', value: stats.gitlabFiles, color: 'text-orange-400' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Statistiques"
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 animate-slideDown ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-3 border-b shrink-0 ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Statistiques
          </h2>
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

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Main stats grid */}
          <div className="grid grid-cols-3 gap-3">
            {statCards.map((card) => (
              <div
                key={card.label}
                className={`rounded-lg p-3 ${isDark ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200'}`}
              >
                <div className={`flex items-center gap-2 mb-1 ${card.color}`}>
                  {card.icon}
                  <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{card.label}</span>
                </div>
                <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {card.value.toLocaleString()}
                </div>
              </div>
            ))}
          </div>

          {/* Content stats */}
          <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
            <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Contenu
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalWords.toLocaleString()}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>mots au total</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.avgWordsPerFile.toLocaleString()}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>mots/fichier (moy.)</div>
              </div>
              <div>
                <div className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {(stats.totalChars / 1000).toFixed(1)}k
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>caracteres</div>
              </div>
            </div>
          </div>

          {/* Due dates */}
          {stats.withDueDate > 0 && (
            <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Echeances
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar size={14} className="text-indigo-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    {stats.withDueDate} avec echeance
                  </span>
                </div>
                {stats.overdue > 0 && (
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-red-400" />
                    <span className="text-sm text-red-400">
                      {stats.overdue} en retard
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top tags */}
          {stats.topTags.length > 0 && (
            <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Tags les plus utilises
              </h3>
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map(([tag, count]) => (
                  <span
                    key={tag}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {tag}
                    <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Folder distribution */}
          {stats.folderSizes.length > 0 && (
            <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50 border border-gray-200'}`}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                Fichiers par dossier
              </h3>
              <div className="space-y-2">
                {stats.folderSizes.map((folder) => {
                  const maxCount = stats.folderSizes[0]?.count || 1;
                  const pct = (folder.count / maxCount) * 100;
                  return (
                    <div key={folder.name} className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: folder.color }} />
                      <span className={`text-xs w-24 truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {folder.name}
                      </span>
                      <div className={`flex-1 h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, backgroundColor: folder.color }}
                        />
                      </div>
                      <span className={`text-xs w-6 text-right ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        {folder.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
