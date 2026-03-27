import type { FileItem } from '../types';

const API_URL = 'https://api.anthropic.com/v1/messages';

export interface AIConfig {
  apiKey: string;
  model?: string;
}

async function callClaude(config: AIConfig, systemPrompt: string, userMessage: string): Promise<string> {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: config.model || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text || '';
}

export async function summarizeFile(config: AIConfig, file: FileItem): Promise<string> {
  return callClaude(
    config,
    'Tu es un assistant qui resume des fichiers Markdown. Donne un resume concis en 2-3 phrases en francais.',
    `Resume ce fichier intitule "${file.title}":\n\n${file.content.slice(0, 3000)}`
  );
}

export async function generateContent(config: AIConfig, prompt: string): Promise<string> {
  return callClaude(
    config,
    'Tu es un assistant qui genere du contenu Markdown. Reponds directement en Markdown sans explications supplementaires.',
    prompt
  );
}

export async function suggestTags(config: AIConfig, file: FileItem): Promise<string[]> {
  const result = await callClaude(
    config,
    'Tu es un assistant qui categorise des fichiers. Reponds uniquement avec une liste de 2-5 tags pertinents separes par des virgules, sans explication. Tags courts (1-2 mots), en minuscules.',
    `Suggere des tags pour ce fichier "${file.title}":\n\n${file.content.slice(0, 2000)}`
  );
  return result.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean).slice(0, 5);
}

export async function suggestColumn(config: AIConfig, file: FileItem, columnNames: string[]): Promise<string> {
  return callClaude(
    config,
    `Tu es un assistant qui categorise des fichiers. Les colonnes disponibles sont: ${columnNames.join(', ')}. Reponds uniquement avec le nom exact de la colonne la plus appropriee, sans explication.`,
    `Dans quelle colonne ce fichier devrait-il etre place? "${file.title}":\n\n${file.content.slice(0, 1500)}`
  );
}
