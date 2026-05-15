import { Handle, Position } from '@xyflow/react';
import { memo } from 'react';
import { Loader2, Check, X } from 'lucide-react';

export type NodeExecutionState = 'idle' | 'waiting' | 'executing' | 'completed' | 'failed';

interface WorkflowNodeProps {
  data: {
    label: string;
    type: string;
    icon: React.ComponentType<any>;
    description?: string;
    config?: any;
    executionState?: NodeExecutionState;
  };
  id: string;
  onNodeClick?: (nodeId: string, nodeData: any) => void;
  onRemove?: (nodeId: string) => void;
}

const getNodeStyle = (type: string) => {
  switch (type) {
    case 'contact':
    case 'offer':
    case 'sale':
    case 'service-order':
    case 'dispatch':
      return 'bg-green-50 border-green-200 hover:border-green-300 hover:bg-green-100 dark:bg-green-900 dark:border-green-700 dark:hover:border-green-600 dark:hover:bg-green-800';
    case 'email':
    case 'email-template':
    case 'email-llm':
      return 'bg-blue-50 border-blue-200 hover:border-blue-300 hover:bg-blue-100 dark:bg-sky-900 dark:border-sky-700 dark:hover:border-sky-600 dark:hover:bg-sky-800';
    case 'llm-writer':
    case 'llm-analyzer':
    case 'llm-personalizer':
      return 'bg-purple-50 border-purple-200 hover:border-purple-300 hover:bg-purple-100 dark:bg-violet-900 dark:border-violet-700 dark:hover:border-violet-600 dark:hover:bg-violet-800';
    case 'trigger':
    case 'webhook':
    case 'scheduled':
      return 'bg-orange-50 border-orange-200 hover:border-orange-300 hover:bg-orange-100 dark:bg-orange-900 dark:border-orange-700 dark:hover:border-orange-600 dark:hover:bg-orange-800';
    case 'condition':
    case 'filter':
      return 'bg-yellow-50 border-yellow-200 hover:border-yellow-300 hover:bg-yellow-100 dark:bg-yellow-900 dark:border-yellow-700 dark:hover:border-yellow-600 dark:hover:bg-yellow-800';
    default:
      return 'bg-gray-50 border-gray-200 hover:border-gray-300 hover:bg-gray-100 dark:bg-gray-800 dark:border-gray-700 dark:hover:border-gray-600 dark:hover:bg-gray-700';
  }
};

const getIconColor = (type: string) => {
  switch (type) {
    case 'contact':
    case 'offer':
    case 'sale':
    case 'service-order':
    case 'dispatch':
      return 'text-green-600 dark:text-green-300';
    case 'email':
    case 'email-template':
    case 'email-llm':
      return 'text-blue-600 dark:text-sky-300';
    case 'llm-writer':
    case 'llm-analyzer':
    case 'llm-personalizer':
      return 'text-purple-600 dark:text-violet-300';
    case 'trigger':
    case 'webhook':
    case 'scheduled':
      return 'text-orange-600 dark:text-orange-300';
    case 'condition':
    case 'filter':
      return 'text-yellow-700 dark:text-yellow-300';
    default:
      return 'text-gray-600 dark:text-gray-300';
  }
};

const getExecutionStateClass = (state?: NodeExecutionState) => {
  switch (state) {
    case 'waiting': return 'workflow-node-waiting';
    case 'executing': return 'workflow-node-executing';
    case 'completed': return 'workflow-node-completed';
    case 'failed': return 'workflow-node-failed';
    default: return 'workflow-node-idle';
  }
};

const ExecutionBadge = ({ state }: { state?: NodeExecutionState }) => {
  if (!state || state === 'idle' || state === 'waiting') return null;
  
  return (
    <div className={`workflow-status-badge ${state}`}>
      {state === 'executing' && <Loader2 className="h-3.5 w-3.5 animate-spin text-white" />}
      {state === 'completed' && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
      {state === 'failed' && <X className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
    </div>
  );
};

export const WorkflowNode = memo(({ data, id, onNodeClick, onRemove }: WorkflowNodeProps) => {
  const IconComponent = data.icon;
  const executionState = data.executionState;

  const handleClick = () => {
    if (onNodeClick) {
      onNodeClick(id, data);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onRemove) onRemove(id);
  };

  return (
    <div 
      className={`
        workflow-module relative px-3.5 py-2.5 rounded-xl border shadow-sm cursor-pointer 
        transition-all duration-200 ease-in-out min-w-[180px] max-w-[220px]
        hover:shadow-md hover:-translate-y-0.5
        ${getNodeStyle(data.type)}
        ${getExecutionStateClass(executionState)}
      `}
      onClick={handleClick}
    >
      {/* Execution Status Badge */}
      <ExecutionBadge state={executionState} />
      
      {/* Remove Button */}
      <button
        onClick={handleRemove}
        aria-label="Remove node"
        className="absolute -top-1.5 -right-1.5 z-20 w-5 h-5 rounded-full bg-background border border-border flex items-center justify-center text-xs text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
      >
        <X className="h-3 w-3" />
      </button>
      
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-background !border-[1.5px] !border-muted-foreground/60 hover:!border-primary !transition-colors"
        isConnectable={true}
      />
      
      <div className="flex items-center gap-3">
        {/* Icon */}
        <div className={`p-1.5 rounded-lg bg-background/80 shadow-sm ${getIconColor(data.type)}`}>
          <IconComponent className="h-4 w-4" />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm text-foreground truncate">
            {data.config?.name || data.label}
          </div>
          {data.description && (
            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
              {data.description}
            </div>
          )}
        </div>
      </div>
      
      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-background !border-[1.5px] !border-muted-foreground/60 hover:!border-primary !transition-colors"
        isConnectable={true}
      />
    </div>
  );
});
