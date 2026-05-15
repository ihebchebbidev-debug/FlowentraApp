import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { 
  EntityFormDocument, 
  EntityType, 
  CreateEntityFormDocumentDto, 
  UpdateEntityFormDocumentDto 
} from '../types/formDocument';
import { entityFormDocumentsService } from '../services/entityFormDocumentsService';

const translations = {
  en: {
    created: 'Form document created',
    updated: 'Form document updated',
    deleted: 'Form document deleted',
    completed: 'Form document marked as completed',
    fetchError: 'Failed to fetch form documents',
    createError: 'Failed to create document',
    updateError: 'Failed to update document',
    deleteError: 'Failed to delete document',
    completeError: 'Failed to mark as completed',
  },
  fr: {
    created: 'Document formulaire créé',
    updated: 'Document formulaire mis à jour',
    deleted: 'Document formulaire supprimé',
    completed: 'Document formulaire marqué comme complété',
    fetchError: 'Échec du chargement des documents',
    createError: 'Échec de la création du document',
    updateError: 'Échec de la mise à jour du document',
    deleteError: 'Échec de la suppression du document',
    completeError: 'Échec du marquage comme complété',
  },
};

interface UseEntityFormDocumentsResult {
  documents: EntityFormDocument[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createDocument: (dto: CreateEntityFormDocumentDto) => Promise<EntityFormDocument | null>;
  updateDocument: (dto: UpdateEntityFormDocumentDto) => Promise<EntityFormDocument | null>;
  deleteDocument: (id: number) => Promise<boolean>;
  markCompleted: (id: number) => Promise<EntityFormDocument | null>;
}

export function useEntityFormDocuments(
  entityType: EntityType,
  entityId: number | string
): UseEntityFormDocumentsResult {
  const { i18n } = useTranslation();
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];
  
  const [documents, setDocuments] = useState<EntityFormDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const numericEntityId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;

  const fetchDocuments = useCallback(async () => {
    if (!numericEntityId || isNaN(numericEntityId)) {
      setDocuments([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await entityFormDocumentsService.getByEntity(entityType, numericEntityId);
      setDocuments(data);
    } catch (err) {
      console.error('Failed to fetch form documents:', err);
      setError(err instanceof Error ? err.message : t.fetchError);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [entityType, numericEntityId, t.fetchError]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const createDocument = useCallback(async (dto: CreateEntityFormDocumentDto) => {
    try {
      const newDoc = await entityFormDocumentsService.create(dto);
      setDocuments(prev => [...prev, newDoc]);
      toast.success(t.created);
      return newDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : t.createError;
      toast.error(message);
      return null;
    }
  }, [t.created, t.createError]);

  const updateDocument = useCallback(async (dto: UpdateEntityFormDocumentDto) => {
    try {
      const updatedDoc = await entityFormDocumentsService.update(dto);
      setDocuments(prev => prev.map(doc => doc.id === dto.id ? updatedDoc : doc));
      toast.success(t.updated);
      return updatedDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : t.updateError;
      toast.error(message);
      return null;
    }
  }, [t.updated, t.updateError]);

  const deleteDocument = useCallback(async (id: number) => {
    try {
      await entityFormDocumentsService.delete(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success(t.deleted);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : t.deleteError;
      toast.error(message);
      return false;
    }
  }, [t.deleted, t.deleteError]);

  const markCompleted = useCallback(async (id: number) => {
    try {
      const updatedDoc = await entityFormDocumentsService.markCompleted(id);
      setDocuments(prev => prev.map(doc => doc.id === id ? updatedDoc : doc));
      toast.success(t.completed);
      return updatedDoc;
    } catch (err) {
      const message = err instanceof Error ? err.message : t.completeError;
      toast.error(message);
      return null;
    }
  }, [t.completed, t.completeError]);

  return {
    documents,
    loading,
    error,
    refetch: fetchDocuments,
    createDocument,
    updateDocument,
    deleteDocument,
    markCompleted,
  };
}
