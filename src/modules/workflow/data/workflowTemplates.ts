/**
 * Ready-to-use workflow templates shown in the Templates gallery.
 *
 * Each template is a small graph (3–8 nodes) that demonstrates a real
 * business pattern. Picking one loads its nodes + edges straight onto
 * the canvas, fully editable.
 *
 * Keep node `data.type` strings aligned with what WorkflowNode renders
 * (contact, offer, sale, service-order, dispatch, email-llm, etc.) so
 * existing styling and icons apply automatically.
 */
import type { Node, Edge } from '@xyflow/react';
import {
  Zap, Mail, Bell, Shield, Clock, Webhook, Calendar, Sparkles, Bot, Brain,
  FileText, DollarSign, ShoppingCart, Truck, Users, Send, GitBranch, Split,
  Repeat, Globe, Code, FormInput, ArrowLeftRight, Database, ClipboardList,
} from 'lucide-react';

export type TemplateCategory =
  | 'sales' | 'service' | 'dispatch' | 'crm' | 'ai' | 'integration' | 'ops';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  icon: React.ComponentType<{ className?: string }>;
  /** Optional small badge ("AI", "New", "Popular"). */
  badge?: string;
  nodes: Node[];
  edges: Edge[];
}

// ─── helpers ─────────────────────────────────────────────────────────────────
const n = (
  id: string,
  type: string,
  label: string,
  description: string,
  icon: any,
  x: number,
  y: number,
): Node => ({
  id, type: 'workflowNode',
  position: { x, y },
  data: { label, type, icon, description },
});
const e = (id: string, source: string, target: string, label?: string, animated = true): Edge => ({
  id, source, target, label, animated, type: 'smoothstep',
});

// ─── 1. Offer → Sale → Service → Dispatch pipeline ───────────────────────────
const offerToDispatch: WorkflowTemplate = {
  id: 'offer-to-dispatch',
  name: 'Offer → Sale → Service → Dispatch',
  description: 'The full sales pipeline: contact creates an offer, AI drafts the email, on acceptance a sale is created, then a service order, then a dispatch.',
  category: 'sales',
  icon: FileText, badge: 'Popular',
  nodes: [
    n('trg', 'offer-status-trigger', 'Offer accepted', 'Triggers when offer status becomes "accepted"', Zap, 40, 200),
    n('sale', 'sale', 'Create Sale', 'Convert the offer to a sale automatically', DollarSign, 280, 200),
    n('so', 'service-order', 'Create Service Order', 'Plan the work to be done', ShoppingCart, 540, 200),
    n('disp', 'dispatch', 'Create Dispatch', 'Schedule a technician', Truck, 800, 200),
    n('notif', 'notification', 'Notify customer', 'In-app + email confirmation', Bell, 800, 360),
  ],
  edges: [
    e('e1', 'trg', 'sale'),
    e('e2', 'sale', 'so'),
    e('e3', 'so', 'disp'),
    e('e4', 'disp', 'notif'),
  ],
};

// ─── 2. New-lead nurturing sequence ──────────────────────────────────────────
const leadNurturing: WorkflowTemplate = {
  id: 'lead-nurturing',
  name: 'Lead nurturing sequence',
  description: 'When a new contact is created, send a welcome email, wait 3 days, AI-write a follow-up if there is no reply.',
  category: 'crm',
  icon: Users, badge: 'Popular',
  nodes: [
    n('trg', 'contact-trigger', 'New contact', 'Triggers when a contact is created', Zap, 40, 180),
    n('mail1', 'email-template', 'Welcome email', 'Templated greeting + brochure', Mail, 280, 180),
    n('wait', 'delay', 'Wait 3 days', 'Give the lead time to read', Clock, 540, 180),
    n('cond', 'condition', 'Replied?', 'Branch on contact.lastReplyAt', GitBranch, 780, 180),
    n('done', 'notification', 'Mark as engaged', 'Tag contact engaged=true', Bell, 1040, 80),
    n('ai', 'ai-email-writer', 'AI follow-up', 'Personalised re-engagement email', Sparkles, 1040, 280),
  ],
  edges: [
    e('e1', 'trg', 'mail1'),
    e('e2', 'mail1', 'wait'),
    e('e3', 'wait', 'cond'),
    e('e4', 'cond', 'done', 'yes'),
    e('e5', 'cond', 'ai', 'no'),
  ],
};

