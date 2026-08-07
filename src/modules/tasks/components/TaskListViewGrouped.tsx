import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  Calendar, 
  User, 
  Flag,
  Search,
  GripVertical
} from "lucide-react";
import { Task, Column } from "../types";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskListViewGroupedProps {
  tasks: Task[];
  columns: Column[];
  onTaskClick: (task: Task) => void;
  onAddTask: (columnId: string) => void;
  onTaskComplete: (taskId: string, completed: boolean) => void;
  onTaskMove: (taskId: string, newColumnId: string) => void;
}

interface DraggableTaskItemProps {
  task: Task;
  onTaskClick: (task: Task) => void;
  onTaskComplete: (taskId: string, completed: boolean) => void;
}

function DraggableTaskItem({ task, onTaskClick, onTaskComplete }: DraggableTaskItemProps) {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className="p-4 hover:bg-muted/50 transition-colors group border-b border-border last:border-b-0"
    >
      <div className="flex items-start gap-3">
        <Checkbox
          checked={!!task.completedAt}
          onCheckedChange={(checked) => 
            onTaskComplete(task.id, checked as boolean)
          }
          className="mt-1"
        />
        
        <div 
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onTaskClick(task)}
        >
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-medium text-sm truncate ${
              task.completedAt ? 'line-through text-muted-foreground' : 'text-foreground'
            }`}>
              {task.title}
            </h3>
            
            {task.priority && (
              <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                <Flag className="h-3 w-3 mr-1" />
                {task.priority}
              </Badge>
            )}
          </div>
          
          {task.description && (
            <p className={`text-xs mb-2 ${
              task.completedAt ? 'line-through text-muted-foreground' : 'text-muted-foreground'
            }`}>
              {task.description}
            </p>
          )}
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.dueDate && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(task.dueDate).toLocaleDateString()}</span>
              </div>
            )}
            
            {task.assignee && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{task.assignee}</span>
              </div>
            )}
            
            {task.tags && task.tags.length > 0 && (
              <div className="flex gap-1">
                {task.tags.slice(0, 2).map((tag, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                    {tag}
                  </Badge>
                ))}
                {task.tags.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{task.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>
        
        <div 
          {...attributes}
          {...listeners}
          className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}

export default function TaskListViewGrouped({ 
  tasks, 
  columns,
  onTaskClick, 
  onAddTask, 
  onTaskComplete,
  onTaskMove
}: TaskListViewGroupedProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "completed">("all");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3,
      },
    })
  );

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isCompleted = !!task.completedAt;
    const matchesFilter = filter === "all" || 
                         (filter === "completed" && isCompleted) ||
                         (filter === "pending" && !isCompleted);
    
    return matchesSearch && matchesFilter;
  });

  const getTasksForColumn = (columnId: string) => {
    return filteredTasks.filter(task => task.columnId === columnId);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Check if dropping over a column or another task
    const targetColumnId = columns.find(col => col.id === overId)?.id || 
                          tasks.find(task => task.id === overId)?.columnId;

    if (targetColumnId && targetColumnId !== tasks.find(t => t.id === taskId)?.columnId) {
      onTaskMove(taskId, targetColumnId);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 p-3 sm:p-6 space-y-4">
        {/* Header with search and filters */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('projects.listView.searchPlaceholder')}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Button
              variant={filter === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("all")}
            >
              {t('projects.listView.all')} ({tasks.length})
            </Button>
            <Button
              variant={filter === "pending" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("pending")}
            >
              {t('projects.listView.pending')} ({tasks.filter(t => !t.completedAt).length})
            </Button>
            <Button
              variant={filter === "completed" ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter("completed")}
            >
              {t('projects.listView.completed')} ({tasks.filter(t => !!t.completedAt).length})
            </Button>
          </div>
        </div>

        {/* Task Groups by Column */}
        <div className="space-y-6">
          {columns.map((column) => {
            const columnTasks = getTasksForColumn(column.id);
            
            return (
              <Card key={column.id} className="animate-fade-in">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className={`w-3 h-3 rounded-full ${column.color}`}
                      />
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
                      {t('projects.listView.addTask')}
                    </Button>
                  </div>
                </CardHeader>
                
                <CardContent className="p-0">
                  {columnTasks.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      {searchQuery || filter !== "all" 
                        ? t('projects.listView.noTasksMatch')
                        : t('projects.listView.noTasksInCategory')}
                    </div>
                  ) : (
                    <SortableContext 
                      items={columnTasks.map(task => task.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div>
                        {columnTasks.map((task) => (
                          <DraggableTaskItem
                            key={task.id}
                            task={task}
                            onTaskClick={onTaskClick}
                            onTaskComplete={onTaskComplete}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </DndContext>
  );
}