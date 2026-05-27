import type { Node, Edge } from '@xyflow/react';

export type PaletteCategory = 'triggers' | 'actions' | 'logic' | 'integrations';

export interface DemoState {
  /** Active palette category (left panel) */
  paletteCategory: PaletteCategory | null;
  /** ID of palette item currently being "grabbed" by virtual cursor */
  grabbingItemId: string | null;
  /** Nodes currently on the canvas */
  nodes: Node[];
  /** Edges currently on the canvas */
  edges: Edge[];
  /** Node ID of currently highlighted node */
  highlightedNodeId: string | null;
  /** Mock node config modal (null = closed) */
  configModal: null | {
    nodeId: string;
    title: string;
    fields: { label: string; value: string; typed?: number }[];
  };
  /** Whether the workflow is saved/active */
  saved: boolean;
  active: boolean;
  /** Whether to show test-run executions panel */
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
  /** Target coordinate for the virtual cursor inside the demo viewport */
  cursor: { x: number; y: number };
  /** Whether to show a click pulse this step */
  click?: boolean;
  /** Duration in ms (defaults computed from movement) */
  duration: number;
  apply: (s: DemoState) => DemoState;
}

// Helper to make nodes
const node = (id: string, type: string, x: number, y: number, label: string, icon: string, color: string): Node => ({
  id,
  type: 'demo',
  position: { x, y },
  data: { label, icon, color, kind: type },
});

// Coordinates are within the inner demo viewport (≈900x520)
// Palette is at x: 12-220 ; canvas spans 240-900

export const steps: Step[] = [
  {
    caption: 'onboarding.demo.s1',
    cursor: { x: 80, y: 70 },
    duration: 900,
    apply: (s) => s,
  },
  {
    caption: 'onboarding.demo.s2',
    cursor: { x: 110, y: 130 },
    click: true,
    duration: 700,
    apply: (s) => ({ ...s, paletteCategory: 'triggers' }),
  },
  {
    caption: 'onboarding.demo.s3',
    cursor: { x: 110, y: 180 },
    duration: 700,
    apply: (s) => ({ ...s, grabbingItemId: 'trigger-status' }),
  },
  {
    caption: 'onboarding.demo.s4',
    cursor: { x: 340, y: 180 },
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, node('trigger-1', 'trigger', 60, 120, 'Status Change', 'Zap', 'amber')],
      highlightedNodeId: 'trigger-1',
    }),
  },
  {
    caption: 'onboarding.demo.s5',
    cursor: { x: 380, y: 200 },
    click: true,
    duration: 700,
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
  {
    caption: 'onboarding.demo.s6',
    cursor: { x: 580, y: 380 },
    click: true,
    duration: 1400,
    apply: (s) => ({ ...s, configModal: null }),
  },
  {
    caption: 'onboarding.demo.s7',
    cursor: { x: 110, y: 130 },
    click: true,
    duration: 700,
    apply: (s) => ({ ...s, paletteCategory: 'actions' }),
  },
  {
    caption: 'onboarding.demo.s8',
    cursor: { x: 110, y: 180 },
    duration: 600,
    apply: (s) => ({ ...s, grabbingItemId: 'action-email' }),
  },
  {
    caption: 'onboarding.demo.s9',
    cursor: { x: 620, y: 180 },
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, node('action-1', 'action', 340, 120, 'Send Email', 'Mail', 'sky')],
      highlightedNodeId: 'action-1',
    }),
  },
  {
    caption: 'onboarding.demo.s10',
    cursor: { x: 430, y: 200 },
    duration: 1100,
    apply: (s) => ({
      ...s,
      edges: [
        ...s.edges,
        { id: 'e1', source: 'trigger-1', target: 'action-1', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  {
    caption: 'onboarding.demo.s11',
    cursor: { x: 110, y: 230 },
    duration: 600,
    apply: (s) => ({ ...s, paletteCategory: 'logic', grabbingItemId: 'logic-condition' }),
  },
  {
    caption: 'onboarding.demo.s12',
    cursor: { x: 620, y: 340 },
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, node('cond-1', 'condition', 340, 260, 'Condition', 'GitBranch', 'violet')],
      edges: [
        ...s.edges,
        { id: 'e2', source: 'trigger-1', target: 'cond-1', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  {
    caption: 'onboarding.demo.s13',
    cursor: { x: 110, y: 130 },
    duration: 700,
    apply: (s) => ({ ...s, paletteCategory: 'actions', grabbingItemId: 'action-sms' }),
  },
  {
    caption: 'onboarding.demo.s14',
    cursor: { x: 760, y: 280 },
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, node('sms-1', 'action', 540, 220, 'Send SMS', 'Send', 'emerald')],
      edges: [
        ...s.edges,
        { id: 'e3', source: 'cond-1', target: 'sms-1', label: 'true', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  {
    caption: 'onboarding.demo.s15',
    cursor: { x: 760, y: 380 },
    duration: 900,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, node('notif-1', 'action', 540, 320, 'Notification', 'Bell', 'rose')],
      edges: [
        ...s.edges,
        { id: 'e4', source: 'cond-1', target: 'notif-1', label: 'false', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  {
    caption: 'onboarding.demo.s16',
    cursor: { x: 110, y: 280 },
    duration: 700,
    apply: (s) => ({ ...s, paletteCategory: 'logic', grabbingItemId: 'logic-approval' }),
  },
  {
    caption: 'onboarding.demo.s17',
    cursor: { x: 760, y: 180 },
    duration: 1100,
    apply: (s) => ({
      ...s,
      grabbingItemId: null,
      nodes: [...s.nodes, node('appr-1', 'approval', 720, 120, 'Approval (Manager · 24h)', 'Shield', 'orange')],
      edges: [
        ...s.edges,
        { id: 'e5', source: 'action-1', target: 'appr-1', animated: true, type: 'smoothstep' },
      ],
    }),
  },
  {
    caption: 'onboarding.demo.s18',
    cursor: { x: 810, y: 30 },
    click: true,
    duration: 900,
    apply: (s) => ({ ...s, saved: true }),
  },
  {
    caption: 'onboarding.demo.s19',
    cursor: { x: 870, y: 30 },
    click: true,
    duration: 700,
    apply: (s) => ({ ...s, active: true }),
  },
  {
    caption: 'onboarding.demo.s20',
    cursor: { x: 740, y: 30 },
    click: true,
    duration: 800,
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
