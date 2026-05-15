import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { 
  taskStatusesApi, 
  eventTypesApi, 
  serviceCategoriesApi, 
  currenciesApi, 
  prioritiesApi,
  articleCategoriesApi,
  locationsApi,
  leaveTypesApi,
  offerCategoriesApi,
  offerSourcesApi,
  installationTypesApi,
  installationCategoriesApi,
  workTypesApi,
  expenseTypesApi,
  projectTypesApi,
  formCategoriesApi,
  documentTypesApi,
  articleGroupsApi,
  type LookupItem, 
  type Currency,
  type CreateLookupRequest,
  type UpdateLookupRequest,
  handleApiError 
} from '@/services/lookupsApi';

export interface UseLookupHookReturn {
  items: LookupItem[];
  isLoading: boolean;
  error: string | null;
  createItem: (data: CreateLookupRequest) => Promise<void>;
  updateItem: (id: string, data: UpdateLookupRequest) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  setDefaultItem: (id: string) => Promise<void>;
  refetch: () => void;
}

export interface UseCurrencyHookReturn {
  currencies: Currency[];
  isLoading: boolean;
  error: string | null;
  createCurrency: (data: any) => Promise<void>;
  updateCurrency: (id: string, data: any) => Promise<void>;
  deleteCurrency: (id: string) => Promise<void>;
  setDefaultCurrency: (id: string) => Promise<void>;
  refetch: () => void;
}

// Generic lookup hook
function createLookupHook(
  queryKey: string, 
  api: { 
    getAll: () => Promise<any>, 
    create: (data: CreateLookupRequest) => Promise<any>,
    update: (id: string, data: UpdateLookupRequest) => Promise<any>,
    delete: (id: string) => Promise<void>
  }
): () => UseLookupHookReturn {
  return function useLookupHook() {
    const { t } = useTranslation('lookups');
    const queryClient = useQueryClient();
    
    const { data: response, isLoading, error, refetch } = useQuery({
      queryKey: [queryKey],
      queryFn: api.getAll,
      staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const createMutation = useMutation({
      mutationFn: api.create,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(t('toasts.itemCreated'));
      },
      onError: (error: any) => {
        toast.error(handleApiError(error));
      }
    });

    const updateMutation = useMutation({
      mutationFn: ({ id, data }: { id: string; data: UpdateLookupRequest }) => 
        api.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(t('toasts.itemUpdated'));
      },
      onError: (error: any) => {
        toast.error(handleApiError(error));
      }
    });

    const deleteMutation = useMutation({
      mutationFn: api.delete,
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKey] });
        toast.success(t('toasts.itemDeleted'));
      },
      onError: (error: any) => {
        toast.error(handleApiError(error));
      }
    });

    // Set default mutation - updates all items: unset previous default, set new one
    // Uses optimistic updates since backend may not return isDefault in response
    const setDefaultMutation = useMutation({
      mutationFn: async (id: string) => {
        const currentItems = response?.items || [];
        // Find current default and unset it
        const currentDefault = currentItems.find((item: LookupItem) => item.isDefault);
        if (currentDefault && currentDefault.id !== id) {
          await api.update(currentDefault.id, { isDefault: false });
        }
        // Set new default
        return api.update(id, { isDefault: true });
      },
      onMutate: async (id: string) => {
        // Cancel any outgoing refetches
        await queryClient.cancelQueries({ queryKey: [queryKey] });
        
        // Snapshot the previous value
        const previousData = queryClient.getQueryData([queryKey]);
        
        // Optimistically update to the new value
        queryClient.setQueryData([queryKey], (old: any) => {
          if (!old?.items) return old;
          return {
            ...old,
            items: old.items.map((item: LookupItem) => ({
              ...item,
              isDefault: item.id === id,
            })),
          };
        });
        
        return { previousData };
      },
      onError: (error: any, _id, context) => {
        // Rollback on error
        if (context?.previousData) {
          queryClient.setQueryData([queryKey], context.previousData);
        }
        toast.error(handleApiError(error));
      },
      onSuccess: () => {
        toast.success(t('toasts.defaultUpdated'));
      },
      onSettled: () => {
        // Always refetch after error or success
        queryClient.invalidateQueries({ queryKey: [queryKey] });
      },
    });

    return {
      items: response?.items || [],
      isLoading,
      error: error ? handleApiError(error) : null,
      createItem: createMutation.mutateAsync,
      updateItem: (id: string, data: UpdateLookupRequest) => 
        updateMutation.mutateAsync({ id, data }),
      deleteItem: deleteMutation.mutateAsync,
      setDefaultItem: setDefaultMutation.mutateAsync,
      refetch,
    };
  };
}

// Specific hooks for each lookup type
export const useTaskStatuses = createLookupHook('taskStatuses', taskStatusesApi);
export const useEventTypes = createLookupHook('eventTypes', eventTypesApi);
export const useServiceCategories = createLookupHook('serviceCategories', serviceCategoriesApi);
export const usePriorities = createLookupHook('priorities', prioritiesApi);
export const useArticleCategories = createLookupHook('articleCategories', articleCategoriesApi);
export const useLocations = createLookupHook('locations', locationsApi);
export const useArticleGroups = createLookupHook('articleGroups', articleGroupsApi);
export const useLeaveTypes = createLookupHook('leaveTypes', leaveTypesApi);
export const useOfferCategories = createLookupHook('offerCategories', offerCategoriesApi);
export const useOfferSources = createLookupHook('offerSources', offerSourcesApi);
export const useInstallationTypes = createLookupHook('installationTypes', installationTypesApi);
export const useInstallationCategories = createLookupHook('installationCategories', installationCategoriesApi);
export const useWorkTypes = createLookupHook('workTypes', workTypesApi);
export const useExpenseTypes = createLookupHook('expenseTypes', expenseTypesApi);
export const useProjectTypes = createLookupHook('projectTypes', projectTypesApi);
export const useFormCategories = createLookupHook('formCategories', formCategoriesApi);
export const useDocumentTypes = createLookupHook('documentTypes', documentTypesApi);

// Currency hook (special case)
export function useCurrencies(): UseCurrencyHookReturn {
  const { t } = useTranslation('lookups');
  const queryClient = useQueryClient();
  
  const { data: response, isLoading, error, refetch } = useQuery({
    queryKey: ['currencies'],
    queryFn: currenciesApi.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const createMutation = useMutation({
    mutationFn: currenciesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(t('toasts.currencyCreated'));
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      currenciesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(t('toasts.currencyUpdated'));
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    }
  });

  const deleteMutation = useMutation({
    mutationFn: currenciesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(t('toasts.currencyDeleted'));
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    }
  });

  const setDefaultMutation = useMutation({
    mutationFn: currenciesApi.setDefault,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currencies'] });
      toast.success(t('toasts.defaultCurrencyUpdated'));
    },
    onError: (error: any) => {
      toast.error(handleApiError(error));
    }
  });

  return {
    currencies: response?.currencies || [],
    isLoading,
    error: error ? handleApiError(error) : null,
    createCurrency: async (data: any) => { 
      await createMutation.mutateAsync(data); 
    },
    updateCurrency: async (id: string, data: any) => { 
      await updateMutation.mutateAsync({ id, data }); 
    },
    deleteCurrency: async (id: string) => { 
      await deleteMutation.mutateAsync(id); 
    },
    setDefaultCurrency: async (id: string) => { 
      await setDefaultMutation.mutateAsync(id); 
    },
    refetch,
  };
}
