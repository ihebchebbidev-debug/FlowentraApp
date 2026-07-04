/**
 * RequireCompany — gates the dashboard behind an explicit company pick.
 *
 * Why: the app used to boot in VIEW_ALL_SENTINEL mode for main admins, which
 * silently disabled "Add" buttons and made every list look empty (filters
 * scoped to a null tenantId). Now we force the user to pick — or to
 * explicitly opt into "view all" — before any dashboard route renders.
 *
 * Behavior:
 *  - Not authenticated → fall through (children handle their own auth redirect)
 *  - Tenant pinned to a real slug → render
 *  - Tenant === VIEW_ALL_SENTINEL → render (admin opt-in audit mode)
 *  - Tenant null/missing → redirect to /select-company
 */
import { type ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantMap } from "@/contexts/TenantMapContext";
import {
  getActiveCompanyId,
  isActiveCompanyViewAll,
  onTargetTenantChanged,
  setActiveCompany,
} from "@/utils/targetTenant";

export function RequireCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { loaded: tenantsLoaded, tenants } = useTenantMap();
  const location = useLocation();
  const [, tenantRevision] = useState(0);

  useEffect(() => onTargetTenantChanged(() => setTenantRevision((n) => n + 1)), []);

  const activeTenants = tenants.filter((t) => t.isActive !== false);

  useEffect(() => {
    if (!tenantsLoaded || !isAuthenticated) return;
    if (getActiveCompanyId() !== undefined || isActiveCompanyViewAll()) return;
    if (activeTenants.length !== 1) return;
    setActiveCompany({ id: activeTenants[0].id });
  }, [tenantsLoaded, isAuthenticated, activeTenants]);

  void tenantRevision;

  if (isLoading) return null;
  if (!isAuthenticated) return <>{children}</>;
  if (!tenantsLoaded) return null;

  if (getActiveCompanyId() !== undefined || isActiveCompanyViewAll()) {
    return <>{children}</>;
  }

  // One company: wait for the effect above to pin before redirecting.
  if (activeTenants.length === 1) return null;

  return (
    <Navigate
      to="/select-company"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}

export default RequireCompany;
