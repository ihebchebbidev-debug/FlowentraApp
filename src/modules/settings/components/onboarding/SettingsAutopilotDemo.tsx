import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Settings2, User, Building2, Lock, Palette, Layers, Users, Shield, Link2,
  CreditCard, Monitor, WifiOff, RefreshCw, Plus, Search, Filter, MoreVertical,
  Mail, Eye, ExternalLink, Upload, Save, Check, CheckCircle2, ChevronDown,
  Sun, Moon, Sidebar as SidebarIcon, Layout, Table as TableIcon, List, Zap,
  Activity, FileText, ShoppingCart, Package, Wrench, Truck, Calendar, Hash,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  SET_STEPS, SET_CHAPTERS, initialSettingsDemoState,
  type SettingsDemoState,
} from './settingsDemoScript';
import { pickLang, getCaption, getChapterTitle } from './settingsDemoTranslations';

interface Props { open: boolean; onClose: () => void; }

// ─── Sidebar nav (mirrors the real Settings nav exactly) ──────────────────────
const PERSONAL = [
  { id: 'profile',     label: 'Profile',     icon: User,      navId: undefined },
  { id: 'company',     label: 'Company',     icon: Building2, navId: 'set-demo-nav-company' },
  { id: 'security',    label: 'Security',    icon: Lock,      navId: 'set-demo-nav-security' },
  { id: 'preferences', label: 'Preferences', icon: Palette,   navId: 'set-demo-nav-prefs' },
  { id: 'offline',     label: 'Offline data', icon: WifiOff,  navId: undefined },
];
const ADMIN = [
  { id: 'companies',    label: 'Companies',    icon: Layers,     navId: 'set-demo-nav-companies' },
  { id: 'users',        label: 'Users',        icon: Users,      navId: 'set-demo-nav-users' },
  { id: 'roles',        label: 'Roles',        icon: Shield,     navId: 'set-demo-nav-roles' },
  { id: 'integrations', label: 'Integrations', icon: Link2,      navId: undefined },
  { id: 'subscription', label: 'Subscription', icon: CreditCard, navId: undefined },
  { id: 'system',       label: 'System',       icon: Monitor,    navId: 'set-demo-nav-system' },
  { id: 'syncHistory',  label: 'Sync History', icon: RefreshCw,  navId: undefined },
];

