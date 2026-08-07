import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardApi } from '../services/dashboardApi';
import type { Dashboard, DashboardCreateDto, DashboardUpdateDto } from '../types';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

const QUERY_KEY = ['dashboards'];

export function useDashboards() {
  const { t } = useTranslation('dashboard');
  const qc = useQueryClient();

  const query = useQuery<Dashboard[]>({
    queryKey: QUERY_KEY,
    queryFn: dashboardApi.getAll,
    staleTime: 30_000,
  });

  const createMutation = useMutation({
    mutationFn: (dto: DashboardCreateDto) => dashboardApi.create(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('dashboardBuilder.toasts.created'));
    },
    onError: () => toast.error(t('dashboardBuilder.toasts.createError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: DashboardUpdateDto }) =>
      dashboardApi.update(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('dashboardBuilder.toasts.updated'));
    },
    onError: () => toast.error(t('dashboardBuilder.toasts.updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => dashboardApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('dashboardBuilder.toasts.deleted'));
    },
    onError: () => toast.error(t('dashboardBuilder.toasts.deleteError')),
  });

  const duplicateMutation = useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) =>
      dashboardApi.duplicate(id, name),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      toast.success(t('dashboardBuilder.toasts.duplicated'));
    },
    onError: () => toast.error(t('dashboardBuilder.toasts.duplicateError')),
  });

  return {
    dashboards: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    duplicate: duplicateMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
  };
}
