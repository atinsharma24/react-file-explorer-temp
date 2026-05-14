/**
 * ============================================================================
 * TreeNodeComponent.tsx — Recursive Tree Node Renderer
 * ============================================================================
 *
 * The heart of the file explorer. Each instance renders a single node and,
 * if the node is a folder, recursively renders its children.
 *
 * Responsibilities:
 * - Render the node with appropriate file/folder icon (blue folders).
 * - Handle hover state to show inline text actions ("Rename" / "Delete").
 * - Toggle folder expansion on chevron click.
 * - Inline rename mode: swap label for an <input> on "Rename" click.
 * - Inline "New File" / "New Folder" creation inside folders.
 * - Dispatch CRUD actions via the tree context.
 *
 * Performance Notes:
 * - Uses React.memo to skip re-renders when props are unchanged.
 *
 * ============================================================================
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Folder,
  FolderOpen,
  File,
  FilePlus,
  FolderPlus,
} from 'lucide-react';
import type { TreeNode } from '../types';
import { useTree } from '../context/TreeContext';
import { createNode } from '../utils/treeHelpers';
import { useInlineEditor } from '../hooks/useInlineEditor';

// ─── Props ──────────────────────────────────────────────────────────────────

interface TreeNodeComponentProps {
  /** The tree node data to render. */
  node: TreeNode;
  /** Nesting depth (0 = root level). Used for left-padding. */
  depth: number;
}

// ─── Component ──────────────────────────────────────────────────────────────

const TreeNodeComponent: React.FC<TreeNodeComponentProps> = React.memo(
  ({ node, depth }) => {
    const { insertNode, deleteNode, renameNode, toggleFolder } = useTree();

    // ── Local UI State ──────────────────────────────────────────────────
    const [isHovered, setIsHovered] = useState(false);
    const [isRenaming, setIsRenaming] = useState(false);
    const [renameValue, setRenameValue] = useState(node.name);

    const renameInputRef = useRef<HTMLInputElement>(null);

    // ── Inline creation via shared hook ─────────────────────────────────
    const handleChildCreate = useCallback(
      (name: string, type: 'file' | 'folder') => {
        const newNode = createNode(name, type === 'folder');
        insertNode(node.id, newNode);
      },
      [insertNode, node.id],
    );

    const editor = useInlineEditor({ onSubmit: handleChildCreate });

    // ── Indent calculation ──────────────────────────────────────────────
    // Each depth level adds 24px of left padding for clear visual hierarchy.
    const paddingLeft = depth * 24 + 20;

    // ── Rename Handlers ─────────────────────────────────────────────────

    const handleRenameStart = useCallback(() => {
      setRenameValue(node.name);
      setIsRenaming(true);
      setTimeout(() => renameInputRef.current?.select(), 0);
    }, [node.name]);

    const handleRenameSubmit = useCallback(() => {
      const trimmed = renameValue.trim();
      if (trimmed && trimmed !== node.name) {
        renameNode(node.id, trimmed);
      }
      setIsRenaming(false);
    }, [renameValue, node.name, node.id, renameNode]);

    const handleRenameKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleRenameSubmit();
        } else if (e.key === 'Escape') {
          setIsRenaming(false);
        }
      },
      [handleRenameSubmit],
    );

    // ── Delete Handler ──────────────────────────────────────────────────

    const handleDelete = useCallback(() => {
      deleteNode(node.id);
    }, [deleteNode, node.id]);

    // ── Folder Toggle ───────────────────────────────────────────────────

    const handleToggle = useCallback(() => {
      if (node.isFolder) {
        toggleFolder(node.id);
      }
    }, [node.isFolder, node.id, toggleFolder]);

    // ── Click on the row (toggle folder / no-op for files) ──────────────

    const handleRowClick = useCallback(() => {
      if (node.isFolder) {
        toggleFolder(node.id);
      }
    }, [node.isFolder, node.id, toggleFolder]);

    // ── Render ──────────────────────────────────────────────────────────

    return (
      <div className="select-none">
        {/* ─── Node Row ───────────────────────────────────────────────── */}
        <div
          className={`
            group flex items-center h-[36px] cursor-pointer
            transition-colors duration-100 pr-4
            ${isHovered ? 'bg-explorer-hover' : 'hover:bg-explorer-hover'}
          `}
          style={{ paddingLeft: `${paddingLeft}px` }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={handleRowClick}
          role="treeitem"
          aria-expanded={node.isFolder ? node.isOpen : undefined}
          aria-label={node.name}
        >
          {/* Chevron (folders only) */}
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-0.5">
            {node.isFolder ? (
              node.isOpen ? (
                <ChevronDown
                  size={16}
                  className="text-explorer-text-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-explorer-text-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                />
              )
            ) : null}
          </span>

          {/* Icon — blue folders, gray files */}
          <span className="w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0">
            {node.isFolder ? (
              node.isOpen ? (
                <FolderOpen size={18} className="text-explorer-folder" />
              ) : (
                <Folder size={18} className="text-explorer-folder" />
              )
            ) : (
              <File size={18} className="text-explorer-file" />
            )}
          </span>

          {/* Name / Rename Input */}
          {isRenaming ? (
            <input
              ref={renameInputRef}
              type="text"
              className="inline-edit-input"
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={handleRenameKeyDown}
              onClick={(e) => e.stopPropagation()}
              aria-label={`Rename ${node.name}`}
            />
          ) : (
            <span
              className={`
                truncate text-[14px] leading-[36px]
                ${node.isFolder ? 'font-semibold text-explorer-text' : 'text-explorer-text'}
              `}
            >
              {node.name}
            </span>
          )}

          {/* ─── Inline Actions: text buttons (visible on hover) ──── */}
          {isHovered && !isRenaming && (
            <div className="ml-auto flex items-center gap-4 animate-fade-in">
              {/* Folder-specific: add child file / folder */}
              {node.isFolder && (
                <>
                  <button
                    className="text-[12px] text-explorer-text-muted hover:text-explorer-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!node.isOpen) toggleFolder(node.id);
                      editor.startCreate('file');
                    }}
                    aria-label={`New file in ${node.name}`}
                  >
                    <FilePlus size={14} />
                  </button>
                  <button
                    className="text-[12px] text-explorer-text-muted hover:text-explorer-accent transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!node.isOpen) toggleFolder(node.id);
                      editor.startCreate('folder');
                    }}
                    aria-label={`New folder in ${node.name}`}
                  >
                    <FolderPlus size={14} />
                  </button>
                </>
              )}

              {/* Rename — text button */}
              <button
                className="text-[13px] text-explorer-text-muted hover:text-explorer-accent transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameStart();
                }}
                aria-label={`Rename ${node.name}`}
              >
                Rename
              </button>

              {/* Delete — text button */}
              <button
                className="text-[13px] text-explorer-text-muted hover:text-explorer-danger transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                aria-label={`Delete ${node.name}`}
              >
                Delete
              </button>
            </div>
          )}
        </div>

        {/* ─── Children (recursive) ─────────────────────────────────── */}
        {node.isFolder && node.isOpen && (
          <div className="animate-slide-down" role="group">
            {/* Inline creation input (appears at top of children list) */}
            {editor.isCreating && (
              <div
                className="flex items-center h-[36px]"
                style={{ paddingLeft: `${paddingLeft + 24}px` }}
              >
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
                  aria-label={`New ${editor.isCreating} name`}
                />
              </div>
            )}

            {/* Recursively render children */}
            {node.children.map((child) => (
              <TreeNodeComponent key={child.id} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  },
);

TreeNodeComponent.displayName = 'TreeNodeComponent';

export default TreeNodeComponent;
