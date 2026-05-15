import { useState } from 'react';
import { 
  Users, FileText, DollarSign, ShoppingCart, Truck, 
  Mail, Send, Sparkles, Brain, Webhook, Calendar, 
  Database, GitBranch, Repeat, Split, Shield,
  Zap, Play, Bell, Clock, ArrowRight, RefreshCw, ChevronDown,
  ClipboardList, Bot, Wrench, PauseCircle, FormInput, ArrowLeftRight, Globe, Settings2, Code
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export interface NodeTemplate {
  type: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  category: string;
  entityType?: 'offer' | 'sale' | 'service_order' | 'dispatch';
  isTrigger?: boolean;
  isAction?: boolean;
  defaultConfig?: Record<string, any>;
}

interface NodePaletteProps {
  onAddNode: (template: NodeTemplate) => void;
  nextRunCountdown?: number;
  onReconcile?: () => void;
  isReconciling?: boolean;
  isConnected?: boolean;
  isEditMode?: boolean;
}

const nodeCategories = [
  {
    id: 'triggers',
    labelKey: 'category.triggers',
    icon: Zap,
    color: 'text-warning',
    bgColor: 'bg-warning',
  },
  {
    id: 'entities',
    labelKey: 'category.entities',
    icon: Database,
    color: 'text-success',
    bgColor: 'bg-success',
  },
  {
    id: 'actions',
    labelKey: 'category.actions',
    icon: Play,
    color: 'text-primary',
    bgColor: 'bg-primary',
  },
  {
    id: 'conditions',
    labelKey: 'category.conditions',
    icon: GitBranch,
    color: 'text-warning',
    bgColor: 'bg-warning',
  },
  {
    id: 'communication',
    labelKey: 'category.communication',
    icon: Mail,
    color: 'text-info',
    bgColor: 'bg-info',
  },
  {
    id: 'ai',
    labelKey: 'category.ai',
    icon: Brain,
    color: 'text-primary',
    bgColor: 'bg-primary',
  },
  {
    id: 'integration',
    labelKey: 'category.integration',
    icon: ArrowLeftRight,
    color: 'text-success',
    bgColor: 'bg-success',
  },
];

const nodeTemplates: NodeTemplate[] = [
  // Triggers - Entity Status Changes
  {
    type: 'offer-status-trigger',
    label: 'node.offer-status-trigger.label',
    description: 'node.offer-status-trigger.desc',
    icon: FileText,
    category: 'triggers',
    entityType: 'offer',
    isTrigger: true,
  },
  {
    type: 'sale-status-trigger',
    label: 'node.sale-status-trigger.label',
    description: 'node.sale-status-trigger.desc',
    icon: DollarSign,
    category: 'triggers',
    entityType: 'sale',
    isTrigger: true,
  },
  {
    type: 'service-order-status-trigger',
    label: 'node.service-order-status-trigger.label',
    description: 'node.service-order-status-trigger.desc',
    icon: ShoppingCart,
    category: 'triggers',
    entityType: 'service_order',
    isTrigger: true,
  },
  {
    type: 'dispatch-status-trigger',
    label: 'node.dispatch-status-trigger.label',
    description: 'node.dispatch-status-trigger.desc',
    icon: Truck,
    category: 'triggers',
    entityType: 'dispatch',
    isTrigger: true,
  },
  {
    type: 'webhook-trigger',
    label: 'node.webhook.label',
    description: 'node.webhook.desc',
    icon: Webhook,
    category: 'triggers',
    isTrigger: true,
  },
  {
    type: 'scheduled-trigger',
    label: 'node.scheduled.label',
    description: 'node.scheduled.desc',
    icon: Calendar,
    category: 'triggers',
    isTrigger: true,
  },

  // Entity Nodes
  {
    type: 'offer',
    label: 'node.offer.label',
    description: 'node.offer.desc',
    icon: FileText,
    category: 'entities',
    entityType: 'offer',
  },
  {
    type: 'sale',
    label: 'node.sale.label',
    description: 'node.sale.desc',
    icon: DollarSign,
    category: 'entities',
    entityType: 'sale',
  },
  {
    type: 'service-order',
    label: 'node.service-order.label',
    description: 'node.service-order.desc',
    icon: ShoppingCart,
    category: 'entities',
    entityType: 'service_order',
  },
  {
    type: 'dispatch',
    label: 'node.dispatch.label',
    description: 'node.dispatch.desc',
    icon: Truck,
    category: 'entities',
    entityType: 'dispatch',
  },
  {
    type: 'contact',
    label: 'node.contact.label',
    description: 'node.contact.desc',
    icon: Users,
    category: 'entities',
  },

  // Actions - Create
  {
    type: 'create-offer',
    label: 'node.create-offer.label',
    description: 'node.create-offer.desc',
    icon: FileText,
    category: 'actions',
    entityType: 'offer',
    isAction: true,
    defaultConfig: { autoCreate: true },
  },
  {
    type: 'create-sale',
    label: 'node.create-sale.label',
    description: 'node.create-sale.desc',
    icon: DollarSign,
    category: 'actions',
    entityType: 'sale',
    isAction: true,
    defaultConfig: { autoCreate: true },
  },
  {
    type: 'create-service-order',
    label: 'node.create-service-order.label',
    description: 'node.create-service-order.desc',
    icon: ShoppingCart,
    category: 'actions',
    entityType: 'service_order',
    isAction: true,
    defaultConfig: { autoCreate: true },
  },
  {
    type: 'create-dispatch',
    label: 'node.create-dispatch.label',
    description: 'node.create-dispatch.desc',
    icon: Truck,
    category: 'actions',
    entityType: 'dispatch',
    isAction: true,
    defaultConfig: { createPerService: true },
  },
  // Actions - Update Status
  {
    type: 'update-offer-status',
    label: 'node.update-offer-status.label',
    description: 'node.update-offer-status.desc',
    icon: FileText,
    category: 'actions',
    entityType: 'offer',
    isAction: true,
  },
  {
    type: 'update-sale-status',
    label: 'node.update-sale-status.label',
    description: 'node.update-sale-status.desc',
    icon: DollarSign,
    category: 'actions',
    entityType: 'sale',
    isAction: true,
  },
  {
    type: 'update-service-order-status',
    label: 'node.update-service-order-status.label',
    description: 'node.update-service-order-status.desc',
    icon: ShoppingCart,
    category: 'actions',
    entityType: 'service_order',
    isAction: true,
  },
  {
    type: 'update-dispatch-status',
    label: 'node.update-dispatch-status.label',
    description: 'node.update-dispatch-status.desc',
    icon: Truck,
    category: 'actions',
    entityType: 'dispatch',
    isAction: true,
  },

  // Conditions
  {
    type: 'if-else',
    label: 'node.if-else.label',
    description: 'node.if-else.desc',
    icon: GitBranch,
    category: 'conditions',
  },
  {
    type: 'switch',
    label: 'node.switch.label',
    description: 'node.switch.desc',
    icon: Split,
    category: 'conditions',
  },
  {
    type: 'loop',
    label: 'node.loop.label',
    description: 'node.loop.desc',
    icon: Repeat,
    category: 'conditions',
  },

  // Communication
  {
    type: 'send-notification',
    label: 'node.send-notification.label',
    description: 'node.send-notification.desc',
    icon: Bell,
    category: 'communication',
  },
  {
    type: 'send-email',
    label: 'node.email.label',
    description: 'node.email.desc',
    icon: Mail,
    category: 'communication',
  },
  {
    type: 'request-approval',
    label: 'node.request-approval.label',
    description: 'node.request-approval.desc',
    icon: Shield,
    category: 'communication',
  },
  {
    type: 'delay',
    label: 'node.delay.label',
    description: 'node.delay.desc',
    icon: Clock,
    category: 'communication',
  },

  // AI
  {
    type: 'ai-email-writer',
    label: 'node.email-llm.label',
    description: 'node.email-llm.desc',
    icon: Sparkles,
    category: 'ai',
  },
  {
    type: 'ai-analyzer',
    label: 'node.llm-analyzer.label',
    description: 'node.llm-analyzer.desc',
    icon: Brain,
    category: 'ai',
  },
  {
    type: 'ai-agent',
    label: 'node.ai-agent.label',
    description: 'node.ai-agent.desc',
    icon: Bot,
    category: 'ai',
  },

  // Human-in-the-loop
  {
    type: 'human-input-form',
    label: 'node.human-input-form.label',
    description: 'node.human-input-form.desc',
    icon: ClipboardList,
    category: 'communication',
  },
  {
    type: 'wait-for-event',
    label: 'node.wait-for-event.label',
    description: 'node.wait-for-event.desc',
    icon: PauseCircle,
    category: 'communication',
  },

  // Integration — Dynamic Forms, Data Transfer, HTTP, Custom LLM
  {
    type: 'dynamic-form',
    label: 'node.dynamic-form.label',
    description: 'node.dynamic-form.desc',
    icon: FormInput,
    category: 'integration',
    isAction: true,
  },
  {
    type: 'data-transfer',
    label: 'node.data-transfer.label',
    description: 'node.data-transfer.desc',
    icon: ArrowLeftRight,
    category: 'integration',
    isAction: true,
  },
  {
    type: 'http-request',
    label: 'node.http-request.label',
    description: 'node.http-request.desc',
    icon: Globe,
    category: 'integration',
    isAction: true,
  },
  {
    type: 'custom-llm',
    label: 'node.custom-llm.label',
    description: 'node.custom-llm.desc',
    icon: Settings2,
    category: 'ai',
  },
  {
    type: 'code',
    label: 'node.code.label',
    description: 'node.code.desc',
    icon: Code,
    category: 'integration',
    isAction: true,
  },
];

export function NodePalette({ 
  onAddNode, 
  nextRunCountdown = 300,
  onReconcile,
  isReconciling = false,
  isConnected = true,
  isEditMode = false
}: NodePaletteProps) {
  const { t } = useTranslation('workflow');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['triggers', 'entities', 'actions', 'conditions', 'communication', 'ai', 'integration']);

  // Handle add node - only if in edit mode
  const handleAddNode = (template: NodeTemplate) => {
    if (!isEditMode) {
      return; // Don't add nodes if not in edit mode
    }
    onAddNode(template);
  };

  // Format countdown as MM:SS
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const filteredTemplates = searchQuery
    ? nodeTemplates.filter(tmpl => {
        const q = searchQuery.toLowerCase();
        // Search against translated label and description, not raw i18n keys
        const translatedLabel = t(tmpl.label).toLowerCase();
        const translatedDesc = t(tmpl.description).toLowerCase();
        return translatedLabel.includes(q) ||
               translatedDesc.includes(q) ||
               tmpl.type.toLowerCase().includes(q);
      })
    : nodeTemplates;

  const handleDragStart = (e: React.DragEvent, template: NodeTemplate) => {
    e.dataTransfer.setData('application/reactflow', JSON.stringify(template));
    e.dataTransfer.effectAllowed = 'move';
  };


  return (
    <div className="w-[252px] h-full min-h-0 bg-card border-r border-border flex flex-col select-none overflow-hidden">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 border-b border-border shrink-0">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          {t('nodesLabel', 'Nodes')}
        </h3>
        <Input
          placeholder={t('searchNodes', 'Search nodes...')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-7 text-xs"
        />
      </div>

      {/* Categories — scrollable */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="px-2 py-2 space-y-0.5">
          {nodeCategories.map(category => {
            const categoryTemplates = filteredTemplates.filter(t => t.category === category.id);
            if (categoryTemplates.length === 0) return null;

            const isOpen = expandedCategories.includes(category.id);

            return (
              <Collapsible
                key={category.id}
                open={isOpen}
                onOpenChange={() => toggleCategory(category.id)}
              >
                <CollapsibleTrigger className="w-full">
                  <div className={cn(
                    'flex items-center gap-2 px-2 py-1.5 rounded-md',
                    'hover:bg-muted/60 transition-colors',
                    'text-xs font-semibold text-foreground/80'
                  )}>
                    <div className="flex items-center justify-center w-5 h-5 rounded shrink-0 bg-muted">
                      <category.icon className={cn('h-3 w-3', category.color)} />
                    </div>
                    <span className="flex-1 text-left">{t(category.labelKey)}</span>
                    <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
                      {categoryTemplates.length}
                    </span>
                    <ChevronDown className={cn(
                      'h-3.5 w-3.5 text-muted-foreground transition-transform duration-200',
                      isOpen && 'rotate-180'
                    )} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="py-0.5 space-y-px ml-2">
                    {categoryTemplates.map(template => (
                      <TooltipProvider key={template.type} delayDuration={400}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div
                              draggable={isEditMode}
                              onDragStart={(e) => isEditMode && handleDragStart(e, template)}
                              onClick={() => handleAddNode(template)}
                              className={cn(
                                'flex items-center gap-2.5 px-2 py-[6px] rounded-md',
                                'transition-all duration-100 text-xs group',
                                isEditMode 
                                  ? 'hover:bg-muted/70 cursor-grab active:cursor-grabbing active:bg-muted' 
                                  : 'opacity-50 cursor-not-allowed'
                              )}
                            >
                              <div className={cn(
                                'flex items-center justify-center w-7 h-7 rounded-md shrink-0',
                                'border border-border/60 bg-background',
                                'group-hover:border-border group-hover:shadow-sm transition-all'
                              )}>
                                <template.icon className={cn('h-3.5 w-3.5', category.color)} />
                              </div>
                              <span className="truncate text-foreground/80 font-medium leading-tight">
                                {t(template.label)}
                              </span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="right" className="max-w-[200px] text-xs">
                            <p className="font-medium">{t(template.label)}</p>
                            <p className="text-muted-foreground mt-0.5">{t(template.description)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-border shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground tabular-nums">
            <Clock className="h-3 w-3 opacity-60" />
            <span>{t('nextRunIn')}</span>
            <span className="font-medium text-foreground/70">{formatCountdown(nextRunCountdown)}</span>
          </div>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={onReconcile}
                  disabled={isReconciling || !isConnected}
                  size="icon-sm"
                  className="h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={cn('h-3 w-3', isReconciling && 'animate-spin')} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('reconciliationTooltip')}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
