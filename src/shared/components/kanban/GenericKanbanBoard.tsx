import { useState, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  GripVertical,
  Calendar,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ───

export interface KanbanItem {
  id: string;
  title: string;
  subtitle?: string;
  status: string;
  /** Formatted value (e.g. "$1,200") */
  value?: string;
  /** Numeric value for column totals */
  numericValue?: number;
  /** Contact/customer name */
  contactName?: string;
  /** Company name */
  companyName?: string;
  /** Priority: low | medium | high | urgent */
  priority?: string;
  /** Formatted date string */
  date?: string;
  /** Date label (e.g. "Valid until", "Est. close") */
  dateLabel?: string;
  /** Category or source label */
  category?: string;
  /** Items count */
  itemsCount?: number;
  /** Currency code */
  currency?: string;
  /** Contact email */
  email?: string;
  /** Contact phone */
  phone?: string;
  /** Any extra badges */
  badges?: Array<{ label: string; variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning' | 'info' }>;
}

export interface KanbanColumnConfig {
  id: string;
  /** Pre-translated label */
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

export interface GenericKanbanBoardProps {
  items: KanbanItem[];
  columns: KanbanColumnConfig[];
  /** Called when an item is moved to a new column (status) */
  onStatusChange?: (itemId: string, newStatus: string) => void;
  /** Called when an item is clicked */
  onItemClick?: (itemId: string) => void;
  /** Format value for column total. Defaults to sum of numericValue */
  formatTotal?: (total: number) => string;
  /** i18n key prefix for priority labels */
  priorityTranslationPrefix?: string;
  /** Slot for empty state */
  emptyLabel?: string;
}

// ─── Priority indicators ───

const PRIORITY_CONFIG: Record<string, { color: string; bg: string }> = {
  urgent: { color: 'text-destructive', bg: 'bg-destructive' },
  high: { color: 'text-warning', bg: 'bg-warning' },
  medium: { color: 'text-primary', bg: 'bg-primary' },
  low: { color: 'text-success', bg: 'bg-success' },
};

// ─── Sortable Card ───

function SortableKanbanCard({
  item,
  column,
  onItemClick,
}: {
  item: KanbanItem;
  column: KanbanColumnConfig;
  onItemClick?: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id, data: { item, status: item.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <KanbanCard
        item={item}
        column={column}
        isDragging={isDragging}
        dragListeners={listeners}
        dragHandleRef={setActivatorNodeRef}
        onItemClick={onItemClick}
      />
    </div>
  );
}

// ─── Card ───

function KanbanCard({
  item,
  column,
  isDragging,
  dragListeners,
  dragHandleRef,
  isOverlay,
  onItemClick,
}: {
  item: KanbanItem;
  column: KanbanColumnConfig;
  isDragging?: boolean;
  dragListeners?: Record<string, Function>;
  dragHandleRef?: (node: HTMLElement | null) => void;
  isOverlay?: boolean;
  onItemClick?: (id: string) => void;
}) {
  const initials = (item.contactName || item.companyName || item.title)
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={cn(
        'relative rounded-lg border bg-card transition-all duration-200 group overflow-hidden',
        'shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]',
        'hover:shadow-[0_4px_16px_0_hsl(var(--foreground)/0.08)] hover:border-border hover:-translate-y-[1px]',
        'active:translate-y-0 active:shadow-[0_1px_3px_0_hsl(var(--foreground)/0.04)]',
        isDragging && 'opacity-30 scale-[0.97] shadow-none',
        isOverlay && 'shadow-[0_12px_40px_-8px_hsl(var(--primary)/0.3)] ring-1 ring-primary/20 rotate-[1deg] scale-[1.03]',
        onItemClick && 'cursor-pointer'
      )}
      onClick={() => onItemClick?.(item.id)}
    >
      {/* Left color stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-[3px]"
        style={{ backgroundColor: column.color }}
      />

      <div className="flex">
        {/* Drag handle — always visible */}
        <div
          ref={dragHandleRef}
          {...dragListeners}
          className={cn(
            'flex items-center justify-center w-6 flex-shrink-0 cursor-grab active:cursor-grabbing',
            'text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted/50 transition-colors',
            'border-r border-border/30'
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* Card content */}
        <div className="flex-1 min-w-0 p-2 sm:p-2.5">
          {/* Title + Priority row */}
          <div className="flex items-start gap-1">
            <div className="flex-1 min-w-0">
              <h4 className="text-[12px] sm:text-[13px] font-semibold text-foreground truncate leading-snug">
                {item.title}
              </h4>
              {item.subtitle && (
                <span className="text-[10px] text-muted-foreground font-mono">
                  {item.subtitle.replace('#', '#')}
                </span>
              )}
            </div>
            {item.priority && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px] h-4 px-1 flex-shrink-0 border-0 font-semibold capitalize',
                  PRIORITY_CONFIG[item.priority]?.color || 'text-muted-foreground',
                  item.priority === 'urgent' && 'bg-destructive/10',
                  item.priority === 'high' && 'bg-warning/10',
                  item.priority === 'medium' && 'bg-primary/10',
                  item.priority === 'low' && 'bg-success/10',
                )}
              >
                {item.priority}
              </Badge>
            )}
          </div>

          {/* Contact row */}
          {(item.contactName || item.companyName) && (
            <div className="flex items-center gap-1.5 mt-1.5">
              <Avatar className="h-5 w-5 flex-shrink-0">
                <AvatarFallback
                  className={cn(
                    'text-[8px] font-bold',
                    column.bgColor,
                    column.iconColor
                  )}
                >
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 leading-none">
                {item.contactName && (
                  <span className="text-[11px] font-medium text-foreground truncate block">
                    {item.contactName}
                  </span>
                )}
                {item.companyName && item.companyName !== item.contactName && (
                  <span className="text-[10px] text-muted-foreground truncate block">
                    {item.companyName}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Value + Items count */}
          {item.value && (
            <div className="flex items-center justify-between mt-2 gap-1">
              <span className={cn(
                'text-[12px] sm:text-[13px] font-bold tabular-nums',
                column.iconColor
              )}>
                {item.value}
              </span>
              {item.itemsCount !== undefined && item.itemsCount > 0 && (
                <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                  <FileText className="h-2.5 w-2.5" />
                  {item.itemsCount}
                </span>
              )}
            </div>
          )}

          {/* Badges */}
          {(item.category || (item.badges && item.badges.length > 0)) && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {item.category && (
                <Badge variant="outline" className="text-[8px] sm:text-[9px] h-4 px-1 font-normal">
                  {item.category}
                </Badge>
              )}
              {item.badges?.map((badge, i) => (
                <Badge key={i} variant={badge.variant || 'secondary'} className="text-[8px] sm:text-[9px] h-4 px-1">
                  {badge.label}
                </Badge>
              ))}
            </div>
          )}

          {/* Date footer */}
          {item.date && (
            <div className="flex items-center gap-1 mt-1.5 pt-1.5 border-t border-border/30 text-[10px] text-muted-foreground">
              <Calendar className="h-2.5 w-2.5 flex-shrink-0" />
              <span className="truncate">{item.date}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Column (Twenty-style) ───

function KanbanColumn({
  column,
  items,
  totalLabel,
  onItemClick,
  emptyLabel,
}: {
  column: KanbanColumnConfig;
  items: KanbanItem[];
  totalLabel?: string;
  onItemClick?: (id: string) => void;
  emptyLabel?: string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col flex-1 min-w-0 rounded-lg transition-all duration-200',
        'bg-muted border',
        isOver
          ? `border-2 ${column.borderColor} bg-accent`
          : 'border-border/50'
      )}
    >
      {/* Column Header */}
      <div className="px-2 sm:px-3 py-2.5 border-b border-border/40">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <span className="text-[12px] sm:text-[13px] font-semibold text-foreground tracking-tight truncate">
            {column.label}
          </span>
          <span className="text-[10px] sm:text-[11px] font-medium text-muted-foreground bg-background/60 rounded-full h-5 min-w-[18px] px-1 inline-flex items-center justify-center flex-shrink-0">
            {items.length}
          </span>
        </div>
        {totalLabel && (
          <div className="mt-1 text-[11px] sm:text-[12px] font-semibold text-muted-foreground truncate">
            {totalLabel}
          </div>
        )}
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1">
        <SortableContext
          items={items.map((d) => d.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="p-1.5 sm:p-2 space-y-1.5 sm:space-y-2 min-h-[60px]">
            {items.length === 0 && (
              <div className="flex items-center justify-center py-10 text-muted-foreground/60 text-xs italic">
                {emptyLabel || '—'}
              </div>
            )}
            {items.map((item) => (
              <SortableKanbanCard
                key={item.id}
                item={item}
                column={column}
                onItemClick={onItemClick}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

// ─── Main Board ───

export function GenericKanbanBoard({
  items,
  columns,
  onStatusChange,
  onItemClick,
  formatTotal,
  emptyLabel,
}: GenericKanbanBoardProps) {
  const [localItems, setLocalItems] = useState<KanbanItem[]>(items);
  const [activeItem, setActiveItem] = useState<KanbanItem | null>(null);

  // Sync with incoming items
  useMemo(() => {
    setLocalItems(items);
  }, [items]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const item = localItems.find((d) => d.id === event.active.id);
      if (item) setActiveItem(item);
    },
    [localItems]
  );

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      const activeItem = localItems.find((d) => d.id === activeId);
      if (!activeItem) return;

      const overItem = localItems.find((d) => d.id === overId);
      const targetStatus = overItem ? overItem.status : overId;

      const isValidColumn = columns.some((c) => c.id === targetStatus);
      if (!isValidColumn) return;

      if (activeItem.status !== targetStatus) {
        setLocalItems((prev) =>
          prev.map((d) =>
            d.id === activeId ? { ...d, status: targetStatus } : d
          )
        );
      }
    },
    [localItems, columns]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const draggedItem = activeItem;
      setActiveItem(null);
      const { active, over } = event;
      if (!over) return;

      const activeId = active.id as string;
      const overId = over.id as string;

      // Find updated item (after dragOver may have changed status)
      const updatedItem = localItems.find((d) => d.id === activeId);
      if (!updatedItem) return;

      // Notify parent of status change
      const originalItem = items.find((d) => d.id === activeId);
      if (originalItem && originalItem.status !== updatedItem.status) {
        onStatusChange?.(activeId, updatedItem.status);
      }

      // Reorder within same column
      if (activeId !== overId) {
        const overItem = localItems.find((d) => d.id === overId);
        if (overItem && updatedItem.status === overItem.status) {
          const columnItems = localItems.filter(
            (d) => d.status === updatedItem.status
          );
          const oldIndex = columnItems.findIndex((d) => d.id === activeId);
          const newIndex = columnItems.findIndex((d) => d.id === overId);
          if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(columnItems, oldIndex, newIndex);
            setLocalItems((prev) => {
              const other = prev.filter(
                (d) => d.status !== updatedItem.status
              );
              return [...other, ...reordered];
            });
          }
        }
      }
    },
    [localItems, items, activeItem, onStatusChange]
  );

  const getColumnItems = (columnId: string) =>
    localItems.filter((d) => d.status === columnId);

  const getColumnTotal = (columnId: string) => {
    const total = getColumnItems(columnId).reduce(
      (sum, d) => sum + (d.numericValue || 0),
      0
    );
    return formatTotal
      ? formatTotal(total)
      : total > 0
      ? total.toLocaleString()
      : undefined;
  };

  const activeColumn = activeItem
    ? columns.find((c) => c.id === activeItem.status) || columns[0]
    : columns[0];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div
        className="grid gap-2 sm:gap-3 pb-4 h-full px-2 sm:px-3 py-3"
        style={{
          gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`,
        }}
      >
        {columns.map((column) => (
          <KanbanColumn
            key={column.id}
            column={column}
            items={getColumnItems(column.id)}
            totalLabel={getColumnTotal(column.id)}
            onItemClick={onItemClick}
            emptyLabel={emptyLabel}
          />
        ))}
      </div>

      <DragOverlay>
        {activeItem && (
          <div className="w-[240px]">
            <KanbanCard item={activeItem} column={activeColumn} isOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