// ─── Users (avatar · email · role badges · status · created) ──────────────────
type DemoUser = { name: string; email: string; role: string; tone: string; active: boolean; created: string; admin?: boolean; fresh?: boolean };
const USERS: DemoUser[] = [
  { name: 'Amine Chebbi',  email: 'amine@solartech.tn',  role: 'Main Admin', tone: 'bg-primary/15 text-primary', active: true, created: 'Jan 4, 2026', admin: true },
  { name: 'Karim Bouaziz', email: 'karim@solartech.tn',  role: 'Technician', tone: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400', active: true, created: 'Feb 12, 2026' },
  { name: 'Leïla Mansour', email: 'leila@solartech.tn',  role: 'Dispatcher', tone: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400', active: true, created: 'Feb 18, 2026' },
  { name: 'Sami Trabelsi', email: 'sami@solartech.tn',   role: 'Sales',      tone: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', active: true, created: 'Mar 2, 2026' },
  { name: 'Nadia Khelifi', email: 'nadia@solartech.tn',  role: 'Manager',    tone: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', active: false, created: 'Mar 9, 2026' },
];
const NEW_USER: DemoUser = { name: 'Yassine Gharbi', email: 'yassine@solartech.tn', role: 'No role', tone: 'bg-muted text-muted-foreground', active: true, created: 'Jun 22, 2026', fresh: true };

// ─── Roles (name · description · users · status · created) ────────────────────
const ROLES = [
  { name: 'Administrator', desc: 'Full workspace access', users: 2,  active: true,  created: 'Jan 4, 2026' },
  { name: 'Manager',       desc: 'Oversees teams & reports', users: 3,  active: true,  created: 'Jan 4, 2026' },
  { name: 'Dispatcher',    desc: 'Plans & assigns field jobs', users: 4, active: true,  created: 'Jan 6, 2026' },
  { name: 'Sales',         desc: 'Manages offers & deals', users: 5,  active: true,  created: 'Jan 6, 2026' },
  { name: 'Technician',    desc: 'Executes work in the field', users: 12, active: true, created: 'Jan 6, 2026' },
];

// ─── Permission matrix (real categories / modules / CRUD) ─────────────────────
// Values shown for the "Dispatcher" role. true = granted.
const PERM_CATEGORIES: { category: string; expanded: boolean; modules: { label: string; icon: any; crud: [boolean, boolean, boolean, boolean] }[] }[] = [
  {
    category: 'CRM', expanded: true,
    modules: [
      { label: 'Contacts', icon: Users, crud: [true, true, true, false] },
      { label: 'Articles', icon: Package, crud: [true, false, false, false] },
      { label: 'Offers', icon: FileText, crud: [true, false, false, false] },
      { label: 'Sales', icon: ShoppingCart, crud: [true, false, false, false] },
      { label: 'Purchases', icon: ShoppingCart, crud: [true, false, false, false] },
    ],
  },
  {
    category: 'Field Service', expanded: true,
    modules: [
      { label: 'Installations', icon: Building2, crud: [true, true, true, false] },
      { label: 'Service Orders', icon: Wrench, crud: [true, true, true, false] },
      { label: 'Dispatches', icon: Truck, crud: [true, true, true, false] },
      { label: 'Planner', icon: Calendar, crud: [true, true, true, false] },
    ],
  },
];
const PERM_COLLAPSED: { category: string; modules: { label: string; granted: number; total: number }[] }[] = [
  { category: 'Time & Expenses', modules: [{ label: 'Time Tracking', granted: 3, total: 4 }, { label: 'Expenses', granted: 1, total: 4 }] },
  { category: 'Inventory', modules: [{ label: 'Stock Management', granted: 1, total: 4 }] },
  { category: 'Administration', modules: [{ label: 'User Management', granted: 0, total: 4 }, { label: 'Roles & Permissions', granted: 0, total: 4 }, { label: 'Settings & Preferences', granted: 1, total: 5 }, { label: 'Human Resources', granted: 0, total: 4 }] },
];
const CRUD_LABELS = ['View', 'Create', 'Edit', 'Delete'];

// ─── Skills assigned to the "Technician" role ─────────────────────────────────
const ROLE_SKILLS = [
  { name: 'HVAC Installation', level: 'Advanced', cat: 'Technical', tone: 'bg-warning/10 text-warning' },
  { name: 'Electrical Wiring', level: 'Expert', cat: 'Technical', tone: 'bg-destructive/10 text-destructive' },
  { name: 'Plumbing', level: 'Intermediate', cat: 'Technical', tone: 'bg-primary/10 text-primary' },
  { name: 'Solar PV', level: 'Advanced', cat: 'Renewable', tone: 'bg-warning/10 text-warning' },
];

const initials = (n: string) => n.split(' ').map(p => p[0]).slice(0, 2).join('');

// ─── Mock settings surface ────────────────────────────────────────────────────
function PageSettings({ state }: { state: SettingsDemoState }) {
  const dark = state.prefTheme === 'dark';
  return (
    <div className="p-4 md:p-6 relative">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="p-2 rounded-lg bg-primary/10"><Settings2 className="h-6 w-6 text-primary" /></div>
        <div><h1 id="set-demo-title" className="text-xl font-semibold">Settings</h1><p className="text-px-11 text-muted-foreground">Manage users, roles, and system permissions</p></div>
      </div>

      <div className="grid grid-cols-12 gap-5">
        {/* Sidebar nav */}
        <div className="col-span-4 lg:col-span-3">
          <div id="set-demo-sidebar" className="border border-border rounded-lg bg-card overflow-hidden">
            <div className="px-3 pt-3 pb-1 text-px-10 font-semibold uppercase tracking-widest text-muted-foreground/70">Personal</div>
            {PERSONAL.map(item => <NavRow key={item.id} item={item} active={state.section === item.id} />)}
            <div className="mx-3 my-2 border-t border-border" />
            <div className="px-3 pb-1 text-px-10 font-semibold uppercase tracking-widest text-muted-foreground/70">Administration</div>
            {ADMIN.map(item => <NavRow key={item.id} item={item} active={state.section === item.id} />)}
          </div>
        </div>

        {/* Content */}
        <div className="col-span-8 lg:col-span-9">
          {state.section === 'profile' && <ProfilePanel />}
          {state.section === 'company' && <CompanyPanel />}
          {state.section === 'security' && <SecurityPanel />}
          {state.section === 'users' && <UsersPanel state={state} />}
          {state.section === 'roles' && <RolesPanel />}
          {state.section === 'preferences' && <PreferencesPanel dark={dark} />}
          {state.section === 'companies' && <CompaniesPanel />}
          {state.section === 'system' && <SystemPanel />}
        </div>
      </div>

      {/* Create user dialog — name, email, password, phone, country (no role) */}
      {state.showCreateUser && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-8 bg-background/50">
          <div id="set-demo-create-user" className="w-[460px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p className="text-sm font-semibold">Create New User</p>
            <p className="text-px-11 text-muted-foreground mb-3">Add a new member to your workspace</p>
            <div className="flex justify-center mb-3"><span className="h-14 w-14 rounded-full border-2 border-dashed border-border bg-muted/30 flex items-center justify-center text-muted-foreground"><Upload className="h-4 w-4" /></span></div>
            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <Field label="First name *" value={state.createUserStep >= 1 ? 'Yassine' : ''} />
                <Field label="Last name *" value={state.createUserStep >= 1 ? 'Gharbi' : ''} />
              </div>
              <div>
                <label className="block text-px-11 text-muted-foreground mb-1">Email *</label>
                <div className={`h-9 px-3 rounded-md border text-sm flex items-center justify-between ${state.createUserStep >= 1 ? 'border-primary text-foreground' : 'border-border text-muted-foreground'}`}>
                  {state.createUserStep >= 1 ? 'yassine@solartech.tn' : 'name@company.com'}
                  {state.createUserStep >= 1 && <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />}
                </div>
              </div>
              <Field label="Password *" value={state.createUserStep >= 1 ? '••••••••' : ''} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Phone" value={state.createUserStep >= 1 ? '+216 24 110 220' : ''} />
                <Field label="Country code *" value="TN" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center text-muted-foreground cursor-default">Cancel</div>
                <div className={`h-9 px-3 rounded-md text-sm font-medium flex items-center gap-1.5 cursor-default ${state.createUserStep >= 1 ? 'bg-primary text-primary-foreground' : 'bg-primary/40 text-primary-foreground'}`}><Mail className="h-3.5 w-3.5" /> Create User</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role modal — General + Permissions tabs */}
      {state.showRoleModal && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-6 bg-background/50">
          <div className="w-[680px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
            <div className="px-5 pt-4 pb-3 border-b border-border">
              <p className="text-sm font-semibold">Edit Role</p>
              <p className="text-px-11 text-muted-foreground">Update role details and permissions</p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                <div className={`h-8 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 ${state.roleTab === 'general' ? 'bg-background border border-border' : 'bg-muted/40 text-muted-foreground'}`}><Settings2 className="h-3.5 w-3.5" /> General</div>
                <div id="set-demo-role-perms-tab" className={`h-8 rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 ${state.roleTab === 'permissions' ? 'bg-background border border-border' : 'bg-muted/40 text-muted-foreground'}`}><Shield className="h-3.5 w-3.5" /> Permissions</div>
              </div>
            </div>

            {/* Permissions tab body */}
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2"><span className="p-1.5 rounded-md bg-primary/10"><Shield className="h-4 w-4 text-primary" /></span><div><p className="text-xs font-semibold">Permissions for Dispatcher</p><p className="text-px-10 text-muted-foreground">Configure what users with this role can access</p></div></div>
                <div className="flex items-center gap-1.5">
                  <div className="h-7 px-2 rounded-md border border-border text-px-10 inline-flex items-center gap-1 text-muted-foreground"><CheckCircle2 className="h-3 w-3" /> Grant All</div>
                  <div className="h-7 px-2 rounded-md border border-border text-px-10 inline-flex items-center gap-1 text-muted-foreground"><X className="h-3 w-3" /> Revoke All</div>
                </div>
              </div>

              <div className="max-h-[330px] overflow-hidden space-y-4">
                {PERM_CATEGORIES.map((cat, ci) => (
                  <div key={cat.category}>
                    <div className="flex items-center gap-2 mb-2"><span className="text-px-10 font-semibold uppercase tracking-wide text-muted-foreground">{cat.category}</span><div className="flex-1 border-t border-border/60" /></div>
                    <div className="space-y-1.5">
                      {cat.modules.map((m, mi) => {
                        const Ic = m.icon;
                        const granted = m.crud.filter(Boolean).length;
                        const some = granted > 0;
                        const firstModule = ci === 0 && mi === 0;
                        return (
                          <div key={m.label} id={firstModule ? 'set-demo-perm-module' : undefined} className="border border-border rounded-lg px-3 py-2">
                            <div className="flex items-center gap-2.5 mb-2">
                              <span className={`p-1.5 rounded-md ${some ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Ic className="h-3.5 w-3.5" /></span>
                              <span className="text-xs font-medium flex-1">{m.label}</span>
                              <span className={`text-px-10 px-1.5 py-0.5 rounded-full font-medium ${granted === 4 ? 'bg-primary text-primary-foreground' : some ? 'bg-muted text-foreground' : 'border border-border text-muted-foreground'}`}>{granted}/4</span>
                            </div>
                            <div className="grid grid-cols-4 gap-1.5">
                              {m.crud.map((on, idx) => (
                                <div key={idx} id={firstModule && idx === 2 ? 'set-demo-perm-crud' : undefined} className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-px-10 ${on ? 'bg-primary/10 border-primary/30 font-medium' : 'bg-muted/30 border-border text-muted-foreground'} ${state.permStep >= 2 && firstModule && idx === 2 ? 'ring-2 ring-amber-400' : ''}`}>
                                  <span className={`h-3.5 w-3.5 rounded-[3px] inline-flex items-center justify-center ${on ? 'bg-primary text-primary-foreground' : 'border border-border'}`}>{on && <Check className="h-2.5 w-2.5" />}</span>
                                  {CRUD_LABELS[idx]}
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                {/* Collapsed categories (accordion headers) */}
                {state.permStep >= 1 && PERM_COLLAPSED.map(cat => (
                  <div key={cat.category}>
                    <div className="flex items-center gap-2 mb-2"><span className="text-px-10 font-semibold uppercase tracking-wide text-muted-foreground">{cat.category}</span><div className="flex-1 border-t border-border/60" /></div>
                    <div className="space-y-1.5">
                      {cat.modules.map(m => (
                        <div key={m.label} className="border border-border rounded-lg px-3 py-2 flex items-center gap-2.5">
                          <span className={`p-1.5 rounded-md ${m.granted ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}><Shield className="h-3.5 w-3.5" /></span>
                          <span className="text-xs font-medium flex-1">{m.label}</span>
                          <span className={`text-px-10 px-1.5 py-0.5 rounded-full font-medium ${m.granted ? 'bg-muted text-foreground' : 'border border-border text-muted-foreground'}`}>{m.granted}/{m.total}</span>
                          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-3 mt-3 border-t border-border">
                {state.permStep >= 2 ? <span className="text-px-10 px-2 py-0.5 rounded-md border border-amber-400/40 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">Unsaved changes</span> : <span />}
                <div className="flex items-center gap-2">
                  <div className="h-8 px-3 rounded-md border border-border text-xs inline-flex items-center gap-1.5 text-muted-foreground cursor-default"><RotateCcw className="h-3.5 w-3.5" /> Reset</div>
                  <div className={`h-8 px-3 rounded-md text-xs font-medium inline-flex items-center gap-1.5 cursor-default ${state.permStep >= 2 ? 'bg-primary text-primary-foreground' : 'bg-primary/40 text-primary-foreground'}`}><Save className="h-3.5 w-3.5" /> Save Permissions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Skills assignment (per role) */}
      {state.showSkills && (
        <div className="absolute inset-0 z-[6] flex items-start justify-center pt-8 bg-background/50">
          <div className="w-[520px] bg-card border border-border rounded-xl shadow-2xl p-4">
            <p id="set-demo-skills-title" className="text-base font-semibold inline-flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Manage Skills for “Technician”</p>
            <p className="text-px-11 text-muted-foreground mb-3">Assign and manage skills required for this role</p>

            <p className="text-xs font-medium mb-2">Current Skills</p>
            <div className="space-y-2 mb-4">
              {ROLE_SKILLS.map((sk, i) => {
                const on = state.skillStep >= 1 ? i < 4 : i < 2;
                return (
                  <div key={sk.name} className={`rounded-lg border p-2.5 flex items-start gap-2.5 transition-all ${on ? 'border-border bg-card' : 'border-dashed border-border/50 opacity-40'}`}>
                    <span className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Zap className="h-3.5 w-3.5 text-primary" /></span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2"><span className="text-xs font-semibold">{sk.name}</span><span className={`text-px-10 px-1.5 py-0.5 rounded-full font-medium ${sk.tone}`}>{sk.level}</span></div>
                      <p className="text-px-10 text-muted-foreground">{sk.cat}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs font-medium mb-1.5">Assign New Skill</p>
            <div id="set-demo-skill-list" className="flex gap-2 mb-3">
              <div className="flex-1 h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-muted-foreground">Welding <ChevronDown className="h-3.5 w-3.5" /></div>
              <div className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center cursor-default">Assign</div>
            </div>

            <div id="set-demo-skill-feeds" className="rounded-lg border border-primary/30 bg-primary/5 p-2.5">
              <p className="text-px-11 font-medium mb-1.5 inline-flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-primary" /> Feeds the dispatch board</p>
              <div className="flex items-center gap-2 text-px-10 text-muted-foreground">
                <span className="rounded border border-border bg-background px-2 py-1">Job: AC install · needs <b className="text-foreground">HVAC</b></span>
                <span className="text-foreground">→</span>
                <span className="rounded border border-primary/40 bg-primary/10 px-2 py-1 text-foreground">Matched: Technician ✓</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
    <div id={id} className="border border-border rounded-lg bg-card">
      <div className="px-4 py-3 border-b border-border"><div className="flex items-center gap-2"><Icon className="h-4 w-4 text-primary" /><span className="text-sm font-semibold">{title}</span></div>{desc && <p className="text-px-11 text-muted-foreground mt-0.5">{desc}</p>}</div>
      <div className="p-4">{children}</div>
    </div>
  );
}

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

function CompanyPanel() {
  return (
    <Panel icon={Building2} title="Company" desc="Your brand across the app and PDF reports">
      <div className="mb-4">
        <label className="block text-px-11 text-muted-foreground mb-2">Company Logo — appears in sidebar, header, login page & PDF reports</label>
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
  );
}

function SecurityPanel() {
  return (
    <Panel icon={Shield} title="Security" desc="Change your password">
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

function UsersPanel({ state }: { state: SettingsDemoState }) {
  const rows = state.newUserRow ? [...USERS, NEW_USER] : USERS;
  return (
    <Panel icon={Users} title="User Management" desc="Manage user accounts and access">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div id="set-demo-users-filter" className="flex items-center gap-2">
          <div className="h-8 w-44 rounded-md border border-border flex items-center gap-2 px-2.5 text-px-11 text-muted-foreground"><Search className="h-3.5 w-3.5" /> Search users…</div>
          <div className={`h-8 px-2.5 rounded-md border text-px-11 inline-flex items-center gap-1.5 ${state.showUserFilters ? 'border-primary text-primary' : 'border-border text-muted-foreground'}`}><Filter className="h-3.5 w-3.5" /> Filters {state.showUserFilters && <span className="h-4 px-1 rounded bg-primary/15 text-primary text-px-10">3</span>}</div>
        </div>
        <div id="set-demo-add-user" className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> Add User</div>
      </div>
      {state.showUserFilters && (
        <div className="flex gap-2 mb-3">
          {['Status: Active', 'Role: All', 'Country: Tunisia'].map(f => <span key={f} className="h-7 px-2.5 rounded-md border border-border text-px-11 inline-flex items-center gap-1.5 text-muted-foreground">{f}<ChevronDown className="h-3 w-3" /></span>)}
        </div>
      )}
      <div id="set-demo-users-table" className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60 text-muted-foreground uppercase tracking-wide text-px-10">
            <th className="text-left font-medium px-3 py-2">Name</th>
            <th className="text-left font-medium px-3 py-2">Email</th>
            <th className="text-left font-medium px-3 py-2">Role</th>
            <th className="text-left font-medium px-3 py-2">Status</th>
            <th className="text-left font-medium px-3 py-2">Created</th>
            <th className="text-right font-medium px-3 py-2">Actions</th>
          </tr></thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.email} id={u.fresh ? 'set-demo-user-row' : undefined} className={`border-b border-border/40 last:border-0 ${u.admin ? 'bg-muted/20' : ''} ${u.fresh ? 'bg-primary/5 animate-in fade-in' : ''} ${state.highlightUserRow && u.fresh ? 'ring-1 ring-inset ring-primary/40' : ''}`}>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`h-7 w-7 rounded-full flex items-center justify-center text-px-10 font-semibold ${u.admin ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>{initials(u.name)}</span>
                    <span className="font-medium">{u.name}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.email}</td>
                <td className="px-3 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${u.tone} ${u.admin ? 'border border-primary/30' : ''}`}>{u.role}</span></td>
                <td className="px-3 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${u.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/15 text-destructive'}`}>{u.active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-3 py-2.5 text-muted-foreground">{u.created}</td>
                <td className="px-3 py-2.5 text-right">{u.admin ? <span className="text-muted-foreground italic">—</span> : <span className="h-6 w-6 rounded inline-flex items-center justify-center text-muted-foreground"><MoreVertical className="h-4 w-4" /></span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function RolesPanel() {
  return (
    <Panel icon={Shield} title="Roles & Permissions" desc="Manage roles and permission assignments">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="h-8 w-44 rounded-md border border-border flex items-center gap-2 px-2.5 text-px-11 text-muted-foreground"><Search className="h-3.5 w-3.5" /> Search roles…</div>
        <div className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center gap-1.5 cursor-default"><Plus className="h-3.5 w-3.5" /> Add Role</div>
      </div>
      <div id="set-demo-roles-table" className="border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60 text-muted-foreground uppercase tracking-wide text-px-10">
            <th className="text-left font-medium px-3 py-2">Name</th>
            <th className="text-left font-medium px-3 py-2">Description</th>
            <th className="text-left font-medium px-3 py-2">Users</th>
            <th className="text-left font-medium px-3 py-2">Status</th>
            <th className="text-left font-medium px-3 py-2">Created</th>
            <th className="text-right font-medium px-3 py-2">Actions</th>
          </tr></thead>
          <tbody>
            {ROLES.map((r) => (
              <tr key={r.name} className="border-b border-border/40 last:border-0">
                <td className="px-3 py-2.5 font-medium capitalize">{r.name}</td>
                <td className="px-3 py-2.5 text-muted-foreground">{r.desc}</td>
                <td className="px-3 py-2.5"><span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-px-10 font-medium">{r.users} users</span></td>
                <td className="px-3 py-2.5"><span className={`inline-flex items-center rounded-full px-2 py-0.5 text-px-10 font-medium ${r.active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-destructive/15 text-destructive'}`}>{r.active ? 'Active' : 'Inactive'}</span></td>
                <td className="px-3 py-2.5 text-muted-foreground">{r.created}</td>
                <td className="px-3 py-2.5 text-right"><span className="h-6 w-6 rounded inline-flex items-center justify-center text-muted-foreground"><MoreVertical className="h-4 w-4" /></span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PreferencesPanel({ dark }: { dark: boolean }) {
  const colors = ['bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-indigo-500'];
  return (
    <div className="space-y-4">
      <Panel icon={Palette} title="Appearance" desc="Customize how the app looks">
        <div id="set-demo-pref-theme" className="mb-4">
          <p className="text-px-11 text-muted-foreground mb-1.5">Theme</p>
          <div className="grid grid-cols-3 gap-2">
            {[['Light', Sun, !dark], ['Dark', Moon, dark], ['System', Monitor, false]].map(([l, Ic, sel]: any) => (
              <div key={l} className={`h-16 rounded-xl border-2 flex flex-col items-center justify-center gap-1 ${sel ? 'border-primary bg-primary/10' : 'border-border'}`}><Ic className={`h-4 w-4 ${sel ? 'text-primary' : ''}`} /><span className={`text-px-10 ${sel ? 'text-primary font-medium' : ''}`}>{l}</span></div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <p className="text-px-11 text-muted-foreground mb-1.5">Primary color</p>
          <div className="flex gap-2.5">{colors.map((c, i) => <span key={c} className={`h-9 w-9 rounded-full ${c} ring-2 ring-offset-2 ring-offset-background ${i === 0 ? 'ring-primary scale-110' : 'ring-transparent'}`} />)}</div>
        </div>
        <div className="flex items-center justify-between">
          <div><p className="text-xs font-medium">Language</p><p className="text-px-10 text-muted-foreground">Select your preferred language</p></div>
          <div className="h-9 w-40 px-3 rounded-md border border-border text-sm flex items-center justify-between">Français <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></div>
        </div>
      </Panel>
      <Panel icon={Layout} title="Layout" desc="Choose your navigation and data views">
        <div className="mb-4">
          <p className="text-px-11 text-muted-foreground mb-1.5">Navigation style</p>
          <div className="grid grid-cols-2 gap-2">
            {[['Sidebar', SidebarIcon, true], ['Top bar', Layout, false]].map(([l, Ic, sel]: any) => (
              <div key={l} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${sel ? 'border-primary bg-primary/10' : 'border-border'}`}><Ic className={`h-4 w-4 ${sel ? 'text-primary' : ''}`} /><span className={`text-xs font-medium ${sel ? 'text-primary' : ''}`}>{l}</span></div>
            ))}
          </div>
        </div>
        <div>
          <p className="text-px-11 text-muted-foreground mb-1.5">Data view</p>
          <div className="grid grid-cols-2 gap-2">
            {[['Table', TableIcon, true], ['List', List, false]].map(([l, Ic, sel]: any) => (
              <div key={l} className={`flex items-center gap-3 p-3 rounded-xl border-2 ${sel ? 'border-primary bg-primary/10' : 'border-border'}`}><Ic className={`h-4 w-4 ${sel ? 'text-primary' : ''}`} /><span className={`text-xs font-medium ${sel ? 'text-primary' : ''}`}>{l}</span></div>
            ))}
          </div>
        </div>
        <div className="flex justify-end mt-4"><div className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-xs font-medium inline-flex items-center cursor-default">Save Preferences</div></div>
      </Panel>
    </div>
  );
}

function CompaniesPanel() {
  const companies = [
    { name: 'SolarTech SARL', tag: 'Current', active: true },
    { name: 'Green Energy Co', tag: 'Switch', active: false },
    { name: 'Atlas Maintenance', tag: 'Switch', active: false },
  ];
  return (
    <Panel icon={Layers} title="Companies" desc="Manage and switch between your workspaces">
      <div className="space-y-2">
        {companies.map(c => (
          <div key={c.name} className={`flex items-center justify-between rounded-lg border p-3 ${c.active ? 'border-primary/40 bg-primary/5' : 'border-border'}`}>
            <div className="flex items-center gap-2.5"><span className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center"><Building2 className="h-4 w-4 text-muted-foreground" /></span><div><p className="text-sm font-medium">{c.name}</p><p className="text-px-10 text-muted-foreground">Own team · branding · data</p></div></div>
            <span className={`h-7 px-2.5 rounded-md text-px-11 inline-flex items-center ${c.active ? 'bg-primary/15 text-primary font-medium' : 'border border-border text-muted-foreground'}`}>{c.tag}</span>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function SystemPanel() {
  const cards = [
    { icon: Activity, title: 'Activity Logs', desc: 'Every action, audited', tone: 'bg-destructive/10 text-destructive' },
    { icon: RefreshCw, title: 'Sync History', desc: 'Offline & device sync', tone: 'bg-primary/10 text-primary' },
    { icon: Link2, title: 'Integrations', desc: 'Connect external tools', tone: 'bg-primary/10 text-primary' },
    { icon: CreditCard, title: 'Subscription', desc: 'Plan, billing & invoices', tone: 'bg-primary/10 text-primary' },
  ];
  const numbering = [
    ['Offers', 'OFR-2026-000001'], ['Sales', 'SALE-20260622-A1B2C'], ['Service Orders', 'SO-20260622-A1B2C3'],
    ['Dispatches', 'DISP-20260622143022'], ['Deals', 'DEAL-2026-00001'],
  ];
  return (
    <Panel icon={Monitor} title="System" desc="Logs, sync, numbering and integrations">
      <div className="grid grid-cols-2 gap-3 mb-4">
        {cards.map(c => { const Ic = c.icon; return (
          <div key={c.title} className="rounded-lg border border-border p-3 flex items-center gap-3">
            <span className={`h-8 w-8 rounded-lg flex items-center justify-center ${c.tone}`}><Ic className="h-4 w-4" /></span>
            <div className="min-w-0"><p className="text-xs font-medium">{c.title}</p><p className="text-px-10 text-muted-foreground">{c.desc}</p></div>
          </div>
        ); })}
      </div>
      <div className="rounded-lg border border-border p-3">
        <p className="text-xs font-medium mb-2 inline-flex items-center gap-1.5"><Hash className="h-3.5 w-3.5 text-primary" /> Document numbering</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-px-10">
          {numbering.map(([l, p]) => (
            <div key={l} className="rounded border border-border bg-background p-2"><p className="text-muted-foreground">{l}</p><p className="font-mono text-foreground mt-0.5">{p}</p></div>
          ))}
        </div>
      </div>
    </Panel>
  );
}

export function SettingsAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= SET_STEPS.length;
  const state: SettingsDemoState = useMemo(() => { let s = initialSettingsDemoState; for (let i = 0; i < Math.min(stepIndex + 1, SET_STEPS.length); i++) s = SET_STEPS[i].apply(s); return s; }, [stepIndex]);

  const step = SET_STEPS[Math.min(stepIndex, SET_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, SET_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre espace de travail est configuré — votre équipe, vos règles, votre app.' :
    'Your workspace is configured — your team, your rules, your app.';

  useEffect(() => { if (open) { setStepIndex(0); setPlaying(true); } return () => { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); }; }, [open]);
  useEffect(() => { if (typeof window === 'undefined' || !window.speechSynthesis) return; const synth = window.speechSynthesis; synth.getVoices(); const onV = () => synth.getVoices(); synth.addEventListener?.('voiceschanged', onV); return () => synth.removeEventListener?.('voiceschanged', onV); }, []);
  useEffect(() => {
    if (!open || finished) return;
    const place = () => { const el = document.getElementById(step.target); if (!el) return; const r = el.getBoundingClientRect(); setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 40), clicking: true }); if (clickRef.current) clearTimeout(clickRef.current); clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450); };
    const t = setTimeout(place, 160); return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.section, state.showCreateUser, state.createUserStep, state.showRoleModal, state.roleTab, state.permStep, state.showSkills, state.skillStep, state.showUserFilters, state.newUserRow, state.prefTheme]);
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
  const activeChapter = SET_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || SET_CHAPTERS[SET_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1"><span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0"><Settings2 className="h-3.5 w-3.5 text-primary-foreground" /></span><span className="text-sm font-semibold truncate">{demoLang === 'fr' ? 'Paramètres — Démo en direct' : 'Settings — Live Demo'}</span></div>
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
          {SET_CHAPTERS.map(ch => (<button key={ch.id} onClick={() => jumpChapter(ch.start)} className={`text-px-10 font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}>{getChapterTitle(demoLang, ch.id, ch.title)}</button>))}
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
            <p className="text-sm text-muted-foreground mb-5">{demoLang === 'fr' ? 'Gérez votre équipe, leurs rôles, leurs permissions précises, leurs compétences et vos préférences — tout depuis un seul centre de contrôle.' : 'Manage your team, their roles, exact permissions, skills and preferences — all from one control center.'}</p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">{demoLang === 'fr' ? 'Configurer vos paramètres' : 'Configure your settings'}</button>
              <button onClick={restart} className="w-full h-9 rounded-lg border border-border text-sm font-medium hover:bg-muted/40 inline-flex items-center justify-center gap-1.5 cursor-pointer"><RotateCcw className="h-3.5 w-3.5" /> {demoLang === 'fr' ? 'Rejouer' : 'Replay'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
