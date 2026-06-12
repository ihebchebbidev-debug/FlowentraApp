// HR module autopilot demo — 12 chapters, 63 steps.

export type HRDemoPage =
  | 'dashboard'
  | 'employees'
  | 'employee-detail'
  | 'attendance'
  | 'leaves'
  | 'payroll'
  | 'bonuses'
  | 'cnss'
  | 'departments'
  | 'performance'
  | 'recruitment'
  | 'reports'
  | 'settings';

export interface HRDemoState {
  page: HRDemoPage;
  activeTab: string;
  selectedEmployee: string | null;
  highlightedStat: string | null;
  leaveTab: string;
  performanceTab: string;
  recruitmentTab: string;
  showPayrollRun: boolean;
  payrollStep: number;
  searchQuery: string;
}

export const initialHRDemoState: HRDemoState = {
  page: 'dashboard',
  activeTab: 'overview',
  selectedEmployee: null,
  highlightedStat: null,
  leaveTab: 'list',
  performanceTab: 'goals',
  recruitmentTab: 'dashboard',
  showPayrollRun: false,
  payrollStep: 0,
  searchQuery: '',
};

export interface HRDemoStep {
  target: string;
  caption: string;
  duration: number;
  apply: (s: HRDemoState) => HRDemoState;
}

export interface HRDemoChapter {
  id: string;
  title: string;
  start: number;
  end: number;
}

const pure =
  (apply: (s: HRDemoState) => Partial<HRDemoState>) =>
  (s: HRDemoState): HRDemoState => ({ ...s, ...apply(s) });

