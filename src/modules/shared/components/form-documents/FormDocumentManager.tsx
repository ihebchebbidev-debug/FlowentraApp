import { useState } from 'react';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Loader2 } from 'lucide-react';
import { DynamicForm } from '@/modules/dynamic-forms/types';
import { DynamicFormPDFDocument } from '@/modules/dynamic-forms/components/DynamicFormPDFDocument';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { EntityType, EntityFormDocument } from '../../types/formDocument';
import { useEntityFormDocuments } from '../../hooks/useEntityFormDocuments';
import { FormDocumentCard } from './FormDocumentCard';
import { FormSelectorModal } from './FormSelectorModal';
import { FormDocumentEditorModal } from './FormDocumentEditorModal';
import { FormDocumentPDFModal } from './FormDocumentPDFModal';
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

const translations = {
  en: {
    title: 'Form Documents',
    add_document: 'Add Form Document',
    no_documents: 'No form documents attached',
    no_documents_hint: 'Click "Add Form Document" to attach a dynamic form',
    delete_confirm_title: 'Delete Form Document',
    delete_confirm_description: 'Are you sure you want to delete this form document? This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete',
  },
  fr: {
    title: 'Documents Formulaires',
    add_document: 'Ajouter un Document',
    no_documents: 'Aucun document formulaire attaché',
    no_documents_hint: 'Cliquez sur "Ajouter un Document" pour joindre un formulaire dynamique',
    delete_confirm_title: 'Supprimer le Document',
    delete_confirm_description: 'Êtes-vous sûr de vouloir supprimer ce document formulaire? Cette action est irréversible.',
    cancel: 'Annuler',
    delete: 'Supprimer',
  },
};

interface FormDocumentManagerProps {
  entityType: EntityType;
  entityId: number | string;
}

export function FormDocumentManager({ entityType, entityId }: FormDocumentManagerProps) {
  const { i18n } = useTranslation();
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];
  
  const {
    documents,
    loading,
    createDocument,
    updateDocument,
    deleteDocument,
  } = useEntityFormDocuments(entityType, entityId);

  const [showSelector, setShowSelector] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [showPDF, setShowPDF] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [editingDocument, setEditingDocument] = useState<EntityFormDocument | null>(null);
  const [viewingDocument, setViewingDocument] = useState<EntityFormDocument | null>(null);
  const [deletingDocument, setDeletingDocument] = useState<EntityFormDocument | null>(null);

  const numericEntityId = typeof entityId === 'string' ? parseInt(entityId, 10) : entityId;

  const handleFormSelected = (form: DynamicForm) => {
    setSelectedForm(form);
    setEditingDocument(null);
    setShowEditor(true);
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

  const handleDownload = async (doc: EntityFormDocument) => {
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

  const handleDeleteClick = (doc: EntityFormDocument) => {
    setDeletingDocument(doc);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingDocument) {
      await deleteDocument(deletingDocument.id);
      setDeletingDocument(null);
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
    } else if (selectedForm) {
      await createDocument({
        entity_type: entityType,
        entity_id: numericEntityId,
        form_id: selectedForm.id,
        title: title || undefined,
        status: markComplete ? 'completed' : 'draft',
        responses,
      });
    }
    
    setShowEditor(false);
    setSelectedForm(null);
    setEditingDocument(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-muted-foreground" />
          <h3 className="font-semibold">
            {t.title} ({documents.length})
          </h3>
        </div>
        <Button onClick={() => setShowSelector(true)} size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          {t.add_document}
        </Button>
      </div>

      {loading ? (
        <ContentSkeleton rows={3} />
      ) : documents.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
          <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>{t.no_documents}</p>
          <p className="text-sm">{t.no_documents_hint}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {documents.map((doc) => (
            <FormDocumentCard
              key={doc.id}
              document={doc}
              language={language}
              onEdit={handleEditDocument}
              onViewPDF={handleViewPDF}
              onDownload={handleDownload}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <FormSelectorModal
        open={showSelector}
        onOpenChange={setShowSelector}
        onSelectForm={handleFormSelected}
        language={language}
      />

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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.delete_confirm_title}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.delete_confirm_description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-destructive text-destructive-foreground">
              {t.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
