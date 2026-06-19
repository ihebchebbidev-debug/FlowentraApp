import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Handshake, Search, Filter, List, LayoutGrid, Plus, GitBranch, DollarSign,
  Target, Trophy, TrendingUp, Building2, User, Calendar, Send, Activity,
  StickyNote, ShoppingCart, Briefcase, Wrench, CheckCircle2, Package, X as XIcon, Edit, Trash2,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor } from '@/modules/external/components/onboarding/narrationVoice';
import { DL_STEPS, DL_CHAPTERS, initialDealsDemoState, type DealsDemoState } from './dealsDemoScript';
import { pickLang, getCaption, getChapterTitle } from './dealsDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

type DemoDeal = { id: string; title: string; customer: string; value: number; prob: number; stage: string };
const DEMO_DEALS: DemoDeal[] = [
  { id: 'd1', title: 'Cold Room Upgrade',   customer: 'Médina Resorts',  value: 31500, prob: 70, stage: 'negotiation' },
  { id: 'd2', title: 'Annual Maintenance',  customer: 'Sahara Foods',    value: 9200,  prob: 40, stage: 'qualified' },
  { id: 'd3', title: 'Pump Station Build',  customer: 'Acme Industries', value: 47000, prob: 25, stage: 'lead' },
  { id: 'd4', title: 'Lighting Retrofit',   customer: 'Hydro Parts',     value: 12800, prob: 55, stage: 'proposal' },
  { id: 'd5', title: 'Solar Install',       customer: 'GreenPower Co',   value: 64000, prob: 20, stage: 'lead' },
  { id: 'd6', title: 'HVAC Contract',       customer: 'Tunis Mall',      value: 28000, prob: 100, stage: 'won' },
];

const STAGES = [
  { id: 'lead', label: 'Lead', color: '#64748b' },
  { id: 'qualified', label: 'Qualified', color: '#0ea5e9' },
  { id: 'proposal', label: 'Proposal', color: '#a855f7' },
  { id: 'negotiation', label: 'Negotiation', color: '#f59e0b' },
  { id: 'won', label: 'Won', color: '#16a34a' },
  { id: 'lost', label: 'Lost', color: '#ef4444' },
];
const STAGE_BADGE: Record<string, string> = {
  lead: 'bg-slate-100 text-slate-700', qualified: 'bg-sky-100 text-sky-700',
  proposal: 'bg-purple-100 text-purple-700', negotiation: 'bg-amber-100 text-amber-700',
  won: 'bg-green-100 text-green-700', lost: 'bg-red-100 text-red-700',
};

