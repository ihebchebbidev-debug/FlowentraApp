import { useState, useCallback } from 'react';
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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  DollarSign,
  Calendar,
  User,
  Building2,
  GripVertical,
  MoreHorizontal,
  Plus,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

// ─── Types ───

export interface KanbanDeal {
  id: string;
  title: string;
  value: string;
  numericValue: number;
  stage: string;
  closeDate: string;
  contact: string;
  company: string;
  probability?: number;
  daysInStage?: number;
  avatarColor?: string;
}

interface StageConfig {
  id: string;
  name: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconColor: string;
}

// ─── Stage Configs ───

const STAGE_CONFIGS: StageConfig[] = [
  { id: 'Lead',        name: 'Lead',        color: 'hsl(var(--chart-1))', bgColor: 'bg-chart-1/10', borderColor: 'border-chart-1/30', iconColor: 'text-chart-1' },
  { id: 'Qualified',   name: 'Qualified',   color: 'hsl(var(--chart-2))', bgColor: 'bg-chart-2/10', borderColor: 'border-chart-2/30', iconColor: 'text-chart-2' },
  { id: 'Proposal',    name: 'Proposal',    color: 'hsl(var(--chart-3))', bgColor: 'bg-chart-3/10', borderColor: 'border-chart-3/30', iconColor: 'text-chart-3' },
  { id: 'Negotiation', name: 'Negotiation', color: 'hsl(var(--chart-4))', bgColor: 'bg-chart-4/10', borderColor: 'border-chart-4/30', iconColor: 'text-chart-4' },
  { id: 'Closed Won',  name: 'Closed Won',  color: 'hsl(var(--chart-5))', bgColor: 'bg-chart-5/10', borderColor: 'border-chart-5/30', iconColor: 'text-chart-5' },
];

// ─── Sortable Deal Card ───

function SortableDealCard({ deal, stageConfig }: { deal: KanbanDeal; stageConfig: StageConfig }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id, data: { deal, stage: deal.stage } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <DealCard deal={deal} stageConfig={stageConfig} isDragging={isDragging} dragListeners={listeners} />
    </div>
  );
}

// ─── Deal Card ───

function DealCard({
  deal,
  stageConfig,
  isDragging,
  dragListeners,
  isOverlay,
}: {
  deal: KanbanDeal;
  stageConfig: StageConfig;
  isDragging?: boolean;
  dragListeners?: Record<string, Function>;
  isOverlay?: boolean;
}) {
  const initials = deal.contact
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  return (
    <Card
      className={cn(
        'p-3 border border-border/50 bg-card hover:border-border cursor-grab active:cursor-grabbing transition-all duration-150 group',
        isDragging && 'opacity-40 scale-95',
        isOverlay && 'shadow-xl ring-2 ring-primary/20 rotate-[2deg]'
      )}
    >
      {/* Header: drag handle + title + more */}
      <div className="flex items-start gap-2">
        <div
          {...dragListeners}
          className="mt-0.5 opacity-0 group-hover:opacity-60 hover:opacity-100 transition-opacity cursor-grab"
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[13px] font-semibold text-foreground truncate leading-tight">
            {deal.title}
          </h4>
          <div className="flex items-center gap-1.5 mt-1">
            <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="text-[11px] text-muted-foreground truncate">{deal.company}</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 flex-shrink-0">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Value */}
      <div className="flex items-center gap-1.5 mt-2.5">
        <div className={cn('h-5 w-5 rounded flex items-center justify-center', stageConfig.bgColor)}>
          <DollarSign className={cn('h-3 w-3', stageConfig.iconColor)} />
        </div>
        <span className="text-sm font-bold text-foreground">{deal.value}</span>
      </div>

      {/* Progress bar for probability */}
      {deal.probability !== undefined && (
        <div className="mt-2.5 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Probability</span>
            <span className="text-[11px] font-semibold text-foreground">{deal.probability}%</span>
          </div>
          <Progress value={deal.probability} className="h-1.5" />
        </div>
      )}

      {/* Footer: contact + date */}
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-border/30">
        <div className="flex items-center gap-1.5">
          <Avatar className="h-5 w-5">
            <AvatarFallback className={cn('text-[8px] font-bold', stageConfig.bgColor, stageConfig.iconColor)}>
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">{deal.contact}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{deal.closeDate}</span>
        </div>
      </div>
    </Card>
  );
}

