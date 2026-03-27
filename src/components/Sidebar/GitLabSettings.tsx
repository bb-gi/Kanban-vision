import { useState } from 'react';
import {
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  RefreshCw,
  Unlink,
} from 'lucide-react';
import type { Project, Folder } from '../../types';
import { useApp } from '../../context/AppContext';
import { testConnection, fetchAndConvertIssues } from '../../lib/gitlabApi';
import { flattenFolders } from '../../lib/folderUtils';

interface GitLabSettingsProps {
  project: Project;
  onClose: () => void;
}

export function GitLabSettings({ project, onClose }: GitLabSettingsProps) {
  const { dispatch } = useApp();
  const config = project.gitlabConfig;

  const [instanceUrl, setInstanceUrl] = useState(config?.instanceUrl ?? 'https://gitlab.com');
  const [token, setToken] = useState(config?.token ?? '');
  const [projectId, setProjectId] = useState(config?.projectId?.toString() ?? '');

  const [testStatus, setTestStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  const [syncStatus, setSyncStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [syncMessage, setSyncMessage] = useState('');

  const allFolders = flattenFolders(project.folders);

  const handleTestConnection = async () => {
    if (!token || !projectId) return;
    setTestStatus('loading');
    try {
      const currentConfig = { instanceUrl: instanceUrl.trim(), token: token.trim(), projectId: parseInt(projectId) };
      const result = await testConnection(currentConfig);
      setTestStatus('success');
      setTestMessage(`Connecté à : ${result.name}`);
    } catch (err) {
      setTestStatus('error');
      setTestMessage(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  const handleSave = () => {
    if (!token || !projectId) return;
    dispatch({
      type: 'SET_GITLAB_CONFIG',
      payload: {
        projectId: project.id,
        config: {
          instanceUrl: instanceUrl.trim(),
          token: token.trim(),
          projectId: parseInt(projectId),
        },
      },
    });
    setTestMessage('Configuration sauvegardée');
    setTestStatus('success');
  };

  const handleRemove = () => {
    dispatch({ type: 'REMOVE_GITLAB_CONFIG', payload: { projectId: project.id } });
    setToken('');
    setProjectId('');
    setTestStatus('idle');
    setTestMessage('');
  };

  const handleSetLabel = (folderId: string, label: string) => {
    dispatch({ type: 'SET_FOLDER_GITLAB_LABEL', payload: { folderId, label } });
  };

  const handleSyncAll = async () => {
    if (!config) return;
    setSyncStatus('loading');
    setSyncMessage('');
    try {
      const foldersWithLabels = allFolders.filter((f) => f.gitlabLabel);
      if (foldersWithLabels.length === 0) {
        setSyncStatus('error');
        setSyncMessage('Aucun dossier avec un label GitLab configuré');
        return;
      }
      let total = 0;
      for (const folder of foldersWithLabels) {
        const files = await fetchAndConvertIssues(config, folder.gitlabLabel);
        dispatch({
          type: 'SYNC_GITLAB_ISSUES',
          payload: { projectId: project.id, folderId: folder.id, files },
        });
        total += files.length;
      }
      setSyncStatus('success');
      setSyncMessage(`${total} issue(s) synchronisée(s) dans ${foldersWithLabels.length} dossier(s)`);
    } catch (err) {
      setSyncStatus('error');
      setSyncMessage(err instanceof Error ? err.message : 'Erreur de synchronisation');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
          <div className="flex items-center gap-2 text-white">
            <GitBranch size={18} className="text-orange-400" />
            <h2 className="text-sm font-semibold">GitLab — {project.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-700"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Connection settings */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Connexion</h3>

            <div>
              <label className="block text-xs text-gray-400 mb-1">URL de l'instance</label>
              <input
                value={instanceUrl}
                onChange={(e) => setInstanceUrl(e.target.value)}
                placeholder="https://gitlab.com"
                className="w-full bg-gray-900 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Personal Access Token</label>
              <input
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="glpat-xxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-gray-900 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">ID du projet GitLab</label>
              <input
                value={projectId}
                onChange={(e) => setProjectId(e.target.value.replace(/\D/g, ''))}
                placeholder="12345"
                className="w-full bg-gray-900 text-white text-sm px-3 py-1.5 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleTestConnection}
                disabled={!token || !projectId || testStatus === 'loading'}
                className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 text-white text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testStatus === 'loading' ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <CheckCircle2 size={14} />
                )}
                Tester
              </button>
              <button
                onClick={handleSave}
                disabled={!token || !projectId}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sauvegarder
              </button>
              {config && (
                <button
                  onClick={handleRemove}
                  className="flex items-center gap-1.5 bg-red-600/20 hover:bg-red-600/40 text-red-400 text-sm px-3 py-1.5 rounded transition-colors"
                >
                  <Unlink size={14} />
                  Retirer
                </button>
              )}
            </div>

            {testMessage && (
              <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded ${
                testStatus === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
              }`}>
                {testStatus === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                {testMessage}
              </div>
            )}
          </div>

          {/* Label mapping */}
          {config && (
            <div className="space-y-3 border-t border-gray-700 pt-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Mapping Dossiers → Labels GitLab
              </h3>
              <p className="text-xs text-gray-500">
                Associez un label GitLab à chaque dossier. Les issues avec ce label seront synchronisées dans le dossier correspondant.
              </p>

              <div className="space-y-2">
                {allFolders.map((folder) => (
                  <FolderLabelRow
                    key={folder.id}
                    folder={folder}
                    onSetLabel={(label) => handleSetLabel(folder.id, label)}
                  />
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={handleSyncAll}
                  disabled={syncStatus === 'loading'}
                  className="flex items-center gap-1.5 bg-orange-600 hover:bg-orange-500 text-white text-sm px-3 py-1.5 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {syncStatus === 'loading' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <RefreshCw size={14} />
                  )}
                  Synchroniser maintenant
                </button>
              </div>

              {syncMessage && (
                <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded ${
                  syncStatus === 'success' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                }`}>
                  {syncStatus === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
                  {syncMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FolderLabelRow({ folder, onSetLabel }: { folder: Folder; onSetLabel: (label: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: folder.color }}
      />
      <span className="text-sm text-gray-200 truncate w-32 shrink-0">{folder.displayName}</span>
      <input
        value={folder.gitlabLabel ?? ''}
        onChange={(e) => onSetLabel(e.target.value)}
        placeholder="Label GitLab"
        className="flex-1 bg-gray-900 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-indigo-500 focus:outline-none"
      />
    </div>
  );
}
