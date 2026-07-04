import api from '@/services/api/axiosInstance';
import { bulkImportErrorFromAxios } from '@/shared/import/parseBulkImportResponse';
import type {
  InstallationDto,
  CreateInstallationDto,
  UpdateInstallationDto,
  PaginatedInstallationResponse,
  InstallationFilters,
  MaintenanceHistoryDto,
} from '@/modules/field/installations/types';

// Normalize backend response (PascalCase) to frontend format (camelCase)
const normalizeInstallation = (item: any): InstallationDto => {
  return {
    id: item.Id || item.id,
    installationNumber: item.InstallationNumber || item.installationNumber,
    contactId: item.ContactId || item.contactId,
    siteAddress: item.SiteAddress || item.siteAddress,
    installationType: item.InstallationType || item.installationType,
    installationDate: item.InstallationDate || item.installationDate,
    name: item.Name || item.name,
    model: item.Model || item.model,
    manufacturer: item.Manufacturer || item.manufacturer,
    serialNumber: item.SerialNumber || item.serialNumber,
    matricule: item.Matricule || item.matricule,
    category: item.Category || item.category,
    type: item.Type || item.type || item.InstallationType || item.installationType,
    status: item.Status || item.status,
    warrantyExpiry: item.WarrantyExpiry || item.warrantyExpiry,
    notes: item.Notes || item.notes,
    createdDate: item.CreatedDate || item.createdDate,
    modifiedDate: item.ModifiedDate || item.modifiedDate,
    createdBy: item.CreatedBy || item.createdBy,
    modifiedBy: item.ModifiedBy || item.modifiedBy,
    warranty: {
      hasWarranty: !!(item.WarrantyExpiry || item.warrantyExpiry || item.WarrantyFrom || item.warrantyFrom),
      warrantyFrom: item.WarrantyFrom || item.warrantyFrom,
      warrantyTo: item.WarrantyExpiry || item.warrantyExpiry || item.WarrantyTo || item.warrantyTo,
    },
  };
};

export const installationsApi = {
  async getAll(filters?: InstallationFilters): Promise<PaginatedInstallationResponse> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.contactId) params.append('contactId', filters.contactId);
    if (filters?.tags) params.append('tags', filters.tags);
    if (filters?.hasWarranty !== undefined) params.append('has_warranty', String(filters.hasWarranty));
    if (filters?.maintenanceFrequency) params.append('maintenance_frequency', filters.maintenanceFrequency);
    if (filters?.createdFrom) params.append('created_from', filters.createdFrom);
    if (filters?.createdTo) params.append('created_to', filters.createdTo);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('page_size', String(filters.pageSize));
    if (filters?.sortBy) params.append('sort_by', filters.sortBy);
    if (filters?.sortOrder) params.append('sort_order', filters.sortOrder);

    const response = await api.get(`/api/installations?${params.toString()}`);

    const rawData = response.data?.data || response.data;
    
    console.log('[installationsApi.getAll] Raw response:', response.data);
    
    let rawInstallations: any[] = [];
    
    if (Array.isArray(rawData)) {
      rawInstallations = rawData;
    } else if (Array.isArray(response.data?.data)) {
      rawInstallations = response.data.data;
    } else if (rawData?.installations) {
      rawInstallations = rawData.installations;
    }
    
    const installations = rawInstallations.map(normalizeInstallation);
    
    return {
      installations,
      pagination: { 
        page: 1, 
        pageSize: installations.length || 20, 
        totalCount: installations.length, 
        totalPages: 1, 
        hasNextPage: false, 
        hasPreviousPage: false 
      }
    };
  },

  async getById(id: string): Promise<InstallationDto> {
    const response = await api.get(`/api/installations/${id}`);
    const rawData = response.data?.data || response.data;
    return normalizeInstallation(rawData);
  },

  async create(data: CreateInstallationDto): Promise<InstallationDto> {
    const normalizeUtc = (value: unknown) => {
      if (typeof value !== 'string') return value;
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value}T00:00:00Z`;
      return value;
    };

    const payload = {
      ContactId: data.contactId,
      SiteAddress: data.siteAddress || data.name || 'Default Site',
      InstallationType: data.installationType || data.type || 'general',
      InstallationDate: normalizeUtc(new Date().toISOString()),
      Status: data.status || 'active',
      WarrantyExpiry: data.warranty?.hasWarranty ? normalizeUtc(data.warranty?.warrantyTo) : null,
      WarrantyFrom: data.warranty?.hasWarranty ? normalizeUtc(data.warranty?.warrantyFrom) : null,
      Notes: data.notes || null,
      Name: data.name || null,
      Model: data.model || null,
      Manufacturer: data.manufacturer || null,
      Category: data.category || null,
      Type: data.type || null,
      SerialNumber: data.serialNumber || null,
      Matricule: data.matricule || null,
    };

    console.log('[installationsApi.create] Sending payload:', payload);

    try {
      const response = await api.post(`/api/installations`, payload);
      const rawData = response.data?.data || response.data;
      return normalizeInstallation(rawData);
    } catch (error: any) {
      console.error('[installationsApi.create] Error:', error.response?.data);
      throw error;
    }
  },

  async update(id: string, data: UpdateInstallationDto): Promise<InstallationDto> {
    const response = await api.put(`/api/installations/${id}`, data);
    const rawData = response.data?.data || response.data;
    return normalizeInstallation(rawData);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/api/installations/${id}`);
  },

  async getMaintenanceHistory(
    installationId: string,
    page: number = 1,
    pageSize: number = 20
  ): Promise<MaintenanceHistoryDto[]> {
    const response = await api.get(
      `/api/installations/${installationId}/maintenance-history?page=${page}&page_size=${pageSize}`
    );
    return response.data.data;
  },

  async addMaintenanceHistory(
    installationId: string,
    data: MaintenanceHistoryDto
  ): Promise<MaintenanceHistoryDto> {
    const response = await api.post(
      `/api/installations/${installationId}/maintenance-history`,
      data
    );
    return response.data.data;
  },

  async bulkImport(request: InstallationBulkImportRequest): Promise<InstallationBulkImportResult> {
    const backendInstallations = request.installations.map(mapInstallationRowForBulkImport);

    try {
      const response = await api.post(`/api/installations/import`, {
        installations: backendInstallations,
        skipDuplicates: request.skipDuplicates ?? true,
        updateExisting: request.updateExisting ?? false,
      });

      const result = response.data?.data || response.data;

      return {
        totalProcessed: result.totalProcessed || request.installations.length,
        successCount: result.successCount || 0,
        failedCount: result.failedCount || 0,
        skippedCount: result.skippedCount || 0,
        errors: result.errors || [],
        importedItems: (result.importedInstallations || result.importedItems || []).map(normalizeInstallation),
      };
    } catch (bulkError: unknown) {
      throw bulkImportErrorFromAxios(bulkError);
    }
  },
};

