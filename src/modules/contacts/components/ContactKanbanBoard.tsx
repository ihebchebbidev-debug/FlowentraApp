import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  ArrowLeft,
  MoreHorizontal,
  Calendar,
  User,
  Clock
} from "lucide-react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import {
  restrictToVerticalAxis,
  restrictToParentElement,
} from '@dnd-kit/modifiers';
import { ContactProject, ContactTask } from "../types";
import { Technician } from "@/modules/tasks/types";
import { ContactDroppableColumn } from "./ContactDroppableColumn";

interface ContactKanbanBoardProps {
  project: ContactProject;
  tasks: ContactTask[];
  technicians: Technician[];
  onBackToProjects: () => void;
  onUpdateTask: (taskId: string, updates: Partial<ContactTask>) => void;
  onCreateTask: (task: Omit<ContactTask, 'id' | 'createdAt' | 'updatedAt'>) => void;
}

export function ContactKanbanBoard({
  project,
  tasks,
  technicians,
  onBackToProjects,
  onUpdateTask,
  onCreateTask
}: ContactKanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    
    if (!over) return;
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the active task
    const activeTask = localTasks.find(task => task.id === activeId);
    if (!activeTask) return;
    
    // If dropping on a column, update the task's column
    if (overId.startsWith('column-')) {
      const newColumnId = overId.replace('column-', '');
      const newColumn = project.columns.find(col => col.id === newColumnId);
      
      if (newColumn && activeTask.columnId !== newColumnId) {
        const updatedTasks = localTasks.map(task =>
          task.id === activeId
            ? { ...task, columnId: newColumnId, status: newColumn.title }
            : task
        );
        setLocalTasks(updatedTasks);
        onUpdateTask(activeId, { columnId: newColumnId, status: newColumn.title });
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }
    
    const activeId = active.id as string;
    const overId = over.id as string;
    
    // Find the active task
    const activeTask = localTasks.find(task => task.id === activeId);
    if (!activeTask) {
      setActiveId(null);
      return;
    }
    
    // If dropping on another task, reorder within the same column
    if (!overId.startsWith('column-')) {
      const overTask = localTasks.find(task => task.id === overId);
      if (overTask && activeTask.columnId === overTask.columnId) {
        const oldIndex = localTasks.findIndex(task => task.id === activeId);
        const newIndex = localTasks.findIndex(task => task.id === overId);
        
        if (oldIndex !== newIndex) {
          const updatedTasks = arrayMove(localTasks, oldIndex, newIndex);
          setLocalTasks(updatedTasks);
          // Update positions
          updatedTasks.forEach((task, index) => {
            if (task.columnId === activeTask.columnId) {
              onUpdateTask(task.id, { position: index });
            }
          });
        }
      }
    }
    
    setActiveId(null);
  };

  const getTasksByColumn = (columnId: string) => {
    return localTasks
      .filter(task => task.columnId === columnId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  const activeTask = activeId ? localTasks.find(task => task.id === activeId) : null;

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

  const handleQuickAddTask = (columnId: string) => {
    const column = project.columns.find(col => col.id === columnId);
    if (!column) return;

    const tasksInColumn = getTasksByColumn(columnId);
    const newPosition = tasksInColumn.length;

    onCreateTask({
      title: 'New Task',
      description: '',
      status: column.title,
      priority: 'medium',
      projectId: project.id,
      contactId: project.contactId,
      columnId: columnId,
      position: newPosition,
      tags: [],
    });
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/95 sticky top-0 z-10">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onBackToProjects}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Projects
            </Button>
            <div className="h-6 w-px bg-border" />
            <div>
              <h1 className="text-xl font-bold text-foreground">{project.name}</h1>
              <p className="text-sm text-muted-foreground">{project.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {project.status}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {project.type}
            </Badge>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis, restrictToParentElement]}
        >
          <div className="h-full overflow-x-auto">
            <div className="flex gap-4 p-4 h-full min-w-max">
              {project.columns
                .sort((a, b) => a.position - b.position)
                .map((column) => {
                  const columnTasks = getTasksByColumn(column.id);
                  
                  return (
                    <div key={column.id} className="flex-shrink-0 w-80">
                      <ContactDroppableColumn
                        column={column}
                        tasks={columnTasks}
                        onQuickAdd={() => handleQuickAddTask(column.id)}
                      />
                    </div>
                  );
                })}
            </div>
          </div>

          <DragOverlay>
            {activeTask && (
              <Card className="w-80 bg-background border shadow-lg rotate-3">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <h4 className="font-medium text-sm line-clamp-2 flex-1">
                        {activeTask.title}
                      </h4>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-50">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </div>

                    {activeTask.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {activeTask.description}
                      </p>
                    )}

                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className={`text-xs ${getPriorityColor(activeTask.priority)}`}>
                        {activeTask.priority}
                      </Badge>
                      {activeTask.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        <span>{getAssigneeName(activeTask.assigneeId)}</span>
                      </div>
                      {activeTask.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{activeTask.dueDate.toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>

                    {activeTask.estimatedHours && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span>{activeTask.estimatedHours}h estimated</span>
                        {activeTask.actualHours && (
                          <span>/ {activeTask.actualHours}h spent</span>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
}