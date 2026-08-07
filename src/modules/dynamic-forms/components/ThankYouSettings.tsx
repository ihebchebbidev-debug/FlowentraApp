import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2, ExternalLink, MessageSquare, ArrowRight, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  ThankYouSettings as ThankYouSettingsType, 
  ThankYouRule, 
  FormField,
  ConditionOperator 
} from '../types';
import { cn } from '@/lib/utils';

interface ThankYouSettingsProps {
  settings: ThankYouSettingsType;
  fields: FormField[];
  onChange: (settings: ThankYouSettingsType) => void;
}

const CONDITION_OPERATORS: { value: ConditionOperator; label_en: string; label_fr: string }[] = [
  { value: 'equals', label_en: 'Equals', label_fr: 'Égal à' },
  { value: 'not_equals', label_en: 'Not equals', label_fr: 'Différent de' },
  { value: 'contains', label_en: 'Contains', label_fr: 'Contient' },
  { value: 'not_contains', label_en: 'Does not contain', label_fr: 'Ne contient pas' },
  { value: 'greater_than', label_en: 'Greater than', label_fr: 'Supérieur à' },
  { value: 'less_than', label_en: 'Less than', label_fr: 'Inférieur à' },
  { value: 'is_empty', label_en: 'Is empty', label_fr: 'Est vide' },
  { value: 'is_not_empty', label_en: 'Is not empty', label_fr: "N'est pas vide" },
];