function StatCard({ id, icon, label, value, active }: { id: string; icon: React.ReactNode; label: string; value: string; active?: boolean }) {
  return (
    <div id={id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
      <div className="flex items-center gap-2.5">
        <span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{icon}</span>
        <div className="min-w-0"><p className="text-[11px] text-muted-foreground font-medium truncate">{label}</p><p className="text-sm font-bold">{value}</p></div>
      </div>
    </div>
  );
}

function PageList({ state }: { state: DealsDemoState }) {
  // For the demo, "move to negotiation" visually relocates d3 when highlighted.
  const deals = state.highlightStage === 'negotiation'
    ? DEMO_DEALS.map(d => d.id === 'd3' ? { ...d, stage: 'negotiation' } : d)
    : DEMO_DEALS;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Handshake className="h-6 w-6 text-primary" /></div>
          <div><h1 id="dl-demo-title" className="text-xl font-semibold">Deals</h1><p className="text-[11px] text-muted-foreground">Pipeline &amp; opportunities</p></div>
        </div>
        <div id="dl-demo-create-open" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> Add Deal</div>
      </div>

      <div className="p-4 border-b border-border grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard id="dl-demo-stat-total" icon={<Handshake className="h-4 w-4" />}   label="Total Deals" value="24"          active={state.selectedStat === 'all'} />
        <StatCard id="dl-demo-stat-open"  icon={<Target className="h-4 w-4" />}      label="Open Value"  value="164 500 TND" active={state.selectedStat === 'open'} />
        <StatCard id="dl-demo-stat-won"   icon={<Trophy className="h-4 w-4" />}      label="Won Value"   value="92 000 TND"  active={state.selectedStat === 'won'} />
        <StatCard id="dl-demo-stat-rate"  icon={<TrendingUp className="h-4 w-4" />}  label="Win Rate"    value="58%"         active={state.selectedStat === 'rate'} />
      </div>

      {/* Pipeline forecast & health — weighted value, at-risk, funnel by stage */}
      <div id="dl-demo-forecast" className="p-4 border-b border-border">
        <div className="rounded-xl border border-border/60 bg-card p-4">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mb-3">
            <div><p className="text-[11px] text-muted-foreground font-medium">Weighted pipeline</p><p className="text-lg font-bold">61 200 TND</p></div>
            <div className="h-8 w-px bg-border" />
            <div><p className="text-[11px] text-muted-foreground font-medium">Open value</p><p className="text-lg font-bold">164 500 TND</p></div>
            <div className="h-8 w-px bg-border" />
            <div><p className="text-[11px] text-muted-foreground font-medium">At risk</p><p className="text-lg font-bold text-amber-600">3</p></div>
            <div className="h-8 w-px bg-border" />
            <div><p className="text-[11px] text-muted-foreground font-medium">Avg. age</p><p className="text-lg font-bold">12d</p></div>
          </div>
          <div className="space-y-1.5">
            {[['Lead', 0.55, 3, '111 000'], ['Qualified', 0.18, 2, '9 200'], ['Proposal', 0.22, 1, '12 800'], ['Negotiation', 0.62, 1, '31 500']].map(([label, w, c, v]: any) => (
              <div key={label} className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground w-24 shrink-0 capitalize">{label}</span>
                <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${w * 100}%`, background: STAGES.find(s => s.label === label)?.color }} />
                </div>
                <span className="text-xs w-8 text-right shrink-0">{c}</span>
                <span className="text-xs w-24 text-right shrink-0 text-muted-foreground">{v} TND</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center flex-wrap">
          <div id="dl-demo-search" className={`relative flex-1 min-w-[180px] ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'médina' : 'Search deals…'}</div>
          </div>
          <div id="dl-demo-filters" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Stages</div>
          <div id="dl-demo-views" className="flex items-center gap-1 border border-border rounded-md overflow-hidden">
            {([['kanban', LayoutGrid], ['list', List]] as const).map(([m, Ic]) => (
              <div key={m} className={`h-9 px-2.5 flex items-center cursor-default ${state.view === m ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}><Ic className="h-4 w-4" /></div>
            ))}
          </div>
        </div>
        {state.showFilters && (
          <div className="flex gap-2 pt-2 border-t border-border flex-wrap">
            {STAGES.map(s => <div key={s.id} className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center gap-1.5 text-foreground"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</div>)}
          </div>
        )}
      </div>

      {state.view === 'kanban' ? (
        <div id="dl-demo-kanban" className="p-4 flex gap-3 overflow-x-auto">
          {STAGES.map(col => {
            const items = deals.filter(d => d.stage === col.id);
            const total = items.reduce((s, d) => s + d.value, 0);
            const spot = state.highlightStage === col.id;
            return (
              <div id={col.id === 'negotiation' ? 'dl-demo-col-negotiation' : undefined} key={col.id} className={`flex-shrink-0 w-60 ${spot ? 'ring-2 ring-primary rounded-lg p-1 -m-1' : ''}`}>
                <div className="flex items-center justify-between px-2 py-1.5 mb-2 rounded-md bg-muted/50">
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium"><span className="h-2.5 w-2.5 rounded-full" style={{ background: col.color }} />{col.label}<span className="ml-1 text-[10px] rounded bg-background px-1.5">{items.length}</span></span>
                  <span className="text-[10px] text-muted-foreground">{fmt(total)}</span>
                </div>
                <div className="space-y-2 min-h-[40px]">
                  {items.map(d => (
                    <div key={d.id} className="p-3 rounded-lg border border-border bg-card border-l-2" style={{ borderLeftColor: col.color }}>
                      <p className="font-medium text-xs line-clamp-2">{d.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{d.customer}</p>
                      <div className="flex items-center justify-between mt-1.5"><span className="text-xs font-semibold">{fmt(d.value)} TND</span><span className="text-[10px] text-muted-foreground">{d.prob}%</span></div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4">
          <div id="dl-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-border/60 bg-muted/30">
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Deal</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Customer</th>
                <th className="text-left px-3 py-2 text-muted-foreground font-medium">Stage</th>
                <th className="text-right px-3 py-2 text-muted-foreground font-medium">Value</th>
                <th className="text-center px-3 py-2 text-muted-foreground font-medium">Prob.</th>
              </tr></thead>
              <tbody>
                {DEMO_DEALS.map(d => (
                  <tr key={d.id} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2.5 font-medium">{d.title}</td>
                    <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><span className="h-5 w-5 rounded-full bg-primary/10 text-primary text-[9px] font-bold inline-flex items-center justify-center">{initials(d.customer)}</span>{d.customer}</span></td>
                    <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STAGE_BADGE[d.stage]}`}>{d.stage}</span></td>
                    <td className="px-3 py-2.5 text-right font-semibold">{fmt(d.value)} TND</td>
                    <td className="px-3 py-2.5 text-center">{d.prob}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const Box = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
  <div className={`h-9 px-3 rounded-md border border-border text-sm flex items-center ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{children}</div>
);
function Field({ id, label, children, active }: { id?: string; label: string; children: React.ReactNode; active?: boolean }) {
  return <div id={id} className={`rounded-md transition-all ${active ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}><label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>{children}</div>;
}

function DemoCard({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-lg">
      {title && <div className="px-4 pt-3 pb-1 text-sm font-semibold">{title}</div>}
      <div className="p-4">{children}</div>
    </div>
  );
}

function PageCreate({ state }: { state: DealsDemoState }) {
  const step = state.createStep;
  // Mirrors the real Add Deal page: a quote/sale-style workspace (main column +
  // sidebar) that stays lighter than an offer — no fiscal-document fields.
  return (
    <div className="flex flex-col">
      {/* Sticky-style header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/60 bg-card/50">
        <div className="h-7 w-7 rounded border border-border flex items-center justify-center text-muted-foreground text-xs">←</div>
        <div className="p-1.5 rounded-md bg-primary/10"><Handshake className="h-4 w-4 text-primary" /></div>
        <h1 className="text-sm font-medium">Add Deal</h1>
      </div>

      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 max-w-5xl mx-auto">
          {/* Main column */}
          <div className="lg:col-span-2 space-y-4">
            {/* Deal information */}
            <DemoCard title="Deal information">
              <div className="space-y-4">
                <Field id="dl-demo-create-title" label="Deal title *"><Box>Cold Room Upgrade</Box></Field>
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Category"><Box>Refrigeration</Box></Field>
                  <Field label="Source"><Box>Referral</Box></Field>
                </div>
                <Field label="Description"><Box muted>Replace and upgrade the main cold room — panels &amp; on-site install.</Box></Field>
              </div>
            </DemoCard>

            {/* Contact — person OR company, same selector as offers/sales */}
            <div id="dl-demo-create-customer">
              <DemoCard title="Contact">
                <div className={`rounded-md transition-all ${step === 1 ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}>
                  {step >= 1 ? (
                    <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted/30">
                      <div className="flex items-center gap-2.5">
                        <span className="h-8 w-8 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><Building2 className="h-4 w-4" /></span>
                        <div>
                          <p className="text-xs font-medium">Médina Resorts</p>
                          <p className="text-[10px] text-muted-foreground">Company · contact@medina.tn · +216 71 234 567</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-muted-foreground border border-border rounded px-1.5 py-0.5">Change</span>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">Search a person or company…</div>
                    </div>
                  )}
                </div>
              </DemoCard>
            </div>

            {/* Installations — link items to equipment (same as offers/sales) */}
            <DemoCard title="Installations">
              <div className="space-y-2">
                <div className="h-9 px-3 rounded-md border border-dashed border-border text-sm text-muted-foreground flex items-center gap-1.5"><Plus className="h-3.5 w-3.5" /> Link an installation…</div>
                {step >= 2 && (
                  <div className="flex items-center justify-between p-2.5 border border-border rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><div><p className="text-xs font-medium">Cold Room A1</p><p className="text-[10px] text-muted-foreground">Carrier · SN CR-2024-A1</p></div></div>
                    <XIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  </div>
                )}
              </div>
            </DemoCard>

            {/* Items — the same catalog selector as offers & sales */}
            <div id="dl-demo-create-items">
              <DemoCard>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium">Select items to sell</span>
                  <span className="h-7 px-2.5 rounded-md border border-border text-[11px] text-muted-foreground inline-flex items-center gap-1"><Plus className="h-3 w-3" /> Add items</span>
                </div>
                {step >= 3 ? (
                  <div className="space-y-2">
                    {[['Cold room panels', 'article', '1', '24,500', 'Cold Room A1'], ['Installation service', 'service', '1', '7,000', 'Cold Room A1']].map(r => (
                      <div key={r[0]} className="border border-border rounded-lg p-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            {r[1] === 'service' ? <Wrench className="h-3.5 w-3.5 text-primary" /> : <ShoppingCart className="h-3.5 w-3.5 text-primary" />}
                            <span className="text-xs font-medium">{r[0]}</span>
                            <span className="text-[9px] rounded bg-muted px-1.5 py-0.5 text-muted-foreground capitalize">{r[1]}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground mt-1">Qty {r[2]} · Unit {r[3]} TND · <span className="inline-flex items-center gap-0.5"><Package className="h-2.5 w-2.5" />{r[4]}</span></p>
                        </div>
                        <span className="text-xs font-semibold">{r[3]} TND</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center pt-2 border-t border-border/60"><span className="text-xs font-semibold">Subtotal</span><span className="text-sm font-bold">31 500 TND</span></div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground"><Package className="h-9 w-9 mx-auto mb-2 opacity-40" /><p className="text-xs">No items added yet</p><p className="text-[10px]">Click Add items to pick from your catalog</p></div>
                )}
              </DemoCard>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Pipeline settings */}
            <div id="dl-demo-create-stage">
              <DemoCard title="Deal settings">
                <div className={`space-y-3 rounded-md transition-all ${step === 2 ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}>
                  <Field label="Stage"><Box muted={step < 2}>{step >= 2 ? 'Qualified' : '—'}</Box></Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Probability"><Box muted={step < 2}>{step >= 2 ? '70%' : '—'}</Box></Field>
                    <Field label="Currency"><Box muted={step < 2}>TND</Box></Field>
                  </div>
                  <Field label="Expected close"><Box muted={step < 2}>{step >= 2 ? '15 Jul 2025' : '—'}</Box></Field>
                </div>
              </DemoCard>
            </div>

            {/* Value */}
            <DemoCard title="Value">
              {step >= 3 ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Items subtotal</span><span className="font-medium">31 500 TND</span></div>
                  <div className="flex justify-between border-t border-border/60 pt-1.5 text-sm font-semibold"><span>Value</span><span>31 500 TND</span></div>
                </div>
              ) : (
                <Field label="Estimated value"><Box muted={step < 2}>{step >= 2 ? '31 500 TND' : '0 TND'}</Box></Field>
              )}
            </DemoCard>

            {/* Notes */}
            <DemoCard title="Notes">
              <Box muted>Wants delivery before end of July.</Box>
            </DemoCard>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-5 mt-5 border-t border-border max-w-5xl mx-auto">
          <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground">Cancel</div>
          <div id="dl-demo-create-save" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Save deal</div>
        </div>
      </div>
    </div>
  );
}

function PageDetail({ state }: { state: DealsDemoState }) {
  const D = DEMO_DEALS[0];
  const tabs = [
    { k: 'overview', l: 'Overview', id: undefined as string | undefined },
    { k: 'items', l: 'Items', id: 'dl-demo-tab-items' },
    { k: 'documents', l: 'Documents', id: undefined as string | undefined },
    { k: 'checklists', l: 'Checklists', id: undefined as string | undefined },
    { k: 'activity', l: 'Activity', id: 'dl-demo-tab-activity' },
    { k: 'notes', l: 'Notes', id: 'dl-demo-tab-notes' },
  ];
  return (
    <div className="flex flex-col w-full relative">
      {/* Full-width sticky header card — mirrors the real deal detail */}
      <div className="border-b border-border bg-gradient-subtle px-4 py-3 lg:px-6 lg:py-4 sticky top-0 z-[5]">
        <div className="flex items-center gap-3">
          <div id="dl-demo-detail-header" className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground text-sm shrink-0">←</div>
          <div className="flex-1 bg-card border border-border/50 rounded-lg shadow-sm p-4">
            <div className="flex items-center justify-between gap-6 flex-wrap">
              <div className="flex items-center gap-3 min-w-0 flex-wrap">
                <h1 className="text-xl font-bold">{D.title}</h1>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STAGE_BADGE[D.stage]}`}>{D.stage}</span>
                <span className="text-sm text-muted-foreground">DEAL-00012 · {D.customer}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground"><Edit className="h-3.5 w-3.5" /> Edit</div>
                <div id="dl-demo-convert" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Convert</div>
                <div className="h-8 w-8 rounded-md border border-border flex items-center justify-center text-muted-foreground"><Trash2 className="h-3.5 w-3.5" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 lg:px-6 space-y-6">
        <div id="dl-demo-metrics" className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[[DollarSign, 'Value', `${fmt(D.value)} TND`], [Target, 'Probability', `${D.prob}%`], [Calendar, 'Expected close', '15 Jul 2025'], [Send, 'Source', 'Referral']].map(([Ic, l, v]: any, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-2.5 flex items-center gap-2"><Ic className="h-4 w-4 text-muted-foreground" /><div className="min-w-0"><p className="text-[10px] text-muted-foreground truncate">{l}</p><p className="text-xs font-semibold truncate">{v}</p></div></div>
          ))}
        </div>

        {/* Full-width pill tab bar (6 tabs) */}
        <div className="w-full p-1 bg-muted/50 rounded-lg grid grid-cols-3 sm:grid-cols-6 gap-1">
          {tabs.map(tab => (
            <div key={tab.k} id={tab.id} className={`inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-md cursor-default whitespace-nowrap ${state.activeTab === tab.k ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground'}`}>{tab.l}</div>
          ))}
        </div>

      <div className="">
        {state.activeTab === 'overview' && (
          <div className="space-y-4">
            {/* Next action / follow-up callout */}
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 flex items-center gap-2">
              <Send className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Call to confirm budget</span>
              <span className="inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700">15 Jun 2025</span>
              <span className="text-[10px] text-amber-700 ml-auto">Follow-up overdue</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
                <p className="text-sm font-medium mb-1">Customer</p>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Building2 className="h-3 w-3" /> Médina Resorts</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><Calendar className="h-3 w-3" /> Created 02 Jun 2025</div>
                <div className="flex items-center gap-1.5 text-muted-foreground"><User className="h-3 w-3" /> Owner Ahmed B.</div>
              </div>
              <div className="bg-card border border-border rounded-lg p-4 text-xs">
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-muted-foreground">Replace and upgrade the main cold room, including panels and on-site installation.</p>
              </div>
            </div>
          </div>
        )}
        {state.activeTab === 'items' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground">Item</th><th className="text-right px-4 py-2 text-muted-foreground">Qty</th><th className="text-right px-4 py-2 text-muted-foreground">Price</th><th className="text-right px-4 py-2 text-muted-foreground">Total</th></tr></thead>
              <tbody>
                {[['Cold room panels', '1', '24,500 TND', '24,500 TND'], ['Installation service', '1', '7,000 TND', '7,000 TND']].map(r => (
                  <tr key={r[0]} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5 font-medium">
                      {r[0]}
                      <span className="ml-2 inline-flex items-center gap-0.5 text-[10px] text-muted-foreground font-normal"><Package className="h-2.5 w-2.5" /> Cold Room A1</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">{r[1]}</td><td className="px-4 py-2.5 text-right">{r[2]}</td><td className="px-4 py-2.5 text-right font-medium">{r[3]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {state.activeTab === 'activity' && (
          <div className="space-y-2">
            {[['Deal created', 'Ahmed B.', '2025-06-02'], ['Stage changed to Qualified', 'Ahmed B.', '2025-06-05'], ['Stage changed to Negotiation', 'Sara M.', '2025-06-11']].map((a, i, arr) => (
              <div key={a[0]} className="flex gap-3"><div className="flex flex-col items-center shrink-0"><span className="h-6 w-6 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center"><Activity className="h-3 w-3" /></span>{i < arr.length - 1 && <div className="w-px flex-1 bg-border mt-1" />}</div><div className="pb-1"><p className="text-xs font-medium">{a[0]}</p><p className="text-[10px] text-muted-foreground">{a[2]} · {a[1]}</p></div></div>
            ))}
          </div>
        )}
        {state.activeTab === 'notes' && (
          <div className="space-y-2">
            {[['Customer wants delivery before end of July.', 'Ahmed B.', '2025-06-11'], ['Budget approved by their finance team.', 'Sara M.', '2025-06-09']].map(n => (
              <div key={n[0]} className="flex gap-3 p-3 bg-card border border-border rounded-lg"><span className="h-7 w-7 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center shrink-0"><StickyNote className="h-3.5 w-3.5" /></span><div><p className="text-xs">{n[0]}</p><p className="text-[10px] text-muted-foreground mt-0.5">{n[2]} · {n[1]}</p></div></div>
            ))}
          </div>
        )}
        {(state.activeTab as string) === 'documents' && (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-40" /> Attach files & propagate documents from linked sales/offers.
          </div>
        )}
        {(state.activeTab as string) === 'checklists' && (
          <div className="bg-card border border-border rounded-lg p-6 text-center text-xs text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 opacity-40" /> Run dynamic-form checklists on the deal.
          </div>
        )}
      </div>
      </div>

      {state.convertOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/40">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><GitBranch className="h-4 w-4 text-primary" /> Convert deal</p>
            <p className="text-xs text-muted-foreground mb-3">Turn this won deal into the next step of your workflow.</p>
            <div className="space-y-2">
              <div id="dl-demo-convert-sale" className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${state.convertSale ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <span className={`h-4 w-4 rounded border inline-flex items-center justify-center mt-0.5 ${state.convertSale ? 'bg-primary border-primary' : 'border-border'}`}>{state.convertSale && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span>
                <ShoppingCart className="h-4 w-4 text-primary mt-0.5" /><div><p className="text-xs font-medium">Convert to Sale</p><p className="text-[10px] text-muted-foreground">Create a sales order with the same customer and line items.</p></div>
              </div>
              <div id="dl-demo-convert-project" className={`flex items-start gap-2.5 p-2.5 rounded-lg border ${state.convertProject ? 'border-primary bg-primary/5' : 'border-border'}`}>
                <span className={`h-4 w-4 rounded border inline-flex items-center justify-center mt-0.5 ${state.convertProject ? 'bg-primary border-primary' : 'border-border'}`}>{state.convertProject && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}</span>
                <Briefcase className="h-4 w-4 text-primary mt-0.5" /><div><p className="text-xs font-medium">Convert to Project</p><p className="text-[10px] text-muted-foreground">Spin up a project to deliver the work, linked to this deal.</p></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-3"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div id="dl-demo-convert-confirm" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><GitBranch className="h-3.5 w-3.5" /> Convert</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

export function DealsAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= DL_STEPS.length;
  const state: DealsDemoState = useMemo(() => {
    let s = initialDealsDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, DL_STEPS.length); i++) s = DL_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = DL_STEPS[Math.min(stepIndex, DL_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, DL_STEPS.length - 1), step.caption);
  const finishedMsg = demoLang === 'fr'
    ? 'Votre pipeline d’affaires est prêt — créez votre première affaire.'
    : 'Your deals pipeline is ready — create your first deal.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis; synth.getVoices();
    const onVoices = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.view, state.showFilters, state.createStep, state.convertOpen, state.highlightStage]);
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis; synth.cancel();
      const { bcp47 } = languageTagFor(i18n.language);
      const { code } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code); const chunks = splitForSpeech(caption);
      let advanced = false; const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };
      chunks.forEach((chunk, idx) => { const u = new SpeechSynthesisUtterance(chunk); u.lang = bcp47; if (voice) u.voice = voice; u.rate = 0.86; u.pitch = idx % 2 === 0 ? 1.02 : 0.98; u.volume = 1; if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; } try { synth.speak(u); } catch { /* */ } });
      const safetyMs = Math.max(step.duration, caption.length * 110 + 1800);
      const safety = setTimeout(doAdvance, safetyMs);
      const keepAlive = setInterval(() => { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } }, 10000);
      return () => { clearTimeout(safety); clearInterval(keepAlive); if (timerRef.current) clearTimeout(timerRef.current); try { synth.cancel(); } catch { /* */ } };
    }
    timerRef.current = setTimeout(advance, step.duration);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [stepIndex, open, playing, finished, muted, step, captionText, i18n.language]);

  const restart = useCallback(() => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); setStepIndex(0); setPlaying(true); }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;
  const activeChapter = DL_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || DL_CHAPTERS[DL_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><Handshake className="h-3.5 w-3.5 text-primary-foreground" /></span>
          <span className="text-sm font-semibold truncate">Deals — Live Demo</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'list'   && <PageList   state={state} />}
        {state.page === 'create' && <PageCreate state={state} />}
        {state.page === 'detail' && <PageDetail state={state} />}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {DL_CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, DL_STEPS.length)} / {DL_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, DL_STEPS.length) / DL_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><Handshake className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">From lead to closed win</h3>
            <p className="text-sm text-muted-foreground mb-5">Visual pipeline · Live forecast · One-click conversion to sales &amp; projects.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Create your first deal</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DealsAutopilotDemo;
