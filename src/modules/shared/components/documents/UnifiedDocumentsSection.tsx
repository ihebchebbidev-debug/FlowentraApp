import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import {
  FileText,
  Plus,
  Upload,
  File,
  Image,
  Download,
  Eye,
  Trash2,
  Loader2,
  Edit,
  ClipboardList,
  Search,
  Filter,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EntityType, EntityFormDocument } from '../../types/formDocument';
import { useEntityFormDocuments } from '../../hooks/useEntityFormDocuments';
import { FormSelectorModal } from '../form-documents/FormSelectorModal';
import { FormDocumentEditorModal } from '../form-documents/FormDocumentEditorModal';
import { FormDocumentPDFModal } from '../form-documents/FormDocumentPDFModal';
import { DynamicForm } from '@/modules/dynamic-forms/types';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { pdf } from '@react-pdf/renderer';
import { DynamicFormPDFDocument } from '@/modules/dynamic-forms/components/DynamicFormPDFDocument';
import { DocumentsService, UploadProgressInfo } from '@/modules/documents/services/documents.service';
import { Document } from '@/modules/documents/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
// Using explicit buttons instead of dropdown menu here
import { Progress } from '@/components/ui/progress';
import { FilePreviewModal } from './FilePreviewModal';
import DocumentEditorModal from './DocumentEditorModal';

const translations = {
  en: {
    title: 'Documents',
    addDocument: 'Add Document',
    addDynamicForm: 'Add Dynamic Form',
    uploadFile: 'Upload File',
    noDocuments: 'No documents attached',
    noDocumentsHint: 'Click "Add Document" to attach files or dynamic forms',
    deleteConfirmTitle: 'Delete Document',
    deleteConfirmDescription: 'Are you sure you want to delete this document? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    draft: 'Created',
    completed: 'Completed',
    edit: 'Edit',
    view: 'View',
    download: 'Download',
    uploadedBy: 'by',
    dynamicForms: 'Dynamic Forms',
    fileAttachments: 'File Attachments',
    dragDropHint: 'Drag & drop files here or click to browse',
    chooseFiles: 'Choose Files',
    uploading: 'Uploading...',
    uploadSuccess: 'File(s) uploaded successfully',
    uploadError: 'Failed to upload file(s)',
    deleteSuccess: 'Document deleted',
    deleteError: 'Failed to delete document',
    fromEntity: 'From',
    entityOffer: 'Offer',
    entitySale: 'Sale',
    entityServiceOrder: 'Service Order',
    entityDispatch: 'Dispatch',
    entityInstallation: 'Installation',
    searchPlaceholder: 'Search documents...',
    filterByType: 'All types',
    filterPdf: 'PDF',
    filterImages: 'Images',
    filterDocuments: 'Documents',
    filterOther: 'Other',
    clearFilters: 'Clear',
    resultsCount: '{count} result(s)',
    noResults: 'No documents match your search',
    bulkSelected: '{count} document(s) selected',
    bulkDeselectAll: 'Deselect All',
    bulkDeleteSelected: 'Delete Selected',
    bulkDeleteConfirmTitle: 'Delete Selected Documents',
    bulkDeleteConfirmDescription: 'Are you sure you want to delete {count} selected document(s)? This action cannot be undone.',
    selectAll: 'Select All',
  },
  fr: {
    title: 'Documents',
    addDocument: 'Ajouter un Document',
    addDynamicForm: 'Ajouter un Formulaire',
    uploadFile: 'Télécharger un Fichier',
    noDocuments: 'Aucun document attaché',
    noDocumentsHint: 'Cliquez sur "Ajouter un Document" pour joindre des fichiers ou formulaires',
    deleteConfirmTitle: 'Supprimer le Document',
    deleteConfirmDescription: 'Êtes-vous sûr de vouloir supprimer ce document? Cette action est irréversible.',
    cancel: 'Annuler',
    delete: 'Supprimer',
    draft: 'Brouillon',
    completed: 'Complété',
    edit: 'Modifier',
    view: 'Voir',
    download: 'Télécharger',
    uploadedBy: 'par',
    dynamicForms: 'Formulaires Dynamiques',
    fileAttachments: 'Pièces Jointes',
    dragDropHint: 'Glissez-déposez les fichiers ici ou cliquez pour parcourir',
    chooseFiles: 'Choisir des Fichiers',
    uploading: 'Téléchargement en cours...',
    uploadSuccess: 'Fichier(s) téléchargé(s) avec succès',
    uploadError: 'Échec du téléchargement',
    deleteSuccess: 'Document supprimé',
    deleteError: 'Échec de la suppression',
    fromEntity: 'De',
    entityOffer: 'Offre',
    entitySale: 'Vente',
    entityServiceOrder: 'Ordre de Service',
    entityDispatch: 'Intervention',
    entityInstallation: 'Installation',
    searchPlaceholder: 'Rechercher des documents...',
    filterByType: 'Tous les types',
    filterPdf: 'PDF',
    filterImages: 'Images',
    filterDocuments: 'Documents',
    filterOther: 'Autre',
    clearFilters: 'Effacer',
    resultsCount: '{count} résultat(s)',
    noResults: 'Aucun document ne correspond à votre recherche',
    bulkSelected: '{count} document(s) sélectionné(s)',
    bulkDeselectAll: 'Tout désélectionner',
    bulkDeleteSelected: 'Supprimer la sélection',
    bulkDeleteConfirmTitle: 'Supprimer les documents sélectionnés',
    bulkDeleteConfirmDescription: 'Êtes-vous sûr de vouloir supprimer {count} document(s) sélectionné(s)? Cette action est irréversible.',
    selectAll: 'Tout sélectionner',
  },
};

