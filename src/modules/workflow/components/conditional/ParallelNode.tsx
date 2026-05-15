import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Split, ArrowRight } from 'lucide-react';

interface ParallelNodeProps {
  data: {
    label: string;
    type: string;
    icon: React.ComponentType<any>;
    description?: string;
    config?: {
      branches?: number;
      waitForAll?: boolean;
    };
  };
  id: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onRemove?: (nodeId: string) => void;
}

export const ParallelNode = memo(({ data, id, onNodeClick, onRemove }: ParallelNodeProps) => {
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

  const branches = data.config?.branches || 2;
  const waitForAll = data.config?.waitForAll !== false;

  return (
    <div 
      className="relative px-4 py-3 rounded-lg border-2 shadow-sm cursor-pointer 
                 transition-all duration-200 ease-in-out min-w-[200px] max-w-[240px]
                 bg-success/10 border-success/30 hover:border-success/50 hover:bg-success/15"
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
        position={Position.Left}
  className="w-3 h-3 bg-white border-2 border-success"
  isConnectable={true}
      />
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/80 text-success">
          <Split className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {data.label}
          </div>
        </div>
      </div>

      {/* Configuration Display */}
      <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-white/60 rounded">
        <div>{t('nodeUi.branches')}: <strong>{branches}</strong></div>
        <div className="text-muted-foreground/70">
          {waitForAll ? t('nodeUi.waitForAll') : t('nodeUi.firstCompleted')}
        </div>
      </div>

      {/* Branch Outputs */}
      <div className="space-y-1 mb-2">
        {Array.from({ length: Math.min(branches, 4) }).map((_, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">{t('nodeUi.branch')} {index + 1}</span>
            <Handle
              type="source"
              position={Position.Right}
              id={`branch-${index}`}
              style={{ 
                top: `${30 + (index * 15)}%`,
                transform: 'translateY(-50%)'
              }}
              className="w-2 h-2 bg-success border border-success"
              isConnectable={true}
            />
          </div>
        ))}
        {branches > 4 && (
          <div className="text-xs text-muted-foreground text-center">
            +{branches - 4} {t('nodeUi.more')}
          </div>
        )}
      </div>

      {/* Merge Output */}
  <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground border-t border-success/20 pt-2">
  <ArrowRight className="h-3 w-3" />
  {t('nodeUi.mergedResult')}
  <Handle
          type="source"
          position={Position.Bottom}
          id="merged"
          className="w-3 h-3 bg-success border-2 border-success"
          isConnectable={true}
        />
      </div>
    </div>
  );
});