// ─── Droppable Column ───

function StageColumn({
  stageConfig,
  deals,
  totalValue,
}: {
  stageConfig: StageConfig;
  deals: KanbanDeal[];
  totalValue: string;
}) {
  const { t } = useTranslation('deals');
  const { setNodeRef, isOver } = useDroppable({ id: stageConfig.id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col min-w-[270px] w-[270px] lg:w-auto lg:flex-1 rounded-xl border transition-colors duration-200',
        isOver
          ? `border-2 ${stageConfig.borderColor} bg-muted/40`
          : 'border-border/40 bg-muted/20'
      )}
    >
      {/* Column Header */}
      <div className="px-3 py-2.5 border-b border-border/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: stageConfig.color }}
            />
            <span className="text-[13px] font-semibold text-foreground">
              {t(`stages.${stageConfig.name}`)}
            </span>
            <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
              {deals.length}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <TrendingUp className="h-3 w-3 text-muted-foreground" />
          <span className="text-[11px] text-muted-foreground font-medium">{totalValue}</span>
        </div>
      </div>

      {/* Cards */}
      <ScrollArea className="flex-1 px-2 py-2">
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[60px]">
            {deals.map((deal) => (
              <SortableDealCard key={deal.id} deal={deal} stageConfig={stageConfig} />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

// ─── Main Kanban Board ───

export function KanbanBoard({ initialDeals }: { initialDeals: KanbanDeal[] }) {
  const [deals, setDeals] = useState<KanbanDeal[]>(initialDeals);
  const [activeDeal, setActiveDeal] = useState<KanbanDeal | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const deal = deals.find((d) => d.id === event.active.id);
    if (deal) setActiveDeal(deal);
  }, [deals]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active deal
    const activeDeal = deals.find((d) => d.id === activeId);
    if (!activeDeal) return;

    // Determine the target stage
    const overDeal = deals.find((d) => d.id === overId);
    const targetStage = overDeal ? overDeal.stage : overId; // overId could be a column id

    // Check if it's a valid stage
    const isValidStage = STAGE_CONFIGS.some((s) => s.id === targetStage);
    if (!isValidStage) return;

    // Move deal to new stage
    if (activeDeal.stage !== targetStage) {
      setDeals((prev) =>
        prev.map((d) => (d.id === activeId ? { ...d, stage: targetStage } : d))
      );
    }
  }, [deals]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDeal(null);
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    if (activeId === overId) return;

    // Reorder within the same stage
    const activeDeal = deals.find((d) => d.id === activeId);
    const overDeal = deals.find((d) => d.id === overId);

    if (activeDeal && overDeal && activeDeal.stage === overDeal.stage) {
      const stageDeals = deals.filter((d) => d.stage === activeDeal.stage);
      const oldIndex = stageDeals.findIndex((d) => d.id === activeId);
      const newIndex = stageDeals.findIndex((d) => d.id === overId);
      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(stageDeals, oldIndex, newIndex);
        setDeals((prev) => {
          const other = prev.filter((d) => d.stage !== activeDeal.stage);
          return [...other, ...reordered];
        });
      }
    }
  }, [deals]);

  const getStageDeals = (stageId: string) => deals.filter((d) => d.stage === stageId);
  const getStageTotalValue = (stageId: string) => {
    const total = getStageDeals(stageId).reduce((sum, d) => sum + d.numericValue, 0);
    return total.toLocaleString('en-US') + ' TND';
  };

  const activeStageConfig = activeDeal
    ? STAGE_CONFIGS.find((s) => s.id === activeDeal.stage) || STAGE_CONFIGS[0]
    : STAGE_CONFIGS[0];

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-2 h-full">
        {STAGE_CONFIGS.map((stage) => (
          <StageColumn
            key={stage.id}
            stageConfig={stage}
            deals={getStageDeals(stage.id)}
            totalValue={getStageTotalValue(stage.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeDeal && (
          <div className="w-[270px]">
            <DealCard deal={activeDeal} stageConfig={activeStageConfig} isOverlay />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
