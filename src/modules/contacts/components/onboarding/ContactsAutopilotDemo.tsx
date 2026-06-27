import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Users, User, Building2, Mail, Phone, MapPin, Star, Filter, Upload, Plus,
  Search, Trash2, FileText, ShoppingCart, ClipboardList, Wrench, StickyNote,
  Calendar, ExternalLink, IdCard, ChevronRight, FileSpreadsheet, Package, Edit2,
  CheckCircle2,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  CT_STEPS, CT_CHAPTERS, initialContactsDemoState,
  type ContactsDemoState,
} from './contactsDemoScript';
import { pickLang, getCaption, getChapterTitle } from './contactsDemoTranslations';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_CONTACTS = [
  { id: 'c1', name: 'Acme Industries',     role: '',                  company: 'Acme Industries',  email: 'contact@acme.tn',     phone: '+216 71 100 200', type: 'company',    status: 'customer', fav: true,  city: 'Tunis' },
  { id: 'c2', name: 'Mariem Khelifi',      role: 'Procurement Lead',  company: 'Acme Industries',  email: 'm.khelifi@acme.tn',   phone: '+216 22 334 556', type: 'individual', status: 'active',   fav: false, city: 'Tunis' },
  { id: 'c3', name: 'Sami Bouazizi',       role: 'Facilities Manager',company: 'Médina Resorts',   email: 'sami.b@medina.tn',    phone: '+216 98 776 554', type: 'individual', status: 'lead',     fav: false, city: 'Sousse' },
  { id: 'c4', name: 'Médina Resorts',      role: '',                  company: 'Médina Resorts',   email: 'info@medina.tn',      phone: '+216 73 222 111', type: 'company',    status: 'lead',     fav: true,  city: 'Sousse' },
  { id: 'c5', name: 'Hydro Parts SARL',    role: '',                  company: 'Hydro Parts SARL', email: 'sales@hydroparts.tn', phone: '+216 74 555 333', type: 'supplier',   status: 'active',   fav: false, city: 'Sfax' },
];

