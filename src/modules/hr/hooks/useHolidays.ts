import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { PublicHoliday } from '../types/hr.types';

export function usePublicHolidays(year?: number) {
  const qc = useQueryClient();

  const holidaysQuery = useQuery({
    queryKey: ['hr', 'holidays', year ?? 'all'],
    queryFn: () => hrApi.getPublicHolidays(year),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['hr', 'holidays'] });

  const createHoliday = useMutation({
    mutationFn: (payload: Partial<PublicHoliday>) => hrApi.createPublicHoliday(payload),
    onSuccess: invalidate,
  });

  const updateHoliday = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<PublicHoliday> }) => hrApi.updatePublicHoliday(id, payload),
    onSuccess: invalidate,
  });

  const deleteHoliday = useMutation({
    mutationFn: (id: number) => hrApi.deletePublicHoliday(id),
    onSuccess: invalidate,
  });

  return { holidaysQuery, createHoliday, updateHoliday, deleteHoliday };
}
