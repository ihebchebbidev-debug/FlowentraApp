import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  type EdgeProps,
} from '@xyflow/react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddButtonEdgeProps extends EdgeProps {
  data?: {
    onAddNode?: (position: { x: number; y: number }, sourceId: string, targetId: string) => void;
  };
}

export const AddButtonEdge = memo(({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  animated,
  selected,
  data,
  label,
}: AddButtonEdgeProps) => {
  const [isHovered, setIsHovered] = useState(false);

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 20,
  });

  // Determine edge color based on label
  const getEdgeColor = () => {
    if (selected) return 'hsl(var(--primary))';
    if (isHovered) return 'hsl(var(--primary) / 0.6)';
    
    const labelStr = typeof label === 'string' ? label.toLowerCase() : '';
    if (labelStr === 'yes' || labelStr === 'true' || labelStr === '✓') 
      return 'hsl(var(--success) / 0.6)';
    if (labelStr === 'no' || labelStr === 'false' || labelStr === '✗') 
      return 'hsl(var(--destructive) / 0.5)';
    
    return 'hsl(var(--muted-foreground) / 0.35)';
  };

  const getLabelStyle = () => {
    const labelStr = typeof label === 'string' ? label.toLowerCase() : '';
    if (labelStr === 'yes' || labelStr === 'true' || labelStr === '✓')
      return 'bg-success/10 text-success border-success/20';
    if (labelStr === 'no' || labelStr === 'false' || labelStr === '✗')
      return 'bg-destructive/10 text-destructive border-destructive/20';
    return 'bg-card text-muted-foreground border-border';
  };

  return (
    <>
      {/* Invisible wider path for easier hovering */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />

      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 2.5 : isHovered ? 2.2 : 1.8,
          stroke: getEdgeColor(),
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
          filter: selected ? 'drop-shadow(0 0 4px hsl(var(--primary) / 0.25))' : 
                  isHovered ? 'drop-shadow(0 0 3px hsl(var(--primary) / 0.15))' : 'none',
        }}
      />

      <EdgeLabelRenderer>
        {/* Edge label (branch labels like Yes/No) */}
        {label && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY - 18}px)`,
              pointerEvents: 'none',
            }}
            className="nodrag nopan"
          >
            <span className={cn(
              'text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border shadow-sm',
              getLabelStyle()
            )}>
              {label}
            </span>
          </div>
        )}

        {/* Add button in the middle of the edge */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              data?.onAddNode?.(
                { x: labelX, y: labelY },
                String(sourceX),
                String(targetX)
              );
            }}
            className={cn(
              'flex items-center justify-center',
              'w-7 h-7 rounded-full',
              'bg-card border-2 border-border/60',
              'text-muted-foreground/60',
              'hover:border-primary hover:text-primary hover:bg-primary/5',
              'hover:scale-110 hover:shadow-lg',
              'active:scale-95',
              'transition-all duration-200 ease-out',
              isHovered ? 'opacity-100 scale-100 shadow-md' : 'opacity-0 scale-75',
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

AddButtonEdge.displayName = 'AddButtonEdge';
