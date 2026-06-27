import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X, Play, Pause, RotateCcw, Volume2, VolumeX, Languages,
  Users, CalendarDays, Coins, Award, BarChart3,
  Plus, ArrowRight, Clock, CheckCircle, FileText, Download,
  Search, Eye, Trash2, TrendingUp, Target,
  ShieldCheck, Gift, ChevronRight, UserPlus, Building2,
  Settings, CheckCircle2, FileDown, Star,
} from 'lucide-react';
import { DemoCursor } from '@/modules/external/components/onboarding/DemoCursor';
import { pickBestVoice, splitForSpeech, languageTagFor, configureUtteranceForFemaleVoice } from '@/modules/external/components/onboarding/narrationVoice';
import {
  HR_STEPS, HR_CHAPTERS, initialHRDemoState,
  type HRDemoState,
} from './hrDemoScript';
import { pickLang, getCaption, getChapterTitle } from './hrDemoTranslations';

interface Props {
  open: boolean;
  onClose: () => void;
}

// ─── Demo data ────────────────────────────────────────────────────────────────

// Net = gross − CNSS_employee (9.18%) − IRPP (progressive brackets) − CSS (1% of taxable gross) + bonus
// Backend reference: HrService.cs:421-524 (formula version "tn_v2")
const DEMO_EMPLOYEES = [
  { id: 'amira',   name: 'Amira Ben Ali',      email: 'amira@flowentra.tn',   dept: 'Engineering', title: 'HR Manager',         gross: 4500, net: 3679, contract: 'CDI', hireDate: '2022-03-15', init: 'AB', color: 'bg-violet-500' },
  { id: 'khalil',  name: 'Khalil Mansouri',     email: 'khalil@flowentra.tn',  dept: 'Engineering', title: 'Software Developer', gross: 3800, net: 3105, contract: 'CDI', hireDate: '2023-01-10', init: 'KM', color: 'bg-blue-500'   },
  { id: 'sonia',   name: 'Sonia Trabelsi',      email: 'sonia@flowentra.tn',   dept: 'Sales',       title: 'Sales Rep.',         gross: 2800, net: 2285, contract: 'CDD', hireDate: '2024-02-01', init: 'ST', color: 'bg-rose-500'   },
  { id: 'mohamed', name: 'Mohamed Chaabane',    email: 'mohamed@flowentra.tn', dept: 'Finance',     title: 'Accountant',         gross: 3200, net: 2611, contract: 'CDI', hireDate: '2021-06-20', init: 'MC', color: 'bg-amber-500'  },
  { id: 'fatma',   name: 'Fatma Rezgui',        email: 'fatma@flowentra.tn',   dept: 'Operations',  title: 'Operations Lead',    gross: 3600, net: 2942, contract: 'CDI', hireDate: '2022-09-05', init: 'FR', color: 'bg-teal-500'   },
];

const DEMO_DEPARTMENTS = [
  { id: 'eng',  name: 'Engineering',     head: 'Amira Ben Ali',    count: 8, totalGross: 35000 },
  { id: 'sal',  name: 'Sales',           head: 'Sonia Trabelsi',   count: 5, totalGross: 16000 },
  { id: 'fin',  name: 'Finance',         head: 'Mohamed Chaabane', count: 3, totalGross: 10200 },
  { id: 'ops',  name: 'Operations',      head: 'Fatma Rezgui',     count: 4, totalGross: 15400 },
  { id: 'hr',   name: 'Human Resources', head: 'Amira Ben Ali',    count: 2, totalGross: 8300  },
];

const DEMO_LEAVES = [
  { id: 'l1', employee: 'Amira Ben Ali',     type: 'Annual',      start: '2025-06-10', end: '2025-06-20', days: 11, status: 'approved' },
  { id: 'l2', employee: 'Khalil Mansouri',   type: 'Sick',        start: '2025-06-06', end: '2025-06-07', days: 2,  status: 'pending'  },
  { id: 'l3', employee: 'Sonia Trabelsi',    type: 'Annual',      start: '2025-07-01', end: '2025-07-15', days: 15, status: 'approved' },
  { id: 'l4', employee: 'Mohamed Chaabane',  type: 'Exceptional', start: '2025-06-12', end: '2025-06-12', days: 1,  status: 'approved' },
];

// Payroll lines now include CSS (Contribution Sociale de Solidarité, 1% of taxable gross).
// net = gross − cnssEmp − irpp − css + bonus  (matches HrService.cs:481)
const DEMO_PAYROLL = [
  { name: 'Amira Ben Ali',    gross: 4500, cnssEmp: 413, cnssEr: 746, irpp: 367, css: 41, bonus: 0,   net: 3679 },
  { name: 'Khalil Mansouri',  gross: 3800, cnssEmp: 349, cnssEr: 630, irpp: 311, css: 35, bonus: 200, net: 3305 },
  { name: 'Sonia Trabelsi',   gross: 2800, cnssEmp: 257, cnssEr: 464, irpp: 233, css: 25, bonus: 0,   net: 2285 },
  { name: 'Mohamed Chaabane', gross: 3200, cnssEmp: 294, cnssEr: 531, irpp: 266, css: 29, bonus: 0,   net: 2611 },
  { name: 'Fatma Rezgui',     gross: 3600, cnssEmp: 330, cnssEr: 597, irpp: 295, css: 33, bonus: 150, net: 3092 },
];

const DEMO_BONUSES = [
  { id: 'b1', employee: 'Khalil Mansouri', type: 'Performance', amount: 200, month: '2025-06', included: false },
  { id: 'b2', employee: 'Fatma Rezgui',    type: 'Project',     amount: 150, month: '2025-06', included: false },
  { id: 'b3', employee: 'Amira Ben Ali',   type: 'Eid',         amount: 500, month: '2025-04', included: true  },
  { id: 'b4', employee: 'Sonia Trabelsi',  type: 'Performance', amount: 300, month: '2025-03', included: true  },
];

const DEMO_CNSS = [
  { period: '2025-06', employee: 'Amira Ben Ali',    gross: 4500, empAmt: 413,  erAmt: 746, total: 1159, status: 'pending'  },
  { period: '2025-06', employee: 'Khalil Mansouri',  gross: 3800, empAmt: 349,  erAmt: 630, total: 979,  status: 'pending'  },
  { period: '2025-05', employee: 'Amira Ben Ali',    gross: 4500, empAmt: 413,  erAmt: 746, total: 1159, status: 'declared' },
  { period: '2025-05', employee: 'Khalil Mansouri',  gross: 3800, empAmt: 349,  erAmt: 630, total: 979,  status: 'declared' },
];

const DEMO_GOALS = [
  { id: 'g1', title: 'Complete HR Module Rollout',      employee: 'Amira Ben Ali',    due: '2025-06-30', progress: 75, status: 'on-track' },
  { id: 'g2', title: 'Increase Sales Pipeline 20%',     employee: 'Sonia Trabelsi',   due: '2025-12-31', progress: 35, status: 'on-track' },
  { id: 'g3', title: 'Refactor Auth Service',           employee: 'Khalil Mansouri',  due: '2025-07-15', progress: 90, status: 'on-track' },
  { id: 'g4', title: 'Year-End Financial Audit Prep',   employee: 'Mohamed Chaabane', due: '2025-12-15', progress: 10, status: 'at-risk'  },
];

const DEMO_REVIEWS = [
  { id: 'r1', reviewer: 'Amira Ben Ali',    reviewee: 'Khalil Mansouri', score: 4.5, cycle: 'Q1 2025', status: 'completed' },
  { id: 'r2', reviewer: 'Amira Ben Ali',    reviewee: 'Sonia Trabelsi',  score: 4.0, cycle: 'Q1 2025', status: 'completed' },
  { id: 'r3', reviewer: 'Mohamed Chaabane', reviewee: 'Fatma Rezgui',    score: 4.2, cycle: 'Q1 2025', status: 'completed' },
  { id: 'r4', reviewer: 'Amira Ben Ali',    reviewee: 'Khalil Mansouri', score: null,cycle: 'Q2 2025', status: 'pending'   },
];

