// Settings module autopilot demo — 8 chapters, 24 steps.
// English (inline) + French only. Same architecture as the other module demos
// (Lookups, Sales, HR, …): scripted state transitions, a virtual cursor, and
// FR narration. Translations live in settingsDemoTranslations.ts keyed by step
// index.
//
// Every screen mirrors the REAL Settings module 1:1:
//   • Profile         → first/last name, email, phone, company, photo
//   • Company         → logo, company name, website, phone
//   • Security        → current / new / confirm password
//   • Users           → avatar · email · role badges · status · created · ⋮
//   • Create user     → name, email, password, phone, country (no role here)
//   • Roles           → name · description · users · status · created · ⋮
//   • Permissions     → Edit-role “Permissions” tab: accordion by category,
//                       per-module CRUD checkboxes, granted/total, Grant/Revoke All
//   • Skills          → assigned to a ROLE: level + category + description
//   • Preferences     → theme, primary colour, language, layout, data view
//   • Companies       → multi-tenant switch
//   • System          → logs, sync history, document numbering, integrations

export interface SettingsDemoState {
  section: string;            // active nav section
  // Users
  showUserFilters: boolean;   // filter row revealed
  showCreateUser: boolean;    // create-user dialog open
  createUserStep: number;     // 0..2 progressive reveal in create dialog
  newUserRow: boolean;        // freshly created user joins the table
  highlightUserRow: boolean;  // spotlight the new user row
  // Roles & permissions
  showRoleModal: boolean;     // Edit-role modal open
  roleTab: 'general' | 'permissions';
  permStep: number;           // 0..2 progressive reveal in the matrix
  // Skills
  showSkills: boolean;        // skill-assignment dialog (per role)
  skillStep: number;          // 0..2 reveal
  // Preferences
  prefTheme: 'system' | 'dark';
}

export const initialSettingsDemoState: SettingsDemoState = {
  section: 'profile',
  showUserFilters: false,
  showCreateUser: false,
  createUserStep: 0,
  newUserRow: false,
  highlightUserRow: false,
  showRoleModal: false,
  roleTab: 'general',
  permStep: 0,
  showSkills: false,
  skillStep: 0,
  prefTheme: 'system',
};

export interface SettingsDemoStep { target: string; caption: string; duration: number; apply: (s: SettingsDemoState) => SettingsDemoState; }
export interface SettingsDemoChapter { id: string; title: string; start: number; end: number; }

const pure =
  (apply: (s: SettingsDemoState) => Partial<SettingsDemoState>) =>
  (s: SettingsDemoState): SettingsDemoState => ({ ...s, ...apply(s) });

// Closing everything transient — used whenever we navigate to a new section so
// dialogs/overlays from the previous chapter don't bleed across.
const closeAll = {
  showUserFilters: false, showCreateUser: false, createUserStep: 0,
  newUserRow: false, highlightUserRow: false,
  showRoleModal: false, roleTab: 'general' as const, permStep: 0,
  showSkills: false, skillStep: 0,
};

