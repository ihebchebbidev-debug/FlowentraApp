/**
 * Active company resolution — PER COMPANY, never shared.
 *
 * Every company (tenant) row owns its contact/address/legal/bank details.
 * These helpers resolve the company that the current view (and therefore any
 * report generated from it) belongs to, so a PDF footer always prints the
 * owning company's identity and never another company's.
 *
 * Resolution order (same one CompanySettings uses):
 *   1. explicit active company id (company switcher / localStorage)
 *   2. the only company the user has access to
 *   3. the default company
 */
import { tenantsApi, type Tenant } from '@/services/api/tenantsApi';
import { getCurrentTenant } from '@/utils/tenant';
import { getActiveCompanyId, TARGET_TENANT_CHANGED_EVENT } from '@/utils/targetTenant';

const CACHE_KEY_PREFIX = 'tenants:cache:v2:';

/** Normalised, company-scoped identity used to build report footers. */
export interface CompanyProfile {
  id?: number;
  name: string;
  tagline: string;
  address: string;
  city: string;
  postalCode: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  taxId: string;
  registrationNumber: string;
  shareCapital: string;
  bankName: string;
  bankAccount: string;
  bankSwift: string;
  footerMessage: string;
}

export const emptyCompanyProfile: CompanyProfile = {
  name: '',
  tagline: '',
  address: '',
  city: '',
  postalCode: '',
  state: '',
  country: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  registrationNumber: '',
  shareCapital: '',
  bankName: '',
  bankAccount: '',
  bankSwift: '',
  footerMessage: '',
};

const str = (v: unknown): string => (typeof v === 'string' ? v.trim() : '');

/** Map a raw Tenant row onto the normalised profile shape. */
export function tenantToCompanyProfile(tenant: Tenant | null | undefined): CompanyProfile {
  if (!tenant) return { ...emptyCompanyProfile };
  return {
    id: tenant.id,
    name: str(tenant.companyName),
    tagline: str(tenant.companyTagline),
    address: str(tenant.companyAddress),
    city: str(tenant.companyCity),
    postalCode: str(tenant.companyPostalCode),
    state: str(tenant.companyState),
    country: str(tenant.companyCountry),
    phone: str(tenant.companyPhone),
    email: str(tenant.companyEmail),
    website: str(tenant.companyWebsite),
    taxId: str(tenant.taxId),
    registrationNumber: str(tenant.registrationNumber),
    shareCapital: str(tenant.shareCapital),
    bankName: str(tenant.bankName),
    bankAccount: str(tenant.bankAccount),
    bankSwift: str(tenant.bankSwift),
    footerMessage: str(tenant.reportFooterMessage),
  };
}

/** Pick the active company out of a tenant list. */
export function pickActiveTenant(tenants: Tenant[]): Tenant | undefined {
  if (!tenants.length) return undefined;
  const activeId = getActiveCompanyId();
  if (activeId !== undefined) {
    const match = tenants.find(t => t.id === activeId);
    if (match) return match;
  }
  if (tenants.length === 1) return tenants[0];
  return tenants.find(t => t.isDefault) ?? tenants[0];
}

/** Read the tenant list the TenantMapProvider already cached (same key). */
export function readCachedTenants(): Tenant[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`${CACHE_KEY_PREFIX}${getCurrentTenant() ?? '__default__'}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Tenant[]) : [];
  } catch {
    return [];
  }
}

const _memo = new Map<string, { profile: CompanyProfile; at: number }>();
const MEMO_TTL_MS = 30_000;

/** Drop the memoised profile — call after saving Company Information. */
export function invalidateActiveCompany(): void {
  _memo.clear();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('active-company-changed'));
  }
}

// Switching company must never let a stale profile survive: the next report
// would print the previous company's footer.
if (typeof window !== 'undefined') {
  window.addEventListener(TARGET_TENANT_CHANGED_EVENT, () => {
    _memo.clear();
  });
}

/**
 * Resolve the active company's profile for non-React callers.
 * Serves instantly from the tenant cache; only hits the API when the cache is
 * empty, so report generation never blocks on a round-trip.
 */
export async function loadActiveCompany(ownerTenantId?: number): Promise<CompanyProfile> {
  const key = ownerTenantId ? `id:${ownerTenantId}` : 'active';
  const hit = _memo.get(key);
  if (hit && Date.now() - hit.at < MEMO_TTL_MS) return hit.profile;

  let tenants = readCachedTenants();
  const needsFetch = !tenants.length
    || (ownerTenantId !== undefined && !tenants.some(t => t.id === ownerTenantId));
  if (needsFetch) {
    try {
      tenants = await tenantsApi.list();
    } catch {
      /* keep whatever the cache gave us */
    }
  }
  // A record printed in cross-company mode must show ITS OWN company's footer,
  // so an explicit owner id always wins over the active-company selection.
  const owner = ownerTenantId !== undefined
    ? tenants.find(t => t.id === ownerTenantId)
    : undefined;
  const profile = tenantToCompanyProfile(owner ?? pickActiveTenant(tenants));
  _memo.set(key, { profile, at: Date.now() });
  return profile;
}

/** Synchronous best-effort variant (cache only). */
export function getActiveCompanySync(): CompanyProfile {
  const hit = _memo.get('active');
  if (hit) return hit.profile;
  return tenantToCompanyProfile(pickActiveTenant(readCachedTenants()));
}
