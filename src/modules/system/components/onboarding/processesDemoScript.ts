// Processes module autopilot demo.
// Scripted state transitions, virtual cursor, and EN/FR narration.
// English captions live inline here; translations in processesDemoTranslations.ts
// (must stay PROC_STEPS.length long, same order).

import { PROCESSES } from '@/modules/system/services/processesCatalog';
import { REAL_HANDLER_KEYS } from '@/modules/system/services/processesService';

export type ProcessesDemoPage = 'list';

export type DrawerTab = 'overview' | 'schedule' | 'history' | 'diagnostics';

export interface ProcessesDemoState {
  page: ProcessesDemoPage;
  // Header metrics
  highlightMetric: null | 'running' | 'failed' | 'blocked' | 'paused' | 'total';
  // Toolbar
  searchActive: boolean;
  workspaceFilterOpen: boolean;
  statusFilterOpen: boolean;
  // List row focus
  focusRowIndex: number | null;
  focusRowAction: null | 'run' | 'pause';
  // When set, highlights (and auto-scrolls to) a specific real-process row.
  focusProcessKey: string | null;
  // Drawer
  drawerOpen: boolean;
  drawerTab: DrawerTab;
  drawerHighlight:
    | null
    | 'header'
    | 'actions'
    | 'enable'
    | 'overview'
    | 'schedule-interval'
    | 'history-row'
    | 'diagnostic-item';
  // Simulated run outcome shown in history
  runJustCompleted: boolean;
  // Interval editor animation
  intervalDraft: number;
}

export const initialProcessesDemoState: ProcessesDemoState = {
  page: 'list',
  highlightMetric: null,
  searchActive: false,
  workspaceFilterOpen: false,
  statusFilterOpen: false,
  focusRowIndex: null,
  focusRowAction: null,
  focusProcessKey: null,
  drawerOpen: false,
  drawerTab: 'overview',
  drawerHighlight: null,
  runJustCompleted: false,
  intervalDraft: 60,
};

export interface ProcessesDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: ProcessesDemoState) => ProcessesDemoState;
}
export interface ProcessesDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: ProcessesDemoState) => Partial<ProcessesDemoState>) =>
  (s: ProcessesDemoState): ProcessesDemoState => ({ ...s, ...apply(s) });

// ─── Per-process voiced explanations ────────────────────────────────────────
// Short, spoken-friendly one-liner per real handler. Order defines the order
// the demo walks through them. FR translations live in processesDemoTranslations.
interface ProcessTalk { key: string; caption: string; captionFr: string }

