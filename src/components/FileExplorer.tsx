/**
 * ============================================================================
 * FileExplorer.tsx — Main Sidebar Panel
 * ============================================================================
 *
 * Top-level container for the file explorer. Renders:
 *   1. A branded header with the project name.
 *   2. Root-level "New File" and "New Folder" action buttons.
 *   3. The recursive tree of TreeNodeComponents.
 *   4. An inline input for root-level item creation.
 *
 * This component reads the tree state from TreeContext and maps over
 * root-level nodes, delegating individual rendering to TreeNodeComponent.
 *
 * ============================================================================
 */

import React, { useCallback } from 'react';
import { FilePlus, FolderPlus, File, Folder, ChevronDown } from 'lucide-react';
import { useTree } from '../context/TreeContext';
import { createNode } from '../utils/treeHelpers';
import { useInlineEditor } from '../hooks/useInlineEditor';
import TreeNodeComponent from './TreeNode';

const FileExplorer: React.FC = () => {
  const { tree, addRootNode } = useTree();

  // ── Root-level inline creation via shared hook ──────────────────────
  const handleRootCreate = useCallback(
    (name: string, type: 'file' | 'folder') => {
      const newNode = createNode(name, type === 'folder');
      addRootNode(newNode);
    },
    [addRootNode],
  );

  const editor = useInlineEditor({ onSubmit: handleRootCreate });

  // ── Render ──────────────────────────────────────────────────────────

  return (
    <aside
      className="w-[280px] h-screen bg-ide-sidebar flex flex-col border-r border-ide-border"
      role="navigation"
      aria-label="File Explorer"
    >
      {/* ─── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-[35px] bg-ide-sidebar-header border-b border-ide-border flex-shrink-0">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-ide-text-muted">
          Explorer
        </span>
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-ide-active text-ide-text-muted hover:text-ide-text-bright transition-colors"
            onClick={() => editor.startCreate('file')}
            title="New File"
            aria-label="New root file"
          >
            <FilePlus size={16} />
          </button>
          <button
            className="p-1 rounded hover:bg-ide-active text-ide-text-muted hover:text-ide-text-bright transition-colors"
            onClick={() => editor.startCreate('folder')}
            title="New Folder"
            aria-label="New root folder"
          >
            <FolderPlus size={16} />
          </button>
        </div>
      </div>

      {/* ─── Project Section Header ────────────────────────────────── */}
      <div className="flex items-center h-[22px] px-2 bg-ide-sidebar text-[11px] font-semibold uppercase tracking-wider text-ide-text-muted">
        <ChevronDown size={16} className="mr-1 text-ide-text-muted" />
        <span>Storebox Project</span>
      </div>

      {/* ─── Tree Content ──────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden py-0.5"
        role="tree"
        aria-label="File tree"
      >
        {/* Root-level inline creation */}
        {editor.isCreating && (
          <div className="flex items-center h-[22px] pl-2 animate-fade-in">
            <span className="w-4 h-4 flex items-center justify-center mr-1.5 flex-shrink-0">
              {editor.isCreating === 'folder' ? (
                <Folder size={16} className="text-ide-folder" />
              ) : (
                <File size={16} className="text-ide-file" />
              )}
            </span>
            <input
              ref={editor.inputRef}
              type="text"
              className="inline-edit-input"
              value={editor.value}
              onChange={(e) => editor.setValue(e.target.value)}
              onBlur={editor.submitCreate}
              onKeyDown={editor.handleKeyDown}
              placeholder={editor.isCreating === 'folder' ? 'Folder name…' : 'File name…'}
              aria-label={`New root ${editor.isCreating} name`}
            />
          </div>
        )}

        {/* Render tree nodes */}
        {tree.map((node) => (
          <TreeNodeComponent key={node.id} node={node} depth={0} />
        ))}

        {/* Empty state */}
        {tree.length === 0 && !editor.isCreating && (
          <div className="flex flex-col items-center justify-center h-32 text-ide-text-muted text-xs">
            <p className="mb-2">No files or folders</p>
            <p className="text-[11px]">
              Click{' '}
              <span className="text-ide-accent">+ New File</span> or{' '}
              <span className="text-ide-accent">+ New Folder</span> above.
            </p>
          </div>
        )}
      </div>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center h-[22px] px-4 bg-ide-sidebar-header border-t border-ide-border flex-shrink-0">
        <span className="text-[10px] text-ide-text-muted">
          {countItems(tree)} items
        </span>
      </div>
    </aside>
  );
};

// ─── Helper: Count all nodes recursively ──────────────────────────────────

function countItems(nodes: import('../types').TreeNode[]): number {
  return nodes.reduce((acc, node) => {
    return acc + 1 + (node.isFolder ? countItems(node.children) : 0);
  }, 0);
}

export default FileExplorer;
