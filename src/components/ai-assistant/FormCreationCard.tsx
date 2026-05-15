import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Sparkles, 
  CheckCircle2, 
  Loader2, 
  FileText, 
  PenLine,
  Star,
  Hash,
  Mail,
  Phone,
  Calendar,
  ListChecks,
  Radio,
  ChevronDown,
  Type,
  AlignLeft
} from 'lucide-react';
import { ParsedFormData, ParsedFieldData } from '@/services/ai/aiFormCreationService';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface FormCreationCardProps {
  formData: ParsedFormData;
  onCreateForm: () => void;
  isCreating: boolean;
  isCreated?: boolean;
  editUrl?: string;
  onNavigateToEdit?: () => void;
}

// Field type icon and color mapping
const fieldTypeConfig: Record<string, { 
  icon: React.ComponentType<{ className?: string }>; 
  color: string;
  label: string;
}> = {
  section: { icon: Type, color: 'bg-muted text-muted-foreground', label: 'Section' },
  text: { icon: Type, color: 'bg-primary/10 text-primary', label: 'Text' },
  textarea: { icon: AlignLeft, color: 'bg-primary/10 text-primary', label: 'Long Text' },
  number: { icon: Hash, color: 'bg-secondary text-secondary-foreground', label: 'Number' },
  email: { icon: Mail, color: 'bg-accent text-accent-foreground', label: 'Email' },
  phone: { icon: Phone, color: 'bg-accent text-accent-foreground', label: 'Phone' },
  date: { icon: Calendar, color: 'bg-warning/10 text-warning', label: 'Date' },
  checkbox: { icon: ListChecks, color: 'bg-success/10 text-success', label: 'Checkbox' },
  radio: { icon: Radio, color: 'bg-warning/10 text-warning', label: 'Choice' },
  select: { icon: ChevronDown, color: 'bg-warning/10 text-warning', label: 'Dropdown' },
  signature: { icon: PenLine, color: 'bg-destructive/10 text-destructive', label: 'Signature' },
  rating: { icon: Star, color: 'bg-warning/10 text-warning', label: 'Rating' },
};

function getFieldTypeConfig(type: string) {
  return fieldTypeConfig[type] || { icon: Type, color: 'bg-muted text-muted-foreground', label: type };
}

// Count field types
function getFieldTypeCounts(fields: ParsedFieldData[]): Record<string, number> {
  return fields.reduce((acc, field) => {
    if (field.type !== 'section') { // Don't count sections
      acc[field.type] = (acc[field.type] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);
}

export function FormCreationCard({ 
  formData, 
  onCreateForm, 
  isCreating,
  isCreated,
  editUrl,
  onNavigateToEdit
}: FormCreationCardProps) {
  const { t } = useTranslation('aiAssistant');
  const fieldTypeCounts = getFieldTypeCounts(formData.fields);
  const totalFields = formData.fields.filter(f => f.type !== 'section').length;
  const requiredFields = formData.fields.filter(f => f.required && f.type !== 'section').length;

  if (isCreated) {
    // Extract form ID from editUrl (format: /dashboard/settings/dynamic-forms/{id}/edit)
    const formId = editUrl?.split('/').find((_, i, arr) => arr[i + 1] === 'edit') || editUrl?.split('/').pop();
    const previewUrl = formId ? `/dashboard/settings/dynamic-forms/${formId}/preview` : null;
    
    return (
      <div className="mt-4 p-3 bg-muted/50 border border-border rounded-lg">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-medium text-foreground truncate">
              {formData.name_en}
            </span>
          </div>
          {previewUrl && onNavigateToEdit && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                window.location.href = previewUrl;
              }}
              className="gap-1.5 text-xs h-7 px-2"
            >
              <FileText className="h-3 w-3" />
              {t('preview', 'Preview')}
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 p-4 bg-gradient-to-br from-primary/5 via-primary/10 to-accent/5 border-2 border-primary/30 rounded-xl shadow-sm">
      {/* Header with sparkle and prominent create button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/15 rounded-xl">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground">
              {t('formReadyToCreate', 'Ready to create your form')}
            </h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              {t('formPreviewHint', 'Review the details and click Create')}
            </p>
          </div>
        </div>
        
        {/* Prominent CREATE button */}
        <Button
          size="default"
          onClick={onCreateForm}
          disabled={isCreating}
          className="gap-2 bg-primary hover:bg-primary/90 shadow-md hover:shadow-lg transition-all font-semibold px-5"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {t('creating', 'Creating...')}
            </>
          ) : (
            <>
              <CheckCircle2 className="h-4 w-4" />
              {t('createItForMe', 'Create it for me')}
            </>
          )}
        </Button>
      </div>

      {/* Form preview card */}
      <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 p-4">
        {/* Form name and field count */}
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-foreground">
            {formData.name_en}
          </span>
          <Badge variant="secondary" className="ml-auto text-xs">
            {totalFields} {t('fields', 'fields')}
          </Badge>
          {requiredFields > 0 && (
            <Badge variant="outline" className="text-xs">
              {requiredFields} {t('required', 'required')}
            </Badge>
          )}
        </div>
        
        {/* Description */}
        {formData.description_en && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {formData.description_en}
          </p>
        )}

        {/* Category badge */}
        {formData.category && (
          <Badge variant="outline" className="mb-3 text-xs capitalize">
            {formData.category}
          </Badge>
        )}

        {/* Field type summary with icons */}
        <div className="flex flex-wrap gap-2 mt-2">
          {Object.entries(fieldTypeCounts).slice(0, 8).map(([type, count]) => {
            const config = getFieldTypeConfig(type);
            const IconComponent = config.icon;
            return (
              <div 
                key={type}
                className={cn(
                  "flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium",
                  config.color
                )}
              >
                <IconComponent className="h-3 w-3" />
                <span>{config.label}</span>
                {count > 1 && <span className="opacity-70">×{count}</span>}
              </div>
            );
          })}
          {Object.keys(fieldTypeCounts).length > 8 && (
            <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
              +{Object.keys(fieldTypeCounts).length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Footer hint */}
      <p className="text-[11px] text-muted-foreground mt-3 flex items-center gap-1.5">
        <PenLine className="h-3 w-3" />
        {t('formSavedAsDraft', 'Form will be saved as draft. You can edit it afterward.')}
      </p>
    </div>
  );
}
