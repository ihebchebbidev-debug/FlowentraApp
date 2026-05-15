import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Save, Settings, Zap, ArrowRight, AlertCircle, Loader2, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Node, Edge } from '@xyflow/react';
import { EntityType, StatusOption } from '../../data/entity-statuses';
import { useEntityStatuses } from '../../hooks/useEntityStatuses';
import { VariablePicker } from './VariablePicker';

export interface NodeConfig {
  name?: string;
  description?: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  newStatus?: string | null;
  requiresApproval?: boolean;
  approverRole?: string;
  timeoutHours?: number;
  notificationTitle?: string;
  notificationMessage?: string;
  notificationType?: string;
  recipientType?: string;
  autoCreate?: boolean;
  createPerService?: boolean;
  field?: string;
  operator?: string;
  value?: string;
  emailSubject?: string;
  emailTemplate?: string;
  enabled?: boolean;
  [key: string]: any;
}

interface NodeConfigPanelProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  nodeData: {
    label: string;
    type: string;
    entityType?: EntityType;
    category?: string;
    fromStatus?: string | null;
    toStatus?: string | null;
    newStatus?: string | null;
    field?: string;
    operator?: string;
    value?: string;
    config?: NodeConfig;
    icon?: React.ComponentType<any>;
  };
  onSave: (nodeId: string, config: NodeConfig) => void;
  nodes?: Node[];
  edges?: Edge[];
}

// ─── Validation rules per node type ───
interface ValidationRule {
  key: string;
  label: string;
}

function getRequiredFields(nodeType: string): ValidationRule[] {
  const t = nodeType.toLowerCase();
  if (t.includes('email') && !t.includes('ai-')) {
    return [
      { key: 'emailSubject', label: 'Subject' },
    ];
  }
  if (t.includes('notification')) {
    return [
      { key: 'notificationTitle', label: 'Title' },
      { key: 'notificationMessage', label: 'Message' },
    ];
  }
  if ((t.includes('api') || t.includes('http')) && !t.includes('trigger')) {
    return [{ key: 'url', label: 'URL' }];
  }
  if (t.includes('webhook') && !t.includes('trigger')) {
    return [{ key: 'url', label: 'URL' }];
  }
  if (t.includes('database') || t.includes('db-')) {
    return [{ key: 'table', label: 'Table' }];
  }
  if (t === 'if-else' || t.includes('condition')) {
    return [{ key: 'field', label: 'Field' }];
  }
  if (t === 'switch') {
    return [{ key: 'field', label: 'Field' }];
  }
  if (t.includes('ai-') || t.includes('llm')) {
    return [{ key: 'prompt', label: 'Prompt' }];
  }
  if (t.includes('scheduled')) {
    return [{ key: 'cronExpression', label: 'Cron Expression' }];
  }
  if (t.includes('approval') || t === 'request-approval') {
    return [{ key: 'approverRole', label: 'Approver Role' }];
  }
  return [];
}

function RequiredIndicator() {
  return <span className="text-destructive ml-0.5">*</span>;
}

