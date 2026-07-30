import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Settings2, User, Building2, Lock, Palette, CreditCard, WifiOff, Sliders,
  Upload, Save, Eye, ExternalLink, ChevronDown, Check, CheckCircle2,
  Sun, Moon, Monitor, Sidebar as SidebarIcon, Layout, Table as TableIcon, List,
  FileText, ShoppingCart, Wrench, Truck, Handshake, Receipt, Hash, Info,
  Loader2, RefreshCw, ShieldCheck, Search, Lock as LockIcon, ShoppingCart as Cart,
  MinusCircle, Layers, Plus, Pencil, Power, Send, Users, Package,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  SET_STEPS, SET_CHAPTERS, initialSettingsDemoState,
  type SettingsDemoState, type SettingsSection,
} from './settingsDemoScript';
import { pickLang, getCaption, getChapterTitle } from './settingsDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

// ─── Sidebar (mirrors real SettingsPage.tsx nav 1:1) ─────────────────────────
const PERSONAL: { id: SettingsSection; label: string; icon: any; navId: string }[] = [
  { id: 'profile',  label: 'Profile',  icon: User, navId: 'set-demo-nav-profile' },
  { id: 'security', label: 'Security', icon: Lock, navId: 'set-demo-nav-security' },
];
const GENERAL: { id: SettingsSection; label: string; icon: any; navId: string }[] = [
  { id: 'company',      label: 'Company & preferences', icon: Building2,  navId: 'set-demo-nav-company' },
  { id: 'subscription', label: 'Tenants subscription',  icon: CreditCard, navId: 'set-demo-nav-subscription' },
  { id: 'companies',    label: 'Companies',             icon: Layers,     navId: 'set-demo-nav-companies' },
  { id: 'offline',      label: 'Offline sync',          icon: WifiOff,    navId: 'set-demo-nav-offline' },
  { id: 'system',       label: 'System configuration',  icon: Sliders,    navId: 'set-demo-nav-system' },
];

// ─── Real subscription plans (from subscriptionApi mocked structure) ─────────
const PLANS = [
  { key: 'starter',  name: 'Starter',  price: 0,   desc: 'For solo pros getting started' },
  { key: 'growth',   name: 'Growth',   price: 45,  desc: 'Growing field service teams' },
  { key: 'business', name: 'Business', price: 89,  desc: 'Full-featured for larger crews', current: true },
];
const INVOICES = [
  { num: 'INV-2026-000042', date: 'Jun 01, 2026', amount: '1 335 TND', status: 'paid'    },
  { num: 'INV-2026-000031', date: 'May 01, 2026', amount: '1 335 TND', status: 'paid'    },
  { num: 'INV-2026-000020', date: 'Apr 01, 2026', amount: '1 335 TND', status: 'paid'    },
  { num: 'INV-2026-000009', date: 'Mar 01, 2026', amount: '1 335 TND', status: 'pending' },
];

// ─── Activated modules (mirrors ActivatedModulesSection) ────────────────────
const MODULES = [
  { name: 'Contacts',        code: 'core.contacts',    icon: Users,       on: true,  core: true  },
  { name: 'Articles',        code: 'core.articles',    icon: Package,     on: true,  core: true  },
  { name: 'Offers',          code: 'sales.offers',     icon: FileText,    on: true,  core: false },
  { name: 'Sales',           code: 'sales.orders',     icon: ShoppingCart,on: true,  core: false },
  { name: 'Service Orders',  code: 'field.serviceord', icon: Wrench,      on: true,  core: false },
  { name: 'Dispatches',      code: 'field.dispatch',   icon: Truck,       on: true,  core: false },
  { name: 'HR',              code: 'hr.core',          icon: Users,       on: false, core: false },
  { name: 'Payments',        code: 'fin.payments',     icon: Receipt,     on: false, core: false },
];

// ─── Companies (mirrors TenantManagement) ───────────────────────────────────
const COMPANIES = [
  { name: 'SolarTech SARL',    slug: 'solartech', email: 'contact@solartech.tn', users: 15, active: true  },
  { name: 'SolarTech Sud',     slug: 'solar-sud', email: 'sud@solartech.tn',     users: 6,  active: true  },
  { name: 'Krossier Services', slug: 'krossier',  email: 'hello@krossier.io',    users: 9,  active: true  },
  { name: 'Legacy Branch',     slug: 'legacy',    email: 'old@solartech.tn',     users: 0,  active: false },
];
const SCOPES = [
  { key: 'contacts',  label: 'Contacts',  scope: 'shared'      },
  { key: 'articles',  label: 'Articles',  scope: 'shared'      },
  { key: 'offers',    label: 'Offers',    scope: 'per_company' },
  { key: 'sales',     label: 'Sales',     scope: 'per_company' },
  { key: 'purchases', label: 'Purchases', scope: 'per_company' },
  { key: 'hr',        label: 'HR',        scope: 'per_company' },
];

