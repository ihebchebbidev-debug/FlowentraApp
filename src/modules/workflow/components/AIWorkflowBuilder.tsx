import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Node, Edge, MarkerType } from '@xyflow/react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Send, RotateCcw, Check, AlertCircle, Zap, FileText, DollarSign, ShoppingCart, Truck, Users, GitBranch, Mail, Bot, Brain, Webhook, Calendar, Database, Bell, Clock, Globe, ArrowLeftRight, Sparkles, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { AiLogoIcon } from '@/components/ai-assistant/AiLogoIcon';

// Icon mapping for AI-generated nodes
const AI_NODE_ICONS: Record<string, React.ComponentType<any>> = {
  'offer-status-trigger': FileText, 'sale-status-trigger': DollarSign,
  'service-order-status-trigger': ShoppingCart, 'dispatch-status-trigger': Truck,
  'webhook-trigger': Webhook, 'scheduled-trigger': Calendar,
  'offer': FileText, 'sale': DollarSign, 'service-order': ShoppingCart,
  'dispatch': Truck, 'contact': Users,
  'create-offer': FileText, 'create-sale': DollarSign,
  'create-service-order': ShoppingCart, 'create-dispatch': Truck,
  'update-offer-status': FileText, 'update-sale-status': DollarSign,
  'update-service-order-status': ShoppingCart, 'update-dispatch-status': Truck,
  'if-else': GitBranch, 'switch': GitBranch, 'loop': Zap,
  'send-notification': Bell, 'send-email': Mail, 'request-approval': Check,
  'delay': Clock, 'http-request': Globe, 'data-transfer': ArrowLeftRight,
  'ai-email-writer': Sparkles, 'ai-analyzer': Bot, 'ai-agent': Brain,
  'custom-llm': Brain, 'database': Database, 'dynamic-form': FileText,
  'human-input-form': Users, 'wait-for-event': Clock,
  'code': Zap, 'javascript': Zap,
};

// Use centralized key manager for all AI calls
import { callWithFallback } from '@/services/aiKeyManager';
import { useAiAssistantAvailable } from '@/hooks/useAiAssistantAvailable';
import { AI_ERROR_OFFLINE } from '@/services/ai/aiNetworkGate';


// All available node types the AI can use
const AVAILABLE_NODE_TYPES = [
  // Triggers
  'offer-status-trigger', 'sale-status-trigger', 'service-order-status-trigger',
  'dispatch-status-trigger', 'webhook-trigger', 'scheduled-trigger',
  // Entities
  'offer', 'sale', 'service-order', 'dispatch', 'contact',
  // Actions
  'create-offer', 'create-sale', 'create-service-order', 'create-dispatch',
  'update-offer-status', 'update-sale-status', 'update-service-order-status', 'update-dispatch-status',
  // Conditions
  'if-else', 'switch', 'loop',
  // Communication
  'send-notification', 'send-email', 'request-approval', 'delay',
  'human-input-form', 'wait-for-event',
  // AI
  'ai-email-writer', 'ai-analyzer', 'ai-agent', 'custom-llm',
  // Integration
  'dynamic-form', 'data-transfer', 'http-request', 'code',
];

