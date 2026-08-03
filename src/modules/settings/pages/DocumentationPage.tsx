import { useMemo, useState, useEffect, useCallback } from "react";
import {
  ArrowLeft, Book, ExternalLink, Search, ChevronDown, ChevronRight,
  ChevronLeft, X, Maximize2,
  LayoutDashboard, Users, ShoppingCart, Package, Briefcase, Wrench,
  Calendar, Mail, FolderKanban, MessageSquare, FileText, GitBranch,
  Zap, Webhook, BarChart3, Globe, Database, Bell, LifeBuoy, Settings as SettingsIcon,
  Bot, Lock, LayoutGrid, CreditCard, Sparkles, SlidersHorizontal, CalendarClock,
  Map, GraduationCap, UserCog, FileSpreadsheet, Signature, RefreshCw, Puzzle,
  Server, ShieldCheck,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MODULE_GUIDES, guideSearchText } from "./docs";
import { useTranslation } from "react-i18next";
import { useCategoryLabel, useLocalizedModules } from "./docs/locales/localize";

export type ModuleRoute = { path: string; label: string };
export type ModuleScreenshot = {
  src: string;
  caption: string;
  details?: string[];
  whatYouCanDo?: string[];
  fieldsActions?: string[];
};
export type ModuleDoc = {
  key: string;
  name: string;
  category: string;
  description: string;
  features: string[];
  routes: ModuleRoute[];
  screenshots?: ModuleScreenshot[];
};