// ─── Offline hydration modules (mirrors HYDRATION_MODULES) ───────────────────
const HYDRATION = [
  'Contacts', 'Articles', 'Offers', 'Sales', 'Service Orders',
  'Dispatches', 'Installations', 'Time Tracking', 'Inventory', 'Deals',
];

// ─── Numbering entities (mirrors NumberingSettings ENTITIES) ─────────────────
const NUMBERING: { key: string; label: string; icon: any; example: string; template: string }[] = [
  { key: 'Offer',        label: 'Offers',         icon: FileText,     example: 'OFR-2026-000001',       template: 'OFR-{YEAR}-{SEQ:6}' },
  { key: 'Sale',         label: 'Sales',          icon: ShoppingCart, example: 'ORD-20260727-A1B2C',    template: 'ORD-{DATE:yyyyMMdd}-{GUID:5}' },
  { key: 'ServiceOrder', label: 'Service Orders', icon: Wrench,       example: 'SO-20260727-A1B2C3',    template: 'SO-{DATE:yyyyMMdd}-{GUID:6}' },
  { key: 'Dispatch',     label: 'Dispatches',     icon: Truck,        example: 'DISP-20260727143022',   template: 'DISP-{TS:yyyyMMddHHmmss}' },
  { key: 'Deal',         label: 'Deals',          icon: Handshake,    example: 'DEAL-2026-00001',       template: 'DEAL-{YEAR}-{SEQ:5}' },
  { key: 'Invoice',      label: 'Invoices',       icon: Receipt,      example: 'INV-2026-000001',       template: 'INV-{YEAR}-{SEQ:6}' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function NavRow({ item, active }: { item: any; active: boolean }) {
  const Icon = item.icon;
  return (
    <div id={item.navId} className={`flex items-center gap-2.5 px-3 py-1.5 text-xs ${active ? 'bg-primary/10 border-l-2 border-l-primary' : 'border-l-2 border-l-transparent'}`}>
      <Icon className={`h-3.5 w-3.5 shrink-0 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
      <span className={active ? 'text-primary font-medium' : 'text-muted-foreground'}>{item.label}</span>
    </div>
  );
}
function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-px-11 text-muted-foreground mb-1">{label}</label>
      <div className={`h-9 px-3 rounded-md border text-sm flex items-center ${value ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>{value || '…'}</div>
    </div>
  );
}
function Panel({ icon: Icon, title, desc, children, id }: { icon: any; title: string; desc?: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} className="border border-border rounded-lg bg-card shadow-card">
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{title}</span></div>
        {desc && <p className="text-px-11 text-muted-foreground mt-0.5">{desc}</p>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

// ─── Panels (each mirrors the REAL matching settings component) ──────────────

function ProfilePanel() {
  return (
    <Panel icon={User} title="Profile" desc="Update your personal information" id="set-demo-profile">
      <div className="flex items-center gap-4 mb-4">
        <span className="h-16 w-16 rounded-full bg-gradient-to-br from-primary to-primary/60 text-primary-foreground flex items-center justify-center text-lg font-semibold">AC</span>
        <div className="h-8 px-3 rounded-md border border-border text-px-11 inline-flex items-center gap-1.5 text-muted-foreground"><Upload className="h-3.5 w-3.5" /> Change photo</div>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <Field label="First name" value="Amine" /><Field label="Last name" value="Chebbi" />
      </div>
      <div className="mt-3 text-xs"><Field label="Email" value="amine@solartech.tn" /></div>
      <div className="grid grid-cols-2 gap-3 text-xs mt-3">
        <Field label="Phone" value="+216 22 345 678" /><Field label="Company" value="SolarTech SARL" />
      </div>
      <div className="flex justify-end mt-4"><div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center cursor-default">Update Profile</div></div>
    </Panel>
  );
}

function SecurityPanel() {
  return (
    <Panel icon={Lock} title="Security" desc="Change your password">
      <div className="space-y-3 text-xs max-w-md">
        <div>
          <label className="block text-px-11 text-muted-foreground mb-1">Current password</label>
          <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-muted-foreground">•••••••• <Eye className="h-3.5 w-3.5" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="block text-px-11 text-muted-foreground mb-1">New password</label><div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-muted-foreground">•••••••• <Eye className="h-3.5 w-3.5" /></div></div>
          <div><label className="block text-px-11 text-muted-foreground mb-1">Confirm password</label><div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-muted-foreground">•••••••• <Eye className="h-3.5 w-3.5" /></div></div>
        </div>
        <div className="flex justify-end pt-1"><div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center cursor-default">Change Password</div></div>
      </div>
    </Panel>
  );
}

function TwoFactorPanel({ state }: { state: SettingsDemoState }) {
  const on = state.twoFactor;
  return (
    <Panel icon={ShieldCheck} title="Two-factor authentication" desc="Extra protection on every sign-in" id="set-demo-security-2fa">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium">Require a one-time code by email</p>
          <p className="text-px-10 text-muted-foreground mt-0.5">When enabled, a 6-digit code is emailed at each login before access is granted.</p>
        </div>
        <span className={`h-5 w-9 rounded-full p-0.5 shrink-0 flex ${on ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
          <span className="h-4 w-4 rounded-full bg-background shadow-sm" />
        </span>
      </div>
      {on && (
        <div className="mt-3 rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-primary" />
          <span className="text-px-10 text-muted-foreground">Two-factor authentication enabled for your account.</span>
        </div>
      )}
    </Panel>
  );
}

function CompanyAndPreferencesPanel({ state }: { state: SettingsDemoState }) {
  const dark = state.prefTheme === 'dark';
  const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-indigo-500'];
  return (
    <div className="space-y-4">
      <Panel icon={Building2} title="Company" desc="Your brand across the app and PDF reports">
        <div className="mb-4">
          <label className="block text-px-11 text-muted-foreground mb-2">Company logo — appears in sidebar, header, login page & PDF reports</label>
          <div className="flex items-center gap-4">
            <span className="h-20 w-20 rounded-xl border-2 border-dashed border-border bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center"><Building2 className="h-7 w-7" /></span>
            <div className="space-y-1.5"><div className="h-8 px-3 rounded-md border border-border text-px-11 inline-flex items-center gap-1.5 text-muted-foreground"><Upload className="h-3.5 w-3.5" /> Upload Logo</div><p className="text-px-10 text-muted-foreground">PNG, JPG, SVG — max 5MB</p></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <Field label="Company name *" value="SolarTech SARL" />
          <div>
            <label className="block text-px-11 text-muted-foreground mb-1">Website</label>
            <div className="flex gap-1.5"><div className="flex-1 h-9 px-3 rounded-md border border-primary text-sm flex items-center">solartech.tn</div><span className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground"><ExternalLink className="h-3.5 w-3.5" /></span></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs mt-3"><Field label="Phone" value="+216 74 200 100" /><div /></div>
        <div className="mt-4"><div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Save className="h-3.5 w-3.5" /> Save Changes</div></div>
      </Panel>

      <Panel icon={Building2} title="Bank details & report footer" desc="These details print at the bottom of this company’s reports and PDFs" id="set-demo-company-bank">
        <p className="text-xs font-medium mb-2">Bank details</p>
        <div className="grid grid-cols-3 gap-3 text-xs">
          <Field label="Bank name" value="Banque de Tunisie" />
          <Field label="Account / IBAN" value="TN59 1000 6035 1835 9847 8831" />
          <Field label="SWIFT / BIC" value="BTBKTNTT" />
        </div>
        <p className="text-xs font-medium mt-4 mb-2">Report footer</p>
        <div>
          <label className="block text-px-11 text-muted-foreground mb-1">Footer message</label>
          <div className="min-h-[3.5rem] px-3 py-2 rounded-md border border-primary text-sm">Thank you for your business — payment due within 30 days.</div>
        </div>
        <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3">
          <p className="text-px-10 font-medium text-muted-foreground mb-1">Footer preview</p>
          <p className="text-px-10">SolarTech SARL</p>
          <p className="text-px-10 text-muted-foreground">Route de Gabès km 3, 3003 Sfax, Tunisia · +216 74 200 100 · solartech.tn</p>
          <p className="text-px-10 text-muted-foreground">Bank: Banque de Tunisie · IBAN TN59 1000 6035 1835 9847 8831 · SWIFT BTBKTNTT</p>
          <p className="text-px-10 text-muted-foreground">Thank you for your business — payment due within 30 days.</p>
        </div>
      </Panel>

      <Panel icon={Palette} title="Preferences" desc="Personalize how the app looks and behaves — auto-saved">
        <div id="set-demo-pref-theme" className="mb-4">
          <p className="text-px-11 text-muted-foreground mb-1.5">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {[['Light', Sun, !dark], ['Dark', Moon, dark], ['System', Monitor, false]].map(([l, Ic, sel]: any) => (
              <div key={l} className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${sel ? 'border-primary bg-primary/10' : 'border-border'}`}><Ic className={`h-4 w-4 ${sel ? 'text-primary' : ''}`} /><span className={`text-px-10 ${sel ? 'text-primary font-medium' : ''}`}>{l}</span></div>
            ))}
          </div>
        </div>
        <div id="set-demo-pref-color" className="mb-4">
          <p className="text-px-11 text-muted-foreground mb-1.5">Primary color</p>
          <div className="flex gap-2.5">
            {colors.map((c, i) => (
              <span key={c} className={`h-9 w-9 rounded-full ${c} ring-2 ring-offset-2 ring-offset-background transition-transform ${
                state.prefColorPicked ? (i === 3 ? 'ring-primary scale-110' : 'ring-transparent')
                                      : (i === 0 ? 'ring-primary scale-110' : 'ring-transparent')
              }`} />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-px-11 text-muted-foreground mb-1.5">Language</p>
            <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between">Français <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
          </div>
          <div>
            <p className="text-px-11 text-muted-foreground mb-1.5">Navigation</p>
            <div className="grid grid-cols-2 gap-1.5">
              {[['Sidebar', SidebarIcon, true], ['Top bar', Layout, false]].map(([l, Ic, sel]: any) => (
                <div key={l} className={`h-9 flex items-center justify-center gap-1.5 rounded-md border ${sel ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground'}`}><Ic className="h-3.5 w-3.5" /><span className="text-px-10 font-medium">{l}</span></div>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="text-px-11 text-muted-foreground mb-1.5">Data view</p>
          <div className="grid grid-cols-2 gap-2">
            {[['Table', TableIcon, true], ['List', List, false]].map(([l, Ic, sel]: any) => (
              <div key={l} className={`flex items-center gap-2.5 p-2.5 rounded-md border ${sel ? 'border-primary bg-primary/10' : 'border-border'}`}><Ic className={`h-4 w-4 ${sel ? 'text-primary' : ''}`} /><span className={`text-xs font-medium ${sel ? 'text-primary' : ''}`}>{l}</span></div>
            ))}
          </div>
        </div>
      </Panel>
    </div>
  );
}

function SubscriptionPanel({ state }: { state: SettingsDemoState }) {
  return (
    <div className="space-y-4">
      <Panel icon={CreditCard} title="Current plan" desc="Your active tenant subscription">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-semibold">Business</p>
            <p className="text-px-11 text-muted-foreground">Full-featured for larger crews</p>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold">89 TND</span>
            <span className="block text-px-10 text-muted-foreground">/ seat / month</span>
          </div>
        </div>
        <div className="border-t border-border pt-3 space-y-1.5 text-xs">
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-px-10 font-medium"><CheckCircle2 className="h-3 w-3" /> Active</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Billing interval</span><span className="font-medium">Monthly</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-medium">15</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Renewal date</span><span className="font-medium">Aug 1, 2026</span></div>
        </div>
        <div id="set-demo-sub-plans" className="flex flex-wrap gap-2 mt-4">
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default">Switch to yearly</div>
          <div className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 cursor-default ${state.showPlans ? 'bg-primary text-primary-foreground' : 'border border-border text-foreground'}`}>Change plan</div>
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default"><ExternalLink className="h-3 w-3" /> Billing portal</div>
          <div className="h-8 px-3 rounded-md border border-destructive/40 text-xs inline-flex items-center gap-1.5 text-destructive cursor-default">Cancel</div>
        </div>
      </Panel>

      {state.showPlans && (
        <Panel icon={CreditCard} title="Available plans" desc="Pick the plan that fits your team">
          <div className="grid grid-cols-3 gap-2.5">
            {PLANS.map((p) => {
              const highlighted = state.planPicked ? p.key === 'growth' : !!p.current;
              return (
                <div key={p.key} className={`rounded-lg border p-3 ${highlighted ? 'border-primary bg-primary/5' : 'border-border'}`}>
                  <p className="text-xs font-semibold">{p.name}</p>
                  <p className="text-px-10 text-muted-foreground mb-2">{p.desc}</p>
                  <p className="text-sm font-semibold">{p.price === 0 ? 'Free' : `${p.price} TND`}</p>
                  <p className="text-px-10 text-muted-foreground">{p.price === 0 ? '' : '/ seat / month'}</p>
                  <div className={`mt-2 h-7 rounded-md text-px-10 font-medium inline-flex items-center justify-center w-full ${highlighted ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>{highlighted ? 'Selected' : 'Switch'}</div>
                </div>
              );
            })}
          </div>
        </Panel>
      )}

      <Panel icon={Receipt} title="Billing history" desc="Recent invoices" id="set-demo-sub-invoices">
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground uppercase tracking-wide text-px-10">
                <th className="text-left font-medium px-3 py-2">Invoice</th>
                <th className="text-left font-medium px-3 py-2">Date</th>
                <th className="text-left font-medium px-3 py-2">Amount</th>
                <th className="text-left font-medium px-3 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.num} className="border-b border-border/40 last:border-0">
                  <td className="px-3 py-2 font-mono">{inv.num}</td>
                  <td className="px-3 py-2 text-muted-foreground">{inv.date}</td>
                  <td className="px-3 py-2 font-medium">{inv.amount}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${
                      inv.status === 'paid'    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                      inv.status === 'pending' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                 'bg-destructive/15 text-destructive'
                    }`}>{inv.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <ActivatedModulesCard state={state} />
    </div>
  );
}

function ActivatedModulesCard({ state }: { state: SettingsDemoState }) {
  const active = MODULES.filter(m => m.on).length;
  return (
    <div id="set-demo-sub-modules" className="border border-border rounded-lg bg-card shadow-card">
      <div className="px-4 py-3 border-b border-border flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Activated modules</span></div>
          <p className="text-px-11 text-muted-foreground mt-0.5">Modules included in your subscription. Request a change and our team handles it.</p>
        </div>
        <span className="text-px-10 px-2 py-0.5 rounded-full bg-muted font-medium shrink-0">{active} / {MODULES.length}</span>
      </div>
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-8 pl-8 rounded-md border border-border text-px-11 flex items-center text-muted-foreground">Search modules…</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {MODULES.map((m, i) => {
            const Ic = m.icon;
            const highlighted = state.moduleRequest !== 'none' && i === 6;
            return (
              <div key={m.code} id={highlighted ? 'set-demo-sub-module-request' : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md border ${
                  highlighted ? 'border-primary bg-primary/5' : m.on ? 'border-border bg-background' : 'border-dashed border-muted-foreground/25 opacity-70'}`}>
                <span className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${m.on ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Ic className="h-3.5 w-3.5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-medium truncate">{m.name}</p>
                    {m.core && <LockIcon className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                  </div>
                  <p className="text-px-10 text-muted-foreground font-mono truncate">{m.code}</p>
                </div>
                <span className={`text-px-10 px-1.5 py-0.5 rounded-full shrink-0 font-medium ${m.on ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>{m.on ? 'Active' : 'Inactive'}</span>
                <span className={`h-6 w-6 rounded-md flex items-center justify-center shrink-0 ${highlighted ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'}`}>
                  {m.on ? <MinusCircle className="h-3.5 w-3.5" /> : <Cart className="h-3.5 w-3.5" />}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ModuleRequestDialogMock({ state }: { state: SettingsDemoState }) {
  const sent = state.moduleRequestSent;
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/70 backdrop-blur-[2px]">
      <div id="set-demo-module-dialog" className="w-[min(92%,520px)] rounded-xl border border-border bg-card shadow-lg p-4 space-y-3">
        <div>
          <p className="text-sm font-semibold">Request module activation</p>
          <p className="text-px-11 text-muted-foreground mt-0.5">We will review your request and send you the details to add this module to your subscription.</p>
        </div>
        <div className="rounded-lg border border-border/60 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium">HR</span>
            <span className="text-px-10 px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">Inactive</span>
          </div>
          {[['Module code', 'hr.core'], ['Workspace', 'krossier'], ['URL', 'https://krossier.flowentra.app']].map(([k, v]) => (
            <div key={k} className="flex items-center justify-between gap-3">
              <span className="text-px-11 text-muted-foreground">{k}</span>
              <span className="text-px-11 font-mono truncate">{v}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <p className="text-px-11 text-muted-foreground">Message to our team <span className="text-destructive">*</span></p>
          <div className="min-h-[62px] rounded-md border border-primary p-2 text-px-11 text-foreground">
            {sent ? 'We are onboarding 6 technicians next month and need the HR module for leave and timesheets.' : 'Tell us why you need this change…'}
          </div>
          <div className="flex justify-end"><span className="text-px-10 text-muted-foreground">{sent ? '96' : '0'}/2000</span></div>
        </div>
        <div className="flex justify-end gap-2">
          <div className="h-8 px-3 rounded-md border border-border text-px-11 inline-flex items-center text-muted-foreground">Cancel</div>
          <div className={`h-8 px-3 rounded-md text-px-11 font-medium inline-flex items-center gap-1.5 ${sent ? 'bg-primary text-primary-foreground' : 'bg-primary/40 text-primary-foreground'}`}><Send className="h-3 w-3" /> Send request</div>
        </div>
        {sent && (
          <div className="rounded-md border border-green-500/30 bg-green-500/10 px-2.5 py-1.5 flex items-center gap-2">
            <CheckCircle2 className="h-3 w-3 text-green-600" />
            <span className="text-px-10 text-muted-foreground">Sent to contact@flowentra.io — tenant, user, module, time and action needed included.</span>
          </div>
        )}
      </div>
    </div>
  );
}

function CompaniesPanel({ state }: { state: SettingsDemoState }) {
  return (
    <div className="space-y-4 relative">
      <div className="border border-border rounded-lg bg-card shadow-card">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Building2 className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Companies</span></div>
            <p className="text-px-11 text-muted-foreground mt-0.5">Manage the companies inside your workspace</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className={`h-8 px-2.5 rounded-md text-px-11 inline-flex items-center gap-1.5 ${state.companiesScopeOpen ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}><Sliders className="h-3 w-3" /> Module data scope</div>
            <div className="h-8 px-2.5 rounded-md bg-primary text-primary-foreground text-px-11 font-medium inline-flex items-center gap-1.5"><Plus className="h-3 w-3" /> Add company</div>
          </div>
        </div>
        <div className="p-4">
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-muted/30 border-b border-border/60 text-muted-foreground uppercase tracking-wide text-px-10">
                  <th className="text-left font-medium px-3 py-2">Company</th>
                  <th className="text-left font-medium px-3 py-2">Slug</th>
                  <th className="text-left font-medium px-3 py-2">Contact</th>
                  <th className="text-left font-medium px-3 py-2">Users</th>
                  <th className="text-left font-medium px-3 py-2">Status</th>
                  <th className="text-right font-medium px-3 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {COMPANIES.map(c => (
                  <tr key={c.slug} className="border-b border-border/40 last:border-0">
                    <td className="px-3 py-2 font-medium">{c.name}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{c.slug}</td>
                    <td className="px-3 py-2 text-muted-foreground">{c.email}</td>
                    <td className="px-3 py-2">{c.users}</td>
                    <td className="px-3 py-2"><span className={`inline-flex rounded-full px-2 py-0.5 text-px-10 font-medium ${c.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-muted text-muted-foreground'}`}>{c.active ? 'Active' : 'Inactive'}</span></td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        <Pencil className="h-3.5 w-3.5" /><Power className="h-3.5 w-3.5" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {state.companiesScopeOpen && (
        <div id="set-demo-companies-scope" className="border border-primary/40 rounded-lg bg-card shadow-card">
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2"><Sliders className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">Module data scope</span></div>
            <p className="text-px-11 text-muted-foreground mt-0.5">Shared across companies, or isolated per company</p>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            {SCOPES.map(sc => (
              <div key={sc.key} className="flex items-center justify-between gap-2 rounded-md border border-border px-2.5 py-2">
                <span className="text-xs font-medium">{sc.label}</span>
                <span className={`text-px-10 px-1.5 py-0.5 rounded-full font-medium ${sc.scope === 'shared' ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{sc.scope === 'shared' ? 'Shared' : 'Per company'}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OfflinePanel({ state }: { state: SettingsDemoState }) {
  return (
    <div className="space-y-4">
      <Panel icon={WifiOff} title="Offline sync" desc="Choose which modules to hydrate on this device">
        <p className="text-px-11 text-muted-foreground mb-3">Enabled modules are downloaded and kept in sync so they work without an internet connection.</p>
        <div id="set-demo-offline-all" className="flex flex-wrap gap-2 mb-3">
          <div className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 cursor-default ${state.offlineAllOn ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground'}`}>Select all</div>
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default">Deselect all</div>
          <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default"><RotateCcw className="h-3 w-3" /> Reset defaults</div>
        </div>
        <div className="rounded-lg border border-border divide-y max-h-72 overflow-hidden">
          {HYDRATION.map((mod, i) => {
            const on = state.offlineAllOn ? true : i < 5;
            return (
              <div key={mod} className="flex items-center gap-3 p-2.5">
                <span className={`h-4 w-4 rounded-[3px] inline-flex items-center justify-center ${on ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>{on && <Check className="h-3 w-3" />}</span>
                <span className="text-xs font-medium flex-1">{mod}</span>
                <span className="text-px-10 text-muted-foreground">Default on</span>
              </div>
            );
          })}
        </div>
      </Panel>

      <Panel icon={RefreshCw} title="Last sync" desc="When each module last hydrated">
        <div className="grid grid-cols-2 gap-2 text-px-11">
          {['Contacts · 2 min ago', 'Articles · 5 min ago', 'Service Orders · 1 min ago', 'Dispatches · just now'].map(l => (
            <div key={l} className="rounded-md border border-border bg-background px-2.5 py-1.5 flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-green-500" /><span>{l}</span></div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

function SystemPanel({ state }: { state: SettingsDemoState }) {
  const service = state.jobMode === 'service';
  return (
    <div className="space-y-4">
      {/* Job conversion mode — mirrors JobConversionModeSettings */}
      <Panel icon={Wrench} title="Service order job mode" desc="How service orders convert into jobs and dispatches">
        <div id="set-demo-system-jobmode" className="grid grid-cols-2 gap-2.5">
          <div className={`rounded-xl border-2 p-3 ${!service ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1.5"><Building2 className={`h-4 w-4 ${!service ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-xs font-semibold">Installation-based</span>{!service && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />}</div>
            <p className="text-px-10 text-muted-foreground">Group all services under one job per installation.</p>
          </div>
          <div className={`rounded-xl border-2 p-3 ${service ? 'border-primary bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center gap-2 mb-1.5"><List className={`h-4 w-4 ${service ? 'text-primary' : 'text-muted-foreground'}`} /><span className="text-xs font-semibold">Service-based</span>{service && <CheckCircle2 className="h-3.5 w-3.5 text-primary ml-auto" />}</div>
            <p className="text-px-10 text-muted-foreground">Each service item becomes its own individual job.</p>
          </div>
        </div>
      </Panel>

      {/* Numbering — mirrors NumberingSettings */}
      <Panel icon={Hash} title="Document numbering" desc="Templates that generate every document number" id="set-demo-system-numbering">
        <div className="space-y-2">
          {NUMBERING.map((e, i) => {
            const Ic = e.icon;
            const isOpen = state.numberingExpanded && i === 0;
            return (
              <div key={e.key} className={`rounded-lg border ${isOpen ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
                <div className="flex items-center gap-2.5 px-3 py-2">
                  <span className={`p-1.5 rounded-md ${isOpen ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}><Ic className="h-3.5 w-3.5" /></span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold">{e.label}</p>
                    <p className="text-px-10 text-muted-foreground font-mono truncate">{e.template}</p>
                  </div>
                  <span className="text-px-10 px-1.5 py-0.5 rounded bg-muted text-foreground font-mono">{e.example}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
                {isOpen && (
                  <div id="set-demo-system-template" className="border-t border-border/60 p-3 space-y-2.5">
                    <div className="grid grid-cols-3 gap-2 text-px-10">
                      <div>
                        <p className="text-muted-foreground mb-1">Template</p>
                        <div className={`h-8 px-2.5 rounded-md border text-xs font-mono flex items-center ${state.numberingEdited ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>{state.numberingEdited ? 'OFR-{YEAR}-{SEQ:5}' : e.template}</div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Strategy</p>
                        <div className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center justify-between">Atomic counter <ChevronDown className="h-3 w-3 text-muted-foreground" /></div>
                      </div>
                      <div>
                        <p className="text-muted-foreground mb-1">Reset</p>
                        <div className="h-8 px-2.5 rounded-md border border-border text-xs flex items-center justify-between">Yearly <ChevronDown className="h-3 w-3 text-muted-foreground" /></div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['{YEAR}', '{DATE:yyyyMMdd}', '{SEQ:6}', '{GUID:5}', '{TS:yyyyMMddHHmmss}'].map(tok => (
                        <span key={tok} className="text-px-10 font-mono px-1.5 py-0.5 rounded bg-muted text-foreground">{tok}</span>
                      ))}
                    </div>
                    <div className="rounded-md border border-primary/30 bg-primary/5 px-2.5 py-1.5 flex items-center gap-2">
                      <Info className="h-3 w-3 text-primary" />
                      <span className="text-px-10 text-muted-foreground">Next number preview:</span>
                      <span className="text-px-10 font-mono font-semibold">{state.numberingEdited ? 'OFR-2026-00043' : e.example}</span>
                    </div>
                    <div className="flex justify-end gap-1.5">
                      <div className="h-7 px-2.5 rounded-md border border-border text-px-10 inline-flex items-center text-muted-foreground cursor-default">Reset</div>
                      <div className={`h-7 px-2.5 rounded-md text-px-10 font-medium inline-flex items-center gap-1 cursor-default ${state.numberingEdited ? 'bg-primary text-primary-foreground' : 'bg-primary/40 text-primary-foreground'}`}><Save className="h-3 w-3" /> Save</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────
function PageSettings({ state }: { state: SettingsDemoState }) {
  return (
    <div className="p-4 md:p-6 relative">
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10"><Settings2 className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 id="set-demo-title" className="text-xl font-semibold">Settings</h1>
          <p className="text-px-11 text-muted-foreground">Your profile, company, subscription and system configuration</p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        <div className="col-span-4 lg:col-span-3">
          <div id="set-demo-sidebar" className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-3 pt-3 pb-1 text-px-10 font-semibold uppercase tracking-widest text-muted-foreground/70">Personal</div>
            {PERSONAL.map(item => <NavRow key={item.id} item={item} active={state.section === item.id} />)}
            <div className="mx-3 my-2 border-t border-border" />
            <div className="px-3 pb-1 text-px-10 font-semibold uppercase tracking-widest text-muted-foreground/70">General</div>
            {GENERAL.map(item => <NavRow key={item.id} item={item} active={state.section === item.id} />)}
          </div>
        </div>

        <div className="col-span-8 lg:col-span-9">
          {state.section === 'profile'      && <ProfilePanel />}
          {state.section === 'security'     && (
            <div className="space-y-4"><SecurityPanel /><TwoFactorPanel state={state} /></div>
          )}
          {state.section === 'company'      && <CompanyAndPreferencesPanel state={state} />}
          {state.section === 'subscription' && (
            <div className="relative">
              <SubscriptionPanel state={state} />
              {state.moduleRequest !== 'none' && <ModuleRequestDialogMock state={state} />}
            </div>
          )}
          {state.section === 'companies'    && <CompaniesPanel state={state} />}
          {state.section === 'offline'      && <OfflinePanel state={state} />}
          {state.section === 'system'       && <SystemPanel state={state} />}
        </div>
      </div>
    </div>
  );
}

// ─── Wrapper with autopilot infra (audio, cursor, chapters, controls) ───────
export function SettingsAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= SET_STEPS.length;
  const state: SettingsDemoState = useMemo(() => {
    let s = initialSettingsDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, SET_STEPS.length); i++) s = SET_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = SET_STEPS[Math.min(stepIndex, SET_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, SET_STEPS.length - 1), step.caption);
  const finishedMsg = demoLang === 'fr'
    ? 'Votre espace de travail est configuré — profil, entreprise, abonnement et système, tout en un.'
    : 'Your workspace is configured — profile, company, subscription and system, all in one place.';

  useEffect(() => {
    if (open) { setStepIndex(0); setPlaying(true); }
    return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); };
  }, [open]);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const synth = window.speechSynthesis; synth.getVoices();
    const onV = () => synth.getVoices();
    synth.addEventListener?.('voiceschanged', onV);
    return () => synth.removeEventListener?.('voiceschanged', onV);
  }, []);

  useEffect(() => {
    if (!open || finished) return;
    const place = () => {
      const el = document.getElementById(step.target); if (!el) return;
      const r = el.getBoundingClientRect();
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 160);
    return () => clearTimeout(t);
  }, [
    stepIndex, open, finished, step?.target,
    state.section, state.prefTheme, state.prefColorPicked,
    state.showPlans, state.planPicked, state.offlineAllOn,
    state.jobMode, state.numberingExpanded, state.numberingEdited,
    state.twoFactor, state.moduleRequest, state.moduleRequestSent, state.companiesScopeOpen,
  ]);

  useEffect(() => {
    if (!open || !playing || finished) return;
    const advance = () => setStepIndex(i => i + 1);
    const caption = captionText;
    const synthSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
    if (!muted && synthSupported && caption) {
      const synth = window.speechSynthesis; synth.cancel();
      const { code, bcp47 } = languageTagFor(i18n.language);
      const voice = pickBestVoice(code);
      const chunks = splitForSpeech(caption);
      let advanced = false;
      const doAdvance = () => { if (advanced) return; advanced = true; timerRef.current = setTimeout(advance, 420); };
      chunks.forEach((chunk, idx) => {
        const u = new SpeechSynthesisUtterance(chunk);
        u.lang = bcp47; configureUtteranceForFemaleVoice(u, voice);
        if (idx === chunks.length - 1) { u.onend = doAdvance; u.onerror = doAdvance; }
        try { synth.speak(u); } catch { /* */ }
      });
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
  const activeChapter = SET_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || SET_CHAPTERS[SET_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><Settings2 className="h-3.5 w-3.5 text-primary-foreground" /></span>
          <span className="text-sm font-semibold truncate">{demoLang === 'fr' ? 'Paramètres — Démo en direct' : 'Settings — Live Demo'}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={() => setMuted(m => !m)} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title={muted ? 'Unmute' : 'Mute'}>{muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}</button>
          <button onClick={togglePlay} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
          <button onClick={restart} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Restart"><RotateCcw className="h-4 w-4" /></button>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground" title="Close"><X className="h-4 w-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pointer-events-none">
        <PageSettings state={state} />
      </div>

      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          {SET_CHAPTERS.map(ch => (
            <button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>
          ))}
          <span className="ml-auto text-px-10 text-muted-foreground">{Math.min(stepIndex + 1, SET_STEPS.length)} / {SET_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2"><div className="h-full bg-primary transition-all duration-300" style={{ width: `${(Math.min(stepIndex + 1, SET_STEPS.length) / SET_STEPS.length) * 100}%` }} /></div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2"><Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />{finished ? finishedMsg : captionText}</p>
      </div>

      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3"><Settings2 className="h-6 w-6 text-primary-foreground" /></div>
            <h3 className="text-lg font-semibold mb-1">{demoLang === 'fr' ? 'Votre espace, vos règles' : 'Your workspace, your rules'}</h3>
            <p className="text-sm text-muted-foreground mb-5">{demoLang === 'fr' ? 'Profil, entreprise et préférences, abonnement, synchronisation hors-ligne et configuration système — tout depuis un seul centre de contrôle.' : 'Profile, company and preferences, subscription, offline sync and system configuration — all from one control center.'}</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">{demoLang === 'fr' ? 'Ouvrir les paramètres' : 'Open settings'}</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> {demoLang === 'fr' ? 'Rejouer' : 'Replay'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
