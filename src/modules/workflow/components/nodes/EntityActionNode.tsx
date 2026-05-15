import { Handle, Position } from '@xyflow/react';
import { memo, useState, forwardRef } from 'react';
import { Loader2, Check, X, Cog, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { NodeExecutionState } from './N8nStyleNode';

export interface EntityActionData {
  label: string;
  type: string;
  entityType: 'offer' | 'sale' | 'service_order' | 'dispatch';
  actionType: 'create' | 'update' | 'update-status' | 'delete';
  icon: React.ComponentType<any>;
  description?: string;
  config?: Record<string, any>;
  executionState?: NodeExecutionState;
  newStatus?: string | null;
  autoCreate?: boolean;
}

interface EntityActionNodeProps {
  data: EntityActionData;
  id: string;
  selected?: boolean;
  onNodeClick?: (nodeId: string, nodeData: EntityActionData) => void;
  onRemove?: (nodeId: string) => void;
}

const getEntityStyle = (entityType: string) => {
  const styles: Record<string, { color: string }> = {
    offer: { color: '#f97316' },
    sale: { color: '#10b981' },
    service_order: { color: '#3b82f6' },
    dispatch: { color: '#8b5cf6' },
  };
  return styles[entityType] || styles.offer;
};

const getActionBadge = (actionType: string) => {
  switch (actionType) {
    case 'create': return { icon: '+', label: 'Create' };
    case 'update':
    case 'update-status': return { icon: '↻', label: 'Update' };
    case 'delete': return { icon: '×', label: 'Delete' };
    default: return { icon: '→', label: 'Action' };
  }
};

const ExecutionBadge = ({ state }: { state?: NodeExecutionState }) => {
  if (!state || state === 'idle') return null;

  const config: Record<string, { bg: string; content: React.ReactNode }> = {
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
    )}>
      {c.content}
    </div>
  );
};

export const EntityActionNode = memo(forwardRef<HTMLDivElement, EntityActionNodeProps>(({ data, id, selected, onNodeClick, onRemove }, ref) => {
  const { t } = useTranslation('workflow');
  const [isHovered, setIsHovered] = useState(false);
  
  const IconComponent = data.icon || Cog;
  const style = getEntityStyle(data.entityType);
  const action = getActionBadge(data.actionType);
  
  const displayLabel = data.config?.name || data.label;
  const actionLabel = t(`action.${data.actionType}`, action.label);

  const getExecutionRing = () => {
    switch (data.executionState) {
      case 'executing': return 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background';
      case 'completed': return 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background';
      case 'failed': return 'ring-2 ring-red-500 ring-offset-2 ring-offset-background';
      default: return '';
    }
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative group transition-all duration-200',
        'w-[250px]',
        selected && 'scale-[1.02]',
        data.executionState === 'waiting' && 'workflow-node-waiting',
        data.executionState === 'executing' && 'workflow-node-executing',
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Input Handle */}
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

      {/* Main Card */}
      <div
        onClick={() => onNodeClick?.(id, data)}
        className={cn(
          'cursor-pointer rounded-xl overflow-hidden',
          'bg-card border shadow-sm',
          selected ? 'border-primary shadow-lg' : 'border-border/60',
          'hover:shadow-lg hover:border-border',
          'transition-all duration-200',
          getExecutionRing(),
        )}
      >
        {/* Colored accent */}
        <div className="h-[3px]" style={{ background: style.color }} />

        {/* Header */}
        <div className="px-3.5 py-2.5 flex items-center gap-3">
          {/* Icon with action badge */}
          <div className="relative flex-shrink-0">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shadow-sm"
              style={{ background: `${style.color}15`, border: `1.5px solid ${style.color}40` }}
            >
              <IconComponent className="h-[18px] w-[18px]" style={{ color: style.color }} />
            </div>
            {/* Action type badge */}
            <div
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
              style={{ background: style.color }}
            >
              {action.icon}
            </div>
          </div>

          {/* Labels */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px] text-foreground truncate leading-tight">
              {displayLabel}
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[11px] font-medium" style={{ color: style.color }}>
                {actionLabel}
              </span>
              <span className="text-[10px] text-muted-foreground">
                • {t(`entity.${data.entityType}`, data.entityType)}
              </span>
            </div>
          </div>

          <Cog className="h-3.5 w-3.5 text-muted-foreground/30 flex-shrink-0" />
        </div>

        {/* Status Update Display */}
        {data.newStatus && (
          <div className="px-3.5 pb-2.5">
            <div className="flex items-center gap-2 text-xs p-2 rounded-lg bg-muted/40">
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span className="text-muted-foreground text-[11px]">{t('setTo')}:</span>
              <span className="px-2 py-0.5 rounded-md text-xs font-semibold text-white shadow-sm"
                style={{ background: style.color }}
              >
                {t(`status.${data.entityType}.${data.newStatus}`, data.newStatus)}
              </span>
            </div>
          </div>
        )}

        {/* Auto Create */}
        {data.autoCreate && (
          <div className="px-3.5 pb-2.5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/70">
              <Check className="h-3 w-3 text-success" />
              <span>{t('autoCreate')}</span>
            </div>
          </div>
        )}

        {/* Description */}
        {data.description && (
          <div className="px-3.5 pb-2.5 border-t border-border/30 pt-2">
            <div className="text-[11px] text-muted-foreground/70 truncate">
              {data.description}
            </div>
          </div>
        )}
      </div>

      <ExecutionBadge state={data.executionState} />

      {/* Remove */}
      {isHovered && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove?.(id); }}
          className="absolute -top-2 -right-2 z-20 w-5 h-5 rounded-full bg-destructive/90 text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 hover:bg-destructive transition-transform text-xs"
        >
          ×
        </button>
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

EntityActionNode.displayName = 'EntityActionNode';
