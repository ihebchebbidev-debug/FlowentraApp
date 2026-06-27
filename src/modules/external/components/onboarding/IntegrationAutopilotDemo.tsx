import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Plug, Globe, Zap, BarChart3, Search, Plus, Clock,
  CheckCircle2, ChevronRight, Info, Building2, Code2,
  Settings2, ChevronDown, ArrowDownLeft, SendHorizonal, ArrowRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DemoCursor } from './DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from './narrationVoice';
import {
  INT_STEPS, INT_CHAPTERS, initialDemoState,
  type IntegrationDemoState,
} from './integrationDemoScript';
import { CONNECTOR_CATALOG, CONNECTOR_CATEGORIES } from '../../utils/connectorCatalog';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COLOR_MAP: Record<string, string> = {
  'microsoft-dynamics-bc': '#00A4EF',
  'sap-b1': '#0070F3',
  'sap-s4': '#0070F3',
  odoo: '#714B67',
  'navision-nav': '#00A4EF',
  salesforce: '#00A1E0',
  hubspot: '#FF7A59',
  woocommerce: '#7F54B3',
  shopify: '#96BF48',
  quickbooks: '#2CA01C',
  zapier: '#FF4A00',
  n8n: '#EA4B71',
  make: '#6D00CC',
  stripe: '#635BFF',
};

