import {
  FolderSearch, Layout, FileText, Search, Undo2, Sun, Download, GitBranch,
  Tag, Zap, ArrowRight,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface WelcomePageProps {
  onScanDirectory: () => void;
  onOpenTemplates: () => void;
  isScanning: boolean;
}

export function WelcomePage({ onScanDirectory, onOpenTemplates, isScanning }: WelcomePageProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';

  const features = [
    { icon: <FileText size={18} />, title: 'Fichiers Markdown', desc: 'Importez et visualisez vos fichiers .md' },
    { icon: <Layout size={18} />, title: 'Kanban flexible', desc: 'Glissez-deposez vos fichiers entre colonnes' },
    { icon: <Search size={18} />, title: 'Recherche instantanee', desc: 'Trouvez n\'importe quel fichier avec Ctrl+K' },
    { icon: <Undo2 size={18} />, title: 'Undo / Redo', desc: 'Annulez et retablissez vos actions' },
    { icon: <Sun size={18} />, title: 'Mode clair / sombre', desc: 'Adaptez l\'interface a vos preferences' },
    { icon: <Download size={18} />, title: 'Export / Import', desc: 'Sauvegardez vos donnees en JSON' },
    { icon: <GitBranch size={18} />, title: 'Integration GitLab', desc: 'Synchronisez vos issues GitLab' },
    { icon: <Tag size={18} />, title: 'Tags & Filtrage', desc: 'Organisez vos fichiers avec des tags' },
  ];

  return (
    <div className={`flex-1 flex flex-col items-center justify-center overflow-y-auto py-12 px-6 ${
      isDark ? 'bg-gray-950' : 'bg-gray-50'
    }`}>
      <div className="max-w-2xl w-full text-center">
        {/* Hero */}
        <div className="mb-10">
          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-4 ${
            isDark ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
          }`}>
            <Zap size={12} />
            Local-first — Vos fichiers restent chez vous
          </div>
          <h1 className={`text-3xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Bienvenue sur Kanban Vision
          </h1>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            Le Kanban pour vos fichiers Markdown.
            Organisez, visualisez et gerez vos notes en toute simplicite.
          </p>
        </div>

        {/* CTA buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
          <button
            onClick={onScanDirectory}
            disabled={isScanning}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
          >
            <FolderSearch size={18} />
            Importer un dossier
            <ArrowRight size={16} />
          </button>
          <button
            onClick={onOpenTemplates}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors border ${
              isDark
                ? 'bg-gray-800 hover:bg-gray-700 text-white border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-800 border-gray-300 shadow-sm'
            }`}
          >
            <Layout size={18} />
            Utiliser un template
          </button>
        </div>

        {/* Features grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg text-left transition-colors ${
                isDark
                  ? 'bg-gray-800/50 border border-gray-800 hover:bg-gray-800'
                  : 'bg-white border border-gray-200 hover:border-gray-300 shadow-sm'
              }`}
            >
              <div className={`mb-2 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                {feature.icon}
              </div>
              <h3 className={`text-xs font-semibold mb-0.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {feature.title}
              </h3>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Keyboard shortcuts hint */}
        <div className={`mt-8 flex items-center justify-center gap-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <span className="flex items-center gap-1">
            <kbd className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+K
            </kbd>
            Rechercher
          </span>
          <span className="flex items-center gap-1">
            <kbd className={`px-1.5 py-0.5 rounded border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-300'}`}>
              {navigator.platform.includes('Mac') ? '⌘' : 'Ctrl'}+Z
            </kbd>
            Annuler
          </span>
        </div>
      </div>
    </div>
  );
}
