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

  // Auto-pin when there is only one company — no picker needed.
  useEffect(() => {
    if (!tenantsLoaded || !isAuthenticated) return;
    if (hasActiveCompanySelection()) return;
    if (activeTenants.length !== 1) return;
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

  // Still pinning the sole company — hold the gate briefly.
  if (activeTenants.length === 1) return null;

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

  // Zero companies (setup not finished) — send to /onboarding.
  // The company picker is only meaningful when there are 2+ companies.
  return (
    <Navigate
      to="/onboarding"
      replace
      state={{ from: location.pathname + location.search }}
    />
  );
}

export default RequireCompany;
