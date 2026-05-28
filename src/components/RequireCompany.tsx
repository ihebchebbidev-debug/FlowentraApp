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
import { type ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantMap } from "@/contexts/TenantMapContext";
import { getActiveCompanyId, isActiveCompanyViewAll } from "@/utils/targetTenant";

export function RequireCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { loaded: tenantsLoaded } = useTenantMap();
  const location = useLocation();

  // Wait for auth + tenant map. Returning children while loading caused the
  // dashboard to mount before headers were resolvable, producing the brief
  // 428 "company_required" burst on every reload.
  if (isLoading) return null;
  if (!isAuthenticated) return <>{children}</>;
  if (!tenantsLoaded) return null;

  // Pass-through if the user has picked a company OR opted into view-all
  // (TenantMapContext auto-pins single-tenant accounts before this runs).
  if (getActiveCompanyId() !== undefined || isActiveCompanyViewAll()) {
    return <>{children}</>;
  }

  return (
    <Navigate
      to="/select-company"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}

export default RequireCompany;
