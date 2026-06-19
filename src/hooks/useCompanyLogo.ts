import { useSyncExternalStore } from 'react';
import flowentraLogo from '@/assets/flowentra-logo.png';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { API_URL } from '@/config/api';
import { dedupFetch } from '@/utils/requestDedup';

const LOGO_STORAGE_KEY = 'company-logo';
const LOGO_EVENT = 'logo-updated';

// ============================================================================
// GLOBAL SINGLETON — returns a DIRECT IMAGE URL (not base64)
// For <img> tags we just need the URL. Only PDFs need base64 (handled separately).
//
// The CompanyLogoUrl in MainAdminUser is a relative path like:
//   "uploads/company/20260210120935163_495c4c80_krossier-logo.png"
// Full URL: https://api.flowentra.app/uploads/company/...
// ============================================================================

let globalLogoUrl: string = '';
let globalLogoRef: string | null = null;
let fetchInFlight: Promise<void> | null = null;
const subscribers = new Set<() => void>();

function notifySubscribers() {
  subscribers.forEach(cb => cb());
}

function getSnapshot(): string {
  return globalLogoUrl;
}

function subscribe(cb: () => void): () => void {
  subscribers.add(cb);
  return () => { subscribers.delete(cb); };
}

/** Build the full absolute URL for a logo ref (relative path or already absolute) */
function buildLogoUrl(ref: string): string {
  if (!ref) return '';
  if (ref.startsWith('data:') || ref.startsWith('blob:') || ref.startsWith('http')) return ref;
  // Relative path like "uploads/company/..." → prepend API_URL
  return `${API_URL}/${ref.replace(/^\//, '')}`;
}

/**
 * Sentinel stored in LOGO_STORAGE_KEY to mean "the active tenant has no
 * logo — do NOT fall back to the MainAdmin's logo from user_data."
 */
const NO_LOGO_SENTINEL = '__none__';

/** True when a per-tenant active company is currently selected. */
function hasActiveCompanyContext(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.localStorage.getItem('active_company_view_all') === 'true') return true;
    const raw = window.localStorage.getItem('active_company_id');
    return raw !== null && raw !== '';
  } catch {
    return false;
  }
}

/** Resolve the current logo ref from localStorage */
function resolveLogoRef(): string | null {
  const stored = localStorage.getItem(LOGO_STORAGE_KEY);
  if (stored === NO_LOGO_SENTINEL) return null;
  if (stored) return stored;

  // When a per-tenant company is active, NEVER fall back to the MainAdmin's
  // logo stored in user_data — that would override the active tenant logo.
  if (hasActiveCompanyContext()) return null;

  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.companyLogoUrl) {
        localStorage.setItem(LOGO_STORAGE_KEY, parsed.companyLogoUrl);
        return parsed.companyLogoUrl;
      }
    }
  } catch { /* ignore */ }
  return null;
}

/**
 * Try to get logo URL from the PUBLIC endpoint /api/Auth/company-logo.
 * Works WITHOUT authentication — essential for the login page.
 */
async function fetchLogoUrlPublic(): Promise<string> {
  try {
    // First check if admin exists — if not, skip fetching (use default logo)
    const tenant = getCurrentTenant();
    try {
      const adminCheckRes = await dedupFetch(`${API_URL}/api/Auth/admin-exists`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(tenant && { [TENANT_HEADER]: tenant }),
        },
      });
      if (adminCheckRes.ok) {
        const adminData = await adminCheckRes.json();
        if (!adminData.adminExists) return ''; // No admin yet → use default logo
      }
    } catch { /* continue to try logo endpoint */ }

    const res = await fetch(`${API_URL}/api/Auth/company-logo`, {
      method: 'GET',
      headers: {
        Accept: 'application/json,image/*',
        ...(tenant && { [TENANT_HEADER]: tenant }),
      },
    });
    if (!res.ok) return '';

    const contentType = res.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data.logoBase64) return data.logoBase64;
      if (data.logoUrl) return buildLogoUrl(data.logoUrl);
      return '';
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Core load — resolves the logo URL (not base64, just a usable URL).
 */
