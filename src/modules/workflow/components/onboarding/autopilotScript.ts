import type { Node, Edge } from '@xyflow/react';

export type PaletteCategory = 'triggers' | 'actions' | 'logic' | 'integrations';

/**
 * Demo state — drives the mock builder UI during the autopilot tour.
 * Each step mutates this via `apply`. Cursor coordinates are now derived
 * from real DOM targets (data-demo-target) for pixel-perfect accuracy
 * across viewports — see WorkflowAutopilotDemo.
 */
export interface DemoState {
  paletteCategory: PaletteCategory | null;
  grabbingItemId: string | null;
  nodes: Node[];
  edges: Edge[];
  highlightedNodeId: string | null;
  configModal: null | {
    nodeId: string;
    title: string;
    fields: { label: string; value: string }[];
  };
  saved: boolean;
  active: boolean;
  showExecutions: boolean;
  executionLogs: { node: string; status: 'ok' | 'running' | 'wait'; ms?: number }[];
}

export const initialDemoState: DemoState = {
  paletteCategory: null,
  grabbingItemId: null,
  nodes: [],
  edges: [],
  highlightedNodeId: null,
  configModal: null,
  saved: false,
  active: false,
  showExecutions: false,
  executionLogs: [],
};

export interface Step {
  caption: string;
  /**
   * data-demo-target id of the element the virtual cursor should fly to.
   * Resolved at runtime via getBoundingClientRect — no hard-coded pixels.
   */
  target: string;
  /** Optional pixel nudge from the target center (in CSS px). */
  offset?: { x: number; y: number };
  /** Show click pulse this step. */
  click?: boolean;
  /** Total step duration in ms (before speed scaling). */
  duration: number;
  apply: (s: DemoState) => DemoState;
}

// Helpers
const mkNode = (
  id: string,
  category: 'trigger' | 'action' | 'condition' | 'approval',
  x: number,
  y: number,
  label: string,
  icon: string,
  extras: Partial<{ isTrigger: boolean; fromStatus: string; toStatus: string }> = {},
): Node => ({
  id,
  type: 'demo',
  position: { x, y },
  data: { label, icon, category, targetId: `node-${id}`, ...extras },
});