const PROCESS_TALKS: ProcessTalk[] = [
  {
    key: 'admin.invoices-mark-overdue',
    caption:
      'Mark overdue invoices — every hour it flips any invoice past its due date with money still owed into the overdue bucket. A configurable grace_days knob lets you delay the flip so late payments in flight are not shamed.',
    captionFr:
      'Marquer les factures en retard — chaque heure, toute facture dépassée avec un solde impayé bascule en « en retard ». Un paramètre grace_days configurable permet de retarder la bascule pour ne pas pénaliser les paiements en cours de route.',
  },
  {
    key: 'admin.payment-installments-mark-overdue',
    caption:
      'Overdue payment installments — same idea for payment plans: any pending or partially-paid installment past its due date flips to overdue, and shares the same grace_days knob so both stay in sync.',
    captionFr:
      'Échéances en retard — même logique pour les plans de paiement : toute échéance en attente ou partiellement payée dépassée passe en « en retard », avec le même paramètre grace_days pour rester cohérent.',
  },
  {
    key: 'admin.offers-mark-expired',
    caption:
      'Expire past-due offers — offers sent or pending past their validity date are set to expired, so the pipeline never carries dead quotes. A grace_days knob lets you keep them alive an extra day or two while the customer decides.',
    captionFr:
      'Expirer les offres échues — les offres envoyées ou en attente dépassant leur date de validité passent en « expirées », pour un pipeline sans devis morts. Un paramètre grace_days les garde vivantes un jour ou deux pendant la décision du client.',
  },
  {
    key: 'admin.dispatches-mark-missed',
    caption:
      'Missed dispatches — any scheduled dispatch that never started and is more than a two-hour grace past its date is marked missed, so field ops sees it fast.',
    captionFr:
      'Missions manquées — toute intervention planifiée jamais démarrée et dépassée depuis plus de deux heures est marquée « manquée » pour être vue immédiatement.',
  },
  {
    key: 'admin.support-tickets-autoclose-resolved',
    caption:
      'Auto-close resolved tickets — after seven days in resolved status with no reopen, the ticket is closed so the queue only shows what still needs a human.',
    captionFr:
      'Fermeture automatique des tickets résolus — après sept jours en « résolu » sans réouverture, le ticket est fermé pour ne garder en file que ce qui demande une action.',
  },
  {
    key: 'admin.retry-failed-emails',
    caption:
      'Retry failed emails — every five minutes it re-sends outbound emails that failed, up to five attempts, and orphaned ones with no account are given up cleanly.',
    captionFr:
      'Réessayer les emails en échec — toutes les cinq minutes, les emails sortants échoués sont renvoyés, jusqu’à cinq tentatives ; les orphelins sans compte sont abandonnés proprement.',
  },
  {
    key: 'admin.draft-offers-purge',
    caption:
      'Purge abandoned draft offers — offers stuck in draft for over sixty days are hard-deleted so the list only holds real work.',
    captionFr:
      'Purger les brouillons d’offres abandonnés — les offres restées en brouillon plus de soixante jours sont supprimées pour ne garder que le travail réel.',
  },
  {
    key: 'admin.draft-invoices-purge',
    caption:
      'Purge abandoned draft invoices — same treatment for invoices: sixty-day-old drafts are removed permanently.',
    captionFr:
      'Purger les brouillons de factures abandonnés — même traitement pour les factures : les brouillons de plus de soixante jours sont supprimés définitivement.',
  },
  {
    key: 'admin.notifications-purge-read',
    caption:
      'Purge read notifications — notifications already read and older than thirty days are deleted so the tray stays fast and relevant.',
    captionFr:
      'Purger les notifications lues — les notifications déjà lues et âgées de plus de trente jours sont supprimées pour garder le tiroir rapide et pertinent.',
  },
  {
    key: 'admin.notifications-purge-stale-unread',
    caption:
      'Purge stale unread notifications — very old unread notifications, past six months, are cleared out to prevent forever-growing tray backlogs.',
    captionFr:
      'Purger les notifications non lues obsolètes — les notifications non lues de plus de six mois sont supprimées pour éviter que le tiroir n’enfle sans fin.',
  },
  {
    key: 'admin.calendar-events-purge-past',
    caption:
      'Purge past calendar events — completed or cancelled events older than six months are removed to keep the calendar snappy.',
    captionFr:
      'Purger les anciens événements du calendrier — les événements terminés ou annulés de plus de six mois sont supprimés pour garder le calendrier réactif.',
  },
  {
    key: 'admin.sync-changes-purge',
    caption:
      'Purge old sync changes — the offline-sync outbox is trimmed after thirty days so mobile-sync bookkeeping never grows unbounded.',
    captionFr:
      'Purger les anciennes modifications de sync — la file de sync hors-ligne est nettoyée après trente jours pour ne jamais laisser gonfler la comptabilité de sync mobile.',
  },
  {
    key: 'admin.sync-receipts-purge',
    caption:
      'Purge old sync receipts — the per-device sync receipts older than thirty days are deleted, same retention as the outbox.',
    captionFr:
      'Purger les vieux reçus de sync — les accusés de synchro par appareil de plus de trente jours sont supprimés, avec la même rétention que la file.',
  },
  {
    key: 'admin.webhook-jobs-purge',
    caption:
      'Purge completed webhook jobs — webhook forwards that finished or hit dead-letter more than thirty days ago are cleaned up.',
    captionFr:
      'Purger les jobs webhook terminés — les envois webhook terminés ou en dead-letter depuis plus de trente jours sont nettoyés.',
  },
  {
    key: 'admin.external-endpoint-logs-purge',
    caption:
      'Purge external endpoint logs — each endpoint has its own retention window, and this job trims its logs down to it. A fallback_retention_days knob covers endpoints that never set one, so nothing grows unbounded by default.',
    captionFr:
      'Purger les logs d’endpoints externes — chaque endpoint a sa propre rétention, et ce job coupe ses logs à cette limite. Un paramètre fallback_retention_days couvre ceux qui n’en ont pas défini, pour qu’aucun log ne gonfle sans limite.',
  },
  {
    key: 'admin.dispatch-audit-purge',
    caption:
      'Purge dispatch audit logs — dispatch history older than six months is trimmed so audit tables stay compact.',
    captionFr:
      'Purger l’audit des missions — l’historique des missions de plus de six mois est nettoyé pour garder les tables d’audit compactes.',
  },
  {
    key: 'admin.hr-audit-purge',
    caption:
      'Purge HR audit logs — HR audit entries older than a year are removed, keeping the compliance trail useful and not overwhelming.',
    captionFr:
      'Purger l’audit RH — les entrées d’audit RH de plus d’un an sont supprimées, gardant la piste de conformité utile et lisible.',
  },
  {
    key: 'admin.soft-deleted-purge',
    caption:
      'Hard-purge soft-deleted records — invoices, offers, deals, sales and more that were soft-deleted over ninety days ago are permanently removed.',
    captionFr:
      'Purge définitive des enregistrements supprimés — factures, offres, deals, ventes et plus, supprimés en douceur depuis plus de quatre-vingt-dix jours, sont effacés définitivement.',
  },
  {
    key: 'admin.recurring-task-logs-purge',
    caption:
      'Purge recurring task logs — logs of recurring project tasks older than six months are removed so the tasks stay light.',
    captionFr:
      'Purger les logs de tâches récurrentes — les logs de tâches de projet récurrentes de plus de six mois sont supprimés pour garder les tâches légères.',
  },
  {
    key: 'admin.purge-system-logs',
    caption:
      'Purge system logs — the platform log table is trimmed daily against a configurable retention window, in bounded batches so the delete never blocks live traffic. A hard floor also protects process history from being truncated by accident.',
    captionFr:
      'Purger les logs système — la table de logs plateforme est nettoyée chaque jour selon une rétention configurable, par lots bornés pour ne jamais bloquer le trafic en cours. Un plancher dur protège aussi l’historique des processus d’une troncation accidentelle.',
  },
];

