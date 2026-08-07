/**
 * Read the identity claims the backend puts in the access token.
 *
 * The JWT is the single source of truth for:
 *   • UserType / login_type      → MainAdminUser vs RegularUser
 *   • tenant_id                  → the company a regular user is BOUND to
 *                                  (data-table TenantId; 0 = default company)
 *   • can_switch_company         → role-granted settings.switch_company
 *
 * Previously the frontend guessed "main admin" from `user.id === 1` and never
 * looked at `tenant_id` at all — which left regular users in multi-company
 * databases without an active company (every API call then 428s).
 */

export interface AuthClaims {
  userId: number | null;
  /** "MainAdminUser" | "RegularUser" | null */
  userType: string | null;
  /** "admin" | "user" | null */
  loginType: string | null;
  isMainAdmin: boolean;
  isRegularUser: boolean;
  /** Data-table TenantId the account is bound to (0 = default company). */
  boundTenantId: number | null;
  canSwitchCompany: boolean;
}

const EMPTY: AuthClaims = {
  userId: null,
  userType: null,
  loginType: null,
  isMainAdmin: false,
  isRegularUser: false,
  boundTenantId: null,
  canSwitchCompany: false,
};

function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return (
      window.localStorage.getItem('access_token') ||
      window.sessionStorage.getItem('access_token')
    );
  } catch {
    return null;
  }
}

function decodePayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split('.')[1];
    if (!part) return null;
    const b64 = part.replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64.padEnd(b64.length + ((4 - (b64.length % 4)) % 4), '=');
    const json = decodeURIComponent(
      atob(padded)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function str(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

let _cachedToken: string | null = null;
let _cachedClaims: AuthClaims = EMPTY;

/** Parsed claims from the current access token (memoised per token string). */
export function getAuthClaims(): AuthClaims {
  const token = getAccessToken();
  if (!token) {
    _cachedToken = null;
    _cachedClaims = EMPTY;
    return EMPTY;
  }
  if (token === _cachedToken) return _cachedClaims;

  const payload = decodePayload(token);
  if (!payload) {
    _cachedToken = token;
    _cachedClaims = EMPTY;
    return EMPTY;
  }

  const userType = str(payload['UserType']) ?? str(payload['user_type']);
  const loginType = str(payload['login_type']);
  const isMainAdmin =
    userType?.toLowerCase() === 'mainadminuser' || loginType === 'admin';
  const isRegularUser =
    !isMainAdmin && (userType?.toLowerCase() === 'regularuser' || loginType === 'user');

  const rawTenant = payload['tenant_id'];
  const parsedTenant =
    typeof rawTenant === 'number'
      ? rawTenant
      : typeof rawTenant === 'string' && rawTenant.trim() !== ''
        ? Number.parseInt(rawTenant, 10)
        : NaN;

  const rawUserId = payload['UserId'] ?? payload['userId'];
  const parsedUserId =
    typeof rawUserId === 'number'
      ? rawUserId
      : typeof rawUserId === 'string'
        ? Number.parseInt(rawUserId, 10)
        : NaN;

  const claims: AuthClaims = {
    userId: Number.isNaN(parsedUserId) ? null : parsedUserId,
    userType,
    loginType,
    isMainAdmin,
    isRegularUser,
    boundTenantId: Number.isNaN(parsedTenant) ? null : parsedTenant,
    canSwitchCompany: String(payload['can_switch_company']).toLowerCase() === 'true',
  };

  _cachedToken = token;
  _cachedClaims = claims;
  return claims;
}

/** Clear the memoised claims (call on logout / token refresh). */
export function resetAuthClaimsCache(): void {
  _cachedToken = null;
  _cachedClaims = EMPTY;
}

/**
 * Claims-first "is this the MainAdminUser?" check with a legacy fallback.
 *
 * A RegularUser can legitimately have `id === 1` inside a tenant database, so
 * the old `id === 1` heuristic must NEVER run once the token tells us the
 * account type. Use this everywhere instead of ad-hoc id checks.
 */
export function isMainAdminAccount(): boolean {
  if (typeof window === 'undefined') return false;
  const claims = getAuthClaims();
  if (claims.isMainAdmin) return true;
  if (claims.isRegularUser) return false;
  try {
    const loginType =
      window.localStorage.getItem('login_type') ||
      window.sessionStorage.getItem('login_type');
    if (loginType === 'admin') return true;
    if (loginType === 'user') return false;
    const raw = window.localStorage.getItem('user_data');
    if (raw) {
      const user = JSON.parse(raw) as { id?: number | string; userId?: number | string; userType?: string };
      if (user.userType === 'RegularUser') return false;
      const id = user.id ?? user.userId;
      return id === 1 || id === '1';
    }
  } catch { /* ignore */ }
  return false;
}
