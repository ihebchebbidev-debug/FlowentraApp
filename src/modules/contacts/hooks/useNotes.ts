// React Query hooks for Contact Notes
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { contactNotesApi } from '@/services/contactsApi';
import { usersApi } from '@/services/api/usersApi';

export interface ContactNote {
  id: number;
  contactId: number;
  note: string;
  createdDate: string;
  createdBy?: string;
  createdByName?: string;
}

export function useContactNotes(contactId: number | null) {
  const queryClient = useQueryClient();

  // Fetch users for name resolution
  const { data: usersData } = useQuery({
    queryKey: ['users-for-notes'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contact-notes', contactId],
    queryFn: () => contactNotesApi.getAll(contactId!),
    enabled: !!contactId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const createNoteMutation = useMutation({
    mutationFn: (note: string) => contactNotesApi.create(contactId!, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      toast.success('Note added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ noteId, note }: { noteId: number; note: string }) =>
      contactNotesApi.update(noteId, { note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] });
      toast.success('Note updated');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update note');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => contactNotesApi.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contact-notes', contactId] });
      queryClient.invalidateQueries({ queryKey: ['contact', contactId] });
      toast.success('Note deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete note');
    },
  });

  // Get MainAdminUser from localStorage
  const getMainAdminUser = () => {
    try {
      const userData = localStorage.getItem('user_data');
      if (userData) {
        return JSON.parse(userData);
      }
    } catch {
      return null;
    }
    return null;
  };

  // Build user map for name resolution
  const getUserName = (createdBy: string | number | undefined): string | undefined => {
    if (!createdBy) return undefined;
    
    const users = usersData?.users || [];
    const mainAdmin = getMainAdminUser();
    
    // Check if createdBy is user ID (number or numeric string)
    const userId = typeof createdBy === 'number' ? createdBy : parseInt(createdBy, 10);
    
    if (!isNaN(userId)) {
      // ID 1 is MainAdminUser
      if (userId === 1 && mainAdmin) {
        const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
        return name || mainAdmin.email;
      }
      // Find in users list
      const user = users.find(u => u.id === userId);
      if (user) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || user.email;
      }
    }
    
    // If it's an email, try to find the user by email
    if (typeof createdBy === 'string' && createdBy.includes('@')) {
      if (mainAdmin && mainAdmin.email === createdBy) {
        const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
        return name || createdBy;
      }
      const user = users.find(u => u.email === createdBy);
      if (user) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || createdBy;
      }
    }
    
    return typeof createdBy === 'string' ? createdBy : undefined;
  };

  // Normalize notes data from API with user name resolution
  const notes: ContactNote[] = (Array.isArray(data) ? data : data?.notes || []).map((n: any) => ({
    id: n.id,
    contactId: n.contactId,
    note: n.note || n.content || '',
    createdDate: n.createdDate || n.createdAt || new Date().toISOString(),
    createdBy: n.createdBy,
    createdByName: getUserName(n.createdBy),
  }));

  return {
    notes,
    isLoading,
    error,
    refetch,
    createNote: (note: string) => createNoteMutation.mutateAsync(note),
    updateNote: (noteId: number, note: string) => updateNoteMutation.mutateAsync({ noteId, note }),
    deleteNote: (noteId: number) => deleteNoteMutation.mutateAsync(noteId),
    isCreating: createNoteMutation.isPending,
    isUpdating: updateNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}
