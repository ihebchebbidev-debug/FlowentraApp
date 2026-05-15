import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { ContactService } from "../services/contacts.service";
import type { ContactNote } from "@/services/contactsApi";

export type OfferStatus = "pending" | "negotiation" | "won" | "lost";
export interface Offer { id: string; title: string; amount: number; status: OfferStatus; createdAt: string; }
export interface Note { id: string; content: string; createdAt: string; }

export function useContactDetail(contact: any, contactId: string) {
  const { t } = useTranslation('contacts');
  const { toast } = useToast();

  // Initialize with default data, then load from API
  const [notes, setNotes] = useState<Note[]>(() => {
    if (contact?.notes) {
      return [{ id: String(Date.now()), content: contact.notes, createdAt: new Date().toISOString() }];
    }
    return [
      { id: `${Date.now() - 600000}`, content: "Discovery call completed. Good fit.", createdAt: new Date(Date.now() - 600000).toISOString() },
      { id: `${Date.now() - 300000}`, content: "Sent proposal. Awaiting response.", createdAt: new Date(Date.now() - 300000).toISOString() },
    ];
  });
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  // Load notes from API
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const apiNotes = await ContactService.getNotes(contactId);
        if (apiNotes && apiNotes.length > 0) {
          // Convert API notes to local Note format
          const convertedNotes: Note[] = apiNotes.map(note => ({
            id: note.id.toString(),
            content: note.content,
            createdAt: note.createdAt
          }));
          setNotes(convertedNotes);
        }
        setNotesLoaded(true);
      } catch (error) {
        console.error('Failed to load notes:', error);
        setNotesLoaded(true);
      }
    };

    loadNotes();
  }, [contactId]);

  // Load tags from API
  useEffect(() => {
    const loadTags = async () => {
      try {
        const apiTags = await ContactService.getTags(contactId);
        if (apiTags && apiTags.length > 0) {
          setTags(apiTags);
        }
        setTagsLoaded(true);
      } catch (error) {
        console.error('Failed to load tags:', error);
        setTagsLoaded(true);
      }
    };

    loadTags();
  }, [contactId]);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offersLoaded, setOffersLoaded] = useState(false);

  // Load offers from API
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const apiOffers = await ContactService.getOffers(contactId);
        if (apiOffers && apiOffers.length > 0) {
          setOffers(apiOffers);
        }
        setOffersLoaded(true);
      } catch (error) {
        console.error('Failed to load offers:', error);
        setOffersLoaded(true);
      }
    };

    loadOffers();
  }, [contactId]);

  const handleAddNote = (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;
    const newNote: Note = { id: String(Date.now()), content: trimmed, createdAt: new Date().toISOString() };
    setNotes(prev => [newNote, ...prev]);
    toast({ title: t('contacts.toast.note_added_title'), description: t('contacts.toast.note_added_description') });
  };

  const handleAddTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setTags(prev => [trimmed, ...prev]);
    toast({ title: t('contacts.toast.tag_added_title'), description: t('contacts.toast.tag_added_description', { tag: trimmed }) });
  };

  const openEditStatus = (offer: Offer) => { setEditingOffer(offer); setIsEditStatusOpen(true); };
  const handleUpdateOfferStatus = (status: OfferStatus) => {
    if (!editingOffer) return;
    setOffers(prev => prev.map(o => o.id === editingOffer.id ? { ...o, status } : o));
    toast({ title: t('contacts.toast.status_updated_title'), description: t('contacts.toast.status_updated_description', { status }) });
    setEditingOffer(null);
  };

  return {
    notes, setNotes, isAddNoteOpen, setIsAddNoteOpen, handleAddNote,
    tags, setTags, isAddTagOpen, setIsAddTagOpen, handleAddTag,
    offers, setOffers, isAddOfferOpen, setIsAddOfferOpen,
    isEditStatusOpen, setIsEditStatusOpen, editingOffer, setEditingOffer,
    openEditStatus, handleUpdateOfferStatus,
    // Loading states
    notesLoaded, tagsLoaded, offersLoaded,
  };
}
