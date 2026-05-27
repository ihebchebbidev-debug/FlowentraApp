import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, ReactFlowProvider, Controls, MiniMap } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, RotateCcw, X, ChevronDown,
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook,
  Sparkles, Save, Power, FlaskConical, CheckCircle2, Loader2, PauseCircle,
  Search, FileText, DollarSign, ShoppingCart, Truck, Users, Database, Play as PlayIcon,
  Brain, Bot, Globe, Code, FormInput, ArrowLeftRight, Split, Repeat, ClipboardList,
  Settings2, Settings,
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
  type DemoState, type PaletteCategory, type ConfigField,
} from './autopilotScript';

const nodeTypes = { demo: DemoNode };

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

interface Props {
  open: boolean;
  onClose: (markSeen?: boolean) => void;
}

export function WorkflowAutopilotDemo({ open, onClose }: Props) {
  const { t } = useTranslation('workflow');
  const [stepIndex, setStepIndex] = useState(0);
  const [state, setState] = useState<DemoState>(initialDemoState);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const [clicking, setClicking] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: 80, y: 80 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open) {
      setStepIndex(0); setState(initialDemoState); setPlaying(true);
    } else if (timeoutRef.current) clearTimeout(timeoutRef.current);
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

  useEffect(() => {
    if (!open || !playing || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    if (step.click) {
      setClicking(true);
      setTimeout(() => setClicking(false), 500);
    }
    const halfway = setTimeout(() => setState(s => step.apply(s)), Math.max(200, step.duration / 2));
    const dur = Math.max(400, step.duration / speed);
    timeoutRef.current = setTimeout(() => setStepIndex(i => i + 1), dur);
    return () => { clearTimeout(halfway); if (timeoutRef.current) clearTimeout(timeoutRef.current); };
  }, [stepIndex, playing, open, speed]);

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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(true); }}>
      <DialogContent
        className="max-w-[1180px] w-[96vw] h-[min(94vh,760px)] p-0 gap-0 overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{t('onboarding.demo.title')}</DialogTitle>
        <DialogDescription className="sr-only">{t('onboarding.demo.welcome')}</DialogDescription>

        {/* TOP BAR — mirrors real WorkflowToolbar */}
        <div className="h-12 border-b border-border bg-card flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold truncate">{t('onboarding.demo.title')}</span>
            <span className="hidden sm:inline text-xs text-muted-foreground ml-2 shrink-0">
              · {t(chapters[currentChapter].titleKey)}
            </span>
            <span className="text-xs text-muted-foreground ml-2 shrink-0 tabular-nums">
              {Math.min(stepIndex + 1, steps.length)}/{steps.length}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              data-demo-target="btn-test"
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border bg-background transition-all',
                state.showExecutions && 'ring-2 ring-primary',
              )}
            >
              <FlaskConical className="h-3 w-3" /> {t('onboarding.demo.btnTest')}
            </button>
            <button
              data-demo-target="btn-save"
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border bg-background transition-all',
                state.saved && 'ring-2 ring-emerald-500',
              )}
            >
              <Save className="h-3 w-3" /> {t('onboarding.demo.btnSave')}
              {state.saved && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            </button>
            <button
              data-demo-target="btn-activate"
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border bg-background transition-all',
                state.active && 'bg-emerald-500 text-white border-emerald-500',
              )}
            >
              <Power className="h-3 w-3" />
              {state.active ? t('onboarding.demo.btnActive') : t('onboarding.demo.btnActivate')}
            </button>
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
                fitViewOptions={{ padding: 0.25, maxZoom: 1, minZoom: 0.5 }}
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
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-xs text-muted-foreground/60 italic">{t('onboarding.demo.canvasEmpty')}</div>
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
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="ml-1 h-7 w-[64px] text-xs" aria-label={t('onboarding.demo.speed')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5×</SelectItem>
                  <SelectItem value="1">1×</SelectItem>
                  <SelectItem value="1.5">1.5×</SelectItem>
                  <SelectItem value="2">2×</SelectItem>
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
