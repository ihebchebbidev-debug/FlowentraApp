import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react';

interface TryCatchNodeProps {
  data: {
    label: string;
    type: string;
    icon: React.ComponentType<any>;
    description?: string;
    config?: {
      retryCount?: number;
      retryDelay?: number;
      logErrors?: boolean;
    };
  };
  id: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onRemove?: (nodeId: string) => void;
}

export const TryCatchNode = memo(({ data, id, onNodeClick, onRemove }: TryCatchNodeProps) => {
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

  const retryCount = data.config?.retryCount || 0;
  const hasRetry = retryCount > 0;

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
      
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 rounded-lg bg-white/80 text-warning">
          <Shield className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {data.label}
          </div>
        </div>
      </div>

      {/* Configuration Display */}
      <div className="text-xs text-muted-foreground mb-3 px-2 py-1 bg-white/60 rounded">
        {hasRetry ? (
          <div>
            <div>{t('nodeUi.attempts')}: <strong>{retryCount}</strong></div>
            {data.config?.retryDelay && (
              <div>{t('nodeUi.delay')}: <strong>{data.config.retryDelay}s</strong></div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground/60">{t('nodeUi.clickToConfigure')}</span>
        )}
      </div>

      {/* Try Block */}
      <div className="bg-success/10 border border-success/20 rounded p-2 mb-2 text-center text-xs">
        <div className="flex items-center justify-center gap-1 text-success mb-1">
          <CheckCircle className="h-3 w-3" />
          {t('nodeUi.try')}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="try"
          style={{ top: '60%' }}
          className="w-3 h-3 bg-success border-2 border-success"
          isConnectable={true}
        />
      </div>

      {/* Catch Block */}
      <div className="bg-destructive/10 border border-destructive/20 rounded p-2 mb-2 text-center text-xs">
        <div className="flex items-center justify-center gap-1 text-destructive mb-1">
          <AlertTriangle className="h-3 w-3" />
          {t('nodeUi.onError')}
        </div>
        <Handle
          type="source"
          position={Position.Right}
          id="catch"
          style={{ top: '80%' }}
          className="w-3 h-3 bg-destructive border-2 border-destructive"
          isConnectable={true}
        />
      </div>

      {/* Success Output */}
      <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
  {t('nodeUi.finished')}
        <Handle
          type="source"
          position={Position.Bottom}
          id="finally"
          className="w-3 h-3 bg-muted-foreground border-2 border-muted-foreground"
          isConnectable={true}
        />
      </div>
    </div>
  );
});