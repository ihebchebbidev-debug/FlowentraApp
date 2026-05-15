import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, MoreHorizontal } from "lucide-react";
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ContactProjectColumn, ContactTask } from "../types";
import { ContactDraggableTaskCard } from "./ContactDraggableTaskCard";

interface ContactDroppableColumnProps {
  column: ContactProjectColumn;
  tasks: ContactTask[];
  onQuickAdd: () => void;
}

const getTagClasses = (color: string) => {
  const map: Record<string, string> = {
    'bg-slate-500': 'bg-muted text-muted-foreground border-border',
    'bg-primary': 'bg-primary/15 text-primary border-primary/25',
    'bg-warning': 'bg-warning/15 text-warning border-warning/25',
    'bg-success': 'bg-success/15 text-success border-success/25',
    'bg-destructive': 'bg-destructive/15 text-destructive border-destructive/25',
  };
  return map[color] || 'bg-muted text-muted-foreground border-border';
};

export function ContactDroppableColumn({
  column,
  tasks,
  onQuickAdd
}: ContactDroppableColumnProps) {
  const [isHovered, setIsHovered] = useState(false);
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });

  return (
    <div className="min-w-[200px] max-w-[200px] flex flex-col h-full">
      {/* Header — Twenty style: tag pill + count + hover actions */}
      <div
        className="flex items-center justify-between px-2 py-2"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
          <Badge
            variant="outline"
            className={`text-[11px] font-medium px-2 py-0.5 rounded-sm shrink-0 ${getTagClasses(column.color)}`}
          >
            {column.title}
          </Badge>
          <span className="text-[11px] text-muted-foreground font-normal">
            {tasks.length}
          </span>
        </div>

        <div className={`flex items-center gap-0.5 transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="icon" className="h-5 w-5 text-muted-foreground hover:text-foreground" onClick={onQuickAdd}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Cards container — clean, no card wrapper, no dashed borders */}
      <div
        ref={setNodeRef}
        className="flex-1 flex flex-col gap-2 px-2 pb-2"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <ContactDraggableTaskCard
              key={task.id}
              task={task}
              technicians={[]}
            />
          ))}
        </SortableContext>

        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-24 text-muted-foreground/50 text-[11px]">
            No records
          </div>
        )}
      </div>
    </div>
  );
}
