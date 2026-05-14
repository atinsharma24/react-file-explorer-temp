/**
 * ============================================================================
 * TreeContext.tsx — Centralised Tree State Management
 * ============================================================================
 *
 * Implements the "Provider + useReducer" pattern for predictable, immutable
 * state management without any external library (Redux, Zustand, etc.).
 *
 * Architecture:
 * ┌─────────────────────────────────────────────┐
 * │  TreeProvider                                │
 * │  ┌───────────────────────────────────────┐   │
 * │  │ useReducer(treeReducer, initialTree)  │   │
 * │  │   ↕ dispatch(action)                  │   │
 * │  │   → treeHelpers.* (pure transforms)   │   │
 * │  └───────────────────────────────────────┘   │
 * │  Context.Provider value={...}                │
 * │    └── children (FileExplorer, TreeNode…)    │
 * └─────────────────────────────────────────────┘
 *
 * The reducer delegates to the pure helper functions in `treeHelpers.ts`,
 * keeping the reducer itself a thin dispatcher.
 *
 * ============================================================================
 */

import React, { createContext, useContext, useReducer, useCallback, useMemo } from 'react';
import type { TreeNode, TreeContextValue } from '../types';
import * as helpers from '../utils/treeHelpers';

/**
 * Extended action type that includes root-level insertion.
 * The public `TreeAction` union doesn't include this because
 * it's an internal implementation detail of this provider.
 */
type InternalAction =
  | { type: 'INSERT_NODE'; payload: { parentId: string; node: TreeNode } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'RENAME_NODE'; payload: { nodeId: string; newName: string } }
  | { type: 'TOGGLE_FOLDER'; payload: { nodeId: string } }
  | { type: 'ADD_ROOT_NODE'; payload: { node: TreeNode } };

// ─── Initial Demo Data ─────────────────────────────────────────────────────
// Pre-populated tree to demonstrate nested folders and files.

const initialTree: TreeNode[] = [
  {
    id: helpers.generateId(),
    name: 'src',
    isFolder: true,
    isOpen: true,
    children: [
      {
        id: helpers.generateId(),
        name: 'components',
        isFolder: true,
        isOpen: false,
        children: [
          {
            id: helpers.generateId(),
            name: 'Button.tsx',
            isFolder: false,
            isOpen: false,
            children: [],
          },
          {
            id: helpers.generateId(),
            name: 'Header.tsx',
            isFolder: false,
            isOpen: false,
            children: [],
          },
          {
            id: helpers.generateId(),
            name: 'Sidebar.tsx',
            isFolder: false,
            isOpen: false,
            children: [],
          },
        ],
      },
      {
        id: helpers.generateId(),
        name: 'hooks',
        isFolder: true,
        isOpen: false,
        children: [
          {
            id: helpers.generateId(),
            name: 'useAuth.ts',
            isFolder: false,
            isOpen: false,
            children: [],
          },
          {
            id: helpers.generateId(),
            name: 'useTheme.ts',
            isFolder: false,
            isOpen: false,
            children: [],
          },
        ],
      },
      {
        id: helpers.generateId(),
        name: 'utils',
        isFolder: true,
        isOpen: false,
        children: [
          {
            id: helpers.generateId(),
            name: 'helpers.ts',
            isFolder: false,
            isOpen: false,
            children: [],
          },
        ],
      },
      {
        id: helpers.generateId(),
        name: 'App.tsx',
        isFolder: false,
        isOpen: false,
        children: [],
      },
      {
        id: helpers.generateId(),
        name: 'main.tsx',
        isFolder: false,
        isOpen: false,
        children: [],
      },
      {
        id: helpers.generateId(),
        name: 'index.css',
        isFolder: false,
        isOpen: false,
        children: [],
      },
    ],
  },
  {
    id: helpers.generateId(),
    name: 'public',
    isFolder: true,
    isOpen: false,
    children: [
      {
        id: helpers.generateId(),
        name: 'favicon.ico',
        isFolder: false,
        isOpen: false,
        children: [],
      },
      {
        id: helpers.generateId(),
        name: 'robots.txt',
        isFolder: false,
        isOpen: false,
        children: [],
      },
    ],
  },
  {
    id: helpers.generateId(),
    name: 'package.json',
    isFolder: false,
    isOpen: false,
    children: [],
  },
  {
    id: helpers.generateId(),
    name: 'tsconfig.json',
    isFolder: false,
    isOpen: false,
    children: [],
  },
  {
    id: helpers.generateId(),
    name: 'README.md',
    isFolder: false,
    isOpen: false,
    children: [],
  },
  {
    id: helpers.generateId(),
    name: '.gitignore',
    isFolder: false,
    isOpen: false,
    children: [],
  },
];

