import type { GitLabConfig, FileItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

export interface GitLabIssue {
  id: number;
  iid: number;
  title: string;
  description: string | null;
  state: 'opened' | 'closed';
  labels: string[];
  web_url: string;
}

async function gitlabFetch(
  config: GitLabConfig,
  path: string,
  options?: RequestInit
): Promise<Response> {
  const url = `${config.instanceUrl.replace(/\/$/, '')}/api/v4${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'PRIVATE-TOKEN': config.token,
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`GitLab API ${res.status}: ${text}`);
  }
  return res;
}

export async function testConnection(config: GitLabConfig): Promise<{ name: string }> {
  const res = await gitlabFetch(config, `/projects/${config.projectId}`);
  const data = await res.json();
  return { name: data.name_with_namespace || data.name };
}

export async function fetchIssues(
  config: GitLabConfig,
  params?: { labels?: string; state?: 'opened' | 'closed' | 'all'; per_page?: number }
): Promise<GitLabIssue[]> {
  const searchParams = new URLSearchParams();
  if (params?.labels) searchParams.set('labels', params.labels);
  if (params?.state) searchParams.set('state', params.state);
  searchParams.set('per_page', String(params?.per_page ?? 100));

  const query = searchParams.toString();
  const res = await gitlabFetch(
    config,
    `/projects/${config.projectId}/issues${query ? `?${query}` : ''}`
  );
  return res.json();
}

export async function createIssue(
  config: GitLabConfig,
  title: string,
  description?: string,
  labels?: string[]
): Promise<GitLabIssue> {
  const res = await gitlabFetch(config, `/projects/${config.projectId}/issues`, {
    method: 'POST',
    body: JSON.stringify({
      title,
      description: description || '',
      labels: labels?.join(',') || '',
    }),
  });
  return res.json();
}

export async function updateIssue(
  config: GitLabConfig,
  iid: number,
  data: { title?: string; description?: string; labels?: string[]; state_event?: 'close' | 'reopen' }
): Promise<GitLabIssue> {
  const body: Record<string, unknown> = {};
  if (data.title !== undefined) body.title = data.title;
  if (data.description !== undefined) body.description = data.description;
  if (data.labels !== undefined) body.labels = data.labels.join(',');
  if (data.state_event !== undefined) body.state_event = data.state_event;

  const res = await gitlabFetch(config, `/projects/${config.projectId}/issues/${iid}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
  return res.json();
}

export function gitlabIssueToFileItem(issue: GitLabIssue): FileItem {
  return {
    id: uuidv4(),
    title: issue.title,
    content: issue.description || '',
    gitlabIssueIid: issue.iid,
  };
}

export async function fetchAndConvertIssues(
  config: GitLabConfig,
  label?: string
): Promise<FileItem[]> {
  const issues = await fetchIssues(config, {
    labels: label,
    state: 'opened',
  });
  return issues.map(gitlabIssueToFileItem);
}
