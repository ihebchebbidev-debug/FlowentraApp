import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, ReactFlowProvider, Controls, MiniMap, useReactFlow, MarkerType } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Volume2, VolumeX } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, RotateCcw, X, ChevronDown,
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook,
  Sparkles, Save, Power, FlaskConical, CheckCircle2, Loader2, PauseCircle,
  Search, FileText, DollarSign, ShoppingCart, Truck, Users, Database, Play as PlayIcon,
  Brain, Bot, Globe, Code, FormInput, ArrowLeftRight, Split, Repeat, ClipboardList,
  Settings2, Settings, Plus, Layers,
  Bug, Copy, Upload, Download, FolderOpen, Edit3, Square, FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DemoNode, CATEGORY_COLOR } from './DemoNode';
import { VirtualCursor } from './VirtualCursor';
import {
  steps, chapters, initialDemoState,
  type DemoState, type PaletteCategory, type ConfigField, type OpenPanel,
} from './autopilotScript';
import { pickBestVoice, splitForSpeech, languageTagFor } from './narrationVoice';


const nodeTypes = { demo: DemoNode };

// Auto re-fit canvas whenever the node set changes so all nodes stay visible.
function FitOnChange({ nodeCount, hasPanel }: { nodeCount: number; hasPanel: boolean }) {
  const rf = useReactFlow();
  useEffect(() => {
    const t = setTimeout(() => {
      rf.fitView({ padding: 0.22, duration: 600, maxZoom: 0.85, minZoom: 0.25 });
    }, 80);
    return () => clearTimeout(t);
  }, [nodeCount, hasPanel, rf]);
  return null;
}

// ─── PALETTE — mirrors src/modules/workflow/components/panels/NodePalette.tsx ──
interface PaletteItem {
  id: string;          // node type
  label: string;
  icon: any;
  color: keyof typeof CATEGORY_COLOR;
}
interface PaletteSection {
  id: PaletteCategory;
  labelKey: string;
  icon: any;
  iconColor: string;
  items: PaletteItem[];
}

const PALETTE: PaletteSection[] = [
  {
    id: 'triggers', labelKey: 'onboarding.demo.cat.triggers', icon: Zap, iconColor: '#ff6d5a',
    items: [
      { id: 'offer-status-trigger', label: 'Offer · Status Change', icon: FileText, color: 'trigger' },
      { id: 'sale-status-trigger', label: 'Sale · Status Change', icon: DollarSign, color: 'trigger' },
      { id: 'service-order-status-trigger', label: 'Service Order · Status Change', icon: ShoppingCart, color: 'trigger' },
      { id: 'dispatch-status-trigger', label: 'Dispatch · Status Change', icon: Truck, color: 'trigger' },
      { id: 'webhook-trigger', label: 'Webhook', icon: Webhook, color: 'trigger' },
      { id: 'scheduled-trigger', label: 'Scheduled (cron)', icon: Calendar, color: 'trigger' },
    ],
  },
  {
    id: 'entities', labelKey: 'onboarding.demo.cat.entities', icon: Database, iconColor: '#10b981',
    items: [
      { id: 'offer', label: 'Offer', icon: FileText, color: 'entity' },
      { id: 'sale', label: 'Sale', icon: DollarSign, color: 'entity' },
      { id: 'service-order', label: 'Service Order', icon: ShoppingCart, color: 'entity' },
      { id: 'dispatch', label: 'Dispatch', icon: Truck, color: 'entity' },
      { id: 'contact', label: 'Contact', icon: Users, color: 'entity' },
    ],
  },
  {
    id: 'actions', labelKey: 'onboarding.demo.cat.actions', icon: PlayIcon, iconColor: '#3b82f6',
    items: [
      { id: 'create-offer', label: 'Create Offer', icon: FileText, color: 'action' },
      { id: 'create-sale', label: 'Create Sale', icon: DollarSign, color: 'action' },
      { id: 'create-service-order', label: 'Create Service Order', icon: ShoppingCart, color: 'action' },
      { id: 'create-dispatch', label: 'Create Dispatch', icon: Truck, color: 'action' },
      { id: 'update-offer-status', label: 'Update Offer Status', icon: FileText, color: 'action' },
      { id: 'update-sale-status', label: 'Update Sale Status', icon: DollarSign, color: 'action' },
      { id: 'update-service-order-status', label: 'Update SO Status', icon: ShoppingCart, color: 'action' },
      { id: 'update-dispatch-status', label: 'Update Dispatch Status', icon: Truck, color: 'action' },
    ],
  },
  {
    id: 'conditions', labelKey: 'onboarding.demo.cat.conditions', icon: GitBranch, iconColor: '#f59e0b',
    items: [
      { id: 'if-else', label: 'If / Else', icon: GitBranch, color: 'condition' },
      { id: 'switch', label: 'Switch', icon: Split, color: 'condition' },
      { id: 'loop', label: 'Loop', icon: Repeat, color: 'condition' },
    ],
  },
  {
    id: 'communication', labelKey: 'onboarding.demo.cat.communication', icon: Mail, iconColor: '#06b6d4',
    items: [
      { id: 'send-email', label: 'Send Email', icon: Mail, color: 'communication' },
      { id: 'send-notification', label: 'In-app Notification', icon: Bell, color: 'communication' },
      { id: 'request-approval', label: 'Request Approval', icon: Shield, color: 'approval' },
      { id: 'delay', label: 'Delay', icon: Clock, color: 'communication' },
      { id: 'human-input-form', label: 'Human Input Form', icon: ClipboardList, color: 'communication' },
      { id: 'wait-for-event', label: 'Wait for Event', icon: PauseCircle, color: 'communication' },
    ],
  },
  {
    id: 'ai', labelKey: 'onboarding.demo.cat.ai', icon: Brain, iconColor: '#8b5cf6',
    items: [
      { id: 'ai-email-writer', label: 'AI · Email Writer', icon: Sparkles, color: 'ai' },
      { id: 'ai-analyzer', label: 'AI · Analyzer', icon: Brain, color: 'ai' },
      { id: 'ai-agent', label: 'AI · Agent', icon: Bot, color: 'ai' },
      { id: 'custom-llm', label: 'Custom LLM', icon: Settings2, color: 'ai' },
    ],
  },
  {
    id: 'integration', labelKey: 'onboarding.demo.cat.integration', icon: ArrowLeftRight, iconColor: '#64748b',
    items: [
      { id: 'http-request', label: 'HTTP Request', icon: Globe, color: 'integration' },
      { id: 'dynamic-form', label: 'Dynamic Form', icon: FormInput, color: 'integration' },
      { id: 'data-transfer', label: 'Data Transfer', icon: ArrowLeftRight, color: 'integration' },
      { id: 'code', label: 'Custom Code', icon: Code, color: 'integration' },
    ],
  },
];