// ─── 3. High-value offer approval ────────────────────────────────────────────
const highValueApproval: WorkflowTemplate = {
  id: 'high-value-approval',
  name: 'High-value offer approval',
  description: 'Offers above 10 000 require manager sign-off before being sent. Auto-rejects after 24 h.',
  category: 'sales',
  icon: Shield,
  nodes: [
    n('trg', 'offer-status-trigger', 'Offer ready to send', 'draft → pending review', Zap, 40, 200),
    n('cond', 'condition', 'Total > 10 000?', 'offer.totalAmount > 10000', GitBranch, 280, 200),
    n('appr', 'approval', 'Manager sign-off', 'Sales Manager · 24 h timeout', Shield, 540, 100),
    n('send', 'email-template', 'Send to customer', 'Templated offer PDF', Mail, 800, 200),
    n('skip', 'sale', 'Auto-mark sent', 'Below threshold, no approval needed', DollarSign, 540, 320),
  ],
  edges: [
    e('e1', 'trg', 'cond'),
    e('e2', 'cond', 'appr', 'yes'),
    e('e3', 'cond', 'skip', 'no'),
    e('e4', 'appr', 'send', 'approved'),
    e('e5', 'skip', 'send'),
  ],
};

// ─── 4. Dispatch reminders ───────────────────────────────────────────────────
const dispatchReminders: WorkflowTemplate = {
  id: 'dispatch-reminders',
  name: 'Dispatch day-before SMS',
  description: 'Every dispatch scheduled for tomorrow gets an SMS to both the customer and the technician at 6 PM today.',
  category: 'dispatch',
  icon: Truck,
  nodes: [
    n('trg', 'scheduled-trigger', 'Every day at 18:00', 'cron: 0 18 * * *', Calendar, 40, 200),
    n('q', 'http', 'Fetch tomorrow dispatches', 'GET /dispatches?date=tomorrow', Database, 280, 200),
    n('loop', 'loop', 'For each dispatch', 'Iterate over list', Repeat, 540, 200),
    n('sms1', 'sms', 'SMS customer', 'Time + technician name', Send, 800, 120),
    n('sms2', 'sms', 'SMS technician', 'Address + checklist', Send, 800, 280),
  ],
  edges: [
    e('e1', 'trg', 'q'),
    e('e2', 'q', 'loop'),
    e('e3', 'loop', 'sms1'),
    e('e4', 'loop', 'sms2'),
  ],
};

// ─── 5. Service-order escalation ─────────────────────────────────────────────
const serviceEscalation: WorkflowTemplate = {
  id: 'service-escalation',
  name: 'Service-order SLA escalation',
  description: 'If a service order stays "in progress" for more than 48 h, notify ops lead and tag urgent.',
  category: 'service',
  icon: Clock,
  nodes: [
    n('trg', 'service-order-status-trigger', 'Status → in progress', 'service_order.status change', Zap, 40, 180),
    n('wait', 'delay', 'Wait 48 hours', 'Business hours only', Clock, 280, 180),
    n('cond', 'condition', 'Still in progress?', 'recheck current status', GitBranch, 540, 180),
    n('tag', 'service-order', 'Tag urgent', 'service_order.priority = urgent', ShoppingCart, 800, 80),
    n('notify', 'notification', 'Ping ops lead', 'In-app + email', Bell, 1040, 80),
  ],
  edges: [
    e('e1', 'trg', 'wait'),
    e('e2', 'wait', 'cond'),
    e('e3', 'cond', 'tag', 'yes'),
    e('e4', 'tag', 'notify'),
  ],
};

// ─── 6. Stripe webhook → mark sale paid ──────────────────────────────────────
const stripePaid: WorkflowTemplate = {
  id: 'stripe-payment',
  name: 'Stripe payment → mark sale paid',
  description: 'Listen to Stripe payment_succeeded, look up the matching sale, mark as paid, send invoice PDF.',
  category: 'integration',
  icon: Webhook,
  nodes: [
    n('trg', 'webhook-trigger', 'Stripe webhook', 'payment_succeeded', Webhook, 40, 200),
    n('find', 'http', 'Find sale by reference', 'GET /sales?ref={{event.metadata.sale}}', Globe, 280, 200),
    n('upd', 'sale', 'Mark sale paid', 'sale.status = paid', DollarSign, 540, 200),
    n('inv', 'email-template', 'Email invoice PDF', 'Templated receipt', Mail, 800, 200),
  ],
  edges: [
    e('e1', 'trg', 'find'),
    e('e2', 'find', 'upd'),
    e('e3', 'upd', 'inv'),
  ],
};

