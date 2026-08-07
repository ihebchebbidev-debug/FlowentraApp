/**
 * useActiveCompany — the company (tenant) that owns whatever the user is
 * currently looking at. Each company keeps its own address/contact/legal/bank
 * details, so this is what report footers must be built from.
 */
import { useEffect, useMemo, useState } from 'react';
import { useTenantMap } from '@/contexts/TenantMapContext';
import { TARGET_TENANT_CHANGED_EVENT } from '@/utils/targetTenant';
import {
  pickActiveTenant,
  tenantToCompanyProfile,
  readCachedTenants,
  type CompanyProfile,
} from './activeCompany';

export type { CompanyProfile } from './activeCompany';
export {
  loadActiveCompany,
  invalidateActiveCompany,
  getActiveCompanySync,
  emptyCompanyProfile,
  tenantToCompanyProfile,
} from './activeCompany';

export function useActiveCompany(): { company: CompanyProfile; loaded: boolean } {
  const { tenants, loaded } = useTenantMap();
  // Re-resolve when the company switcher fires or Company Information is saved.
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const bump = () => setTick(t => t + 1);
    window.addEventListener('active-company-changed', bump);
    window.addEventListener(TARGET_TENANT_CHANGED_EVENT, bump);
    return () => {
      window.removeEventListener('active-company-changed', bump);
      window.removeEventListener(TARGET_TENANT_CHANGED_EVENT, bump);
    };
  }, []);

  const company = useMemo(() => {
    const list = tenants.length ? tenants : readCachedTenants();
    return tenantToCompanyProfile(pickActiveTenant(list));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenants, tick]);

  return { company, loaded };
}
