// API Response Types matching backend DTOs
export interface LocationDto {
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  latitude?: number;
  longitude?: number;
}

export interface SpecificationsDto {
  processor?: string;
  ram?: string;
  storage?: string;
  operatingSystem?: string;
  osVersion?: string;
}

export interface WarrantyDto {
  hasWarranty: boolean;
  warrantyFrom?: string;
  warrantyTo?: string;
  warrantyProvider?: string;
  warrantyType?: string;
}

export interface MaintenanceDto {
  lastMaintenanceDate?: string;
  nextMaintenanceDate?: string;
  maintenanceFrequency?: string;
  maintenanceNotes?: string;
}

export interface ContactInfoDto {
  primaryContactName?: string;
  primaryContactPhone?: string;
  primaryContactEmail?: string;
  secondaryContactName?: string;
  secondaryContactPhone?: string;
  secondaryContactEmail?: string;
}

export interface MetadataDto {
  tags?: string[];
  customFields?: Record<string, any>;
}

export interface InstallationDto {
  id?: number;
  installationNumber?: string;
  contactId: number;
  siteAddress?: string;
  installationType?: string;
  installationDate?: string;
  name?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  matricule?: string;
  assetTag?: string;
  category?: string;
  type?: string;
  status?: string;
  warrantyExpiry?: string;
  notes?: string;
  warranty?: WarrantyDto;
  location?: LocationDto;
  specifications?: SpecificationsDto;
  maintenance?: MaintenanceDto;
  contact?: ContactInfoDto;
  metadata?: MetadataDto;
  createdDate?: string;
  modifiedDate?: string;
  createdBy?: string;
  modifiedBy?: string;
}

export interface CreateInstallationDto {
  contactId: number;
  name?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  matricule?: string;
  assetTag?: string;
  category?: string;
  type?: string;
  status?: string;
  warranty?: WarrantyDto;
  siteAddress?: string;
  installationType?: string;
  installationDate?: string;
  warrantyExpiry?: string;
  notes?: string;
  location?: LocationDto;
  specifications?: SpecificationsDto;
  maintenance?: MaintenanceDto;
  contact?: ContactInfoDto;
  metadata?: MetadataDto;
}

export interface UpdateInstallationDto {
  contactId?: number;
  name?: string;
  model?: string;
  manufacturer?: string;
  serialNumber?: string;
  matricule?: string;
  assetTag?: string;
  category?: string;
  type?: string;
  status?: string;
  location?: LocationDto;
  specifications?: SpecificationsDto;
  warranty?: WarrantyDto;
  maintenance?: MaintenanceDto;
  contact?: ContactInfoDto;
  metadata?: MetadataDto;
}

export interface MaintenanceHistoryDto {
  id?: string;
  installationId?: string;
  maintenanceDate: string;
  maintenanceType?: string;
  description?: string;
  technician?: string;
  duration?: number;
  notes?: string;
  nextScheduledDate?: string;
  createdAt?: string;
  createdBy?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedInstallationResponse {
  installations: InstallationDto[];
  pagination: PaginationInfo;
}

export interface InstallationFilters {
  search?: string;
  category?: string;
  status?: string;
  contactId?: string;
  tags?: string;
  hasWarranty?: boolean;
  maintenanceFrequency?: string;
  createdFrom?: string;
  createdTo?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Legacy types for backward compatibility (to be phased out)
export interface Installation {
  id: string;
  name: string;
  model: string;
  description: string;
  location: string;
  manufacturer: string;
  hasWarranty: boolean;
  warrantyFrom?: Date;
  warrantyTo?: Date;
  type: 'internal' | 'external';
  customer: {
    id: string;
    company: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
      country: string;
    };
  };
  relatedServiceOrders: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  modifiedBy: string;
}
