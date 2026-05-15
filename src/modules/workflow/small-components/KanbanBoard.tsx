import { ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useDroppable } from '@dnd-kit/core';
import { KanbanColumn } from "../types";

interface KanbanBoardProps {
  columns: KanbanColumn[];
  itemsByColumn: Record<string, any[]>;
  onMove: (itemId: string, fromColumn: string, toColumn: string, index?: number) => void;
  renderItem: (item: any) => ReactNode;
  className?: string;
}

const getTagClasses = (color?: string) => {
  switch (color) {
    case 'blue': return 'bg-primary/10 text-primary border-primary/20';
    case 'orange': return 'bg-warning/10 text-warning border-warning/20';
    case 'purple': return 'bg-accent/10 text-accent border-accent/20';
    case 'green': return 'bg-success/10 text-success border-success/20';
    case 'red': return 'bg-destructive/10 text-destructive border-destructive/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

function DroppableColumn({ 
  column, 
  items, 
  renderItem 
}: { 
  column: KanbanColumn; 
  items: any[]; 
  renderItem: (item: any) => ReactNode; 
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div className="flex-shrink-0 w-[200px] flex flex-col min-h-full">
      {/* Header — Twenty-style tag pill + count */}
      <div className="flex items-center justify-between px-2 py-2">
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <Badge
            variant="outline"
            className={`text-[11px] font-medium px-2 py-0.5 rounded-sm shrink-0 ${getTagClasses(column.color)}`}
          >
            {column.title}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-normal">
            {items.length}
            {column.limit && ` / ${column.limit}`}
          </span>
        </div>
      </div>

      {/* Cards container */}
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-2 px-2 pb-2 rounded-md transition-colors ${
          isOver ? 'bg-primary/5' : ''
        }`}
      >
        {items.map((item) => renderItem(item))}

        {items.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground/50 text-[11px]">
            No records
          </div>
        )}
      </div>
    </div>
  );
}

export function KanbanBoard({
  columns,
  itemsByColumn,
  onMove,
  renderItem,
  className
}: KanbanBoardProps) {
  return (
    <div className={`overflow-x-auto ${className || ''}`}>
      <div className="flex gap-0 p-1 min-w-max">
        {columns.map((column) => (
          <DroppableColumn
            key={column.id}
            column={column}
            items={itemsByColumn[column.id] || []}
            renderItem={renderItem}
          />
        ))}
      </div>
    </div>
  );
}
