import { getResolvedLogo } from '@/hooks/useCompanyLogo';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import { API_URL } from '@/config/api';

/**
 * True when an explicit active company (or "view all") is currently selected.
 * Used to PREVENT the MainAdmin's global logo from leaking into a tenant's
 * PDF when that tenant has no logo of its own.
 */
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


/**
 * Get the company logo reference from localStorage.
 */
export function getCompanyLogoRef(): string {
  try {
    const direct = localStorage.getItem('company-logo');
    if (direct) return direct;
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed?.companyLogoUrl) {
        localStorage.setItem('company-logo', parsed.companyLogoUrl);
        return parsed.companyLogoUrl;
      }
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Get the cached base64 logo synchronously from localStorage.
 */
export function getCompanyLogoCachedBase64(): string {
  try {
    const raw = localStorage.getItem('company-logo-blob-data');
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.dataUrl || '';
  } catch {
    return '';
  }
}

/** Build an absolute URL from a relative path */
function buildLogoUrl(ref: string): string {
  if (!ref) return '';
  if (ref.startsWith('data:') || ref.startsWith('blob:') || ref.startsWith('http')) return ref;
  return `${API_URL}/${ref.replace(/^\//, '')}`;
}

/** Convert a Blob to a base64 data URL */
function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(blob);
  });
}

/**
 * Fetch an image URL and convert to base64 data URL.
 * Validates content-type to avoid converting HTML error pages.
 */
async function fetchImageAsBase64(url: string): Promise<string> {
  try {
    const token = localStorage.getItem('access_token');
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return '';
    const ct = res.headers.get('content-type') || '';
    if (!ct.startsWith('image/')) return ''; // Don't convert HTML/JSON to base64
    const blob = await res.blob();
    if (blob.size === 0) return '';
    return await blobToDataUrl(blob);
  } catch {
    return '';
  }
}

/**
 * Fetch the logo via the public API endpoint /api/Auth/company-logo.
 * This endpoint is an API route with proper CORS headers, unlike static file paths.
 */
async function fetchLogoViaApi(): Promise<string> {
  try {
    const token = localStorage.getItem('access_token');
    const tenant = getCurrentTenant();
    const res = await fetch(`${API_URL}/api/Auth/company-logo`, {
      method: 'GET',
      headers: {
        Accept: 'image/*,application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenant && { [TENANT_HEADER]: tenant }),
      },
    });
    if (!res.ok) return '';

    const contentType = res.headers.get('content-type') || '';

    // If the endpoint returns image binary directly
    if (contentType.startsWith('image/')) {
      const blob = await res.blob();
      if (blob.size === 0) return '';
      return await blobToDataUrl(blob);
    }

    // If it returns JSON with logoBase64 or logoUrl
    if (contentType.includes('application/json')) {
      const data = await res.json();
      if (data.logoBase64 && data.logoBase64.startsWith('data:image/')) return data.logoBase64;
      // Don't attempt to fetch raw URLs — they cause CORS errors.
      // Use /api/Auth/company-logo-base64 instead.
    }

    return '';
  } catch {
    return '';
  }
}

/**
 * Convert image URL to base64 using an HTML Image element + Canvas.
 * This works when the server sends proper CORS headers or for same-origin images.
 */
function convertViaCanvas(url: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(''); return; }
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } catch { resolve(''); }
    };
    img.onerror = () => resolve('');
    img.src = url;
  });
}

/**
 * Wait for the global logo singleton to resolve.
 */
function waitForResolvedLogo(maxWaitMs = 3000): Promise<string> {
  return new Promise((resolve) => {
    const resolved = getResolvedLogo();
    if (resolved) { resolve(resolved); return; }
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 100;
      const logo = getResolvedLogo();
      if (logo) { clearInterval(interval); resolve(logo); }
      else if (elapsed >= maxWaitMs) { clearInterval(interval); resolve(''); }
    }, 100);
  });
}

const LOGO_B64_CACHE_KEY = 'company-logo-blob-data';

/** Save base64 logo to localStorage cache (with optional source URL for invalidation) */
function cacheBase64(base64: string, sourceUrl?: string) {
  if (!base64 || !base64.startsWith('data:image/')) return;
  try {
    localStorage.setItem(
      LOGO_B64_CACHE_KEY,
      JSON.stringify({ dataUrl: base64, sourceUrl: sourceUrl || '', ts: Date.now() }),
    );
  } catch { /* quota exceeded */ }
}