export const SHOTS: Record<string, ModuleScreenshot[]> = {
  "dynamic-forms": [
    {
      src: "/docs-screenshots/dynamic-forms-list.png",
      caption: "Dynamic Forms — list of all forms with status, field count and last updated",
      details: [
        "Columns: Name (+ description), Status (Draft / Released / Archived badge), Fields count, Last Updated, Share, Actions",
        "Toolbar: Search box, All Statuses filter dropdown, + Create Form button (top-right)",
        "Click a row to open the form preview; share icon opens public link settings",
      ],
      whatYouCanDo: [
        "Create a new form, search/filter existing ones, or open a form's row menu for Preview / Edit / Duplicate / View Responses / Make Public / Archive / Delete",
      ],
    },
    {
      src: "/docs-screenshots/dynamic-forms-actions-menu.png",
      caption: "Row actions menu — Preview, Edit, Duplicate, View Responses, Make Public, Archive, Delete",
      details: [
        "Edit is blocked on Released forms — restore to Draft first",
        "Make Public exposes the form at /public/forms/:slug for unauthenticated submission",
        "Delete is a soft delete (form goes to Archived state)",
      ],
    },
    {
      src: "/docs-screenshots/dynamic-forms-create-basic.png",
      caption: "Create New Form — bilingual basic info (EN/FR) and category",
      details: [
        "Side-by-side English & French content blocks: Name (required) and Description",
        "Category picker driven by Lookups (e.g. Service Checklist) with inline 'Manage' shortcut",
        "Save button (top-right) creates a Draft form, then opens the full builder",
      ],
    },
    {
      src: "/docs-screenshots/dynamic-forms-builder-palette.png",
      caption: "Form Builder — Field Palette with all available field types",
      details: [
        "Basic Fields: Text Input, Text Area, Number, Email, Phone",
        "Choice Fields: Checkbox (Yes/No), Radio Buttons (single), Dropdown Select",
        "Advanced Fields: Date Picker, Section Header, Signature, Star Rating, Content Block (titles, text & links)",
        "Layout & Structure: Page Break (split into multi-step / paginated forms)",
        "Right pane: live Form Preview with Preview / Structure toggle — drag any field from the palette onto the canvas",
      ],
      whatYouCanDo: [
        "Drag fields from the palette onto the canvas, reorder by drag, click a field to open its property editor",
        "Insert Page Break to turn the form into a stepped wizard",
      ],
    },
    {
      src: "/docs-screenshots/dynamic-forms-preview.png",
      caption: "Form Preview — branded rendering used for sharing and PDF export",
      details: [
        "Header: company logo, 'Completed on' date, EN/FR language toggle",
        "Body: title, description, then each field with its label and input",
        "Footer: form name, copyright, page count",
        "Top-right: Save Response (record a submission as the current user) and Download PDF",
      ],
    },
    {
      src: "/docs-screenshots/dynamic-forms-responses.png",
      caption: "Form Responses — every submission with submitter, timestamp and linked entity",
      details: [
        "Columns: #, Submitted By, Submitted At, Linked Entity, Actions (view / export PDF)",
        "Top-right actions: Export to Entity (push answers as a record into another module) and Export Responses (CSV / Excel)",
      ],
    },
    {
      src: "/docs-screenshots/dynamic-forms-response-detail.png",
      caption: "Response detail modal — read-only view of one submission with PDF export",
      details: [
        "Header: Submitted By, Submitted At",
        "One card per field showing the answered value (or 'Not answered')",
        "Export as PDF button generates a branded PDF of that single response",
      ],
    },
  ],
  "stock-management": [
    {
      src: "/docs-screenshots/stock-management-grid.png",
      caption: "Stock Management — at-a-glance grid of every material with current level",
      details: [
        "Top KPI strip: Total Materials, Critical, Low Stock and Healthy Stock counts",
        "Each card shows the material name, group, fill-level gauge (% of minimum), current quantity and a color-coded status badge (Good / Critical)",
        "Per-card quick actions: Add Stock, Remove Stock, View History",
      ],
      whatYouCanDo: [
        "Search materials, replenish or deduct stock without leaving the page, and audit every movement via View History",
      ],
    },
    {
      src: "/docs-screenshots/stock-management-filters.png",
      caption: "Filters bar — narrow the grid by Status and Location",
      details: [
        "Status: All / Critical / Low Stock / Healthy",
        "Location: filter by warehouse, vehicle or any configured stock location",
      ],
    },
    {
      src: "/docs-screenshots/stock-management-replenish.png",
      caption: "Replenish Stock dialog — Add or Remove with optional notes",
      details: [
        "Toggle between Add Stock and Remove Stock at the top",
        "Shows the current quantity, then asks for the delta and optional notes",
        "Submitting writes a fully-audited row to the Stock Transactions log",
      ],
    },
    {
      src: "/docs-screenshots/stock-management-history.png",
      caption: "Stock Transaction History — full audit log per material",
      details: [
        "Lists every add, remove, sale deduction, offer addition, transfer and adjustment",
        "Each entry records previous → new stock, reason, reference (offer / sale / SO), performer and timestamp",
      ],
    },
  ],
  articles: [
    {
      src: "/docs-screenshots/articles-list.png",
      caption: "Articles & Materials — unified catalogue of materials and services",
      details: [
        "KPI strip: Materials, Services, Low Stock and Total Items counts",
        "Columns: Type icon, Name, Reference/Category, Status, Stock, Price, Location, Actions",
        "Materials show a Transfer button (move stock between locations); services skip stock columns",
        "Pagination with selectable page size (top-left) and page navigator (top-right)",
      ],
      whatYouCanDo: [
        "Search articles, filter by Category and Status, edit or delete inline, or open Import / Add Article from the toolbar",
      ],
    },
    {
      src: "/docs-screenshots/articles-edit.png",
      caption: "Edit Article — Material/Service tabs with full inventory details",
      details: [
        "Type tabs: Material (stock + supplier + location) or Service (base price + duration + skills)",
        "Material fields: Reference, Category, Status, Description, Current Stock, Minimum Stock Level, Cost & Sell Price, Supplier, Location, Group, Sub-Location, Notes",
        "Same dialog is reused for Add Article (empty form) and Edit Article (prefilled)",
      ],
    },
    {
      src: "/docs-screenshots/articles-import.png",
      caption: "Import Articles — Dynamic Import with custom column mapping",
      details: [
        "Upload an Excel (.xlsx / .xls) file with your own column headers",
        "Next step lets you map each spreadsheet column to a target Article field",
        "Supports up to 10,000+ rows via batched bulk import",
      ],
    },
    {
      src: "/docs-screenshots/articles-import-structured.png",
      caption: "Structured Import — download a predefined template and fill it in",
      details: [
        "Two template downloads: Empty Template (headers only) or Template with Examples (sample rows)",
        "Drop the filled file back in the same dropzone to import",
      ],
    },
    {
      src: "/docs-screenshots/articles-transaction.png",
      caption: "Record Inventory Transaction — Stock In / Out / Transfer / Adjustment",
      details: [
        "Transaction Type: Stock In, Stock Out, Transfer (between locations) or Adjustment",
        "Required: Quantity and Reason; optional: To Location, Reference (PO, SO…), Notes",
        "All transactions feed the Articles audit log and the Stock Management history",
      ],
    },
  ],
  scheduling: [
    {
      src: "/docs-screenshots/planner-timeline-3d.png",
      caption: "Planner — 3-day timeline view with technician swimlanes",
      details: [
        "Header: page title 'Dispatcher', view toggles (Calendar / Map), Update button to refresh data",
        "Toolbar row 1: Today shortcut, ◀/▶ navigation, date-range picker (e.g. 13 May — 15 May 2026)",
        "Range tabs: 1d / 3d / 5d / 7d / 14d / 30d switch the time horizon shown on the timeline",
        "Zoom in / zoom out controls on the right of the range tabs to densify or expand the hour columns",
        "Status filter pill (All Statuses) opens a popover to filter dispatches by status",
        "Settings button toggles a sub-row with display options (e.g. Include weekends)",
        "Left column: technician roster — avatar, name, availability ('Available until 17:00')",
        "Grid: hours 08–17 per day, vertical orange line marks the current time (e.g. 11:21)",
        "Job pills: colored bar with priority dot + label ('Light' = Light priority) anchored to its hour slot",
        "Hatched bands highlight non-working time (lunch, after-hours) per technician",
        "Right rail: Service Orders panel with toggle 'Service Orders / Per Installation' and search box",
        "When everything is planned the right rail shows a green wrench icon and 'All jobs are assigned ✓'",
      ],
      whatYouCanDo: [
        "Drag a job pill horizontally to reschedule, vertically to reassign it to another technician",
        "Drag an unassigned Service Order from the right rail onto a technician's row to plan it",
        "Resize a job pill by its right edge to extend or shorten its duration",
        "Click a job pill to open its detail / edit modal",
        "Click 'Manage Planning' (top-left) to open the rule-based auto-planner",
      ],
    },
    {
      src: "/docs-screenshots/planner-timeline-7d.png",
      caption: "7-day view — full week with weekend Day Off highlighting",
      details: [
        "Same swimlane grid expanded across 7 days (Wed → Tue)",
        "Weekends rendered with a soft red overlay and a 'Day Off' chip per technician row",
        "Job pills repeat per day so recurring assignments and gaps are visible at a glance",
      ],
      whatYouCanDo: [
        "Spot capacity gaps across a full week before promising a customer date",
        "Toggle 'Include weekends' in Settings to plan one-off Saturday interventions",
      ],
    },
    {
      src: "/docs-screenshots/planner-month-30d.png",
      caption: "30-day overview — monthly calendar with technician avatars per day",
      details: [
        "Monthly grid (Sun → Sat) showing the full 30-day window",
        "Each day cell stacks the avatars of technicians that have at least one dispatch that day",
        "Today is highlighted with the brand orange in the day number badge",
        "An additional 'Overview Mode' chip appears next to the range tabs at this zoom level",
        "Empty days remain blank — easy to spot under-utilization",
      ],
      whatYouCanDo: [
        "Click any day cell to drill back into the daily / 3-day timeline",
        "Use this view for monthly capacity reviews and vacation planning",
      ],
    },
  ],

  dashboard: [
    {
      src: "/docs-screenshots/dashboard-tour-welcome.png",
      caption: "First-time user product tour — welcome modal (Step 0 of 28)",
      details: [
        "Modal title 'Welcome to Flowentra! 👋' with intro copy explaining the 28-step tour",
        "Two actions: 'Skip tour' (text link, dismisses for the session) and 'Next (Step 1 of 28)' (orange CTA)",
        "Tour can be replayed any time from the user profile menu → Replay tour",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-tour-step-sidebar.png",
      caption: "Tour Step 2 — Navigation Sidebar callout",
      details: [
        "Anchored callout points at the left sidebar with arrow",
        "Explains the section grouping: Workspace, CRM, Service, System",
        "Footer controls: Skip tour, Back, Next (Step 2 of 28)",
        "Each subsequent step highlights one UI region (top bar, KPI tiles, dashboard switcher, Edit, Share, …) with a contextual tooltip",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-tour.png",
      caption: "Legacy tour screenshot kept for reference",
    },
    {
      src: "/docs-screenshots/dashboard-overview.png",
      caption: "Default Service dashboard — KPIs, charts, map and trends in one view",
      details: [
        "Top bar: dashboard switcher (current = 'service dashboard'), Edit pencil, Share & Delete actions on the right",
        "Service Orders by Status — bar chart with counts per status (e.g. Technically Completed = 5, Partially Completed = 1)",
        "Tasks by Status — donut chart with total count and an Open legend",
        "Dispatch Locations — geo widget showing dispatch pins on a map (3 locations)",
        "Dispatches by Status — horizontal bar chart per status",
        "Monthly Trend — area sparkline of activity over the last 6 months",
        "Completion Rate — gauge widget; Service Orders by Status — repeated detail card",
        "Each widget exposes a 'View all ↗' link that opens the underlying module filtered by the same query",
      ],
      whatYouCanDo: [
        "Switch dashboards from the top dropdown, click Edit to enter the builder, or Share to publish a public link",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-switcher.png",
      caption: "Dashboard switcher dropdown — flip between built-in dashboards or create a new one",
      details: [
        "Lists every dashboard available to the current user (e.g. 'service dashboard', 'Sales dashboard')",
        "Active dashboard is highlighted in brand orange",
        "+ Create New Dashboard at the bottom opens the dashboard manager to start a fresh custom dashboard",
        "Selection is remembered per user as their default landing dashboard",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-manager-empty.png",
      caption: "Custom Dashboard Manager — empty state before any user dashboard exists",
      details: [
        "Header: 'Select Dashboard' dropdown (lists user-created dashboards only)",
        "Empty state message: 'No dashboards yet. Create one to get started.' with a + Create Your First Dashboard call-to-action",
        "From here the user enters the drag-and-drop builder: Widget Palette on the left, live grid in the middle, Widget Config Panel on the right",
        "Available widgets: KPI, Bar, StackedBar, Line, Area, Pie, Donut, Funnel, Gauge, Heatmap, Map, Radar, Sparkline, Table, Background — 15 types in total",
        "Per-widget data sources: Sales, Offers, Contacts, Tasks, Articles, Service Orders, Dispatches, Time & Expenses or any External API",
      ],
      whatYouCanDo: [
        "Create a custom dashboard, drag widgets from the palette, configure data source / filters / colors per widget, then Save and Share via public token",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-edit-mode.png",
      caption: "Dashboard Edit mode — drag, resize and reorder widgets",
      details: [
        "Top toolbar (left → right): Rename, + Add Widget, Period selector (All Time / Last 7/30/90 Days / Last 6 Months / Last Year / Custom Range), Auto-refresh (off / 30s / 1m / 5m / 15m), Refresh now, Grid settings, Cancel, Save",
        "Each widget shows a drag handle (⋮⋮ top-left), a swap-data-source icon and a × remove button",
        "Banner reminder: 'Drag widgets to reorder, resize from corners, or add new widgets from the toolbar.'",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-rename-modal.png",
      caption: "Rename Dashboard modal — change the dashboard title in place",
      details: [
        "Single 'Dashboard Name' text input pre-filled with the current name",
        "Cancel / Save actions; Save persists immediately and updates the switcher entry",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-add-widget-modal.png",
      caption: "Add Widget — pick from 13 widget types",
      details: [
        "Two tabs: Add Widget (raw types) and Templates (preset widget + data source)",
        "Types: KPI Card, Sparkline, Bar Chart, Pie Chart, Donut Chart, Line Chart, Area Chart, Funnel Chart, Radar Chart, Stacked Bar, Heatmap, Data Table, Map, Gauge",
        "Selecting a type advances to the Configure Widget step",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-add-widget-templates.png",
      caption: "Templates tab — ready-made widgets bound to a data source",
      details: [
        "One-click presets: Sales Revenue (KPI · Sales), Total Contacts (KPI · Contacts), Sales by Status (Bar · Sales), Offers Pipeline (Donut · Offers), Conversion Rate (Gauge · Sales), Sales Trend (Area · Sales), Tasks by Status (Radar · Tasks), Service Orders by Status (Heatmap · Service Orders), Tasks by Status (Stacked Bar · Tasks), Top Sales, …",
        "Clicking a template adds the widget instantly with its default title and configuration",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-widget-config.png",
      caption: "Configure Widget — set title, data source and metric",
      details: [
        "Header chip recalls the chosen widget type (e.g. 'KPI Card · KPI Cards')",
        "Widget Title (free text), Data Source dropdown (Sales, Offers, Contacts, Tasks, Articles, Service Orders, Dispatches, Time & Expenses, External API), Metric dropdown (Count, Sum, Average, Min, Max, …)",
        "+ Add Widget button finalises the widget and drops it onto the next free grid cell",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-grid-settings.png",
      caption: "Grid Settings — fine-tune spacing, density and animation",
      details: [
        "Preset: Compact / Comfortable / Spacious",
        "Sliders: Spacing (px), Row Height (px), Corner Radius (px)",
        "Card Style: Default / Flat / Elevated / Bordered",
        "Widget Entrance animation: None / Fade / Slide / Scale / Bounce",
        "Reset to Default restores the dashboard's original look",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-period-selector.png",
      caption: "Global period selector — applies to every widget at once",
      details: [
        "Options: All Time, Last 7 Days, Last 30 Days, Last 90 Days, Last 6 Months, Last Year, Custom Range",
        "Custom Range opens a date-range picker; the selection is persisted with the dashboard",
      ],
    },
    {
      src: "/docs-screenshots/dashboard-save-toast.png",
      caption: "Save confirmation — dashboard returns to view mode",
      details: [
        "Toast 'Dashboard saved successfully' appears bottom-right",
        "Toolbar collapses back to the read-only Edit / Share / Delete actions",
        "Layout, period, auto-refresh, grid settings and every widget configuration are persisted to the user dashboard record",
      ],
    },
  ],
  hr: [
    {
      src: "/docs-screenshots/hr-dashboard.png",
      caption: "HR dashboard — KPIs and shortcuts to every HR sub-module",
      details: [
        "Top KPI tiles: Active employees, Pending leaves, Attendance today (%), Estimated monthly payroll (TND)",
        "Quick actions: Add employee, Run payroll, Approve leaves, Export CNSS",
        "Charts: Headcount evolution, Absences by type, Payroll cost trend (12 months)",
        "Pending tasks: leave requests awaiting approval, contracts expiring < 30 days, employees missing CNSS #",
      ],
    },
    {
      src: "/docs-screenshots/hr-employees.png",
      caption: "Employees list with payroll-readiness segmentation",
      details: [
        "Columns: Employee (avatar + name), Position, Department, Contract type, Salary (TND), CNSS #, Status",
        "Segmentation tabs: All / Payroll-ready (CNSS + bank info OK) / Incomplete / On leave / Terminated",
        "Filters: Department, Contract (CDI/CDD/Stage/Freelance), Status, Hire date range, Has CNSS #",
        "Row actions: Open detail, Edit, Generate payslip, Add bonus/deduction, Mark as terminated",
        "Toolbar: + Add employee, Bulk import (.xlsx), Export CSV, Column picker",
      ],
    },
    {
      src: "/docs-screenshots/hr-employee-detail.png",
      caption: "Employee detail — multi-tab file (Profile / Salary / CNSS / Bonuses / Leaves / Documents)",
      details: [
        "Profile: identity, CIN, contact, address, hire date, contract end date, manager, department",
        "Salary: base gross, allowances (transport, meal, housing), abattements (head of family, # children)",
        "CNSS: CNSS number, affiliation date, employee + employer rate snapshot, monthly contribution preview",
        "Bonuses: history of typed entries (Bonus / Allowance / Deduction / Reimbursement) with period & total",
        "Leaves: balance per leave type, history table, request on behalf, conflicts vs team calendar",
        "Documents: contract, ID copy, diplomas, payslips archive — upload, preview, download, e-sign",
      ],
    },
    {
      src: "/docs-screenshots/hr-attendance.png",
      caption: "Monthly attendance — List & Matrix views",
      details: [
        "Matrix view: rows = employees, columns = days; color-coded statuses (present / absent / late / remote / leave)",
        "List view: chronological log with check-in, check-out, break duration, overtime hours",
        "Period picker (month/year), department filter, employee search",
        "Auto-computed totals per employee: worked hours, overtime, late count, absences",
        "Export: CSV / Excel / printable monthly sheet per employee",
      ],
    },
    {
      src: "/docs-screenshots/hr-attendance-add-modal.png",
      caption: "Add Attendance Entry modal",
      details: [
        "Fields: Employee, Date, Check-in, Check-out, Break (min), Status (present/absent/late/remote)",
        "Optional: Notes, Overtime hours (auto-feeds payroll), Approval required toggle",
        "Validation: prevents overlapping entries on the same day, enforces leave consistency",
      ],
    },
    {
      src: "/docs-screenshots/hr-leaves.png",
      caption: "Leaves — Calendar / List / Balances / Approvals",
      details: [
        "Calendar tab: team calendar with overlap detection (max simultaneous absences per dept)",
        "List tab: every request with type, period, days, status (Pending / Approved / Rejected / Cancelled)",
        "Balances tab: per leave type (Annual, Sick, Maternity, Special) — entitled, taken, remaining",
        "Approvals tab: manager queue with one-click approve/reject + comment",
        "Request modal: type, dates, half-day toggle, justification upload, attaches medical certificate for sick",
      ],
    },
    {
      src: "/docs-screenshots/hr-payroll.png",
      caption: "Payroll runs — Tunisian 2025 law (CNSS / IRPP / CSS)",
      details: [
        "Period selector (month + year), generate Draft pulling Employees + Attendance + Bonuses + Leaves",
        "Per-employee row: Gross, Overtime, CNSS (9.18% emp / 16.57% empr), Taxable gross, Abattement, IRPP (progressive brackets), CSS (1%), Net",
        "Workflow: Draft → Confirmed (locks values) → Paid (records payment date)",
        "Per-employee actions: edit overrides, view breakdown, download PDF payslip (react-pdf, FR/EN labels, 3-decimals TND)",
        "Bulk: confirm all, mark all paid, export CSV (bank wire), export full run PDF",
      ],
    },
    {
      src: "/docs-screenshots/hr-bonuses.png",
      caption: "Bonuses, allowances, deductions, reimbursements",
      details: [
        "Entry types: Bonus / Allowance / Deduction / Reimbursement (taxable flag per type)",
        "Fields: Employee, Type, Label, Amount (TND), Period (month/year), Notes",
        "Running totals row: Bonuses, Deductions, Net effect — feeds the next payroll run",
        "Filters: employee, type, period; CSV export per period",
      ],
    },
    {
      src: "/docs-screenshots/hr-cnss.png",
      caption: "CNSS rates & monthly declaration",
      details: [
        "Rate config: employee % + employer % with effective-from date and full history table",
        "Monthly declaration table: per CNSS number — gross, base, employee share, employer share, total",
        "Export CSV in the format expected by the CNSS portal (déclaration mensuelle)",
        "Validation: warns if any active employee has no CNSS number",
      ],
    },
    {
      src: "/docs-screenshots/hr-departments.png",
      caption: "Departments & org chart",
      details: [
        "List: Code, Name, Manager, Employee count, Created at",
        "Org chart view: hierarchical tree (parent → children) with manager avatars",
        "CRUD: add / edit / delete department; reassign employees on delete",
      ],
    },
    {
      src: "/docs-screenshots/hr-performance.png",
      caption: "Performance Management — Goals / Cycles / Reviews",
      details: [
        "Goals: per employee, weighted, with target date, progress %, status (On track / At risk / Done)",
        "Review Cycles: define a period (e.g. H1 2026), include departments, set template",
        "Reviews: self-review + manager review, rating per competency, free-text feedback, sign-off",
      ],
    },
    {
      src: "/docs-screenshots/hr-recruitment.png",
      caption: "Recruitment pipeline",
      details: [
        "Job openings: title, department, location, contract type, status (Open / On hold / Closed)",
        "Applicants per job with stage: Applied → Screening → Interview → Offer → Hired / Rejected",
        "Drag-and-drop kanban to move applicants across stages",
        "KPIs: applicants by stage, time-to-hire, source (LinkedIn, referral, website)",
      ],
    },
    {
      src: "/docs-screenshots/hr-reports.png",
      caption: "HR reports with CSV + Excel export",
      details: [
        "Employee cost: Gross + Bonuses − Deductions + Employer CNSS = Total cost (per employee, monthly + YTD)",
        "Payroll report: aggregate per period (totals, # paid, # pending)",
        "CNSS report: monthly contributions, year-to-date, by employee",
        "Absences report: count + days per leave type, per department, per employee",
        "Each report: filters (period, department), CSV + Excel export, print",
      ],
    },
    {
      src: "/docs-screenshots/hr-settings.png",
      caption: "HR settings",
      details: [
        "CNSS rates: timeline of (employee %, employer %, effective date) — never overwrites past payrolls",
        "Public holidays: Tunisian calendar pre-seeded, add custom company days off",
        "General: currency (TND), locale (fr-TN), fiscal year, default working week, overtime multiplier",
      ],
    },
  ],
  contacts: [
    { src: "/docs-screenshots/contacts-list-full.png", caption: "Contacts list — Persons + Companies + Suppliers, KPIs, Search, Filters, Map toggle, Import & Add Contact",
      details: [
        "KPI tiles: Total / Persons / Companies (Suppliers shown when filtered)",
        "Search bar: full-text across name, email, phone, company, CIN, Tax ID",
        "Toolbar: + Add Contact, Bulk Import, Map / List toggle, Filters drawer, Column picker, CSV export",
        "Row actions: Favorite (star), Open detail, Edit, Delete (soft)",
      ] },
    { src: "/docs-screenshots/contacts-add-person.png", caption: "Add Contact (Person)",
      details: [
        "Target Company picker (multi-company aware)",
        "Identity: First / Last name, Position, Email, Phone, Mobile",
        "Address: Street, City, Country, Postal code + map preview",
        "Fiscal: CIN (National ID), Tax ID (Matricule Fiscale)",
        "Work info: Department, Hire date, Status (Active / Inactive), Tags",
      ] },
    { src: "/docs-screenshots/contacts-detail-person.png", caption: "Person detail — 360° tabs",
      details: [
        "Tabs: Overview / Installations / Offers / Sales / Service Orders / Purchases / Notes",
        "Header card: avatar, name, status, type, favorite toggle, quick actions (Edit, Delete, Export vCard)",
        "Overview: contact info, address with embedded map, recent activity feed",
        "Linked records show counts on each tab and open the related entity in context",
      ] },
    { src: "/docs-screenshots/contacts-detail-company.png", caption: "Company detail",
      details: [
        "Company-specific fields: Legal name, Tax ID, Industry, Size, Website",
        "Address with map; primary contact person; child contacts list",
        "Linked installations / offers / sales / service orders / purchases tabs",
      ] },
    { src: "/docs-screenshots/contacts-detail-supplier.png", caption: "Supplier detail",
      details: [
        "Supplier-only fields: payment terms default, RS rate category (services/goods/honoraires), bank account",
        "Purchases tab: PO history, receipts, invoices, outstanding balance",
        "Performance snapshot: on-time delivery %, avg lead time, total spend YTD",
      ] },
    { src: "/docs-screenshots/contacts-edit-modal.png", caption: "Edit Contact modal",
      details: [
        "Switch type Person ↔ Company ↔ Supplier (preserves shared fields)",
        "Status toggle (Active / Inactive)",
        "Address with interactive map: click to drop pin or 'Use My Location' (geolocation API)",
        "Save / Cancel; unsaved-changes guard if you try to close",
      ] },
    { src: "/docs-screenshots/contacts-suppliers-list.png", caption: "Suppliers list (/dashboard/suppliers)",
      details: [
        "Same UX as Contacts list, scoped to type=Supplier",
        "Extra columns: RS category, Outstanding balance, Last PO date",
        "Toolbar: + Add Supplier, Import, Filters, Map view",
      ] },
    { src: "/docs-screenshots/contacts-add-supplier.png", caption: "Add Supplier",
      details: [
        "Supplier Type radio: Person / Company",
        "Person/Company info, Address, CIN, Tax ID",
        "Supplier-specific: RS category, default payment terms, bank IBAN",
      ] },
    { src: "/docs-screenshots/contacts-import.png", caption: "Bulk Import Contacts",
      details: [
        "Two modes: Dynamic Import (any Excel headers → mapped to fields) or Structured Import (fixed template .xlsx / .xls)",
        "Download template button for Structured mode",
        "Drag-and-drop file zone with size + row count preview",
      ] },
    { src: "/docs-screenshots/contacts-filters.png", caption: "Advanced Filters drawer",
      details: [
        "Status: Active / Inactive; Type: Person / Company / Supplier",
        "Multi-select Tags filter with color chips",
        "Boolean filters: Favorites only, Has email, Has phone, Has geolocation",
        "Reset / Apply buttons; selected filter pills shown above the list",
      ] },
    { src: "/docs-screenshots/contacts-map-view.png", caption: "Contacts Map view",
      details: [
        "Markers clustered by zoom level; click marker to open mini-card",
        "Filter by type (Person/Company/Supplier) directly on the map toolbar",
        "Click 'Open' on a mini-card to navigate to the contact detail",
      ] },
    { src: "/docs-screenshots/contacts-notes-modal.png", caption: "Contact Notes modal",
      details: [
        "Rich-text note body, author + created/updated timestamps",
        "Inline edit, soft-delete with undo toast",
        "Notes feed appears on the contact's Overview tab",
      ] },
    { src: "/docs-screenshots/contacts-tags-manager.png", caption: "Tags manager",
      details: [
        "Color picker (10 preset palette + custom hex)",
        "Description field shown on hover anywhere the tag is used",
        "Delete cascades to remove the tag from all contacts (confirmation modal)",
      ] },
    { src: "/docs-screenshots/contacts-delete-confirm.png", caption: "Delete Contact confirmation",
      details: [
        "Soft-delete by default (contact archived, restorable from filters)",
        "Lists linked records (offers, sales, service orders, purchases) that keep the historical reference",
        "Bulk delete asks to type the count for safety",
      ] },
    { src: "/docs-screenshots/contacts-import-mapping.png", caption: "Dynamic Import — column mapping",
      details: [
        "Auto-detected headers from the uploaded .xlsx",
        "Drag headers onto target fields (First name, Last name, Email, Phone, Company, CIN, Tax ID, City, Country, Tags)",
        "Preview first 10 rows after mapping; errors highlighted (invalid email, missing required field)",
        "Duplicate strategy: Skip / Update by email / Create anyway",
      ] },
  ],
  purchases: [
    {
      src: "/docs-screenshots/purchases-overview.png",
      caption: "Purchases hub — KPIs + recent activity",
      details: [
        "KPI tiles: Open POs, Pending receipts, Unpaid invoices, This-month spend (TND)",
        "Recent Purchase Orders table with status chips and quick links",
        "Quick links: New PO, New Receipt, New Invoice, Compliance, Reports, Audit Log",
        "Compliance widget: RS YTD, Facture en Ligne pending, TEJ sync status",
      ],
    },
    {
      src: "/docs-screenshots/purchases-orders.png",
      caption: "Purchase Orders list",
      details: [
        "Columns: PO #, Supplier, Order date, Expected delivery, Status, Total HT, TVA, Total TTC",
        "Status pipeline as colored chips (Draft / Pending / Approved / Sent / Partially Received / Received / Closed / Cancelled)",
        "Filters: Supplier, Status, Date range, Has open balance",
        "Row actions: View, Edit, Duplicate, Cancel, Generate Receipt, Generate Invoice, Download PDF",
        "Toolbar: + New PO, CSV export, column picker, grid/list toggle",
      ],
    },
    {
      src: "/docs-screenshots/purchases-orders-add.png",
      caption: "Create Purchase Order",
      details: [
        "Header: Supplier (autocomplete), PO #, Order date, Expected delivery, Currency, Payment terms (Net 30/60/90/On receipt/Custom)",
        "Line items: Article (autocomplete from catalog), Supplier ref, Description, Qty, Unit, Unit price, Discount %, Tax %",
        "Auto totals: Subtotal HT, Discount total, Tax breakdown per rate, Fiscal stamp (Tunisia), Grand total TTC",
        "Footer: Notes, Internal comments, Attachments (quotes, supplier proforma)",
        "Save as Draft, Submit for approval, or Approve & Send (PDF email)",
      ],
    },
    {
      src: "/docs-screenshots/purchases-receipts.png",
      caption: "Goods Receipts",
      details: [
        "Match against PO: select open POs, receive partial or full quantities per line",
        "Received-by user + receipt date auto-stamped, optional supplier delivery note #",
        "Auto-creates stock movements (IN) for each received line",
        "Soft-delete with audit trail; edit allowed until linked to an invoice",
        "Status: Draft / Posted / Cancelled; PDF export",
      ],
    },
    {
      src: "/docs-screenshots/purchases-invoices.png",
      caption: "Supplier Invoices",
      details: [
        "Three-way match: invoice ↔ PO ↔ receipt; mismatches highlighted in red",
        "Fields: Invoice #, Supplier, Issue date, Due date, Currency, Lines (auto from receipt or manual)",
        "Retenue à la Source (RS): rate auto-picked per supplier category (services/goods/honoraires); withheld + net to pay computed",
        "Payment status: Unpaid / Partially paid / Paid; record payments with date, method, reference",
        "Facture en Ligne flag: Pending / Sent / Validated; TEJ sync indicator",
      ],
    },
    {
      src: "/docs-screenshots/purchases-compliance.png",
      caption: "Fiscal Compliance dashboard",
      details: [
        "Retenue à la Source: YTD total withheld, breakdown by supplier and rate, monthly chart, CSV export for accounting",
        "Facture en Ligne: counts of Pending / Sent / Validated invoices, click-through to filtered list",
        "TEJ Integration: connection status, last sync timestamp, queued items, retry button",
        "Compliance alerts: invoices missing RS, suppliers without fiscal ID, overdue declarations",
      ],
    },
    {
      src: "/docs-screenshots/purchases-reports.png",
      caption: "Reports hub",
      details: [
        "Supplier Performance: on-time delivery %, avg lead time (days), total spend, # POs, # disputes",
        "Price Evolution: per article + supplier price history line chart, % change vs previous period",
        "Supplier Invoice Aging: outstanding amounts grouped by buckets (Current / 1-30 / 31-60 / 61-90 / 90+ days)",
        "Monthly spending: TND total per month, stacked by supplier or category",
        "All reports: period filter, CSV + PDF export, drill-down to source documents",
      ],
    },
    {
      src: "/docs-screenshots/purchases-audit-log.png",
      caption: "Purchases Audit Log",
      details: [
        "Columns: Date/time, User, Entity (PO/Receipt/Invoice/Payment), Entity #, Action (Create/Update/Delete/Status change), Description",
        "Filters: User, Entity type, Action, Date range",
        "Click row to open the diff (before/after JSON) for full traceability",
        "CSV export for compliance audits",
      ],
    },
  ],
  external: [
    {
      src: "/docs-screenshots/external-list.png",
      caption: "External Endpoints list",
      details: [
        "KPIs: Total Endpoints, Active, Received Today, Total Received (all-time, last received timestamp)",
        "Table columns: Name, Slug URL, Status (Active/Inactive toggle), Methods, Received count, Last received",
        "Search + filter (All / Active / Inactive); per-endpoint quick actions: View, Edit, Copy URL, Test, Delete",
        "Toolbar: + Create Endpoint, Refresh, Bulk activate/deactivate",
      ],
    },
    {
      src: "/docs-screenshots/external-create.png",
      caption: "Create Endpoint — templates + custom",
      details: [
        "Quick-start templates: Landing page (vehicle quote), Generic contact form, B2B Lead capture, Webhook passthrough",
        "Each template pre-fills name, allowed methods, expected payload schema, and a target conversion (Offer / Sale / Contact)",
        "Custom mode: name, description, allowed HTTP methods (POST/GET/PUT/DELETE), Active toggle, optional schema (JSON Schema)",
        "Auto-generated slug + API key on save (both copyable, key can be rotated later)",
      ],
    },
    {
      src: "/docs-screenshots/external-detail.png",
      caption: "Endpoint detail — Public URL, API key, inbound log",
      details: [
        "Public URL block: full https:// slug URL, one-click copy, QR code for mobile testing",
        "API key block: hidden by default, Reveal / Copy / Rotate (regenerate) actions",
        "Test endpoint: send a sample payload from the UI, see response inline",
        "Inbound log table: Date/time, Method, Source IP, Status code, Payload preview, actions (View payload, Mark as read, Convert → Offer, Convert → Sale, Delete)",
        "Bulk: Mark all as read, Clear all logs, Export CSV",
      ],
    },
    {
      src: "/docs-screenshots/external-edit.png",
      caption: "Edit Endpoint",
      details: [
        "Editable: name, description, allowed methods, Active toggle, schema",
        "Slug is read-only after creation (so existing integrations keep working)",
        "Rotate API key with confirmation (old key invalidated immediately)",
        "Danger zone: Delete endpoint (cascade deletes inbound log)",
      ],
    },
  ],
  offers: [
    {
      src: "/docs/screenshots/01-offers-list.png",
      caption: "Offers — List view (default)",
      details: [
        "KPI tiles across the top: Total offers, Draft, Sent, Accepted, Declined, plus aggregated value (TND)",
        "Sticky toolbar: full-text search, + Create Offer, Filters, Export CSV, view-mode toggle (Table / Kanban / Map)",
        "Table columns: Reference, Title, Customer, Company, Status badge, Total HT, Total TTC, Validity date, Assignee, Updated at",
        "Row actions menu: Open, Edit, Send, Download PDF, Convert (Sale / Service Order), Duplicate, Delete (soft)",
        "Bulk-select with bulk delete and bulk status change; Multi-company-aware (Target Company scope, View All adds a Company column)",
      ],
    },
    {
      src: "/docs/screenshots/01b-offers-cards.png",
      caption: "Offers — Kanban / Cards view",
      details: [
        "Columns by status: Draft, Sent, Accepted, Declined, Cancelled — each card shows reference, customer, total TTC, validity",
        "Drag-and-drop a card across columns to change its status (confirmation dialog + permission check)",
        "Card click opens the offer detail; quick actions (Send / PDF / Convert) available from the card's overflow menu",
      ],
    },
    {
      src: "/docs/screenshots/01c-offers-map.png",
      caption: "Offers — Map view",
      details: [
        "Geocodes the linked contact addresses and pins each offer on an interactive map",
        "Pin color reflects status; clicking a pin opens a popover with offer summary and a link to the detail page",
        "Useful to spot territorial concentration of pending or accepted offers",
      ],
    },
    {
      src: "/docs/screenshots/01d-offers-filters.png",
      caption: "Offers — Filters dialog",
      details: [
        "Filter by Status (multi-select), Assignee, Date range (Any / 7d / 30d / 365d / custom), Tags, Currency",
        "Filters persist per user and combine with the search box; Reset button restores defaults",
      ],
    },
    {
      src: "/docs/screenshots/01e-offers-add.png",
      caption: "Create / Edit Offer page",
      details: [
        "Header block: Title, Reference (auto-generated, editable), Description, Validity date, Priority, Assignee, Currency, Tax type (% / fixed)",
        "Customer block: Contact + Company autocomplete with inline 'create new contact'",
        "Items manager: catalog autocomplete or free-form line — qty, unit, unit price, discount %, tax %, item type Product/Service",
        "Live totals: Subtotal HT, Discount, Tax breakdown, Fiscal stamp, Grand Total TTC",
        "Notes (customer-visible) + Internal notes + Attachments uploader",
      ],
    },
    {
      src: "/docs/screenshots/02-offer-detail-overview.png",
      caption: "Offer detail — Overview tab",
      details: [
        "Header: title, reference, status badge, totals (HT / TTC), validity date, assignee, target company",
        "Status flow stepper (Draft → Sent → Accepted/Declined) with one-click transitions and confirmation dialog",
        "Parties panel: Customer (contact + company) and Issuer (your company), with phone/email shortcuts",
        "Header actions: Send (email modal w/ templates, CC/BCC, PDF attached, signature image), PDF Preview/Download (configurable), Convert (Sale / SO), Duplicate, Edit, Delete",
        "Recent activity feed (status changes, sends, edits, conversions)",
      ],
    },
    {
      src: "/docs/screenshots/03-offer-detail-items.png",
      caption: "Offer detail — Items tab",
      details: [
        "Full lines manager same as create/edit: catalog or free, qty/unit/price/discount/tax, type Product/Service",
        "Reordering via drag handle; per-line subtotal HT and TTC; per-line tax preview",
        "Footer totals: Subtotal HT, Total Discount, Tax breakdown by rate, Fiscal stamp, Grand Total TTC",
        "Service items here are the ones eligible to flow into a Service Order on conversion",
      ],
    },
    {
      src: "/docs/screenshots/04-offer-detail-notes.png",
      caption: "Offer detail — Notes tab",
      details: [
        "Rich-text feed of internal notes with author avatar, name and timestamp",
        "Mention teammates with @, attach files, edit / delete your own notes",
        "Notes are internal-only — they never appear on the customer PDF",
      ],
    },
  ],
  sales: [
    {
      src: "/docs/screenshots/05-sales-list.png",
      caption: "Sales — List view",
      details: [
        "KPI tiles: Total sales, In Progress, Invoiced, Outstanding amount (sum of unpaid balances)",
        "Toolbar: search, Filters (Status, Assignee, Date range), Export (CSV column picker), + New Sale (CreateActionGuard role check), FastAddSaleForm for quick inline create",
        "View modes: List / Table / Kanban — selection persists per user",
        "Status workflow: Created → In Progress → Invoiced → Closed; branches: In Progress → Partially Invoiced → Invoiced; Cancelled is terminal-negative",
        "Bulk-select + bulk delete + bulk status change",
      ],
    },
    {
      src: "/docs/screenshots/06-sale-detail-overview.png",
      caption: "Sale detail — Overview tab",
      details: [
        "Header: reference, status badge, total HT/TTC, paid amount, outstanding balance, due date, assignee",
        "Auto-conversion banner: when the sale moves to In Progress and contains service items, a Service Order is created automatically (configurable). Banner deep-links to the related SO via sale.convertedToServiceOrderId",
        "Header actions: Send Invoice (email + PDF), Download PDF (PdfSettingsModalEnhanced — logo, colors, footer, mentions, multi-page), Convert to Service Order (manual, when not auto), View Service Order (when converted), Edit, Delete",
        "Parties block (Customer / Issuer), recent activity feed",
      ],
    },
    {
      src: "/docs/screenshots/07-sale-detail-items.png",
      caption: "Sale detail — Items tab",
      details: [
        "Lines manager identical to offers: catalog or free-form, qty / unit / price / discount % / tax %, type Product or Service",
        "Live totals: Subtotal HT, Discount, TVA breakdown by rate, Fiscal stamp, Grand Total TTC",
        "Service items here drive the auto / manual conversion to a Service Order",
      ],
    },
    {
      src: "/docs/screenshots/08-sale-detail-payments.png",
      caption: "Sale detail — Payments tab",
      details: [
        "Record a payment: Date, Method (cash / bank transfer / cheque / card / other), Reference, Amount, Notes",
        "Supports partial payments — outstanding balance recomputes on each entry",
        "Payments table with edit / delete actions; status auto-flips to Invoiced/Partially Invoiced based on totals",
        "Audit fields per row (created by, created at)",
      ],
    },
  ],
  "service-orders": [
    {
      src: "/docs-screenshots/service-orders-list.png",
      caption: "Service Orders — Table view",
      details: [
        "KPI strip: Total Orders, Active, Completed, Total Value (in tenant currency)",
        "Columns: Order #, Company, Customer, Status badge, Related Sale (clickable), Created date, row actions",
        "Toolbar: search, Filters, three view modes (Cards / Table / Map), Create",
        "Pagination at the bottom",
      ],
      whatYouCanDo: [
        "Open any order to drill into Overview / Jobs / Dispatches / Time & Expenses / Materials / Attachments / Checklists / Activity",
        "Jump from a service order back to the originating sale invoice in one click",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-filters.png",
      caption: "Inline filters",
      details: [
        "Filter by Status, Priority, Technician, and a time range (Any time / Today / Week / Month / Custom)",
        "Clear button resets all filters in one click",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-cards-view.png",
      caption: "Cards view",
      details: [
        "Each card shows order number, status badge, customer, technician count, created date, and total amount",
        "Right-side quick actions: View, Generate report, Delete",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-map-view.png",
      caption: "Map view",
      details: [
        "Geo-located service orders pinned on the map (uses customer address coordinates)",
        "Click markers for details; 'Open in Maps' link for navigation",
        "Below the map: same card list — pick an order to drill in",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-actions-menu.png",
      caption: "Row actions menu",
      details: ["Per-row: View Details, Delete Order"],
    },
    {
      src: "/docs-screenshots/service-orders-create.png",
      caption: "Create Service Order",
      details: [
        "Pick the Target Company (multi-tenant aware)",
        "Optionally link to an existing Offer or Sale — converts directly into a service order",
        "Choose a customer (Person or Company) from contacts; supports search by name/email/phone",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-detail-overview.png",
      caption: "Detail — Overview tab",
      details: [
        "Header: order #, target company selector, status flow stepper (In Progress → Technically Completed → Ready for Invoice), header actions (PDF report, email, share, convert to invoice, refresh)",
        "Service Order Details: order ID, related sale, description, priority, contact, contact email/phone, service type, estimated cost, target completion date, created date/by",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-detail-jobs.png",
      caption: "Detail — Jobs tab",
      details: [
        "Jobs grouped by Installation (or 'No installation')",
        "Per-job columns: Job title + code (JOB-1, JOB-2…), Status (Dispatched / Unscheduled / In Progress / Completed), Work Type",
        "Row actions to open the job, dispatch it, or update status",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-detail-dispatches.png",
      caption: "Detail — Dispatches tab",
      details: [
        "Each dispatch row: dispatch #, status, priority, assigned technician, scheduled date and time window",
        "View Schedules to see all dispatches on the planner",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-detail-time-expenses.png",
      caption: "Detail — Time & Expenses tab",
      details: [
        "Two parallel logs: Time Tracking (start/end, technician, duration) and Expense Tracking (amount, date, technician, status)",
        "Each entry is linked back to its source dispatch (DISP-…)",
        "Add Time / Add Expense buttons; per-row edit and delete",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-detail-materials.png",
      caption: "Detail — Materials tab",
      details: [
        "Materials Used table: Material, Installation, Qty, Unit Cost, Total — with rolling Total Cost",
        "Add Material picks from the catalog and deducts from stock",
      ],
    },
    {
      src: "/docs-screenshots/service-orders-detail-attachments.png",
      caption: "Detail — Attachments tab",
      details: ["Drag & drop documents (photos, PDFs, signed forms) or click Add Document"],
    },
    {
      src: "/docs-screenshots/service-orders-detail-checklists.png",
      caption: "Detail — Checklists tab",
      details: ["Attach a Dynamic Form as a checklist; technicians fill it from the field app"],
    },
    {
      src: "/docs-screenshots/service-orders-detail-activity.png",
      caption: "Detail — Activity tab",
      details: [
        "Full audit trail: every status change, expense, time entry, dispatch action and user note",
        "Add Note action to leave manual annotations",
      ],
    },
  ],
  lookups: [
    {
      src: "/docs-screenshots/lookups-overview.png",
      caption: "Lookups — category browser (left) with empty detail pane",
      details: [
        "Two-pane layout: left list of all lookup categories, right detail pane",
        "Each category row shows its name and item count (e.g. 'Task Status Types · 12 items')",
        "Right pane shows an empty-state placeholder until a category is selected",
        "Sidebar entry 'Lookups' under SYSTEM group",
      ],
      whatYouCanDo: [
        "Click any category to load its values into the right pane",
        "Use the global search (top bar) to jump straight to a known value",
      ],
    },
    {
      src: "/docs-screenshots/lookups-task-status.png",
      caption: "Task Status Types — values table",
      details: [
        "Header shows category icon, name, total item count badge, and 'Add Item' button",
        "Columns: Default (star toggle), Name, Completed (where applicable), Status (Active/Inactive), Actions",
        "Each row has inline Edit (pencil) and Delete (trash) buttons",
      ],
      fieldsActions: [
        "Star = mark default value (one per category)",
        "Status badge: Active values are pickable in the app; inactive ones stay only on historical records",
      ],
    },
    {
      src: "/docs-screenshots/lookups-priorities.png",
      caption: "Priorities — short example with default value highlighted",
      details: [
        "6 entries (High, low, meduim) with two of them starred as default",
        "Used by Tasks, Offers, Service Orders, Dispatches and Deals priority pickers",
      ],
    },
    {
      src: "/docs-screenshots/lookups-article-categories.png",
      caption: "Article Categories — taxonomy used by Articles & Inventory",
      details: [
        "14 entries (BODY, CLEANING, DETAILING, ELECTRICAL, INSPECTION, MECHANICAL, PAINTING…)",
        "Drives Articles module filtering and reporting",
      ],
    },
    {
      src: "/docs-screenshots/lookups-article-groups.png",
      caption: "Article Groups — secondary grouping (e.g. CABINE, MICRO MARBRE, POLISSEUSE)",
      details: [
        "18 entries; orthogonal to Categories, used for pricing groups and stock segmentation",
      ],
    },
    {
      src: "/docs-screenshots/lookups-service-categories.png",
      caption: "Service Categories — applied to service-type articles & service orders",
      details: [
        "10 entries (Electrical & Diagnostics, Inspection & Support, Maintenance & Care, Mechanical, Painting & Body…)",
      ],
    },
    {
      src: "/docs-screenshots/lookups-leave-types.png",
      caption: "Leave Types — extra Paid/Unpaid column for HR payroll integration",
      details: [
        "4 entries (Planned Leave / Paid, Sick Leave / Unpaid)",
        "Consumed by HR Leaves module to compute paid vs unpaid balances",
      ],
      fieldsActions: [
        "Paid badge: drives whether the leave deducts from salary in payroll runs",
      ],
    },
    {
      src: "/docs-screenshots/lookups-locations.png",
      caption: "Locations — physical locations / branches used across modules",
      details: [
        "Used by Stock Management, Dispatcher and Service Orders to attach a site",
      ],
    },
    {
      src: "/docs-screenshots/lookups-list-extended.png",
      caption: "Full category list — Offer Sources, Installation Categories, Work Types, Expense Types, Project Types, Form Categories, Document Types",
      details: [
        "Scrolled view of the left rail showing the remaining lookup categories",
        "Empty categories (e.g. 'Document Types · 0 items') are still listed so admins can populate them",
      ],
    },
    {
      src: "/docs-screenshots/lookups-add-item.png",
      caption: "Create New Item dialog",
      fieldsActions: [
        "Name (required) — display label",
        "Active toggle — controls whether the value appears in pickers",
        "Sort Order — integer; lower numbers appear first",
        "Some categories add extra fields (e.g. Paid for Leave Types, Completed for Task Statuses)",
      ],
    },
    {
      src: "/docs-screenshots/lookups-edit-item.png",
      caption: "Edit Item dialog — same shape as Create, prefilled",
      details: [
        "Renaming a value updates it everywhere it is referenced (FK by id, label is denormalised at read-time)",
      ],
      whatYouCanDo: [
        "Toggle Active off to retire a value without breaking historical records",
        "Adjust Sort Order to reorder pickers globally",
      ],
    },
  ],
};

SHOTS["dispatches"] = [
  {
    src: "/docs/screenshots/11-dispatches-list.png",
    caption: "Dispatches — List view",
    details: [
      "Columns: Job number, Company, Customer, Scheduled date & time window, Technician(s), Current status, Priority",
      "Each dispatch is a technician assignment with date/time/route, tied to a Service Order and (optionally) an Installation",
      "Status badges (Assigned / In progress / Completed / Pending / Cancelled) and Priority badges (Low / Medium / High)",
      "Search box + status filter dropdown; bulk-select via row checkbox; row-click opens detail",
    ],
  },
  {
    src: "/docs/screenshots/12-dispatcher-board.png",
    caption: "Dispatcher board — Operations console",
    details: [
      "Top KPI tiles: Total / Assigned / In Progress / Pending dispatches",
      "Toolbar: search, Filters, view-mode toggle (List / Table), Dispatch Jobs (bulk planning button)",
      "Table columns: Dispatch ID, related Service Order (deep link), Customer (deep link), Status, Priority, Schedule (date + time window)",
      "Cascade rules from dispatches drive the parent Service Order status: in_progress ⇒ SO=in_progress; some completed ⇒ SO=partially_completed; all completed ⇒ SO=technically_completed; rejected/all-deleted ⇒ SO=ready_for_planning",
      "Multi-company aware (Target Company scope) and RBAC-gated — technicians only see their own dispatches",
    ],
  },
  {
    src: "/docs/screenshots/13-dispatch-detail-overview.png",
    caption: "Dispatch detail — Overview tab",
    details: [
      "Header: Dispatch ID, Company picker, Status flow (In Progress → Completed) with quick-transition buttons, action icons (Notes, Share, Email)",
      "Dispatch Details panel: Dispatch ID, Related Service Order (deep link), Affected Contact (deep link), Installation (deep link)",
      "Right panel: Priority Level, Current Status, Assigned Technicians, Scheduled Date, Dispatched By",
      "Tabs: Overview / Jobs / Time & Expenses / Materials / Attachments / Checklists / Activity",
    ],
  },
  {
    src: "/docs/screenshots/14-dispatch-detail-jobs.png",
    caption: "Dispatch detail — Jobs tab",
    details: [
      "Lists every Job inside the dispatch with title, JOB-id, Status (Unscheduled / Ready / Dispatched / Cancelled), Work Type, Installation",
      "Toolbar: Search, 'Par installation' grouping toggle, Filters",
      "Click a job to open its dedicated detail page (per-job description, scheduling, technician, status flow, time & materials)",
    ],
  },
  {
    src: "/docs/screenshots/15-dispatch-detail-time-expenses.png",
    caption: "Dispatch detail — Time & Expenses tab",
    details: [
      "Two side-by-side panels: Time Booking and Expense Tracking, each with its own + Add button",
      "Time entry: technician, start/end, duration auto-computed, billable rate, link to job",
      "Expense entry: category, amount, currency, receipt upload, reimbursable flag, approval workflow",
      "Approved entries flow into the related Service Order totals and into the customer invoice",
    ],
  },
];

SHOTS["dynamic-forms"] = [
  {
    src: "/docs/screenshots/16-dynamic-forms-list.png",
    caption: "Dynamic Forms — List page",
    details: [
      "Columns: Name + description, Status (Draft / Released / Archived), Fields count, Last updated, Share, Actions",
      "Toolbar: search, status filter (All / Draft / Released / Archived), + Create Form (top-right)",
      "Forms can be embedded in checklists, sent to customers via public link, or used internally for data capture",
    ],
  },
  {
    src: "/docs/screenshots/18-dynamic-form-actions.png",
    caption: "Dynamic Form — Row actions menu",
    details: [
      "Preview — open the form in renderer mode (no submission)",
      "Edit — open the drag-and-drop builder to modify fields, validation and conditional logic",
      "Duplicate — clone the form (status reset to Draft, all fields preserved)",
      "View Responses — submissions inbox with CSV export and 'convert to CRM record' action",
      "Make Public — generates a public submission URL with optional thank-you page",
      "Archive — hides the form from default list while preserving submissions",
      "Delete — soft delete with confirmation",
    ],
  },
  {
    src: "/docs/screenshots/17-dynamic-form-render.png",
    caption: "Dynamic Form — Renderer (preview / fill mode)",
    details: [
      "Header: Form name + Released badge, language switcher (EN/FR), Save Response, Download PDF",
      "Branded layout: company logo, completion date, title, description",
      "Field types supported: text, textarea, number, email, phone, select, radio, checkbox group, date, file upload, signature",
      "Conditional logic: show/hide fields based on prior answers; required-field validation in real time",
      "Footer: form name, copyright line, page x / y for multi-page forms",
      "Save Response stores the submission against the current entity (e.g. service order checklist); Download PDF generates a branded PDF of the answers",
    ],
  },
];

SHOTS["articles"] = [
  {
    src: "/docs-screenshots/articles-list.png",
    caption: "Articles & Materials — list view with KPI cards, filters and pagination",
    details: [
      "Header: page title + Import Articles and Add Article action buttons",
      "KPI strip: Materials, Services, Low Stock, Total Items counters",
      "Filter row: free-text search, All Categories dropdown, All Statuses dropdown",
      "Paginated table with Type icon, Name, Reference/Category, Status badge, Stock, Price, Location, Actions (Transfer / Edit / Delete)",
      "Rows: 50/page selector with first/prev/next/last navigation",
    ],
    whatYouCanDo: [
      "Search articles by name, reference or SKU in real time",
      "Filter by category and status to narrow the list",
      "Click Add Article to create a new material or service",
      "Click Import Articles to bulk-load from CSV/XLSX",
      "Use Transfer on any material to record a stock-in / stock-out / transfer transaction",
      "Click Edit Article to update fields in a side modal; Delete to soft-remove",
      "Click any row to open the full Article Detail page",
      "Change page size or paginate through all results",
    ],
    fieldsActions: [
      "Type — Material (box icon) or Service (wrench icon)",
      "Status — available / low_stock / out_of_stock with color badges",
      "Stock — current quantity (— for services)",
      "Price — sell price in the tenant currency",
      "Location — warehouse / van / shelf reference",
      "Actions — Transfer (materials only), Edit Article, Delete",
    ],
  },
  {
    src: "/docs-screenshots/articles-detail.png",
    caption: "Article Detail — overview with stock levels, pricing and audit info",
    details: [
      "Header: Back button, type icon, article name, Material/Service tag, Available status",
      "Top-right actions: Copy Reference, Edit",
      "Tabs: Overview, Notes",
      "Article Information card: Reference, Category, Group, Description",
      "Stock Levels card: Current Stock, Minimum Stock, Cost Price, Sell Price, Location, Supplier",
      "Audit Information card: Created Date / By, Modified Date / By",
    ],
    whatYouCanDo: [
      "Copy the article reference to the clipboard with one click",
      "Edit the article through the side modal (same form as creation)",
      "Switch to the Notes tab to add internal comments tied to this article",
      "Read full audit trail for compliance and traceability",
    ],
    fieldsActions: [
      "Reference — unique SKU/code for the article",
      "Category & Group — classification used in filters and reports",
      "Current Stock vs Minimum Stock — drives Low Stock alerts",
      "Cost Price vs Sell Price — used for margin calculations on offers/sales",
      "Location & Supplier — sourcing and warehouse info",
    ],
  },
  {
    src: "/docs-screenshots/articles-edit-modal.png",
    caption: "Edit Article modal — Material/Service toggle with full property form",
    details: [
      "Modal header with Edit Article title and close button",
      "Article Type tabs: Material / Service",
      "Required fields: Name, Category, Status (red-outlined when missing)",
      "Reference and Description text fields",
      "Inventory Details: Current Stock, Minimum Stock Level, Cost Price, Sell Price",
      "Sourcing: Supplier, Location, Group, Sub-Location, Notes",
    ],
    whatYouCanDo: [
      "Switch between Material and Service to expose relevant fields (duration vs stock)",
      "Pick category from the lookup dropdown (managed in Lookups module)",
      "Set Minimum Stock to drive low-stock notifications",
      "Assign a default Location and Sub-Location (aisle/shelf/bin)",
      "Group articles for reporting (uses the article-group lookup)",
      "Add free-form Notes visible in the detail page",
    ],
    fieldsActions: [
      "Name * — display name shown in lists, offers and sales",
      "Reference — SKU code, optional but recommended unique",
      "Category * & Status * — required for filtering",
      "Cost / Sell Price — drives margin and totals calculations",
      "Supplier — free text or linked supplier record",
      "Location / Sub-Location — physical storage path",
    ],
  },
  {
    src: "/docs-screenshots/articles-transfer-modal.png",
    caption: "Record Inventory Transaction — stock in / out / transfer dialog",
    details: [
      "Header: Record Inventory Transaction with article name in the subtitle",
      "Transaction Type * dropdown (default Stock In)",
      "Quantity * numeric field",
      "To Location dropdown",
      "Reason * free-text (e.g. Purchase order, Sale, Damaged goods)",
      "Reference field for PO / SO / invoice numbers",
      "Notes textarea for context",
      "Footer: Cancel, Record Transaction (primary)",
    ],
    whatYouCanDo: [
      "Record a Stock In (receipt), Stock Out (consumption) or Transfer between locations",
      "Tie the movement to a reference document (PO-12345, SO-67890)",
      "Capture a human-readable reason for full audit trail",
      "Movements automatically update Current Stock and write to the stock_transactions audit log",
    ],
    fieldsActions: [
      "Transaction Type — Stock In, Stock Out, Transfer, Adjustment, Damaged, Lost, Return",
      "Quantity — positive integer; sign is derived from type",
      "To Location — required for Transfer/Stock In",
      "Reason — required for compliance",
      "Reference — links the movement to an external document",
    ],
  },
  {
    src: "/docs-screenshots/articles-inventory-services.png",
    caption: "Inventory & Services — unified view with Stock, Filters and grid/list toggle",
    details: [
      "Header: Inventory & Services with Stock, Import and Add Article buttons",
      "KPI strip: Total Items, Materials, Services, Low Stock",
      "Toolbar: Search, Filters, view-mode toggle (table / grid)",
      "Multi-select checkboxes for bulk actions",
      "Columns: Item/Service, Company, Category, Location/Duration, Price, Actions kebab",
      "Service rows show duration (e.g. 1 h) instead of stock",
    ],
    whatYouCanDo: [
      "Switch between Materials and Services in a single unified list",
      "Bulk-select rows and apply mass actions via the kebab menu",
      "Open the Stock dashboard from the top-right Stock button",
      "Use Filters to combine category, status, location, supplier, group",
      "Toggle between table and grid layouts for visual browsing",
    ],
    fieldsActions: [
      "Item/Service — click to open detail page",
      "Company — owning tenant company (multi-company setups)",
      "Category — from the article-category lookup",
      "Location / Duration — warehouse for materials, expected duration for services",
      "Price — sell price in tenant currency",
    ],
  },
  {
    src: "/docs-screenshots/articles-stock-management.png",
    caption: "Stock Management — gauge cards per material with quick actions",
    details: [
      "Header: Stock Management with KPIs (Total Materials, Critical, Low Stock, Healthy Stock)",
      "Search and Filters toolbar",
      "Card grid: one card per material with circular gauge showing % of capacity",
      "Card body: name, category, current quantity, status badge (Good / Critical)",
      "Card actions: Add Stock, Remove Stock, View History",
    ],
    whatYouCanDo: [
      "Visually identify Critical / Low Stock items at a glance via the gauge",
      "Click Add Stock or Remove Stock to record an instant movement without leaving the page",
      "Open View History to see the full stock_transactions log for the article",
      "Filter to focus on a single category, location or status",
    ],
    fieldsActions: [
      "Gauge — current stock vs minimum/maximum threshold",
      "Status — Good (≥ min), Low (< min), Critical (= 0)",
      "Add Stock / Remove Stock — opens the Record Inventory Transaction dialog",
      "View History — full audit trail with reason, reference and operator",
    ],
  },
  {
    src: "/docs-screenshots/articles-delete-confirm.png",
    caption: "Delete confirmation — irreversible action guard",
    details: [
      "Modal centered over the list with dimmed backdrop",
      "Title: 'Are you sure?' / 'This action cannot be undone. This will permanently delete the article.'",
      "Footer: Cancel (secondary) and Delete (destructive primary)",
    ],
    whatYouCanDo: [
      "Confirm to permanently delete the article (cascades to stock_transactions FK rows)",
      "Cancel to dismiss without changes",
    ],
    fieldsActions: [
      "Delete — performs hard delete via the Articles API",
      "Cancel — closes the dialog and keeps the row",
    ],
  },
  {
    src: "/docs-screenshots/articles-import.png",
    caption: "Import Articles — Dynamic Import (map your own columns)",
    details: [
      "Tabs: Dynamic Import / Structured Import",
      "Dynamic Import: upload an Excel file with custom headers and map them after upload",
      "Drop zone with 'Drop your Excel file here' and Choose File button",
      "Supported formats: Excel (.xlsx, .xls)",
    ],
    whatYouCanDo: [
      "Drag & drop or browse for an .xlsx / .xls file",
      "Map source columns to target fields (Name, Reference, Category, Stock, Price, Location, Supplier...)",
      "Preview rows and resolve validation errors before committing",
    ],
    fieldsActions: [
      "Choose File — opens native file picker",
      "Tab switch — Structured Import for predefined templates",
    ],
  },
  {
    src: "/docs-screenshots/articles-import-structured.png",
    caption: "Import Articles — Structured Import with templates",
    details: [
      "Description: 'Use our predefined template for a seamless import experience'",
      "Two template downloads: Empty Template and Template with Examples",
      "Drop zone for the filled template",
    ],
    whatYouCanDo: [
      "Download the Empty Template to start from a clean schema",
      "Download Template with Examples to see field formats and sample rows",
      "Upload the completed file to bulk-create or update articles",
    ],
    fieldsActions: [
      "Empty Template — schema-only XLSX",
      "Template with Examples — XLSX prefilled with sample rows",
      "Choose File — uploads the completed template",
    ],
  },
  {
    src: "/docs-screenshots/articles-filters.png",
    caption: "Inventory & Services — Filters drawer expanded",
    details: [
      "Active orange Filters button reveals an inline filter row",
      "Filter fields: Type (All / Material / Service) and Location (All Locations / specific warehouse)",
      "List updates live as filters change",
    ],
    whatYouCanDo: [
      "Restrict the list to materials only, services only, or both",
      "Scope to a single physical location",
      "Combine with Search and pagination for fast lookup",
    ],
    fieldsActions: [
      "Type — All / Material / Service",
      "Location — All Locations or any defined location",
    ],
  },
  {
    src: "/docs-screenshots/articles-error-state.png",
    caption: "Error boundary — graceful fallback when a page crashes",
    details: [
      "Centered card with title 'We hit an unexpected snag'",
      "Body explains engineering has been notified automatically",
      "Actions: Go back (primary) and Return home",
      "Reference ID shown for support traceability",
    ],
    whatYouCanDo: [
      "Click Go back to return to the previous page",
      "Click Return home to land on the dashboard",
      "Share the Reference ID with support for fast triage",
    ],
    fieldsActions: [
      "Go back — browser history.back()",
      "Return home — navigates to /dashboard",
      "Reference ID — correlates to the server-side error log",
    ],
  },
];

SHOTS["workflow"] = [
  {
    src: "/docs-screenshots/workflow-builder-overview.png",
    caption: "Workflow Builder — three-pane layout (Node Palette / Canvas / Toolbar)",
    details: [
      "Top-left: version badge (Active v1) + version history clock icon",
      "Top-right toolbar: Build with AI, Debug (bug), Duplicate, Export, Import, Save, Edit, Stop",
      "Left palette: Triggers (6), Entities (5), Actions (8), Conditions, Integrations — searchable",
      "Canvas: React-Flow nodes (Triggers in orange, Conditions in yellow, Actions in green/blue) with smart edges and add-button mid-flow insertion",
      "Pre-built default business workflow: Offer Accepted → Create Sale → Sale In Progress → Has Service Items? → Create Service Order → Create Dispatches → status-change branches → Sale Closed → Invoiced",
      "Bottom-left: zoom controls, fit-to-view, fullscreen; bottom-right: mini-map",
    ],
    whatYouCanDo: [
      "Drag any palette item onto the canvas to add a node; the canvas auto-snaps and shows ghost-edges to suggest the next valid connection",
      "Click any node to open the right-side Inspector panel and configure its parameters (entity, fields, expressions, retries, timeout)",
      "Click the small + button on an edge to insert a new node mid-flow without rewiring manually",
      "Right-click a node for the context menu: Duplicate, Disable, Delete, Convert to Subflow, Copy as JSON",
      "Hold Shift and drag to box-select multiple nodes; align/distribute them with the floating mini-toolbar",
      "Use the Group action to wrap a selection in a labeled container (collapse/expand for readability)",
      "Hit Run / Debug to dry-run the workflow with a sample payload — each node animates green/red based on outcome",
      "Export the workflow to JSON for source control or to share with another tenant; Import restores it",
      "Toggle Active to publish; only the Active version reacts to live triggers — Drafts can be tested via Debug",
    ],
    fieldsActions: [
      "Trigger nodes — Webhook (signed URL + HMAC secret), Cron (cron expression + timezone), Status-change (entity + from/to status), Entity-created, Entity-updated, Manual (run now)",
      "Entity nodes — Offer, Sale, Service Order, Dispatch, Contact: pick the record by ID, query, or 'current entity from trigger'",
      "Action nodes — Create Sale, Create Service Order, Create Dispatches, Update Status, Send Email, Send SMS, Generate PDF, Call HTTP",
      "Condition nodes — IF (expression builder: ==, !=, >, <, contains, in, between), Has Service Items?, Switch (multi-branch on a field value)",
      "Flow control — Loop (forEach over array, max iterations), Parallel (fan-out N branches, join modes: any/all/race), Try/Catch (error branch), Wait (delay or until-date), Approval (assignee + timeout fallback)",
      "Toolbar buttons — Build with AI (opens prompt panel), Debug (live SignalR run), Duplicate (clone workflow), Export (.json), Import (.json), Save (bump version), Edit (unlock canvas), Stop (deactivate)",
      "Per-node settings — Name, Description, Retry policy (count + backoff), Timeout (ms), On error (continue/stop/branch), Output mapping (alias key), Tags",
    ],
  },
  {
    src: "/docs-screenshots/workflow-ai-builder.png",
    caption: "Build with AI — natural-language to graph",
    details: [
      "4 starter prompts: confirmed-sale email, offer follow-up after 3 days, dispatch-completed customer update, daily 9am summary",
      "Free-text 'Describe your workflow…' input with send button",
      "Reset clears the conversation; Apply to Canvas commits the generated nodes/edges in one click",
    ],
    whatYouCanDo: [
      "Type plain English (or French) describing the automation you want — the AI returns a complete graph proposal",
      "Click any starter prompt chip to seed the conversation with a proven template",
      "Iterate conversationally: 'add an SMS step after the email', 'only run on weekdays', 'wait 2 days between steps'",
      "Preview the proposed nodes/edges in a side panel before committing — nothing touches the live canvas until Apply",
      "Reset wipes the chat history if you want to start a new design from scratch",
      "Apply to Canvas merges the generated nodes into the current draft (Edit mode required to save)",
    ],
    fieldsActions: [
      "Prompt input — multiline text, supports @mentions of entities (@offer, @sale, @dispatch) for stronger grounding",
      "Send (paper-plane) — submits the prompt to the AI Gateway (Lovable AI) and streams back the JSON graph",
      "Starter prompts — 'Send email when sale confirmed', 'Follow up offer after 3 days', 'Notify customer when dispatch finished', 'Daily 9am business summary'",
      "Reset — clears chat + draft proposal",
      "Apply to Canvas — commits proposed nodes; auto-positions them and connects to the existing trigger if compatible",
      "Model — backed by Lovable AI Gateway (gemini-2.5-flash by default); no API key needed",
    ],
  },
  {
    src: "/docs-screenshots/workflow-edit-mode.png",
    caption: "Edit mode — protected canvas with explicit Save / Cancel",
    details: [
      "Yellow 'Editing' badge replaces the 'Build with AI' label while edit mode is on",
      "Cancel discards changes (with unsaved-changes guard); Save bumps the workflow version",
      "Drag nodes, rewire edges, delete with Backspace, duplicate with Cmd/Ctrl+D — all gated behind Edit",
    ],
    whatYouCanDo: [
      "Toggle Edit to unlock the canvas — by default it is read-only to prevent accidental changes on production workflows",
      "Drag nodes anywhere on the canvas; positions are persisted with the version",
      "Rewire edges by grabbing a handle and dropping on another node's input port",
      "Delete selected nodes with Backspace / Delete; orphan edges are auto-cleaned",
      "Duplicate a selection with Cmd/Ctrl+D (preserves all node settings including credentials)",
      "Cancel rolls back to the last saved snapshot — a confirm dialog warns about unsaved changes",
      "Save creates a new version (auto-incremented), keeps the previous version for restore, and refreshes the active runtime",
    ],
    fieldsActions: [
      "Edit button — unlocks node drag, edge rewire, delete, paste, group/ungroup",
      "Editing badge — yellow pill in the top-left replacing the Active badge while in edit mode",
      "Save — POST /api/workflows/:id/versions, increments version number, marks new version as Draft (or Active if 'auto-publish on save' is on)",
      "Cancel — discards local React-Flow state and re-fetches the last persisted version",
      "Keyboard — Backspace/Delete (remove), Cmd/Ctrl+D (duplicate), Cmd/Ctrl+Z (undo), Cmd/Ctrl+Shift+Z (redo), Cmd/Ctrl+A (select all)",
      "Unsaved-changes guard — beforeunload listener + in-app confirm dialog blocks navigation away with pending edits",
    ],
  },
  {
    src: "/docs-screenshots/workflow-version-history.png",
    caption: "Version History popover — restore, compare, fork prior versions",
    details: [
      "Lists every saved version with author, date, status (active/draft/archived) and short diff summary",
      "Restore promotes an old version to active; Compare opens a side-by-side graph diff",
    ],
    whatYouCanDo: [
      "Browse the full chronological version list of a workflow without leaving the builder",
      "Click a version row to preview its graph in a read-only side pane",
      "Restore an old version — it becomes the new Active version (the previous Active is auto-archived, never destroyed)",
      "Compare two versions side-by-side — added nodes are green, removed red, changed yellow",
      "Fork a version into a fresh Draft to experiment without touching production",
      "Filter the list by author, status, or date range; search by version note",
    ],
    fieldsActions: [
      "Row fields — Version number, Author (avatar + name), Created at (relative + absolute on hover), Status badge (Active/Draft/Archived), Note (short commit message)",
      "Restore — POST /api/workflows/:id/versions/:versionId/restore, swaps Active pointer atomically",
      "Compare — opens diff modal: nodes added/removed/changed, edges added/removed, settings changed",
      "Fork — POST /api/workflows/:id/versions/:versionId/fork, creates a new Draft seeded from that version",
      "Archive / Unarchive — soft-hides old versions from the default list (still restorable)",
      "Backed by WorkflowVersion EF entity (workflowId, versionNumber, definition JSON, createdBy, createdAt, status, note)",
    ],
  },
  {
    src: "/docs-screenshots/workflow-calendar.png",
    caption: "Workflow Calendar — Mois / Semaine / Jour / Tableau of interventions",
    details: [
      "Period switcher (Mois / Semaine / Jour) + alternative table view (Vue tableau)",
      "Planifier intervention CTA opens the dispatch creation dialog pre-bound to the picked slot",
      "Drag-and-drop reschedule; conflict highlighting; intelligent planning hints (Planification intelligente)",
    ],
    whatYouCanDo: [
      "Switch between Month, Week, Day, and Table views to plan at the right granularity",
      "Click any empty slot to open 'Planifier intervention' pre-filled with date + time",
      "Drag an existing intervention card to a new slot to reschedule (PATCH /api/dispatches/:id with new scheduledAt)",
      "Resize a card on Week/Day views to change its duration",
      "See conflict bands (red) when two interventions overlap for the same technician",
      "Filter by technician, status, customer, or service-order tag",
      "Use Planification intelligente to auto-suggest the next available slot per technician (skill + travel-time aware)",
      "Export the visible range as iCal (.ics) for external calendars",
    ],
    fieldsActions: [
      "View modes — Mois (month grid), Semaine (week grid w/ hours), Jour (day timeline w/ hours per technician), Tableau (sortable list)",
      "Card fields — Title, Customer, Address, Technician (avatar), Status color, Start/End time, Linked Service Order",
      "Planifier intervention — Customer, Site address (map pin), Service order link, Technician, Start/End, Notes, Required articles",
      "Drag-drop — updates scheduledAt + endsAt; auto-checks technician availability; shows conflict modal if overlap",
      "Filters — Technician (multi), Status (Scheduled/En route/In progress/Finished/Cancelled), Customer search, Tag",
      "Smart planning — calls /api/dispatches/suggest-slot with skill set + service location + duration",
    ],
  },
  {
    src: "/docs-screenshots/workflow-dispatch-board.png",
    caption: "Dispatch Board — Kanban by status with Calendar / Map views",
    details: [
      "Columns: Scheduled, En route, In progress, Finished, Cancelled — drag a card to change status (writes to /api/dispatches)",
      "Inventory search filters cards by linked article/service; Calendar view & Map view (Mapbox/Leaflet) toggles in the toolbar",
      "+ New dispatch opens the creation dialog (technician, date, address, contact, service order link)",
    ],
    whatYouCanDo: [
      "Drag a dispatch card between columns to advance or roll back its status (status transitions are workflow-aware and may trigger automations)",
      "Click a card to open the dispatch detail drawer (Overview, Jobs, Time & Expenses, Documents)",
      "Toggle to Calendar view to see the same cards on a time grid",
      "Toggle to Map view (Mapbox/Leaflet) to see dispatch pins by site address; click a pin to open the card",
      "Search by inventory article/service to filter only dispatches consuming that item",
      "Bulk-assign a technician by selecting multiple cards and choosing 'Assign technician'",
      "Create a new dispatch in one click; the form is pre-filled if you opened it from a service order",
    ],
    fieldsActions: [
      "Columns (Kanban) — Scheduled, En route, In progress, Finished, Cancelled (each shows count + total estimated duration)",
      "Card fields — Customer, Site, Technician, Scheduled date/time, Status pill, Linked SO ref, Articles count badge",
      "Toolbar — View toggles (Kanban / Calendar / Map), Inventory search, Technician filter, Date range, + New dispatch",
      "+ New dispatch fields — Customer (autocomplete), Site address (map pick), Contact, Service Order (autocomplete), Technician, Scheduled start/end, Required articles, Notes, Attachments",
      "Drag-drop status change — PATCH /api/dispatches/:id { status }; emits dispatch.status-changed which workflow triggers can subscribe to",
      "Map view — Mapbox tiles with Leaflet markers, marker color = status; popup shows mini-card + 'Open' link",
    ],
  },
  {
    src: "/docs-screenshots/workflow-canvas-loaded.png",
    caption: "Live canvas — full default business workflow rendered with palette open",
    details: [
      "Sidebar palette open with Triggers (6), Entities (5), Actions (8) visible",
      "Canvas shows the full pre-built business graph: Offer Accepted (orange) → Create Sale (green) → Sale In Progress → Has Service Items? (yellow condition) → Create Service Order / Create Dispatches → status-change rules → Sale Closed → Invoiced",
      "Each node displays its type chip, FROM/TO statuses, auto-create flag and a 1-line summary",
    ],
    whatYouCanDo: [
      "Inspect every node in the canonical 'order-to-cash + service' flow at a glance",
      "Use it as a reference template — Duplicate then tweak per tenant",
      "Hover any node to highlight its incoming/outgoing edges and impacted entities",
    ],
    fieldsActions: [
      "Triggers visible — Offer Status Change, Sale Status Change, Service Order Status Change, Dispatch Status Change, Webhook, Scheduled",
      "Entities visible — Create Offer, Sale, Service Order, Dispatch, New Contact",
      "Actions visible (top of list) — Create Offer, Create Sale, Create Service Order, Create Dispatch, Update Offer/Sale/Service Order/Dispatch Status",
      "Conditions on canvas — 'Has Service Items?' and 'All Dispatches Completed?' (yellow) with YES/NO branches",
      "Status rules on canvas — Service Order → In Progress, Ready for Planning, Technically Completed, Partially Completed, Invoiced",
    ],
  },
  {
    src: "/docs-screenshots/workflow-ai-builder-modal.png",
    caption: "Build with AI — full modal with 4 starter prompts and free-text input",
    details: [
      "Header 'Build with AI' with branded hex icon",
      "4 starter cards: confirmed-sale email, 3-day offer follow-up, dispatch-completed customer update, daily 9am summary",
      "Free-text textarea + send (paper-plane) button; Reset and Apply to Canvas footer actions",
    ],
    whatYouCanDo: [
      "Generate a complete graph from one English (or French) sentence",
      "Pick a starter card to seed the conversation, then refine ('add SMS', 'only weekdays')",
      "Apply to Canvas merges generated nodes — nothing is committed until you click Save",
    ],
    fieldsActions: [
      "Starter prompt 1 — When a sale is confirmed, send an email to the client and notify the sales manager",
      "Starter prompt 2 — 3 days after sending an offer, check if it's accepted — if not, send a follow-up email",
      "Starter prompt 3 — When a dispatch is completed, update the service order status and notify the customer",
      "Starter prompt 4 — Every day at 9am, read all pending dispatches and send a summary notification to the team",
      "Send (paper-plane) → POST to AI Gateway, streams a node/edge JSON proposal",
      "Reset → clears chat; Apply to Canvas → commits proposal to draft",
    ],
  },
  {
    src: "/docs-screenshots/workflow-version-tooltip.png",
    caption: "Version History tooltip on the version-clock icon",
    details: [
      "Hovering the small clock next to the Active v1 badge surfaces a tooltip: 'Version History — Current Workflow'",
      "Click opens the full version history popover (restore / compare / fork)",
    ],
    whatYouCanDo: [
      "Discover the version history entry without opening it",
      "Confirm which workflow you are currently viewing before navigating its versions",
    ],
    fieldsActions: [
      "Tooltip header — 'Version History'",
      "Tooltip subtitle — 'Current Workflow' (workflow name resolves dynamically)",
      "Trigger — clock icon button next to the Active version badge",
    ],
  },
  {
    src: "/docs-screenshots/workflow-palette-full.png",
    caption: "Node palette — Conditions, Communication, AI and Integration categories",
    details: [
      "Conditions (3) — If / Else, Switch, Loop",
      "Communication (6) — Send Notification, Email, Request Approval, Delay, Human Input Form, Wait for Event",
      "AI (4) — AI Email, AI Analyzer, AI Agent, Custom LLM",
      "Integration (4) — Dynamic Form, Data Transfer, HTTP Request, Code (JavaScript)",
    ],
    whatYouCanDo: [
      "Add control-flow logic with If/Else, Switch (multi-branch), and Loop (forEach)",
      "Communicate with humans: Email, in-app notification, approval request, scheduled delay, ad-hoc Human Input Form, or Wait for Event (resume on external signal)",
      "Inject AI: send AI-composed emails, run AI Analyzer over entity data, spawn an AI Agent, or call a Custom LLM endpoint",
      "Integrate anything: render a Dynamic Form, transfer data between entities, call an HTTP API, or run arbitrary JavaScript",
    ],
    fieldsActions: [
      "If / Else — expression builder (==, !=, >, <, contains, in, between), TRUE/FALSE branches",
      "Switch — switch on a field value with N case branches + default",
      "Loop — forEach over an array with maxIterations and breakOnError settings",
      "Send Notification — recipient (user/role/owner), title, body, channel (in-app / email / sms)",
      "Email — to/cc/bcc, subject, HTML body (templated with {{entity.*}}), attachments",
      "Request Approval — assignee, timeout, on-timeout branch (auto-approve/reject/escalate)",
      "Delay — duration (ms / minutes / hours / days) or 'until date'",
      "Human Input Form — bind a Dynamic Form, route to assignee, resume with submitted answers",
      "Wait for Event — event name + correlation key, optional timeout",
      "AI Email — prompt, target entity context, model (Lovable AI Gateway), tone, language",
      "AI Analyzer — input fields, instruction prompt, output schema (JSON)",
      "AI Agent — tool list, max steps, system prompt, memory key",
      "Custom LLM — endpoint URL, auth header, model, request/response mapping",
      "Dynamic Form — pick a published form, prefill mapping, submission target",
      "Data Transfer — source entity → target entity, field-by-field mapping with transforms",
      "HTTP Request — method, URL, headers, body (JSON/form), retry, timeout, response mapping",
      "Code (JavaScript) — sandboxed JS, receives `input` + `ctx`, returns the next node payload",
    ],
  },
];


export const MODULES: ModuleDoc[] = [
  {
    key: "dashboard",
    name: "Dashboard",
    category: "Core",
    description:
      "The home screen every user lands on after login. It presents role-tuned built-in dashboards (Service, Sales, Field, HR, Finance, Executive) with KPI tiles, charts and a recent-activity feed, plus quick global filters (Target Company, owner, date range) that apply to every widget at once.",
    features: [
      "Built-in dashboards — Service (default), Sales, Field, HR, Finance and Executive, each tuned to its persona",
      "Dashboard switcher — top-bar dropdown to flip between the built-in dashboards; the choice is remembered per user",
      "Pin a dashboard — set any built-in dashboard as your default landing screen",
      "Time-range control — global range with comparison to the previous period",
      "Quick filters — Target Company, owner and date range applied to every KPI/chart at once",
      "KPI tiles and charts — click through to the underlying list (offers, sales, service orders, tasks, articles, events…)",
      "Recent activity — chronological feed of changes across modules with click-to-open",
      "Product tour — first-time users are walked through the sidebar, top bar and main KPI tiles",
      "Realtime — KPI tiles refresh automatically when the underlying entities change",
      "Mobile-friendly — responsive grid collapses to a single column on phones",
    ],
        routes: [
      { path: "/dashboard", label: "Home dashboard" },
    ],
  },
  {
    key: "contacts",
    name: "Contacts (CRM)",
    category: "CRM",
    description:
      "Unified directory of Persons, Companies and Suppliers. Each contact carries identity, fiscal IDs (CIN, Matricule Fiscale), address with geolocation, status and a 360° history (Installations, Offers, Sales, Service Orders, Purchases, Notes). Suppliers are first-class and have their own list at /dashboard/suppliers, while still appearing in the global Contacts directory.",
    features: [
      "Three contact types — Person (individual), Company (business/organization), Supplier (vendor)",
      "Contact identity — first/last name, email, phone, position, company, status (Active/Inactive)",
      "Tunisian fiscal fields — CIN (National ID) and Tax ID (Matricule Fiscale)",
      "Address with City + Country and an interactive geolocation map (click on map or Use My Location)",
      "List with KPIs (Total / Persons / Companies), full-text Search, advanced Filters and a Map view",
      "360° tabs on every contact — Overview, Installations, Offers, Sales, Service Orders, Purchases, Notes",
      "Inline Edit modal — change type (Person ↔ Company ↔ Supplier), update info, re-pick map location",
      "Bulk Import — Dynamic Import (any Excel headers, mapped to fields) or Structured Import (.xlsx / .xls)",
      "Dedicated Suppliers area — /dashboard/suppliers list, /dashboard/suppliers/add form, mirrors contact UX",
      "Multi-company aware — every contact is scoped to a Target Company (header company switcher)",
      "Quick actions — favorite (pin), edit, delete from the list rows",
    ],
        routes: [
      { path: "/dashboard/contacts", label: "Contacts list" },
      { path: "/dashboard/contacts/add", label: "Add contact" },
      { path: "/dashboard/contacts/:id", label: "Contact detail" },
      { path: "/dashboard/suppliers", label: "Suppliers list" },
      { path: "/dashboard/suppliers/add", label: "Add supplier" },
      { path: "/dashboard/suppliers/:id", label: "Supplier detail" },
    ],
  },
  {
    key: "offers",
    name: "Offers / Quotes",
    category: "Sales",
    description:
      "End-to-end commercial proposal workflow: build a multi-item offer (products + services), send it to the customer by email or PDF, track the customer's response through a configurable status flow, then convert won offers into Sales orders and/or Service Orders in one click. Multi-company aware (Target Company picker), localized in EN/FR with TND-default currency, plugin-gated (PL0005OFFERS).",
    features: [
      "List page (/dashboard/offers) — KPI tiles (Total / Draft / Sent / Accepted / Declined / value), full-text search, filter bar (Status, Assignee, Date range: any / 7d / 30d / 365d), three view modes (Table / Kanban / Map), bulk-select with bulk delete & bulk status change, sticky toolbar with + Create, Filters, Export, view-mode toggle and a Map toggle that geocodes the linked contact addresses",
      "Status workflow — Draft → Accepted or Declined (legacy 'sent', 'pending', 'negotiation' aliases preserved). Status changes confirmed in a dialog; terminal statuses are Accepted / Declined / Cancelled. Inline status flow stepper on the detail page",
      "Create / Edit (AddOffer / EditOffer) — Header (Title, Reference, Description, Validity date, Priority, Assignee, Currency, Tax type %/fixed), Customer block (Contact + Company picker with autocomplete and inline 'create new contact'), Items manager (catalog autocomplete or free-form line — qty, unit, unit price, discount %, tax %, item type Product/Service), automatic Subtotal HT / Discount / Tax breakdown / Fiscal stamp / Grand Total TTC, Notes, Internal notes, Attachments",
      "Detail page tabs — Overview (header, parties, totals, status flow, recent activity), Items (full lines manager), Notes (rich-text feed with author + timestamps), Checklists (per-offer todo lists with progress %), Documents (uploaded files + generated PDFs), Attachments",
      "Header actions — Send (email modal with templates, CC/BCC, attach PDF, signature image), PDF Preview & Download (react-pdf, branded, configurable PDF settings modal: logo, colors, footer, mentions), Edit, Convert (to Sale and/or Service Order, only items of type=service flow into the SO), Duplicate, Delete (soft, with confirmation)",
      "Convert modal — Pick targets (Convert to Sale, Convert to Service Order — disabled with explanation if the offer has no service items), shows what will be created (new Sale order, new Service Order with N service items), preserves contact/company link and copies attachments via entityFormDocumentsService",
      "PDF report page (/dashboard/offers/:id/report) — printable / shareable view with the offer's full breakdown, used for public sharing links (no app login required to open)",
      "Bulk export modal — pick columns by category (Basic / Contact / Financial / Timeline / Assignment / Details: id, title, status, priority, contactName, contactCompany, contactEmail, totalAmount, currency, taxes, taxType, discount, validUntil, assignedTo, createdAt, updatedAt, description, notes, itemsCount), CSV download",
      "Permissions — view/create/edit/delete are role-permission gated; Send is hidden unless status ∈ {draft, modified}; row actions adapt to the user's role in real time (permission broadcast)",
      "Multi-company — the Target Company picker scopes the list and 'View All' mode adds a Company column",
    ],
        routes: [
      { path: "/dashboard/offers", label: "Offers list" },
      { path: "/dashboard/offers/add", label: "New offer" },
      { path: "/dashboard/offers/:id", label: "Offer detail" },
      { path: "/dashboard/offers/:id/edit", label: "Edit offer" },
      { path: "/dashboard/offers/:id/report", label: "Offer report / printable" },
    ],
  },
  {
    key: "sales",
    name: "Sales / Invoices",
    category: "Sales",
    description:
      "Sales orders & invoices with full lifecycle: Created → In Progress → Invoiced (or Partially Invoiced) → Closed. Tracks payments per sale, generates branded PDF invoices, and can auto-create a Service Order when the sale moves to In Progress and contains service items. Plugin-gated (PL0002SALES), depends on Contacts.",
    features: [
      "List page (/dashboard/sales) — KPI tiles (Total sales, In Progress, Invoiced, Outstanding amount), search, filter bar (Status, Assignee, Date range), three view modes (List / Table / Kanban) with view persistence, bulk-select + bulk delete + bulk status, Export modal (CSV with column picker), + New Sale button (CreateActionGuard checks role permission)",
      "Status workflow — Created → In Progress → Invoiced → Closed (happy path), with branches In Progress → Partially Invoiced → Invoiced and Cancelled as terminal-negative. Aliases handled: draft/new_offer → created, sent/accepted/won → in_progress, completed → closed, lost → cancelled",
      "Auto-conversion to Service Order — when a Sale containing service items transitions to 'In Progress', a Service Order is created automatically (configurable via ServiceOrderConfigModal). For sales without auto-conversion, a manual 'Convert to Service Order' action is available; once converted, the Sale shows a banner with a deep link to the related Service Order (sale.convertedToServiceOrderId)",
      "FastAddSaleForm — a streamlined inline create form for quick invoicing (one-line item, contact, total, save) without leaving the list",
      "Create / Edit (AddSale / EditSale) — Header (Title, Reference, Issue date, Due date, Currency, Tax type), Contact selector (advanced multi-criteria), Items manager (catalog or free, qty/unit/price/discount/tax, item type Product/Service), totals (Subtotal HT / Discount / TVA breakdown / Fiscal stamp / Grand Total TTC), Notes, Attachments",
      "Detail page tabs — Overview, Items, Payments (record date/method/reference/amount, partial-payment support, outstanding balance), Notes, Checklists, Documents",
      "Header actions — Send Invoice (email modal with PDF attached), Download PDF (react-pdf, branded — PdfSettingsModalEnhanced lets you configure logo, color theme, footer, legal mentions, multi-page handling), Convert to Service Order (manual), View Service Order (when already converted), Edit, Delete",
      "Public/printable report (/dashboard/sales/:id/report) — public PDF view used for share-by-link",
      "Permissions — full RBAC matrix; the Convert button is conditionally shown when items contain service type and the sale is not already converted",
      "Multi-company — Target Company scope; 'View All' adds Company column",
    ],
        routes: [
      { path: "/dashboard/sales", label: "Sales list" },
      { path: "/dashboard/sales/add", label: "New sale" },
      { path: "/dashboard/sales/:id", label: "Sale detail" },
      { path: "/dashboard/sales/:id/edit", label: "Edit sale" },
      { path: "/dashboard/sales/:id/report", label: "Sale report / printable" },
      { path: "/dashboard/invoices", label: "Invoices list" },
    ],
  },
  {
    key: "deals",
    name: "Deals Pipeline",
    category: "Sales",
    description:
      "Visual sales-pipeline manager. Tracks opportunities through configurable stages (Prospect → Qualified → Proposal → Negotiation → Won / Lost) with weighted value forecasting, owner assignment, activity logging and conversion to Offers / Sales. Multi-company aware, RBAC-gated, with Kanban / Table / Forecast views.",
    features: [
      "Kanban board with drag-and-drop stages — drop a card to instantly transition the stage; optimistic UI with rollback on error",
      "Configurable stages per tenant — name, color, win-probability %, sort order; archived stages preserved for historical deals",
      "Deal card — title, contact + company, value (amount + currency), expected close date, owner, source, tags, last activity",
      "Deal detail tabs — Overview, Activities (calls/meetings/notes), Linked Offers/Sales/Contacts, Documents, Audit log",
      "Forecast view — weighted pipeline (sum of value × stage probability) by month, by owner, by stage; export CSV",
      "Quick actions — Convert to Offer, Convert to Sale, Mark Won/Lost (with reason picklist), Reassign owner",
      "Filters — owner, stage, source, tag, value range, expected-close range, contact/company text",
      "KPIs — Open deals, Total pipeline value, Weighted forecast, Won this month, Win rate %, Average sales cycle (days)",
      "Bulk actions — bulk reassign, bulk stage change, bulk delete, CSV export with column picker",
      "Permissions — view/create/edit/delete RBAC; owners-only mode optional (users see only their deals)",
      "Multi-company — Target Company scope; 'View All' adds Company column and aggregates KPIs across companies",
    ],
        routes: [
      { path: "/dashboard/deals", label: "Deals pipeline (kanban)" },
      { path: "/dashboard/deals/add", label: "New deal" },
      { path: "/dashboard/deals/:id", label: "Deal detail" },
      { path: "/dashboard/deals/:id/edit", label: "Edit deal" },
    ],
  },
  {
    key: "articles",
    name: "Articles & Catalog",
    category: "Inventory",
    description:
      "Product & service catalog — the single source of truth for any line item used in Offers, Sales, Purchases, Stock and Service Orders. Each article has identity, pricing, taxation, supplier links, stock thresholds, images and a reusable price-list system. Multi-company, plugin-gated, with bulk import/export.",
    features: [
      "Article identity — Name, Reference (SKU), Barcode (EAN/UPC), Category (tree), Brand, Unit of measure (UoM)",
      "Type — Product (stocked) / Service (non-stocked) / Bundle (composed of other articles with auto-rollup pricing)",
      "Pricing — Selling price HT, Cost price, Margin %, default Discount %, default VAT %, Fiscal stamp toggle",
      "Multi-currency price-lists — per-currency selling prices, per-customer-tier price overrides, validity windows",
      "Stock fields (Product) — Quantity on hand, Min stock (low-stock alert threshold), Max stock, Reorder point",
      "Suppliers — primary supplier + alternates, supplier reference, last purchase price, lead time (days)",
      "Media — multiple product images (drag-drop, reorder, set primary), datasheet PDF attachment",
      "Localization — translations of name + description per language (EN/FR), used in localized PDFs and the website builder",
      "List page — KPIs (Total / Products / Services / Low-stock / Inactive), search, filters (Category, Type, Status, Stock state), Table / Grid view, bulk-select",
      "Bulk operations — bulk delete, bulk category change, bulk activate/deactivate, CSV/Excel export, bulk import (.xlsx with column mapping)",
      "Audit fields — created by, created at, updated by, updated at, version, deleted-at (soft delete)",
      "Used by — Offers, Sales, Purchase Orders, Service Orders (line items autocomplete), Stock Management (movements)",
      "Permissions — view/create/edit/delete RBAC; deactivation preserves history without breaking past documents",
    ],
        routes: [
      { path: "/dashboard/articles", label: "Articles list" },
      { path: "/dashboard/articles/add", label: "New article" },
      { path: "/dashboard/articles/:id", label: "Article detail" },
      { path: "/dashboard/articles/:id/edit", label: "Edit article" },
    ],
  },
  {
    key: "inventory-services",
    name: "Inventory & Services",
    category: "Inventory",
    description:
      "Unified workspace that merges stocked Inventory items and non-stocked Services into one searchable list. Useful for sales reps and dispatchers who need to find anything bookable — be it a part on a shelf or a labor service — from one screen.",
    features: [
      "Unified list — articles + services in one table, type-toggle filter (All / Items / Services), search across name/SKU/barcode",
      "Quick-create — single 'Add' form that asks for type up-front then shows only the relevant fields (stock vs pricing)",
      "Inventory detail — stock movements timeline (in/out/adjust/transfer), current quantity per warehouse, valuation (FIFO/avg cost)",
      "Service detail — base price, billable unit (hour/day/fixed), default duration, technician skills required",
      "Catalog publishing — flag any item/service as 'Available on website builder' to expose it in public catalogs",
      "Bulk import — single .xlsx accepting both items and services with a 'type' column",
      "Cross-references — see which Offers/Sales/Service Orders use a given item/service",
    ],
        routes: [
      { path: "/dashboard/inventory-services", label: "Unified catalog (items + services)" },
      { path: "/dashboard/inventory-services/add-article", label: "Add item or service" },
      { path: "/dashboard/inventory-services/article/:id", label: "Catalog entry detail" },
      { path: "/dashboard/inventory-services/article/:id/edit", label: "Edit catalog entry" },
      { path: "/dashboard/inventory-services/inventory/:id", label: "Inventory item detail" },
      { path: "/dashboard/inventory-services/service/:id", label: "Service detail" },
    ],
  },
  {
    key: "stock-management",
    name: "Stock Management",
    category: "Inventory",
    description:
      "Multi-warehouse stock control. Tracks every movement (in/out/adjust/transfer/reserve), supports per-warehouse quantities, low-stock alerts, periodic stock-takes (inventory counts) and replenishment proposals based on min/max thresholds and supplier lead times.",
    features: [
      "Warehouses — multiple physical or logical locations per company, with addresses and per-warehouse default keepers",
      "Stock transactions log — date, type (Receipt / Issue / Adjustment / Transfer / Reservation / Return), source document (PO, SO, Sale), quantity, before/after balance, user",
      "Manual adjustment — single-line or bulk; reason picklist (Damage / Theft / Count diff / Found / Other) + free-text note",
      "Inter-warehouse transfer — pick source + destination, lines, optional in-transit holding location, two-step confirm (sent / received)",
      "Reservations — soft-reserve stock for an Offer/Sale/Service Order until confirmation; reservation expires on document cancel",
      "Stock takes — periodic count sheets (paper-friendly PDF), entry of counted vs system, automatic adjustment posting on validation",
      "Low-stock alerts — daily job compares quantity vs min stock, raises notifications and a list view of items needing reorder",
      "Replenishment proposal — auto-generates draft Purchase Orders from low-stock items, grouped by primary supplier",
      "Valuation — FIFO or weighted-average per article (configurable per company); valuation report at any point in time",
      "Reports — Stock on hand, Movements per period, Valuation, Slow movers (no movement in N days), Top consumers (article × customer)",
      "Permissions — RBAC for view/move/adjust; transfers and adjustments can require approval based on value threshold",
      "Audit trail — every movement immutable once posted; corrections done via reverse + repost",
    ],
        routes: [
      { path: "/dashboard/stock-management", label: "Stock management (movements, adjustments, warehouses in tabs)" },
    ],
  },
  {
    key: "purchases",
    name: "Purchases (Procure-to-Pay)",
    category: "Procurement",
    description:
      "End-to-end Procure-to-Pay (P2P) workflow tailored for the Tunisian fiscal context: Purchase Order → Goods Receipt → Supplier Invoice → Payment, with three-way matching, retenue à la source (RS), TEJ / Facture en Ligne compliance, and a full audit trail. Documents are versioned, exportable as PDF, and linked across the chain so any line can be traced from PO to invoice to payment.",
    features: [
      "Purchase Orders — multi-line items (article + supplier ref + qty + unit + unit price + discount + tax %), payment terms (Net 30 / 60 / 90 / On receipt / Custom), expected delivery, fiscal stamp, automatic subtotal/tax/grand-total recompute",
      "PO statuses — Draft → Pending Approval → Approved → Sent → Partially Received → Received → Closed → Cancelled",
      "Goods Receipts — full or partial reception against a PO, received-by user tracking, edit & soft-delete, automatic stock movement creation",
      "Supplier Invoices — link to PO + Receipt (3-way match), due date, payment status, retenue à la source (RS) computed automatically per Tunisian rates",
      "Compliance dashboard — RS yearly total, Facture en Ligne pending/sent/validated counts, TEJ integration sync status (synced / pending)",
      "Reports — Supplier Performance (on-time delivery, lead time, total spend), Price Evolution (per-supplier price changes over time), Supplier Invoice Aging (outstanding amounts grouped by overdue bucket), Monthly Spending in TND, Spending by Supplier",
      "Audit Log — every create / update / delete with user, timestamp, entity, action and human-readable description",
      "PDF export — POs, receipts and invoices are rendered with react-pdf using the company's branding & legal mentions",
      "Multi-company — every document is scoped to a Target Company, with the company picker in the header",
      "CSV export from list views, advanced filters and grid/list toggle",
    ],
        routes: [
      { path: "/dashboard/purchases/orders", label: "Purchase orders list" },
      { path: "/dashboard/purchases/orders/add", label: "New purchase order" },
      { path: "/dashboard/purchases/orders/:id", label: "Purchase order detail" },
      { path: "/dashboard/purchases/orders/:id/report", label: "Purchase order report / printable" },
      { path: "/dashboard/purchases/receipts", label: "Goods receipts list" },
      { path: "/dashboard/purchases/receipts/add", label: "New goods receipt" },
      { path: "/dashboard/purchases/receipts/:id", label: "Goods receipt detail" },
      { path: "/dashboard/purchases/receipts/:id/edit", label: "Edit goods receipt" },
      { path: "/dashboard/purchases/receipts/:id/report", label: "Goods receipt report" },
      { path: "/dashboard/purchases/invoices", label: "Supplier invoices list" },
      { path: "/dashboard/purchases/invoices/add", label: "New supplier invoice" },
      { path: "/dashboard/purchases/invoices/:id", label: "Supplier invoice detail" },
      { path: "/dashboard/purchases/invoices/:id/report", label: "Supplier invoice report" },
      { path: "/dashboard/purchases/compliance", label: "Compliance dashboard" },
      { path: "/dashboard/purchases/audit-log", label: "Audit log" },
      { path: "/dashboard/purchases/reports", label: "Purchase reports" },
      { path: "/dashboard/purchases/reports/supplier-performance", label: "Supplier performance report" },
      { path: "/dashboard/purchases/reports/price-evolution", label: "Price evolution report" },
      { path: "/dashboard/purchases/reports/aging", label: "Aging report" },
    ],
  },
  {
    key: "hr",
    name: "Human Resources (HR)",
    category: "HR",
    description:
      "Complete HR suite tuned for Tunisian payroll law (CNSS, CSS, IRPP, abattements). Manages the full employee lifecycle — Recruitment → Hire → Attendance → Leaves → Payroll → Bonuses/Deductions → CNSS declaration → Performance review — with multi-tab employee files, monthly payroll runs in TND, configurable rate history, and CSV/Excel exports for accounting and CNSS submissions.",
    features: [
      "Employee directory — Profile, Salary, CNSS, Bonuses, Leaves, Documents tabs per employee, with payroll-readiness segmentation on the list",
      "Attendance — Daily check-in / check-out / break entries, status (present / absent / late / remote), List & Matrix views, Add Entry modal",
      "Leaves — request workflow with calendar view, list, balances per leave type, manager approvals, conflict detection on team calendar",
      "Payroll runs — generate a draft for the period from Employees + Attendance + Leaves, recompute CNSS (employee + employer share), CSS, IRPP using progressive monthly brackets and abattements (head of family, per child), confirm to lock, mark paid, export PDF payslip per employee",
      "Bonuses & Deductions — typed entries (Bonus / Allowance / Deduction / Reimbursement), period-bound, with running totals (Bonuses, Deductions, Net) reflected in payroll",
      "CNSS — configurable employee/employer rates with effective date, full rate history, monthly declaration table per CNSS number, CSV export ready for the CNSS portal",
      "Departments — manage org structure, codes, employee counts, plus an Org Chart view",
      "Performance Management — Goals (per employee, weighted, with progress %), Review Cycles, Reviews, status tracking",
      "Recruitment — Job openings, Applicants, Interviews, pipeline (Applied → Screening → Interview → Offer → Hired / Rejected), KPIs",
      "Reports — Employee cost (Gross + Bonuses − Deductions + Employer CNSS = Total cost / YTD), Payroll, CNSS, Absences with CSV + Excel export",
      "HR Settings — CNSS rates history, Public holidays calendar, General config (currency TND, locale fr-TN, fiscal year)",
      "Localization — French (Tunisia) labels, TND formatting (3 decimals), Arabic-friendly fonts in payslips",
    ],
        routes: [
      { path: "/dashboard/hr/employees", label: "Employees list" },
      { path: "/dashboard/hr/employees/:id", label: "Employee detail" },
      { path: "/dashboard/hr/departments", label: "Departments" },
      { path: "/dashboard/hr/attendance", label: "Attendance" },
      { path: "/dashboard/hr/leaves", label: "Leaves / absences" },
      { path: "/dashboard/hr/payroll", label: "Payroll" },
      { path: "/dashboard/hr/bonuses", label: "Bonuses" },
      { path: "/dashboard/hr/cnss", label: "CNSS (social security)" },
      { path: "/dashboard/hr/performance", label: "Performance" },
      { path: "/dashboard/hr/recruitment", label: "Recruitment" },
      { path: "/dashboard/hr/reports", label: "HR reports" },
      { path: "/dashboard/hr/settings", label: "HR settings" },
    ],
  },

  {
    key: "field",
    name: "Field Service",
    category: "Operations",
    description:
      "Operational hub for on-site work — Service Orders, Dispatches, Installations, Field Inventory, and Time & Expenses. Combines a planning board (Dispatcher), a technician-friendly mobile UI, and rich reporting. Bridges Sales (auto-creating Service Orders from Sales) and HR (technician skills, time entries flowing into payroll).",
    features: [
      "Field dashboard — KPIs (Open SOs, Today's dispatches, Technicians on duty, On-time arrival %), live map and shortcut tiles",
      "Service Orders lifecycle — Pending → Ready for Planning → Scheduled → In Progress → Technically Completed → Ready for Invoice → Invoiced → Closed (see Service Orders module for the full spec)",
      "Dispatches — atomic technician assignments tied to a Service Order: date/time, technician, address, scheduled vs actual, status (planned/confirmed/in_progress/completed/cancelled), driving directions, signature on arrival/departure",
      "Dispatcher Board — drag-and-drop calendar grid (rows = technicians, columns = time slots) with conflict detection, skill match indicator and unassigned-jobs backlog",
      "Map view — Mapbox / Leaflet with technician live-pins (when mobile app reports GPS) and dispatch markers color-coded by status",
      "Installations registry — physical equipment installed at customer sites: serial number, install date, warranty end, last-service date, linked Service Orders",
      "Field Inventory — what each technician has in their van (truck stock); auto-decrements when materials are used on a Service Order, with replenishment requests",
      "Time & Expenses — billable/non-billable hours per Service Order, expense entry with receipt photo, approval workflow, feed into payroll & invoicing",
      "Mobile-friendly views — lightweight technician UI: My Dispatches today, swipe-to-start/finish, capture customer signature, upload photos, log materials",
      "Field documents — site photos, signed delivery notes, certificates of conformity per Service Order; bulk download as ZIP",
      "Field reports — Technician productivity, First-time fix rate, Average travel/onsite time, Cost per dispatch, SLA breaches",
      "Plugin-gated (PL0015FIELD); RBAC; multi-company aware",
    ],
        routes: [
      { path: "/dashboard/field/dashboard", label: "Field dashboard" },
      { path: "/dashboard/field/service-orders", label: "Service orders" },
      { path: "/dashboard/field/dispatches", label: "Dispatches" },
      { path: "/dashboard/field/dispatcher", label: "Dispatcher console" },
      { path: "/dashboard/field/installations", label: "Installations" },
      { path: "/dashboard/field/inventory", label: "Field inventory" },
      { path: "/dashboard/field/time-expenses", label: "Time & expenses" },
      { path: "/dashboard/field/documents", label: "Field documents" },
      { path: "/dashboard/field/reports", label: "Field reports" },
    ],
  },
  {
    key: "tasks",
    name: "Tasks",
    category: "Productivity",
    description:
      "Lightweight task tracker for individuals and teams. Tasks can be standalone or attached to any entity (Contact, Offer, Sale, Service Order, Project). Supports checklists, time tracking, recurring tasks, reminders and a Today / Upcoming / Overdue inbox.",
    features: [
      "Task fields — Title, Description (rich text), Priority (Low/Medium/High/Urgent), Status (To do/In progress/Blocked/Done/Cancelled), Due date, Reminder, Assignee(s), Tags",
      "Checklists — sub-items with completion %, drag-to-reorder, convert any item into a sub-task",
      "Time entries — start/stop timer or manual entry; total time per task; feeds Field Time & Expenses where relevant",
      "Linked entity — attach the task to a Contact / Offer / Sale / Service Order / Project; opens the related card in one click",
      "Recurring tasks — daily/weekly/monthly/custom CRON; auto-generates the next instance on completion",
      "Views — My Tasks (Today / Upcoming / Overdue), List, Kanban (by status), Calendar; saved-views per user",
      "Filtering & search — by assignee, priority, due window, tag, linked entity, free text",
      "Notifications — assignment, due-soon, overdue, comment-mention",
      "Comments — per-task discussion thread with @mentions, attachments and notification fan-out",
      "Bulk actions — bulk assign, bulk status change, bulk delete, CSV export",
    ],
        routes: [
      { path: "/dashboard/tasks", label: "Tasks (redirects to Projects)" },
      { path: "/dashboard/tasks/daily", label: "Daily tasks" },
      { path: "/dashboard/tasks/projects", label: "Projects list" },
      { path: "/dashboard/tasks/projects/:projectId", label: "Project tasks board" },
    ],
  },
  {
    key: "calendar",
    name: "Calendar",
    category: "Productivity",
    description:
      "Unified calendar that overlays internal events (meetings, reminders), Tasks with due dates, HR Leaves, Field Dispatches and synced external calendars (Google / Microsoft). Color-coded per source, with conflict detection, drag-to-reschedule and a printable agenda.",
    features: [
      "Views — Month / Week / Work-week / Day / Agenda; week start configurable per user",
      "Event sources — Internal events, Tasks, HR Leaves, Field Dispatches, External (Google/MS) — toggle visibility per source",
      "Color coding — per source and per category, with a legend in the toolbar",
      "Drag to reschedule — drag-and-drop to move/resize an event; writes back to the originating module",
      "Conflict detection — overlap warnings for the same user/technician with one-click resolution",
      "Create event — quick popover (title, when, attendees, location) or full editor (description, recurrence, reminders, attachments)",
      "Recurring events — RRULE-compliant (daily/weekly/monthly/yearly + custom by-day, by-month-day)",
      "Attendees — add internal users + external email addresses; sends invitation .ics on save",
      "Reminders — in-app + email N minutes before; per-event override of the default",
      "iCal feed — read-only public-token URL that any calendar app can subscribe to",
      "Multi-tenant — all calendar data scoped per company",
    ],
        routes: [
      { path: "/dashboard/calendar", label: "Calendar" },
    ],
  },
  {
    key: "email-calendar",
    name: "Email & Calendar Sync",
    category: "Productivity",
    description:
      "Two-way sync of email and calendar with external providers (Google Workspace, Microsoft 365, generic IMAP/SMTP, CalDAV). Surface customer threads next to their CRM record, log calls/meetings automatically, and let users reply from inside the app.",
    features: [
      "Account types — Google OAuth, Microsoft OAuth, IMAP/SMTP (custom server), Exchange Web Services (EWS)",
      "Multiple accounts per user — primary + aliases, each with its own signature and color",
      "Inbox view — folders (Inbox/Sent/Drafts/Archive/Custom), unread count, labels/categories, star, snooze",
      "Compose — rich-text editor with templates, attachments, signature picker, send-later, request-read-receipt",
      "Threading — full conversation view; show attachments stripped to the side",
      "Auto-link to CRM — incoming/outgoing messages from a known contact email auto-attach to that contact's 360° history",
      "Calendar sync — bi-directional (events created in app appear in Google/MS and vice-versa), with conflict policy (server-wins / app-wins)",
      "Send-as — send from any connected alias; reply from the address the message was sent to",
      "Search — full-text across body + headers + attachments (text/PDF)",
      "Templates — saved email bodies with merge fields ({{contact.firstName}}, {{offer.total}}…)",
      "Notifications — desktop notification on new mail in selected folders; mute per-thread",
      "Privacy — per-account toggle to keep emails local-only (not shared with the team)",
    ],
        routes: [
      { path: "/dashboard/email-calendar/emails", label: "Emails inbox" },
      { path: "/dashboard/email-calendar/calendar", label: "Synced calendar" },
    ],
  },
  {
    key: "projects",
    name: "Projects",
    category: "Productivity",
    description:
      "Lightweight project management for client engagements. Each project bundles tasks, time entries, documents, milestones and a budget; can roll up into Sales for time-and-materials invoicing.",
    features: [
      "Project header — Name, Code, Customer (Contact + Company), Type, Status, Owner, Start/End dates, Budget (hours + amount)",
      "Milestones — named checkpoints with target date, completion status, and weighted progress %",
      "Tasks — full Tasks module embedded; tasks created here belong to the project and roll up time",
      "Time tracking — total logged hours, vs budget burn-down chart, per-resource breakdown",
      "Documents — per-project file repository (drag-and-drop upload, versioning, share link)",
      "Notes & activity log — chronological feed of changes and discussion threads",
      "Linked records — Contacts, Sales, Offers, Service Orders attached for cross-navigation",
      "Status & type lookups — configurable from the Lookups module",
      "Reports — project profitability (revenue − cost from logged hours × cost rate − expenses), on-time delivery, milestone slip",
    ],
        routes: [
      { path: "/dashboard/tasks/projects", label: "Projects list" },
      { path: "/dashboard/tasks/projects/:projectId", label: "Project tasks board" },
    ],
  },
  {
    key: "communication",
    name: "Communication",
    category: "Productivity",
    description:
      "Outbound messaging hub: newsletters, drip campaigns, transactional templates, per-contact thread history (email + SMS). Built on top of the connected email accounts and an SMS provider (Twilio/Vonage). GDPR-aware with per-contact consent tracking.",
    features: [
      "Newsletter lists — create lists, import/export subscribers (.csv), double-opt-in, unsubscribe link, segmentation by tag/source",
      "Campaigns — design (drag-and-drop blocks or HTML), schedule, A/B subject testing, send to one or many lists, track open/click/bounce/unsubscribe",
      "Drip / sequences — multi-step automation with delays and conditions (opened? clicked? replied?), pausable",
      "Templates — reusable transactional templates (offer-sent, sale-paid, dispatch-on-the-way…) used by other modules",
      "SMS — single send + bulk; Twilio / Vonage / Infobip providers; cost preview per send",
      "Per-contact threads — unified email + SMS history on the contact 360° view",
      "Consent management — per-contact opt-in/opt-out timestamp, source, GDPR export & forget",
      "Unsubscribe page — branded public page with the unsubscribe token URL",
      "Reports — per-campaign engagement, list growth, top-clicked links, contact heatmap",
    ],
        routes: [
      { path: "/dashboard/communication", label: "Communication (campaigns, lists, templates)" },
    ],
  },
  {
    key: "documents",
    name: "Documents",
    category: "Productivity",
    description:
      "Centralized document repository linked to any business entity. Versioned uploads, in-browser preview (PDF/Office/images), e-signature requests, smart compression, full-text search, folder hierarchy, share links and audit trail.",
    features: [
      "Folders — tree structure with permissions per folder (view/upload/delete by role)",
      "Upload — drag-and-drop multi-file, paste from clipboard, mobile camera capture; auto-extracts text for OCR/search",
      "Versioning — every re-upload bumps the version; restore any prior version; per-version comments",
      "Preview — in-browser PDF, Word, Excel, PowerPoint, images, video; download original",
      "Smart compression — large PDF/JPG re-encoded server-side (configurable quality) to save storage",
      "E-signature — request signature from internal user or external email; signed copy auto-stored with audit trail (signer, IP, timestamp, hash)",
      "Resource linking — attach a document to a Contact, Offer, Sale, Service Order, Employee, Project, etc. — appears on that record's Documents tab",
      "Share links — generate a public/expiring token URL with optional password; revoke at any time",
      "Full-text search — across filename, OCR text, and metadata (tags, author, linked entity)",
      "Tags & metadata — custom tags, expiration date (alerts when approaching), confidentiality level",
      "Bulk actions — bulk download as ZIP, bulk move, bulk tag, bulk delete, bulk re-compress",
      "Audit log — view/download/sign/delete events with user + timestamp",
    ],
        routes: [
      { path: "/dashboard/documents", label: "Documents" },
    ],
  },
  {
    key: "workflow",
    name: "Workflow",
    category: "Operations",
    description:
      "Visual no-code/low-code automation engine (n8n / React-Flow style). Design end-to-end business processes — offers → sales → service orders → dispatches — wire entity Triggers to Actions through Conditions, Loops, Switches, Parallel branches and Try/Catch. Includes an AI workflow builder, live execution debugger, version history, groups, import/export, real-time SignalR streaming, plus operational views (Calendar, Dispatch Board) and per-entity flow detail pages. Plugin-gated (PL0031WORKFLOW), backed by the WorkflowEngine backend (4 controllers, 17 services, ~10K LOC).",
    features: [
      "Visual canvas — React-Flow-based builder with infinite pan/zoom, mini-map, fit-to-view, snap-to-grid, multi-select, copy/paste, duplicate, undo/redo and keyboard shortcuts",
      "Three-pane layout — left Node Palette (collapsible categories: Triggers, Entities, Actions, Conditions, Integrations), center canvas, right contextual Node Configuration panel",
      "Node palette — searchable catalog: Triggers (Offer/Sale/Service Order/Dispatch Status Change, Webhook, Scheduled/CRON), Entities (Create Offer/Sale/Service Order/Dispatch/Contact), Actions (Update Status, Send Email, Create entity, HTTP Request, Notify, Generate Document)",
      "Conditional nodes — If/Else, Switch (multi-branch), Loop (forEach/while/N-times), Parallel (fan-out/fan-in), Try/Catch (error handling with fallback branch)",
      "Edge toolbar — click an edge to insert a node mid-flow, swap, delete, or label it; smart auto-routing with the AddButtonEdge component",
      "Node Configuration modal & side panel — per-node settings: source/target status, entity field mapping, conditions DSL, retry policy, timeout, on-error branch, schedule (cron), payload preview",
      "Variable Picker — autocompletes context variables from previous nodes ({{trigger.entity.field}}, {{steps.<id>.output}}, {{user}}, {{tenant}}, {{now}}) inside any text/expression input",
      "Build with AI — natural-language prompt that generates a complete graph (nodes + edges + config) on the canvas, with 4 starter prompts (sale-confirmed email, offer follow-up after 3 days, dispatch-completed notification, daily 9am summary) and free-text input",
      "Quick Create Workflow — guided wizard for non-technical users to scaffold a workflow from a single trigger + 1–3 actions",
      "Edit mode — protected canvas: read-only by default; click Edit to enable drag/configure/delete, with explicit Save / Cancel and unsaved-changes guard",
      "Workflow versioning — every Save bumps the version (v1, v2, …) with status (active / draft / archived); badge in the toolbar shows current version + status",
      "Version History — clock icon opens the version timeline; restore, compare, or fork any prior version",
      "Activate / Stop — one-click enable/disable for the whole workflow with a confirmation dialog; only Active versions react to triggers",
      "Live execution debugger — bug icon opens the Execution Debug Panel that streams running steps via SignalR (useWorkflowSignalR), color-codes nodes (running / success / failed / skipped), shows input/output JSON per step and timing",
      "Workflow Debug Console — full-screen modal with execution log, request/response inspector, variable scope explorer, breakpoint toggles per node, replay-from-step",
      "Execution History — paginated list of every run with status, duration, trigger, entity link; click a row to open the debugger pre-loaded with that run's data",
      "Workflow Manager — table of all workflows: name, group, version, active/paused, last run, success rate, next scheduled run; bulk actions (activate, pause, duplicate, archive, export)",
      "Workflow Groups — organise workflows into folders/tags via the Groups Manager modal (create/rename/delete groups, drag-assign workflows)",
      "Workflow Filters — sidebar filters by group, status, trigger entity, owner, last-run window",
      "Stats widgets — counters for total / active / paused / failing workflows + 30-day execution success rate sparkline",
      "Import / Export — JSON export of full graph (nodes, edges, config, version, metadata); Import dialog with validation, dry-run, conflict resolution and preview before applying",
      "Pre-built templates — 8 ready-to-use JSON workflows: default-business-workflow, quote-convert-dispatch, lead-qualify-nurture, document-generation, inventory-reorder, support-sla-monitor, personalized-campaign, aggregation-insights",
      "Auto-reconciliation — periodic job (5-min countdown shown in the toolbar) that re-evaluates triggers against entities that may have been missed (offline edits, webhook drops); manual Reconcile-now button",
      "Notifications Center — bell badge surfaces failed runs, retried steps, approval requests; click to open the run in the debugger",
      "Webhook trigger — generates a unique signed URL per workflow; payload schema preview; signature verification (HMAC-SHA256) handled by /api/external-receive",
      "Scheduled trigger — CRON expression with human-readable preview, timezone selector, next 5 fire-times, pause window",
      "Status-change triggers — fire on FROM→TO transitions for Offer / Sale / Service Order / Dispatch (any-status wildcard supported); auto-bound to the entity statuses defined in entity-statuses.ts",
      "Entity actions — create/update Offer, Sale, Service Order, Dispatch, Contact with field-level mapping from trigger context; auto-create toggle persists the link back on the source entity",
      "Approval nodes — pause execution until a human approves/rejects via /api/workflow-approvals; configurable approver (user, role, or owner of entity)",
      "Workflow Calendar (/dashboard/workflow/calendar) — Mois / Semaine / Jour / Tableau views of all scheduled interventions and dispatches with drag-and-drop rescheduling and intelligent planning hints",
      "Dispatch Board (/dashboard/workflow/dispatch-board) — Kanban by status (Scheduled / En route / In progress / Finished / Cancelled), with Calendar view, Map view (Mapbox/Leaflet), inventory search, draggable dispatch cards (DraggableDispatchCard) and inline New dispatch creation",
      "Per-entity flow detail pages — /workflow/offers/:id, /workflow/sales/:id, /workflow/service-orders/:id render a focused step list (WorkflowStepList) showing where the entity sits in its lifecycle and which workflows have touched it",
      "Real-time updates — SignalR hub (useWorkflowSignalR) pushes node-state, run-completed and approval-requested events to all open builders; reconnects automatically",
      "Loading skeleton — WorkflowLoadingSkeleton renders during initial fetch to avoid layout flash on slow networks",
      "Plugin-gated — entire module wrapped in PluginGate code='PL0031WORKFLOW'; auto-disables routes & sidebar if the tenant disables the plugin",
      "Backend (WorkflowEngine, ~10K LOC) — 4 controllers (workflows, executions, approvals, reconciliation), 17 services, EF entities for Workflow / WorkflowVersion / WorkflowExecution / WorkflowStep / WorkflowApproval / WorkflowProcessedEntity; API surface: /api/workflows, /api/workflow-executions, /api/workflow-approvals, /api/workflow-reconciliation",
      "Migrations — 17_workflow_automation.sql + 18_workflow_processed_entities.sql (tenant-scoped, RLS-enforced, retry/idempotency tracking)",
    ],
        routes: [
      { path: "/dashboard/workflow/offers/:id", label: "Offer workflow view" },
      { path: "/dashboard/workflow/sales/:id", label: "Sale workflow view" },
      { path: "/dashboard/workflow/service-orders/:id", label: "Service-order workflow view" },
      { path: "/dashboard/workflow/dispatch-board", label: "Dispatch board" },
      { path: "/dashboard/workflow/calendar", label: "Workflow calendar" },
    ],
    screenshots: [
      {
        src: "/docs-screenshots/workflow-builder-overview.png",
        caption: "Workflow Builder — three-pane layout (Node Palette / Canvas / Toolbar)",
        details: [
          "Top-left: version badge (Active v1) + version history clock",
          "Top-right toolbar: Build with AI, Debug (bug), Duplicate, Export, Import, Save, Edit, Stop",
          "Left palette: Triggers (6), Entities (5), Actions (8), Conditions, Integrations — searchable",
          "Canvas: React-Flow nodes (Triggers in orange, Conditions in yellow, Actions in green/blue, color-coded by type) with smart edges and add-button mid-flow insertion",
          "Pre-built default business workflow shown: Offer Accepted → Create Sale → Sale In Progress → Has Service Items? → Create Service Order → Create Dispatches → status-change branches → Sale Closed → Invoiced",
          "Bottom-left: zoom controls, fit-to-view, fullscreen; bottom-right: mini-map",
        ],
      },
      {
        src: "/docs-screenshots/workflow-ai-builder.png",
        caption: "Build with AI — natural-language to graph",
        details: [
          "4 starter prompts: confirmed-sale email, offer follow-up after 3 days, dispatch-completed customer update, daily 9am summary",
          "Free-text 'Describe your workflow…' input with send button",
          "Reset clears the conversation; Apply to Canvas commits the generated nodes/edges with one click",
        ],
      },
      {
        src: "/docs-screenshots/workflow-edit-mode.png",
        caption: "Edit mode — protected canvas with explicit Save / Cancel",
        details: [
          "Yellow 'Editing' badge replaces the 'Build with AI' label while edit mode is on",
          "Cancel discards changes (with unsaved-changes guard); Save bumps the workflow version",
          "Drag nodes, rewire edges, delete with Backspace, duplicate with Cmd/Ctrl+D — all gated behind Edit",
        ],
      },
      {
        src: "/docs-screenshots/workflow-version-history.png",
        caption: "Version History popover — restore, compare, fork prior versions",
        details: [
          "Lists every saved version with author, date, status (active/draft/archived) and short diff summary",
          "Restore promotes an old version to active; Compare opens a side-by-side graph diff",
        ],
      },
      {
        src: "/docs-screenshots/workflow-calendar.png",
        caption: "Workflow Calendar — Mois / Semaine / Jour / Tableau of interventions",
        details: [
          "Period switcher (Mois / Semaine / Jour) + alternative table view (Vue tableau)",
          "Planifier intervention CTA opens the dispatch creation dialog pre-bound to the picked slot",
          "Drag-and-drop reschedule; conflict highlighting; intelligent planning hints (Planification intelligente)",
        ],
      },
      {
        src: "/docs-screenshots/workflow-dispatch-board.png",
        caption: "Dispatch Board — Kanban by status with Calendar / Map views",
        details: [
          "Columns: Scheduled, En route, In progress, Finished, Cancelled — drag a card to change status (writes to /api/dispatches)",
          "Inventory search filters cards by linked article/service; Calendar view & Map view (Mapbox/Leaflet) toggles in the toolbar",
          "+ New dispatch opens the creation dialog (technician, date, address, contact, service order link)",
        ],
      },
    ],
  },
  {
    key: "automation",
    name: "Automation",
    category: "Operations",
    description:
      "Lightweight rule engine for tenants who want trigger→action automations without the full Workflow canvas. Define rules in plain English (When / If / Then), monitor processed entities, replay failures and tune throttles. A complement to the visual Workflow Builder.",
    features: [
      "Rule definition — Trigger (entity + event), Conditions (field comparisons, AND/OR groups), Actions (update field, send email, create entity, call webhook)",
      "Triggers — Entity created / updated / status changed / deleted, Scheduled (CRON), Webhook received",
      "Conditions — typed comparisons (equals, contains, regex, > / <, in list, is empty), nested AND/OR groups",
      "Actions — Update field, Add tag, Send email (template), Create Task, Notify user/role, HTTP call (with retry)",
      "Processed entities log — every entity each rule has touched with timestamp, before/after snapshot, success/failure",
      "Failure inspector — view error, fix the rule, replay the entity through the rule",
      "Throttling — per-rule rate limit (e.g. max 100/hour) and per-entity dedup (avoid re-firing on same entity within N min)",
      "Test mode — dry-run a rule against the last N matching entities and preview the actions without executing them",
      "Active/Inactive toggle, audit history, ownership and RBAC per rule",
    ],
        routes: [
      { path: "/dashboard/automation", label: "Automation (workflow designer & runs)" },
    ],
  },
  {
    key: "external",
    name: "External APIs / Webhook Endpoints",
    category: "Integration",
    description:
      "Lets you expose public, slug-based HTTPS endpoints (e.g. https://api.flowentra.app/api/external-receive/contact-form-6f019d) to receive payloads from third-party systems — landing-page forms, CRM webhooks, partner integrations. Each endpoint has its own API key, an Active toggle, allowed HTTP methods, and a full inbound log. Received payloads can be turned into CRM records (Offers / Sales) directly from the log entry. The endpoint also ships with quick-start templates so a non-technical user can wire a contact form in under a minute.",
    features: [
      "Public slug URL per endpoint (publicly callable; no app login needed by the caller)",
      "Per-endpoint API key — copy, reveal, rotate / regenerate at any time",
      "Active / Inactive toggle — instantly stops accepting traffic without deleting history",
      "Allowed HTTP methods — POST (default), GET, PUT, DELETE per endpoint",
      "Quick-start templates — Landing page (vehicle quote), Generic contact form, B2B Lead capture, Webhook passthrough (no schema)",
      "Inbound log — every request with method, source IP, status code, received-at, raw payload viewer",
      "Log actions — view payload, mark as read, delete one, Clear All Logs, retry / replay",
      "Convert log → Offer or Sale — heuristic field mapping (name / email / phone / vehicle / company)",
      "Test endpoint button — sends a sample payload from the UI to verify wiring",
      "KPIs — Total Endpoints, Active, Received Today, Total Received (all-time, last received timestamp)",
      "Multi-company scoping — each endpoint is bound to a Target Company",
      "Search & filter endpoints by status (All / Active / Inactive)",
    ],
        routes: [
      { path: "/dashboard/external", label: "External endpoints list" },
      { path: "/dashboard/external/create", label: "New external endpoint" },
      { path: "/dashboard/external/:id", label: "Endpoint detail" },
      { path: "/dashboard/external/:id/edit", label: "Edit endpoint" },
      { path: "/dashboard/external/connect/:connectorId", label: "Connect a third-party connector" },
    ],
  },

  {
    key: "analytics",
    name: "Analytics",
    category: "Insights",
    description:
      "Cross-module BI workspace. Pre-built reports for Sales, Offers, Purchases, HR, Field Service plus a custom-chart builder powered by the Dashboard Builder widgets. Time-range comparison, drill-down, and CSV/PDF export per report.",
    features: [
      "Pre-built reports — Sales pipeline, Offer conversion, Revenue by product/customer, Purchase spend, Supplier performance, HR cost, Field productivity, Stock turnover",
      "Time range — preset (Today / 7d / 30d / Quarter / Year / YTD) or custom; compare with previous period",
      "Drill-down — click any chart segment to open the underlying records list pre-filtered",
      "Filters — per-report contextual filters (status, owner, company, category, currency)",
      "Custom charts — pull from any data source via Dashboard Builder; save as a personal or shared report",
      "Export — CSV (rows), PDF (rendered), PNG (chart only); scheduled email export (daily/weekly/monthly)",
      "Multi-currency — all monetary KPIs converted to a base currency using historical rates (configurable)",
      "Permissions — per-report visibility by role; sensitive reports (HR cost) gated to authorized roles only",
    ],
        routes: [
      { path: "/dashboard/analytics", label: "Analytics" },
    ],
  },
  {
    key: "website-builder",
    name: "Website Builder",
    category: "Marketing",
    description:
      "Visual site builder for public marketing pages, landing pages and online catalogs. Pages are published at /public/sites/:slug and indexed by search engines. Pulls live data from Articles (catalog), Forms (Dynamic Forms) and External Endpoints (lead capture).",
    features: [
      "Multi-site — create several sites per tenant, each with its own domain/subdomain (DNS CNAME setup guide)",
      "Page builder — drag-and-drop blocks (Hero, Features, Pricing, Testimonials, Catalog, Contact form, CTA, FAQ, Footer)",
      "Theme — color palette, typography pair, spacing density, dark/light auto, custom CSS escape hatch",
      "Per-page SEO — title, meta description, og:image, canonical, structured data (JSON-LD), sitemap.xml auto-generated",
      "Catalog block — pulls Articles flagged 'available on website' with category filters and add-to-quote button",
      "Forms — embed any Dynamic Form; submissions land in the Forms inbox and can convert to CRM records",
      "Lead capture — block wired to an External Endpoint URL for instant lead creation in CRM",
      "Versioning — each publish creates a new revision; restore prior versions; staging vs production",
      "Analytics — per-page views, average time, top sources; respects do-not-track",
      "Multi-language — content per locale (EN/FR), language switcher block, hreflang tags",
      "Image optimization — auto WebP conversion, responsive srcset, lazy loading",
    ],
        routes: [
      { path: "/dashboard/website-builder", label: "Website builder" },
      { path: "/public/sites/:siteSlug", label: "Public site (published)" },
      { path: "/public/sites/:siteSlug/:pageSlug", label: "Public page" },
    ],
  },
  {
    key: "lookups",
    name: "Lookups",
    category: "System",
    description:
      "Single source of truth for every dropdown / picklist value in the app. Centralizing them avoids typos and lets admins evolve taxonomies without code. Each lookup category has typed values, ordering, color, active flag and translations.",
    features: [
      "Categories — Countries, Currencies, Industries, Sources, Tags, Priorities, Offer Statuses, Sale Statuses, Service Order Statuses, Dispatch Statuses, Leave Types, Expense Categories, Document Categories, Project Types, Deal Stages, Payment Methods, Units of Measure, …",
      "Per-value fields — code (machine), label (display), color, icon, sort order, active, archived, translations (EN/FR)",
      "Used everywhere — every status badge, picklist, filter chip and chart legend reads from these tables",
      "Reorder — drag-and-drop sort within a category; affects display order across the app",
      "Soft delete — archive a value to hide it from new pickers while preserving past records",
      "Import/Export — CSV per category with full schema",
      "Migration safety — system-protected values (e.g. 'draft', 'cancelled') are read-only to prevent breaking flows",
    ],
        routes: [
      { path: "/dashboard/lookups", label: "Lookups (reference data)" },
    ],
  },
  {
    key: "notifications",
    name: "Notifications",
    category: "System",
    description:
      "User-facing notification center plus per-user channel preferences. Notifications come from every module (mentions, assignments, status changes, approvals, system alerts) and are delivered in-app, by email, and optionally by push (web push).",
    features: [
      "Bell menu — top-bar dropdown showing the latest 10, unread badge count, mark-as-read, jump-to-record",
      "Full page list — paginated archive with filters (type, source module, read/unread, date range)",
      "Event types — Mention, Assigned, Status changed, Approval requested, Comment, Reminder, System (maintenance, plan, security)",
      "Channels — In-app (always), Email (configurable per type), Web push (browser opt-in)",
      "Preferences — per-event type matrix (in-app/email/push), Do-not-disturb window, digest mode (hourly/daily summary)",
      "Realtime — pushed via SignalR; the bell badge updates without refresh",
      "Bulk actions — mark all as read, archive all, mute a thread/source",
      "Deep-link — every notification links to the originating record (offer, task, dispatch…) preserving filters",
    ],
        routes: [
      { path: "/dashboard/notifications", label: "Notifications" },
    ],
  },
  {
    key: "support",
    name: "Support / Tickets",
    category: "System",
    description:
      "Internal helpdesk and customer-facing ticket system. Users open a ticket from the Help page; admins triage, comment, link to records and resolve from the Tickets admin. Includes priority, SLA timers, categories and email notifications.",
    features: [
      "User Help center — knowledge base of articles + 'Open a ticket' form (subject, category, priority, description, attachments, screen recording)",
      "Tickets admin — table with status (Open / In progress / Waiting customer / Resolved / Closed), priority, owner, SLA timer, customer, last update",
      "Ticket detail — conversation thread (internal notes vs customer-visible replies), attachments, linked record (Sale, Service Order, Contact)",
      "Categories & priorities — configurable; SLA defined per priority (response & resolution targets)",
      "Email notifications — every reply emails the customer; customer reply by email lands back in the thread (mailbox-to-ticket gateway)",
      "Macros — saved canned responses with merge fields; one-click apply",
      "Reports — open vs resolved over time, average first-response, SLA compliance, top categories",
      "Permissions — agents see assigned + unassigned, admins see all; customers see only their own",
    ],
        routes: [
      { path: "/dashboard/support/tickets/dashboard", label: "Tickets dashboard" },
      { path: "/dashboard/support/tickets", label: "My tickets" },
      { path: "/dashboard/support/tickets/new", label: "New ticket" },
      { path: "/dashboard/support/tickets/:ticketId", label: "Ticket detail" },
      { path: "/dashboard/help", label: "Help center" },
      { path: "/dashboard/ticketsadmin", label: "Tickets admin" },
    ],
  },
  {
    key: "settings",
    name: "Settings",
    category: "System",
    description:
      "Hub for everything administrative. Personal area (Profile, Company, Security, Preferences, Offline data) and Administration area (Companies, Users, Roles, Integrations, Subscription, System, Sync history). Each section has dedicated docs in the Settings index.",
    features: [
      "Personal — Profile (avatar, identity, contact, locale), Company (branding & defaults), Security (password change), Preferences (theme/accent/density), Offline data (per-module cache)",
      "Administration — Companies (multi-tenant manager), Users (invite/edit/deactivate), Roles (RBAC permission matrix), Integrations (catalog, OAuth/API-key), Subscription (plan + module activation), System (logs, sync, numbering), Sync history",
      "Plugins — activate/deactivate modules per tenant with dependency enforcement",
      "Dynamic Forms — drag-and-drop form builder with public submission URLs",
      "System logs & DB full view — admin-only diagnostic tools",
      "Sync dashboard — offline queue & conflict resolution",
      "Documentation — module docs (this page) + dedicated Settings index with searchable fields/modals",
    ],
        routes: [
      { path: "/dashboard/settings", label: "Settings home" },
      { path: "/dashboard/settings/system", label: "System settings" },
      { path: "/dashboard/settings/advanced", label: "Advanced settings" },
      { path: "/dashboard/settings/system-config", label: "System configuration" },
      { path: "/dashboard/settings/users", label: "Users admin" },
      { path: "/dashboard/settings/roles", label: "Roles admin" },
      { path: "/dashboard/settings/user-groups", label: "User groups" },
      { path: "/dashboard/settings/plugins", label: "Plugins" },
      { path: "/dashboard/settings/dynamic-forms", label: "Dynamic forms" },
      { path: "/dashboard/settings/processes", label: "Processes" },
      { path: "/dashboard/settings/logs", label: "System logs" },
      { path: "/dashboard/settings/database-full-view", label: "Database full view" },
      { path: "/dashboard/settings/db-console", label: "DB console" },
      { path: "/dashboard/settings/sync", label: "Offline sync dashboard" },
      { path: "/dashboard/settings/documentation", label: "Documentation" },
    ],
  },
];

// Append additional modules that were missing from the catalog
MODULES.push(
  {
    key: "service-orders",
    name: "Service Orders (Field)",
    category: "Field Service",
    description:
      "Field-service work orders that bridge Sales and on-site execution. A Service Order groups Jobs (work items), Dispatches (technician assignments with date/time/route), Time & Expenses entries, Materials usage, Attachments and Activity log. Status cascades automatically from dispatch progress.",
    features: [
      "List page (/dashboard/field/service-orders) — KPI tiles (Total / Active / Completed / Total value), search, filters (Status, Priority, Technician, Date range, Tags), Table / Kanban / Map view modes, bulk-select + bulk delete, Export CSV with column picker, + Create Service Order",
      "Status workflow — Pending → Ready for Planning → Scheduled → In Progress → Technically Completed (or Partially Completed) → Ready for Invoice → Invoiced → Closed; terminals Closed / Cancelled. Branches: in_progress→on_hold/partially_completed, scheduled→ready_for_planning/planned",
      "Cascade rules from dispatches — (1) any dispatch in_progress ⇒ SO=in_progress; (2) some dispatches completed ⇒ SO=partially_completed; (3) single or all dispatches completed ⇒ SO=technically_completed; (4) dispatch rejected or all dispatches deleted ⇒ SO=ready_for_planning",
      "Create Service Order — Customer search/select, Site address (with map pin), Repair details vs Installation details forms, Linked Sale / Offer record search, Technician assignment, Installation assignment, attachments",
      "Detail page tabs — Overview, Jobs (work items table with statuses unscheduled/ready/dispatched/cancelled, Schedule Job modal), Dispatches (table with status pending/planned/confirmed/rejected/in_progress/completed/cancelled), Time & Expenses (logged hours, billable rate, expenses with approval), Materials (used items with stock decrement + approval), Attachments (drag-drop upload with categories), Checklists, Activity log",
      "Job detail (/dashboard/field/service-orders/:soId/jobs/:jobId) — title, description, location, scheduling, technician, status flow, time & materials specific to that job",
      "Header actions — Send Service Order (email PDF to customer), PDF Preview/Download (react-pdf, branded, configurable PDF settings: cover, sections, signature block), Invoice Preparation modal (collects time/expenses/materials and creates a draft invoice), Edit, Delete (soft)",
      "Maps — Leaflet (default) or Mapbox view of all service orders with markers clustered by status; click for mini-card with quick actions",
      "Public/printable report (/dashboard/field/service-orders/:id/report) — branded PDF for customer or technician handoff",
      "Permissions — RBAC for view/create/edit/delete; technicians see only their assigned dispatches; multi-company scope via Target Company",
    ],
        routes: [
      { path: "/dashboard/field/service-orders", label: "Service orders list" },
      { path: "/dashboard/field/service-orders/create", label: "New service order" },
      { path: "/dashboard/field/service-orders/:id", label: "Service order detail" },
      { path: "/dashboard/field/service-orders/:id/report", label: "Service order report / printable" },
      { path: "/dashboard/field/service-orders/:serviceOrderId/jobs/create", label: "New job on a service order" },
      { path: "/dashboard/field/service-orders/:serviceOrderId/jobs/:jobId", label: "Job detail" },
    ],
  },
  {
    key: "ai-assistant",
    name: "AI Assistant",
    category: "Insights",
    description:
      "In-app conversational assistant powered by Lovable AI / OpenRouter. Helps users navigate, summarize records, draft offers, and answer questions about their data.",
    features: [
      "Floating chat widget available across the app",
      "Per-user AI settings (preferred model, temperature, system prompt)",
      "Conversation history persisted in chat_history table",
      "Speech-to-text input and text-to-speech output (browser APIs)",
      "Intent analyzer for quick actions (create offer, find contact, …)",
      "Context awareness — sees the current page/entity and uses it to ground answers (e.g. 'summarize this offer')",
      "Action proposals — suggests in-app actions (Create / Update / Send) and executes after a confirmation step",
      "Multi-model — pick between Lovable AI gateway models (Gemini Pro/Flash, GPT-OSS, Claude) per request",
      "Usage & cost — per-tenant token usage dashboard, per-user limits, free vs paid model distinction",
      "Privacy — per-tenant toggle to disable training/data-retention; PII redaction option for prompts",
      "Conversation export — download a thread as Markdown / PDF",
      "Suggested prompts — context-aware prompt chips on the dashboard and on each major page",
    ],
        routes: [],
  },
  {
    key: "auth",
    name: "Authentication",
    category: "System",
    description:
      "Sign-up, sign-in, password reset, and OAuth providers (Google, Microsoft). Multi-tenant aware with subdomain routing.",
    features: [
      "Email + password sign-in / sign-up",
      "OAuth: Sign in with Google, Sign in with Microsoft",
      "Password reset flow with email link",
      "Tenant subdomain detection (demo.flowentra.app → demo)",
      "JWT session with auto refresh",
      "MFA — optional TOTP (Google Authenticator / 1Password) and email-OTP fallback",
      "Session management — list of active sessions per user (device, IP, last seen) with one-click revoke",
      "Brute-force protection — IP + account throttling after failed attempts; lockout with email alert",
      "Password policy — configurable min length, complexity, rotation period, history (no reuse of last N)",
      "SSO (enterprise) — SAML 2.0 / OIDC connections per tenant; just-in-time user provisioning",
      "Magic link sign-in — passwordless email link option",
      "Audit log — every auth event (sign-in, sign-out, password change, MFA enroll/disable, OAuth link)",
      "Localization — login screen translated EN/FR with branding override per tenant",
    ],
        routes: [
      { path: "/login", label: "Company / tenant login" },
      { path: "/user-login", label: "User login" },
      { path: "/verify-email", label: "Email verification" },
      { path: "/two-factor", label: "Two-factor challenge" },
      { path: "/select-company", label: "Select company after login" },
      { path: "/oauth/callback", label: "OAuth callback" },
    ],
  },
  {
    key: "payments",
    name: "Payments",
    category: "Finance",
    description:
      "Track and reconcile payments received against sales / invoices and payments sent against supplier invoices.",
    features: [
      "Inbound payments (from customers) and outbound (to suppliers)",
      "Methods: cash, bank transfer, cheque, card, online",
      "Partial payments and outstanding balance tracking",
      "Linked to sales / supplier invoices for three-way reconciliation",
      "Payment fields — Date, Method, Reference (cheque #, transfer ID), Amount, Currency, Bank account, Notes",
      "Multi-currency — record payments in any currency with FX rate snapshot; auto-revaluation report",
      "Bank import — upload CSV/OFX/QIF bank statements, fuzzy-match lines to open invoices",
      "Reconciliation — three-way match (PO ↔ Receipt ↔ Invoice ↔ Payment) with discrepancy flags",
      "Aging reports — Customer aging (0-30 / 31-60 / 61-90 / 90+) and Supplier aging mirrored",
      "Reminders — automated dunning emails for overdue invoices (configurable schedule, escalation levels)",
      "Online payments — Stripe / Paddle integrations (when enabled): pay-by-link sent with the invoice email",
      "Refunds — full or partial refund records, linked back to the original payment",
      "KPIs — Outstanding receivables, Outstanding payables, Cash collected (period), Average days to pay (DSO)",
    ],
        routes: [],
  },
  {
    key: "onboarding",
    name: "Onboarding & Product Tour",
    category: "System",
    description:
      "Guided first-run experience: company profile setup, currency, locale, default users, then a contextual product tour on the dashboard.",
    features: [
      "Multi-step onboarding wizard (company, branding, defaults)",
      "Replayable product tour from the help menu",
      "Per-user 'tour completed' flag in preferences",
      "Steps — Welcome, Company identity (name/logo/website), Locale & currency, Invite teammates, Activate plugins, Create first record (offer/contact)",
      "Skippable — every step has Skip; progress saved server-side so resuming on another device picks up where you left",
      "Personalized — questions about role/industry/team-size tune which plugins are recommended on the Activate step",
      "Sample data — optional 'Load sample data' to populate contacts, offers, sales for exploration; one-click wipe later",
      "Per-module mini-tours — first time a user opens Offers/Sales/Service Orders, a 3-step coach mark explains the layout",
      "Help drawer — replay any tour, browse the knowledge base, open a ticket, watch how-to videos",
    ],
        routes: [
      { path: "/onboarding", label: "Onboarding wizard" },
    ],
  },
  {
    key: "preferences",
    name: "User Preferences",
    category: "System",
    description:
      "Per-user UI preferences: theme, language, layout mode, default view modes, sidebar config, table column visibility.",
    features: [
      "Theme (light / dark / system) and custom accent color",
      "Language (en / fr) with i18n bundles per module",
      "Layout mode (compact / comfortable), sidebar collapsed state",
      "Per-table column visibility & order",
      "Offline hydration preferences (which data to cache)",
      "Default landing page — choose where you land after sign-in (Dashboard, Tasks, Inbox, custom URL)",
      "Default view mode per module — Table vs Kanban vs Map remembered per user",
      "Date & number format — locale-driven defaults overridable per user",
      "Timezone — display all timestamps in the chosen timezone",
      "Notification channels — per-event matrix shared with the Notifications module",
      "Keyboard shortcuts — view & customize the shortcut map (e.g. Cmd+K command palette)",
      "Reset — one-click 'restore defaults' that wipes overrides and reloads",
    ],
        routes: [],
  },
  {
    key: "scheduling",
    name: "Scheduling",
    category: "Field Service",
    description:
      "Plan technician work over a calendar grid. Drag jobs from the backlog onto technician rows / time slots.",
    features: [
      "Day / week / month grid views",
      "Drag-and-drop assignment of jobs to technicians",
      "Conflict detection (double-booking, leave overlap)",
      "Auto-create or merge into existing installation dispatches on the same day",
      "Backlog panel — unassigned jobs grouped by priority/SLA, drag onto the grid to schedule",
      "Technician rows — show shift, current location, skills tags, today's load (h scheduled / capacity)",
      "Smart suggestions — when dragging a job, the grid highlights technicians matching required skills and within travel range",
      "Travel time — auto-inserts buffer between dispatches based on address geocoding (configurable)",
      "Recurring schedules — repeating maintenance jobs auto-placed on next occurrence",
      "Notifications — assigned technician gets in-app + email/SMS alert; customer optionally notified with arrival window",
      "Mobile dispatcher view — read-only board for managers on the go",
      "Print — printable daily run-sheet per technician (PDF)",
      "Multi-company aware; permissions tied to Field Service RBAC",
    ],
        routes: [],
  },
  {
    key: "dispatcher",
    name: "Dispatcher Console",
    category: "Field Service",
    description:
      "Real-time map + list view of technicians and active dispatches. Reassign, prioritize, and communicate from one screen.",
    features: [
      "Live map with technician pins and job markers",
      "Active dispatch panel with status, ETA, customer, address",
      "Reassign technician with a click",
      "Send message / call technician (if comms plugin enabled)",
      "Status filters — toggle Scheduled / En route / On site / Completed / Cancelled markers on the map",
      "Click-to-zoom — click a technician pin to focus the map and show their queue for the day",
      "Routing — overlay driving directions between consecutive dispatches; total drive time/day per technician",
      "Alerts — late-start, overrun, no-GPS-update, SLA-at-risk surfaced as toasts and on the right panel",
      "Quick reassign — drag a dispatch from one technician to another; conflict + travel time recomputed",
      "Communication — in-app chat or click-to-call (Twilio/Vonage), with conversation logged on the dispatch",
      "Audit — every reassignment / status override logged with user + timestamp",
      "Multi-company; map provider Mapbox or Leaflet (configurable in Settings)",
    ],
        routes: [
      { path: "/dashboard/field/dispatcher/interface", label: "Dispatching interface" },
      { path: "/dashboard/field/dispatcher/job/:id", label: "Dispatch job detail" },
      { path: "/dashboard/field/dispatcher/manage-scheduler", label: "Manage scheduler" },
      { path: "/dashboard/field/dispatcher/manage-scheduler/edit/:technicianId", label: "Edit technician schedule" },
    ],
  },
  {
    key: "skills",
    name: "Skills",
    category: "HR",
    description:
      "Catalog of skills and per-user proficiency levels. Used by scheduling to suggest the right technician for a job.",
    features: [
      "Skill categories with color tags",
      "Per-user proficiency: beginner / intermediate / advanced / expert",
      "Years of experience and certifications per user-skill",
      "Filter scheduler / dispatcher technicians by required skill",
      "Required skills on jobs/Service Orders — used by Scheduling to highlight matching technicians",
      "Certifications — upload certificate documents, expiry date, alerts before expiry",
      "Skill matrix report — heatmap of skills × users to spot gaps",
      "Bulk import skills via CSV; per-skill audit log",
      "Permissions — managers can edit their team's skills; admins can edit any",
    ],
        routes: [],
  },
  {
    key: "users",
    name: "Users & Roles",
    category: "System",
    description:
      "Manage application users, assign roles, and configure granular role permissions per module / action.",
    features: [
      "Users CRUD: invite by email, set role, activate / deactivate",
      "Roles CRUD with descriptions",
      "Per-role permissions matrix (view / create / edit / delete) per module",
      "Real-time permission broadcast (changes apply without re-login)",
      "User fields — first/last name, email (login), phone, role, manager, department, language, timezone, status",
      "Bulk invite — paste emails or upload CSV; assign default role + welcome email",
      "Reset password / Resend invitation / Force MFA enrolment / Revoke all sessions per user",
      "Audit — every user/role change logged with actor, before/after",
      "Role duplication — clone a role to start from an existing baseline",
      "Permission scopes — beyond CRUD: 'View own' vs 'View all' for sensitive modules (HR cost, Salaries)",
      "Multi-company role mapping — a user can have different roles per company",
      "SCIM provisioning (enterprise) — auto-create/disable users from your identity provider",
    ],
        routes: [
      { path: "/dashboard/settings/users", label: "Users admin" },
      { path: "/dashboard/settings/roles", label: "Roles admin" },
      { path: "/dashboard/settings/user-groups", label: "User groups" },
    ],
  },
  {
    key: "dynamic-forms",
    name: "Dynamic Forms",
    category: "System",
    description:
      "Build custom forms (drag-and-drop fields), publish them on a public URL, and collect submissions in the back office.",
    features: [
      "Field types: text, textarea, number, email, phone, select, radio, checkbox, date, file upload, signature",
      "Conditional logic (show / hide fields based on answers)",
      "Public submission URL with optional thank-you page",
      "Submissions inbox with CSV export and convert-to-CRM-record",
      "Multi-step forms — wizard with progress bar; per-step validation",
      "Validation — required, regex, min/max, email/phone format, file size & type whitelist",
      "Pre-fill — query-string pre-filling (?email=…) and signed-link pre-fill from an external system",
      "Branding — per-form logo, colors, custom CSS, custom thank-you message or redirect URL",
      "Notifications — email a copy of each submission to N recipients; webhook POST option",
      "Anti-spam — invisible captcha + honeypot + rate limit per IP",
      "Convert to CRM — map fields once, then 'Convert' creates a Contact / Offer / Sale on the spot",
      "Embed — iframe snippet or JS embed for any website",
      "Versioning — every publish creates a revision; older submissions keep their original schema",
      "i18n — translate field labels per locale",
    ],
        routes: [
      { path: "/dashboard/settings/dynamic-forms", label: "Dynamic forms list" },
      { path: "/dashboard/settings/dynamic-forms/create", label: "New form" },
      { path: "/dashboard/settings/dynamic-forms/:id/edit", label: "Edit form" },
      { path: "/dashboard/settings/dynamic-forms/:id/preview", label: "Preview form" },
      { path: "/dashboard/settings/dynamic-forms/:id/responses", label: "Form responses" },
      { path: "/public/forms/:slug", label: "Public form (submission)" },
    ],
  },
  {
    key: "signatures",
    name: "E-Signatures",
    category: "System",
    description:
      "Capture electronic signatures on offers, contracts, delivery notes, and HR documents. Stored with timestamp and signer identity.",
    features: [
      "In-app signature pad (mouse / touch / stylus)",
      "Email a signature link to a customer / employee",
      "Embed signature image in generated PDFs",
      "Audit trail: signer, IP, timestamp, document hash",
      "Multiple signers — sequential or parallel signing order, per-signer reminders",
      "Field placement — drag signature, initials, date and text-fill fields onto the PDF for each signer",
      "Public signing page — branded, mobile-friendly, no login required for external signers",
      "Legal compliance — eIDAS-style audit certificate appended to the signed PDF (signer info, IP, timestamps, hash chain)",
      "Decline & comments — signers can decline with a reason; comments per field",
      "Reminders — auto-reminder schedule (e.g. day 1, 3, 7) and manual nudge",
      "Status tracking — Sent / Viewed / Signed / Declined / Expired per signer; webhook on each event",
      "Templates — reusable templates with pre-placed fields for recurring documents",
    ],
        routes: [],
  },
  {
    key: "sync",
    name: "Offline Sync",
    category: "System",
    description:
      "Service-worker based offline mode. Mutations are queued locally and replayed when the connection returns.",
    features: [
      "Per-module hydration preferences (what to cache offline)",
      "Sync dashboard with queue length, last sync, retry status",
      "Conflict resolution policies (server-wins / client-wins / prompt)",
      "Sync history with retry on failure",
      "Offline indicator — top-bar pill turns amber when offline; tooltip shows queue size",
      "IndexedDB cache — hydrated read-only data for selected modules; storage usage gauge",
      "Mutation queue — queued create/update/delete with retry/backoff and idempotency keys",
      "Conflict viewer — side-by-side diff of local vs server with field-level keep-mine/keep-theirs",
      "Force resync — wipe and rehydrate selected modules",
      "Background sync — service worker re-tries when network returns; web push to notify completion",
      "Logs — per-attempt log with HTTP status, duration, payload size",
    ],
        routes: [
      { path: "/dashboard/settings/sync", label: "Offline sync dashboard" },
    ],
  },
  {
    key: "plugins",
    name: "Plugins",
    category: "System",
    description:
      "Activate or deactivate modules per tenant. Core plugins (System, Settings, Auth, Dashboard) cannot be disabled. Dependencies are enforced.",
    features: [
      "Plugin catalog grouped by category (CRM / Inventory / Field / HR / Finance / Comms / Analytics / Builders)",
      "Toggle activation per tenant; sidebar updates instantly",
      "Dependency check (e.g. Sales requires Contacts)",
      "Server-side enforcement of activations (can't bypass via direct URL)",
      "Plugin card — code, name, category, version, description, dependencies, status (active/inactive/core)",
      "Bulk activate — select all in a category and enable in one click; dependencies auto-included",
      "Trial / Beta tags — flag plugins that are in beta with a confirmation dialog before enabling",
      "Plan gating — some plugins require a higher plan; the toggle shows an upgrade CTA instead",
      "Audit log — every activation / deactivation logged with user + timestamp",
      "Per-plugin settings deep-link — jump from the plugin row to its dedicated settings page",
      "Sidebar refresh — disabling a plugin instantly removes its menu item across all open sessions (broadcast)",
    ],
        routes: [
      { path: "/dashboard/settings/plugins", label: "Plugins admin" },
    ],
  },
);

export const CATEGORIES = Array.from(new Set(MODULES.map((m) => m.category)));

export const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  Core: LayoutDashboard,
  CRM: Users,
  Sales: ShoppingCart,
  Inventory: Package,
  Finance: CreditCard,
  HR: Briefcase,
  "Field Service": Wrench,
  Operations: GitBranch,
  Integration: Webhook,
  Insights: BarChart3,
  Marketing: Globe,
  System: SettingsIcon,
};

export const MODULE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  dashboard: LayoutDashboard,
  contacts: Users,
  offers: FileText,
  sales: ShoppingCart,
  deals: Sparkles,
  articles: Package,
  "inventory-services": Package,
  "stock-management": Database,
  purchases: ShoppingCart,
  hr: Briefcase,
  field: Wrench,
  tasks: FolderKanban,
  calendar: Calendar,
  "email-calendar": Mail,
  projects: FolderKanban,
  communication: MessageSquare,
  documents: FileText,
  workflow: GitBranch,
  automation: Zap,
  external: Webhook,
  analytics: BarChart3,
  "website-builder": Globe,
  lookups: SlidersHorizontal,
  notifications: Bell,
  support: LifeBuoy,
  settings: SettingsIcon,
  "ai-assistant": Bot,
  auth: Lock,
  "dashboard-builder": LayoutGrid,
  payments: CreditCard,
  onboarding: Sparkles,
  preferences: SlidersHorizontal,
  scheduling: CalendarClock,
  dispatcher: Map,
  skills: GraduationCap,
  users: UserCog,
  "dynamic-forms": FileSpreadsheet,
  signatures: Signature,
  sync: RefreshCw,
  plugins: Puzzle,
};

export default function DocumentationPage() {

  const navigate = useNavigate();
  const { t } = useTranslation("settings");
  const catLabel = useCategoryLabel();
  const modules = useLocalizedModules(MODULES);
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return modules.filter((m) => {
      if (activeCategory !== "all" && m.category !== activeCategory) return false;
      if (!q) return true;
      const guide = MODULE_GUIDES[m.key];
      return (
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q) ||
        m.features.some((f) => f.toLowerCase().includes(q)) ||
        m.routes.some((r) => r.path.toLowerCase().includes(q) || r.label.toLowerCase().includes(q)) ||
        (guide ? guideSearchText(guide).includes(q) : false)
      );
    });
  }, [query, activeCategory, modules]);

  const grouped = useMemo(() => {
    const map: Record<string, ModuleDoc[]> = {};
    for (const m of filtered) (map[m.category] ||= []).push(m);
    return map;
  }, [filtered]);


  const totalRoutes = modules.reduce((acc, m) => acc + m.routes.length, 0);
  const guides = Object.values(MODULE_GUIDES);
  const totalWorkflows = guides.reduce((acc, g) => acc + g.workflows.length, 0);
  const totalRules = guides.reduce((acc, g) => acc + g.rules.length, 0);

  


  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Hero */}
      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-background">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 pt-6 pb-8">
          <div className="flex items-center gap-2 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/settings")} aria-label={t("docs.backToSettings")}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Link to="/dashboard/settings" className="hover:text-foreground">{t("docs.breadcrumbSettings")}</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-foreground font-medium">{t("docs.breadcrumbDocs")}</span>
            </div>
          </div>

          <div className="max-w-3xl">
            <Badge variant="secondary" className="mb-3 gap-1.5">
              <Book className="h-3 w-3" /> {t("docs.knowledgeBase")}
            </Badge>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">
              {t("docs.heroTitle")}
            </h1>
            <p className="text-sm lg:text-base text-muted-foreground mt-3">
              {t("docs.heroSubtitle")}
            </p>
          </div>

        </div>
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-md">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-3 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">


              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t("docs.searchPlaceholder")}
                className="pl-9"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-muted"
                  aria-label={t("docs.clearSearch")}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveCategory("all")}
              className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap transition-colors ${
                activeCategory === "all" ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
              }`}
            >
              {t("docs.all")} ({modules.length})
            </button>
            {CATEGORIES.map((cat) => {
              const Icon = CATEGORY_ICON[cat] ?? FolderKanban;
              const count = modules.filter((m) => m.category === cat).length;
              const active = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`text-xs px-3 py-1.5 rounded-full border whitespace-nowrap inline-flex items-center gap-1.5 transition-colors ${
                    active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted"
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {catLabel(cat)} ({count})
                </button>
              );
            })}
          </div>
        </div>
      </div>


      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
        <div className="flex gap-8 min-w-0">
          {/* TOC */}
          <aside className="hidden xl:block w-56 shrink-0">
            <div className="sticky top-32">
              <p className="text-px-10 font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-2">
                {t("docs.categories")}
              </p>
              <ScrollArea className="h-[calc(100vh-16rem)] pr-2">
                {Object.entries(grouped).map(([cat, mods]) => {
                  const Icon = CATEGORY_ICON[cat] ?? FolderKanban;
                  return (
                    <div key={cat} className="mb-4">
                      <a
                        href={`#cat-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                        className="flex items-center gap-1.5 text-xs font-semibold px-2 mb-1 hover:text-primary"
                      >
                        <Icon className="h-3 w-3" /> {catLabel(cat)}
                      </a>
                      <ul className="space-y-0.5 border-l ml-3 pl-2">
                        {mods.map((m) => (
                          <li key={m.key}>
                            <Link
                              to={`/dashboard/settings/documentation/module/${m.key}`}
                              className="block text-xs px-2 py-1 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground truncate"
                            >
                              {m.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </ScrollArea>
            </div>
          </aside>

          <main className="flex-1 min-w-0 space-y-10">
            {filtered.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center text-muted-foreground">
                  <Search className="h-10 w-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">{t("docs.noMatch", { query })}</p>
                  <Button variant="link" onClick={() => { setQuery(""); setActiveCategory("all"); }}>
                    {t("docs.clearFilters")}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              Object.entries(grouped).map(([cat, mods]) => {
                const Icon = CATEGORY_ICON[cat] ?? FolderKanban;
                return (
                  <section
                    key={cat}
                    id={`cat-${cat.replace(/\s+/g, "-").toLowerCase()}`}
                    className="space-y-4 scroll-mt-32"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-primary" />
                      <h2 className="text-base font-semibold">{catLabel(cat)}</h2>
                      <span className="text-xs text-muted-foreground">{mods.length}</span>
                      <Separator className="flex-1" />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                      {mods.map((m) => {
                        const MIcon = MODULE_ICON[m.key] ?? FolderKanban;
                        const guide = MODULE_GUIDES[m.key];
                        return (
                          <Link
                            key={m.key}
                            to={`/dashboard/settings/documentation/module/${m.key}`}
                            id={`mod-${m.key}`}
                            className="group block scroll-mt-32"
                          >
                            <Card className="h-full transition-all border-border/60 hover:border-primary/40 hover:shadow-md group-hover:-translate-y-0.5">
                              <CardHeader className="pb-3">
                                <div className="flex items-start gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                                    <MIcon className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5 group-hover:text-primary transition-colors">
                                      {m.name}
                                      <ChevronRight className="h-3.5 w-3.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                    </CardTitle>
                                    <CardDescription className="mt-1 line-clamp-3 text-xs leading-relaxed">
                                      {guide?.purpose ?? m.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="pt-0">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {guide?.workflows.length ? (
                                    <Badge variant="secondary" className="text-px-10 gap-1">
                                      <GitBranch className="h-3 w-3" /> {t("docs.workflowsCount", { count: guide.workflows.length })}
                                    </Badge>
                                  ) : null}
                                  {guide?.rules.length ? (
                                    <Badge variant="secondary" className="text-px-10 gap-1">
                                      <ShieldCheck className="h-3 w-3" /> {t("docs.rulesCount", { count: guide.rules.length })}
                                    </Badge>
                                  ) : null}
                                  <Badge variant="outline" className="text-px-10">{t("docs.routesCount", { count: m.routes.length })}</Badge>
                                  {SHOTS[m.key]?.length ? (
                                    <Badge variant="outline" className="text-px-10">{t("docs.screensCount", { count: SHOTS[m.key].length })}</Badge>
                                  ) : null}
                                </div>
                              </CardContent>
                            </Card>
                          </Link>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}

          </main>
        </div>

      </div>
    </div>
  );
}
