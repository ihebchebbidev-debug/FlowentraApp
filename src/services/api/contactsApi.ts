// Contacts API Service - Backend Integration
import type {
  Contact,
  ContactListResponse,
  ContactSearchParams,
  CreateContactRequest,
  UpdateContactRequest,
  BulkImportRequest,
  BulkImportResult,
} from '@/types/contacts';
import { apiFetch } from './apiClient';

export const contactsApi = {
  // Get all contacts with filtering and pagination
  async getAll(params?: ContactSearchParams): Promise<ContactListResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.searchTerm) queryParams.append('searchTerm', params.searchTerm);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.favorite !== undefined) queryParams.append('favorite', String(params.favorite));
    if (params?.pageNumber) queryParams.append('pageNumber', String(params.pageNumber));
    if (params?.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortDirection) queryParams.append('sortDirection', params.sortDirection);
    
    if (params?.tagIds) {
      params.tagIds.forEach(id => queryParams.append('tagIds', String(id)));
    }

    const { data, error } = await apiFetch<ContactListResponse>(`/api/Contacts?${queryParams}`);
    
    if (error || !data) {
      throw new Error(error || 'Failed to fetch contacts');
    }

    return data;
  },

  // Get contact by ID
  async getById(id: number): Promise<Contact> {
    const { data, error } = await apiFetch<Contact>(`/api/Contacts/${id}`);
    
    if (error || !data) {
      throw new Error(error || `Failed to fetch contact ${id}`);
    }

    return data;
  },

  // Create new contact
  async create(request: CreateContactRequest): Promise<Contact> {
    const { data, error } = await apiFetch<Contact>('/api/Contacts', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (error || !data) {
      throw new Error(error || 'Failed to create contact');
    }

    return data;
  },

  // Update existing contact
  async update(id: number, request: UpdateContactRequest): Promise<Contact> {
    const { data, error } = await apiFetch<Contact>(`/api/Contacts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });

    if (error || !data) {
      throw new Error(error || 'Failed to update contact');
    }

    return data;
  },

  // Delete contact (soft delete)
  async delete(id: number): Promise<void> {
    const { error } = await apiFetch<void>(`/api/Contacts/${id}`, {
      method: 'DELETE',
    });

    if (error) {
      throw new Error(error || 'Failed to delete contact');
    }
  },

  // Search contacts
  async search(searchTerm: string, pageNumber = 1, pageSize = 20): Promise<ContactListResponse> {
    const queryParams = new URLSearchParams({
      searchTerm,
      pageNumber: String(pageNumber),
      pageSize: String(pageSize),
    });

    const { data, error } = await apiFetch<ContactListResponse>(`/api/Contacts/search?${queryParams}`);
    
    if (error || !data) {
      throw new Error(error || 'Failed to search contacts');
    }

    return data;
  },

  // Check if contact exists by email
  async exists(email: string): Promise<boolean> {
    const { data, error } = await apiFetch<boolean>(`/api/Contacts/exists/${encodeURIComponent(email)}`);
    
    if (error) {
      throw new Error(error || 'Failed to check contact existence');
    }

    return data ?? false;
  },

  // Bulk import contacts
  async bulkImport(request: BulkImportRequest): Promise<BulkImportResult> {
    const { data, error } = await apiFetch<BulkImportResult>('/api/Contacts/import', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    if (error || !data) {
      throw new Error(error || 'Failed to import contacts');
    }

    return data;
  },

  // Assign tag to contact
  async assignTag(contactId: number, tagId: number): Promise<void> {
    const { error } = await apiFetch<void>(`/api/Contacts/${contactId}/tags/${tagId}`, {
      method: 'POST',
    });

    if (error) {
      throw new Error(error || 'Failed to assign tag');
    }
  },

  // Remove tag from contact
  async removeTag(contactId: number, tagId: number): Promise<void> {
    const { error } = await apiFetch<void>(`/api/Contacts/${contactId}/tags/${tagId}`, {
      method: 'DELETE',
    });

    if (error) {
      throw new Error(error || 'Failed to remove tag');
    }
  },
};