const SYSTEM_PROMPT = `You are an expert workflow automation architect for FlowService, a CRM & field service management platform.
You design production-ready, fully-functional workflows. Every workflow you generate MUST work when executed by the backend engine.

## CRITICAL RULES
1. Output ONLY valid JSON — no markdown, no code fences, no explanatory text outside the JSON.
2. Every workflow MUST start with exactly ONE trigger node.
3. Every node MUST have at least one incoming edge (except the trigger) and one outgoing edge (except terminal nodes).
4. if-else edges MUST use "sourceHandle": "yes" and "sourceHandle": "no" — both branches MUST connect to a node.
5. Use ONLY the exact status values listed below. Any typo = broken workflow.
6. Every config must be COMPLETE — never leave required fields empty.
7. Detect user language (French/English). ALL labels, descriptions, email subjects/bodies MUST match user language.

## OUTPUT FORMAT
{ "nodes": [...], "edges": [...], "name": "Workflow Name", "description": "One-line summary" }

## NODE SCHEMA
{ "id": "node-1", "type": "<type>", "label": "Human label", "config": { <complete config> } }

## EDGE SCHEMA
{ "source": "node-1", "target": "node-2" }
For if-else: { "source": "node-2", "target": "node-3", "sourceHandle": "yes" }

## AVAILABLE NODE TYPES & REQUIRED CONFIG

### Triggers (exactly one per workflow)
| Type | Required Config |
|------|----------------|
| offer-status-trigger | { "entityType": "offer", "fromStatus": "<status>", "toStatus": "<status>" } |
| sale-status-trigger | { "entityType": "sale", "fromStatus": "<status>", "toStatus": "<status>" } |
| service-order-status-trigger | { "entityType": "service_order", "fromStatus": "<status>", "toStatus": "<status>" } |
| dispatch-status-trigger | { "entityType": "dispatch", "fromStatus": "<status>", "toStatus": "<status>" } |
| webhook-trigger | { "method": "POST" } |
| scheduled-trigger | { "cronExpression": "0 9 * * 1-5", "timezone": "Europe/Paris" } |

### Entity Actions
| Type | Required Config |
|------|----------------|
| create-sale | { "entityType": "sale", "autoCreate": true } |
| create-service-order | { "entityType": "service_order", "autoCreate": true } |
| create-dispatch | { "entityType": "dispatch", "autoCreate": true, "createPerService": true } |
| update-offer-status | { "entityType": "offer", "newStatus": "<status>" } |
| update-sale-status | { "entityType": "sale", "newStatus": "<status>" } |
| update-service-order-status | { "entityType": "service_order", "newStatus": "<status>" } |
| update-dispatch-status | { "entityType": "dispatch", "newStatus": "<status>" } |

### Conditions
| Type | Required Config |
|------|----------------|
| if-else | { "field": "sale.items", "operator": "any_match", "value": "service" } |
| switch | { "field": "status", "cases": [{"value":"a","label":"Case A"}] } |

### Communication & Email
| Type | Required Config |
|------|----------------|
| send-email | { "recipientType": "<type>", "to": "<dynamic_ref>", "subject": "Subject", "body": "<rich email body>", "template": "template-name" } |
| send-notification | { "title": "Title", "message": "Message body", "notificationType": "info", "recipientType": "team" } |
| request-approval | { "approverRole": "manager", "timeoutHours": 24, "title": "Approval needed", "message": "Please review" } |
| delay | { "delayMs": 300000 } |

### AI Nodes
| Type | Required Config |
|------|----------------|
| ai-email-writer | { "prompt": "Write a thank you email for {{trigger.contactName}}", "model": "default" } |
| ai-analyzer | { "prompt": "Analyze...", "model": "default", "maxTokens": 1000 } |

### Integration
| Type | Required Config |
|------|----------------|
| http-request | { "url": "https://...", "method": "POST", "headers": {}, "body": {} } |
| data-transfer | { "sourceEntity": "offer", "targetEntity": "sale", "fieldMapping": {} } |
| code | { "code": "const data = input.trigger; return { processed: true };", "continueOnError": false } |

## EXACT STATUS VALUES (use ONLY these — any deviation breaks the workflow)
- **Offer**: draft, sent, accepted, declined, modified, cancelled
- **Sale**: created, in_progress, invoiced, partially_invoiced, closed, cancelled
- **Service Order**: draft, pending, ready_for_planning, planned, scheduled, in_progress, on_hold, partially_completed, technically_completed, ready_for_invoice, completed, invoiced, closed, cancelled
- **Dispatch**: pending, planned, confirmed, rejected, in_progress, completed, cancelled

## OPERATOR VALUES FOR CONDITIONS
equals, not_equals, contains, not_contains, greater_than, less_than, is_empty, is_not_empty, all_match, any_match, none_match

## BUSINESS PIPELINE KNOWLEDGE
The FlowService pipeline is: Offer → Sale → Service Order → Job → Dispatch
- A Sale can have items of type "service" or "product" (SaleItem.Type = "service" | "article")
- When a Sale has service-type items (RequiresServiceOrder=true), Service Orders should be created
- Service Orders contain Jobs (ServiceOrderJob), each Job spawns a Dispatch for field technicians
- Dispatches have AssignedTechnicians (DispatchTechnician → User with Id, Name, Email)
- "closed" on a Sale means payment is complete
- "invoiced" on a Service Order means the invoice has been generated
- Contacts are linked to ALL entities via ContactId — Contact has: Name, Email, Phone, Company, Address, City

## COMPLETE ENTITY DATA MODELS (from actual backend schema)

### Contact (table: Contacts)
Fields: id, firstName, lastName, name (display), email, phone, company, position, address, city, country, postalCode, notes, status ("active"/"inactive"), type ("individual"/"company"), avatar, favorite, cin, matriculeFiscale, latitude, longitude, hasLocation
- name = full display name, email/phone may be null

### Offer (table: Offers)
Fields: id, offerNumber, title, description, contactId, offerDate, validUntil, status, totalAmount, discountPercent, discountAmount, taxAmount, grandTotal, notes, termsAndConditions, currency ("TND"), taxes, taxType, discount, fiscalStamp, category, source, billingAddress, billingPostalCode, billingCountry, deliveryAddress, deliveryPostalCode, deliveryCountry, assignedTo (userId), assignedToName, tags[], createdDate, createdBy (userId), createdByName, convertedToSaleId, convertedToServiceOrderId, convertedAt
- Items: OfferItem { id, articleId, description, quantity, unitPrice, discount, taxRate, lineTotal, type ("article"/"service"), itemName, itemCode, installationId, installationName }

### Sale (table: Sales)
Fields: id, saleNumber, title, description, contactId, saleDate, status, totalAmount, discountPercent, discountAmount, taxAmount, grandTotal, paymentStatus ("pending"/"paid"/"overdue"), paymentMethod, notes, currency ("TND"), taxes, taxType, discount, fiscalStamp, stage, priority, category, source, billingAddress, deliveryAddress, estimatedCloseDate, actualCloseDate, validUntil, assignedTo (userId), assignedToName, tags[], createdDate, createdBy (userId), createdByName, offerId, materialsFulfillment, serviceOrdersStatus
- Items: SaleItem { id, articleId, description, quantity, unitPrice, discount, taxRate, lineTotal, type ("article"/"service"), itemName, itemCode, installationId, installationName, requiresServiceOrder (bool), serviceOrderGenerated (bool), serviceOrderId, fulfillmentStatus }

### Service Order (table: ServiceOrders)
Fields: id, orderNumber, contactId, orderDate, serviceType, priority ("low"/"medium"/"high"), status, scheduledDate, completedDate, totalAmount, notes, saleId, offerId, description, startDate, targetCompletionDate, actualStartDate, actualCompletionDate, estimatedDuration, actualDuration, estimatedCost, actualCost, discount, discountPercentage, tax, paymentStatus, paymentTerms ("net30"), invoiceNumber, invoiceDate, completionPercentage, requiresApproval, approvedBy, approvalDate, cancellationReason, tags[], createdDate, createdBy (userId), technicallyCompletedAt, serviceCount, completedDispatchCount
- Jobs: ServiceOrderJob { id, serviceOrderId, title, description, status ("unscheduled"/"scheduled"/"dispatched"/"completed"), workType, priority, scheduledDate, estimatedDuration, estimatedCost, actualDuration, actualCost, completionPercentage, assignedTechnicianIds[], installationId, installationName, saleItemId }
- Materials: ServiceOrderMaterial { id, serviceOrderId, saleItemId, articleId, name, sku, description, quantity, unitPrice, totalPrice, status, source }

### Dispatch (table: Dispatches)
Fields: id, dispatchNumber, contactId, serviceOrderId, projectTaskId, scheduledDate, completedDate, status ("pending"/"planned"/"confirmed"/"rejected"/"in_progress"/"completed"/"cancelled"), priority ("low"/"medium"/"high"/"urgent"), description, siteAddress, jobId, dispatchedBy (userId), dispatchedAt, completionPercentage, requiredSkills[], workLocationJson, actualStartTime, actualEndTime, actualDuration, createdDate, createdBy (userId)
- AssignedTechnicians: DispatchTechnician → resolved to UserLightDto { id, name, email } (can have MULTIPLE technicians)
- Contact: resolved to { id, name, email, phone, address, city }
- TimeEntries, Expenses, MaterialsUsed, Attachments, Notes (sub-collections)

### User (table: Users)
Fields: id, firstName, lastName, email, phone, phoneNumber, role ("User"/"Admin"/"Technician"/"Manager"), isActive, currentStatus ("online"/"offline"/"busy"), skills, profilePictureUrl, country

### Key Relationships
- Offer.ContactId → Contact (client)
- Offer.AssignedTo → User (sales person)
- Sale.ContactId → Contact (client)
- Sale.AssignedTo → User (sales person)
- Sale.OfferId → Offer (source)
- ServiceOrder.ContactId → Contact (client)
- ServiceOrder.SaleId → Sale (source)
- ServiceOrder.CreatedBy → User
- ServiceOrderJob.AssignedTechnicianIds → User[] (technicians)
- Dispatch.ContactId → Contact (client)
- Dispatch.ServiceOrderId → ServiceOrder (parent)
- Dispatch.AssignedTechnicians → DispatchTechnician[] → User[] (technicians with name + email)
- Dispatch.DispatchedBy → User (dispatcher)

## DYNAMIC TEMPLATE VARIABLES (matching actual API field names)

### Trigger Context (from the entity that triggered the workflow)
- {{trigger.entityType}} — "offer" | "sale" | "service_order" | "dispatch"
- {{trigger.entityId}} — ID of the triggering entity
- {{trigger.fromStatus}} — Previous status
- {{trigger.toStatus}} — New status

### Contact Variables (resolved from entity's ContactId)
- {{contact.name}}, {{contact.email}}, {{contact.phone}}
- {{contact.company}}, {{contact.address}}, {{contact.city}}

### Offer Variables
- {{offer.id}}, {{offer.offerNumber}}, {{offer.title}}, {{offer.status}}
- {{offer.totalAmount}}, {{offer.grandTotal}}, {{offer.currency}}
- {{offer.validUntil}}, {{offer.offerDate}}
- {{offer.assignedTo}}, {{offer.assignedToName}}
- {{offer.createdBy}}, {{offer.createdByName}}
- {{offer.contactId}} → resolved contact: {{contact.name}}, {{contact.email}}

### Sale Variables
- {{sale.id}}, {{sale.saleNumber}}, {{sale.title}}, {{sale.status}}
- {{sale.totalAmount}}, {{sale.grandTotal}}, {{sale.currency}}
- {{sale.paymentStatus}}, {{sale.paymentMethod}}
- {{sale.assignedTo}}, {{sale.assignedToName}}
- {{sale.createdBy}}, {{sale.createdByName}}
- {{sale.offerId}} — Source offer
- {{sale.items}} — Sale line items array
- {{sale.items[].type}} — "service" or "article"

### Service Order Variables
- {{serviceOrder.id}}, {{serviceOrder.orderNumber}}, {{serviceOrder.status}}
- {{serviceOrder.priority}}, {{serviceOrder.description}}
- {{serviceOrder.scheduledDate}}, {{serviceOrder.targetCompletionDate}}
- {{serviceOrder.estimatedCost}}, {{serviceOrder.actualCost}}
- {{serviceOrder.saleId}}, {{serviceOrder.offerId}}
- {{serviceOrder.createdBy}}
- {{serviceOrder.serviceCount}}, {{serviceOrder.completedDispatchCount}}
- {{serviceOrder.jobs}} — Jobs array
- {{serviceOrder.jobs[].title}}, {{serviceOrder.jobs[].status}}, {{serviceOrder.jobs[].assignedTechnicianIds}}

### Dispatch Variables
- {{dispatch.id}}, {{dispatch.dispatchNumber}}, {{dispatch.status}}
- {{dispatch.priority}}, {{dispatch.description}}
- {{dispatch.siteAddress}} — Work location address
- {{dispatch.scheduledDate}}, {{dispatch.actualStartTime}}, {{dispatch.actualEndTime}}
- {{dispatch.serviceOrderId}} — Parent service order ID
- {{dispatch.jobId}} — Related job ID
- {{dispatch.contactId}} → {{dispatch.contact.name}}, {{dispatch.contact.email}}, {{dispatch.contact.phone}}
- {{dispatch.assignedTechnicians}} — Array of { id, name, email }
- {{dispatch.assignedTechnicians[0].name}} — First technician name
- {{dispatch.assignedTechnicians[0].email}} — First technician email
- {{dispatch.dispatchedBy}} — User who dispatched
- {{dispatch.completionPercentage}}

### User / System Variables
- {{currentUser.name}}, {{currentUser.email}}, {{currentUser.role}}
- {{now}} — Current timestamp
- {{today}} — Today's date

## EMAIL INTELLIGENCE (CRITICAL)
When the user mentions sending an email, you MUST:
1. ALWAYS generate a "send-email" node (NOT just a notification).
2. Resolve the correct recipient dynamically based on context:
   - "email the technician" / "email the planned user" / "email assigned user of dispatch" → to: "{{dispatch.assignedTechnicians[0].email}}", recipientType: "assigned_user"
   - "email the client" / "email the customer" / "email the contact" → to: "{{contact.email}}", recipientType: "contact"
   - "email the creator" → to: "{{sale.createdByName}}" with lookup, recipientType: "creator"
   - "email the sales person" / "email assigned user of sale" → to: "{{sale.assignedTo}}", recipientType: "assigned_user"
   - "email the manager" → recipientType: "manager"
   - "email the team" → recipientType: "team"
3. Generate a MEANINGFUL, PROFESSIONAL email body that includes:
   - Greeting with the recipient's name variable
   - Reference the entity number (dispatchNumber, orderNumber, saleNumber, offerNumber)
   - Include relevant dates, status, address, and details
   - A clear call-to-action
   - Professional sign-off with {{currentUser.name}}
   - Match the user's language (French/English)
4. The "body" field should contain the full email text with newlines:
   - French example: "body": "Bonjour {{dispatch.assignedTechnicians[0].name}},\\n\\nVotre intervention #{{dispatch.dispatchNumber}} prévue le {{dispatch.scheduledDate}} à {{dispatch.siteAddress}} est toujours en statut \\"{{dispatch.status}}\\".\\n\\nMerci de mettre à jour le statut dès que possible.\\n\\nCordialement,\\n{{currentUser.name}}"
   - English example: "body": "Hi {{dispatch.assignedTechnicians[0].name}},\\n\\nDispatch #{{dispatch.dispatchNumber}} scheduled for {{dispatch.scheduledDate}} at {{dispatch.siteAddress}} is still in \\"{{dispatch.status}}\\" status.\\n\\nPlease update the status as soon as possible.\\n\\nBest regards,\\n{{currentUser.name}}"

## EMAIL RECIPIENTTYPE VALUES
- "contact" — The client/customer contact (from Contact entity)
- "assigned_user" — The technician(s) assigned to dispatch, or assignedTo user on offer/sale
- "creator" — The user who created the entity (createdBy field)
- "manager" — The manager of the relevant team
- "team" — All team members
- "custom" — Custom email address specified in "to" field

## SMART INTENT MAPPING
- "when sale is closed" → sale-status-trigger with toStatus: "closed"
- "service items" → if-else with field: "sale.items[].type", operator: "any_match", value: "service"
- "requires service order" → if-else with field: "sale.items[].requiresServiceOrder", operator: "any_match", value: true
- "send thank you" → send-email with appropriate subject/body to {{contact.email}}
- "invoiced" → update-service-order-status with newStatus: "invoiced"
- "approval" → request-approval + if-else (yes→proceed, no→notify)
- "CRM pipeline" → full Offer → Sale → Service Order → Dispatch chain
- "notify team" → send-notification
- "email technician" / "email user" / "email planned user" → send-email to {{dispatch.assignedTechnicians[0].email}}
- "email client" / "email contact" → send-email to {{contact.email}}
- "dispatches not in progress" → scheduled-trigger + code to query dispatches + send-email
- "check dispatches still pending/planned" → scheduled-trigger + code + if-else + send-email
- "remind" / "follow up" / "relance" → send-email with reminder-style content
- "send report" → send-email with summary data in body
- "payment pending" / "unpaid" → if-else on sale.paymentStatus or serviceOrder.paymentStatus
- "overdue" → code node to check dates, then send-email reminder
- Vague prompts → generate a comprehensive business workflow with proper error handling

## SCHEDULED CHECK PATTERNS
When users ask to "check" entities in a certain status and act on them:
1. Use "scheduled-trigger" with appropriate cron expression (e.g., "0 9 * * 1-5" for weekdays at 9am)
2. Use "code" node to query/filter entities:
   For dispatches: { "code": "const dispatches = await getEntities('dispatch', { status: 'planned' }); return { items: dispatches, count: dispatches.length };" }
   For service orders: { "code": "const orders = await getEntities('service_order', { status: 'in_progress' }); return { items: orders, count: orders.length };" }
3. Use "if-else" to check if any results: { "field": "count", "operator": "greater_than", "value": "0" }
4. Use "code" node to loop and send emails per entity: { "code": "for (const d of input.items) { await sendEmail({ to: d.assignedTechnicians?.[0]?.email, subject: 'Dispatch #' + d.dispatchNumber + ' still ' + d.status, body: '...' }); } return { sent: input.count };" }
5. Alternative: Use "send-email" node with recipientType: "assigned_user" which auto-resolves per entity

## LAYOUT POSITIONING
- Trigger: x=100, y=200
- Sequential nodes: increment x by 300
- if-else branches: yes branch at y-80, no branch at y+80, both with x+300
- Converge branches back at x+600 from the condition`;

