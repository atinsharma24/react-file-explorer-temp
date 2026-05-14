/**
 * ============================================================================
 * types.ts — Core Type Definitions for the File Explorer
 * ============================================================================
 *
 * This module defines the foundational data structures used throughout the
 * application. The tree is modelled as a recursive structure where each node
 * can be either a "file" or a "folder". Folders contain an ordered array of
 * child nodes, enabling infinite nesting depth.
 *
 * Design Decisions:
 * - Each node carries a unique `id` (UUID) for safe CRUD targeting.
 * - `isFolder` discriminant enables exhaustive type narrowing in components.
 * - Children are stored as an immutable array; all mutations produce new refs.
 * ============================================================================
 */

/**
 * Represents a single node in the file tree.
 *
 * @property id       - A globally unique identifier (UUID v4).
 * @property name     - The display name of the file or folder.
 * @property isFolder - Discriminant flag: `true` for folders, `false` for files.
 * @property children - Ordered child nodes. Only meaningful when `isFolder` is true.
 *                      Always present (empty array for files) to simplify traversal.
 * @property isOpen   - Whether a folder is expanded in the UI. Ignored for files.
 */
export interface TreeNode {
  id: string;
  name: string;
  isFolder: boolean;
  children: TreeNode[];
  isOpen: boolean;
}

/**
 * Supported CRUD actions dispatched through the tree context.
 *
 * - INSERT_NODE:  Adds a new child node under a specified parent folder.
 * - DELETE_NODE:  Removes a node (and its entire subtree) by ID.
 * - RENAME_NODE:  Updates the `name` field of a node by ID.
 * - TOGGLE_FOLDER: Flips the `isOpen` state of a folder node.
 */
export type TreeAction =
  | { type: 'INSERT_NODE'; payload: { parentId: string; node: TreeNode } }
  | { type: 'DELETE_NODE'; payload: { nodeId: string } }
  | { type: 'RENAME_NODE'; payload: { nodeId: string; newName: string } }
  | { type: 'TOGGLE_FOLDER'; payload: { nodeId: string } };

/**
 * Shape of the value provided by the TreeContext.
 *
 * @property tree       - The root-level array of tree nodes.
 * @property dispatch   - Dispatcher for tree mutations.
 * @property insertNode - Convenience: insert a child under a given parent.
 * @property deleteNode - Convenience: remove a node by ID.
 * @property renameNode - Convenience: rename a node by ID.
 * @property toggleFolder - Convenience: toggle a folder's open/closed state.
 * @property addRootNode  - Convenience: add a new node at the root level.
 */
export interface TreeContextValue {
  tree: TreeNode[];
  dispatch: React.Dispatch<TreeAction>;
  insertNode: (parentId: string, node: TreeNode) => void;
  deleteNode: (nodeId: string) => void;
  renameNode: (nodeId: string, newName: string) => void;
  toggleFolder: (nodeId: string) => void;
  addRootNode: (node: TreeNode) => void;
}
