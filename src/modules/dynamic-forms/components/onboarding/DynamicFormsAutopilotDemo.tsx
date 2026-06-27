import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  FileText, Plus, Search, Edit2, Eye, Share2, Copy, Trash2, GripVertical,
  Type, AlignLeft, Hash, Mail, Phone, CheckSquare, Circle, ChevronDown, Calendar,
  PenTool, Star, LayoutList, FileStack, ChevronRight, GitBranch, Database, Link2,
  CheckCircle2, Send, Download, Sparkles, User, ClipboardList, Ticket,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  DF_STEPS, DF_CHAPTERS, initialDFDemoState,
  type DFDemoState,
} from './dynamicFormsDemoScript';
import { pickLang, getCaption, getChapterTitle } from './dynamicFormsDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

const DEMO_FORMS = [
  { id: 'f1', name: 'Customer Satisfaction Survey', status: 'released', responses: 248 },
  { id: 'f2', name: 'Service Sign-off & Signature', status: 'released', responses: 96 },
  { id: 'f3', name: 'Site Inspection Checklist', status: 'draft', responses: 0 },
  { id: 'f4', name: 'Event Registration', status: 'released', responses: 312 },
  { id: 'f5', name: 'Old Intake Form 2024', status: 'archived', responses: 540 },
];
const STATUS_CLS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  released: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  archived: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

const PALETTE = {
  Basic: [['Text', Type], ['Long text', AlignLeft], ['Number', Hash], ['Email', Mail], ['Phone', Phone]],
  Choice: [['Checkbox', CheckSquare], ['Radio', Circle], ['Dropdown', ChevronDown]],
  Advanced: [['Date', Calendar], ['Signature', PenTool], ['Rating', Star], ['Content', FileText]],
  Layout: [['Section', LayoutList], ['Page Break', FileStack]],
};

// Canvas fields revealed progressively by fieldCount
type CField = { label: string; kind: string; w?: string; badge?: 'cond' | 'dyn' | 'cascade' };
const CANVAS_FIELDS: CField[] = [
  { label: 'Full Name', kind: 'text', w: 'half' },
  { label: 'Email', kind: 'email', w: 'half' },
  { label: 'Phone', kind: 'phone', w: 'full' },
  { label: 'Service', kind: 'select', w: 'half', badge: 'dyn' },
  { label: 'Site / Location', kind: 'select', w: 'half', badge: 'cascade' },
  { label: 'How would you rate us?', kind: 'rating', w: 'full' },
  { label: 'What went wrong?', kind: 'textarea', w: 'full', badge: 'cond' },
  { label: 'Signature', kind: 'signature', w: 'full' },
];

function FieldIcon({ kind }: { kind: string }) {
  const map: Record<string, any> = { text: Type, email: Mail, phone: Phone, select: ChevronDown, rating: Star, textarea: AlignLeft, signature: PenTool };
  const I = map[kind] || Type;
  return <I className="h-3.5 w-3.5 text-muted-foreground" />;
}