// Filter to processes that actually have a handler AND appear in the catalogue,
// preserving the order defined in PROCESS_TALKS so the demo tour stays curated.
const CATALOG_BY_KEY = new Map(PROCESSES.map(p => [p.key, p]));
const REAL_PROCESSES = PROCESS_TALKS
  .filter(t => REAL_HANDLER_KEYS.has(t.key) && CATALOG_BY_KEY.has(t.key))
  .map(t => ({ ...t, def: CATALOG_BY_KEY.get(t.key)! }));

/** Ordered list of real processes the demo showcases, exposed for rendering. */
export const DEMO_REAL_PROCESSES = REAL_PROCESSES.map(r => ({
  key: r.key,
  name: r.def.name,
  module: `${r.def.module} · Admin`,
  schedule: r.def.scheduleHuman,
}));

/** FR caption per process key, used by processesDemoTranslations. */
export const PROCESS_TALK_FR: Record<string, string> = Object.fromEntries(
  PROCESS_TALKS.map(t => [t.key, t.captionFr]),
);

// Steps generated for the "Every process, explained" chapter.
const PROCESS_TOUR_STEPS: ProcessesDemoStep[] = REAL_PROCESSES.map((p) => ({
  target: `proc-demo-row-key-${p.key}`,
  caption: p.caption,
  duration: Math.max(5200, p.caption.length * 55 + 1500),
  apply: pure(() => ({
    focusProcessKey: p.key,
    focusRowIndex: null,
    focusRowAction: null,
    drawerOpen: false,
    drawerHighlight: null,
    highlightMetric: null,
    searchActive: false,
    workspaceFilterOpen: false,
    statusFilterOpen: false,
  })),
}));

// ─── Full step list ─────────────────────────────────────────────────────────