export const SET_STEPS: SettingsDemoStep[] = [
  // ── Chapter 1 · Overview ───────────────────────────────────────────────────
  {
    target: 'set-demo-title',
    caption:
      'Welcome to Settings — the control center for your whole Flowentra workspace. Your profile, your company, the people on your team, what each of them can do, and how the app behaves: it all lives here, in one place.',
    duration: 6000,
    apply: pure(() => ({ section: 'profile', ...closeAll })),
  },
  {
    target: 'set-demo-sidebar',
    caption:
      'Everything is split into two groups. Personal — your profile, company, security, preferences and offline data. And Administration — users, roles, integrations, subscription, the system tools and sync history.',
    duration: 5800,
    apply: pure(() => ({})),
  },

  // ── Chapter 2 · Profile, company & security ────────────────────────────────
  {
    target: 'set-demo-profile',
    caption:
      'Start with your profile. Upload a photo, set your first and last name, your email, phone and company. This is your personal identity across the workspace — save, and it updates everywhere.',
    duration: 5600,
    apply: pure(() => ({ section: 'profile' })),
  },
  {
    target: 'set-demo-nav-company',
    caption:
      'Company settings hold your brand. Upload a logo — it appears in the sidebar, the header, the login page and every PDF report — then set your company name, website and phone.',
    duration: 5600,
    apply: pure(() => ({ section: 'company' })),
  },
  {
    target: 'set-demo-nav-security',
    caption:
      'Security is where you change your password — enter the current one, then your new password twice to confirm. Your account, locked down in seconds.',
    duration: 5000,
    apply: pure(() => ({ section: 'security' })),
  },

  // ── Chapter 3 · User management ────────────────────────────────────────────
  {
    target: 'set-demo-nav-users',
    caption:
      'Now the heart of administration — your people. Open Users to see everyone with access to the workspace.',
    duration: 4400,
    apply: pure(() => ({ section: 'users', ...closeAll })),
  },
  {
    target: 'set-demo-users-table',
    caption:
      'Here is your team directory — each member with their avatar, email, the roles they hold, whether they’re active, and when they joined. The workspace owner is always pinned at the top.',
    duration: 5600,
    apply: pure(() => ({})),
  },
  {
    target: 'set-demo-users-filter',
    caption:
      'As your team grows, search and filters keep it manageable — narrow by status, role or country to find exactly the person you need in seconds.',
    duration: 5000,
    apply: pure(() => ({ showUserFilters: true })),
  },
  {
    target: 'set-demo-add-user',
    caption:
      'Adding a colleague is just as quick. Click Add User to open the form.',
    duration: 4000,
    apply: pure(() => ({ showUserFilters: false, showCreateUser: true, createUserStep: 0 })),
  },
  {
    target: 'set-demo-create-user',
    caption:
      'Add a photo, their name, a unique email — checked live as you type — a starting password, phone and country code. Create, and the account is ready.',
    duration: 5600,
    apply: pure(() => ({ createUserStep: 1 })),
  },
  {
    target: 'set-demo-user-row',
    caption:
      'There they are — active in your directory. From the actions menu you can edit details, assign their roles, or remove access the moment someone leaves. Roles are granted here, separately — so one person can hold several.',
    duration: 6000,
    apply: pure(() => ({ showCreateUser: false, createUserStep: 2, newUserRow: true, highlightUserRow: true })),
  },

  // ── Chapter 4 · Roles & permissions ────────────────────────────────────────
  {
    target: 'set-demo-nav-roles',
    caption:
      'But you never set permissions person by person. Instead you build Roles — reusable bundles of access you assign to people. Let’s open them.',
    duration: 5000,
    apply: pure(() => ({ section: 'roles', ...closeAll })),
  },
  {
    target: 'set-demo-roles-table',
    caption:
      'Each role is a job profile — Administrator, Manager, Dispatcher, Sales, Technician — with its description, how many people hold it, its status and creation date. Change a role once, and everyone in it updates together.',
    duration: 6000,
    apply: pure(() => ({})),
  },
  {
    target: 'set-demo-role-perms-tab',
    caption:
      'Open a role and switch to its Permissions tab — this is where access is truly defined, organised by category: CRM, Field Service, Time & Expenses, Inventory and Administration.',
    duration: 5800,
    apply: pure(() => ({ showRoleModal: true, roleTab: 'permissions', permStep: 0 })),
  },
  {
    target: 'set-demo-perm-module',
    caption:
      'Every module expands to four actions — View, Create, Edit and Delete — and a badge shows how many are granted. Grant All or Revoke All flips a whole module in one click.',
    duration: 5800,
    apply: pure(() => ({ permStep: 1 })),
  },
  {
    target: 'set-demo-perm-crud',
    caption:
      'So a Dispatcher can view and edit jobs but never delete them; a Salesperson sees offers but not payroll. Tick exactly what each role needs, then Save Permissions — least privilege by design, nothing more.',
    duration: 6000,
    apply: pure(() => ({ permStep: 2 })),
  },

  // ── Chapter 5 · Skills (per role) ──────────────────────────────────────────
  {
    target: 'set-demo-skills-title',
    caption:
      'Roles carry more than permissions — they carry skills. From a role you can manage the competencies it requires.',
    duration: 4800,
    apply: pure(() => ({ section: 'roles', ...closeAll, showSkills: true, skillStep: 0 })),
  },
  {
    target: 'set-demo-skill-list',
    caption:
      'Each skill has a level — beginner, intermediate, advanced or expert — and a category. They come straight from your Skills lookup, so the whole company speaks one language. Pick one and assign it in a click.',
    duration: 6000,
    apply: pure(() => ({ skillStep: 1 })),
  },
  {
    target: 'set-demo-skill-feeds',
    caption:
      'And these aren’t just labels. The dispatch board matches a job’s required skills to the right qualified people automatically — your settings here power smarter planning out in the field.',
    duration: 5800,
    apply: pure(() => ({ skillStep: 2 })),
  },

  // ── Chapter 6 · Preferences ────────────────────────────────────────────────
  {
    target: 'set-demo-nav-prefs',
    caption:
      'Preferences shape how the app feels. Choose your theme, a primary accent colour, your language, the navigation layout — sidebar or top bar — and whether lists show as tables or cards.',
    duration: 5800,
    apply: pure(() => ({ section: 'preferences', ...closeAll })),
  },
  {
    target: 'set-demo-pref-theme',
    caption:
      'Flip to dark and the whole workspace follows instantly. Your preferences are yours alone and never change what your teammates see — then Save Preferences to keep them.',
    duration: 5200,
    apply: pure(() => ({ prefTheme: 'dark' })),
  },

  // ── Chapter 7 · Admin power ────────────────────────────────────────────────
  {
    target: 'set-demo-nav-companies',
    caption:
      'Run more than one business? Companies lets owners manage several workspaces — each with its own team, branding and data — and switch between them in a click.',
    duration: 5200,
    apply: pure(() => ({ section: 'companies', ...closeAll })),
  },
  {
    target: 'set-demo-nav-system',
    caption:
      'Finally, System ties the technical controls together — activity logs, sync history, integrations, your subscription, and document numbering for offers, sales, service orders and more — so admins keep the whole operation healthy from one screen.',
    duration: 6200,
    apply: pure(() => ({ section: 'system' })),
  },

  // ── Chapter 8 · Wrap-up ────────────────────────────────────────────────────
  {
    target: 'set-demo-title',
    caption:
      'That’s Settings — your profile, company and security, the people on your team, the roles, exact permissions and skills that govern them, your preferences, and the admin tools that keep it all running. One control center for your entire workspace.',
    duration: 6600,
    apply: pure(() => ({ section: 'profile', ...closeAll })),
  },
];

export const SET_CHAPTERS: SettingsDemoChapter[] = [
  { id: 'overview',     title: 'Overview',     start: 0,  end: 2  },
  { id: 'profile',      title: 'Account',      start: 2,  end: 5  },
  { id: 'users',        title: 'Users',        start: 5,  end: 11 },
  { id: 'permissions',  title: 'Permissions',  start: 11, end: 16 },
  { id: 'skills',       title: 'Skills',       start: 16, end: 19 },
  { id: 'preferences',  title: 'Preferences',  start: 19, end: 21 },
  { id: 'admin',        title: 'Admin Tools',  start: 21, end: 23 },
  { id: 'wrapup',       title: 'Wrap-up',      start: 23, end: SET_STEPS.length },
];
