import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  ListChecks, ChevronRight, Plus, Edit2, Trash2, Star, Flag, Package, MapPin,
  Clock, Tag, Megaphone, Wrench, DollarSign, FolderKanban, Folder, FileText,
  CheckCircle2,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  LK_STEPS, LK_CHAPTERS, initialLookupsDemoState,
  type LookupsDemoState,
} from './lookupsDemoScript';
import { pickLang, getCaption, getChapterTitle } from './lookupsDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

// ─── Catalog (sidebar) ────────────────────────────────────────────────────────
const CATEGORIES: { id: string; label: string; icon: any; count: number }[] = [
  { id: 'task-statuses',          label: 'Task Statuses',          icon: ListChecks,   count: 5 },
  { id: 'priorities',             label: 'Priorities',             icon: Flag,         count: 4 },
  { id: 'service-categories',     label: 'Service Categories',     icon: Folder,       count: 8 },
  { id: 'article-categories',     label: 'Article Categories',     icon: Package,      count: 12 },
  { id: 'locations',              label: 'Locations',              icon: MapPin,       count: 6 },
  { id: 'leave-types',            label: 'Leave Types',            icon: Clock,        count: 5 },
  { id: 'offer-categories',       label: 'Offer Categories',       icon: Tag,          count: 5 },
  { id: 'offer-sources',          label: 'Offer Sources',          icon: Megaphone,    count: 7 },
  { id: 'work-types',             label: 'Work Types',             icon: Clock,        count: 6 },
  { id: 'expense-types',          label: 'Expense Types',          icon: DollarSign,   count: 5 },
  { id: 'project-types',          label: 'Project Types',          icon: FolderKanban, count: 4 },
  { id: 'document-types',         label: 'Document Types',         icon: FileText,     count: 6 },
  { id: 'skills',                 label: 'Skills',                 icon: Wrench,       count: 14 },
];

// ─── Items per selected category ──────────────────────────────────────────────
type Row = { name: string; def?: boolean; active: boolean; typed?: string; typedKind?: 'completed' | 'paid' | 'category' };
const ITEMS: Record<string, { typeCol?: string; rows: Row[] }> = {
  'task-statuses': {
    typeCol: 'Completed',
    rows: [
      { name: 'Open', def: true, active: true, typed: 'In progress', typedKind: 'completed' },
      { name: 'In Progress', active: true, typed: 'In progress', typedKind: 'completed' },
      { name: 'Blocked', active: true, typed: 'In progress', typedKind: 'completed' },
      { name: 'Done', active: true, typed: 'Completed', typedKind: 'completed' },
      { name: 'Cancelled', active: false, typed: 'Completed', typedKind: 'completed' },
    ],
  },
  'leave-types': {
    typeCol: 'Paid',
    rows: [
      { name: 'Annual Leave', def: true, active: true, typed: 'Paid', typedKind: 'paid' },
      { name: 'Sick Leave', active: true, typed: 'Paid', typedKind: 'paid' },
      { name: 'Unpaid Leave', active: true, typed: 'Unpaid', typedKind: 'paid' },
      { name: 'Maternity', active: true, typed: 'Paid', typedKind: 'paid' },
      { name: 'Training', active: true, typed: 'Paid', typedKind: 'paid' },
    ],
  },
  'skills': {
    typeCol: 'Category',
    rows: [
      { name: 'HVAC', active: true, typed: 'Technical', typedKind: 'category' },
      { name: 'Plumbing', active: true, typed: 'Technical', typedKind: 'category' },
      { name: 'Welding', active: true, typed: 'Technical', typedKind: 'category' },
      { name: 'Electrical', active: true, typed: 'Technical', typedKind: 'category' },
      { name: 'Customer Service', active: true, typed: 'Soft', typedKind: 'category' },
    ],
  },
  'locations': {
    rows: [
      { name: 'Sfax Main Warehouse', def: true, active: true },
      { name: 'Tunis Depot', active: true },
      { name: 'Sousse Branch', active: true },
      { name: 'Van Stock — Karim', active: true },
      { name: 'Van Stock — Leïla', active: true },
      { name: 'Cold Storage', active: false },
    ],
  },
  'offer-sources': {
    rows: [
      { name: 'Referral', def: true, active: true },
      { name: 'Website', active: true },
      { name: 'Social Media', active: true },
      { name: 'Email Campaign', active: true },
      { name: 'Trade Show', active: true },
      { name: 'Cold Call', active: true },
      { name: 'Direct', active: false },
    ],
  },
};
const FALLBACK: { typeCol?: string; rows: Row[] } = { rows: [{ name: 'Value A', def: true, active: true }, { name: 'Value B', active: true }, { name: 'Value C', active: false }] };