async function loadLogoGlobal() {
  // Always check if admin exists first — prevents stale logos when no admin is set up
  const isLoggedIn = !!localStorage.getItem('access_token');
  
  if (!isLoggedIn) {
    // On the login page: always validate via the public endpoint
    // This prevents stale localStorage values from showing a previous admin's logo
    try {
      const tenant = getCurrentTenant();
      const adminCheckRes = await dedupFetch(`${API_URL}/api/Auth/admin-exists`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          ...(tenant && { [TENANT_HEADER]: tenant }),
        },
      });
      if (adminCheckRes.ok) {
        const adminData = await adminCheckRes.json();
        if (!adminData.adminExists) {
          // No admin → clear any stale cached logo and use default
          localStorage.removeItem(LOGO_STORAGE_KEY);
          globalLogoUrl = '';
          globalLogoRef = null;
          fetchInFlight = null;
          notifySubscribers();
          return;
        }
        // Admin exists — check if they have a logo via the companyLogoUrl field
        const logoUrl = adminData.companyLogoUrl || adminData.CompanyLogoUrl;
        if (logoUrl) {
          globalLogoUrl = buildLogoUrl(logoUrl);
          globalLogoRef = logoUrl;
          localStorage.setItem(LOGO_STORAGE_KEY, logoUrl);
          notifySubscribers();
          return;
        }
      }
    } catch { /* fall through to normal resolution */ }

    // Try the dedicated company-logo endpoint as fallback
    const publicUrl = await fetchLogoUrlPublic();
    if (publicUrl) {
      globalLogoUrl = publicUrl;
      globalLogoRef = '__public__';
      notifySubscribers();
      return;
    }

    // No logo found — use default
    globalLogoUrl = '';
    globalLogoRef = null;
    fetchInFlight = null;
    notifySubscribers();
    return;
  }

  // Logged-in flow: use localStorage ref
  const storedRaw = localStorage.getItem(LOGO_STORAGE_KEY);
  const explicitNone = storedRaw === NO_LOGO_SENTINEL;
  const logoRef = resolveLogoRef();

  if (!logoRef) {
    // No per-company logo resolved. Unless a company explicitly has NO logo,
    // mirror the login page: fetch the current tenant's (subdomain) company
    // logo from the public endpoint so the sidebar shows the brand instead of
    // the default Flowentra mark. (Common case: user.companyLogoUrl is empty.)
    if (!explicitNone) {
      // Avoid refetch loops once the public logo is already resolved.
      if (globalLogoRef === '__public__' && globalLogoUrl) return;
      const publicUrl = await fetchLogoUrlPublic();
      if (publicUrl) {
        globalLogoUrl = publicUrl;
        globalLogoRef = '__public__';
        fetchInFlight = null;
        notifySubscribers();
        return;
      }
    }
    globalLogoUrl = '';
    globalLogoRef = null;
    fetchInFlight = null;
    notifySubscribers();
    return;
  }

  // Same ref already resolved → nothing to do
  if (logoRef === globalLogoRef && globalLogoUrl) return;

  // Already fetching → skip
  if (fetchInFlight && logoRef === globalLogoRef) return;

  globalLogoRef = logoRef;

  // For doc:{id} refs, we need to resolve via API
  const docMatch = logoRef.match(/^doc:(\d+)$/);
  if (docMatch) {
    const promise = (async () => {
      const publicUrl = await fetchLogoUrlPublic();
      if (publicUrl) {
        globalLogoUrl = publicUrl;
        notifySubscribers();
        return;
      }
      globalLogoUrl = `${API_URL}/api/Documents/download/${docMatch[1]}`;
      notifySubscribers();
    })();
    fetchInFlight = promise;
    await promise;
    fetchInFlight = null;
    return;
  }

  // Direct path/URL — just build the absolute URL
  globalLogoUrl = buildLogoUrl(logoRef);
  notifySubscribers();
}

// ============================================================================
// BOOTSTRAP — runs once at module load time
// ============================================================================
if (typeof window !== 'undefined') {
  const ref = resolveLogoRef();
  if (ref) {
    const docMatch = ref.match(/^doc:(\d+)$/);
    if (docMatch) {
      // Need async resolution for doc: refs
      loadLogoGlobal();
    } else {
      // Direct path — resolve synchronously
      globalLogoUrl = buildLogoUrl(ref);
      globalLogoRef = ref;
    }
  } else {
    // No ref — try public endpoint async
    loadLogoGlobal();
  }

  window.addEventListener(LOGO_EVENT, () => loadLogoGlobal());
  window.addEventListener('storage', (e) => {
    if (e.key === LOGO_STORAGE_KEY || e.key === 'user_data') {
      loadLogoGlobal();
    }
  });
}

/**
 * React hook — returns the company logo as a direct URL.
 * Instant for path-based logos. Shared across all components. Zero flicker.
 */
export function useCompanyLogo(): string {
  const logo = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return logo || flowentraLogo;
}

/**
 * React hook — returns the company logo URL and whether it's the default logo.
 */
export function useCompanyLogoWithDefault(): { logo: string; isDefault: boolean } {
  const logo = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isDefault = !logo;
  return { logo: logo || flowentraLogo, isDefault };
}

/**
 * Get the currently resolved logo URL from the global singleton.
 * Non-reactive — use useCompanyLogo() for React components.
 */
export function getResolvedLogo(): string {
  return globalLogoUrl || flowentraLogo;
}

/**
 * Update the company logo reference and trigger re-resolve.
 * Pass doc:{id}, a relative path, a URL, or null to clear.
 */
export function setCompanyLogo(ref: string | null) {
  if (ref) {
    localStorage.setItem(LOGO_STORAGE_KEY, ref);
  } else {
    localStorage.removeItem(LOGO_STORAGE_KEY);
  }
  // Drop cached PDF base64 so reports re-fetch the new logo.
  try { localStorage.removeItem('company-logo-blob-data'); } catch { /* ignore */ }
  globalLogoRef = null; // Force re-resolve
  globalLogoUrl = '';
  window.dispatchEvent(new CustomEvent(LOGO_EVENT, { detail: ref || '' }));
}

/**
 * Mark "the active tenant explicitly has no logo" so the singleton uses the
 * default flowentra logo and does NOT fall back to the MainAdmin's user_data
 * logo. Use this when switching to a tenant whose companyLogoUrl is empty.
 */
export function setCompanyLogoExplicitNone() {
  localStorage.setItem(LOGO_STORAGE_KEY, NO_LOGO_SENTINEL);
  try { localStorage.removeItem('company-logo-blob-data'); } catch { /* ignore */ }
  globalLogoRef = null;
  globalLogoUrl = '';
  window.dispatchEvent(new CustomEvent(LOGO_EVENT, { detail: '' }));
}
