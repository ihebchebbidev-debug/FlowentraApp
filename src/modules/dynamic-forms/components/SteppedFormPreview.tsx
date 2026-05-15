import { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check, Star, GitBranch, ExternalLink, Info, Loader2, AlertCircle, RefreshCw, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FormField, DynamicForm, FieldOption } from '../types';
import { organizeFieldsIntoPages, FormPage } from '../utils/pageUtils';
import { evaluateFieldVisibility } from '../utils/conditionEvaluator';
import { SignatureCanvas } from './FormBuilder/SignatureCanvas';
import { useFormDynamicOptions } from '../hooks/useDynamicFieldOptions';

interface SteppedFormPreviewProps {
  form: DynamicForm;
  language: 'en' | 'fr';
  formValues: Record<string, any>;
  onValueChange: (fieldId: string, value: any) => void;
}

export function SteppedFormPreview({ 
  form, 
  language, 
  formValues, 
  onValueChange 
}: SteppedFormPreviewProps) {
  const { t } = useTranslation('dynamic-forms');
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const isEnglish = language === 'en';

  // Organize fields into pages
  const pages = useMemo(() => {
    return organizeFieldsIntoPages(form.fields);
  }, [form.fields]);

  const totalPages = pages.length;
  const currentPage = pages[currentPageIndex];
  const progress = ((currentPageIndex + 1) / totalPages) * 100;

  // Filter visible fields on current page based on conditions
  const visibleFields = useMemo(() => {
    if (!currentPage) return [];
    return currentPage.fields.filter(field => evaluateFieldVisibility(field, formValues));
  }, [currentPage, formValues]);
  
  // Dynamic options hook - fetches options for fields with use_dynamic_data enabled
  // Pass formValues to support cascading dropdowns
  const { getFieldOptions, isFieldLoading, getFieldError, getPendingParent, refreshField } = useFormDynamicOptions(form.fields, formValues);
  
  // Handle value change with cascading support - clear dependent fields when parent changes
  const handleValueChange = useCallback((fieldId: string, value: any) => {
    onValueChange(fieldId, value);
    
    // Find fields that depend on this field and clear them
    form.fields.forEach(field => {
      if (field.dependency?.parent_field_id === fieldId && field.dependency?.clear_on_parent_change !== false) {
        onValueChange(field.id, field.type === 'checkbox' ? [] : '');
      }
    });
  }, [onValueChange, form.fields]);
  
  // Helper to get options for a field (dynamic or static)
  const getOptionsForField = useCallback((field: FormField): FieldOption[] => {
    if (field.use_dynamic_data) {
      return getFieldOptions(field.id);
    }
    return field.options || [];
  }, [getFieldOptions]);
  
  // Helper to render pending parent state for cascading fields
  const renderPendingParent = useCallback((field: FormField) => {
    const parentLabel = getPendingParent(field.id);
    if (!parentLabel || !field.dependency) return null;
    
    return (
      <div className="flex items-center gap-2 h-10 px-3 border border-dashed rounded-md text-muted-foreground text-sm bg-muted/30">
        <Link2 className="h-4 w-4" />
        {t('dynamic_data.select_parent_first', { parent: parentLabel })}
      </div>
    );
  }, [getPendingParent, t]);
  
  // Helper to render error state for dynamic fields
  const renderDynamicError = useCallback((field: FormField) => {
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
  }, [getFieldError, refreshField, t]);

  const handleNext = useCallback(() => {
    if (currentPageIndex < totalPages - 1) {
      setCurrentPageIndex(prev => prev + 1);
    }
  }, [currentPageIndex, totalPages]);

  const handlePrevious = useCallback(() => {
    if (currentPageIndex > 0) {
      setCurrentPageIndex(prev => prev - 1);
    }
  }, [currentPageIndex]);

  const handleStepClick = useCallback((index: number) => {
    setCurrentPageIndex(index);
  }, []);

  // Helper function to get width class for field
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

  // Helper to render field link/button
  const renderFieldLink = (field: FormField) => {
    if (!field.link_url) return null;
    
    const linkText = isEnglish ? (field.link_text_en || field.link_url) : (field.link_text_fr || field.link_url);
    const isButton = field.link_style === 'button';
    
    if (isButton) {
      return (
        <a
          href={field.link_url}
          target={field.link_new_tab ? '_blank' : '_self'}
          rel={field.link_new_tab ? 'noopener noreferrer' : undefined}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-1"
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
        className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1"
      >
        {linkText}
        {field.link_new_tab && <ExternalLink className="h-3 w-3" />}
      </a>
    );
  };

  // Helper to render hint text
  const renderHint = (field: FormField) => {
    const hint = isEnglish ? field.hint_en : field.hint_fr;
    if (!hint) return null;
    
    return (
      <div className="flex items-start gap-1.5 mt-1 p-2 rounded bg-muted/50 border border-muted">
        <Info className="h-3.5 w-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
      </div>
    );
  };

  const renderField = (field: FormField) => {
    const label = isEnglish ? field.label_en : field.label_fr;
    const description = isEnglish ? field.description_en : field.description_fr;
    const placeholder = isEnglish ? field.placeholder_en : field.placeholder_fr;
    const hasCondition = !!field.condition;
    const widthClass = getWidthClass(field);

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
      case 'content':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
              <h4 className="text-base font-medium text-foreground">{label}</h4>
              {description && <p className="text-sm text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'section':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="pt-4 pb-2">
              <h3 className="text-lg font-semibold text-foreground border-b pb-2">{label}</h3>
              {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
                placeholder={placeholder}
                value={formValues[field.id] || ''}
                onChange={(e) => onValueChange(field.id, e.target.value)}
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'number':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                type="number"
                placeholder={placeholder}
                min={field.min}
                max={field.max}
                value={formValues[field.id] || ''}
                onChange={(e) => onValueChange(field.id, e.target.value ? Number(e.target.value) : '')}
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'textarea':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Textarea
                placeholder={placeholder}
                rows={3}
                value={formValues[field.id] || ''}
                onChange={(e) => onValueChange(field.id, e.target.value)}
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'checkbox':
        const checkboxOptions = getOptionsForField(field);
        const checkboxLoading = isFieldLoading(field.id);
        const checkboxError = getFieldError(field.id);
        const checkboxPendingParent = getPendingParent(field.id);
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-3">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
                {field.use_dynamic_data && (
                  <Badge variant="outline" className="ml-2 text-[10px] h-4">
                    {field.dependency ? t('dynamic_data.cascading') : 'Dynamic'}
                  </Badge>
                )}
              </Label>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
                <div className="space-y-2">
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
                          {isEnglish ? opt.label_en : opt.label_fr}
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
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'radio':
        const radioOptions = getOptionsForField(field);
        const radioLoading = isFieldLoading(field.id);
        const radioError = getFieldError(field.id);
        const radioPendingParent = getPendingParent(field.id);
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-3">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
                {field.use_dynamic_data && (
                  <Badge variant="outline" className="ml-2 text-[10px] h-4">
                    {field.dependency ? t('dynamic_data.cascading') : 'Dynamic'}
                  </Badge>
                )}
              </Label>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
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
                >
                  {radioOptions.map((opt) => (
                    <div key={opt.id} className="flex items-center space-x-2">
                      <RadioGroupItem value={opt.value} id={opt.id} />
                      <label htmlFor={opt.id} className="text-sm">
                        {isEnglish ? opt.label_en : opt.label_fr}
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
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'select':
        const selectOptions = getOptionsForField(field);
        const selectLoading = isFieldLoading(field.id);
        const selectError = getFieldError(field.id);
        const selectPendingParent = getPendingParent(field.id);
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
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
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={placeholder || t('preview.select_placeholder')} />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    {selectOptions.map((opt) => (
                      <SelectItem key={opt.id} value={opt.value}>
                        {isEnglish ? opt.label_en : opt.label_fr}
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
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'date':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Input
                type="date"
                value={formValues[field.id] || ''}
                onChange={(e) => onValueChange(field.id, e.target.value)}
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'signature':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <SignatureCanvas
                value={formValues[field.id] || ''}
                onChange={(value) => onValueChange(field.id, value)}
                height={120}
              />
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      case 'rating':
        return (
          <div key={field.id} className={`relative ${widthClass}`}>
            {conditionIndicator}
            <div className="space-y-2">
              <Label>
                {label}
                {field.required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <div className="flex items-center gap-1">
                {Array.from({ length: field.maxStars || 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-6 w-6 cursor-pointer transition-colors",
                      i < (formValues[field.id] || 0)
                        ? 'text-amber-500 fill-amber-500'
                        : 'text-muted-foreground/40'
                    )}
                    onClick={() => onValueChange(field.id, i + 1)}
                  />
                ))}
              </div>
              {description && <p className="text-xs text-muted-foreground">{description}</p>}
              {renderHint(field)}
              {renderFieldLink(field)}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!currentPage) {
    return (
      <p className="text-center text-muted-foreground py-8">
        {t('preview.no_fields')}
      </p>
    );
  }

  // Only show pagination UI if there are multiple pages
  const showPagination = totalPages > 1;

  return (
    <div className="space-y-6">
      {/* Progress indicator - only show for multi-page forms */}
      {showPagination && (
        <div className="space-y-4">
          {/* Step indicators */}
          <div className="flex items-center justify-center gap-2">
            {pages.map((page, index) => (
              <button
                key={index}
                onClick={() => handleStepClick(index)}
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all",
                  index === currentPageIndex
                    ? "bg-primary text-primary-foreground"
                    : index < currentPageIndex
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
                )}
              >
                {index < currentPageIndex ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </button>
            ))}
          </div>

          {/* Progress bar */}
          <Progress value={progress} className="h-2" />

          {/* Page title (only show if page has a title) */}
          {currentPage.title_en && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {isEnglish ? currentPage.title_en : currentPage.title_fr}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Fields */}
      <div className="flex flex-wrap gap-4 pl-6 min-h-[300px]">
        {visibleFields.length === 0 ? (
          <p className="text-center text-muted-foreground py-8 w-full">
            {t('multipage.no_visible_fields')}
          </p>
        ) : (
          visibleFields.map(renderField)
        )}
      </div>

      {/* Navigation buttons - only show for multi-page forms */}
      {showPagination && (
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentPageIndex === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            {t('multipage.previous')}
          </Button>

          <Button
            onClick={handleNext}
            disabled={currentPageIndex === totalPages - 1}
            className="gradient-primary"
          >
            {currentPageIndex === totalPages - 1 ? (
              t('multipage.complete')
            ) : (
              <>
                {t('multipage.next')}
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