// Bulk import types
export interface InstallationBulkImportRequest {
  installations: Array<{
    contactId: number;
    name?: string;
    model?: string;
    manufacturer?: string;
    serialNumber?: string;
    matricule?: string;
    category?: string;
    type?: string;
    status?: string;
    siteAddress?: string;
    installationType?: string;
    warrantyFrom?: string;
    warrantyTo?: string;
    notes?: string;
  }>;
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface InstallationBulkImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
  importedItems: any[];
}

function toImportInt(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'));
  if (!Number.isFinite(n)) return 0;
  return Math.round(n);
}

/** Map frontend import row → CreateInstallationDto for POST /api/installations/import */
function mapInstallationRowForBulkImport(
  installation: InstallationBulkImportRequest['installations'][number],
): Record<string, unknown> {
  const contactId = toImportInt(installation.contactId);
  const name = installation.name?.trim() || '';
  const row: Record<string, unknown> = {
    contactId,
    name: name || undefined,
    siteAddress: installation.siteAddress?.trim() || name || 'Default Site',
    installationType:
      installation.installationType?.trim() ||
      installation.type?.trim() ||
      'general',
    installationDate: new Date().toISOString(),
    status: installation.status?.trim() || 'active',
  };

  if (installation.model?.trim()) row.model = installation.model.trim();
  if (installation.manufacturer?.trim()) row.manufacturer = installation.manufacturer.trim();
  if (installation.category?.trim()) row.category = installation.category.trim();
  if (installation.type?.trim()) row.type = installation.type.trim();
  if (installation.serialNumber?.trim()) row.serialNumber = installation.serialNumber.trim();
  if (installation.matricule?.trim()) row.matricule = installation.matricule.trim();
  if (installation.notes?.trim()) row.notes = installation.notes.trim();

  if (installation.warrantyFrom || installation.warrantyTo) {
    row.warranty = {
      hasWarranty: true,
      warrantyFrom: installation.warrantyFrom ?? undefined,
      warrantyTo: installation.warrantyTo ?? undefined,
    };
    if (installation.warrantyTo) {
      row.warrantyExpiry = /^\d{4}-\d{2}-\d{2}$/.test(installation.warrantyTo)
        ? `${installation.warrantyTo}T00:00:00Z`
        : installation.warrantyTo;
    }
  }

  return row;
}
