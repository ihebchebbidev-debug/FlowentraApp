/**
 * Hook to manage target tenant state in create/edit forms.
 * Automatically clears the target tenant on unmount.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { setTargetTenantId, clearTargetTenant, getSelectedTargetTenantId } from '@/utils/targetTenant';
import { isViewAllMode } from '@/utils/tenant';
import { useUserType } from '@/hooks/useUserType';
import { useTenantMap } from '@/contexts/TenantMapContext';

/**
 * @param initialTenantId - For edit forms, pass the record's existing tenantId
 */
export function useTargetTenant(initialTenantId?: number) {
  const { isMainAdminUser } = useUserType();
  const { tenants, loaded: tenantsLoaded } = useTenantMap();
  // Regular users never operate in view-all targeting mode — backend uses
  // their session tenant. Only main admins can pick a target company.
  const viewAll = isMainAdminUser && isViewAllMode();
  const [targetTenantId, setLocalTenantId] = useState<number | undefined>(initialTenantId ?? getSelectedTargetTenantId());
  const autoSelected = useRef(false);

  // Auto-preselect the first company when in view-all mode and nothing is selected.
  // For single-company users (or when only one tenant exists), this always picks
  // the default (tenantId maps to data-table 0).
  useEffect(() => {
    if (!viewAll || !tenantsLoaded || autoSelected.current) return;
    if (targetTenantId !== undefined) return; // already selected

    const firstTenant = tenants[0];
    if (firstTenant) {
      autoSelected.current = true;
      setLocalTenantId(firstTenant.id);
      setTargetTenantId(firstTenant.id);
    }
  }, [viewAll, tenantsLoaded, tenants, targetTenantId]);

  // Sync with global store
  useEffect(() => {
    if (viewAll && targetTenantId !== undefined) {
      setTargetTenantId(targetTenantId);
    }
    return () => {
      clearTargetTenant();
    };
  }, [viewAll, targetTenantId]);

  const handleTenantChange = useCallback((tenantId: number) => {
    setLocalTenantId(tenantId);
    setTargetTenantId(tenantId);
  }, []);

  /**
   * Returns true if a target tenant is required but not selected.
   * Use in form submit handlers to block submission.
   *
   * We check targetTenantId directly instead of going through
   * getSelectedTargetTenantId() because that function always returns
   * undefined in view-all mode (by design — it signals "no single
   * company" to the interceptor). What we want here is simply: did the
   * user pick a company in this form yet?
   */
  const isTenantRequired = viewAll && (targetTenantId === undefined || targetTenantId === null);

  return {
    viewAll,
    targetTenantId,
    handleTenantChange,
    /** True when in view-all mode and no tenant has been selected yet */
    isTenantRequired,
    /** Available tenants for the selector */
    tenants,
    tenantsLoaded,
  };
}
