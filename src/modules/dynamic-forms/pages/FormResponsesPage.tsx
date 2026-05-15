import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Download, FileText, FileDown, Loader2, Eye, Sparkles } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useDynamicForm, useFormResponses } from '../hooks/useDynamicForms';
import { FormResponsePDF } from '../components/FormResponsePDF';
import { ExportResponsesDialog } from '../components/ExportResponsesDialog';
import { DynamicFormResponse } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { usePermissions } from '@/hooks/usePermissions.tsx';
import { useToast } from '@/hooks/use-toast';
import { useActionLogger } from '@/hooks/useActionLogger';

export default function FormResponsesPage() {
  const { t, i18n } = useTranslation('dynamic-forms');
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const { id } = useParams<{ id: string }>();
  const formId = id ? parseInt(id) : undefined;
  const { isMainAdmin, hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { logButtonClick, logExport } = useActionLogger('DynamicForms');
  
  // Permission check
  const canView = isMainAdmin || hasPermission('dynamic_forms', 'read');
  
  const { data: form } = useDynamicForm(formId);
  const { data: responses, isLoading } = useFormResponses(formId);
  
  const [exportingPdf, setExportingPdf] = useState<number | null>(null);
  const [previewResponse, setPreviewResponse] = useState<DynamicFormResponse | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  
  const isEnglish = i18n.language === 'en';
  
  // Redirect if no view permission
  useEffect(() => {
    if (!permissionsLoading && !canView) {
      toastHook({
        title: t('common.access_denied', 'Access Denied'),
        description: t('common.no_permission', "You don't have permission to view this page."),
        variant: 'destructive',
      });
      navigate('/dashboard/settings/dynamic-forms', { replace: true });
    }
  }, [canView, permissionsLoading, navigate, toastHook, t]);
  
  // Get company logo as base64 for PDFs (resolves doc:{id} refs properly)
  const [companyLogo, setCompanyLogoState] = useState<string | undefined>(undefined);
  const companyName = localStorage.getItem('company-name') || undefined;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { getCompanyLogoBase64 } = await import('@/hooks/companyLogoUtils');
      const logo = await getCompanyLogoBase64();
      if (!cancelled && logo) setCompanyLogoState(logo);
    })();
    return () => { cancelled = true; };
  }, []);
  
  const handleExportPdf = async (response: DynamicFormResponse) => {
    if (!form) return;
    
    setExportingPdf(response.id);
    logButtonClick('Export Single PDF', { entityType: 'DynamicFormResponse', entityId: response.id });
    
    try {
      const blob = await pdf(
        <FormResponsePDF
          form={form}
          response={response}
          companyLogo={companyLogo}
          companyName={companyName}
          language={isEnglish ? 'en' : 'fr'}
        />
      ).toBlob();
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${isEnglish ? form.name_en : form.name_fr}_response_${response.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logExport('PDF', 1, { entityType: 'DynamicFormResponse', entityId: response.id });
      toast.success(t('responses.pdf_generated'));
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t('responses.pdf_error'));
    } finally {
      setExportingPdf(null);
    }
  };

  const handleExportAllPdf = async () => {
    if (!form || !responses || responses.length === 0) return;
    
    setExportingPdf(-1); // -1 indicates exporting all
    logButtonClick('Export All PDF', { entityType: 'DynamicForm', entityId: formId });
    
    try {
      for (const response of responses) {
        const blob = await pdf(
          <FormResponsePDF
            form={form}
            response={response}
            companyLogo={companyLogo}
            companyName={companyName}
            language={isEnglish ? 'en' : 'fr'}
          />
        ).toBlob();
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${isEnglish ? form.name_en : form.name_fr}_response_${response.id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
      
      logExport('PDF', responses.length, { entityType: 'DynamicFormResponse', details: `Exported ${responses.length} responses` });
      toast.success(t('responses.pdf_generated'));
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error(t('responses.pdf_error'));
    } finally {
      setExportingPdf(null);
    }
  };
  
  const handlePreviewClick = (response: DynamicFormResponse) => {
    logButtonClick('Preview Response', { entityType: 'DynamicFormResponse', entityId: response.id });
    setPreviewResponse(response);
  };
  
  // Show loading while checking permissions
  if (permissionsLoading || !canView) {
    return null;
  }
  
  if (!form) {
    return (
      <div className="flex items-center justify-center p-12">
        <p>{t('responses.form_not_found')}</p>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex items-center justify-between p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/dashboard/settings/dynamic-forms')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{t('responses.title')}</h1>
            <p className="text-[11px] text-muted-foreground">
              {isEnglish ? form.name_en : form.name_fr}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Export to Entity Button */}
          <Button
            variant="default"
            onClick={() => setShowExportDialog(true)}
            disabled={!responses || responses.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t('export.export_to_entity', 'Export to Entity')}
          </Button>
          
          {/* PDF Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={!responses || responses.length === 0}>
                {exportingPdf === -1 ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                {t('responses.export')}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportAllPdf}>
                <FileDown className="h-4 w-4 mr-2" />
                {t('responses.export_pdf')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      
      {/* Content */}
      <div className="flex-1 p-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('responses.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-pulse">{t('common.loading')}</div>
              </div>
            ) : !responses || responses.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-1">{t('responses.no_responses')}</h3>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>{t('responses.submitted_by')}</TableHead>
                      <TableHead>{t('responses.submitted_at')}</TableHead>
                      <TableHead>{t('responses.entity')}</TableHead>
                      <TableHead className="w-24 text-right">{t('table.actions')}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response, index) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell>{response.submitted_by}</TableCell>
                        <TableCell>
                          {format(new Date(response.submitted_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          {response.entity_type && response.entity_id 
                            ? `${response.entity_type}: ${response.entity_id}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handlePreviewClick(response)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleExportPdf(response)}
                              disabled={exportingPdf === response.id}
                            >
                              {exportingPdf === response.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <FileDown className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Response Preview Dialog */}
      <Dialog open={!!previewResponse} onOpenChange={() => setPreviewResponse(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {t('preview.title')}
            </DialogTitle>
          </DialogHeader>
          
          {previewResponse && (
            <div className="space-y-4">
              {/* Meta info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-xs text-muted-foreground">{t('responses.submitted_by')}</p>
                  <p className="font-medium">{previewResponse.submitted_by}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('responses.submitted_at')}</p>
                  <p className="font-medium">
                    {format(new Date(previewResponse.submitted_at), 'MMM d, yyyy HH:mm')}
                  </p>
                </div>
              </div>
              
              {/* Responses */}
              <div className="space-y-3">
                {form.fields
                  .filter(f => f.type !== 'section')
                  .map((field) => {
                    const value = previewResponse.responses[field.id];
                    
                    return (
                      <div key={field.id} className="p-3 border rounded-lg">
                        <p className="text-xs text-muted-foreground mb-1">
                          {isEnglish ? field.label_en : field.label_fr}
                          {field.required && <span className="text-destructive ml-1">*</span>}
                        </p>
                        
                        {field.type === 'signature' && value ? (
                          <img 
                            src={value} 
                            alt="Signature" 
                            className="max-w-[200px] h-auto bg-white rounded border"
                          />
                        ) : field.type === 'rating' && typeof value === 'number' ? (
                          <div className="flex items-center gap-1">
                            {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
                              <span 
                                key={i} 
                                className={`text-lg ${i < value ? 'text-warning' : 'text-muted-foreground/30'}`}
                              >
                                ★
                              </span>
                            ))}
                            <span className="ml-2 text-sm text-muted-foreground">
                              ({value}/{field.maxStars || 5})
                            </span>
                          </div>
                        ) : (
                          <p className="font-medium">
                            {value !== undefined && value !== null && value !== '' 
                              ? String(value) 
                              : <span className="text-muted-foreground italic">
                                  {t('responses.not_answered')}
                                </span>
                            }
                          </p>
                        )}
                      </div>
                    );
                  })}
              </div>
              
              {/* Notes */}
              {previewResponse.notes && (
                <div className="p-4 bg-warning/5 border-l-4 border-warning rounded">
                  <p className="text-xs font-medium text-foreground mb-1">
                    {t('responses.notes')}
                  </p>
                  <p className="text-sm text-muted-foreground">{previewResponse.notes}</p>
                </div>
              )}
              
              {/* Export button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => handleExportPdf(previewResponse)}
                  disabled={exportingPdf === previewResponse.id}
                >
                  {exportingPdf === previewResponse.id ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FileDown className="h-4 w-4 mr-2" />
                  )}
                  {t('responses.export_pdf')}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Responses Dialog */}
      {form && responses && (
        <ExportResponsesDialog
          open={showExportDialog}
          onOpenChange={setShowExportDialog}
          form={form}
          responses={responses}
        />
      )}
    </div>
  );
}
