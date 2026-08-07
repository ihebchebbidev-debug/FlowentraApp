import { useState, useEffect } from 'react';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Save, CheckCircle, FileText, Loader2 } from 'lucide-react';
import { DynamicForm } from '@/modules/dynamic-forms/types';
import { SteppedFormPreview } from '@/modules/dynamic-forms/components/SteppedFormPreview';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { validateFormFields } from '@/modules/dynamic-forms/utils/formValidation';
import { getVisibleFields, getVisibleValues } from '@/modules/dynamic-forms/utils/conditionEvaluator';
import { toast } from 'sonner';
import { EntityFormDocument } from '../../types/formDocument';

const translations = {
  en: {
    edit_document: 'Edit Form Document',
    fill_form: 'Fill Form',
    status_completed: 'Completed',
    document_title: 'Document Title',
    title_placeholder: 'Optional title for this document',
    completed_readonly: 'This document is completed and cannot be edited.',
    form_not_found: 'Form not found',
    cancel: 'Cancel',
    save_draft: 'Save as Created',
    save_complete: 'Save & Complete',
    validation_error: 'Validation Error',
    fix_errors: 'Please fix the {{count}} error(s) before completing.',
  },
  fr: {
    edit_document: 'Modifier le Document',
    fill_form: 'Remplir le Formulaire',
    status_completed: 'Complété',
    document_title: 'Titre du Document',
    title_placeholder: 'Titre optionnel pour ce document',
    completed_readonly: 'Ce document est complété et ne peut pas être modifié.',
    form_not_found: 'Formulaire non trouvé',
    cancel: 'Annuler',
    save_draft: 'Enregistrer Brouillon',
    save_complete: 'Enregistrer & Terminer',
    validation_error: 'Erreur de validation',
    fix_errors: 'Veuillez corriger les {{count}} erreur(s) avant de terminer.',
  },
};

interface FormDocumentEditorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form?: DynamicForm;
  document?: EntityFormDocument;
  onSave: (responses: Record<string, any>, title: string, markComplete: boolean) => Promise<void>;
}

export function FormDocumentEditorModal({
  open,
  onOpenChange,
  form: initialForm,
  document,
  onSave,
}: FormDocumentEditorModalProps) {
  const { i18n } = useTranslation();
  // Use system language, no toggle needed
  const language = (i18n.language.startsWith('fr') ? 'fr' : 'en') as 'en' | 'fr';
  const t = translations[language];
  const [form, setForm] = useState<DynamicForm | null>(initialForm || null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [title, setTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setFieldErrors({});
    if (open && document && !initialForm) {
      loadForm(document.form_id);
      setFormValues(document.responses || {});
      setTitle(document.title || '');
    } else if (open && initialForm) {
      setForm(initialForm);
      setFormValues({});
      setTitle('');
    }
  }, [open, document, initialForm]);

  const loadForm = async (formId: number) => {
    try {
      setLoading(true);
      const loadedForm = await dynamicFormsService.getById(formId);
      setForm(loadedForm);
    } catch (error) {
      console.error('Failed to load form:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
    // Clear this field's error as soon as the user edits it.
    setFieldErrors(prev => {
      if (!prev[fieldId]) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const handleSave = async (markComplete: boolean) => {
    if (!form) return;

    // Only enforce validation when completing — drafts can be partial.
    if (markComplete) {
      const visibleFields = getVisibleFields(form.fields, formValues);
      const result = validateFormFields(visibleFields, formValues, language);
      if (!result.isValid) {
        setFieldErrors(result.fieldErrors);
        toast.error(t.validation_error, {
          description: t.fix_errors.replace('{{count}}', String(result.errors.length)),
        });
        return;
      }
    }

    setFieldErrors({});
    try {
      setSaving(true);
      // On completion, drop values from fields hidden by conditional logic so we
      // never persist stale answers. Drafts keep everything for work-in-progress.
      const valuesToSave = markComplete ? getVisibleValues(form.fields, formValues) : formValues;
      await onSave(valuesToSave, title, markComplete);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const isCompleted = document?.status === 'completed';
  const formName = form ? (language === 'en' ? form.name_en : form.name_fr) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {document ? t.edit_document : t.fill_form}
            {isCompleted && (
              <Badge className="ml-2 bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400">
                {t.status_completed}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {loading ? (
            <div className="flex items-center justify-center flex-1">
              <ContentSkeleton rows={8} />
            </div>
          ) : form ? (
            <>
              <div className="flex items-center gap-4 border-b pb-4">
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-lg">{formName}</h3>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="doc-title" className="text-sm text-muted-foreground">
                      {t.document_title}:
                    </Label>
                    <Input
                      id="doc-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={t.title_placeholder}
                      className="w-64 h-8"
                      disabled={isCompleted}
                    />
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {isCompleted ? (
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-4">
                      {t.completed_readonly}
                    </p>
                    <SteppedFormPreview
                      form={form}
                      language={language}
                      formValues={formValues}
                      onValueChange={() => { }}
                    />
                  </div>
                ) : (
                  <SteppedFormPreview
                    form={form}
                    language={language}
                    formValues={formValues}
                    onValueChange={handleValueChange}
                    fieldErrors={fieldErrors}
                  />
                )}
              </div>

              {!isCompleted && (
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button variant="outline" onClick={() => onOpenChange(false)}>
                    {t.cancel}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleSave(false)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    {t.save_draft}
                  </Button>
                  <Button
                    onClick={() => handleSave(true)}
                    disabled={saving}
                  >
                    {saving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    )}
                    {t.save_complete}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              {t.form_not_found}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
