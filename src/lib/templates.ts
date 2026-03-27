export interface BoardTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: { name: string; color: string }[];
}

export const BOARD_TEMPLATES: BoardTemplate[] = [
  {
    id: 'content-pipeline',
    name: 'Content Pipeline',
    description: 'Organisez votre workflow de contenu du brouillon a la publication',
    icon: 'pen-tool',
    columns: [
      { name: 'Idees', color: '#f59e0b' },
      { name: 'Brouillon', color: '#f97316' },
      { name: 'Relecture', color: '#8b5cf6' },
      { name: 'Publie', color: '#22c55e' },
    ],
  },
  {
    id: 'sprint-board',
    name: 'Sprint Board',
    description: 'Gerez vos sprints avec un tableau Kanban classique',
    icon: 'zap',
    columns: [
      { name: 'Backlog', color: '#6366f1' },
      { name: 'En cours', color: '#0ea5e9' },
      { name: 'Review', color: '#f59e0b' },
      { name: 'Done', color: '#22c55e' },
    ],
  },
  {
    id: 'research-notes',
    name: 'Notes de Recherche',
    description: 'Suivi de vos lectures et notes de recherche',
    icon: 'book-open',
    columns: [
      { name: 'A lire', color: '#ef4444' },
      { name: 'En lecture', color: '#f97316' },
      { name: 'Resume', color: '#0ea5e9' },
      { name: 'Archive', color: '#6b7280' },
    ],
  },
  {
    id: 'blog-writing',
    name: 'Blog Writing',
    description: 'Pipeline de redaction pour votre blog',
    icon: 'file-text',
    columns: [
      { name: 'Idees', color: '#a855f7' },
      { name: 'Outline', color: '#6366f1' },
      { name: 'Draft', color: '#0ea5e9' },
      { name: 'Published', color: '#22c55e' },
    ],
  },
  {
    id: 'bug-tracker',
    name: 'Bug Tracker',
    description: 'Suivez et resolvez les bugs de votre projet',
    icon: 'bug',
    columns: [
      { name: 'Nouveau', color: '#ef4444' },
      { name: 'En investigation', color: '#f59e0b' },
      { name: 'En cours de fix', color: '#0ea5e9' },
      { name: 'Resolu', color: '#22c55e' },
    ],
  },
  {
    id: 'personal-kanban',
    name: 'Kanban Personnel',
    description: 'Un tableau simple pour organiser vos taches quotidiennes',
    icon: 'user',
    columns: [
      { name: 'A faire', color: '#ef4444' },
      { name: 'En cours', color: '#f59e0b' },
      { name: 'Termine', color: '#22c55e' },
    ],
  },
];
