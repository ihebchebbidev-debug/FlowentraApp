import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { GitBranch, Check, X } from 'lucide-react';

interface IfElseNodeProps {
  data: {
    label: string;
    type: string;
    icon: React.ComponentType<any>;
    description?: string;
    config?: {
      condition?: {
        field?: string;
        operator?: string;
        value?: string;
      };
    };
  };
  id: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onRemove?: (nodeId: string) => void;
}

export const IfElseNode = memo(({ data, id, onNodeClick, onRemove }: IfElseNodeProps) => {
  const { t } = useTranslation();
  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id, data);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove(id);
  };

  const condition = data.config?.condition;
  const hasCondition = condition?.field && condition?.operator && condition?.value;

  return (
    <div 
      className="relative px-4 py-3 rounded-lg border-2 shadow-sm cursor-pointer 
                 transition-all duration-200 ease-in-out min-w-[200px] max-w-[240px]
                 bg-warning/10 border-warning/30 hover:border-warning/50 hover:bg-warning/15"
      onClick={handleClick}
    >
      <button
        onClick={handleRemove}
        aria-label="Remove node"
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 border border-border flex items-center justify-center text-xs text-foreground hover:bg-destructive/10"
      >
        ×
      </button>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
  className="w-3 h-3 bg-white border-2 border-warning"
  isConnectable={true}
      />
      
      {/* Diamond shape indicator */}
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/80 text-warning">
          <GitBranch className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {data.label}
          </div>
        </div>
      </div>

      {/* Condition Display */}
  <div className="text-[11px] text-muted-foreground mb-3 px-2 py-1 bg-white/60 rounded">
        {hasCondition ? (
          <span>
            {t('previewCondition', { field: condition.field, operator: condition.operator, value: condition.value })}
          </span>
        ) : (
          <span className="text-muted-foreground/60">{t('nodeUi.clickToConfigure')}</span>
        )}
      </div>

      {/* Output Handles with Labels */}
      <div className="flex justify-between items-center">
        {/* YES/TRUE Output */}
        <div className="flex items-center gap-1">
            <div className="flex items-center gap-1 bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
            <Check className="h-3 w-3" />
            {t('nodeUi.yes')}
          </div>
          <Handle
            type="source"
            position={Position.Bottom}
            id="true"
            style={{ left: '25%', transform: 'translateX(-50%)' }}
            className="w-3 h-3 bg-success border-2 border-success"
            isConnectable={true}
          />
        </div>

        {/* NO/FALSE Output */}
        <div className="flex items-center gap-1">
          <Handle
            type="source"
            position={Position.Bottom}
            id="false"
            style={{ left: '75%', transform: 'translateX(-50%)' }}
            className="w-3 h-3 bg-destructive border-2 border-destructive"
            isConnectable={true}
          />
          <div className="flex items-center gap-1 bg-destructive/10 text-destructive px-2 py-1 rounded text-xs font-medium">
            <X className="h-3 w-3" />
            {t('nodeUi.no')}
          </div>
        </div>
      </div>
    </div>
  );
});