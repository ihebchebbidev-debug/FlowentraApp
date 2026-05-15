import { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Languages, Edit, Star, GitBranch, FileStack, Download, Save, FileText, Loader2, AlertCircle, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { useDynamicForm, useSubmitFormResponse } from '../hooks/useDynamicForms';
import { useFormDynamicOptions } from '../hooks/useDynamicFieldOptions';
import { FormField, STATUS_COLORS, FieldOption } from '../types';
import { evaluateFieldVisibility } from '../utils/conditionEvaluator';
import { isMultiPageForm, getPageCount } from '../utils/pageUtils';
import { SteppedFormPreview } from '../components/SteppedFormPreview';
import { DynamicFormPDFDocument } from '../components/DynamicFormPDFDocument';
import { SignatureCanvas } from '../components/FormBuilder/SignatureCanvas';
import { usePermissions } from '@/hooks/usePermissions.tsx';
import { useToast } from '@/hooks/use-toast';
import { useActionLogger } from '@/hooks/useActionLogger';
import { pdfSettingsApi } from '@/services/pdfSettingsApi';

export default function FormPreviewPage() {
  const { t, i18n } = useTranslation('dynamic-forms');
  const navigate = useNavigate();
  const { toast } = useToast();
  const { id } = useParams<{ id: string }>();
  const formId = id ? parseInt(id) : undefined;
  const { isMainAdmin, hasPermission, isLoading: permissionsLoading } = usePermissions();
  const { logButtonClick } = useActionLogger('DynamicForms');
  
  // Permission checks
  const canView = isMainAdmin || hasPermission('dynamic_forms', 'read');
  const canEdit = isMainAdmin || hasPermission('dynamic_forms', 'update');
  
  const { data: form, isLoading } = useDynamicForm(formId);
  const submitMutation = useSubmitFormResponse();
  const [previewLang, setPreviewLang] = useState<'en' | 'fr'>(i18n.language === 'fr' ? 'fr' : 'en');
  const [isSaving, setIsSaving] = useState(false);
  
  // Company settings for PDF
  const [companySettings, setCompanySettings] = useState<{
    name?: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  }>({});
  
  // Load company settings from PDF settings + resolve logo to base64
  useEffect(() => {
    const loadCompanySettings = async () => {
      try {
        const settings = await pdfSettingsApi.loadSettings('offers', {
          company: { name: '', logo: '', address: '', phone: '', email: '' }
        });
        // Always resolve logo to base64 for reliable rendering
        const { getCompanyLogoBase64 } = await import('@/hooks/companyLogoUtils');
        const logoBase64 = await getCompanyLogoBase64();
        if (settings?.company) {
          setCompanySettings({
            name: settings.company.name,
            logo: logoBase64 || '',
            address: settings.company.address,
            phone: settings.company.phone,
            email: settings.company.email,
          });
        } else if (logoBase64) {
          setCompanySettings(prev => ({ ...prev, logo: logoBase64 }));
        }
      } catch (error) {
        console.warn('Failed to load company settings:', error);
      }
    };
    loadCompanySettings();
  }, []);
  
  // Redirect if no view permission
  useEffect(() => {
    if (!permissionsLoading && !canView) {
      toast({
        title: t('common.access_denied', 'Access Denied'),
        description: t('common.no_permission', "You don't have permission to view this page."),
        variant: 'destructive',
      });
      navigate('/dashboard/settings/dynamic-forms', { replace: true });
    }
  }, [canView, permissionsLoading, navigate, toast, t]);
  
  // Track form values for conditional logic demonstration
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  
  // Get visible fields based on conditions
  const visibleFields = useMemo(() => {
    if (!form) return [];
    return form.fields
      .filter(field => evaluateFieldVisibility(field, formValues))
      .sort((a, b) => a.order - b.order);
  }, [form, formValues]);
  
  // Dynamic options hook - fetches options for fields with use_dynamic_data enabled
  // Pass formValues to support cascading dropdowns
  const { getFieldOptions, isFieldLoading, getFieldError, getPendingParent, refreshField } = useFormDynamicOptions(form?.fields || [], formValues);
  
  // Helper to get options for a field (dynamic or static)
  const getOptionsForField = (field: FormField): FieldOption[] => {
    if (field.use_dynamic_data) {
      return getFieldOptions(field.id);
    }
    return field.options || [];
  };
  
  // Helper to render pending parent state for cascading fields
  const renderPendingParent = (field: FormField) => {
    const parentLabel = getPendingParent(field.id);
    if (!parentLabel || !field.dependency) return null;
    
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-dashed rounded-md text-muted-foreground text-sm bg-muted/30">
        <Link2 className="h-4 w-4" />
        {t('dynamic_data.select_parent_first', { parent: parentLabel })}
      </div>
    );
  };
  
  // Helper to render error state for dynamic fields
  const renderDynamicError = (field: FormField) => {
    const error = getFieldError(field.id);
    if (!error || !field.use_dynamic_data) return null;
    
    return (
      <button
        type="button"
        onClick={() => refreshField(field.id)}
        className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs hover:bg-destructive/20 transition-colors w-full"
      >
        <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="flex-1 text-left">{t('preview.dynamic_error', { error })}</span>
        <RefreshCw className="h-3.5 w-3.5" />
      </button>
    );
  };
  
  // Check if this is a multi-page form
  const hasMultiplePages = useMemo(() => {
    if (!form) return false;
    return isMultiPageForm(form.fields);
  }, [form]);
  
  const pageCount = useMemo(() => {
    if (!form) return 1;
    return getPageCount(form.fields);
  }, [form]);
  
  const handleValueChange = (fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
    
    // Clear dependent fields when parent changes
    if (form) {
      form.fields.forEach(field => {
        if (field.dependency?.parent_field_id === fieldId && field.dependency?.clear_on_parent_change !== false) {
          setFormValues(prev => ({ 
            ...prev, 
            [field.id]: field.type === 'checkbox' ? [] : '' 
          }));
        }
      });
    }
  };
  
  const handleSaveResponse = async () => {
    if (!formId || !form) return;
    
    setIsSaving(true);
    try {
      await submitMutation.mutateAsync({
        form_id: formId,
        responses: formValues,
        notes: '',
      });
    } catch (error) {
      // Error handled by mutation
    } finally {
      setIsSaving(false);
    }
  };
  
  // Helper function to get width class for field
  const getWidthClass = (field: FormField): string => {
    // Sections and page breaks always full width
    if (field.type === 'section' || field.type === 'page_break') {
      return 'w-full';
    }
    switch (field.width) {
      case 'third':
        return 'w-full md:w-[calc(33.333%-0.667rem)]';
      case 'half':
        return 'w-full md:w-[calc(50%-0.5rem)]';
      case 'full':
      default:
        return 'w-full';
    }
  };
  
  const renderField = (field: FormField) => {
    const label = previewLang === 'en' ? field.label_en : field.label_fr;
    const description = previewLang === 'en' ? field.description_en : field.description_fr;
    const placeholder = previewLang === 'en' ? field.placeholder_en : field.placeholder_fr;
    const hasCondition = !!field.condition;
    
    // Condition indicator element
    const conditionIndicator = hasCondition ? (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute -left-6 top-1">
              <GitBranch className="h-4 w-4 text-primary/60" />
            </div>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p className="text-xs">{t('conditional.title')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    ) : null;
    
    switch (field.type) {
      case 'section':
        return (
          <div key={field.id} className={`relative ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="pt-6 pb-3 border-b-2 border-primary/20 mb-4">
              <h3 className="text-base font-semibold text-foreground">{label}</h3>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>
          </div>
        );
        
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input 
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                placeholder={placeholder}
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="bg-background border-border focus:border-primary"
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );
        
      case 'number':
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input 
                type="number" 
                placeholder={placeholder} 
                min={field.min} 
                max={field.max}
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value ? Number(e.target.value) : '')}
                className="bg-background border-border focus:border-primary"
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Textarea 
                placeholder={placeholder} 
                rows={3}
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="bg-background border-border focus:border-primary resize-none"
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );
        
      case 'checkbox':
        const checkboxOptions = getOptionsForField(field);
        const checkboxLoading = isFieldLoading(field.id);
        const checkboxError = getFieldError(field.id);
        const checkboxPendingParent = getPendingParent(field.id);
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
                {field.use_dynamic_data && (
                  <Badge variant="outline" className="ml-2 text-[10px] h-4">
                    {field.dependency ? t('dynamic_data.cascading') : 'Dynamic'}
                  </Badge>
                )}
              </Label>
              {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
              {checkboxLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('preview.loading_options')}
                </div>
              ) : checkboxPendingParent ? (
                renderPendingParent(field)
              ) : checkboxError && field.use_dynamic_data ? (
                renderDynamicError(field)
              ) : (
                <div className="space-y-2 pl-1">
                  {checkboxOptions.map((opt) => {
                    const checkedValues = formValues[field.id] || [];
                    const isChecked = Array.isArray(checkedValues) && checkedValues.includes(opt.value);
                    return (
                      <div key={opt.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={opt.id}
                          checked={isChecked}
                          onCheckedChange={(checked) => {
                            const current = formValues[field.id] || [];
                            const updated = checked 
                              ? [...current, opt.value]
                              : current.filter((v: string) => v !== opt.value);
                            handleValueChange(field.id, updated);
                          }}
                        />
                        <label htmlFor={opt.id} className="text-sm">
                          {previewLang === 'en' ? opt.label_en : opt.label_fr}
                        </label>
                      </div>
                    );
                  })}
                  {checkboxOptions.length === 0 && !field.use_dynamic_data && (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        checked={!!formValues[field.id]}
                        onCheckedChange={(checked) => handleValueChange(field.id, checked)}
                      />
                      <span className="text-sm">{label}</span>
                    </div>
                  )}
                  {checkboxOptions.length === 0 && field.use_dynamic_data && !checkboxError && !checkboxPendingParent && (
                    <p className="text-sm text-muted-foreground italic">
                      {field.dependency 
                        ? t('dynamic_data.no_results_for_parent', { parent: '' })
                        : t('preview.no_dynamic_options')
                      }
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
        
      case 'radio':
        const radioOptions = getOptionsForField(field);
        const radioLoading = isFieldLoading(field.id);
        const radioError = getFieldError(field.id);
        const radioPendingParent = getPendingParent(field.id);
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
                {field.use_dynamic_data && (
                  <Badge variant="outline" className="ml-2 text-[10px] h-4">
                    {field.dependency ? t('dynamic_data.cascading') : 'Dynamic'}
                  </Badge>
                )}
              </Label>
              {description && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
              {radioLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('preview.loading_options')}
                </div>
              ) : radioPendingParent ? (
                renderPendingParent(field)
              ) : radioError && field.use_dynamic_data ? (
                renderDynamicError(field)
              ) : (
                <RadioGroup 
                  value={formValues[field.id] || ''}
                  onValueChange={(value) => handleValueChange(field.id, value)}
                  className="pl-1"
                >
                  {radioOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} />
                      <label htmlFor={opt.id} className="text-sm">
                        {previewLang === 'en' ? opt.label_en : opt.label_fr}
                      </label>
                    </div>
                  ))}
                  {radioOptions.length === 0 && !radioError && !radioPendingParent && (
                    <p className="text-sm text-muted-foreground italic">
                      {field.dependency 
                        ? t('dynamic_data.no_results_for_parent', { parent: '' })
                        : t('preview.no_dynamic_options')
                      }
                    </p>
                  )}
                </RadioGroup>
              )}
            </div>
          </div>
        );
        
      case 'select':
        const selectOptions = getOptionsForField(field);
        const selectLoading = isFieldLoading(field.id);
        const selectError = getFieldError(field.id);
        const selectPendingParent = getPendingParent(field.id);
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
                {field.use_dynamic_data && (
                  <Badge variant="outline" className="ml-2 text-[10px] h-4">
                    {field.dependency ? t('dynamic_data.cascading') : 'Dynamic'}
                  </Badge>
                )}
              </Label>
              {selectLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 border rounded-md text-muted-foreground text-sm bg-background">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('preview.loading_options')}
                </div>
              ) : selectPendingParent ? (
                renderPendingParent(field)
              ) : selectError && field.use_dynamic_data ? (
                renderDynamicError(field)
              ) : (
                <Select 
                  value={formValues[field.id] || ''}
                  onValueChange={(value) => handleValueChange(field.id, value)}
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder={placeholder || t('preview.select_placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.value}>
                        {previewLang === 'en' ? opt.label_en : opt.label_fr}
                      </SelectItem>
                    ))}
                    {selectOptions.length === 0 && !selectError && !selectPendingParent && (
                      <SelectItem value="__no_options__" disabled>
                        {field.dependency 
                          ? t('dynamic_data.no_results_for_parent', { parent: '' })
                          : t('preview.no_dynamic_options')
                        }
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              )}
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );
        
      case 'date':
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input 
                type="date"
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className="bg-background border-border focus:border-primary"
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <SignatureCanvas
                value={formValues[field.id] || ''}
                onChange={(value) => handleValueChange(field.id, value)}
                height={120}
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className={`relative mb-4 ${getWidthClass(field)}`}>
            {conditionIndicator}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 cursor-pointer transition-colors ${
                      i < (formValues[field.id] || 0)
                        ? 'text-warning fill-warning'
                        : 'text-muted-foreground/30'
                    }`}
                    onClick={() => handleValueChange(field.id, i + 1)}
                  />
                ))}
              </div>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
            </div>
          </div>
        );
      default:
        return null;
    }
  };
  
  // Show loading while checking permissions
  if (permissionsLoading || !canView) {
    return null;
  }
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-pulse">{t('common.loading')}</div>
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-muted-foreground">{t('preview.not_found')}</div>
      </div>
    );
  }

  const formName = previewLang === 'en' ? form.name_en : form.name_fr;
  const formDescription = previewLang === 'en' ? form.description_en : form.description_fr;
  const statusClass = STATUS_COLORS[form.status] || STATUS_COLORS.draft;

  return (
    <div className="flex flex-col h-full bg-muted/30">
      {/* Toolbar */}
      <header className="flex items-center justify-between p-3 border-b border-border bg-card shadow-sm sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              logButtonClick('Back', { entityType: 'DynamicForm', entityId: formId });
              navigate('/dashboard/settings/dynamic-forms');
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <span className="font-medium">{formName}</span>
            <Badge className={`${statusClass} text-xs`}>
              {t(`status.${form.status}`)}
            </Badge>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPreviewLang(previewLang === 'en' ? 'fr' : 'en')}
          >
            <Languages className="h-4 w-4 mr-1" />
            {previewLang.toUpperCase()}
          </Button>
          
          {/* Save Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveResponse}
            disabled={isSaving || submitMutation.isPending}
          >
            {(isSaving || submitMutation.isPending) ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {isSaving ? t('preview.saving') : t('preview.save_response')}
          </Button>
          
          {/* Download PDF */}
          <PDFDownloadLink
            document={
              <DynamicFormPDFDocument
                form={form}
                formValues={formValues}
                language={previewLang}
                companySettings={companySettings}
                submittedAt={new Date()}
              />
            }
            fileName={`${formName.replace(/\s+/g, '-').toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`}
          >
            {({ loading }) => (
              <Button variant="default" size="sm" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-1" />
                )}
                {t('preview.download_pdf')}
              </Button>
            )}
          </PDFDownloadLink>
          
          {/* Edit Button - only for draft forms */}
          {canEdit && form.status === 'draft' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                logButtonClick('Edit Form', { entityType: 'DynamicForm', entityId: formId });
                navigate(`/dashboard/settings/dynamic-forms/${formId}/edit`);
              }}
            >
              <Edit className="h-4 w-4 mr-1" />
              {t('common.edit')}
            </Button>
          )}
        </div>
      </header>
      
      {/* PDF-like Document View */}
      <div className="flex-1 overflow-auto p-6 flex justify-center">
        <div className="w-full max-w-[850px]">
          {/* Document Paper */}
          <Card className="bg-white shadow-xl border-0 rounded-none" style={{ minHeight: '1100px' }}>
            {/* Professional Header */}
            <div className="bg-white px-10 pt-10 pb-5 flex justify-between items-start border-b-[3px] border-primary">
              {/* Logo */}
              <div>
                {companySettings?.logo ? (
                  <img 
                    src={companySettings.logo} 
                    alt="Company Logo" 
                    className="h-[70px] w-auto max-w-[140px] object-contain"
                  />
                ) : (
                  <div className="h-[70px] w-[70px] bg-muted rounded-lg flex items-center justify-center">
                    <FileText className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              
              {/* Document Info */}
              <div className="text-right">
                <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                  {previewLang === 'fr' ? 'Complété le' : 'Completed on'}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {new Date().toLocaleDateString(previewLang === 'fr' ? 'fr-FR' : 'en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            
            {/* Document Content */}
            <CardContent className="p-10">
              {/* Title & Description - Professional Text Style */}
              <div className="mb-8 space-y-4">
                {/* Title */}
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {previewLang === 'fr' ? 'Titre' : 'Title'}
                  </p>
                  <p className="text-lg font-semibold text-foreground">{formName}</p>
                </div>
                
                {/* Description */}
                {formDescription && (
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {previewLang === 'fr' ? 'Description' : 'Description'}
                    </p>
                    <p className="text-sm text-foreground">{formDescription}</p>
                  </div>
                )}
              </div>
              
              {/* Form Fields */}
              <div className="space-y-5">
                {form.fields.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8 w-full">
                    {t('preview.no_fields')}
                  </p>
                ) : hasMultiplePages ? (
                  <div className="w-full">
                    <SteppedFormPreview
                      form={form}
                      language={previewLang}
                      formValues={formValues}
                      onValueChange={handleValueChange}
                    />
                  </div>
                ) : (
                  visibleFields.map(renderField)
                )}
              </div>
            </CardContent>
            
            {/* Professional Footer */}
            <div className="border-t border-border bg-muted/30 px-10 py-4 mt-auto">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-muted-foreground">
                    {previewLang === 'fr' ? form.name_fr : form.name_en}
                  </p>
                  {companySettings?.name && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      © {new Date().getFullYear()} {companySettings.name}
                    </p>
                  )}
                </div>
                <span className="text-xs font-semibold text-foreground bg-muted px-3 py-1.5 rounded">
                  {t('pdf.page')} 1 / 1
                </span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
