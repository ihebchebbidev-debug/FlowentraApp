import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { planningProfilesApi } from '../services/planningProfilesApi';
import {
  DEFAULT_PLANNING_SETTINGS,
  type CreatePlanningProfileDto,
  type PlanningProfile,
  type UpdatePlanningProfileDto,
} from '../types/planningProfile';

const KEYS = {
  list: ['planning-profiles', 'list'] as const,
  active: ['planning-profiles', 'active'] as const,
};

export function usePlanningProfiles() {
  return useQuery({
    queryKey: KEYS.list,
    queryFn: () => planningProfilesApi.list(),
    staleTime: 30_000,
  });
}

export function useActivePlanningProfile() {
  const q = useQuery({
    queryKey: KEYS.active,
    queryFn: () => planningProfilesApi.getActive(),
    staleTime: 30_000,
  });
  // Stable identity — recompute only when the query data actually changes,
  // so downstream memos (visibleTechnicians, filteredAssignedJobs, …) don't
  // invalidate on every render.
  const settings = useMemo(
    () => ({ ...DEFAULT_PLANNING_SETTINGS, ...(q.data?.settings ?? {}) }),
    [q.data]
  );
  const visibleUserIds = useMemo(() => q.data?.visibleUserIds ?? [], [q.data]);
  const requiredSkillIds = useMemo(() => q.data?.requiredSkillIds ?? [], [q.data]);
  return {
    ...q,
    profile: q.data,
    settings,
    visibleUserIds,
    requiredSkillIds,
  };
}

export function usePlanningProfileMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: KEYS.list });
    qc.invalidateQueries({ queryKey: KEYS.active });
  };

  const create = useMutation({
    mutationFn: (dto: CreatePlanningProfileDto) => planningProfilesApi.create(dto),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: UpdatePlanningProfileDto }) =>
      planningProfilesApi.update(id, dto),
    onSuccess: (saved) => {
      // Eagerly populate the cache with the saved profile so the board
      // re-renders immediately without waiting for a background refetch.
      const active = qc.getQueryData<PlanningProfile>(KEYS.active);
      if (active && String(active.id) === String(saved.id)) {
        qc.setQueryData(KEYS.active, saved);
      }
      invalidate();
    },
  });
  const remove = useMutation({
    mutationFn: (id: string) => planningProfilesApi.remove(id),
    onSuccess: invalidate,
  });
  const setActive = useMutation({
    mutationFn: (id: string) => planningProfilesApi.setActive(id),
    onSuccess: invalidate,
  });
  const duplicate = useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      planningProfilesApi.duplicate(id, name),
    onSuccess: invalidate,
  });

  return { create, update, remove, setActive, duplicate };
}

export type { PlanningProfile };
