import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { CnssRate } from '../types/hr.types';

export function useCnssRates() {
  const qc = useQueryClient();

  const ratesQuery = useQuery({
    queryKey: ['hr', 'cnss', 'rates'],
    queryFn: () => hrApi.getCnssRates(),
  });

  const activeRateQuery = useQuery({
    queryKey: ['hr', 'cnss', 'rates', 'active'],
    queryFn: () => hrApi.getActiveCnssRate(),
  });

  const upsertRate = useMutation({
    mutationFn: (payload: Partial<CnssRate>) => hrApi.upsertCnssRate(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr', 'cnss'] });
    },
  });

  return { ratesQuery, activeRateQuery, upsertRate };
}

export function useCnssDeclaration(year: number, month: number) {
  return useQuery({
    queryKey: ['hr', 'cnss', 'declaration', year, month],
    queryFn: () => hrApi.getCnssDeclaration(year, month),
    enabled: Number.isFinite(year) && Number.isFinite(month),
  });
}
