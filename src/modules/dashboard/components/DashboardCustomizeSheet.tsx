/**
 * DashboardCustomizeSheet — a dedicated settings panel for the main /dashboard
 * landing page. Lets the user:
 *   • Reorder pinned reporting widgets (drag)
 *   • Hide / show individual pinned widgets (keeps the ☆ favorite)
 *   • Unstar (unpin) a widget entirely (removes it from favorites)
 *   • Reorder default cards (drag)
 *   • Hide / show default cards
 *   • Reset the entire layout
 *
 * This replaces the previous inline "Customize" bar with a proper settings
 * surface so power-users have one place to manage everything.
 */
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Eye, EyeOff, Star, RotateCcw, Pin, LayoutGrid, X } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

export interface CustomizeRow {
  id: string;
  label: string;
  /** Optional small caption shown under the label (e.g. widget source). */
  caption?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;

  // Pinned reporting widgets
  pinnedRows: CustomizeRow[];
  pinnedOrder: string[]; // visible + hidden order combined (visible first)
  hiddenSet: Set<string>;
  onReorderPinned: (nextIds: string[]) => void;
  onHidePinned: (id: string) => void;
  onShowPinned: (id: string) => void;
  onUnpin: (id: string) => void;

  // Default cards
  defaultRows: CustomizeRow[];
  defaultOrder: string[];
  onReorderDefault: (nextIds: string[]) => void;
  onHideDefault: (id: string) => void;
  onShowDefault: (id: string) => void;

  onResetAll: () => void;
}

function SortableRow({
  id,
  label,
  caption,
  hidden,
  onToggleHide,
  extraAction,
}: {
  id: string;
  label: string;
  caption?: string;
  hidden: boolean;
  onToggleHide: () => void;
  extraAction?: React.ReactNode;
}) {
  const { t } = useTranslation('dashboard');
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
  };
  const showLabel = t('customize.show', { defaultValue: 'Show' });
  const hideLabel = t('customize.hide', { defaultValue: 'Hide' });
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 rounded-md border bg-card px-2 py-2 text-sm transition',
        hidden && 'opacity-60',
        isDragging && 'shadow-lg ring-2 ring-primary/40'
      )}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t('customize.dragToReorder', { defaultValue: 'Drag to reorder' })}
        className="cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{label}</div>
        {caption && <div className="truncate text-[11px] text-muted-foreground">{caption}</div>}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={onToggleHide}
        title={hidden ? showLabel : hideLabel}
        aria-label={hidden ? showLabel : hideLabel}
        aria-pressed={hidden}
      >
        {hidden ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </Button>
      {extraAction}
    </div>
  );
}

function humanizeDefaultId(id: string) {
  return id
    .replace(/^kpi-|^chart-|^panel-/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DashboardCustomizeSheet(props: Props) {
  const {
    open,
    onOpenChange,
    pinnedRows,
    pinnedOrder,
    hiddenSet,
    onReorderPinned,
    onHidePinned,
    onShowPinned,
    onUnpin,
    defaultRows,
    defaultOrder,
    onReorderDefault,
    onHideDefault,
    onShowDefault,
    onResetAll,
  } = props;

  const { t } = useTranslation('dashboard');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const pinnedById = useMemo(() => new Map(pinnedRows.map((r) => [r.id, r])), [pinnedRows]);
  const defaultById = useMemo(() => new Map(defaultRows.map((r) => [r.id, r])), [defaultRows]);

  const handlePinnedDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = pinnedOrder.indexOf(String(active.id));
    const newIndex = pinnedOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderPinned(arrayMove(pinnedOrder, oldIndex, newIndex));
  };

  const handleDefaultDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = defaultOrder.indexOf(String(active.id));
    const newIndex = defaultOrder.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorderDefault(arrayMove(defaultOrder, oldIndex, newIndex));
  };

  const visiblePinned = pinnedOrder.filter((id) => !hiddenSet.has(id)).length;
  const visibleDefault = defaultOrder.filter((id) => !hiddenSet.has(id)).length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="border-b px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-4 w-4 text-primary" />
            {t('customize.title', { defaultValue: 'Customize dashboard' })}
          </SheetTitle>
          <SheetDescription className="text-xs">
            {t('customize.description', {
              defaultValue:
                'Drag to reorder. Hide cards you rarely use, unstar to remove pinned widgets, or reset to defaults.',
            })}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {/* ── Pinned reporting widgets ─────────────────────────── */}
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Pin className="h-3.5 w-3.5 text-warning" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('customize.pinned', { defaultValue: 'Pinned reporting widgets' })}
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {visiblePinned}/{pinnedOrder.length}
              </span>
            </div>

            {pinnedOrder.length === 0 ? (
              <div className="rounded-md border border-dashed bg-muted/30 p-3 text-xs text-muted-foreground">
                <div className="flex items-start gap-2">
                  <Star className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {t('customize.pinnedEmpty', {
                      defaultValue:
                        'No widgets pinned yet — open any Reporting dashboard and tap the ☆ star on a card to pin it here.',
                    })}
                  </span>
                </div>
              </div>
            ) : (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handlePinnedDragEnd}>
                <SortableContext items={pinnedOrder} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {pinnedOrder.map((id) => {
                      const row = pinnedById.get(id);
                      if (!row) return null;
                      const hidden = hiddenSet.has(id);
                      return (
                        <SortableRow
                          key={id}
                          id={id}
                          label={row.label}
                          caption={row.caption}
                          hidden={hidden}
                          onToggleHide={() => (hidden ? onShowPinned(id) : onHidePinned(id))}
                          extraAction={
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => onUnpin(id)}
                              title={t('customize.unstar', { defaultValue: 'Unstar (remove favorite)' })}
                              aria-label={t('customize.unstar', { defaultValue: 'Unstar (remove favorite)' })}
                            >
                              <Star className="h-4 w-4 fill-current" aria-hidden="true" />
                            </Button>
                          }
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </section>

          <Separator />

          {/* ── Default dashboard cards ─────────────────────────── */}
          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('customize.defaults', { defaultValue: 'Default cards' })}
                </h3>
              </div>
              <span className="text-[10px] text-muted-foreground">
                {visibleDefault}/{defaultOrder.length}
              </span>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDefaultDragEnd}>
              <SortableContext items={defaultOrder} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {defaultOrder.map((id) => {
                    const row = defaultById.get(id) ?? { id, label: humanizeDefaultId(id) };
                    const hidden = hiddenSet.has(id);
                    return (
                      <SortableRow
                        key={id}
                        id={id}
                        label={row.label}
                        caption={row.caption}
                        hidden={hidden}
                        onToggleHide={() => (hidden ? onShowDefault(id) : onHideDefault(id))}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </section>
        </div>

        <div className="border-t px-5 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={onResetAll}>
            <RotateCcw className="h-3.5 w-3.5" />
            {t('customize.reset', { defaultValue: 'Reset layout' })}
          </Button>
          <Button size="sm" onClick={() => onOpenChange(false)} className="gap-1.5">
            <X className="h-3.5 w-3.5" />
            {t('customize.done', { defaultValue: 'Done' })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
