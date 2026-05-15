import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { RotateCcw, ArrowRight } from 'lucide-react';

interface LoopNodeProps {
  data: {
    label: string;
    type: string;
    icon: React.ComponentType<any>;
    description?: string;
    config?: {
      loopType?: 'for' | 'while';
      iterations?: number;
      condition?: string;
    };
  };
  id: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onRemove?: (nodeId: string) => void;
}

export const LoopNode = memo(({ data, id, onNodeClick, onRemove }: LoopNodeProps) => {
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

  const config = data.config;
  const isForLoop = config?.loopType === 'for';
  const hasConfig = config?.iterations || config?.condition;

  return (
    <div 
      className="relative px-4 py-3 rounded-lg border-2 shadow-sm cursor-pointer 
                 transition-all duration-200 ease-in-out min-w-[200px] max-w-[240px]
                 bg-cyan-50 border-cyan-200 hover:border-cyan-300 hover:bg-cyan-100"
      onClick={handleClick}
    >
      <button
        onClick={handleRemove}
        aria-label="Remove node"
        className="absolute top-1 right-1 w-6 h-6 rounded-full bg-white/80 border border-border flex items-center justify-center text-xs text-foreground hover:bg-red-50"
      >
        ×
      </button>
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
  className="w-3 h-3 bg-white border-2 border-cyan-400"
  isConnectable={true}
      />
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/80 text-cyan-600">
          <RotateCcw className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {data.label}
          </div>
        </div>
      </div>

      {/* Loop Configuration Display */}
  <div className="text-[11px] text-gray-600 mb-3 px-2 py-1 bg-white/60 rounded">
        {hasConfig ? (
          <span>
            {isForLoop ? (
              <>{t('nodeUi.repeatTimes', { count: config.iterations })}</>
            ) : (
              <>{t('nodeUi.whileCondition', { condition: config.condition })}</>
            )}
          </span>
        ) : (
          <span className="text-gray-400">{t('nodeUi.clickToConfigure')}</span>
        )}
      </div>

      {/* Loop Body Connection Area */}
    <div className="bg-white/80 border border-dashed border-cyan-300 rounded p-2 mb-2 text-center text-[11px] text-gray-500">
  {t('nodeUi.loopBody')}
        <Handle
          type="source"
          position={Position.Bottom}
          id="loop-body"
          style={{ bottom: '-12px' }}
          className="w-3 h-3 bg-cyan-500 border-2 border-cyan-600"
          isConnectable={true}
        />
      </div>

      {/* Continue/Exit Handles */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 text-xs text-gray-500">
          Continue
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-500">
          <ArrowRight className="h-3 w-3" />
          Sortie
          <Handle
            type="source"
            position={Position.Right}
            id="exit"
            className="w-3 h-3 bg-green-500 border-2 border-green-600"
            isConnectable={true}
          />
        </div>
      </div>
    </div>
  );
});