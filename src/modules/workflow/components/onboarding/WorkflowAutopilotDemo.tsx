import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ReactFlow, Background, BackgroundVariant, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, RotateCcw, X, ChevronLeft, ChevronRight,
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook, Sparkles,
  Save, Power, FlaskConical, CheckCircle2, Loader2, PauseCircle, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DemoNode } from './DemoNode';
import { VirtualCursor } from './VirtualCursor';
import { steps, initialDemoState, type DemoState, type PaletteCategory } from './autopilotScript';

const nodeTypes = { demo: DemoNode };

interface PaletteItem {
  id: string;
  label: string;
  icon: any;
  color: string;
  targetId: string;
}

const PALETTE: Record<PaletteCategory, { targetId: string; items: PaletteItem[] }> = {
  triggers: {
    targetId: 'cat-triggers',
    items: [
      { id: 'trigger-status', label: 'Status Change', icon: Zap, color: '#ff6d5a', targetId: 'palette-trigger-status' },
      { id: 'trigger-schedule', label: 'Scheduled', icon: Calendar, color: '#ff6d5a', targetId: 'palette-trigger-schedule' },
      { id: 'trigger-webhook', label: 'Webhook', icon: Webhook, color: '#ff6d5a', targetId: 'palette-trigger-webhook' },
    ],
  },
  actions: {
    targetId: 'cat-actions',
    items: [
      { id: 'action-email', label: 'Send Email', icon: Mail, color: '#3b82f6', targetId: 'palette-action-email' },
      { id: 'action-sms', label: 'Send SMS', icon: Send, color: '#06b6d4', targetId: 'palette-action-sms' },
      { id: 'action-notif', label: 'Notification', icon: Bell, color: '#06b6d4', targetId: 'palette-action-notif' },
      { id: 'action-webhook', label: 'Webhook call', icon: Webhook, color: '#3b82f6', targetId: 'palette-action-webhook' },
    ],
  },
  logic: {
    targetId: 'cat-logic',
    items: [
      { id: 'logic-condition', label: 'Condition', icon: GitBranch, color: '#f59e0b', targetId: 'palette-logic-condition' },
      { id: 'logic-delay', label: 'Delay', icon: Clock, color: '#f59e0b', targetId: 'palette-logic-delay' },
      { id: 'logic-approval', label: 'Approval', icon: Shield, color: '#f97316', targetId: 'palette-logic-approval' },
    ],
  },
  integrations: {
    targetId: 'cat-integrations',
    items: [
      { id: 'int-ai', label: 'AI Action', icon: Sparkles, color: '#8b5cf6', targetId: 'palette-int-ai' },
    ],
  },
};

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

  // Reset everything when modal opens
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setState(initialDemoState);
      setPlaying(true);
    } else if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, [open]);

  /**
   * Compute the cursor target position from a `data-demo-target` element.
   * Position is relative to the modal body container, so the cursor stays
   * pixel-accurate regardless of viewport size.
   */
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

  // Re-position cursor whenever step changes or the layout settles
  useLayoutEffect(() => {
    if (!open || stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    // First try immediately, then again on next frame (after DOM updates).
    const tryPosition = () => {
      const next = computeCursorFor(step.target, step.offset);
      if (next) setCursorPos(next);
    };
    tryPosition();
    const raf = requestAnimationFrame(tryPosition);
    return () => cancelAnimationFrame(raf);
  }, [stepIndex, open, computeCursorFor, state.paletteCategory, state.nodes.length, state.configModal]);

  // Reposition on window resize too
  useEffect(() => {
    if (!open) return;
    const onResize = () => {
      if (stepIndex >= steps.length) return;
      const step = steps[stepIndex];
      const next = computeCursorFor(step.target, step.offset);
      if (next) setCursorPos(next);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [open, stepIndex, computeCursorFor]);

  // Drive playback
  useEffect(() => {
    if (!open || !playing) return;
    if (stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    if (step.click) {
      setClicking(true);
      setTimeout(() => setClicking(false), 500);
    }
    const halfway = setTimeout(() => setState((s) => step.apply(s)), Math.max(200, step.duration / 2));
    const dur = Math.max(400, step.duration / speed);
    timeoutRef.current = setTimeout(() => setStepIndex((i) => i + 1), dur);
    return () => {
      clearTimeout(halfway);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [stepIndex, playing, open, speed]);

  const finished = stepIndex >= steps.length;

  const restart = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setStepIndex(0);
    setState(initialDemoState);
    setPlaying(true);
  };

  const skipForward = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (stepIndex < steps.length) {
      setState((s) => steps[stepIndex].apply(s));
      setStepIndex((i) => i + 1);
    }
  };

  const stepBack = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const target = Math.max(0, stepIndex - 1);
    let s = initialDemoState;
    for (let i = 0; i < target; i++) s = steps[i].apply(s);
    setState(s);
    setStepIndex(target);
    setPlaying(false);
  };

  const currentCaption = useMemo(() => {
    const key = steps[Math.min(stepIndex, steps.length - 1)]?.caption;
    return key ? t(key) : '';
  }, [stepIndex, t]);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(true); }}>
      <DialogContent
        className="max-w-[1100px] w-[96vw] h-[min(92vh,720px)] p-0 gap-0 overflow-hidden flex flex-col"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogTitle className="sr-only">{t('onboarding.demo.title')}</DialogTitle>
        <DialogDescription className="sr-only">
          {t('onboarding.demo.s1')}
        </DialogDescription>

        {/* Top bar — mirrors real WorkflowBuilder top toolbar */}
        <div className="h-12 border-b border-border bg-muted/40 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 text-primary shrink-0" />
            <span className="text-sm font-semibold truncate">{t('onboarding.demo.title')}</span>
            <span className="text-xs text-muted-foreground ml-2 shrink-0">
              {t('onboarding.demo.stepLabel', {
                current: Math.min(stepIndex + 1, steps.length),
                total: steps.length,
              })}
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
            <Button variant="ghost" size="icon-sm" onClick={() => onClose(true)} className="ml-2" aria-label={t('onboarding.demo.dismiss')}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body — palette + canvas with cursor anchor */}
        <div ref={bodyRef} className="flex-1 relative flex min-h-0">
          {/* Palette — visually inspired by real NodePalette */}
          <aside className="w-[240px] border-r border-border bg-muted/20 flex flex-col shrink-0 min-w-0">
            {/* Mock search */}
            <div className="p-2 border-b border-border/60">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <div className="h-7 rounded-md border border-border bg-background pl-7 pr-2 flex items-center text-[11px] text-muted-foreground/70">
                  Search nodes…
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pb-1 font-semibold">
                {t('onboarding.demo.paletteTitle')}
              </div>
              {(Object.keys(PALETTE) as PaletteCategory[]).map((cat) => {
                const isOpen = state.paletteCategory === cat;
                const entry = PALETTE[cat];
                return (
                  <div key={cat}>
                    <div
                      data-demo-target={entry.targetId}
                      className={cn(
                        'flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-default transition-colors select-none',
                        isOpen ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted',
                      )}
                    >
                      <span>{t(`onboarding.demo.category.${cat}`)}</span>
                      <ChevronRight className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-90')} />
                    </div>
                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="pl-2 py-1 space-y-1">
                            {entry.items.map((it) => {
                              const Icon = it.icon;
                              const grabbing = state.grabbingItemId === it.id;
                              return (
                                <div
                                  key={it.id}
                                  data-demo-target={it.targetId}
                                  className={cn(
                                    'flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] border transition-all',
                                    grabbing
                                      ? 'border-primary bg-primary/10 scale-95 opacity-60'
                                      : 'border-border bg-background hover:border-primary/40',
                                  )}
                                >
                                  <div
                                    className="w-5 h-5 rounded flex items-center justify-center"
                                    style={{ background: `${it.color}1a`, border: `1px solid ${it.color}55` }}
                                  >
                                    <Icon className="h-3 w-3" style={{ color: it.color }} />
                                  </div>
                                  <span className="truncate">{it.label}</span>
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
          </aside>

          {/* Canvas */}
          <div className="flex-1 relative bg-background min-w-0" data-demo-target="canvas">
            <ReactFlowProvider>
              <ReactFlow
                nodes={state.nodes}
                edges={state.edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1.1, minZoom: 0.6 }}
                nodesDraggable={false}
                nodesConnectable={false}
                elementsSelectable={false}
                panOnDrag={false}
                zoomOnScroll={false}
                zoomOnPinch={false}
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background variant={BackgroundVariant.Dots} gap={18} size={1} />
              </ReactFlow>
            </ReactFlowProvider>

            {/* Invisible drop-target anchors so the cursor lands accurately */}
            <div data-demo-target="canvas-drop-1" className="absolute pointer-events-none" style={{ left: '20%', top: '30%', width: 1, height: 1 }} />
            <div data-demo-target="canvas-drop-2" className="absolute pointer-events-none" style={{ left: '55%', top: '30%', width: 1, height: 1 }} />
            <div data-demo-target="canvas-drop-3" className="absolute pointer-events-none" style={{ left: '55%', top: '55%', width: 1, height: 1 }} />
            <div data-demo-target="canvas-drop-4" className="absolute pointer-events-none" style={{ left: '82%', top: '45%', width: 1, height: 1 }} />
            <div data-demo-target="canvas-drop-5" className="absolute pointer-events-none" style={{ left: '82%', top: '70%', width: 1, height: 1 }} />
            <div data-demo-target="canvas-drop-6" className="absolute pointer-events-none" style={{ left: '82%', top: '20%', width: 1, height: 1 }} />

            {state.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-xs text-muted-foreground/60 italic">{t('onboarding.demo.canvasEmpty')}</div>
              </div>
            )}

            {/* Drag ghost follows cursor while grabbing */}
            {state.grabbingItemId && (
              <motion.div
                key={`ghost-${state.grabbingItemId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.85 }}
                className="absolute pointer-events-none rounded-md border border-primary bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary z-50 shadow-md"
                style={{ left: cursorPos.x - 240 + 12, top: cursorPos.y + 12 }}
              >
                {state.grabbingItemId}
              </motion.div>
            )}

            {/* Mock node config modal */}
            <AnimatePresence>
              {state.configModal && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-4 top-4 w-[280px] rounded-lg border border-border bg-card shadow-xl p-3 z-40"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-xs font-semibold">{state.configModal.title}</div>
                    <X className="h-3 w-3 text-muted-foreground" />
                  </div>
                  <div className="space-y-2">
                    {state.configModal.fields.map((f, i) => (
                      <div key={i}>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">{f.label}</div>
                        <div className="rounded border border-border bg-background px-2 py-1 text-xs font-mono">{f.value}</div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end gap-1 mt-3">
                    <button
                      data-demo-target="config-save"
                      className="rounded-md bg-primary text-primary-foreground px-2 py-1 text-[11px] font-medium"
                    >
                      {t('onboarding.demo.btnSave')}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Executions overlay */}
            <AnimatePresence>
              {state.showExecutions && (
                <motion.div
                  initial={{ y: 200, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 200, opacity: 0 }}
                  className="absolute left-3 right-3 bottom-3 rounded-lg border border-border bg-card shadow-xl p-3 z-30"
                >
                  <div className="text-xs font-semibold mb-2 flex items-center gap-2">
                    <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    {t('onboarding.demo.executionTitle')}
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {state.executionLogs.map((l, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="rounded border border-border bg-background p-1.5"
                      >
                        <div className="flex items-center gap-1 text-[10px] font-medium">
                          {l.status === 'ok' && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
                          {l.status === 'wait' && <PauseCircle className="h-3 w-3 text-amber-500" />}
                          {l.status === 'running' && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                          <span className="truncate">{l.node}</span>
                        </div>
                        {l.ms !== undefined && (
                          <div className="text-[9px] text-muted-foreground mt-0.5">{l.ms}ms</div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Virtual cursor — body-relative, always pixel-accurate */}
          <VirtualCursor x={cursorPos.x} y={cursorPos.y} clicking={clicking} />
        </div>

        {/* HUD bottom */}
        <div className="border-t border-border bg-card px-4 py-3 shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stepIndex}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="text-sm text-foreground leading-snug"
                >
                  {finished ? t('onboarding.demo.finished') : currentCaption}
                </motion.p>
              </AnimatePresence>
              <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${(Math.min(stepIndex, steps.length) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon-sm" onClick={stepBack} disabled={stepIndex === 0} aria-label={t('onboarding.demo.prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {finished ? (
                <Button variant="ghost" size="icon-sm" onClick={restart} aria-label={t('onboarding.demo.replay')}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon-sm" onClick={() => setPlaying((p) => !p)} aria-label={playing ? t('onboarding.demo.pause') : t('onboarding.demo.play')}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={skipForward} disabled={finished} aria-label={t('onboarding.demo.skip')}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v))}>
                <SelectTrigger className="ml-1 h-7 w-[68px] text-xs" aria-label={t('onboarding.demo.speed')}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0.5">0.5×</SelectItem>
                  <SelectItem value="1">1×</SelectItem>
                  <SelectItem value="1.5">1.5×</SelectItem>
                  <SelectItem value="2">2×</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={() => onClose(true)} className="ml-2">
                {finished ? t('onboarding.demo.done') : t('onboarding.demo.dismiss')}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
