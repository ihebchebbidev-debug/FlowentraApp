import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import type { HrGoal, HrPerformanceReview, HrReviewCycle } from '../types/performance.types';

export function useGoals(params?: { userId?: number; cycleId?: number; status?: string }) {
  const qc = useQueryClient();
  const goalsQuery = useQuery({
    queryKey: ['hr', 'goals', params ?? {}],
    queryFn: () => hrApi.getGoals(params),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['hr', 'goals'] });

  const createGoal = useMutation({
    mutationFn: (payload: Partial<HrGoal>) => hrApi.createGoal(payload),
    onSuccess: invalidate,
  });
  const updateGoal = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HrGoal> }) => hrApi.updateGoal(id, payload),
    onSuccess: invalidate,
  });
  const deleteGoal = useMutation({
    mutationFn: (id: number) => hrApi.deleteGoal(id),
    onSuccess: invalidate,
  });
  return { goalsQuery, createGoal, updateGoal, deleteGoal };
}

export function useReviewCycles() {
  const qc = useQueryClient();
  const cyclesQuery = useQuery({
    queryKey: ['hr', 'review-cycles'],
    queryFn: () => hrApi.getReviewCycles(),
  });
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['hr', 'review-cycles'] });
    qc.invalidateQueries({ queryKey: ['hr', 'reviews'] });
  };
  const createCycle = useMutation({
    mutationFn: (payload: Partial<HrReviewCycle>) => hrApi.createReviewCycle(payload),
    onSuccess: invalidate,
  });
  const updateCycle = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HrReviewCycle> }) => hrApi.updateReviewCycle(id, payload),
    onSuccess: invalidate,
  });
  const deleteCycle = useMutation({
    mutationFn: (id: number) => hrApi.deleteReviewCycle(id),
    onSuccess: invalidate,
  });
  return { cyclesQuery, createCycle, updateCycle, deleteCycle };
}

export function useReviews(params?: { cycleId?: number; userId?: number; status?: string }) {
  const qc = useQueryClient();
  const reviewsQuery = useQuery({
    queryKey: ['hr', 'reviews', params ?? {}],
    queryFn: () => hrApi.getReviews(params),
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['hr', 'reviews'] });

  const createReview = useMutation({
    mutationFn: (payload: Partial<HrPerformanceReview>) => hrApi.createReview(payload),
    onSuccess: invalidate,
  });
  const updateReview = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<HrPerformanceReview> }) => hrApi.updateReview(id, payload),
    onSuccess: invalidate,
  });
  const deleteReview = useMutation({
    mutationFn: (id: number) => hrApi.deleteReview(id),
    onSuccess: invalidate,
  });
  return { reviewsQuery, createReview, updateReview, deleteReview };
}

export function useReview(id: number | undefined) {
  return useQuery({
    queryKey: ['hr', 'review', id],
    queryFn: () => hrApi.getReview(id as number),
    enabled: !!id && id > 0,
  });
}