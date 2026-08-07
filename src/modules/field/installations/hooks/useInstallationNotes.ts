// React Query hooks for Installation Notes
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { usersApi } from '@/services/api/usersApi';
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

export interface InstallationNote {
  id: number;
  installationId: number;
  note: string;
  createdDate: string;
  createdBy?: string;
  createdByName?: string;
}

export const installationNotesApi = {
  async getAll(installationId: number): Promise<InstallationNote[]> {
    const response = await fetch(`${API_URL}/api/InstallationNotes/installation/${installationId}`, {
      headers: getAuthHeaders(),
    });
    // Handle 404 as empty array (endpoint may not exist yet)
    if (response.status === 404) return [];
    if (!response.ok) throw new Error('Failed to fetch notes');
    const data = await response.json();
    // Handle both array and object with notes property
    if (Array.isArray(data)) return data;
    return data?.notes || data?.data || [];
  },

  async create(installationId: number, note: string): Promise<InstallationNote> {
    const response = await fetch(`${API_URL}/api/InstallationNotes`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ installationId, note }),
    });
    if (!response.ok) throw new Error('Failed to create note');
    return response.json();
  },

  async delete(noteId: number): Promise<void> {
    const response = await fetch(`${API_URL}/api/InstallationNotes/${noteId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete note');
  },
};

export function useInstallationNotes(installationId: number | null) {
  const queryClient = useQueryClient();

  // Fetch users for name resolution
  const { data: usersData } = useQuery({
    queryKey: ['users-for-notes'],
    queryFn: () => usersApi.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['installation-notes', installationId],
    queryFn: () => installationNotesApi.getAll(installationId!),
    enabled: !!installationId,
    staleTime: 2 * 60 * 1000,
  });

  const createNoteMutation = useMutation({
    mutationFn: (note: string) => installationNotesApi.create(installationId!, note),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-notes', installationId] });
      toast.success('Note added');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add note');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: number) => installationNotesApi.delete(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installation-notes', installationId] });
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
      if (userData) return JSON.parse(userData);
    } catch {
      return null;
    }
    return null;
  };

  // Resolve user ID/email to name
  const getUserName = (createdBy: string | number | undefined): string | undefined => {
    if (!createdBy) return undefined;
    
    const users = usersData?.users || [];
    const mainAdmin = getMainAdminUser();
    
    const userId = typeof createdBy === 'number' ? createdBy : parseInt(createdBy, 10);
    
    if (!isNaN(userId)) {
      if (userId === 1 && mainAdmin) {
        const name = mainAdmin.fullName || `${mainAdmin.firstName || ''} ${mainAdmin.lastName || ''}`.trim();
        return name || mainAdmin.email;
      }
      const user = users.find(u => u.id === userId);
      if (user) {
        const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
        return name || user.email;
      }
    }
    
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

  const notes: InstallationNote[] = (data || []).map((n: any) => ({
    id: n.id || n.Id,
    installationId: n.installationId || n.InstallationId,
    note: n.note || n.Note || n.content || n.Content || '',
    createdDate: n.createdDate || n.CreatedDate || n.createdAt || new Date().toISOString(),
    createdBy: n.createdBy || n.CreatedBy,
    createdByName: getUserName(n.createdBy || n.CreatedBy),
  }));

  return {
    notes,
    isLoading,
    error,
    refetch,
    createNote: (note: string) => createNoteMutation.mutateAsync(note),
    deleteNote: (noteId: number) => deleteNoteMutation.mutateAsync(noteId),
    isCreating: createNoteMutation.isPending,
    isDeleting: deleteNoteMutation.isPending,
  };
}