function TypeBadge({ kind, value }: { kind?: string; value?: string }) {
  if (!value) return <span className="text-muted-foreground">-</span>;
  if (kind === 'completed') return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${value === 'Completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>{value}</span>;
  if (kind === 'paid') return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${value === 'Paid' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{value}</span>;
  return <span className="text-xs text-muted-foreground">{value}</span>;
}

function PageLookups({ state }: { state: LookupsDemoState }) {
  const cat = CATEGORIES.find(c => c.id === state.selected) || CATEGORIES[0];
  const data = ITEMS[state.selected] || FALLBACK;
  const rows = [...data.rows];
  if (state.newRow && state.selected === 'task-statuses') rows.push({ name: 'Awaiting Review', active: true, typed: 'In progress', typedKind: 'completed' });
  const Icon = cat.icon;
  // For "set default" highlight, pretend row index 1 becomes the default.
  const defIdx = state.highlightDefault ? 1 : rows.findIndex(r => r.def);

  return (
    <div className="p-4 md:p-6 relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10"><ListChecks className="h-6 w-6 text-primary" /></div>
        <div><h1 id="lk-demo-title" className="text-xl font-semibold">Lookups</h1><p className="text-px-11 text-muted-foreground">One place for every dropdown value</p></div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Sidebar */}
        <div className="col-span-5 lg:col-span-4">
          <div id="lk-demo-sidebar" className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-3 py-2 border-b border-border text-xs font-semibold text-muted-foreground">All lookups</div>
            <div className="divide-y divide-border max-h-[420px] overflow-hidden">
              {CATEGORIES.map((c, i) => {
                const CIcon = c.icon;
                const sel = state.selected === c.id;
                const idMap: Record<string, string> = { 'leave-types': 'lk-demo-leave', 'skills': 'lk-demo-skills', 'locations': 'lk-demo-locations', 'offer-sources': 'lk-demo-sources' };
                return (
                  <div key={c.id} id={idMap[c.id]} className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left ${sel ? 'bg-primary/10 border-l-2 border-l-primary' : ''}`}>
                    <CIcon className={`h-4 w-4 shrink-0 ${sel ? 'text-primary' : 'text-muted-foreground'}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium truncate ${sel ? 'text-primary' : ''}`}>{c.label}</p>
                      <p id={i === 0 ? 'lk-demo-counts' : undefined} className="text-px-10 text-muted-foreground">{c.count} items</p>
                    </div>
                    <ChevronRight className={`h-3.5 w-3.5 text-muted-foreground ${sel ? 'text-primary rotate-90' : ''}`} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main panel */}
        <div className="col-span-7 lg:col-span-8">
          <div className="border border-border rounded-lg bg-card">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-primary" /><span className="text-sm font-semibold">{cat.label}</span><span className="ml-1 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-px-10 font-medium">{rows.length} items</span></div>
              <div id="lk-demo-add-btn" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> Add Item</div>
            </div>
            <div id="lk-demo-table" className="overflow-hidden">
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30 border-b border-border/60">
                  <th className="w-10 px-3 py-2 text-muted-foreground font-medium text-left">Default</th>
                  <th className="px-3 py-2 text-muted-foreground font-medium text-left">Name</th>
                  {data.typeCol && <th className="px-3 py-2 text-muted-foreground font-medium text-left">{data.typeCol}</th>}
                  <th className="px-3 py-2 text-muted-foreground font-medium text-left">Status</th>
                  <th className="px-3 py-2 text-muted-foreground font-medium text-right">Actions</th>
                </tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={r.name} className={`border-b border-border/40 last:border-0 ${state.newRow && i === rows.length - 1 ? 'bg-primary/5 animate-in fade-in' : ''}`}>
                      <td className="px-3 py-2.5">
                        <span id={i === 0 ? 'lk-demo-default' : i === 1 ? 'lk-demo-set-default' : undefined}
                          className={`h-7 w-7 inline-flex items-center justify-center rounded ${state.highlightDefault && i === 1 ? 'bg-amber-100 dark:bg-amber-900/30 ring-1 ring-amber-400' : ''}`}>
                          <Star className={`h-4 w-4 ${i === defIdx ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                        </span>
                      </td>
                      <td id={i === 0 ? 'lk-demo-name' : undefined} className="px-3 py-2.5 font-medium">{r.name}</td>
                      {data.typeCol && <td className="px-3 py-2.5"><span id={i === 0 && data.typeCol === 'Paid' ? 'lk-demo-paid' : undefined}><TypeBadge kind={r.typedKind} value={r.typed} /></span></td>}
                      <td className="px-3 py-2.5">
                        <span id={i === 0 ? 'lk-demo-status' : undefined} className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${r.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>{r.active ? 'Active' : 'Inactive'}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <div className="inline-flex items-center gap-1">
                          <span id={i === 0 ? 'lk-demo-edit' : undefined} className="h-6 w-6 rounded border border-border inline-flex items-center justify-center text-muted-foreground"><Edit2 className="h-3 w-3" /></span>
                          <span id={i === 0 ? 'lk-demo-delete' : undefined} className="h-6 w-6 rounded border border-destructive/30 inline-flex items-center justify-center text-destructive"><Trash2 className="h-3 w-3" /></span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create dialog */}
      {state.showAdd && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-12 bg-background/50">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> New Task Status</p>
            <div className="space-y-3 text-xs">
              <div id="lk-demo-create-name">
                <label className="block text-px-11 text-muted-foreground mb-1">Name</label>
                <div className={`h-9 px-3 rounded-md border text-sm flex items-center ${state.addStep >= 1 ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>{state.addStep >= 1 ? 'Awaiting Review' : 'Enter name…'}</div>
                <div className="mt-2"><label className="block text-px-11 text-muted-foreground mb-1">Sort order</label><div className="h-9 w-24 px-3 rounded-md border border-border text-sm flex items-center">{state.addStep >= 1 ? '35' : '0'}</div></div>
              </div>
              <div id="lk-demo-create-type" className={`space-y-2 transition-opacity ${state.addStep >= 2 ? '' : 'opacity-40'}`}>
                <div className="flex items-center justify-between"><span>Completed state</span><span className={`h-4 w-7 rounded-full relative ${state.addStep >= 2 ? 'bg-muted-foreground/30' : 'bg-muted-foreground/30'}`}><span className="absolute top-0.5 left-0.5 h-3 w-3 rounded-full bg-white" /></span></div>
                <div className="flex items-center justify-between"><span>Active</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
                <div className="flex items-center justify-between"><span>Colour</span><div className="flex gap-1">{['bg-primary', 'bg-amber-500', 'bg-rose-500', 'bg-emerald-500'].map((c, i) => <span key={c} className={`h-5 w-5 rounded ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-foreground' : ''}`} />)}</div></div>
              </div>
              <div id="lk-demo-create-save" className="h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5 cursor-default"><CheckCircle2 className="h-3.5 w-3.5" /> Create</div>
            </div>
          </div>
        </div>
      )}

      {/* Edit dialog */}
      {state.showEdit && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-12 bg-background/50">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Edit2 className="h-4 w-4 text-primary" /> Edit “Open”</p>
            <div className="space-y-3 text-xs">
              <div><label className="block text-px-11 text-muted-foreground mb-1">Name</label><div className="h-9 px-3 rounded-md border border-border text-sm flex items-center">Open</div></div>
              <div className="flex items-center justify-between"><span>Active</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
              <div className="flex items-center justify-between"><span>Colour</span><div className="flex gap-1">{['bg-blue-500', 'bg-primary', 'bg-amber-500', 'bg-rose-500'].map((c, i) => <span key={c} className={`h-5 w-5 rounded ${c} ${i === 0 ? 'ring-2 ring-offset-1 ring-foreground' : ''}`} />)}</div></div>
              <div className="h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center cursor-default">Update</div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {state.showDelete && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-16 bg-background/50">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Delete this value?</p>
            <p className="text-xs text-muted-foreground mb-4">Remove “Cancelled” from this list. Values currently in use are protected and can’t be deleted.</p>
            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div><div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Trash2 className="h-3.5 w-3.5" /> Delete</div></div>
          </div>
        </div>
      )}

      {/* Powers-the-app overlay */}
      {state.powersView && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50 p-6">
          <div id="lk-demo-powers" className="w-[560px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> One list, used everywhere</p>
            <p className="text-xs text-muted-foreground mb-3">“Offer Sources” defined once feeds every surface in the app:</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[['Offer form', Tag], ['Sale form', DollarSign], ['Reports', FolderKanban]].map(([l, Ic]: any) => (
                <div key={l} className="rounded-lg border border-border p-2.5">
                  <div className="flex items-center gap-1.5 text-px-11 font-medium mb-1.5"><Ic className="h-3.5 w-3.5 text-primary" /> {l}</div>
                  <div className="h-7 rounded border border-border bg-background text-px-10 text-muted-foreground flex items-center justify-between px-2">Referral <ChevronRight className="h-3 w-3 rotate-90" /></div>
                </div>
              ))}
            </div>
            <div id="lk-demo-consistency" className="rounded-lg border border-primary/30 bg-primary/5 p-2.5 text-px-11 text-foreground inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /> Rename it once here → every form, badge, filter and report updates together. One source of truth.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LookupsAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= LK_STEPS.length;
  const state: LookupsDemoState = useMemo(() => { let s = initialLookupsDemoState; for (let i = 0; i < Math.min(stepIndex + 1, LK_STEPS.length); i++) s = LK_STEPS[i].apply(s); return s; }, [stepIndex]);

  const step = LK_STEPS[Math.min(stepIndex, LK_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, LK_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Vos listes de référence sont prêtes — l’app parle votre langage.' :
    'Your lookups are ready — the app now speaks your language.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => { if (typeof window === 'undefined' || !window.speechSynthesis) return; const synth = window.speechSynthesis; synth.getVoices(); const onV = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onV); return () => synth.removeEventListener?.('voiceschanged', onV); }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.selected, state.showAdd, state.addStep, state.showEdit, state.showDelete, state.highlightDefault, state.newRow, state.powersView]);
  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText; const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis; synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language); const voice = pickBestVoice(code); const chunks = splitForSpeech(caption);
      let advanced = false; const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };
      chunks.forEach((chunk, idx) => { const u = new SpeechSynthesisUtterance(chunk); u.lang = bcp47; configureUtteranceForFemaleVoice(u, voice); if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; } try { synth.speak(u); } catch { /* */ } });
      const safety = setTimeout(doAdvance, Math.max(step.duration, caption.length * 110 + 1800));
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
  const activeChapter = LK_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || LK_CHAPTERS[LK_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><ListChecks className="h-3.5 w-3.5 text-primary-foreground" /></span><span className="text-sm font-semibold truncate">Lookups — Live Demo</span></div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pointer-events-none">
        <PageLookups state={state} />
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {LK_CHAPTERS.map(ch => (<button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, LK_STEPS.length)} / {LK_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, LK_STEPS.length) / LK_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><ListChecks className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">Your terms, everywhere</h3>
            <p className="text-sm text-muted-foreground mb-5">Define every status, category, priority, source, skill &amp; location once — instantly consistent across the whole app.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Configure your lookups</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
