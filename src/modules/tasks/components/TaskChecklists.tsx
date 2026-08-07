import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Trash2, 
  GripVertical,
  CheckSquare,
  MoreHorizontal,
  Edit2,
  ArrowRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToParentElement } from '@dnd-kit/modifiers';
import { cn } from '@/lib/utils';
import type { TaskChecklist, TaskChecklistItem } from '../types/checklist';

interface TaskChecklistsProps {
  checklists: TaskChecklist[];
  onAddChecklist: (title: string) => Promise<void>;
  onUpdateChecklist: (id: number, title: string) => Promise<void>;
  onDeleteChecklist: (id: number) => Promise<void>;
  onToggleExpand: (id: number, isExpanded: boolean) => Promise<void>;
  onAddItem: (checklistId: number, title: string) => Promise<void>;
  onToggleItem: (itemId: number) => Promise<void>;
  onUpdateItem: (itemId: number, title: string) => Promise<void>;
  onDeleteItem: (itemId: number) => Promise<void>;
  onReorderItems: (checklistId: number, itemIds: number[]) => Promise<void>;
  onConvertToTask?: (itemId: number) => Promise<void>;
  isLoading?: boolean;
}

export function TaskChecklists({
  checklists,
  onAddChecklist,
  onUpdateChecklist,
  onDeleteChecklist,
  onToggleExpand,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onConvertToTask,
  isLoading = false,
}: TaskChecklistsProps) {
  const { t } = useTranslation('tasks');
  const [newChecklistTitle, setNewChecklistTitle] = useState('');
  const [isAddingChecklist, setIsAddingChecklist] = useState(false);
  const [editingChecklistId, setEditingChecklistId] = useState<number | null>(null);
  const [editChecklistTitle, setEditChecklistTitle] = useState('');
  const [deleteChecklistId, setDeleteChecklistId] = useState<number | null>(null);

  const handleAddChecklist = async () => {
    if (!newChecklistTitle.trim()) return;
    try {
      await onAddChecklist(newChecklistTitle.trim());
      setNewChecklistTitle('');
      setIsAddingChecklist(false);
    } catch (error) {
      console.error('Failed to add checklist:', error);
    }
  };

  const handleUpdateChecklist = async (id: number) => {
    if (!editChecklistTitle.trim()) return;
    try {
      await onUpdateChecklist(id, editChecklistTitle.trim());
      setEditingChecklistId(null);
      setEditChecklistTitle('');
    } catch (error) {
      console.error('Failed to update checklist:', error);
    }
  };

  const handleDeleteConfirm = async () => {
    if (deleteChecklistId === null) return;
    try {
      await onDeleteChecklist(deleteChecklistId);
      setDeleteChecklistId(null);
    } catch (error) {
      console.error('Failed to delete checklist:', error);
    }
  };

  const startEditChecklist = (checklist: TaskChecklist) => {
    setEditingChecklistId(checklist.id);
    setEditChecklistTitle(checklist.title);
  };

  // Calculate total progress across all checklists
  const totalItems = checklists.reduce((sum, c) => sum + c.totalCount, 0);
  const completedItems = checklists.reduce((sum, c) => sum + c.completedCount, 0);
  const overallProgress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-muted-foreground" />
          {t('checklist.title', 'Checklists')}
          {totalItems > 0 && (
            <span className="text-xs text-muted-foreground font-normal">
              ({completedItems}/{totalItems})
            </span>
          )}
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsAddingChecklist(true)}
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-1" />
          {t('checklist.addChecklist', 'Add Checklist')}
        </Button>
      </div>

      {/* Overall progress */}
      {totalItems > 0 && (
        <div className="space-y-1">
          <Progress value={overallProgress} className="h-2" />
          <p className="text-xs text-muted-foreground text-right">
            {overallProgress}% {t('checklist.complete', 'complete')}
          </p>
        </div>
      )}

      {/* Add new checklist input */}
      {isAddingChecklist && (
        <div className="flex gap-2">
          <Input
            value={newChecklistTitle}
            onChange={(e) => setNewChecklistTitle(e.target.value)}
            placeholder={t('checklist.checklistTitlePlaceholder', 'Checklist title...')}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddChecklist();
              if (e.key === 'Escape') {
                setIsAddingChecklist(false);
                setNewChecklistTitle('');
              }
            }}
            autoFocus
          />
          <Button size="sm" onClick={handleAddChecklist}>
            {t('common.save', 'Save')}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsAddingChecklist(false);
              setNewChecklistTitle('');
            }}
          >
            {t('common.cancel', 'Cancel')}
          </Button>
        </div>
      )}

      {/* Checklists */}
      <div className="space-y-3">
        {checklists.map((checklist) => (
          <ChecklistCard
            key={checklist.id}
            checklist={checklist}
            isEditing={editingChecklistId === checklist.id}
            editTitle={editChecklistTitle}
            onEditTitleChange={setEditChecklistTitle}
            onStartEdit={() => startEditChecklist(checklist)}
            onSaveEdit={() => handleUpdateChecklist(checklist.id)}
            onCancelEdit={() => {
              setEditingChecklistId(null);
              setEditChecklistTitle('');
            }}
            onDelete={() => setDeleteChecklistId(checklist.id)}
            onToggleExpand={() => onToggleExpand(checklist.id, !checklist.isExpanded)}
            onAddItem={onAddItem}
            onToggleItem={onToggleItem}
            onUpdateItem={onUpdateItem}
            onDeleteItem={onDeleteItem}
            onReorderItems={onReorderItems}
            onConvertToTask={onConvertToTask}
          />
        ))}
      </div>

      {checklists.length === 0 && !isAddingChecklist && (
        <div className="text-center py-6 text-muted-foreground">
          <CheckSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('checklist.noChecklists', 'No checklists yet')}</p>
          <p className="text-xs">{t('checklist.addChecklistHint', 'Add a checklist to track subtasks')}</p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteChecklistId !== null} onOpenChange={() => setDeleteChecklistId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('checklist.deleteConfirm.title', 'Delete Checklist')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('checklist.deleteConfirm.description', 'This will delete the checklist and all its items. This action cannot be undone.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t('common.delete', 'Delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

interface ChecklistCardProps {
  checklist: TaskChecklist;
  isEditing: boolean;
  editTitle: string;
  onEditTitleChange: (title: string) => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onToggleExpand: () => void;
  onAddItem: (checklistId: number, title: string) => Promise<void>;
  onToggleItem: (itemId: number) => Promise<void>;
  onUpdateItem: (itemId: number, title: string) => Promise<void>;
  onDeleteItem: (itemId: number) => Promise<void>;
  onReorderItems: (checklistId: number, itemIds: number[]) => Promise<void>;
  onConvertToTask?: (itemId: number) => Promise<void>;
}

function ChecklistCard({
  checklist,
  isEditing,
  editTitle,
  onEditTitleChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onToggleExpand,
  onAddItem,
  onToggleItem,
  onUpdateItem,
  onDeleteItem,
  onReorderItems,
  onConvertToTask,
}: ChecklistCardProps) {
  const { t } = useTranslation('tasks');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [isAddingItem, setIsAddingItem] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = checklist.items.findIndex((item) => item.id === active.id);
      const newIndex = checklist.items.findIndex((item) => item.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(checklist.items, oldIndex, newIndex);
        const itemIds = newOrder.map((item) => item.id);
        onReorderItems(checklist.id, itemIds);
      }
    }
  };

  const handleAddItem = async () => {
    if (!newItemTitle.trim()) return;
    try {
      await onAddItem(checklist.id, newItemTitle.trim());
      setNewItemTitle('');
    } catch (error) {
      console.error('Failed to add item:', error);
    }
  };

  return (
    <Card className="border-border/50">
      <CardHeader className="py-3 px-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={onToggleExpand}
          >
            {checklist.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>

          {isEditing ? (
            <div className="flex-1 flex gap-2">
              <Input
                value={editTitle}
                onChange={(e) => onEditTitleChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSaveEdit();
                  if (e.key === 'Escape') onCancelEdit();
                }}
                autoFocus
                className="h-8"
              />
              <Button size="sm" className="h-8" onClick={onSaveEdit}>
                {t('common.save', 'Save')}
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={onCancelEdit}>
                {t('common.cancel', 'Cancel')}
              </Button>
            </div>
          ) : (
            <>
              <CardTitle className="text-sm font-medium flex-1">
                {checklist.title}
              </CardTitle>
              <span className="text-xs text-muted-foreground">
                {checklist.completedCount}/{checklist.totalCount}
              </span>
              <Progress value={checklist.progressPercent} className="w-16 h-1.5" />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onStartEdit}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    {t('common.edit', 'Edit')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t('common.delete', 'Delete')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </CardHeader>

      {checklist.isExpanded && (
        <CardContent className="py-2 px-4 pt-0">
          <div className="space-y-1">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
              modifiers={[restrictToVerticalAxis, restrictToParentElement]}
            >
              <SortableContext
                items={checklist.items.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                {checklist.items.map((item) => (
                  <SortableChecklistItem
                    key={item.id}
                    item={item}
                    onToggle={() => onToggleItem(item.id)}
                    onUpdate={(title) => onUpdateItem(item.id, title)}
                    onDelete={() => onDeleteItem(item.id)}
                    onConvertToTask={onConvertToTask ? () => onConvertToTask(item.id) : undefined}
                  />
                ))}
              </SortableContext>
            </DndContext>

            {/* Add item input */}
            {isAddingItem ? (
              <div className="flex items-center gap-2 pl-6">
                <Input
                  value={newItemTitle}
                  onChange={(e) => setNewItemTitle(e.target.value)}
                  placeholder={t('checklist.itemPlaceholder', 'Add an item...')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddItem();
                    if (e.key === 'Escape') {
                      setIsAddingItem(false);
                      setNewItemTitle('');
                    }
                  }}
                  autoFocus
                  className="h-8 text-sm"
                />
                <Button size="sm" className="h-8" onClick={handleAddItem}>
                  {t('common.save', 'Save')}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8"
                  onClick={() => {
                    setIsAddingItem(false);
                    setNewItemTitle('');
                  }}
                >
                  {t('common.cancel', 'Cancel')}
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground pl-6"
                onClick={() => setIsAddingItem(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('checklist.addItem', 'Add item')}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

interface SortableChecklistItemProps {
  item: TaskChecklistItem;
  onToggle: () => void;
  onUpdate: (title: string) => void;
  onDelete: () => void;
  onConvertToTask?: () => void;
}

function SortableChecklistItem({
  item,
  onToggle,
  onUpdate,
  onDelete,
  onConvertToTask,
}: SortableChecklistItemProps) {
  const { t } = useTranslation('tasks');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(item.title);
  const [showActions, setShowActions] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleSave = () => {
    if (editTitle.trim() && editTitle !== item.title) {
      onUpdate(editTitle.trim());
    }
    setIsEditing(false);
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 py-1.5 px-2 rounded-md group',
        'hover:bg-muted/50 transition-colors',
        isDragging && 'opacity-50 bg-muted shadow-lg z-50'
      )}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
      </div>
      
      <Checkbox
        checked={item.isCompleted}
        onCheckedChange={onToggle}
        className="h-4 w-4"
      />

      {isEditing ? (
        <Input
          value={editTitle}
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSave();
            if (e.key === 'Escape') {
              setEditTitle(item.title);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="h-7 text-sm flex-1"
        />
      ) : (
        <span
          className={cn(
            'flex-1 text-sm cursor-pointer',
            item.isCompleted && 'line-through text-muted-foreground'
          )}
          onClick={() => setIsEditing(true)}
        >
          {item.title}
        </span>
      )}

      {showActions && !isEditing && (
        <div className="flex items-center gap-1">
          {onConvertToTask && !item.isCompleted && (
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={onConvertToTask}
              title={t('checklist.convertToTask', 'Convert to task')}
            >
              <ArrowRight className="h-3 w-3" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-destructive hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
