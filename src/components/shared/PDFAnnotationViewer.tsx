import { useState, useEffect, useRef, useCallback, ReactElement, useMemo } from 'react';
import { pdf } from '@react-pdf/renderer';
import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { Button } from '@/components/ui/button';
import { Download, Eraser, PenLine, X, Undo2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

// Set up PDF.js worker for v3.x using CDN (avoids Vite ESM import issues)
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Stroke {
  points: Array<{ x: number; y: number }>;
  color: string;
  width: number;
}

interface PageAnnotation {
  strokes: Stroke[];
}

/** Serializable annotations map — can be lifted to parent for persistence */
export type AnnotationsMap = Map<number, PageAnnotation>;

interface PDFAnnotationViewerProps {
  /** The @react-pdf/renderer document element */
  document: ReactElement;
  /** File name for download */
  fileName: string;
  /** Whether signing mode is active */
  isSigningMode: boolean;
  /** Called when signing mode should toggle */
  onSigningModeChange: (active: boolean) => void;
  /** Show built-in toolbar? */
  showToolbar?: boolean;
  /** Whether the component should fill its container */
  className?: string;
  /** Pen color */
  penColor?: string;
  /** Pen width */
  penWidth?: number;
  /** Callback when annotations change (has annotations or not) */
  onAnnotationsChange?: (hasAnnotations: boolean) => void;
  /** Scale for rendering PDF pages */
  scale?: number;
  /** External annotations state (lifted up for persistence) */
  annotations?: AnnotationsMap;
  /** Called when annotations are updated externally */
  onAnnotationsUpdate?: (annotations: AnnotationsMap) => void;
}

export function PDFAnnotationViewer({
  document: pdfDocument,
  fileName,
  isSigningMode,
  onSigningModeChange,
  showToolbar = true,
  className = '',
  penColor = '#1a1a2e',
  penWidth = 2.5,
  onAnnotationsChange,
  scale = 2,
  annotations: externalAnnotations,
  onAnnotationsUpdate,
}: PDFAnnotationViewerProps) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [pageDimensions, setPageDimensions] = useState<Array<{ width: number; height: number }>>([]);
  // Use external annotations if provided, otherwise manage locally
  const [internalAnnotations, setInternalAnnotations] = useState<AnnotationsMap>(new Map());
  const annotations = externalAnnotations ?? internalAnnotations;
  const setAnnotations = useCallback((updater: AnnotationsMap | ((prev: AnnotationsMap) => AnnotationsMap)) => {
    const doUpdate = (newVal: AnnotationsMap) => {
      if (onAnnotationsUpdate) {
        onAnnotationsUpdate(newVal);
      } else {
        setInternalAnnotations(newVal);
      }
    };
    if (typeof updater === 'function') {
      doUpdate(updater(annotations));
    } else {
      doUpdate(updater);
    }
  }, [annotations, onAnnotationsUpdate]);

  const [isRendering, setIsRendering] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Stroke | null>(null);
  const [drawingPage, setDrawingPage] = useState<number | null>(null);
  const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfBlobRef = useRef<Blob | null>(null);
  // Track the document element reference to skip re-renders when it hasn't changed
  const prevDocumentRef = useRef<ReactElement>(pdfDocument);
  const renderCountRef = useRef(0);

  // Generate PDF and render pages — only when pdfDocument reference actually changes
  useEffect(() => {
    // Skip if document reference hasn't changed (parent re-rendered but doc is memoized)
    if (renderCountRef.current > 0 && prevDocumentRef.current === pdfDocument) {
      return;
    }
    prevDocumentRef.current = pdfDocument;
    renderCountRef.current++;

    let cancelled = false;

    const renderPages = async () => {
      setIsRendering(true);
      try {
        const blob = await pdf(pdfDocument).toBlob();
        pdfBlobRef.current = blob;

        const arrayBuffer = await blob.arrayBuffer();
        const pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const images: string[] = [];
        const dims: Array<{ width: number; height: number }> = [];

        for (let i = 0; i < pdfDoc.numPages; i++) {
          const page = await pdfDoc.getPage(i + 1);
          const viewport = page.getViewport({ scale });

          const canvas = window.document.createElement('canvas');
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          const ctx = canvas.getContext('2d')!;
          await page.render({ canvasContext: ctx, viewport }).promise;

          images.push(canvas.toDataURL('image/png'));
          dims.push({ width: viewport.width, height: viewport.height });
        }

        if (!cancelled) {
          setPageImages(images);
          setPageDimensions(dims);
        }
      } catch (error) {
        console.error('Failed to render PDF pages:', error);
        toast.error('Failed to render PDF for signing');
      } finally {
        if (!cancelled) setIsRendering(false);
      }
    };

    renderPages();
    return () => { cancelled = true; };
  }, [pdfDocument, scale]);

  // Track previous hasAnnotations to avoid redundant parent callbacks
  const prevHasAnnotationsRef = useRef(false);

  // Redraw annotation canvases when annotations change
  useEffect(() => {
    annotations.forEach((annotation, pageIndex) => {
      const canvas = canvasRefs.current.get(pageIndex);
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawStrokes(ctx, annotation.strokes);
    });

    // Clear canvases that have no annotations
    canvasRefs.current.forEach((canvas, pageIndex) => {
      if (!annotations.has(pageIndex)) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    });

    const hasAny = Array.from(annotations.values()).some(a => a.strokes.length > 0);
    // Only notify parent if the value actually changed — prevents re-render cascade
    if (hasAny !== prevHasAnnotationsRef.current) {
      prevHasAnnotationsRef.current = hasAny;
      onAnnotationsChange?.(hasAny);
    }
  }, [annotations, onAnnotationsChange]);

  const drawStrokes = (ctx: CanvasRenderingContext2D, strokes: Stroke[]) => {
    strokes.forEach(stroke => {
      if (stroke.points.length < 2) return;
      ctx.beginPath();
      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = stroke.width;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
      }
      ctx.stroke();
    });
  };

  const getCanvasPos = useCallback((e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      const touch = e.touches[0];
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  }, []);

  const handlePointerDown = useCallback((e: React.MouseEvent | React.TouchEvent, pageIndex: number) => {
    if (!isSigningMode) return;
    e.preventDefault();
    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;
    const pos = getCanvasPos(e, canvas);
    setDrawingPage(pageIndex);
    setCurrentStroke({ points: [pos], color: penColor, width: penWidth });
  }, [isSigningMode, getCanvasPos, penColor, penWidth]);

  const handlePointerMove = useCallback((e: React.MouseEvent | React.TouchEvent, pageIndex: number) => {
    if (!currentStroke || drawingPage !== pageIndex) return;
    e.preventDefault();
    const canvas = canvasRefs.current.get(pageIndex);
    if (!canvas) return;
    const pos = getCanvasPos(e, canvas);

    const updatedStroke = { ...currentStroke, points: [...currentStroke.points, pos] };
    setCurrentStroke(updatedStroke);

    const ctx = canvas.getContext('2d');
    if (ctx) {
      const existingAnnotation = annotations.get(pageIndex);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (existingAnnotation) drawStrokes(ctx, existingAnnotation.strokes);
      drawStrokes(ctx, [updatedStroke]);
    }
  }, [currentStroke, drawingPage, getCanvasPos, annotations]);

  const handlePointerUp = useCallback(() => {
    if (!currentStroke || drawingPage === null) return;
    if (currentStroke.points.length > 1) {
      setAnnotations(prev => {
        const next = new Map(prev);
        const existing = next.get(drawingPage) || { strokes: [] };
        next.set(drawingPage, { strokes: [...existing.strokes, currentStroke] });
        return next;
      });
    }
    setCurrentStroke(null);
    setDrawingPage(null);
  }, [currentStroke, drawingPage, setAnnotations]);

  const handleUndo = useCallback(() => {
    setAnnotations(prev => {
      const next = new Map(prev);
      const pages = Array.from(next.entries()).filter(([, a]) => a.strokes.length > 0);
      if (pages.length === 0) return prev;
      const [lastPage, lastAnnotation] = pages[pages.length - 1];
      const newStrokes = lastAnnotation.strokes.slice(0, -1);
      if (newStrokes.length === 0) {
        next.delete(lastPage);
      } else {
        next.set(lastPage, { strokes: newStrokes });
      }
      return next;
    });
  }, [setAnnotations]);

  const handleClearAll = useCallback(() => {
    setAnnotations(new Map());
    canvasRefs.current.forEach((canvas) => {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    });
  }, [setAnnotations]);

  const handleDownload = useCallback(async () => {
    if (!pdfBlobRef.current) return;
    setIsExporting(true);

    try {
      const originalBytes = await pdfBlobRef.current.arrayBuffer();
      const pdfLibDoc = await PDFLibDocument.load(originalBytes);
      const pages = pdfLibDoc.getPages();

      for (const [pageIndex, annotation] of annotations.entries()) {
        if (annotation.strokes.length === 0) continue;
        if (pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width: pageWidth, height: pageHeight } = page.getSize();
        const dim = pageDimensions[pageIndex];
        if (!dim) continue;

        const exportCanvas = window.document.createElement('canvas');
        exportCanvas.width = dim.width;
        exportCanvas.height = dim.height;
        const ctx = exportCanvas.getContext('2d')!;
        drawStrokes(ctx, annotation.strokes);

        const pngDataUrl = exportCanvas.toDataURL('image/png');
        const pngBytes = new Uint8Array(Array.from(atob(pngDataUrl.split(',')[1]), c => c.charCodeAt(0)));
        const pngImage = await pdfLibDoc.embedPng(pngBytes);

        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }

      const annotatedBytes = await pdfLibDoc.save();
      const blob = new Blob([annotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Signed PDF downloaded successfully');
      
      // Exit signing mode after successful download
      onSigningModeChange(false);
    } catch (error) {
      console.error('Failed to export annotated PDF:', error);
      toast.error('Failed to export signed PDF');
    } finally {
      setIsExporting(false);
    }
  }, [annotations, pageDimensions, fileName, onSigningModeChange]);

  const hasAnnotations = Array.from(annotations.values()).some(a => a.strokes.length > 0);

  const setCanvasRef = useCallback((pageIndex: number, el: HTMLCanvasElement | null) => {
    if (el) {
      canvasRefs.current.set(pageIndex, el);
    } else {
      canvasRefs.current.delete(pageIndex);
    }
  }, []);

  if (isRendering) {
    return (
      <div className={`flex flex-col h-full p-6 space-y-4 animate-pulse ${className}`}>
        <div className="flex items-center gap-3">
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="h-8 w-24 bg-muted rounded" />
          <div className="flex-1" />
          <div className="h-8 w-20 bg-muted rounded" />
        </div>
        <div className="flex-1 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Signing toolbar */}
      {showToolbar && isSigningMode && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border-b border-primary/20 rounded-t-lg">
          <PenLine className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-primary">Signing Mode</span>
          <span className="text-xs text-muted-foreground ml-1">— Draw anywhere on the document</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={!hasAnnotations}
              className="h-7 text-xs"
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              Undo
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              disabled={!hasAnnotations}
              className="h-7 text-xs"
            >
              <Eraser className="h-3.5 w-3.5 mr-1" />
              Clear All
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={!hasAnnotations || isExporting}
              className="h-7 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              {isExporting ? 'Exporting...' : 'Download Signed'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSigningModeChange(false)}
              className="h-7 text-xs"
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Done
            </Button>
          </div>
        </div>
      )}

      {/* Signed indicator when not in signing mode but has annotations */}
      {showToolbar && !isSigningMode && hasAnnotations && (
        <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border-b border-success/20 rounded-t-lg">
          <CheckCircle className="h-4 w-4 text-success" />
          <span className="text-sm font-medium text-success">Document Signed</span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSigningModeChange(true)}
              className="h-7 text-xs"
            >
              <PenLine className="h-3.5 w-3.5 mr-1" />
              Edit Signature
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleDownload}
              disabled={isExporting}
              className="h-7 text-xs"
            >
              <Download className="h-3.5 w-3.5 mr-1" />
              {isExporting ? 'Exporting...' : 'Download Signed'}
            </Button>
          </div>
        </div>
      )}

      {/* Pages container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-muted/30"
        style={{ padding: '16px' }}
      >
        <div className="flex flex-col items-center gap-4">
          {pageImages.map((imgSrc, pageIndex) => {
            const dim = pageDimensions[pageIndex];
            return (
              <div
                key={pageIndex}
                className="relative shadow-lg"
                style={{
                  width: dim ? dim.width / scale : 'auto',
                  height: dim ? dim.height / scale : 'auto',
                  maxWidth: '100%',
                }}
              >
                {/* PDF page as image */}
                <img
                  src={imgSrc}
                  alt={`Page ${pageIndex + 1}`}
                  className="w-full h-full block"
                  draggable={false}
                />
                {/* Drawing overlay canvas — always visible to show annotations */}
                <canvas
                  ref={(el) => setCanvasRef(pageIndex, el)}
                  width={dim?.width || 0}
                  height={dim?.height || 0}
                  className="absolute inset-0 w-full h-full"
                  style={{
                    cursor: isSigningMode ? 'crosshair' : 'default',
                    touchAction: isSigningMode ? 'none' : 'auto',
                    pointerEvents: isSigningMode ? 'auto' : 'none',
                  }}
                  onMouseDown={(e) => handlePointerDown(e, pageIndex)}
                  onMouseMove={(e) => handlePointerMove(e, pageIndex)}
                  onMouseUp={handlePointerUp}
                  onMouseLeave={handlePointerUp}
                  onTouchStart={(e) => handlePointerDown(e, pageIndex)}
                  onTouchMove={(e) => handlePointerMove(e, pageIndex)}
                  onTouchEnd={handlePointerUp}
                />
                {/* Page number */}
                <div className="absolute bottom-2 right-3 text-xs text-muted-foreground bg-background/80 px-2 py-0.5 rounded">
                  Page {pageIndex + 1} of {pageImages.length}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