export const HR_STEPS: HRDemoStep[] = [
  // ── Chapter 1 · Dashboard ─────────────────────────────────────────────────
  {
    target: 'hr-demo-title',
    caption:
      'Welcome to the HR module — your complete human resources management centre. Employees, attendance, leaves, payroll, bonuses, CNSS, performance, and recruitment, all connected in one platform.',
    duration: 5500,
    apply: pure(() => ({ page: 'dashboard' as const })),
  },
  {
    target: 'hr-demo-stat-headcount',
    caption:
      'The dashboard opens with live KPI cards: total headcount, employees on leave today, pending leave requests awaiting approval, and your monthly payroll total in TND.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-leave-alerts',
    caption:
      'The Leaves at a Glance panel shows who is out today and any pending requests that need a manager decision — so nothing slips through without action.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-contract-alerts',
    caption:
      'Contract expiry alerts surface employees whose fixed-term contracts end within the next 60 days — giving HR time to renew, convert, or plan a departure.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-quick-links',
    caption:
      'Quick-access tiles jump to Attendance, Payroll, Bonuses, CNSS, Reports, Settings, Departments, and Recruitment — every HR function is one click from the dashboard.',
    duration: 4200,
    apply: pure(() => ({})),
  },

  // ── Chapter 2 · Employees ─────────────────────────────────────────────────
  {
    target: 'hr-demo-nav-employees',
    caption:
      'The Employees page lists every team member with their department, gross salary, and payroll-ready status. Three interactive stat cards let you filter the list instantly.',
    duration: 4800,
    apply: pure(() => ({ page: 'employees' as const, highlightedStat: null })),
  },
  {
    target: 'hr-demo-emp-stat-ready',
    caption:
      'Clicking "Payroll Ready" filters to employees who have a complete salary configuration — so you always know who can be included in the next payroll run.',
    duration: 4500,
    apply: pure(() => ({ highlightedStat: 'ready' })),
  },
  {
    target: 'hr-demo-emp-search',
    caption:
      'The search bar filters by name, email, or department in real time — useful on teams with dozens or hundreds of employees.',
    duration: 4000,
    apply: pure(() => ({ highlightedStat: null })),
  },
  {
    target: 'hr-demo-emp-row',
    caption:
      'Each row shows the employee avatar, full name, email, department, gross salary, and a payroll-ready badge. Clicking a row opens the full employee profile.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-emp-detail-header',
    caption:
      'The employee detail page shows the profile picture, job title, department, hire date, contract type, and status — all editable by authorised HR managers.',
    duration: 4800,
    apply: pure(() => ({ page: 'employee-detail' as const, activeTab: 'profile', selectedEmployee: 'amira' })),
  },
  {
    target: 'hr-demo-emp-tab-salary',
    caption:
      'The Salary tab holds the full salary configuration: gross salary, CNSS employee and employer contributions, IRPP income tax bracket, net salary preview, and extra allowances.',
    duration: 5200,
    apply: pure(() => ({ activeTab: 'salary' })),
  },
  {
    target: 'hr-demo-emp-tab-docs',
    caption:
      'The Documents tab stores scanned contracts, CIN copies, diplomas, and any HR attachment — organised by category with upload date and uploaded-by tracking.',
    duration: 4800,
    apply: pure(() => ({ activeTab: 'documents' })),
  },

  // ── Chapter 3 · Attendance ────────────────────────────────────────────────
  {
    target: 'hr-demo-nav-attendance',
    caption:
      'The Attendance page shows a monthly grid of every employee\'s clock-in and clock-out events. Days are colour-coded: present, late, absent, or on approved leave.',
    duration: 5000,
    apply: pure(() => ({ page: 'attendance' as const })),
  },
  {
    target: 'hr-demo-att-grid',
    caption:
      'Each cell shows hours worked for the day. Late arrivals appear in amber and absences in red, so managers can spot patterns without reading every row manually.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-att-stats',
    caption:
      'The summary strip shows the month\'s attendance rate, total late arrivals, total absences, and average hours per day — feeding directly into the payroll deduction calculation.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-att-export',
    caption:
      'The Export button downloads the full monthly attendance report as an Excel file — ready for payroll processing or external audits.',
    duration: 4000,
    apply: pure(() => ({})),
  },

  // ── Chapter 4 · Leaves ────────────────────────────────────────────────────
  {
    target: 'hr-demo-nav-leaves',
    caption:
      'The Leaves page manages the entire leave lifecycle in four tabs: the request list, a team calendar, leave balances per employee, and the approval queue.',
    duration: 4800,
    apply: pure(() => ({ page: 'leaves' as const, leaveTab: 'list' })),
  },
  {
    target: 'hr-demo-leave-new-btn',
    caption:
      'Clicking New Leave Request opens a form where the employee picks the leave type — annual, sick, maternity, exceptional — and sets the start and end dates.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-leave-list',
    caption:
      'The List tab shows all requests with status badges: Pending in amber, Approved in green, Rejected in red. Click any row to view the full request and its approval history.',
    duration: 4800,
    apply: pure(() => ({ leaveTab: 'list' })),
  },
  {
    target: 'hr-demo-leave-calendar',
    caption:
      'The Calendar tab shows all approved leaves as colour-coded blocks on a monthly calendar — ideal for spotting coverage gaps before approving new requests.',
    duration: 4800,
    apply: pure(() => ({ leaveTab: 'calendar' })),
  },
  {
    target: 'hr-demo-leave-balances',
    caption:
      'The Balances tab shows each employee\'s remaining days per leave type for the year — used, available, and total entitlement side by side.',
    duration: 4800,
    apply: pure(() => ({ leaveTab: 'balances' })),
  },
  {
    target: 'hr-demo-leave-approval',
    caption:
      'The Approval tab lists every pending request with one-click Approve and Reject buttons. Approvals automatically update the employee\'s leave balance and notify them.',
    duration: 5000,
    apply: pure(() => ({ leaveTab: 'approval' })),
  },

  // ── Chapter 5 · Payroll ───────────────────────────────────────────────────
  {
    target: 'hr-demo-nav-payroll',
    caption:
      'The Payroll page is where you run monthly payroll for the entire team. It applies Tunisian tax law automatically — CNSS contributions, IRPP brackets, and net salary calculation.',
    duration: 5500,
    apply: pure(() => ({ page: 'payroll' as const, showPayrollRun: false, payrollStep: 0 })),
  },
  {
    target: 'hr-demo-payroll-run-btn',
    caption:
      'Clicking Run Payroll opens the payroll wizard. You select the month and year, pick which employees to include, and the engine calculates everything automatically.',
    duration: 4800,
    apply: pure(() => ({ showPayrollRun: true, payrollStep: 0 })),
  },
  {
    target: 'hr-demo-payroll-step-period',
    caption:
      'Step one: select the payroll period — June 2025 in this example. The wizard knows the number of working days in the month and adjusts pro-rata for new joiners.',
    duration: 4800,
    apply: pure(() => ({ payrollStep: 1 })),
  },
  {
    target: 'hr-demo-payroll-step-employees',
    caption:
      'Step two: select which employees to include. Only payroll-ready employees appear here. Checkboxes let you exclude specific individuals from this run.',
    duration: 4800,
    apply: pure(() => ({ payrollStep: 2 })),
  },
  {
    target: 'hr-demo-payroll-step-preview',
    caption:
      'The preview table shows every employee\'s gross salary, CNSS employee deduction, CNSS employer contribution, IRPP income tax, bonus additions, attendance deductions, and final net pay.',
    duration: 5500,
    apply: pure(() => ({ payrollStep: 3, showPayrollRun: false })),
  },
  {
    target: 'hr-demo-payslip-detail',
    caption:
      'Clicking an employee opens the full payslip detail — a line-by-line breakdown matching the official Tunisian payslip format, with all components clearly labelled.',
    duration: 5000,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-payslip-pdf',
    caption:
      'The PDF export generates a professionally formatted payslip ready to hand to the employee or archive. Bulk export downloads payslips for all selected employees at once.',
    duration: 4500,
    apply: pure(() => ({})),
  },

  // ── Chapter 6 · Bonuses & CNSS ────────────────────────────────────────────
  {
    target: 'hr-demo-nav-bonuses',
    caption:
      'The Bonuses page lets you define and allocate bonuses for any month — performance bonuses, Eid bonuses, project completion bonuses — which flow automatically into the next payroll run.',
    duration: 5000,
    apply: pure(() => ({ page: 'bonuses' as const })),
  },
  {
    target: 'hr-demo-bonus-table',
    caption:
      'Each bonus row shows the employee, bonus type, amount, month, and whether it has been included in a payroll run. Adding a bonus is a single form with amount and description.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-nav-cnss',
    caption:
      'The CNSS page manages Tunisian social security declarations. It shows the employer and employee contribution rates, monthly totals, and the declaration status for each period.',
    duration: 5000,
    apply: pure(() => ({ page: 'cnss' as const })),
  },
  {
    target: 'hr-demo-cnss-table',
    caption:
      'The CNSS table breaks down contributions per employee and per period. The active rate configuration ensures calculations always reflect the latest official CNSS percentages.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 7 · Departments ───────────────────────────────────────────────
  {
    target: 'hr-demo-nav-departments',
    caption:
      'The Departments page is your organisational chart backbone. Each department has a name, a head, and a live headcount badge drawn from the employee directory.',
    duration: 4800,
    apply: pure(() => ({ page: 'departments' as const })),
  },
  {
    target: 'hr-demo-dept-list',
    caption:
      'Departments are listed with their head\'s name, number of active employees, and total gross payroll. Click a department to see its members and edit its details.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-dept-create',
    caption:
      'Creating a department takes seconds — give it a name, assign a head, and it immediately appears in the employee assignment dropdown across the whole platform.',
    duration: 4200,
    apply: pure(() => ({})),
  },

  // ── Chapter 8 · Performance ───────────────────────────────────────────────
  {
    target: 'hr-demo-nav-performance',
    caption:
      'The Performance module manages employee growth through SMART goals, structured review cycles, and formal performance reviews with numeric ratings and written feedback.',
    duration: 5200,
    apply: pure(() => ({ page: 'performance' as const, performanceTab: 'goals', activeTab: 'goals' })),
  },
  {
    target: 'hr-demo-perf-goals',
    caption:
      'The Goals tab shows every active goal with a title, owner, due date, and progress percentage. Employees and managers update progress as work advances.',
    duration: 4800,
    apply: pure(() => ({ performanceTab: 'goals' })),
  },
  {
    target: 'hr-demo-perf-cycles',
    caption:
      'Review Cycles define when reviews happen — quarterly, semi-annually, or annually. Each cycle has a start date, end date, and a status (upcoming, active, or completed).',
    duration: 4800,
    apply: pure(() => ({ performanceTab: 'cycles' })),
  },
  {
    target: 'hr-demo-perf-reviews',
    caption:
      'The Reviews tab lists every performance review with the reviewer, reviewee, overall score, and status. Clicking a review opens the full scorecard with criteria ratings and comments.',
    duration: 5000,
    apply: pure(() => ({ performanceTab: 'reviews' })),
  },
  {
    target: 'hr-demo-perf-score',
    caption:
      'Each review generates an overall score on a five-point scale. Scores feed the employee\'s profile so HR can track performance trends over multiple cycles.',
    duration: 4500,
    apply: pure(() => ({})),
  },

  // ── Chapter 9 · Recruitment ───────────────────────────────────────────────
  {
    target: 'hr-demo-nav-recruitment',
    caption:
      'The Recruitment module tracks the full hiring pipeline — open positions, applicant progress, scheduled interviews, and offer management — without leaving Flowentra.',
    duration: 5000,
    apply: pure(() => ({ page: 'recruitment' as const, recruitmentTab: 'dashboard' })),
  },
  {
    target: 'hr-demo-recruit-dashboard',
    caption:
      'The Recruitment Dashboard shows KPIs at a glance: open positions, active applicants, interviews scheduled this week, and offers currently outstanding.',
    duration: 4800,
    apply: pure(() => ({ recruitmentTab: 'dashboard' })),
  },
  {
    target: 'hr-demo-recruit-openings',
    caption:
      'The Job Openings tab lists every open role with contract type (CDI or CDD), seniority level, number of seats, and current status — open, on hold, or closed.',
    duration: 4800,
    apply: pure(() => ({ recruitmentTab: 'openings' })),
  },
  {
    target: 'hr-demo-recruit-applicants',
    caption:
      'The Applicants tab shows every candidate with their pipeline stage: Applied → Screening → Interview → Offer → Hired or Rejected. Move candidates between stages with a single click.',
    duration: 5200,
    apply: pure(() => ({ recruitmentTab: 'applicants' })),
  },
  {
    target: 'hr-demo-recruit-interviews',
    caption:
      'The Interviews tab lists every scheduled interview with date, time, interviewer, candidate, and the linked job opening — making it easy to prepare and follow up.',
    duration: 4800,
    apply: pure(() => ({ recruitmentTab: 'interviews' })),
  },
  {
    target: 'hr-demo-recruit-hire',
    caption:
      'Marking an applicant as Hired automatically creates an employee record, assigns them to the right department, and prompts you to set up their salary configuration.',
    duration: 5000,
    apply: pure(() => ({})),
  },

  // ── Chapter 10 · Reports & Settings ──────────────────────────────────────
  {
    target: 'hr-demo-nav-reports',
    caption:
      'The Reports page gives you data-driven insights: headcount by department, salary distribution, attendance rates, leave usage by type, and payroll cost trends month over month.',
    duration: 5200,
    apply: pure(() => ({ page: 'reports' as const })),
  },
  {
    target: 'hr-demo-report-headcount',
    caption:
      'The Headcount by Department bar chart shows your organisational distribution at a glance — identifying where your workforce is concentrated or understaffed.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-report-payroll-chart',
    caption:
      'The Monthly Payroll Cost chart tracks total salary expense over time, helping finance teams forecast budgets and spot cost anomalies before they escalate.',
    duration: 4800,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-nav-settings',
    caption:
      'HR Settings let you configure leave types with their annual entitlement in days, set public holidays for the year, define payroll calculation rules, and manage CNSS rates.',
    duration: 5000,
    apply: pure(() => ({ page: 'settings' as const })),
  },

  // ── Chapter 11 · Deep dive — every remaining sub-feature ─────────────────
  {
    target: 'hr-demo-emp-tab-cnss',
    caption:
      'Back on an employee profile, the CNSS tab stores their personal CNSS number, affiliation date, dependants, and any specific contribution overrides — exactly what gets reported each quarter.',
    duration: 5200,
    apply: pure(() => ({ page: 'employee-detail' as const, activeTab: 'cnss', selectedEmployee: 'amira' })),
  },
  {
    target: 'hr-demo-emp-tab-bonuses',
    caption:
      'The Bonuses tab on the employee profile lists every bonus they have ever received, with the month, type, amount, and the payroll run that paid it out — a complete personal compensation history.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'bonuses' })),
  },
  {
    target: 'hr-demo-emp-tab-leaves',
    caption:
      'The Leaves tab on the profile shows this employee\'s personal leave history and current balances across every leave type — annual, sick, maternity, exceptional — at a glance.',
    duration: 5000,
    apply: pure(() => ({ activeTab: 'leaves' })),
  },
  {
    target: 'hr-demo-emp-tab-history',
    caption:
      'The History tab is a per-employee audit log: every change to their salary, contract, department, or status is captured with the date, the user who made it, and the previous value preserved.',
    duration: 5200,
    apply: pure(() => ({ activeTab: 'history' })),
  },
  {
    target: 'hr-demo-payroll-settings',
    caption:
      'Inside Payroll, the Settings panel lets you tune calculation rules — overtime multiplier, holiday-day rate, working-days base, and rounding policy — applied uniformly to every payroll run.',
    duration: 5500,
    apply: pure(() => ({ page: 'payroll' as const, showPayrollRun: false, payrollStep: 0, activeTab: 'settings' })),
  },
  {
    target: 'hr-demo-payslip-pdf-format',
    caption:
      'The generated payslip PDF is bilingual French/Arabic, includes your company header, fiscal identity, employee block, full earnings and deductions breakdown, net pay in figures and in words, and a signature space.',
    duration: 5800,
    apply: pure(() => ({ activeTab: 'overview' })),
  },
  {
    target: 'hr-demo-report-cost-tab',
    caption:
      'The Reports hub also has a Cost tab — total payroll cost per employee with gross, bonuses, deductions, CNSS employer share, monthly total cost, and Year-To-Date total cost in one table.',
    duration: 5500,
    apply: pure(() => ({ page: 'reports' as const, activeTab: 'cost' })),
  },
  {
    target: 'hr-demo-report-cnss-absences',
    caption:
      'Two more report tabs: CNSS aggregates employer + employee contributions per month for your DGI filings, and Absences shows total days off per employee broken down by leave type.',
    duration: 5500,
    apply: pure(() => ({ activeTab: 'cnss' })),
  },
  {
    target: 'hr-demo-settings-tabs',
    caption:
      'HR Settings groups three tabs: CNSS rates (employer % and employee % for each effective period), Public Holidays (the official Tunisian calendar with custom additions), and General payroll rules.',
    duration: 5800,
    apply: pure(() => ({ page: 'settings' as const, activeTab: 'cnss' })),
  },

  // ── Chapter 12 · Wrap-up ──────────────────────────────────────────────────
  {
    target: 'hr-demo-title',
    caption:
      'That is the complete HR module tour — Employees with full profile, Attendance, Leaves, Payroll with Tunisian tax law built in, Bonuses, CNSS, Departments, Performance, and Recruitment.',
    duration: 5500,
    apply: pure(() => ({ page: 'dashboard' as const })),
  },
  {
    target: 'hr-demo-stat-headcount',
    caption:
      'Every section is connected: a hired applicant becomes an employee, their salary flows into payroll, their leaves update the attendance calendar, and their reviews feed the performance history.',
    duration: 5500,
    apply: pure(() => ({})),
  },
  {
    target: 'hr-demo-quick-links',
    caption:
      'Now it is your turn. Add your team, configure salaries, run your first payroll, and let Flowentra handle the compliance and reporting automatically.',
    duration: 5000,
    apply: pure(() => ({})),
  },
];

export const HR_CHAPTERS: HRDemoChapter[] = [
  { id: 'dashboard',    title: 'Dashboard',         start: 0,  end: 5  },
  { id: 'employees',    title: 'Employees',          start: 5,  end: 12 },
  { id: 'attendance',   title: 'Attendance',         start: 12, end: 16 },
  { id: 'leaves',       title: 'Leaves',             start: 16, end: 22 },
  { id: 'payroll',      title: 'Payroll',            start: 22, end: 29 },
  { id: 'bonuses-cnss', title: 'Bonuses & CNSS',     start: 29, end: 33 },
  { id: 'departments',  title: 'Departments',        start: 33, end: 36 },
  { id: 'performance',  title: 'Performance',        start: 36, end: 41 },
  { id: 'recruitment',  title: 'Recruitment',        start: 41, end: 47 },
  { id: 'reports',      title: 'Reports',            start: 47, end: 51 },
  { id: 'deepdive',     title: 'Deep dive',          start: 51, end: 60 },
  { id: 'wrapup',       title: 'Wrap-up',            start: 60, end: HR_STEPS.length },
];
