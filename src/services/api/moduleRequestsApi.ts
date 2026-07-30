/**
 * Module request API — lets a tenant user ask Flowentra to activate (purchase)
 * or deactivate a module. The backend emails contact@flowentra.io via OVH SMTP.
 */
import axiosInstance from '@/services/api/axiosInstance';
import { getCurrentTenant } from '@/utils/tenant';

export type ModuleRequestAction = 'activate' | 'deactivate';

export interface ModuleRequestPayload {
  action: ModuleRequestAction;
  moduleCode: string;
  moduleKey: string;
  moduleName: string;
  currentlyEnabled: boolean;
  /** Required message from the customer (10–2000 chars). */
  reason: string;
}

export interface ModuleRequestResult {
  success: boolean;
  error?: string;
  sentTo?: string;
  requestedAtUtc?: string;
}

export const moduleRequestsApi = {
  async create(payload: ModuleRequestPayload): Promise<ModuleRequestResult> {
    const now = new Date();
    const body = {
      ...payload,
      appUrl: typeof window !== 'undefined' ? window.location.origin : undefined,
      tenantSlug: getCurrentTenant() ?? undefined,
      clientTime: now.toString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    const { data } = await axiosInstance.post<ModuleRequestResult>('/api/module-requests', body);
    return data;
  },
};

export default moduleRequestsApi;