// ─── Config field renderer (mirrors NodeConfigPanel styles) ──────────────────
function FieldRow({ field, idx }: { field: ConfigField; idx: number }) {
  return (
    <div data-demo-target={`config-field-${idx}`} className="space-y-1">
      <label className="text-[10.5px] font-medium uppercase tracking-wider text-muted-foreground">
        {field.label}
      </label>
      {field.type === 'input' && (
        <div className="h-7 rounded-md border border-border bg-background px-2 flex items-center text-[11.5px] text-foreground/90 font-mono truncate">
          {field.value}
        </div>
      )}
      {field.type === 'number' && (
        <div className="h-7 w-24 rounded-md border border-border bg-background px-2 flex items-center text-[11.5px] tabular-nums">
          {field.value}
        </div>
      )}
      {field.type === 'select' && (
        <div className="h-7 rounded-md border border-border bg-background px-2 flex items-center justify-between text-[11.5px]">
          <span className="truncate">{field.value}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 ml-1" />
        </div>
      )}
      {field.type === 'textarea' && (
        <div className="min-h-[54px] rounded-md border border-border bg-background px-2 py-1.5 text-[11px] text-foreground/90 font-mono whitespace-pre-wrap leading-tight">
          {field.value}
        </div>
      )}
      {field.type === 'switch' && (
        <div className="flex items-center justify-between rounded-md border border-border bg-background px-2 py-1.5">
          <span className="text-[11.5px] text-foreground/80">Enabled</span>
          <div className={cn(
            'h-4 w-7 rounded-full relative transition-colors',
            field.value === 'on' ? 'bg-primary' : 'bg-muted',
          )}>
            <div className={cn(
              'absolute top-0.5 h-3 w-3 rounded-full bg-background shadow-sm transition-transform',
              field.value === 'on' ? 'translate-x-3.5' : 'translate-x-0.5',
            )} />
          </div>
        </div>
      )}
      {field.type === 'tag' && (
        <div className="flex gap-1 flex-wrap">
          {field.value.split('·').map((t, i) => (
            <span key={i} className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-muted text-foreground/70">
              {t.trim()}
            </span>
          ))}
        </div>
      )}
      {field.hint && (
        <p className="text-[10px] text-muted-foreground/70 italic mt-0.5">{field.hint}</p>
      )}
    </div>
  );
}

// ─── Floating panel that anchors under a top-bar button ──────────────────────
const PANEL_ANCHOR: Record<Exclude<OpenPanel, null>, string> = {
  ai: 'btn-ai',
  debug: 'btn-debug',
  copy: 'btn-copy',
  import: 'btn-import',
  export: 'btn-export',
  groups: 'btn-groups',
  manager: 'btn-manager',
  version: 'tb-version',
};

