/**
 * Tenants API service — CRUD operations for multi-tenancy company management.
 * Only accessible by MainAdminUser.
 */
import axiosInstance from '@/services/api/axiosInstance';

export interface Tenant {
  id: number;
  slug: string;
  companyName: string;
  companyLogoUrl?: string | null;
  companyWebsite?: string | null;
  companyPhone?: string | null;
  companyAddress?: string | null;
  companyCountry?: string | null;
  industry?: string | null;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateTenantRequest {
  slug: string;
  companyName: string;
  companyLogoUrl?: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCountry?: string;
  industry?: string;
}

export interface UpdateTenantRequest {
  companyName?: string;
  companyLogoUrl?: string;
  companyWebsite?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyCountry?: string;
  industry?: string;
  isActive?: boolean;
}

export const tenantsApi = {
  /** List all tenants (active + inactive) for the current MainAdminUser */
  list: async (): Promise<Tenant[]> => {
    const res = await axiosInstance.get<Tenant[]>('/api/Tenants', {
      params: { includeInactive: true },
    });
    return res.data;
  },

  /** Get a single tenant by ID */
  getById: async (id: number): Promise<Tenant> => {
    const res = await axiosInstance.get<Tenant>(`/api/Tenants/${id}`);
    return res.data;
  },

  /** Create a new tenant/company */
  create: async (data: CreateTenantRequest): Promise<Tenant> => {
    const res = await axiosInstance.post<Tenant>('/api/Tenants', data);
    return res.data;
  },

  /** Update tenant company info */
  update: async (id: number, data: UpdateTenantRequest): Promise<Tenant> => {
    const res = await axiosInstance.put<Tenant>(`/api/Tenants/${id}`, data);
    return res.data;
  },

  /** Soft-delete (deactivate) a tenant */
  delete: async (id: number): Promise<void> => {
    await axiosInstance.delete(`/api/Tenants/${id}`);
  },

  /** Set a tenant as the default company */
  setDefault: async (id: number): Promise<void> => {
    await axiosInstance.post(`/api/Tenants/${id}/set-default`);
  },
};
