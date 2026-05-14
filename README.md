# 📂 Storebox File Explorer

A **VS Code-style file explorer** built from scratch with **React 18**, **TypeScript**, **Vite**, and **Tailwind CSS**. No external file-tree libraries are used — the entire tree is constructed recursively with hand-rolled, immutable state management.

![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Recursive Tree** | Infinite-depth nested folders via self-referencing `TreeNode` components |
| **CRUD Operations** | Create, Rename, and Delete files & folders via inline UI actions |
| **Immutable State** | Pure reducer + structural sharing — no external state library |
| **Inline Editing** | Click "Rename" to swap the label for an inline `<input>` |
| **Folder Toggling** | Expand/collapse folders with chevron icons |
| **Hover Actions** | Action buttons (rename, delete, new file/folder) appear on hover |
| **VS Code Aesthetic** | Dark IDE theme with custom scrollbars, proper icons, and status bar |
| **Type-Safe** | Full TypeScript strict mode with zero `any` types |
| **Zero Dependencies** | No `react-arborist`, `rc-tree`, or similar tree libraries |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x (or **yarn** ≥ 1.22)

### Installation

```bash
# Clone the repository
git clone <repo-url>
cd app

# Install dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at **http://localhost:5173/**

### Build for Production

```bash
npm run build
```

Output is written to `dist/` — ready for static hosting (Vercel, Netlify, etc.).

### Using Yarn

```bash
yarn install
yarn dev        # Development
yarn build      # Production build
```

---

## 🏗️ Architecture Overview

### Project Structure

```
app/
├── src/
│   ├── components/
│   │   ├── FileExplorer.tsx    # Sidebar panel: header, root actions, tree container
│   │   └── TreeNode.tsx        # Recursive node: icons, hover actions, inline edit
│   ├── context/
│   │   └── TreeContext.tsx      # Provider + useReducer state management
│   ├── utils/
│   │   └── treeHelpers.ts      # Pure, immutable tree traversal functions
│   ├── types.ts                # Core type definitions (TreeNode, TreeAction)
│   ├── App.tsx                 # Root layout: sidebar + editor placeholder
│   ├── main.tsx                # React 18 entry point (createRoot)
│   └── index.css               # Global styles + Tailwind theme tokens
├── index.html                  # HTML shell with SEO meta tags
├── vite.config.ts              # Vite + Tailwind CSS v4 plugin config
├── tsconfig.json               # TypeScript project references
└── package.json
```

### Data Model

The tree is modelled as a recursive data structure:

```typescript
interface TreeNode {
  id: string;        // UUID v4 — unique identifier for CRUD targeting
  name: string;      // Display name (e.g., "App.tsx")
  isFolder: boolean; // Discriminant: true = folder, false = file
  children: TreeNode[]; // Recursive children (empty array for files)
  isOpen: boolean;   // UI state: is this folder expanded?
}
```

- Each node carries a unique `id` (UUID v4) for safe, targeted mutations.
- The `isFolder` boolean acts as a type discriminant.
- Children are **always** an array (empty for files), simplifying traversal logic.

### State Management

```
┌─────────────────────────────────────────────────┐
│  TreeProvider                                    │
│  ┌─────────────────────────────────────────┐    │
│  │ useReducer(treeReducer, initialTree)    │    │
│  │   ↕ dispatch(action)                    │    │
│  │   → treeHelpers.* (pure functions)      │    │
│  └─────────────────────────────────────────┘    │
│  React Context → { tree, insertNode, ... }      │
│    └── FileExplorer                              │
│         └── TreeNode (recursive)                 │
└─────────────────────────────────────────────────┘
```

State is managed through the **Provider + useReducer** pattern:

1. **`TreeContext.tsx`** wraps the app in a provider, exposing the tree state and memoised action dispatchers.
2. **`treeReducer`** is a thin dispatcher — each `case` delegates to a pure function in `treeHelpers.ts`.
3. **Convenience methods** (`insertNode`, `deleteNode`, `renameNode`, `toggleFolder`, `addRootNode`) are `useCallback`-wrapped to maintain referential stability.

### Immutable Tree Traversal

All mutation functions in `treeHelpers.ts` are **pure** — they never modify the input:

```typescript
// Example: insertNode performs a DFS, copying only the changed path
function insertNode(tree: TreeNode[], parentId: string, newNode: TreeNode): TreeNode[]
```

**Key principles:**

| Principle | Implementation |
|-----------|---------------|
| **Structural Sharing** | Only the path from root to the modified node is re-created; unchanged subtrees keep their reference |
| **Single DFS Pass** | Each operation is O(n) worst-case, where n = total nodes |
| **Folders First** | `insertNode` places folders before files, mimicking IDE conventions |
| **Auto-Expand** | Inserting into a folder automatically sets `isOpen: true` |

### Recursion Pattern

The `TreeNodeComponent` is the recursive renderer:

```tsx
// Simplified recursive structure
const TreeNodeComponent = ({ node, depth }) => (
  <div>
    {/* This node's row: icon + name + hover actions */}
    <NodeRow node={node} depth={depth} />

    {/* If folder is open, recursively render children */}
    {node.isFolder && node.isOpen && (
      <div>
        {node.children.map(child => (
          <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
        ))}
      </div>
    )}
  </div>
);
```

- **`depth`** prop controls left-padding (16px per level), matching VS Code's indent.
- **`React.memo`** wraps the component to skip re-renders when `node` and `depth` are unchanged.
- **Folder children** are only mounted when `isOpen` is `true` (conditional rendering, not CSS hide).

### Component Responsibilities

| Component | Role |
|-----------|------|
| `App.tsx` | Full-page layout: sidebar + editor area. Wraps everything in `TreeProvider`. |
| `FileExplorer.tsx` | Sidebar panel: "Explorer" header, root-level create buttons, tree container, item counter. |
| `TreeNode.tsx` | Single node: file/folder icon, name/rename input, hover actions, recursive children. |
| `TreeContext.tsx` | State provider: `useReducer` with memoised action dispatchers. |
| `treeHelpers.ts` | Pure functions: `insertNode`, `deleteNode`, `renameNode`, `toggleFolder`. |

---

## 🎨 Styling

The app uses **Tailwind CSS v4** with custom theme tokens defined as CSS custom properties:

```css
@theme {
  --color-ide-bg: #1e1e1e;
  --color-ide-sidebar: #252526;
  --color-ide-accent: #007acc;
  --color-ide-folder: #dcb67a;
  /* ... */
}
```

These tokens are used as Tailwind utilities (e.g., `bg-ide-sidebar`, `text-ide-accent`) for a consistent, VS Code-inspired dark theme.

Icons are provided by **[Lucide React](https://lucide.dev/)** — a lightweight, tree-shakeable icon library.

---

## 🧪 Constraint Compliance

| # | Constraint | Status |
|---|-----------|--------|
| 1 | No external file-tree libraries | ✅ Built from scratch |
| 2 | Production-grade, modular, documented | ✅ JSDoc + modular architecture |
| 3 | Immutable tree state via Context/Hook | ✅ `useReducer` + pure helpers |
| 4 | CRUD with unique node IDs | ✅ UUID-based targeting |
| 5 | Root-level "+ New File" / "+ New Folder" | ✅ Header action buttons |
| 6 | Recursive `TreeNode` component | ✅ Self-referencing render |
| 7 | Inline rename on hover | ✅ Input swap on click |
| 8 | Folder toggle with chevron | ✅ `ChevronRight` / `ChevronDown` |
| 9 | VS Code styling with Tailwind | ✅ Dark IDE theme |
| 10 | Lucide icons | ✅ File, Folder, Pencil, Trash2, etc. |

---

## 📜 License

MIT
