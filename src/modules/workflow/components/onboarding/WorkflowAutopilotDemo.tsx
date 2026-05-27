import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ReactFlow, Background, BackgroundVariant, ReactFlowProvider } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play, Pause, SkipForward, RotateCcw, X, ChevronLeft, ChevronRight,
  Zap, Mail, Send, GitBranch, Bell, Shield, Clock, Calendar, Webhook, Sparkles,
  Save, Power, FlaskConical, CheckCircle2, Loader2, PauseCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { DemoNode } from './DemoNode';
import { VirtualCursor } from './VirtualCursor';
import { steps, initialDemoState, type DemoState, type PaletteCategory } from './autopilotScript';

const nodeTypes = { demo: DemoNode };

const PALETTE: Record<PaletteCategory, { id: string; label: string; icon: any; color: string }[]> = {
  triggers: [
    { id: 'trigger-status', label: 'Status Change', icon: Zap, color: 'text-amber-500' },
    { id: 'trigger-schedule', label: 'Scheduled', icon: Calendar, color: 'text-amber-500' },
    { id: 'trigger-webhook', label: 'Webhook', icon: Webhook, color: 'text-amber-500' },
  ],
  actions: [
    { id: 'action-email', label: 'Send Email', icon: Mail, color: 'text-sky-500' },
    { id: 'action-sms', label: 'Send SMS', icon: Send, color: 'text-emerald-500' },
    { id: 'action-notif', label: 'Notification', icon: Bell, color: 'text-rose-500' },
    { id: 'action-webhook', label: 'Webhook call', icon: Webhook, color: 'text-sky-500' },
  ],
  logic: [
    { id: 'logic-condition', label: 'Condition', icon: GitBranch, color: 'text-violet-500' },
    { id: 'logic-delay', label: 'Delay', icon: Clock, color: 'text-violet-500' },
    { id: 'logic-approval', label: 'Approval', icon: Shield, color: 'text-orange-500' },
  ],
  integrations: [
    { id: 'int-ai', label: 'AI', icon: Sparkles, color: 'text-fuchsia-500' },
  ],
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
  const [cursorPos, setCursorPos] = useState({ x: 60, y: 60 });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStepIndex(0);
      setState(initialDemoState);
      setCursorPos({ x: 60, y: 60 });
      setPlaying(true);
    } else {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }
  }, [open]);

  // Run step when index changes & playing
  useEffect(() => {
    if (!open || !playing) return;
    if (stepIndex >= steps.length) return;
    const step = steps[stepIndex];
    setCursorPos(step.cursor);
    if (step.click) {
      setClicking(true);
      setTimeout(() => setClicking(false), 500);
    }
    // Apply mid-step
    const halfway = setTimeout(() => setState((s) => step.apply(s)), Math.max(200, step.duration / 2));
    // Advance after duration
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
    // Apply current step immediately and advance
    if (stepIndex < steps.length) {
      setState((s) => steps[stepIndex].apply(s));
      setStepIndex((i) => i + 1);
    }
  };

  const stepBack = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Recompute state from scratch up to (stepIndex-1)
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

  if (!open) return null;

  const modal = (
    <div className="fixed inset-0 z-[55] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in-0">
      <div className="relative w-full max-w-[1040px] h-[640px] rounded-xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col">
        {/* Top bar */}
        <div className="h-12 border-b border-border bg-muted/40 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold">{t('onboarding.demo.title')}</span>
            <span className="text-xs text-muted-foreground ml-2">
              {t('onboarding.demo.stepLabel', { current: Math.min(stepIndex + 1, steps.length), total: steps.length })}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {/* Mock builder action buttons (visual only) */}
            <button
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border bg-background transition-all',
                state.showExecutions && 'ring-2 ring-primary',
              )}
            >
              <FlaskConical className="h-3 w-3" /> {t('onboarding.demo.btnTest')}
            </button>
            <button
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border bg-background transition-all',
                state.saved && 'ring-2 ring-emerald-500',
              )}
            >
              <Save className="h-3 w-3" /> {t('onboarding.demo.btnSave')}
              {state.saved && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            </button>
            <button
              className={cn(
                'flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border bg-background transition-all',
                state.active && 'bg-emerald-500 text-white border-emerald-500',
              )}
            >
              <Power className="h-3 w-3" /> {state.active ? t('onboarding.demo.btnActive') : t('onboarding.demo.btnActivate')}
            </button>
            <Button variant="ghost" size="icon-sm" onClick={() => onClose(true)} className="ml-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Body: palette + canvas */}
        <div className="flex-1 relative flex min-h-0">
          {/* Palette */}
          <div className="w-[220px] border-r border-border bg-muted/20 p-2 overflow-y-auto shrink-0">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-2 pt-1 pb-2 font-semibold">
              {t('onboarding.demo.paletteTitle')}
            </div>
            {(Object.keys(PALETTE) as PaletteCategory[]).map((cat) => {
              const isOpen = state.paletteCategory === cat;
              return (
                <div key={cat} className="mb-1">
                  <div
                    className={cn(
                      'flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium cursor-default transition-colors',
                      isOpen ? 'bg-primary/10 text-primary' : 'text-foreground/80 hover:bg-muted',
                    )}
                  >
                    <span>{t(`onboarding.demo.category.${cat}`)}</span>
                    <ChevronRight className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-90')} />
                  </div>
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pl-2 py-1 space-y-1">
                          {PALETTE[cat].map((it) => {
                            const Icon = it.icon;
                            const grabbing = state.grabbingItemId === it.id;
                            return (
                              <div
                                key={it.id}
                                className={cn(
                                  'flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] border transition-all',
                                  grabbing
                                    ? 'border-primary bg-primary/10 scale-95 opacity-60'
                                    : 'border-border bg-background hover:border-primary/40',
                                )}
                              >
                                <Icon className={cn('h-3 w-3', it.color)} />
                                <span>{it.label}</span>
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

          {/* Canvas */}
          <div className="flex-1 relative bg-background min-w-0">
            <ReactFlowProvider>
              <ReactFlow
                nodes={state.nodes}
                edges={state.edges}
                nodeTypes={nodeTypes}
                fitView
                fitViewOptions={{ padding: 0.3, maxZoom: 1.1 }}
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

            {/* Empty state */}
            {state.nodes.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-xs text-muted-foreground/60 italic">{t('onboarding.demo.canvasEmpty')}</div>
              </div>
            )}

            {/* Drag ghost when grabbing */}
            {state.grabbingItemId && (
              <motion.div
                key={`ghost-${state.grabbingItemId}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                className="absolute pointer-events-none rounded-md border border-primary bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary z-50"
                style={{ left: cursorPos.x - 220 + 8, top: cursorPos.y + 8 }}
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
                  className="absolute right-6 top-6 w-[280px] rounded-lg border border-border bg-card shadow-xl p-3 z-40"
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
                    <button className="rounded-md bg-primary text-primary-foreground px-2 py-1 text-[11px] font-medium">
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

          {/* Virtual cursor — positioned relative to body */}
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
              {/* Progress bar */}
              <div className="mt-2 h-1 w-full bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  animate={{ width: `${(Math.min(stepIndex, steps.length) / steps.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="icon-sm" onClick={stepBack} disabled={stepIndex === 0} title={t('onboarding.demo.prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {finished ? (
                <Button variant="ghost" size="icon-sm" onClick={restart} title={t('onboarding.demo.replay')}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              ) : (
                <Button variant="ghost" size="icon-sm" onClick={() => setPlaying((p) => !p)} title={playing ? t('onboarding.demo.pause') : t('onboarding.demo.play')}>
                  {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )}
              <Button variant="ghost" size="icon-sm" onClick={skipForward} disabled={finished} title={t('onboarding.demo.skip')}>
                <SkipForward className="h-4 w-4" />
              </Button>
              <select
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="ml-1 h-7 rounded-md border border-border bg-background text-xs px-1.5"
                title={t('onboarding.demo.speed')}
              >
                <option value={0.5}>0.5×</option>
                <option value={1}>1×</option>
                <option value={1.5}>1.5×</option>
                <option value={2}>2×</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => onClose(true)} className="ml-2">
                {finished ? t('onboarding.demo.done') : t('onboarding.demo.dismiss')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