export const steps: Step[] = [
  // 1 — welcome
  {
    caption: 'onboarding.demo.s1',
    target: 'canvas',
    duration: 1200,
    apply: (s) => s,
  },
  // 2 — open triggers category
  {
    caption: 'onboarding.demo.s2',
    target: 'cat-triggers',
    click: true,
    duration: 800,
    apply: (s) => ({ ...s, paletteCategory: 'triggers' }),
  },
  // 3 — grab status trigger
  {
    caption: 'onboarding.demo.s3',
    target: 'palette-trigger-status',
    duration: 900,
    apply: (s) => ({ ...s, grabbingItemId: 'trigger-status' }),
  },
  // 4 — drop on canvas
  {
    caption: 'onboarding.demo.s4',
    target: 'canvas-drop-1',
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [
        ...s.nodes,
        mkNode('trigger-1', 'trigger', 40, 80, 'Offer · Status Change', 'FileText', { isTrigger: true }),
      ],
      highlightedNodeId: 'trigger-1',
    }),
  },
  // 5 — double-click to configure
  {
    caption: 'onboarding.demo.s5',
    target: 'node-trigger-1',
    click: true,
    duration: 900,
    apply: (s) => ({
      ...s,
      configModal: {
        nodeId: 'trigger-1',
        title: 'Status Change Trigger',
        fields: [
          { label: 'Entity', value: 'Offer' },
          { label: 'From status', value: 'draft' },
          { label: 'To status', value: 'sent' },
        ],
      },
    }),
  },
  // 6 — close config (apply)
  {
    caption: 'onboarding.demo.s6',
    target: 'config-save',
    click: true,
    duration: 1100,
    apply: (s) => ({
      ...s,
      configModal: null,
      nodes: s.nodes.map((n) =>
        n.id === 'trigger-1'
          ? { ...n, data: { ...n.data, fromStatus: 'draft', toStatus: 'sent' } }
          : n,
      ),
    }),
  },
  // 7 — actions
  {
    caption: 'onboarding.demo.s7',
    target: 'cat-actions',
    click: true,
    duration: 800,
    apply: (s) => ({ ...s, paletteCategory: 'actions' }),
  },
  // 8 — grab email
  {
    caption: 'onboarding.demo.s8',
    target: 'palette-action-email',
    duration: 700,
    apply: (s) => ({ ...s, grabbingItemId: 'action-email' }),
  },
  // 9 — drop email
  {
    caption: 'onboarding.demo.s9',
    target: 'canvas-drop-2',
    duration: 1000,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [
        ...s.nodes,
        mkNode('action-1', 'action', 300, 80, 'Send Email', 'Mail'),
      ],
      highlightedNodeId: 'action-1',
    }),
  },
  // 10 — connect
  {
    caption: 'onboarding.demo.s10',
    target: 'node-action-1',
    offset: { x: -90, y: 0 },
    duration: 1000,
    apply: (s) => ({
      ...s,
      edges: [
        ...s.edges,
        { id: 'e1', source: 'trigger-1', target: 'action-1', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  // 11 — open logic / grab condition
  {
    caption: 'onboarding.demo.s11',
    target: 'palette-logic-condition',
    duration: 1000,
    apply: (s) => ({ ...s, paletteCategory: 'logic', grabbingItemId: 'logic-condition' }),
  },
  // 12 — drop condition + auto-connect
  {
    caption: 'onboarding.demo.s12',
    target: 'canvas-drop-3',
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [
        ...s.nodes,
        mkNode('cond-1', 'condition', 300, 220, 'Condition', 'GitBranch'),
      ],
      edges: [
        ...s.edges,
        { id: 'e2', source: 'trigger-1', target: 'cond-1', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  // 13 — SMS for true branch
  {
    caption: 'onboarding.demo.s13',
    target: 'palette-action-sms',
    duration: 900,
    apply: (s) => ({ ...s, paletteCategory: 'actions', grabbingItemId: 'action-sms' }),
  },
  // 14 — drop SMS
  {
    caption: 'onboarding.demo.s14',
    target: 'canvas-drop-4',
    duration: 1000,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('sms-1', 'action', 560, 170, 'Send SMS', 'Send')],
      edges: [
        ...s.edges,
        { id: 'e3', source: 'cond-1', target: 'sms-1', label: 'true', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  // 15 — Notification for false branch
  {
    caption: 'onboarding.demo.s15',
    target: 'canvas-drop-5',
    duration: 900,
    apply: (s) => ({
      ...s,
      nodes: [...s.nodes, mkNode('notif-1', 'action', 560, 280, 'Notification', 'Bell')],
      edges: [
        ...s.edges,
        { id: 'e4', source: 'cond-1', target: 'notif-1', label: 'false', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  // 16 — Approval
  {
    caption: 'onboarding.demo.s16',
    target: 'palette-logic-approval',
    duration: 900,
    apply: (s) => ({ ...s, paletteCategory: 'logic', grabbingItemId: 'logic-approval' }),
  },
  // 17 — drop approval
  {
    caption: 'onboarding.demo.s17',
    target: 'canvas-drop-6',
    duration: 1000,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, mkNode('appr-1', 'approval', 560, 60, 'Approval · Manager · 24h', 'Shield')],
      edges: [
        ...s.edges,
        { id: 'e5', source: 'action-1', target: 'appr-1', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  // 18 — Save
  {
    caption: 'onboarding.demo.s18',
    target: 'btn-save',
    click: true,
    duration: 900,
    apply: (s) => ({ ...s, saved: true }),
  },
  // 19 — Activate
  {
    caption: 'onboarding.demo.s19',
    target: 'btn-activate',
    click: true,
    duration: 800,
    apply: (s) => ({ ...s, active: true }),
  },
  // 20 — Test run
  {
    caption: 'onboarding.demo.s20',
    target: 'btn-test',
    click: true,
    duration: 900,
    apply: (s) => ({
      ...s,
      showExecutions: true,
      executionLogs: [
        { node: 'Status Change', status: 'ok', ms: 4 },
        { node: 'Send Email', status: 'ok', ms: 312 },
        { node: 'Approval', status: 'wait' },
        { node: 'Condition', status: 'ok', ms: 2 },
        { node: 'Send SMS', status: 'ok', ms: 188 },
      ],
    }),
  },
];
