import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Document, DocumentFilters, DocumentStats } from '../types';
import { DocumentsService } from '../services/documents.service';

export const useDocuments = (filters?: DocumentFilters) => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [documentsData, statsData] = await Promise.all([
        DocumentsService.getDocuments(filters),
        DocumentsService.getDocumentStats()
      ]);
      setDocuments(documentsData);
      setStats(statsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch documents');
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      await DocumentsService.deleteDocument(id);
      setDocuments(prev => prev.filter(doc => doc.id !== id));
      toast.success(t('documents.documentDeleted'));
      
      // Refresh stats
      const newStats = await DocumentsService.getDocumentStats();
      setStats(newStats);
    } catch (err) {
      toast.error(t('documents.failedToDelete'));
      throw err;
    }
  }, [t]);

  const bulkDeleteDocuments = useCallback(async (ids: string[]) => {
    try {
      await DocumentsService.bulkDeleteDocuments(ids);
      setDocuments(prev => prev.filter(doc => !ids.includes(doc.id)));
      toast.success(t('documents.bulkDeleteSuccess', { count: ids.length }));

      const newStats = await DocumentsService.getDocumentStats();
      setStats(newStats);
    } catch (err) {
      toast.error(t('documents.bulkDeleteError'));
      throw err;
    }
  }, [t]);

  const downloadDocument = useCallback(async (doc: Document) => {
    try {
      await DocumentsService.downloadDocument(doc);
    } catch (err) {
      toast.error(t('documents.downloadError', 'Failed to download document'));
    }
  }, [t]);

  return {
    documents,
    stats,
    loading,
    error,
    refetch: fetchDocuments,
    deleteDocument,
    bulkDeleteDocuments,
    downloadDocument,
  };
};
