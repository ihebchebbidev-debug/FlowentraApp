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
import { getCurrentTenant } from "@/utils/tenant";

export function RequireCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Wait for auth resolution before deciding.
  if (isLoading) return <>{children}</>;
  if (!isAuthenticated) return <>{children}</>;

  const current = getCurrentTenant();
  if (current) return <>{children}</>;

  return (
    <Navigate
      to="/select-company"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}

export default RequireCompany;
