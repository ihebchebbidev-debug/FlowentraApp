import React, { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BuilderComponent, DeviceView, SiteTheme } from '../../types';
import { ComponentRenderer } from '../renderer/ComponentRenderer';
import { GripVertical, Layers, MousePointerClick, Plus } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

/** Data transfer key for palette drag operations */
const PALETTE_DRAG_TYPE = 'application/x-builder-block-type';

interface EditorCanvasProps {
  components: BuilderComponent[];
  device: DeviceView;
  theme: SiteTheme;
  selectedId: string | null;
  activeLanguage?: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, props: Record<string, any>) => void;
  onReorder: (activeId: string, overId: string) => void;
  onInsertAt?: (index: number) => void;
  /** Insert a specific block type at an index (used by palette drag-drop) */
  onDropBlockAt?: (blockType: string, index: number) => void;
  isRtlPreview?: boolean;
}

/* ── Drop zone between blocks (for both click-insert and palette drag) ─────── */
function DropZone({
  index,
  onClickInsert,
  onDropBlock,
  isDraggingFromCanvas,
}: {
  index: number;
  onClickInsert: (index: number) => void;
  onDropBlock: (blockType: string, index: number) => void;
  isDraggingFromCanvas: boolean;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    // Only accept palette drags (not @dnd-kit internal drags)
    if (e.dataTransfer.types.includes(PALETTE_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const blockType = e.dataTransfer.getData(PALETTE_DRAG_TYPE);
    if (blockType) {
      onDropBlock(blockType, index);
    }
  }, [onDropBlock, index]);

  const isActive = isHovered || isDragOver;

  // Hide click-insert UI during canvas drag (let @dnd-kit handle it)
  if (isDraggingFromCanvas && !isDragOver) {
    return <div className="h-1" />;
  }

  return (
    <div
      className="relative group/insert"
      style={{ height: isActive ? 40 : 8, transition: 'height 200ms ease' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Hover / drag-over trigger area */}
      <div className="absolute inset-x-0 -top-2 -bottom-2 z-10" />

      {/* Visual line */}
      <div
        className={`absolute inset-x-4 top-1/2 -translate-y-1/2 transition-all duration-200 rounded-full ${
          isDragOver
            ? 'h-[3px] bg-primary opacity-100 shadow-sm shadow-primary/30'
            : isHovered
            ? 'h-[2px] bg-primary/60 opacity-100'
            : 'h-px bg-transparent opacity-0'
        }`}
      />

      {/* Drop indicator dots for palette drag */}
      {isDragOver && (
        <>
          <div className="absolute top-1/2 -translate-y-1/2 left-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary-foreground shadow-sm z-20" />
          <div className="absolute top-1/2 -translate-y-1/2 right-3 w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary-foreground shadow-sm z-20" />
        </>
      )}

      {/* Click insert button (only on hover, not during palette drag) */}
      {!isDragOver && (
        <div
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-200 z-20 ${
            isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75 pointer-events-none'
          }`}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClickInsert(index);
            }}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-medium shadow-md hover:shadow-lg hover:scale-105 transition-all"
          >
            <Plus className="h-3 w-3" />
            Insert here
          </button>
        </div>
      )}

      {/* Drop label for palette drag */}
      {isDragOver && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold shadow-lg animate-pulse">
            <Plus className="h-3 w-3" />
            Drop to insert
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sortable wrapper for each block ─────────────── */
function SortableComponent({
  component,
  device,
  theme,
  isSelected,
  activeLanguage,
  onSelect,
  onUpdate,
}: {
  component: BuilderComponent;
  device: DeviceView;
  theme: SiteTheme;
  isSelected: boolean;
  activeLanguage?: string | null;
  onSelect: (id: string) => void;
  onUpdate: (id: string, props: Record<string, any>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: component.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
    zIndex: isDragging ? 50 : undefined,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative group/block">
      {/* Drop indicator line — shows when another canvas block hovers above this one */}
      {isOver && !isDragging && (
        <div className="absolute -top-[1px] inset-x-0 z-30 pointer-events-none">
          <div className="h-[3px] bg-primary rounded-full mx-2 shadow-sm shadow-primary/30" />
          <div className="absolute -top-1 left-2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary-foreground shadow-sm" />
          <div className="absolute -top-1 right-2 w-2.5 h-2.5 rounded-full bg-primary border-2 border-primary-foreground shadow-sm" />
        </div>
      )}

      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className={`absolute left-2 top-3 transition-opacity cursor-grab active:cursor-grabbing p-1.5 z-20 bg-background/90 rounded-md shadow-sm border border-border/40 backdrop-blur-sm ${
          isDragging ? 'opacity-0' : 'opacity-0 group-hover/block:opacity-100'
        }`}
      >
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>

      <ComponentRenderer
        component={component}
        device={device}
        theme={theme}
        isEditing
        isSelected={isSelected}
        activeLanguage={activeLanguage}
        onSelect={onSelect}
        onUpdate={onUpdate}
      />
    </div>
  );
}

/** Drag overlay — visual preview while dragging existing blocks */
function DragPreview({ component, theme }: { component: BuilderComponent; theme: SiteTheme }) {
  return (
    <div
      className="rounded-xl shadow-2xl border-2 border-primary/30 overflow-hidden pointer-events-none max-w-md"
      style={{ opacity: 0.9, transform: 'scale(0.85)' }}
    >
      <div className="bg-primary text-primary-foreground text-[10px] font-semibold px-3 py-1 flex items-center gap-1.5">
        <GripVertical className="h-3 w-3" />
        {component.label}
      </div>
      <div className="bg-background overflow-hidden" style={{ maxHeight: 140 }}>
        <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
          <ComponentRenderer
            component={component}
            device="desktop"
            theme={theme}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Empty canvas state ─────────────── */
function EmptyCanvas({ onDropBlock }: { onDropBlock: (blockType: string, index: number) => void }) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (e.dataTransfer.types.includes(PALETTE_DRAG_TYPE)) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  return (
    <div
      className={`h-[500px] flex flex-col items-center justify-center text-muted-foreground gap-4 px-6 transition-colors ${
        isDragOver ? 'bg-primary/5' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const blockType = e.dataTransfer.getData(PALETTE_DRAG_TYPE);
        if (blockType) onDropBlock(blockType, 0);
      }}
    >
      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center border-2 border-dashed transition-colors ${
        isDragOver
          ? 'bg-primary/10 border-primary/40'
          : 'bg-muted/50 border-muted-foreground/20'
      }`}>
        <Layers className={`h-8 w-8 transition-colors ${isDragOver ? 'text-primary/50' : 'text-muted-foreground/30'}`} />
      </div>
      <div className="text-center space-y-1.5 max-w-[260px]">
        <p className="text-sm font-medium text-foreground/60">
          {isDragOver ? 'Drop to add block' : 'No components yet'}
        </p>
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          {isDragOver
            ? 'Release to add this block to your page'
            : <>Drag blocks from the <strong>Blocks</strong> panel or click to add them.</>
          }
        </p>
      </div>
      {!isDragOver && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/40 mt-2">
          <MousePointerClick className="h-3 w-3" />
          <span>Drag & drop or click to add blocks</span>
        </div>
      )}
    </div>
  );
}

/* ── Main canvas ─────────────── */
export function EditorCanvas({
  components,
  device,
  theme,
  selectedId,
  activeLanguage,
  onSelect,
  onUpdate,
  onReorder,
  onInsertAt,
  onDropBlockAt,
  isRtlPreview = false,
}: EditorCanvasProps) {
  const pointerSensor = useSensor(PointerSensor, { activationConstraint: { distance: 5 } });
  const keyboardSensor = useSensor(KeyboardSensor);
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (over && active.id !== over.id) {
      onReorder(String(active.id), String(over.id));
    }
  }, [onReorder]);

  const handleClickInsert = useCallback((index: number) => {
    onInsertAt?.(index);
  }, [onInsertAt]);

  const handleDropBlock = useCallback((blockType: string, index: number) => {
    onDropBlockAt?.(blockType, index);
  }, [onDropBlockAt]);

  const activeComponent = activeDragId ? components.find(c => c.id === activeDragId) : null;
  const isDraggingCanvas = activeDragId !== null;

  const deviceWidths: Record<DeviceView, string> = {
    desktop: '100%',
    tablet: '768px',
    mobile: '375px',
  };

  return (
    <ScrollArea className="flex-1 bg-muted/20 h-full max-h-full overflow-auto">
      <div className="p-4 md:p-8">
        <div
          className={`mx-auto rounded-xl shadow-sm border border-border/50 min-h-[600px] transition-all duration-300 overflow-hidden relative ${
            isRtlPreview ? 'ring-2 ring-amber-500/30' : ''
          }`}
          style={{ maxWidth: deviceWidths[device], backgroundColor: '#ffffff' }}
          dir={isRtlPreview ? 'rtl' : 'ltr'}
          onClick={() => onSelect('')}
        >
          {isRtlPreview && (
            <div className="absolute top-0 left-0 right-0 bg-accent text-accent-foreground text-[10px] font-medium text-center py-1 z-30">
              RTL Preview Mode
            </div>
          )}

          {components.length === 0 ? (
            <EmptyCanvas onDropBlock={handleDropBlock} />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={components.map(c => c.id)}
                strategy={verticalListSortingStrategy}
              >
                <div>
                  {/* Top drop zone */}
                  <DropZone
                    index={0}
                    onClickInsert={handleClickInsert}
                    onDropBlock={handleDropBlock}
                    isDraggingFromCanvas={isDraggingCanvas}
                  />

                  {components.map((comp, idx) => (
                    <React.Fragment key={comp.id}>
                      <SortableComponent
                        component={comp}
                        device={device}
                        theme={theme}
                        isSelected={selectedId === comp.id}
                        activeLanguage={activeLanguage}
                        onSelect={onSelect}
                        onUpdate={onUpdate}
                      />
                      {/* Drop zone after each block */}
                      <DropZone
                        index={idx + 1}
                        onClickInsert={handleClickInsert}
                        onDropBlock={handleDropBlock}
                        isDraggingFromCanvas={isDraggingCanvas}
                      />
                    </React.Fragment>
                  ))}
                </div>
              </SortableContext>

              <DragOverlay dropAnimation={{ duration: 200, easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)' }}>
                {activeComponent ? (
                  <DragPreview component={activeComponent} theme={theme} />
                ) : null}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>
    </ScrollArea>
  );
}
