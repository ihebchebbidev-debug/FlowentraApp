// React Query hooks for Contacts with optimized caching
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactsApi } from '@/services/api/contactsApi';
import { queryKeys, STALE_TIMES, CACHE_TIMES } from '@/lib/queryClient';
import type { 
  Contact, 
  ContactSearchParams,
  CreateContactRequest,
  UpdateContactRequest,
  BulkImportRequest
} from '@/types/contacts';

export function useContacts(params?: ContactSearchParams) {
  const queryClient = useQueryClient();

  // Get all contacts from real API with optimized caching
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: queryKeys.contacts.list(params),
    queryFn: () => contactsApi.getAll(params),
    staleTime: STALE_TIMES.DYNAMIC, // 1 minute before refetching
    gcTime: CACHE_TIMES.DYNAMIC, // Keep in cache for 2 minutes
    refetchOnMount: true,
  });

  // Create contact
  const createMutation = useMutation({
    mutationFn: contactsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      toast.success('Contact created successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create contact');
    },
  });

  // Update contact
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateContactRequest }) =>
      contactsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.detail(variables.id) });
      toast.success('Contact updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update contact');
    },
  });

  // Delete contact
  const deleteMutation = useMutation({
    mutationFn: contactsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      toast.success('Contact deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete contact');
    },
  });

  // Bulk import
  const bulkImportMutation = useMutation({
    mutationFn: contactsApi.bulkImport,
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.contacts.all });
      toast.success(`Imported ${result.successCount} contacts successfully`);
      if (result.failedCount > 0) {
        toast.error(`${result.failedCount} contacts failed to import`);
      }
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to import contacts');
    },
  });

  // Apply client-side type filtering as fallback until backend is deployed
  // The backend should filter by type, but if it doesn't return the type field, we filter client-side
  const filteredContacts = (() => {
    const contacts = data?.contacts || [];
    if (!params?.type) return contacts;
    
    // Check if backend returned type field (it should after deployment)
    const hasTypeField = contacts.length > 0 && contacts[0].type !== undefined;
    if (hasTypeField) {
      // Backend filtering should work, but double-check client-side
      return contacts.filter(c => {
        const contactType = (c.type || 'individual').toLowerCase();
        return contactType === params.type?.toLowerCase();
      });
    }
    
    // Backend doesn't have type field yet - no filtering possible
    console.warn('[useContacts] Backend does not return type field - filtering disabled until backend is redeployed');
    return contacts;
  })();

  return {
    contacts: filteredContacts,
    totalCount: data?.totalCount || 0,
    pageSize: data?.pageSize || 20,
    pageNumber: data?.pageNumber || 1,
    hasNextPage: data?.hasNextPage || false,
    hasPreviousPage: data?.hasPreviousPage || false,
    isLoading,
    error,
    createContact: createMutation.mutateAsync,
    updateContact: (id: number, data: UpdateContactRequest) =>
      updateMutation.mutateAsync({ id, data }),
    deleteContact: deleteMutation.mutateAsync,
    bulkImport: bulkImportMutation.mutateAsync,
    refetch,
  };
}

// Get single contact by ID with caching
export function useContact(id: number | null) {
  return useQuery({
    queryKey: queryKeys.contacts.detail(id!),
    queryFn: () => contactsApi.getById(id!),
    enabled: !!id,
    staleTime: STALE_TIMES.DYNAMIC,
    gcTime: CACHE_TIMES.DYNAMIC,
    refetchOnMount: true,
  });
}
