import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import {
  Send, X, Loader2, CheckCircle2, AlertCircle,
  LayoutDashboard, ChevronRight, MessageSquarePlus, PanelRightClose,
} from 'lucide-react';
import { AiLogoIcon } from '@/components/ai-assistant/AiLogoIcon';
import { streamDashboardAI, AI_QUICK_PROMPTS, type StreamCallbacks } from '../services/dashboardAiService';
import type { DashboardWidget } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onApplyWidgets: (widgets: DashboardWidget[], name?: string) => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  widgets?: DashboardWidget[] | null;
  isStreaming?: boolean;
  error?: boolean;
}

/** Shimmer sweep overlay */
const Shimmer = () => (
  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foreground/[0.04] to-transparent bg-[length:200%_100%] animate-shimmer rounded-md" />
);

/** Professional dashboard skeleton — mimics a real dashboard being assembled */
const DashboardBuildingSkeleton = () => {
  const { t } = useTranslation('dashboard');
  const ai = (key: string) => t(`dashboardBuilder.ai.${key}`);
  const [step, setStep] = useState(0);
  const labels = [
    ai('stepAnalyzing') || 'Understanding your needs…',
    ai('stepDesigning') || 'Structuring the layout…',
    ai('stepGenerating') || 'Building widgets…',
    ai('stepFinalizing') || 'Finalizing dashboard…',
  ];

  useEffect(() => {
    const timer = setInterval(() => setStep(s => Math.min(s + 1, labels.length - 1)), 3000);
    return () => clearInterval(timer);
  }, [labels.length]);

  return (
    <div className="space-y-3 py-1">
      {/* Status */}
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-primary/8 flex items-center justify-center shrink-0">
          <AiLogoIcon size={13} variant="auto" />
        </div>
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.p
              key={step}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-[11px] font-medium text-muted-foreground truncate"
            >
              {labels[step]}
            </motion.p>
          </AnimatePresence>
        </div>
        <div className="flex gap-0.5">
          {labels.map((_, i) => (
            <div
              key={i}
              className={cn(
                'w-1.5 h-1.5 rounded-full transition-colors duration-500',
                i <= step ? 'bg-primary/60' : 'bg-muted-foreground/15'
              )}
            />
          ))}
        </div>
      </div>

      {/* Dashboard skeleton preview */}
      <div className="rounded-lg border border-border/30 bg-muted/20 p-2.5 space-y-2">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-1.5">
          {[0, 1, 2, 3].map(i => (
            <motion.div
              key={`kpi-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="relative overflow-hidden rounded-md bg-background border border-border/20 p-2 space-y-1.5"
            >
              <div className="h-1.5 w-8 rounded-full bg-muted-foreground/8" />
              <div className="h-3 w-12 rounded bg-muted-foreground/10" />
              <Shimmer />
            </motion.div>
          ))}
        </div>

        {/* Chart row */}
        <div className="grid grid-cols-3 gap-1.5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="col-span-2 relative overflow-hidden rounded-md bg-background border border-border/20 p-2"
          >
            <div className="h-1.5 w-16 rounded-full bg-muted-foreground/8 mb-2" />
            <div className="flex items-end gap-1 h-12">
              {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{ delay: 0.9 + i * 0.07, duration: 0.4, ease: 'easeOut' }}
                  className="flex-1 rounded-sm bg-primary/12"
                />
              ))}
            </div>
            <Shimmer />
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="relative overflow-hidden rounded-md bg-background border border-border/20 p-2 flex flex-col items-center justify-center"
          >
            <div className="h-1.5 w-10 rounded-full bg-muted-foreground/8 mb-2 self-start" />
            <div className="w-10 h-10 rounded-full border-[3px] border-primary/15 border-t-primary/30" />
            <Shimmer />
          </motion.div>
        </div>

        {/* Table row */}
        <div className="grid grid-cols-2 gap-1.5">
          {[0, 1].map(i => (
            <motion.div
              key={`tbl-${i}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.1 + i * 0.12 }}
              className="relative overflow-hidden rounded-md bg-background border border-border/20 p-2 space-y-1"
            >
              <div className="h-1.5 w-14 rounded-full bg-muted-foreground/8" />
              {[0, 1, 2].map(j => (
                <div key={j} className="h-1.5 rounded-full bg-muted-foreground/6" style={{ width: `${85 - j * 20}%` }} />
              ))}
              <Shimmer />
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export function DashboardAiAssistant({ open, onClose, onApplyWidgets }: Props) {
  const { t } = useTranslation('dashboard');
  const ai = (key: string) => t(`dashboardBuilder.ai.${key}`);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const handleSend = useCallback(async (prompt?: string) => {
    const text = prompt || input.trim();
    if (!text || isGenerating) return;
    setInput('');

    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: text };
    const assistantMsg: Message = { id: `a-${Date.now()}`, role: 'assistant', content: '', isStreaming: true };

    setMessages(prev => [...prev, userMsg, assistantMsg]);
    setIsGenerating(true);
    scrollToBottom();

    const callbacks: StreamCallbacks = {
      onToken: (token) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id ? { ...m, content: m.content + token } : m
        ));
        scrollToBottom();
      },
      onComplete: (widgets) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, isStreaming: false, widgets, content: widgets ? `${widgets.length} widgets ready` : m.content }
            : m
        ));
        setIsGenerating(false);
        scrollToBottom();
      },
      onError: (error) => {
        setMessages(prev => prev.map(m =>
          m.id === assistantMsg.id
            ? { ...m, isStreaming: false, error: true, content: error }
            : m
        ));
        setIsGenerating(false);
      },
    };

    await streamDashboardAI(text, callbacks);
  }, [input, isGenerating]);

  const handleApply = (widgets: DashboardWidget[]) => {
    onApplyWidgets(widgets);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleNewConversation = () => {
    setMessages([]);
    setInput('');
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Side panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 320 }}
            className="fixed top-0 right-0 z-50 h-full w-full max-w-[420px] bg-card border-l border-border shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <AiLogoIcon size={16} variant="auto" />
                </div>
                <div>
                  <h2 className="text-[13px] font-semibold text-foreground">{ai('panelTitle')}</h2>
                  <p className="text-[10px] text-muted-foreground">{ai('panelSubtitle')}</p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleNewConversation}
                    className="text-muted-foreground hover:text-foreground h-7 w-7"
                    title={ai('newConversation')}
                  >
                    <MessageSquarePlus className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground h-7 w-7"
                  title={ai('close')}
                >
                  <PanelRightClose className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Messages area */}
            <ScrollArea className="flex-1" ref={scrollRef}>
              <div className="p-4 space-y-3">
                {/* Empty state */}
                {messages.length === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3 pt-1"
                  >
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {ai('hint')}
                    </p>
                    <div className="space-y-1">
                      <p className="text-[9px] font-semibold text-muted-foreground/70 uppercase tracking-widest mb-2">
                        {ai('quickSuggestions')}
                      </p>
                      {AI_QUICK_PROMPTS.map((qp, i) => (
                        <motion.button
                          key={i}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06, duration: 0.25 }}
                          onClick={() => handleSend(qp.prompt)}
                          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/40 bg-background hover:bg-accent/50 hover:border-primary/20 transition-all text-left group"
                        >
                          <div className="w-7 h-7 rounded-md bg-muted/50 group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                            <LayoutDashboard className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="text-[11px] text-foreground/80 group-hover:text-foreground font-medium flex-1 leading-tight">
                            {t(qp.labelKey)}
                          </span>
                          <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Messages */}
                {messages.map(msg => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    <div className={cn(
                      'max-w-[88%] rounded-xl px-3.5 py-2.5 text-[12px] leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : 'bg-muted/40 text-foreground border border-border/20 rounded-bl-sm'
                    )}>
                      {msg.isStreaming && !msg.content ? (
                        <DashboardBuildingSkeleton />
                      ) : msg.error ? (
                        <div className="flex items-start gap-2.5">
                          <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                          <span className="text-destructive text-[11px]">{msg.content}</span>
                        </div>
                      ) : msg.widgets ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                            <span className="font-medium text-[11px]">{ai('generated')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground px-1">
                            <LayoutDashboard className="h-3 w-3" />
                            {msg.widgets.length} {ai('widgetsGenerated')}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleApply(msg.widgets!)}
                            className="w-full h-8 text-[11px] gap-1.5 font-medium"
                          >
                            <AiLogoIcon size={12} variant="light" />
                            {ai('apply')}
                          </Button>
                        </motion.div>
                      ) : (
                        <span className={msg.isStreaming ? 'opacity-60' : ''}>
                          {msg.content}
                          {msg.isStreaming && (
                            <motion.span
                              className="inline-block w-0.5 h-3 bg-primary/50 ml-0.5 align-middle"
                              animate={{ opacity: [1, 0] }}
                              transition={{ duration: 0.6, repeat: Infinity }}
                            />
                          )}
                        </span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>

            {/* Input area */}
            <div className="p-3.5 border-t border-border flex-shrink-0">
              <div className="flex items-center gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={ai('placeholder')}
                  disabled={isGenerating}
                  className="h-9 text-[12px] bg-background border-border/50 rounded-lg"
                />
                <Button
                  size="icon"
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isGenerating}
                  className="h-9 w-9 rounded-lg shrink-0"
                >
                  {isGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
