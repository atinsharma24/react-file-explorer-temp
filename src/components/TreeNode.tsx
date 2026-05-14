/**
 * ============================================================================
 * TreeNodeComponent.tsx — Recursive Tree Node Renderer
 * ============================================================================
 *
 * The heart of the file explorer. Each instance renders a single node and,
 * if the node is a folder, recursively renders its children.
 *
 * Responsibilities:
 * - Render the node with appropriate file/folder icon.
 * - Handle hover state to show inline action buttons (Rename, Delete).
 * - Toggle folder expansion on chevron click.
 * - Inline rename mode: swap label for an <input> on "Rename" click.
 * - Inline "New File" / "New Folder" creation inside folders.
 * - Dispatch CRUD actions via the tree context.
 *
 * Performance Notes:
 * - Uses React.memo to skip re-renders when props are unchanged.
 * - Callback refs for auto-focus on rename input.
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
  Pencil,
  Trash2,
  FilePlus,
  FolderPlus,
} from 'lucide-react';
import type { TreeNode } from '../types';
import { useTree } from '../context/TreeContext';
import { createNode } from '../utils/treeHelpers';

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
    const [isCreating, setIsCreating] = useState<'file' | 'folder' | null>(null);
    const [newItemName, setNewItemName] = useState('');

    const renameInputRef = useRef<HTMLInputElement>(null);
    const createInputRef = useRef<HTMLInputElement>(null);

    // ── Indent calculation ──────────────────────────────────────────────
    // Each depth level adds 16px of left padding (matching VS Code's indent).
    const paddingLeft = depth * 16 + 8;

    // ── Rename Handlers ─────────────────────────────────────────────────

    const handleRenameStart = useCallback(() => {
      setRenameValue(node.name);
      setIsRenaming(true);
      // Auto-focus happens via the ref callback below.
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

    // ── Inline Create Handlers ──────────────────────────────────────────

    const handleCreateStart = useCallback((type: 'file' | 'folder') => {
      setIsCreating(type);
      setNewItemName('');
      // Ensure folder is open so the new input is visible
      setTimeout(() => createInputRef.current?.focus(), 0);
    }, []);

    const handleCreateSubmit = useCallback(() => {
      const trimmed = newItemName.trim();
      if (trimmed && isCreating) {
        const newNode = createNode(trimmed, isCreating === 'folder');
        insertNode(node.id, newNode);
      }
      setIsCreating(null);
      setNewItemName('');
    }, [newItemName, isCreating, node.id, insertNode]);

    const handleCreateKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          handleCreateSubmit();
        } else if (e.key === 'Escape') {
          setIsCreating(null);
          setNewItemName('');
        }
      },
      [handleCreateSubmit],
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
            group flex items-center h-[22px] cursor-pointer
            transition-colors duration-75
            ${isHovered ? 'bg-ide-hover' : 'hover:bg-ide-hover'}
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
          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
            {node.isFolder ? (
              node.isOpen ? (
                <ChevronDown
                  size={16}
                  className="text-ide-text-muted transition-transform duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                />
              ) : (
                <ChevronRight
                  size={16}
                  className="text-ide-text-muted transition-transform duration-150"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle();
                  }}
                />
              )
            ) : null}
          </span>

          {/* Icon */}
          <span className="w-4 h-4 flex items-center justify-center mr-1.5 flex-shrink-0">
            {node.isFolder ? (
              node.isOpen ? (
                <FolderOpen size={16} className="text-ide-folder" />
              ) : (
                <Folder size={16} className="text-ide-folder" />
              )
            ) : (
              <File size={16} className="text-ide-file" />
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
            <span className="truncate text-[13px] text-ide-text leading-[22px]">
              {node.name}
            </span>
          )}

          {/* ─── Inline Actions (visible on hover) ────────────────── */}
          {isHovered && !isRenaming && (
            <div className="ml-auto flex items-center gap-0.5 pr-2 animate-fade-in">
              {/* Folder-specific: add child file / folder */}
              {node.isFolder && (
                <>
                  <button
                    className="p-0.5 rounded hover:bg-ide-active text-ide-text-muted hover:text-ide-text-bright transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Expand folder first
                      if (!node.isOpen) toggleFolder(node.id);
                      handleCreateStart('file');
                    }}
                    title="New File"
                    aria-label={`New file in ${node.name}`}
                  >
                    <FilePlus size={14} />
                  </button>
                  <button
                    className="p-0.5 rounded hover:bg-ide-active text-ide-text-muted hover:text-ide-text-bright transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!node.isOpen) toggleFolder(node.id);
                      handleCreateStart('folder');
                    }}
                    title="New Folder"
                    aria-label={`New folder in ${node.name}`}
                  >
                    <FolderPlus size={14} />
                  </button>
                </>
              )}

              {/* Rename */}
              <button
                className="p-0.5 rounded hover:bg-ide-active text-ide-text-muted hover:text-ide-text-bright transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRenameStart();
                }}
                title="Rename"
                aria-label={`Rename ${node.name}`}
              >
                <Pencil size={14} />
              </button>

              {/* Delete */}
              <button
                className="p-0.5 rounded hover:bg-ide-active text-ide-text-muted hover:text-ide-danger transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                title="Delete"
                aria-label={`Delete ${node.name}`}
              >
                <Trash2 size={14} />
              </button>
            </div>
          )}
        </div>

        {/* ─── Children (recursive) ─────────────────────────────────── */}
        {node.isFolder && node.isOpen && (
          <div className="animate-slide-down" role="group">
            {/* Inline creation input (appears at top of children list) */}
            {isCreating && (
              <div
                className="flex items-center h-[22px]"
                style={{ paddingLeft: `${paddingLeft + 16}px` }}
              >
                <span className="w-4 h-4 flex items-center justify-center mr-1.5 flex-shrink-0">
                  {isCreating === 'folder' ? (
                    <Folder size={16} className="text-ide-folder" />
                  ) : (
                    <File size={16} className="text-ide-file" />
                  )}
                </span>
                <input
                  ref={createInputRef}
                  type="text"
                  className="inline-edit-input"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  onBlur={handleCreateSubmit}
                  onKeyDown={handleCreateKeyDown}
                  placeholder={isCreating === 'folder' ? 'Folder name…' : 'File name…'}
                  aria-label={`New ${isCreating} name`}
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
