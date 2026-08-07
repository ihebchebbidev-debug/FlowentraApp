import { useState, useEffect } from 'react';
import { ContentSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { PDFViewer, pdf } from '@react-pdf/renderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, FileText, Loader2 } from 'lucide-react';
import { DynamicForm } from '@/modules/dynamic-forms/types';
import { DynamicFormPDFDocument } from '@/modules/dynamic-forms/components/DynamicFormPDFDocument';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { EntityFormDocument } from '../../types/formDocument';

const translations = {
  en: {
    view_pdf: 'View PDF',
    download: 'Download',
    form_not_found: 'Form not found',
  },
  fr: {
    view_pdf: 'Voir le PDF',
    download: 'Télécharger',
    form_not_found: 'Formulaire non trouvé',
  },
};

interface FormDocumentPDFModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: EntityFormDocument;
}

export function FormDocumentPDFModal({
  open,
  onOpenChange,
  document,
}: FormDocumentPDFModalProps) {
  const { i18n } = useTranslation();
  const [language, setLanguage] = useState<'en' | 'fr'>(i18n.language.startsWith('fr') ? 'fr' : 'en');
  const t = translations[language];
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (open && document) {
      loadForm(document.form_id);
    }
  }, [open, document]);

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

  const handleDownload = async () => {
    if (!form) return;

    try {
      setDownloading(true);
      const formName = language === 'en' ? form.name_en : form.name_fr;
      const fileName = document.title 
        ? `${document.title.replace(/[^a-z0-9]/gi, '_')}.pdf`
        : `${formName.replace(/[^a-z0-9]/gi, '_')}_${document.id}.pdf`;

      const blob = await pdf(
        <DynamicFormPDFDocument
          form={form}
          formValues={document.responses}
          language={language}
          submittedBy={document.created_by_name || document.created_by}
          submittedAt={new Date(document.created_at)}
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
    } finally {
      setDownloading(false);
    }
  };

  const formName = form ? (language === 'en' ? form.name_en : form.name_fr) : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {document.title || formName || t.view_pdf}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Tabs value={language} onValueChange={(v) => setLanguage(v as 'en' | 'fr')}>
                <TabsList>
                  <TabsTrigger value="en">EN</TabsTrigger>
                  <TabsTrigger value="fr">FR</TabsTrigger>
                </TabsList>
              </Tabs>
              <Button onClick={handleDownload} disabled={downloading || !form}>
                {downloading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {t.download}
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 border rounded-lg overflow-hidden bg-muted">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <ContentSkeleton rows={8} />
            </div>
          ) : form ? (
            <PDFViewer width="100%" height="100%" showToolbar={false}>
              <DynamicFormPDFDocument
                form={form}
                formValues={document.responses}
                language={language}
                submittedBy={document.created_by_name || document.created_by}
                submittedAt={new Date(document.created_at)}
              />
            </PDFViewer>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              {t.form_not_found}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
