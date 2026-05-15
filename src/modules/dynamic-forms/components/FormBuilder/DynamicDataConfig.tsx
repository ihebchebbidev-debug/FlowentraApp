// Dynamic Data Source Configuration Component
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Database, RefreshCw, Plus, Trash2, Settings2, AlertCircle, Eye, Link2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DynamicDataSource,
  DynamicDataEntityType,
  DataFilter,
  DataFilterOperator,
  DYNAMIC_DATA_ENTITY_LABELS,
  DATA_FILTER_OPERATOR_LABELS,
  DEFAULT_DATA_SOURCES,
  getDataSourceFields,
} from '../../types/dynamicDataTypes';
import { FormField, FieldDependency } from '../../types';
import { dynamicDataService, DynamicOption } from '../../services/dynamicDataService';

interface DynamicDataConfigProps {
  useDynamicData: boolean;
  dataSource?: DynamicDataSource;
  dependency?: FieldDependency;
  currentFieldId?: string;
  allFields?: FormField[];
  onToggleDynamic: (enabled: boolean) => void;
  onUpdateDataSource: (dataSource: DynamicDataSource) => void;
  onUpdateDependency?: (dependency: FieldDependency | undefined) => void;
}

export function DynamicDataConfig({
  useDynamicData,
  dataSource,
  dependency,
  currentFieldId,
  allFields = [],
  onToggleDynamic,
  onUpdateDataSource,
  onUpdateDependency,
}: DynamicDataConfigProps) {
  const { t, i18n } = useTranslation('dynamic-forms');
  const isEnglish = i18n.language === 'en';
  
  const [preview, setPreview] = useState<DynamicOption[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [showCascading, setShowCascading] = useState(!!dependency);
  
  // Get available fields for the selected entity type
  const entityFields = dataSource?.entity_type 
    ? getDataSourceFields(dataSource.entity_type) 
    : [];
  
  // Get potential parent fields (select/radio fields with dynamic data before this field)
  const potentialParentFields = useMemo(() => {
    if (!currentFieldId || !allFields) return [];
    return allFields.filter(f => 
      f.id !== currentFieldId &&
      ['select', 'radio'].includes(f.type) &&
      f.use_dynamic_data &&
      f.data_source
    );
  }, [currentFieldId, allFields]);
  
  // Load preview when data source changes
  useEffect(() => {
    if (useDynamicData && dataSource?.entity_type && dataSource?.display_field && dataSource?.value_field) {
      loadPreview();
    }
  }, [useDynamicData, dataSource?.entity_type, dataSource?.display_field, dataSource?.value_field]);
  
  const loadPreview = async () => {
    if (!dataSource) return;
    
    setIsLoadingPreview(true);
    try {
      const options = await dynamicDataService.getPreview(dataSource, 5);
      setPreview(options);
    } catch (error) {
      console.error('Failed to load preview:', error);
      setPreview([]);
    } finally {
      setIsLoadingPreview(false);
    }
  };
  
  const handleEntityTypeChange = (entityType: DynamicDataEntityType) => {
    const defaults = DEFAULT_DATA_SOURCES[entityType];
    onUpdateDataSource({
      entity_type: entityType,
      display_field: defaults.display_field || 'name',
      value_field: defaults.value_field || 'id',
      sort_field: defaults.sort_field,
      sort_order: defaults.sort_order,
      filters: [],
    });
  };
  
  const handleAddFilter = () => {
    if (!dataSource) return;
    
    const newFilter: DataFilter = {
      field: entityFields[0]?.field || '',
      operator: 'equals',
      value: '',
    };
    
    onUpdateDataSource({
      ...dataSource,
      filters: [...(dataSource.filters || []), newFilter],
    });
  };
  
  const handleUpdateFilter = (index: number, updates: Partial<DataFilter>) => {
    if (!dataSource?.filters) return;
    
    const newFilters = dataSource.filters.map((filter, i) =>
      i === index ? { ...filter, ...updates } : filter
    );
    
    onUpdateDataSource({
      ...dataSource,
      filters: newFilters,
    });
  };
  
  const handleRemoveFilter = (index: number) => {
    if (!dataSource?.filters) return;
    
    onUpdateDataSource({
      ...dataSource,
      filters: dataSource.filters.filter((_, i) => i !== index),
    });
  };
  
  return (
    <div className="space-y-4">
      {/* Toggle Dynamic Data */}
      <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
        <div className="flex items-center gap-2">
          <Database className="h-4 w-4 text-primary" />
          <div>
            <Label htmlFor="use_dynamic" className="text-sm font-medium">
              {t('dynamic_data.use_dynamic', 'Dynamic Data Source')}
            </Label>
            <p className="text-[10px] text-muted-foreground">
              {t('dynamic_data.use_dynamic_hint', 'Load options from database entities')}
            </p>
          </div>
        </div>
        <Switch
          id="use_dynamic"
          checked={useDynamicData}
          onCheckedChange={onToggleDynamic}
        />
      </div>
      
      {useDynamicData && (
        <div className="space-y-4 pl-2 border-l-2 border-primary/20">
          {/* Entity Type Selection */}
          <div className="space-y-1.5">
            <Label className="text-xs">{t('dynamic_data.entity_type', 'Data Source')}</Label>
            <Select
              value={dataSource?.entity_type || ''}
              onValueChange={(value) => handleEntityTypeChange(value as DynamicDataEntityType)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder={t('dynamic_data.select_entity', 'Select data source...')} />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(DYNAMIC_DATA_ENTITY_LABELS) as DynamicDataEntityType[]).map((type) => (
                  <SelectItem key={type} value={type}>
                    {isEnglish ? DYNAMIC_DATA_ENTITY_LABELS[type].en : DYNAMIC_DATA_ENTITY_LABELS[type].fr}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {dataSource?.entity_type && (
            <>
              {/* Display & Value Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('dynamic_data.display_field', 'Display Field')}</Label>
                  <Select
                    value={dataSource.display_field}
                    onValueChange={(value) => onUpdateDataSource({ ...dataSource, display_field: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityFields.map((field) => (
                        <SelectItem key={field.field} value={field.field}>
                          {isEnglish ? field.label_en : field.label_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('dynamic_data.value_field', 'Value Field')}</Label>
                  <Select
                    value={dataSource.value_field}
                    onValueChange={(value) => onUpdateDataSource({ ...dataSource, value_field: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {entityFields.map((field) => (
                        <SelectItem key={field.field} value={field.field}>
                          {isEnglish ? field.label_en : field.label_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Display Template (Optional) */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('dynamic_data.display_template', 'Display Template')} <span className="text-muted-foreground">({t('common.optional', 'optional')})</span></Label>
                <Input
                  value={dataSource.display_template || ''}
                  onChange={(e) => onUpdateDataSource({ ...dataSource, display_template: e.target.value })}
                  placeholder="{name} - {email}"
                  className="h-9 font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">
                  {t('dynamic_data.template_hint', 'Use {fieldName} to combine multiple fields')}
                </p>
              </div>
              
              {/* Sorting */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('dynamic_data.sort_field', 'Sort By')}</Label>
                  <Select
                    value={dataSource.sort_field || ''}
                    onValueChange={(value) => onUpdateDataSource({ ...dataSource, sort_field: value })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('dynamic_data.no_sort', 'No sorting')} />
                    </SelectTrigger>
                    <SelectContent>
                      {entityFields.map((field) => (
                        <SelectItem key={field.field} value={field.field}>
                          {isEnglish ? field.label_en : field.label_fr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{t('dynamic_data.sort_order', 'Order')}</Label>
                  <Select
                    value={dataSource.sort_order || 'asc'}
                    onValueChange={(value) => onUpdateDataSource({ ...dataSource, sort_order: value as 'asc' | 'desc' })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="asc">{t('dynamic_data.ascending', 'A → Z')}</SelectItem>
                      <SelectItem value="desc">{t('dynamic_data.descending', 'Z → A')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Limit */}
              <div className="space-y-1.5">
                <Label className="text-xs">{t('dynamic_data.limit', 'Maximum Options')}</Label>
                <Input
                  type="number"
                  min={0}
                  value={dataSource.limit || ''}
                  onChange={(e) => onUpdateDataSource({ ...dataSource, limit: e.target.value ? parseInt(e.target.value) : undefined })}
                  placeholder={t('dynamic_data.unlimited', 'Unlimited')}
                  className="h-9"
                />
              </div>
              
              {/* Filters Section */}
              <Collapsible open={showFilters} onOpenChange={setShowFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full justify-between h-8">
                    <span className="flex items-center gap-2 text-xs">
                      <Settings2 className="h-3 w-3" />
                      {t('dynamic_data.filters', 'Filters')}
                      {dataSource.filters && dataSource.filters.length > 0 && (
                        <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                          {dataSource.filters.length}
                        </Badge>
                      )}
                    </span>
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 pt-2">
                  {(!dataSource.filters || dataSource.filters.length === 0) && (
                    <p className="text-[10px] text-muted-foreground text-center py-2">
                      {t('dynamic_data.no_filters', 'No filters configured')}
                    </p>
                  )}
                  
                  {dataSource.filters?.map((filter, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 rounded-lg border bg-background">
                      <div className="flex-1 space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <Select
                            value={filter.field}
                            onValueChange={(value) => handleUpdateFilter(index, { field: value })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {entityFields.map((f) => (
                                <SelectItem key={f.field} value={f.field}>
                                  {isEnglish ? f.label_en : f.label_fr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Select
                            value={filter.operator}
                            onValueChange={(value) => handleUpdateFilter(index, { operator: value as DataFilterOperator })}
                          >
                            <SelectTrigger className="h-7 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {(Object.keys(DATA_FILTER_OPERATOR_LABELS) as DataFilterOperator[]).map((op) => (
                                <SelectItem key={op} value={op}>
                                  {isEnglish ? DATA_FILTER_OPERATOR_LABELS[op].en : DATA_FILTER_OPERATOR_LABELS[op].fr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {!['is_empty', 'is_not_empty'].includes(filter.operator) && (
                          <Input
                            value={String(filter.value || '')}
                            onChange={(e) => handleUpdateFilter(index, { value: e.target.value })}
                            placeholder={t('dynamic_data.filter_value', 'Value')}
                            className="h-7 text-xs"
                          />
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFilter(index)}
                        className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAddFilter}
                    className="w-full h-7 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    {t('dynamic_data.add_filter', 'Add Filter')}
                  </Button>
                </CollapsibleContent>
              </Collapsible>
              
              {/* Cascading Dropdown Configuration */}
              {potentialParentFields.length > 0 && onUpdateDependency && (
                <Collapsible open={showCascading} onOpenChange={setShowCascading}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-full justify-between h-8">
                      <span className="flex items-center gap-2 text-xs">
                        <Link2 className="h-3 w-3" />
                        {t('dynamic_data.cascading')}
                        {dependency && (
                          <Badge variant="secondary" className="h-4 px-1 text-[10px]">
                            {t('common.enabled', 'On')}
                          </Badge>
                        )}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 pt-2">
                    {/* Enable Cascading Toggle */}
                    <div className="flex items-center justify-between p-2 rounded-lg border bg-muted/30">
                      <div>
                        <Label htmlFor="enable_cascading" className="text-xs font-medium">
                          {t('dynamic_data.enable_cascading')}
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          {t('dynamic_data.enable_cascading_hint')}
                        </p>
                      </div>
                      <Switch
                        id="enable_cascading"
                        checked={!!dependency}
                        onCheckedChange={(enabled) => {
                          if (enabled && potentialParentFields.length > 0) {
                            const firstParent = potentialParentFields[0];
                            onUpdateDependency({
                              parent_field_id: firstParent.id,
                              parent_value_field: firstParent.data_source?.value_field || 'id',
                              filter_field: entityFields[0]?.field || 'id',
                              clear_on_parent_change: true,
                            });
                          } else {
                            onUpdateDependency(undefined);
                          }
                        }}
                      />
                    </div>
                    
                    {dependency && (
                      <div className="space-y-3 pl-2 border-l-2 border-primary/20">
                        {/* Parent Field Selection */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t('dynamic_data.parent_field')}</Label>
                          <Select
                            value={dependency.parent_field_id}
                            onValueChange={(value) => {
                              const parentField = potentialParentFields.find(f => f.id === value);
                              onUpdateDependency({
                                ...dependency,
                                parent_field_id: value,
                                parent_value_field: parentField?.data_source?.value_field || 'id',
                              });
                            }}
                          >
                            <SelectTrigger className="h-9 bg-background">
                              <SelectValue placeholder={t('dynamic_data.select_parent')} />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {potentialParentFields.map((f) => (
                                <SelectItem key={f.id} value={f.id}>
                                  {isEnglish ? f.label_en : f.label_fr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {/* Filter Field Selection */}
                        <div className="space-y-1.5">
                          <Label className="text-xs">{t('dynamic_data.filter_by_field')}</Label>
                          <Select
                            value={dependency.filter_field}
                            onValueChange={(value) => onUpdateDependency({
                              ...dependency,
                              filter_field: value,
                            })}
                          >
                            <SelectTrigger className="h-9 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-popover z-50">
                              {entityFields.map((f) => (
                                <SelectItem key={f.field} value={f.field}>
                                  {isEnglish ? f.label_en : f.label_fr}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-[10px] text-muted-foreground">
                            {t('dynamic_data.filter_by_hint')}
                          </p>
                        </div>
                        
                        {/* Clear on Parent Change */}
                        <div className="flex items-center justify-between p-2 rounded border bg-background">
                          <div>
                            <Label htmlFor="clear_on_change" className="text-xs font-medium">
                              {t('dynamic_data.clear_on_change')}
                            </Label>
                            <p className="text-[10px] text-muted-foreground">
                              {t('dynamic_data.clear_on_change_hint')}
                            </p>
                          </div>
                          <Switch
                            id="clear_on_change"
                            checked={dependency.clear_on_parent_change !== false}
                            onCheckedChange={(checked) => onUpdateDependency({
                              ...dependency,
                              clear_on_parent_change: checked,
                            })}
                          />
                        </div>
                      </div>
                    )}
                    
                    {potentialParentFields.length === 0 && (
                      <p className="text-xs text-muted-foreground italic text-center py-2">
                        {t('dynamic_data.no_parent_fields')}
                      </p>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
              
              <Separator />
              
              {/* Preview Section */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {t('dynamic_data.preview', 'Preview')}
                  </Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadPreview}
                    disabled={isLoadingPreview}
                    className="h-6 text-xs"
                  >
                    <RefreshCw className={`h-3 w-3 mr-1 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                    {t('dynamic_data.refresh', 'Refresh')}
                  </Button>
                </div>
                
                {isLoadingPreview ? (
                  <div className="text-center py-3 text-muted-foreground text-xs">
                    {t('common.loading', 'Loading...')}
                  </div>
                ) : preview.length > 0 ? (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {preview.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                        <span className="font-mono text-muted-foreground">{opt.value}</span>
                        <span>→</span>
                        <span className="font-medium">{opt.label}</span>
                      </div>
                    ))}
                    {preview.length === 5 && (
                      <p className="text-[10px] text-muted-foreground text-center">
                        {t('dynamic_data.preview_limit', 'Showing first 5 results')}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                    <AlertCircle className="h-4 w-4 text-warning flex-shrink-0" />
                    <p className="text-xs text-foreground">
                      {t('dynamic_data.no_data', 'No data found. Check filters or data source.')}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