export function ThankYouSettings({ settings, fields, onChange }: ThankYouSettingsProps) {
  const { t, i18n } = useTranslation('dynamic-forms');
  const lang = i18n.language === 'fr' ? 'fr' : 'en';
  
  // Filter fields that can be used in conditions (exclude sections and page breaks)
  const conditionableFields = fields.filter(
    f => !['section', 'page_break'].includes(f.type)
  );
  
  const updateDefaultSettings = (updates: Partial<ThankYouSettingsType['default_message']>) => {
    onChange({
      ...settings,
      default_message: {
        ...settings.default_message,
        ...updates,
      },
    });
  };
  
  const addRule = () => {
    const newRule: ThankYouRule = {
      id: `rule_${Date.now()}`,
      name: `Rule ${(settings.rules?.length || 0) + 1}`,
      condition: {
        field_id: '',
        operator: 'equals',
        value: '',
      },
      message_en: 'Thank you for your response!',
      message_fr: 'Merci pour votre réponse!',
      redirect_url: '',
      redirect_delay: 3,
      priority: (settings.rules?.length || 0) + 1,
    };
    
    onChange({
      ...settings,
      rules: [...(settings.rules || []), newRule],
    });
  };
  
  const updateRule = (ruleId: string, updates: Partial<ThankYouRule>) => {
    onChange({
      ...settings,
      rules: settings.rules?.map(r => 
        r.id === ruleId ? { ...r, ...updates } : r
      ) || [],
    });
  };
  
  const deleteRule = (ruleId: string) => {
    onChange({
      ...settings,
      rules: settings.rules?.filter(r => r.id !== ruleId) || [],
    });
  };
  
  const getFieldLabel = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return fieldId;
    return lang === 'fr' ? field.label_fr : field.label_en;
  };
  
  const getFieldOptions = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    return field?.options || [];
  };
  
  return (
    <div className="space-y-6">
      {/* Default Thank You Message */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-success/10">
              <MessageSquare className="h-4 w-4 text-success" />
            </div>
            <div>
              <CardTitle className="text-base">
                {t('thank_you.default_message', 'Default Thank You Message')}
              </CardTitle>
              <CardDescription className="text-xs">
                {t('thank_you.default_desc', 'Shown when no conditional rules match')}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* English Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">EN</Badge>
                <Label>{t('thank_you.title_en', 'Title (English)')}</Label>
              </div>
              <Input
                value={settings.default_message?.title_en || ''}
                onChange={(e) => updateDefaultSettings({ title_en: e.target.value })}
                placeholder={t('thank_you.placeholder_thank_you_title_en')}
              />
              <Label className="text-xs text-muted-foreground">{t('thank_you.message_en', 'Message')}</Label>
              <Textarea
                value={settings.default_message?.message_en || ''}
                onChange={(e) => updateDefaultSettings({ message_en: e.target.value })}
                placeholder={t('thank_you.placeholder_thank_you_msg_en')}
                rows={3}
              />
            </div>
            
            {/* French Message */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border">FR</Badge>
                <Label>{t('thank_you.title_fr', 'Title (French)')}</Label>
              </div>
              <Input
                value={settings.default_message?.title_fr || ''}
                onChange={(e) => updateDefaultSettings({ title_fr: e.target.value })}
                placeholder={t('thank_you.placeholder_thank_you_title_fr')}
              />
              <Label className="text-xs text-muted-foreground">{t('thank_you.message_fr', 'Message')}</Label>
              <Textarea
                value={settings.default_message?.message_fr || ''}
                onChange={(e) => updateDefaultSettings({ message_fr: e.target.value })}
                placeholder={t('thank_you.placeholder_thank_you_msg_fr')}
                rows={3}
              />
            </div>
          </div>
          
          {/* Default Redirect */}
          <Separator />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <Label>{t('thank_you.redirect', 'Redirect After Submission')}</Label>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={settings.default_message?.enable_redirect || false}
                onCheckedChange={(checked) => updateDefaultSettings({ enable_redirect: checked })}
              />
              <span className="text-sm text-muted-foreground">
                {t('thank_you.enable_redirect', 'Enable redirect to external URL')}
              </span>
            </div>
            {settings.default_message?.enable_redirect && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6">
                <div className="space-y-2">
                  <Label>{t('thank_you.redirect_url', 'Redirect URL')}</Label>
                  <Input
                    type="url"
                    value={settings.default_message?.redirect_url || ''}
                    onChange={(e) => updateDefaultSettings({ redirect_url: e.target.value })}
                    placeholder={t('thank_you.placeholder_redirect_url')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('thank_you.redirect_delay', 'Delay (seconds)')}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={30}
                    value={settings.default_message?.redirect_delay || 3}
                    onChange={(e) => updateDefaultSettings({ redirect_delay: parseInt(e.target.value) || 3 })}
                  />
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Conditional Rules */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <ArrowRight className="h-4 w-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-base">
                  {t('thank_you.conditional_rules', 'Conditional Rules')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('thank_you.conditional_desc', 'Show different messages based on form responses')}
                </CardDescription>
              </div>
            </div>
            <Button onClick={addRule} variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              {t('thank_you.add_rule', 'Add Rule')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {(!settings.rules || settings.rules.length === 0) ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('thank_you.no_rules', 'No conditional rules yet')}</p>
              <p className="text-xs mt-1">{t('thank_you.no_rules_hint', 'Add rules to show different thank you messages based on responses')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {settings.rules.map((rule, index) => (
                <Card key={rule.id} className="border-dashed">
                  <CardHeader className="py-3 px-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <Badge variant="secondary" className="text-xs">
                          {t('thank_you.rule', 'Rule')} {index + 1}
                        </Badge>
                        <Input
                          value={rule.name}
                          onChange={(e) => updateRule(rule.id, { name: e.target.value })}
                          className="h-7 text-sm w-40"
                          placeholder={t('thank_you.rule_name_placeholder')}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={() => deleteRule(rule.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="py-3 px-4 space-y-4">
                    {/* Condition */}
                    <div className="p-3 bg-muted/50 rounded-lg space-y-3">
                      <Label className="text-xs font-medium text-muted-foreground">
                        {t('thank_you.when', 'WHEN')}
                      </Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                        <Select
                          value={rule.condition.field_id}
                          onValueChange={(value) => updateRule(rule.id, { 
                            condition: { ...rule.condition, field_id: value, value: '' } 
                          })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue placeholder={t('thank_you.select_field', 'Select field')} />
                          </SelectTrigger>
                          <SelectContent>
                            {conditionableFields.map((field) => (
                              <SelectItem key={field.id} value={field.id}>
                                {lang === 'fr' ? field.label_fr : field.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        <Select
                          value={rule.condition.operator}
                          onValueChange={(value) => updateRule(rule.id, { 
                            condition: { ...rule.condition, operator: value as ConditionOperator } 
                          })}
                        >
                          <SelectTrigger className="bg-background">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONDITION_OPERATORS.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {lang === 'fr' ? op.label_fr : op.label_en}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        
                        {!['is_empty', 'is_not_empty'].includes(rule.condition.operator) && (
                          <>
                            {getFieldOptions(rule.condition.field_id).length > 0 ? (
                              <Select
                                value={String(rule.condition.value || '')}
                                onValueChange={(value) => updateRule(rule.id, { 
                                  condition: { ...rule.condition, value } 
                                })}
                              >
                                <SelectTrigger className="bg-background">
                                  <SelectValue placeholder={t('thank_you.select_value', 'Select value')} />
                                </SelectTrigger>
                                <SelectContent>
                                  {getFieldOptions(rule.condition.field_id).map((opt) => (
                                    <SelectItem key={opt.id} value={opt.value}>
                                      {lang === 'fr' ? opt.label_fr : opt.label_en}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <Input
                                value={String(rule.condition.value || '')}
                                onChange={(e) => updateRule(rule.id, { 
                                  condition: { ...rule.condition, value: e.target.value } 
                                })}
                                placeholder={t('thank_you.enter_value', 'Enter value')}
                                className="bg-background"
                              />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Messages */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">EN</Badge>
                          <Label className="text-xs">{t('thank_you.message', 'Message')}</Label>
                        </div>
                        <Textarea
                          value={rule.message_en}
                          onChange={(e) => updateRule(rule.id, { message_en: e.target.value })}
                          placeholder={t('thank_you.placeholder_en_message')}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-secondary text-secondary-foreground border-border text-xs">FR</Badge>
                          <Label className="text-xs">{t('thank_you.message', 'Message')}</Label>
                        </div>
                        <Textarea
                          value={rule.message_fr}
                          onChange={(e) => updateRule(rule.id, { message_fr: e.target.value })}
                          placeholder={t('thank_you.placeholder_fr_message')}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Redirect */}
                    <div className="flex items-center gap-4">
                      <div className="flex-1 space-y-2">
                        <Label className="text-xs">{t('thank_you.redirect_url', 'Redirect URL')} ({t('thank_you.optional')})</Label>
                        <Input
                          type="url"
                          value={rule.redirect_url || ''}
                          onChange={(e) => updateRule(rule.id, { redirect_url: e.target.value })}
                          placeholder="https://example.com"
                          className="text-sm"
                        />
                      </div>
                      <div className="w-24 space-y-2">
                        <Label className="text-xs">{t('thank_you.delay', 'Delay (s)')}</Label>
                        <Input
                          type="number"
                          min={0}
                          max={30}
                          value={rule.redirect_delay || 3}
                          onChange={(e) => updateRule(rule.id, { redirect_delay: parseInt(e.target.value) || 3 })}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