// Helper to convert delay value + unit to milliseconds
function convertDelayToMs(value: number, unit: string): number {
  switch (unit) {
    case 'seconds': return value * 1000;
    case 'minutes': return value * 60 * 1000;
    case 'hours': return value * 60 * 60 * 1000;
    case 'days': return value * 24 * 60 * 60 * 1000;
    default: return value * 60 * 1000; // default to minutes
  }
}


interface AIWorkflowBuilderProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyWorkflow: (nodes: Node[], edges: Edge[], name: string) => void;
  existingNodes?: Node[];
}

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface GeneratedWorkflow {
  nodes: Array<{ id: string; type: string; label: string; config?: Record<string, any> }>;
  edges: Array<{ source: string; target: string; sourceHandle?: string }>;
  name: string;
  description?: string;
}

// Pre-built workflow templates
const WORKFLOW_TEMPLATES: Record<string, GeneratedWorkflow> = {
  'crm-integration': {
    name: 'Sale → CRM Integration Pipeline',
    description: 'Triggers on sale status change, waits 5 minutes, syncs to external CRM via HTTP, updates contacts, and sends notification.',
    nodes: [
      {
        id: 'node-1',
        type: 'sale-status-trigger',
        label: 'Sale Status Changed',
        config: { 
          entityType: 'sale',
          statusFilter: 'confirmed',
          description: 'Triggers when a sale is confirmed'
        },
      },
      {
        id: 'node-2',
        type: 'delay',
        label: 'Wait 5 Minutes',
        config: { 
          delayValue: 5, 
          delayUnit: 'minutes',
          delayMode: 'relative',
        },
      },
      {
        id: 'node-3',
        type: 'http-request',
        label: 'Sync to CRM API',
        config: {
          url: 'https://api.example-crm.com/v1/deals',
          httpMethod: 'POST',
          contentType: 'json',
          requestBody: '{\n  "dealName": "{{node-1.entityId}}",\n  "status": "won",\n  "amount": "{{node-1.amount}}",\n  "contact": "{{node-1.contactName}}",\n  "source": "FlowService"\n}',
          customHeaders: 'Accept: application/json',
          authType: 'bearer',
          bearerToken: '{{secrets.CRM_API_KEY}}',
          timeout: 30,
          followRedirects: true,
          retryOnFailure: true,
          retryCount: 3,
          retryDelay: 2000,
          responseFormat: 'json',
          responseMapping: 'crmDealId: $.data.id\ncrmStatus: $.data.status',
          successCondition: 'status_2xx',
          storeFullResponse: false,
        },
      },
      {
        id: 'node-4',
        type: 'data-transfer',
        label: 'Update Contact Record',
        config: {
          sourceModule: 'contacts',
          operation: 'update',
          filter: 'contactId: {{node-1.contactId}}',
          dataMapping: 'crmSynced: true\ncrmDealId: {{node-3.crmDealId}}\nlastSyncDate: {{now}}',
        },
      },
      {
        id: 'node-5',
        type: 'send-notification',
        label: 'Notify Sales Team',
        config: {
          title: 'CRM Sync Complete',
          message: 'Sale #{{node-1.entityId}} has been synced to CRM. Deal ID: {{node-3.crmDealId}}',
          recipients: 'sales_team',
          notificationType: 'info',
        },
      },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
      { source: 'node-3', target: 'node-4' },
      { source: 'node-4', target: 'node-5' },
    ],
  },
  'approval-chain': {
    name: 'Offer Approval Chain',
    description: 'When an offer is created, check amount — if > 1000 require approval, otherwise auto-approve and notify.',
    nodes: [
      { id: 'node-1', type: 'offer-status-trigger', label: 'Offer Created', config: { statusFilter: 'draft' } },
      { id: 'node-2', type: 'if-else', label: 'Amount > 1000?', config: { field: 'amount', operator: 'greater_than', value: '1000' } },
      { id: 'node-3', type: 'request-approval', label: 'Request Manager Approval', config: { approverRole: 'manager' } },
      { id: 'node-4', type: 'update-offer-status', label: 'Auto-Approve Offer', config: { targetStatus: 'sent' } },
      { id: 'node-5', type: 'send-email', label: 'Send Offer to Client', config: { to: '{{node-1.clientEmail}}', subject: 'Your offer is ready', template: 'offer-confirmation' } },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3', sourceHandle: 'yes' },
      { source: 'node-2', target: 'node-4', sourceHandle: 'no' },
      { source: 'node-3', target: 'node-5' },
      { source: 'node-4', target: 'node-5' },
    ],
  },
  'dispatch-automation': {
    name: 'Dispatch Scheduling Pipeline',
    description: 'On new service order, auto-create dispatch, wait for assignment, then notify technician.',
    nodes: [
      { id: 'node-1', type: 'service-order-status-trigger', label: 'Service Order Created', config: { statusFilter: 'created' } },
      { id: 'node-2', type: 'create-dispatch', label: 'Create Dispatch', config: { createPerService: true } },
      { id: 'node-3', type: 'delay', label: 'Wait 10 Minutes', config: { delayValue: 10, delayUnit: 'minutes' } },
      { id: 'node-4', type: 'send-notification', label: 'Alert Dispatcher', config: { title: 'New dispatch pending', message: 'Service order {{node-1.entityId}} needs assignment', recipients: 'dispatchers' } },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
      { source: 'node-3', target: 'node-4' },
    ],
  },
  'lead-nurturing': {
    name: 'Lead Nurturing',
    description: 'Webhook receives a new lead, AI analyzes their profile, then conditionally sends a personalized or generic welcome email.',
    nodes: [
      { id: 'node-1', type: 'webhook-trigger', label: 'New Lead Webhook', config: { method: 'POST', description: 'Receives lead data from landing page or ad platform' } },
      { id: 'node-2', type: 'ai-analyzer', label: 'Analyze Lead Profile', config: { prompt: 'Analyze this lead and classify as hot, warm, or cold based on their data: {{node-1.body}}', model: 'default', outputField: 'leadScore' } },
      { id: 'node-3', type: 'if-else', label: 'Is Hot Lead?', config: { field: 'leadScore', operator: 'equals', value: 'hot' } },
      { id: 'node-4', type: 'send-email', label: 'Send Personalized Email', config: { to: '{{node-1.email}}', subject: 'Welcome — let\'s schedule a call!', template: 'hot-lead-welcome' } },
      { id: 'node-5', type: 'send-email', label: 'Send Generic Welcome', config: { to: '{{node-1.email}}', subject: 'Welcome to our platform!', template: 'generic-welcome' } },
      { id: 'node-6', type: 'data-transfer', label: 'Save Lead to Contacts', config: { sourceModule: 'contacts', operation: 'create', dataMapping: 'name: {{node-1.name}}\nemail: {{node-1.email}}\nscore: {{node-2.leadScore}}\nsource: webhook' } },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
      { source: 'node-3', target: 'node-4', sourceHandle: 'yes' },
      { source: 'node-3', target: 'node-5', sourceHandle: 'no' },
      { source: 'node-4', target: 'node-6' },
      { source: 'node-5', target: 'node-6' },
    ],
  },
  'inventory-alert': {
    name: 'Inventory Alert',
    description: 'Scheduled daily check reads stock levels, checks if any item is below threshold, and sends an alert notification.',
    nodes: [
      { id: 'node-1', type: 'scheduled-trigger', label: 'Daily at 8:00 AM', config: { cronExpression: '0 8 * * *', timezone: 'UTC', description: 'Runs every day at 8 AM' } },
      { id: 'node-2', type: 'data-transfer', label: 'Read Stock Levels', config: { sourceModule: 'stock', operation: 'read', filter: 'status: active', dataMapping: 'items: {{all}}' } },
      { id: 'node-3', type: 'if-else', label: 'Any Item Below Threshold?', config: { field: 'lowStockCount', operator: 'greater_than', value: '0' } },
      { id: 'node-4', type: 'send-notification', label: 'Send Low Stock Alert', config: { title: 'Low Stock Alert ⚠️', message: '{{node-2.lowStockCount}} items are below minimum stock level. Please review and reorder.', recipients: 'inventory_team', notificationType: 'warning' } },
      { id: 'node-5', type: 'send-email', label: 'Email Stock Report', config: { to: 'inventory@company.com', subject: 'Daily Stock Report — {{node-2.lowStockCount}} items low', template: 'stock-report' } },
    ],
    edges: [
      { source: 'node-1', target: 'node-2' },
      { source: 'node-2', target: 'node-3' },
      { source: 'node-3', target: 'node-4', sourceHandle: 'yes' },
      { source: 'node-4', target: 'node-5' },
    ],
  },
};

