import { API_URL } from '@/config/api';
import { getCurrentTenant, TENANT_HEADER } from '@/utils/tenant';
import type { AuthResponse } from '@/services/authService';

function buildHeaders(): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tenant = getCurrentTenant();
  if (tenant) headers[TENANT_HEADER] = tenant;
  return headers;
}

export const twoFactorApi = {
  async verify(challengeToken: string, otpCode: string, rememberMe = true): Promise<AuthResponse> {
    const res = await fetch(`${API_URL}/api/TwoFactor/verify`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ challengeToken, otpCode, rememberMe }),
    });
    return res.json();
  },

  async resend(
    challengeToken: string,
    language: 'en' | 'fr' = 'en',
  ): Promise<{ success: boolean; message: string; cooldownSeconds: number }> {
    const res = await fetch(`${API_URL}/api/TwoFactor/resend`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({ challengeToken, language }),
    });
    return res.json();
  },
};
