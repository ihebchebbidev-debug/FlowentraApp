import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  FileText,
  Plus,
  Download,
  Eye,
  MoreHorizontal,
  Loader2,
  CheckCircle2,
  ClipboardList,
  Star,
  Edit3,
  Clock,
  Trash2,
  Save,
  ChevronLeft,
} from 'lucide-react';
import { toast } from 'sonner';
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import type { DynamicForm, DynamicFormResponse, FormField } from '@/modules/dynamic-forms/types';

interface TaskDynamicFormsProps {
  taskId: string;
  taskType: 'project' | 'daily';
  taskTitle: string;
  onFormsUpdated?: () => void;
}

interface AttachedForm {
  form: DynamicForm;
  response?: DynamicFormResponse;
  draftValues?: Record<string, any>;
  status: 'draft' | 'completed';
}

// Local storage key for drafts
const getDraftKey = (taskId: string, formId: number) => `form_draft_${taskId}_${formId}`;

// Inline Field Renderer for form filling
interface InlineFieldRendererProps {
  field: FormField;
  value: any;
  onChange: (value: any) => void;
  language: 'en' | 'fr';
}

function InlineFieldRenderer({ field, value, onChange, language }: InlineFieldRendererProps) {
  const isEnglish = language === 'en';
  const label = isEnglish ? field.label_en : field.label_fr;
  const description = isEnglish ? field.description_en : field.description_fr;
  const placeholder = isEnglish ? field.placeholder_en : field.placeholder_fr;

  // Section header
  if (field.type === 'section') {
    return (
      <div className="pt-2">
        <h4 className="text-sm font-semibold text-foreground border-b pb-1">{label}</h4>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    );
  }

  // Content block
  if (field.type === 'content') {
    return (
      <div className="p-3 rounded-md bg-muted/30 border border-border/50">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
    );
  }

  // Text / Email / Phone
  if (field.type === 'text' || field.type === 'email' || field.type === 'phone') {
    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
          placeholder={placeholder}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Number
  if (field.type === 'number') {
    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          type="number"
          placeholder={placeholder}
          min={field.min}
          max={field.max}
          value={value || ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Textarea
  if (field.type === 'textarea') {
    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Textarea
          placeholder={placeholder}
          rows={3}
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Checkbox (with options)
  if (field.type === 'checkbox') {
    const options = field.options || [];
    if (options.length === 0) {
      return (
        <div className="flex items-center gap-2">
          <Checkbox
            checked={!!value}
            onCheckedChange={(checked) => onChange(checked)}
          />
          <Label className="cursor-pointer">
            {label}
            {field.required && <span className="text-destructive ml-1">*</span>}
          </Label>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="space-y-1.5">
          {options.map((opt) => {
            const checkedValues = Array.isArray(value) ? value : [];
            const isChecked = checkedValues.includes(opt.value);
            return (
              <div key={opt.id} className="flex items-center gap-2">
                <Checkbox
                  checked={isChecked}
                  onCheckedChange={(checked) => {
                    const updated = checked
                      ? [...checkedValues, opt.value]
                      : checkedValues.filter((v: string) => v !== opt.value);
                    onChange(updated);
                  }}
                />
                <span className="text-sm">{isEnglish ? opt.label_en : opt.label_fr}</span>
              </div>
            );
          })}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Radio
  if (field.type === 'radio') {
    const options = field.options || [];
    return (
      <div className="space-y-2">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <RadioGroup value={value || ''} onValueChange={onChange}>
          {options.map((opt) => (
            <div key={opt.id} className="flex items-center gap-2">
              <RadioGroupItem value={opt.value} id={`${field.id}-${opt.id}`} />
              <label htmlFor={`${field.id}-${opt.id}`} className="text-sm cursor-pointer">
                {isEnglish ? opt.label_en : opt.label_fr}
              </label>
            </div>
          ))}
        </RadioGroup>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Select
  if (field.type === 'select') {
    const options = field.options || [];
    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={placeholder || (isEnglish ? 'Select...' : 'Sélectionner...')} />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.value}>
                {isEnglish ? opt.label_en : opt.label_fr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Date
  if (field.type === 'date') {
    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <Input
          type="date"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
        />
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Rating
  if (field.type === 'rating') {
    const maxStars = field.maxStars || 5;
    const currentRating = typeof value === 'number' ? value : 0;
    return (
      <div className="space-y-1.5">
        <Label>
          {label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>
        <div className="flex gap-1">
          {Array.from({ length: maxStars }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className="p-0.5 hover:scale-110 transition-transform"
            >
              <Star
                className={`h-5 w-5 ${i < currentRating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`}
              />
            </button>
          ))}
        </div>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
    );
  }

  // Fallback
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input
        placeholder={placeholder}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function TaskDynamicForms({
  taskId,
  taskType,
  taskTitle,
  onFormsUpdated,
}: TaskDynamicFormsProps) {
  const { t, i18n } = useTranslation('tasks');
  const lang = i18n.language === 'fr' ? 'fr' : 'en';

  const [availableForms, setAvailableForms] = useState<DynamicForm[]>([]);
  const [attachedForms, setAttachedForms] = useState<AttachedForm[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [showMainDialog, setShowMainDialog] = useState(false);
  const [dialogStep, setDialogStep] = useState<'select' | 'fill' | 'view'>('select');
  const [selectedForm, setSelectedForm] = useState<DynamicForm | null>(null);
  const [selectedResponse, setSelectedResponse] = useState<DynamicFormResponse | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Form filling state
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  const entityType = taskType === 'project' ? 'project_task' : 'daily_task';

  // Calculate form completion progress
  const calculateProgress = (form: DynamicForm, values: Record<string, any>): number => {
    const fillableFields = form.fields.filter(
      f => f.type !== 'section' && f.type !== 'page_break' && f.type !== 'content'
    );
    if (fillableFields.length === 0) return 100;

    const filledCount = fillableFields.filter(f => {
      const value = values[f.id];
      if (value === undefined || value === null || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    }).length;

    return Math.round((filledCount / fillableFields.length) * 100);
  };

  // Load available forms and responses for this task
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get all released forms
      const forms = await dynamicFormsService.getAll({ status: 'released' });
      setAvailableForms(forms);

      // Get responses linked to this task
      const attached: AttachedForm[] = [];
      for (const form of forms) {
        try {
          const responses = await dynamicFormsService.getResponses(form.id);
          const taskResponse = responses.find(
            (r) => r.entity_type === entityType && r.entity_id === taskId
          );
          if (taskResponse) {
            attached.push({ form, response: taskResponse, status: 'completed' });
          } else {
            // Check for local drafts
            const draftKey = getDraftKey(taskId, form.id);
            const savedDraft = localStorage.getItem(draftKey);
            if (savedDraft) {
              try {
                const draftValues = JSON.parse(savedDraft);
                attached.push({ form, draftValues, status: 'draft' });
              } catch {
                // Invalid draft, ignore
              }
            }
          }
        } catch {
          // Ignore errors for individual form responses
        }
      }
      setAttachedForms(attached);
    } catch (error) {
      console.error('Failed to load forms:', error);
    } finally {
      setIsLoading(false);
    }
  }, [taskId, entityType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenSelectDialog = () => {
    setDialogStep('select');
    setSelectedForm(null);
    setFormValues({});
    setIsEditing(false);
    setShowMainDialog(true);
  };

  const handleSelectForm = (form: DynamicForm) => {
    setSelectedForm(form);

    // Check if there's a draft for this form
    const draftKey = getDraftKey(taskId, form.id);
    const savedDraft = localStorage.getItem(draftKey);
    if (savedDraft) {
      try {
        setFormValues(JSON.parse(savedDraft));
      } catch {
        setFormValues({});
      }
    } else {
      setFormValues({});
    }

    setDialogStep('fill');
  };

  const handleEditDraft = (attached: AttachedForm) => {
    setSelectedForm(attached.form);
    setFormValues(attached.draftValues || {});
    setIsEditing(true);
    setDialogStep('fill');
    setShowMainDialog(true);
  };

  const handleEditCompleted = (attached: AttachedForm) => {
    setSelectedForm(attached.form);
    setSelectedResponse(attached.response || null);
    setFormValues(attached.response?.responses || {});
    setIsEditing(true);
    setDialogStep('fill');
    setShowMainDialog(true);
  };

  const handleViewResponse = (attached: AttachedForm) => {
    setSelectedForm(attached.form);
    setSelectedResponse(attached.response || null);
    setDialogStep('view');
    setShowMainDialog(true);
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSaveDraft = async () => {
    if (!selectedForm) return;

    setIsSavingDraft(true);
    try {
      const draftKey = getDraftKey(taskId, selectedForm.id);
      localStorage.setItem(draftKey, JSON.stringify(formValues));

      toast.success(t('dynamicForms.draftSaved', 'Created saved'));
      setShowMainDialog(false);
      loadData();
      onFormsUpdated?.();
    } catch (error) {
      console.error('Failed to save draft:', error);
      toast.error(t('dynamicForms.draftSaveError', 'Failed to save draft'));
    } finally {
      setIsSavingDraft(false);
    }
  };

  const handleSubmitForm = async () => {
    if (!selectedForm) return;

    // Validate required fields
    const missingRequired = selectedForm.fields
      .filter((f) => f.required && !formValues[f.id] && f.type !== 'section' && f.type !== 'page_break' && f.type !== 'content')
      .map((f) => (lang === 'fr' ? f.label_fr : f.label_en));

    if (missingRequired.length > 0) {
      toast.error(t('dynamicForms.requiredFieldsMissing', 'Please fill in all required fields'));
      return;
    }

    setIsSubmitting(true);
    try {
      await dynamicFormsService.submitResponse({
        form_id: selectedForm.id,
        entity_type: entityType,
        entity_id: taskId,
        responses: formValues,
      });

      // Clear draft on successful submit
      const draftKey = getDraftKey(taskId, selectedForm.id);
      localStorage.removeItem(draftKey);

      toast.success(t('dynamicForms.formSubmitted', 'Form submitted successfully'));
      setShowMainDialog(false);
      setSelectedForm(null);
      setFormValues({});
      loadData();
      onFormsUpdated?.();
    } catch (error) {
      console.error('Failed to submit form:', error);
      toast.error(t('dynamicForms.submitError', 'Failed to submit form'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteDraft = (attached: AttachedForm) => {
    const draftKey = getDraftKey(taskId, attached.form.id);
    localStorage.removeItem(draftKey);
    toast.success(t('dynamicForms.draftDeleted', 'Created deleted'));
    loadData();
  };

  const handleDownloadPdf = async (attached: AttachedForm) => {
    const form = attached.form;
    const response = attached.response;
    if (!form || !response) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error(t('dynamicForms.popupBlocked', 'Please allow popups to download'));
      return;
    }

    const formName = lang === 'fr' ? form.name_fr : form.name_en;
    const submittedDate = new Date(response.submitted_at).toLocaleDateString(
      lang === 'fr' ? 'fr-FR' : 'en-US'
    );

    let fieldsHtml = '';
    for (const field of form.fields) {
      if (field.type === 'section' || field.type === 'page_break' || field.type === 'content') continue;
      const label = lang === 'fr' ? field.label_fr : field.label_en;
      let value = response.responses[field.id];

      if (value === undefined || value === null) {
        value = '-';
      } else if (typeof value === 'boolean') {
        value = value ? '✓' : '✗';
      } else if (Array.isArray(value)) {
        value = value.join(', ');
      }

      fieldsHtml += `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee; font-weight: 500; width: 40%;">${label}</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #eee;">${value}</td>
        </tr>
      `;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${formName} - ${taskTitle}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; margin-bottom: 8px; }
          .meta { color: #666; font-size: 14px; margin-bottom: 24px; }
          table { width: 100%; border-collapse: collapse; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>${formName}</h1>
        <p class="meta">${t('dynamicForms.task', 'Task')}: ${taskTitle} | ${t('dynamicForms.submitted', 'Submitted')}: ${submittedDate}</p>
        <table>
          ${fieldsHtml}
        </table>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleBackToSelect = () => {
    setDialogStep('select');
    setSelectedForm(null);
    setFormValues({});
    setIsEditing(false);
  };

  // Forms not yet attached (no response or draft)
  const unattachedForms = availableForms.filter(
    (f) => !attachedForms.some((a) => a.form.id === f.id)
  );

  // Separate drafts and completed
  const draftForms = attachedForms.filter(a => a.status === 'draft');
  const completedForms = attachedForms.filter(a => a.status === 'completed');

  if (isLoading) {
    return (
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
            {t('dynamicForms.title', 'Forms')}
          </h3>
        </div>
        <div className="space-y-3 py-3 animate-pulse">
          <div className="h-10 w-full bg-muted/60 rounded" />
          <div className="h-10 w-3/4 bg-muted/60 rounded" />
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <ClipboardList className="h-4 w-4 text-muted-foreground" />
          {t('dynamicForms.title', 'Forms')}
          {attachedForms.length > 0 && (
            <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
              {attachedForms.length}
            </Badge>
          )}
        </h3>
        {availableForms.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSelectDialog}
          >
            <Plus className="h-4 w-4 mr-1" />
            {t('dynamicForms.attachForm', 'Attach Form')}
          </Button>
        )}
      </div>

      {/* Created Forms */}
      {draftForms.length > 0 && (
        <div className="space-y-2">
          {draftForms.map((attached) => {
            const progress = calculateProgress(attached.form, attached.draftValues || {});
            return (
              <Card key={attached.form.id} className="border-warning/30 bg-warning/5">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <FileText className="h-4 w-4 text-warning shrink-0" />
                      <span className="text-sm font-medium truncate">
                        {lang === 'fr' ? attached.form.name_fr : attached.form.name_en}
                      </span>
                      <Badge variant="outline" className="text-[10px] border-warning/50 text-warning bg-warning/10">
                        <Clock className="h-3 w-3 mr-1" />
                        {t('dynamicForms.draft', 'Created')}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-7 w-7">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditDraft(attached)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          {t('dynamicForms.continueFilling', 'Continue Filling')}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleDeleteDraft(attached)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          {t('dynamicForms.deleteDraft', 'Delete Created')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{t('dynamicForms.progress', 'Progress')}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1.5" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Completed Forms */}
      {completedForms.length > 0 && (
        <div className="space-y-2">
          {completedForms.map((attached) => (
            <Card key={attached.form.id} className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {lang === 'fr' ? attached.form.name_fr : attached.form.name_en}
                    </span>
                    <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      {t('dynamicForms.completed', 'Completed')}
                    </Badge>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleViewResponse(attached)}>
                        <Eye className="h-4 w-4 mr-2" />
                        {t('dynamicForms.viewResponse', 'View Response')}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEditCompleted(attached)}>
                        <Edit3 className="h-4 w-4 mr-2" />
                        {t('dynamicForms.editResponse', 'Edit Response')}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDownloadPdf(attached)}>
                        <Download className="h-4 w-4 mr-2" />
                        {t('dynamicForms.download', 'Download PDF')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                {attached.response && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('dynamicForms.submittedOn', 'Submitted on')}{' '}
                    {new Date(attached.response.submitted_at).toLocaleDateString(
                      lang === 'fr' ? 'fr-FR' : 'en-US'
                    )}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {attachedForms.length === 0 && (
        <div className="text-center py-6 text-muted-foreground bg-muted/30 rounded-md">
          <ClipboardList className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">{t('dynamicForms.noForms', 'No forms attached')}</p>
          <p className="text-xs">{t('dynamicForms.attachHint', 'Attach a form to collect structured data')}</p>
        </div>
      )}

      {/* Main Dialog */}
      <Dialog open={showMainDialog} onOpenChange={setShowMainDialog}>
        <DialogContent className="sm:max-w-[600px] max-h-[85vh] flex flex-col">
          {/* Select Form Step */}
          {dialogStep === 'select' && (
            <>
              <DialogHeader>
                <DialogTitle>{t('dynamicForms.selectForm', 'Select Form')}</DialogTitle>
                <DialogDescription>
                  {t('dynamicForms.selectFormDescription', 'Choose a form to attach to this task')}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className="flex-1 max-h-[50vh]">
                <div className="space-y-2 pr-4">
                  {/* Show all forms - user can start fresh on any */}
                  {availableForms.map((form) => {
                    const existingAttached = attachedForms.find(a => a.form.id === form.id);
                    const isDraft = existingAttached?.status === 'draft';
                    const isCompleted = existingAttached?.status === 'completed';

                    return (
                      <Card
                        key={form.id}
                        className={`cursor-pointer transition-colors ${isCompleted
                            ? 'hover:bg-accent/30 border-primary/20'
                            : isDraft
                              ? 'hover:bg-amber-50 border-amber-300/50'
                              : 'hover:bg-accent/50'
                          }`}
                        onClick={() => {
                          if (isDraft && existingAttached) {
                            handleEditDraft(existingAttached);
                          } else if (isCompleted && existingAttached) {
                            handleViewResponse(existingAttached);
                          } else {
                            handleSelectForm(form);
                          }
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-sm">
                                  {lang === 'fr' ? form.name_fr : form.name_en}
                                </p>
                                {isDraft && (
                                  <Badge variant="outline" className="text-[10px] border-warning/50 text-warning">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {t('dynamicForms.draft', 'Created')}
                                  </Badge>
                                )}
                                {isCompleted && (
                                  <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    {t('dynamicForms.completed', 'Completed')}
                                  </Badge>
                                )}
                              </div>
                              {(form.description_en || form.description_fr) && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {lang === 'fr' ? form.description_fr : form.description_en}
                                </p>
                              )}
                            </div>
                            <Badge variant="outline" className="text-[10px] shrink-0 ml-2">
                              {form.fields.length} {t('dynamicForms.fields', 'fields')}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  {availableForms.length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      {t('dynamicForms.noReleasedForms', 'No released forms available')}
                    </p>
                  )}
                </div>
              </ScrollArea>
            </>
          )}

          {/* Fill Form Step */}
          {dialogStep === 'fill' && selectedForm && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-2"
                    onClick={handleBackToSelect}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <DialogTitle>
                      {lang === 'fr' ? selectedForm.name_fr : selectedForm.name_en}
                    </DialogTitle>
                    <DialogDescription className="mt-1">
                      {selectedForm.description_en || selectedForm.description_fr ||
                        t('dynamicForms.fillFormDescription', 'Fill out the form below. You can save as draft and continue later.')}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              {/* Progress indicator */}
              <div className="space-y-1 px-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('dynamicForms.progress', 'Progress')}</span>
                  <span>{calculateProgress(selectedForm, formValues)}%</span>
                </div>
                <Progress value={calculateProgress(selectedForm, formValues)} className="h-1.5" />
              </div>

              <ScrollArea className="flex-1 max-h-[45vh] pr-4">
                <div className="space-y-4 py-2">
                  {selectedForm.fields
                    .filter((f) => f.type !== 'page_break')
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <InlineFieldRenderer
                        key={field.id}
                        field={field}
                        value={formValues[field.id]}
                        onChange={(value) => handleFieldChange(field.id, value)}
                        language={lang}
                      />
                    ))}
                </div>
              </ScrollArea>

              <div className="flex justify-between gap-2 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={isSavingDraft || isSubmitting}
                >
                  {isSavingDraft ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {t('dynamicForms.saveDraft', 'Save Created')}
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowMainDialog(false)}>
                    {t('common.cancel', 'Cancel')}
                  </Button>
                  <Button onClick={handleSubmitForm} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    {t('dynamicForms.submit', 'Submit')}
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* View Response Step */}
          {dialogStep === 'view' && selectedForm && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -ml-2"
                    onClick={handleBackToSelect}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <DialogTitle>
                      {lang === 'fr' ? selectedForm.name_fr : selectedForm.name_en}
                    </DialogTitle>
                    <DialogDescription>
                      {selectedResponse && (
                        <>
                          {t('dynamicForms.submittedOn', 'Submitted on')}{' '}
                          {new Date(selectedResponse.submitted_at).toLocaleDateString(
                            lang === 'fr' ? 'fr-FR' : 'en-US'
                          )}
                        </>
                      )}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>
              <ScrollArea className="flex-1 max-h-[50vh] pr-4">
                <div className="space-y-3">
                  {selectedForm.fields
                    .filter((f) => f.type !== 'page_break' && f.type !== 'section' && f.type !== 'content')
                    .sort((a, b) => a.order - b.order)
                    .map((field) => {
                      const value = selectedResponse?.responses[field.id];
                      let displayValue = value;

                      if (value === undefined || value === null || value === '') {
                        displayValue = '-';
                      } else if (typeof value === 'boolean') {
                        displayValue = value ? t('common.yes', 'Yes') : t('common.no', 'No');
                      } else if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                      }

                      return (
                        <div key={field.id} className="flex flex-col gap-1 p-2 rounded-md bg-muted/30">
                          <span className="text-xs font-medium text-muted-foreground">
                            {lang === 'fr' ? field.label_fr : field.label_en}
                          </span>
                          <span className="text-sm">{String(displayValue)}</span>
                        </div>
                      );
                    })}
                </div>
              </ScrollArea>
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowMainDialog(false)}>
                  {t('common.close', 'Close')}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    const attached = attachedForms.find(a => a.form.id === selectedForm.id);
                    if (attached) handleEditCompleted(attached);
                  }}
                >
                  <Edit3 className="h-4 w-4 mr-2" />
                  {t('dynamicForms.editResponse', 'Edit Response')}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
