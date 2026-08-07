import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { ContactService } from "../services/contacts.service";
import { contactTagsApi, contactsApi } from "@/services/contactsApi";

export type OfferStatus = "pending" | "negotiation" | "won" | "lost";
export interface Offer { id: string; title: string; amount: number; status: OfferStatus; createdAt: string; }
export interface Note { id: string; content: string; createdAt: string; }

export function useContactDetail(contact: any, contactId: string) {
  const { t } = useTranslation('contacts');
  const { toast } = useToast();

  const [notes, setNotes] = useState<Note[]>([]);
  const [isAddNoteOpen, setIsAddNoteOpen] = useState(false);
  const [notesLoaded, setNotesLoaded] = useState(false);

  const [tags, setTags] = useState<string[]>([]);
  const [isAddTagOpen, setIsAddTagOpen] = useState(false);
  const [tagsLoaded, setTagsLoaded] = useState(false);

  // Load notes from API
  useEffect(() => {
    let cancelled = false;
    const loadNotes = async () => {
      try {
        const apiNotes = await ContactService.getNotes(contactId);
        if (cancelled) return;
        const converted: Note[] = (apiNotes || []).map(n => ({
          id: n.id.toString(),
          content: n.content,
          createdAt: n.createdAt,
        }));
        setNotes(converted);
      } catch (error) {
        console.error('Failed to load notes:', error);
      } finally {
        if (!cancelled) setNotesLoaded(true);
      }
    };
    loadNotes();
    return () => { cancelled = true; };
  }, [contactId]);

  // Load tags from API
  useEffect(() => {
    let cancelled = false;
    const loadTags = async () => {
      try {
        const apiTags = await ContactService.getTags(contactId);
        if (!cancelled) setTags(apiTags || []);
      } catch (error) {
        console.error('Failed to load tags:', error);
      } finally {
        if (!cancelled) setTagsLoaded(true);
      }
    };
    loadTags();
    return () => { cancelled = true; };
  }, [contactId]);

  const [offers, setOffers] = useState<Offer[]>([]);
  const [isAddOfferOpen, setIsAddOfferOpen] = useState(false);
  const [isEditStatusOpen, setIsEditStatusOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [offersLoaded, setOffersLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loadOffers = async () => {
      try {
        const apiOffers = await ContactService.getOffers(contactId);
        if (!cancelled) setOffers(apiOffers || []);
      } catch (error) {
        console.error('Failed to load offers:', error);
      } finally {
        if (!cancelled) setOffersLoaded(true);
      }
    };
    loadOffers();
    return () => { cancelled = true; };
  }, [contactId]);

  // Persist a new note to the backend, then update local state on success.
  const handleAddNote = async (content: string) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const created = await ContactService.createNote(contactId, trimmed);
    if (!created) {
      toast({
        title: t('contacts.toast.note_added_title'),
        description: 'Failed to save note. Please try again.',
        variant: 'destructive',
      });
      return;
    }

    setNotes(prev => [
      { id: created.id.toString(), content: created.content, createdAt: created.createdAt },
      ...prev,
    ]);
    toast({ title: t('contacts.toast.note_added_title'), description: t('contacts.toast.note_added_description') });
  };

  // Persist a new tag: reuse an existing tag by name or create it, then assign.
  const handleAddTag = async (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    if (tags.some(existing => existing.toLowerCase() === trimmed.toLowerCase())) return;

    try {
      const allTags = await contactTagsApi.getAll();
      let target = (allTags || []).find(
        (x: any) => (x?.name ?? '').toLowerCase() === trimmed.toLowerCase()
      );
      if (!target) {
        target = await contactTagsApi.create({ name: trimmed });
      }
      if (!target?.id) throw new Error('Tag has no id');
      await contactsApi.assignTag(Number(contactId), Number(target.id));

      setTags(prev => [trimmed, ...prev]);
      toast({
        title: t('contacts.toast.tag_added_title'),
        description: t('contacts.toast.tag_added_description', { tag: trimmed }),
      });
    } catch (error) {
      console.error('Failed to add tag:', error);
      toast({
        title: t('contacts.toast.tag_added_title'),
        description: 'Failed to save tag. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const openEditStatus = (offer: Offer) => { setEditingOffer(offer); setIsEditStatusOpen(true); };

  // Offers backend endpoint does not exist yet (ContactService.getOffers is a
  // stub). Update in-memory so the UI works, but mark the toast so the user
  // knows this is not persisted until the offers API ships.
  const handleUpdateOfferStatus = (status: OfferStatus) => {
    if (!editingOffer) return;
    setOffers(prev => prev.map(o => o.id === editingOffer.id ? { ...o, status } : o));
    toast({
      title: t('contacts.toast.status_updated_title'),
      description: t('contacts.toast.status_updated_description', { status }),
    });
    setEditingOffer(null);
  };

  return {
    notes, setNotes, isAddNoteOpen, setIsAddNoteOpen, handleAddNote,
    tags, setTags, isAddTagOpen, setIsAddTagOpen, handleAddTag,
    offers, setOffers, isAddOfferOpen, setIsAddOfferOpen,
    isEditStatusOpen, setIsEditStatusOpen, editingOffer, setEditingOffer,
    openEditStatus, handleUpdateOfferStatus,
    notesLoaded, tagsLoaded, offersLoaded,
  };
}
