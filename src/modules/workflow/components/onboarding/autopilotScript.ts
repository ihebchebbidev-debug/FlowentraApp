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

// ── Chapter 0: CONCEPTS — what a workflow is, in plain language ──────────────
chapter('concepts', 'onboarding.demo.chapter.concepts', () => [
  { caption: 'onboarding.demo.concepts.what',       target: 'canvas',         duration: 2200, apply: s => s },
  { caption: 'onboarding.demo.concepts.graph',      target: 'canvas',         duration: 2200, apply: s => s },
  { caption: 'onboarding.demo.concepts.trigger',    target: 'cat-triggers',   duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.concepts.actions',    target: 'cat-actions',    duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.concepts.conditions', target: 'cat-conditions', duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.concepts.variables',  target: 'palette-search', duration: 2200, apply: s => s },
  { caption: 'onboarding.demo.concepts.executions', target: 'btn-test',       duration: 2200, apply: s => s },
  { caption: 'onboarding.demo.concepts.mental',     target: 'canvas',         duration: 2600, apply: s => s },
]);

// ── Chapter 1: Welcome / Overview — full top-bar tour ───────────────────────
chapter('overview', 'onboarding.demo.chapter.overview', () => [
  { caption: 'onboarding.demo.welcome',       target: 'canvas',         duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.layout',        target: 'palette-header', duration: 1800, apply: s => s },
  // LEFT side of top bar
  { caption: 'onboarding.demo.tb.status',     target: 'tb-status',      duration: 1900, apply: s => s },
  { caption: 'onboarding.demo.tb.version',    target: 'tb-version',     duration: 2100, apply: s => s },
  { caption: 'onboarding.demo.tb.editPill',   target: 'tb-edit-pill',   duration: 1900, apply: s => s },
  // RIGHT side of top bar — every action button explained
  { caption: 'onboarding.demo.tb.intro',      target: 'btn-ai',         duration: 1700, apply: s => s },
  { caption: 'onboarding.demo.tb.ai',         target: 'btn-ai',         duration: 2200, apply: s => s },
  { caption: 'onboarding.demo.tb.debug',      target: 'btn-debug',      duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.tb.copy',       target: 'btn-copy',       duration: 1900, apply: s => s },
  { caption: 'onboarding.demo.tb.import',     target: 'btn-import',     duration: 1900, apply: s => s },
  { caption: 'onboarding.demo.tb.export',     target: 'btn-export',     duration: 1900, apply: s => s },
  { caption: 'onboarding.demo.tb.groups',     target: 'btn-groups',     duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.tb.manager',    target: 'btn-manager',    duration: 2100, apply: s => s },
  { caption: 'onboarding.demo.tb.test',       target: 'btn-test',       duration: 2400, apply: s => s },
  { caption: 'onboarding.demo.tb.cancel',     target: 'btn-cancel',     duration: 1900, apply: s => s },
  { caption: 'onboarding.demo.tb.save',       target: 'btn-save',       duration: 2400, apply: s => s },
  { caption: 'onboarding.demo.tb.activate',   target: 'btn-activate',   duration: 2600, apply: s => s },
  { caption: 'onboarding.demo.tb.stop',       target: 'btn-activate',   duration: 2000, apply: s => s },
  { caption: 'onboarding.demo.tb.counter',    target: 'palette-header', duration: 1800, apply: s => s },
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

// ── Chapter 7b: DELAY · WAIT · TIMING ────────────────────────────────────────
chapter('delay', 'onboarding.demo.chapter.delay', () => [
  {
    caption: 'onboarding.demo.delay.intro',
    target: 'cat-communication', click: true, duration: 900,
    apply: s => ({ ...s, paletteCategory: 'communication' }),
  },
  {
    caption: 'onboarding.demo.delay.grab',
    target: 'palette-delay', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'delay' }),
  },
  {
    caption: 'onboarding.demo.delay.drop',
    target: 'drop-9', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('delay-1', 'communication', 460, 380, 'Delay', 'Clock')],
      edges: [...s.edges, { id: 'e8', source: 'ai-1', target: 'delay-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.delay.openConfig',
    target: 'node-delay-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'delay-1',
        title: 'Delay',
        subtitle: 'Pause the workflow for a fixed duration or until a specific moment',
        icon: 'Clock', iconColor: '#06b6d4',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Wait before follow-up' },
          { type: 'select', label: 'Delay mode', value: 'Relative duration', options: ['Relative duration', 'Until date/time', 'Until business hours', 'Until field value matches'] },
          { type: 'number', label: 'Amount', value: '2' },
          { type: 'select', label: 'Unit', value: 'days', options: ['minutes', 'hours', 'days', 'weeks'] },
          { type: 'switch', label: 'Skip on weekends', value: 'on' },
          { type: 'switch', label: 'Respect contact timezone', value: 'on' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.delay.advancedTab',
    target: 'tab-advanced', click: true, duration: 900,
    apply: s => s.configPanel ? ({
      ...s,
      configPanel: {
        ...s.configPanel,
        tab: 'advanced',
        fields: [
          { type: 'number', label: 'Max wait (hours)', value: '168', hint: 'Safety cap — workflow cancels if exceeded' },
          { type: 'switch', label: 'Cancel if upstream entity changes status', value: 'on' },
          { type: 'select', label: 'On cancel', value: 'Skip to next node', options: ['Skip to next node', 'End workflow', 'Branch to error path'] },
        ],
      },
    }) : s,
  },
  {
    caption: 'onboarding.demo.delay.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({
      ...s,
      configPanel: null,
      nodes: s.nodes.map(n => n.id === 'delay-1' ? { ...n, data: { ...n.data, subtitle: 'Wait 2 days · skip weekends' } } : n),
    }),
  },
]);

// ── Chapter 7c: LOOP — iterate over a collection ─────────────────────────────
chapter('loop', 'onboarding.demo.chapter.loop', () => [
  {
    caption: 'onboarding.demo.loop.intro',
    target: 'cat-conditions', click: true, duration: 900,
    apply: s => ({ ...s, paletteCategory: 'conditions' }),
  },
  {
    caption: 'onboarding.demo.loop.grab',
    target: 'palette-loop', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'loop' }),
  },
  {
    caption: 'onboarding.demo.loop.drop',
    target: 'drop-10', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('loop-1', 'condition', 200, 540, 'Loop · For each item', 'Repeat')],
      edges: [...s.edges, { id: 'e9', source: 'trigger-1', target: 'loop-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.loop.openConfig',
    target: 'node-loop-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'loop-1',
        title: 'Loop · For each item',
        subtitle: 'Iterate over an array and run the inner branch for every element',
        icon: 'Repeat', iconColor: '#f59e0b',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'For each offer line' },
          { type: 'select', label: 'Source collection', value: '{{ offer.items }}', options: ['{{ offer.items }}', '{{ sale.lines }}', '{{ dispatch.stops }}', '{{ http.response.data }}'] },
          { type: 'input', label: 'Item alias', value: 'item' },
          { type: 'input', label: 'Index alias', value: 'i' },
          { type: 'select', label: 'Mode', value: 'Sequential', options: ['Sequential', 'Parallel (max 5)', 'Parallel (unlimited)'] },
          { type: 'number', label: 'Max iterations', value: '500', hint: 'Safety guard against runaway loops' },
          { type: 'switch', label: 'Continue on item error', value: 'off' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.loop.outputs',
    target: 'config-field-4', duration: 1400, apply: s => s,
  },
  {
    caption: 'onboarding.demo.loop.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({
      ...s, configPanel: null,
      nodes: s.nodes.map(n => n.id === 'loop-1' ? { ...n, data: { ...n.data, subtitle: 'offer.items · sequential' } } : n),
    }),
  },
]);

// ── Chapter 7d: SWITCH — multi-way branching ─────────────────────────────────
chapter('switch', 'onboarding.demo.chapter.switch', () => [
  {
    caption: 'onboarding.demo.switch.grab',
    target: 'palette-switch', duration: 800,
    apply: s => ({ ...s, paletteCategory: 'conditions', grabbingItemId: 'switch' }),
  },
  {
    caption: 'onboarding.demo.switch.drop',
    target: 'drop-11', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('switch-1', 'condition', 700, 500, 'Switch · by country', 'Split')],
      edges: [...s.edges, { id: 'e10', source: 'loop-1', target: 'switch-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.switch.openConfig',
    target: 'node-switch-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'switch-1',
        title: 'Switch',
        subtitle: 'Route to one of many branches based on a value',
        icon: 'Split', iconColor: '#f59e0b',
        tab: 'settings',
        fields: [
          { type: 'input', label: 'Node name', value: 'Route by country' },
          { type: 'select', label: 'Source field', value: '{{ contact.country }}', options: ['{{ contact.country }}', '{{ offer.currency }}', '{{ user.role }}', '{{ trigger.eventType }}'] },
          { type: 'tag', label: 'Cases', value: 'TN · FR · DE · US · default' },
          { type: 'switch', label: 'Case insensitive', value: 'on' },
          { type: 'switch', label: 'Fallthrough on no match', value: 'off' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.switch.casesExplain',
    target: 'config-field-2', duration: 1400, apply: s => s,
  },
  {
    caption: 'onboarding.demo.switch.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({ ...s, configPanel: null }),
  },
]);

// ── Chapter 7e: SCHEDULED TRIGGER — cron-based ───────────────────────────────
chapter('scheduled', 'onboarding.demo.chapter.scheduled', () => [
  {
    caption: 'onboarding.demo.sched.intro',
    target: 'cat-triggers', click: true, duration: 900,
    apply: s => ({ ...s, paletteCategory: 'triggers' }),
  },
  {
    caption: 'onboarding.demo.sched.grab',
    target: 'palette-scheduled-trigger', duration: 800,
    apply: s => ({ ...s, grabbingItemId: 'scheduled-trigger' }),
  },
  {
    caption: 'onboarding.demo.sched.drop',
    target: 'drop-13', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('sched-1', 'trigger', 40, 450, 'Scheduled · Every Monday 9am', 'Calendar', { isTrigger: true })],
    }),
  },
  {
    caption: 'onboarding.demo.sched.openConfig',
    target: 'node-sched-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'sched-1',
        title: 'Scheduled Trigger',
        subtitle: 'Fires the workflow on a recurring schedule (cron)',
        icon: 'Calendar', iconColor: '#ff6d5a',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Weekly report' },
          { type: 'select', label: 'Frequency', value: 'Weekly', options: ['Every minute', 'Hourly', 'Daily', 'Weekly', 'Monthly', 'Custom cron'] },
          { type: 'input', label: 'Cron expression', value: '0 9 * * 1', hint: 'min hour day month weekday — 09:00 every Monday' },
          { type: 'select', label: 'Timezone', value: 'Africa/Tunis', options: ['UTC', 'Africa/Tunis', 'Europe/Paris', 'America/New_York', 'Asia/Tokyo'] },
          { type: 'select', label: 'Catchup mode', value: 'Skip missed runs', options: ['Skip missed runs', 'Run all missed', 'Run last only'] },
          { type: 'switch', label: 'Pause on holidays', value: 'on' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.sched.cronExplain',
    target: 'config-field-2', duration: 1500, apply: s => s,
  },
  {
    caption: 'onboarding.demo.sched.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({
      ...s, configPanel: null,
      nodes: s.nodes.map(n => n.id === 'sched-1' ? { ...n, data: { ...n.data, subtitle: '0 9 * * 1 · Africa/Tunis' } } : n),
    }),
  },
]);

