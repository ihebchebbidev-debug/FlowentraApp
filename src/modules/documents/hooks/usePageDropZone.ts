import { useState, useCallback, useRef, DragEvent } from 'react';

interface UsePageDropZoneOptions {
  onFilesDropped: (files: File[]) => void;
  disabled?: boolean;
}

/**
 * Hook for page-level drag-and-drop overlay.
 * Returns drag state + event handlers to attach to the container.
 */
export function usePageDropZone({ onFilesDropped, disabled }: UsePageDropZoneOptions) {
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;
      dragCounter.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDragging(true);
      }
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current -= 1;
      if (dragCounter.current <= 0) {
        dragCounter.current = 0;
        setIsDragging(false);
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    [],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);
      if (disabled) return;

      const files = Array.from(e.dataTransfer?.files || []);
      if (files.length > 0) {
        onFilesDropped(files);
      }
    },
    [disabled, onFilesDropped],
  );

  return {
    isDragging,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