const DEMO_OPENINGS = [
  { id: 'op1', title: 'Senior Developer', dept: 'Engineering', type: 'CDI', level: 'Senior',  seats: 1, status: 'open', apps: 8 },
  { id: 'op2', title: 'Sales Manager',    dept: 'Sales',       type: 'CDI', level: 'Manager', seats: 1, status: 'open', apps: 5 },
];

const DEMO_APPLICANTS = [
  { id: 'ap1', name: 'Ali Hammami',     position: 'Senior Developer', stage: 'Interview', init: 'AH' },
  { id: 'ap2', name: 'Rania Gharbi',    position: 'Senior Developer', stage: 'Offer',     init: 'RG' },
  { id: 'ap3', name: 'Tarek Ben Amor',  position: 'Sales Manager',    stage: 'Screening', init: 'TB' },
  { id: 'ap4', name: 'Ines Mzali',      position: 'Senior Developer', stage: 'Applied',   init: 'IM' },
];

const DEMO_INTERVIEWS = [
  { id: 'i1', candidate: 'Ali Hammami', position: 'Senior Developer', date: '2025-06-09', time: '10:00', interviewer: 'Amira Ben Ali'   },
  { id: 'i2', candidate: 'Rania Gharbi', position: 'Senior Developer', date: '2025-06-10', time: '14:30', interviewer: 'Khalil Mansouri' },
];

