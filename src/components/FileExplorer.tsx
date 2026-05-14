/**
 * ============================================================================
 * FileExplorer.tsx — Main File Explorer Panel
 * ============================================================================
 *
 * Top-level container styled as a macOS-window–like panel:
 *   1. A title bar with traffic-light dots and centered "File Explorer" title.
 *   2. Two prominent action buttons: "+ New File" (solid blue) and
 *      "+ New Folder" (outlined blue).
 *   3. The recursive tree of TreeNodeComponents.
 *   4. An inline input for root-level item creation.
 *
 * ============================================================================
 */

import React, { useCallback } from 'react';
import { File, Folder } from 'lucide-react';
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
    <div
      className="w-full max-w-[700px] mx-auto flex flex-col bg-explorer-bg rounded-xl overflow-hidden shadow-2xl border border-explorer-border"
      style={{ height: 'min(90vh, 680px)' }}
      role="navigation"
      aria-label="File Explorer"
    >
      {/* ─── macOS-style Title Bar ──────────────────────────────────── */}
      <div className="flex items-center justify-center relative h-[40px] bg-explorer-header border-b border-explorer-border flex-shrink-0">
        {/* Traffic-light dots */}
        <div className="absolute left-4 flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
          <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
          <span className="w-3 h-3 rounded-full bg-[#28c840]" />
        </div>
        <span className="text-[13px] font-medium text-explorer-text-secondary">
          File Explorer
        </span>
      </div>

      {/* ─── Action Buttons ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-explorer-border flex-shrink-0">
        {/* + New File — solid blue */}
        <button
          className="
            inline-flex items-center gap-1.5 px-5 py-2
            bg-explorer-accent text-white text-[13px] font-semibold
            rounded-lg hover:bg-explorer-accent-hover
            transition-colors cursor-pointer
            shadow-sm
          "
          onClick={() => editor.startCreate('file')}
          aria-label="New root file"
        >
          <span className="text-[15px] leading-none">+</span>
          New File
        </button>

        {/* + New Folder — outlined blue */}
        <button
          className="
            inline-flex items-center gap-1.5 px-5 py-2
            bg-transparent text-explorer-accent text-[13px] font-semibold
            border-2 border-explorer-accent rounded-lg
            hover:bg-explorer-accent/5
            transition-colors cursor-pointer
          "
          onClick={() => editor.startCreate('folder')}
          aria-label="New root folder"
        >
          <span className="text-[15px] leading-none">+</span>
          New Folder
        </button>
      </div>

      {/* ─── Tree Content ──────────────────────────────────────────── */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden py-2"
        role="tree"
        aria-label="File tree"
      >
        {/* Root-level inline creation */}
        {editor.isCreating && (
          <div className="flex items-center h-[36px] px-5 animate-fade-in">
            <span className="w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
              {editor.isCreating === 'folder' ? (
                <Folder size={18} className="text-explorer-folder" />
              ) : (
                <File size={18} className="text-explorer-file" />
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
          <div className="flex flex-col items-center justify-center h-40 text-explorer-text-muted text-sm">
            <p className="mb-2">No files or folders yet</p>
            <p className="text-xs">
              Click{' '}
              <span className="text-explorer-accent font-medium">+ New File</span> or{' '}
              <span className="text-explorer-accent font-medium">+ New Folder</span> above
              to get started.
            </p>
          </div>
        )}
      </div>

      {/* ─── Footer ────────────────────────────────────────────────── */}
      <div className="flex items-center h-[32px] px-5 bg-explorer-header border-t border-explorer-border flex-shrink-0">
        <span className="text-[11px] text-explorer-text-muted">
          {countItems(tree)} items
        </span>
      </div>
    </div>
  );
};

// ─── Helper: Count all nodes recursively ──────────────────────────────────

function countItems(nodes: import('../types').TreeNode[]): number {
  return nodes.reduce((acc, node) => {
    return acc + 1 + (node.isFolder ? countItems(node.children) : 0);
  }, 0);
}

export default FileExplorer;