// ── Chapter 7f: WEBHOOK TRIGGER — external systems push to us ────────────────
chapter('webhook', 'onboarding.demo.chapter.webhook', () => [
  {
    caption: 'onboarding.demo.web.grab',
    target: 'palette-webhook-trigger', duration: 800,
    apply: s => ({ ...s, paletteCategory: 'triggers', grabbingItemId: 'webhook-trigger' }),
  },
  {
    caption: 'onboarding.demo.web.drop',
    target: 'drop-8', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('hook-1', 'trigger', 260, 10, 'Webhook · Stripe payment', 'Webhook', { isTrigger: true })],
    }),
  },
  {
    caption: 'onboarding.demo.web.openConfig',
    target: 'node-hook-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'hook-1',
        title: 'Webhook Trigger',
        subtitle: 'Listen for HTTP requests on a unique URL',
        icon: 'Webhook', iconColor: '#ff6d5a',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Stripe payment_succeeded' },
          { type: 'input', label: 'Webhook URL (read-only)', value: 'https://api.app.tn/hooks/wf_8a3f...' },
          { type: 'select', label: 'Method', value: 'POST', options: ['POST', 'PUT', 'GET', 'Any'] },
          { type: 'select', label: 'Auth', value: 'HMAC signature', options: ['None', 'HMAC signature', 'Bearer token', 'Basic auth', 'IP allowlist'] },
          { type: 'input', label: 'Signing secret', value: '{{ secrets.STRIPE_WHSEC }}' },
          { type: 'input', label: 'Header to verify', value: 'Stripe-Signature' },
          { type: 'select', label: 'Response mode', value: 'Acknowledge immediately (202)', options: ['Acknowledge immediately (202)', 'Wait for workflow (200)', 'Return last-node output'] },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.web.advanced',
    target: 'tab-advanced', click: true, duration: 900,
    apply: s => s.configPanel ? ({
      ...s, configPanel: {
        ...s.configPanel, tab: 'advanced',
        fields: [
          { type: 'switch', label: 'Idempotency (dedupe by event id)', value: 'on' },
          { type: 'input', label: 'Dedupe key path', value: '$.body.id' },
          { type: 'number', label: 'Rate limit (req/min)', value: '120' },
          { type: 'switch', label: 'Log raw payload (PII risk)', value: 'off' },
          { type: 'select', label: 'On invalid signature', value: 'Reject 401', options: ['Reject 401', 'Log and continue', 'Branch to error path'] },
        ],
      },
    }) : s,
  },
  {
    caption: 'onboarding.demo.web.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({ ...s, configPanel: null }),
  },
]);

