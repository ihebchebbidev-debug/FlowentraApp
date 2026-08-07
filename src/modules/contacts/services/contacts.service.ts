// API-backed service layer for contacts
import { contactsApi, contactNotesApi, contactTagsApi, type Contact, type ContactNote } from '@/services/contactsApi';

export const ContactService = {
  async getNotes(contactId: string): Promise<ContactNote[]> {
    try {
      const notes = await contactNotesApi.getAll(Number(contactId));
      return notes;
    } catch (error) {
      console.error('Failed to load notes:', error);
      return [];
    }
  },

  async createNote(contactId: string, note: string): Promise<ContactNote | null> {
    try {
      const newNote = await contactNotesApi.create(Number(contactId), { note });
      return newNote;
    } catch (error) {
      console.error('Failed to create note:', error);
      return null;
    }
  },

  async updateNote(noteId: string, note: string): Promise<ContactNote | null> {
    try {
      const updated = await contactNotesApi.update(Number(noteId), { note });
      return updated;
    } catch (error) {
      console.error('Failed to update note:', error);
      return null;
    }
  },

  async deleteNote(noteId: string): Promise<boolean> {
    try {
      await contactNotesApi.delete(Number(noteId));
      return true;
    } catch (error) {
      console.error('Failed to delete note:', error);
      return false;
    }
  },

  async saveNotes(contactId: string, notes: ContactNote[]): Promise<void> {
    // Notes are saved individually through the API, so this method is deprecated
    console.warn('saveNotes is deprecated - use createNote, updateNote, deleteNote instead');
  },

  async getAllTags(): Promise<any[]> {
    try {
      const tags = await contactTagsApi.getAll();
      return tags;
    } catch (error) {
      console.error('Failed to load tags:', error);
      return [];
    }
  },

  async createTag(data: { name: string; color?: string; description?: string }): Promise<any | null> {
    try {
      const newTag = await contactTagsApi.create(data);
      return newTag;
    } catch (error) {
      console.error('Failed to create tag:', error);
      return null;
    }
  },

  async updateTag(tagId: string, data: { name?: string; color?: string; description?: string }): Promise<any | null> {
    try {
      const updated = await contactTagsApi.update(Number(tagId), data);
      return updated;
    } catch (error) {
      console.error('Failed to update tag:', error);
      return null;
    }
  },

  async deleteTag(tagId: string): Promise<boolean> {
    try {
      await contactTagsApi.delete(Number(tagId));
      return true;
    } catch (error) {
      console.error('Failed to delete tag:', error);
      return false;
    }
  },

  async getTags(contactId: string): Promise<string[]> {
    try {
      const contact = await contactsApi.getById(Number(contactId));
      return (contact.tags || []).map((tag: any) => typeof tag === 'string' ? tag : tag.name);
    } catch (error) {
      console.error('Failed to load contact tags:', error);
      return [];
    }
  },

  async assignTagToContact(contactId: string, tagId: string): Promise<boolean> {
    try {
      await contactsApi.assignTag(Number(contactId), Number(tagId));
      return true;
    } catch (error) {
      console.error('Failed to assign tag:', error);
      return false;
    }
  },

  async removeTagFromContact(contactId: string, tagId: string): Promise<boolean> {
    try {
      await contactsApi.removeTag(Number(contactId), Number(tagId));
      return true;
    } catch (error) {
      console.error('Failed to remove tag:', error);
      return false;
    }
  },

  async saveTags(contactId: string, tags: string[]): Promise<void> {
    // Tags are managed through the contact API, so this method is deprecated
    console.warn('saveTags is deprecated - use assignTagToContact, removeTagFromContact instead');
  },

  async getOffers(contactId: string): Promise<any[]> {
    // Offers functionality will be implemented later
    return [];
  },

  async saveOffers(contactId: string, offers: any[]): Promise<void> {
    // Offers functionality will be implemented later
    console.warn('saveOffers not yet implemented');
  }
};
