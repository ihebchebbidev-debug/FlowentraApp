import { useState, useCallback, useRef, DragEvent } from 'react';
import { readFileAsDataUrl } from '../utils/imageUtils';
import { toast } from 'sonner';

/**
 * Hook for drag-and-drop image upload on builder components.
 * Reads dropped files as base64 data URIs for localStorage persistence.
 */
export function useImageDrop(onImageDrop: (imageUrl: string) => void) {
  const [isDragOver, setIsDragOver] = useState(false);
  const counter = useRef(0);

  const handleDragEnter = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current += 1;
    if (e.dataTransfer?.types?.includes('Files')) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current -= 1;
    if (counter.current <= 0) {
      counter.current = 0;
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    counter.current = 0;
    setIsDragOver(false);

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    // Quick MIME check before full validation
    if (!file.type.startsWith('image/')) {
      toast.error('Please drop an image file (PNG, JPG, GIF, WebP, SVG, or AVIF)');
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      onImageDrop(dataUrl);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to process image');
    }
  }, [onImageDrop]);

  return {
    isDragOver,
    dropProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  };
}
