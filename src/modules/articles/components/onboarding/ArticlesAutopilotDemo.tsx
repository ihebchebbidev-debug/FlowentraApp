import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Package, Wrench, AlertTriangle, Plus, Upload, Search, Warehouse,
  Activity, Users, Building2, TrendingUp, TrendingDown, Star, CheckCircle2,
  ArrowRightLeft, Edit, ShoppingCart, Calendar, DollarSign, ChevronRight,
  Minus, FileSpreadsheet,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  ART_STEPS, ART_CHAPTERS, initialArticlesDemoState,
  type ArticlesDemoState,
} from './articlesDemoScript';
import { pickLang, getCaption, getChapterTitle } from './articlesDemoTranslations';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Demo data ──────────────────────────────────────────────────────────────

const DEMO_ARTICLES = [
  { id: 'a1', type: 'material', name: 'Hydraulic Cylinder HY-200', sku: 'HY-200', category: 'Hydraulics',    status: 'available',    stock: 48, minStock: 10, price: 1450, location: 'Sfax Main'   },
  { id: 'a2', type: 'material', name: 'Mounting Bracket MB-45',    sku: 'MB-45',  category: 'Fasteners',     status: 'low_stock',    stock: 8,  minStock: 20, price: 210,  location: 'Sfax Main'   },
  { id: 'a3', type: 'material', name: 'Copper Pipe 15mm',          sku: 'CP-15',  category: 'Plumbing',      status: 'out_of_stock', stock: 0,  minStock: 30, price: 35,   location: 'Tunis Depot' },
  { id: 'a4', type: 'service',  name: 'On-site Installation',      sku: '—',      category: 'Field Service', status: 'active',       stock: null, minStock: null, price: 350, location: '—'         },
  { id: 'a5', type: 'service',  name: 'Annual Maintenance Plan',   sku: '—',      category: 'Maintenance',   status: 'active',       stock: null, minStock: null, price: 900, location: '—'         },
] as const;

const DEMO_SUPPLIERS = [
  { id: 's1', name: 'Hydro Parts SARL',     ref: 'HP-200-A', price: 1180, lead: 7,  moq: 5,  preferred: true,  last: '2025-05-12' },
  { id: 's2', name: 'Industrial Supply Co', ref: 'ISC-9920', price: 1240, lead: 4,  moq: 10, preferred: false, last: '2025-04-28' },
  { id: 's3', name: 'MecaPro Tunisie',      ref: 'MP-HY200', price: 1205, lead: 12, moq: 2,  preferred: false, last: '2025-03-19' },
];

const DEMO_PRICE_HISTORY = [
  { id: 'p1', old: 1150, neu: 1180, date: '2025-05-12', by: 'Ahmed B.' },
  { id: 'p2', old: 1090, neu: 1150, date: '2025-02-03', by: 'Sara M.'  },
  { id: 'p3', old: 1090, neu: 1090, date: '2024-11-20', by: 'Ahmed B.' },
];