/** Read cached base64 logo (max 24h old) */
function readCachedBase64(): string {
  try {
    const raw = localStorage.getItem(LOGO_B64_CACHE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    const age = Date.now() - (parsed.ts || 0);
    if (age > 24 * 60 * 60 * 1000) return ''; // expired
    return parsed?.dataUrl || '';
  } catch {
    return '';
  }
}

/** Read the source URL recorded when the cached base64 was stored, if any. */
function readCachedBase64Source(): string {
  try {
    const raw = localStorage.getItem(LOGO_B64_CACHE_KEY);
    if (!raw) return '';
    const parsed = JSON.parse(raw);
    return parsed?.sourceUrl || '';
  } catch {
    return '';
  }
}

/**
 * Get company logo as base64 for use in PDFs and reports.
 * Uses multiple strategies with proper fallback chain.
 * This is the ONLY place that converts to base64 — for react-pdf compatibility.
 */
export async function getCompanyLogoBase64(preloadedLogo?: string): Promise<string> {
  // === FAST PATH: already base64 ===
  if (preloadedLogo?.startsWith('data:image/')) return preloadedLogo;

  // === STRATEGY 1: Cached base64 from previous successful conversion ===
  // Only trust the cache when no explicit preloadedLogo is given, OR when the
  // cached URL matches the preloaded one. Otherwise switching companies could
  // serve the previous tenant's cached logo in the new tenant's report.
  const cached = readCachedBase64();
  const cachedSourceUrl = readCachedBase64Source();
  if (cached) {
    if (!preloadedLogo || !preloadedLogo.startsWith('http')) return cached;
    if (cachedSourceUrl && cachedSourceUrl === preloadedLogo) return cached;
    // Otherwise: stale cache for a different tenant — ignore it.
  }

  // === STRATEGY 2: If a preloaded tenant URL was provided, fetch THAT first.
  // This is the active company's logo (sidebar/header) — we want PDFs to
  // match it, NOT the MainAdmin's global logo from /api/Auth/company-logo-base64.
  if (preloadedLogo && (preloadedLogo.startsWith('http') || preloadedLogo.startsWith('/'))) {
    // Same-origin paths (bundled frontend assets like the default flowentra
    // logo from `@/assets/...`) must NOT be prefixed with API_URL — they live
    // on the current origin, not the backend.
    const url = preloadedLogo.startsWith('/')
      ? `${window.location.origin}${preloadedLogo}`
      : preloadedLogo;
    const fetched = await fetchImageAsBase64(url);
    if (fetched) { cacheBase64(fetched, preloadedLogo); return fetched; }
    const canvasResult = await convertViaCanvas(url);
    if (canvasResult && canvasResult.startsWith('data:image/')) {
      cacheBase64(canvasResult, preloadedLogo);
      return canvasResult;
    }
  }

  // When an active tenant (or view-all) is selected, do NOT fall back to the
  // MainAdmin's global logo endpoints — that would leak the wrong logo into a
  // tenant's PDF when the tenant intentionally has no logo configured.
  if (hasActiveCompanyContext()) return '';

  // === STRATEGY 3: Fetch base64 from backend (MainAdmin global logo fallback) ===
  const apiBase64 = await fetchLogoBase64FromApi();
  if (apiBase64) { cacheBase64(apiBase64); return apiBase64; }

  // === STRATEGY 4: Legacy fallback — /api/Auth/company-logo (image binary) ===
  const apiResult = await fetchLogoViaApi();
  if (apiResult && apiResult.startsWith('data:image/')) { cacheBase64(apiResult); return apiResult; }

  // === STRATEGY 5: Try the global singleton logo URL ===
  const resolvedLogo = getResolvedLogo();
  if (resolvedLogo && !resolvedLogo.startsWith('data:') && resolvedLogo.startsWith('http')) {
    const fetched = await fetchImageAsBase64(resolvedLogo);
    if (fetched) { cacheBase64(fetched, resolvedLogo); return fetched; }
  }

  return '';
}

/**
 * Fetch logo as base64 from the dedicated /api/Auth/company-logo-base64 endpoint.
 * The backend reads the file from disk and converts it — no CORS issues.
 */
async function fetchLogoBase64FromApi(): Promise<string> {
  try {
    const token = localStorage.getItem('access_token');
    const tenant = getCurrentTenant();
    const res = await fetch(`${API_URL}/api/Auth/company-logo-base64`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(tenant && { [TENANT_HEADER]: tenant }),
      },
    });
    if (!res.ok) return '';
    const data = await res.json();
    if (data.logoBase64 && data.logoBase64.startsWith('data:image/')) {
      return data.logoBase64;
    }
    return '';
  } catch {
    return '';
  }
}
