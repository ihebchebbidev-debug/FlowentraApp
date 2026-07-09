/**
 * Keyboard shortcuts hook for the website builder editor.
 *
 * Covers:
 *  - Cmd/Ctrl+C / V     copy / paste
 *  - Cmd/Ctrl+Z / Y     undo / redo (Shift+Z = redo)
 *  - Cmd/Ctrl+D         duplicate selected block
 *  - Delete / Backspace remove selected block
 *  - Escape             deselect
 *  - ArrowUp / ArrowDown move selected block up / down
 *
 * All shortcuts are inert when the focus is inside an <input>, <textarea>,
 * or a contentEditable element so typing is never hijacked.
 */
import { useEffect, useRef } from 'react';

interface EditorActions {
  selectedId: string | null;
  hasClipboard: boolean;
  canUndo: boolean;
  canRedo: boolean;
  copyComponent: (id: string) => void;
  pasteComponent: () => void;
  undo: () => void;
  redo: () => void;
  removeComponent: (id: string) => void;
  duplicateComponent: (id: string) => void;
  moveComponent: (id: string, direction: 'up' | 'down') => void;
  setSelectedId: (id: string | null) => void;
}

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === 'INPUT' ||
    tag === 'TEXTAREA' ||
    tag === 'SELECT' ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(editor: EditorActions) {
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      const ed = editorRef.current;
      const isCmd = e.metaKey || e.ctrlKey;
      const key = e.key;

      // ── No-modifier shortcuts ──
      if (!isCmd && !e.altKey) {
        if (key === 'Escape' && ed.selectedId) {
          e.preventDefault();
          ed.setSelectedId(null);
          return;
        }
        if ((key === 'Delete' || key === 'Backspace') && ed.selectedId) {
          e.preventDefault();
          ed.removeComponent(ed.selectedId);
          return;
        }
        if (key === 'ArrowUp' && ed.selectedId) {
          e.preventDefault();
          ed.moveComponent(ed.selectedId, 'up');
          return;
        }
        if (key === 'ArrowDown' && ed.selectedId) {
          e.preventDefault();
          ed.moveComponent(ed.selectedId, 'down');
          return;
        }
      }

      // ── Cmd/Ctrl shortcuts ──
      if (!isCmd) return;
      const lower = key.toLowerCase();

      if (lower === 'c' && ed.selectedId) {
        e.preventDefault();
        ed.copyComponent(ed.selectedId);
      } else if (lower === 'v' && ed.hasClipboard) {
        e.preventDefault();
        ed.pasteComponent();
      } else if (lower === 'd' && ed.selectedId) {
        e.preventDefault();
        ed.duplicateComponent(ed.selectedId);
      } else if (lower === 'z' && !e.shiftKey && ed.canUndo) {
        e.preventDefault();
        ed.undo();
      } else if (((lower === 'z' && e.shiftKey) || lower === 'y') && ed.canRedo) {
        e.preventDefault();
        ed.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
