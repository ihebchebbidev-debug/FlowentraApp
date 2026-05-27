import type { Node, Edge } from '@xyflow/react';

/** Real palette categories from src/modules/workflow/components/panels/NodePalette.tsx */
export type PaletteCategory =
  | 'triggers'
  | 'entities'
  | 'actions'
  | 'conditions'
  | 'communication'
  | 'ai'
  | 'integration';

export type FieldType = 'select' | 'input' | 'textarea' | 'switch' | 'number' | 'tag';

export interface ConfigField {
  type: FieldType;
  label: string;
  value: string;
  options?: string[];
  hint?: string;
}

export interface ConfigPanelState {
  nodeId: string;
  title: string;
  subtitle?: string;
  icon: string;            // lucide key resolved in DemoNode ICONS
  iconColor: string;       // hex
  tab: 'general' | 'settings' | 'advanced';
  fields: ConfigField[];
}

export interface DemoState {
  paletteCategory: PaletteCategory | null;
  paletteSearch: string;
  grabbingItemId: string | null;
  nodes: Node[];
  edges: Edge[];
  highlightedNodeId: string | null;
  configPanel: ConfigPanelState | null;
  saved: boolean;
  active: boolean;
  showExecutions: boolean;
  executionLogs: { node: string; status: 'ok' | 'running' | 'wait' | 'failed'; ms?: number }[];
}

export const initialDemoState: DemoState = {
  paletteCategory: null,
  paletteSearch: '',
  grabbingItemId: null,
  nodes: [],
  edges: [],
  highlightedNodeId: null,
  configPanel: null,
  saved: false,
  active: false,
  showExecutions: false,
  executionLogs: [],
};

export interface Step {
  /** i18n key under onboarding.demo */
  caption: string;
  /** data-demo-target id to position cursor on (resolved via getBoundingClientRect) */
  target: string;
  offset?: { x: number; y: number };
  click?: boolean;
  duration: number;
  apply: (s: DemoState) => DemoState;
}

export interface Chapter {
  id: string;
  /** i18n key under onboarding.demo.chapter */
  titleKey: string;
  /** starting step index (inclusive) — filled at module load */
  start: number;
  /** ending step index (exclusive) */
  end: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const mkNode = (
  id: string,
  category: 'trigger' | 'action' | 'condition' | 'communication' | 'ai' | 'integration' | 'approval',
  x: number,
  y: number,
  label: string,
  icon: string,
  extras: Partial<{
    isTrigger: boolean;
    fromStatus: string;
    toStatus: string;
    subtitle: string;
  }> = {},
): Node => ({
  id,
  type: 'demo',
  position: { x, y },
  data: { label, icon, category, targetId: `node-${id}`, ...extras },
});

// ─── Build steps grouped by chapter ──────────────────────────────────────────
const _chapters: Chapter[] = [];
const _steps: Step[] = [];

function chapter(id: string, titleKey: string, build: () => Step[]) {
  const start = _steps.length;
  const built = build();
  _steps.push(...built);
  _chapters.push({ id, titleKey, start, end: _steps.length });
}

// ── Chapter 1: Welcome / Overview ────────────────────────────────────────────
chapter('overview', 'onboarding.demo.chapter.overview', () => [
  { caption: 'onboarding.demo.welcome', target: 'canvas', duration: 1400, apply: s => s },
  { caption: 'onboarding.demo.layout', target: 'palette-header', duration: 1100, apply: s => s },
  { caption: 'onboarding.demo.toolbarTour', target: 'btn-save', duration: 1100, apply: s => s },
]);

// ── Chapter 2: TRIGGERS ──────────────────────────────────────────────────────
chapter('triggers', 'onboarding.demo.chapter.triggers', () => [
  {
    caption: 'onboarding.demo.trig.openCat',
    target: 'cat-triggers', click: true, duration: 800,
    apply: s => ({ ...s, paletteCategory: 'triggers' }),
  },
  {
    caption: 'onboarding.demo.trig.itemList',
    target: 'palette-offer-status-trigger', duration: 1000, apply: s => s,
  },
  {
    caption: 'onboarding.demo.trig.grab',
    target: 'palette-offer-status-trigger', duration: 700,
    apply: s => ({ ...s, grabbingItemId: 'offer-status-trigger' }),
  },
  {
    caption: 'onboarding.demo.trig.drop',
    target: 'drop-1', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [
        ...s.nodes,
        mkNode('trigger-1', 'trigger', 40, 70, 'Offer · Status Change', 'FileText', { isTrigger: true }),
      ],
      highlightedNodeId: 'trigger-1',
    }),
  },
  {
    caption: 'onboarding.demo.trig.openConfig',
    target: 'node-trigger-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'trigger-1',
        title: 'Offer · Status Change',
        subtitle: 'Trigger when an offer transitions between statuses',
        icon: 'FileText', iconColor: '#ff6d5a',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Offer status change' },
          { type: 'select', label: 'Entity', value: 'Offer', options: ['Offer', 'Sale', 'Service Order', 'Dispatch', 'Job'] },
          { type: 'select', label: 'From status', value: 'draft', options: ['(any)', 'draft', 'sent', 'accepted', 'rejected'] },
          { type: 'select', label: 'To status', value: 'sent', options: ['draft', 'sent', 'accepted', 'rejected'] },
          { type: 'switch', label: 'Run only once per entity', value: 'on' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.trig.fieldsExplain',
    target: 'config-field-2', duration: 1300, apply: s => s,
  },
  {
    caption: 'onboarding.demo.trig.save',
    target: 'config-save', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: null,
      nodes: s.nodes.map(n => n.id === 'trigger-1'
        ? { ...n, data: { ...n.data, fromStatus: 'draft', toStatus: 'sent' } } : n),
    }),
  },
]);

