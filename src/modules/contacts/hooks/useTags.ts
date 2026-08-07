// React Query hooks for Contact Tags
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactTagsApi } from '@/services/contactsApi';
import { contactsApi } from '@/services/api/contactsApi';
import type { ContactTag } from '@/types/contacts';

export function useTags() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contact-tags'],
    queryFn: contactTagsApi.getAll,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const createTagMutation = useMutation({
    mutationFn: (data: { name: string; color?: string }) => contactTagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
      toast.success('Tag created');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: (tagId: number) => contactTagsApi.delete(tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-tags'] });
      toast.success('Tag deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete tag');
    },
  });

  return {
    tags: (data || []) as ContactTag[],
    isLoading,
    error,
    refetch,
    createTag: (data: { name: string; color?: string }) => createTagMutation.mutateAsync(data),
    deleteTag: (tagId: number) => deleteTagMutation.mutateAsync(tagId),
    isCreating: createTagMutation.isPending,
    isDeleting: deleteTagMutation.isPending,
  };
}

export function useContactTags() {
  const queryClient = useQueryClient();

  const assignTagMutation = useMutation({
    mutationFn: ({ contactId, tagId }: { contactId: number; tagId: number }) =>
      contactsApi.assignTag(contactId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to assign tag');
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: ({ contactId, tagId }: { contactId: number; tagId: number }) =>
      contactsApi.removeTag(contactId, tagId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove tag');
    },
  });

  return {
    assignTag: (contactId: number, tagId: number) =>
      assignTagMutation.mutateAsync({ contactId, tagId }),
    removeTag: (contactId: number, tagId: number) =>
      removeTagMutation.mutateAsync({ contactId, tagId }),
    isAssigning: assignTagMutation.isPending,
    isRemoving: removeTagMutation.isPending,
  };
}
