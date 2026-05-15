import { useEffect } from 'react';
import { getCurrentTenant, isViewAllMode } from '@/utils/tenant';
import { useTenantMap } from '@/contexts/TenantMapContext';

const BASE_SUFFIX = 'Flowentra';

function toTitleCase(slug: string): string {
  return slug
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Sets `document.title` to the current tenant's company name (or a
 * Title-Cased version of the slug as fallback) so each subdomain
 * (krossier.flowentra.app, demo.flowentra.app, dev.flowentra.app, …)
 * shows its own name in the browser tab.
 */
export function useTenantDocumentTitle() {
  const { tenants, loaded } = useTenantMap();

  useEffect(() => {
    const slug = getCurrentTenant();

    // View-all mode: keep generic brand title
    if (!slug || isViewAllMode()) {
      document.title = `${BASE_SUFFIX} - CRM & Service Management`;
      return;
    }

    // Prefer the real company name when we have it cached
    const match = loaded
      ? tenants.find((t) => t.slug?.toLowerCase() === slug.toLowerCase())
      : undefined;

    const name = match?.companyName?.trim() || toTitleCase(slug);
    document.title = `${name} | ${BASE_SUFFIX}`;
  }, [tenants, loaded]);
}
