import { useState, useEffect } from 'react';
import '../styles/workflow.css';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslation } from 'react-i18next';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dynamicFormsService } from '@/modules/dynamic-forms/services/dynamicFormsService';
import { usersApi } from '@/services/api/usersApi';
import { emailAccountsApi, type ConnectedEmailAccountDto } from '@/services/api/emailAccountsApi';
import { fetchOpenRouterModels, getOpenRouterKeys, type OpenRouterModel, type OpenRouterApiKey } from '@/services/openRouterModelsService';
import type { DynamicForm } from '@/modules/dynamic-forms/types';
import type { User } from '@/types/users';

// Static config constants (not mock data — these are fixed UI options)
const EMAIL_TEMPLATES = [
  { id: 'welcome', name: 'Welcome' },
  { id: 'offer', name: 'Offer' },
  { id: 'confirmation', name: 'Confirmation' },
  { id: 'reminder', name: 'Reminder' },
];
const RECIPIENT_TYPES = [
  { id: 'contact', name: 'Contact (entity contact)' },
  { id: 'assigned_user', name: 'Assigned User / Technician' },
  { id: 'created_by', name: 'Created By (owner)' },
  { id: 'manager', name: 'Manager' },
  { id: 'team', name: 'Team' },
  { id: 'custom', name: 'Custom Email' },
];
const DELAY_OPTIONS = [
  { id: 'immediate', name: 'Immediate' },
  { id: 'delay-1h', name: '1 hour' },
  { id: 'delay-24h', name: '24 hours' },
  { id: 'custom', name: 'Custom' },
];
// LLM_MODELS removed — now fetched dynamically from OpenRouter
const LLM_OBJECTIVES = [
  { id: 'write', name: 'Write' },
  { id: 'analyze', name: 'Analyze' },
  { id: 'personalize', name: 'Personalize' },
  { id: 'translate', name: 'Translate' },
];
const TRIGGER_TYPES = [
  { id: 'manual', name: 'Manual' },
  { id: 'webhook', name: 'Webhook' },
  { id: 'schedule', name: 'Schedule' },
  { id: 'event', name: 'Event' },
];
// CONDITION_TYPES removed — now entity-aware with field selector
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { LucideIcon, Save, X, Loader2 } from 'lucide-react';
import { getStatusesByEntityType, getEntityTypeFromNodeType, statusTriggerNodes, statusActionNodes } from '../data/entity-statuses';
import { ALL_ENTITY_TYPES, getEntityFields, getEntityLabel, getOperatorsForType, getVariableSnippets, toVariable, type WorkflowEntityType, type EntityField } from '../data/entity-fields';

interface NodeConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodeData: {
    id: string;
    label: string;
    type: string;
    icon: LucideIcon;
    description?: string;
  } | null;
  onSave: (config: any) => void;
}

