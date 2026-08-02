/**
 * RequireCompany — gates the dashboard behind an explicit company pick.
 *
 * Single-company accounts are auto-pinned here — they never see /select-company.
 * The picker is only used when a main admin owns 2+ companies and none is pinned yet.
 */
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantMap } from "@/contexts/TenantMapContext";
import {
  onTargetTenantChanged,
} from "@/utils/targetTenant";
import {
  filterActiveTenants,
  hasActiveCompanySelection,
  isCompanyLockedUser,
  isMainAdminFromStorage,
  pinActiveCompanyFromList,
  shouldShowCompanyPicker,
} from "@/utils/bootstrapCompany";

export function RequireCompany({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const { loaded: tenantsLoaded, tenants, refetch } = useTenantMap();
  const location = useLocation();
  const [tenantRevision, setTenantRevision] = useState(0);
  const [resolving, setResolving] = useState(false);
  const emptyResolveRef = useRef(false);

  useEffect(() => onTargetTenantChanged(() => setTenantRevision((n) => n + 1)), []);

  const activeTenants = filterActiveTenants(tenants);
  const mainAdmin = isMainAdminFromStorage();

  // Auto-pin whenever no picker is needed:
  //  • single company (anyone), or
  //  • a regular user locked to their own company (JWT tenant_id), even when
  //    the database holds several companies.
  useEffect(() => {
    if (!tenantsLoaded || !isAuthenticated) return;
    if (hasActiveCompanySelection()) return;
    if (activeTenants.length === 0) return;
    if (shouldShowCompanyPicker(activeTenants, mainAdmin)) return;
    pinActiveCompanyFromList(activeTenants, mainAdmin);
  }, [tenantsLoaded, isAuthenticated, activeTenants, mainAdmin]);

  // Stale empty cache: refetch once before deciding where to send the user.
  useEffect(() => {
    if (!tenantsLoaded || !isAuthenticated || resolving || emptyResolveRef.current) return;
    if (hasActiveCompanySelection()) return;
    if (activeTenants.length > 0) return;

    emptyResolveRef.current = true;
    setResolving(true);
    void refetch({ bustCache: true }).then((fresh) => {
      if (!hasActiveCompanySelection()) {
        pinActiveCompanyFromList(fresh, mainAdmin);
      }
      setResolving(false);
    });
  }, [tenantsLoaded, isAuthenticated, activeTenants.length, refetch, resolving, mainAdmin]);

  void tenantRevision;

  if (isLoading || !tenantsLoaded || resolving) return null;
  if (!isAuthenticated) return <>{children}</>;
  if (hasActiveCompanySelection()) return <>{children}</>;

  // Still pinning (single company, or a company-locked staff account).
  if (activeTenants.length > 0 && !shouldShowCompanyPicker(activeTenants, mainAdmin)) {
    return null;
  }

  // Picker only for main admins with multiple companies.
  if (shouldShowCompanyPicker(tenants, mainAdmin)) {
    return (
      <Navigate
        to="/select-company"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  // Zero companies. Only the workspace owner can create one, so staff accounts
  // must not be bounced into the onboarding wizard (it would loop forever).
  if (!mainAdmin && isCompanyLockedUser()) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center p-6">
        <div className="max-w-md space-y-2 text-center">
          <h1 className="text-lg font-semibold text-foreground">No company assigned</h1>
          <p className="text-sm text-muted-foreground">
            Your account is not linked to an active company yet. Please contact your
            administrator to be assigned to one.
          </p>
        </div>
      </div>
    );
  }

  // Setup not finished — send the owner to /onboarding.
  return (
    <Navigate
      to="/onboarding"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}

export default RequireCompany;
