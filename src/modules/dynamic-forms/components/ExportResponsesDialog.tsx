// Export Responses Dialog - Export form responses to other entities
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Users,
  Package,
  Settings,
  ArrowRight,
  Wand2,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Sparkles,
  Brain,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DynamicForm, DynamicFormResponse, FormField } from '../types';
import {
  ExportEntityType,
  ExportFieldMapping,
  ExportTransform,
  EXPORT_ENTITY_LABELS,
  TRANSFORM_LABELS,
  getEntityFields,
  EntityFieldDefinition,
} from '../types/exportTypes';
import { formExportService } from '../services/formExportService';
import { toast } from 'sonner';

interface ExportResponsesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: DynamicForm;
  responses: DynamicFormResponse[];
  onExportComplete?: () => void;
}

export function ExportResponsesDialog({
  open,
  onOpenChange,
  form,
  responses,
  onExportComplete,
}: ExportResponsesDialogProps) {
  const { t, i18n } = useTranslation('dynamic-forms');
  const isEnglish = i18n.language === 'en';
  
  // State
  const [step, setStep] = useState<'select' | 'map' | 'confirm' | 'result'>('select');
  const [entityType, setEntityType] = useState<ExportEntityType | null>(null);
  const [selectedResponses, setSelectedResponses] = useState<number[]>([]);
  const [mappings, setMappings] = useState<ExportFieldMapping[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isAiSuggesting, setIsAiSuggesting] = useState(false);
  const [aiConfidences, setAiConfidences] = useState<Record<string, { confidence: number; reason: string }>>({});
  const [exportResults, setExportResults] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);
  
  // Get input fields only (exclude section, page_break, content)
  const inputFields = useMemo(() => 
    form.fields.filter(f => !['section', 'page_break', 'content'].includes(f.type)),
    [form.fields]
  );
  
  // Entity fields based on selected type
  const entityFields = useMemo(() => 
    entityType ? getEntityFields(entityType) : [],
    [entityType]
  );
  
  // AI-powered auto-suggest using edge function
  const handleAiAutoSuggest = async () => {
    if (!entityType) return;
    
    setIsAiSuggesting(true);
    try {
      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      
      if (!SUPABASE_URL) {
        // Fall back to basic suggestions
        const suggestions = formExportService.suggestMappings(form.fields, entityType, isEnglish ? 'en' : 'fr');
        setMappings(suggestions);
        toast.success(isEnglish ? 'Mappings suggested (basic mode)' : 'Mappages suggérés (mode basique)');
        return;
      }
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1/ai-field-mapping`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          form_fields: inputFields.map(f => ({
            id: f.id,
            type: f.type,
            label_en: f.label_en,
            label_fr: f.label_fr,
            description_en: f.description_en,
            description_fr: f.description_fr,
          })),
          entity_type: entityType,
          entity_fields: entityFields.map(f => ({
            field: f.field,
            label_en: f.label_en,
            label_fr: f.label_fr,
            required: f.required,
            type: f.type,
          })),
          language: isEnglish ? 'en' : 'fr',
        }),
      });
      
      if (!response.ok) {
        throw new Error('AI mapping failed');
      }
      
      const data = await response.json();
      
      if (data.mappings && data.mappings.length > 0) {
        // Convert AI mappings to our format
        const aiMappings: ExportFieldMapping[] = data.mappings.map((m: any) => ({
          form_field_id: m.form_field_id,
          entity_field: m.entity_field,
          transform: 'none' as ExportTransform,
        }));
        
        // Store confidence scores for display
        const confidences: Record<string, { confidence: number; reason: string }> = {};
        data.mappings.forEach((m: any) => {
          confidences[m.form_field_id] = {
            confidence: m.confidence || 0.8,
            reason: m.reason || '',
          };
        });
        
        setMappings(aiMappings);
        setAiConfidences(confidences);
        
        toast.success(
          isEnglish 
            ? `AI suggested ${data.mapped_count} intelligent mappings` 
            : `L'IA a suggéré ${data.mapped_count} mappages intelligents`,
          { icon: <Brain className="h-4 w-4" /> }
        );
      } else {
        // Fall back to basic suggestions
        const suggestions = formExportService.suggestMappings(form.fields, entityType, isEnglish ? 'en' : 'fr');
        setMappings(suggestions);
        toast.info(isEnglish ? 'Using basic suggestions' : 'Utilisation des suggestions basiques');
      }
    } catch (error) {
      console.error('AI auto-suggest error:', error);
      // Fall back to basic suggestions
      const suggestions = formExportService.suggestMappings(form.fields, entityType, isEnglish ? 'en' : 'fr');
      setMappings(suggestions);
      toast.info(isEnglish ? 'Using basic suggestions' : 'Utilisation des suggestions basiques');
    } finally {
      setIsAiSuggesting(false);
    }
  };
  
  // Handle entity type selection
  const handleEntityTypeSelect = (type: ExportEntityType) => {
    setEntityType(type);
    // Clear previous AI confidences
    setAiConfidences({});
    // Auto-suggest using basic mode initially (user can click AI button for intelligent suggestions)
    const suggestions = formExportService.suggestMappings(form.fields, type, isEnglish ? 'en' : 'fr');
    setMappings(suggestions);
    setStep('map');
  };
  
  // Handle mapping change
  const handleMappingChange = (
    formFieldId: string,
    entityField: string | null,
    transform: ExportTransform = 'none'
  ) => {
    setMappings(prev => {
      // Remove existing mapping for this form field
      const filtered = prev.filter(m => m.form_field_id !== formFieldId);
      
      // Add new mapping if entity field is selected
      if (entityField) {
        filtered.push({
          form_field_id: formFieldId,
          entity_field: entityField,
          transform,
        });
      }
      
      return filtered;
    });
  };
  
  // Handle select all responses
  const handleSelectAllResponses = (checked: boolean) => {
    if (checked) {
      setSelectedResponses(responses.map(r => r.id));
    } else {
      setSelectedResponses([]);
    }
  };
  
  // Handle toggle response selection
  const handleToggleResponse = (responseId: number) => {
    setSelectedResponses(prev =>
      prev.includes(responseId)
        ? prev.filter(id => id !== responseId)
        : [...prev, responseId]
    );
  };
  
  // Validate and proceed to confirm
  const handleProceedToConfirm = () => {
    if (!entityType) return;
    
    const validation = formExportService.validateMappings(mappings, entityType, form.fields);
    
    if (!validation.valid) {
      toast.error(isEnglish ? 'Invalid mappings' : 'Mappages invalides', {
        description: validation.errors[0],
      });
      return;
    }
    
    // Default to all responses if none selected
    if (selectedResponses.length === 0) {
      setSelectedResponses(responses.map(r => r.id));
    }
    
    setStep('confirm');
  };
  
  // Execute export
  const handleExport = async () => {
    if (!entityType || selectedResponses.length === 0) return;
    
    setIsExporting(true);
    
    try {
      const responsesToExport = responses.filter(r => selectedResponses.includes(r.id));
      const result = await formExportService.exportResponses(
        responsesToExport,
        entityType,
        mappings
      );
      
      setExportResults({
        total: result.total,
        successful: result.successful,
        failed: result.failed,
      });
      
      setStep('result');
      
      if (result.successful > 0) {
        toast.success(
          isEnglish
            ? `${result.successful} ${EXPORT_ENTITY_LABELS[entityType].en}(s) created`
            : `${result.successful} ${EXPORT_ENTITY_LABELS[entityType].fr}(s) créé(s)`
        );
      }
    } catch (error: any) {
      toast.error(isEnglish ? 'Export failed' : 'Échec de l\'export', {
        description: error.message,
      });
    } finally {
      setIsExporting(false);
    }
  };
  
  // Reset and close
  const handleClose = () => {
    setStep('select');
    setEntityType(null);
    setSelectedResponses([]);
    setMappings([]);
    setExportResults(null);
    onOpenChange(false);
    if (exportResults && exportResults.successful > 0) {
      onExportComplete?.();
    }
  };
  
  // Get icon for entity type
  const getEntityIcon = (type: ExportEntityType) => {
    switch (type) {
      case 'contact':
        return <Users className="h-5 w-5" />;
      case 'article':
        return <Package className="h-5 w-5" />;
      case 'installation':
        return <Settings className="h-5 w-5" />;
    }
  };
  
  // Get field label
  const getFieldLabel = (field: FormField) => 
    isEnglish ? field.label_en : field.label_fr;
  
  // Get entity field label
  const getEntityFieldLabel = (fieldDef: EntityFieldDefinition) =>
    isEnglish ? fieldDef.label_en : fieldDef.label_fr;
  
  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {t('export.title', 'Export Responses to Entity')}
          </DialogTitle>
          <DialogDescription>
            {step === 'select' && t('export.select_type_desc', 'Choose the type of entity to create from form responses')}
            {step === 'map' && t('export.map_desc', 'Map form fields to entity fields')}
            {step === 'confirm' && t('export.confirm_desc', 'Review and confirm the export')}
            {step === 'result' && t('export.result_desc', 'Export completed')}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {/* Step 1: Select Entity Type */}
          {step === 'select' && (
            <div className="grid grid-cols-3 gap-4 p-4">
              {(['contact', 'article', 'installation'] as ExportEntityType[]).map((type) => (
                <button
                  key={type}
                  onClick={() => handleEntityTypeSelect(type)}
                  className={cn(
                    "flex flex-col items-center gap-3 p-6 rounded-xl border-2 transition-all",
                    "hover:border-primary hover:bg-primary/5",
                    entityType === type 
                      ? "border-primary bg-primary/10" 
                      : "border-border"
                  )}
                >
                  <div className="p-3 rounded-full bg-primary/10 text-primary">
                    {getEntityIcon(type)}
                  </div>
                  <span className="font-medium">
                    {isEnglish ? EXPORT_ENTITY_LABELS[type].en : EXPORT_ENTITY_LABELS[type].fr}
                  </span>
                </button>
              ))}
            </div>
          )}
          
          {/* Step 2: Field Mapping */}
          {step === 'map' && entityType && (
            <div className="space-y-4 p-4">
              {/* Auto-suggest buttons */}
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">
                  {t('export.map_fields_instruction', 'Map each form field to the corresponding entity field')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const suggestions = formExportService.suggestMappings(form.fields, entityType, isEnglish ? 'en' : 'fr');
                      setMappings(suggestions);
                      setAiConfidences({});
                      toast.success(isEnglish ? 'Basic mappings suggested' : 'Mappages basiques suggérés');
                    }}
                  >
                    <Wand2 className="h-4 w-4 mr-2" />
                    {t('export.basic_suggest', 'Basic')}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAiAutoSuggest}
                    disabled={isAiSuggesting}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
                  >
                    {isAiSuggesting ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Brain className="h-4 w-4 mr-2" />
                    )}
                    {isAiSuggesting 
                      ? t('export.ai_thinking', 'AI Thinking...')
                      : t('export.ai_suggest', 'AI Auto-Suggest')
                    }
                  </Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Mapping table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">{t('export.form_field', 'Form Field')}</TableHead>
                    <TableHead className="w-[10%]"></TableHead>
                    <TableHead className="w-[35%]">{t('export.entity_field', 'Entity Field')}</TableHead>
                    <TableHead className="w-[15%]">{t('export.transform', 'Transform')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inputFields.map((field) => {
                    const mapping = mappings.find(m => m.form_field_id === field.id);
                    const aiInfo = aiConfidences[field.id];
                    
                    return (
                      <TableRow key={field.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <span className="font-medium truncate">
                              {getFieldLabel(field)}
                            </span>
                            {aiInfo && mapping && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Badge 
                                      variant="secondary" 
                                      className={cn(
                                        "text-[10px] h-4 cursor-help",
                                        aiInfo.confidence >= 0.8 ? "bg-success/10 text-success" :
                                        aiInfo.confidence >= 0.5 ? "bg-warning/10 text-warning" :
                                        "bg-destructive/10 text-destructive"
                                      )}
                                    >
                                      <Brain className="h-2.5 w-2.5 mr-0.5" />
                                      {Math.round(aiInfo.confidence * 100)}%
                                    </Badge>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <p className="text-xs">{aiInfo.reason}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping?.entity_field || '__none__'}
                            onValueChange={(value) => 
                              handleMappingChange(field.id, value === '__none__' ? null : value, mapping?.transform)
                            }
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue placeholder={t('export.select_field', 'Select field...')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">
                                <span className="text-muted-foreground">
                                  {t('export.no_mapping', '-- No mapping --')}
                                </span>
                              </SelectItem>
                              {entityFields.map((ef) => (
                                <SelectItem key={ef.field} value={ef.field}>
                                  <div className="flex items-center gap-2">
                                    <span>{getEntityFieldLabel(ef)}</span>
                                    {ef.required && (
                                      <Badge variant="destructive" className="text-[10px] h-4">
                                        {t('common.required', 'Required')}
                                      </Badge>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={mapping?.transform || 'none'}
                            onValueChange={(value) => 
                              handleMappingChange(field.id, mapping?.entity_field || null, value as ExportTransform)
                            }
                            disabled={!mapping}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(TRANSFORM_LABELS) as ExportTransform[]).map((t) => (
                                <SelectItem key={t} value={t}>
                                  {isEnglish ? TRANSFORM_LABELS[t].en : TRANSFORM_LABELS[t].fr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              
              {/* Mapping summary */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {mappings.length > 0
                    ? isEnglish
                      ? `${mappings.length} field(s) mapped`
                      : `${mappings.length} champ(s) mappé(s)`
                    : isEnglish
                      ? 'No fields mapped yet. Map at least the required fields.'
                      : 'Aucun champ mappé. Mappez au moins les champs requis.'
                  }
                </AlertDescription>
              </Alert>
            </div>
          )}
          
          {/* Step 3: Confirm */}
          {step === 'confirm' && entityType && (
            <div className="space-y-4 p-4">
              {/* Response selection */}
              <div className="space-y-2">
                <Label>{t('export.select_responses', 'Select Responses to Export')}</Label>
                <div className="flex items-center gap-2 mb-2">
                  <Checkbox
                    id="select-all"
                    checked={selectedResponses.length === responses.length}
                    onCheckedChange={handleSelectAllResponses}
                  />
                  <label htmlFor="select-all" className="text-sm cursor-pointer">
                    {t('export.select_all', 'Select All')} ({responses.length})
                  </label>
                </div>
                
                <div className="border rounded-lg max-h-[200px] overflow-y-auto">
                  {responses.map((response, index) => (
                    <div
                      key={response.id}
                      className={cn(
                        "flex items-center gap-3 p-3 border-b last:border-b-0",
                        selectedResponses.includes(response.id) && "bg-primary/5"
                      )}
                    >
                      <Checkbox
                        checked={selectedResponses.includes(response.id)}
                        onCheckedChange={() => handleToggleResponse(response.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {t('export.response', 'Response')} #{index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {response.submitter_name || response.submitted_by} • {new Date(response.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Export summary */}
              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <h4 className="font-medium">{t('export.summary', 'Export Summary')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">{t('export.entity_type', 'Entity Type')}:</span>
                    <span className="ml-2 font-medium">
                      {isEnglish ? EXPORT_ENTITY_LABELS[entityType].en : EXPORT_ENTITY_LABELS[entityType].fr}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('export.responses_selected', 'Responses')}:</span>
                    <span className="ml-2 font-medium">{selectedResponses.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('export.fields_mapped', 'Fields Mapped')}:</span>
                    <span className="ml-2 font-medium">{mappings.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">{t('export.entities_created', 'To Create')}:</span>
                    <span className="ml-2 font-medium">{selectedResponses.length}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Step 4: Results */}
          {step === 'result' && exportResults && (
            <div className="space-y-4 p-4">
              <div className="flex flex-col items-center justify-center py-8">
                {exportResults.successful > 0 ? (
                  <CheckCircle2 className="h-16 w-16 text-success mb-4" />
                ) : (
                  <XCircle className="h-16 w-16 text-destructive mb-4" />
                )}
                
                <h3 className="text-xl font-semibold mb-2">
                  {isEnglish ? 'Export Complete' : 'Export Terminé'}
                </h3>
                
                <div className="flex gap-6 text-center">
                  <div>
                    <p className="text-2xl font-bold text-success">{exportResults.successful}</p>
                    <p className="text-sm text-muted-foreground">
                      {isEnglish ? 'Successful' : 'Réussi'}
                    </p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-destructive">{exportResults.failed}</p>
                    <p className="text-sm text-muted-foreground">
                      {isEnglish ? 'Failed' : 'Échoué'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          {step === 'select' && (
            <Button variant="outline" onClick={handleClose}>
              {t('common.cancel', 'Cancel')}
            </Button>
          )}
          
          {step === 'map' && (
            <>
              <Button variant="outline" onClick={() => setStep('select')}>
                {t('common.back', 'Back')}
              </Button>
              <Button onClick={handleProceedToConfirm} disabled={mappings.length === 0}>
                {t('common.continue', 'Continue')}
              </Button>
            </>
          )}
          
          {step === 'confirm' && (
            <>
              <Button variant="outline" onClick={() => setStep('map')}>
                {t('common.back', 'Back')}
              </Button>
              <Button 
                onClick={handleExport} 
                disabled={isExporting || selectedResponses.length === 0}
              >
                {isExporting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {t('export.export_button', 'Export')} ({selectedResponses.length})
              </Button>
            </>
          )}
          
          {step === 'result' && (
            <Button onClick={handleClose}>
              {t('common.close', 'Close')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