const DEMO_OFFERS = [
  { id: 'o1', num: 'OFF-2025-018', status: 'accepted', date: '2025-05-20', amount: 18400 },
  { id: 'o2', num: 'OFF-2025-031', status: 'sent',     date: '2025-06-02', amount: 7600  },
  { id: 'o3', num: 'OFF-2025-009', status: 'rejected', date: '2025-03-11', amount: 4200  },
];
const DEMO_SALES = [
  { id: 's1', num: 'INV-2025-044', status: 'paid',           date: '2025-05-25', amount: 18400 },
  { id: 's2', num: 'INV-2025-051', status: 'partially_paid', date: '2025-06-08', amount: 9200  },
];
const DEMO_SO = [
  { id: 'so1', num: 'SO-2025-077', status: 'completed',  date: '2025-05-28', amount: 0 },
  { id: 'so2', num: 'SO-2025-090', status: 'scheduled',  date: '2025-06-15', amount: 0 },
];
const DEMO_INST = [
  { id: 'i1', num: 'INST-2024-204', status: 'active', date: '2024-11-03', amount: 0 },
];
const DEMO_PURCHASES = [
  { id: 'pu1', num: 'INV-2025-044', date: '2025-05-25', amount: 18400 },
  { id: 'pu2', num: 'INV-2024-318', date: '2024-12-12', amount: 12750 },
  { id: 'pu3', num: 'INV-2024-205', date: '2024-08-30', amount: 6300  },
];
const DEMO_NOTES = [
  { id: 'n1', date: '2025-06-09', by: 'Ahmed B.', text: 'Call with Mariem — interested in the maintenance plan, wants a revised quote by Friday.' },
  { id: 'n2', date: '2025-05-21', by: 'Sara M.',  text: 'Offer OFF-2025-018 accepted. Proceeding to invoicing. Decision-maker confirmed budget.' },
  { id: 'n3', date: '2025-04-02', by: 'Ahmed B.', text: 'On-site visit booked. Key contact prefers WhatsApp over email for scheduling.' },
];
const DEMO_SUPPLIER_ARTICLES = [
  { id: 'sa1', name: 'Hydraulic Cylinder HY-200', ref: 'HP-200-A', price: 1180 },
  { id: 'sa2', name: 'Mounting Bracket MB-45',    ref: 'HP-MB45',  price: 165  },
  { id: 'sa3', name: 'Seal Kit SK-12',            ref: 'HP-SK12',  price: 42   },
];

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const TYPE_LABEL: Record<string, string> = { individual: 'Individual', company: 'Company', supplier: 'Supplier' };
const STATUS_CLS: Record<string, string> = {
  active:         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  customer:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid:           'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  accepted:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sent:           'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  scheduled:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  lead:           'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  inactive:       'bg-muted text-muted-foreground',
  rejected:       'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
function Pill({ status }: { status: string }) {
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${STATUS_CLS[status] ?? 'bg-muted text-muted-foreground'}`}>{status.replace(/_/g, ' ')}</span>;
}
const initials = (n: string) => n.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);

// ─── Page: Contacts list ────────────────────────────────────────────────────

function PageList({ state }: { state: ContactsDemoState }) {
  const rows = DEMO_CONTACTS.filter(c => state.typeFilter === 'all' || c.type === state.typeFilter);

  return (
    <div className="flex flex-col relative">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
          <div>
            <h1 id="ct-demo-title" className="text-xl font-semibold text-foreground">Contacts</h1>
            <p className="text-[11px] text-muted-foreground">People, companies &amp; suppliers</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div id="ct-demo-import-btn" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default"><Upload className="h-3.5 w-3.5" /> Import</div>
          <div id="ct-demo-add-btn" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default"><Plus className="h-3.5 w-3.5" /> Add Contact</div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="p-4 border-b border-border grid grid-cols-3 gap-3">
        {[
          { id: 'ct-demo-stat-all',       key: 'all',        label: 'All Contacts', value: DEMO_CONTACTS.length, icon: <Users className="h-4 w-4" /> },
          { id: 'ct-demo-stat-persons',   key: 'individual', label: 'Persons',      value: DEMO_CONTACTS.filter(c => c.type === 'individual').length, icon: <User className="h-4 w-4" /> },
          { id: 'ct-demo-stat-companies', key: 'company',    label: 'Companies',    value: DEMO_CONTACTS.filter(c => c.type === 'company').length, icon: <Building2 className="h-4 w-4" /> },
        ].map(c => {
          const active = state.typeFilter === c.key;
          return (
            <div key={c.key} id={c.id} className={`rounded-lg p-3 border cursor-default transition-all ${active ? 'border-2 border-primary bg-primary/5' : 'border-border bg-card'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className={`p-2 rounded-lg ${active ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>{c.icon}</span>
                  <span className="text-xs text-muted-foreground font-medium">{c.label}</span>
                </div>
                <span className="text-sm font-bold">{active || c.key === 'all' ? c.value : '-'}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Search + filters */}
      <div className="p-3 border-b border-border bg-card space-y-3">
        <div className="flex gap-2 items-center">
          <div id="ct-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">{state.searchActive ? 'acme' : 'Search contacts…'}</div>
          </div>
          <div id="ct-demo-filter-btn" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-1.5 cursor-default ${state.showFilters ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}><Filter className="h-4 w-4" /> Filters</div>
          <div id="ct-demo-map-btn" className={`h-9 w-9 rounded-md border flex items-center justify-center cursor-default ${state.showMap ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-muted-foreground'}`}><MapPin className="h-4 w-4" /></div>
        </div>

        {state.showFilters && (
          <div className="flex flex-wrap items-end gap-3 pt-3 border-t border-border">
            {[
              { id: 'ct-demo-filter-status', focus: 'status', label: 'Status', value: 'All statuses' },
              { id: 'ct-demo-filter-type', focus: 'type', label: 'Type', value: 'All types' },
              { id: 'ct-demo-filter-favorites', focus: 'favorites', label: 'Favourites', value: 'All contacts' },
            ].map(f => (
              <div key={f.focus} className="flex flex-col gap-1 min-w-[150px]">
                <span className="text-[10px] font-medium text-muted-foreground">{f.label}</span>
                <div id={f.id} className={`h-9 px-2.5 rounded-md border text-sm flex items-center gap-2 cursor-default ${state.filterFocus === f.focus ? 'border-primary text-primary bg-primary/5' : 'border-border text-foreground'}`}>
                  {f.value} <ChevronRight className="h-3.5 w-3.5 ml-auto rotate-90 text-muted-foreground" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bulk bar */}
      {state.bulkBar && (
        <div id="ct-demo-bulk-bar" className="bg-destructive/10 border-b border-destructive/20 p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 rounded bg-primary border border-primary inline-flex items-center justify-center"><span className="h-2 w-2 bg-primary-foreground rounded-sm" /></span>
            <span className="text-sm font-medium">3 selected</span>
            <span className="text-xs text-muted-foreground">Deselect all</span>
          </div>
          <div id="ct-demo-bulk-delete" className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs inline-flex items-center gap-1.5 cursor-default"><Trash2 className="h-3.5 w-3.5" /> Delete selected</div>
        </div>
      )}

      {/* Map */}
      {state.showMap && (
        <div id="ct-demo-map" className="m-4 h-56 rounded-lg border border-border overflow-hidden relative bg-[linear-gradient(135deg,#e8f0e8_0%,#dce9f0_100%)] dark:bg-[linear-gradient(135deg,#1b2a1b_0%,#16242e_100%)]">
          <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 28px,rgba(120,120,120,.25) 29px),repeating-linear-gradient(90deg,transparent,transparent 28px,rgba(120,120,120,.25) 29px)' }} />
          {[{ x: '24%', y: '38%', c: 'bg-primary' }, { x: '58%', y: '60%', c: 'bg-amber-500' }, { x: '72%', y: '30%', c: 'bg-green-600' }, { x: '40%', y: '72%', c: 'bg-primary' }].map((p, i) => (
            <div key={i} className="absolute -translate-x-1/2 -translate-y-full" style={{ left: p.x, top: p.y }}>
              <MapPin className={`h-6 w-6 ${p.c} text-white rounded-full p-0.5`} fill="currentColor" />
            </div>
          ))}
          <div className="absolute bottom-2 left-2 text-[10px] text-muted-foreground bg-background/70 rounded px-2 py-0.5">4 contacts mapped · Tunis · Sousse · Sfax</div>
        </div>
      )}

      {/* Table */}
      <div className="p-4">
        <div id="ct-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/30">
              <th className="w-8 px-3 py-2">
                <span id="ct-demo-select-all" className={`h-3.5 w-3.5 rounded border inline-block ${state.selectMode ? 'bg-primary border-primary' : 'border-border bg-background'}`} />
              </th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Contact</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Email</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Phone</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Actions</th>
            </tr></thead>
            <tbody>
              {rows.map((c, idx) => (
                <tr key={c.id} className={`border-b border-border/40 last:border-0 ${c.fav ? 'bg-amber-500/[0.04]' : ''} ${state.selectMode ? 'bg-muted/30' : ''}`}>
                  <td className="px-3 py-2.5"><span className={`h-3.5 w-3.5 rounded border inline-block ${state.selectMode ? 'bg-primary border-primary' : 'border-border bg-background'}`} /></td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-2.5">
                      <span className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold inline-flex items-center justify-center">{initials(c.name)}</span>
                      <div className="min-w-0">
                        <div className="font-medium text-foreground flex items-center gap-1.5">{c.name}{c.fav && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}</div>
                        {c.role && <div className="text-[11px] text-muted-foreground">{c.role}</div>}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Mail className="h-3 w-3 text-primary" />{c.email}</span></td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3 w-3 text-primary" />{c.phone}</span></td>
                  <td className="px-3 py-2.5"><span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{TYPE_LABEL[c.type]}</span></td>
                  <td className="px-3 py-2.5"><Pill status={c.status} /></td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <span id={idx === 0 ? 'ct-demo-favorite-star' : undefined} className={`h-6 w-6 rounded border border-border inline-flex items-center justify-center ${state.favoriteRow && idx === 0 ? 'bg-amber-100 dark:bg-amber-900/30' : ''}`}>
                        <Star className={`h-3 w-3 ${c.fav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                      </span>
                      <span className="h-6 w-6 rounded border border-border inline-flex items-center justify-center text-muted-foreground"><Edit2 className="h-3 w-3" /></span>
                      <span className="h-6 w-6 rounded border border-border inline-flex items-center justify-center text-muted-foreground"><Trash2 className="h-3 w-3" /></span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk-delete confirmation dialog */}
      {state.bulkConfirm && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-16 bg-background/50">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-1 inline-flex items-center gap-2"><Trash2 className="h-4 w-4 text-destructive" /> Delete 3 contacts?</p>
            <p className="text-xs text-muted-foreground mb-3">This permanently removes the selected contacts. This action cannot be undone.</p>
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1"><span>Deleting…</span><span>66%</span></div>
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden"><div className="h-full bg-destructive rounded-full" style={{ width: '66%' }} /></div>
            </div>
            <div className="flex justify-end gap-2"><div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div><div className="h-8 px-3 rounded-md bg-destructive text-destructive-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Trash2 className="h-3.5 w-3.5" /> Delete</div></div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Page: Create contact ───────────────────────────────────────────────────

const Box = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
  <div className={`h-9 px-3 rounded-md border border-border text-sm flex items-center ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{children}</div>
);
function Field({ id, label, children, active }: { id?: string; label: string; children: React.ReactNode; active?: boolean }) {
  return (
    <div id={id} className={`rounded-md transition-all ${active ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function PageCreate({ state }: { state: ContactsDemoState }) {
  const step = state.createStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <h1 className="text-lg font-semibold">New Contact</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Type */}
        <div id="ct-demo-create-type">
          <label className="block text-xs font-medium text-foreground mb-1.5">Contact Type</label>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            {[{ k: 'individual', l: 'Individual', i: <User className="h-3.5 w-3.5" /> }, { k: 'company', l: 'Company', i: <Building2 className="h-3.5 w-3.5" /> }, { k: 'supplier', l: 'Supplier', i: <Package className="h-3.5 w-3.5" /> }].map(o => (
              <span key={o.k} className={`px-4 py-1.5 text-sm inline-flex items-center gap-1.5 cursor-default ${o.k === 'individual' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>{o.i} {o.l}</span>
            ))}
          </div>
        </div>

        {/* Identity */}
        <div id="ct-demo-create-identity" className={`grid grid-cols-3 gap-4 transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <Field label="Full Name *"><Box muted={step < 1}>{step >= 1 ? 'Mariem Khelifi' : '—'}</Box></Field>
          <Field label="Company"><Box muted={step < 1}>{step >= 1 ? 'Acme Industries' : '—'}</Box></Field>
          <Field label="Position"><Box muted={step < 1}>{step >= 1 ? 'Procurement Lead' : '—'}</Box></Field>
        </div>

        {/* Contact info */}
        <div id="ct-demo-create-contactinfo" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
          <Field label="Email" active={step === 2}><Box muted={step < 2}>{step >= 2 ? 'm.khelifi@acme.tn' : '—'}</Box></Field>
          <Field label="Phone" active={step === 2}><Box muted={step < 2}>{step >= 2 ? '+216 22 334 556' : '—'}</Box></Field>
        </div>

        {/* Address */}
        <div id="ct-demo-create-address" className={`grid grid-cols-3 gap-4 transition-opacity ${step >= 3 ? '' : 'opacity-40'}`}>
          <Field label="Address" active={step === 3}><Box muted={step < 3}>{step >= 3 ? '12 Rue de Carthage' : '—'}</Box></Field>
          <Field label="City" active={step === 3}><Box muted={step < 3}>{step >= 3 ? 'Tunis' : '—'}</Box></Field>
          <Field label="Country" active={step === 3}><Box muted={step < 3}>{step >= 3 ? 'Tunisia' : '—'}</Box></Field>
        </div>

        {/* Fiscal */}
        <div id="ct-demo-create-fiscal" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 4 ? '' : 'opacity-40'}`}>
          <Field label="CIN" active={step === 4}><Box muted={step < 4}>{step >= 4 ? '09 887 654' : '—'}</Box></Field>
          <Field label="Matricule Fiscale" active={step === 4}><Box muted={step < 4}>{step >= 4 ? '1234567/A/M/000' : '—'}</Box></Field>
        </div>

        {/* Status / favourite / tags */}
        <div id="ct-demo-create-status" className={`flex flex-wrap items-end gap-4 transition-opacity ${step >= 5 ? '' : 'opacity-40'}`}>
          <Field label="Status" active={step === 5}><div className="h-9 w-36 px-3 rounded-md border border-border text-sm flex items-center">{step >= 5 ? 'Customer' : '—'}</div></Field>
          <div className="flex items-center gap-1.5 h-9"><Star className={`h-4 w-4 ${step >= 5 ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} /><span className="text-xs text-muted-foreground">Favourite</span></div>
          <div className="flex gap-1.5 h-9 items-center">
            {step >= 5 ? ['VIP', 'North Region'].map(tg => <span key={tg} className="h-6 px-2 rounded-full bg-primary/10 text-primary text-[10px] inline-flex items-center">{tg}</span>) : <span className="text-xs text-muted-foreground">tags…</span>}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
        <div id="ct-demo-create-save" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center cursor-default">Save Contact</div>
      </div>
    </div>
  );
}

// ─── Page: Bulk import ──────────────────────────────────────────────────────

function PageImport({ state }: { state: ContactsDemoState }) {
  const step = state.importStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <h1 className="text-lg font-semibold">Import Contacts</h1>
      </div>

      <div className="flex items-center gap-0 text-[11px]">
        {['Upload', 'Mapping', 'Duplicates', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-0">
            <span className={`px-2.5 py-1 rounded-full font-medium ${i <= step ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>{s}</span>
            {i < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <div id="ct-demo-import-template" className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/20">
          <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">contacts-import.xlsx</p>
            <p className="text-[11px] text-muted-foreground">312 rows · name, email, phone, company, type, status, address, city, CIN, matricule fiscale</p>
          </div>
          <span className="h-7 px-2.5 rounded-md border border-border text-[11px] text-muted-foreground inline-flex items-center gap-1 cursor-default"><Upload className="h-3 w-3" /> Template</span>
        </div>

        <div id="ct-demo-import-mapping" className={`transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <p className="text-xs font-medium mb-2">Column mapping &amp; normalisation</p>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Spreadsheet column</th>
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Mapped field</th>
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Normalised</th>
              </tr></thead>
              <tbody>
                {[['Société', 'type', '"société" → Company'], ['Nom complet', 'name', '"Mariem Khelifi" → first + last'], ['Catégorie', 'status', '"client" → Customer']].map(r => (
                  <tr key={r[0]} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-1.5">{r[0]}</td>
                    <td className="px-3 py-1.5 text-primary font-medium">{step >= 1 ? r[1] : '…'}</td>
                    <td className="px-3 py-1.5 text-muted-foreground">{step >= 1 ? r[2] : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div id="ct-demo-import-duplicates" className={`transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
          <p className="text-xs font-medium mb-2">Duplicate review (matched on name + email)</p>
          <div className="space-y-1.5">
            {[['Mariem Khelifi', 'Update existing'], ['Acme Industries', 'Skip'], ['Sami Bouazizi', 'Import as new']].map(d => (
              <div key={d[0]} className="flex items-center justify-between p-2 rounded-md border border-border bg-muted/20 text-xs">
                <span className="font-medium">{d[0]}</span>
                <span className={`h-6 px-2 rounded-full text-[10px] inline-flex items-center ${step >= 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{step >= 2 ? d[1] : '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
        <div id="ct-demo-import-confirm" className={`h-9 px-4 rounded-md text-sm font-medium flex items-center cursor-default ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-primary/40 text-primary-foreground'}`}>Import 310 contacts</div>
      </div>
    </div>
  );
}

// ─── Page: Contact detail ───────────────────────────────────────────────────

function RelatedList({ records, icon: Icon }: { records: { id: string; num: string; status: string; date: string; amount: number }[]; icon: any }) {
  return (
    <div className="space-y-2">
      {records.map(r => (
        <div key={r.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border border-border/60">
          <div className="flex items-center gap-3 min-w-0">
            <Icon className="h-4 w-4 text-primary shrink-0" />
            <div>
              <div className="flex items-center gap-2"><span className="text-sm font-medium">{r.num}</span><Pill status={r.status} /></div>
              <div className="flex items-center gap-1 mt-0.5 text-[11px] text-muted-foreground"><Calendar className="h-3 w-3" />{r.date}</div>
            </div>
          </div>
          {r.amount > 0 && <span className="text-sm font-semibold mr-2">{fmt(r.amount)} TND</span>}
          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      ))}
    </div>
  );
}

function PageDetail({ state }: { state: ContactsDemoState }) {
  const isSup = state.isSupplier;
  const c = isSup ? DEMO_CONTACTS[4] : DEMO_CONTACTS[0];
  const tabs = isSup
    ? [{ k: 'overview', l: 'Overview', id: undefined as string | undefined }, { k: 'articles', l: 'Articles', id: 'ct-demo-supplier-articles' }, { k: 'purchases', l: 'Purchases', id: undefined }, { k: 'notes', l: 'Notes', id: undefined }]
    : [
        { k: 'overview', l: 'Overview', id: undefined as string | undefined },
        { k: 'installations', l: 'Installations', id: 'ct-demo-tab-installations' },
        { k: 'offers', l: 'Offers', id: 'ct-demo-tab-offers' },
        { k: 'sales', l: 'Sales', id: 'ct-demo-tab-sales' },
        { k: 'serviceOrders', l: 'Service Orders', id: 'ct-demo-tab-serviceorders' },
        { k: 'purchases', l: 'Purchases', id: 'ct-demo-tab-purchases' },
        { k: 'notes', l: 'Notes', id: 'ct-demo-tab-notes' },
      ];

  const info = [
    { icon: Mail, label: 'Email', value: c.email },
    { icon: Phone, label: 'Phone', value: c.phone },
    { icon: Building2, label: 'Company', value: c.company },
    { icon: User, label: 'Position', value: c.role || '—' },
    { icon: MapPin, label: 'Address', value: `${c.city}, Tunisia` },
    { icon: IdCard, label: 'CIN', value: isSup ? '—' : '09 887 654' },
    { icon: FileText, label: 'Matricule Fiscale', value: '1234567/A/M/000' },
    { icon: Calendar, label: 'Created', value: '2024-08-30' },
  ];

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      {/* Header */}
      <div id={isSup ? 'ct-demo-supplier' : 'ct-demo-detail-header'} className="sticky top-0 bg-background/95 border-b border-border/60 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
            <div className="relative">
              <span className="h-11 w-11 rounded-full bg-primary/10 text-primary text-sm font-bold inline-flex items-center justify-center">{initials(c.name)}</span>
              {c.fav && <Star className="absolute -top-1 -right-1 h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-semibold">{c.name}</h1>
                <Pill status={c.status} />
                <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{TYPE_LABEL[c.type]}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{c.role ? `${c.role} · ` : ''}{c.company}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="h-9 w-9 rounded-md border border-border inline-flex items-center justify-center"><Star className={`h-4 w-4 ${c.fav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} /></span>
            <span className="h-9 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default"><Edit2 className="h-3.5 w-3.5" /> Edit</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 px-4 overflow-x-auto">
        <div className="flex gap-1 -mb-px min-w-max">
          {tabs.map(tab => (
            <div key={tab.k} id={tab.id}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-default whitespace-nowrap
                ${state.activeTab === tab.k ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
              {tab.l}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {state.activeTab === 'overview' && (
          <div className="bg-card border border-border rounded-lg p-4">
            <p className="text-sm font-medium mb-3 inline-flex items-center gap-2"><User className="h-4 w-4" /> Contact Information</p>
            <div id="ct-demo-overview-info" className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {info.map(it => (
                <div key={it.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="p-1.5 rounded-md bg-background"><it.icon className="h-3.5 w-3.5 text-primary" /></span>
                  <div className="min-w-0"><p className="text-[10px] text-muted-foreground">{it.label}</p><p className="text-xs font-medium truncate">{it.value}</p></div>
                </div>
              ))}
            </div>
            <div id="ct-demo-overview-status" className="flex flex-wrap items-center gap-4 pt-3 mt-3 border-t border-border">
              <span className="text-xs text-muted-foreground">Status: <Pill status={c.status} /></span>
              <span className="text-xs text-muted-foreground">Type: <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px]">{TYPE_LABEL[c.type]}</span></span>
            </div>
          </div>
        )}

        {state.activeTab === 'offers' && <div id="ct-demo-rel-offers"><RelatedList records={DEMO_OFFERS} icon={FileText} /></div>}
        {state.activeTab === 'sales' && <RelatedList records={DEMO_SALES} icon={ShoppingCart} />}
        {state.activeTab === 'serviceOrders' && <RelatedList records={DEMO_SO} icon={ClipboardList} />}
        {state.activeTab === 'installations' && <RelatedList records={DEMO_INST} icon={Wrench} />}

        {state.activeTab === 'purchases' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
              <span className="text-sm font-medium inline-flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Purchase History</span>
              <span className="text-xs text-muted-foreground">Lifetime: {fmt(DEMO_PURCHASES.reduce((s, p) => s + p.amount, 0))} TND</span>
            </div>
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Invoice</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Date</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Amount</th>
              </tr></thead>
              <tbody>
                {DEMO_PURCHASES.map(p => (
                  <tr key={p.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5 font-medium text-primary">{p.num}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{p.date}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmt(p.amount)} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {state.activeTab === 'notes' && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <span id="ct-demo-add-note" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> Add Note</span>
            </div>
            {DEMO_NOTES.map(n => (
              <div key={n.id} className="flex gap-3 p-3 bg-card border border-border rounded-lg">
                <span className="h-7 w-7 rounded-full bg-primary/10 text-primary inline-flex items-center justify-center shrink-0"><StickyNote className="h-3.5 w-3.5" /></span>
                <div className="min-w-0">
                  <p className="text-xs text-foreground">{n.text}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">{n.date} · {n.by}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {state.activeTab === 'articles' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/60"><span className="text-sm font-medium inline-flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Articles supplied</span></div>
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Article</th>
                <th className="text-left px-4 py-2 text-muted-foreground font-medium">Supplier Ref</th>
                <th className="text-right px-4 py-2 text-muted-foreground font-medium">Purchase Price</th>
              </tr></thead>
              <tbody>
                {DEMO_SUPPLIER_ARTICLES.map(a => (
                  <tr key={a.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-2.5 font-medium">{a.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{a.ref}</td>
                    <td className="px-4 py-2.5 text-right font-medium">{fmt(a.price)} TND</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add-note dialog overlay */}
      {state.noteDialogOpen && (
        <div className="absolute inset-0 z-[5] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[440px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3 inline-flex items-center gap-2"><StickyNote className="h-4 w-4" /> Add Note</p>
            <div className="h-24 rounded-md border border-border p-3 text-sm text-foreground">Sent revised maintenance quote — follow up Monday.</div>
            <div className="flex justify-end gap-2 mt-4">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center cursor-default">Save Note</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main demo shell ────────────────────────────────────────────────────────

export function ContactsAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= CT_STEPS.length;

  const state: ContactsDemoState = useMemo(() => {
    let s = initialContactsDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, CT_STEPS.length); i++) s = CT_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = CT_STEPS[Math.min(stepIndex, CT_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, CT_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre CRM Contacts est prêt — ajoutez votre premier contact.' :
    'Your Contacts CRM is ready — add your first contact.';

  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis;
    synth.getVoices();
    const onVoices = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  useEffect(() => {
    if (!open || finished) return;
    const place = () => {
      const el = document.getElementById(step.target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 160);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.showFilters, state.showMap, state.bulkBar, state.bulkConfirm, state.createStep, state.importStep, state.noteDialogOpen, state.isSupplier]);

  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText;
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
  }, [stepIndex, open, playing, finished, muted, step, captionText, i18n.language]);

  const restart = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel();
    setStepIndex(0);
    setPlaying(true);
  }, []);
  const togglePlay = useCallback(() => setPlaying(p => !p), []);
  const jumpChapter = useCallback((start: number) => { setStepIndex(start); setPlaying(true); }, []);

  if (!open) return null;

  const activeChapter = CT_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || CT_CHAPTERS[CT_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      {/* Top bar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <Users className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Contacts CRM — Live Demo</span>
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
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'list'   && <PageList   state={state} />}
        {state.page === 'create' && <PageCreate state={state} />}
        {state.page === 'import' && <PageImport state={state} />}
        {state.page === 'detail' && <PageDetail state={state} />}
      </div>

      {/* Caption + chapters */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {CT_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer
                ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, CT_STEPS.length)} / {CT_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, CT_STEPS.length) / CT_STEPS.length) * 100}%` }} />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? finishedMsg : captionText}
        </p>
      </div>

      {/* Virtual cursor */}
      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {/* End card */}
      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">A CRM that connects everything</h3>
            <p className="text-sm text-muted-foreground mb-5">
              People · Companies · Suppliers · Map · Bulk tools · Import · 360° profiles linking offers, sales, service &amp; notes.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">
                Start building relationships
              </button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer">
                <RotateCcw className="h-3.5 w-3.5" /> Replay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