// ─── List page ────────────────────────────────────────────────────────────────
function PageList({ state }: { state: DFDemoState }) {
  const rows = DEMO_FORMS.filter(f => state.statusFilter === 'all' || f.status === state.statusFilter);
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-primary/10"><FileText className="h-6 w-6 text-primary" /></div><div><h1 id="df-demo-title" className="text-xl font-semibold">Dynamic Forms</h1><p className="text-[11px] text-muted-foreground">No-code form builder</p></div></div>
        <div id="df-demo-create" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> New Form</div>
      </div>
      <div className="p-3 border-b border-border bg-card flex gap-2 items-center">
        <div className="relative flex-1 max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">Search forms…</div></div>
        <div id="df-demo-status" className="flex items-center gap-1 border border-border rounded-md overflow-hidden text-xs">
          {(['all', 'draft', 'released', 'archived'] as const).map(s => (
            <div key={s} className={`h-9 px-2.5 flex items-center capitalize cursor-default ${state.statusFilter === s ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{s}</div>
          ))}
        </div>
      </div>
      <div className="p-4">
        <div id="df-demo-forms-table" className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Form</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Responses</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map(f => (
                <tr key={f.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium inline-flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-primary" />{f.name}</td>
                  <td className="px-4 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLS[f.status]}`}>{f.status}</span></td>
                  <td className="px-4 py-2.5 text-right font-semibold">{f.responses.toLocaleString()}</td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      {[Edit2, Eye, Share2, Copy, Trash2].map((I, i) => <span key={i} className={`h-6 w-6 rounded border inline-flex items-center justify-center ${i === 4 ? 'border-destructive/30 text-destructive' : 'border-border text-muted-foreground'}`}><I className="h-3 w-3" /></span>)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Builder page ─────────────────────────────────────────────────────────────
function PageBuilder({ state }: { state: DFDemoState }) {
  const fields = CANVAS_FIELDS.slice(0, state.fieldCount).filter(f => {
    if (f.badge === 'cond' && !state.conditionOn) return false;
    if (f.badge === 'cascade' && !state.cascadeOn) return false;
    return true;
  });
  return (
    <div id="df-demo-builder" className="flex h-full min-h-0">
      {/* Palette */}
      <div id="df-demo-palette" className="w-52 shrink-0 border-r border-border bg-card overflow-hidden p-3">
        <p className="text-xs font-semibold mb-1">Fields</p>
        <p className="text-[10px] text-muted-foreground mb-3">Drag onto the canvas</p>
        {Object.entries(PALETTE).map(([group, items], gi) => (
          <div key={group} className="mb-3">
            <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">{group}</p>
            <div className="space-y-1">
              {items.map(([label, Ic]: any, i) => (
                <div key={label} id={gi === 0 && i === 0 ? 'df-demo-field-basic' : gi === 1 && i === 0 ? 'df-demo-field-choice' : gi === 2 && i === 1 ? 'df-demo-field-advanced' : gi === 3 && i === 0 ? 'df-demo-field-layout' : undefined}
                  className="flex items-center gap-2 p-1.5 rounded-md border border-transparent hover:border-border bg-background text-[11px]">
                  <span className="h-6 w-6 rounded bg-primary/10 inline-flex items-center justify-center"><Ic className="h-3 w-3 text-primary" /></span>
                  <span className="flex-1 truncate">{label}</span>
                  <GripVertical className="h-3 w-3 text-muted-foreground/50" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Canvas */}
      <div className="flex-1 min-w-0 overflow-hidden p-4 bg-muted/20">
        <div id="df-demo-canvas" className="max-w-xl mx-auto bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div><p className="text-sm font-semibold">Customer Satisfaction Survey</p><p className="text-[10px] text-muted-foreground">{fields.length} fields{state.multiPage ? ' · 2 pages' : ''}</p></div>
            {state.multiPage && <div id="df-demo-multipage" className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-2 py-1"><FileStack className="h-3 w-3 text-primary" />{[0, 1].map(p => <span key={p} className={`h-1.5 w-7 rounded-full ${p === 0 ? 'bg-primary' : 'bg-muted'}`} />)}<span className="text-[9px] text-primary font-medium">2 pages</span></div>}
          </div>
          <div className="flex flex-wrap gap-2">
            {fields.map((f, i) => (
              <div key={f.label} className={`rounded-md border p-2 ${f.w === 'half' ? 'w-[calc(50%-0.25rem)]' : 'w-full'} ${i === 0 ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <FieldIcon kind={f.kind} />
                  <span className="text-[11px] font-medium truncate">{f.label}</span>
                  {f.badge === 'cond' && <span className="ml-auto inline-flex items-center gap-0.5 text-[8px] px-1 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"><GitBranch className="h-2 w-2" />if</span>}
                  {f.badge === 'dyn' && <span className="ml-auto inline-flex items-center gap-0.5 text-[8px] px-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"><Database className="h-2 w-2" />live</span>}
                  {f.badge === 'cascade' && <span className="ml-auto inline-flex items-center gap-0.5 text-[8px] px-1 rounded bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"><Link2 className="h-2 w-2" />linked</span>}
                </div>
                {f.kind === 'rating' ? <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-4 w-4 ${s <= 4 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />)}</div>
                  : f.kind === 'signature' ? <div className="h-10 rounded border border-dashed border-border flex items-center justify-center text-[9px] text-muted-foreground"><PenTool className="h-3 w-3 mr-1" /> Sign here</div>
                    : f.kind === 'textarea' ? <div className="h-10 rounded border border-border bg-background" />
                      : f.kind === 'select' ? <div className="h-7 rounded border border-border bg-background flex items-center justify-between px-2 text-[10px] text-muted-foreground">Choose… <ChevronDown className="h-3 w-3" /></div>
                        : <div className="h-7 rounded border border-border bg-background" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Properties */}
      <div id="df-demo-props" className="w-60 shrink-0 border-l border-border bg-card overflow-hidden flex flex-col">
        <div className="px-3 py-2 border-b border-border"><p className="text-xs font-semibold">Field properties</p><p className="text-[10px] text-muted-foreground truncate">{state.conditionOn ? '“What went wrong?”' : 'Full Name'}</p></div>
        <div className="flex gap-0.5 px-2 pt-2 text-[10px] border-b border-border">
          {([['basic', 'Basic'], ['validation', 'Rules'], ['options', 'Options'], ['logic', 'Logic'], ['data', 'Data']] as const).map(([k, l]) => (
            <span key={k} className={`px-1.5 py-1 rounded-t border-b-2 ${state.propsTab === k ? 'border-primary text-foreground font-medium' : 'border-transparent text-muted-foreground'}`}>{l}</span>
          ))}
        </div>
        <div className="p-3 text-[11px] space-y-2.5 overflow-hidden">
          {state.propsTab === 'basic' && (
            <div id="df-demo-props-basic" className="space-y-2.5">
              <div className="flex gap-1 text-[9px]"><span className="px-2 py-0.5 rounded bg-primary text-primary-foreground">EN</span><span className="px-2 py-0.5 rounded border border-border text-muted-foreground">FR</span></div>
              <div><label className="block text-[10px] text-muted-foreground mb-0.5">Label</label><div className="h-7 rounded border border-border bg-background flex items-center px-2">Full Name</div></div>
              <div id="df-demo-props-hint"><label className="block text-[10px] text-muted-foreground mb-0.5">Hint</label><div className="h-7 rounded border border-border bg-background flex items-center px-2 text-muted-foreground">As on your ID</div></div>
              <div className="flex items-center justify-between"><span>Required</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
              <div><label className="block text-[10px] text-muted-foreground mb-1">Width</label><div className="flex gap-1">{['Full', 'Half', 'Third'].map((w, i) => <span key={w} className={`px-1.5 py-0.5 rounded text-[10px] ${i === 1 ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>{w}</span>)}</div></div>
            </div>
          )}
          {state.propsTab === 'validation' && (
            <div id="df-demo-props-validation" className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2"><div><label className="block text-[10px] text-muted-foreground mb-0.5">Min length</label><div className="h-7 rounded border border-border bg-background flex items-center px-2">2</div></div><div><label className="block text-[10px] text-muted-foreground mb-0.5">Max length</label><div className="h-7 rounded border border-border bg-background flex items-center px-2">60</div></div></div>
              <div><label className="block text-[10px] text-muted-foreground mb-0.5">Pattern</label><div className="h-7 rounded border border-border bg-background flex items-center px-2 text-muted-foreground font-mono text-[10px]">^[^@]+@[^@]+$</div></div>
              <div className="rounded-md border border-green-500/30 bg-green-500/5 p-2 text-[10px] text-green-700 dark:text-green-400 inline-flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> Blocks submit until valid</div>
            </div>
          )}
          {state.propsTab === 'options' && (
            <div id="df-demo-props-options" className="space-y-1.5">
              <label className="block text-[10px] text-muted-foreground">Options (EN / FR)</label>
              {['Installation', 'Repair', 'Maintenance', 'Inspection'].map(o => (
                <div key={o} className="flex items-center gap-1.5 h-7 rounded border border-border bg-background px-2"><GripVertical className="h-3 w-3 text-muted-foreground/50" /><span className="flex-1 text-[10px]">{o}</span><X className="h-3 w-3 text-muted-foreground" /></div>
              ))}
              <div className="h-7 rounded border border-dashed border-border flex items-center justify-center gap-1 text-[10px] text-muted-foreground"><Plus className="h-3 w-3" /> Add option</div>
            </div>
          )}
          {state.propsTab === 'logic' && (
            <div id="df-demo-logic" className="space-y-2">
              <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-2 space-y-1.5">
                <p className="text-[10px] font-medium inline-flex items-center gap-1"><GitBranch className="h-3 w-3 text-amber-600" /> Conditional visibility</p>
                <div className="text-[10px] text-muted-foreground">Show this field <b className="text-foreground">when</b></div>
                <div className="h-6 rounded border border-border bg-background flex items-center px-2 text-[10px]">Rating</div>
                <div className="h-6 rounded border border-border bg-background flex items-center px-2 text-[10px]">is less than</div>
                <div className="h-6 rounded border border-border bg-background flex items-center px-2 text-[10px]">3 stars</div>
              </div>
              <p className="text-[9px] text-muted-foreground">The form adapts to each respondent.</p>
            </div>
          )}
          {state.propsTab === 'data' && (
            <div id="df-demo-dynamic" className="space-y-2">
              <div className="flex items-center justify-between"><span className="text-[10px]">Use live data</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
              <div><label className="block text-[10px] text-muted-foreground mb-0.5">Data source</label><div className="h-7 rounded border border-primary bg-primary/5 flex items-center px-2 text-[10px] text-primary inline-flex gap-1"><Database className="h-3 w-3" /> Contacts</div></div>
              {state.cascadeOn && (
                <div id="df-demo-cascade" className="rounded-md border border-indigo-500/30 bg-indigo-500/5 p-2 space-y-1">
                  <p className="text-[10px] font-medium inline-flex items-center gap-1"><Link2 className="h-3 w-3 text-indigo-600" /> Cascading</p>
                  <div className="text-[9px] text-muted-foreground">Filtered by parent field <b className="text-foreground">Customer</b> → shows that customer’s sites only.</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Thank-you dialog */}
      {state.thankYouOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50">
          <div id="df-demo-thankyou" className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Thank-You Page</p>
            <div className="space-y-2 text-xs">
              <div><label className="block text-[10px] text-muted-foreground mb-0.5">Default message</label><div className="rounded-md border border-border p-2 text-[11px]">Thanks! Your response has been recorded.</div></div>
              <div className="rounded-md border border-border p-2 space-y-1"><p className="text-[10px] font-medium inline-flex items-center gap-1"><GitBranch className="h-3 w-3 text-primary" /> Conditional rule</p><p className="text-[10px] text-muted-foreground">If rating ≥ 4 → “Glad you loved it! Leave us a Google review →”</p></div>
              <div className="flex items-center justify-between"><span>Redirect after submit</span><div className="flex items-center gap-2"><div className="h-6 px-2 rounded border border-border text-[10px] flex items-center">yoursite.com</div><div className="h-6 w-10 rounded border border-border text-[10px] flex items-center justify-center">3s</div></div></div>
            </div>
          </div>
        </div>
      )}
      {/* Share dialog */}
      {state.shareOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50">
          <div id="df-demo-share" className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Share2 className="h-4 w-4 text-primary" /> Public Sharing</p>
            <p className="text-xs text-muted-foreground mb-3">Anyone with the link can submit — no login required.</p>
            <div className="flex items-center justify-between mb-3"><span className="text-xs">Enable public link</span><span className="h-4 w-7 rounded-full bg-primary relative"><span className="absolute top-0.5 left-3.5 h-3 w-3 rounded-full bg-white" /></span></div>
            <div className="flex items-center gap-2"><div className="flex-1 h-8 rounded-md border border-border bg-background px-2 text-[11px] text-muted-foreground flex items-center truncate">flowentra.app/f/csat-2025</div><div className="h-8 px-2.5 rounded-md bg-primary text-primary-foreground text-[11px] inline-flex items-center gap-1"><Copy className="h-3 w-3" /> Copy</div></div>
          </div>
        </div>
      )}
      {/* Publish dialog */}
      {state.publishOpen && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50">
          <div id="df-demo-publish" className="w-[400px] bg-card border border-border rounded-xl shadow-2xl p-4 text-center">
            <span className="h-10 w-10 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 inline-flex items-center justify-center mb-2"><CheckCircle2 className="h-5 w-5 text-green-600" /></span>
            <p className="text-sm font-semibold">Release this form?</p>
            <p className="text-xs text-muted-foreground mb-3">It moves from Draft to Released, the public link goes live, and it starts accepting responses.</p>
            <div className="flex justify-center gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground">Cancel</div><div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5"><Send className="h-3.5 w-3.5" /> Release</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Preview / Public (shared renderer) ────────────────────────────────────────
function FormRender({ id, step, branded, submitted }: { id: string; step: number; branded?: boolean; submitted?: boolean }) {
  if (submitted) {
    return (
      <div id={id} className="max-w-md mx-auto bg-card border border-border rounded-xl p-8 text-center">
        <span className="h-14 w-14 mx-auto rounded-full bg-green-100 dark:bg-green-900/30 inline-flex items-center justify-center mb-3"><CheckCircle2 className="h-7 w-7 text-green-600" /></span>
        <h3 className="text-lg font-semibold mb-1">Thank you! 🎉</h3>
        <p className="text-sm text-muted-foreground">Your response has been recorded. Redirecting you in 3s…</p>
      </div>
    );
  }
  return (
    <div id={id} className="max-w-md mx-auto bg-card border border-border rounded-xl overflow-hidden">
      {branded && <div className="h-12 bg-gradient-to-r from-primary to-primary/70 flex items-center px-4 text-primary-foreground text-sm font-semibold gap-2"><FileText className="h-4 w-4" /> Customer Satisfaction</div>}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2"><div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-primary" style={{ width: step === 0 ? '50%' : '100%' }} /></div><span className="text-[10px] text-muted-foreground">Step {step + 1}/2</span></div>
        {step === 0 ? (
          <>
            <div><label className="block text-xs font-medium mb-1">Full Name <span className="text-destructive">*</span></label><div className="h-9 rounded-md border border-border bg-background px-2 text-sm flex items-center text-muted-foreground">Mariem Khelifi</div></div>
            <div><label className="block text-xs font-medium mb-1">Service</label><div className="h-9 rounded-md border border-border bg-background px-2 text-sm flex items-center justify-between text-muted-foreground">Maintenance <ChevronDown className="h-4 w-4" /></div></div>
            <div className="h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5">Next <ChevronRight className="h-4 w-4" /></div>
          </>
        ) : (
          <>
            <div><label className="block text-xs font-medium mb-1">How would you rate us?</label><div className="flex gap-1">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-6 w-6 ${s <= 2 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />)}</div></div>
            <div className="rounded-md border border-amber-400/40 bg-amber-50/50 dark:bg-amber-900/10 p-2"><label className="block text-xs font-medium mb-1 inline-flex items-center gap-1"><GitBranch className="h-3 w-3 text-amber-600" /> What went wrong?</label><div className="h-12 rounded border border-border bg-background" /><p className="text-[9px] text-muted-foreground mt-0.5">Shown because rating &lt; 3 ✦</p></div>
            <div><label className="block text-xs font-medium mb-1">Signature</label><div className="h-12 rounded border border-dashed border-border flex items-center justify-center"><svg viewBox="0 0 160 30" className="h-8 text-primary"><path d="M5 22 Q 18 5, 32 18 T 62 14 Q 78 26, 92 10 L 130 18" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg></div></div>
            <div className="h-9 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1.5">Submit <Send className="h-3.5 w-3.5" /></div>
          </>
        )}
      </div>
    </div>
  );
}

function PagePreview({ state }: { state: DFDemoState }) {
  return (
    <div className="p-6 bg-muted/20 min-h-full">
      <div className="max-w-md mx-auto mb-3 flex items-center gap-2 text-xs text-muted-foreground"><Eye className="h-4 w-4" /> Live preview — exactly what visitors see</div>
      <div id="df-demo-preview"><div id="df-demo-preview-nav"><FormRender id="df-demo-preview-inner" step={state.step} /></div></div>
    </div>
  );
}

function PagePublic({ state }: { state: DFDemoState }) {
  return (
    <div className="p-6 bg-[linear-gradient(180deg,#f1f5f9_0%,#e2e8f0_100%)] dark:bg-[linear-gradient(180deg,#0f172a_0%,#1e293b_100%)] min-h-full">
      <div className="max-w-md mx-auto mb-3 flex items-center gap-2 text-[11px] text-muted-foreground"><Link2 className="h-3.5 w-3.5" /> flowentra.app/f/csat-2025 · no login</div>
      <div id="df-demo-public"><div id="df-demo-public-fill"><div id="df-demo-public-submit"><FormRender id="df-demo-public-inner" step={state.step} branded submitted={state.submitted} /></div></div></div>
    </div>
  );
}

// ─── Responses page ─────────────────────────────────────────────────────────────
const RESP = [
  { id: 'r1', who: 'Mariem Khelifi', when: '2 min ago', rating: 2 },
  { id: 'r2', who: 'Sami Bouazizi', when: '1 h ago', rating: 5 },
  { id: 'r3', who: 'Anonymous', when: '3 h ago', rating: 4 },
  { id: 'r4', who: 'Leïla M.', when: 'Yesterday', rating: 5 },
];
function PageResponses({ state }: { state: DFDemoState }) {
  return (
    <div className="p-4 md:p-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" /><h1 className="text-lg font-semibold">Customer Satisfaction Survey</h1><span className="inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium">248 responses</span></div>
        <div id="df-demo-export" className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default"><Download className="h-3.5 w-3.5" /> Export</div>
      </div>
      <div id="df-demo-responses" className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60"><th className="text-left px-4 py-2 text-muted-foreground font-medium">Respondent</th><th className="text-left px-4 py-2 text-muted-foreground font-medium">Submitted</th><th className="text-left px-4 py-2 text-muted-foreground font-medium">Rating</th><th className="text-right px-4 py-2 text-muted-foreground font-medium">Actions</th></tr></thead>
          <tbody>
            {RESP.map((r, i) => (
              <tr key={r.id} className={`border-b border-border/40 last:border-0 ${i === 0 ? 'bg-primary/5' : ''}`}>
                <td className="px-4 py-2.5 font-medium inline-flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" />{r.who}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.when}</td>
                <td className="px-4 py-2.5"><div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3 w-3 ${s <= r.rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />)}</div></td>
                <td className="px-4 py-2.5 text-right"><div className="inline-flex gap-1"><span className="h-6 w-6 rounded border border-border inline-flex items-center justify-center text-muted-foreground"><Eye className="h-3 w-3" /></span><span className="h-6 w-6 rounded border border-border inline-flex items-center justify-center text-muted-foreground"><Download className="h-3 w-3" /></span></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* View one response */}
      {state.responseOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-10 bg-background/50">
          <div id="df-demo-response-view" className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Mariem Khelifi · 2 min ago</p>
            <div className="space-y-2 text-xs">
              {[['Full Name', 'Mariem Khelifi'], ['Service', 'Maintenance']].map(r => <div key={r[0]} className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">{r[0]}</span><span className="font-medium">{r[1]}</span></div>)}
              <div className="flex justify-between border-b border-border/40 pb-1"><span className="text-muted-foreground">Rating</span><span className="flex gap-0.5">{[1, 2, 3, 4, 5].map(s => <Star key={s} className={`h-3 w-3 ${s <= 2 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40'}`} />)}</span></div>
              <div className="border-b border-border/40 pb-1"><span className="text-muted-foreground">What went wrong?</span><p className="mt-0.5">Technician arrived late, but fixed it well.</p></div>
              <div><span className="text-muted-foreground">Signature</span><div className="h-12 rounded border border-border mt-1 flex items-center justify-center"><svg viewBox="0 0 160 30" className="h-7 text-foreground"><path d="M5 22 Q 18 5, 32 18 T 62 14 Q 78 26, 92 10 L 130 18" fill="none" stroke="currentColor" strokeWidth="1.5" /></svg></div></div>
            </div>
          </div>
        </div>
      )}
      {/* Export dialog */}
      {state.exportOpen && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-12 bg-background/50">
          <div className="w-[400px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><Download className="h-4 w-4 text-primary" /> Export responses</p>
            <div className="space-y-2">
              {[['All responses → Excel', '248 rows'], ['Selected → PDF', 'branded report']].map(o => (
                <div key={o[0]} className="flex items-center justify-between p-2.5 rounded-lg border border-border"><span className="text-xs font-medium">{o[0]}</span><span className="text-[10px] text-muted-foreground">{o[1]}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Export to entity */}
      {state.exportEntity && (
        <div className="absolute inset-0 z-[6] flex items-center justify-center bg-background/50">
          <div id="df-demo-export-entity" className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Turn this response into…</p>
            <p className="text-xs text-muted-foreground mb-3">Push the submission straight into Flowentra — one click, no re-typing.</p>
            <div className="grid grid-cols-3 gap-2">
              {[['Contact', User], ['Service Order', ClipboardList], ['Support Ticket', Ticket]].map(([l, Ic]: any) => (
                <div key={l} className="rounded-lg border border-border p-3 text-center hover:border-primary"><Ic className="h-5 w-5 text-primary mx-auto mb-1.5" /><span className="text-[11px] font-medium">{l}</span></div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main shell ─────────────────────────────────────────────────────────────────
export function DynamicFormsAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= DF_STEPS.length;
  const state: DFDemoState = useMemo(() => { let s = initialDFDemoState; for (let i = 0; i < Math.min(stepIndex + 1, DF_STEPS.length); i++) s = DF_STEPS[i].apply(s); return s; }, [stepIndex]);

  const step = DF_STEPS[Math.min(stepIndex, DF_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, DF_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Vos formulaires dynamiques sont prêts — créez votre premier formulaire.' :
    'Your Dynamic Forms are ready — build your first form.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => { if (typeof window === 'undefined' || !window.speechSynthesis) return; const synth = window.speechSynthesis; synth.getVoices(); const onV = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onV); return () => synth.removeEventListener?.('voiceschanged', onV); }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.fieldCount, state.propsTab, state.conditionOn, state.dynamicOn, state.cascadeOn, state.multiPage, state.thankYouOpen, state.shareOpen, state.publishOpen, state.step, state.submitted, state.responseOpen, state.exportOpen, state.exportEntity, state.statusFilter]);
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
  const activeChapter = DF_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || DF_CHAPTERS[DF_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><FileText className="h-3.5 w-3.5 text-primary-foreground" /></span><span className="text-sm font-semibold truncate">Dynamic Forms — Live Demo</span></div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'list'      && <PageList      state={state} />}
        {state.page === 'builder'   && <PageBuilder   state={state} />}
        {state.page === 'preview'   && <PagePreview   state={state} />}
        {state.page === 'public'    && <PagePublic    state={state} />}
        {state.page === 'responses' && <PageResponses state={state} />}
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {DF_CHAPTERS.map(ch => (<button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, DF_STEPS.length)} / {DF_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, DF_STEPS.length) / DF_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><FileText className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">Any form, no code</h3>
            <p className="text-sm text-muted-foreground mb-5">Drag-and-drop builder · Conditional logic · Live data · Multi-step · Public link · Responses into your business.</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">Build your first form</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> Replay</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