// ── Chapter 7g: CUSTOM CODE — sandboxed JavaScript ───────────────────────────
chapter('code', 'onboarding.demo.chapter.code', () => [
  {
    caption: 'onboarding.demo.code.grab',
    target: 'palette-code', duration: 800,
    apply: s => ({ ...s, paletteCategory: 'integration', grabbingItemId: 'code' }),
  },
  {
    caption: 'onboarding.demo.code.drop',
    target: 'drop-12', duration: 1000,
    apply: s => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('code-1', 'integration', 900, 480, 'Custom Code · JS', 'Code')],
      edges: [...s.edges, { id: 'e11', source: 'http-1', target: 'code-1', animated: true, type: 'smoothstep' }],
    }),
  },
  {
    caption: 'onboarding.demo.code.openConfig',
    target: 'node-code-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'code-1',
        title: 'Custom Code',
        subtitle: 'Run sandboxed JavaScript with full access to upstream variables',
        icon: 'Code', iconColor: '#64748b',
        tab: 'general',
        fields: [
          { type: 'input', label: 'Node name', value: 'Compute discount tier' },
          { type: 'select', label: 'Language', value: 'JavaScript (ES2022)', options: ['JavaScript (ES2022)', 'TypeScript', 'JsonLogic'] },
          { type: 'textarea', label: 'Code', value: 'const total = ctx.offer.totalAmount;\nlet tier = "bronze";\nif (total > 50000) tier = "gold";\nelse if (total > 10000) tier = "silver";\nreturn { tier, total };' },
          { type: 'tag', label: 'Returns', value: 'tier · total' },
          { type: 'number', label: 'Timeout (ms)', value: '5000' },
          { type: 'switch', label: 'Allow network (fetch)', value: 'off', hint: 'Disabled in sandbox by default for safety' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.code.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({
      ...s, configPanel: null,
      nodes: s.nodes.map(n => n.id === 'code-1' ? { ...n, data: { ...n.data, subtitle: 'JS · returns { tier, total }' } } : n),
    }),
  },
]);

