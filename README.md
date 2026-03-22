# Kanban Vision

Application web de tableau Kanban permettant d'organiser et visualiser des fichiers Markdown importés depuis votre système de fichiers.

## Fonctionnalités

- **Import de projets** — Importez des dossiers entiers depuis votre machine. L'application lit récursivement les fichiers `.md` et reconstruit l'arborescence.
- **Tableaux Kanban** — Créez plusieurs tableaux indépendants. Ajoutez n'importe quel dossier comme colonne, y compris des dossiers provenant de projets différents.
- **Drag & drop** — Réorganisez les colonnes, déplacez les fichiers entre colonnes, réordonnez les cartes, ou glissez des fichiers `.md` depuis votre OS directement dans une colonne.
- **Visualisation Markdown** — Cliquez sur une carte pour afficher le contenu Markdown en plein écran avec rendu stylisé.
- **Personnalisation** — Renommez projets, dossiers et tableaux. Attribuez des couleurs aux dossiers et projets.
- **Persistance** — Toutes les données sont sauvegardées dans le `localStorage` du navigateur.

## Stack technique

- **React 19** + **TypeScript** + **Vite**
- **Tailwind CSS 4** (thème sombre)
- **@dnd-kit** (drag & drop)
- **react-markdown** + **@tailwindcss/typography** (rendu Markdown)
- **lucide-react** (icônes)
- État global via **React Context** + `useReducer`, persisté dans `localStorage`

## Démarrage

```bash
npm install
npm run dev
```

L'application sera accessible sur `http://localhost:5173`.

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement avec HMR |
| `npm run build` | Build de production (TypeScript + Vite) |
| `npm run preview` | Prévisualisation du build |
| `npm run lint` | Linting ESLint |

## Utilisation

1. Cliquez sur **Nouveau projet** et sélectionnez un dossier contenant des fichiers Markdown.
2. Créez un tableau via le **+** dans la section Tableaux.
3. Cochez les dossiers dans la barre latérale pour les ajouter comme colonnes au tableau actif.
4. Glissez-déposez les cartes pour organiser vos fichiers.
5. Cliquez sur une carte pour lire le contenu Markdown.

## Compatibilité navigateur

L'import de dossiers utilise l'API [File System Access](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API) (Chrome 86+, Edge 86+).
