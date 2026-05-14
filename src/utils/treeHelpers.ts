/**
 * ============================================================================
 * treeHelpers.ts — Pure, Immutable Tree Traversal & Mutation Functions
 * ============================================================================
 *
 * All functions in this module are **pure**: they never mutate the input tree.
 * Instead, they return a structurally-shared copy where only the affected path
 * from the root to the target node is re-created (similar to how persistent
 * data structures work in libraries like Immer or Immutable.js, but hand-rolled
 * for full transparency and zero dependencies).
 *
 * Complexity: Each operation performs a single DFS pass — O(n) in the worst
 * case where n is the total number of nodes. Structural sharing ensures that
 * React's reconciler can skip re-rendering unchanged subtrees.
 *
 * ============================================================================
 */

import type { TreeNode } from '../types';

/**
 * Generate a UUID v4 string.
 *
 * Uses `crypto.randomUUID()` when available (all modern browsers),
 * with a Math.random fallback for legacy environments.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback: RFC 4122 v4 compliant UUID via Math.random
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Create a new TreeNode with sensible defaults.
 *
 * @param name     - Display name for the node.
 * @param isFolder - Whether this node is a folder.
 * @returns A fully-initialised TreeNode with a unique ID.
 */
export function createNode(name: string, isFolder: boolean): TreeNode {
  return {
    id: generateId(),
    name,
    isFolder,
    children: [],
    isOpen: false,
  };
}

/**
 * Insert a new child node under the parent identified by `parentId`.
 *
 * The function performs a recursive DFS. When the parent is found the new
 * node is appended to the children array which is then passed through
 * `sortNodes` to maintain the canonical "folders first, alphabetical"
 * ordering. The parent folder is automatically expanded (`isOpen: true`).
 *
 * If `parentId` is not found, the original tree is returned unchanged.
 *
 * @param tree     - The current root-level array of nodes.
 * @param parentId - The ID of the folder to insert into.
 * @param newNode  - The node to insert.
 * @returns A new tree array with the node inserted.
 */
export function insertNode(
  tree: TreeNode[],
  parentId: string,
  newNode: TreeNode,
): TreeNode[] {
  return tree.map((node) => {
    if (node.id === parentId) {
      // Append the new child and let sortNodes enforce canonical ordering.
      const updatedChildren = sortNodes([...node.children, newNode]);

      return {
        ...node,
        children: updatedChildren,
        isOpen: true, // Auto-expand when a child is added
      };
    }

    // Recurse into children if this is a folder
    if (node.isFolder && node.children.length > 0) {
      const updatedChildren = insertNode(node.children, parentId, newNode);
      // Only create a new reference if children actually changed
      if (updatedChildren !== node.children) {
        return { ...node, children: updatedChildren };
      }
    }

    return node;
  });
}

/**
 * Delete the node identified by `nodeId` from the tree.
 *
 * Removes the node and its entire subtree. Uses `.filter()` at each level
 * to produce a new array reference only when a match is found.
 *
 * @param tree   - The current root-level array of nodes.
 * @param nodeId - The ID of the node to delete.
 * @returns A new tree array with the node removed.
 */
export function deleteNode(tree: TreeNode[], nodeId: string): TreeNode[] {
  return tree
    .filter((node) => node.id !== nodeId)
    .map((node) => {
      if (node.isFolder && node.children.length > 0) {
        return {
          ...node,
          children: deleteNode(node.children, nodeId),
        };
      }
      return node;
    });
}

/**
 * Rename the node identified by `nodeId`.
 *
 * After renaming, the **parent's** children array is re-sorted via
 * `sortNodes` so that alphabetical ordering is preserved.
 *
 * @param tree    - The current root-level array of nodes.
 * @param nodeId  - The ID of the node to rename.
 * @param newName - The new display name.
 * @returns A new tree array with the node renamed.
 */
export function renameNode(
  tree: TreeNode[],
  nodeId: string,
  newName: string,
): TreeNode[] {
  const renamed = tree.map((node) => {
    if (node.id === nodeId) {
      return { ...node, name: newName };
    }

    if (node.isFolder && node.children.length > 0) {
      const updatedChildren = renameNode(node.children, nodeId, newName);
      if (updatedChildren !== node.children) {
        // Re-sort children after a descendant was renamed.
        return { ...node, children: sortNodes(updatedChildren) };
      }
    }

    return node;
  });

  // If a root-level node was renamed, re-sort the root array too.
  return renamed !== tree ? sortNodes(renamed) : renamed;
}

/**
 * Toggle the `isOpen` state of a folder node.
 *
 * @param tree   - The current root-level array of nodes.
 * @param nodeId - The ID of the folder to toggle.
 * @returns A new tree array with the folder's open state flipped.
 */
export function toggleFolder(tree: TreeNode[], nodeId: string): TreeNode[] {
  return tree.map((node) => {
    if (node.id === nodeId) {
      return { ...node, isOpen: !node.isOpen };
    }

    if (node.isFolder && node.children.length > 0) {
      const updatedChildren = toggleFolder(node.children, nodeId);
      if (updatedChildren !== node.children) {
        return { ...node, children: updatedChildren };
      }
    }

    return node;
  });
}

/**
 * Sort nodes with the "folders first" convention.
 * Within each group (folders / files), items are sorted alphabetically
 * in a case-insensitive manner.
 *
 * @param nodes - Array of nodes to sort.
 * @returns A new sorted array.
 */
export function sortNodes(nodes: TreeNode[]): TreeNode[] {
  return [...nodes].sort((a, b) => {
    // Folders before files
    if (a.isFolder && !b.isFolder) return -1;
    if (!a.isFolder && b.isFolder) return 1;
    // Alphabetical within group
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });
}
