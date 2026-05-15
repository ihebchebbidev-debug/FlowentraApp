import { useState, useEffect, useCallback } from 'react';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ClipboardList,
  Plus,
  Download,
  Eye,
  Trash2,
  Loader2,
  Edit,
  FileText,
  ShoppingCart,
  StickyNote
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { EntityType, EntityFormDocument } from '../../types/formDocument';
import { useEntityFormDocuments } from '../../hooks/useEntityFormDocuments';
import { entityFormDocumentsService } from '../../services/entityFormDocumentsService';
import { FormSelectorModal } from '../form-documents/FormSelectorModal';
import { FormDocumentEditorModal } from '../form-documents/FormDocumentEditorModal';
import { FormDocumentPDFModal } from '../form-documents/FormDocumentPDFModal';
import { DynamicForm } from '@/modules/dynamic-forms/types';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { pdf } from '@react-pdf/renderer';
import { DynamicFormPDFDocument } from '@/modules/dynamic-forms/components/DynamicFormPDFDocument';
import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { dispatchesApi } from '@/services/api/dispatchesApi';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const translations = {
  en: {
    title: 'Checklists',
    addChecklist: 'Add Checklist',
    noChecklists: 'No checklists attached',
    noChecklistsHint: 'Click "Add Checklist" to attach a dynamic form',
    deleteConfirmTitle: 'Delete Checklist',
    deleteConfirmDescription: 'Are you sure you want to delete this checklist? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
    draft: 'Created',
    completed: 'Completed',
    edit: 'Edit',
    view: 'View',
    download: 'Download',
    addedInOffer: 'Offer',
    addedInSale: 'Sale',
    addedInServiceOrder: 'Service Order',
    addedInDispatch: 'Dispatch',
    addChecklistTitle: 'Add Checklist',
    addChecklistDescription: 'Select a form and optionally add a note',
    selectForm: 'Select Form',
    noteLabel: 'Note (optional)',
    notePlaceholder: 'Add a note or description for this checklist...',
    add: 'Add',
    noNote: 'No note',
    checklistAddedNote: 'Checklist added: {{formName}}',
    checklistAddedDetails: 'A new checklist "{{formName}}" has been added.',
    checklistAddedFromNote: 'Checklist added from {{source}}: {{formName}}',
    checklistAddedFromDetails: 'A new checklist "{{formName}}" has been added from {{source}}.',
    checklistCompletedNote: 'Checklist completed: {{formName}}',
    checklistCompletedDetails: 'The checklist "{{formName}}" has been completed.',
    checklistCompletedFromNote: 'Checklist completed from {{source}}: {{formName}}',
    checklistCompletedFromDetails: 'The checklist "{{formName}}" has been completed from {{source}}.',
  },
  fr: {
    title: 'Checklists',
    addChecklist: 'Ajouter un Checklist',
    noChecklists: 'Aucun checklist attaché',
    noChecklistsHint: 'Cliquez sur "Ajouter un Checklist" pour joindre un formulaire dynamique',
    deleteConfirmTitle: 'Supprimer le Checklist',
    deleteConfirmDescription: 'Êtes-vous sûr de vouloir supprimer ce checklist? Cette action est irréversible.',
    cancel: 'Annuler',
    delete: 'Supprimer',
    draft: 'Brouillon',
    completed: 'Complété',
    edit: 'Modifier',
    view: 'Voir',
    download: 'Télécharger',
    addedInOffer: 'Offre',
    addedInSale: 'Vente',
    addedInServiceOrder: 'Ordre de Service',
    addedInDispatch: 'Intervention',
    addChecklistTitle: 'Ajouter un Checklist',
    addChecklistDescription: 'Sélectionnez un formulaire et ajoutez une note optionnelle',
    selectForm: 'Sélectionner un Formulaire',
    noteLabel: 'Note (optionnel)',
    notePlaceholder: 'Ajouter une note ou description pour ce checklist...',
    add: 'Ajouter',
    noNote: 'Aucune note',
    checklistAddedNote: 'Checklist ajouté : {{formName}}',
    checklistAddedDetails: 'Un nouveau checklist "{{formName}}" a été ajouté.',
    checklistAddedFromNote: 'Checklist ajouté depuis {{source}} : {{formName}}',
    checklistAddedFromDetails: 'Un nouveau checklist "{{formName}}" a été ajouté depuis {{source}}.',
    checklistCompletedNote: 'Checklist complété : {{formName}}',
    checklistCompletedDetails: 'Le checklist "{{formName}}" a été complété.',
    checklistCompletedFromNote: 'Checklist complété depuis {{source}} : {{formName}}',
    checklistCompletedFromDetails: 'Le checklist "{{formName}}" a été complété depuis {{source}}.',
  },
};