// ── Chapter 7h: ERROR HANDLING — retry, catch, fallback ──────────────────────
chapter('errors', 'onboarding.demo.chapter.errors', () => [
  {
    caption: 'onboarding.demo.err.intro',
    target: 'node-http-1', click: true, duration: 900,
    apply: s => ({
      ...s,
      configPanel: {
        nodeId: 'http-1',
        title: 'HTTP Request',
        subtitle: 'Configuring resilience for an external API call',
        icon: 'Globe', iconColor: '#64748b',
        tab: 'advanced',
        fields: [
          { type: 'select', label: 'Retry policy', value: 'Exponential backoff', options: ['None', 'Fixed interval', 'Exponential backoff', 'Custom schedule'] },
          { type: 'number', label: 'Max retries', value: '5' },
          { type: 'number', label: 'Initial backoff (s)', value: '2' },
          { type: 'number', label: 'Max backoff (s)', value: '300' },
          { type: 'tag', label: 'Retry on status', value: '408 · 429 · 500 · 502 · 503 · 504' },
          { type: 'select', label: 'On final failure', value: 'Branch to error path', options: ['Stop workflow', 'Continue (mark failed)', 'Branch to error path', 'Run fallback node'] },
          { type: 'switch', label: 'Circuit breaker', value: 'on' },
          { type: 'number', label: 'Breaker threshold (failures/min)', value: '10' },
        ],
      },
    }),
  },
  {
    caption: 'onboarding.demo.err.retryExplain',
    target: 'config-field-2', duration: 1500, apply: s => s,
  },
  {
    caption: 'onboarding.demo.err.fallback',
    target: 'config-field-5', duration: 1400, apply: s => s,
  },
  {
    caption: 'onboarding.demo.err.save',
    target: 'config-save', click: true, duration: 800,
    apply: s => ({ ...s, configPanel: null }),
  },
]);

