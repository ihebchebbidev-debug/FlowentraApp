import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Calendar, 
  GripVertical,
  Check,
  Plus
} from "lucide-react";
import { Task, Column } from "../types";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useLookups } from "@/shared/contexts/LookupsContext";
import { buildStatusColumns, defaultStatusColumns } from "../utils/columns";

interface TaskListViewProps {
  tasks: Task[];
  columns?: Column[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onTaskComplete: (taskId: string, completed: boolean) => void;
}

export default function TaskListView({ 
  tasks, 
  columns: propColumns,
  onTaskClick, 
  onAddTask, 
  onTaskComplete 
}: TaskListViewProps) {
  const { t } = useTranslation();
  const { taskStatuses } = useLookups();
  const [activeColumnFilter, setActiveColumnFilter] = useState<string | null>(null);
  const [completingTasks, setCompletingTasks] = useState<Set<string>>(new Set());
  const [showCheckTasks, setShowCheckTasks] = useState<Set<string>>(new Set());

  // Build dynamic columns from props, lookups, or defaults
  const columns = propColumns && propColumns.length > 0 
    ? propColumns 
    : (taskStatuses && taskStatuses.length > 0 
        ? buildStatusColumns(taskStatuses) 
        : defaultStatusColumns);

  const filteredTasks = tasks.filter(task => {
    const matchesColumn = !activeColumnFilter || task.columnId === activeColumnFilter;
    return matchesColumn;
  });

  // Get tasks grouped by column
  const getTasksForColumn = (columnId: string) => {
    return filteredTasks.filter(task => task.columnId === columnId);
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

  // Priority border color - Jira style
  const getPriorityBorderColor = (priority: string) => {
    const normalized = normalizePriority(priority);
    switch (normalized) {
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
    const normalized = normalizePriority(priority);
    switch (normalized) {
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

  const getInitials = (name: string) => {
    if (!name) return '?';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleComplete = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (completingTasks.has(taskId)) return;

    setCompletingTasks(prev => new Set(prev).add(taskId));
    
    setTimeout(() => {
      setShowCheckTasks(prev => new Set(prev).add(taskId));
    }, 300);

    setTimeout(() => {
      onTaskComplete(taskId, true);
      setCompletingTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
      setShowCheckTasks(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }, 900);
  };

  // Get column color class - handle both Tailwind classes and hex colors
  const getColumnColorClass = (color: string) => {
    if (color?.startsWith('bg-[#')) {
      // Extract hex and return inline style compatible format
      return color;
    }
    return color || 'bg-slate-500';
  };

  return (
    <div className="flex-1 p-3 sm:p-6 space-y-4">
      {/* Dynamic column filter buttons */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2 flex-wrap">
          <Button
            variant={activeColumnFilter === null ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveColumnFilter(null)}
          >
            {t('projects.listView.all')} ({tasks.length})
          </Button>
          {columns.map((column) => {
            const columnTaskCount = tasks.filter(t => t.columnId === column.id).length;
            return (
              <Button
                key={column.id}
                variant={activeColumnFilter === column.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveColumnFilter(column.id)}
                className="gap-2"
              >
                <div className={cn("w-2 h-2 rounded-full", getColumnColorClass(column.color))} />
                {column.title} ({columnTaskCount})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Task Groups by Column - Matching Kanban structure */}
      <div className="space-y-6">
        {columns
          .filter(column => !activeColumnFilter || column.id === activeColumnFilter)
          .map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            
            return (
              <Card key={column.id} className="animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn("w-3 h-3 rounded-full", getColumnColorClass(column.color))} />
                      <CardTitle className="text-lg font-semibold">
                        {column.title}
                      </CardTitle>
                      <Badge variant="secondary" className="text-xs">
                        {columnTasks.length}
                      </Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => onAddTask(column.id)}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">{t('projects.listView.addTask')}</span>
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {columnTasks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {t('projects.listView.noTasks')}
                    </div>
                  ) : (
                    <div className="divide-y divide-border/50">
                      {columnTasks.map((task) => {
                        const isCompleting = completingTasks.has(task.id);
                        const showCheck = showCheckTasks.has(task.id);
                        const normalizedPriority = normalizePriority(task.priority);
                        const formattedDueDate = formatDueDate(task.dueDate);
                        const assigneeName = task.assigneeName || task.assignee || '';
                        
                        return (
                          <div 
                            key={task.id}
                            onClick={() => onTaskClick(task)}
                            className={cn(
                              "group bg-card hover:bg-accent/30 transition-all duration-150 cursor-pointer",
                              "border-l-[3px]",
                              getPriorityBorderColor(task.priority || 'medium'),
                              isCompleting && 'opacity-70',
                              task.completedAt && 'opacity-60'
                            )}
                          >
                            <div className="p-3">
                              {/* Top row: Drag handle + Title + Project */}
                              <div className="flex items-start gap-2">
                                <div className="flex-shrink-0 opacity-40 group-hover:opacity-100 transition-opacity">
                                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <h4 className={cn(
                                      "text-sm leading-snug transition-all duration-300 font-medium",
                                      isCompleting || task.completedAt
                                        ? "text-muted-foreground line-through" 
                                        : "text-foreground"
                                    )}>
                                      {task.title}
                                    </h4>
                                    
                                    {/* Project badge if available */}
                                    {task.projectName && (
                                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-normal flex-shrink-0">
                                        {task.projectName}
                                      </Badge>
                                    )}
                                  </div>
                                  
                                  {/* Description - subtle */}
                                  {task.description && (
                                    <p className={cn(
                                      "text-xs mt-1.5 line-clamp-2 transition-all duration-300",
                                      isCompleting || task.completedAt
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
                                      getPriorityBadgeStyle(task.priority || 'medium')
                                    )}
                                  >
                                    {normalizedPriority}
                                  </Badge>
                                  
                                  {/* Assignee */}
                                  {assigneeName && (
                                    <div className="flex items-center gap-1.5">
                                      <Avatar className="h-5 w-5 flex-shrink-0">
                                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-medium">
                                          {getInitials(assigneeName)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span className="text-[11px] text-muted-foreground truncate max-w-[80px] hidden sm:inline">
                                        {assigneeName}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {/* Tags */}
                                  {task.tags && task.tags.length > 0 && (
                                    <div className="hidden sm:flex gap-1">
                                      {task.tags.slice(0, 2).map((tag, index) => (
                                        <Badge key={index} variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/50">
                                          {tag}
                                        </Badge>
                                      ))}
                                      {task.tags.length > 2 && (
                                        <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-muted/50">
                                          +{task.tags.length - 2}
                                        </Badge>
                                      )}
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
                                  
                                  {/* Estimated hours if available */}
                                  {task.estimatedHours && (
                                    <span className="text-[11px] text-muted-foreground hidden sm:inline">
                                      {task.estimatedHours}h
                                    </span>
                                  )}
                                  
                                  {/* Complete checkbox - Jira style */}
                                  {!task.completedAt && (
                                    <button
                                      onClick={(e) => handleComplete(e, task.id)}
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
                                  )}
                                  
                                  {/* Show completed checkmark for completed tasks */}
                                  {task.completedAt && (
                                    <div className="flex-shrink-0 w-5 h-5 rounded border bg-primary border-primary text-primary-foreground flex items-center justify-center">
                                      <Check className="h-3 w-3" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
