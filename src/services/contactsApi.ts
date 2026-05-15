// Real contacts API - integrated with backend
import { contactsApi as realContactsApi } from './api/contactsApi';
export * from './api/contactsApi';
export type { Contact, ContactSearchParams, ContactNote, ContactTag } from '@/types/contacts';
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

import { API_URL } from '@/config/api';

// Compatibility layer for old code - map old method names to new API
export const contactsApi = {
  ...realContactsApi,
  // Old method names for backward compatibility
  getAllContacts: realContactsApi.getAll,
  getContactById: realContactsApi.getById,
  createContact: realContactsApi.create,
  updateContact: realContactsApi.update,
  deleteContact: realContactsApi.delete,
  bulkImportContacts: realContactsApi.bulkImport,
};

// Real Contact Notes API - integrated with backend
export const contactNotesApi = {
  async getAll(contactId: number) {
    const response = await fetch(`${API_URL}/api/ContactNotes/contact/${contactId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch notes' }));
      throw new Error(error.message || 'Failed to fetch notes');
    }
    const result = await response.json();
    // Backend returns { notes: [], totalCount: number }
    return result.notes || result.data || result || [];
  },

  async create(contactId: number, data: { note: string }) {
    const response = await fetch(`${API_URL}/api/ContactNotes`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify({ 
        contactId: contactId,
        note: data.note 
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create note' }));
      throw new Error(error.message || 'Failed to create note');
    }
    const result = await response.json();
    return result.data || result;
  },

  async update(noteId: number, data: { note: string }) {
    const response = await fetch(`${API_URL}/api/ContactNotes/${noteId}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify({ note: data.note }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update note' }));
      throw new Error(error.message || 'Failed to update note');
    }
    const result = await response.json();
    return result.data || result;
  },

  async delete(noteId: number) {
    const response = await fetch(`${API_URL}/api/ContactNotes/${noteId}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete note' }));
      throw new Error(error.message || 'Failed to delete note');
    }
  },
};

// Real Contact Tags API - integrated with backend
export const contactTagsApi = {
  async getAll() {
    const response = await fetch(`${API_URL}/api/ContactTags`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to fetch tags' }));
      throw new Error(error.message || 'Failed to fetch tags');
    }
    const result = await response.json();
    // Handle various response structures
    return result.tags || result.items || result.data || (Array.isArray(result) ? result : []);
  },

  async getById(id: number) {
    const response = await fetch(`${API_URL}/api/ContactTags/${id}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    if (!response.ok) {
      throw new Error('Failed to fetch tag');
    }
    const result = await response.json();
    return result.data || result;
  },

  async create(data: { name: string; color?: string; description?: string }) {
    const response = await fetch(`${API_URL}/api/ContactTags`, {
      method: 'POST',
      headers: getMutationHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create tag' }));
      throw new Error(error.message || 'Failed to create tag');
    }
    const result = await response.json();
    return result.data || result;
  },

  async update(id: number, data: { name?: string; color?: string; description?: string }) {
    const response = await fetch(`${API_URL}/api/ContactTags/${id}`, {
      method: 'PUT',
      headers: getMutationHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to update tag' }));
      throw new Error(error.message || 'Failed to update tag');
    }
    const result = await response.json();
    return result.data || result;
  },

  async delete(id: number) {
    const response = await fetch(`${API_URL}/api/ContactTags/${id}`, {
      method: 'DELETE',
      headers: getMutationHeaders(),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to delete tag' }));
      throw new Error(error.message || 'Failed to delete tag');
    }
  },
};