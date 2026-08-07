import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import type { PermissionAction } from '@/types/permissions';

/**
 * Defense-in-depth guard for HR mutation handlers.
 *
 * UI buttons are already gated via `HrPermissionButton`, but a mutation
 * handler can still be invoked from keyboard shortcuts, form submits, or
 * programmatic paths. Call `guard(action)` at the top of the handler and
 * bail out early if it returns false — the user will see a toast instead
 * of hitting the backend with an unauthorized request.
 *
 * Example:
 *   const guard = useHrPermissionGuard();
 *   const handleDelete = async () => {
 *     if (!guard('delete')) return;
 *     await deleteMutation.mutateAsync(id);
 *   };
 */
export function useHrPermissionGuard() {
  const { isMainAdmin, hasPermission } = usePermissions();
  const { toast } = useToast();
  const { t } = useTranslation('hr');

  return useCallback(
    (action: PermissionAction): boolean => {
      if (isMainAdmin) return true;
      if (hasPermission('hr', action)) return true;
      toast({
        title: t('permissions.deniedTitle'),
        description: t(`permissions.denied.${action}`, { defaultValue: t('permissions.deniedGeneric') }),
        variant: 'destructive',
      });
      return false;
    },
    [isMainAdmin, hasPermission, toast, t],
  );
}

export default useHrPermissionGuard;