// ── Chapter 3: ACTIONS — Send Email ──────────────────────────────────────────
chapter('actions', 'onboarding.demo.chapter.actions', () => [
  {
    caption: 'onboarding.demo.act.openCat',
    target: 'cat-communication', click: true, duration: 800,
    apply: s => ({ ...s, paletteCategory: 'communication' }),
  },
  {
    caption: 'onboarding.demo.act.grab',
    target: 'palette-send-email', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'send-email' }),
  },
  {
    caption: 'onboarding.demo.act.drop',
    target: 'drop-2', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('email-1', 'communication', 320, 70, 'Send Email', 'Mail')],
      highlightedNodeId: 'email-1',
    }),
  },
  {
    caption: 'onboarding.demo.act.connect',
    target: 'node-email-1', offset: { x: -100, y: 0 }, duration: 1000,
    apply: s => ({
      ...s,
      edges: [...s.edges, { id: 'e1', source: 'trigger-1', target: 'email-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.act.openConfig',
    target: 'node-email-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'email-1',
        title: 'Send Email',
        subtitle: 'Send a templated email to a recipient',
        icon: 'Mail', iconColor: '#06b6d4',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Notify customer' },
          { type: 'select', label: 'Recipient type', value: 'Contact (from trigger)', options: ['Contact (from trigger)', 'Custom email', 'User role', 'Dynamic expression'] },
          { type: 'input', label: 'Recipient', value: '{{ trigger.contact.email }}', hint: 'Use {{ }} to insert variables from previous nodes' },
          { type: 'input', label: 'Subject', value: 'Your offer #{{ trigger.offer.number }} was sent' },
          { type: 'textarea', label: 'Body (HTML template)', value: 'Hi {{ contact.firstName }},\n\nPlease find your offer attached…' },
          { type: 'switch', label: 'Attach PDF of entity', value: 'on' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.act.variables',
    target: 'config-field-2', duration: 1300, apply: s => s,
  },
  {
    caption: 'onboarding.demo.act.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({
      ...s,
      configPanel: null,
      nodes: s.nodes.map(n => n.id === 'email-1'
        ? { ...n, data: { ...n.data, subtitle: 'To: contact.email · PDF attached' } } : n),
    }),
  },
]);

// ── Chapter 4: CONDITIONS — If/Else ──────────────────────────────────────────
chapter('conditions', 'onboarding.demo.chapter.conditions', () => [
  {
    caption: 'onboarding.demo.cond.openCat',
    target: 'cat-conditions', click: true, duration: 800,
    apply: s => ({ ...s, paletteCategory: 'conditions' }),
  },
  {
    caption: 'onboarding.demo.cond.grab',
    target: 'palette-if-else', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'if-else' }),
  },
  {
    caption: 'onboarding.demo.cond.drop',
    target: 'drop-3', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('cond-1', 'condition', 320, 230, 'If / Else', 'GitBranch')],
      edges: [...s.edges, { id: 'e2', source: 'trigger-1', target: 'cond-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.cond.openConfig',
    target: 'node-cond-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'cond-1',
        title: 'If / Else',
        subtitle: 'Branch the workflow based on a condition',
        icon: 'GitBranch', iconColor: '#f59e0b',
        tab: 'settings',
        fields: [
          { type: 'input', label: 'Node name', value: 'High value offer?' },
          { type: 'select', label: 'Field', value: 'offer.totalAmount', options: ['offer.totalAmount', 'offer.status', 'offer.contact.country', 'trigger.user.role'] },
          { type: 'select', label: 'Operator', value: 'greater than', options: ['equals', 'not equals', 'greater than', 'less than', 'contains', 'is empty', 'in list'] },
          { type: 'input', label: 'Value', value: '10000' },
          { type: 'tag', label: 'Branches', value: 'true · false' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.cond.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({ ...s, configPanel: null }),
  },
  {
    caption: 'onboarding.demo.cond.branches',
    target: 'drop-4', duration: 900,
    apply: s => ({
      ...s,
      nodes: [
        ...s.nodes,
        mkNode('sms-1', 'communication', 580, 160, 'Send SMS', 'Send'),
        mkNode('notif-1', 'communication', 580, 280, 'In-app Notification', 'Bell'),
      ],
      edges: [
        ...s.edges,
        { id: 'e3', source: 'cond-1', target: 'sms-1', label: 'true', animated: true, type: 'smoothstep' },
        { id: 'e4', source: 'cond-1', target: 'notif-1', label: 'false', animated: true, type: 'smoothstep' },
      ],
    }),
  },
]);

// ── Chapter 5: APPROVAL (Human-in-the-loop) ──────────────────────────────────
chapter('approval', 'onboarding.demo.chapter.approval', () => [
  {
    caption: 'onboarding.demo.appr.grab',
    target: 'palette-request-approval', duration: 900,
    apply: s => ({ ...s, paletteCategory: 'communication', grabbingItemId: 'request-approval' }),
  },
  {
    caption: 'onboarding.demo.appr.drop',
    target: 'drop-5', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('appr-1', 'approval', 580, 40, 'Request Approval', 'Shield')],
      edges: [...s.edges, { id: 'e5', source: 'email-1', target: 'appr-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.appr.openConfig',
    target: 'node-appr-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'appr-1',
        title: 'Request Approval',
        subtitle: 'Pause the workflow until a human decides',
        icon: 'Shield', iconColor: '#f97316',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Manager sign-off' },
          { type: 'select', label: 'Approver role', value: 'Sales Manager', options: ['Sales Manager', 'Operations Lead', 'Finance', 'Admin', 'Custom user'] },
          { type: 'number', label: 'Timeout (hours)', value: '24' },
          { type: 'select', label: 'On timeout', value: 'Auto-reject', options: ['Auto-reject', 'Auto-approve', 'Escalate to admin'] },
          { type: 'textarea', label: 'Message to approver', value: 'Please review offer {{ offer.number }} ({{ offer.totalAmount }} TND).' },
          { type: 'switch', label: 'Send email notification', value: 'on' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.appr.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({
      ...s,
      configPanel: null,
      nodes: s.nodes.map(n => n.id === 'appr-1'
        ? { ...n, data: { ...n.data, subtitle: 'Sales Manager · 24h timeout' } } : n),
    }),
  },
]);

// ── Chapter 6: AI nodes ──────────────────────────────────────────────────────
chapter('ai', 'onboarding.demo.chapter.ai', () => [
  {
    caption: 'onboarding.demo.ai.openCat',
    target: 'cat-ai', click: true, duration: 800,
    apply: s => ({ ...s, paletteCategory: 'ai' }),
  },
  {
    caption: 'onboarding.demo.ai.grab',
    target: 'palette-ai-email-writer', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'ai-email-writer' }),
  },
  {
    caption: 'onboarding.demo.ai.drop',
    target: 'drop-6', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('ai-1', 'ai', 320, 380, 'AI · Email Writer', 'Sparkles')],
      edges: [...s.edges, { id: 'e6', source: 'trigger-1', target: 'ai-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.ai.openConfig',
    target: 'node-ai-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'ai-1',
        title: 'AI · Email Writer',
        subtitle: 'Generate a personalised email body using an LLM',
        icon: 'Sparkles', iconColor: '#8b5cf6',
        tab: 'settings',
        fields: [
          { type: 'input', label: 'Node name', value: 'Draft follow-up' },
          { type: 'select', label: 'Model', value: 'google/gemini-2.5-flash', options: ['google/gemini-2.5-flash', 'google/gemini-2.5-pro', 'openai/gpt-5', 'openai/gpt-5-mini'] },
          { type: 'select', label: 'Tone', value: 'Professional', options: ['Professional', 'Friendly', 'Formal', 'Concise', 'Persuasive'] },
          { type: 'textarea', label: 'Prompt', value: 'Write a follow-up email for offer {{ offer.number }} totalling {{ offer.totalAmount }} TND. Mention items {{ offer.items }} and request a meeting.', hint: 'Variables from previous nodes are auto-injected' },
          { type: 'number', label: 'Max tokens', value: '600' },
          { type: 'switch', label: 'Translate to contact language', value: 'on' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.ai.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({ ...s, configPanel: null }),
  },
]);

// ── Chapter 7: INTEGRATION — HTTP Request ────────────────────────────────────
chapter('integration', 'onboarding.demo.chapter.integration', () => [
  {
    caption: 'onboarding.demo.int.openCat',
    target: 'cat-integration', click: true, duration: 800,
    apply: s => ({ ...s, paletteCategory: 'integration' }),
  },
  {
    caption: 'onboarding.demo.int.grab',
    target: 'palette-http-request', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'http-request' }),
  },
  {
    caption: 'onboarding.demo.int.drop',
    target: 'drop-7', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('http-1', 'integration', 860, 70, 'HTTP Request', 'Globe')],
      edges: [...s.edges, { id: 'e7', source: 'appr-1', target: 'http-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.int.openConfig',
    target: 'node-http-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'http-1',
        title: 'HTTP Request',
        subtitle: 'Call any external API and feed the response into the next node',
        icon: 'Globe', iconColor: '#64748b',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Push to ERP' },
          { type: 'select', label: 'Method', value: 'POST', options: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] },
          { type: 'input', label: 'URL', value: 'https://erp.example.com/api/offers' },
          { type: 'select', label: 'Auth', value: 'Bearer token', options: ['None', 'Bearer token', 'Basic', 'OAuth2', 'API key'] },
          { type: 'input', label: 'Authorization header', value: 'Bearer {{ secrets.ERP_TOKEN }}' },
          { type: 'textarea', label: 'Body (JSON)', value: '{\n  "id": "{{ offer.id }}",\n  "total": {{ offer.totalAmount }},\n  "approvedBy": "{{ appr.approver }}"\n}' },
          { type: 'number', label: 'Timeout (s)', value: '30' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.int.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({ ...s, configPanel: null }),
  },
]);

// ── Chapter 8: SAVE · ACTIVATE · TEST RUN ────────────────────────────────────
chapter('publish', 'onboarding.demo.chapter.publish', () => [
  {
    caption: 'onboarding.demo.pub.save',
    target: 'btn-save', click: true, duration: 900,
    apply: s => ({ ...s, saved: true }),
  },
  {
    caption: 'onboarding.demo.pub.activate',
    target: 'btn-activate', click: true, duration: 800,
    apply: s => ({ ...s, active: true }),
  },
  {
    caption: 'onboarding.demo.pub.test',
    target: 'btn-test', click: true, duration: 1000,
    apply: s => ({
      ...s,
      showExecutions: true,
      executionLogs: [
        { node: 'Offer · Status Change', status: 'ok', ms: 6 },
        { node: 'If / Else', status: 'ok', ms: 3 },
        { node: 'Send Email', status: 'ok', ms: 312 },
        { node: 'AI · Email Writer', status: 'ok', ms: 1820 },
        { node: 'Request Approval', status: 'wait' },
        { node: 'HTTP Request', status: 'ok', ms: 442 },
      ],
    }),
  },
]);

export const steps = _steps;
export const chapters = _chapters;
