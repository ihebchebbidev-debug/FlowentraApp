import { useQuery } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import dayjs from 'dayjs';

/**
 * Reusable hook for any module (Planning, Tasks, Calendar) to know which
 * employees are on approved leave for a given date.
 * Backed by GET /api/hr/leaves/active?date=YYYY-MM-DD
 */
export function useActiveLeaves(date?: Date | string) {
  const dateStr = typeof date === 'string'
    ? date
    : dayjs(date ?? new Date()).format('YYYY-MM-DD');

  const query = useQuery({
    queryKey: ['hr', 'activeLeaves', dateStr],
    queryFn: () => hrApi.getActiveLeaves(dateStr),
    staleTime: 60_000,
  });

  const leaves = query.data ?? [];
  const userIdsOnLeave = new Set(leaves.map(l => l.userId));

  return {
    ...query,
    leaves,
    isUserOnLeave: (userId: number) => userIdsOnLeave.has(userId),
    leaveOf: (userId: number) => leaves.find(l => l.userId === userId),
  };
}