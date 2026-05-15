import { useTranslation } from 'react-i18next';
import { Plus, Trash2, Settings2, AlertCircle, GitBranch, Link, ExternalLink, Database } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormField, FieldOption, FIELD_TYPES, ConditionOperator, FieldWidth, LinkStyle, DynamicDataSource } from '../../types';
import { DynamicDataConfig } from './DynamicDataConfig';

interface FieldPropertiesProps {
  field: FormField | null;
  allFields: FormField[]; // All fields for conditional logic
  onUpdate: (updates: Partial<FormField>) => void;
}

const CONDITION_OPERATORS: { value: ConditionOperator; needsValue: boolean }[] = [
  { value: 'equals', needsValue: true },
  { value: 'not_equals', needsValue: true },
  { value: 'contains', needsValue: true },
  { value: 'not_contains', needsValue: true },
  { value: 'greater_than', needsValue: true },
  { value: 'less_than', needsValue: true },
  { value: 'is_empty', needsValue: false },
  { value: 'is_not_empty', needsValue: false },
];

export function FieldProperties({ field, allFields, onUpdate }: FieldPropertiesProps) {
  const { t } = useTranslation('dynamic-forms');
  
  if (!field) {
    return (
      <div className="p-4 h-full flex flex-col">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-foreground">
            {t('builder.field_properties')}
          </h3>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <Settings2 className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-muted-foreground mb-1">
            {t('builder.no_field_selected')}
          </p>
          <p className="text-xs text-muted-foreground">
            {t('builder.select_field_hint')}
          </p>
        </div>
      </div>
    );
  }
  
  const fieldConfig = FIELD_TYPES.find(f => f.type === field.type);
  const hasOptions = fieldConfig?.hasOptions || false;
  
  // Get available fields for conditional logic (exclude non-input fields)
  const nonInputTypes = ['section', 'signature', 'page_break', 'content'];
  const availableConditionFields = allFields.filter(
    f => f.id !== field.id && !nonInputTypes.includes(f.type)
  );
  
  // Get selected condition field to show its options
  const conditionSourceField = field.condition?.field_id 
    ? allFields.find(f => f.id === field.condition?.field_id)
    : null;
  
  // Check if current operator needs a value
  const currentOperatorConfig = CONDITION_OPERATORS.find(op => op.value === field.condition?.operator);
  const needsConditionValue = currentOperatorConfig?.needsValue ?? true;
  
  const handleAddOption = () => {
    const newOption: FieldOption = {
      id: `opt_${Date.now()}`,
      value: `option_${(field.options?.length || 0) + 1}`,
      label_en: `Option ${(field.options?.length || 0) + 1}`,
      label_fr: `Option ${(field.options?.length || 0) + 1}`,
    };
    onUpdate({ options: [...(field.options || []), newOption] });
  };
  
  const handleUpdateOption = (optionId: string, updates: Partial<FieldOption>) => {
    const updatedOptions = field.options?.map(opt =>
      opt.id === optionId ? { ...opt, ...updates } : opt
    );
    onUpdate({ options: updatedOptions });
  };
  
  const handleRemoveOption = (optionId: string) => {
    onUpdate({ options: field.options?.filter(opt => opt.id !== optionId) });
  };
  
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-foreground">
          {t('builder.field_properties')}
        </h3>
        <p className="text-[11px] text-muted-foreground">
          {t(`field_types.${field.type}`)}
        </p>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-6 pr-2">
          {/* Labels - Bilingual */}
          <div className="space-y-4">
            <Tabs defaultValue="en" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-8">
                <TabsTrigger value="en" className="text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 text-[10px] font-medium mr-1.5">EN</span>
                  {t('languages.english')}
                </TabsTrigger>
                <TabsTrigger value="fr" className="text-xs">
                  <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-medium mr-1.5">FR</span>
                  {t('languages.french')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="en" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="label_en" className="text-xs">{t('field_props.label_en')}</Label>
                  <Input
                    id="label_en"
                    value={field.label_en}
                    onChange={(e) => onUpdate({ label_en: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description_en" className="text-xs">{t('field_props.description_en')}</Label>
                  <Input
                    id="description_en"
                    value={field.description_en || ''}
                    onChange={(e) => onUpdate({ description_en: e.target.value })}
                    className="h-9"
                    placeholder={t('field_props.description_placeholder')}
                  />
                </div>
                {/* Hint field - additional tip */}
                <div className="space-y-1.5">
                  <Label htmlFor="hint_en" className="text-xs">{t('field_props.hint_en')}</Label>
                  <Input
                    id="hint_en"
                    value={field.hint_en || ''}
                    onChange={(e) => onUpdate({ hint_en: e.target.value })}
                    className="h-9"
                    placeholder={t('field_props.hint_placeholder')}
                  />
                  <p className="text-[10px] text-muted-foreground">{t('field_props.hint_desc')}</p>
                </div>
                {field.type !== 'section' && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'content' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="placeholder_en" className="text-xs">{t('field_props.placeholder_en')}</Label>
                    <Input
                      id="placeholder_en"
                      value={field.placeholder_en || ''}
                      onChange={(e) => onUpdate({ placeholder_en: e.target.value })}
                      className="h-9"
                    />
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="fr" className="space-y-3 mt-3">
                <div className="space-y-1.5">
                  <Label htmlFor="label_fr" className="text-xs">{t('field_props.label_fr')}</Label>
                  <Input
                    id="label_fr"
                    value={field.label_fr}
                    onChange={(e) => onUpdate({ label_fr: e.target.value })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description_fr" className="text-xs">{t('field_props.description_fr')}</Label>
                  <Input
                    id="description_fr"
                    value={field.description_fr || ''}
                    onChange={(e) => onUpdate({ description_fr: e.target.value })}
                    className="h-9"
                    placeholder={t('field_props.description_placeholder')}
                  />
                </div>
                {/* Hint field - additional tip */}
                <div className="space-y-1.5">
                  <Label htmlFor="hint_fr" className="text-xs">{t('field_props.hint_fr')}</Label>
                  <Input
                    id="hint_fr"
                    value={field.hint_fr || ''}
                    onChange={(e) => onUpdate({ hint_fr: e.target.value })}
                    className="h-9"
                    placeholder={t('field_props.hint_placeholder')}
                  />
                </div>
                {field.type !== 'section' && field.type !== 'checkbox' && field.type !== 'radio' && field.type !== 'content' && (
                  <div className="space-y-1.5">
                    <Label htmlFor="placeholder_fr" className="text-xs">{t('field_props.placeholder_fr')}</Label>
                    <Input
                      id="placeholder_fr"
                      value={field.placeholder_fr || ''}
                      onChange={(e) => onUpdate({ placeholder_fr: e.target.value })}
                      className="h-9"
                    />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
          
          <Separator />
          
          {/* Link / Button Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Link className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {t('field_props.link_section')}
              </p>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="link_url" className="text-xs">{t('field_props.link_url')}</Label>
              <Input
                id="link_url"
                type="url"
                value={field.link_url || ''}
                onChange={(e) => onUpdate({ link_url: e.target.value })}
                className="h-9"
                placeholder={t('field_props.link_url_placeholder')}
              />
            </div>
            
            {field.link_url && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="link_text_en" className="text-xs">{t('field_props.link_text_en')}</Label>
                    <Input
                      id="link_text_en"
                      value={field.link_text_en || ''}
                      onChange={(e) => onUpdate({ link_text_en: e.target.value })}
                      className="h-9"
                      placeholder={t('field_props.link_text_placeholder')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="link_text_fr" className="text-xs">{t('field_props.link_text_fr')}</Label>
                    <Input
                      id="link_text_fr"
                      value={field.link_text_fr || ''}
                      onChange={(e) => onUpdate({ link_text_fr: e.target.value })}
                      className="h-9"
                      placeholder={t('field_props.link_text_placeholder')}
                    />
                  </div>
                </div>
                
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('field_props.link_style')}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['link', 'button'] as LinkStyle[]).map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => onUpdate({ link_style: style })}
                        className={`
                          p-2 rounded-lg border-2 transition-all text-xs font-medium
                          ${(field.link_style || 'link') === style 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-muted-foreground/50 bg-background'
                          }
                        `}
                      >
                        {t(`field_props.link_style_${style}`)}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <Label htmlFor="link_new_tab" className="text-sm font-medium">{t('field_props.link_new_tab')}</Label>
                      <p className="text-[10px] text-muted-foreground">{t('field_props.link_new_tab_hint')}</p>
                    </div>
                  </div>
                  <Switch
                    id="link_new_tab"
                    checked={field.link_new_tab || false}
                    onCheckedChange={(checked) => onUpdate({ link_new_tab: checked })}
                  />
                </div>
              </>
            )}
          </div>
          
          {/* Validation */}
          <div className="space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {t('builder.validation')}
            </p>
            
            {/* Required toggle */}
            {field.type !== 'section' && field.type !== 'page_break' && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="required" className="text-sm font-medium">{t('field_props.required')}</Label>
                  <p className="text-[10px] text-muted-foreground">{t('field_props.required_hint')}</p>
                </div>
                <Switch
                  id="required"
                  checked={field.required}
                  onCheckedChange={(checked) => onUpdate({ required: checked })}
                />
              </div>
            )}
            
            {/* Field Width selector */}
            {field.type !== 'section' && field.type !== 'page_break' && (
              <div className="space-y-2">
                <Label className="text-xs">{t('field_props.width')}</Label>
                <div className="grid grid-cols-3 gap-2">
                  {(['third', 'half', 'full'] as FieldWidth[]).map((widthOption) => (
                    <button
                      key={widthOption}
                      type="button"
                      onClick={() => onUpdate({ width: widthOption })}
                      className={`
                        relative p-3 rounded-lg border-2 transition-all
                        ${(field.width || 'full') === widthOption 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-muted-foreground/50 bg-background'
                        }
                      `}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <div className="flex gap-0.5 w-full justify-center">
                          {widthOption === 'third' && (
                            <>
                              <div className="h-4 w-3 rounded-sm bg-primary" />
                              <div className="h-4 w-3 rounded-sm bg-muted" />
                              <div className="h-4 w-3 rounded-sm bg-muted" />
                            </>
                          )}
                          {widthOption === 'half' && (
                            <>
                              <div className="h-4 w-5 rounded-sm bg-primary" />
                              <div className="h-4 w-5 rounded-sm bg-muted" />
                            </>
                          )}
                          {widthOption === 'full' && (
                            <div className="h-4 w-full rounded-sm bg-primary" />
                          )}
                        </div>
                        <span className="text-[10px] font-medium">
                          {t(`field_props.width_${widthOption}`)}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground">{t('field_props.width_hint')}</p>
              </div>
            )}
            
            {/* Section collapsible toggle */}
            {field.type === 'section' && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div>
                  <Label htmlFor="collapsible" className="text-sm font-medium">{t('field_props.collapsible')}</Label>
                  <p className="text-[10px] text-muted-foreground">{t('field_props.collapsible_hint')}</p>
                </div>
                <Switch
                  id="collapsible"
                  checked={field.collapsible || false}
                  onCheckedChange={(checked) => onUpdate({ collapsible: checked })}
                />
              </div>
            )}
            
            {/* Validation for text fields */}
            {(field.type === 'text' || field.type === 'textarea') && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="minLength" className="text-xs">{t('field_props.min_length')}</Label>
                  <Input
                    id="minLength"
                    type="number"
                    value={field.minLength || ''}
                    onChange={(e) => onUpdate({ minLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="h-9"
                    min={0}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="maxLength" className="text-xs">{t('field_props.max_length')}</Label>
                  <Input
                    id="maxLength"
                    type="number"
                    value={field.maxLength || ''}
                    onChange={(e) => onUpdate({ maxLength: e.target.value ? parseInt(e.target.value) : undefined })}
                    className="h-9"
                    min={0}
                  />
                </div>
              </div>
            )}
            
            {/* Validation for number fields */}
            {field.type === 'number' && (
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="min" className="text-xs">{t('field_props.min_value')}</Label>
                  <Input
                    id="min"
                    type="number"
                    value={field.min ?? ''}
                    onChange={(e) => onUpdate({ min: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="max" className="text-xs">{t('field_props.max_value')}</Label>
                  <Input
                    id="max"
                    type="number"
                    value={field.max ?? ''}
                    onChange={(e) => onUpdate({ max: e.target.value ? parseFloat(e.target.value) : undefined })}
                    className="h-9"
                  />
                </div>
              </div>
            )}
            
            {/* Max stars for rating field */}
            {field.type === 'rating' && (
              <div className="space-y-1.5">
                <Label htmlFor="maxStars" className="text-xs">{t('field_props.max_stars')}</Label>
                <Input
                  id="maxStars"
                  type="number"
                  min={1}
                  max={10}
                  value={field.maxStars ?? 5}
                  onChange={(e) => onUpdate({ maxStars: e.target.value ? parseInt(e.target.value) : 5 })}
                  className="h-9"
                />
                <p className="text-[10px] text-muted-foreground">{t('field_props.max_stars_hint')}</p>
              </div>
            )}
            
            {/* Email validation info */}
            {field.type === 'email' && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary">
                  {t('field_props.email_validation_hint')}
                </p>
              </div>
            )}
            
            {/* Phone validation info */}
            {field.type === 'phone' && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-xs text-primary">
                  {t('field_props.phone_validation_hint')}
                </p>
              </div>
            )}
            
            {/* Signature info */}
            {field.type === 'signature' && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">
                  {t('field_props.signature_info')}
                </p>
              </div>
            )}
            
            {/* Date field info */}
            {field.type === 'date' && (
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">
                  {t('field_props.date_info')}
                </p>
              </div>
            )}
            
            {/* Page Break specific properties */}
            {field.type === 'page_break' && (
              <div className="space-y-3">
                <div className="p-3 rounded-lg bg-accent/50 border border-accent">
                  <p className="text-xs text-accent-foreground">
                    {t('field_props.page_break_info')}
                  </p>
                </div>
              </div>
            )}
            
            {/* Content block info */}
            {field.type === 'content' && (
              <div className="p-3 rounded-lg bg-secondary/50 border border-secondary">
                <p className="text-xs text-secondary-foreground">
                  {t('field_props.content_block_info')}
                </p>
              </div>
            )}
          </div>
          
          {/* Options for checkbox/radio/select */}
          {hasOptions && (
            <>
              <Separator />
              <div className="space-y-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                  <Database className="h-3 w-3" />
                  {t('field_props.data_options', 'Data & Options')}
                </p>
                
                {/* Dynamic Data Source Configuration */}
                <DynamicDataConfig
                  useDynamicData={field.use_dynamic_data || false}
                  dataSource={field.data_source}
                  dependency={field.dependency}
                  currentFieldId={field.id}
                  allFields={allFields}
                  onToggleDynamic={(enabled) => onUpdate({ use_dynamic_data: enabled })}
                  onUpdateDataSource={(dataSource) => onUpdate({ data_source: dataSource })}
                  onUpdateDependency={(dependency) => onUpdate({ dependency })}
                />
                
                {/* Static Options (only show if not using dynamic data) */}
                {!field.use_dynamic_data && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-muted-foreground">
                        {t('field_props.static_options', 'Static Options')}
                      </p>
                      <Button variant="outline" size="sm" onClick={handleAddOption} className="h-7 text-xs">
                        <Plus className="h-3 w-3 mr-1" />
                        {t('field_props.add_option')}
                      </Button>
                    </div>
                    
                    {(!field.options || field.options.length === 0) && (
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                        <p className="text-xs text-amber-700">{t('field_props.no_options_warning')}</p>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {field.options?.map((option, index) => (
                        <div key={option.id} className="flex items-start gap-2 p-3 rounded-lg border bg-background">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                            <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
                          </div>
                          <div className="flex-1 space-y-2">
                            <Input
                              placeholder={t('field_props.option_label_en')}
                              value={option.label_en}
                              onChange={(e) => handleUpdateOption(option.id, { 
                                label_en: e.target.value, 
                                value: e.target.value.toLowerCase().replace(/\s+/g, '_') 
                              })}
                              className="h-8 text-sm"
                            />
                            <Input
                              placeholder={t('field_props.option_label_fr')}
                              value={option.label_fr}
                              onChange={(e) => handleUpdateOption(option.id, { label_fr: e.target.value })}
                              className="h-8 text-sm"
                            />
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            onClick={() => handleRemoveOption(option.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
          
          {/* Conditional Logic Section */}
          {field.type !== 'section' && (
            <>
              <Separator />
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {t('conditional.title')}
                  </p>
                </div>
                
                {/* Enable condition toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <Label className="text-sm font-medium">{t('conditional.enable')}</Label>
                    <p className="text-[10px] text-muted-foreground">{t('conditional.enable_hint')}</p>
                  </div>
                  <Switch
                    checked={!!field.condition}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onUpdate({ 
                          condition: { field_id: '', operator: 'equals', value: '' },
                          condition_action: 'show'
                        });
                      } else {
                        onUpdate({ condition: undefined, condition_action: undefined });
                      }
                    }}
                  />
                </div>
                
                {/* Condition configuration */}
                {field.condition && (
                  <div className="space-y-3 p-3 rounded-lg border bg-background">
                    {/* Source field selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('conditional.when_field')}</Label>
                      {availableConditionFields.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t('conditional.no_fields_available')}</p>
                      ) : (
                        <Select
                          value={field.condition.field_id}
                          onValueChange={(value) => onUpdate({ 
                            condition: { ...field.condition!, field_id: value }
                          })}
                        >
                          <SelectTrigger className="h-9">
                            <SelectValue placeholder={t('conditional.select_field')} />
                          </SelectTrigger>
                          <SelectContent>
                            {availableConditionFields.map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                    
                    {/* Operator selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('conditional.operator')}</Label>
                      <Select
                        value={field.condition.operator}
                        onValueChange={(value) => onUpdate({ 
                          condition: { ...field.condition!, operator: value as any }
                        })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder={t('conditional.select_operator')} />
                        </SelectTrigger>
                        <SelectContent>
                          {CONDITION_OPERATORS.map(op => (
                            <SelectItem key={op.value} value={op.value}>
                              {t(`conditional.operators.${op.value}`)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Value input - only if operator needs value */}
                    {needsConditionValue && (
                      <div className="space-y-1.5">
                        <Label className="text-xs">{t('conditional.value')}</Label>
                        {conditionSourceField?.options && conditionSourceField.options.length > 0 ? (
                          <Select
                            value={String(field.condition.value || '')}
                            onValueChange={(value) => onUpdate({ 
                              condition: { ...field.condition!, value }
                            })}
                          >
                            <SelectTrigger className="h-9">
                              <SelectValue placeholder={t('conditional.select_value')} />
                            </SelectTrigger>
                            <SelectContent>
                              {conditionSourceField.options.map(opt => (
                                <SelectItem key={opt.id} value={opt.value}>
                                  {opt.label_en}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            value={String(field.condition.value || '')}
                            onChange={(e) => onUpdate({ 
                              condition: { ...field.condition!, value: e.target.value }
                            })}
                            placeholder={t('conditional.enter_value')}
                            className="h-9"
                          />
                        )}
                      </div>
                    )}
                    
                    {/* Action selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs">{t('conditional.action')}</Label>
                      <Select
                        value={field.condition_action || 'show'}
                        onValueChange={(value) => onUpdate({ 
                          condition_action: value as 'show' | 'hide'
                        })}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="show">{t('conditional.show_field')}</SelectItem>
                          <SelectItem value="hide">{t('conditional.hide_field')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