export function NodeConfigPanel({ isOpen, onClose, nodeId, nodeData, onSave, nodes = [], edges = [] }: NodeConfigPanelProps) {
  const { t } = useTranslation('workflow');
  const [config, setConfig] = useState<NodeConfig>({});
  const [activeTab, setActiveTab] = useState('settings');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const initializedForNodeRef = useRef<string | null>(null);

  // Derive entity type first (needed for hook)
  const getEntityTypeFromNodeType = (type: string): EntityType | null => {
    if (type.includes('offer')) return 'offer';
    if (type.includes('sale')) return 'sale';
    if (type.includes('service-order') || type.includes('service_order')) return 'service_order';
    if (type.includes('dispatch')) return 'dispatch';
    return nodeData.entityType || null;
  };

  const entityType = getEntityTypeFromNodeType(nodeData.type);
  
  // Fetch statuses dynamically from backend - hook must be called unconditionally
  const { statuses, isLoading: statusesLoading, isFromBackend } = useEntityStatuses(entityType);

  useEffect(() => {
    // Initialize config only when the panel opens or the node changes.
    // Some parents recreate `nodeData` objects frequently; depending on `nodeData`
    // here causes user edits to be overwritten immediately.
    if (!isOpen) return;

    if (initializedForNodeRef.current !== nodeId) {
      initializedForNodeRef.current = nodeId;

      // IMPORTANT: Status and condition fields are often stored at the top-level of node.data
      // (e.g. data.fromStatus, data.field) so we must hydrate them into `config`.
      const baseConfig: NodeConfig = (nodeData?.config ?? {}) as NodeConfig;
      const conditionData = (baseConfig as any)?.conditionData || {};
      
      const switchData = (baseConfig as any)?.switchData || {};
      
      const initialConfig: NodeConfig = {
        ...baseConfig,
        // Status trigger/action fields
        fromStatus: nodeData?.fromStatus ?? baseConfig.fromStatus ?? null,
        toStatus: nodeData?.toStatus ?? baseConfig.toStatus ?? null,
        newStatus: nodeData?.newStatus ?? baseConfig.newStatus ?? null,
        // Condition fields (check top-level > config > conditionData)
        field: (nodeData as any)?.field ?? baseConfig.field ?? conditionData.field ?? switchData.field ?? null,
        operator: (nodeData as any)?.operator ?? baseConfig.operator ?? conditionData.operator ?? 'equals',
        value: (nodeData as any)?.value ?? baseConfig.value ?? conditionData.value ?? null,
        // Switch cases
        cases: (baseConfig as any)?.cases ?? switchData.cases ?? [],
      };

      setConfig(initialConfig);
      setValidationErrors([]);
    }
  }, [isOpen, nodeId, nodeData?.config]);

  const requiredFields = useMemo(() => getRequiredFields(nodeData.type), [nodeData.type]);

  const _isFieldRequired = (key: string) => requiredFields.some(r => r.key === key);

  const validate = (): string[] => {
    const errors: string[] = [];
    for (const rule of requiredFields) {
      const val = config[rule.key];
      if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
        errors.push(rule.label);
      }
    }
    return errors;
  };

  const handleSave = () => {
    const errors = validate();
    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    setValidationErrors([]);
    onSave(nodeId, config);
    onClose();
  };

  const hasUpstreamNodes = nodes.length > 0;

  // Insert a variable reference into a text config field
  const insertVariable = (key: string, variable: string) => {
    const current = (config[key] || '') as string;
    updateConfig(key, current + variable);
  };

  const updateConfig = (key: string, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
    // Clear validation error for this field
    if (validationErrors.length > 0) {
      const rule = requiredFields.find(r => r.key === key);
      if (rule && value && (typeof value !== 'string' || value.trim() !== '')) {
        setValidationErrors(prev => prev.filter(e => e !== rule.label));
      }
    }
  };

  const isTriggerNode = nodeData.type.includes('trigger');
  const isActionNode = nodeData.type.includes('update') || nodeData.type.includes('create');
  const isConditionNode = nodeData.type === 'if-else' || nodeData.type === 'switch';
  const isIfElseNode = nodeData.type === 'if-else';
  const isSwitchNode = nodeData.type === 'switch';
  const isAiNode = nodeData.type.includes('ai-') || nodeData.type.includes('llm');
  const isAiAgentNode = nodeData.type === 'ai-agent';
  const isHumanInputNode = nodeData.type === 'human-input-form';
  const isWaitForEventNode = nodeData.type === 'wait-for-event';
  const isLoopNode = nodeData.type === 'loop';
  const isParallelNode = nodeData.type === 'parallel';
  const isTryCatchNode = nodeData.type === 'try-catch';
  const isDataTransferNode = nodeData.type === 'data-transfer';
  const isDynamicFormNode = nodeData.type === 'dynamic-form';
  const isEmailNode = nodeData.type.includes('email') && !nodeData.type.includes('ai-');
  const isNotificationNode = nodeData.type.includes('notification');
  const isDelayNode = nodeData.type === 'delay';
  const isWebhookNode = nodeData.type.includes('webhook');
  const isScheduledNode = nodeData.type.includes('scheduled');
  const isDatabaseNode = nodeData.type.includes('database') || nodeData.type.includes('db-');
  const isApiNode = (nodeData.type.includes('api') || nodeData.type.includes('http')) && !nodeData.type.includes('trigger');
  const isApprovalNode = nodeData.type.includes('approval');
  const isCodeNode = nodeData.type === 'code' || nodeData.type === 'javascript';
  const isEntityNode = entityType !== null;

  const IconComponent = nodeData.icon || Settings;

  const hasError = (key: string) => {
    const rule = requiredFields.find(r => r.key === key);
    return rule ? validationErrors.includes(rule.label) : false;
  };

  if (!isOpen) return null;

  return (
    <div className={cn(
      'fixed right-0 top-0 h-full w-[400px] z-50',
      'bg-card border-l border-border shadow-xl',
      'transform transition-transform duration-300',
      isOpen ? 'translate-x-0' : 'translate-x-full'
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <IconComponent className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">
            {config.name || nodeData.label}
          </h3>
          <p className="text-xs text-muted-foreground">
            {t(`nodeType.${nodeData.type}`, nodeData.type)}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="w-full justify-start px-4 pt-2 bg-transparent">
          <TabsTrigger value="settings" className="text-xs">
            {t('settings', 'Settings')}
          </TabsTrigger>
          {isEntityNode && (
            <TabsTrigger value="status" className="text-xs">
              {t('statusTab', 'Status')}
            </TabsTrigger>
          )}
          <TabsTrigger value="advanced" className="text-xs">
            {t('advanced', 'Advanced')}
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="h-[calc(100vh-180px)]">
          {/* Settings Tab */}
          <TabsContent value="settings" className="p-4 space-y-4 mt-0">
            {/* Validation Error Banner */}
            {validationErrors.length > 0 && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                <div className="text-sm text-destructive">
                  <p className="font-medium">{t('requiredFieldsMissing', 'Required fields missing:')}</p>
                  <p>{validationErrors.join(', ')}</p>
                </div>
              </div>
            )}

            {/* Node Name */}
            <div className="space-y-2">
              <Label htmlFor="name">{t('nodeName', 'Node Name')}</Label>
              <Input
                id="name"
                value={config.name || ''}
                onChange={(e) => updateConfig('name', e.target.value)}
                placeholder={nodeData.label}
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">{t('description', 'Description')}</Label>
              <Textarea
                id="description"
                value={config.description || ''}
                onChange={(e) => updateConfig('description', e.target.value)}
                placeholder={t('descriptionPlaceholder', 'Optional description...')}
                rows={3}
              />
            </div>

            <Separator />

            {/* IF/ELSE Condition Config */}
            {isIfElseNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('conditionConfig', 'Condition')}</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('field', 'Field')}<RequiredIndicator /></Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('field', v)} />
                    )}
                  </div>
                  <Input
                    value={config.field || ''}
                    onChange={(e) => updateConfig('field', e.target.value)}
                    placeholder="e.g., status, amount, priority"
                    className={cn(hasError('field') && 'border-destructive')}
                  />
                  {hasError('field') && <p className="text-xs text-destructive">{t('fieldRequired', 'Field is required')}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t('operator', 'Operator')}</Label>
                  <Select 
                    value={config.operator || 'equals'} 
                    onValueChange={(v) => updateConfig('operator', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="equals">{t('operators.equals', 'Equals')}</SelectItem>
                      <SelectItem value="not_equals">{t('operators.not_equals', 'Not Equals')}</SelectItem>
                      <SelectItem value="contains">{t('operators.contains', 'Contains')}</SelectItem>
                      <SelectItem value="not_contains">{t('operators.not_contains', 'Does Not Contain')}</SelectItem>
                      <SelectItem value="greater_than">{t('operators.greater_than', 'Greater Than')}</SelectItem>
                      <SelectItem value="less_than">{t('operators.less_than', 'Less Than')}</SelectItem>
                      <SelectItem value="is_empty">{t('operators.is_empty', 'Is Empty')}</SelectItem>
                      <SelectItem value="is_not_empty">{t('operators.is_not_empty', 'Is Not Empty')}</SelectItem>
                      <Separator className="my-1" />
                      <SelectItem value="all_match">{t('operators.all_match', 'All Match')}</SelectItem>
                      <SelectItem value="any_match">{t('operators.any_match', 'Any Match')}</SelectItem>
                      <SelectItem value="none_match">{t('operators.none_match', 'None Match')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('value', 'Value')}</Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('value', v)} />
                    )}
                  </div>
                  <Input
                    value={config.value || ''}
                    onChange={(e) => updateConfig('value', e.target.value)}
                    placeholder={t('valuePlaceholder', 'Value to compare')}
                  />
                </div>

                {/* Live preview */}
                {config.field && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm font-mono">
                    <span className="text-warning">{config.field}</span>
                    {' '}
                    <span className="text-muted-foreground">{config.operator || 'equals'}</span>
                    {' '}
                    <span className="text-foreground font-medium">{config.value || '...'}</span>
                  </div>
                )}
              </div>
            )}

            {/* SWITCH Node Config */}
            {isSwitchNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('switchConfig', 'Switch Configuration')}</h4>
                
                {/* Switch field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('switchField', 'Field to switch on')}<RequiredIndicator /></Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('field', v)} />
                    )}
                  </div>
                  <Input
                    value={config.field || ''}
                    onChange={(e) => updateConfig('field', e.target.value)}
                    placeholder="e.g., status, category, paymentMethod"
                    className={cn(hasError('field') && 'border-destructive')}
                  />
                  {hasError('field') && <p className="text-xs text-destructive">{t('fieldRequired', 'Field is required')}</p>}
                </div>

                <Separator />

                {/* Cases */}
                <div className="space-y-2">
                  <Label>{t('cases', 'Cases')}</Label>
                  <div className="space-y-2">
                    {((config.cases as any[]) || []).map((caseItem: any, index: number) => (
                      <div key={index} className="flex gap-2 items-center p-2 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex-1 space-y-1">
                          <Input
                            placeholder={t('caseValue', 'Value (e.g., pending)')}
                            value={caseItem.value || ''}
                            onChange={(e) => {
                              const newCases = [...((config.cases as any[]) || [])];
                              newCases[index] = { ...newCases[index], value: e.target.value };
                              updateConfig('cases', newCases);
                            }}
                            className="h-8 text-sm"
                          />
                          <Input
                            placeholder={t('caseLabel', 'Label (optional)')}
                            value={caseItem.label || ''}
                            onChange={(e) => {
                              const newCases = [...((config.cases as any[]) || [])];
                              newCases[index] = { ...newCases[index], label: e.target.value };
                              updateConfig('cases', newCases);
                            }}
                            className="h-8 text-sm"
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10"
                          onClick={() => {
                            const newCases = ((config.cases as any[]) || []).filter((_: any, i: number) => i !== index);
                            updateConfig('cases', newCases);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        const newCases = [...((config.cases as any[]) || []), { value: '', label: '' }];
                        updateConfig('cases', newCases);
                      }}
                    >
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      {t('addCase', 'Add Case')}
                    </Button>
                  </div>
                </div>

                {/* Default case info */}
                <div className="bg-muted/50 p-3 rounded-lg text-sm text-muted-foreground">
                  <p className="font-medium text-foreground text-xs mb-1">{t('defaultCase', 'Default Case')}</p>
                  <p className="text-xs">{t('defaultCaseDesc', 'If no case matches, the default output handle will be followed.')}</p>
                </div>

                {/* Preview */}
                {config.field && ((config.cases as any[]) || []).length > 0 && (
                  <div className="bg-muted/50 p-3 rounded-lg text-sm">
                    <p className="text-xs font-medium text-foreground mb-2">{t('preview', 'Preview')}:</p>
                    <div className="font-mono text-[11px] space-y-1">
                      <div className="text-violet-600 dark:text-violet-400">switch ({config.field}) {'{'}</div>
                      {((config.cases as any[]) || []).filter((c: any) => c.value).map((c: any, i: number) => (
                        <div key={i} className="pl-4">
                          <span className="text-foreground">case "{c.value}"</span>
                          <span className="text-muted-foreground"> → {c.label || c.value}</span>
                        </div>
                      ))}
                      <div className="pl-4 text-muted-foreground italic">default → ...</div>
                      <div className="text-violet-600 dark:text-violet-400">{'}'}</div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Node Config */}
            {isActionNode && !isTriggerNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('actionConfig', 'Action Settings')}</h4>
                
                {nodeData.type.includes('create') && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{t('autoCreate', 'Auto-create')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('autoCreateDesc', 'Automatically create when triggered')}
                      </p>
                    </div>
                    <Switch
                      checked={config.autoCreate ?? true}
                      onCheckedChange={(v) => updateConfig('autoCreate', v)}
                    />
                  </div>
                )}

                {nodeData.type.includes('dispatch') && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{t('createPerService', 'Per Service')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('createPerServiceDesc', 'Create dispatch for each service item')}
                      </p>
                    </div>
                    <Switch
                      checked={config.createPerService ?? false}
                      onCheckedChange={(v) => updateConfig('createPerService', v)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* AI Node Config */}
            {isAiNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('aiConfig', 'AI Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('aiModel', 'Model')}</Label>
                  <Select 
                    value={config.model || 'gpt-4'} 
                    onValueChange={(v) => updateConfig('model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3">Claude 3</SelectItem>
                      <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('aiPrompt', 'Prompt')}<RequiredIndicator /></Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('prompt', v)} />
                    )}
                  </div>
                  <Textarea
                    value={config.prompt || ''}
                    onChange={(e) => updateConfig('prompt', e.target.value)}
                    placeholder={t('aiPromptPlaceholder', 'Describe what the AI should do...')}
                    rows={4}
                    className={cn(hasError('prompt') && 'border-destructive')}
                  />
                  {hasError('prompt') && <p className="text-xs text-destructive">{t('promptRequired', 'Prompt is required')}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t('aiMaxTokens', 'Max Tokens')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={8000}
                    value={config.maxTokens || 1000}
                    onChange={(e) => updateConfig('maxTokens', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* AI Agent Node Config */}
            {isAiAgentNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('aiAgentConfig', 'AI Agent Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('aiModel', 'Model')}</Label>
                  <Select 
                    value={config.model || 'gpt-4'} 
                    onValueChange={(v) => updateConfig('model', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                      <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                      <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('agentObjective', 'Agent Objective')}</Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('agentObjective', v)} />
                    )}
                  </div>
                  <Textarea
                    value={config.agentObjective || ''}
                    onChange={(e) => updateConfig('agentObjective', e.target.value)}
                    placeholder={t('agentObjectivePlaceholder', 'Describe what the agent should accomplish...')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('agentTools', 'Available Tools')}</Label>
                  <div className="space-y-2">
                    {['search_database', 'send_email', 'update_entity', 'call_api', 'analyze_data'].map(tool => (
                      <div key={tool} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                        <span className="text-xs">{t(`agentTool.${tool}`, tool.replace(/_/g, ' '))}</span>
                        <Switch
                          checked={(config.agentTools || []).includes(tool)}
                          onCheckedChange={(v) => {
                            const tools = config.agentTools || [];
                            updateConfig('agentTools', v ? [...tools, tool] : tools.filter((t: string) => t !== tool));
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('outputFormat', 'Output Format')}</Label>
                  <Select 
                    value={config.outputFormat || 'text'} 
                    onValueChange={(v) => updateConfig('outputFormat', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">{t('outputText', 'Free Text')}</SelectItem>
                      <SelectItem value="json">{t('outputJson', 'Structured JSON')}</SelectItem>
                      <SelectItem value="decision">{t('outputDecision', 'Decision (Yes/No)')}</SelectItem>
                      <SelectItem value="classification">{t('outputClassification', 'Classification')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('maxIterations', 'Max Tool Iterations')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={config.maxIterations || 5}
                    onChange={(e) => updateConfig('maxIterations', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Human Input Form Node Config */}
            {isHumanInputNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('humanInputConfig', 'Human Input Form')}</h4>
                
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/50">
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    {t('humanInputDesc', 'Workflow pauses here until a user submits the form. Configure the fields below.')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('formTitle', 'Form Title')}</Label>
                  <Input
                    value={config.formTitle || ''}
                    onChange={(e) => updateConfig('formTitle', e.target.value)}
                    placeholder={t('formTitlePlaceholder', 'e.g., Approve Installation Details')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('formInstructions', 'Instructions for User')}</Label>
                  <Textarea
                    value={config.formInstructions || ''}
                    onChange={(e) => updateConfig('formInstructions', e.target.value)}
                    placeholder={t('formInstructionsPlaceholder', 'Please review and fill in the required fields...')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('formFields', 'Form Fields')}</Label>
                  {(config.formFields || [{ name: '', type: 'text', required: true }]).map((field: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                      <Input
                        className="flex-1 h-7 text-xs"
                        value={field.name || ''}
                        onChange={(e) => {
                          const fields = [...(config.formFields || [{ name: '', type: 'text', required: true }])];
                          fields[idx] = { ...fields[idx], name: e.target.value };
                          updateConfig('formFields', fields);
                        }}
                        placeholder={t('fieldName', 'Field name')}
                      />
                      <Select 
                        value={field.type || 'text'} 
                        onValueChange={(v) => {
                          const fields = [...(config.formFields || [{ name: '', type: 'text', required: true }])];
                          fields[idx] = { ...fields[idx], type: v };
                          updateConfig('formFields', fields);
                        }}
                      >
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="number">Number</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full text-xs"
                    onClick={() => {
                      const fields = [...(config.formFields || [])];
                      fields.push({ name: '', type: 'text', required: false });
                      updateConfig('formFields', fields);
                    }}
                  >
                    + {t('addField', 'Add Field')}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>{t('assignTo', 'Assign To')}</Label>
                  <Select 
                    value={config.assignTo || 'manager'} 
                    onValueChange={(v) => updateConfig('assignTo', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{t('config.roles.manager', 'Manager')}</SelectItem>
                      <SelectItem value="admin">{t('config.roles.admin', 'Admin')}</SelectItem>
                      <SelectItem value="dispatcher">{t('config.roles.dispatcher', 'Dispatcher')}</SelectItem>
                      <SelectItem value="technician">{t('config.roles.technician', 'Technician')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('config.timeoutHours', 'Timeout (hours)')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={config.timeoutHours || 48}
                    onChange={(e) => updateConfig('timeoutHours', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Wait For Event Node Config */}
            {isWaitForEventNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('waitForEventConfig', 'Wait For Event')}</h4>
                
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50">
                  <p className="text-xs text-blue-700 dark:text-blue-300">
                    {t('waitForEventDesc', 'Pauses the workflow until a specific event occurs.')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('eventType', 'Event Type')}</Label>
                  <Select 
                    value={config.eventType || 'entity_status_change'} 
                    onValueChange={(v) => updateConfig('eventType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entity_status_change">{t('event.statusChange', 'Entity Status Change')}</SelectItem>
                      <SelectItem value="webhook_received">{t('event.webhookReceived', 'Webhook Received')}</SelectItem>
                      <SelectItem value="time_elapsed">{t('event.timeElapsed', 'Time Elapsed')}</SelectItem>
                      <SelectItem value="manual_signal">{t('event.manualSignal', 'Manual Signal')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('config.timeoutHours', 'Timeout (hours)')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={720}
                    value={config.timeoutHours || 72}
                    onChange={(e) => updateConfig('timeoutHours', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Loop Node Config */}
            {isLoopNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('loopConfig', 'Loop Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('loopType', 'Loop Type')}</Label>
                  <Select 
                    value={config.loopType || 'for'} 
                    onValueChange={(v) => updateConfig('loopType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="for">{t('loopFor', 'For (Fixed iterations)')}</SelectItem>
                      <SelectItem value="forEach">{t('loopForEach', 'For Each (Over collection)')}</SelectItem>
                      <SelectItem value="while">{t('loopWhile', 'While (Condition-based)')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('loopIterations', 'Max Iterations')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={1000}
                    value={config.iterations || 10}
                    onChange={(e) => updateConfig('iterations', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Email Node Config */}
            {isEmailNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('emailConfig', 'Email Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('emailTo', 'Recipient')}</Label>
                  <Select 
                    value={config.recipientType || 'contact'} 
                    onValueChange={(v) => updateConfig('recipientType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">{t('recipient.contact', 'Contact')}</SelectItem>
                      <SelectItem value="team">{t('recipient.team', 'Team')}</SelectItem>
                      <SelectItem value="custom">{t('recipient.custom', 'Custom Email')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.recipientType === 'custom' && (
                  <div className="space-y-2">
                    <Label>{t('emailAddress', 'Email Address')}</Label>
                    <Input
                      value={config.to || ''}
                      onChange={(e) => updateConfig('to', e.target.value)}
                      placeholder="user@example.com"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('emailSubject', 'Subject')}<RequiredIndicator /></Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('emailSubject', v)} />
                    )}
                  </div>
                  <Input
                    value={config.emailSubject || ''}
                    onChange={(e) => updateConfig('emailSubject', e.target.value)}
                    placeholder={t('emailSubjectPlaceholder', 'Email subject line...')}
                    className={cn(hasError('emailSubject') && 'border-destructive')}
                  />
                  {hasError('emailSubject') && <p className="text-xs text-destructive">{t('subjectRequired', 'Subject is required')}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('emailTemplate', 'Template / Body')}</Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('emailTemplate', v)} />
                    )}
                  </div>
                  <Textarea
                    value={config.emailTemplate || ''}
                    onChange={(e) => updateConfig('emailTemplate', e.target.value)}
                    placeholder={t('emailTemplatePlaceholder', 'Email content or template name...')}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Notification Node Config */}
            {isNotificationNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('notificationConfig', 'Notification Settings')}</h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('notificationTitle', 'Title')}<RequiredIndicator /></Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('notificationTitle', v)} />
                    )}
                  </div>
                  <Input
                    value={config.notificationTitle || ''}
                    onChange={(e) => updateConfig('notificationTitle', e.target.value)}
                    placeholder={t('notificationTitlePlaceholder', 'Notification title...')}
                    className={cn(hasError('notificationTitle') && 'border-destructive')}
                  />
                  {hasError('notificationTitle') && <p className="text-xs text-destructive">{t('titleRequired', 'Title is required')}</p>}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('notificationMessage', 'Message')}<RequiredIndicator /></Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('notificationMessage', v)} />
                    )}
                  </div>
                  <Textarea
                    value={config.notificationMessage || ''}
                    onChange={(e) => updateConfig('notificationMessage', e.target.value)}
                    placeholder={t('notificationMessagePlaceholder', 'Notification message...')}
                    rows={3}
                    className={cn(hasError('notificationMessage') && 'border-destructive')}
                  />
                  {hasError('notificationMessage') && <p className="text-xs text-destructive">{t('messageRequired', 'Message is required')}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t('notificationType', 'Type')}</Label>
                  <Select 
                    value={config.notificationType || 'info'} 
                    onValueChange={(v) => updateConfig('notificationType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">{t('notifType.info', 'Info')}</SelectItem>
                      <SelectItem value="success">{t('notifType.success', 'Success')}</SelectItem>
                      <SelectItem value="warning">{t('notifType.warning', 'Warning')}</SelectItem>
                      <SelectItem value="error">{t('notifType.error', 'Error')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('recipientType', 'Send To')}</Label>
                  <Select 
                    value={config.recipientType || 'team'} 
                    onValueChange={(v) => updateConfig('recipientType', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contact">{t('recipient.contact', 'Contact')}</SelectItem>
                      <SelectItem value="team">{t('recipient.team', 'Team')}</SelectItem>
                      <SelectItem value="custom">{t('recipient.custom', 'Custom')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Approval Node Config */}
            {isApprovalNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('approvalConfig', 'Approval Settings')}</h4>

                <div className="space-y-2">
                  <Label>{t('approvalTitle', 'Title')}</Label>
                  <Input
                    value={config.notificationTitle || ''}
                    onChange={(e) => updateConfig('notificationTitle', e.target.value)}
                    placeholder={t('approvalTitlePlaceholder', 'Approval request title...')}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('approvalMessage', 'Message')}</Label>
                  <Textarea
                    value={config.notificationMessage || ''}
                    onChange={(e) => updateConfig('notificationMessage', e.target.value)}
                    placeholder={t('approvalMessagePlaceholder', 'Describe what needs approval...')}
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('config.approverRole', 'Approver Role')}<RequiredIndicator /></Label>
                  <Select 
                    value={config.approverRole || 'manager'} 
                    onValueChange={(v) => updateConfig('approverRole', v)}
                  >
                    <SelectTrigger className={cn(hasError('approverRole') && 'border-destructive')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">{t('config.roles.manager', 'Manager')}</SelectItem>
                      <SelectItem value="admin">{t('config.roles.admin', 'Admin')}</SelectItem>
                      <SelectItem value="dispatcher">{t('config.roles.dispatcher', 'Dispatcher')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('config.timeoutHours', 'Timeout (hours)')}</Label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={config.timeoutHours || 24}
                    onChange={(e) => updateConfig('timeoutHours', parseInt(e.target.value))}
                  />
                </div>
              </div>
            )}

            {/* Delay Node Config */}
            {isDelayNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('delayConfig', 'Delay Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('delayDuration', 'Duration (ms)')}</Label>
                  <Input
                    type="number"
                    min={100}
                    max={86400000}
                    value={config.delayMs || 5000}
                    onChange={(e) => updateConfig('delayMs', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.delayMs ? `≈ ${Math.round((config.delayMs || 5000) / 1000)}s` : '≈ 5s'}
                  </p>
                </div>
              </div>
            )}

            {/* Parallel Node Config */}
            {isParallelNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('parallelConfig', 'Parallel Execution')}</h4>
                
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {t('parallelDesc', 'Splits execution into multiple parallel branches. All branches execute simultaneously.')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('maxConcurrency', 'Max Concurrent Branches')}</Label>
                  <Input
                    type="number"
                    min={2}
                    max={20}
                    value={config.maxConcurrency || 5}
                    onChange={(e) => updateConfig('maxConcurrency', parseInt(e.target.value))}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t('waitForAll', 'Wait For All')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('waitForAllDesc', 'Wait for all branches to complete before continuing')}
                    </p>
                  </div>
                  <Switch
                    checked={config.waitForAll ?? true}
                    onCheckedChange={(v) => updateConfig('waitForAll', v)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t('failFast', 'Fail Fast')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('failFastDesc', 'Stop all branches if one fails')}
                    </p>
                  </div>
                  <Switch
                    checked={config.failFast ?? false}
                    onCheckedChange={(v) => updateConfig('failFast', v)}
                  />
                </div>
              </div>
            )}

            {/* Try-Catch Node Config */}
            {isTryCatchNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('tryCatchConfig', 'Error Handling')}</h4>
                
                <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <p className="text-xs text-muted-foreground">
                    {t('tryCatchDesc', 'Wraps downstream nodes in error handling. If any node fails, execution routes to the error branch.')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('retryCount', 'Retry Count')}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={10}
                    value={config.retryCount || 0}
                    onChange={(e) => updateConfig('retryCount', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('retryDelay', 'Retry Delay (ms)')}</Label>
                  <Input
                    type="number"
                    min={0}
                    max={60000}
                    value={config.retryDelay || 1000}
                    onChange={(e) => updateConfig('retryDelay', parseInt(e.target.value))}
                  />
                  <p className="text-xs text-muted-foreground">
                    {config.retryDelay ? `≈ ${Math.round((config.retryDelay || 1000) / 1000)}s` : '≈ 1s'}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('onErrorAction', 'On Error')}</Label>
                  <Select 
                    value={config.onErrorAction || 'stop'} 
                    onValueChange={(v) => updateConfig('onErrorAction', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="stop">{t('errorAction.stop', 'Stop Workflow')}</SelectItem>
                      <SelectItem value="continue">{t('errorAction.continue', 'Continue (Skip)')}</SelectItem>
                      <SelectItem value="retry">{t('errorAction.retry', 'Retry')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t('logErrors', 'Log Errors')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('logErrorsDesc', 'Record errors in execution log')}
                    </p>
                  </div>
                  <Switch
                    checked={config.logErrors ?? true}
                    onCheckedChange={(v) => updateConfig('logErrors', v)}
                  />
                </div>
              </div>
            )}

            {/* Data Transfer Node Config */}
            {isDataTransferNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('dataTransferConfig', 'Data Transfer')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('sourceEntity', 'Source Entity')}</Label>
                  <Select 
                    value={config.sourceEntity || 'offer'} 
                    onValueChange={(v) => updateConfig('sourceEntity', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer">{t('entity.offer', 'Offer')}</SelectItem>
                      <SelectItem value="sale">{t('entity.sale', 'Sale')}</SelectItem>
                      <SelectItem value="service_order">{t('entity.serviceOrder', 'Service Order')}</SelectItem>
                      <SelectItem value="dispatch">{t('entity.dispatch', 'Dispatch')}</SelectItem>
                      <SelectItem value="contact">{t('entity.contact', 'Contact')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('targetEntity', 'Target Entity')}</Label>
                  <Select 
                    value={config.targetEntity || 'sale'} 
                    onValueChange={(v) => updateConfig('targetEntity', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="offer">{t('entity.offer', 'Offer')}</SelectItem>
                      <SelectItem value="sale">{t('entity.sale', 'Sale')}</SelectItem>
                      <SelectItem value="service_order">{t('entity.serviceOrder', 'Service Order')}</SelectItem>
                      <SelectItem value="dispatch">{t('entity.dispatch', 'Dispatch')}</SelectItem>
                      <SelectItem value="contact">{t('entity.contact', 'Contact')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('fieldMapping', 'Field Mapping (JSON)')}</Label>
                    {hasUpstreamNodes && (
                      <VariablePicker currentNodeId={nodeId} nodes={nodes} edges={edges} onSelect={(v) => insertVariable('fieldMapping', v)} />
                    )}
                  </div>
                  <Textarea
                    value={config.fieldMapping || ''}
                    onChange={(e) => updateConfig('fieldMapping', e.target.value)}
                    placeholder={'{"source_field": "target_field"}'}
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Dynamic Form Node Config */}
            {isDynamicFormNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('dynamicFormConfig', 'Dynamic Form')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('formId', 'Form ID')}</Label>
                  <Input
                    value={config.formId || ''}
                    onChange={(e) => updateConfig('formId', e.target.value)}
                    placeholder={t('formIdPlaceholder', 'Select or enter form ID')}
                  />
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t('autoSubmit', 'Auto-Submit')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('autoSubmitDesc', 'Submit form automatically with mapped data')}
                    </p>
                  </div>
                  <Switch
                    checked={config.autoSubmit ?? false}
                    onCheckedChange={(v) => updateConfig('autoSubmit', v)}
                  />
                </div>
              </div>
            )}

            {/* Webhook Node Config */}
            {isWebhookNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('webhookConfig', 'Webhook Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('webhookUrl', 'URL')}{!isTriggerNode && <RequiredIndicator />}</Label>
                  <Input
                    value={config.url || ''}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://example.com/webhook"
                    className={cn(hasError('url') && 'border-destructive')}
                  />
                  {hasError('url') && <p className="text-xs text-destructive">{t('urlRequired', 'URL is required')}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t('webhookMethod', 'Method')}</Label>
                  <Select 
                    value={config.method || 'POST'} 
                    onValueChange={(v) => updateConfig('method', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Scheduled Trigger Config */}
            {isScheduledNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('scheduledConfig', 'Schedule Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('cronExpression', 'Cron Expression')}<RequiredIndicator /></Label>
                  <Input
                    value={config.cronExpression || ''}
                    onChange={(e) => updateConfig('cronExpression', e.target.value)}
                    placeholder="0 9 * * 1-5"
                    className={cn(hasError('cronExpression') && 'border-destructive')}
                  />
                  {hasError('cronExpression') && <p className="text-xs text-destructive">{t('cronRequired', 'Cron expression is required')}</p>}
                  <p className="text-xs text-muted-foreground">
                    {t('cronHelp', 'e.g., "0 9 * * 1-5" = weekdays at 9am')}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>{t('timezone', 'Timezone')}</Label>
                  <Input
                    value={config.timezone || 'UTC'}
                    onChange={(e) => updateConfig('timezone', e.target.value)}
                    placeholder="UTC"
                  />
                </div>
              </div>
            )}

            {/* Database Node Config */}
            {isDatabaseNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('databaseConfig', 'Database Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('dbOperation', 'Operation')}</Label>
                  <Select 
                    value={config.operation || 'read'} 
                    onValueChange={(v) => updateConfig('operation', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="create">{t('dbOp.create', 'Create')}</SelectItem>
                      <SelectItem value="read">{t('dbOp.read', 'Read')}</SelectItem>
                      <SelectItem value="update">{t('dbOp.update', 'Update')}</SelectItem>
                      <SelectItem value="delete">{t('dbOp.delete', 'Delete')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('dbTable', 'Table')}<RequiredIndicator /></Label>
                  <Input
                    value={config.table || ''}
                    onChange={(e) => updateConfig('table', e.target.value)}
                    placeholder={t('dbTablePlaceholder', 'Table name...')}
                    className={cn(hasError('table') && 'border-destructive')}
                  />
                  {hasError('table') && <p className="text-xs text-destructive">{t('tableRequired', 'Table is required')}</p>}
                </div>
              </div>
            )}

            {/* API Node Config */}
            {isApiNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('apiConfig', 'API Settings')}</h4>
                
                <div className="space-y-2">
                  <Label>{t('apiUrl', 'URL')}<RequiredIndicator /></Label>
                  <Input
                    value={config.url || ''}
                    onChange={(e) => updateConfig('url', e.target.value)}
                    placeholder="https://api.example.com/endpoint"
                    className={cn(hasError('url') && 'border-destructive')}
                  />
                  {hasError('url') && <p className="text-xs text-destructive">{t('urlRequired', 'URL is required')}</p>}
                </div>

                <div className="space-y-2">
                  <Label>{t('apiMethod', 'Method')}</Label>
                  <Select 
                    value={config.method || 'GET'} 
                    onValueChange={(v) => updateConfig('method', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                      <SelectItem value="PUT">PUT</SelectItem>
                      <SelectItem value="DELETE">DELETE</SelectItem>
                      <SelectItem value="PATCH">PATCH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>{t('apiHeaders', 'Headers (JSON)')}</Label>
                  <Textarea
                    value={config.headers || ''}
                    onChange={(e) => updateConfig('headers', e.target.value)}
                    placeholder='{"Authorization": "Bearer ..."}'
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('apiBody', 'Body (JSON)')}</Label>
                  <Textarea
                    value={config.body || ''}
                    onChange={(e) => updateConfig('body', e.target.value)}
                    placeholder='{"key": "value"}'
                    rows={4}
                  />
                </div>
              </div>
            )}

            {/* Code / JavaScript Node Config */}
            {isCodeNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('config.codeEditor', 'Code (JavaScript)')}</h4>
                <Textarea
                  value={config.code || '// Write your JavaScript code here\nreturn { result: "hello" };'}
                  onChange={(e) => updateConfig('code', e.target.value)}
                  placeholder="// Access input.trigger, input.<nodeId>\nreturn { processed: true };"
                  rows={12}
                  className="font-mono text-xs leading-relaxed"
                  spellCheck={false}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t('config.codeHint', 'Use input.trigger for trigger data, input.<nodeId> for previous node outputs. Return a value to pass downstream.')}
                </p>
                <div className="flex items-center gap-2">
                  <Switch 
                    checked={config.continueOnError ?? false} 
                    onCheckedChange={(checked) => updateConfig('continueOnError', checked)} 
                  />
                  <Label className="text-xs">{t('config.continueOnError', 'Continue on Error')}</Label>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Status Tab - For Entity Nodes */}
          {isEntityNode && (
            <TabsContent value="status" className="p-4 space-y-4 mt-0">
              {isTriggerNode && (
                <>
                  <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200/50 dark:border-amber-800/50">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300">
                      <Zap className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('triggerCondition', 'Trigger Condition')}</span>
                      {isFromBackend && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {t('fromLookups', 'From Lookups')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      {t('triggerConditionDesc', 'Workflow starts when status changes from → to')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>{t('config.fromStatus', 'From Status')}</Label>
                      <Select 
                        value={config.fromStatus ?? 'any'} 
                        onValueChange={(v) => updateConfig('fromStatus', v === 'any' ? null : v)}
                        disabled={statusesLoading}
                      >
                        <SelectTrigger className="bg-background">
                          {statusesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-muted-foreground">{t('common.loading', 'Loading...')}</span>
                            </div>
                          ) : (
                            <SelectValue placeholder={t('config.anyStatus', 'Any')} />
                          )}
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="any">{t('config.anyStatus', 'Any')}</SelectItem>
                          {statuses.map((s: StatusOption & { name?: string }) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.name || t(s.labelKey, s.value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('config.toStatus', 'To Status')}</Label>
                      <Select 
                        value={config.toStatus ?? 'any'} 
                        onValueChange={(v) => updateConfig('toStatus', v === 'any' ? null : v)}
                        disabled={statusesLoading}
                      >
                        <SelectTrigger className="bg-background">
                          {statusesLoading ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-muted-foreground">{t('common.loading', 'Loading...')}</span>
                            </div>
                          ) : (
                            <SelectValue placeholder={t('config.anyStatus', 'Any')} />
                          )}
                        </SelectTrigger>
                        <SelectContent className="bg-popover z-50">
                          <SelectItem value="any">{t('config.anyStatus', 'Any')}</SelectItem>
                          {statuses.map((s: StatusOption & { name?: string }) => (
                            <SelectItem key={s.value} value={s.value}>
                              {s.name || t(s.labelKey, s.value)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Visual representation */}
                  <div className="flex items-center justify-center gap-3 py-4">
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium',
                      'bg-muted text-muted-foreground'
                    )}>
                      {config.fromStatus 
                        ? (statuses.find(s => s.value === config.fromStatus) as (StatusOption & { name?: string }) | undefined)?.name 
                          || t(`status.${entityType}.${config.fromStatus}`, config.fromStatus) 
                        : t('config.anyStatus', 'Any')}
                    </div>
                    <ArrowRight className="h-5 w-5 text-primary" />
                    <div className={cn(
                      'px-3 py-2 rounded-lg text-sm font-medium',
                      'bg-primary text-primary-foreground'
                    )}>
                      {config.toStatus 
                        ? (statuses.find(s => s.value === config.toStatus) as (StatusOption & { name?: string }) | undefined)?.name 
                          || t(`status.${entityType}.${config.toStatus}`, config.toStatus) 
                        : t('config.anyStatus', 'Any')}
                    </div>
                  </div>
                </>
              )}

              {isActionNode && (
                <>
                  <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200/50 dark:border-blue-800/50">
                    <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                      <ArrowRight className="h-4 w-4" />
                      <span className="text-sm font-medium">{t('statusUpdate', 'Status Update')}</span>
                      {isFromBackend && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                          {t('fromLookups', 'From Lookups')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                      {t('statusUpdateDesc', 'Set the new status when this action runs')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('config.newStatus', 'New Status')}</Label>
                    <Select 
                      value={config.newStatus ?? 'none'} 
                      onValueChange={(v) => updateConfig('newStatus', v === 'none' ? null : v)}
                      disabled={statusesLoading}
                    >
                      <SelectTrigger className="bg-background">
                        {statusesLoading ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-muted-foreground">{t('common.loading', 'Loading...')}</span>
                          </div>
                        ) : (
                          <SelectValue placeholder={t('config.selectStatus', 'Select status')} />
                        )}
                      </SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        <SelectItem value="none">{t('config.selectStatus', 'Select status')}</SelectItem>
                        {statuses.map((s: StatusOption) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.name || t(s.labelKey, s.value)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </TabsContent>
          )}

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="p-4 space-y-4 mt-0">
            {/* Approval Settings (only for non-approval nodes - approval nodes have their own section) */}
            {!isApprovalNode && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium">{t('approvalSettings', 'Approval')}</h4>
                
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div>
                    <p className="text-sm font-medium">{t('config.requiresApproval', 'Requires Approval')}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('config.requiresApprovalDesc', 'Pause workflow until approved')}
                    </p>
                  </div>
                  <Switch
                    checked={config.requiresApproval || false}
                    onCheckedChange={(v) => updateConfig('requiresApproval', v)}
                  />
                </div>

                {config.requiresApproval && (
                  <>
                    <div className="space-y-2">
                      <Label>{t('config.approverRole', 'Approver Role')}</Label>
                      <Select 
                        value={config.approverRole || 'manager'} 
                        onValueChange={(v) => updateConfig('approverRole', v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="manager">{t('config.roles.manager', 'Manager')}</SelectItem>
                          <SelectItem value="admin">{t('config.roles.admin', 'Admin')}</SelectItem>
                          <SelectItem value="dispatcher">{t('config.roles.dispatcher', 'Dispatcher')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>{t('config.timeoutHours', 'Timeout (hours)')}</Label>
                      <Input
                        type="number"
                        min={1}
                        max={168}
                        value={config.timeoutHours || 24}
                        onChange={(e) => updateConfig('timeoutHours', parseInt(e.target.value))}
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            <Separator />

            {/* Node Enabled */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
              <div>
                <p className="text-sm font-medium">{t('enabled', 'Enabled')}</p>
                <p className="text-xs text-muted-foreground">
                  {t('enabledDesc', 'Node will be executed when workflow runs')}
                </p>
              </div>
              <Switch
                checked={config.enabled !== false}
                onCheckedChange={(v) => updateConfig('enabled', v)}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border bg-card">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            {t('save', 'Save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
