import React from 'react';
import { Button } from '@/components/ui/button';
import { Sparkles, CheckCircle2, Loader2, FileText } from 'lucide-react';
import { ParsedFormData } from '@/services/ai/aiFormCreationService';

interface FormPreviewCardProps {
  formData: ParsedFormData;
  onCreateForm: () => void;
  isCreating: boolean;
}

// Field type display config
const fieldTypeConfig: Record<string, { label: string; color: string }> = {
  section: { label: 'Section', color: 'bg-muted text-muted-foreground' },
  text: { label: 'Text', color: 'bg-primary/10 text-primary' },
  textarea: { label: 'Long Text', color: 'bg-primary/10 text-primary' },
  number: { label: 'Number', color: 'bg-secondary text-secondary-foreground' },
  email: { label: 'Email', color: 'bg-accent text-accent-foreground' },
  phone: { label: 'Phone', color: 'bg-accent text-accent-foreground' },
  date: { label: 'Date', color: 'bg-warning/10 text-warning' },
  checkbox: { label: 'Checkbox', color: 'bg-success/10 text-success' },
  radio: { label: 'Choice', color: 'bg-warning/10 text-warning' },
  select: { label: 'Dropdown', color: 'bg-warning/10 text-warning' },
  signature: { label: 'Signature', color: 'bg-destructive/10 text-destructive' },
  rating: { label: 'Rating', color: 'bg-warning/10 text-warning' },
};

export function FormPreviewCard({ formData, onCreateForm, isCreating }: FormPreviewCardProps) {
  // Count field types
  const fieldTypeCounts = formData.fields.reduce((acc, field) => {
    acc[field.type] = (acc[field.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="ml-0 max-w-[85%] p-4 bg-gradient-to-br from-primary/5 to-accent/5 border border-primary/20 rounded-xl shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h4 className="font-semibold text-foreground text-sm">
              Ready to create your form
            </h4>
            <p className="text-xs text-muted-foreground">
              Review and click Create to add this form
            </p>
          </div>
        </div>
      </div>

      {/* Form preview */}
      <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/50 p-3 mb-3">
        <div className="flex items-center gap-2 mb-2">
          <FileText className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm text-foreground">
            {formData.name_en}
          </span>
          <span className="ml-auto text-xs px-2 py-0.5 bg-muted rounded-full text-muted-foreground">
            {formData.fields.length} fields
          </span>
        </div>
        
        {formData.description_en && (
          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
            {formData.description_en}
          </p>
        )}

        {/* Field type summary */}
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(fieldTypeCounts).slice(0, 8).map(([type, count]) => {
            const config = fieldTypeConfig[type] || { label: type, color: 'bg-muted text-muted-foreground' };
            return (
              <span 
                key={type}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${config.color}`}
              >
                {config.label} {count > 1 && `×${count}`}
              </span>
            );
          })}
          {Object.keys(fieldTypeCounts).length > 8 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
              +{Object.keys(fieldTypeCounts).length - 8} more
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-muted-foreground">
          Form will be saved as draft
        </p>
        <Button
          size="sm"
          onClick={onCreateForm}
          disabled={isCreating}
          className="gap-1.5 bg-primary hover:bg-primary/90"
        >
          {isCreating ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              <CheckCircle2 className="h-3.5 w-3.5" />
              Create Form
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