// ─── Reducer ────────────────────────────────────────────────────────────────

/**
 * Pure reducer that delegates to the tree helper functions.
 * Each case returns a brand-new root array reference, triggering
 * React's reconciliation only for changed subtrees.
 */
function treeReducer(state: TreeNode[], action: InternalAction): TreeNode[] {
  switch (action.type) {
    case 'INSERT_NODE':
      return helpers.insertNode(state, action.payload.parentId, action.payload.node);
    case 'DELETE_NODE':
      return helpers.deleteNode(state, action.payload.nodeId);
    case 'RENAME_NODE':
      return helpers.renameNode(state, action.payload.nodeId, action.payload.newName);
    case 'TOGGLE_FOLDER':
      return helpers.toggleFolder(state, action.payload.nodeId);
    case 'ADD_ROOT_NODE': {
      const { node } = action.payload;
      // Folders go to the top; files append at the end.
      return node.isFolder ? [node, ...state] : [...state, node];
    }
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

const TreeContext = createContext<TreeContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

interface TreeProviderProps {
  children: React.ReactNode;
}

/**
 * Provides the tree state and action dispatchers to all descendants.
 *
 * Convenience methods (`insertNode`, `deleteNode`, etc.) are memoised
 * to maintain referential stability, preventing unnecessary re-renders
 * in consuming components that destructure specific callbacks.
 */
export function TreeProvider({ children }: TreeProviderProps) {
  const [tree, dispatch] = useReducer(treeReducer, initialTree);

  const insertNode = useCallback(
    (parentId: string, node: TreeNode) => {
      dispatch({ type: 'INSERT_NODE', payload: { parentId, node } });
    },
    [dispatch],
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      dispatch({ type: 'DELETE_NODE', payload: { nodeId } });
    },
    [dispatch],
  );

  const renameNode = useCallback(
    (nodeId: string, newName: string) => {
      dispatch({ type: 'RENAME_NODE', payload: { nodeId, newName } });
    },
    [dispatch],
  );

  const toggleFolder = useCallback(
    (nodeId: string) => {
      dispatch({ type: 'TOGGLE_FOLDER', payload: { nodeId } });
    },
    [dispatch],
  );

  const addRootNode = useCallback(
    (node: TreeNode) => {
      dispatch({
        type: 'ADD_ROOT_NODE',
        payload: { node },
      });
    },
    [dispatch],
  );

  const value = useMemo<TreeContextValue>(
    () => ({
      tree,
      dispatch,
      insertNode,
      deleteNode,
      renameNode,
      toggleFolder,
      addRootNode,
    }),
    [tree, dispatch, insertNode, deleteNode, renameNode, toggleFolder, addRootNode],
  );

  return <TreeContext.Provider value={value}>{children}</TreeContext.Provider>;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

/**
 * Custom hook to consume the tree context.
 *
 * @throws Error if used outside of a `<TreeProvider>`.
 */
export function useTree(): TreeContextValue {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error(
      'useTree() must be used within a <TreeProvider>. ' +
        'Wrap your component tree with <TreeProvider> to provide the file explorer state.',
    );
  }
  return context;
}
