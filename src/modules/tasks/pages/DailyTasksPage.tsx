import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CollapsibleSearch } from "@/components/ui/collapsible-search";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ArrowLeft, LayoutGrid, List, PlusCircle, CheckSquare, Search, Filter, Loader2, GripVertical, AlertTriangle, Clock, ChevronLeft, ChevronRight, CalendarIcon, Check, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCorners, useDroppable } from '@dnd-kit/core';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { toast } from "sonner";
import { TasksService } from '../services/tasks.service';
import type { DailyTask } from '../types';
import { useAuth } from "@/contexts/AuthContext";
import { DailyTaskDetailModal } from "../components/DailyTaskDetailModal";
import { format, addDays, subDays, isToday, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";
import { useActionLogger } from "@/hooks/useActionLogger";

// Helper to check if a task is overdue
const isTaskOverdue = (task: DailyTask): boolean => {
  if (!task.dueDate || task.status === 'done') return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dueDate = new Date(task.dueDate);
  dueDate.setHours(0, 0, 0, 0);
  return dueDate < today;
};

// Helper to get days overdue
const getDaysOverdue = (dueDate: string | Date): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = today.getTime() - due.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Status columns for daily tasks (keys for translation)
const STATUS_COLUMN_IDS = ['todo', 'in-progress', 'done'] as const;

// Draggable Task Card Component
function DraggableTaskCard({ task, getPriorityColor, onClick, onToggleComplete, t }: { 
  task: DailyTask; 
  getPriorityColor: (p: string) => string;
  onClick?: (task: DailyTask) => void;
  onToggleComplete?: (taskId: string, isCompleted: boolean) => void;
  t: (key: string, options?: any) => string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
  });

  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  const [showCheckAnimation, setShowCheckAnimation] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const overdue = isTaskOverdue(task);
  const daysLate = task.dueDate ? getDaysOverdue(task.dueDate) : 0;

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging (small movement threshold)
    if (!isDragging && onClick && !isAnimating) {
      onClick(task);
    }
  };

  const handleToggleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isAnimating) return;
    
    // If already completed, just toggle without animation
    if (task.isCompleted) {
      onToggleComplete?.(task.id, false);
      return;
    }

    // Start completion animation sequence
    setIsAnimating(true);
    
    // Step 1: Strike-through effect (immediate)
    // Step 2: Show checkmark after 300ms
    setTimeout(() => {
      setShowCheckAnimation(true);
    }, 300);

    // Step 3: Start exit animation after 600ms
    setTimeout(() => {
      setIsExiting(true);
    }, 600);

    // Step 4: Complete the task after animation finishes
    setTimeout(() => {
      onToggleComplete?.(task.id, true);
    }, 900);
  };

  // Priority indicator colors (left border) - Jira style
  const getPriorityBorderColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'border-l-destructive';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-primary';
      case 'low': return 'border-l-muted-foreground/40';
      default: return 'border-l-muted-foreground/40';
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={handleClick}
      className={cn(
        "group bg-card rounded-sm border border-border shadow-sm hover:bg-accent/30 transition-all duration-150 cursor-pointer active:cursor-grabbing relative",
        "border-l-[3px]",
        getPriorityBorderColor(task.priority),
        overdue && !task.isCompleted && "ring-1 ring-destructive/50",
        isExiting && 'translate-x-full opacity-0 scale-95 transition-all duration-300 ease-in-out'
      )}
    >
      {/* Main content area */}
      <div className="p-3">
        {/* Top row: Drag handle + Title + Overdue badge */}
        <div className="flex items-start gap-2">
          <div {...listeners} {...attributes} className="flex-shrink-0 cursor-grab">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className={cn(
                "text-sm leading-snug transition-all duration-300",
                (task.isCompleted || isAnimating) 
                  ? "text-muted-foreground line-through" 
                  : "text-foreground"
              )}>
                {task.title}
              </h4>
              {overdue && !task.isCompleted && !isAnimating && (
                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 shrink-0 font-medium">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t('daily.daysLate', { count: daysLate })}
                </Badge>
              )}
            </div>
            
            {/* Description - subtle */}
            {task.description && (
              <p className={cn(
                "text-xs mt-1.5 line-clamp-2 transition-all duration-300",
                (task.isCompleted || isAnimating) 
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
          isAnimating && "opacity-50"
        )}>
          {/* Left side: Priority badge + Time */}
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0 h-5",
                task.priority === 'urgent' && "border-destructive/50 text-destructive",
                task.priority === 'high' && "border-warning/50 text-warning",
                task.priority === 'medium' && "border-primary/50 text-primary",
                task.priority === 'low' && "border-muted-foreground/30 text-muted-foreground"
              )}
            >
              {task.priority}
            </Badge>
            
            {/* Time logged indicator */}
            {task.actualHours !== undefined && task.actualHours > 0 && (
              <span className="text-[10px] flex items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                <Clock className="h-3 w-3" />
                {task.actualHours >= 1 
                  ? `${Math.floor(task.actualHours)}h${task.actualHours % 1 > 0 ? ` ${Math.round((task.actualHours % 1) * 60)}m` : ''}`
                  : `${Math.round(task.actualHours * 60)}m`
                }
              </span>
            )}
          </div>

          {/* Right side: Due date + Complete button */}
          <div className="flex items-center gap-2">
            {task.dueDate && (
              <span className={cn(
                "text-[11px] flex items-center gap-1",
                overdue && !task.isCompleted && !isAnimating 
                  ? 'text-destructive font-medium' 
                  : 'text-muted-foreground'
              )}>
                <CalendarIcon className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              </span>
            )}
            
            {/* Complete checkbox - Jira style */}
            <button
              onClick={handleToggleComplete}
              className={cn(
                "flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200",
                (task.isCompleted || showCheckAnimation)
                  ? "bg-primary border-primary text-primary-foreground" 
                  : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
              )}
            >
              <Check 
                className={cn(
                  "h-3 w-3 transition-all duration-150",
                  (task.isCompleted || showCheckAnimation) 
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

// Droppable Column Component
function DroppableColumn({ column, tasks, getPriorityColor, onAddTask, onTaskClick, onToggleComplete, t }: { 
  column: { id: string; title: string; color: string }; 
  tasks: DailyTask[]; 
  getPriorityColor: (p: string) => string;
  onAddTask: () => void;
  onTaskClick: (task: DailyTask) => void;
  onToggleComplete: (taskId: string, isCompleted: boolean) => void;
  t: (key: string, options?: any) => string;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: column.id,
  });

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col bg-card rounded-lg shadow-[var(--shadow-card)] border border-border/40 min-h-[400px] transition-all duration-200 ${isOver ? 'ring-2 ring-primary/30 shadow-md' : ''}`}
    >
      {/* Clean column header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-border/30">
        <div className="flex items-center gap-2">
          <div className={`w-1.5 h-1.5 rounded-full ${column.color}`} />
          <h3 className="text-[13px] font-semibold text-foreground uppercase tracking-wider">{column.title}</h3>
          <span className="text-[11px] font-medium text-muted-foreground bg-muted/40 px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground/60 hover:text-foreground hover:bg-muted/40"
          onClick={onAddTask}
        >
          <PlusCircle className="h-3.5 w-3.5" />
        </Button>
      </div>
      
      {/* Task list area */}
      <div className="flex-1 p-1.5 space-y-1.5 min-h-[100px] overflow-y-auto">
        {tasks.map(task => (
          <DraggableTaskCard 
            key={task.id} 
            task={task} 
            getPriorityColor={getPriorityColor} 
            onClick={onTaskClick}
            onToggleComplete={onToggleComplete}
            t={t}
          />
        ))}
        
        {tasks.length === 0 && (
          <div className={`flex items-center justify-center h-20 border border-dashed rounded-md transition-all duration-200 ${isOver ? 'border-primary/40 bg-primary/5' : 'border-border/30 bg-muted/10'}`}>
            <p className="text-[11px] text-muted-foreground/60">{t('daily.dropHere')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DailyTasksPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation('tasks');
  const { logAction, logSearch, logFilter, logFormSubmit } = useActionLogger('DailyTasks');
  
  const [taskViewMode, setTaskViewMode] = useState<'board' | 'list'>('board');
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'done'>("all");
  const [filterPriority, setFilterPriority] = useState<'all' | 'urgent' | 'high' | 'medium' | 'low'>("all");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'medium', dueDate: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTask, setActiveTask] = useState<DailyTask | null>(null);
  
  // Date filter state - defaults to today
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [showAllDates, setShowAllDates] = useState(false);
  
  // Task detail modal state
  const [selectedTask, setSelectedTask] = useState<DailyTask | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  
  // Completed tasks section state
  const [showCompletedSection, setShowCompletedSection] = useState(false);
  const [showClearConfirmDialog, setShowClearConfirmDialog] = useState(false);

  // Status columns with translations
  const statusColumns = [
    { id: 'todo', title: t('daily.columns.todo'), color: 'bg-muted-foreground' },
    { id: 'in-progress', title: t('daily.columns.inProgress'), color: 'bg-primary' },
    { id: 'done', title: t('daily.columns.done'), color: 'bg-success' },
  ];

  // Get current user ID from auth context
  const userId = user?.id || 1;
  const userName = user ? `${user.firstName} ${user.lastName}` : 'User';

  // Log search when search term changes (with debounce effect)
  useEffect(() => {
    if (searchTerm.length > 2) {
      const timer = setTimeout(() => {
        logSearch(searchTerm, filteredTasks?.length || 0, { entityType: 'DailyTask' });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Log filter changes
  useEffect(() => {
    if (filterStatus !== 'all') {
      logFilter('Status', filterStatus, { entityType: 'DailyTask' });
    }
  }, [filterStatus]);

  useEffect(() => {
    if (filterPriority !== 'all') {
      logFilter('Priority', filterPriority, { entityType: 'DailyTask' });
    }
  }, [filterPriority]);

  // Fetch daily tasks from API
  console.log('[DailyTasksPage] Starting to fetch tasks for userId:', userId);
  
  const { data: tasks = [], isLoading, isError, error, refetch } = useQuery({
    queryKey: ['dailyTasks', String(userId)],
    queryFn: async () => {
      console.log('[DailyTasksPage] queryFn called, fetching tasks...');
      try {
        const result = await TasksService.getUserDailyTasks(userId);
        console.log('[DailyTasksPage] Tasks fetched successfully:', result);
        return result;
      } catch (err) {
        console.error('[DailyTasksPage] Error fetching tasks:', err);
        throw err;
      }
    },
    staleTime: 0,
    refetchOnMount: 'always',
    retry: 1,
    retryDelay: 500,
  });

  // Log query state
  console.log('[DailyTasksPage] Query state - isLoading:', isLoading, 'isError:', isError, 'tasks count:', tasks?.length);
  
  // Log error if any
  if (isError) {
    console.error('[DailyTasksPage] Query error:', error);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveTask(null);
    
    if (!over) return;
    
    const taskId = active.id as string;
    const overId = String(over.id);
    
    // Determine target column
    let targetColumnId = overId;
    if (!statusColumns.find(c => c.id === overId)) {
      // Dropped on a task, find its column
      const overTask = tasks.find(t => t.id === overId);
      if (overTask) {
        targetColumnId = overTask.status;
      }
    }
    
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.status === targetColumnId) return;
    
    console.log('[DailyTasksPage] Moving task', taskId, 'from', task.status, 'to', targetColumnId);
    
    try {
      // Update backend with new status
      await TasksService.updateDailyTask(Number(taskId), { status: targetColumnId });
      await refetch();
      toast.success(t('daily.toast.taskMoved'));
    } catch (error) {
      console.error('Failed to move task:', error);
      toast.error(t('daily.toast.errorMove'));
    }
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast.error(t('daily.toast.enterTitle'));
      return;
    }
    
    setIsSubmitting(true);
    try {
      await TasksService.createDailyTask({
        assignedUserId: userId,
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        dueDate: newTask.dueDate ? new Date(newTask.dueDate).toISOString() : new Date().toISOString(),
      });
      
      // Log successful task creation
      logFormSubmit('Create Daily Task', true, { 
        entityType: 'DailyTask',
        details: `Created task: ${newTask.title}`
      });
      
      toast.success(t('daily.toast.taskCreated'));
      setNewTask({ title: '', description: '', priority: 'medium', dueDate: '' });
      setIsAddTaskOpen(false);
      refetch();
    } catch (error) {
      console.error('Failed to create task:', error);
      logFormSubmit('Create Daily Task', false, { 
        entityType: 'DailyTask',
        details: `Failed to create task: ${newTask.title}`
      });
      toast.error(t('daily.toast.errorCreate'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;
      
      const isCompleted = task.status !== 'done';
      const newStatus = isCompleted ? 'done' : 'todo';
      await TasksService.updateDailyTask(Number(taskId), { status: newStatus });
      
      // Log task completion
      logAction(isCompleted ? 'complete_task' : 'reopen_task', 
        isCompleted ? `Completed task: ${task.title}` : `Reopened task: ${task.title}`, 
        { entityType: 'DailyTask', entityId: taskId }
      );
      
      refetch();
      toast.success(isCompleted ? t('daily.toast.taskCompleted') : t('daily.toast.taskReopened'));
    } catch (error) {
      console.error('Failed to update task:', error);
      toast.error(t('daily.toast.errorUpdate'));
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await TasksService.deleteDailyTask(Number(taskId));
      
      // Log task deletion
      logAction('delete_task', `Deleted task: ${task?.title || taskId}`, { 
        entityType: 'DailyTask', 
        entityId: taskId 
      });
      
      refetch();
      toast.success(t('daily.toast.taskDeleted'));
    } catch (error) {
      console.error('Failed to delete task:', error);
      toast.error(t('daily.toast.errorDelete'));
    }
  };

  // Toggle isCompleted (quick check-off, separate from status)
  const handleToggleIsCompleted = async (taskId: string, isCompleted: boolean) => {
    try {
      await TasksService.updateDailyTask(Number(taskId), { 
        isCompleted,
        completedDate: isCompleted ? new Date().toISOString() : undefined
      });
      refetch();
      toast.success(isCompleted ? t('daily.toast.taskCheckedOff') : t('daily.toast.taskReopened'));
    } catch (error) {
      console.error('Failed to toggle task completion:', error);
      toast.error(t('daily.toast.errorUpdate'));
    }
  };

  // Clear all completed tasks
  const handleClearAllCompleted = async () => {
    if (completedTasks.length === 0) return;
    
    try {
      // Delete all completed tasks
      await Promise.all(
        completedTasks.map(task => TasksService.deleteDailyTask(Number(task.id)))
      );
      refetch();
      toast.success(t('daily.toast.clearedTasks', { count: completedTasks.length }));
    } catch (error) {
      console.error('Failed to clear completed tasks:', error);
      toast.error(t('daily.toast.errorClear'));
    }
  };

  const handleSwitchToProjects = () => {
    navigate("/dashboard/tasks/projects");
  };

  // Filter tasks by date and other criteria
  // NOTE: Users expect today's view to show tasks created today even if the dueDate is different.
  // So for per-day view we include tasks where (dueDate is same day) OR (createdAt is same day).
  const filteredTasks = tasks
    .filter((t) => {
      if (showAllDates) return true;

      const compareDate = new Date(selectedDate);
      const due = t.dueDate ? new Date(t.dueDate) : null;
      const created = t.createdAt ? new Date(t.createdAt) : null;

      return (due && isSameDay(due, compareDate)) || (created && isSameDay(created, compareDate));
    })
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => filterStatus === 'all' ? true : t.status === filterStatus)
    .filter(t => filterPriority === 'all' ? true : t.priority === filterPriority);

  // Show all tasks in columns (including completed ones) - only archived tasks are hidden
  const openTasks = filteredTasks;
  
  // For completed tasks, filter by completedDate (when task was completed), not dueDate
  // This ensures tasks completed today show up in today's completed section
  const completedTasks = tasks
    .filter(t => t.isCompleted)
    .filter(t => {
      // Date filter for completed tasks - use completedDate if available, else dueDate
      if (!showAllDates) {
        const completionDate = t.completedDate ? new Date(t.completedDate) : (t.dueDate ? new Date(t.dueDate) : null);
        if (completionDate) {
          completionDate.setHours(0, 0, 0, 0);
          const compareDate = new Date(selectedDate);
          compareDate.setHours(0, 0, 0, 0);
          if (!isSameDay(completionDate, compareDate)) return false;
        } else {
          // No completion date or due date - don't show in per-day view
          return false;
        }
      }
      return true;
    })
    .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()) || (t.description || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .filter(t => filterPriority === 'all' ? true : t.priority === filterPriority);

  // Date navigation helpers
  const goToPreviousDay = () => setSelectedDate(prev => subDays(prev, 1));
  const goToNextDay = () => setSelectedDate(prev => addDays(prev, 1));
  const goToToday = () => setSelectedDate(new Date());

  const getTasksForColumn = (columnId: string) => {
    return openTasks.filter(task => task.status === columnId);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-primary text-primary-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="h-full bg-background">
      {/* Desktop Header */}
      <div className="hidden md:flex items-center justify-between px-5 py-3 border-b border-border bg-card/60 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{t('daily.title')}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{t('daily.subtitle')}</p>
          </div>
        </div>
        <Button 
          onClick={() => setIsAddTaskOpen(true)}
          size="sm"
          className="gap-2"
        >
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="text-[13px]">{t('daily.addTask')}</span>
        </Button>
      </div>

      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleSwitchToProjects}
            className="gap-1 px-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('daily.back')}
          </Button>
          <div className="h-5 w-px bg-border" />
          <div className="p-1.5 rounded-lg bg-primary/10">
            <CheckSquare className="h-5 w-5 text-primary" />
          </div>
          <span className="font-semibold text-foreground">{t('daily.title')}</span>
        </div>
        <Button 
          size="sm"
          onClick={() => setIsAddTaskOpen(true)}
          className="gap-1"
        >
          <PlusCircle className="h-4 w-4" />
          {t('daily.add')}
        </Button>
      </div>

      {/* Date Navigation */}
      <div className="p-3 sm:p-4 border-b border-border bg-muted/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToPreviousDay}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "min-w-[180px] justify-center text-left font-medium gap-2 bg-white dark:bg-card",
                    isToday(selectedDate) && "border-primary/50"
                  )}
                >
                  <CalendarIcon className="h-4 w-4" />
                  {isToday(selectedDate) ? (
                    <span>{t('daily.today')} - {format(selectedDate, "MMM d, yyyy")}</span>
                  ) : (
                    <span>{format(selectedDate, "EEE, MMM d, yyyy")}</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={goToNextDay}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            
            {!isToday(selectedDate) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={goToToday}
                className="text-primary"
              >
                {t('daily.today')}
              </Button>
            )}
          </div>
          
          <Button
            variant={showAllDates ? "default" : "outline"}
            size="sm"
            onClick={() => setShowAllDates(!showAllDates)}
            className={cn("gap-2", !showAllDates && "bg-white dark:bg-card hover:bg-muted")}
          >
            {showAllDates ? t('daily.showingAll') : t('daily.showAllDates')}
          </Button>
        </div>
      </div>

      {/* Search and Controls */}
      <div className="p-3 sm:p-4 border-b border-border bg-card">
        <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 sm:items-center sm:justify-between">
          <div className="flex gap-2 sm:gap-3 flex-1 w-full">
            <CollapsibleSearch 
              placeholder={t('daily.searchPlaceholder')} 
              value={searchTerm} 
              onChange={setSearchTerm}
              className="flex-1"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 sm:gap-2 px-2 sm:px-3">
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('daily.filters.title')}</span>
                  {((filterStatus !== 'all') || (filterPriority !== 'all')) && (
                    <Badge variant="secondary" className="ml-2 h-4 px-1 text-xs">
                      {[(filterStatus !== 'all' ? 1 : 0), (filterPriority !== 'all' ? 1 : 0)].reduce((a,b)=>a+b,0)}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>{t('daily.filters.status')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>{t('daily.filters.all')} {filterStatus==='all' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('todo')}>{t('daily.filters.todo')} {filterStatus==='todo' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('in-progress')}>{t('daily.filters.inProgress')} {filterStatus==='in-progress' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('done')}>{t('daily.filters.done')} {filterStatus==='done' && '✓'}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>{t('daily.filters.priority')}</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setFilterPriority('all')}>{t('daily.filters.all')} {filterPriority==='all' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('urgent')}>{t('daily.filters.urgent')} {filterPriority==='urgent' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('high')}>{t('daily.filters.high')} {filterPriority==='high' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('medium')}>{t('daily.filters.medium')} {filterPriority==='medium' && '✓'}</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterPriority('low')}>{t('daily.filters.low')} {filterPriority==='low' && '✓'}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button 
              variant={taskViewMode === 'board' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setTaskViewMode('board')} 
              className={`flex-1 sm:flex-none ${taskViewMode === 'board' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button 
              variant={taskViewMode === 'list' ? 'default' : 'outline'} 
              size="sm" 
              onClick={() => setTaskViewMode('list')} 
              className={`flex-1 sm:flex-none ${taskViewMode === 'list' ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}`}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Task Content */}
      <div className="p-3 sm:p-4">
        {isLoading ? (
          <div className="space-y-3 py-4 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-lg">
                <div className="h-5 w-5 rounded bg-muted" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-4 w-3/4 bg-muted rounded" />
                  <div className="h-3 w-1/3 bg-muted/60 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckSquare className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">{t('daily.noTasks')}</p>
            <Button onClick={() => setIsAddTaskOpen(true)}>{t('daily.addTask')}</Button>
          </div>
        ) : taskViewMode === 'list' ? (
          <div className="space-y-2">
            {openTasks.map(task => {
              const taskStatus = task.status;
              const overdue = isTaskOverdue(task);
              const daysLate = task.dueDate ? getDaysOverdue(task.dueDate) : 0;
              
              // Priority border colors - matching Kanban style
              const getPriorityBorderColor = (priority: string) => {
                switch (priority) {
                  case 'urgent': return 'border-l-destructive';
                  case 'high': return 'border-l-orange-500';
                  case 'medium': return 'border-l-primary';
                  case 'low': return 'border-l-muted-foreground/40';
                  default: return 'border-l-muted-foreground/40';
                }
              };
              
              return (
              <div 
                key={task.id} 
                onClick={() => {
                  setSelectedTask(task);
                  setIsTaskDetailOpen(true);
                }}
                className={cn(
                  "group bg-card rounded-sm border border-border shadow-sm hover:bg-accent/30 transition-all duration-150 cursor-pointer",
                  "border-l-[3px]",
                  getPriorityBorderColor(task.priority),
                  overdue && !task.isCompleted && "ring-1 ring-destructive/50"
                )}
              >
                {/* Main content area */}
                <div className="p-3">
                  {/* Top row: Title + Status + Overdue badge */}
                  <div className="flex items-start gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-sm leading-snug text-foreground font-medium">
                          {task.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {overdue && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5 font-medium">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              {t('daily.daysLate', { count: daysLate })}
                            </Badge>
                          )}
                          <Badge 
                            variant="outline"
                            className={cn(
                              "text-[10px] px-1.5 py-0 h-5",
                              taskStatus === 'done' && "border-success/50 text-success",
                              taskStatus === 'in-progress' && "border-primary/50 text-primary",
                              taskStatus === 'todo' && "border-muted-foreground/30 text-muted-foreground"
                            )}
                          >
                            {taskStatus === 'in-progress' ? t('daily.columns.inProgress') : taskStatus === 'done' ? t('daily.columns.done') : t('daily.columns.todo')}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Description - subtle */}
                      {task.description && (
                        <p className="text-xs mt-1.5 line-clamp-2 text-muted-foreground">
                          {task.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom row: Meta info */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-border/50">
                    {/* Left side: Priority badge + Time */}
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-[10px] font-medium uppercase tracking-wide px-1.5 py-0 h-5",
                          task.priority === 'urgent' && "border-destructive/50 text-destructive",
                          task.priority === 'high' && "border-warning/50 text-warning",
                          task.priority === 'medium' && "border-primary/50 text-primary",
                          task.priority === 'low' && "border-muted-foreground/30 text-muted-foreground"
                        )}
                      >
                        {task.priority}
                      </Badge>
                      
                      {/* Time logged indicator */}
                      {task.actualHours !== undefined && task.actualHours > 0 && (
                        <span className="text-[10px] flex items-center gap-1 text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                          <Clock className="h-3 w-3" />
                          {task.actualHours >= 1 
                            ? `${Math.floor(task.actualHours)}h${task.actualHours % 1 > 0 ? ` ${Math.round((task.actualHours % 1) * 60)}m` : ''}`
                            : `${Math.round(task.actualHours * 60)}m`
                          }
                        </span>
                      )}
                    </div>

                    {/* Right side: Due date + Complete button */}
                    <div className="flex items-center gap-2">
                      {task.dueDate && (
                        <span className={cn(
                          "text-[11px] flex items-center gap-1",
                          overdue 
                            ? 'text-destructive font-medium' 
                            : 'text-muted-foreground'
                        )}>
                          <CalendarIcon className="h-3 w-3" />
                          {new Date(task.dueDate).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      
                      {/* Complete checkbox - Jira style */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleIsCompleted(task.id, true);
                        }}
                        className={cn(
                          "flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center transition-all duration-200",
                          task.isCompleted
                            ? "bg-primary border-primary text-primary-foreground" 
                            : "border-muted-foreground/40 hover:border-primary hover:bg-primary/10"
                        )}
                      >
                        <Check 
                          className={cn(
                            "h-3 w-3 transition-all duration-150",
                            task.isCompleted 
                              ? "scale-100 opacity-100" 
                              : "scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-30"
                          )}
                        />
                      </button>
                      
                      {/* Delete button - only visible on hover */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(task.id);
                        }}
                        className="flex-shrink-0 w-5 h-5 rounded border border-transparent flex items-center justify-center transition-all duration-200 opacity-0 group-hover:opacity-100 hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              );
            })}
            {openTasks.length === 0 && (
              <div className="text-center py-12 bg-card rounded-xl border border-border/50">
                <CheckSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">{t('daily.noTasksYet')}</p>
              </div>
            )}
          </div>
        ) : (
          // Kanban Board View
          <>
            {/* Completed Tasks Banner - Top of Board */}
            {completedTasks.length > 0 && (
              <div className="mb-4 bg-emerald-500/5 border border-emerald-500/20 rounded-lg overflow-hidden">
                <button
                  onClick={() => setShowCompletedSection(!showCompletedSection)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-emerald-500/10 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20">
                      <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {t('daily.completedSection.todayCompleted', { count: completedTasks.length })}
                    </span>
                    <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-0">
                      {completedTasks.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {showCompletedSection && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowClearConfirmDialog(true);
                        }}
                        className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        {t('daily.completedSection.clearAll')}
                      </Button>
                    )}
                    {showCompletedSection ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {showCompletedSection && (
                  <div className="px-4 pb-3 pt-1">
                    <div className="flex flex-wrap gap-2">
                      {completedTasks.map(task => (
                        <div 
                          key={task.id}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-sm group hover:border-emerald-500/30 transition-colors"
                        >
                          <button
                            onClick={() => handleToggleIsCompleted(task.id, false)}
                            className="flex-shrink-0 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                          >
                            <Check className="h-2.5 w-2.5" />
                          </button>
                          <span className="text-muted-foreground line-through max-w-[200px] truncate">
                            {task.title}
                          </span>
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-[9px] px-1.5 py-0 h-4 opacity-60",
                              task.priority === 'urgent' && "border-destructive/50 text-destructive",
                              task.priority === 'high' && "border-warning/50 text-warning",
                              task.priority === 'medium' && "border-primary/50 text-primary",
                              task.priority === 'low' && "border-muted-foreground/30 text-muted-foreground"
                            )}
                          >
                            {task.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {statusColumns.map(column => (
                  <DroppableColumn
                    key={column.id}
                    column={column}
                    tasks={getTasksForColumn(column.id)}
                    getPriorityColor={getPriorityColor}
                    onAddTask={() => setIsAddTaskOpen(true)}
                    onTaskClick={(task) => {
                      setSelectedTask(task);
                      setIsTaskDetailOpen(true);
                    }}
                    onToggleComplete={handleToggleIsCompleted}
                    t={t}
                  />
                ))}
              </div>
              
              <DragOverlay>
                {activeTask && (
                  <div className="p-3 bg-background border border-primary rounded-lg shadow-lg opacity-90">
                    <h4 className="font-medium text-sm">{activeTask.title}</h4>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          </>
        )}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('daily.addDialog.title')}</DialogTitle>
            <DialogDescription>{t('daily.addDialog.description')}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">{t('daily.addDialog.titleLabel')}</Label>
              <Input
                id="title"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder={t('daily.addDialog.titlePlaceholder')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">{t('daily.addDialog.descriptionLabel')}</Label>
              <Textarea
                id="description"
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder={t('daily.addDialog.descriptionPlaceholder')}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">{t('daily.addDialog.priorityLabel')}</Label>
                <Select value={newTask.priority} onValueChange={(v) => setNewTask({ ...newTask, priority: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">{t('daily.filters.low')}</SelectItem>
                    <SelectItem value="medium">{t('daily.filters.medium')}</SelectItem>
                    <SelectItem value="high">{t('daily.filters.high')}</SelectItem>
                    <SelectItem value="urgent">{t('daily.filters.urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('daily.addDialog.dueDateLabel')}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !newTask.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {newTask.dueDate ? format(new Date(newTask.dueDate), "PPP") : <span>{t('daily.addDialog.pickDate', 'Pick a date')}</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={newTask.dueDate ? new Date(newTask.dueDate) : undefined}
                      onSelect={(date) => setNewTask({ ...newTask, dueDate: date ? format(date, 'yyyy-MM-dd') : '' })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddTaskOpen(false)}>{t('daily.addDialog.cancel')}</Button>
            <Button onClick={handleAddTask} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('daily.addDialog.submit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Task Detail Modal */}
      <DailyTaskDetailModal
        open={isTaskDetailOpen}
        onOpenChange={setIsTaskDetailOpen}
        task={selectedTask}
        onTaskUpdated={() => {
          refetch();
        }}
        onTaskDeleted={() => {
          refetch();
        }}
      />

      {/* Clear All Confirmation Dialog */}
      <AlertDialog open={showClearConfirmDialog} onOpenChange={setShowClearConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('daily.clearDialog.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('daily.clearDialog.description', { count: completedTasks.length, plural: completedTasks.length !== 1 ? 's' : '' })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('daily.clearDialog.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearAllCompleted}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('daily.clearDialog.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