function FloatingPanel({
  bodyRef, anchorId, children, width = 280, align = 'right',
}: {
  bodyRef: React.RefObject<HTMLDivElement>;
  anchorId: string;
  children: React.ReactNode;
  width?: number;
  align?: 'left' | 'right';
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  useLayoutEffect(() => {
    const measure = () => {
      const body = bodyRef.current;
      if (!body) return;
      const el = body.querySelector<HTMLElement>(`[data-demo-target="${CSS.escape(anchorId)}"]`);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const b = body.getBoundingClientRect();
      const top = r.bottom - b.top + 8;
      const left = align === 'right'
        ? Math.max(8, Math.min(b.width - width - 8, r.right - b.left - width))
        : Math.max(8, r.left - b.left);
      setPos({ top, left });
    };
    measure();
    const id = requestAnimationFrame(measure);
    const t = setTimeout(measure, 60);
    window.addEventListener('resize', measure);
    return () => { cancelAnimationFrame(id); clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [bodyRef, anchorId, width, align]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -6, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -6, scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 380, damping: 28 }}
      className="absolute z-50 rounded-lg border border-border bg-popover shadow-2xl text-popover-foreground overflow-hidden"
      style={{ top: pos?.top ?? -9999, left: pos?.left ?? -9999, width }}
    >
      {children}
    </motion.div>
  );
}

function PanelContent({ kind, t }: { kind: Exclude<OpenPanel, null>; t: (k: string, d?: string) => string }) {
  switch (kind) {
    case 'ai':
      return (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
            </div>
            <div>
              <div className="text-[12px] font-semibold">{t('onboarding.demo.panel.ai.title', 'Build with AI')}</div>
              <div className="text-[10px] text-muted-foreground">{t('onboarding.demo.panel.ai.sub', 'Describe what should happen — AI builds the graph')}</div>
            </div>
          </div>
          <div className="rounded-md border border-border bg-background px-2 py-1.5 text-[11px] text-foreground/90 font-mono leading-snug">
            When an offer is accepted, send an email to the customer, request manager approval over 10k, then create a Sale.
          </div>
          <div className="flex flex-wrap gap-1">
            {['Email on accept', 'SLA reminder', 'Auto Service Order', 'Slack alert'].map(s => (
              <span key={s} className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40">{s}</span>
            ))}
          </div>
          <div className="flex justify-end">
            <div className="h-6 px-2 rounded-md bg-primary text-primary-foreground text-[10.5px] font-medium inline-flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> {t('onboarding.demo.panel.ai.generate', 'Generate')}
            </div>
          </div>
        </div>
      );
    case 'debug':
      return (
        <div className="p-3">
          <div className="flex items-center gap-2 pb-2 border-b border-border mb-2">
            <Bug className="h-3.5 w-3.5 text-primary" />
            <div className="text-[12px] font-semibold">{t('onboarding.demo.panel.debug.title', 'Debug console')}</div>
          </div>
          <div className="font-mono text-[10.5px] leading-tight space-y-0.5 max-h-40 overflow-hidden">
            {[
              { lvl: 'INFO', msg: 'trigger.fired offer-status-change id=OFF-2138' },
              { lvl: 'OK',   msg: 'condition.evaluated totalAmount > 10000 → true' },
              { lvl: 'OK',   msg: 'send_email queued to alice@acme.com' },
              { lvl: 'WAIT', msg: 'request_approval pending · Sales Manager' },
              { lvl: 'WARN', msg: 'http_request retry 1/5 in 2s' },
            ].map((l, i) => (
              <div key={i} className="flex gap-2">
                <span className={cn(
                  'shrink-0 w-9 text-[9.5px] font-bold tabular-nums',
                  l.lvl === 'OK' && 'text-emerald-500',
                  l.lvl === 'WAIT' && 'text-amber-500',
                  l.lvl === 'WARN' && 'text-orange-500',
                  l.lvl === 'INFO' && 'text-muted-foreground',
                )}>{l.lvl}</span>
                <span className="text-foreground/80 truncate">{l.msg}</span>
              </div>
            ))}
          </div>
        </div>
      );
    case 'copy':
      return (
        <div className="p-2.5 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
          <div>
            <div className="text-[12px] font-semibold">{t('onboarding.demo.panel.copy.title', 'Configuration copied')}</div>
            <div className="text-[10.5px] text-muted-foreground">{t('onboarding.demo.panel.copy.sub', 'Workflow JSON is on your clipboard — paste to share or back up')}</div>
          </div>
        </div>
      );
    case 'import':
      return (
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 pb-2 border-b border-border">
            <Upload className="h-3.5 w-3.5 text-primary" />
            <div className="text-[12px] font-semibold">{t('onboarding.demo.panel.import.title', 'Import workflow')}</div>
          </div>
          <div className="rounded-md border border-dashed border-border bg-muted/30 p-3 text-center text-[11px] text-muted-foreground">
            {t('onboarding.demo.panel.import.drop', 'Drop a .json file or paste JSON below')}
          </div>
          <div className="rounded-md border border-border bg-background p-1.5 font-mono text-[10px] text-muted-foreground/80 leading-tight max-h-16 overflow-hidden">
            {'{ "name": "Offer → Sale flow", "nodes": [...], "edges": [...] }'}
          </div>
        </div>
      );
    case 'export':
      return (
        <div className="py-1.5">
          <div className="px-3 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold border-b border-border">
            {t('onboarding.demo.panel.export.title', 'Export as')}
          </div>
          {[
            { i: Code,     l: 'JSON',          d: 'Full workflow definition' },
            { i: FileText, l: 'YAML',          d: 'Human-readable format' },
            { i: Download, l: 'PNG snapshot',  d: 'Visual diagram of the canvas' },
            { i: Copy,     l: 'Markdown docs', d: 'Auto-generated documentation' },
          ].map((o, i) => (
            <div key={i} className="flex items-center gap-2 px-3 py-1.5 hover:bg-muted/50">
              <o.i className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[11.5px] font-medium">{o.l}</div>
                <div className="text-[10px] text-muted-foreground">{o.d}</div>
              </div>
            </div>
          ))}
        </div>
      );
    case 'groups':
      return (
        <div className="p-2">
          <div className="px-1 pb-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            {t('onboarding.demo.panel.groups.title', 'Workflow groups')}
          </div>
          {[
            { n: 'Sales pipeline', c: 8, on: 6 },
            { n: 'Field service',  c: 5, on: 5 },
            { n: 'Finance & billing', c: 3, on: 2 },
            { n: 'Internal ops',   c: 4, on: 1 },
          ].map((g, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50">
              <FolderOpen className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11.5px] font-medium flex-1">{g.n}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums">{g.on}/{g.c}</span>
            </div>
          ))}
        </div>
      );
    case 'manager':
      return (
        <div className="p-2">
          <div className="px-1 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
              {t('onboarding.demo.panel.manager.title', 'All workflows')}
            </span>
            <span className="text-[10px] text-muted-foreground tabular-nums">24 total</span>
          </div>
          {[
            { n: 'Offer → Sale handoff',     s: 'active',  r: '2m ago' },
            { n: 'Overdue invoice reminder', s: 'active',  r: '14m ago' },
            { n: 'New SO → tech dispatch',   s: 'draft',   r: '—' },
            { n: 'Weekly KPI digest',        s: 'paused',  r: '3d ago' },
          ].map((w, i) => (
            <div key={i} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/50">
              <FolderTree className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-[11.5px] font-medium flex-1 truncate">{w.n}</span>
              <span className={cn(
                'text-[9.5px] px-1.5 py-0.5 rounded-full font-semibold',
                w.s === 'active' && 'bg-emerald-500/15 text-emerald-600',
                w.s === 'draft'  && 'bg-amber-500/15 text-amber-600',
                w.s === 'paused' && 'bg-muted text-muted-foreground',
              )}>{w.s}</span>
              <span className="text-[10px] text-muted-foreground tabular-nums w-12 text-right">{w.r}</span>
            </div>
          ))}
        </div>
      );
    case 'version':
      return (
        <div className="p-2.5 space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold pb-1">
            {t('onboarding.demo.panel.version.title', 'Version history')}
          </div>
          {[
            { v: 'v3', when: 'now',     who: 'You',          tag: 'Editing' },
            { v: 'v2', when: '2h ago',  who: 'Sara Khelifi', tag: 'Active' },
            { v: 'v1', when: 'Mon',     who: 'Imen B.',      tag: 'Archived' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted/50">
              <span className="text-[11px] font-bold tabular-nums w-6">{r.v}</span>
              <span className="text-[10.5px] text-muted-foreground flex-1 truncate">{r.who} · {r.when}</span>
              <span className="text-[9.5px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-semibold">{r.tag}</span>
            </div>
          ))}
        </div>
      );
  }
}

