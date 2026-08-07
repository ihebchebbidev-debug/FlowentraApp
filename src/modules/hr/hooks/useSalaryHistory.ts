import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';

export function useSalaryHistory(userId: number) {
  return useQuery({
    queryKey: ['hr', 'salary-history', userId],
    queryFn: () => hrApi.getSalaryHistory(userId),
    enabled: Number.isFinite(userId) && userId > 0,
  });
}