const DEMO_ACTIVITY = [
  { id: 'ac1', date: '2025-06-05', time: '09:14', user: 'Ahmed B.', action: 'Stock In',     detail: '+40 units received — PO-2025-044', cls: 'text-green-600 bg-green-100 dark:bg-green-900/20' },
  { id: 'ac2', date: '2025-05-12', time: '14:02', user: 'Sara M.',  action: 'Price Change', detail: 'Purchase price 1,150 → 1,180 TND (+2.6%)', cls: 'text-amber-600 bg-amber-100 dark:bg-amber-900/20' },
  { id: 'ac3', date: '2025-05-03', time: '11:20', user: 'Karim T.', action: 'Stock Out',    detail: '−12 units used — Project Atlas', cls: 'text-red-600 bg-red-100 dark:bg-red-900/20' },
  { id: 'ac4', date: '2025-04-21', time: '16:45', user: 'Ahmed B.', action: 'Transfer',     detail: '15 units Sfax Main → Tunis Depot', cls: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' },
  { id: 'ac5', date: '2025-04-10', time: '08:30', user: 'Sara M.',  action: 'Edited',       detail: 'Min stock level 8 → 10', cls: 'text-muted-foreground bg-muted' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const STATUS_CLS: Record<string, string> = {
  available:    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  active:       'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  low_stock:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  out_of_stock: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  discontinued: 'bg-muted text-muted-foreground',
};
const STATUS_LABEL: Record<string, string> = {
  available: 'Available', active: 'Active', low_stock: 'Low Stock',
  out_of_stock: 'Out of Stock', discontinued: 'Discontinued',
};

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${STATUS_CLS[status] ?? 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

function StatCard({
  id, icon, label, value, highlight, clickable,
}: { id: string; icon: React.ReactNode; label: string; value: string | number; highlight?: boolean; clickable?: boolean }) {
  return (
    <div
      id={id}
      className={`bg-card border rounded-lg p-3 sm:p-4 transition-all ${clickable ? 'cursor-default' : ''} ${highlight ? 'border-destructive ring-1 ring-destructive/30 shadow-md' : 'border-border'}`}
    >
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">{icon}{label}</div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Page: Catalog list ────────────────────────────────────────────────────────

function PageList({ state }: { state: ArticlesDemoState }) {
  const rows = DEMO_ARTICLES.filter(a => {
    if (state.typeFilter !== 'all' && a.type !== state.typeFilter) return false;
    if (state.statusFilter === 'low_stock' && a.status !== 'low_stock' && a.status !== 'out_of_stock') return false;
    return true;
  });
  const materials = DEMO_ARTICLES.filter(a => a.type === 'material').length;
  const services = DEMO_ARTICLES.filter(a => a.type === 'service').length;
  const lowStock = DEMO_ARTICLES.filter(a => a.status === 'low_stock' || a.status === 'out_of_stock').length;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 id="art-demo-title" className="text-2xl font-bold text-foreground">Inventory &amp; Services</h1>
          <p className="text-sm text-muted-foreground mt-1">Your materials and services catalog</p>
        </div>
        <div className="flex gap-2">
          <div id="art-demo-import-btn" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <Upload className="h-3.5 w-3.5" /> Import
          </div>
          <div id="art-demo-add-btn" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
            <Plus className="h-3.5 w-3.5" /> Add Article
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard id="art-demo-stat-materials" icon={<Package className="h-3.5 w-3.5 text-primary" />}        label="Materials"   value={materials} />
        <StatCard id="art-demo-stat-services"  icon={<Wrench className="h-3.5 w-3.5 text-primary" />}         label="Services"    value={services} />
        <StatCard id="art-demo-stat-lowstock"  icon={<AlertTriangle className="h-3.5 w-3.5 text-destructive" />} label="Low Stock" value={lowStock} highlight={state.lowStockHighlight} clickable />
        <StatCard id="art-demo-stat-total"     icon={<Package className="h-3.5 w-3.5 text-primary" />}        label="Total Items" value={DEMO_ARTICLES.length} />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div id="art-demo-search" className={`relative flex-1 ${state.searchActive ? 'ring-1 ring-primary rounded-md' : ''}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <div className="h-9 pl-10 pr-3 rounded-md border border-border bg-background text-sm text-muted-foreground flex items-center">
            {state.searchActive ? 'cylinder' : 'Search articles…'}
          </div>
        </div>
        <div id="art-demo-type-filter" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-2 min-w-[150px] cursor-default ${state.typeFilter !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}>
          {state.typeFilter === 'material' ? 'Materials' : state.typeFilter === 'service' ? 'Services' : 'All Types'}
          <ChevronRight className="h-3.5 w-3.5 ml-auto rotate-90" />
        </div>
        <div id="art-demo-status-filter" className={`h-9 px-3 rounded-md border text-sm flex items-center gap-2 min-w-[150px] cursor-default ${state.statusFilter !== 'all' ? 'border-primary text-primary bg-primary/5' : 'border-border text-muted-foreground'}`}>
          {state.statusFilter === 'low_stock' ? 'Low Stock' : 'All Statuses'}
          <ChevronRight className="h-3.5 w-3.5 ml-auto rotate-90" />
        </div>
      </div>

      {/* Table */}
      <div id="art-demo-table" className="border border-border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border/60 bg-muted/30">
            <th className="w-8 px-3 py-2" />
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Name</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">SKU / Category</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Status</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Stock</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Price</th>
            <th className="text-left px-3 py-2 text-muted-foreground font-medium">Location</th>
            <th className="text-right px-3 py-2 text-muted-foreground font-medium">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map(a => {
              const low = a.status === 'low_stock' || a.status === 'out_of_stock';
              const showPo = state.lowStockHighlight && low;
              return (
                <tr key={a.id} className={`border-b border-border/40 last:border-0 ${showPo ? 'bg-destructive/5' : ''}`}>
                  <td className="px-3 py-2.5">
                    {a.type === 'material' ? <Package className="h-3.5 w-3.5 text-muted-foreground" /> : <Wrench className="h-3.5 w-3.5 text-muted-foreground" />}
                  </td>
                  <td className="px-3 py-2.5 font-medium text-foreground">{a.name}</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.type === 'material' ? a.sku : a.category}</td>
                  <td className="px-3 py-2.5"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2.5">
                    {a.type === 'material' ? (
                      <span className="inline-flex items-center gap-1">
                        {a.stock}
                        {low && <AlertTriangle className="h-3 w-3 text-destructive" />}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-3 py-2.5 text-right font-medium">{fmt(a.price)} TND</td>
                  <td className="px-3 py-2.5 text-muted-foreground">{a.location}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {showPo && (
                        <span id={a.id === 'a2' ? 'art-demo-create-po' : undefined} className="h-6 px-2 rounded bg-primary text-primary-foreground text-px-10 inline-flex items-center gap-1 cursor-default">
                          <ShoppingCart className="h-3 w-3" /> Create PO
                        </span>
                      )}
                      {a.type === 'material' && (
                        <span className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground inline-flex items-center cursor-default">Transfer</span>
                      )}
                      <span className="h-6 px-2 rounded border border-border text-px-10 text-muted-foreground inline-flex items-center cursor-default">Edit</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Page: Create article ──────────────────────────────────────────────────────

function FieldShell({ id, label, children, active }: { id?: string; label: string; children: React.ReactNode; active?: boolean }) {
  return (
    <div id={id} className={`rounded-md transition-all ${active ? 'ring-1 ring-primary/40 bg-primary/[0.03] p-2 -m-2' : ''}`}>
      <label className="block text-xs font-medium text-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}
const Box = ({ children, muted }: { children: React.ReactNode; muted?: boolean }) => (
  <div className={`h-9 px-3 rounded-md border border-border text-sm flex items-center ${muted ? 'text-muted-foreground' : 'text-foreground'}`}>{children}</div>
);

function PageCreate({ state }: { state: ArticlesDemoState }) {
  const isService = state.createType === 'service';
  const step = state.createStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <h1 className="text-lg font-semibold">{isService ? 'New Service' : 'New Material'}</h1>
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-5">
        {/* Type toggle */}
        <div id="art-demo-create-type">
          <label className="block text-xs font-medium text-foreground mb-1.5">Article Type</label>
          <div className="inline-flex rounded-md border border-border overflow-hidden">
            <span className={`px-4 py-1.5 text-sm inline-flex items-center gap-1.5 cursor-default ${!isService ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Package className="h-3.5 w-3.5" /> Material
            </span>
            <span className={`px-4 py-1.5 text-sm inline-flex items-center gap-1.5 cursor-default ${isService ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
              <Wrench className="h-3.5 w-3.5" /> Service
            </span>
          </div>
        </div>

        {/* Identity */}
        <div id="art-demo-create-identity" className={`grid grid-cols-3 gap-4 transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <FieldShell label="Name *"><Box muted={step < 1}>{step >= 1 ? (isService ? 'On-site Installation' : 'Hydraulic Cylinder HY-200') : '—'}</Box></FieldShell>
          <FieldShell label={isService ? 'Code' : 'SKU'}><Box muted={step < 1}>{step >= 1 ? (isService ? 'SVC-INST' : 'HY-200') : '—'}</Box></FieldShell>
          <FieldShell label="Category"><Box muted={step < 1}>{step >= 1 ? (isService ? 'Field Service' : 'Hydraulics') : '—'}</Box></FieldShell>
        </div>

        {!isService ? (
          <>
            {/* Stock */}
            <div id="art-demo-create-stock" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
              <FieldShell label="Opening Stock" active={step === 2}><Box muted={step < 2}>{step >= 2 ? '48' : '0'}</Box></FieldShell>
              <FieldShell label="Minimum Level" active={step === 2}><Box muted={step < 2}>{step >= 2 ? '10' : '0'}</Box></FieldShell>
            </div>
            {/* Pricing */}
            <div id="art-demo-create-pricing" className={`grid grid-cols-3 gap-4 transition-opacity ${step >= 3 ? '' : 'opacity-40'}`}>
              <FieldShell label="Cost Price" active={step === 3}><Box muted={step < 3}>{step >= 3 ? '1,200 TND' : '—'}</Box></FieldShell>
              <FieldShell label="Sell Price" active={step === 3}><Box muted={step < 3}>{step >= 3 ? '1,450 TND' : '—'}</Box></FieldShell>
              <FieldShell label="Margin">
                <div className="h-9 px-3 rounded-md border border-green-500/30 bg-green-500/5 text-sm flex items-center text-green-600 font-medium">
                  {step >= 3 ? '+250 TND · 20.8%' : '—'}
                </div>
              </FieldShell>
            </div>
            {/* Location */}
            <div id="art-demo-create-location" className={`grid grid-cols-2 gap-4 transition-opacity ${step >= 4 ? '' : 'opacity-40'}`}>
              <FieldShell label="Default Supplier" active={step === 4}><Box muted={step < 4}>{step >= 4 ? 'Hydro Parts SARL' : 'Select…'}</Box></FieldShell>
              <FieldShell label="Storage Location" active={step === 4}><Box muted={step < 4}>{step >= 4 ? 'Sfax Main Warehouse' : 'Select…'}</Box></FieldShell>
            </div>
          </>
        ) : (
          /* Service fields */
          <div id="art-demo-create-service-fields" className={`space-y-4 transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
            <div className="grid grid-cols-2 gap-4">
              <FieldShell label="Base Price" active={step === 2}><Box muted={step < 2}>{step >= 2 ? '350 TND' : '—'}</Box></FieldShell>
              <FieldShell label="Duration (min)" active={step === 2}><Box muted={step < 2}>{step >= 2 ? '120' : '—'}</Box></FieldShell>
            </div>
            <FieldShell label="Required Skills">
              <div className="flex gap-1.5">
                {step >= 2 ? ['Hydraulics', 'Certified Installer'].map(s => (
                  <span key={s} className="h-6 px-2 rounded-full bg-primary/10 text-primary text-px-10 inline-flex items-center">{s}</span>
                )) : <Box muted>—</Box>}
              </div>
            </FieldShell>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
        <div id="art-demo-create-save" className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium flex items-center cursor-default">
          Save {isService ? 'Service' : 'Material'}
        </div>
      </div>
    </div>
  );
}

// ─── Page: Bulk import ─────────────────────────────────────────────────────────

function PageImport({ state }: { state: ArticlesDemoState }) {
  const step = state.importStep;
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
        <h1 className="text-lg font-semibold">Import Articles</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 text-px-11">
        {['Upload', 'Mapping', 'Validation', 'Confirm'].map((s, i) => (
          <div key={s} className="flex items-center gap-0">
            <span className={`px-2.5 py-1 rounded-full font-medium ${i <= step ? 'bg-primary/10 text-primary' : 'text-muted-foreground'}`}>{s}</span>
            {i < 3 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />}
          </div>
        ))}
      </div>

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        {/* Template / upload */}
        <div id="art-demo-import-template" className="flex items-center gap-3 p-3 rounded-lg border border-dashed border-border bg-muted/20">
          <FileSpreadsheet className="h-8 w-8 text-green-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">articles-import.xlsx</p>
            <p className="text-px-11 text-muted-foreground">128 rows · columns: name, sku, type, category, stock, minStock, costPrice, sellPrice, supplier, location</p>
          </div>
          <span className="h-7 px-2.5 rounded-md border border-border text-px-11 text-muted-foreground inline-flex items-center gap-1 cursor-default">
            <Upload className="h-3 w-3" /> Template
          </span>
        </div>

        {/* Mapping */}
        <div id="art-demo-import-mapping" className={`transition-opacity ${step >= 1 ? '' : 'opacity-40'}`}>
          <p className="text-xs font-medium mb-2">Column mapping &amp; normalisation</p>
          <div className="border border-border rounded-md overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/40 border-b border-border">
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Spreadsheet column</th>
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Mapped field</th>
                <th className="text-left px-3 py-1.5 text-muted-foreground font-medium">Normalised</th>
              </tr></thead>
              <tbody>
                {[
                  ['Désignation', 'name', '—'],
                  ['Type', 'type', '"matériel" → Material'],
                  ['Prix vente', 'sellPrice', '"1 450,000" → 1450'],
                ].map(r => (
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

        {/* Validation */}
        <div id="art-demo-import-validation" className={`grid grid-cols-3 gap-3 transition-opacity ${step >= 2 ? '' : 'opacity-40'}`}>
          <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3 text-center">
            <p className="text-lg font-bold text-green-600">{step >= 2 ? '124' : '—'}</p>
            <p className="text-px-11 text-muted-foreground">Valid rows</p>
          </div>
          <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-center">
            <p className="text-lg font-bold text-amber-600">{step >= 2 ? '3' : '—'}</p>
            <p className="text-px-11 text-muted-foreground">Warnings</p>
          </div>
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-center">
            <p className="text-lg font-bold text-red-600">{step >= 2 ? '1' : '—'}</p>
            <p className="text-px-11 text-muted-foreground">Errors (skipped)</p>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <div className="h-9 px-4 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
        <div id="art-demo-import-confirm" className={`h-9 px-4 rounded-md text-sm font-medium flex items-center cursor-default ${step >= 3 ? 'bg-primary text-primary-foreground' : 'bg-primary/40 text-primary-foreground'}`}>
          Import 124 articles
        </div>
      </div>
    </div>
  );
}

// ─── Page: Article detail ──────────────────────────────────────────────────────

function PageDetail({ state }: { state: ArticlesDemoState }) {
  const A = DEMO_ARTICLES[0]; // Hydraulic Cylinder
  const maxStock = 60;
  const pct = Math.min((A.stock! / maxStock) * 100, 100);
  const tabs = [
    { key: 'overview',  label: 'Overview',  icon: Package,  id: undefined as string | undefined },
    { key: 'inventory', label: 'Inventory', icon: Warehouse, id: 'art-demo-tab-inventory' },
    { key: 'activity',  label: 'Activity',  icon: Activity,  id: 'art-demo-tab-activity' },
    { key: 'suppliers', label: 'Suppliers', icon: Users,     id: 'art-demo-tab-suppliers' },
  ];

  return (
    <div className="flex flex-col max-w-5xl mx-auto w-full relative">
      {/* Header */}
      <div id="art-demo-detail-header" className="flex items-start justify-between gap-4 px-4 py-4 border-b border-border/60">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 rounded border border-border flex items-center justify-center text-muted-foreground text-xs cursor-default">←</div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold">{A.name}</h1>
              <StatusBadge status={A.status} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">SKU {A.sku} · {A.category} · {A.location}</p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div id="art-demo-transfer" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <ArrowRightLeft className="h-3.5 w-3.5" /> Transfer
          </div>
          <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <Edit className="h-3.5 w-3.5" /> Edit
          </div>
        </div>
      </div>

      {/* Status cards */}
      <div id="art-demo-status-cards" className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 py-3 border-b border-border/60">
        {[
          { label: 'Current Stock', value: `${A.stock} / ${maxStock}`, icon: <Warehouse className="h-3.5 w-3.5 text-primary" /> },
          { label: 'Stock Value',   value: `${fmt(A.stock! * 1200)} TND`, icon: <DollarSign className="h-3.5 w-3.5 text-primary" /> },
          { label: 'Sell Price',    value: `${fmt(A.price)} TND`, icon: <DollarSign className="h-3.5 w-3.5 text-green-600" /> },
          { label: 'Status',        value: 'Available', icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> },
        ].map(c => (
          <div key={c.label} className="bg-card border border-border rounded-lg p-2.5">
            <div className="flex items-center gap-1.5 text-muted-foreground text-px-10 font-medium">{c.icon}{c.label}</div>
            <p className="text-sm font-bold text-foreground mt-0.5">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-border/60 px-4">
        <div className="flex gap-1 -mb-px">
          {tabs.map(tab => (
            <div key={tab.key} id={tab.id}
              className={`inline-flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors cursor-default
                ${state.activeTab === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
              <tab.icon className="h-3.5 w-3.5" /> {tab.label}
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="p-4 space-y-4">
        {state.activeTab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div id="art-demo-overview-pricing" className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-2">Pricing &amp; Margin</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Cost price</span><span>1,200 TND</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Sell price</span><span>1,450 TND</span></div>
              <div className="flex justify-between font-medium border-t border-border pt-2"><span>Margin</span><span className="text-green-600">+250 TND · 20.8%</span></div>
            </div>
            <div id="art-demo-overview-info" className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-2">Details</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>Hydraulics</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Location</span><span>Sfax Main Warehouse</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Preferred supplier</span><span>Hydro Parts SARL</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Unit</span><span>piece</span></div>
            </div>
          </div>
        )}

        {state.activeTab === 'inventory' && (
          <div className="grid md:grid-cols-3 gap-4">
            <div id="art-demo-stock-levels" className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-3">Stock Levels</p>
              <div className="flex justify-between text-xs mb-1"><span>Current</span><span className="font-semibold">{A.stock}/{maxStock}</span></div>
              <div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full bg-green-500" style={{ width: `${pct}%` }} /></div>
              <div className="flex justify-between text-px-10 text-muted-foreground mt-1"><span>Min: {A.minStock}</span><span>Max: {maxStock}</span></div>
            </div>
            <div id="art-demo-reorder" className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="text-sm font-medium mb-2">Reorder Information</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Reorder point</span><span className="font-semibold">10 units</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Suggested order</span><span className="font-semibold">{maxStock - A.stock!} units</span></div>
              <div className="h-8 mt-2 rounded-md border border-border text-px-11 flex items-center justify-center text-muted-foreground cursor-default">Create Purchase Order</div>
            </div>
            <div id="art-demo-quick-actions" className="bg-card border border-border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium mb-1">Quick Actions</p>
              <div id="art-demo-add-stock" className="h-8 rounded-md border border-border text-xs flex items-center px-3 text-foreground cursor-default gap-1.5"><Plus className="h-3.5 w-3.5 text-green-600" /> Add Stock</div>
              <div id="art-demo-remove-stock" className="h-8 rounded-md border border-border text-xs flex items-center px-3 text-foreground cursor-default gap-1.5"><Minus className="h-3.5 w-3.5 text-red-600" /> Remove Stock</div>
              <div className="h-8 rounded-md border border-border text-xs flex items-center px-3 text-muted-foreground cursor-default gap-1.5"><Edit className="h-3.5 w-3.5" /> Edit Details</div>
            </div>
          </div>
        )}

        {state.activeTab === 'suppliers' && (
          <div className="space-y-4">
            <div id="art-demo-suppliers-table" className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/60">
                <span className="text-sm font-medium inline-flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Linked Suppliers</span>
                <span id="art-demo-add-supplier" className="h-7 px-2.5 rounded-md border border-border text-px-11 text-muted-foreground inline-flex items-center gap-1 cursor-default"><Plus className="h-3 w-3" /> Add Supplier</span>
              </div>
              <table className="w-full text-xs">
                <thead><tr className="bg-muted/30 border-b border-border/60">
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Supplier</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Ref</th>
                  <th className="text-right px-3 py-2 text-muted-foreground font-medium">Price</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Lead</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">MOQ</th>
                  <th className="text-center px-3 py-2 text-muted-foreground font-medium">Preferred</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Last delivery</th>
                </tr></thead>
                <tbody>
                  {DEMO_SUPPLIERS.map(s => (
                    <tr key={s.id} id={s.preferred ? 'art-demo-supplier-preferred' : undefined} className={`border-b border-border/40 last:border-0 ${s.preferred ? 'bg-primary/5' : ''}`}>
                      <td className="px-3 py-2.5"><span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 text-muted-foreground" />{s.name}</span></td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.ref}</td>
                      <td className="px-3 py-2.5 text-right font-medium">{fmt(s.price)} TND</td>
                      <td className="px-3 py-2.5 text-center">{s.lead}d</td>
                      <td className="px-3 py-2.5 text-center">{s.moq}</td>
                      <td className="px-3 py-2.5 text-center">
                        {s.preferred ? <span className="inline-flex items-center gap-1 text-primary text-px-10 font-medium"><Star className="h-3 w-3 fill-current" /> Preferred</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                      <td className="px-3 py-2.5 text-muted-foreground">{s.last}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div id="art-demo-price-history" className="bg-card border border-border rounded-lg p-4">
              <p className="text-sm font-medium mb-3 inline-flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" /> Price History</p>
              <div className="space-y-2">
                {DEMO_PRICE_HISTORY.map(p => {
                  const diff = p.neu - p.old;
                  const pctc = p.old ? ((diff / p.old) * 100).toFixed(1) : '0.0';
                  const up = diff > 0;
                  return (
                    <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/40 border border-border/60">
                      <div className="flex items-center gap-2.5">
                        <span className={`p-1.5 rounded-full ${up ? 'bg-destructive/10' : diff < 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                          {up ? <TrendingUp className="h-3.5 w-3.5 text-destructive" /> : diff < 0 ? <TrendingDown className="h-3.5 w-3.5 text-green-600" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                        </span>
                        <div>
                          <span className="text-xs font-medium">{fmt(p.old)} → {fmt(p.neu)} TND</span>
                          <span className={`ml-2 text-px-10 ${up ? 'text-destructive' : 'text-green-600'}`}>{up ? '+' : ''}{pctc}%</span>
                          <div className="text-px-10 text-muted-foreground inline-flex items-center gap-1 ml-0 mt-0.5"><Calendar className="h-2.5 w-2.5" /> {p.date} · {p.by}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {state.activeTab === 'activity' && (
          <div id="art-demo-activity-log" className="space-y-2">
            {DEMO_ACTIVITY.map(a => (
              <div key={a.id} className="flex items-start gap-3 p-3 bg-card border border-border rounded-lg">
                <span className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 text-px-10 font-bold ${a.cls}`}>{a.action.slice(0, 1)}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{a.action} <span className="font-normal text-muted-foreground">· {a.user}</span></p>
                  <p className="text-px-11 text-muted-foreground mt-0.5">{a.detail}</p>
                  <p className="text-px-10 text-muted-foreground/60 mt-0.5">{a.date} at {a.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction dialog overlay */}
      {state.txDialog !== 'none' && (
        <div className="absolute inset-0 z-[5] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3">
              {state.txDialog === 'add' ? 'Add Stock' : state.txDialog === 'remove' ? 'Remove Stock' : 'Transfer Stock'}
            </p>
            <div className="space-y-3">
              {state.txDialog === 'transfer' && (
                <div className="grid grid-cols-2 gap-3">
                  <FieldShell label="From"><Box>Sfax Main</Box></FieldShell>
                  <FieldShell label="To"><Box>Tunis Depot</Box></FieldShell>
                </div>
              )}
              <FieldShell label="Quantity"><Box>{state.txDialog === 'remove' ? '12' : state.txDialog === 'transfer' ? '15' : '40'}</Box></FieldShell>
              <FieldShell label="Reason">
                <Box>{state.txDialog === 'add' ? 'New purchase' : state.txDialog === 'remove' ? 'Used in project' : 'Rebalance warehouses'}</Box>
              </FieldShell>
              <FieldShell label="Reference (optional)"><Box muted>PO-2025-044</Box></FieldShell>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div>
              <div className={`h-8 px-3 rounded-md text-xs font-medium flex items-center cursor-default ${state.txDialog === 'remove' ? 'bg-destructive text-destructive-foreground' : 'bg-primary text-primary-foreground'}`}>
                {state.txDialog === 'transfer' ? 'Confirm Transfer' : state.txDialog === 'remove' ? 'Remove Stock' : 'Add Stock'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add-supplier dialog overlay */}
      {state.supplierDialogOpen && (
        <div className="absolute inset-0 z-[5] flex items-start justify-center pt-10 bg-background/40">
          <div className="w-[420px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold mb-3">Link a Supplier</p>
            <div className="space-y-3">
              <FieldShell label="Supplier"><Box>Industrial Supply Co</Box></FieldShell>
              <FieldShell label="Supplier reference"><Box>ISC-9920</Box></FieldShell>
              <div className="grid grid-cols-3 gap-2">
                <FieldShell label="Price"><Box>1,240</Box></FieldShell>
                <FieldShell label="Lead (d)"><Box>4</Box></FieldShell>
                <FieldShell label="MOQ"><Box>10</Box></FieldShell>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 rounded border border-border bg-background inline-block" />
                <span className="text-xs text-muted-foreground">Mark as preferred supplier</span>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <div className="h-8 px-3 rounded-md border border-border text-xs flex items-center text-muted-foreground cursor-default">Cancel</div>
              <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium flex items-center cursor-default">Add Supplier</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main demo shell ───────────────────────────────────────────────────────────

export function ArticlesAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= ART_STEPS.length;

  const state: ArticlesDemoState = useMemo(() => {
    let s = initialArticlesDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, ART_STEPS.length); i++) s = ART_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = ART_STEPS[Math.min(stepIndex, ART_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, ART_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre catalogue Inventaire & Services est prêt — ajoutez votre premier article.' :
    'Your Inventory & Services catalog is ready — add your first article.';

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

  // Virtual cursor placement
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
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.createStep, state.importStep, state.txDialog, state.supplierDialogOpen]);

  // Narration + auto-advance
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

  const activeChapter = ART_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || ART_CHAPTERS[ART_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      {/* Top bar */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <Package className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">Inventory &amp; Services — Live Demo</span>
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
          {ART_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer
                ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, ART_STEPS.length)} / {ART_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, ART_STEPS.length) / ART_STEPS.length) * 100}%` }} />
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
              <Package className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">One catalog for materials &amp; services</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Live stock · Low-stock alerts · Bulk import · Multi-supplier sourcing · Transfers · Full audit trail — all connected.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">
                Start building your catalog
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