const INTRO_STEPS: ProcessesDemoStep[] = [
  // ── Chapter 1 · Overview & KPIs ─────────────────────────────────────────
  {
    target: 'proc-demo-title',
    caption:
      'This is Background Services — the control tower for every recurring or background job that keeps the platform tidy: overdue invoices, expiring offers, log purges, missed dispatches, and more.',
    duration: 6200,
    apply: pure(() => ({
      highlightMetric: null, searchActive: false, workspaceFilterOpen: false,
      statusFilterOpen: false, focusRowIndex: null, focusRowAction: null,
      focusProcessKey: null,
      drawerOpen: false, drawerTab: 'overview', drawerHighlight: null,
    })),
  },
  // KPI metric chips were removed from the header to match the real ProcessesPage,
  // which surfaces health inline in the list rather than as top-row counters.

  // ── Chapter 2 · Search & Filters ────────────────────────────────────────
  {
    target: 'proc-demo-search',
    caption:
      'Search matches the name, module and description at once — type "invoice" to jump straight to every job that touches invoicing.',
    duration: 4800,
    apply: pure(() => ({ highlightMetric: null, searchActive: true })),
  },
  {
    target: 'proc-demo-workspace-filter',
    caption:
      'Workspace filter narrows to Sales, Field, Admin, Communication and more — the same workspace groups you already know from the rest of the app.',
    duration: 5000,
    apply: pure(() => ({ searchActive: false, workspaceFilterOpen: true })),
  },
  {
    target: 'proc-demo-status-filter',
    caption:
      'Status filter pins the list to Running, Failed, Blocked or Paused — perfect when you want a quick sweep of what needs your attention today.',
    duration: 5200,
    apply: pure(() => ({ workspaceFilterOpen: false, statusFilterOpen: true })),
  },

  // ── Chapter 3 · List & Rows ─────────────────────────────────────────────
  {
    target: 'proc-demo-group-admin',
    caption:
      'Background Services are grouped by workspace so the ownership is obvious. Each group shows a count of the jobs living inside it.',
    duration: 4600,
    apply: pure(() => ({ statusFilterOpen: false })),
  },
];

// Chapter 4 — walk EVERY real process with a one-line spoken explanation.
const TOUR_CHAPTER_INTRO: ProcessesDemoStep = {
  target: 'proc-demo-group-admin',
  caption: `Here are all ${REAL_PROCESSES.length} live processes running on your platform today. Let me walk you through each one — what it does and how often it runs.`,
  duration: 5600,
  apply: pure(() => ({ focusProcessKey: null })),
};

