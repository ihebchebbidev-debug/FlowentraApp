/**
 * Keyboard shortcuts hook — handles Cmd+C/V/Z/Y for the editor.
 * Uses refs to avoid re-registering event listeners on every render.
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
}

export function useKeyboardShortcuts(editor: EditorActions) {
  const editorRef = useRef(editor);
  editorRef.current = editor;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCmd = e.metaKey || e.ctrlKey;
      if (!isCmd) return;
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement).isContentEditable) return;

      const ed = editorRef.current;
      if (e.key === 'c' && ed.selectedId) {
        e.preventDefault();
        ed.copyComponent(ed.selectedId);
      } else if (e.key === 'v' && ed.hasClipboard) {
        e.preventDefault();
        ed.pasteComponent();
      } else if (e.key === 'z' && !e.shiftKey && ed.canUndo) {
        e.preventDefault();
        ed.undo();
      } else if ((e.key === 'z' && e.shiftKey || e.key === 'y') && ed.canRedo) {
        e.preventDefault();
        ed.redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
}
