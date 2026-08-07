/**
 * Centralized API & Environment Configuration
 * 
 * Single source of truth for API URLs, OAuth redirect URIs,
 * and tenant-aware configuration. All service files should import from here
 * instead of declaring their own API_URL.
 * 
 * Environment Variables (set via Lovable project secrets):
 *   VITE_API_URL          — Backend API base URL (required for production)
 *   VITE_DEFAULT_TENANT   — Default tenant identifier (optional)
 *   VITE_OAUTH_REDIRECT_ORIGIN — Override for OAuth redirect origin (optional)
 * 
 * Tenant Detection Order:
 *   1. localStorage override (dev/testing)
 *   2. Subdomain of flowentra.app (e.g. demo.flowentra.app → "demo")
 *   3. ?tenant=xxx query param
 *   4. VITE_DEFAULT_TENANT env var
 *   5. null (no tenant)
 */

// ─── API Base URL ───────────────────────────────────────────────────────────
// Priority: VITE_API_URL > REACT_APP_API_URL (legacy CRA) > hardcoded fallback
// The fallback ensures the app works in preview/dev even without env vars.
export const API_URL: string =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_URL ||
  'https://api.flowentra.app';

// Warn in dev if no env var is set (relying on fallback)
if (import.meta.env.DEV && !import.meta.env.VITE_API_URL) {
  console.warn(
    '[config] VITE_API_URL is not set. Using fallback:',
    API_URL,
    '\nSet VITE_API_URL in your Lovable project secrets for production.'
  );
}

// ─── OAuth & Redirect Configuration ─────────────────────────────────────────

/**
 * Central OAuth API domain.
 * All OAuth callbacks go through a single domain (api.flowentra.app)
 * so you only register ONE redirect URI per provider in Google/Microsoft console.
 * 
 * The backend handles redirecting the user back to their tenant after login.
 * 
 * Override via VITE_OAUTH_REDIRECT_ORIGIN for local dev/testing.
 */
const OAUTH_API_ORIGIN = 'https://api.flowentra.app';

export function getOAuthRedirectOrigin(): string {
  // Explicit override (useful for dev/testing with Lovable preview)
  if (import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN) {
    return import.meta.env.VITE_OAUTH_REDIRECT_ORIGIN;
  }
  return OAUTH_API_ORIGIN;
}

/**
 * Build an OAuth callback URL for a given provider.
 * 
 * Production output: https://api.flowentra.app/oauth/google/callback
 * 
 * Register ONLY these in your OAuth provider console:
 *   Google:    https://api.flowentra.app/oauth/google/callback
 *   Microsoft: https://api.flowentra.app/oauth/microsoft/callback
 */
export function getOAuthCallbackUrl(provider: 'google' | 'microsoft'): string {
  return `${getOAuthRedirectOrigin()}/oauth/${provider}/callback`;
}

/**
 * Known origins for reference. With centralized OAuth via api.flowentra.app,
 * you only need to register the API domain in OAuth provider consoles.
 * 
 * For Google Cloud Console → Authorized JavaScript origins, add:
 *   - https://api.flowentra.app
 *   - https://demo.flowentra.app  (if using GSI popup from tenant domains)
 *   - https://dev.flowentra.app
 * 
 * For Google Cloud Console → Authorized redirect URIs:
 *   - https://api.flowentra.app/oauth/google/callback  (ONLY this one!)
 */
export const KNOWN_ORIGINS = {
  // Central OAuth API
  api: 'https://api.flowentra.app',
  
  // Lovable environments (for JS origins if using GSI popup)
  lovablePublished: 'https://tiny-good-start.lovable.app',
  lovablePreview: 'https://id-preview--00ff05a3-e719-46ba-91f2-d6dc1a99d0b1.lovable.app',
  
  // Tenant subdomains (for JS origins if using GSI popup)
  production: 'https://flowentra.app',
  demo: 'https://demo.flowentra.app',
  dev: 'https://dev.flowentra.app',
} as const;

// ─── Utility ────────────────────────────────────────────────────────────────

/**
 * Build a full URL from a relative path and the API_URL.
 * Handles leading slashes and avoids double slashes.
 */
export function buildApiUrl(path: string): string {
  const base = API_URL.replace(/\/+$/, '');
  const cleanPath = path.replace(/^\/+/, '');
  return `${base}/${cleanPath}`;
}

/**
 * Build a full asset URL from a relative path (e.g. uploads/company/logo.png).
 * Returns the input unchanged if it's already absolute, a data URI, or a blob.
 */
export function buildAssetUrl(relativePath: string): string {
  if (!relativePath) return '';
  if (
    relativePath.startsWith('data:') ||
    relativePath.startsWith('blob:') ||
    relativePath.startsWith('http')
  ) {
    return relativePath;
  }
  return `${API_URL}/${relativePath.replace(/^\//, '')}`;
}
