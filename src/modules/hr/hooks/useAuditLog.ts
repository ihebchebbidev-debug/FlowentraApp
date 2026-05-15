import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';

export function useAuditLog(params?: { userId?: number; take?: number }) {
  return useQuery({
    queryKey: ['hr', 'audit', params ?? {}],
    queryFn: () => hrApi.getAuditLog(params),
  });
}
