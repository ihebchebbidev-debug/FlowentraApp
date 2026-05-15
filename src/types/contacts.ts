// Contact TypeScript Interfaces

export type ContactStatus = 'active' | 'inactive' | 'lead' | 'customer' | 'partner';
export type ContactType = 'individual' | 'company' | 'partner' | 'supplier';

export interface ContactTag {
  id: number;
  name: string;
  color: string;
  description?: string;
}

export interface ContactNote {
  id: number;
  contactId: number;
  content: string;
  createdAt: string;
  createdBy?: string;
}

export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: ContactStatus;
  type: ContactType;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  favorite: boolean;
  lastContactDate?: string;
  cin?: string;
  matriculeFiscale?: string;
  // Geolocation fields
  latitude?: number;
  longitude?: number;
  hasLocation?: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  modifiedBy?: string;
  tags: ContactTag[];
  notes: ContactNote[];
}

export interface ContactListResponse {
  contacts: Contact[];
  totalCount: number;
  pageSize: number;
  pageNumber: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface CreateContactRequest {
  firstName: string;
  lastName: string;
  name?: string; // Optional, will be generated from firstName + lastName
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  status: ContactStatus | string; // Allow string for flexibility
  type: ContactType | string; // Allow string for flexibility
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  favorite?: boolean;
  lastContactDate?: string;
  cin?: string;
  matriculeFiscale?: string;
  // Geolocation fields
  latitude?: number;
  longitude?: number;
  notes?: string;
  tagIds?: number[];
}

export interface UpdateContactRequest {
  firstName?: string;
  lastName?: string;
  name?: string; // Optional, will be generated from firstName + lastName
  email?: string;
  phone?: string;
  company?: string;
  position?: string;
  status?: ContactStatus | string; // Allow string for flexibility
  type?: ContactType | string; // Allow string for flexibility
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  avatar?: string;
  favorite?: boolean;
  lastContactDate?: string;
  cin?: string;
  matriculeFiscale?: string;
  // Geolocation fields
  latitude?: number;
  longitude?: number;
  tagIds?: number[];
}

export interface ContactSearchParams {
  searchTerm?: string;
  status?: ContactStatus | string; // Allow string for flexibility
  type?: ContactType | string; // Allow string for flexibility
  tagIds?: number[];
  favorite?: boolean;
  pageNumber?: number;
  pageSize?: number;
  page?: number; // Alias for pageNumber for backward compatibility
  limit?: number; // Alias for pageSize for backward compatibility
  sortBy?: string;
  sortOrder?: 'asc' | 'desc'; // Alias for sortDirection for backward compatibility
  sortDirection?: 'asc' | 'desc';
  search?: string; // Alias for searchTerm for backward compatibility
}

export interface BulkImportRequest {
  contacts: CreateContactRequest[];
  skipDuplicates?: boolean;
  updateExisting?: boolean;
}

export interface BulkImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  errors: string[];
  importedContacts: Contact[];
}
