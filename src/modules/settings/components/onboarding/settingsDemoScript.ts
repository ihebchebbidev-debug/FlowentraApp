// Settings module autopilot demo — mirrors the REAL Settings page 1:1.
//
// Real Settings navigation (see src/modules/settings/pages/SettingsPage.tsx):
//   Personal
//     • Profile   → AccountSettings section="profile"
//     • Security  → AccountSettings section="security"
//   General
//     • Company & preferences → AccountSettings section="company" + UserPreferencesTab
//     • Tenants subscription  → SubscriptionSettings (plans, billing, seats, invoices)
//     • Offline sync          → OfflineHydrationSettings (per-module hydration + last run)
//     • System configuration  → JobConversionModeSettings + NumberingSettings
//
// Users, Roles, User groups, Integrations, Sync history, Companies live in the
// Administration workspace — NOT in the Settings sidebar — so they are NOT part
// of this demo.

export type SettingsSection =
  | 'profile'
  | 'security'
  | 'company'
  | 'subscription'
  | 'offline'
  | 'system';

export interface SettingsDemoState {
  section: SettingsSection;
  // Company & preferences
  prefTheme: 'system' | 'dark';
  prefColorPicked: boolean;
  // Subscription
  showPlans: boolean;
  planPicked: boolean;
  // Offline sync
  offlineAllOn: boolean;
  // System configuration
  jobMode: 'installation' | 'service';
  numberingExpanded: boolean;
  numberingEdited: boolean;
}

export const initialSettingsDemoState: SettingsDemoState = {
  section: 'profile',
  prefTheme: 'system',
  prefColorPicked: false,
  showPlans: false,
  planPicked: false,
  offlineAllOn: false,
  jobMode: 'installation',
  numberingExpanded: false,
  numberingEdited: false,
};

export interface SettingsDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: SettingsDemoState) => SettingsDemoState;
}
export interface SettingsDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: SettingsDemoState) => Partial<SettingsDemoState>) =>
  (s: SettingsDemoState): SettingsDemoState => ({ ...s, ...apply(s) });

