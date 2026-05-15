import { Handle, Position } from '@xyflow/react';
import { memo, useState, useMemo, forwardRef } from 'react';
import { Loader2, Check, X, Settings, Play, AlertCircle, Hash, Type, ToggleLeft, Calendar, List, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { inferOutputSchema, type StepOutputField } from '@/modules/workflow/components/panels/VariablePicker';

export type NodeExecutionState = 'idle' | 'waiting' | 'executing' | 'completed' | 'failed';

export type NodeCategory = 
  | 'trigger' 
  | 'entity' 
  | 'action' 
  | 'condition' 
  | 'communication' 
  | 'ai' 
  | 'integration';

export interface N8nNodeData {
  label: string;
  type: string;
  category: NodeCategory;
  icon: React.ComponentType<any>;
  description?: string;
  config?: Record<string, any>;
  executionState?: NodeExecutionState;
  fromStatus?: string;
  toStatus?: string;
  isTrigger?: boolean;
  error?: string;
  outputCount?: number;
}

interface N8nStyleNodeProps {
  data: N8nNodeData;
  id: string;
  selected?: boolean;
  onNodeClick?: (nodeId: string, nodeData: N8nNodeData) => void;
  onRemove?: (nodeId: string) => void;
}

const getCategoryColor = (category: NodeCategory) => {
  const colors: Record<NodeCategory, string> = {
    trigger: '#ff6d5a',
    entity: '#10b981',
    action: '#3b82f6',
    condition: '#f59e0b',
    communication: '#06b6d4',
    ai: '#8b5cf6',
    integration: '#64748b',
  };
  return colors[category] || colors.action;
};

const getExecutionRing = (state?: NodeExecutionState) => {
  switch (state) {
    case 'executing': return 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background';
    case 'completed': return 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background';
    case 'failed': return 'ring-2 ring-red-500 ring-offset-2 ring-offset-background';
    default: return '';
  }
};

const ExecutionBadge = ({ state }: { state?: NodeExecutionState }) => {
  if (!state || state === 'idle') return null;

  const config = {
    waiting: { bg: 'bg-warning', content: <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> },
    executing: { bg: 'bg-primary', content: <Loader2 className="h-3 w-3 text-white animate-spin" /> },
    completed: { bg: 'bg-success', content: <Check className="h-3 w-3 text-white" strokeWidth={3} /> },
    failed: { bg: 'bg-destructive', content: <X className="h-3 w-3 text-white" strokeWidth={3} /> },
  };

  const c = config[state];
  if (!c) return null;

  return (
    <div className={cn(
      'absolute -top-2.5 -right-2.5 z-20',
      'w-6 h-6 rounded-full border-2 border-background',
      'flex items-center justify-center shadow-md',
      c.bg,
      'animate-in zoom-in-50 duration-200'
    )}>
      {c.content}
    </div>
  );
};

const typeIcons: Record<string, React.ComponentType<any>> = {
  string: Type, number: Hash, boolean: ToggleLeft, date: Calendar, object: List, array: List,
};

const OutputSchemaBadges = memo(({ nodeType }: { nodeType: string }) => {
  const [expanded, setExpanded] = useState(false);
  const fields = useMemo(() => {
    const fakeNode = { id: '_', data: { type: nodeType }, position: { x: 0, y: 0 } } as any;
    return inferOutputSchema(fakeNode);
  }, [nodeType]);

  if (!fields || fields.length === 0) return null;

  const visibleFields = expanded ? fields : fields.slice(0, 3);
  const hasMore = fields.length > 3;

  return (
    <div
      className="px-3.5 pb-2"
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={cn(
        'flex flex-wrap gap-1 transition-all duration-200',
        expanded && hasMore && 'bg-muted/30 rounded-md p-1.5 -mx-1.5'
      )}>
        {visibleFields.map(field => {
          const Icon = typeIcons[field.type] || Type;
          return (
            <span
              key={field.key}
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] bg-muted/50 text-muted-foreground/70 font-mono"
            >
              <Icon className="h-2.5 w-2.5" />
              {field.key}
            </span>
          );
        })}
        {!expanded && hasMore && (
          <span className="text-[9px] text-muted-foreground/50 self-center cursor-default">
            +{fields.length - 3}
          </span>
        )}
      </div>
    </div>
  );
});
OutputSchemaBadges.displayName = 'OutputSchemaBadges';

