import { apiFetch } from '@/services/api/apiClient';

interface SignatureResponse {
  signatureUrl: string;
}

export const signatureApi = {
  async getMySignature(): Promise<string | null> {
    const { data, status } = await apiFetch<SignatureResponse>('/api/Signatures/me');
    if (status === 200 && data?.signatureUrl) {
      return data.signatureUrl;
    }
    return null;
  },

  async saveMySignature(signatureUrl: string): Promise<boolean> {
    const { status } = await apiFetch('/api/Signatures/me', {
      method: 'PUT',
      body: JSON.stringify({ signatureUrl }),
    });
    return status === 200 || status === 204;
  },

  async deleteMySignature(): Promise<boolean> {
    const { status } = await apiFetch('/api/Signatures/me', {
      method: 'DELETE',
    });
    return status === 200;
  },
};