// Call OpenRouter with fallback
async function callAI(messages: Array<{ role: string; content: string }>): Promise<string> {
  const systemMsg = messages.find(m => m.role === 'system');
  const userMsgs = messages.filter(m => m.role !== 'system');
  const system = systemMsg?.content || '';

  const result = await callWithFallback({
    system,
    messages: userMsgs,
    stream: false,
    temperature: 0.3,
    maxTokens: 4096,
  });

  if (result.success && result.content) return result.content;
  throw new Error(result.error || 'All AI models failed. Please try again.');
}

// Map generated node type to ReactFlow node type
function getReactFlowNodeType(type: string): string {
  if (type === 'loop') return 'loopNode';
  if (type === 'if-else' || type === 'switch') return 'conditionNode';
  if (type.endsWith('-trigger') && ['offer', 'sale', 'service-order', 'dispatch'].some(e => type.startsWith(e))) return 'entityTrigger';
  if (type.startsWith('create-') || type.startsWith('update-')) return 'entityAction';
  return 'n8nNode';
}

// Get icon name for display
function getNodeCategory(type: string): string {
  if (type.includes('trigger')) return 'triggers';
  if (['offer', 'sale', 'service-order', 'dispatch', 'contact'].includes(type)) return 'entities';
  if (type.startsWith('create-') || type.startsWith('update-')) return 'actions';
  if (['if-else', 'switch', 'loop'].includes(type)) return 'conditions';
  if (['send-notification', 'send-email', 'request-approval', 'delay', 'human-input-form', 'wait-for-event'].includes(type)) return 'communication';
  if (type.startsWith('ai-') || type === 'custom-llm') return 'ai';
  return 'integration';
}

