import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { BonusCost } from '../types/hr.types';

export function useBonuses(params?: { userId?: number; year?: number; month?: number; kind?: string }) {
  const qc = useQueryClient();

  const bonusesQuery = useQuery({
    queryKey: ['hr', 'bonuses', params ?? {}],
    queryFn: () => hrApi.getBonuses(params),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['hr', 'bonuses'] });

  const createBonus = useMutation({
    mutationFn: (payload: Partial<BonusCost>) => hrApi.createBonus(payload),
    onSuccess: invalidate,
  });

  const updateBonus = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<BonusCost> }) => hrApi.updateBonus(id, payload),
    onSuccess: invalidate,
  });

  const deleteBonus = useMutation({
    mutationFn: (id: number) => hrApi.deleteBonus(id),
    onSuccess: invalidate,
  });

  return { bonusesQuery, createBonus, updateBonus, deleteBonus };
}
