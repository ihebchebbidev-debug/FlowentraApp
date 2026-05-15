import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Calendar, GripVertical, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  assignee: string;
  dueDate: string;
  columnId: string;
  createdAt: Date;
  lastMoved?: Date;
  projectName?: string;
  projectId?: string;
}

interface DraggableTaskCardProps {
  task: Task;
  isDragging?: boolean;
  onTaskClick?: (task: Task) => void;
  onTaskComplete?: (task: Task) => void;
}

export function DraggableTaskCard({ task, isDragging = false, onTaskClick, onTaskComplete }: DraggableTaskCardProps) {
  const { t } = useTranslation('tasks');
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCheck, setShowCheck] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1)',
    willChange: 'transform',
    transformOrigin: 'center top',
  };

  // Normalize priority to a valid string value
  const normalizePriority = (priority: string | number | undefined | null): 'high' | 'medium' | 'low' => {
    if (!priority) return 'medium';
    const p = String(priority).toLowerCase();
    if (p === 'high' || p === 'urgent' || p === '3') return 'high';
    if (p === 'medium' || p === 'normal' || p === '2') return 'medium';
    if (p === 'low' || p === '1') return 'low';
    return 'medium';
  };

  const normalizedPriority = normalizePriority(task.priority);

  // Get translated priority label
  const getPriorityLabel = (priority: 'high' | 'medium' | 'low'): string => {
    return t(`taskDetail.priority.${priority}`);
  };

  // Priority border color - Jira style
  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-destructive';
      case 'medium':
        return 'border-l-warning';
      case 'low':
        return 'border-l-success';
      default:
        return 'border-l-muted-foreground/40';
    }
  };

  // Priority badge style - with good contrast in both light and dark modes
  const getPriorityBadgeStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-destructive/50 text-destructive bg-destructive/10';
      case 'medium':
        return 'border-warning/50 text-warning bg-warning/10';
      case 'low':
        return 'border-success/50 text-success bg-success/10';
      default:
        return 'border-muted-foreground/30 text-muted-foreground bg-muted/50';
    }
  };

  // Format due date properly
  const formatDueDate = (dueDate: string | Date | undefined | null): string => {
    if (!dueDate) return '';
    try {
      const date = typeof dueDate === 'string' ? new Date(dueDate) : dueDate;
      if (isNaN(date.getTime())) return '';
      return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    } catch {
      return '';
    }
  };

  const formattedDueDate = formatDueDate(task.dueDate);

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isSortableDragging || isDragging || isCompleting) return;
    e.preventDefault();
    e.stopPropagation();
    onTaskClick?.(task);
  };

  const handleComplete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompleting) return;

    setIsCompleting(true);
    
    setTimeout(() => {
      setShowCheck(true);
    }, 300);

    setTimeout(() => {
      setIsExiting(true);
    }, 600);

    setTimeout(() => {
      onTaskComplete?.(task);
    }, 900);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        "group bg-card rounded-sm border border-border shadow-sm hover:bg-accent/30 transition-all duration-150 cursor-pointer active:cursor-grabbing relative",
        "border-l-[3px]",
        getPriorityBorderColor(normalizedPriority),
        (isSortableDragging || isDragging) && 'opacity-70 rotate-1 shadow-xl scale-105 z-50',
        isExiting && 'translate-x-full opacity-0 scale-95 transition-all duration-300 ease-in-out'
      )}
    >
      {/* Main content area */}
      <div className="p-3">
        {/* Top row: Drag handle + Title */}
        <div className="flex items-start gap-2">
          <div {...listeners} {...attributes} className="flex-shrink-0 cursor-grab opacity-40 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "text-sm leading-snug transition-all duration-300 font-medium",
                isCompleting 
                  ? "text-muted-foreground line-through" 
                  : "text-foreground"
              )}>
                {task.title}
              </h4>
              {task.projectName && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 shrink-0 font-normal">
                  {task.projectName}
                </Badge>
              )}
            </div>
            
            {/* Description - subtle */}
            {task.description && (
              <p className={cn(
                "text-xs mt-1.5 line-clamp-2 transition-all duration-300",
                isCompleting 
                  ? "text-muted-foreground/50 line-through" 
                  : "text-muted-foreground"
              )}>
                {task.description}
              </p>
            )}
          </div>
        </div>

        {/* Bottom row: Meta info */}
        <div className={cn(
          "flex items-center justify-between mt-3 pt-2 border-t border-border/50 transition-opacity duration-300",
          isCompleting && "opacity-50"
        )}>
          {/* Left side: Priority badge + Assignee */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0 h-5",
                getPriorityBadgeStyle(normalizedPriority)
              )}
            >
              {getPriorityLabel(normalizedPriority)}
            </Badge>
            
            {/* Assignee */}
            {task.assignee && (
              <div className="flex items-center gap-1.5">
                <UserAvatar
                  src={(task as any).assigneeProfilePicUrl}
                  name={task.assignee}
                  seed={task.assignee}
                  size="xs"
                />
                <span className="text-[11px] text-muted-foreground truncate max-w-[80px]">
                  {task.assignee}
                </span>
              </div>
            )}
          </div>

          {/* Right side: Due date + Complete button */}
          <div className="flex items-center gap-2">
            {formattedDueDate && (
              <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formattedDueDate}
              </span>
            )}
            
            {/* Complete checkbox - Jira style */}
            <button
              onClick={handleComplete}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200 pointer-events-auto",
                showCheck
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
              )}
            >
              <Check 
                className={cn(
                  "h-3 w-3 transition-all duration-150",
                  showCheck 
                    ? "scale-100 opacity-100" 
                    : "scale-0 opacity-0"
                )} 
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}