// ── Chapter 7i: VARIABLES & EXPRESSIONS reference ────────────────────────────
chapter('variables', 'onboarding.demo.chapter.variables', () => [
  { caption: 'onboarding.demo.var.intro', target: 'palette-search', duration: 1300, apply: s => ({ ...s, paletteSearch: '{{ }}' }) },
  { caption: 'onboarding.demo.var.trigger', target: 'node-trigger-1', duration: 1400, apply: s => s },
  { caption: 'onboarding.demo.var.nodes', target: 'node-email-1', duration: 1400, apply: s => s },
  { caption: 'onboarding.demo.var.secrets', target: 'node-http-1', duration: 1400, apply: s => s },
  { caption: 'onboarding.demo.var.helpers', target: 'node-code-1', duration: 1500, apply: s => ({ ...s, paletteSearch: '' }) },
]);

// ── Chapter 7j: SEARCH & KEYBOARD shortcuts ──────────────────────────────────
chapter('shortcuts', 'onboarding.demo.chapter.shortcuts', () => [
  { caption: 'onboarding.demo.kbd.search', target: 'palette-search', duration: 1200, apply: s => ({ ...s, paletteSearch: 'email' }) },
  { caption: 'onboarding.demo.kbd.results', target: 'palette-send-email', duration: 1200, apply: s => s },
  { caption: 'onboarding.demo.kbd.clear', target: 'palette-search', duration: 900, apply: s => ({ ...s, paletteSearch: '' }) },
  { caption: 'onboarding.demo.kbd.canvas', target: 'canvas', duration: 1300, apply: s => s },
  { caption: 'onboarding.demo.kbd.undoRedo', target: 'btn-save', duration: 1300, apply: s => s },
]);

// ── Chapter 8: SAVE · ACTIVATE · TEST RUN ────────────────────────────────────

chapter('publish', 'onboarding.demo.chapter.publish', () => [
  { caption: 'onboarding.demo.pub.review', target: 'canvas', duration: 1400, apply: s => s },

  // SAVE
  { caption: 'onboarding.demo.pub.saveIntro', target: 'btn-save', duration: 1800, apply: s => s },
  {
    caption: 'onboarding.demo.pub.save',
    target: 'btn-save', click: true, duration: 1100,
    apply: s => ({ ...s, saved: true }),
  },
  { caption: 'onboarding.demo.pub.versioning', target: 'btn-save', duration: 1700, apply: s => s },

  // ACTIVATE
  { caption: 'onboarding.demo.pub.activateIntro', target: 'btn-activate', duration: 1800, apply: s => s },
  {
    caption: 'onboarding.demo.pub.activate',
    target: 'btn-activate', click: true, duration: 1100,
    apply: s => ({ ...s, active: true }),
  },
  { caption: 'onboarding.demo.pub.activeExplain', target: 'btn-activate', duration: 1800, apply: s => s },

  // TEST RUN
  { caption: 'onboarding.demo.pub.testIntro', target: 'btn-test', duration: 1800, apply: s => s },
  {
    caption: 'onboarding.demo.pub.test',
    target: 'btn-test', click: true, duration: 1100,
    apply: s => ({
      ...s,
      showExecutions: true,
      executionLogs: [
        { node: 'Offer · Status Change', status: 'ok', ms: 6 },
        { node: 'If / Else', status: 'ok', ms: 3 },
        { node: 'Send Email', status: 'ok', ms: 312 },
        { node: 'AI · Email Writer', status: 'ok', ms: 1820 },
        { node: 'Delay', status: 'wait' },
        { node: 'Request Approval', status: 'wait' },
        { node: 'HTTP Request', status: 'ok', ms: 442 },
        { node: 'Custom Code', status: 'running' },
      ],
    }),
  },
  { caption: 'onboarding.demo.pub.logsExplain', target: 'canvas', offset: { x: 0, y: 200 }, duration: 1700, apply: s => s },
  { caption: 'onboarding.demo.pub.monitoring',  target: 'canvas', offset: { x: 0, y: 200 }, duration: 1700, apply: s => s },
]);

// ── Chapter 9: NEXT STEPS — recap & where to go from here ────────────────────
chapter('next', 'onboarding.demo.chapter.next', () => [
  { caption: 'onboarding.demo.next.recap', target: 'canvas', duration: 1500, apply: s => s },
  { caption: 'onboarding.demo.next.templates', target: 'btn-save', duration: 1400, apply: s => s },
  { caption: 'onboarding.demo.next.collab', target: 'btn-activate', duration: 1400, apply: s => s },
  { caption: 'onboarding.demo.next.docs', target: 'btn-test', duration: 1500, apply: s => s },
  { caption: 'onboarding.demo.next.replay', target: 'palette-header', duration: 1400, apply: s => s },
]);

export const steps = _steps;
export const chapters = _chapters;