export function NodeConfigurationModal({ isOpen, onClose, nodeData, onSave }: NodeConfigurationModalProps) {
  const [config, setConfig] = useState<any>({});
  const { t, i18n } = useTranslation();

  // Dynamic data from real APIs
  const [dynamicForms, setDynamicForms] = useState<DynamicForm[]>([]);
  const [workspaceUsers, setWorkspaceUsers] = useState<User[]>([]);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedEmailAccountDto[]>([]);
  const [openRouterModels, setOpenRouterModels] = useState<OpenRouterModel[]>([]);
  const [modelFilter, setModelFilter] = useState<'all' | 'free' | 'premium'>('all');
  const [modelSearch, setModelSearch] = useState('');
  const [loadingForms, setLoadingForms] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [userKeys, setUserKeys] = useState<OpenRouterApiKey[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    // Fetch forms
    setLoadingForms(true);
    dynamicFormsService.getAll({ status: 'released' }).then(forms => {
      setDynamicForms(forms);
    }).catch(() => setDynamicForms([])).finally(() => setLoadingForms(false));

    // Fetch users
    setLoadingUsers(true);
    usersApi.getAll().then(res => {
      setWorkspaceUsers(res.users || []);
    }).catch(() => setWorkspaceUsers([])).finally(() => setLoadingUsers(false));

    // Fetch connected email accounts
    setLoadingAccounts(true);
    emailAccountsApi.getAll().then(res => {
      setConnectedAccounts(res.data || []);
    }).catch(() => setConnectedAccounts([])).finally(() => setLoadingAccounts(false));

    // Fetch OpenRouter models
    setLoadingModels(true);
    fetchOpenRouterModels().then(models => {
      setOpenRouterModels(models);
    }).catch(() => setOpenRouterModels([])).finally(() => setLoadingModels(false));

    // Fetch user API keys
    getOpenRouterKeys().then(setUserKeys).catch(() => setUserKeys([]));
  }, [isOpen]);

  // Helpers: try nodeHelp.<type> keys first, then fall back to a component-level key like <type>.<key>
  const getHelpString = (key: string) => {
    if (!nodeData?.type) return '';
    const nodeHelpKey = `nodeHelp.${nodeData.type}.${key}`;
    const compKey = `${nodeData.type}.${key}`;
    if (i18n.exists(nodeHelpKey)) return t(nodeHelpKey);
    if (i18n.exists(compKey)) return (i18n.getResource(i18n.language, 'translation', compKey) as string) || '';
    return '';
  };

  const getHelpExamples = () => {
    if (!nodeData?.type) return null;
    const nodeHelpExamples = i18n.getResource(i18n.language, 'translation', `nodeHelp.${nodeData.type}.examples`);
    if (Array.isArray(nodeHelpExamples)) return nodeHelpExamples;
    const compExamples = i18n.getResource(i18n.language, 'translation', `${nodeData.type}.examples`);
    if (Array.isArray(compExamples)) return compExamples;
    return null;
  };

  const handleSave = () => {
    onSave(config);
    onClose();
  };

  // NEW: Status Trigger Configuration
  const renderStatusTriggerConfig = () => {
    const entityType = getEntityTypeFromNodeType(nodeData?.type || '');
    const statuses = entityType ? getStatusesByEntityType(entityType) : [];
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="triggerName">{t('config.triggerName')}</Label>
          <Input
            id="triggerName"
            value={config.triggerName || ''}
            onChange={(e) => setConfig({ ...config, triggerName: e.target.value })}
            placeholder={t('config.triggerNamePlaceholder')}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('config.fromStatus')}</Label>
            <Select 
              value={config.fromStatus || 'any'} 
              onValueChange={(value) => setConfig({ ...config, fromStatus: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('config.anyStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('config.anyStatus')}</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {t(status.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>{t('config.toStatus')}</Label>
            <Select 
              value={config.toStatus || 'any'} 
              onValueChange={(value) => setConfig({ ...config, toStatus: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('config.anyStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{t('config.anyStatus')}</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {t(status.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="triggerDescription">{t('description')}</Label>
          <Textarea
            id="triggerDescription"
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder={t('config.triggerDescriptionPlaceholder')}
            rows={3}
          />
        </div>
      </div>
    );
  };

  // NEW: Status Action Configuration
  const renderStatusActionConfig = () => {
    const entityType = getEntityTypeFromNodeType(nodeData?.type || '');
    const statuses = entityType ? getStatusesByEntityType(entityType) : [];
    
    return (
      <Tabs defaultValue="action" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="action">{t('config.tabs.action')}</TabsTrigger>
          <TabsTrigger value="execution">{t('config.tabs.execution')}</TabsTrigger>
        </TabsList>

        <TabsContent value="action" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="actionName">{t('config.actionName')}</Label>
            <Input
              id="actionName"
              value={config.actionName || ''}
              onChange={(e) => setConfig({ ...config, actionName: e.target.value })}
              placeholder={t('config.actionNamePlaceholder')}
            />
          </div>
          
          <div className="space-y-2">
            <Label>{t('config.newStatus')}</Label>
            <Select 
              value={config.newStatus || ''} 
              onValueChange={(value) => setConfig({ ...config, newStatus: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder={t('config.selectStatus')} />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {t(status.labelKey)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="actionDescription">{t('description')}</Label>
            <Textarea
              id="actionDescription"
              value={config.description || ''}
              onChange={(e) => setConfig({ ...config, description: e.target.value })}
              placeholder={t('config.actionDescriptionPlaceholder')}
              rows={3}
            />
          </div>
        </TabsContent>

        <TabsContent value="execution" className="space-y-4">
          <div className="space-y-2">
            <Label>{t('config.executionMode')}</Label>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div>
                <p className="text-sm font-medium">{t('config.requiresApproval')}</p>
                <p className="text-xs text-muted-foreground">{t('config.requiresApprovalDesc')}</p>
              </div>
              <Switch
                checked={config.requiresApproval || false}
                onCheckedChange={(checked) => setConfig({ ...config, requiresApproval: checked })}
              />
            </div>
          </div>
          
          {config.requiresApproval && (
            <div className="space-y-2">
              <Label htmlFor="approverRole">{t('config.approverRole')}</Label>
              <Select 
                value={config.approverRole || 'manager'} 
                onValueChange={(value) => setConfig({ ...config, approverRole: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">{t('config.roles.manager')}</SelectItem>
                  <SelectItem value="admin">{t('config.roles.admin')}</SelectItem>
                  <SelectItem value="dispatcher">{t('config.roles.dispatcher')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </TabsContent>
      </Tabs>
    );
  };

  // NEW: Notification Configuration
  const renderNotificationConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="notificationTitle">{t('config.notificationTitle')}</Label>
        <Input
          id="notificationTitle"
          value={config.notificationTitle || ''}
          onChange={(e) => setConfig({ ...config, notificationTitle: e.target.value })}
          placeholder={t('config.notificationTitlePlaceholder')}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notificationMessage">{t('config.notificationMessage')}</Label>
        <Textarea
          id="notificationMessage"
          value={config.notificationMessage || ''}
          onChange={(e) => setConfig({ ...config, notificationMessage: e.target.value })}
          placeholder={t('config.notificationMessagePlaceholder')}
          rows={4}
        />
        <div className="space-y-1">
          <p className="text-[11px] font-medium text-muted-foreground">{t('config.insertVariable', 'Insert Variable')}:</p>
          <div className="flex flex-wrap gap-1 max-h-[60px] overflow-y-auto">
            {getVariableSnippets().slice(0, 12).map((v, i) => (
              <button key={i} type="button"
                onClick={() => setConfig({ ...config, notificationMessage: (config.notificationMessage || '') + ' ' + v.variable })}
                className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-muted rounded border border-border/30 text-muted-foreground hover:text-foreground transition-colors font-mono"
                title={v.variable}>
                {v.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('config.variablesHint')}</p>
      </div>
      
      <div className="space-y-2">
        <Label>{t('config.notificationType')}</Label>
        <Select 
          value={config.notificationType || 'info'} 
          onValueChange={(value) => setConfig({ ...config, notificationType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="info">{t('config.notificationTypes.info')}</SelectItem>
            <SelectItem value="success">{t('config.notificationTypes.success')}</SelectItem>
            <SelectItem value="warning">{t('config.notificationTypes.warning')}</SelectItem>
            <SelectItem value="message">{t('config.notificationTypes.message')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label>{t('config.recipients')}</Label>
        <Select 
          value={config.recipientType || 'assigned_user'} 
          onValueChange={(value) => setConfig({ ...config, recipientType: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="assigned_user">{t('config.recipientTypes.assignedUser')}</SelectItem>
            <SelectItem value="created_by">{t('config.recipientTypes.createdBy')}</SelectItem>
            <SelectItem value="manager">{t('config.recipientTypes.manager')}</SelectItem>
            <SelectItem value="all_technicians">{t('config.recipientTypes.allTechnicians')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  // NEW: Approval Configuration
  const renderApprovalConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="approvalTitle">{t('config.approvalTitle')}</Label>
        <Input
          id="approvalTitle"
          value={config.approvalTitle || ''}
          onChange={(e) => setConfig({ ...config, approvalTitle: e.target.value })}
          placeholder={t('config.approvalTitlePlaceholder')}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="approvalMessage">{t('config.approvalMessage')}</Label>
        <Textarea
          id="approvalMessage"
          value={config.approvalMessage || ''}
          onChange={(e) => setConfig({ ...config, approvalMessage: e.target.value })}
          placeholder={t('config.approvalMessagePlaceholder')}
          rows={4}
        />
      </div>
      
      <div className="space-y-2">
        <Label>{t('config.approvers')}</Label>
        <Select 
          value={config.approverRole || 'manager'} 
          onValueChange={(value) => setConfig({ ...config, approverRole: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="manager">{t('config.roles.manager')}</SelectItem>
            <SelectItem value="admin">{t('config.roles.admin')}</SelectItem>
            <SelectItem value="dispatcher">{t('config.roles.dispatcher')}</SelectItem>
            <Separator className="my-1" />
            {loadingUsers ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('loading', 'Loading...')}</div>
            ) : workspaceUsers.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                <div className="flex items-center gap-2">
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="text-muted-foreground text-[10px]">{user.role || user.roles?.[0]?.name || ''}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="timeoutHours">{t('config.timeoutHours')}</Label>
        <Input
          id="timeoutHours"
          type="number"
          min="1"
          max="168"
          value={config.timeoutHours || 24}
          onChange={(e) => setConfig({ ...config, timeoutHours: parseInt(e.target.value) })}
        />
        <p className="text-xs text-muted-foreground">{t('config.timeoutHoursDesc')}</p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('config.onApproved')}</Label>
          <Select 
            value={config.onApproved || 'continue'} 
            onValueChange={(value) => setConfig({ ...config, onApproved: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="continue">{t('config.approvalActions.continue')}</SelectItem>
              <SelectItem value="skip_next">{t('config.approvalActions.skipNext')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Label>{t('config.onRejected')}</Label>
          <Select 
            value={config.onRejected || 'stop'} 
            onValueChange={(value) => setConfig({ ...config, onRejected: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="stop">{t('config.approvalActions.stop')}</SelectItem>
              <SelectItem value="continue">{t('config.approvalActions.continue')}</SelectItem>
              <SelectItem value="notify">{t('config.approvalActions.notifyAndStop')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );

  const renderBusinessProcessConfig = () => (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">{t('general')}</TabsTrigger>
        <TabsTrigger value="fields">{t('fields')}</TabsTrigger>
        <TabsTrigger value="validation">{t('validation')}</TabsTrigger>
      </TabsList>

      <TabsContent value="general" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('processName')}</Label>
          <Input
            id="name"
            value={config.name || nodeData?.label || ''}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Textarea
            id="description"
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder={t('processDescriptionPlaceholder')}
          />
        </div>
      </TabsContent>

      <TabsContent value="fields" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('requiredFields')}</Label>
          <div className="space-y-2">
            {[{ k: 'name', d: 'Name' }, { k: 'email', d: 'Email' }, { k: 'phone', d: 'Phone' }, { k: 'company', d: 'Company' }].map((field) => (
              <div key={field.k} className="flex items-center justify-between">
                <span className="text-sm">{t(field.k) || field.d}</span>
                <Switch
                  checked={config.requiredFields?.[field.k] || false}
                  onCheckedChange={(checked) =>
                    setConfig({
                      ...config,
                      requiredFields: { ...(config.requiredFields || {}), [field.k]: checked },
                    })
                  }
                />
              </div>
            ))}
          </div>
        </div>
      </TabsContent>

      <TabsContent value="validation" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('validation')}</Label>
          <Textarea
            placeholder={t('validation') + '...'}
            value={config.validationRules || ''}
            onChange={(e) => setConfig({ ...config, validationRules: e.target.value })}
          />
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderEmailConfig = () => (
    <Tabs defaultValue="account" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="account">{t('config.account', 'Account')}</TabsTrigger>
        <TabsTrigger value="template">{t('templateTab')}</TabsTrigger>
        <TabsTrigger value="recipients">{t('recipientsTab')}</TabsTrigger>
        <TabsTrigger value="timing">{t('timingTab')}</TabsTrigger>
      </TabsList>

      <TabsContent value="account" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('config.sendFrom', 'Send From')}</Label>
          <Select value={config.emailAccountId || ''} onValueChange={(value) => setConfig({ ...config, emailAccountId: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('config.selectEmailAccount', 'Select connected email account...')} />
            </SelectTrigger>
            <SelectContent>
              {loadingAccounts ? (
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('loading', 'Loading...')}</div>
              ) : connectedAccounts.length === 0 ? (
                <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('config.noEmailAccounts', 'No email accounts connected. Go to Email & Calendar settings to connect one.')}</div>
              ) : connectedAccounts.map((account) => (
                <SelectItem key={account.id} value={account.id}>
                  <div className="flex items-center gap-2">
                    <span>{account.handle}</span>
                    <span className="text-muted-foreground text-[10px] capitalize">{account.provider}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">{t('config.sendFromHint', 'Emails will be sent using this connected account')}</p>
        </div>
      </TabsContent>

      <TabsContent value="template" className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subject">{t('subject')}</Label>
          <Input
            id="subject"
            value={config.subject || ''}
            onChange={(e) => setConfig({ ...config, subject: e.target.value })}
            placeholder={t('subjectPlaceholder')}
          />
          <div className="flex flex-wrap gap-1">
            {[
              { var: '{{dispatch.dispatchNumber}}', lbl: 'Dispatch #' },
              { var: '{{offer.offerNumber}}', lbl: 'Offer #' },
              { var: '{{sale.saleNumber}}', lbl: 'Sale #' },
              { var: '{{contact.name}}', lbl: 'Contact Name' },
            ].map((v, i) => (
              <button key={i} type="button" onClick={() => setConfig({ ...config, subject: (config.subject || '') + ' ' + v.var })}
                className="px-1.5 py-0.5 text-[9px] bg-muted/40 hover:bg-muted rounded border border-border/30 text-muted-foreground hover:text-foreground transition-colors font-mono">
                {v.lbl}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="template">{t('template')}</Label>
          <Select value={config.template || ''} onValueChange={(value) => setConfig({ ...config, template: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('chooseTemplate')} />
            </SelectTrigger>
            <SelectContent>
              {EMAIL_TEMPLATES.map((tpl) => (
                <SelectItem key={tpl.id} value={tpl.id}>
                  {String(t(`template.${tpl.id}`, { defaultValue: tpl.name }))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">{t('contentLabel')}</Label>
          <Textarea
            id="content"
            value={config.content || ''}
            onChange={(e) => setConfig({ ...config, content: e.target.value })}
            placeholder={t('contentPlaceholder')}
            rows={6}
          />
          {/* Variable insertion helper */}
          <div className="space-y-1">
            <p className="text-[11px] font-medium text-muted-foreground">{t('config.insertVariable', 'Insert Variable')}:</p>
            <div className="flex flex-wrap gap-1 max-h-[80px] overflow-y-auto">
              {getVariableSnippets().map((v, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setConfig({ ...config, content: (config.content || '') + ' ' + v.variable })}
                  className="px-1.5 py-0.5 text-[10px] bg-muted/50 hover:bg-muted rounded border border-border/30 text-muted-foreground hover:text-foreground transition-colors font-mono"
                  title={v.variable}
                >
                  {v.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="recipients" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('recipientType')}</Label>
          <Select value={config.recipientType || ''} onValueChange={(value) => setConfig({ ...config, recipientType: value })}>
            <SelectTrigger>
              <SelectValue placeholder={t('chooseTemplate')} />
            </SelectTrigger>
            <SelectContent>
              {RECIPIENT_TYPES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {String(t(`recipient.${r.id}`, { defaultValue: r.name }))}
                </SelectItem>
              ))}
              <Separator className="my-1" />
              {loadingUsers ? (
                <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('loading', 'Loading...')}</div>
              ) : workspaceUsers.map((user) => (
                <SelectItem key={`user-${user.id}`} value={`user:${user.id}`}>
                  <div className="flex items-center gap-2">
                    <span>{user.firstName} {user.lastName}</span>
                    <span className="text-muted-foreground text-[10px]">{user.role || user.roles?.[0]?.name || ''}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>

      <TabsContent value="timing" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('sendDelay')}</Label>
          <Select value={config.timing || 'immediate'} onValueChange={(value) => setConfig({ ...config, timing: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DELAY_OPTIONS.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {String(t(`delay.${d.id.replace('delay-', '')}`, { defaultValue: d.name }))}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TabsContent>
    </Tabs>
  );

  const renderLLMConfig = () => {
    const filteredModels = openRouterModels.filter(m => {
      if (modelFilter === 'free' && !m.isFree) return false;
      if (modelFilter === 'premium' && m.isFree) return false;
      if (modelSearch.trim()) {
        const q = modelSearch.toLowerCase();
        return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q) || m.provider.toLowerCase().includes(q);
      }
      return true;
    }).slice(0, 100); // Limit for performance

    // userKeys is now from state (fetched in useEffect)

    return (
      <Tabs defaultValue="model" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="model">{t('model')}</TabsTrigger>
          <TabsTrigger value="keys">{t('config.apiKeys', 'API Keys')}</TabsTrigger>
          <TabsTrigger value="prompt">{t('prompt')}</TabsTrigger>
          <TabsTrigger value="parameters">{t('parameters')}</TabsTrigger>
        </TabsList>

        <TabsContent value="model" className="space-y-4">
          {/* Model tier filter */}
          <div className="flex gap-1.5">
            {(['all', 'free', 'premium'] as const).map(tier => (
              <button
                key={tier}
                onClick={() => setModelFilter(tier)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  modelFilter === tier
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {tier === 'all' ? t('config.allModels') : tier === 'free' ? `🆓 ${t('config.free')}` : `⭐ ${t('config.premium')}`}
              </button>
            ))}
          </div>

          {/* Model search */}
          <div className="space-y-2">
            <Input
              placeholder={t('config.searchModels', 'Search models (e.g. claude, gpt, llama)...')}
              value={modelSearch}
              onChange={e => setModelSearch(e.target.value)}
              className="h-8 text-xs"
            />
          </div>

          {/* Model selector */}
          <div className="space-y-2">
            <Label>{t('llmModel')}</Label>
            <Select value={config.model || ''} onValueChange={(value) => setConfig({ ...config, model: value })}>
              <SelectTrigger>
                <SelectValue placeholder={loadingModels ? t('loading', 'Loading models...') : t('chooseModelPlaceholder')} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {loadingModels ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
                    <Loader2 className="h-3 w-3 animate-spin" />{t('loading', 'Loading...')}
                  </div>
                ) : filteredModels.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    {t('config.noModelsFound', 'No models found')}
                  </div>
                ) : filteredModels.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{m.name}</span>
                      {m.isFree && <span className="text-[9px] bg-success/10 text-success px-1 rounded shrink-0">{t('config.free').toUpperCase()}</span>}
                      {!m.isFree && <span className="text-[9px] text-muted-foreground shrink-0">${(parseFloat(m.pricing.prompt) * 1_000_000).toFixed(2)}/M</span>}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {config.model && (
              <p className="text-[11px] text-muted-foreground font-mono">{config.model}</p>
            )}
          </div>

          {/* Objective */}
          <div className="space-y-2">
            <Label>{t('objectiveLabel')}</Label>
            <Select value={config.objective || ''} onValueChange={(value) => setConfig({ ...config, objective: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('objectivePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {LLM_OBJECTIVES.map((o) => (
                  <SelectItem key={o.id} value={o.id}>
                    {o.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </TabsContent>

        <TabsContent value="keys" className="space-y-4">
          <div className="p-3 bg-muted/20 rounded-md text-xs text-muted-foreground">
            {t('config.apiKeysHint', 'API keys from Settings → Integrations → OpenRouter are used automatically. Free models work without a key but with lower rate limits.')}
          </div>
          {userKeys.length > 0 ? (
            <div className="space-y-2">
              {userKeys.map((k, i) => (
                <div key={k.id} className="flex items-center gap-2 p-2 rounded border border-border/40 bg-muted/10">
                  <span className="text-[10px] font-medium text-primary bg-primary/5 px-1.5 py-0.5 rounded">
                    {i === 0 ? t('config.primary') : t('config.fallback', { index: i })}
                  </span>
                  <span className="text-xs text-foreground truncate flex-1">{k.label}</span>
                  <span className="text-[10px] text-muted-foreground font-mono">{k.apiKey.slice(0, 8)}...{k.apiKey.slice(-4)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 border border-dashed border-border rounded-lg text-center">
              <p className="text-xs text-muted-foreground">{t('config.noApiKeys', 'No API keys configured.')}</p>
              <p className="text-[11px] text-muted-foreground mt-1">
                {t('config.goToSettings', 'Go to Settings → Integrations → OpenRouter to add keys.')}
              </p>
            </div>
          )}

          {/* Fallback model */}
          <Separator />
          <div className="space-y-2">
            <Label>{t('config.fallbackModel', 'Fallback Model')}</Label>
            <Select value={config.fallbackModel || ''} onValueChange={(value) => setConfig({ ...config, fallbackModel: value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('config.selectFallback', 'Select fallback model (optional)...')} />
              </SelectTrigger>
              <SelectContent className="max-h-[200px]">
                <SelectItem value="none">{t('config.noFallback', 'No fallback')}</SelectItem>
                {openRouterModels.filter(m => m.isFree).slice(0, 30).map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <span className="truncate">{m.name}</span>
                      <span className="text-[9px] bg-success/10 text-success px-1 rounded shrink-0">{t('config.free').toUpperCase()}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">{t('config.fallbackHint', 'Used when the primary model fails or is rate-limited')}</p>
          </div>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="systemPrompt">{t('systemPromptLabel')}</Label>
            <Textarea
              id="systemPrompt"
              value={config.systemPrompt || ''}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              placeholder={t('systemPromptPlaceholder')}
              rows={4}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userPrompt">{t('userPromptLabel')}</Label>
            <Textarea
              id="userPrompt"
              value={config.userPrompt || ''}
              onChange={(e) => setConfig({ ...config, userPrompt: e.target.value })}
              placeholder={t('userPromptPlaceholder')}
              rows={4}
            />
          </div>
        </TabsContent>

        <TabsContent value="parameters" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="temperature">{t('temperature')}: {config.temperature ?? 0.7}</Label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.temperature ?? 0.7}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="maxTokens">{t('maxTokens')}</Label>
            <Input
              id="maxTokens"
              type="number"
              value={config.maxTokens || 1000}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
            />
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  // Dynamic Form configuration
  const renderDynamicFormConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('config.formId', 'Select Form')}</Label>
        <Select
          value={config.formId || ''}
          onValueChange={(value) => setConfig({ ...config, formId: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('config.formSelectPlaceholder', 'Choose a form...')} />
          </SelectTrigger>
          <SelectContent>
            {loadingForms ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('loading', 'Loading...')}</div>
            ) : dynamicForms.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">{t('config.noForms', 'No forms available')}</div>
            ) : dynamicForms.map((form) => (
              <SelectItem key={form.id} value={String(form.id)}>
                {i18n.language === 'fr' ? form.name_fr || form.name_en : form.name_en}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">{t('config.formIdHint', 'Select a form from Dynamic Forms module')}</p>
      </div>
      <div className="space-y-2">
        <Label>{t('config.formAction', 'Action')}</Label>
        <Select value={config.formAction || 'collect'} onValueChange={(value) => setConfig({ ...config, formAction: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="collect">{t('config.formCollect', 'Collect Response (pause workflow)')}</SelectItem>
            <SelectItem value="prefill">{t('config.formPrefill', 'Pre-fill & Send Form')}</SelectItem>
            <SelectItem value="read">{t('config.formRead', 'Read Last Response')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.formAction === 'prefill' && (
        <div className="space-y-2">
          <Label>{t('config.prefillMapping', 'Data Mapping')}</Label>
          <Textarea
            value={config.prefillMapping || ''}
            onChange={(e) => setConfig({ ...config, prefillMapping: e.target.value })}
            placeholder={'field_id: {{trigger.contactName}}\nemail: {{trigger.email}}'}
            rows={4}
          />
          <p className="text-[11px] text-muted-foreground">{t('config.prefillHint', 'Map form fields to workflow variables')}</p>
        </div>
      )}
      <div className="space-y-2">
        <Label>{t('config.assignTo', 'Assign To')}</Label>
        <Select
          value={config.assignTo || ''}
          onValueChange={(value) => setConfig({ ...config, assignTo: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t('config.assignToUserPlaceholder', 'Select a user...')} />
          </SelectTrigger>
          <SelectContent>
            {loadingUsers ? (
              <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground"><Loader2 className="h-3 w-3 animate-spin" />{t('loading', 'Loading...')}</div>
            ) : workspaceUsers.map((user) => (
              <SelectItem key={user.id} value={String(user.id)}>
                <div className="flex items-center gap-2">
                  <span>{user.firstName} {user.lastName}</span>
                  <span className="text-muted-foreground text-[10px]">{user.role || user.roles?.[0]?.name || ''}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-[11px] text-muted-foreground">{t('config.assignToHint', 'Select a user to assign this form to')}</p>
      </div>
    </div>
  );

  // Data Transfer configuration
  const renderDataTransferConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('config.sourceModule', 'Source Module')}</Label>
        <Select value={config.sourceModule || ''} onValueChange={(value) => setConfig({ ...config, sourceModule: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t('config.selectModule', 'Select module')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="contacts">{t('config.mod.contacts', 'Contacts')}</SelectItem>
            <SelectItem value="offers">{t('config.mod.offers', 'Offers')}</SelectItem>
            <SelectItem value="sales">{t('config.mod.sales', 'Sales')}</SelectItem>
            <SelectItem value="service_orders">{t('config.mod.serviceOrders', 'Service Orders')}</SelectItem>
            <SelectItem value="dispatches">{t('config.mod.dispatches', 'Dispatches')}</SelectItem>
            <SelectItem value="dynamic_forms">{t('config.mod.dynamicForms', 'Dynamic Forms')}</SelectItem>
            <SelectItem value="stock">{t('config.mod.stock', 'Stock / Inventory')}</SelectItem>
            <SelectItem value="tasks">{t('config.mod.tasks', 'Tasks')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('config.operation', 'Operation')}</Label>
        <Select value={config.operation || 'read'} onValueChange={(value) => setConfig({ ...config, operation: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="read">{t('config.op.read', 'Read / Query')}</SelectItem>
            <SelectItem value="create">{t('config.op.create', 'Create Record')}</SelectItem>
            <SelectItem value="update">{t('config.op.update', 'Update Record')}</SelectItem>
            <SelectItem value="delete">{t('config.op.delete', 'Delete Record')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>{t('config.filter', 'Filter / Conditions')}</Label>
        <Textarea
          value={config.filter || ''}
          onChange={(e) => setConfig({ ...config, filter: e.target.value })}
          placeholder={'id = {{trigger.entityId}}\nstatus = "active"'}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label>{t('config.dataMapping', 'Field Mapping')}</Label>
        <Textarea
          value={config.dataMapping || ''}
          onChange={(e) => setConfig({ ...config, dataMapping: e.target.value })}
          placeholder={'name: {{step1.contactName}}\nemail: {{step1.email}}'}
          rows={4}
        />
        <p className="text-[11px] text-muted-foreground">{t('config.dataMappingHint', 'Map fields for create/update. Use {{variable}} syntax.')}</p>
      </div>
    </div>
  );

  // HTTP Request configuration — full config with response mapping
  const renderHttpRequestConfig = () => (
    <Tabs defaultValue="request" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="request">{t('config.request', 'Request')}</TabsTrigger>
        <TabsTrigger value="headers">{t('config.headers', 'Headers')}</TabsTrigger>
        <TabsTrigger value="auth">{t('config.auth', 'Auth')}</TabsTrigger>
        <TabsTrigger value="response">{t('config.response', 'Response')}</TabsTrigger>
      </TabsList>

      <TabsContent value="request" className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-2 col-span-1">
            <Label>{t('config.httpMethod', 'Method')}</Label>
            <Select value={config.httpMethod || 'GET'} onValueChange={(value) => setConfig({ ...config, httpMethod: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GET">GET</SelectItem>
                <SelectItem value="POST">POST</SelectItem>
                <SelectItem value="PUT">PUT</SelectItem>
                <SelectItem value="PATCH">PATCH</SelectItem>
                <SelectItem value="DELETE">DELETE</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-2">
            <Label>{t('config.url', 'URL')}</Label>
            <Input
              value={config.url || ''}
              onChange={(e) => setConfig({ ...config, url: e.target.value })}
              placeholder="https://api.example.com/endpoint"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t('config.queryParams', 'Query Parameters')}</Label>
          <Textarea
            value={config.queryParams || ''}
            onChange={(e) => setConfig({ ...config, queryParams: e.target.value })}
            placeholder={'page: 1\nlimit: 50\nfilter: {{trigger.status}}'}
            rows={3}
          />
          <p className="text-[11px] text-muted-foreground">{t('config.queryParamsHint', 'key: value format, one per line. Supports {{variable}} syntax.')}</p>
        </div>
        {config.httpMethod !== 'GET' && (
          <div className="space-y-2">
            <Label>{t('config.contentType', 'Content Type')}</Label>
            <Select value={config.contentType || 'json'} onValueChange={(value) => setConfig({ ...config, contentType: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="json">application/json</SelectItem>
                <SelectItem value="form">application/x-www-form-urlencoded</SelectItem>
                <SelectItem value="multipart">multipart/form-data</SelectItem>
                <SelectItem value="xml">application/xml</SelectItem>
                <SelectItem value="text">text/plain</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
        {config.httpMethod !== 'GET' && (
          <div className="space-y-2">
            <Label>{t('config.requestBody', 'Body')}</Label>
            <Textarea
              value={config.requestBody || ''}
              onChange={(e) => setConfig({ ...config, requestBody: e.target.value })}
              placeholder={'{\n  "name": "{{trigger.contactName}}",\n  "email": "{{trigger.email}}"\n}'}
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>{t('config.timeout', 'Timeout (seconds)')}</Label>
          <Input
            type="number"
            value={config.timeout || 30}
            onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })}
            min={1}
            max={300}
          />
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.followRedirects ?? true}
            onCheckedChange={(checked) => setConfig({ ...config, followRedirects: checked })}
          />
          <Label>{t('config.followRedirects', 'Follow Redirects')}</Label>
        </div>
        <div className="flex items-center gap-2">
          <Switch
            checked={config.retryOnFailure ?? false}
            onCheckedChange={(checked) => setConfig({ ...config, retryOnFailure: checked })}
          />
          <Label>{t('config.retryOnFailure', 'Retry on Failure')}</Label>
        </div>
        {config.retryOnFailure && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>{t('config.retryCount', 'Max Retries')}</Label>
              <Input type="number" value={config.retryCount || 3} onChange={(e) => setConfig({ ...config, retryCount: parseInt(e.target.value) })} min={1} max={10} />
            </div>
            <div className="space-y-2">
              <Label>{t('config.retryDelay', 'Retry Delay (ms)')}</Label>
              <Input type="number" value={config.retryDelay || 1000} onChange={(e) => setConfig({ ...config, retryDelay: parseInt(e.target.value) })} min={100} />
            </div>
          </div>
        )}
      </TabsContent>

      <TabsContent value="headers" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('config.customHeaders', 'Custom Headers')}</Label>
          <Textarea
            value={config.customHeaders || ''}
            onChange={(e) => setConfig({ ...config, customHeaders: e.target.value })}
            placeholder={'Content-Type: application/json\nAccept: application/json\nX-Custom-Header: {{trigger.apiKey}}'}
            rows={6}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">{t('config.headersHint', 'Header: Value format, one per line. Supports {{variable}} syntax.')}</p>
        </div>
      </TabsContent>

      <TabsContent value="auth" className="space-y-4">
        <div className="space-y-2">
          <Label>{t('config.authType', 'Auth Type')}</Label>
          <Select value={config.authType || 'none'} onValueChange={(value) => setConfig({ ...config, authType: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t('config.noAuth', 'None')}</SelectItem>
              <SelectItem value="bearer">{t('config.bearer', 'Bearer Token')}</SelectItem>
              <SelectItem value="basic">{t('config.basic', 'Basic Auth')}</SelectItem>
              <SelectItem value="api_key">{t('config.apiKey', 'API Key Header')}</SelectItem>
              <SelectItem value="oauth2">{t('config.oauth2', 'OAuth 2.0 Token')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {config.authType === 'bearer' && (
          <div className="space-y-2">
            <Label>{t('config.bearerToken', 'Token')}</Label>
            <Input
              type="password"
              value={config.bearerToken || ''}
              onChange={(e) => setConfig({ ...config, bearerToken: e.target.value })}
              placeholder="Bearer token or {{variable}}"
            />
          </div>
        )}
        {config.authType === 'basic' && (
          <>
            <div className="space-y-2">
              <Label>{t('config.username', 'Username')}</Label>
              <Input value={config.username || ''} onChange={(e) => setConfig({ ...config, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('config.password', 'Password')}</Label>
              <Input type="password" value={config.password || ''} onChange={(e) => setConfig({ ...config, password: e.target.value })} />
            </div>
          </>
        )}
        {config.authType === 'api_key' && (
          <>
            <div className="space-y-2">
              <Label>{t('config.apiKeyHeader', 'Header Name')}</Label>
              <Input value={config.apiKeyHeader || 'X-API-Key'} onChange={(e) => setConfig({ ...config, apiKeyHeader: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('config.apiKeyValue', 'API Key Value')}</Label>
              <Input type="password" value={config.apiKeyValue || ''} onChange={(e) => setConfig({ ...config, apiKeyValue: e.target.value })} placeholder="Key or {{variable}}" />
            </div>
          </>
        )}
        {config.authType === 'oauth2' && (
          <div className="space-y-2">
            <Label>{t('config.oauth2Token', 'Access Token')}</Label>
            <Input type="password" value={config.oauth2Token || ''} onChange={(e) => setConfig({ ...config, oauth2Token: e.target.value })} placeholder="OAuth 2.0 access token or {{variable}}" />
          </div>
        )}
      </TabsContent>

      <TabsContent value="response" className="space-y-4">
        <div className="p-3 bg-muted/30 rounded-md text-xs text-muted-foreground">
          {t('config.responseHint', 'Map response fields to workflow variables for use in downstream steps.')}
        </div>
        <div className="space-y-2">
          <Label>{t('config.responseFormat', 'Expected Response Format')}</Label>
          <Select value={config.responseFormat || 'json'} onValueChange={(value) => setConfig({ ...config, responseFormat: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">JSON</SelectItem>
              <SelectItem value="xml">XML</SelectItem>
              <SelectItem value="text">Plain Text</SelectItem>
              <SelectItem value="binary">Binary / File</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{t('config.responseMapping', 'Response Field Mapping')}</Label>
          <Textarea
            value={config.responseMapping || ''}
            onChange={(e) => setConfig({ ...config, responseMapping: e.target.value })}
            placeholder={'userId: $.data.id\nuserName: $.data.name\ntotalCount: $.meta.total\nitems: $.data.results[]'}
            rows={5}
            className="font-mono text-xs"
          />
          <p className="text-[11px] text-muted-foreground">{t('config.responseMappingHint', 'variable_name: $.json.path — Use JSONPath to extract values from the response.')}</p>
        </div>
        <div className="space-y-2">
          <Label>{t('config.successCondition', 'Success Condition')}</Label>
          <Select value={config.successCondition || 'status_2xx'} onValueChange={(value) => setConfig({ ...config, successCondition: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status_2xx">{t('config.status2xx', 'Status 2xx (any success)')}</SelectItem>
              <SelectItem value="status_200">{t('config.status200', 'Status 200 only')}</SelectItem>
              <SelectItem value="status_201">{t('config.status201', 'Status 201 (Created)')}</SelectItem>
              <SelectItem value="body_check">{t('config.bodyCheck', 'Check response body')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {config.successCondition === 'body_check' && (
          <div className="space-y-2">
            <Label>{t('config.bodyCheckExpression', 'Body Check Expression')}</Label>
            <Input
              value={config.bodyCheckExpression || ''}
              onChange={(e) => setConfig({ ...config, bodyCheckExpression: e.target.value })}
              placeholder={'$.success == true'}
            />
          </div>
        )}
        <div className="flex items-center gap-2">
          <Switch
            checked={config.storeFullResponse ?? false}
            onCheckedChange={(checked) => setConfig({ ...config, storeFullResponse: checked })}
          />
          <Label>{t('config.storeFullResponse', 'Store Full Response (headers + body)')}</Label>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Code / JavaScript node configuration
  const renderCodeConfig = () => {
    const defaultCode = `// Access previous node outputs via the 'input' object
// Available entity fields:
// Dispatch: id, dispatchNumber, status, priority, scheduledDate, siteAddress,
//   contact.name, contact.email, assignedTechnicians[0].email
// Sale: id, saleNumber, status, totalAmount, contact.email, items[].type
// Offer: id, offerNumber, status, totalAmount, contact.email, validUntil
// ServiceOrder: id, serviceOrderNumber, status, completedDispatchCount
//
// Example: input.trigger.entityId, input.previousNode.result

const data = input.trigger || {};
const result = {
  processed: true,
  entityId: data.entityId,
  timestamp: new Date().toISOString(),
};

return result;`;

    return (
      <Tabs defaultValue="code" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="code">{t('config.codeTab', 'Code')}</TabsTrigger>
          <TabsTrigger value="settings">{t('config.settingsTab', 'Settings')}</TabsTrigger>
          <TabsTrigger value="help">{t('config.helpTab', 'Help')}</TabsTrigger>
        </TabsList>

        <TabsContent value="code" className="space-y-4">
          <div className="space-y-2">
            <Label>{t('config.codeLanguage', 'Language')}</Label>
            <Select value={config.language || 'javascript'} onValueChange={(value) => setConfig({ ...config, language: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="javascript">JavaScript</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>{t('config.codeEditor', 'Code')}</Label>
            <Textarea
              value={config.code || defaultCode}
              onChange={(e) => setConfig({ ...config, code: e.target.value })}
              placeholder={defaultCode}
              rows={16}
              className="font-mono text-xs leading-relaxed bg-muted/20 border-border/50"
              spellCheck={false}
            />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="space-y-2">
            <Label>{t('config.timeout', 'Timeout (seconds)')}</Label>
            <Input type="number" value={config.timeout || 10} onChange={(e) => setConfig({ ...config, timeout: parseInt(e.target.value) })} min={1} max={60} />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.continueOnError ?? false} onCheckedChange={(checked) => setConfig({ ...config, continueOnError: checked })} />
            <Label>{t('config.continueOnError', 'Continue on Error')}</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={config.logOutput ?? true} onCheckedChange={(checked) => setConfig({ ...config, logOutput: checked })} />
            <Label>{t('config.logOutput', 'Log Output to Execution History')}</Label>
          </div>
        </TabsContent>

        <TabsContent value="help" className="space-y-3">
          <div className="p-3 bg-muted/30 rounded-md text-xs text-muted-foreground space-y-3">
            <p className="font-semibold text-foreground">{t('config.codeHelpTitle', 'Available Variables')}</p>
            <div className="space-y-1.5">
              <p><code className="bg-muted px-1 py-0.5 rounded text-[11px]">input.trigger</code> — Trigger data (entityType, entityId, fromStatus, toStatus)</p>
              <p><code className="bg-muted px-1 py-0.5 rounded text-[11px]">{'input.<nodeId>'}</code> — Output from any previous node</p>
              <p><code className="bg-muted px-1 py-0.5 rounded text-[11px]">context.executionId</code> — Current execution ID</p>
              <p><code className="bg-muted px-1 py-0.5 rounded text-[11px]">context.userId</code> — User who triggered the workflow</p>
            </div>
            <Separator />
            <p className="font-semibold text-foreground">Entity Data Fields</p>
            <div className="space-y-1 text-[10px]">
              <p><strong>Dispatch:</strong> dispatchNumber, status, priority, scheduledDate, siteAddress, contact.name, contact.email, assignedTechnicians[0].email, completionPercentage</p>
              <p><strong>Sale:</strong> saleNumber, status, totalAmount, paidAmount, contact.email, items[].type, items[].requiresServiceOrder, fulfillmentStatus</p>
              <p><strong>Offer:</strong> offerNumber, status, totalAmount, validUntil, contact.email, items[].type</p>
              <p><strong>Service Order:</strong> serviceOrderNumber, status, serviceCount, completedDispatchCount, assignedTo, contact.email</p>
              <p><strong>Contact:</strong> name, email, phone, company, status, type, tags</p>
            </div>
            <Separator />
            <p className="font-semibold text-foreground">{t('config.codeHelpReturnTitle', 'Return Value')}</p>
            <p>{t('config.codeHelpReturn', 'Return a value to pass it as output to the next node. Available as {{nodeId.result}}.')}</p>
            <Separator />
            <p className="font-semibold text-foreground">{t('config.codeHelpExamples', 'Examples')}</p>
            <pre className="bg-muted p-2 rounded text-[10px] overflow-x-auto whitespace-pre-wrap">{`// Query dispatches not in progress
const dispatches = await getEntities('dispatch', { status: 'planned' });
return { items: dispatches, count: dispatches.length };

// Check sale items needing service orders
const serviceItems = input.trigger.items
  .filter(i => i.requiresServiceOrder);
return { serviceItems, hasServices: serviceItems.length > 0 };

// Send emails to assigned technicians
for (const d of input.previousNode.items) {
  await sendEmail({
    to: d.assignedTechnicians?.[0]?.email,
    subject: 'Dispatch #' + d.dispatchNumber + ' reminder',
    body: 'Your dispatch at ' + d.siteAddress + ' is still ' + d.status
  });
}
return { sent: input.previousNode.count };

// Conditional logic
if (input.trigger.status === 'accepted') {
  return { action: 'proceed', priority: 'high' };
}
return { action: 'skip' };`}</pre>
          </div>
        </TabsContent>
      </Tabs>
    );
  };

  // Custom LLM configuration (bring your own model)
  const renderCustomLLMConfig = () => (
    <div className="space-y-4">
      <div className="p-3 bg-muted/30 rounded-md text-xs text-muted-foreground">
        {t('config.customLlmHint', 'Connect your own LLM provider. Compatible with OpenAI-style chat/completions API.')}
      </div>
      <div className="space-y-2">
        <Label>{t('config.providerName', 'Provider Name')}</Label>
        <Input
          value={config.providerName || ''}
          onChange={(e) => setConfig({ ...config, providerName: e.target.value })}
          placeholder="e.g. My OpenAI, Local Ollama, Azure GPT"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('config.customApiUrl', 'API URL')}</Label>
        <Input
          value={config.customApiUrl || ''}
          onChange={(e) => setConfig({ ...config, customApiUrl: e.target.value })}
          placeholder="https://api.openai.com/v1/chat/completions"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('config.customModelName', 'Model Name')}</Label>
        <Input
          value={config.customModelName || ''}
          onChange={(e) => setConfig({ ...config, customModelName: e.target.value })}
          placeholder="gpt-4o, claude-sonnet-4, llama-3.3-70b"
        />
      </div>
      <div className="space-y-2">
        <Label>{t('config.customApiKey', 'API Key')}</Label>
        <Input
          type="password"
          value={config.customApiKey || ''}
          onChange={(e) => setConfig({ ...config, customApiKey: e.target.value })}
          placeholder="sk-..."
        />
      </div>
      <Separator />
      <div className="space-y-2">
        <Label htmlFor="customSystemPrompt">{t('systemPromptLabel')}</Label>
        <Textarea
          id="customSystemPrompt"
          value={config.systemPrompt || ''}
          onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
          placeholder={t('systemPromptPlaceholder')}
          rows={3}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="customUserPrompt">{t('userPromptLabel')}</Label>
        <Textarea
          id="customUserPrompt"
          value={config.userPrompt || ''}
          onChange={(e) => setConfig({ ...config, userPrompt: e.target.value })}
          placeholder={t('userPromptPlaceholder')}
          rows={3}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('temperature')}: {config.temperature ?? 0.7}</Label>
          <input
            type="range" min="0" max="1" step="0.1"
            value={config.temperature ?? 0.7}
            onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>
        <div className="space-y-2">
          <Label>{t('maxTokens')}</Label>
          <Input
            type="number"
            value={config.maxTokens || 1000}
            onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
          />
        </div>
      </div>
    </div>
  );

  const renderTriggerConfig = () => (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{t('triggerType')}</Label>
        <Select value={config.triggerType || ''} onValueChange={(value) => setConfig({ ...config, triggerType: value })}>
          <SelectTrigger>
            <SelectValue placeholder={t('chooseTriggerType')} />
          </SelectTrigger>
          <SelectContent>
            {TRIGGER_TYPES.map((tt) => (
              <SelectItem key={tt.id} value={tt.id}>
                {t(tt.id)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {config.triggerType === 'schedule' && (
        <div className="space-y-2">
          <Label htmlFor="schedule">{t('schedule')}</Label>
          <Input
            id="schedule"
            value={config.schedule || ''}
            onChange={(e) => setConfig({ ...config, schedule: e.target.value })}
            placeholder={t('schedulePlaceholder')}
          />
        </div>
      )}

      {config.triggerType === 'webhook' && (
        <div className="space-y-2">
          <Label htmlFor="webhookUrl">{t('webhook')}</Label>
          <Input
            id="webhookUrl"
            value={config.webhookUrl || ''}
            onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
            placeholder="https://..."
          />
        </div>
      )}
    </div>
  );

  // Delay/Wait configuration
  const renderDelayConfig = () => (
    <div className="space-y-4">
      <div className="p-3 bg-muted/30 rounded-md text-xs text-muted-foreground">
        {t('config.delayHint', 'Pause workflow execution for a specified duration before continuing to the next step.')}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{t('config.delayValue', 'Duration')}</Label>
          <Input
            type="number"
            value={config.delayValue || 5}
            onChange={(e) => setConfig({ ...config, delayValue: parseInt(e.target.value) || 1 })}
            min={1}
            max={999}
          />
        </div>
        <div className="space-y-2">
          <Label>{t('config.delayUnit', 'Unit')}</Label>
          <Select value={config.delayUnit || 'minutes'} onValueChange={(value) => setConfig({ ...config, delayUnit: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="seconds">{t('config.seconds', 'Seconds')}</SelectItem>
              <SelectItem value="minutes">{t('config.minutes', 'Minutes')}</SelectItem>
              <SelectItem value="hours">{t('config.hours', 'Hours')}</SelectItem>
              <SelectItem value="days">{t('config.days', 'Days')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="p-2 bg-muted/20 rounded text-xs">
        <span className="font-medium">{t('config.delayPreview', 'Will pause for')}: </span>
        <span className="text-primary font-semibold">
          {config.delayValue || 5} {t(`config.${config.delayUnit || 'minutes'}`, config.delayUnit || 'minutes')}
        </span>
      </div>
      <Separator />
      <div className="space-y-2">
        <Label>{t('config.delayMode', 'Delay Mode')}</Label>
        <Select value={config.delayMode || 'relative'} onValueChange={(value) => setConfig({ ...config, delayMode: value })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="relative">{t('config.relativeDelay', 'Wait for duration (relative)')}</SelectItem>
            <SelectItem value="until">{t('config.untilTime', 'Wait until specific time')}</SelectItem>
            <SelectItem value="business_hours">{t('config.businessHours', 'Wait during business hours only')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {config.delayMode === 'until' && (
        <div className="space-y-2">
          <Label>{t('config.waitUntilTime', 'Wait Until')}</Label>
          <Input
            type="datetime-local"
            value={config.waitUntilTime || ''}
            onChange={(e) => setConfig({ ...config, waitUntilTime: e.target.value })}
          />
        </div>
      )}
      {config.delayMode === 'business_hours' && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t('config.businessStart', 'Business Start')}</Label>
            <Input
              type="time"
              value={config.businessStart || '09:00'}
              onChange={(e) => setConfig({ ...config, businessStart: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t('config.businessEnd', 'Business End')}</Label>
            <Input
              type="time"
              value={config.businessEnd || '17:00'}
              onChange={(e) => setConfig({ ...config, businessEnd: e.target.value })}
            />
          </div>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Switch
          checked={config.skipWeekends ?? false}
          onCheckedChange={(checked) => setConfig({ ...config, skipWeekends: checked })}
        />
        <Label>{t('config.skipWeekends', 'Skip Weekends')}</Label>
      </div>
    </div>
  );

  const renderConditionConfig = () => {
    const selectedEntityType = (config.entityType as WorkflowEntityType) || 'dispatch';
    const entityFields = getEntityFields(selectedEntityType);
    const selectedField = entityFields.find(f => f.path === config.field);
    const operators = selectedField ? getOperatorsForType(selectedField.type) : getOperatorsForType('string');
    const fieldsByCategory = entityFields.reduce((acc, f) => {
      if (!acc[f.category]) acc[f.category] = [];
      acc[f.category].push(f);
      return acc;
    }, {} as Record<string, EntityField[]>);
    const categoryLabels: Record<string, string> = { core: '📋 Core', status: '🔄 Status', dates: '📅 Dates', financial: '💰 Financial', relations: '🔗 Relations', meta: '⚙️ Meta' };

    return (
      <div className="space-y-4">
        {/* Entity Type selector */}
        <div className="space-y-2">
          <Label>{t('config.entityType', 'Entity Type')}</Label>
          <Select value={selectedEntityType} onValueChange={(value) => setConfig({ ...config, entityType: value, field: '', operator: 'equals', value: '' })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALL_ENTITY_TYPES.map(et => (
                <SelectItem key={et} value={et}>{getEntityLabel(et)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Field selector — grouped by category */}
        <div className="space-y-2">
          <Label>{t('config.field', 'Field')}</Label>
          <Select value={config.field || ''} onValueChange={(value) => {
            const field = entityFields.find(f => f.path === value);
            setConfig({ ...config, field: value, operator: field?.type === 'boolean' ? 'equals' : 'equals', value: '' });
          }}>
            <SelectTrigger>
              <SelectValue placeholder={t('config.selectField', 'Select a field...')} />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {Object.entries(fieldsByCategory).map(([cat, fields]) => (
                <div key={cat}>
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{categoryLabels[cat] || cat}</div>
                  {fields.map(f => (
                    <SelectItem key={f.path} value={f.path}>
                      <div className="flex items-center gap-2">
                        <span>{f.label}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{f.type}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
          {selectedField?.description && (
            <p className="text-[11px] text-muted-foreground">{selectedField.description}</p>
          )}
        </div>

        {/* Operator selector — dynamic based on field type */}
        <div className="space-y-2">
          <Label>{t('config.operator', 'Operator')}</Label>
          <Select value={config.operator || 'equals'} onValueChange={(value) => setConfig({ ...config, operator: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {operators.map(op => (
                <SelectItem key={op.value} value={op.value}>{op.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Value input — enum shows dropdown, boolean shows switch, others show text */}
        <div className="space-y-2">
          <Label>{t('config.value', 'Value')}</Label>
          {selectedField?.type === 'enum' && selectedField.enumValues ? (
            <Select value={config.value || ''} onValueChange={(value) => setConfig({ ...config, value })}>
              <SelectTrigger>
                <SelectValue placeholder={t('config.selectValue', 'Select value...')} />
              </SelectTrigger>
              <SelectContent>
                {selectedField.enumValues.map(v => (
                  <SelectItem key={v} value={v}>{v.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : selectedField?.type === 'boolean' ? (
            <Select value={config.value || 'true'} onValueChange={(value) => setConfig({ ...config, value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="true">True</SelectItem>
                <SelectItem value="false">False</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <Input
              value={config.value || ''}
              onChange={(e) => setConfig({ ...config, value: e.target.value })}
              placeholder={selectedField?.type === 'number' ? '0' : selectedField?.type === 'date' ? 'YYYY-MM-DD or number of days' : 'Value...'}
            />
          )}
        </div>

        {/* Preview */}
        {config.field && config.operator && (
          <div className="p-2.5 bg-muted/30 rounded-lg border border-border/30">
            <p className="text-[11px] font-medium text-muted-foreground mb-1">{t('config.conditionPreview', 'Condition Preview')}:</p>
            <code className="text-xs font-mono text-primary">
              {selectedEntityType}.{config.field} <span className="text-muted-foreground">{config.operator}</span> <span className="text-foreground font-semibold">{config.value || '?'}</span>
            </code>
          </div>
        )}
      </div>
    );
  };

  const renderConfiguration = () => {
    if (!nodeData) return null;

    const { type } = nodeData;

    // NEW: Status triggers
    if (statusTriggerNodes.includes(type as any)) {
      return renderStatusTriggerConfig();
    }

    // NEW: Status update actions
    if (statusActionNodes.includes(type as any)) {
      return renderStatusActionConfig();
    }

    // NEW: Notification action
    if (type === 'send-notification' || type === 'send-workflow-email') {
      return renderNotificationConfig();
    }

    // NEW: Approval action
    if (type === 'request-approval') {
      return renderApprovalConfig();
    }

    if (['contact', 'offer', 'sale', 'service-order', 'dispatch'].includes(type)) {
      return renderBusinessProcessConfig();
    }

    if (['email', 'email-template', 'email-llm'].includes(type)) {
      return renderEmailConfig();
    }

    if (['llm-writer', 'llm-analyzer', 'llm-personalizer', 'ai', 'ai-email-writer', 'ai-analyzer'].includes(type)) {
      return renderLLMConfig();
    }

    if (type === 'custom-llm') {
      return renderCustomLLMConfig();
    }

    if (type === 'dynamic-form') {
      return renderDynamicFormConfig();
    }

    if (type === 'data-transfer') {
      return renderDataTransferConfig();
    }

    if (type === 'http-request') {
      return renderHttpRequestConfig();
    }

    if (type === 'code' || type === 'javascript') {
      return renderCodeConfig();
    }

    if (type === 'delay') {
      return renderDelayConfig();
    }

    if (['trigger', 'webhook', 'scheduled'].includes(type)) {
      return renderTriggerConfig();
    }

    if (['condition', 'filter'].includes(type)) {
      return renderConditionConfig();
    }

    // Default configuration for other types
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t('name')}</Label>
          <Input
            id="name"
            value={config.name || nodeData.label}
            onChange={(e) => setConfig({ ...config, name: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">{t('description')}</Label>
          <Textarea
            id="description"
            value={config.description || ''}
            onChange={(e) => setConfig({ ...config, description: e.target.value })}
            placeholder={t('processDescriptionPlaceholder')}
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open={!!isOpen} onOpenChange={onClose}>
      <DialogContent className="workflow-module max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {nodeData?.icon && <nodeData.icon className="h-5 w-5" />}
            {t('configuration')}: {nodeData?.label || t('node')}
          </DialogTitle>
          {/* Short configure hint (if available) */}
          {nodeData && getHelpString('configureDescription') && (
            <p className="text-[12px] text-muted-foreground mt-1">{getHelpString('configureDescription')}</p>
          )}
        </DialogHeader>

        <Separator />

        {nodeData && (
          <div className="py-4">
            {/* Prominent full description */}
            <div className="mb-4">
              <p className="text-[13px] text-muted-foreground mb-2">{getHelpString('fullDescription') || nodeData.description || ''}</p>

              {/* How it works / Examples */}
              <details className="bg-muted/5 p-3 rounded">
                <summary className="cursor-pointer font-medium">{t('howItWorks')}</summary>
                <div className="mt-2 text-[11px] text-muted-foreground">
                  <p>{getHelpString('how') || ''}</p>
                  {(() => {
                    const examples = getHelpExamples();
                    if (Array.isArray(examples)) {
                      return (
                        <ul className="list-disc pl-5 mt-2">
                          {examples.map((ex: any, idx: number) => (
                            <li key={idx}>{ex}</li>
                          ))}
                        </ul>
                      );
                    }
                    return null;
                  })()}
                </div>
              </details>
            </div>

            {renderConfiguration()}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            {t('cancel')}
          </Button>
          <Button onClick={handleSave} disabled={!nodeData}>
            <Save className="h-4 w-4 mr-2" />
            {t('save')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