// ─── 7. AI lead scoring & routing ────────────────────────────────────────────
const aiLeadScoring: WorkflowTemplate = {
  id: 'ai-lead-scoring',
  name: 'AI lead scoring & routing',
  description: 'New leads are scored 0–100 by an LLM, then routed to the right sales rep based on score and territory.',
  category: 'ai',
  icon: Brain, badge: 'AI',
  nodes: [
    n('trg', 'contact-trigger', 'New lead', 'Contact created from form', Zap, 40, 200),
    n('ai', 'ai-analyzer', 'AI score lead', 'gemini-2.5-flash · 0–100', Brain, 280, 200),
    n('sw', 'switch', 'Route by score', 'hot / warm / cold', Split, 540, 200),
    n('hot', 'notification', 'Assign to closer', 'Top rep · instant alert', Bell, 800, 80),
    n('warm', 'email-template', 'Nurture sequence', 'Drip campaign starts', Mail, 800, 200),
    n('cold', 'ai-email-writer', 'AI generic welcome', 'Low-touch greeting', Sparkles, 800, 320),
  ],
  edges: [
    e('e1', 'trg', 'ai'),
    e('e2', 'ai', 'sw'),
    e('e3', 'sw', 'hot', 'hot'),
    e('e4', 'sw', 'warm', 'warm'),
    e('e5', 'sw', 'cold', 'cold'),
  ],
};

// ─── 8. Weekly KPI digest ────────────────────────────────────────────────────
const weeklyDigest: WorkflowTemplate = {
  id: 'weekly-digest',
  name: 'Weekly KPI digest',
  description: 'Every Monday at 9 AM, pull the past-week numbers from the API, have AI write a human summary, email it to the team.',
  category: 'ops',
  icon: Calendar,
  nodes: [
    n('trg', 'scheduled-trigger', 'Mondays 09:00', '0 9 * * 1', Calendar, 40, 200),
    n('http', 'http', 'Fetch KPIs', 'GET /analytics/week', Globe, 280, 200),
    n('ai', 'ai-email-writer', 'AI write summary', 'Tone: executive', Sparkles, 540, 200),
    n('mail', 'email-template', 'Send to team@', 'HTML template', Mail, 800, 200),
  ],
  edges: [
    e('e1', 'trg', 'http'),
    e('e2', 'http', 'ai'),
    e('e3', 'ai', 'mail'),
  ],
};

// ─── 9. Abandoned offer recovery ─────────────────────────────────────────────
const abandonedOffer: WorkflowTemplate = {
  id: 'abandoned-offer',
  name: 'Abandoned offer recovery',
  description: 'Offers in "sent" status for >5 days get a polite reminder + small discount if total < 5 000.',
  category: 'sales',
  icon: Repeat,
  nodes: [
    n('trg', 'scheduled-trigger', 'Daily 10:00', '0 10 * * *', Calendar, 40, 200),
    n('q', 'http', 'Sent > 5 days', 'GET /offers?status=sent&age>5d', Globe, 280, 200),
    n('loop', 'loop', 'For each offer', '', Repeat, 540, 200),
    n('cond', 'condition', 'Total < 5 000?', 'offer.totalAmount < 5000', GitBranch, 800, 200),
    n('disc', 'ai-email-writer', 'AI offer discount', '5% time-limited', Sparkles, 1040, 100),
    n('plain', 'email-template', 'Polite reminder', 'No discount', Mail, 1040, 300),
  ],
  edges: [
    e('e1', 'trg', 'q'),
    e('e2', 'q', 'loop'),
    e('e3', 'loop', 'cond'),
    e('e4', 'cond', 'disc', 'yes'),
    e('e5', 'cond', 'plain', 'no'),
  ],
};

