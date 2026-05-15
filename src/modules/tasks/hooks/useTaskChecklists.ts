import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { taskChecklistApi } from '@/services/api/taskChecklistApi';
import type { TaskChecklist, TaskChecklistItem } from '../types/checklist';

interface UseTaskChecklistsProps {
  projectTaskId?: number;
  dailyTaskId?: number;
}

export function useTaskChecklists({ projectTaskId, dailyTaskId }: UseTaskChecklistsProps) {
  const { t } = useTranslation('tasks');
  const { toast } = useToast();
  const [checklists, setChecklists] = useState<TaskChecklist[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChecklists = useCallback(async () => {
    if (!projectTaskId && !dailyTaskId) return;

    setIsLoading(true);
    setError(null);

    try {
      let data: TaskChecklist[];
      if (projectTaskId) {
        data = await taskChecklistApi.getChecklistsForProjectTask(projectTaskId);
      } else if (dailyTaskId) {
        data = await taskChecklistApi.getChecklistsForDailyTask(dailyTaskId);
      } else {
        data = [];
      }
      setChecklists(data);
    } catch (err) {
      console.error('Failed to fetch checklists:', err);
      setError(t('checklist.toast.loadError', 'Failed to load checklists'));
      // Don't show error toast for now - API might not exist yet
      setChecklists([]);
    } finally {
      setIsLoading(false);
    }
  }, [projectTaskId, dailyTaskId]);

  useEffect(() => {
    fetchChecklists();
  }, [fetchChecklists]);

  const addChecklist = useCallback(async (title: string) => {
    try {
      const newChecklist = await taskChecklistApi.createChecklist({
        projectTaskId,
        dailyTaskId,
        title,
      });
      setChecklists((prev) => [...prev, newChecklist]);
      toast({
        title: t('checklist.toast.checklistCreated', 'Checklist created'),
        description: title,
      });
    } catch (err) {
      console.error('Failed to create checklist:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.createError', 'Failed to create checklist'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [projectTaskId, dailyTaskId, toast, t]);

  const updateChecklist = useCallback(async (id: number, title: string) => {
    try {
      const updated = await taskChecklistApi.updateChecklist(id, { title });
      setChecklists((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      );
      toast({
        title: t('checklist.toast.checklistUpdated', 'Checklist updated'),
      });
    } catch (err) {
      console.error('Failed to update checklist:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.updateError', 'Failed to update checklist'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const deleteChecklist = useCallback(async (id: number) => {
    try {
      await taskChecklistApi.deleteChecklist(id);
      setChecklists((prev) => prev.filter((c) => c.id !== id));
      toast({
        title: t('checklist.toast.checklistDeleted', 'Checklist deleted'),
      });
    } catch (err) {
      console.error('Failed to delete checklist:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.deleteError', 'Failed to delete checklist'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const toggleExpand = useCallback(async (id: number, isExpanded: boolean) => {
    try {
      await taskChecklistApi.updateChecklist(id, { isExpanded });
      setChecklists((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isExpanded } : c))
      );
    } catch (err) {
      console.error('Failed to toggle expand:', err);
    }
  }, []);

  const addItem = useCallback(async (checklistId: number, title: string) => {
    try {
      const newItem = await taskChecklistApi.createChecklistItem({
        checklistId,
        title,
      });
      setChecklists((prev) =>
        prev.map((c) => {
          if (c.id === checklistId) {
            return {
              ...c,
              items: [...c.items, newItem],
              totalCount: c.totalCount + 1,
              progressPercent: Math.round((c.completedCount / (c.totalCount + 1)) * 100),
            };
          }
          return c;
        })
      );
    } catch (err) {
      console.error('Failed to add item:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.itemCreateError', 'Failed to add item'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const toggleItem = useCallback(async (itemId: number) => {
    try {
      const updatedItem = await taskChecklistApi.toggleChecklistItem(itemId);
      setChecklists((prev) =>
        prev.map((c) => {
          const itemIndex = c.items.findIndex((i) => i.id === itemId);
          if (itemIndex === -1) return c;

          const oldItem = c.items[itemIndex];
          const items = [...c.items];
          items[itemIndex] = updatedItem;

          // Calculate new completed count based on state change
          let newCompletedCount = c.completedCount;
          if (!oldItem.isCompleted && updatedItem.isCompleted) {
            newCompletedCount += 1; // Was unchecked, now checked
          } else if (oldItem.isCompleted && !updatedItem.isCompleted) {
            newCompletedCount -= 1; // Was checked, now unchecked
          }

          return {
            ...c,
            items,
            completedCount: newCompletedCount,
            progressPercent: c.totalCount > 0 ? Math.round((newCompletedCount / c.totalCount) * 100) : 0,
          };
        })
      );
    } catch (err) {
      console.error('Failed to toggle item:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.toggleError', 'Failed to update item'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const updateItem = useCallback(async (itemId: number, title: string) => {
    try {
      const updatedItem = await taskChecklistApi.updateChecklistItem(itemId, { title });
      setChecklists((prev) =>
        prev.map((c) => ({
          ...c,
          items: c.items.map((i) => (i.id === itemId ? updatedItem : i)),
        }))
      );
    } catch (err) {
      console.error('Failed to update item:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.itemUpdateError', 'Failed to update item'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const deleteItem = useCallback(async (itemId: number) => {
    try {
      await taskChecklistApi.deleteChecklistItem(itemId);
      setChecklists((prev) =>
        prev.map((c) => {
          const item = c.items.find((i) => i.id === itemId);
          if (!item) return c;

          const items = c.items.filter((i) => i.id !== itemId);
          const newCompletedCount = item.isCompleted ? c.completedCount - 1 : c.completedCount;
          const newTotalCount = c.totalCount - 1;

          return {
            ...c,
            items,
            completedCount: newCompletedCount,
            totalCount: newTotalCount,
            progressPercent: newTotalCount > 0 ? Math.round((newCompletedCount / newTotalCount) * 100) : 0,
          };
        })
      );
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.itemDeleteError', 'Failed to delete item'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const convertToTask = useCallback(async (itemId: number) => {
    try {
      await taskChecklistApi.convertItemToSubtask(itemId);
      // Remove the item from the checklist after conversion
      setChecklists((prev) =>
        prev.map((c) => {
          const item = c.items.find((i) => i.id === itemId);
          if (!item) return c;

          return {
            ...c,
            items: c.items.filter((i) => i.id !== itemId),
            totalCount: c.totalCount - 1,
            progressPercent: c.totalCount > 1 
              ? Math.round((c.completedCount / (c.totalCount - 1)) * 100) 
              : 0,
          };
        })
      );
      toast({
        title: t('checklist.toast.convertedToTask', 'Converted to task'),
        description: t('checklist.toast.convertedToTaskDesc', 'Item has been converted to a new task'),
      });
    } catch (err) {
      console.error('Failed to convert to task:', err);
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.convertError', 'Failed to convert to task'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [toast, t]);

  const reorderItems = useCallback(async (checklistId: number, itemIds: number[]) => {
    try {
      // Optimistic update
      setChecklists((prev) =>
        prev.map((c) => {
          if (c.id !== checklistId) return c;
          
          const reorderedItems = itemIds
            .map((id) => c.items.find((item) => item.id === id))
            .filter((item): item is TaskChecklistItem => item !== undefined);

          return {
            ...c,
            items: reorderedItems,
          };
        })
      );

      await taskChecklistApi.reorderChecklistItems({ checklistId, itemIds });
    } catch (err) {
      console.error('Failed to reorder items:', err);
      // Refetch to restore correct order
      fetchChecklists();
      toast({
        title: t('toast.error', 'Error'),
        description: t('checklist.toast.reorderError', 'Failed to reorder items'),
        variant: 'destructive',
      });
      throw err;
    }
  }, [fetchChecklists, toast, t]);

  return {
    checklists,
    isLoading,
    error,
    refetch: fetchChecklists,
    addChecklist,
    updateChecklist,
    deleteChecklist,
    toggleExpand,
    addItem,
    toggleItem,
    updateItem,
    deleteItem,
    convertToTask,
    reorderItems,
  };
}
