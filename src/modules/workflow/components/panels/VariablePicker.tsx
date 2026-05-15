import { useState, useMemo } from 'react';
import { ChevronRight, Search, Zap, Hash, Type, Calendar, ToggleLeft, List } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Node, Edge } from '@xyflow/react';

// Output schema for a step — describes the data a node produces
export interface StepOutputField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  children?: StepOutputField[];
}

export interface StepOutput {
  stepId: string;
  stepName: string;
  stepType: string;
  icon?: React.ComponentType<any>;
  fields: StepOutputField[];
}

// Infer output schema from a node type
function inferOutputSchema(node: Node): StepOutputField[] {
  const nodeType = (node.data as any)?.type || '';
  const entityType = (node.data as any)?.entityType || '';

  // ─── Entity nodes (triggers + actions) ──────────────────────────
  // Match by explicit entityType first, then by partial nodeType match
  if (entityType === 'offer' || nodeType.includes('offer')) {
    return [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
      { key: 'contactId', label: 'Contact ID', type: 'number' },
      { key: 'validUntil', label: 'Valid Until', type: 'date' },
      { key: 'items', label: 'Items', type: 'array', children: [
        { key: 'itemName', label: 'Item Name', type: 'string' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'unitPrice', label: 'Unit Price', type: 'number' },
        { key: 'type', label: 'Type', type: 'string' },
      ]},
    ];
  }

  if (entityType === 'sale' || nodeType.includes('sale')) {
    return [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'totalAmount', label: 'Total Amount', type: 'number' },
      { key: 'contactId', label: 'Contact ID', type: 'number' },
      { key: 'offerId', label: 'Offer ID', type: 'number' },
      { key: 'hasServiceItems', label: 'Has Services', type: 'boolean' },
      { key: 'items', label: 'Items', type: 'array', children: [
        { key: 'itemName', label: 'Item Name', type: 'string' },
        { key: 'quantity', label: 'Quantity', type: 'number' },
        { key: 'type', label: 'Type', type: 'string' },
      ]},
    ];
  }

  // service_order OR service-order OR update-service-order-status
  if (entityType === 'service_order' || nodeType.includes('service-order') || nodeType.includes('service_order') || nodeType.includes('service')) {
    return [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'title', label: 'Title', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'priority', label: 'Priority', type: 'string' },
      { key: 'contactId', label: 'Contact ID', type: 'number' },
      { key: 'saleId', label: 'Sale ID', type: 'number' },
      { key: 'dispatches', label: 'Dispatches', type: 'array' },
      { key: 'completionPercentage', label: 'Completion %', type: 'number' },
    ];
  }

  if (entityType === 'dispatch' || nodeType.includes('dispatch')) {
    return [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'priority', label: 'Priority', type: 'string' },
      { key: 'serviceOrderId', label: 'Service Order ID', type: 'number' },
      { key: 'scheduledDate', label: 'Scheduled Date', type: 'date' },
      { key: 'siteAddress', label: 'Site Address', type: 'string' },
      { key: 'assignedTechnicians', label: 'Technicians', type: 'array' },
    ];
  }

  // ─── Condition / branching nodes ────────────────────────────────
  if (nodeType.includes('if-else') || nodeType.includes('condition') || nodeType === 'switch') {
    return [
      { key: 'result', label: 'Result', type: 'boolean' },
      { key: 'branch', label: 'Branch', type: 'string' },
    ];
  }

  // ─── AI nodes ───────────────────────────────────────────────────
  if (nodeType.includes('ai-') || nodeType.includes('llm')) {
    return [
      { key: 'output', label: 'Output', type: 'string' },
      { key: 'model', label: 'Model Used', type: 'string' },
      { key: 'tokensUsed', label: 'Tokens Used', type: 'number' },
      { key: 'structured', label: 'Structured Output', type: 'object' },
    ];
  }

  // ─── Human input / wait nodes ───────────────────────────────────
  if (nodeType === 'human-input-form') {
    return [
      { key: 'formData', label: 'Form Data', type: 'object' },
      { key: 'submittedBy', label: 'Submitted By', type: 'string' },
      { key: 'submittedAt', label: 'Submitted At', type: 'date' },
    ];
  }
  if (nodeType === 'wait-for-event') {
    return [
      { key: 'eventData', label: 'Event Data', type: 'object' },
      { key: 'receivedAt', label: 'Received At', type: 'date' },
    ];
  }

  // ─── Email nodes ────────────────────────────────────────────────
  if (nodeType.includes('email') || nodeType.includes('send-email')) {
    return [
      { key: 'sent', label: 'Sent', type: 'boolean' },
      { key: 'messageId', label: 'Message ID', type: 'string' },
    ];
  }

  // ─── Notification / approval nodes ──────────────────────────────
  if (nodeType.includes('notification') || nodeType.includes('sms')) {
    return [
      { key: 'sent', label: 'Sent', type: 'boolean' },
      { key: 'recipientCount', label: 'Recipients', type: 'number' },
    ];
  }
  if (nodeType.includes('approval')) {
    return [
      { key: 'approved', label: 'Approved', type: 'boolean' },
      { key: 'approvedBy', label: 'Approved By', type: 'string' },
      { key: 'responseNote', label: 'Response Note', type: 'string' },
    ];
  }

  // ─── Delay / wait ──────────────────────────────────────────────
  if (nodeType.includes('delay') || nodeType.includes('wait') || nodeType.includes('timer')) {
    return [
      { key: 'completed', label: 'Completed', type: 'boolean' },
      { key: 'waitedMs', label: 'Wait Duration (ms)', type: 'number' },
    ];
  }

  // ─── Loop / iterator ──────────────────────────────────────────
  if (nodeType.includes('loop') || nodeType.includes('iterator') || nodeType.includes('forEach')) {
    return [
      { key: 'iteration', label: 'Current Iteration', type: 'number' },
      { key: 'totalIterations', label: 'Total Iterations', type: 'number' },
      { key: 'currentItem', label: 'Current Item', type: 'object' },
    ];
  }

  // ─── API / HTTP / Webhook ──────────────────────────────────────
  if (nodeType.includes('api') || nodeType.includes('http') || nodeType.includes('webhook')) {
    return [
      { key: 'statusCode', label: 'Status Code', type: 'number' },
      { key: 'body', label: 'Response Body', type: 'object' },
      { key: 'headers', label: 'Headers', type: 'object' },
    ];
  }

  // ─── Database nodes ────────────────────────────────────────────
  if (nodeType.includes('database') || nodeType.includes('db-')) {
    return [
      { key: 'result', label: 'Result', type: 'object' },
      { key: 'rowsAffected', label: 'Rows Affected', type: 'number' },
    ];
  }

  // ─── Code / JavaScript nodes ──────────────────────────────────
  if (nodeType === 'code' || nodeType === 'javascript') {
    return [
      { key: 'result', label: 'Result', type: 'object' },
      { key: 'logs', label: 'Console Logs', type: 'array' },
      { key: 'error', label: 'Error', type: 'string' },
    ];
  }

  // ─── Variable / calculation nodes ──────────────────────────────
  if (nodeType.includes('set-variable') || nodeType.includes('assign') || nodeType.includes('calculate') || nodeType.includes('math')) {
    return [
      { key: 'value', label: 'Value', type: 'object' },
    ];
  }

  // ─── Parallel / try-catch ──────────────────────────────────────
  if (nodeType.includes('parallel')) {
    return [
      { key: 'results', label: 'Branch Results', type: 'array' },
      { key: 'completedBranches', label: 'Completed Branches', type: 'number' },
    ];
  }
  if (nodeType.includes('try-catch') || nodeType.includes('error')) {
    return [
      { key: 'success', label: 'Success', type: 'boolean' },
      { key: 'error', label: 'Error', type: 'string' },
      { key: 'output', label: 'Output', type: 'object' },
    ];
  }

  // ─── Scheduled trigger ─────────────────────────────────────────
  if (nodeType.includes('scheduled') || nodeType.includes('cron')) {
    return [
      { key: 'triggeredAt', label: 'Triggered At', type: 'date' },
      { key: 'scheduleName', label: 'Schedule Name', type: 'string' },
    ];
  }

  // ─── Contact node ──────────────────────────────────────────────
  if (entityType === 'contact' || nodeType.includes('contact')) {
    return [
      { key: 'id', label: 'ID', type: 'number' },
      { key: 'name', label: 'Name', type: 'string' },
      { key: 'email', label: 'Email', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'string' },
    ];
  }

  // ─── Dynamic Form node ────────────────────────────────────────
  if (nodeType === 'dynamic-form') {
    return [
      { key: 'formId', label: 'Form ID', type: 'number' },
      { key: 'formName', label: 'Form Name', type: 'string' },
      { key: 'responses', label: 'Responses', type: 'object' },
      { key: 'submittedBy', label: 'Submitted By', type: 'string' },
      { key: 'submittedAt', label: 'Submitted At', type: 'date' },
    ];
  }

  // ─── Data Transfer node ───────────────────────────────────────
  if (nodeType === 'data-transfer') {
    return [
      { key: 'records', label: 'Records', type: 'array' },
      { key: 'count', label: 'Record Count', type: 'number' },
      { key: 'success', label: 'Success', type: 'boolean' },
      { key: 'affectedId', label: 'Affected ID', type: 'number' },
    ];
  }

  // ─── Custom LLM node ─────────────────────────────────────────
  if (nodeType === 'custom-llm') {
    return [
      { key: 'output', label: 'Output', type: 'string' },
      { key: 'model', label: 'Model Used', type: 'string' },
      { key: 'tokensUsed', label: 'Tokens Used', type: 'number' },
      { key: 'provider', label: 'Provider', type: 'string' },
    ];
  }

  // ─── Generic fallback ─────────────────────────────────────────
  return [
    { key: 'output', label: 'Output', type: 'object' },
  ];
}