// ─── 10. Form submission → triage ────────────────────────────────────────────
const formTriage: WorkflowTemplate = {
  id: 'form-triage',
  name: 'Contact form → triage',
  description: 'Public contact form posts here; AI classifies the message (sales / support / spam) and routes accordingly.',
  category: 'crm',
  icon: FormInput,
  nodes: [
    n('trg', 'webhook-trigger', 'Form webhook', 'POST /hooks/contact', Webhook, 40, 200),
    n('ai', 'ai-analyzer', 'AI classify intent', 'sales · support · spam', Brain, 280, 200),
    n('sw', 'switch', 'Route', '', Split, 540, 200),
    n('sales', 'notification', 'Ping sales', '', Bell, 800, 60),
    n('sup', 'service-order', 'Open ticket', '', ShoppingCart, 800, 200),
    n('spam', 'code', 'Drop & log', 'silently archive', Code, 800, 340),
  ],
  edges: [
    e('e1', 'trg', 'ai'),
    e('e2', 'ai', 'sw'),
    e('e3', 'sw', 'sales', 'sales'),
    e('e4', 'sw', 'sup', 'support'),
    e('e5', 'sw', 'spam', 'spam'),
  ],
};

// ─── 11. Birthday greeting ───────────────────────────────────────────────────
const birthday: WorkflowTemplate = {
  id: 'birthday-greeting',
  name: 'Customer birthday greeting',
  description: 'Daily check for contacts whose birthday is today, AI-write a personal note with a small thank-you coupon.',
  category: 'crm',
  icon: Sparkles, badge: 'AI',
  nodes: [
    n('trg', 'scheduled-trigger', 'Every day 08:00', '0 8 * * *', Calendar, 40, 200),
    n('q', 'http', 'Today\'s birthdays', 'GET /contacts?birthday=today', Globe, 280, 200),
    n('loop', 'loop', 'For each contact', '', Repeat, 540, 200),
    n('ai', 'ai-email-writer', 'AI personal note', 'Warm tone + coupon code', Sparkles, 800, 200),
    n('mail', 'email-template', 'Send greeting', '', Mail, 1040, 200),
  ],
  edges: [
    e('e1', 'trg', 'q'),
    e('e2', 'q', 'loop'),
    e('e3', 'loop', 'ai'),
    e('e4', 'ai', 'mail'),
  ],
};

// ─── 12. Service order completed → review request ────────────────────────────
const reviewRequest: WorkflowTemplate = {
  id: 'review-request',
  name: 'Job done → request review',
  description: 'When a service order is marked completed, wait 1 day, then email the customer asking for a review.',
  category: 'service',
  icon: ClipboardList,
  nodes: [
    n('trg', 'service-order-status-trigger', 'Service completed', 'status → completed', Zap, 40, 200),
    n('wait', 'delay', 'Wait 1 day', '', Clock, 280, 200),
    n('mail', 'email-template', 'Ask for review', 'Star rating link', Mail, 540, 200),
    n('wait2', 'delay', 'Wait 3 days', '', Clock, 800, 200),
    n('cond', 'condition', 'Got a response?', 'review.received', GitBranch, 1040, 200),
    n('thx', 'notification', 'Thank you note', '', Bell, 1300, 100),
    n('nudge', 'email-template', 'Friendly nudge', '', Mail, 1300, 300),
  ],
  edges: [
    e('e1', 'trg', 'wait'),
    e('e2', 'wait', 'mail'),
    e('e3', 'mail', 'wait2'),
    e('e4', 'wait2', 'cond'),
    e('e5', 'cond', 'thx', 'yes'),
    e('e6', 'cond', 'nudge', 'no'),
  ],
};

export const workflowTemplates: WorkflowTemplate[] = [
  offerToDispatch,
  leadNurturing,
  highValueApproval,
  dispatchReminders,
  serviceEscalation,
  stripePaid,
  aiLeadScoring,
  weeklyDigest,
  abandonedOffer,
  formTriage,
  birthday,
  reviewRequest,
];

export const templateCategories: { id: TemplateCategory | 'all'; label: string }[] = [
  { id: 'all',         label: 'All templates' },
  { id: 'sales',       label: 'Sales' },
  { id: 'crm',         label: 'CRM' },
  { id: 'service',     label: 'Service' },
  { id: 'dispatch',    label: 'Dispatch' },
  { id: 'ai',          label: 'AI' },
  { id: 'integration', label: 'Integrations' },
  { id: 'ops',         label: 'Operations' },
];
