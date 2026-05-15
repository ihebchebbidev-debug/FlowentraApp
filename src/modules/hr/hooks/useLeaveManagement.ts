import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';

export function useLeaveManagement(year: number) {
  const qc = useQueryClient();

  const balancesQuery = useQuery({
    queryKey: ['hr', 'leaveBalances', year],
    queryFn: () => hrApi.getLeaveBalances(year),
  });

  const setAllowance = useMutation({
    mutationFn: (payload: { userId: number; year: number; leaveType: string; annualAllowance: number }) =>
      hrApi.setLeaveAllowance(payload.userId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'leaveBalances', year] }),
  });

  return { balancesQuery, setAllowance };
}

