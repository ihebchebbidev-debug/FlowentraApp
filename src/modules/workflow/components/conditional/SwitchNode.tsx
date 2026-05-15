import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Plus } from 'lucide-react';

interface SwitchNodeProps {
  data: {
    label: string;
    type: string;
    icon: React.ComponentType<any>;
    description?: string;
    config?: {
      field?: string;
      cases?: Array<{ value: string; label: string }>;
    };
  };
  id: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onRemove?: (nodeId: string) => void;
}

export const SwitchNode = memo(({ data, id, onNodeClick, onRemove }: SwitchNodeProps) => {
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

  const cases = data.config?.cases || [];
  const hasField = data.config?.field;

  return (
    <div 
      className="relative px-4 py-3 rounded-lg border-2 shadow-sm cursor-pointer 
                 transition-all duration-200 ease-in-out min-w-[220px] max-w-[280px]
                 bg-violet-50 border-violet-200 hover:border-violet-300 hover:bg-violet-100"
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
        position={Position.Top}
  className="w-3 h-3 bg-white border-2 border-violet-400"
  isConnectable={true}
      />
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/80 text-violet-600">
          <Menu className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-gray-900 truncate">
            {data.label}
          </div>
        </div>
      </div>

      {/* Field Display */}
  <div className="text-[11px] text-gray-600 mb-3 px-2 py-1 bg-white/60 rounded">
        {hasField ? (
          <span>{t('nodeUi.basedOn')}: <strong>{data.config.field}</strong></span>
        ) : (
          <span className="text-gray-400">{t('nodeUi.clickToConfigure')}</span>
        )}
      </div>

      {/* Cases */}
      <div className="space-y-1 mb-3">
  {cases.slice(0, 3).map((caseItem, index) => (
          <div key={index} className="flex items-center justify-between text-[11px]">
            <span className="bg-white/80 px-2 py-1 rounded text-gray-700">
              {caseItem.label || caseItem.value}
            </span>
            <Handle
              type="source"
              position={Position.Right}
              id={`case-${index}`}
              style={{ 
                top: `${45 + (index * 15)}%`,
                transform: 'translateY(-50%)'
              }}
              className="w-2 h-2 bg-violet-500 border border-violet-600"
              isConnectable={true}
            />
          </div>
        ))}
        
        {cases.length > 3 && (
          <div className="text-[11px] text-gray-500 text-center">
            +{cases.length - 3} {t('nodeUi.moreCases')}
          </div>
        )}
        
        {cases.length === 0 && (
          <div className="flex items-center gap-1 text-[11px] text-gray-400 justify-center">
            <Plus className="h-3 w-3" />
            {t('nodeUi.addCases')}
          </div>
        )}
      </div>

      {/* Default Case Handle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">{t('nodeUi.default')}:</span>
        <Handle
          type="source"
          position={Position.Bottom}
          id="default"
          className="w-3 h-3 bg-gray-400 border-2 border-gray-500"
          isConnectable={true}
        />
      </div>
    </div>
  );
});