interface Props {
  open: boolean;
  onClose: (markSeen?: boolean) => void;
}


export function WorkflowAutopilotDemo({ open, onClose }: Props) {
  const { t, i18n } = useTranslation('workflow');
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(0.6);
  const [speechOn, setSpeechOn] = useState(true);
  const [clicking, setClicking] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 80, y: 80 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setStepIndex(0); setState(initialDemoState); setPlaying(true);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
    }
  }, [open]);

  const computeCursorFor = useCallback((targetId: string, offset?: { x: number; y: number }) => {
    const body = bodyRef.current;
    if (!body) return null;
    const el = body.querySelector<HTMLElement>(`[data-demo-target="${CSS.escape(targetId)}"]`);
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const b = body.getBoundingClientRect();
    return {
      x: r.left - b.left + r.width / 2 + (offset?.x ?? 0),
      y: r.top - b.top + r.height / 2 + (offset?.y ?? 0),
    };
  }, []);

  useLayoutEffect(() => {
    if (!open || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    const tryPos = () => {
      const next = computeCursorFor(step.target, step.offset);
      if (next) setCursorPos(next);
    };
    tryPos();
    const raf = requestAnimationFrame(tryPos);
    const t = setTimeout(tryPos, 80);
    return () => { cancelAnimationFrame(raf); clearTimeout(t); };
  }, [stepIndex, open, computeCursorFor, state.paletteCategory, state.nodes.length, state.configPanel]);

  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (stepIndex >= steps.length) return;
      const next = computeCursorFor(steps[stepIndex].target, steps[stepIndex].offset);
      if (next) setCursorPos(next);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, stepIndex, computeCursorFor]);

  const finished = stepIndex >= steps.length;

  const restart = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex(0); setState(initialDemoState); setPlaying(true);
  };

  const jumpToChapter = (chapterIdx: number) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const target = chapters[chapterIdx]?.start ?? 0;
    let s = initialDemoState;
    for (let i = 0; i < target; i++) s = steps[i].apply(s);
    setState(s); setStepIndex(target); setPlaying(true);
  };

  const currentChapter = useMemo(() => {
    const idx = chapters.findIndex(c => stepIndex >= c.start && stepIndex < c.end);
    return idx === -1 ? chapters.length - 1 : idx;
  }, [stepIndex]);

  const currentCaption = useMemo(() => {
    const key = steps[Math.min(stepIndex, steps.length - 1)]?.caption;
    return key ? t(key) : '';
  }, [stepIndex, t]);


  // Unified narration + step-advance loop:
  // - speaks the caption with Web Speech API (slow, clear rate)
  // - waits for the full utterance to finish before moving to the next step
  // - falls back to a timer when speech is muted or unsupported
  useEffect(() => {
    if (!open || !playing || stepIndex >= steps.length) return;
    const step = steps[stepIndex];

    // visual click pulse
    if (step.click) {
      setClicking(true);
      setTimeout(() => setClicking(false), 500);
    }

    // apply state change at the halfway point so the UI mutation lines up with the narration
    const baseDur = Math.max(1400, step.duration / speed);
    const halfway = setTimeout(() => setState(s => step.apply(s)), baseDur / 2);

    const advance = () => setStepIndex(i => i + 1);

    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    const caption = step.caption ? t(step.caption) : '';

    if (speechOn && synthSupported && caption) {
      const synth = window.speechSynthesis;
      synth.cancel();

      const { code, bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code);
      const chunks = splitForSpeech(caption);

      let advanced = false;
      const doAdvance = () => {
        if (advanced) return;
        advanced = true;
        timeoutRef.current = setTimeout(advance, 420); // breath before next step
      };

      // Queue every sentence so the engine pauses naturally between them.
      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47;
        if (voice) u.voice = voice;
        // Slow, warm, slightly varied — sounds less robotic than a flat read.
        u.rate = 0.86;
        u.pitch = idx % 2 === 0 ? 1.02 : 0.98;
        u.volume = 1;
        if (idx === chunks.length - 1) {
          u.onend = doAdvance;
          u.onerror = doAdvance;
        }
        try { synth.speak(u); } catch { /* fall through to safety net */ }
      });

      // safety net so a stuck/blocked TTS engine never freezes the tour
      const safetyMs = Math.max(baseDur, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);

      // Chrome bug: speechSynthesis pauses after ~15s — keep it awake.
      const keepAlive = setInterval(() => {
        if (synth.speaking && !synth.paused) {
          synth.pause();
          synth.resume();
        }
      }, 10000);

      return () => {
        clearTimeout(halfway);
        clearTimeout(safety);
        clearInterval(keepAlive);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        try { synth.cancel(); } catch { /* ignore */ }
      };
    }

    // no speech → plain timer
    timeoutRef.current = setTimeout(advance, baseDur);
    return () => {
      clearTimeout(halfway);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stepIndex, playing, open, speed, speechOn, i18n.language, t]);

  useEffect(() => {
    if ((!playing || !open) && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, [playing, open]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(true); }}>
      <DialogContent
        className="max-w-[1180px] w-[96vw] h-[min(94vh,760px)] p-0 gap-0 overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{t('onboarding.demo.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('onboarding.demo.welcome')}</DialogDescription>

        {/* TOP BAR — 1-to-1 mirror of the real WorkflowBuilder toolbar */}
        <div className="border-b border-border/60 bg-card/80 backdrop-blur-xl px-4 py-2 shrink-0 flex items-center justify-between gap-2">
          {/* LEFT: connection · version badge · history */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div data-demo-target="tb-status" className="flex items-center gap-1.5 shrink-0">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
              <span className="text-[11px] text-muted-foreground font-medium">{t('connected', 'Connected')}</span>
            </div>

            {/* Version badge — mirrors WorkflowVersionBadge: [icon] Active v1 */}
            <div
              data-demo-target="tb-version"
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium shrink-0',
                state.active
                  ? 'bg-success/15 text-success border-success/30'
                  : 'bg-warning/15 text-warning border-warning/30',
              )}
            >
              {state.active ? <CheckCircle2 className="h-3 w-3" /> : <Edit3 className="h-3 w-3" />}
              <span>
                {state.active
                  ? t('onboarding.demo.tb.vActive', 'Active')
                  : state.saved
                    ? t('onboarding.demo.tb.vDraft', 'Draft')
                    : t('onboarding.demo.tb.vEditing', 'Editing')}
              </span>
              <span className="text-[10px] opacity-70 tabular-nums">v{state.saved ? 3 : 2}</span>
            </div>

            <button className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted/50 text-muted-foreground" aria-label="History">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* RIGHT: actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!state.saved && (
              <div data-demo-target="tb-edit-pill" className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-warning/15 border border-warning/30 text-[11px] text-warning font-semibold mr-1">
                <Edit3 className="h-3 w-3" />
                <span>{t('editMode', 'Edit mode')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-warning animate-pulse" />
              </div>
            )}
            {state.saved && (
              <div data-demo-target="tb-nextrun" className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-muted/40 text-[11px] text-muted-foreground mr-1">
                <span>{t('onboarding.demo.tb.nextRunIn', 'Next run in')}</span>
                <span className="font-semibold text-foreground tabular-nums">04:21</span>
              </div>
            )}

            <div className="w-px h-5 bg-border mx-0.5" />

            <button
              data-demo-target="btn-ai"
              className="h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium bg-primary text-primary-foreground border border-primary/30 shadow-sm whitespace-nowrap"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('onboarding.demo.tb.aiLabel', 'Build with AI')}</span>
            </button>
            <button data-demo-target="btn-debug" className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted/40" aria-label="Debug">
              <Bug className="h-4 w-4" />
            </button>
            <button data-demo-target="btn-copy" className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted/40" aria-label="Copy">
              <Copy className="h-4 w-4" />
            </button>
            <button data-demo-target="btn-import" className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted/40" aria-label="Import">
              <Upload className="h-4 w-4" />
            </button>
            <button data-demo-target="btn-export" className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted/40" aria-label="Export">
              <Download className="h-4 w-4" />
            </button>
            <button data-demo-target="btn-groups" className="h-8 w-8 inline-flex items-center justify-center rounded-md border border-border bg-background hover:bg-muted/40" aria-label="Groups">
              <FolderOpen className="h-4 w-4" />
            </button>

            <button data-demo-target="btn-manager" className="h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium border border-border bg-background hover:bg-muted/40 whitespace-nowrap">
              <FolderTree className="h-4 w-4" />
              <span className="hidden sm:inline">{t('onboarding.demo.tb.managerLabel', 'My workflows')}</span>
            </button>

            <button
              data-demo-target="btn-test"
              className={cn(
                'h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium border border-border bg-background hover:bg-muted/40 whitespace-nowrap transition-all',
                state.showExecutions && 'ring-2 ring-primary',
              )}
            >
              <FlaskConical className="h-4 w-4" />
              <span className="hidden sm:inline">{t('onboarding.demo.tb.testLabel', 'Test')}</span>
            </button>

            {!state.saved ? (
              <>
                <button data-demo-target="btn-cancel" className="h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium border border-border bg-background hover:bg-muted/40 whitespace-nowrap">
                  <X className="h-4 w-4" /> {t('onboarding.demo.tb.cancelLabel', 'Cancel')}
                </button>
                <button
                  data-demo-target="btn-save"
                  className="h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium bg-primary text-primary-foreground border border-primary/30 shadow-sm whitespace-nowrap"
                >
                  <Save className="h-4 w-4" /> {t('onboarding.demo.tb.saveLabel', 'Save')}
                </button>
              </>
            ) : (
              <button
                data-demo-target="btn-save"
                className="h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium border border-border bg-background hover:bg-muted/40 whitespace-nowrap"
              >
                <Edit3 className="h-4 w-4" />
                {t('onboarding.demo.tb.editLabel', 'Edit')}
              </button>
            )}

            <button
              data-demo-target="btn-activate"
              className={cn(
                'h-8 inline-flex items-center gap-1.5 rounded-md px-2.5 text-xs font-medium border shadow-sm whitespace-nowrap transition-all',
                state.active
                  ? 'bg-destructive text-destructive-foreground border-destructive/30 hover:bg-destructive/90'
                  : 'bg-primary text-primary-foreground border-primary/30 hover:bg-primary/90',
              )}
            >
              {state.active ? <Square className="h-4 w-4" /> : <Power className="h-4 w-4" />}
              <span className="hidden sm:inline">
                {state.active ? t('onboarding.demo.tb.stopLabel', 'Stop') : t('onboarding.demo.tb.activateLabel', 'Activate')}
              </span>
            </button>

            <div className="w-px h-5 bg-border mx-0.5" />

            <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-primary/30 bg-primary/5 text-[10px] font-semibold text-primary shrink-0">
              <Sparkles className="h-3 w-3" />
              <span className="tabular-nums">{Math.min(stepIndex + 1, steps.length)}/{steps.length}</span>
            </span>

            <Button variant="ghost" size="icon-sm" onClick={() => onClose(true)} aria-label={t('onboarding.demo.dismiss')} className="ml-1">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* BODY */}
        <div ref={bodyRef} className="flex-1 relative flex min-h-0">
          {/* PALETTE — mirrors real NodePalette (252px, search, collapsible categories) */}
          <aside className="w-[252px] border-r border-border bg-card flex flex-col shrink-0 min-w-0">
            <div data-demo-target="palette-header" className="px-3 pt-3 pb-2 border-b border-border shrink-0">
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {t('onboarding.demo.nodesLabel')}
              </h3>
              <div className="relative" data-demo-target="palette-search">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <div className="h-7 rounded-md border border-border bg-background pl-7 pr-2 flex items-center text-[11px] text-muted-foreground/70">
                  {state.paletteSearch || t('onboarding.demo.searchPlaceholder')}
                </div>
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0">
              <div className="px-2 py-2 space-y-0.5">
                {PALETTE.map((section) => {
                  const isOpen = state.paletteCategory === section.id;
                  return (
                    <div key={section.id}>
                      <div
                        data-demo-target={`cat-${section.id}`}
                        className={cn(
                          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-default select-none transition-colors',
                          'hover:bg-muted/60 text-xs font-semibold text-foreground/80',
                          isOpen && 'bg-muted/60',
                        )}
                      >
                        <div className="flex items-center justify-center w-5 h-5 rounded shrink-0 bg-muted">
                          <section.icon className="h-3 w-3" style={{ color: section.iconColor }} />
                        </div>
                        <span className="flex-1 text-left">{t(section.labelKey)}</span>
                        <span className="text-[10px] font-normal text-muted-foreground tabular-nums">
                          {section.items.length}
                        </span>
                        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', isOpen && 'rotate-180')} />
                      </div>

                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="py-0.5 space-y-px ml-2">
                              {section.items.map((it) => {
                                const grabbing = state.grabbingItemId === it.id;
                                const color = CATEGORY_COLOR[it.color];
                                return (
                                  <div
                                    key={it.id}
                                    data-demo-target={`palette-${it.id}`}
                                    className={cn(
                                      'flex items-center gap-2.5 px-2 py-[6px] rounded-md text-xs transition-all',
                                      grabbing
                                        ? 'border border-primary bg-primary/10 scale-95 opacity-60'
                                        : 'hover:bg-muted/70',
                                    )}
                                  >
                                    <div
                                      className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 border bg-background"
                                      style={{ borderColor: `${color}55` }}
                                    >
                                      <it.icon className="h-3.5 w-3.5" style={{ color }} />
                                    </div>
                                    <span className="truncate text-foreground/80 font-medium leading-tight">
                                      {it.label}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>

            <div className="px-3 py-2 border-t border-border shrink-0 flex items-center justify-between text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Clock className="h-3 w-3 opacity-60" />
                <span>{t('onboarding.demo.nextRun')}</span>
                <span className="font-medium text-foreground/70 tabular-nums">5:00</span>
              </div>
            </div>
          </aside>

          {/* CANVAS */}
          <div className="flex-1 relative bg-muted/10 min-w-0" data-demo-target="canvas">
            <ReactFlowProvider>
              <ReactFlow
                nodes={state.nodes}
                edges={state.edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.22, maxZoom: 0.85, minZoom: 0.25 }}
                minZoom={0.2}
                maxZoom={1}
                defaultEdgeOptions={{
                  type: 'smoothstep',
                  animated: true,
                  style: { strokeWidth: 1.75 },
                  markerEnd: { type: MarkerType.ArrowClosed, width: 18, height: 18 },
                }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
                <Controls showInteractive={false} className="!bg-card !border-border !shadow-sm" />
                <MiniMap pannable={false} zoomable={false} className="!bg-card/80 !border-border" />
                <FitOnChange nodeCount={state.nodes.length} hasPanel={!!state.configPanel} />
              </ReactFlow>
            </ReactFlowProvider>

            {/* Drop-target anchors (invisible) */}
            <div data-demo-target="drop-1" className="absolute pointer-events-none" style={{ left: '18%', top: '28%', width: 1, height: 1 }} />
            <div data-demo-target="drop-2" className="absolute pointer-events-none" style={{ left: '50%', top: '28%', width: 1, height: 1 }} />
            <div data-demo-target="drop-3" className="absolute pointer-events-none" style={{ left: '50%', top: '55%', width: 1, height: 1 }} />
            <div data-demo-target="drop-4" className="absolute pointer-events-none" style={{ left: '78%', top: '45%', width: 1, height: 1 }} />
            <div data-demo-target="drop-5" className="absolute pointer-events-none" style={{ left: '78%', top: '20%', width: 1, height: 1 }} />
            <div data-demo-target="drop-6" className="absolute pointer-events-none" style={{ left: '50%', top: '78%', width: 1, height: 1 }} />
            <div data-demo-target="drop-7" className="absolute pointer-events-none" style={{ left: '92%', top: '28%', width: 1, height: 1 }} />
            <div data-demo-target="drop-8" className="absolute pointer-events-none" style={{ left: '35%', top: '15%', width: 1, height: 1 }} />
            <div data-demo-target="drop-9" className="absolute pointer-events-none" style={{ left: '65%', top: '40%', width: 1, height: 1 }} />
            <div data-demo-target="drop-10" className="absolute pointer-events-none" style={{ left: '25%', top: '70%', width: 1, height: 1 }} />
            <div data-demo-target="drop-11" className="absolute pointer-events-none" style={{ left: '70%', top: '65%', width: 1, height: 1 }} />
            <div data-demo-target="drop-12" className="absolute pointer-events-none" style={{ left: '88%', top: '55%', width: 1, height: 1 }} />
            <div data-demo-target="drop-13" className="absolute pointer-events-none" style={{ left: '15%', top: '50%', width: 1, height: 1 }} />
            <div data-demo-target="drop-14" className="absolute pointer-events-none" style={{ left: '45%', top: '88%', width: 1, height: 1 }} />

            {state.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                {/* decorative floats */}
                <div className="absolute inset-0 overflow-hidden">
                  <div className="absolute top-[15%] left-[12%] w-24 h-10 rounded-xl bg-primary/[0.05] border border-primary/10" />
                  <div className="absolute top-[25%] right-[15%] w-20 h-8 rounded-xl bg-emerald-500/[0.05] border border-emerald-500/10" />
                  <div className="absolute bottom-[22%] left-[18%] w-16 h-8 rounded-xl bg-amber-500/[0.05] border border-amber-500/10" />
                  <div className="absolute bottom-[30%] right-[12%] w-28 h-10 rounded-xl bg-violet-500/[0.05] border border-violet-500/10" />
                  <svg className="absolute inset-0 w-full h-full opacity-[0.07]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M 180 130 C 320 130, 320 260, 460 260" stroke="currentColor" fill="none" strokeWidth="2" strokeDasharray="6 4" />
                    <path d="M 540 180 C 680 180, 680 360, 820 360" stroke="currentColor" fill="none" strokeWidth="2" strokeDasharray="6 4" />
                  </svg>
                </div>

                <div className="relative text-center max-w-md px-6">
                  <div className="relative mb-5 flex items-center justify-center">
                    <div className="absolute w-20 h-20 rounded-full bg-primary/[0.08] animate-pulse" />
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 border border-primary/20 flex items-center justify-center shadow-sm">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-1.5 tracking-tight">
                    {t('onboarding.demo.emptyTitle', 'Get started')}
                  </h3>
                  <p className="text-[12.5px] text-muted-foreground mb-5 leading-relaxed">
                    {t('onboarding.demo.emptyDesc', 'Start by adding a trigger node to begin your workflow. Drag components from the toolbar and connect them.')}
                  </p>
                  <div className="flex items-center gap-2 justify-center flex-wrap">
                    <div data-demo-target="empty-add-trigger" className="inline-flex items-center gap-1.5 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[11.5px] font-medium shadow-sm">
                      <Plus className="h-3.5 w-3.5" />
                      {t('onboarding.demo.emptyAddTrigger', 'Add a trigger')}
                    </div>
                    <div data-demo-target="empty-browse-templates" className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-background px-3 py-1.5 text-[11.5px] font-medium">
                      <Layers className="h-3.5 w-3.5" />
                      {t('onboarding.demo.emptyBrowseTemplates', 'Browse templates')}
                    </div>
                    <div data-demo-target="empty-build-ai" className="inline-flex items-center gap-1.5 rounded-md border border-primary/25 bg-background px-3 py-1.5 text-[11.5px] font-medium">
                      <Sparkles className="h-3.5 w-3.5 text-primary" />
                      {t('onboarding.demo.emptyBuildAI', 'Build with AI')}
                    </div>
                  </div>
                  <p className="text-[10.5px] text-muted-foreground/60 mt-3 italic">
                    {t('onboarding.demo.emptyHint', 'Or drag a node from the panel on the left')}
                  </p>
                </div>
              </div>
            )}

            {state.grabbingItemId && (
              <motion.div
                key={`ghost-${state.grabbingItemId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                className="absolute pointer-events-none rounded-md border border-primary bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary z-50 shadow-md"
                style={{ left: cursorPos.x - 252 + 12, top: cursorPos.y + 12 }}
              >
                {state.grabbingItemId}
              </motion.div>
            )}

            {/* Executions overlay (bottom) */}
            <AnimatePresence>
              {state.showExecutions && (
                <motion.div
                  initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}
                  className="absolute left-3 right-3 bottom-3 rounded-lg border border-border bg-card shadow-xl p-3 z-30"
                >
                  <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    {t('onboarding.demo.executionTitle')}
                  </div>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {state.executionLogs.map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
                        className="rounded border border-border bg-background p-1.5"
                      >
                        <div className="flex items-center gap-1 text-[10px] font-medium">
                          {l.status === 'ok' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                          {l.status === 'wait' && <PauseCircle className="h-3 w-3 text-amber-500" />}
                          {l.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                          {l.status === 'failed' && <X className="h-3 w-3 text-destructive" />}
                          <span className="truncate">{l.node}</span>
                        </div>
                        {l.ms !== undefined && (
                          <div className="text-[9px] text-muted-foreground mt-0.5 tabular-nums">{l.ms}ms</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* CONFIG SIDE PANEL — slides in from right, mirrors real NodeConfigPanel */}
          <AnimatePresence>
            {state.configPanel && (
              <motion.aside
                key={state.configPanel.nodeId}
                initial={{ x: 380, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 380, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                className="absolute right-0 top-0 bottom-0 w-[360px] bg-card border-l border-border shadow-2xl z-40 flex flex-col"
              >
                {/* Header */}
                <div className="px-4 py-3 border-b border-border flex items-start gap-3 shrink-0">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: `${state.configPanel.iconColor}1f`, border: `1.5px solid ${state.configPanel.iconColor}55` }}
                  >
                    <Settings className="h-[17px] w-[17px]" style={{ color: state.configPanel.iconColor }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">{state.configPanel.title}</div>
                    {state.configPanel.subtitle && (
                      <div className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{state.configPanel.subtitle}</div>
                    )}
                  </div>
                  <X className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                </div>

                {/* Tabs (visual) */}
                <div className="px-3 pt-2 border-b border-border shrink-0">
                  <div className="flex gap-1">
                    {(['general', 'settings', 'advanced'] as const).map(tab => (
                      <div
                        key={tab}
                        data-demo-target={`tab-${tab}`}
                        className={cn(
                          'px-3 py-1.5 text-[11px] font-medium rounded-md cursor-default',
                          state.configPanel?.tab === tab
                            ? 'bg-primary/10 text-primary border-b-2 border-primary'
                            : 'text-muted-foreground',
                        )}
                      >
                        {t(`onboarding.demo.tab.${tab}`)}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fields */}
                <ScrollArea className="flex-1 min-h-0">
                  <div className="p-4 space-y-3.5">
                    {state.configPanel.fields.map((f, i) => (
                      <FieldRow key={i} field={f} idx={i} />
                    ))}
                  </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-border flex items-center justify-end gap-2 shrink-0">
                  <button className="rounded-md border border-border bg-background px-3 py-1.5 text-[11px] font-medium">
                    {t('onboarding.demo.cancel')}
                  </button>
                  <button
                    data-demo-target="config-save"
                    className="rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-[11px] font-medium shadow-sm"
                  >
                    {t('onboarding.demo.applyChanges')}
                  </button>
                </div>
              </motion.aside>
            )}
          </AnimatePresence>

          {/* Floating toolbar panels — opened in sync with the narration */}
          <AnimatePresence>
            {state.openPanel && (
              <FloatingPanel
                key={state.openPanel}
                bodyRef={bodyRef}
                anchorId={PANEL_ANCHOR[state.openPanel]}
                width={state.openPanel === 'copy' ? 260 : state.openPanel === 'export' || state.openPanel === 'version' ? 240 : 300}
                align={state.openPanel === 'version' ? 'left' : 'right'}
              >
                <PanelContent kind={state.openPanel} t={t as any} />
              </FloatingPanel>
            )}
          </AnimatePresence>

          {/* Virtual cursor — body-relative for pixel-accurate landing */}
          <VirtualCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />
        </div>

        {/* HUD bottom — chapter chips + controls */}
        <div className="border-t border-border bg-card px-4 py-2.5 shrink-0">
          {/* Chapter chips */}
          <div className="flex items-center gap-1 mb-2 overflow-x-auto scrollbar-thin">
            {chapters.map((c, i) => {
              const isActive = i === currentChapter;
              const isDone = stepIndex >= c.end;
              return (
                <button
                  key={c.id}
                  onClick={() => jumpToChapter(i)}
                  className={cn(
                    'shrink-0 px-2.5 py-1 rounded-full text-[10.5px] font-medium border transition-all',
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : isDone
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                        : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted',
                  )}
                >
                  <span className="tabular-nums opacity-70 mr-1">{i + 1}.</span>
                  {t(c.titleKey)}
                </button>
              );
            })}
          </div>

          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                  className="text-[13px] text-foreground leading-snug"
                >
                  {finished ? t('onboarding.demo.finished') : currentCaption}
                </motion.p>
              </AnimatePresence>
              <div className="mt-1.5 h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${(Math.min(stepIndex, steps.length) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {finished ? (
                <Button variant="ghost" size="icon-sm" onClick={restart} aria-label={t('onboarding.demo.replay')}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon-sm" onClick={() => setPlaying(p => !p)} aria-label={playing ? t('onboarding.demo.pause') : t('onboarding.demo.play')}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )}
              <Button
                variant="ghost" size="icon-sm"
                onClick={() => {
                  if (timeoutRef.current) clearTimeout(timeoutRef.current);
                  if (stepIndex < steps.length) {
                    setState(s => steps[stepIndex].apply(s));
                    setStepIndex(i => i + 1);
                  }
                }}
                disabled={finished} aria-label={t('onboarding.demo.skip')}
              >
                <SkipForward className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost" size="icon-sm"
                onClick={() => {
                  setSpeechOn(v => {
                    if (v && typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel();
                    return !v;
                  });
                }}
                aria-label={speechOn ? 'Mute narration' : 'Unmute narration'}
              >
                {speechOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="ml-1 h-7 w-[72px] text-xs" aria-label={t('onboarding.demo.speed')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.4">0.4×</SelectItem>
                  <SelectItem value="0.6">0.6×</SelectItem>
                  <SelectItem value="0.8">0.8×</SelectItem>
                  <SelectItem value="1">1×</SelectItem>
                  <SelectItem value="1.5">1.5×</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => onClose(true)} className="ml-2 text-xs">
                {finished ? t('onboarding.demo.done') : t('onboarding.demo.dismiss')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
