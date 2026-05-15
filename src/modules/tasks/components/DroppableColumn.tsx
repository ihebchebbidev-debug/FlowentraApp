import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit2, Palette, Check, X } from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { DraggableTaskCard } from './DraggableTaskCard';

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
}

interface Column {
  id: string;
  title: string;
  color: string;
}

interface DroppableColumnProps {
  column: Column;
  tasks: Task[];
  onTaskClick?: (task: Task) => void;
  onEditColumn?: (columnId: string, newTitle?: string) => void;
  onAddTask?: (columnId: string) => void;
  onChangeTheme?: (columnId: string, colorClass?: string) => void;
  allowEditing?: boolean;
}

export function DroppableColumn({ 
  column, 
  tasks, 
  onTaskClick, 
  onEditColumn, 
  onAddTask, 
  onChangeTheme, 
  allowEditing = true 
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);


  const colorOptions = [
    { name: 'Slate', class: 'bg-slate-500' },
    { name: 'Primary', class: 'bg-primary' },
    { name: 'Success', class: 'bg-success' },
    { name: 'Warning', class: 'bg-warning' },
    { name: 'Destructive', class: 'bg-destructive' },
    { name: 'Accent', class: 'bg-accent' },
    { name: 'Chart 1', class: 'bg-chart-1' },
    { name: 'Chart 2', class: 'bg-chart-2' },
    { name: 'Chart 3', class: 'bg-chart-3' },
    { name: 'Chart 4', class: 'bg-chart-4' },
  ];

  const handleSaveTitle = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      onEditColumn?.(column.id, editTitle.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditTitle(column.title);
    setIsEditing(false);
  };

  const handleColorChange = (colorClass: string) => {
    onChangeTheme?.(column.id, colorClass);
  };

  return (
    <div 
      ref={setNodeRef}
      className={`flex flex-col bg-card rounded-xl shadow-sm border border-border/50 min-h-[400px] transition-all duration-200 ${
        isOver ? 'ring-2 ring-primary/40 shadow-md bg-primary/5' : ''
      }`}
    >
      {/* Jira-style header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/30">
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className={`w-2 h-2 rounded-sm flex-shrink-0 ${column.color}`} />
          {isEditing ? (
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveTitle();
                if (e.key === 'Escape') handleCancelEdit();
              }}
              className="h-7 text-sm font-semibold bg-background/80 border-primary/50 max-w-[140px]"
              autoFocus
              onBlur={handleSaveTitle}
            />
          ) : (
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide truncate">
              {column.title}
            </h3>
          )}
          <span className="text-xs font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full flex-shrink-0">
            {tasks.length === 0 ? '-' : tasks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          {allowEditing && isEditing && (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-success hover:bg-success/10"
                onClick={handleSaveTitle}
                title="Save changes"
              >
                <Check className="h-3.5 w-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 text-destructive hover:bg-destructive/10"
                onClick={handleCancelEdit}
                title="Cancel editing"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {allowEditing && !isEditing && onEditColumn && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
              onClick={() => setIsEditing(true)}
              title="Edit column title"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
          )}
          {allowEditing && !isEditing && onChangeTheme && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  title="Change column color"
                >
                  <Palette className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover z-50">
                {colorOptions.map((color) => (
                  <DropdownMenuItem 
                    key={color.class}
                    onClick={() => handleColorChange(color.class)}
                    className="flex items-center gap-3"
                  >
                    <div className={`w-4 h-4 rounded-full ${color.class}`}></div>
                    <span>{color.name}</span>
                    {column.color === color.class && <Check className="h-4 w-4 ml-auto" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/50"
            onClick={() => onAddTask?.(column.id)}
            title="Add task"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Task list area */}
      <div className="flex-1 p-2 space-y-2 min-h-[100px] overflow-y-auto">
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <DraggableTaskCard key={task.id} task={task} onTaskClick={onTaskClick} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className={`flex items-center justify-center h-24 border border-dashed rounded-lg transition-all duration-200 ${
            isOver ? 'border-primary/50 bg-primary/5' : 'border-border/40 bg-muted/20'
          }`}>
            <p className="text-xs text-muted-foreground">
              {isOver ? '📋 Drop task here' : 'No tasks'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}