// Get upstream nodes (nodes that come before the current node)
function getUpstreamNodes(currentNodeId: string, nodes: Node[], edges: Edge[]): Node[] {
  const upstream: Node[] = [];
  const visited = new Set<string>();

  function traverse(nodeId: string) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);

    // Find edges that target this node
    const incomingEdges = edges.filter(e => e.target === nodeId);
    for (const edge of incomingEdges) {
      const sourceNode = nodes.find(n => n.id === edge.source);
      if (sourceNode && sourceNode.id !== currentNodeId) {
        upstream.push(sourceNode);
        traverse(sourceNode.id);
      }
    }
  }

  traverse(currentNodeId);
  return upstream;
}

const typeIcons: Record<string, React.ComponentType<any>> = {
  string: Type,
  number: Hash,
  boolean: ToggleLeft,
  date: Calendar,
  object: List,
  array: List,
};

interface VariablePickerProps {
  currentNodeId: string;
  nodes: Node[];
  edges: Edge[];
  onSelect: (variable: string) => void;
  triggerLabel?: string;
}

export function VariablePicker({ currentNodeId, nodes, edges, onSelect, triggerLabel }: VariablePickerProps) {
  const { t } = useTranslation('workflow');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSteps, setExpandedSteps] = useState<string[]>([]);
  const [open, setOpen] = useState(false);

  const upstreamSteps = useMemo((): StepOutput[] => {
    const upstreamNodes = getUpstreamNodes(currentNodeId, nodes, edges);
    return upstreamNodes.map(node => ({
      stepId: node.id,
      stepName: (node.data as any)?.label || (node.data as any)?.config?.name || node.id,
      stepType: (node.data as any)?.type || 'unknown',
      icon: (node.data as any)?.icon,
      fields: inferOutputSchema(node),
    }));
  }, [currentNodeId, nodes, edges]);

  const filteredSteps = useMemo(() => {
    if (!searchQuery) return upstreamSteps;
    const q = searchQuery.toLowerCase();
    return upstreamSteps.filter(step =>
      step.stepName.toLowerCase().includes(q) ||
      step.fields.some(f => f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q))
    ).map(step => ({
      ...step,
      fields: step.fields.filter(f =>
        f.label.toLowerCase().includes(q) || f.key.toLowerCase().includes(q) ||
        step.stepName.toLowerCase().includes(q)
      ),
    }));
  }, [upstreamSteps, searchQuery]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps(prev =>
      prev.includes(stepId) ? prev.filter(id => id !== stepId) : [...prev, stepId]
    );
  };

  const handleSelect = (stepId: string, fieldPath: string) => {
    const step = upstreamSteps.find(s => s.stepId === stepId);
    const stepRef = step?.stepName?.replace(/\s+/g, '_').toLowerCase() || stepId;
    const variable = `{{${stepRef}.${fieldPath}}}`;
    onSelect(variable);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5">
          <Zap className="h-3 w-3" />
          {triggerLabel || t('variablePicker.insert', 'Insert Variable')}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-2 border-b border-border">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder={t('variablePicker.search', 'Search variables...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
        </div>

        <ScrollArea className="max-h-[300px]">
          {filteredSteps.length === 0 ? (
            <div className="p-4 text-center text-xs text-muted-foreground">
              {upstreamSteps.length === 0
                ? t('variablePicker.noUpstream', 'No upstream steps available')
                : t('variablePicker.noResults', 'No matching variables')}
            </div>
          ) : (
            <div className="p-1">
              {filteredSteps.map(step => (
                <div key={step.stepId}>
                  <button
                    onClick={() => toggleStep(step.stepId)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2 py-1.5 rounded-md',
                      'hover:bg-muted transition-colors text-xs font-medium'
                    )}
                  >
                    <ChevronRight className={cn(
                      'h-3 w-3 transition-transform',
                      expandedSteps.includes(step.stepId) && 'rotate-90'
                    )} />
                    {step.icon && <step.icon className="h-3.5 w-3.5 text-primary" />}
                    <span className="truncate flex-1 text-left">{step.stepName}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {step.fields.length}
                    </Badge>
                  </button>

                  {expandedSteps.includes(step.stepId) && (
                    <div className="ml-5 border-l border-border pl-2 mb-1">
                      {step.fields.map(field => {
                        const TypeIcon = typeIcons[field.type] || Type;
                        return (
                          <div key={field.key}>
                            <button
                              onClick={() => handleSelect(step.stepId, field.key)}
                              className={cn(
                                'w-full flex items-center gap-2 px-2 py-1 rounded-sm',
                                'hover:bg-primary/10 transition-colors text-xs'
                              )}
                            >
                              <TypeIcon className="h-3 w-3 text-muted-foreground" />
                              <span className="flex-1 text-left">{field.label}</span>
                              <span className="text-[10px] text-muted-foreground font-mono">{field.type}</span>
                            </button>

                            {/* Nested children */}
                            {field.children && field.children.length > 0 && (
                              <div className="ml-4 border-l border-border/50 pl-2">
                                {field.children.map(child => {
                                  const ChildIcon = typeIcons[child.type] || Type;
                                  return (
                                    <button
                                      key={child.key}
                                      onClick={() => handleSelect(step.stepId, `${field.key}.${child.key}`)}
                                      className={cn(
                                        'w-full flex items-center gap-2 px-2 py-0.5 rounded-sm',
                                        'hover:bg-primary/10 transition-colors text-[11px]'
                                      )}
                                    >
                                      <ChildIcon className="h-2.5 w-2.5 text-muted-foreground" />
                                      <span className="flex-1 text-left">{child.label}</span>
                                      <span className="text-[9px] text-muted-foreground font-mono">{child.type}</span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        <div className="p-2 border-t border-border">
          <p className="text-[10px] text-muted-foreground text-center">
            {t('variablePicker.hint', 'Click a field to insert {{variable}} reference')}
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Standalone component to show output schema on nodes
export function StepOutputSchemaPreview({ node }: { node: Node }) {
  const fields = inferOutputSchema(node);
  
  if (fields.length === 0) return null;

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {fields.slice(0, 4).map(field => {
        const Icon = typeIcons[field.type] || Type;
        return (
          <span
            key={field.key}
            className="inline-flex items-center gap-0.5 px-1 py-0.5 rounded text-[9px] bg-muted/60 text-muted-foreground"
          >
            <Icon className="h-2 w-2" />
            {field.key}
          </span>
        );
      })}
      {fields.length > 4 && (
        <span className="text-[9px] text-muted-foreground">+{fields.length - 4}</span>
      )}
    </div>
  );
}

export { inferOutputSchema, getUpstreamNodes };
