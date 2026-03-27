import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface KeyboardShortcutsProps {
  isOpen: boolean;
  onClose: () => void;
}

const isMac = typeof navigator !== 'undefined' && navigator.platform.includes('Mac');
const mod = isMac ? '⌘' : 'Ctrl';

const shortcuts = [
  { category: 'Navigation', items: [
    { keys: `${mod}+K`, desc: 'Ouvrir la recherche' },
    { keys: `${mod}+I`, desc: 'Ouvrir l\'assistant IA' },
    { keys: `${mod}+G`, desc: 'Ouvrir le graphe de connexions' },
    { keys: '?', desc: 'Raccourcis clavier' },
  ]},
  { category: 'Edition', items: [
    { keys: `${mod}+Z`, desc: 'Annuler' },
    { keys: `${mod}+Shift+Z`, desc: 'Retablir' },
    { keys: `${mod}+E`, desc: 'Editer le fichier ouvert' },
    { keys: `${mod}+S`, desc: 'Sauvegarder (en mode edition)' },
  ]},
  { category: 'General', items: [
    { keys: 'Esc', desc: 'Fermer le modal / annuler' },
    { keys: 'Enter', desc: 'Ouvrir un fichier selectionne' },
    { keys: '↑ ↓', desc: 'Naviguer dans les resultats' },
  ]},
];

export function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const { state } = useApp();
  const isDark = state.theme === 'dark';

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Raccourcis clavier"
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-lg mx-4 animate-slideDown ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`flex items-center justify-between px-5 py-3 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            Raccourcis clavier
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

        <div className="p-5 space-y-5">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
                isDark ? 'text-gray-500' : 'text-gray-400'
              }`}>
                {section.category}
              </h3>
              <div className="space-y-1.5">
                {section.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.desc}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.keys.split('+').map((key, i) => (
                        <span key={i}>
                          {i > 0 && <span className={`mx-0.5 text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>+</span>}
                          <kbd className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${
                            isDark
                              ? 'bg-gray-800 text-gray-300 border border-gray-700'
                              : 'bg-gray-100 text-gray-600 border border-gray-300'
                          }`}>
                            {key}
                          </kbd>
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