interface ChecklistsSectionProps {
  entityType: EntityType;
  entityId: number | string;
  linkedEntityType?: EntityType;
  linkedEntityId?: number | string;
}

interface ExtendedFormDocument extends EntityFormDocument {
  source: EntityType;
}

export function ChecklistsSection({
  entityType,
  entityId,
  linkedEntityType,
  linkedEntityId,
}: ChecklistsSectionProps) {
  const { i18n } = useTranslation();
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];

  const {
    documents: mainDocuments,
    loading: mainLoading,
    createDocument,
    updateDocument,
    deleteDocument,
    refetch: refetchMain,
  } = useEntityFormDocuments(entityType, entityId);

  // Fetch linked entity documents
  const [linkedDocuments, setLinkedDocuments] = useState<EntityFormDocument[]>([]);
  const [linkedLoading, setLinkedLoading] = useState(false);

  const fetchLinkedDocuments = useCallback(async () => {
    if (!linkedEntityType || !linkedEntityId) {
      setLinkedDocuments([]);
      return;
    }

    const numericId = typeof linkedEntityId === 'string' ? parseInt(linkedEntityId, 10) : linkedEntityId;
    if (isNaN(numericId)) {
      setLinkedDocuments([]);
      return;
    }

    try {
      setLinkedLoading(true);
      const data = await entityFormDocumentsService.getByEntity(linkedEntityType, numericId);
      setLinkedDocuments(data);
    } catch (err) {
      console.error('Failed to fetch linked form documents:', err);
      setLinkedDocuments([]);
    } finally {
      setLinkedLoading(false);
    }
  }, [linkedEntityType, linkedEntityId]);

  useEffect(() => {
    fetchLinkedDocuments();
  }, [fetchLinkedDocuments]);

  // Combine documents with source indication
  const allDocuments: ExtendedFormDocument[] = [
    ...mainDocuments.map(doc => ({ ...doc, source: entityType })),
    ...linkedDocuments.map(doc => ({ ...doc, source: linkedEntityType as EntityType })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const loading = mainLoading || linkedLoading;

  const [showFormSelector, setShowFormSelector] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [checklistNote, setChecklistNote] = useState('');
  const [editingDocument, setEditingDocument] = useState<ExtendedFormDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<ExtendedFormDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<ExtendedFormDocument | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const numericEntityId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;

  // Handle form selection from modal
  const handleFormSelected = (form: DynamicForm) => {
    setSelectedForm(form);
    setShowFormSelector(false);
    setShowAddDialog(true);
  };

  // Handle creating the checklist with note
  const handleCreateChecklist = async () => {
    if (!selectedForm) return;

    setIsCreating(true);
    try {
      await createDocument({
        entity_type: entityType,
        entity_id: numericEntityId,
        form_id: selectedForm.id,
        title: checklistNote.trim() || undefined,
        status: 'draft',
        responses: {},
      });

      // Get form name for the note
      const formName = language === 'en' ? selectedForm.name_en : selectedForm.name_fr;

      // Propagate checklist added note to all linked entities in the chain
      await propagateChecklistNote(formName, entityType, numericEntityId, 'added');

      setShowAddDialog(false);
      setSelectedForm(null);
      setChecklistNote('');
      toast.success(language === 'fr' ? 'Checklist ajouté' : 'Checklist added');
    } catch (error) {
      console.error('Failed to add checklist:', error);
      toast.error(language === 'fr' ? 'Échec de l\'ajout' : 'Failed to add checklist');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditDocument = (doc: ExtendedFormDocument) => {
    setEditingDocument(doc);
    setSelectedForm(null);
    setShowEditor(true);
  };

  const handleViewPDF = (doc: ExtendedFormDocument) => {
    setViewingDocument(doc);
    setShowPDF(true);
  };

  const handleDownloadFormPDF = async (doc: ExtendedFormDocument) => {
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

  const handleDeleteClick = (doc: ExtendedFormDocument) => {
    setDeletingDocument(doc);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingDocument) {
      // Check if deleting from main or linked entity
      if (deletingDocument.source === entityType) {
        await deleteDocument(deletingDocument.id);
      } else {
        // Delete from linked entity
        try {
          await entityFormDocumentsService.delete(deletingDocument.id);
          await fetchLinkedDocuments();
          toast.success(language === 'fr' ? 'Document formulaire supprimé' : 'Form document deleted');
        } catch (err) {
          toast.error(language === 'fr' ? 'Échec de la suppression' : 'Failed to delete');
        }
      }
      setDeletingDocument(null);
    }
    setShowDeleteConfirm(false);
  };

  // Helper to get entity type label for notes
  const getEntityLabel = (eType: EntityType) => {
    switch (eType) {
      case 'offer': return t.addedInOffer;
      case 'sale': return t.addedInSale;
      case 'service_order': return t.addedInServiceOrder;
      case 'dispatch': return t.addedInDispatch;
      default: return eType;
    }
  };

  // Helper to add a single note to an entity
  const addNoteToEntity = async (
    targetEntityType: EntityType,
    targetEntityId: number,
    noteDescription: string,
    noteDetails: string,
    noteType: string
  ) => {
    try {
      switch (targetEntityType) {
        case 'offer':
          await offersApi.addActivity(targetEntityId, {
            type: noteType,
            description: noteDescription,
            details: noteDetails,
          });
          break;
        case 'sale':
          await salesApi.addActivity(targetEntityId, {
            type: noteType,
            description: noteDescription,
            details: noteDetails,
          });
          break;
        case 'service_order':
          await serviceOrdersApi.addNote(targetEntityId, {
            content: `${noteDescription}\n${noteDetails}`,
            type: noteType,
          });
          break;
        case 'dispatch':
          await dispatchesApi.addNote(targetEntityId, `${noteDescription}\n${noteDetails}`, noteType);
          break;
      }
    } catch (error) {
      console.warn(`Failed to add note to ${targetEntityType}:`, error);
    }
  };

  // Propagate notes to all linked entities in the chain
  const propagateChecklistNote = async (
    formName: string,
    sourceEntityType: EntityType,
    sourceEntityId: number,
    action: 'added' | 'completed'
  ) => {
    const sourceLabel = getEntityLabel(sourceEntityType);

    // Note for the source entity itself
    const selfNoteDescription = action === 'added'
      ? t.checklistAddedNote.replace('{{formName}}', formName)
      : t.checklistCompletedNote.replace('{{formName}}', formName);
    const selfNoteDetails = action === 'added'
      ? t.checklistAddedDetails.replace('{{formName}}', formName)
      : t.checklistCompletedDetails.replace('{{formName}}', formName);

    // Note for linked entities (showing source)
    const linkedNoteDescription = action === 'added'
      ? t.checklistAddedFromNote.replace('{{formName}}', formName).replace('{{source}}', sourceLabel)
      : t.checklistCompletedFromNote.replace('{{formName}}', formName).replace('{{source}}', sourceLabel);
    const linkedNoteDetails = action === 'added'
      ? t.checklistAddedFromDetails.replace('{{formName}}', formName).replace('{{source}}', sourceLabel)
      : t.checklistCompletedFromDetails.replace('{{formName}}', formName).replace('{{source}}', sourceLabel);

    const noteType = action === 'added' ? 'checklist_added' : 'checklist_completed';

    // Add note to the source entity
    await addNoteToEntity(sourceEntityType, sourceEntityId, selfNoteDescription, selfNoteDetails, noteType);

    // Build the chain of related entities to propagate to
    const entitiesToNotify: Array<{ type: EntityType; id: number }> = [];

    // Add the direct linked entity if it exists
    if (linkedEntityType && linkedEntityId) {
      const linkedNumericId = typeof linkedEntityId === 'string' ? parseInt(linkedEntityId, 10) : linkedEntityId;
      if (!isNaN(linkedNumericId)) {
        entitiesToNotify.push({ type: linkedEntityType, id: linkedNumericId });
      }
    }

    // Try to get the full chain based on entity type
    // Workflow: Offer -> Sale -> Service Order -> Dispatch
    try {
      if (sourceEntityType === 'dispatch' || linkedEntityType === 'service_order') {
        // If we're in a dispatch, try to notify the related service order
        const serviceOrderId = linkedEntityType === 'service_order' && linkedEntityId
          ? (typeof linkedEntityId === 'string' ? parseInt(linkedEntityId, 10) : linkedEntityId)
          : null;

        if (serviceOrderId && !isNaN(serviceOrderId)) {
          // Get the service order to find its related sale
          try {
            const serviceOrder = await serviceOrdersApi.getById(serviceOrderId, false);
            if (serviceOrder?.saleId) {
              const saleId = typeof serviceOrder.saleId === 'string'
                ? parseInt(serviceOrder.saleId, 10)
                : serviceOrder.saleId;
              if (!isNaN(saleId) && !entitiesToNotify.some(e => e.type === 'sale' && e.id === saleId)) {
                entitiesToNotify.push({ type: 'sale', id: saleId });

                // Also try to get the offer from the sale
                try {
                  const sale = await salesApi.getById(saleId);
                  if (sale?.offerId) {
                    const offerId = typeof sale.offerId === 'number' ? sale.offerId : parseInt(String(sale.offerId), 10);
                    if (!isNaN(offerId) && !entitiesToNotify.some(e => e.type === 'offer' && e.id === offerId)) {
                      entitiesToNotify.push({ type: 'offer', id: offerId });
                    }
                  }
                } catch {
                  // Ignore - sale might not have an offer
                }
              }
            }
          } catch {
            // Ignore - service order might not be accessible
          }
        }
      } else if (sourceEntityType === 'service_order') {
        // If we're in a service order, try to find related sale and offer
        try {
          const serviceOrder = await serviceOrdersApi.getById(sourceEntityId, false);
          if (serviceOrder?.saleId) {
            const saleId = typeof serviceOrder.saleId === 'string'
              ? parseInt(serviceOrder.saleId, 10)
              : serviceOrder.saleId;
            if (!isNaN(saleId) && !entitiesToNotify.some(e => e.type === 'sale' && e.id === saleId)) {
              entitiesToNotify.push({ type: 'sale', id: saleId });

              try {
                const sale = await salesApi.getById(saleId);
                if (sale?.offerId) {
                  const offerId = typeof sale.offerId === 'number' ? sale.offerId : parseInt(String(sale.offerId), 10);
                  if (!isNaN(offerId) && !entitiesToNotify.some(e => e.type === 'offer' && e.id === offerId)) {
                    entitiesToNotify.push({ type: 'offer', id: offerId });
                  }
                }
              } catch {
                // Ignore
              }
            }
          }
        } catch {
          // Ignore
        }
      } else if (sourceEntityType === 'sale' && linkedEntityType === 'offer' && linkedEntityId) {
        // Already have the offer in linked entity - also try to find service orders
        // Note: Service orders notification is optional, the main flow goes up to offer
      } else if (sourceEntityType === 'offer' && linkedEntityType === 'sale' && linkedEntityId) {
        // We're viewing from offer, linked to sale - propagate to sale
        // The sale will be notified through entitiesToNotify
      }
    } catch (error) {
      console.warn('Error building entity chain for note propagation:', error);
    }

    // Notify all entities in the chain (except the source which was already notified)
    for (const entity of entitiesToNotify) {
      if (entity.type !== sourceEntityType || entity.id !== sourceEntityId) {
        await addNoteToEntity(entity.type, entity.id, linkedNoteDescription, linkedNoteDetails, noteType);
      }
    }
  };

  const handleSaveDocument = async (
    responses: Record<string, any>,
    title: string,
    markComplete: boolean
  ) => {
    if (editingDocument) {
      const wasAlreadyCompleted = editingDocument.status === 'completed';
      const formName = language === 'en' ? editingDocument.form_name_en : editingDocument.form_name_fr;

      // Determine the source entity for this document
      const docEntityType = editingDocument.source;
      const docEntityId = editingDocument.entity_id;

      // Check if editing from main or linked entity
      if (editingDocument.source === entityType) {
        await updateDocument({
          id: editingDocument.id,
          responses,
          title: title || undefined,
          status: markComplete ? 'completed' : 'draft',
        });

        // Propagate completed note if marking complete for the first time
        if (markComplete && !wasAlreadyCompleted) {
          await propagateChecklistNote(formName, docEntityType, docEntityId, 'completed');
        }
      } else {
        // Update linked entity document
        try {
          await entityFormDocumentsService.update({
            id: editingDocument.id,
            responses,
            title: title || undefined,
            status: markComplete ? 'completed' : 'draft',
          });
          await fetchLinkedDocuments();
          toast.success(language === 'fr' ? 'Document formulaire mis à jour' : 'Form document updated');

          // Propagate completed note if marking complete for the first time
          if (markComplete && !wasAlreadyCompleted) {
            await propagateChecklistNote(formName, docEntityType, docEntityId, 'completed');
          }
        } catch (err) {
          toast.error(language === 'fr' ? 'Échec de la mise à jour' : 'Failed to update');
        }
      }
    }

    setShowEditor(false);
    setSelectedForm(null);
    setEditingDocument(null);
  };

  const getSourceLabel = (source: EntityType) => {
    switch (source) {
      case 'offer':
        return t.addedInOffer;
      case 'sale':
        return t.addedInSale;
      case 'service_order':
        return t.addedInServiceOrder;
      case 'dispatch':
        return t.addedInDispatch;
      default:
        return source;
    }
  };

  const getSourceBadge = (source: EntityType) => {
    const label = getSourceLabel(source);

    if (source === 'offer') {
      return (
        <Badge variant="outline" className="text-xs gap-1 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800">
          <FileText className="h-3 w-3" />
          {label}
        </Badge>
      );
    }
    if (source === 'sale') {
      return (
        <Badge variant="outline" className="text-xs gap-1 bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800">
          <ShoppingCart className="h-3 w-3" />
          {label}
        </Badge>
      );
    }
    // service_order or dispatch
    return (
      <Badge variant="outline" className="text-xs gap-1 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800">
        <ClipboardList className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            {t.title}
            {allDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {allDocuments.length}
              </Badge>
            )}
          </CardTitle>

          <Button size="sm" className="gap-2" onClick={() => setShowFormSelector(true)}>
            <Plus className="h-4 w-4" />
            {t.addChecklist}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <ContentSkeleton rows={4} />
        ) : allDocuments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <ClipboardList className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>{t.noChecklists}</p>
            <p className="text-sm">{t.noChecklistsHint}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {allDocuments.map((doc) => {
              const formName = language === 'en' ? doc.form_name_en : doc.form_name_fr;
              const displayName = formName;
              const showSourceBadge = linkedEntityType && linkedEntityId;

              return (
                <div
                  key={`checklist-${doc.source}-${doc.id}`}
                  className="flex items-center gap-4 p-3 rounded-lg border bg-card hover:shadow-md transition-all group"
                >
                  <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10">
                    <ClipboardList className="h-5 w-5 text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-medium break-words line-clamp-2">{displayName}</h4>
                      <Badge
                        variant={doc.status === 'completed' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {doc.status === 'completed' ? t.completed : t.draft}
                      </Badge>
                      {showSourceBadge && getSourceBadge(doc.source)}
                    </div>
                    {/* Show note if present */}
                    {doc.title && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <StickyNote className="h-3 w-3" />
                        <span className="truncate">{doc.title}</span>
                      </div>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(doc.created_at), 'MMM d, yyyy')}
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
                      onClick={() => handleDeleteClick(doc)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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

      {/* Add Checklist Dialog with Note */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) {
          setSelectedForm(null);
          setChecklistNote('');
        }
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t.addChecklistTitle}</DialogTitle>
            <DialogDescription>{t.addChecklistDescription}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Selected Form Display */}
            {selectedForm && (
              <div className="p-3 rounded-lg border bg-muted/50">
                <div className="flex items-center gap-2">
                  <ClipboardList className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {language === 'en' ? selectedForm.name_en : selectedForm.name_fr}
                  </span>
                </div>
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 h-auto mt-1 text-xs"
                  onClick={() => {
                    setShowAddDialog(false);
                    setShowFormSelector(true);
                  }}
                >
                  {t.selectForm}
                </Button>
              </div>
            )}

            {/* Note Input */}
            <div className="space-y-2">
              <Label htmlFor="checklist-note">{t.noteLabel}</Label>
              <Textarea
                id="checklist-note"
                value={checklistNote}
                onChange={(e) => setChecklistNote(e.target.value)}
                placeholder={t.notePlaceholder}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              {t.cancel}
            </Button>
            <Button
              onClick={handleCreateChecklist}
              disabled={!selectedForm || isCreating}
            >
              {isCreating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {t.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
    </Card>
  );
}
