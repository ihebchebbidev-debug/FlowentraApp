import { Handle, Position } from '@xyflow/react';
import { memo, useState, forwardRef } from 'react';
import { Loader2, Check, X, GitBranch, Menu, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { NodeExecutionState } from './N8nStyleNode';

export interface ConditionNodeData {
  label: string;
  type: 'if-else' | 'switch';
  icon: React.ComponentType<any>;
  description?: string;
  field?: string;
  operator?: string;
  value?: string;
  config?: {
    field?: string;
    operator?: string;
    value?: string;
    checkField?: string;
    cases?: Array<{ value: string; label: string }>;
    conditionData?: {
      field?: string;
      operator?: string;
      value?: string;
      checkField?: string;
    };
    switchData?: {
      field?: string;
      cases?: Array<{ value: string; label: string }>;
    };
  };
  executionState?: NodeExecutionState;
  activeBranch?: 'yes' | 'no' | string;
}

interface ConditionNodeProps {
  data: ConditionNodeData;
  id: string;
  selected?: boolean;
  onNodeClick?: (nodeId: string, nodeData: ConditionNodeData) => void;
  onRemove?: (nodeId: string) => void;
}

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

export const ConditionNode = memo(forwardRef<HTMLDivElement, ConditionNodeProps>(({ data, id, selected, onNodeClick, onRemove }, ref) => {
  const { t } = useTranslation('workflow');
  const [isHovered, setIsHovered] = useState(false);
  
  const isSwitch = data.type === 'switch';
  const IconComponent = isSwitch ? Menu : (data.icon || GitBranch);
  
  const translateField = (field: string) => {
    const translationKey = `conditionFields.${field.replace(/\./g, '_')}`;
    const translated = t(translationKey, '');
    return translated || field;
  };
  
  const translateOperator = (operator: string) => t(`operators.${operator}`, operator);
  
  const translateStatusValue = (value: string | undefined) => {
    if (!value) return '';
    return value.split(',').map(status => {
      const trimmed = status.trim();
      const entityTypes = ['dispatch', 'service_order', 'sale', 'offer'];
      for (const entityType of entityTypes) {
        const translated = t(`status.${entityType}.${trimmed}`, '');
        if (translated) return translated;
      }
      return trimmed.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }).join(', ');
  };
  
  // IF/ELSE fields
  const conditionField = data.field ?? data.config?.field ?? data.config?.conditionData?.field;
  const conditionOperator = data.operator ?? data.config?.operator ?? data.config?.conditionData?.operator ?? 'equals';
  const conditionValue = data.value ?? data.config?.value ?? data.config?.conditionData?.value;
  
  // SWITCH fields
  const switchField = data.config?.switchData?.field ?? data.config?.field ?? (data as any).field;
  const switchCases = data.config?.switchData?.cases ?? data.config?.cases ?? [];
  
  const displayLabel = (data.config as any)?.name || data.label;

  const getExecutionRing = () => {
    switch (data.executionState) {
      case 'executing': return 'ring-2 ring-blue-400 ring-offset-2 ring-offset-background';
      case 'completed': return 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background';
      case 'failed': return 'ring-2 ring-red-500 ring-offset-2 ring-offset-background';
      default: return '';
    }
  };

  // Color scheme: amber for if-else, violet for switch
  const accentColor = isSwitch ? 'violet' : 'warning';
  const borderColor = isSwitch
    ? (selected ? 'border-violet-500 shadow-lg' : 'border-violet-300/60 dark:border-violet-700/60')
    : (selected ? 'border-primary shadow-lg' : 'border-amber-300/60 dark:border-amber-700/60');
  const hoverBorder = isSwitch ? 'hover:border-violet-400' : 'hover:border-amber-400';
  const accentBg = isSwitch ? 'bg-violet-500' : 'bg-warning';
  const iconBg = isSwitch ? 'bg-violet-500/10 border-violet-500/30' : 'bg-warning/10 border-warning/30';
  const iconColor = isSwitch ? 'text-violet-600 dark:text-violet-400' : 'text-warning';
  const badgeBg = isSwitch ? 'bg-violet-500/15 text-violet-600 dark:text-violet-400' : 'bg-warning/15 text-warning';

  // Calculate handle positions for switch cases
  const totalSwitchOutputs = switchCases.length + 1; // cases + default
  const getHandleTopPercent = (index: number) => {
    // Distribute handles evenly along the right side
    const startPercent = 30;
    const endPercent = 85;
    const step = totalSwitchOutputs > 1 ? (endPercent - startPercent) / (totalSwitchOutputs - 1) : 0;
    return startPercent + (index * step);
  };

  return (
    <div
      ref={ref}
      className={cn(
        'relative group transition-all duration-200',
        isSwitch ? 'w-[250px]' : 'w-[230px]',
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
          borderColor,
          hoverBorder,
          'hover:shadow-lg',
          'transition-all duration-200',
          getExecutionRing(),
        )}
      >
        {/* Accent bar */}
        <div className={cn('h-[3px]', accentBg)} />

        {/* Header */}
        <div className="px-3.5 py-2.5 flex items-center gap-3">
          <div className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border',
            iconBg
          )}>
            <IconComponent className={cn('h-[18px] w-[18px]', iconColor)} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[13px] text-foreground truncate leading-tight">
              {displayLabel}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                'inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider',
                badgeBg
              )}>
                {isSwitch ? t('switch') : t('conditionLabel')}
              </span>
            </div>
          </div>
        </div>

        {/* IF/ELSE: Condition expression */}
        {!isSwitch && conditionField && (
          <div className="px-3.5 pb-3">
            <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono">
              <span className="text-warning">{translateField(conditionField)}</span>
              {' '}
              <span className="text-muted-foreground">{translateOperator(conditionOperator)}</span>
              {' '}
              <span className="text-foreground font-medium">{translateStatusValue(conditionValue)}</span>
            </div>
          </div>
        )}

        {/* SWITCH: Field + Cases display */}
        {isSwitch && (
          <div className="px-3.5 pb-2">
            {switchField ? (
              <div className="text-[11px] text-muted-foreground bg-muted/50 rounded-lg px-2.5 py-1.5 font-mono mb-2">
                <span className="text-violet-600 dark:text-violet-400">{translateField(switchField)}</span>
              </div>
            ) : (
              <div className="text-[11px] text-muted-foreground/60 bg-muted/30 rounded-lg px-2.5 py-1.5 mb-2 text-center">
                {t('nodeUi.clickToConfigure', 'Click to configure')}
              </div>
            )}
            
            {/* Cases list */}
            <div className="space-y-1">
              {switchCases.slice(0, 4).map((caseItem, index) => (
                <div key={index} className="flex items-center justify-between text-[10px]">
                  <span className="bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 px-2 py-0.5 rounded font-medium truncate max-w-[150px]">
                    {caseItem.label || caseItem.value}
                  </span>
                  <span className="text-muted-foreground/50">→</span>
                </div>
              ))}
              {switchCases.length > 4 && (
                <div className="text-[10px] text-muted-foreground/50 text-center">
                  +{switchCases.length - 4} {t('nodeUi.moreCases', 'more')}
                </div>
              )}
              {switchCases.length === 0 && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground/40 justify-center py-1">
                  <Plus className="h-3 w-3" />
                  {t('nodeUi.addCases', 'Add cases')}
                </div>
              )}
              {/* Default case indicator */}
              <div className="flex items-center justify-between text-[10px] border-t border-border/30 pt-1 mt-1">
                <span className="text-muted-foreground italic">{t('nodeUi.default', 'Default')}</span>
                <span className="text-muted-foreground/50">→</span>
              </div>
            </div>
          </div>
        )}

        {/* IF/ELSE: Branch labels */}
        {!isSwitch && (
          <div className="flex border-t border-border/30">
            <div className={cn(
              'flex-1 py-1.5 text-center text-[10px] font-semibold border-r border-border/30',
              data.activeBranch === 'yes' ? 'bg-success text-white' : 'text-success'
            )}>
              ✓ {t('yes')}
            </div>
            <div className={cn(
              'flex-1 py-1.5 text-center text-[10px] font-semibold',
              data.activeBranch === 'no' ? 'bg-destructive text-white' : 'text-destructive'
            )}>
              ✗ {t('no')}
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

      {/* IF/ELSE: Output Handles - Yes/No */}
      {!isSwitch && (
        <>
          <Handle
            type="source"
            position={Position.Right}
            id="yes"
            className={cn(
              '!w-[10px] !h-[10px] !rounded-full',
              '!bg-success !border-[2.5px] !border-success',
              'transition-all duration-200',
              '!top-[40%]'
            )}
            isConnectable={true}
          />
          <Handle
            type="source"
            position={Position.Right}
            id="no"
            className={cn(
              '!w-[10px] !h-[10px] !rounded-full',
              '!bg-destructive !border-[2.5px] !border-destructive',
              'transition-all duration-200',
              '!top-[70%]'
            )}
            isConnectable={true}
          />
        </>
      )}

      {/* SWITCH: Output Handles - one per case + default */}
      {isSwitch && (
        <>
          {switchCases.map((caseItem, index) => (
            <Handle
              key={`case-${caseItem.value}`}
              type="source"
              position={Position.Right}
              id={caseItem.value.toLowerCase()}
              style={{ top: `${getHandleTopPercent(index)}%` }}
              className={cn(
                '!w-[8px] !h-[8px] !rounded-full',
                '!bg-violet-500 !border-[2px] !border-violet-600',
                'transition-all duration-200',
              )}
              isConnectable={true}
            />
          ))}
          {/* Default handle at bottom */}
          <Handle
            type="source"
            position={Position.Right}
            id="default"
            style={{ top: `${getHandleTopPercent(switchCases.length)}%` }}
            className={cn(
              '!w-[8px] !h-[8px] !rounded-full',
              '!bg-muted-foreground/50 !border-[2px] !border-muted-foreground',
              'transition-all duration-200',
            )}
            isConnectable={true}
          />
        </>
      )}
    </div>
  );
}));

ConditionNode.displayName = 'ConditionNode';
