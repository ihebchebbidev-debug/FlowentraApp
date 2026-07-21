import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { PayrollRun } from '../types/hr.types';

const KEY = 'hr.payrollRuns';

export function usePayrollRuns(year: number) {
  const qc = useQueryClient();

  const runsQuery = useQuery<PayrollRun[]>({
    queryKey: [KEY, year],
    queryFn: () => hrApi.listPayrollRuns(year),
    staleTime: 60_000,
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: [KEY] });

  const generateMutation = useMutation({
    mutationFn: (payload: { month: number; year: number }) => hrApi.generatePayrollRun(payload),
    onSuccess: invalidate,
  });

  const confirmMutation = useMutation({
    mutationFn: (id: number) => hrApi.confirmPayrollRun(id),
    onSuccess: invalidate,
  });

  const payMutation = useMutation({
    mutationFn: (id: number) => hrApi.markPayrollRunPaid(id),
    onSuccess: invalidate,
  });

  return { runsQuery, generateMutation, confirmMutation, payMutation };
}
