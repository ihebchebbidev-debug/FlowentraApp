import { API_URL } from '@/config/api';
const BASE = `${API_URL}/api/email-verification`;

function authHeaders(): Record<string, string> {
  const token =
    localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

export interface VerificationStatus {
  success: boolean;
  emailVerified: boolean;
  email: string;
  canResendInSeconds: number;
}

export interface RequestCodeResponse {
  success: boolean;
  cooldownSeconds?: number;
  expiresInSeconds?: number;
  error?: string;
}

export interface VerifyCodeResponse {
  success: boolean;
  emailVerified?: boolean;
  error?: string;
}

async function readJson<T>(res: Response): Promise<T> {
  try { return (await res.json()) as T; } catch { return {} as T; }
}

export const emailVerificationApi = {
  async getStatus(): Promise<VerificationStatus> {
    const res = await fetch(`${BASE}/status`, { headers: authHeaders() });
    return readJson<VerificationStatus>(res);
  },
  async requestCode(lang: 'en' | 'fr' = 'en'): Promise<RequestCodeResponse> {
    const res = await fetch(`${BASE}/request`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ lang }),
    });
    return readJson<RequestCodeResponse>(res);
  },
  async verifyCode(code: string): Promise<VerifyCodeResponse> {
    const res = await fetch(`${BASE}/verify`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ code }),
    });
    return readJson<VerifyCodeResponse>(res);
  },
};
