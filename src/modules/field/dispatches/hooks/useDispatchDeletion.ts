import { useState } from 'react';
import { dispatchesApi } from '@/services/api/dispatchesApi';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

/**
 * Hook that handles dispatch deletion.
 * 
 * The backend now handles everything in one atomic operation:
 * 1. Hard deletes the dispatch and all child records
 * 2. Resets the associated job to 'unscheduled' (unplanned)
 * 3. Recalculates the parent Service Order status
 *    - No dispatches left → 'ready_for_planning'
 *    - All completed → 'technically_completed'
 *    - Any in_progress → 'in_progress'
 *    - Otherwise → 'scheduled'
 */
export function useDispatchDeletion() {
  const { toast } = useToast();
  const { t } = useTranslation('dispatches');
  const [isDeleting, setIsDeleting] = useState(false);

  /**
   * Delete a dispatch. Backend handles job reset and SO recalculation.
   * Returns true on success, false on failure.
   */
  const deleteDispatch = async (dispatchId: string | number): Promise<boolean> => {
    setIsDeleting(true);
    const numericId = Number(dispatchId);

    try {
      await dispatchesApi.delete(numericId);

      toast({
        title: t('dispatches.delete_success'),
        description: t('dispatches.delete_success_description'),
      });

      return true;
    } catch (error) {
      console.error('Failed to delete dispatch:', error);
      toast({
        title: t('dispatches.delete_error'),
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsDeleting(false);
    }
  };

  /**
   * Bulk delete dispatches.
   * Returns the list of successfully deleted IDs.
   */
  const bulkDeleteDispatches = async (
    dispatchIds: (string | number)[],
    onProgress?: (percent: number) => void
  ): Promise<(string | number)[]> => {
    setIsDeleting(true);
    const successIds: (string | number)[] = [];

    for (let i = 0; i < dispatchIds.length; i++) {
      try {
        await dispatchesApi.delete(Number(dispatchIds[i]));
        successIds.push(dispatchIds[i]);
      } catch (err) {
        console.error(`Failed to delete dispatch ${dispatchIds[i]}:`, err);
      }
      onProgress?.(Math.round(((i + 1) / dispatchIds.length) * 100));
    }

    setIsDeleting(false);

    toast({
      title: t('dispatches.bulk.delete_success'),
      description: t('dispatches.bulk.delete_success_description', { 
        count: successIds.length 
      }),
    });

    return successIds;
  };

  return {
    deleteDispatch,
    bulkDeleteDispatches,
    isDeleting,
  };
}