export const N8nStyleNode = memo(forwardRef<HTMLDivElement, N8nStyleNodeProps>(({ data, id, selected, onNodeClick, onRemove }, ref) => {
  const { t } = useTranslation('workflow');
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = data.icon || Zap;
  const categoryColor = getCategoryColor(data.category);
  const executionRing = getExecutionRing(data.executionState);
  
  const getEntityType = (type: string) => {
    if (type.includes('offer')) return 'offer';
    if (type.includes('sale')) return 'sale';
    if (type.includes('service-order') || type.includes('service_order')) return 'service_order';
    if (type.includes('dispatch')) return 'dispatch';
    return type;
  };
  const entityType = getEntityType(data.type);
  
  const displayLabel = data.config?.name || data.label;
  const hasStatusConfig = data.fromStatus || data.toStatus;

  return (
    <div
      className={cn(
        'relative group transition-all duration-200',
        'w-[260px]',
        selected && 'scale-[1.02]',
        data.executionState === 'waiting' && 'workflow-node-waiting',
        data.executionState === 'executing' && 'workflow-node-executing',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input Handle */}
      {!data.isTrigger && (
        <Handle
          type="target"
          position={Position.Left}
          className={cn(
            '!w-[10px] !h-[10px] !rounded-full',
            '!bg-background !border-[2.5px]',
            isHovered ? '!border-primary !shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : '!border-muted-foreground/50',
            'transition-all duration-200',
          )}
          isConnectable={true}
        />
      )}

      {/* Main Card */}
      <div
        onClick={() => onNodeClick?.(id, data)}
        className={cn(
          'cursor-pointer rounded-xl overflow-hidden',
          'bg-card border shadow-sm',
          selected ? 'border-primary shadow-lg' : 'border-border/60',
          'hover:shadow-lg hover:border-border',
          'transition-all duration-200',
          executionRing,
        )}
      >
        {/* Colored top accent */}
        <div className="h-[3px]" style={{ background: categoryColor }} />

        {/* Header */}
        <div className="px-3.5 py-2.5 flex items-center gap-3">
          {/* Icon circle */}
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: `${categoryColor}15`, border: `1.5px solid ${categoryColor}40` }}
          >
            <IconComponent className="h-[18px] w-[18px]" style={{ color: categoryColor }} />
          </div>

          {/* Labels */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px] text-foreground truncate leading-tight">
              {displayLabel}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider"
                style={{ background: `${categoryColor}18`, color: categoryColor }}
              >
                {t(`category.${data.category}`, data.category)}
              </span>
            </div>
          </div>

          {/* Trigger badge */}
          {data.isTrigger && (
            <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
              style={{ background: `${categoryColor}20`, color: categoryColor }}
            >
              <Play className="h-2.5 w-2.5" />
            </div>
          )}
        </div>

        {/* Status config display */}
        {hasStatusConfig && (
          <div className="px-3.5 pb-2">
            <div className="flex items-center gap-1.5 text-[10px]">
              {data.fromStatus && (
                <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                  {t(`status.${entityType}.${data.fromStatus}`, data.fromStatus)}
                </span>
              )}
              {data.fromStatus && data.toStatus && (
                <span className="text-muted-foreground">→</span>
              )}
              {data.toStatus && (
                <span className="px-1.5 py-0.5 rounded-md font-medium text-white"
                  style={{ background: categoryColor }}
                >
                  {t(`status.${entityType}.${data.toStatus}`, data.toStatus)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && !hasStatusConfig && (
          <div className="px-3.5 pb-2.5">
            <div className="text-[11px] text-muted-foreground/80 truncate">
              {data.description}
            </div>
          </div>
        )}

        {/* Error */}
        {data.error && (
          <div className="px-3.5 pb-2.5">
            <div className="flex items-center gap-1 text-[10px] text-destructive">
              <AlertCircle className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{data.error}</span>
            </div>
          </div>
        )}

        {/* Output Schema Badges */}
        <OutputSchemaBadges nodeType={data.type} />
      </div>

      {/* Execution Badge */}
      <ExecutionBadge state={data.executionState} />

      {/* Remove Button */}
      {isHovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(id); }}
          className={cn(
            'absolute -top-2 -right-2 z-20',
            'w-5 h-5 rounded-full',
            'bg-destructive/90 text-destructive-foreground',
            'flex items-center justify-center',
            'shadow-md hover:scale-110 hover:bg-destructive',
            'transition-transform duration-150',
            'text-xs'
          )}
        >
          ×
        </button>
      )}

      {/* Settings hint */}
      {isHovered && (
        <div className="absolute bottom-2 left-3 opacity-0 group-hover:opacity-60 transition-opacity">
          <Settings className="h-3 w-3 text-muted-foreground" />
        </div>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className={cn(
          '!w-[10px] !h-[10px] !rounded-full',
          '!bg-background !border-[2.5px]',
          isHovered ? '!border-primary !shadow-[0_0_6px_hsl(var(--primary)/0.5)]' : '!border-muted-foreground/50',
          'transition-all duration-200',
        )}
        isConnectable={true}
      />
    </div>
  );
}));

N8nStyleNode.displayName = 'N8nStyleNode';