const ATT_DAYS = ['02','03','04','05','06','09','10','11','12','13'];
const ATT_GRID = [
  { name: 'Amira B.',   days: ['P','P','P','P','P','P','LV','LV','LV','LV'] },
  { name: 'Khalil M.',  days: ['P','P','P','P','L','P','P','P','P','P']     },
  { name: 'Sonia T.',   days: ['P','L','P','P','P','P','P','A','P','P']     },
  { name: 'Mohamed C.', days: ['P','P','P','P','P','P','P','P','P','P']     },
  { name: 'Fatma R.',   days: ['P','P','L','P','P','P','P','P','P','P']     },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtTnd = (n: number) =>
  n.toLocaleString('fr-TN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const HR_STATUS_CLS: Record<string, string> = {
  active:     'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  approved:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  completed:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  'on-track': 'bg-green-100 text-green-700',
  open:       'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  declared:   'bg-blue-100 text-blue-700',
  CDI:        'bg-blue-100 text-blue-700',
  pending:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  CDD:        'bg-amber-100 text-amber-700',
  'at-risk':  'bg-red-100 text-red-700',
  rejected:   'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const STAGE_CLS: Record<string, string> = {
  Applied:   'bg-muted text-muted-foreground',
  Screening: 'bg-blue-100 text-blue-700',
  Interview: 'bg-purple-100 text-purple-700',
  Offer:     'bg-amber-100 text-amber-700',
  Hired:     'bg-green-100 text-green-700',
  Rejected:  'bg-red-100 text-red-700',
};

function StatusBadge({ status }: { status: string }) {
  const label =
    status === 'on-track' ? 'On Track' :
    status === 'at-risk'  ? 'At Risk'  :
    status.charAt(0).toUpperCase() + status.slice(1);
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${HR_STATUS_CLS[status] ?? 'bg-muted text-muted-foreground'}`}>
      {label}
    </span>
  );
}

function StatCard({ id, icon, label, value, highlight }: { id: string; icon: React.ReactNode; label: string; value: string | number; highlight?: boolean }) {
  return (
    <div id={id} className={`bg-card border rounded-lg p-3 sm:p-4 transition-all ${highlight ? 'border-primary shadow-md ring-1 ring-primary/30' : 'border-border'}`}>
      <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium mb-1">{icon}{label}</div>
      <p className="text-xl font-bold text-foreground">{value}</p>
    </div>
  );
}

// ─── Sub-navigation ───────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { page: 'dashboard',   label: 'Dashboard',   icon: BarChart3,   navId: undefined                    },
  { page: 'employees',   label: 'Employees',   icon: Users,       navId: 'hr-demo-nav-employees'      },
  { page: 'attendance',  label: 'Attendance',  icon: CalendarDays,navId: 'hr-demo-nav-attendance'     },
  { page: 'leaves',      label: 'Leaves',      icon: Clock,       navId: 'hr-demo-nav-leaves'         },
  { page: 'payroll',     label: 'Payroll',     icon: Coins,       navId: 'hr-demo-nav-payroll'        },
  { page: 'bonuses',     label: 'Bonuses',     icon: Gift,        navId: 'hr-demo-nav-bonuses'        },
  { page: 'cnss',        label: 'CNSS',        icon: ShieldCheck, navId: 'hr-demo-nav-cnss'           },
  { page: 'departments', label: 'Departments', icon: Building2,   navId: 'hr-demo-nav-departments'    },
  { page: 'performance', label: 'Performance', icon: Target,      navId: 'hr-demo-nav-performance'    },
  { page: 'recruitment', label: 'Recruitment', icon: UserPlus,    navId: 'hr-demo-nav-recruitment'    },
  { page: 'reports',     label: 'Reports',     icon: TrendingUp,  navId: 'hr-demo-nav-reports'        },
  { page: 'settings',    label: 'Settings',    icon: Settings,    navId: 'hr-demo-nav-settings'       },
] as const;

type NavPage = typeof NAV_ITEMS[number]['page'];

function DemoSubNav({ current }: { current: string }) {
  const rootPage: NavPage =
    current === 'employee-detail' ? 'employees' :
    (NAV_ITEMS.some(n => n.page === current) ? current as NavPage : 'dashboard');

  return (
    <div className="shrink-0 border-b border-border/60 bg-card/50 px-4 overflow-x-auto">
      <div className="flex gap-0 -mb-px min-w-max">
        {NAV_ITEMS.map(item => {
          const active = rootPage === item.page;
          return (
            <div
              key={item.page}
              id={item.navId}
              className={`inline-flex items-center gap-1 px-2.5 py-2 text-[11px] font-medium border-b-2 transition-colors whitespace-nowrap cursor-default
                ${active ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
            >
              <item.icon className="h-3 w-3" />
              {item.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page renderers ───────────────────────────────────────────────────────────

function PageDashboard() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 id="hr-demo-title" className="text-2xl font-bold text-foreground">Human Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">Your complete HR management centre</p>
        </div>
        <div className="flex gap-2">
          <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Employees
          </div>
          <div className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium">
            <Plus className="h-3.5 w-3.5" /> Add Employee
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard id="hr-demo-stat-headcount" icon={<Users className="h-3.5 w-3.5 text-chart-1" />}      label="Headcount"          value={22}          />
        <StatCard id="hr-demo-stat-on-leave"  icon={<Clock className="h-3.5 w-3.5 text-chart-2" />}      label="On Leave Today"     value={1}           />
        <StatCard id="hr-demo-stat-pending"   icon={<FileText className="h-3.5 w-3.5 text-chart-3" />}   label="Pending Leaves"     value={2}           />
        <StatCard id="hr-demo-stat-payroll"   icon={<Coins className="h-3.5 w-3.5 text-chart-4" />}      label="Monthly Payroll"    value="17,900 TND"  />
      </div>

      {/* Panels */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Leaves at a Glance */}
        <div id="hr-demo-leave-alerts" className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <Clock className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Leaves at a Glance</span>
          </div>
          <div className="divide-y divide-border/40">
            {DEMO_LEAVES.filter(l => l.status !== 'rejected').map(l => (
              <div key={l.id} className="flex items-center justify-between px-4 py-2.5">
                <div>
                  <p className="text-xs font-medium">{l.employee}</p>
                  <p className="text-[10px] text-muted-foreground">{l.type} · {l.start} → {l.end}</p>
                </div>
                <StatusBadge status={l.status} />
              </div>
            ))}
          </div>
        </div>

        {/* Contract Alerts */}
        <div id="hr-demo-contract-alerts" className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60">
            <FileText className="h-4 w-4 text-amber-500" />
            <span className="text-sm font-medium">Contract Expiry Alerts</span>
            <span className="ml-auto text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">1 expiring in 60d</span>
          </div>
          <div className="px-4 py-3 space-y-3">
            <div className="flex items-center justify-between p-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
              <div>
                <p className="text-xs font-medium">Sonia Trabelsi</p>
                <p className="text-[10px] text-muted-foreground">CDD · Expires 2025-08-01</p>
              </div>
              <div className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">56 days</div>
            </div>
            <p className="text-[10px] text-muted-foreground">No other contracts expiring within 60 days.</p>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div id="hr-demo-quick-links" className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: CalendarDays, label: 'Attendance', color: 'text-blue-500'   },
          { icon: Coins,        label: 'Payroll',    color: 'text-chart-1'    },
          { icon: Gift,         label: 'Bonuses',    color: 'text-amber-500'  },
          { icon: ShieldCheck,  label: 'CNSS',       color: 'text-green-500'  },
          { icon: TrendingUp,   label: 'Reports',    color: 'text-purple-500' },
          { icon: Settings,     label: 'Settings',   color: 'text-slate-500'  },
          { icon: Building2,    label: 'Departments',color: 'text-teal-500'   },
          { icon: UserPlus,     label: 'Recruitment',color: 'text-rose-500'   },
        ].map(q => (
          <div key={q.label} className="border border-border rounded-lg py-3 flex flex-col items-center gap-1.5 bg-card hover:bg-muted/40 cursor-default">
            <q.icon className={`h-5 w-5 ${q.color}`} />
            <span className="text-xs font-medium text-foreground">{q.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PageEmployees({ state }: { state: HRDemoState }) {
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Employees</h1>
          <p className="text-xs text-muted-foreground">{DEMO_EMPLOYEES.length} employees</p>
        </div>
        <div className="flex gap-2">
          <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <Download className="h-3.5 w-3.5" /> Export
          </div>
          <div className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
            <Plus className="h-3.5 w-3.5" /> Add Employee
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3 border-b border-border/60">
        {[
          { key: 'total',   label: 'Total',          value: DEMO_EMPLOYEES.length, icon: <Users className="h-3.5 w-3.5" />        },
          { key: 'ready',   label: 'Payroll Ready',  value: 5,                     icon: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" /> },
          { key: 'onleave', label: 'On Leave Today', value: 1,                     icon: <Clock className="h-3.5 w-3.5 text-amber-500" /> },
        ].map(s => (
          <div
            key={s.key}
            id={s.key === 'ready' ? 'hr-demo-emp-stat-ready' : undefined}
            className={`bg-card border rounded-lg p-2.5 cursor-default transition-all ${state.highlightedStat === s.key ? 'border-primary ring-1 ring-primary/30 shadow-md' : 'border-border'}`}
          >
            <div className="flex items-center gap-1.5 text-muted-foreground text-[10px] font-medium">{s.icon}{s.label}</div>
            <p className="text-sm font-bold text-foreground mt-0.5">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60">
        <div id="hr-demo-emp-search" className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <div className="h-8 pl-8 pr-3 rounded-md border border-border bg-background text-xs text-muted-foreground flex items-center">
            {state.searchQuery || 'Search by name, email, department…'}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="px-4 py-3">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Department</th>
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Contract</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Gross</th>
              <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">Payroll</th>
              <th className="w-12 px-4 py-2.5" />
            </tr></thead>
            <tbody>
              {DEMO_EMPLOYEES.map((emp, i) => (
                <tr
                  key={emp.id}
                  id={i === 0 ? 'hr-demo-emp-row' : undefined}
                  className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default"
                >
                  <td className="px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <div className={`h-7 w-7 rounded-full ${emp.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{emp.init}</div>
                      <div>
                        <p className="font-medium text-foreground">{emp.name}</p>
                        <p className="text-[10px] text-muted-foreground">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{emp.dept}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${HR_STATUS_CLS[emp.contract] ?? 'bg-muted text-muted-foreground'}`}>{emp.contract}</span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">{fmtTnd(emp.gross)} TND</td>
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Ready</span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground inline-block cursor-default" />
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

function PageEmployeeDetail({ state }: { state: HRDemoState }) {
  const emp = DEMO_EMPLOYEES.find(e => e.id === state.selectedEmployee) ?? DEMO_EMPLOYEES[0];
  const tab = state.activeTab;

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      {/* Header */}
      <div id="hr-demo-emp-detail-header" className="flex items-start gap-4">
        <div className={`h-16 w-16 rounded-2xl ${emp.color} flex items-center justify-center text-white text-xl font-bold shrink-0`}>{emp.init}</div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold text-foreground">{emp.name}</h1>
          <p className="text-sm text-muted-foreground">{emp.title} · {emp.dept}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <StatusBadge status="active" />
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${HR_STATUS_CLS[emp.contract]}`}>{emp.contract}</span>
            <span className="text-[10px] text-muted-foreground">Hired {emp.hireDate}</span>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">Edit</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border/60 -mb-px overflow-x-auto">
        {[
          { key: 'profile',   label: 'Profile'   },
          { key: 'salary',    label: 'Salary',    id: 'hr-demo-emp-tab-salary'   },
          { key: 'documents', label: 'Documents', id: 'hr-demo-emp-tab-docs'     },
          { key: 'cnss',      label: 'CNSS',      id: 'hr-demo-emp-tab-cnss'     },
          { key: 'bonuses',   label: 'Bonuses',   id: 'hr-demo-emp-tab-bonuses'  },
          { key: 'leaves',    label: 'Leaves',    id: 'hr-demo-emp-tab-leaves'   },
          { key: 'history',   label: 'History',   id: 'hr-demo-emp-tab-history'  },
        ].map(t => (
          <div
            key={t.key}
            id={(t as any).id}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-default whitespace-nowrap
              ${tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            {t.label}
          </div>
        ))}
      </div>

      {tab === 'profile' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-xs">
            <p className="text-xs font-semibold mb-2">Personal Information</p>
            {[
              ['Full Name', emp.name],
              ['Email',     emp.email],
              ['Department', emp.dept],
              ['Job Title',  emp.title],
              ['Contract',   emp.contract],
              ['Hire Date',  emp.hireDate],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'salary' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-xs">
            <p className="text-xs font-semibold mb-2">Salary Configuration</p>
            {(() => {
              const cnssEmp = Math.round(emp.gross * 0.0918);
              const css = Math.round((emp.gross - cnssEmp) * 0.01);
              const irpp = emp.gross - emp.net - cnssEmp - css;
              return [
                ['Gross Salary',            `${fmtTnd(emp.gross)} TND`],
                ['CNSS Employee (9.18%)',   `${fmtTnd(cnssEmp)} TND`],
                ['CNSS Employer (16.57%)',  `${fmtTnd(Math.round(emp.gross * 0.1657))} TND`],
                ['IRPP',                    `${fmtTnd(irpp)} TND`],
                ['CSS Solidarity (1%)',     `${fmtTnd(css)} TND`],
                ['Net Salary (preview)',    `${fmtTnd(emp.net)} TND`],
              ];
            })().map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-xs">
            <p className="text-xs font-semibold mb-2">Social Security</p>
            {[
              ['CNSS Number', '123456789'],
              ['Head of Family', 'Yes'],
              ['Children', '2'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'documents' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-sm font-medium">Documents</span>
            <div className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] flex items-center gap-1 cursor-default">
              <Plus className="h-3 w-3" /> Upload
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { name: 'Employment Contract — CDI', cat: 'Contract',  date: '2022-03-15', by: 'HR Admin' },
              { name: 'CIN Copy — Recto Verso',    cat: 'ID',        date: '2022-03-15', by: 'HR Admin' },
              { name: 'Diploma — Engineering',     cat: 'Diploma',   date: '2022-03-16', by: 'Amira B.' },
            ].map(d => (
              <div key={d.name} className="flex items-center gap-3 px-4 py-3">
                <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{d.name}</p>
                  <p className="text-[10px] text-muted-foreground">{d.cat} · {d.date} · {d.by}</p>
                </div>
                <Download className="h-3.5 w-3.5 text-muted-foreground cursor-default" />
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'cnss' && (
        <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-xs">
          <p className="text-xs font-semibold mb-2">CNSS Profile</p>
          {[
            ['CNSS Number',        '123456789'],
            ['Affiliation Date',   emp.hireDate],
            ['Dependants',         '2'],
            ['Employee Rate',      '9.18%'],
            ['Employer Rate',      '16.57%'],
            ['Quarterly Status',   'Declared'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      )}

      {tab === 'bonuses' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 text-sm font-medium">Personal Bonus History</div>
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Month</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Type</th>
              <th className="text-right px-4 py-2 text-muted-foreground font-medium">Amount</th>
              <th className="text-left px-4 py-2 text-muted-foreground font-medium">Payroll Run</th>
            </tr></thead>
            <tbody>
              {DEMO_BONUSES.filter(b => b.employee === emp.name).map(b => (
                <tr key={b.id} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2">{b.month}</td>
                  <td className="px-4 py-2 text-muted-foreground">{b.type}</td>
                  <td className="px-4 py-2 text-right font-medium text-green-700">+{fmtTnd(b.amount)} TND</td>
                  <td className="px-4 py-2 text-muted-foreground">{b.included ? `${b.month} run` : '—'}</td>
                </tr>
              ))}
              {DEMO_BONUSES.filter(b => b.employee === emp.name).length === 0 && (
                <tr><td colSpan={4} className="px-4 py-4 text-center text-muted-foreground">No bonuses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'leaves' && (
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-3 text-xs">
            <p className="text-xs font-semibold mb-2">Balances (2025)</p>
            {[
              ['Annual',      '12 / 21 days'],
              ['Sick',        '4 / 6 days'],
              ['Maternity',   '0 / 30 days'],
              ['Exceptional', '2 / 3 days'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium text-foreground">{v}</span>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-border/60 text-sm font-medium">Recent History</div>
            <div className="divide-y divide-border/40">
              {DEMO_LEAVES.filter(l => l.employee === emp.name).map(l => (
                <div key={l.id} className="flex items-center justify-between px-4 py-2.5 text-xs">
                  <div>
                    <p className="font-medium">{l.type}</p>
                    <p className="text-[10px] text-muted-foreground">{l.start} → {l.end} · {l.days}d</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              ))}
              {DEMO_LEAVES.filter(l => l.employee === emp.name).length === 0 && (
                <p className="px-4 py-4 text-center text-muted-foreground text-xs">No leaves recorded.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="px-4 py-3 border-b border-border/60 text-sm font-medium">Change Audit Log</div>
          <div className="divide-y divide-border/40 text-xs">
            {[
              { date: '2025-05-01', who: 'HR Admin',     change: 'Gross salary updated', from: '4,300 TND', to: '4,500 TND' },
              { date: '2024-09-15', who: 'Amira B.',     change: 'Job title changed',    from: 'HR Lead',   to: 'HR Manager' },
              { date: '2024-01-10', who: 'System',       change: 'Department reassigned',from: 'Operations',to: 'Engineering' },
              { date: emp.hireDate, who: 'HR Admin',     change: 'Employee created',     from: '—',         to: emp.title },
            ].map((h, i) => (
              <div key={i} className="grid grid-cols-[80px_1fr_auto] gap-3 px-4 py-2.5 items-center">
                <span className="text-muted-foreground">{h.date}</span>
                <div>
                  <p className="font-medium">{h.change}</p>
                  <p className="text-[10px] text-muted-foreground">{h.from} → {h.to}</p>
                </div>
                <span className="text-[10px] text-muted-foreground">{h.who}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PageAttendance() {
  const attCls: Record<string, string> = {
    P:  'bg-green-100 text-green-700',
    L:  'bg-amber-100 text-amber-700',
    A:  'bg-red-100 text-red-700',
    LV: 'bg-blue-100 text-blue-700',
  };
  const attLabel: Record<string, string> = { P: 'P', L: 'L', A: 'A', LV: 'LV' };

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Attendance</h1>
          <p className="text-xs text-muted-foreground">June 2025 · Monthly attendance grid</p>
        </div>
        <div id="hr-demo-att-export" className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
          <Download className="h-3.5 w-3.5" /> Export Excel
        </div>
      </div>

      {/* Summary strip */}
      <div id="hr-demo-att-stats" className="grid grid-cols-4 gap-3">
        {[
          { label: 'Attendance Rate', value: '94%',  color: 'text-green-600'  },
          { label: 'Late Arrivals',   value: '4',    color: 'text-amber-600'  },
          { label: 'Absences',        value: '1',    color: 'text-red-600'    },
          { label: 'Avg Hours/Day',   value: '7.8h', color: 'text-foreground' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Grid */}
      <div id="hr-demo-att-grid" className="bg-card border border-border rounded-lg overflow-hidden">
        <div className="px-4 py-2 border-b border-border/60 flex items-center gap-4 text-[10px] text-muted-foreground">
          <span>Legend:</span>
          {[['P','Present','bg-green-100 text-green-700'],['L','Late','bg-amber-100 text-amber-700'],['A','Absent','bg-red-100 text-red-700'],['LV','Leave','bg-blue-100 text-blue-700']].map(([k,label,cls]) => (
            <span key={k} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${cls}`}>{k} = {label}</span>
          ))}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-border/60 bg-muted/30">
              <th className="text-left px-4 py-2 text-muted-foreground font-medium w-32">Employee</th>
              {ATT_DAYS.map(d => (
                <th key={d} className="text-center px-2 py-2 text-muted-foreground font-medium text-[10px]">Jun {d}</th>
              ))}
            </tr></thead>
            <tbody>
              {ATT_GRID.map(row => (
                <tr key={row.name} className="border-b border-border/40 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-foreground">{row.name}</td>
                  {row.days.map((d, i) => (
                    <td key={i} className="px-1 py-2 text-center">
                      <span className={`inline-flex items-center justify-center h-6 w-7 rounded text-[10px] font-medium ${attCls[d]}`}>{attLabel[d]}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PageLeaves({ state }: { state: HRDemoState }) {
  const tab = state.leaveTab;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Leaves</h1>
          <p className="text-xs text-muted-foreground">Manage leave requests and balances</p>
        </div>
        <div id="hr-demo-leave-new-btn" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> New Leave Request
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border/60 px-4">
        {[
          { key: 'list',     label: 'List',     id: 'hr-demo-leave-list'     },
          { key: 'calendar', label: 'Calendar', id: 'hr-demo-leave-calendar' },
          { key: 'balances', label: 'Balances', id: 'hr-demo-leave-balances' },
          { key: 'approval', label: 'Approval', id: 'hr-demo-leave-approval' },
        ].map(t => (
          <div
            key={t.key}
            id={t.id}
            className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-default
              ${tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}
          >
            {t.label}
            {t.key === 'approval' && (
              <span className="ml-1.5 h-4 w-4 rounded-full bg-amber-500 text-white text-[9px] inline-flex items-center justify-center">1</span>
            )}
          </div>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {tab === 'list' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Type</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Period</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Days</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
              </tr></thead>
              <tbody>
                {DEMO_LEAVES.map(l => (
                  <tr key={l.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default">
                    <td className="px-4 py-2.5 font-medium">{l.employee}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.type}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{l.start} → {l.end}</td>
                    <td className="px-4 py-2.5 text-right">{l.days}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={l.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'calendar' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
              <span className="text-sm font-medium">June 2025</span>
              <div className="flex gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-green-200 inline-block" />Annual</div>
                <div className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-sm bg-amber-200 inline-block" />Sick</div>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground mb-1">
                {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: 30 }, (_, i) => {
                  const d = i + 1;
                  const isAmiraLeave = d >= 10 && d <= 20;
                  const isKhalilSick = d === 6 || d === 7;
                  return (
                    <div key={d} className={`h-7 rounded text-[10px] flex items-center justify-center font-medium
                      ${isAmiraLeave ? 'bg-green-100 text-green-700' : isKhalilSick ? 'bg-amber-100 text-amber-700' : 'text-foreground'}`}>
                      {d}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'balances' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Annual (Used/Total)</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Sick (Used/Total)</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Remaining</th>
              </tr></thead>
              <tbody>
                {DEMO_EMPLOYEES.map(emp => (
                  <tr key={emp.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-full ${emp.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{emp.init}</div>
                        <span className="font-medium">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">3 / 21</td>
                    <td className="px-4 py-2.5 text-right">0 / 6</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-700">18 days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'approval' && (
          <div className="space-y-3">
            {DEMO_LEAVES.filter(l => l.status === 'pending').map(l => (
              <div key={l.id} className="bg-card border border-border rounded-lg p-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{l.employee}</p>
                  <p className="text-xs text-muted-foreground">{l.type} Leave · {l.start} → {l.end} · {l.days} day{l.days > 1 ? 's' : ''}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <div className="h-8 px-3 rounded-md border border-red-200 text-red-600 text-xs flex items-center gap-1 cursor-default">Reject</div>
                  <div className="h-8 px-3 rounded-md bg-green-600 text-white text-xs flex items-center gap-1 cursor-default font-medium">
                    <CheckCircle className="h-3.5 w-3.5" /> Approve
                  </div>
                </div>
              </div>
            ))}
            {DEMO_LEAVES.filter(l => l.status === 'pending').length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">No pending requests</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PagePayroll({ state }: { state: HRDemoState }) {
  const { showPayrollRun, payrollStep } = state;

  if (showPayrollRun) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-3xl mx-auto">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-chart-1" />
          <div>
            <h1 className="text-lg font-semibold">Run Payroll</h1>
            <p className="text-xs text-muted-foreground">Automated Tunisian payroll calculation</p>
          </div>
          <div id="hr-demo-payroll-run-btn" className="ml-auto h-8 px-3 rounded-md border border-primary text-primary text-xs font-medium flex items-center gap-1.5 cursor-default">
            Run Payroll
          </div>
        </div>

        <div className="bg-card border border-primary/30 rounded-xl shadow-lg overflow-hidden">
          <div className="flex border-b border-border/60">
            {['Select Period', 'Select Employees', 'Preview'].map((s, i) => (
              <div key={s} className={`flex-1 text-center py-3 text-xs font-medium border-b-2 transition-colors
                ${payrollStep > i ? 'border-primary text-primary' : payrollStep === i ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
                {i + 1}. {s}
              </div>
            ))}
          </div>

          <div id="hr-demo-payroll-step-period" className="p-5 space-y-4">
            <p className="text-sm font-medium">Select Payroll Period</p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Month</label>
                <div className="h-9 px-3 rounded-md border border-primary bg-primary/5 text-sm flex items-center justify-between text-foreground">
                  June <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1.5">Year</label>
                <div className="h-9 px-3 rounded-md border border-border text-sm flex items-center justify-between text-foreground">
                  2025 <ChevronRight className="h-4 w-4 rotate-90 text-muted-foreground" />
                </div>
              </div>
            </div>
            <div className="bg-muted/30 rounded-lg p-3 text-xs text-muted-foreground">
              22 working days in June 2025 · Pro-rata applied for new joiners
            </div>
          </div>

          {payrollStep >= 1 && (
            <div id="hr-demo-payroll-step-employees" className="border-t border-border/60 p-5 space-y-3">
              <p className="text-sm font-medium">Select Employees</p>
              {DEMO_EMPLOYEES.map(emp => (
                <div key={emp.id} className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background">
                  <div className={`h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 ${payrollStep >= 2 ? 'bg-primary border-primary' : 'border-border'}`}>
                    {payrollStep >= 2 && <div className="h-2 w-2 rounded-sm bg-white" />}
                  </div>
                  <div className={`h-6 w-6 rounded-full ${emp.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{emp.init}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{emp.name}</p>
                    <p className="text-[10px] text-muted-foreground">{emp.dept}</p>
                  </div>
                  <span className="text-xs font-medium">{fmtTnd(emp.gross)} TND</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (payrollStep >= 3) {
    return (
      <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
        <div className="flex items-center gap-3">
          <Coins className="h-5 w-5 text-chart-1" />
          <div>
            <h1 className="text-lg font-semibold">Payroll Run — June 2025</h1>
            <p className="text-xs text-muted-foreground">5 employees · Calculated automatically</p>
          </div>
          <div id="hr-demo-payslip-pdf" className="ml-auto h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
            <FileDown className="h-3.5 w-3.5" /> Export All PDFs
          </div>
        </div>

        <div id="hr-demo-payroll-step-preview" className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Gross</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">CNSS Emp.</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">CNSS Er.</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">IRPP</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Bonus</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Net</th>
            </tr></thead>
            <tbody>
              {DEMO_PAYROLL.map(p => (
                <tr key={p.name} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                  <td className="px-4 py-2.5 font-medium">{p.name}</td>
                  <td className="px-4 py-2.5 text-right">{fmtTnd(p.gross)}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">−{fmtTnd(p.cnssEmp)}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">{fmtTnd(p.cnssEr)}</td>
                  <td className="px-4 py-2.5 text-right text-red-600">−{fmtTnd(p.irpp)}</td>
                  <td className="px-4 py-2.5 text-right text-green-600">{p.bonus > 0 ? `+${fmtTnd(p.bonus)}` : '—'}</td>
                  <td className="px-4 py-2.5 text-right font-bold text-foreground">{fmtTnd(p.net)}</td>
                </tr>
              ))}
              <tr className="bg-muted/20 font-semibold border-t border-border">
                <td className="px-4 py-2.5">Total</td>
                <td className="px-4 py-2.5 text-right">{fmtTnd(DEMO_PAYROLL.reduce((s,p) => s+p.gross,0))}</td>
                <td className="px-4 py-2.5 text-right text-red-600">−{fmtTnd(DEMO_PAYROLL.reduce((s,p) => s+p.cnssEmp,0))}</td>
                <td className="px-4 py-2.5 text-right">{fmtTnd(DEMO_PAYROLL.reduce((s,p) => s+p.cnssEr,0))}</td>
                <td className="px-4 py-2.5 text-right text-red-600">−{fmtTnd(DEMO_PAYROLL.reduce((s,p) => s+p.irpp,0))}</td>
                <td className="px-4 py-2.5 text-right text-green-600">+{fmtTnd(DEMO_PAYROLL.reduce((s,p) => s+p.bonus,0))}</td>
                <td className="px-4 py-2.5 text-right font-bold">{fmtTnd(DEMO_PAYROLL.reduce((s,p) => s+p.net,0))}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div id="hr-demo-payslip-detail" className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold">Payslip — Amira Ben Ali</p>
              <p id="hr-demo-payslip-pdf-format" className="text-xs text-muted-foreground">Bilingual FR/AR · Company header · Net pay in words · Signature space</p>
            </div>
            <div className="h-8 px-3 rounded-md border border-border flex items-center gap-1.5 text-xs text-muted-foreground cursor-default">
              <FileDown className="h-3.5 w-3.5" /> PDF
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              {[
                ['Gross Salary',            '4,500 TND', ''],
                ['CNSS Employee (9.18%)',   '−413 TND',  'text-red-600'],
                ['IRPP (bracket 25%)',      '−367 TND',  'text-red-600'],
                ['Net Salary',              '3,720 TND', 'text-green-700 font-semibold border-t border-border pt-2'],
              ].map(([k, v, cls]) => (
                <div key={k} className={`flex justify-between ${cls}`}>
                  <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
            <div className="space-y-2">
              {[
                ['CNSS Employer (16.57%)', '746 TND'],
                ['Total Cost to Company',  '5,246 TND'],
                ['Contract Type',          'CDI'],
                ['Hire Date',              '2022-03-15'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between">
                  <span className="text-muted-foreground">{k}</span><span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Payroll</h1>
          <p className="text-xs text-muted-foreground">Automated Tunisian payroll — CNSS, IRPP & net salary</p>
        </div>
        <div id="hr-demo-payroll-run-btn" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          Run Payroll
        </div>
      </div>
      <div className="p-4 md:p-6">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="bg-muted/30 border-b border-border/60">
              <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Gross</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">CNSS Emp.</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">IRPP</th>
              <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Net</th>
              <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {DEMO_PAYROLL.map((p, i) => {
                const emp = DEMO_EMPLOYEES[i];
                return (
                  <tr key={p.name} className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={`h-6 w-6 rounded-full ${emp.color} flex items-center justify-center text-white text-[9px] font-bold shrink-0`}>{emp.init}</div>
                        <span className="font-medium">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right">{fmtTnd(p.gross)}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">−{fmtTnd(p.cnssEmp)}</td>
                    <td className="px-4 py-2.5 text-right text-red-600">−{fmtTnd(p.irpp)}</td>
                    <td className="px-4 py-2.5 text-right font-semibold text-green-700">{fmtTnd(p.net)}</td>
                    <td className="px-4 py-2.5 text-center">
                      <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Ready</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div id="hr-demo-payroll-settings" className="mt-5 bg-card border border-border rounded-lg p-4 text-xs space-y-2">
          <p className="text-sm font-semibold mb-2 flex items-center gap-2"><Settings className="h-3.5 w-3.5 text-slate-500" />Payroll Calculation Rules</p>
          {[
            ['Overtime multiplier',  '1.5×'],
            ['Holiday-day rate',     '2.0×'],
            ['Working-days base',    '22 days/month'],
            ['Rounding policy',      'Nearest TND'],
            ['Net rounding',         'Round half up'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between">
              <span className="text-muted-foreground">{k}</span>
              <span className="font-medium text-foreground">{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function PageBonuses() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Bonuses</h1>
          <p className="text-xs text-muted-foreground">Allocate one-off bonuses included in next payroll run</p>
        </div>
        <div className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> Add Bonus
        </div>
      </div>

      <div id="hr-demo-bonus-table" className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Type</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Amount</th>
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Month</th>
            <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">Included in Payroll</th>
          </tr></thead>
          <tbody>
            {DEMO_BONUSES.map(b => (
              <tr key={b.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2.5 font-medium">{b.employee}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.type}</td>
                <td className="px-4 py-2.5 text-right font-medium text-green-700">+{fmtTnd(b.amount)} TND</td>
                <td className="px-4 py-2.5 text-muted-foreground">{b.month}</td>
                <td className="px-4 py-2.5 text-center">
                  {b.included
                    ? <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-medium">Included</span>
                    : <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">Pending</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageCNSS() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">CNSS</h1>
          <p className="text-xs text-muted-foreground">Caisse Nationale de Sécurité Sociale · Employee & employer contributions</p>
        </div>
      </div>

      {/* Rate config */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card border border-border rounded-lg p-4 text-xs">
          <p className="font-semibold mb-2 flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-blue-500" />Active CNSS Rates</p>
          <div className="flex justify-between py-1"><span className="text-muted-foreground">Employee contribution</span><span className="font-bold text-blue-700">9.18%</span></div>
          <div className="flex justify-between py-1"><span className="text-muted-foreground">Employer contribution</span><span className="font-bold text-blue-700">16.57%</span></div>
          <div className="flex justify-between py-1 border-t border-border mt-1 pt-2"><span className="text-muted-foreground">Total rate</span><span className="font-bold">25.75%</span></div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4 text-xs">
          <p className="font-semibold mb-2">June 2025 Summary</p>
          <div className="flex justify-between py-1"><span className="text-muted-foreground">Employee total</span><span className="font-medium">1,643 TND</span></div>
          <div className="flex justify-between py-1"><span className="text-muted-foreground">Employer total</span><span className="font-medium">2,968 TND</span></div>
          <div className="flex justify-between py-1 border-t border-border mt-1 pt-2 font-semibold"><span>Grand Total</span><span>4,611 TND</span></div>
        </div>
      </div>

      {/* Table */}
      <div id="hr-demo-cnss-table" className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Period</th>
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Employee</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Gross</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Emp. (9.18%)</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Er. (16.57%)</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Total</th>
            <th className="text-center px-4 py-2.5 text-muted-foreground font-medium">Status</th>
          </tr></thead>
          <tbody>
            {DEMO_CNSS.map((c, i) => (
              <tr key={i} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                <td className="px-4 py-2.5 text-muted-foreground">{c.period}</td>
                <td className="px-4 py-2.5 font-medium">{c.employee}</td>
                <td className="px-4 py-2.5 text-right">{fmtTnd(c.gross)}</td>
                <td className="px-4 py-2.5 text-right text-red-600">{fmtTnd(c.empAmt)}</td>
                <td className="px-4 py-2.5 text-right text-muted-foreground">{fmtTnd(c.erAmt)}</td>
                <td className="px-4 py-2.5 text-right font-semibold">{fmtTnd(c.total)}</td>
                <td className="px-4 py-2.5 text-center"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PageDepartments() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Departments</h1>
          <p className="text-xs text-muted-foreground">Organisational structure and headcount</p>
        </div>
        <div id="hr-demo-dept-create" className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> New Department
        </div>
      </div>

      <div id="hr-demo-dept-list" className="bg-card border border-border rounded-lg overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-muted/30 border-b border-border/60">
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Department</th>
            <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Head</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Employees</th>
            <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Total Gross</th>
            <th className="w-12 px-4 py-2.5" />
          </tr></thead>
          <tbody>
            {DEMO_DEPARTMENTS.map(d => (
              <tr key={d.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Building2 className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="font-medium">{d.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{d.head}</td>
                <td className="px-4 py-2.5 text-right">
                  <span className="inline-flex items-center justify-center h-5 w-8 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">{d.count}</span>
                </td>
                <td className="px-4 py-2.5 text-right font-medium">{fmtTnd(d.totalGross)} TND</td>
                <td className="px-4 py-2.5 text-right">
                  <Eye className="h-3.5 w-3.5 text-muted-foreground inline-block cursor-default" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PagePerformance({ state }: { state: HRDemoState }) {
  const tab = state.performanceTab;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Performance</h1>
          <p className="text-xs text-muted-foreground">Goals, review cycles, and performance reviews</p>
        </div>
        <div className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> New Goal
        </div>
      </div>

      <div className="flex gap-0 border-b border-border/60 px-4">
        {[
          { key: 'goals',   label: 'Goals',          id: 'hr-demo-perf-goals'   },
          { key: 'cycles',  label: 'Review Cycles',  id: 'hr-demo-perf-cycles'  },
          { key: 'reviews', label: 'Reviews',        id: 'hr-demo-perf-reviews' },
        ].map(t => (
          <div key={t.key} id={t.id} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-default ${tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
            {t.label}
          </div>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {tab === 'goals' && (
          <div className="space-y-3">
            {DEMO_GOALS.map(g => (
              <div key={g.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium">{g.title}</p>
                    <StatusBadge status={g.status} />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{g.employee} · Due {g.due}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className={`h-full rounded-full transition-all ${g.status === 'at-risk' ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${g.progress}%` }} />
                    </div>
                    <span className="text-xs font-medium text-foreground w-8 text-right">{g.progress}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'cycles' && (
          <div className="space-y-3">
            {[
              { name: 'Q1 2025 Review', start: '2025-01-01', end: '2025-03-31', status: 'completed', reviews: 3 },
              { name: 'Q2 2025 Review', start: '2025-04-01', end: '2025-06-30', status: 'active',    reviews: 4 },
              { name: 'Q3 2025 Review', start: '2025-07-01', end: '2025-09-30', status: 'upcoming',  reviews: 0 },
            ].map(c => (
              <div key={c.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.start} → {c.end}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{c.reviews} reviews</span>
                  <StatusBadge status={c.status} />
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'reviews' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Reviewee</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Reviewer</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Cycle</th>
                <th className="text-center px-4 py-2.5 text-muted-foreground font-medium" id="hr-demo-perf-score">Score</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
              </tr></thead>
              <tbody>
                {DEMO_REVIEWS.map(r => (
                  <tr key={r.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{r.reviewee}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.reviewer}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{r.cycle}</td>
                    <td className="px-4 py-2.5 text-center">
                      {r.score != null
                        ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {[1,2,3,4,5].map(n => (
                              <Star key={n} className={`h-3.5 w-3.5 ${n <= Math.round(r.score!) ? 'text-amber-500 fill-amber-500' : 'text-muted-foreground'}`} />
                            ))}
                            <span className="ml-1 text-[10px] font-bold text-foreground">{r.score}</span>
                          </div>
                        )
                        : <span className="text-muted-foreground">—</span>
                      }
                    </td>
                    <td className="px-4 py-2.5"><StatusBadge status={r.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function PageRecruitment({ state }: { state: HRDemoState }) {
  const tab = state.recruitmentTab;

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border/60">
        <div>
          <h1 className="text-lg font-semibold">Recruitment</h1>
          <p className="text-xs text-muted-foreground">Manage open positions and applicant pipeline</p>
        </div>
        <div className="h-8 px-3 rounded-md bg-primary flex items-center gap-1.5 text-xs text-primary-foreground font-medium cursor-default">
          <Plus className="h-3.5 w-3.5" /> New Opening
        </div>
      </div>

      <div className="flex gap-0 border-b border-border/60 px-4">
        {[
          { key: 'dashboard',   label: 'Dashboard',   id: 'hr-demo-recruit-dashboard'   },
          { key: 'openings',    label: 'Job Openings', id: 'hr-demo-recruit-openings'   },
          { key: 'applicants',  label: 'Applicants',  id: 'hr-demo-recruit-applicants'  },
          { key: 'interviews',  label: 'Interviews',  id: 'hr-demo-recruit-interviews'  },
        ].map(t => (
          <div key={t.key} id={t.id} className={`px-4 py-2 text-xs font-medium border-b-2 transition-colors cursor-default ${tab === t.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
            {t.label}
          </div>
        ))}
      </div>

      <div className="p-4 md:p-6">
        {tab === 'dashboard' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Open Positions',         value: 2,  color: 'text-blue-600'   },
                { label: 'Active Applicants',      value: 4,  color: 'text-purple-600' },
                { label: 'Interviews This Week',   value: 2,  color: 'text-amber-600'  },
                { label: 'Pending Offers',         value: 1,  color: 'text-green-600'  },
              ].map(s => (
                <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                  <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="bg-card border border-border rounded-lg p-4 space-y-2 text-xs">
              <p className="font-semibold text-sm mb-3">Pipeline Overview</p>
              {['Applied','Screening','Interview','Offer','Hired'].map((stage, i) => {
                const cnt = [4,2,2,1,0][i];
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="w-20 text-right text-muted-foreground">{stage}</span>
                    <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                      <div className={`h-full ${STAGE_CLS[stage] ?? 'bg-muted'} rounded`} style={{ width: `${(cnt/4)*100}%` }} />
                    </div>
                    <span className="w-4 font-medium text-foreground">{cnt}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'openings' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Position</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Department</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Type</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Level</th>
                <th className="text-right px-4 py-2.5 text-muted-foreground font-medium">Applicants</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Status</th>
              </tr></thead>
              <tbody>
                {DEMO_OPENINGS.map(op => (
                  <tr key={op.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default">
                    <td className="px-4 py-2.5 font-medium">{op.title}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{op.dept}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={op.type} /></td>
                    <td className="px-4 py-2.5 text-muted-foreground">{op.level}</td>
                    <td className="px-4 py-2.5 text-right">{op.apps}</td>
                    <td className="px-4 py-2.5"><StatusBadge status={op.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'applicants' && (
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="bg-muted/30 border-b border-border/60">
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Candidate</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Position</th>
                <th className="text-left px-4 py-2.5 text-muted-foreground font-medium">Stage</th>
                <th className="w-24 px-4 py-2.5" id="hr-demo-recruit-hire" />
              </tr></thead>
              <tbody>
                {DEMO_APPLICANTS.map(ap => (
                  <tr key={ap.id} className="border-b border-border/40 last:border-0 hover:bg-muted/20 cursor-default">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold text-muted-foreground shrink-0">{ap.init}</div>
                        <span className="font-medium">{ap.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{ap.position}</td>
                    <td className="px-4 py-2.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STAGE_CLS[ap.stage] ?? 'bg-muted text-muted-foreground'}`}>{ap.stage}</span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {ap.stage === 'Offer' && (
                        <div className="h-6 px-2 rounded bg-green-600 text-white text-[10px] font-medium flex items-center gap-1 cursor-default w-fit ml-auto">
                          <CheckCircle className="h-3 w-3" /> Mark Hired
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'interviews' && (
          <div className="space-y-3">
            {DEMO_INTERVIEWS.map(iv => (
              <div key={iv.id} className="bg-card border border-border rounded-lg p-4 flex items-start gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{iv.candidate}</p>
                  <p className="text-xs text-muted-foreground">{iv.position}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{iv.date} at {iv.time} · {iv.interviewer}</p>
                </div>
                <div className="h-7 px-3 rounded-md border border-border text-xs text-muted-foreground flex items-center cursor-default">View</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PageReports() {
  const deptBars = [
    { name: 'Engineering', value: 8,  pct: 100 },
    { name: 'Sales',       value: 5,  pct: 63  },
    { name: 'Operations',  value: 4,  pct: 50  },
    { name: 'Finance',     value: 3,  pct: 38  },
    { name: 'HR',          value: 2,  pct: 25  },
  ];
  const monthlyBars = [
    { month: 'Jan', value: 17200, pct: 97 },
    { month: 'Feb', value: 17200, pct: 97 },
    { month: 'Mar', value: 17500, pct: 99 },
    { month: 'Apr', value: 17800, pct: 100 },
    { month: 'May', value: 17850, pct: 100 },
    { month: 'Jun', value: 17900, pct: 100 },
  ];

  return (
    <div className="p-4 md:p-6 space-y-5 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <TrendingUp className="h-5 w-5 text-purple-500" />
        <div>
          <h1 className="text-lg font-semibold">Reports</h1>
          <p className="text-xs text-muted-foreground">HR analytics and workforce insights</p>
        </div>
      </div>

      {/* Report tabs */}
      <div className="flex gap-0 border-b border-border/60 -mb-px overflow-x-auto">
        {[
          { key: 'overview', label: 'Overview' },
          { key: 'cost',     label: 'Cost',     id: 'hr-demo-report-cost-tab' },
          { key: 'cnss',     label: 'CNSS & Absences', id: 'hr-demo-report-cnss-absences' },
        ].map(t => (
          <div key={t.key} id={(t as any).id} className="px-4 py-2 text-xs font-medium border-b-2 border-transparent text-muted-foreground first:border-primary first:text-foreground whitespace-nowrap cursor-default">
            {t.label}
          </div>
        ))}
      </div>


      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-lg p-4">
          <p id="hr-demo-report-headcount" className="text-sm font-semibold mb-4">Headcount by Department</p>
          <div className="space-y-2.5">
            {deptBars.map(b => (
              <div key={b.name} className="flex items-center gap-2 text-xs">
                <span className="w-24 truncate text-right text-muted-foreground shrink-0">{b.name}</span>
                <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
                  <div className="h-full bg-primary/70 rounded transition-all flex items-center justify-end pr-1.5" style={{ width: `${b.pct}%` }}>
                    <span className="text-[10px] text-primary-foreground font-medium">{b.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-lg p-4">
          <p id="hr-demo-report-payroll-chart" className="text-sm font-semibold mb-4">Monthly Payroll Cost (TND)</p>
          <div className="flex items-end gap-2 h-32">
            {monthlyBars.map(b => (
              <div key={b.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] text-muted-foreground font-medium">{fmtTnd(b.value)}</span>
                <div className="w-full rounded-t bg-primary/70 transition-all" style={{ height: `${Math.max(b.pct * 0.7, 4)}%` }} />
                <span className="text-[9px] text-muted-foreground">{b.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { icon: CalendarDays, title: 'Attendance Report',    sub: 'Monthly presence rates and late arrivals'  },
          { icon: Clock,        title: 'Leave Usage Report',   sub: 'Leave types and remaining balances'        },
          { icon: Award,        title: 'Performance Summary',  sub: 'Review scores and goal completion rates'   },
        ].map(c => (
          <div key={c.title} className="bg-card border border-border rounded-lg p-3 flex items-start gap-2 cursor-default hover:border-primary/40 transition-colors">
            <div className="p-1.5 rounded bg-primary/10 shrink-0"><c.icon className="h-3.5 w-3.5 text-primary" /></div>
            <div>
              <p className="text-xs font-semibold">{c.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{c.sub}</p>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground ml-auto mt-0.5 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

function PageSettings() {
  return (
    <div className="p-4 md:p-6 space-y-5 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Settings className="h-5 w-5 text-slate-500" />
        <div className="flex-1">
          <h1 className="text-lg font-semibold">HR Settings</h1>
          <p className="text-xs text-muted-foreground">Leave types, holidays, payroll rules, and CNSS configuration</p>
        </div>
      </div>

      <div id="hr-demo-settings-tabs" className="flex gap-0 border-b border-border/60 -mb-px overflow-x-auto">
        {['Leave Types', 'CNSS Rates', 'Public Holidays', 'General'].map((t, i) => (
          <div key={t} className={`px-4 py-2 text-xs font-medium border-b-2 whitespace-nowrap cursor-default ${i === 0 ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground'}`}>
            {t}
          </div>
        ))}
      </div>


      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/60">
            <span className="text-sm font-medium">Leave Types</span>
            <div className="h-7 px-3 rounded-md bg-primary text-primary-foreground text-[11px] flex items-center gap-1 cursor-default">
              <Plus className="h-3 w-3" /> Add
            </div>
          </div>
          <div className="divide-y divide-border/40">
            {[
              { name: 'Annual Leave',       days: 21, paid: true  },
              { name: 'Sick Leave',         days: 6,  paid: true  },
              { name: 'Maternity Leave',    days: 30, paid: true  },
              { name: 'Exceptional Leave',  days: 3,  paid: true  },
              { name: 'Unpaid Leave',       days: 0,  paid: false },
            ].map(l => (
              <div key={l.name} className="flex items-center justify-between px-4 py-2.5 text-xs">
                <span className="font-medium">{l.name}</span>
                <div className="flex items-center gap-2">
                  {l.days > 0 && <span className="text-muted-foreground">{l.days} days/year</span>}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${l.paid ? 'bg-green-100 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                    {l.paid ? 'Paid' : 'Unpaid'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-card border border-border rounded-lg p-4 text-xs space-y-3">
            <p className="font-semibold">Payroll Rules</p>
            {[
              ['Payroll Cycle',     'Monthly'],
              ['Calculation Base', 'Net Working Days'],
              ['Currency',         'TND (Tunisian Dinar)'],
              ['CNSS Employee',    '9.18%'],
              ['CNSS Employer',    '16.57%'],
            ].map(([k,v]) => (
              <div key={k} className="flex justify-between">
                <span className="text-muted-foreground">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-lg p-4 text-xs space-y-3">
            <p className="font-semibold">Public Holidays 2025</p>
            {[
              ['01 Jan', 'New Year\'s Day'],
              ['20 Mar', 'Independence Day'],
              ['09 Apr', 'Martyrs\' Day'],
              ['01 May', 'Labour Day'],
              ['25 Jul', 'Republic Day'],
            ].map(([d, name]) => (
              <div key={d} className="flex justify-between">
                <span className="text-muted-foreground">{d}</span>
                <span className="font-medium">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main demo component ───────────────────────────────────────────────────────

export function HRAutopilotDemo({ open, onClose }: Props) {
  const { i18n } = useTranslation();
  const [stepIndex, setStepIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [cursor, setCursor] = useState<{ x: number; y: number; clicking: boolean }>({ x: -200, y: -200, clicking: false });
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finished = stepIndex >= HR_STEPS.length;

  const state: HRDemoState = useMemo(() => {
    let s = initialHRDemoState;
    for (let i = 0; i < Math.min(stepIndex + 1, HR_STEPS.length); i++) s = HR_STEPS[i].apply(s);
    return s;
  }, [stepIndex]);

  const step = HR_STEPS[Math.min(stepIndex, HR_STEPS.length - 1)];
  const demoLang = pickLang(i18n.language);
  const captionText = getCaption(demoLang, Math.min(stepIndex, HR_STEPS.length - 1), step.caption);
  const finishedMsg =
    demoLang === 'fr' ? 'Votre module RH est prêt — ajoutez votre équipe et exécutez votre première paie.' :
    'Your HR module is ready — add your team and run your first payroll.';

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
      setCursor({ x: r.left + Math.min(r.width / 2, 120), y: r.top + Math.min(r.height / 2, 60), clicking: true });
      if (clickRef.current) clearTimeout(clickRef.current);
      clickRef.current = setTimeout(() => setCursor(c => ({ ...c, clicking: false })), 450);
    };
    const t = setTimeout(place, 160);
    return () => clearTimeout(t);
  }, [stepIndex, open, finished, step?.target, state.page, state.activeTab, state.leaveTab, state.performanceTab, state.recruitmentTab, state.showPayrollRun, state.payrollStep]);

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

  const activeChapter = HR_CHAPTERS.find(c => stepIndex >= c.start && stepIndex < c.end) || HR_CHAPTERS[HR_CHAPTERS.length - 1];

  return (
    <div className="fixed inset-0 z-[110] bg-background flex flex-col select-none">

      {/* ── Top bar ── */}
      <div className="h-12 shrink-0 border-b border-border/60 bg-card flex items-center px-3 gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm shrink-0">
            <Users className="h-3.5 w-3.5 text-primary-foreground" />
          </span>
          <span className="text-sm font-semibold truncate">HR Module — Live Demo</span>
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

      {/* ── Sub-nav ── */}
      <DemoSubNav current={state.page} />

      {/* ── Content ── */}
      <div className="flex-1 overflow-y-auto pointer-events-none">
        {state.page === 'dashboard'       && <PageDashboard />}
        {state.page === 'employees'       && <PageEmployees       state={state} />}
        {state.page === 'employee-detail' && <PageEmployeeDetail  state={state} />}
        {state.page === 'attendance'      && <PageAttendance />}
        {state.page === 'leaves'          && <PageLeaves          state={state} />}
        {state.page === 'payroll'         && <PagePayroll         state={state} />}
        {state.page === 'bonuses'         && <PageBonuses />}
        {state.page === 'cnss'            && <PageCNSS />}
        {state.page === 'departments'     && <PageDepartments />}
        {state.page === 'performance'     && <PagePerformance     state={state} />}
        {state.page === 'recruitment'     && <PageRecruitment     state={state} />}
        {state.page === 'reports'         && <PageReports />}
        {state.page === 'settings'        && <PageSettings />}
      </div>

      {/* ── Caption + chapters ── */}
      <div className="shrink-0 border-t border-border/60 bg-card px-4 py-3">
        <div className="flex items-center gap-1.5 mb-2 flex-wrap">
          {HR_CHAPTERS.map(ch => (
            <button
              key={ch.id}
              onClick={() => jumpChapter(ch.start)}
              className={`text-[10px] font-medium px-2 py-0.5 rounded-full transition-colors cursor-pointer
                ${activeChapter.id === ch.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/70'}`}
            >
              {getChapterTitle(demoLang, ch.id, ch.title)}
            </button>
          ))}
          <span className="ml-auto text-[10px] text-muted-foreground">{Math.min(stepIndex + 1, HR_STEPS.length)} / {HR_STEPS.length}</span>
        </div>
        <div className="h-1 rounded-full bg-muted overflow-hidden mb-2">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(Math.min(stepIndex + 1, HR_STEPS.length) / HR_STEPS.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-foreground/90 min-h-[20px] flex items-center gap-2">
          <Languages className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
          {finished ? finishedMsg : captionText}
        </p>
      </div>

      {/* ── Virtual cursor ── */}
      {!finished && <DemoCursor x={cursor.x} y={cursor.y} clicking={cursor.clicking} />}

      {/* ── End card ── */}
      {finished && (
        <div className="absolute inset-0 z-[115] flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm text-center">
            <div className="h-12 w-12 mx-auto rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center mb-3">
              <Users className="h-6 w-6 text-primary-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-1">Complete HR management, built for Tunisia</h3>
            <p className="text-sm text-muted-foreground mb-5">
              Employees · Attendance · Leaves · Payroll with CNSS & IRPP · Bonuses · Performance · Recruitment — all connected.
            </p>
            <div className="flex flex-col gap-2">
              <button onClick={onClose} className="w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90 cursor-pointer">
                Start managing HR
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
