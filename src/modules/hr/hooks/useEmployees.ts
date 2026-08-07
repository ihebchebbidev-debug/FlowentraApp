import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '../services/hrApi';
import { usersApi } from '@/services/api/usersApi';
import type { UpdateUserRequest } from '@/types/users';
import type { EmployeeSalaryConfig } from '../types/hr.types';
import { getCurrentTenant, isViewAllMode } from '@/utils/tenant';
import { getSelectedTargetTenantId } from '@/utils/targetTenant';

/**
 * Resolve the active tenant scope for the HR module.
 * - tenant slug from X-Tenant (subdomain or override)
 * - selected company filter id (only meaningful in view-all mode)
 *
 * Including this in the queryKey ensures HR dashboard KPIs and the
 * employee list always share the same cache bucket per scope, and
 * stale rows from a previously-selected company can never leak in.
 */
function resolveTenantScope(): { slug: string; companyId: number | 'all' } {
  const slug = getCurrentTenant() ?? 'default';
  const companyId = isViewAllMode() ? (getSelectedTargetTenantId() ?? 'all') : 'all';
  return { slug, companyId };
}

/** Re-render when the company filter or tenant override changes (no page reload). */
function useTenantScope() {
  const [scope, setScope] = useState(resolveTenantScope);
  useEffect(() => {
    const refresh = () => setScope(resolveTenantScope());
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key.startsWith('companyFilter:') || e.key === 'tenant_override') refresh();
    };
    window.addEventListener('flowentra:target-tenant-changed', refresh);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('flowentra:target-tenant-changed', refresh);
      window.removeEventListener('storage', onStorage);
    };
  }, []);
  return scope;
}

export function useEmployees() {
  const qc = useQueryClient();
  const scope = useTenantScope();

  const employeesQuery = useQuery({
    // Tenant-scoped key — both HRDashboard and EmployeeList share this exact
    // key, so KPIs and the table can never disagree across tenants.
    queryKey: ['hr', 'employees', scope.slug, scope.companyId],
    queryFn: () => hrApi.getEmployees(),
  });

  const upsertSalaryConfig = useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: Partial<EmployeeSalaryConfig> }) =>
      hrApi.upsertSalaryConfig(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr', 'employees'] });
      qc.invalidateQueries({ queryKey: ['hr', 'employee'] });
    },
  });

  const updateUser = useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UpdateUserRequest }) =>
      usersApi.update(userId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['hr', 'employees'] });
      qc.invalidateQueries({ queryKey: ['hr', 'employee'] });
    },
  });

  return { employeesQuery, upsertSalaryConfig, updateUser, tenantScope: scope };
}
