import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PDFDownloadLink } from '@react-pdf/renderer';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  Settings, 
  FileText, 
  Asterisk, 
  FileStack, 
  GitBranch,
  Eye,
  LayoutList,
  Star,
  ExternalLink,
  Info,
  Database,
  Download,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormField } from '../../types';
import { FormTemplatePDF } from './FormTemplatePDF';

interface FormCanvasProps {
  fields: FormField[];
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onRemoveField: (id: string) => void;
  onDuplicateField: (id: string) => void;
  formName?: string;
  formDescription?: string;
}

interface SortableFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isEnglish: boolean;
}

function SortableField({ field, isSelected, onSelect, onRemove, onDuplicate, isEnglish }: SortableFieldProps) {
  const { t } = useTranslation('dynamic-forms');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const isSection = field.type === 'section';
  const isPageBreak = field.type === 'page_break';
  const hasCondition = !!field.condition;
  
  // Special styling for page breaks
  if (isPageBreak) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`group flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${
          isSelected 
            ? 'border-primary bg-primary/5 shadow-sm' 
            : 'border-transparent bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 hover:border-primary/30'
        } cursor-pointer`}
        onClick={onSelect}
      >
        <div
          {...attributes}
          {...listeners}
          className="flex-shrink-0 p-1.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
        
        <div className="flex-1 flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20">
            <FileStack className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-primary">
              {t('field_types.page_break')}
            </p>
            <p className="text-xs text-muted-foreground">
              {isEnglish ? field.label_en : field.label_fr}
            </p>
          </div>
        </div>
        
        <div className="h-px flex-1 bg-gradient-to-r from-primary/40 to-transparent" />
        
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
              >
                <Settings className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{t('builder.edit_field')}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{t('builder.remove_field')}</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
    );
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-start gap-2 p-3 rounded-lg border-2 transition-all ${
        isSelected 
          ? 'border-primary bg-primary/5 shadow-sm' 
          : 'border-transparent bg-card hover:border-border hover:shadow-sm'
      } ${isSection ? 'bg-muted/50' : ''} cursor-pointer`}
      onClick={onSelect}
    >
      <div
        {...attributes}
        {...listeners}
        className="flex-shrink-0 p-1.5 rounded hover:bg-muted cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      
      <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-1">
          <Badge 
            variant="secondary" 
            className={`text-[10px] font-medium ${isSection ? 'bg-primary/10 text-primary' : ''}`}
          >
            {t(`field_types.${field.type}`)}
          </Badge>
          {field.required && (
            <Tooltip>
              <TooltipTrigger>
                <Asterisk className="h-3 w-3 text-destructive" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t('field_props.required')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {hasCondition && (
            <Tooltip>
              <TooltipTrigger>
                <GitBranch className="h-3 w-3 text-primary" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t('conditional.title')}</p>
              </TooltipContent>
            </Tooltip>
          )}
          {field.use_dynamic_data && (
            <Tooltip>
              <TooltipTrigger>
                <Database className="h-3 w-3 text-primary" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">{t('dynamic_data.use_dynamic')}</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
        <p className={`font-medium truncate ${isSection ? 'text-base' : 'text-sm'}`}>
          {isEnglish ? field.label_en : field.label_fr}
        </p>
        {(field.description_en || field.description_fr) && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {isEnglish ? field.description_en : field.description_fr}
          </p>
        )}
      </div>
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
            >
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{t('builder.edit_field')}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{t('builder.duplicate_field')}</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p className="text-xs">{t('builder.remove_field')}</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}

// Realistic Preview Field Component with Drag Support
interface PreviewFieldProps {
  field: FormField;
  isSelected: boolean;
  onSelect: () => void;
  onRemove: () => void;
  onDuplicate: () => void;
  isEnglish: boolean;
}

function PreviewField({ field, isSelected, onSelect, onRemove, onDuplicate, isEnglish }: PreviewFieldProps) {
  const { t } = useTranslation('dynamic-forms');
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
  };
  
  const label = isEnglish ? field.label_en : field.label_fr;
  const description = isEnglish ? field.description_en : field.description_fr;
  const placeholder = isEnglish ? field.placeholder_en : field.placeholder_fr;
  const hint = isEnglish ? field.hint_en : field.hint_fr;
  
  // Get width class for field
  const getWidthClass = (): string => {
    if (field.type === 'section' || field.type === 'page_break' || field.type === 'content') {
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
  
  // Render link/button
  const renderFieldLink = () => {
    if (!field.link_url) return null;
    
    const linkText = isEnglish ? (field.link_text_en || field.link_url) : (field.link_text_fr || field.link_url);
    const isButton = field.link_style === 'button';
    
    if (isButton) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary text-primary-foreground mt-1">
          {linkText}
          {field.link_new_tab && <ExternalLink className="h-3 w-3" />}
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center gap-1 text-xs text-primary mt-1">
        {linkText}
        {field.link_new_tab && <ExternalLink className="h-3 w-3" />}
      </span>
    );
  };
  
  // Render hint
  const renderHint = () => {
    if (!hint) return null;
    return (
      <div className="flex items-start gap-1.5 mt-1 p-2 rounded bg-muted/50 border border-muted">
        <Info className="h-3.5 w-3.5 text-primary/70 flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">{hint}</p>
      </div>
    );
  };
  
  const widthClass = getWidthClass();
  
  // Render based on field type
  const renderFieldContent = () => {
    switch (field.type) {
      case 'content':
        return (
          <div className="space-y-2 p-4 rounded-lg bg-muted/30 border border-border/50">
            <h4 className="text-base font-medium text-foreground">{label}</h4>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'section':
        return (
          <div className="pt-4 pb-2">
            <h3 className="text-lg font-semibold text-foreground border-b pb-2">{label}</h3>
            {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'page_break':
        return (
          <div className="flex items-center gap-3 py-4">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
              <FileStack className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">{t('field_types.page_break')}</span>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
          </div>
        );
        
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              placeholder={placeholder || t('preview.select_placeholder')}
              disabled
              className="bg-background"
            />
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'number':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="number"
              placeholder={placeholder || '0'}
              disabled
              className="bg-background"
            />
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              placeholder={placeholder || t('preview.select_placeholder')}
              rows={3}
              disabled
              className="bg-background resize-none"
            />
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'date':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              type="text"
              placeholder={t('field_types.date_desc')}
              disabled
              className="bg-background"
            />
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'checkbox':
        const checkboxOptions = field.options || [];
        return (
          <div className="space-y-3">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.use_dynamic_data && field.dependency && (
                <Badge variant="outline" className="ml-2 text-[10px] h-4">
                  {t('dynamic_data.cascading')}
                </Badge>
              )}
            </Label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {checkboxOptions.length > 0 ? (
              <div className="space-y-2">
                {checkboxOptions.slice(0, 3).map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <Checkbox disabled />
                    <span className="text-sm">{isEnglish ? opt.label_en : opt.label_fr}</span>
                  </div>
                ))}
                {checkboxOptions.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{checkboxOptions.length - 3} {t('builder.more_options', 'more options')}</p>
                )}
              </div>
            ) : field.use_dynamic_data ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2 px-3 bg-muted/30 rounded border border-dashed">
                <Database className="h-4 w-4" />
                {t('dynamic_data.use_dynamic_hint')}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Checkbox disabled />
                <span className="text-sm">{label}</span>
              </div>
            )}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'radio':
        const radioOptions = field.options || [];
        return (
          <div className="space-y-3">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.use_dynamic_data && field.dependency && (
                <Badge variant="outline" className="ml-2 text-[10px] h-4">
                  {t('dynamic_data.cascading')}
                </Badge>
              )}
            </Label>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {radioOptions.length > 0 ? (
              <RadioGroup disabled className="space-y-2">
                {radioOptions.slice(0, 3).map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2">
                    <RadioGroupItem value={opt.value} disabled />
                    <span className="text-sm">{isEnglish ? opt.label_en : opt.label_fr}</span>
                  </div>
                ))}
                {radioOptions.length > 3 && (
                  <p className="text-xs text-muted-foreground">+{radioOptions.length - 3} {t('builder.more_options', 'more options')}</p>
                )}
              </RadioGroup>
            ) : field.use_dynamic_data ? (
              <div className="flex items-center gap-2 text-muted-foreground text-sm py-2 px-3 bg-muted/30 rounded border border-dashed">
                <Database className="h-4 w-4" />
                {t('dynamic_data.use_dynamic_hint')}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">{t('field_props.no_options_warning')}</p>
            )}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'select':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
              {field.use_dynamic_data && field.dependency && (
                <Badge variant="outline" className="ml-2 text-[10px] h-4">
                  {t('dynamic_data.cascading')}
                </Badge>
              )}
            </Label>
            <Select disabled>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder={placeholder || t('preview.select_placeholder')} />
              </SelectTrigger>
            </Select>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'signature':
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="h-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-background">
              <p className="text-sm text-muted-foreground">{t('field_types.signature_hint')}</p>
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      case 'rating':
        const maxStars = field.maxStars || 5;
        return (
          <div className="space-y-2">
            <Label className="text-sm">
              {label}
              {field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex gap-1">
              {Array.from({ length: maxStars }).map((_, i) => (
                <Star
                  key={i}
                  className="h-6 w-6 text-muted-foreground/30"
                />
              ))}
            </div>
            {description && <p className="text-xs text-muted-foreground">{description}</p>}
            {renderHint()}
            {renderFieldLink()}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`${widthClass} relative transition-all rounded-lg group ${
        isDragging ? 'z-50' : ''
      } ${
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' 
          : 'hover:ring-1 hover:ring-border'
      }`}
    >
      {/* Drag handle and action buttons */}
      <div className={`absolute -left-1 top-1/2 -translate-y-1/2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${isDragging ? 'opacity-100' : ''}`}>
        <div
          {...attributes}
          {...listeners}
          className="p-1.5 rounded bg-background border shadow-sm cursor-grab active:cursor-grabbing hover:bg-muted"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
      
      {/* Selection indicator with actions */}
      <div 
        className={`absolute -top-2 -right-2 flex items-center gap-0.5 z-10 transition-opacity ${
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
        }`}
      >
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect();
                }}
                className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-sm hover:bg-primary/90"
              >
                <Settings className="h-3 w-3 text-primary-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{t('builder.edit_field')}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDuplicate();
                }}
                className="w-6 h-6 bg-secondary rounded-full flex items-center justify-center shadow-sm hover:bg-secondary/90"
              >
                <Copy className="h-3 w-3 text-secondary-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{t('builder.duplicate_field')}</p>
            </TooltipContent>
          </Tooltip>
          
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove();
                }}
                className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-sm hover:bg-destructive/90"
              >
                <Trash2 className="h-3 w-3 text-destructive-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">{t('builder.remove_field')}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {/* Clickable content area */}
      <div onClick={onSelect} className="cursor-pointer p-1">
        {renderFieldContent()}
      </div>
    </div>
  );
}

export function FormCanvas({ fields, selectedFieldId, onSelectField, onRemoveField, onDuplicateField, formName, formDescription }: FormCanvasProps) {
  const { t, i18n } = useTranslation('dynamic-forms');
  const isEnglish = i18n.language === 'en';
  const [viewMode, setViewMode] = useState<'structure' | 'preview'>('preview');
  
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  });
  
  // Click outside to deselect
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Only deselect if clicking directly on the canvas background
    if (e.target === e.currentTarget) {
      onSelectField(null);
    }
  }, [onSelectField]);
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            {t('builder.form_canvas')}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {viewMode === 'preview' ? t('builder.preview_mode_hint', 'Click fields to edit') : t('builder.canvas_hint')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* PDF Export Button */}
          {viewMode === 'preview' && fields.length > 0 && (
            <PDFDownloadLink
              document={
                <FormTemplatePDF
                  formName={formName || t('builder.form_document', 'Form Document')}
                  formDescription={formDescription}
                  fields={fields}
                  language={isEnglish ? 'en' : 'fr'}
                />
              }
              fileName={`${(formName || 'form').toLowerCase().replace(/\s+/g, '-')}-template.pdf`}
            >
              {({ loading }) => (
                <Button variant="outline" size="sm" className="h-8 gap-1.5" disabled={loading}>
                  {loading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  <span className="text-xs">{t('common.export_pdf', 'Export PDF')}</span>
                </Button>
              )}
            </PDFDownloadLink>
          )}
          
          {/* View Mode Toggle */}
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'structure' | 'preview')} className="w-auto">
            <TabsList className="h-8 p-1">
              <TabsTrigger value="preview" className="text-xs h-6 px-2 gap-1">
                <Eye className="h-3 w-3" />
                {t('builder.preview_view', 'Preview')}
              </TabsTrigger>
              <TabsTrigger value="structure" className="text-xs h-6 px-2 gap-1">
                <LayoutList className="h-3 w-3" />
                {t('builder.structure_view', 'Structure')}
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
      
      {/* Canvas Container with paper background pattern */}
      <div 
        className={`flex-1 min-h-[400px] rounded-lg transition-all overflow-y-auto ${
          viewMode === 'preview' 
            ? 'bg-[repeating-linear-gradient(45deg,hsl(var(--muted)/0.3)_0px,hsl(var(--muted)/0.3)_2px,transparent_2px,transparent_12px)] p-6' 
            : ''
        }`}
        onClick={handleCanvasClick}
      >
        {viewMode === 'preview' ? (
          // PDF-like Document View - matching FormPreviewPage exactly
          <div className="w-full max-w-[850px] mx-auto">
            <div 
              ref={setNodeRef}
              className={`bg-white dark:bg-zinc-900 shadow-xl border-0 rounded-none transition-all ${
                isOver ? 'ring-2 ring-primary ring-offset-4' : ''
              }`}
              style={{ minHeight: '800px' }}
            >
              {/* Professional Header - Same as FormPreviewPage */}
              <div className="bg-white dark:bg-zinc-900 px-10 pt-10 pb-5 flex justify-between items-start border-b-[3px] border-primary">
                {/* Logo placeholder */}
                <div className="h-[70px] w-[70px] bg-muted rounded-lg flex items-center justify-center">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                
                {/* Document Info */}
                <div className="text-right">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                    {isEnglish ? 'Completed on' : 'Complété le'}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {new Date().toLocaleDateString(isEnglish ? 'en-US' : 'fr-FR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              
              {/* Document Content */}
              <div className="p-10">
                {/* Title & Description Section */}
                <div className="mb-8 space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                      {isEnglish ? 'Title' : 'Titre'}
                    </p>
                    <p className="text-lg font-semibold text-foreground">
                      {formName || t('builder.form_document', 'Form Document')}
                    </p>
                  </div>
                  {(formDescription || !formName) && (
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
                        {isEnglish ? 'Description' : 'Description'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formDescription || t('builder.form_preview_subtitle', 'Preview of your form')}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Form Fields */}
                <div className="space-y-5 min-h-[300px]">
                  {fields.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground mb-1">
                        {t('builder.empty_canvas')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t('builder.empty_canvas_hint')}
                      </p>
                    </div>
                  ) : (
                    <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                      <div className="flex flex-wrap gap-4">
                        {fields.map((field) => (
                          <PreviewField
                            key={field.id}
                            field={field}
                            isSelected={field.id === selectedFieldId}
                            onSelect={() => onSelectField(field.id)}
                            onRemove={() => onRemoveField(field.id)}
                            onDuplicate={() => onDuplicateField(field.id)}
                            isEnglish={isEnglish}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  )}
                </div>
              </div>
              
              {/* Professional Footer - Same as FormPreviewPage */}
              <div className="border-t border-border bg-muted/30 px-10 py-4 mt-auto">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {formName || t('builder.form_document', 'Form Document')}
                    </p>
                    <p className="text-xs text-muted-foreground/60 mt-0.5">
                      © {new Date().getFullYear()} Flow Service
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-foreground bg-muted px-3 py-1.5 rounded">
                    {fields.length} {t('builder.fields_count')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Structure View
          <div 
            ref={setNodeRef}
            className={`min-h-full rounded-lg border-2 border-dashed transition-all ${
              isOver 
                ? 'border-primary bg-primary/5' 
                : 'border-border bg-muted/20'
            } ${fields.length === 0 ? 'flex items-center justify-center' : 'p-3'}`}
          >
            {fields.length === 0 ? (
              <div className="text-center p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground mb-1">
                  {t('builder.empty_canvas')}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('builder.empty_canvas_hint')}
                </p>
              </div>
            ) : (
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <SortableField
                      key={field.id}
                      field={field}
                      isSelected={field.id === selectedFieldId}
                      onSelect={() => onSelectField(field.id)}
                      onRemove={() => onRemoveField(field.id)}
                      onDuplicate={() => onDuplicateField(field.id)}
                      isEnglish={isEnglish}
                    />
                  ))}
                </div>
              </SortableContext>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
