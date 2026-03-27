import { X, PenTool, Zap, BookOpen, FileText, Bug, User } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BOARD_TEMPLATES } from '../lib/templates';
import type { BoardTemplate } from '../lib/templates';

interface TemplatePickerProps {
  isOpen: boolean;
  onClose: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  'pen-tool': <PenTool size={20} />,
  'zap': <Zap size={20} />,
  'book-open': <BookOpen size={20} />,
  'file-text': <FileText size={20} />,
  'bug': <Bug size={20} />,
  'user': <User size={20} />,
};

export function TemplatePicker({ isOpen, onClose }: TemplatePickerProps) {
  const { state, dispatch } = useApp();
  const isDark = state.theme === 'dark';

  const handleSelect = (template: BoardTemplate) => {
    dispatch({
      type: 'CREATE_BOARD_FROM_TEMPLATE',
      payload: { name: template.name, columns: template.columns },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Choisir un template"
    >
      <div
        className={`border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col mx-4 animate-slideDown ${
          isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Demarrer avec un template
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Choisissez un template pour creer un tableau avec des colonnes pretes a l'emploi
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded transition-colors ${
              isDark ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
            }`}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Templates grid */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="grid grid-cols-2 gap-3">
            {BOARD_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleSelect(template)}
                className={`text-left p-4 rounded-lg border transition-all hover:scale-[1.02] ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-indigo-500/50 hover:bg-gray-750'
                    : 'bg-gray-50 border-gray-200 hover:border-indigo-400 hover:bg-white hover:shadow-md'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isDark ? 'bg-gray-700 text-indigo-400' : 'bg-indigo-50 text-indigo-600'
                  }`}>
                    {iconMap[template.icon] || <FileText size={20} />}
                  </div>
                  <h3 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {template.name}
                  </h3>
                </div>
                <p className={`text-xs mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {template.description}
                </p>
                <div className="flex gap-1.5">
                  {template.columns.map((col, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                        isDark ? 'bg-gray-700' : 'bg-gray-200'
                      }`}
                    >
                      <div
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: col.color }}
                      />
                      <span className={`truncate ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {col.name}
                      </span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
