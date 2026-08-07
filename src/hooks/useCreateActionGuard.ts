/**
 * useCreateActionGuard
 *
 * Reactive hook that tells UI primitives whether "Create" actions should be
 * disabled because the user is in cross-company view-all mode and has not yet
 * picked a target company. When that's the case:
 *  - `disabled` is true (button should not submit)
 *  - `reason` is a translated, user-facing message for tooltips
 *  - `requiresCompanySelection` mirrors `disabled` but reads more naturally
 *
 * The hook subscribes to:
 *  - tenant overrides (TenantSwitcher reloads the page; nothing to listen to)
 *  - target tenant changes (CompanyFilter writes localStorage `companyFilter:*`
 *    and dispatches a `storage` event in other tabs; same-tab updates are
 *    surfaced by polling lightly + listening to a custom event we emit when
 *    setTargetTenantId is called below).
 *
 * Regular (non-main-admin) users are never gated — backend uses their session
 * tenant automatically.
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { isViewAllMode } from '@/utils/tenant';
import { getSelectedTargetTenantId } from '@/utils/targetTenant';
import { useUserType } from '@/hooks/useUserType';
import { useTenantMap } from '@/contexts/TenantMapContext';

export const TARGET_TENANT_CHANGED_EVENT = 'flowentra:target-tenant-changed';

/** Notify same-tab listeners that the target tenant selection changed. */
export function emitTargetTenantChanged(): void {
  if (typeof window === 'undefined') return;
  try {
    window.dispatchEvent(new CustomEvent(TARGET_TENANT_CHANGED_EVENT));
  } catch {
    // ignore (older browsers)
  }
}

export interface CreateActionGuard {
  /** True when the create action should be blocked. */
  disabled: boolean;
  /** Same as `disabled`, kept for readability at call sites. */
  requiresCompanySelection: boolean;
  /** Translated, user-facing reason — safe to show inside a tooltip. */
  reason: string;
  /** True when the user is in cross-company view-all mode (regardless of selection). */
  viewAll: boolean;
}

export function useCreateActionGuard(): CreateActionGuard {
  const { t } = useTranslation('settings');
  const { isMainAdminUser } = useUserType();
  // When the workspace only has 0 or 1 company there is nothing to "select" —
  // the backend always resolves to that single tenant. Skip the guard entirely
  // so single-company deployments never see the tooltip or disabled state.
  const { tenants, loaded: tenantsLoaded } = useTenantMap();
  const multiCompany = tenantsLoaded && tenants.length > 1;

  const compute = useCallback(() => {
    const viewAll = isMainAdminUser && multiCompany && isViewAllMode();
    const hasTarget = getSelectedTargetTenantId() !== undefined;
    return { viewAll, hasTarget };
  }, [isMainAdminUser, multiCompany]);

  const [state, setState] = useState(compute);

  useEffect(() => {
    setState(compute());

    const refresh = () => setState(compute());

    const onStorage = (event: StorageEvent) => {
      if (!event.key) return refresh();
      if (event.key.startsWith('companyFilter:') || event.key === 'tenant_override') {
        refresh();
      }
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener(TARGET_TENANT_CHANGED_EVENT, refresh);
    // Re-check on focus in case another tab/component updated state silently.
    window.addEventListener('focus', refresh);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener(TARGET_TENANT_CHANGED_EVENT, refresh);
      window.removeEventListener('focus', refresh);
    };
  }, [compute]);

  return useMemo<CreateActionGuard>(() => {
    const disabled = state.viewAll && !state.hasTarget;
    return {
      viewAll: state.viewAll,
      disabled,
      requiresCompanySelection: disabled,
      reason: disabled
        ? t(
            'tenant.createBlockedSelectCompany',
            'You are viewing all companies. Select a target company first to create new records.',
          )
        : '',
    };
  }, [state.hasTarget, state.viewAll, t]);
}

/**
 * useMutationActionGuard — same logic as `useCreateActionGuard` but with a
 * tooltip phrased for edit / update / delete flows. Single-company workspaces
 * are short-circuited (never disabled) just like the create guard.
 */
export function useMutationActionGuard(): CreateActionGuard {
  const base = useCreateActionGuard();
  const { t } = useTranslation('settings');
  return useMemo<CreateActionGuard>(() => ({
    ...base,
    reason: base.disabled
      ? t(
          'tenant.mutationBlockedSelectCompany',
          'You are viewing all companies. Select a target company first to modify records.',
        )
      : '',
  }), [base, t]);
}