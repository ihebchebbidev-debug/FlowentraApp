// Mock contacts API - frontend only, no real API calls
import contactsData from '@/data/mock/contacts.json';

// Keep same interfaces as original API
export interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  position?: string;
  tags?: { id: number; name: string }[];
  notes?: string;
  createdAt: string;
  updatedAt?: string;
  status?: string;
  type?: string;
  favorite?: boolean;
  lastContactDate?: string;
  address?: string;
}

export interface ContactNote {
  id: number;
  contactId: number;
  content: string;
  createdAt: string;
  updatedAt?: string;
}

export interface ContactTag {
  id: number;
  name: string;
  contactId: number;
}

export interface ContactSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ContactSearchRequest extends ContactSearchParams {
  searchTerm?: string;
  status?: string;
  type?: string;
  pageSize?: number;
}

export interface ContactNotesResponse {
  notes: ContactNote[];
  totalCount: number;
}

export interface ContactsResponse {
  contacts: Contact[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
}

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

let mockContacts: Contact[] = (contactsData as any[]).map(contact => ({
  ...contact,
  id: parseInt(contact.id) || Math.floor(Math.random() * 10000),
  tags: contact.tags?.map((tag: any, index: number) => 
    typeof tag === 'string' ? { id: index + 1, name: tag } : tag
  ) || [],
  status: contact.status || 'active',
  type: contact.type || 'person',
  favorite: contact.favorite || false,
  lastContactDate: contact.lastContactDate || new Date().toISOString(),
  address: contact.address || ''
}));

let mockNotes: ContactNote[] = [];
let mockTags: ContactTag[] = [];

export const contactsApi = {
  async getAllContacts(params?: ContactSearchParams): Promise<ContactsResponse> {
    await delay();
    
    let filteredContacts = [...mockContacts];
    
    // Apply search filter
    if (params?.search) {
      const search = params.search.toLowerCase();
      filteredContacts = filteredContacts.filter(contact =>
        contact.name.toLowerCase().includes(search) ||
        contact.email.toLowerCase().includes(search) ||
        contact.company?.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting
    if (params?.sortBy) {
      filteredContacts.sort((a, b) => {
        const aVal = (a as any)[params.sortBy!] || '';
        const bVal = (b as any)[params.sortBy!] || '';
        const result = aVal.toString().localeCompare(bVal.toString());
        return params.sortOrder === 'desc' ? -result : result;
      });
    }
    
    // Apply pagination
    const page = params?.page || 1;
    const limit = params?.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContacts = filteredContacts.slice(startIndex, endIndex);
    
    return {
      contacts: paginatedContacts,
      totalCount: filteredContacts.length,
      currentPage: page,
      totalPages: Math.ceil(filteredContacts.length / limit)
    };
  },

  // Accept numeric string ids as well as numbers to be resilient when route params
  // are passed as strings (e.g. from useParams()). Coerce to number and try both
  // numeric and strict equality to support mixed data shapes in the mock data.
  async getContactById(id: number | string): Promise<Contact> {
    await delay();
    const numericId = typeof id === 'string' ? Number(id) : id;
    const contact = mockContacts.find(c => c.id === numericId || c.id === id as any);
    if (!contact) throw new Error('Contact not found');
    return contact;
  },

  async createContact(contactData: Omit<Contact, 'id' | 'createdAt' | 'updatedAt'>): Promise<Contact> {
    await delay();
    const newContact: Contact = {
      id: Math.max(...mockContacts.map(c => c.id)) + 1,
      ...contactData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    mockContacts.push(newContact);
    return newContact;
  },

  async updateContact(id: number, contactData: Partial<Contact>): Promise<Contact> {
    await delay();
    const index = mockContacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');
    
    mockContacts[index] = {
      ...mockContacts[index],
      ...contactData,
      updatedAt: new Date().toISOString()
    };
    return mockContacts[index];
  },

  async deleteContact(id: number): Promise<void> {
    await delay();
    const index = mockContacts.findIndex(c => c.id === id);
    if (index === -1) throw new Error('Contact not found');
    mockContacts.splice(index, 1);
  },

  async bulkImportContacts(data: any): Promise<{ success: boolean; imported: number; errors: string[]; successCount: number; failedCount: number }> {
    await delay(1000); // Longer delay for import
    
    // Accept any import data and simulate success
    const importedCount = Math.floor(Math.random() * 50) + 10; // Random 10-60 contacts
    
    return {
      success: true,
      imported: importedCount,
      successCount: importedCount,
      failedCount: 0,
      errors: []
    };
  }
};

export const contactNotesApi = {
  async getNotesByContactId(contactId: number | string): Promise<ContactNotesResponse> {
    await delay();
    const numericId = typeof contactId === 'string' ? Number(contactId) : contactId;
    const notes = mockNotes.filter(note => note.contactId === numericId || note.contactId === contactId as any);
    return { notes, totalCount: notes.length };
  },

  async createNote(contactId: number, content: string): Promise<ContactNote> {
    await delay();
    const newNote: ContactNote = {
      id: Math.max(0, ...mockNotes.map(n => n.id)) + 1,
      contactId,
      content,
      createdAt: new Date().toISOString()
    };
    mockNotes.push(newNote);
    return newNote;
  },

  async updateNote(id: number, content: string): Promise<ContactNote> {
    await delay();
    const note = mockNotes.find(n => n.id === id);
    if (!note) throw new Error('Note not found');
    note.content = content;
    note.updatedAt = new Date().toISOString();
    return note;
  },

  async deleteNote(id: number): Promise<void> {
    await delay();
    const index = mockNotes.findIndex(n => n.id === id);
    if (index === -1) throw new Error('Note not found');
    mockNotes.splice(index, 1);
  }
};

export const contactTagsApi = {
  async getTagsByContactId(contactId: number): Promise<ContactTag[]> {
    await delay();
    return mockTags.filter(tag => tag.contactId === contactId);
  },

  async addTagToContact(contactId: number, tagName: string): Promise<ContactTag> {
    await delay();
    const newTag: ContactTag = {
      id: Math.max(0, ...mockTags.map(t => t.id)) + 1,
      name: tagName,
      contactId
    };
    mockTags.push(newTag);
    return newTag;
  },

  async removeTagFromContact(contactId: number, tagId: number): Promise<void> {
    await delay();
    const index = mockTags.findIndex(t => t.id === tagId && t.contactId === contactId);
    if (index === -1) throw new Error('Tag not found');
    mockTags.splice(index, 1);
  }
};

export default contactsApi;
