import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, CheckCircle2, Loader2, Sun, Moon, Languages, AlertCircle, ExternalLink, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { publicFormsService } from '../services/dynamicFormsService';
import { DynamicForm, FormField } from '../types';
import { evaluateFieldVisibility } from '../utils/conditionEvaluator';
import { evaluateThankYouPage, ThankYouResult } from '../utils/thankYouEvaluator';
import { SignatureCanvas } from '../components/FormBuilder/SignatureCanvas';
import { validateFormFields, validateSubmitterInfo } from '../utils/formValidation';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

export default function PublicFormPage() {
  const { t, i18n } = useTranslation('dynamic-forms');
  const { toast } = useToast();
  const { slug } = useParams<{ slug: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setTheme, theme } = useTheme();
  
  const [form, setForm] = useState<DynamicForm | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitterErrors, setSubmitterErrors] = useState<{ emailError?: string; nameError?: string }>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [submitterInfo, setSubmitterInfo] = useState({
    name: '',
    email: '',
  });
  
  // Thank you page state
  const [thankYouResult, setThankYouResult] = useState<ThankYouResult | null>(null);
  const [redirectCountdown, setRedirectCountdown] = useState<number | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Get language from URL param or fallback to i18n
  const langParam = searchParams.get('lang');
  const themeParam = searchParams.get('theme');
  const [previewLang, setPreviewLang] = useState<'en' | 'fr'>(
    langParam === 'fr' ? 'fr' : langParam === 'en' ? 'en' : (i18n.language === 'fr' ? 'fr' : 'en')
  );
  
  // Apply theme from URL param on mount
  useEffect(() => {
    if (themeParam === 'dark' || themeParam === 'light') {
      setTheme(themeParam);
    }
  }, [themeParam, setTheme]);
  
  // Apply language from URL param on mount
  useEffect(() => {
    if (langParam === 'en' || langParam === 'fr') {
      i18n.changeLanguage(langParam);
      setPreviewLang(langParam);
    }
  }, [langParam, i18n]);
  
  const handleLanguageToggle = () => {
    const newLang = previewLang === 'en' ? 'fr' : 'en';
    setPreviewLang(newLang);
    i18n.changeLanguage(newLang);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('lang', newLang);
    setSearchParams(newParams, { replace: true });
  };
  
  const handleThemeToggle = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('theme', newTheme);
    setSearchParams(newParams, { replace: true });
  };
  
  // Load the form
  useEffect(() => {
    const loadForm = async () => {
      if (!slug) return;
      
      setIsLoading(true);
      try {
        const data = await publicFormsService.getBySlug(slug);
        setForm(data);
      } catch (error) {
        console.error('Failed to load form:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadForm();
  }, [slug]);
  
  // Get visible fields based on conditions
  const visibleFields = useMemo(() => {
    if (!form) return [];
    return form.fields
      .filter(field => evaluateFieldVisibility(field, formValues))
      .sort((a, b) => a.order - b.order);
  }, [form, formValues]);
  
  const handleValueChange = useCallback((fieldId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [fieldId]: value }));
    // Clear field error when user starts typing
    if (fieldErrors[fieldId]) {
      setFieldErrors(prev => {
        const next = { ...prev };
        delete next[fieldId];
        return next;
      });
    }
  }, [fieldErrors]);
  
  // Clear submitter errors when typing
  const handleSubmitterChange = useCallback((field: 'name' | 'email', value: string) => {
    setSubmitterInfo(prev => ({ ...prev, [field]: value }));
    if (field === 'email' && submitterErrors.emailError) {
      setSubmitterErrors(prev => ({ ...prev, emailError: undefined }));
    }
    if (field === 'name' && submitterErrors.nameError) {
      setSubmitterErrors(prev => ({ ...prev, nameError: undefined }));
    }
  }, [submitterErrors]);
  
  const handleSubmit = async () => {
    if (!slug || !form) return;
    
    setHasAttemptedSubmit(true);
    
    // Validate all form fields
    const validationResult = validateFormFields(visibleFields, formValues, previewLang);
    
    // Validate submitter info
    const submitterValidation = validateSubmitterInfo(submitterInfo.email, submitterInfo.name, previewLang);
    
    // Set field errors for display
    setFieldErrors(validationResult.fieldErrors);
    setSubmitterErrors(submitterValidation);
    
    // Check if there are any validation errors
    const hasFieldErrors = !validationResult.isValid;
    const hasSubmitterErrors = !!(submitterValidation.emailError || submitterValidation.nameError);
    
    if (hasFieldErrors || hasSubmitterErrors) {
      // Count total errors
      const errorCount = validationResult.errors.length + 
        (submitterValidation.emailError ? 1 : 0) + 
        (submitterValidation.nameError ? 1 : 0);
      
      toast({
        title: t('public.validation_error', 'Validation Error'),
        description: t('public.fix_errors', 'Please fix the {{count}} error(s) below before submitting').replace('{{count}}', String(errorCount)),
        variant: 'destructive',
      });
      
      // Scroll to first error
      const firstErrorField = validationResult.errors[0];
      if (firstErrorField) {
        const element = document.getElementById(`field-${firstErrorField.fieldId}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    
    // Check if there are any responses
    const hasResponses = Object.keys(formValues).some(key => {
      const value = formValues[key];
      return value !== undefined && value !== null && value !== '' && 
             (!Array.isArray(value) || value.length > 0);
    });
    
    if (!hasResponses) {
      toast({
        title: t('public.validation_error', 'Validation Error'),
        description: t('public.empty_form', 'The form cannot be submitted empty.'),
        variant: 'destructive',
      });
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Only send email/name if they are valid non-empty strings
      const submitterEmail = submitterInfo.email?.trim() || undefined;
      const submitterName = submitterInfo.name?.trim() || undefined;
      
      await publicFormsService.submitResponse(slug, {
        responses: formValues,
        submitter_name: submitterName,
        submitter_email: submitterEmail,
      });
      
      // Evaluate thank you page based on form responses
      const result = evaluateThankYouPage(form.thank_you_settings, formValues);
      setThankYouResult(result);
      
      // Start redirect countdown if applicable
      if (result.redirect_url) {
        const delay = result.redirect_delay || 3;
        setRedirectCountdown(delay);
        
        // Start countdown timer
        let remaining = delay;
        redirectTimerRef.current = setInterval(() => {
          remaining -= 1;
          setRedirectCountdown(remaining);
          
          if (remaining <= 0) {
            if (redirectTimerRef.current) {
              clearInterval(redirectTimerRef.current);
            }
            window.location.href = result.redirect_url!;
          }
        }, 1000);
      }
      
      setIsSubmitted(true);
      toast({
        title: t('public.submit_success', 'Response submitted'),
        description: t('public.submit_success_desc', 'Thank you for your response!'),
      });
    } catch (error: any) {
      console.error('Public form submission error:', error);
      toast({
        title: t('public.submit_error', 'Submission failed'),
        description: error?.message || t('public.submit_error_desc', 'Please try again later.'),
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) {
        clearInterval(redirectTimerRef.current);
      }
    };
  }, []);
  
  const getWidthClass = (field: FormField): string => {
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
    const hint = previewLang === 'en' ? field.hint_en : field.hint_fr;
    const error = fieldErrors[field.id];
    const hasError = !!error && hasAttemptedSubmit;
    
    // Helper component for field error display
    const FieldError = () => hasError ? (
      <p className="text-xs text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="h-3 w-3" />
        {error}
      </p>
    ) : null;

    // Helper to render hint text
    const FieldHint = () => hint ? (
      <div className="flex items-start gap-1.5 mt-1.5 p-2 rounded bg-muted/50 border border-muted">
        <Info className="h-3.5 w-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
      </div>
    ) : null;

    // Helper to render link/button
    const FieldLink = () => {
      if (!field.link_url) return null;
      
      const linkText = previewLang === 'en' 
        ? (field.link_text_en || field.link_url) 
        : (field.link_text_fr || field.link_url);
      const isButton = field.link_style === 'button';
      
      if (isButton) {
        return (
          <a
            href={field.link_url}
            target={field.link_new_tab ? '_blank' : '_self'}
            rel={field.link_new_tab ? 'noopener noreferrer' : undefined}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-1.5"
          >
            {linkText}
            {field.link_new_tab && <ExternalLink className="h-3 w-3" />}
          </a>
        );
      }
      
      return (
        <a
          href={field.link_url}
          target={field.link_new_tab ? '_blank' : '_self'}
          rel={field.link_new_tab ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1.5"
        >
          {linkText}
          {field.link_new_tab && <ExternalLink className="h-3 w-3" />}
        </a>
      );
    };
    
    switch (field.type) {
      case 'content':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="text-base font-medium text-foreground">{label}</h4>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
            </div>
          </div>
        );

      case 'section':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`${getWidthClass(field)}`}>
            <div className="pt-6 pb-3 border-b-2 border-primary/20 mb-4">
              <h3 className="text-base font-semibold text-foreground">{label}</h3>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              <FieldHint />
              <FieldLink />
            </div>
          </div>
        );
        
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input 
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                placeholder={placeholder}
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className={cn(
                  "bg-background border-border focus:border-primary",
                  hasError && "border-destructive focus:border-destructive"
                )}
                aria-invalid={hasError}
              />
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      case 'number':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
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
                className={cn(
                  "bg-background border-border focus:border-primary",
                  hasError && "border-destructive focus:border-destructive"
                )}
                aria-invalid={hasError}
              />
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      case 'textarea':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Textarea 
                placeholder={placeholder} 
                rows={3}
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className={cn(
                  "bg-background border-border focus:border-primary resize-none",
                  hasError && "border-destructive focus:border-destructive"
                )}
                aria-invalid={hasError}
              />
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      case 'checkbox':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-2">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {description && !hasError && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
              <div className="space-y-2 pl-1">
                {field.options?.map((opt) => {
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
                {(!field.options || field.options.length === 0) && (
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={!!formValues[field.id]}
                      onCheckedChange={(checked) => handleValueChange(field.id, checked)}
                    />
                    <span className="text-sm">{label}</span>
                  </div>
                )}
              </div>
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      case 'radio':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-2">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              {description && !hasError && <p className="text-xs text-muted-foreground mb-2">{description}</p>}
              <RadioGroup 
                value={formValues[field.id] || ''}
                onValueChange={(value) => handleValueChange(field.id, value)}
                className="pl-1"
              >
                {field.options?.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} id={opt.id} />
                    <label htmlFor={opt.id} className="text-sm">
                      {previewLang === 'en' ? opt.label_en : opt.label_fr}
                    </label>
                  </div>
                ))}
              </RadioGroup>
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      case 'select':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Select 
                value={formValues[field.id] || ''}
                onValueChange={(value) => handleValueChange(field.id, value)}
              >
                <SelectTrigger className={cn(
                  "bg-background border-border",
                  hasError && "border-destructive"
                )}>
                  <SelectValue placeholder={placeholder || t('preview.select_placeholder', 'Select...')} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((opt) => (
                    <SelectItem key={opt.id} value={opt.value}>
                      {previewLang === 'en' ? opt.label_en : opt.label_fr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      case 'date':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input 
                type="date"
                value={formValues[field.id] || ''}
                onChange={(e) => handleValueChange(field.id, e.target.value)}
                className={cn(
                  "bg-background border-border focus:border-primary",
                  hasError && "border-destructive focus:border-destructive"
                )}
                aria-invalid={hasError}
              />
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className={cn(hasError && "ring-1 ring-destructive rounded-md")}>
                <SignatureCanvas
                  value={formValues[field.id] || ''}
                  onChange={(value) => handleValueChange(field.id, value)}
                  height={120}
                />
              </div>
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} id={`field-${field.id}`} className={`mb-4 ${getWidthClass(field)}`}>
            <div className="space-y-1.5">
              <Label className={cn("text-sm font-medium", hasError && "text-destructive")}>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className={cn(
                "flex items-center gap-1 p-2 rounded-md",
                hasError && "bg-destructive/5 ring-1 ring-destructive"
              )}>
                {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-6 w-6 cursor-pointer transition-colors ${
                      i < (formValues[field.id] || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted-foreground/30'
                    }`}
                    onClick={() => handleValueChange(field.id, i + 1)}
                  />
                ))}
              </div>
              {description && !hasError && <p className="text-xs text-muted-foreground">{description}</p>}
              <FieldHint />
              <FieldLink />
              <FieldError />
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!form) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>{t('public.not_found_title', 'Form Not Found')}</CardTitle>
            <CardDescription>
              {t('public.not_found_desc', 'This form is not available or has been removed.')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }
  
  if (isSubmitted) {
    // Get the appropriate thank you content based on language
    const thankYouTitle = thankYouResult 
      ? (previewLang === 'fr' ? thankYouResult.title_fr : thankYouResult.title_en)
      : t('public.thank_you', 'Thank You!');
    const thankYouMessage = thankYouResult
      ? (previewLang === 'fr' ? thankYouResult.message_fr : thankYouResult.message_en)
      : t('public.response_recorded', 'Your response has been recorded.');
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">
                  {thankYouTitle}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {thankYouMessage}
                </p>
              </div>
              
              {/* Redirect countdown */}
              {thankYouResult?.redirect_url && redirectCountdown !== null && (
                <div className="pt-4 border-t">
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <ExternalLink className="h-4 w-4" />
                    <span>
                      {t('public.redirecting_in', 'Redirecting in {{seconds}} seconds...').replace('{{seconds}}', String(redirectCountdown))}
                    </span>
                  </div>
                  <Button
                    variant="link"
                    size="sm"
                    className="mt-2"
                    onClick={() => window.location.href = thankYouResult.redirect_url!}
                  >
                    {t('public.redirect_now', 'Redirect now')}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  const formName = previewLang === 'en' ? form.name_en : form.name_fr;
  const formDescription = previewLang === 'en' ? form.description_en : form.description_fr;
  
  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      {/* Theme and Language toggles */}
      <div className="fixed top-4 right-4 flex gap-2 z-50">
        <Button
          variant="outline"
          size="icon"
          onClick={handleLanguageToggle}
          className="bg-background/80 backdrop-blur"
          title={previewLang === 'en' ? 'Français' : 'English'}
        >
          <Languages className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleThemeToggle}
          className="bg-background/80 backdrop-blur"
          title={theme === 'dark' ? t('public.light_mode') : t('public.dark_mode')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>{formName}</CardTitle>
            {formDescription && (
              <CardDescription>{formDescription}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Optional submitter info */}
            <div className="space-y-4 pb-4 border-b">
              <div className="space-y-1.5">
                <Label className={cn(
                  "text-sm font-medium",
                  submitterErrors.nameError && hasAttemptedSubmit && "text-destructive"
                )}>
                  {t('public.your_name', 'Your Name')}
                  <span className="text-muted-foreground ml-1 font-normal">
                    ({t('public.optional', 'optional')})
                  </span>
                </Label>
                <Input 
                  placeholder={t('public.name_placeholder', 'Enter your name')}
                  value={submitterInfo.name}
                  onChange={(e) => handleSubmitterChange('name', e.target.value)}
                  maxLength={200}
                  className={cn(
                    submitterErrors.nameError && hasAttemptedSubmit && "border-destructive focus:border-destructive"
                  )}
                />
                {submitterErrors.nameError && hasAttemptedSubmit && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {submitterErrors.nameError}
                  </p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className={cn(
                  "text-sm font-medium",
                  submitterErrors.emailError && hasAttemptedSubmit && "text-destructive"
                )}>
                  {t('public.your_email', 'Your Email')}
                  <span className="text-muted-foreground ml-1 font-normal">
                    ({t('public.optional', 'optional')})
                  </span>
                </Label>
                <Input 
                  type="email"
                  placeholder={t('public.email_placeholder', 'Enter your email')}
                  value={submitterInfo.email}
                  onChange={(e) => handleSubmitterChange('email', e.target.value)}
                  maxLength={255}
                  className={cn(
                    submitterErrors.emailError && hasAttemptedSubmit && "border-destructive focus:border-destructive"
                  )}
                />
                {submitterErrors.emailError && hasAttemptedSubmit && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {submitterErrors.emailError}
                  </p>
                )}
              </div>
            </div>
            
            {/* Form fields */}
            <div className="flex flex-wrap gap-4">
              {visibleFields.map(renderField)}
            </div>
            
            {visibleFields.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {t('preview.no_fields', 'This form has no fields yet')}
              </p>
            )}
            
            {/* Validation error summary */}
            {hasAttemptedSubmit && (Object.keys(fieldErrors).length > 0 || submitterErrors.emailError || submitterErrors.nameError) && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {t('public.fix_errors', 'Please fix the errors above before submitting')}
                </AlertDescription>
              </Alert>
            )}
            
            {/* Submit button */}
            {visibleFields.length > 0 && (
              <Button 
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full"
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('public.submitting', 'Submitting...')}
                  </>
                ) : (
                  t('public.submit', 'Submit')
                )}
              </Button>
            )}
          </CardContent>
        </Card>
        
        {/* Powered by footer */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          {t('public.powered_by', 'Powered by Flow Service')}
        </p>
      </div>
    </div>
  );
}
