import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { EmployeeDocument } from '../types/hr.types';

export function useEmployeeDocuments(userId: number) {
  const qc = useQueryClient();

  const documentsQuery = useQuery({
    queryKey: ['hr', 'documents', userId],
    queryFn: () => hrApi.getEmployeeDocuments(userId),
    enabled: Number.isFinite(userId) && userId > 0,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['hr', 'documents', userId] });

  const createDocument = useMutation({
    mutationFn: (payload: Partial<EmployeeDocument>) =>
      hrApi.createEmployeeDocument({ ...payload, userId }),
    onSuccess: invalidate,
  });

  const deleteDocument = useMutation({
    mutationFn: (id: number) => hrApi.deleteEmployeeDocument(id, userId),
    onSuccess: invalidate,
  });

  return { documentsQuery, createDocument, deleteDocument };
}
