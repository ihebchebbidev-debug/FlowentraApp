import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Department } from '../types/hr.types';
import { hrApi } from '../services/hrApi';

export function useDepartments() {
  const qc = useQueryClient();

  const departmentsQuery = useQuery({
    queryKey: ['hr', 'departments'],
    queryFn: () => hrApi.getDepartments(),
  });

  const createDepartment = useMutation({
    mutationFn: (payload: Partial<Department>) => hrApi.createDepartment(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'departments'] }),
  });

  const updateDepartment = useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: Partial<Department> }) =>
      hrApi.updateDepartment(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'departments'] }),
  });

  const deleteDepartment = useMutation({
    mutationFn: (id: number) => hrApi.deleteDepartment(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['hr', 'departments'] }),
  });

  return {
    departmentsQuery,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
}
