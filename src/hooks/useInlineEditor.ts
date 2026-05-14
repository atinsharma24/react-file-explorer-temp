/**
 * ============================================================================
 * useInlineEditor.ts — Shared Hook for Inline Item Creation
 * ============================================================================
 *
 * Extracts the duplicated inline-creation state machine that was previously
 * duplicated in both `FileExplorer.tsx` (root-level creation) and
 * `TreeNode.tsx` (folder-level creation).
 *
 * The hook manages the full lifecycle:
 *   1. `startCreate(type)` — Enter creation mode (file or folder).
 *   2. User types a name into the inline `<input>`.
 *   3. `submitCreate()` — Commit the name; calls the supplied `onSubmit`.
 *   4. `cancelCreate()` — Abort without creating anything.
 *   5. `handleKeyDown` — Wire to the `<input>` for Enter / Escape handling.
 *
 * The hook is intentionally **headless** — it manages state and callbacks
 * but owns no DOM. The consuming component provides the `<input>` and
 * decides where to render it.
 *
 * ============================================================================
 */

import { useState, useRef, useCallback } from 'react';

/** The type of item being created, or `null` when not in creation mode. */
export type CreatingType = 'file' | 'folder' | null;

/** Return shape of the `useInlineEditor` hook. */
export interface UseInlineEditorReturn {
  /** Current creation mode: `'file'`, `'folder'`, or `null` (idle). */
  isCreating: CreatingType;
  /** The current value of the inline input. */
  value: string;
  /** Controlled setter for the inline input value. */
  setValue: React.Dispatch<React.SetStateAction<string>>;
  /** Ref to attach to the `<input>` element for auto-focus. */
  inputRef: React.RefObject<HTMLInputElement | null>;
  /** Enter creation mode and auto-focus the input. */
  startCreate: (type: 'file' | 'folder') => void;
  /** Commit the current value — calls `onSubmit` if non-empty. */
  submitCreate: () => void;
  /** Abort creation mode without side-effects. */
  cancelCreate: () => void;
  /** Keyboard handler: Enter → submit, Escape → cancel. */
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

/**
 * Hook configuration.
 *
 * @property onSubmit - Called with `(trimmedName, type)` when the user
 *                      submits a non-empty name. The consumer is responsible
 *                      for performing the actual tree mutation.
 */
interface UseInlineEditorOptions {
  onSubmit: (name: string, type: 'file' | 'folder') => void;
}

/**
 * Headless hook that encapsulates the inline creation state machine.
 *
 * @example
 * ```tsx
 * const editor = useInlineEditor({
 *   onSubmit: (name, type) => {
 *     const node = createNode(name, type === 'folder');
 *     addRootNode(node);
 *   },
 * });
 *
 * // In JSX:
 * {editor.isCreating && (
 *   <input
 *     ref={editor.inputRef}
 *     value={editor.value}
 *     onChange={(e) => editor.setValue(e.target.value)}
 *     onBlur={editor.submitCreate}
 *     onKeyDown={editor.handleKeyDown}
 *   />
 * )}
 * ```
 */
export function useInlineEditor({ onSubmit }: UseInlineEditorOptions): UseInlineEditorReturn {
  const [isCreating, setIsCreating] = useState<CreatingType>(null);
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const startCreate = useCallback((type: 'file' | 'folder') => {
    setIsCreating(type);
    setValue('');
    // Defer focus to next tick so the input is mounted first.
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const cancelCreate = useCallback(() => {
    setIsCreating(null);
    setValue('');
  }, []);

  const submitCreate = useCallback(() => {
    const trimmed = value.trim();
    if (trimmed && isCreating) {
      onSubmit(trimmed, isCreating);
    }
    setIsCreating(null);
    setValue('');
  }, [value, isCreating, onSubmit]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        submitCreate();
      } else if (e.key === 'Escape') {
        cancelCreate();
      }
    },
    [submitCreate, cancelCreate],
  );

  return {
    isCreating,
    value,
    setValue,
    inputRef,
    startCreate,
    submitCreate,
    cancelCreate,
    handleKeyDown,
  };
}