const OUTRO_STEPS: ProcessesDemoStep[] = [
  // ── Row story + actions ─────────────────────────────────────────────────
  {
    target: `proc-demo-row-key-admin.invoices-mark-overdue`,
    caption:
      'Each row tells the whole story at a glance — job name, module, schedule in plain English, and the last and next run.',
    duration: 5400,
    apply: pure(() => ({ focusProcessKey: 'admin.invoices-mark-overdue' })),
  },
  {
    target: 'proc-demo-row-run',
    caption:
      'Run now fires the job on demand — it bypasses the schedule but respects the advisory lock, so if the scheduler is already running it you get a friendly "already running" toast instead of a duplicate.',
    duration: 6000,
    apply: pure(() => ({ focusProcessKey: 'admin.invoices-mark-overdue', focusRowAction: 'run' })),
  },
  {
    target: 'proc-demo-row-pause',
    caption:
      'Pause stops future runs of this specific job without disabling it. Great for maintenance windows — flip it back on and the schedule picks up right where it left off.',
    duration: 5400,
    apply: pure(() => ({ focusRowAction: 'pause' })),
  },

  // ── Drawer deep-dive ────────────────────────────────────────────────────
  {
    target: 'proc-demo-drawer-header',
    caption:
      'Click any row to open the deep-dive drawer — workspace tag, live status, and the human description of what the job actually does under the hood.',
    duration: 5200,
    apply: pure(() => ({
      focusRowAction: null,
      drawerOpen: true, drawerTab: 'overview', drawerHighlight: 'header',
    })),
  },
  {
    target: 'proc-demo-drawer-actions',
    caption:
      'The action bar puts Run now, Pause, Stop and Reset failures one click away. Stop is honest — it warns you it is advisory, so we never pretend to kill an in-flight run.',
    duration: 5800,
    apply: pure(() => ({ drawerHighlight: 'actions' })),
  },
  {
    target: 'proc-demo-drawer-enable',
    caption:
      'The Enabled switch is the master power — off means the scheduler will not touch this job at all. Flip it on once and the schedule row is auto-created so the tick loop picks it up.',
    duration: 5600,
    apply: pure(() => ({ drawerHighlight: 'enable' })),
  },
  {
    target: 'proc-demo-drawer-overview',
    caption:
      'Overview gives you the vitals — schedule, timezone, last duration, items processed last run, next scheduled run, 30-run success rate and the consecutive-failure counter.',
    duration: 6000,
    apply: pure(() => ({ drawerTab: 'overview', drawerHighlight: 'overview' })),
  },
  {
    target: 'proc-demo-drawer-tab-schedule',
    caption:
      'Schedule tab lets you change the cadence — interval jobs get a live editor, cron jobs show their expression. Every job also exposes its own configurable knobs: retention days, grace periods, batch size, retry limits. They are schema-driven — the backend publishes defaults, min and max, so bad values are clamped before they ever hit the database, and labels and hints are localized from the same source of truth.',
    duration: 8600,
    apply: pure(() => ({ drawerTab: 'schedule', drawerHighlight: 'schedule-interval', intervalDraft: 30 })),
  },
  {
    target: 'proc-demo-drawer-tab-history',
    caption:
      'History is the audit trail — every run with start time, duration, items processed, who triggered it, and success or failure with the exact error message underneath.',
    duration: 5800,
    apply: pure(() => ({ drawerTab: 'history', drawerHighlight: 'history-row', runJustCompleted: true })),
  },
  {
    target: 'proc-demo-drawer-tab-diagnostics',
    caption:
      'Diagnostics answers "why is this blocked?" automatically — table exists, permissions granted, dependencies ready. Green means safe to run, red points at the exact fix.',
    duration: 6000,
    apply: pure(() => ({ drawerTab: 'diagnostics', drawerHighlight: 'diagnostic-item' })),
  },

  // ── Wrap-up ─────────────────────────────────────────────────────────────
  {
    target: 'proc-demo-refresh',
    caption:
      'The page polls the backend every fifteen seconds, and Refresh forces an immediate sync. Scheduler-driven runs surface here automatically — no page reload required.',
    duration: 5400,
    apply: pure(() => ({ drawerOpen: false, drawerHighlight: null, focusProcessKey: null })),
  },
  {
    target: 'proc-demo-title',
    caption:
      'That is Background Services end-to-end — every automated job explained, with lock-safe execution, live KPIs, per-row controls, a deep drawer, real history, and self-diagnosing checks. Set it once, and your platform keeps itself clean.',
    duration: 7000,
    apply: pure(() => ({ highlightMetric: null })),
  },
];

export const PROC_STEPS: ProcessesDemoStep[] = [
  ...INTRO_STEPS,
  TOUR_CHAPTER_INTRO,
  ...PROCESS_TOUR_STEPS,
  ...OUTRO_STEPS,
];

// Chapter boundaries computed from section lengths so they stay in sync.
const INTRO_LEN = INTRO_STEPS.length;                          // 10
const TOUR_LEN = 1 + PROCESS_TOUR_STEPS.length;                // intro + N
const ROW_STORY_LEN = 3;                                       // row + run + pause
const DRAWER_LEN = 7;                                          // header..diagnostics
const WRAP_LEN = 2;                                            // refresh + closing

export const PROC_CHAPTERS: ProcessesDemoChapter[] = [
  { id: 'overview', title: 'Overview & KPIs',      start: 0,                                                 end: 6 },
  { id: 'controls', title: 'Search & Filters',     start: 6,                                                 end: 9 },
  { id: 'list',     title: 'List',                  start: 9,                                                 end: INTRO_LEN },
  { id: 'tour',     title: 'Every Process',        start: INTRO_LEN,                                         end: INTRO_LEN + TOUR_LEN },
  { id: 'actions',  title: 'Run & Pause',          start: INTRO_LEN + TOUR_LEN,                              end: INTRO_LEN + TOUR_LEN + ROW_STORY_LEN },
  { id: 'drawer',   title: 'Drawer Deep-Dive',     start: INTRO_LEN + TOUR_LEN + ROW_STORY_LEN,              end: INTRO_LEN + TOUR_LEN + ROW_STORY_LEN + DRAWER_LEN },
  { id: 'wrap',     title: 'Live Sync & Wrap',     start: INTRO_LEN + TOUR_LEN + ROW_STORY_LEN + DRAWER_LEN, end: PROC_STEPS.length },
];