const DEMO_LOGS = [
  { id: 1, method: 'POST', contentType: 'application/json',                  statusCode: 200, companyId: 'company-001', receivedAt: '2m ago'  },
  { id: 2, method: 'POST', contentType: 'application/xml',                   statusCode: 200, companyId: 'company-002', receivedAt: '5m ago'  },
  { id: 3, method: 'POST', contentType: 'application/x-www-form-urlencoded', statusCode: 200, companyId: 'company-001', receivedAt: '12m ago' },
  { id: 4, method: 'POST', contentType: 'application/json',                  statusCode: 400, companyId: 'company-003', receivedAt: '1h ago'  },
] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function demoFormatBadge(ct: string): { label: string; cls: string } {
  if (ct.includes('xml'))  return { label: 'XML',  cls: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-300' };
  if (ct.includes('json')) return { label: 'JSON', cls: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-300' };
  if (ct.includes('form')) return { label: 'FORM', cls: 'text-purple-600 bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 dark:text-purple-300' };
  return { label: ct.split('/').pop() ?? ct, cls: 'text-muted-foreground bg-muted border-border' };
}

function statCard(id: string, icon: React.ReactNode, label: string, value: string | number) {
  return (
    <div id={id} className="bg-card border border-border rounded-lg p-3">
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">{icon}{label}</div>
      <p className="text-xl font-bold text-foreground mt-1">{value}</p>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function IntegrationAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -100, y: -100, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= INT_STEPS.length;

  // Fold the script to get deterministic state
  const state: IntegrationDemoState = useMemo(() => {
    let s = initialDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, INT_STEPS.length); i++) s = INT_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = INT_STEPS[Math.min(stepIndex, INT_STEPS.length - 1)];

  // Reset on open
  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  // Warm up voices
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  // Move cursor to target
  useEffect(() => {
    if (!open || finished) return;
    const place = () => {
      const el = document.getElementById(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 60), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 160);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.phase, state.activeTab,
      state.showEndpointDetail, state.showContentTypeConfig, state.showTestModal]);

  // Narration + auto-advance
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = step.caption;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis;
      synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code);
      const chunks = splitForSpeech(caption);

      let advanced = false;
      const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };

      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47;
        configureUtteranceForFemaleVoice(u, voice);
        if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; }
        try { synth.speak(u); } catch { /* safety */ }
      });

      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      const keepAlive = setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000);

      return () => {
        clearTimeout(safety);
        clearInterval(keepAlive);
        if (timerRef.current) clearTimeout(timerRef.current);
        try { synth.cancel(); } catch { /* ignore */ }
      };
    }

    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, i18n.language]);

  const restart = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setStepIndex(0);
    setPlaying(true);
  }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;

  const activeChapter = INT_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || INT_CHAPTERS[INT_CHAPTERS.length - 1];

  // Filtered catalog for demo
  const filteredCatalog = CONNECTOR_CATALOG.filter(c => {
    if (state.catalogCategory !== 'all' && c.category !== state.catalogCategory) return false;
    const q = state.catalogSearch.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.vendor.toLowerCase().includes(q);
  });

  const sapB1 = CONNECTOR_CATALOG.find(c => c.id === 'sap-b1');

  // Visible demo logs (apply company filter)
  const visibleLogs = state.activeCompanyFilter
    ? DEMO_LOGS.filter(l => l.companyId === state.activeCompanyFilter)
    : DEMO_LOGS;

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">

      {/* ── Top bar ── */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <Plug className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Integration Hub — Live Demo</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>
            {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart">
            <RotateCcw className="h-4 w-4" />
          </button>
          <button onClick={() => onClose()} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* ── Content area ── */}
      <div className="flex-1 overflow-y-auto pointer-events-none">

        {state.phase === 'hub' && (
          <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">

            {/* Page header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 id="demo-hub-title" className="text-2xl font-bold text-foreground">Integration Hub</h1>
                <p className="text-sm text-muted-foreground mt-1">Connect Flowentra to your ERP, CRM, e-commerce, and other business systems.</p>
              </div>
              <Button variant="outline" size="sm" className="gap-2 shrink-0">
                <Globe className="h-4 w-4" />
                Create Endpoint
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {statCard('demo-stat-connections', <Plug className="h-3.5 w-3.5" />, 'Connections', state.connectorGroups.length)}
              {statCard('demo-stat-endpoints', <Globe className="h-3.5 w-3.5" />, 'Total Endpoints', state.connectorGroups.reduce((s, g) => s + g.endpointCount, 0))}
              {statCard('demo-stat-received', <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />, 'Received Today', state.connectorGroups.reduce((s, g) => s + g.totalReceived, 0))}
              {statCard('demo-stat-sent', <SendHorizonal className="h-3.5 w-3.5 text-blue-500" />, 'Sent Today', state.connectorGroups.reduce((s, g) => s + g.totalSent, 0))}
            </div>

            {/* Tabs */}
            <div className="border-b border-border">
              <div className="flex gap-1 -mb-px">
                <button
                  id="demo-tab-connections"
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${state.activeTab === 'connections' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
                >
                  <Plug className="h-3.5 w-3.5" />
                  Connections
                  {state.connectorGroups.length > 0 && (
                    <span className="ml-1 text-[10px] bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{state.connectorGroups.length}</span>
                  )}
                </button>
                <button
                  id="demo-tab-webhooks"
                  className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${state.activeTab === 'webhooks' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  Webhooks
                </button>
              </div>
            </div>

            {/* ── Connections tab ── */}
            {state.activeTab === 'connections' && (
              <div className="space-y-5">
                {state.connectorGroups.length > 0 && (
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold text-foreground">Active Connections</h2>
                    {state.connectorGroups.map(group => (
                      <div
                        key={group.connectorId}
                        id={`demo-active-${group.connectorId}`}
                        className="border border-border rounded-lg p-4"
                        style={{ borderLeft: `3px solid ${COLOR_MAP[group.connectorId] ?? '#888'}` }}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <span className="text-2xl">{group.logo}</span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-semibold text-sm">{group.connectorName}</p>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                                <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.5">
                                  <ArrowDownLeft className="h-2.5 w-2.5" /> Inbound
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {group.endpointCount} webhook(s) active
                                {' · '}
                                <span className="text-emerald-600 font-medium">{group.totalReceived} ↓ received</span>
                                {group.totalSent > 0 && <span className="text-blue-600 font-medium"> · {group.totalSent} ↑ sent</span>}
                              </p>
                              <div className="flex gap-1 mt-1.5">
                                {['Sales Orders', 'Partners', 'Purchases'].slice(0, group.endpointCount).map(n => (
                                  <span key={n} className="inline-flex items-center text-[10px] bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">
                                    {n} <ChevronRight className="inline h-2.5 w-2.5 ml-0.5" />
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <Button variant="outline" size="sm" className="shrink-0">Manage</Button>
                        </div>
                      </div>
                    ))}
                  </section>
                )}

                <section className="space-y-4">
                  <h2 className="text-sm font-semibold text-foreground">
                    {state.connectorGroups.length > 0 ? 'Add Another Integration' : 'Available Integrations'}
                  </h2>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <div id="demo-catalog-search" className="flex h-9 w-full rounded-md border border-input bg-background pl-9 pr-3 text-sm items-center text-muted-foreground">
                        {state.catalogSearch || 'Search integrations...'}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {CONNECTOR_CATEGORIES.map(cat => (
                        <button
                          key={cat.value}
                          id={`demo-cat-${cat.value}`}
                          className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${state.catalogCategory === cat.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border'}`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {filteredCatalog.map(connector => (
                      <div
                        key={connector.id}
                        id={`demo-connector-${connector.id}`}
                        className={`relative flex flex-col border rounded-lg overflow-hidden bg-card transition-all duration-300 ${state.highlightedConnector === connector.id ? 'border-primary ring-2 ring-primary/30 shadow-lg -translate-y-0.5' : 'border-border/60'}`}
                        style={{ borderTop: `3px solid ${COLOR_MAP[connector.id] ?? connector.color}` }}
                      >
                        <div className="flex flex-col flex-1 gap-2 p-3">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-2xl leading-none">{connector.logo}</span>
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] border border-border rounded px-1.5 py-0.5 capitalize">{connector.category}</span>
                              {connector.isPopular && <span className="text-[10px] bg-amber-500/10 text-amber-700 border border-amber-500/30 rounded px-1.5 py-0.5">Popular</span>}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-xs text-foreground leading-tight">{connector.name}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{connector.vendor}</p>
                          </div>
                          <p className="text-[10px] text-muted-foreground line-clamp-2 flex-1">{connector.description}</p>
                          <div className="flex flex-wrap gap-1">
                            {connector.entities.slice(0, 2).map(e => (
                              <span key={e.type} className="text-[9px] bg-muted px-1 py-0.5 rounded-sm text-muted-foreground">{e.label}</span>
                            ))}
                            {connector.entities.length > 2 && <span className="text-[9px] bg-muted px-1 py-0.5 rounded-sm text-muted-foreground">+{connector.entities.length - 2}</span>}
                          </div>
                          <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
                            <span>{connector.vendor}</span>
                            <ArrowRight className="h-2.5 w-2.5 shrink-0" />
                            <span className="font-medium text-primary">Flowentra</span>
                          </div>
                          {connector.availability === 'full' ? (
                            <div className="inline-flex items-center justify-center gap-1.5 w-full h-7 rounded-md bg-primary text-primary-foreground text-[11px] font-medium mt-auto">
                              <Plug className="h-3 w-3" /> Connect
                            </div>
                          ) : (
                            <div className="inline-flex items-center justify-center gap-1.5 w-full h-7 rounded-md border border-border text-muted-foreground text-[11px] mt-auto opacity-60">
                              <Clock className="h-3 w-3" /> Coming Soon
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* ── Webhooks tab ── */}
            {state.activeTab === 'webhooks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <p id="demo-webhooks-desc" className="text-sm text-muted-foreground">
                    Custom inbound endpoints — receive data from any HTTP-capable source.
                  </p>
                  <button id="demo-create-endpoint-btn" className="inline-flex items-center gap-2 h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium shrink-0">
                    <Plus className="h-4 w-4" /> Create Endpoint
                  </button>
                </div>

                {/* ── Endpoint list / table ── */}
                {!state.showEndpointDetail && (
                  <div id="demo-webhook-table" className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Name</th>
                          <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground hidden sm:table-cell">Slug</th>
                          <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground">Status</th>
                          <th className="text-left px-4 py-2.5 font-medium text-xs text-muted-foreground hidden md:table-cell">Flow</th>
                          <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground">Received</th>
                          <th className="text-center px-4 py-2.5 font-medium text-xs text-muted-foreground hidden lg:table-cell">Sent</th>
                          <th className="w-10" />
                        </tr>
                      </thead>
                      <tbody>
                        {state.connectorGroups.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No endpoints yet</td>
                          </tr>
                        ) : (
                          state.connectorGroups.flatMap(g =>
                            ['Sales Orders', 'Partners', 'Purchases'].slice(0, g.endpointCount).map((label, i) => (
                              <tr key={i} className="border-t border-border/60">
                                <td className="px-4 py-3 font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className="text-base">{g.logo}</span>
                                    <span>{g.connectorName} — {label}</span>
                                  </div>
                                </td>
                                <td className="px-4 py-3 hidden sm:table-cell">
                                  <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{g.connectorId}-{label.toLowerCase().replace(' ', '-')}</code>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">Active</span>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                  <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-full px-1.5 py-0.5">
                                    <ArrowDownLeft className="h-2.5 w-2.5" /> Inbound
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-center text-muted-foreground">{Math.floor(g.totalReceived / g.endpointCount)}</td>
                                <td className="px-4 py-3 text-center text-muted-foreground hidden lg:table-cell">—</td>
                                <td className="px-4 py-3" />
                              </tr>
                            ))
                          )
                        )}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* ── Endpoint detail + logs (Chapter 6) ── */}
                {state.showEndpointDetail && (
                  <div className="space-y-4">
                    {/* Detail header */}
                    <div id="demo-logs-header" className="flex flex-wrap items-center justify-between gap-3 border border-border rounded-lg px-4 py-3 bg-card">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xl">🔵</span>
                        <div>
                          <p className="font-semibold text-sm">SAP Business One — Sales Orders</p>
                          <p className="text-xs text-muted-foreground">Received Requests · {DEMO_LOGS.length} total</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-medium bg-primary text-primary-foreground">Active</span>
                        <code className="text-xs bg-muted px-1.5 py-0.5 rounded">sap-b1-sales-orders</code>
                      </div>
                    </div>

                    {/* Logs table */}
                    <div className="border border-border rounded-lg overflow-hidden">
                      <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-muted/40 border-b border-border">
                        <p className="text-xs font-medium text-foreground">Received Requests</p>
                        {/* Company filter */}
                        <div id="demo-company-filter" className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          <div className="relative inline-flex items-center">
                            <select
                              className="h-7 appearance-none rounded-md border border-input bg-background pl-2 pr-6 text-xs text-foreground"
                              value={state.activeCompanyFilter}
                              onChange={() => {}}
                            >
                              <option value="">All companies</option>
                              <option value="company-001">company-001</option>
                              <option value="company-002">company-002</option>
                              <option value="company-003">company-003</option>
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          </div>
                        </div>
                      </div>

                      <table className="w-full text-sm">
                        <thead className="bg-muted/20">
                          <tr>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Method</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Format</th>
                            <th id="demo-log-company-col" className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Company</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Status</th>
                            <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Received</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visibleLogs.map((log, i) => {
                            const fmt = demoFormatBadge(log.contentType);
                            const isHighlighted =
                              (state.highlightedLogFormat === 'xml'  && log.contentType.includes('xml')) ||
                              (state.highlightedLogFormat === 'json' && log.contentType.includes('json'));
                            return (
                              <tr
                                key={log.id}
                                id={i === 1 ? 'demo-log-xml' : i === 0 ? 'demo-log-json' : undefined}
                                className={`border-t border-border/60 transition-colors ${isHighlighted ? 'bg-primary/5' : ''}`}
                              >
                                <td className="px-3 py-2.5">
                                  <Badge variant="outline" className="text-[10px]">{log.method}</Badge>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`inline-flex items-center gap-1 text-[10px] font-medium border rounded px-1.5 py-0.5 ${fmt.cls}`}>
                                    <Code2 className="h-2.5 w-2.5" />
                                    {fmt.label}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                                    <Building2 className="h-2.5 w-2.5" />
                                    {log.companyId}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5">
                                  <Badge variant={log.statusCode === 200 ? 'default' : 'destructive'} className="text-[10px]">
                                    {log.statusCode}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2.5 text-xs text-muted-foreground">{log.receivedAt}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Content-type config (appears at step 38) */}
                    {state.showContentTypeConfig && (
                      <div id="demo-content-type-config" className="border border-border rounded-lg overflow-hidden">
                        <div className="flex items-center gap-2 px-4 py-3 bg-muted/40 border-b border-border">
                          <Settings2 className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Accepted Content Types</p>
                        </div>
                        <div className="px-4 py-3 space-y-3">
                          {/* Accept any — checked */}
                          <label className="flex items-center gap-2 text-sm font-medium">
                            <div className="h-4 w-4 rounded border-2 bg-primary border-primary flex items-center justify-center shrink-0">
                              <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            </div>
                            Accept any content type
                          </label>
                          {/* Specific options (greyed out when acceptAll) */}
                          <div className="flex flex-wrap gap-4 pl-1 opacity-40">
                            {[
                              { label: 'JSON', hint: 'application/json',                  cls: 'text-blue-600' },
                              { label: 'XML',  hint: 'application/xml',                   cls: 'text-orange-600' },
                              { label: 'Form', hint: 'application/x-www-form-urlencoded', cls: 'text-purple-600' },
                            ].map(ct => (
                              <label key={ct.label} className="flex items-center gap-2 text-sm">
                                <div className="h-4 w-4 rounded border-2 border-muted-foreground/40 shrink-0" />
                                <span className={`font-medium ${ct.cls}`}>{ct.label}</span>
                                <span className="text-xs text-muted-foreground">({ct.hint})</span>
                              </label>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Requests with a non-matching Content-Type are rejected with HTTP 415. "Accept any" is recommended for maximum ERP compatibility.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Create-connection / success phase ── */}
        {(state.phase === 'create-connection' || state.phase === 'success') && sapB1 && (
          <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-5">
            <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
              ← Back to Hub
            </button>

            <div className="flex items-center gap-4">
              <span className="text-4xl leading-none">{sapB1.logo}</span>
              <div>
                <h1 id="demo-wizard-title" className="text-xl font-bold text-foreground">Connect {sapB1.name}</h1>
                <p className="text-sm text-muted-foreground mt-0.5">{sapB1.description}</p>
              </div>
            </div>

            {!state.showSuccess ? (
              <div className="space-y-5">
                <div className="border border-border rounded-lg p-4 space-y-3">
                  <h2 className="text-sm font-semibold">Select entities to sync</h2>
                  {sapB1.entities.map(entity => (
                    <label key={entity.type} id={`demo-entity-${entity.type}`} className="flex items-center gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/30 transition-colors">
                      <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${state.selectedEntities.includes(entity.type) ? 'bg-primary border-primary' : 'border-muted-foreground/40'}`}>
                        {state.selectedEntities.includes(entity.type) && <svg className="h-2.5 w-2.5 text-primary-foreground" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{entity.label}</p>
                        <p className="text-xs text-muted-foreground">{entity.erpObjectName} → {entity.targetModule}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {state.selectedEntities.length > 0 && (
                  <div id="demo-will-create" className="border border-border rounded-lg p-4 space-y-2 bg-muted/30">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">What will be created</h3>
                    {state.selectedEntities.map(type => {
                      const entity = sapB1.entities.find(e => e.type === type);
                      return entity ? (
                        <div key={type} className="flex items-center gap-2 text-sm">
                          <Globe className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="font-medium">{sapB1.name} — {entity.label}</span>
                          <Badge variant="outline" className="text-[9px] ml-auto">{entity.targetModule}</Badge>
                        </div>
                      ) : null;
                    })}
                  </div>
                )}

                <div className="border border-border rounded-lg overflow-hidden">
                  <button id="demo-instructions-toggle" className="w-full flex items-center justify-between gap-3 p-4 text-sm font-medium hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-primary" />
                      Setup Instructions
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${state.showInstructions ? 'rotate-90' : ''}`} />
                  </button>
                  {state.showInstructions && (
                    <div className="px-4 pb-4 space-y-2 border-t border-border">
                      {sapB1.setupInstructions.map((instruction, idx) => (
                        <div key={idx} id={`demo-instruction-${idx + 1}`} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                          <span>{instruction}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  id="demo-create-btn"
                  className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold"
                  disabled={state.selectedEntities.length === 0}
                >
                  Create Integration
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div id="demo-success-title" className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                  <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Integration Created!</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Your webhooks for {sapB1.name} are ready. Follow the instructions to finish setup.</p>
                  </div>
                </div>

                <div id="demo-success-endpoints" className="border border-border rounded-lg divide-y divide-border">
                  {state.selectedEntities.map(type => {
                    const entity = sapB1.entities.find(e => e.type === type);
                    return entity ? (
                      <div key={type} className="flex items-center justify-between gap-3 px-4 py-3">
                        <div className="flex items-center gap-2 min-w-0">
                          <Globe className="h-4 w-4 text-primary shrink-0" />
                          <span className="text-sm font-medium truncate">{sapB1.name} — {entity.label}</span>
                        </div>
                        <button className="text-xs text-primary hover:underline shrink-0">View endpoint</button>
                      </div>
                    ) : null;
                  })}
                </div>

                <div id="demo-success-api-hint" className="flex gap-3 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
                  <Info className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>Reveal and copy the API key from each endpoint detail page, then add it as the <code className="font-mono text-[11px] bg-amber-100 dark:bg-amber-900 px-1 rounded">X-API-Key</code> header in {sapB1.name}.</span>
                </div>

                <button id="demo-back-hub" className="inline-flex items-center gap-2 text-sm text-primary hover:underline">
                  ← Back to Integration Hub
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Test modal overlay (Chapter 6 · step 39-40) ── */}
      {state.showTestModal && !finished && (
        <div className="absolute inset-0 z-[112] flex items-center justify-center bg-background/60 backdrop-blur-sm pointer-events-none">
          <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div>
                <p className="font-semibold text-sm">Test Endpoint</p>
                <p className="text-xs text-muted-foreground mt-0.5">Sends a real POST with the X-API-Key header.</p>
              </div>
              <div className="h-7 w-7 rounded-md border border-border flex items-center justify-center text-muted-foreground">
                <X className="h-3.5 w-3.5" />
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* URL */}
              <div>
                <p className="text-xs text-muted-foreground font-medium mb-1">Public URL</p>
                <code className="block text-xs bg-muted px-2 py-1.5 rounded break-all text-foreground">
                  https://yourtenant.ourapp.app/api/external-receive/sap-b1-sales-orders
                </code>
              </div>

              {/* Content-type selector */}
              <div id="demo-test-modal-ct">
                <p className="text-xs font-medium text-foreground mb-1.5">Content Type</p>
                <div className="flex gap-2 flex-wrap">
                  {[
                    { value: 'application/json', label: 'JSON',  cls: 'text-blue-600 bg-blue-50 border-blue-300 dark:bg-blue-950/30 dark:border-blue-700' },
                    { value: 'application/xml',  label: 'XML',   cls: 'text-orange-600 bg-orange-50 border-orange-300 dark:bg-orange-950/30 dark:border-orange-700' },
                    { value: 'application/x-www-form-urlencoded', label: 'Form', cls: 'text-purple-600 bg-purple-50 border-purple-300 dark:bg-purple-950/30 dark:border-purple-700' },
                  ].map(ct => (
                    <div
                      key={ct.value}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-xs font-medium ${state.testModalContentType === ct.value ? ct.cls : 'border-border text-muted-foreground bg-background'}`}
                    >
                      {state.testModalContentType === ct.value && (
                        <div className="h-3 w-3 rounded-full border-2 border-current flex items-center justify-center">
                          <div className="h-1.5 w-1.5 rounded-full bg-current" />
                        </div>
                      )}
                      {ct.label}
                      {state.testModalContentType !== ct.value && <div className="h-3 w-3 rounded-full border-2 border-muted-foreground/40" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Body */}
              <div id="demo-test-modal-body">
                <p className="text-xs font-medium text-foreground mb-1.5">Request Body (XML)</p>
                <pre className="bg-muted rounded-md p-3 text-xs font-mono text-foreground overflow-auto max-h-32 whitespace-pre-wrap">
{`<?xml version="1.0" encoding="UTF-8"?>
<payload>
  <orderId>ORD-2024-001</orderId>
  <customerName>Acme GmbH</customerName>
  <totalAmount>4250.00</totalAmount>
  <currency>EUR</currency>
</payload>`}
                </pre>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-muted/30">
              <div className="h-8 px-4 rounded-md border border-border text-xs font-medium inline-flex items-center text-muted-foreground">Cancel</div>
              <div className="h-8 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5" /> Send Test Request
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Caption + chapters ── */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {INT_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {ch.title}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, INT_STEPS.length)} / {INT_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, INT_STEPS.length) / INT_STEPS.length) * 100}%` }} />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? 'Your Integration Hub is ready to connect.' : step.caption}
        </p>
      </div>

      {/* ── Virtual cursor ── */}
      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {/* ── End card ── */}
      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <Plug className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Connect any system, in minutes</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Pre-built ERP connectors, custom webhooks, JSON · XML · Form support, and multi-company routing — all in one place.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={() => onClose()} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90">
                Start connecting
              </button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" /> Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
