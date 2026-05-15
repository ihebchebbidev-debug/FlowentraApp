import React from 'react';
import { Edge, Node } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { RotateCcw, ArrowRightLeft, CornerDownRight, Zap } from 'lucide-react';

interface EdgeToolbarProps {
  edge?: Edge | null;
  nodes: Node[];
  onChangeType: (edgeId: string, type: string) => void;
  onToggleAnimated: (edgeId: string) => void;
  onReverse: (edgeId: string) => void;
  position?: { x: number; y: number } | null;
}

export function EdgeToolbar({ edge, nodes, onChangeType, onToggleAnimated, onReverse, position }: EdgeToolbarProps) {
  if (!edge) return null;

  // find source and target nodes to position the toolbar
  const source = nodes.find(n => n.id === edge.source);
  const target = nodes.find(n => n.id === edge.target);

  // default placement centered between nodes (approx). If position is provided (client coords), prefer it.
  const left = position ? position.x : (source && target ? (source.position.x + target.position.x) / 2 : 200);
  const top = position ? position.y : (source && target ? (source.position.y + target.position.y) / 2 : 120);

  const style = position ? { left, top, position: 'fixed' as const } : { left, top, position: 'absolute' as const };

  return (
    <div
      style={style}
      className="z-50 -translate-x-1/2 -translate-y-1/2 bg-card/95 dark:bg-gray-900/95 border border-border shadow-lg rounded-md p-2 flex items-center gap-2"
    >
  <Button size="sm" variant="ghost" onClick={() => onChangeType(edge.id, 'smoothstep')} title="Smooth">
        <CornerDownRight className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onChangeType(edge.id, 'bezier')} title="Bezier">
        <Zap className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onChangeType(edge.id, 'straight')} title="Straight">
        <ArrowRightLeft className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => onToggleAnimated(edge.id)} title="Toggle animation">
        <RotateCcw className="h-4 w-4" />
      </Button>
      <Button size="sm" variant="secondary" onClick={() => onReverse(edge.id)} title="Reverse direction">
        Reverse
      </Button>
    </div>
  );
}

export default EdgeToolbar;
