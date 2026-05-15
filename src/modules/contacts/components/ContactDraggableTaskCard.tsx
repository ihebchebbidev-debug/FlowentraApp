import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MoreHorizontal,
  Calendar,
  User,
  Clock,
  Edit,
  Trash2,
  AlertTriangle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ContactTask } from "../types";
import { Technician } from "@/modules/tasks/types";

interface ContactDraggableTaskCardProps {
  task: ContactTask;
  technicians: Technician[];
  onUpdateTask?: (taskId: string, updates: Partial<ContactTask>) => void;
  onDeleteTask?: (taskId: string) => void;
}

export function ContactDraggableTaskCard({
  task,
  technicians,
  onUpdateTask,
  onDeleteTask
}: ContactDraggableTaskCardProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const getPriorityColor = (priority: ContactTask['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-primary/10 text-primary border-primary/20';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getAssigneeName = (assigneeId?: string) => {
    if (!assigneeId) return 'Unassigned';
    const technician = technicians.find(t => t.id === assigneeId);
    return technician?.name || 'Unknown';
  };

  const isOverdue = task.dueDate && task.dueDate < new Date() && !task.completedAt;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-card border border-border rounded-md shadow-sm hover:shadow-md transition-shadow
        cursor-grab active:cursor-grabbing
        ${isDragging ? 'shadow-lg' : ''}
        ${isOverdue ? 'border-destructive/30' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="p-3 space-y-2">
        {/* Title + menu */}
        <div className="flex items-start justify-between gap-1">
          <h4 className="font-medium text-[13px] line-clamp-2 flex-1 leading-snug">
            {task.title}
          </h4>
          <DropdownMenu open={isMenuOpen} onOpenChange={setIsMenuOpen}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="icon" 
                className={`h-5 w-5 shrink-0 text-muted-foreground transition-opacity ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMenuOpen(true);
                }}
              >
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateTask?.(task.id, {})}>
                <Edit className="h-3.5 w-3.5 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => onDeleteTask?.(task.id)}
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Description */}
        {task.description && (
          <p className="text-[11px] text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Tags row */}
        <div className="flex items-center gap-1 flex-wrap">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 rounded-sm ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded-sm bg-destructive/10 text-destructive border-destructive/20">
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />
              Overdue
            </Badge>
          )}
          {task.tags.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="secondary" className="text-[10px] px-1.5 py-0 rounded-sm">
              {tag}
            </Badge>
          ))}
          {task.tags.length > 2 && (
            <span className="text-[10px] text-muted-foreground">+{task.tags.length - 2}</span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3" />
            <span className="truncate max-w-[80px]">{getAssigneeName(task.assigneeId)}</span>
          </div>
          {task.dueDate && (
            <div className={`flex items-center gap-1 ${isOverdue ? 'text-destructive' : ''}`}>
              <Calendar className="h-3 w-3" />
              <span>{task.dueDate.toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {task.estimatedHours && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>{task.estimatedHours}h est.</span>
            {task.actualHours && <span>/ {task.actualHours}h</span>}
          </div>
        )}
      </div>
    </div>
  );
}
