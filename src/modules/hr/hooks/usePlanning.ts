import { useQuery } from '@tanstack/react-query';
import { schedulesApi } from '@/services/api/schedulesApi';

export function usePlanningSchedule(userId?: number) {
  return useQuery({
    queryKey: ['planning', 'schedule', userId],
    enabled: Number.isFinite(userId) && Number(userId) > 0,
    queryFn: () => schedulesApi.getSchedule(Number(userId)),
  });
}

export function usePlanningLeaves(userId?: number) {
  return useQuery({
    queryKey: ['planning', 'leaves', userId],
    enabled: Number.isFinite(userId) && Number(userId) > 0,
    queryFn: () => schedulesApi.getLeaves(Number(userId)),
  });
}