export const SET_STEPS: SettingsDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'set-demo-title',
    caption:
      'Welcome to Settings — the control center for your Flowentra workspace. Your profile, your company, your subscription, offline sync and system configuration: everything lives here in one place.',
    duration: 6000,
    apply: pure(() => ({ section: 'profile' })),
  },
  {
    target: 'set-demo-sidebar',
    caption:
      'Everything is split in two groups. Personal — your profile and security. General — your company and preferences, your subscription and seats, offline sync, and system configuration.',
    duration: 5800,
    apply: pure(() => ({})),
  },

  // ── Chapter 2 · Personal · Profile ─────────────────────────────────────────
  {
    target: 'set-demo-profile',
    caption:
      'Start with your profile. Upload a photo, set your first and last name, your email, phone and company. This is your personal identity across the workspace — save, and it updates everywhere.',
    duration: 5800,
    apply: pure(() => ({ section: 'profile' })),
  },

  // ── Chapter 3 · Personal · Security ────────────────────────────────────────
  {
    target: 'set-demo-nav-security',
    caption:
      'Security is where you change your password — enter the current one, then your new password twice to confirm. Your account, locked down in seconds.',
    duration: 5000,
    apply: pure(() => ({ section: 'security' })),
  },

  // ── Chapter 4 · General · Company & preferences ───────────────────────────
  {
    target: 'set-demo-nav-company',
    caption:
      'Company settings hold your brand. Upload a logo — it appears in the sidebar, the header, the login page and every PDF report — then set your company name, website and phone.',
    duration: 5800,
    apply: pure(() => ({ section: 'company' })),
  },
  {
    target: 'set-demo-pref-theme',
    caption:
      'Right below the company card sit your preferences. Flip to dark and the whole workspace follows instantly. Your preferences are yours alone and never change what your teammates see.',
    duration: 5400,
    apply: pure(() => ({ prefTheme: 'dark' })),
  },
  {
    target: 'set-demo-pref-color',
    caption:
      'Pick a primary accent colour, your language, your navigation layout — sidebar or top bar — and whether lists show as tables or cards. Preferences auto-save as you tweak.',
    duration: 5600,
    apply: pure(() => ({ prefColorPicked: true })),
  },

  // ── Chapter 5 · General · Tenants subscription ────────────────────────────
  {
    target: 'set-demo-nav-subscription',
    caption:
      'Subscription is where owners run the tenant plan. See the current plan, its status, your billing interval, the number of seats and the next renewal date at a glance.',
    duration: 5800,
    apply: pure(() => ({ section: 'subscription' })),
  },
  {
    target: 'set-demo-sub-plans',
    caption:
      'Switch plans in a click — Starter, Growth or Business. Toggle between monthly and yearly billing, open the billing portal for invoices, or cancel if you ever need to.',
    duration: 5800,
    apply: pure(() => ({ showPlans: true })),
  },
  {
    target: 'set-demo-sub-invoices',
    caption:
      'Every invoice lands here — number, date, amount and status: paid, pending or failed. Download any of them and keep your books tidy without leaving the app.',
    duration: 5400,
    apply: pure(() => ({ planPicked: true })),
  },

  // ── Chapter 6 · General · Offline sync ────────────────────────────────────
  {
    target: 'set-demo-nav-offline',
    caption:
      'Offline sync decides what travels with you into the field. Tick the modules you want hydrated to the device — contacts, articles, service orders, dispatches — and the rest stays server-only.',
    duration: 6000,
    apply: pure(() => ({ section: 'offline' })),
  },
  {
    target: 'set-demo-offline-all',
    caption:
      'Select all in one click, deselect all, or reset to sensible defaults. And the Last run panel shows exactly when each module last synced — no more guessing.',
    duration: 5600,
    apply: pure(() => ({ offlineAllOn: true })),
  },

  // ── Chapter 7 · General · System configuration ────────────────────────────
  {
    target: 'set-demo-nav-system',
    caption:
      'System configuration is where admins tune how the app converts work. First, the Job conversion mode — does one installation become one job with all its services, or does each service become its own individual job?',
    duration: 6400,
    apply: pure(() => ({ section: 'system' })),
  },
  {
    target: 'set-demo-system-jobmode',
    caption:
      'Pick Service-based and every service line dispatches on its own. Pick Installation-based and services stay grouped under one dispatch. One switch, and the whole planning flow follows.',
    duration: 6000,
    apply: pure(() => ({ jobMode: 'service' })),
  },
  {
    target: 'set-demo-system-numbering',
    caption:
      'Below sits Document numbering — the templates that mint every offer, sale, service order, dispatch, deal and invoice number. Open one to configure it.',
    duration: 5400,
    apply: pure(() => ({ numberingExpanded: true })),
  },
  {
    target: 'set-demo-system-template',
    caption:
      'Compose the template with tokens — year, date, atomic sequence, GUID, timestamp — pick the strategy, choose when the counter resets, and preview the exact number your next document will get.',
    duration: 6200,
    apply: pure(() => ({ numberingEdited: true })),
  },

  // ── Chapter 8 · Wrap-up ────────────────────────────────────────────────────
  {
    target: 'set-demo-title',
    caption:
      'That’s Settings — your profile and security, your company and preferences, your subscription and seats, offline sync, and the system configuration that governs numbering and job conversion. One control center for your whole workspace.',
    duration: 6600,
    apply: pure(() => ({ section: 'profile' })),
  },
];

export const SET_CHAPTERS: SettingsDemoChapter[] = [
  { id: 'overview',     title: 'Overview',      start: 0,  end: 2  },
  { id: 'profile',      title: 'Profile',       start: 2,  end: 3  },
  { id: 'security',     title: 'Security',      start: 3,  end: 4  },
  { id: 'company',      title: 'Company',       start: 4,  end: 7  },
  { id: 'subscription', title: 'Subscription',  start: 7,  end: 10 },
  { id: 'offline',      title: 'Offline sync',  start: 10, end: 12 },
  { id: 'system',       title: 'System',        start: 12, end: 16 },
  { id: 'wrapup',       title: 'Wrap-up',       start: 16, end: SET_STEPS.length },
];