function getEntityType(type: string): string | undefined {
  if (type.includes('offer')) return 'offer';
  if (type.includes('sale')) return 'sale';
  if (type.includes('service-order')) return 'service_order';
  if (type.includes('dispatch')) return 'dispatch';
  return undefined;
}

export function AIWorkflowBuilder({ open, onOpenChange, onApplyWorkflow, existingNodes }: AIWorkflowBuilderProps) {
  const { t } = useTranslation('workflow');
  const { t: tAi } = useTranslation('aiAssistant');
  const aiAssistantAvailable = useAiAssistantAvailable();

  useEffect(() => {
    if (open && !aiAssistantAvailable) onOpenChange(false);
  }, [open, aiAssistantAvailable, onOpenChange]);

  const [prompt, setPrompt] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const parseWorkflowJSON = (text: string): GeneratedWorkflow | null => {
    // Try to extract JSON from the response
    let jsonStr = text.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1].trim();
    }
    
    // Try to find JSON object
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonStr = jsonMatch[0];
    }

    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.nodes && Array.isArray(parsed.nodes) && parsed.edges && Array.isArray(parsed.edges)) {
        return parsed as GeneratedWorkflow;
      }
    } catch {
      // Failed
    }
    return null;
  };

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim()) return;

    const userMessage = prompt.trim();
    setPrompt('');
    setError(null);
    setIsGenerating(true);

    const newConversation: ConversationMessage[] = [
      ...conversation,
      { role: 'user', content: userMessage },
    ];
    setConversation(newConversation);

    try {
      const messages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...newConversation.map(m => ({ role: m.role, content: m.content })),
      ];

      const response = await callAI(messages);
      
      const parsed = parseWorkflowJSON(response);
      
      if (parsed) {
        setGeneratedWorkflow(parsed);
        
        // Build a structured, professional response
        const categorize = (type: string) => {
          if (type.includes('trigger')) return '⚡ Trigger';
          if (type.startsWith('create-') || type.startsWith('update-')) return '🔧 Action';
          if (type === 'if-else' || type === 'switch') return '🔀 Condition';
          if (type.includes('email') || type.includes('notification') || type.includes('approval')) return '📧 Communication';
          if (type.startsWith('ai-') || type === 'custom-llm') return '🤖 AI';
          if (type === 'delay') return '⏱ Timing';
          return '🔗 Integration';
        };
        
        // Group nodes by category
        const grouped = parsed.nodes.reduce((acc, n) => {
          const cat = categorize(n.type);
          if (!acc[cat]) acc[cat] = [];
          acc[cat].push(n);
          return acc;
        }, {} as Record<string, typeof parsed.nodes>);
        
        const nodesSummary = Object.entries(grouped)
          .map(([cat, nodes]) => `**${cat}**\n${nodes.map(n => `  • ${n.label}`).join('\n')}`)
          .join('\n\n');
        
        const response = [
          `### ✅ ${parsed.name}`,
          parsed.description || '',
          '',
          `**${parsed.nodes.length}** nodes · **${parsed.edges.length}** connections`,
          '',
          nodesSummary,
          '',
          '---',
          '_Refine by describing changes, or click **Apply** to add to canvas._',
        ].filter(Boolean).join('\n');
        
        setConversation(prev => [...prev, { role: 'assistant', content: response }]);
      } else {
        // AI returned text instead of JSON — show it and ask to retry
        setConversation(prev => [
          ...prev,
          { role: 'assistant', content: response },
        ]);
        setError('Could not parse workflow. Please refine your description.');
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Unknown error';
      const msg = raw === AI_ERROR_OFFLINE ? tAi('offlineUnavailable') : raw;
      setError(msg);
      setConversation(prev => [
        ...prev,
        { role: 'assistant', content: `❌ Error: ${msg}` },
      ]);
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, conversation, tAi]);

  const handleApply = useCallback(() => {
    if (!generatedWorkflow) return;

    const SPACING_X = 320;
    const SPACING_Y = 180;
    const START_X = 100;
    const START_Y = 200;

    // Smart positioning: follow edges to create a flowing left-to-right layout
    // Build adjacency from edges
    const childrenMap = new Map<string, string[]>();
    const parentMap = new Map<string, string[]>();
    for (const edge of generatedWorkflow.edges) {
      if (!childrenMap.has(edge.source)) childrenMap.set(edge.source, []);
      childrenMap.get(edge.source)!.push(edge.target);
      if (!parentMap.has(edge.target)) parentMap.set(edge.target, []);
      parentMap.get(edge.target)!.push(edge.source);
    }
    
    // Find root (trigger node — no incoming edges)
    const rootId = generatedWorkflow.nodes.find(n => !parentMap.has(n.id))?.id || generatedWorkflow.nodes[0]?.id;
    
    // BFS to assign columns (depth) and handle branching
    const positions = new Map<string, { x: number; y: number }>();
    const visited = new Set<string>();
    const queue: Array<{ id: string; col: number; row: number }> = [{ id: rootId, col: 0, row: 0 }];
    visited.add(rootId);
    
    while (queue.length > 0) {
      const { id, col, row } = queue.shift()!;
      positions.set(id, { x: START_X + col * SPACING_X, y: START_Y + row * SPACING_Y });
      
      const children = childrenMap.get(id) || [];
      const branchOffset = children.length > 1 ? -(children.length - 1) / 2 : 0;
      children.forEach((childId, i) => {
        if (!visited.has(childId)) {
          visited.add(childId);
          queue.push({ id: childId, col: col + 1, row: row + branchOffset + i });
        }
      });
    }
    
    // Position any unvisited nodes at the end
    let unvisitedCol = (positions.size > 0 ? Math.max(...[...positions.values()].map(p => p.x)) / SPACING_X + 1 : 0);
    for (const node of generatedWorkflow.nodes) {
      if (!positions.has(node.id)) {
        positions.set(node.id, { x: START_X + unvisitedCol * SPACING_X, y: START_Y });
        unvisitedCol++;
      }
    }

    const reactFlowNodes: Node[] = generatedWorkflow.nodes.map((node) => {
      const pos = positions.get(node.id) || { x: START_X, y: START_Y };
      const cfg = node.config || {};
      const isTrigger = node.type.includes('trigger');
      const isAction = node.type.startsWith('create-') || node.type.startsWith('update-');
      const isCondition = node.type === 'if-else' || node.type === 'switch';
      const isEmail = node.type.includes('email');
      const isNotification = node.type.includes('notification');
      const isApproval = node.type.includes('approval');
      const isDelay = node.type === 'delay';
      const isApi = node.type.includes('http') || node.type.includes('api');
      const isWebhook = node.type.includes('webhook');
      const isAi = node.type.startsWith('ai-') || node.type === 'custom-llm';
      const isLoop = node.type === 'loop';
      const isDatabase = node.type.includes('database') || node.type.includes('db-');
      const isScheduled = node.type.includes('scheduled');
      
      // Determine actionType from node type for action nodes
      let actionType: string | undefined;
      if (node.type.startsWith('create-')) actionType = 'create';
      else if (node.type.startsWith('update-')) actionType = 'update-status';

      return {
        id: node.id,
        type: getReactFlowNodeType(node.type),
        position: pos,
        data: {
          label: node.label,
          type: node.type,
          category: getNodeCategory(node.type),
          entityType: cfg.entityType || getEntityType(node.type),
          icon: AI_NODE_ICONS[node.type] || Zap,
          isTrigger,
          isAction,
          // CRITICAL: Spread ALL config fields to top-level so backend WorkflowNodeExecutor
          // can read them via GetNodeDataString (mirrors handlePanelConfigSave logic)
          // --- Trigger fields ---
          ...(isTrigger && { fromStatus: cfg.fromStatus || null, toStatus: cfg.toStatus || null }),
          // --- Action fields ---
          ...(isAction && { actionType, newStatus: cfg.newStatus || cfg.targetStatus || null, autoCreate: cfg.autoCreate, createPerService: cfg.createPerService }),
          // --- Condition fields (if-else AND switch) ---
          ...(isCondition && { field: cfg.field, operator: cfg.operator, value: cfg.value }),
          // --- Email fields (backend reads: to, subject, template) ---
          ...(isEmail && { to: cfg.to || cfg.recipient, subject: cfg.subject || cfg.emailSubject, template: cfg.template || cfg.emailTemplate, recipientType: cfg.recipientType }),
          // --- Notification fields (backend reads: title, message) ---
          ...(isNotification && { title: cfg.title || cfg.notificationTitle, message: cfg.message || cfg.notificationMessage, notificationType: cfg.notificationType, recipientType: cfg.recipientType }),
          // --- Approval fields (backend reads: title, message, approverRole, timeoutHours) ---
          ...(isApproval && { title: cfg.title || cfg.notificationTitle || cfg.approvalTitle, message: cfg.message || cfg.approvalMessage, approverRole: cfg.approverRole, timeoutHours: cfg.timeoutHours }),
          // --- Delay fields ---
          ...(isDelay && { delayMs: cfg.delayMs || (cfg.delayValue && cfg.delayUnit ? convertDelayToMs(cfg.delayValue, cfg.delayUnit) : undefined) }),
          // --- API/HTTP fields ---
          ...(isApi && { url: cfg.url, method: cfg.method || cfg.httpMethod, headers: cfg.headers, body: cfg.body || cfg.requestBody }),
          // --- Webhook fields ---
          ...(isWebhook && { url: cfg.url || cfg.webhookUrl, method: cfg.method }),
          // --- AI fields ---
          ...(isAi && { model: cfg.model, prompt: cfg.prompt, maxTokens: cfg.maxTokens }),
          // --- Loop fields ---
          ...(isLoop && { loopType: cfg.loopType, iterations: cfg.iterations }),
          // --- Database fields ---
          ...(isDatabase && { operation: cfg.operation, table: cfg.table }),
          // --- Scheduled fields ---
          ...(isScheduled && { cronExpression: cfg.cronExpression, timezone: cfg.timezone }),
          config: cfg,
          description: node.label,
          isAIGenerated: true,
        },
      };
    });

    const reactFlowEdges: Edge[] = generatedWorkflow.edges.map((edge, index) => ({
      id: `ai-edge-${Date.now()}-${index}`,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      type: 'addButtonEdge',
      animated: true,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { stroke: 'hsl(var(--primary))' },
    }));

    onApplyWorkflow(reactFlowNodes, reactFlowEdges, generatedWorkflow.name);
    toast.success(`AI workflow "${generatedWorkflow.name}" applied with ${reactFlowNodes.length} nodes!`);
    handleReset();
    onOpenChange(false);
  }, [generatedWorkflow, onApplyWorkflow, onOpenChange]);

  const handleReset = () => {
    setConversation([]);
    setGeneratedWorkflow(null);
    setError(null);
    setPrompt('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  // Get a simple label for node type
  const nodeTypeLabel = (type: string) => type.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Skeleton loader component for generating state
  const GeneratingSkeleton = () => (
    <div className="flex justify-start">
      <div className="w-[85%] rounded-xl bg-card border border-border p-4 space-y-3">
        {/* Header skeleton */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="space-y-1.5 flex-1">
            <Skeleton className="h-3.5 w-36" />
            <Skeleton className="h-2.5 w-24" />
          </div>
        </div>
        {/* Node list skeleton */}
        <div className="space-y-2 pt-1">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="w-5 h-5 rounded" />
              <Skeleton className="h-3 flex-1" style={{ maxWidth: `${70 + Math.random() * 30}%` }} />
            </div>
          ))}
        </div>
        {/* Action skeleton */}
        <div className="flex items-center gap-2 pt-1">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-16" />
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col gap-0 p-0 overflow-hidden border-border/60">
        {/* Professional branded header */}
        <div className="px-5 pt-4 pb-3 border-b border-border bg-card">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-sm">
              <AiLogoIcon size={18} variant="light" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-foreground leading-tight">
                {t('ai.buildWithAI', 'Build with AI')}
              </h2>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t('ai.buildDescription', 'Describe your workflow in plain language. The AI will generate it for you.')}
              </p>
            </div>
            {generatedWorkflow && (
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-[11px] font-medium">
                <Check className="h-3 w-3" />
                {t('ai.ready', 'Ready')}
              </div>
            )}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4" ref={scrollRef}>
          {conversation.length === 0 ? (
            <div className="space-y-5">
              {/* Quick prompts — curated, fewer */}
              <div>
                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">
                  {t('ai.quickAsks', 'Quick prompts')}
                </p>
                <div className="grid grid-cols-2 gap-1.5">
                  {(['saleNotify', 'offerFollowup', 'dispatchComplete', 'dailyReport'] as const).map((key) => (
                    <button
                      key={key}
                      onClick={() => setPrompt(t(`ai.ask.${key}`))}
                      className={cn(
                        "text-[12px] px-3 py-2 rounded-lg border border-border/60 bg-background",
                        "hover:bg-muted/60 hover:border-border transition-all",
                        "text-foreground/80 text-left leading-snug"
                      )}
                    >
                      {t(`ai.ask.${key}`)}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
                {t('ai.orDescribe', 'Or describe your own workflow below')}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {conversation.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={cn(
                      'max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card border border-border shadow-sm'
                    )}
                  >
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:my-1 [&_li]:my-0.5 [&_code]:text-[11px] [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <span className="leading-relaxed">{msg.content}</span>
                    )}
                  </div>
                </div>
              ))}
              {isGenerating && <GeneratingSkeleton />}
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-5 flex items-center gap-2 text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded-lg px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input + Footer */}
        <div className="px-5 pb-4 pt-3 border-t border-border bg-card/50 space-y-2.5">
          <div className="flex gap-2 items-end">
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                generatedWorkflow
                  ? t('ai.refinePlaceholder', 'Describe changes... e.g. "Add an approval step before the email"')
                  : t('ai.promptPlaceholder', 'Describe your workflow...')
              }
              rows={2}
              className="resize-none flex-1 text-sm bg-background border-border/60 focus-visible:ring-primary/30"
              disabled={isGenerating}
            />
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              size="sm"
              className="h-10 w-10 p-0 shrink-0"
            >
              {isGenerating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={conversation.length === 0 || isGenerating}
              className="text-xs text-muted-foreground h-7 px-2"
            >
              <RotateCcw className="h-3 w-3 mr-1.5" />
              {t('ai.reset', 'Reset')}
            </Button>
            <Button
              onClick={handleApply}
              disabled={!generatedWorkflow || isGenerating}
              size="sm"
              className="h-7 gap-1.5"
            >
              <Check className="h-3.5 w-3.5" />
              {t('ai.applyWorkflow', 'Apply to Canvas')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