/** Describes a module association for document queries */
export interface DocumentEntityRef {
  moduleType: 'offers' | 'sales' | 'services' | 'field' | 'projects' | 'hr';
  moduleId: string;
  label?: string; // e.g. "Offer", "Sale" for badge display
}

interface UnifiedDocumentsSectionProps {
  entityType: EntityType;
  entityId: number | string;
  /** The moduleType used when uploading to backend */
  moduleType: 'offers' | 'sales' | 'services' | 'field' | 'projects' | 'hr';
  /** Human-readable name for the module (shown in Documents module) */
  moduleName?: string;
  /** Additional related entities to fetch documents from (for upward propagation) */
  relatedEntities?: DocumentEntityRef[];
  showFileUpload?: boolean;
}

export function UnifiedDocumentsSection({
  entityType,
  entityId,
  moduleType,
  moduleName,
  relatedEntities,
  showFileUpload = true
}: UnifiedDocumentsSectionProps) {
  // Stabilize relatedEntities to avoid infinite re-render loops from default [] reference
  const stableRelatedEntities = useMemo(
    () => relatedEntities ?? [],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(relatedEntities)]
  );
  const { i18n } = useTranslation();
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    documents: formDocuments,
    loading: formLoading,
    createDocument,
    updateDocument,
    deleteDocument: deleteFormDocument,
  } = useEntityFormDocuments(entityType, entityId);

  // File documents from backend
  const [fileDocuments, setFileDocuments] = useState<Document[]>([]);
  const [fileLoading, setFileLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const entityIdStr = String(entityId);

  // Map moduleType to entity label
  const getEntityLabel = (modType: string): string => {
    switch (modType) {
      case 'offers': return language === 'fr' ? t.entityOffer : t.entityOffer;
      case 'sales': return language === 'fr' ? t.entitySale : t.entitySale;
      case 'services': return language === 'fr' ? t.entityServiceOrder : t.entityServiceOrder;
      case 'field': return language === 'fr' ? t.entityDispatch : t.entityDispatch;
      default: return modType;
    }
  };

  // Fetch file documents from backend
  const fetchFileDocuments = useCallback(async () => {
    try {
      setFileLoading(true);
      // Fetch docs for this entity
      const allDocs = await DocumentsService.getDocuments({
        moduleType,
      });
      // Filter by moduleId client-side (API may not support moduleId filter directly)
      let ownDocs = allDocs.filter(d => d.moduleId === entityIdStr);

      // Fetch docs from related (child) entities in parallel and dedupe
      const relatedDocs: Document[] = [];
      try {
        const relPromises = stableRelatedEntities.map(rel =>
          DocumentsService.getDocuments({ moduleType: rel.moduleType })
            .then(docs => docs.filter(d => d.moduleId === rel.moduleId)
              .map(d => { (d as any)._fromEntity = rel.label || getEntityLabel(rel.moduleType); return d; })
            )
            .catch(() => [] as Document[])
        );

        const relResults = await Promise.all(relPromises);
        relResults.forEach(r => relatedDocs.push(...r));
      } catch {
        // ignore
      }

      // Merge ownDocs + relatedDocs and dedupe by id
      const all = [...ownDocs, ...relatedDocs];
      const seen = new Set<string>();
      const deduped: Document[] = [];
      for (const d of all) {
        if (!seen.has(d.id)) {
          seen.add(d.id);
          deduped.push(d);
        }
      }

      setFileDocuments(deduped);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
      setFileDocuments([]);
    } finally {
      setFileLoading(false);
    }
  }, [moduleType, entityIdStr, stableRelatedEntities]);

  useEffect(() => {
    fetchFileDocuments();
  }, [fetchFileDocuments]);

  const [showFormSelector, setShowFormSelector] = useState(false);
  const [showDocEditor, setShowDocEditor] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [editingDocument, setEditingDocument] = useState<EntityFormDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<EntityFormDocument | null>(null);
  const [deletingFormDoc, setDeletingFormDoc] = useState<EntityFormDocument | null>(null);
  const [deletingFileDoc, setDeletingFileDoc] = useState<Document | null>(null);
  const [previewingFile, setPreviewingFile] = useState<Document | null>(null);

  // Bulk selection state
  const [selectedFormIds, setSelectedFormIds] = useState<Set<number>>(new Set());
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set());
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  const numericEntityId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;

  // Handle form selection
  const handleFormSelected = async (form: DynamicForm) => {
    try {
      await createDocument({
        entity_type: entityType,
        entity_id: numericEntityId,
        form_id: form.id,
        title: undefined,
        status: 'draft',
        responses: {},
      });
      setShowFormSelector(false);
      toast.success(language === 'fr' ? 'Formulaire ajouté' : 'Form added');
    } catch (error) {
      console.error('Failed to add form:', error);
      toast.error(language === 'fr' ? 'Échec de l\'ajout' : 'Failed to add form');
    }
  };

  const handleEditDocument = (doc: EntityFormDocument) => {
    setEditingDocument(doc);
    setSelectedForm(null);
    setShowEditor(true);
  };

  const handleViewPDF = (doc: EntityFormDocument) => {
    setViewingDocument(doc);
    setShowPDF(true);
  };

  const handleDownloadFormPDF = async (doc: EntityFormDocument) => {
    try {
      const form = await dynamicFormsService.getById(doc.form_id);
      if (!form) return;

      const formName = language === 'en' ? form.name_en : form.name_fr;
      const fileName = doc.title
        ? `${doc.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
        : `${formName.replace(/[^a-z0-9]/gi, '_')}_${doc.id}.pdf`;

      const blob = await pdf(
        <DynamicFormPDFDocument
          form={form}
          formValues={doc.responses}
          language={language}
          submittedBy={doc.created_by_name || doc.created_by}
          submittedAt={new Date(doc.created_at)}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download PDF:', error);
    }
  };

  const handleDeleteFormClick = (doc: EntityFormDocument) => {
    setDeletingFormDoc(doc);
    setDeletingFileDoc(null);
    setShowDeleteConfirm(true);
  };

  const handleDeleteFileClick = (doc: Document) => {
    setDeletingFileDoc(doc);
    setDeletingFormDoc(null);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingFormDoc) {
      await deleteFormDocument(deletingFormDoc.id);
      setDeletingFormDoc(null);
      toast.success(t.deleteSuccess);
    }
    if (deletingFileDoc) {
      try {
        await DocumentsService.deleteDocument(deletingFileDoc.id);
        setFileDocuments(prev => prev.filter(d => d.id !== deletingFileDoc!.id));
        toast.success(t.deleteSuccess);
      } catch {
        toast.error(t.deleteError);
      }
      setDeletingFileDoc(null);
    }
    setShowDeleteConfirm(false);
  };

  const handleSaveDocument = async (
    responses: Record<string, any>,
    title: string,
    markComplete: boolean
  ) => {
    if (editingDocument) {
      await updateDocument({
        id: editingDocument.id,
        responses,
        title: title || undefined,
        status: markComplete ? 'completed' : 'draft',
      });
    }

    setShowEditor(false);
    setSelectedForm(null);
    setEditingDocument(null);
  };

  // Shared upload logic
  const uploadFiles = async (fileList: File[]) => {
    if (fileList.length === 0) return;
    try {
      setUploading(true);
      setUploadProgress(0);

      const category: 'crm' | 'field' = (moduleType === 'offers' || moduleType === 'sales') ? 'crm' : 'field';

      const uploadedDocs = await DocumentsService.uploadDocuments(
        {
          files: fileList,
          moduleType,
          moduleId: entityIdStr,
          moduleName: moduleName || `${moduleType}-${entityIdStr}`,
          category,
        },
        (info: UploadProgressInfo) => {
          setUploadProgress(info.percent);
        }
      );

      setFileDocuments(prev => [...uploadedDocs, ...prev]);
      toast.success(t.uploadSuccess);
    } catch (error) {
      console.error('Upload failed:', error);
      toast.error(t.uploadError);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // File input handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current++;
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current--;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, [uploadFiles]);

  const handleDownloadFile = async (doc: Document) => {
    try {
      if ((doc as any).externalUrl) {
        // External links — open in new tab
        window.open((doc as any).externalUrl, '_blank');
        return;
      }
      await DocumentsService.downloadDocument(doc);
    } catch {
      toast.error(language === 'fr' ? 'Échec du téléchargement' : 'Download failed');
    }
  };

  const handlePreviewFile = (doc: Document) => {
    if ((doc as any).externalUrl) {
      window.open((doc as any).externalUrl, '_blank');
      return;
    }
    setPreviewingFile(doc);
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="h-5 w-5 text-destructive" />;
      case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp':
        return <Image className="h-5 w-5 text-primary" />;
      default:
        return <File className="h-5 w-5 text-muted-foreground" />;
    }
  };

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');

  // File type categorization helper
  const getFileCategory = (fileType: string): string => {
    if (fileType === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'].includes(fileType)) return 'images';
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'odt', 'ods'].includes(fileType)) return 'documents';
    return 'other';
  };

  // Filter form documents
  const filteredFormDocuments = formDocuments.filter(doc => {
    if (!searchQuery && fileTypeFilter === 'all') return true;
    const formName = language === 'en' ? doc.form_name_en : doc.form_name_fr;
    const displayName = doc.title || formName;
    const matchesSearch = !searchQuery || displayName.toLowerCase().includes(searchQuery.toLowerCase()) || formName.toLowerCase().includes(searchQuery.toLowerCase());
    // Form documents are always "documents" type
    const matchesType = fileTypeFilter === 'all' || fileTypeFilter === 'documents';
    return matchesSearch && matchesType;
  });

  // Filter file documents
  const filteredFileDocuments = fileDocuments.filter(doc => {
    if (!searchQuery && fileTypeFilter === 'all') return true;
    const name = (doc.originalName || doc.fileName).toLowerCase();
    const matchesSearch = !searchQuery || name.includes(searchQuery.toLowerCase());
    const matchesType = fileTypeFilter === 'all' || getFileCategory(doc.fileType) === fileTypeFilter;
    return matchesSearch && matchesType;
  });

  const hasActiveFilters = searchQuery !== '' || fileTypeFilter !== 'all';

  const loading = formLoading || fileLoading;
  const totalItems = formDocuments.length + fileDocuments.length;
  const filteredTotal = filteredFormDocuments.length + filteredFileDocuments.length;

  // Bulk selection helpers (after filtered lists are computed)
  const totalSelected = selectedFormIds.size + selectedFileIds.size;
  const selectableFileCount = filteredFileDocuments.filter(d => !(d as any)._fromEntity).length;
  const allSelectableSelected = totalSelected > 0 &&
    selectedFormIds.size === filteredFormDocuments.length &&
    selectedFileIds.size === selectableFileCount;

  const toggleFormSelection = (id: number) => {
    setSelectedFormIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleFileSelection = (id: string) => {
    setSelectedFileIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedFormIds(new Set(filteredFormDocuments.map(d => d.id)));
      setSelectedFileIds(new Set(filteredFileDocuments.filter(d => !(d as any)._fromEntity).map(d => d.id)));
    } else {
      setSelectedFormIds(new Set());
      setSelectedFileIds(new Set());
    }
  };

  const handleDeselectAll = () => {
    setSelectedFormIds(new Set());
    setSelectedFileIds(new Set());
  };

  const handleBulkDelete = async () => {
    for (const id of selectedFormIds) {
      await deleteFormDocument(id);
    }
    for (const id of selectedFileIds) {
      try { await DocumentsService.deleteDocument(id); } catch { /* continue */ }
    }
    setFileDocuments(prev => prev.filter(d => !selectedFileIds.has(d.id)));
    const count = totalSelected;
    setSelectedFormIds(new Set());
    setSelectedFileIds(new Set());
    setShowBulkDeleteConfirm(false);
    toast.success(language === 'fr' ? `${count} document(s) supprimé(s)` : `${count} document(s) deleted`);
  };

  // Clear selection when filters change
  useEffect(() => {
    setSelectedFormIds(new Set());
    setSelectedFileIds(new Set());
  }, [searchQuery, fileTypeFilter]);

  return (
    <Card
      className={`hover:shadow-lg transition-all duration-200 relative ${isDragging ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-primary/5 border-2 border-dashed border-primary rounded-lg backdrop-blur-sm">
          <div className="text-center">
            <Upload className="h-10 w-10 mx-auto mb-2 text-primary animate-bounce" />
            <p className="text-sm font-medium text-primary">{t.dragDropHint}</p>
          </div>
        </div>
      )}
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t.title}
            {totalItems > 0 && (
              <Badge variant="secondary" className="ml-2">
                {totalItems}
              </Badge>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            <Button size="sm" className="gap-2" disabled={uploading} onClick={() => setShowDocEditor(true)}>
              <Plus className="h-4 w-4" />
              {t.addDocument}
            </Button>
            {showFileUpload && (
              <Button size="sm" variant="ghost" className="gap-2" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="h-4 w-4" />
                {t.uploadFile}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
          />

          <DocumentEditorModal
            open={showDocEditor}
            onOpenChange={(open) => setShowDocEditor(open)}
            moduleType={moduleType}
            moduleId={entityIdStr}
            moduleName={moduleName}
            showFileUpload={showFileUpload}
            onCreated={(docs) => {
              if (docs && docs.length > 0) {
                setFileDocuments(prev => [...docs, ...prev]);
              }
            }}
          />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Upload Progress */}
        {uploading && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-4 w-4 rounded-full bg-primary/30 animate-pulse" />
              {t.uploading}
            </div>
            <Progress value={uploadProgress} className="h-2" />
          </div>
        )}

        {loading ? (
          <ContentSkeleton rows={4} />
        ) : totalItems === 0 ? (
          <div
            className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t.noDocuments}</p>
            <p className="text-sm">{t.dragDropHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t.searchPlaceholder}
                  className="w-full pl-9 pr-8 py-2 text-sm rounded-md border border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <select
                    value={fileTypeFilter}
                    onChange={(e) => setFileTypeFilter(e.target.value)}
                    className="pl-9 pr-8 py-2 text-sm rounded-md border border-input bg-background ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 appearance-none cursor-pointer"
                  >
                    <option value="all">{t.filterByType}</option>
                    <option value="pdf">{t.filterPdf}</option>
                    <option value="images">{t.filterImages}</option>
                    <option value="documents">{t.filterDocuments}</option>
                    <option value="other">{t.filterOther}</option>
                  </select>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setSearchQuery(''); setFileTypeFilter('all'); }}
                    className="h-9 px-2 text-muted-foreground"
                  >
                    <X className="h-4 w-4 mr-1" />
                    {t.clearFilters}
                  </Button>
                )}
              </div>
            </div>

            {/* Filtered results info */}
            {hasActiveFilters && (
              <p className="text-xs text-muted-foreground">
                {t.resultsCount.replace('{count}', String(filteredTotal))}
              </p>
            )}

            {/* Bulk Action Bar */}
            {totalSelected > 0 && (
              <div className="sticky top-0 z-30 bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={allSelectableSelected}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium text-foreground">
                      {t.bulkSelected.replace('{count}', String(totalSelected))}
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleDeselectAll} className="text-muted-foreground">
                      {t.bulkDeselectAll}
                    </Button>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowBulkDeleteConfirm(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t.bulkDeleteSelected}
                  </Button>
                </div>
              </div>
            )}

            {/* Dynamic Form Documents */}
            {filteredFormDocuments.map((doc) => {
              const formName = language === 'en' ? doc.form_name_en : doc.form_name_fr;
              const displayName = doc.title || formName;

              return (
                <div
                  key={`form-${doc.id}`}
                  className={`flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all group ${selectedFormIds.has(doc.id) ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                >
                  <Checkbox
                    checked={selectedFormIds.has(doc.id)}
                    onCheckedChange={() => toggleFormSelection(doc.id)}
                    className="flex-shrink-0"
                  />
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium break-words line-clamp-2">{displayName}</h4>
                      <Badge
                        variant={doc.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {doc.status === 'completed' ? t.completed : t.draft}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formName} • {format(new Date(doc.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleEditDocument(doc)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {doc.status === 'completed' && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleViewPDF(doc)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => handleDownloadFormPDF(doc)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => handleDeleteFormClick(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {/* Separator between forms and files */}
            {filteredFormDocuments.length > 0 && filteredFileDocuments.length > 0 && (
              <Separator />
            )}

            {/* File Documents from Backend */}
            {filteredFileDocuments.map((doc) => {
              const fromEntity = (doc as any)._fromEntity as string | undefined;

              return (
                <div
                  key={`file-${doc.id}`}
                  className={`flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all group ${!fromEntity && selectedFileIds.has(doc.id) ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                >
                  {!fromEntity && (
                    <Checkbox
                      checked={selectedFileIds.has(doc.id)}
                      onCheckedChange={() => toggleFileSelection(doc.id)}
                      className="flex-shrink-0"
                    />
                  )}
                  <div className="flex-shrink-0 p-2 rounded-lg bg-muted">
                    {getFileIcon(doc.fileType)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium break-words line-clamp-2">{doc.originalName || doc.fileName}</h4>
                      {fromEntity && (
                        <Badge variant="outline" className="text-xs">
                          {t.fromEntity} {fromEntity}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {DocumentsService.formatFileSize(doc.fileSize)} • {t.uploadedBy} {doc.uploadedByName} • {format(doc.uploadedAt, 'MMM d, yyyy')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handlePreviewFile(doc)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleDownloadFile(doc)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    {!fromEntity && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDeleteFileClick(doc)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Form Selector Modal */}
      <FormSelectorModal
        open={showFormSelector}
        onOpenChange={setShowFormSelector}
        onSelectForm={handleFormSelected}
        language={language}
      />

      {/* Form Editor Modal */}
      <FormDocumentEditorModal
        open={showEditor}
        onOpenChange={(open) => {
          setShowEditor(open);
          if (!open) {
            setSelectedForm(null);
            setEditingDocument(null);
          }
        }}
        form={selectedForm || undefined}
        document={editingDocument || undefined}
        onSave={handleSaveDocument}
      />

      {/* PDF Preview Modal */}
      {viewingDocument && (
        <FormDocumentPDFModal
          open={showPDF}
          onOpenChange={(open) => {
            setShowPDF(open);
            if (!open) setViewingDocument(null);
          }}
          document={viewingDocument}
        />
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.deleteConfirmDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={showBulkDeleteConfirm} onOpenChange={setShowBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.bulkDeleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.bulkDeleteConfirmDescription.replace('{count}', String(totalSelected))}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.bulkDeleteSelected}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* File Preview Modal */}
      <FilePreviewModal
        open={!!previewingFile}
        onOpenChange={(open) => {
          if (!open) setPreviewingFile(null);
        }}
        document={previewingFile}
      />
    </Card>
  );
}
