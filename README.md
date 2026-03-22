# Kanban Vision

A visual Kanban dashboard for organizing and viewing Markdown files, built with React, TypeScript, and Vite.

## Features

- **Multi-project support** — Import multiple folder-based projects, each with its own color
- **Kanban boards** — Create boards with customizable column layouts mapped to your folders
- **Drag & drop** — Reorder files and move them between columns with dnd-kit
- **Markdown viewer** — Preview `.md` files directly in the app with react-markdown
- **Folder tree navigation** — Browse nested folder structures in the sidebar
- **Local storage persistence** — Your boards and projects are saved automatically in the browser

## Tech Stack

- React 19 + TypeScript
- Vite 8
- Tailwind CSS 4
- dnd-kit (drag & drop)
- react-markdown
- lucide-react (icons)

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. Open the app and import a folder containing Markdown files
2. Create a new board from the sidebar
3. Toggle which folders appear as columns in your board
4. Drag and drop files between columns to organize your workflow
5. Click on a file card to preview its Markdown content
