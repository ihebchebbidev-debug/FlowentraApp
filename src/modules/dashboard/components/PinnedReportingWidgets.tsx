/**
 * PinnedReportingWidgets — renders widgets the user starred in the reporting
 * dashboards. Lives on the main /dashboard page so users can customize their
 * default landing view directly from the reporting module's star buttons.
 *
 * Supports drag-and-drop reordering; the new order is persisted to the
 * backend so it stays across devices/sessions.
 */
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp, Wrench, Landmark, Users, ShoppingCart, X, Pin, GripVertical } from 'lucide-react';
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useFavoritesStore, FavoriteWidget } from '@/modules/reporting/store/useFavoritesStore';

const sourceIcon: Record<FavoriteWidget['source'], typeof Star> = {
  Sales: TrendingUp,
  Service: Wrench,
  Finance: Landmark,
  HR: Users,
  Purchase: ShoppingCart,
};
const sourceTone: Record<FavoriteWidget['source'], string> = {
  Sales: 'text-primary bg-primary/10',
  Service: 'text-accent bg-accent/10',
  Finance: 'text-info bg-info/10',
  HR: 'text-[hsl(var(--chart-6))] bg-[hsl(var(--chart-6)/0.12)]',
  Purchase: 'text-warning bg-warning/10',
};
const sourceRoute: Record<FavoriteWidget['source'], string> = {
  Sales: '/dashboard/reporting/sales',
  Service: '/dashboard/reporting/service',
  Finance: '/dashboard/reporting/finance',
  HR: '/dashboard/reporting/hr',
  Purchase: '/dashboard/reporting/purchase',
};

interface PinnedCardProps {
  w: FavoriteWidget;
  onOpen: () => void;
  onRemove: () => void;
}

function PinnedCard({ w, onOpen, onRemove }: PinnedCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: w.id });
  // Defensive: if a legacy row somehow escapes the source allow-list in the
  // store, fall back to the ☆ icon rather than throwing.
  const Icon = sourceIcon[w.source] ?? Star;
  const tone = sourceTone[w.source] ?? 'text-muted-foreground bg-muted';
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative flex flex-col items-start gap-2 rounded-md border bg-background p-3 text-left transition',
        isDragging ? 'shadow-lg ring-2 ring-primary/40' : 'hover:-translate-y-0.5 hover:shadow-md focus-within:shadow-md'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={`Drag to reorder ${w.title}`}
        className="absolute left-1 top-1 cursor-grab rounded p-1 text-muted-foreground/60 opacity-0 transition hover:bg-muted hover:text-foreground group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring active:cursor-grabbing"
      >
        <GripVertical className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Unpin ${w.title}`}
        className="absolute right-1 top-1 rounded p-1 text-muted-foreground opacity-0 transition hover:bg-muted hover:text-destructive group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X className="h-3 w-3" />
      </button>
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${w.source} reporting for ${w.title}`}
        className="flex w-full flex-col items-start gap-2 text-left rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring"
      >
        <div className={cn('flex h-7 w-7 items-center justify-center rounded-md', tone)}>
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </div>
        <div className="w-full">
          <div className="truncate text-xs font-semibold text-foreground">{w.title}</div>
          <div className="text-[10px] text-muted-foreground">{w.source}</div>
        </div>
      </button>
    </div>
  );
}

export function PinnedReportingWidgets() {
  const { t } = useTranslation('reporting');
  const nav = useNavigate();
  const { widgets, remove, reorder } = useFavoritesStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = widgets.findIndex((w) => w.id === active.id);
    const newIndex = widgets.findIndex((w) => w.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const nextIds = arrayMove(widgets, oldIndex, newIndex).map((w) => w.id);
    reorder(nextIds);
  };

  return (
    <section className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-warning" />
          <h2 className="text-sm font-semibold">
            {t('my.pinnedTitle', 'My Pinned Widgets')}
          </h2>
          {widgets.length > 0 && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {widgets.length}
            </span>
          )}
          {widgets.length > 1 && (
            <span className="hidden text-[10px] text-muted-foreground sm:inline">
              {t('my.dragHint', '— drag to reorder')}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => nav('/dashboard/reporting/my')}>
          {t('my.openMy', 'Open My Dashboard')}
        </Button>
      </div>

      {widgets.length === 0 ? (
        <div className="flex items-center gap-3 rounded-md border border-dashed bg-muted/30 p-4 text-xs text-muted-foreground">
          <Star className="h-5 w-5 shrink-0 text-muted-foreground/50" />
          <span>
            {t(
              'my.pinnedEmpty',
              'Star any card in the reporting dashboards to pin it here and customize your default landing view.'
            )}
          </span>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={widgets.map((w) => w.id)} strategy={rectSortingStrategy}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {widgets.map((w) => (
                <PinnedCard
                  key={w.id}
                  w={w}
                  onOpen={() => nav(sourceRoute[w.source])}
                  onRemove={() => remove(w.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </section>
  );
}
