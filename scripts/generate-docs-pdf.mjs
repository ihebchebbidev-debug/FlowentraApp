#!/usr/bin/env node
/**
 * Flowentra Documentation PDF Generator
 * Generates a comprehensive PDF from all docs-screenshots + module descriptions.
 * Usage: node scripts/generate-docs-pdf.mjs
 * Output: flowentra-documentation.pdf (in project root)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { execSync, spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SCREENSHOTS_DIR = path.join(ROOT, "public", "docs-screenshots");
const OUTPUT_HTML = path.join(ROOT, "flowentra-documentation.html");
const OUTPUT_PDF = path.join(ROOT, "flowentra-documentation.pdf");

// ─── Module & Screenshot Data ─────────────────────────────────────────────────

const MODULES = [
  {
    key: "login",
    name: "Login & Authentication",
    category: "Core",
    description: "Secure tenant-aware authentication. Users sign in with email + password. Supports multi-company tenancy where the same credentials can access multiple companies.",
    features: [
      "Email + password authentication",
      "Multi-tenant scoped sessions",
      "JWT-based auth with refresh tokens",
      "Role-based access control (RBAC) on every route",
      "Password reset via email link",
      "Session management — active sessions list & invalidation",
    ],
    screenshots: [
      { file: "01-login.png", caption: "Login page — Flowentra sign-in screen", details: ["Email and password fields", "Branded with company logo", "Tenant-aware routing on success"] },
    ],
  },
  {
    key: "dashboard",
    name: "Dashboard & Builder",
    category: "Core",
    description: "Configurable home dashboards. Build per-role dashboards from widgets (KPIs, charts, lists), pin views, and switch between built-in and custom dashboards.",
    features: [
      "Custom dashboard builder (drag & drop widgets)",
      "KPI cards, charts, recent activity feeds",
      "Per-user / per-role default dashboard",
      "Public sharing of dashboards via token URL",
      "Built-in dashboards — Service, Sales, Field, HR, Finance, Executive",
      "Switcher — top-bar dropdown to flip between dashboards",
      "Global period selector with comparison to previous period",
      "Tour — 28-step first-time user product tour",
      "Realtime KPI refresh via SignalR",
    ],
    screenshots: [
      { file: "dashboard-home.png", caption: "Dashboard Home — default landing view", details: ["Top bar with company switcher and notifications", "Sidebar navigation with all modules", "KPI tiles and chart widgets"] },
      { file: "dashboard-tour-welcome.png", caption: "First-time user product tour — welcome modal (Step 0 of 28)", details: ["Modal: 'Welcome to Flowentra! 👋'", "Two actions: Skip tour or Next (Step 1 of 28)", "Tour can be replayed from the user profile menu"] },
      { file: "dashboard-tour-step-sidebar.png", caption: "Tour Step 2 — Navigation Sidebar callout", details: ["Anchored callout points at the left sidebar with arrow", "Explains section grouping: Workspace, CRM, Service, System", "Footer controls: Skip tour, Back, Next"] },
      { file: "dashboard-tour.png", caption: "Product tour in action — highlights UI regions step by step" },
      { file: "dashboard-overview.png", caption: "Default Service dashboard — KPIs, charts, map and trends in one view", details: ["Service Orders by Status — bar chart", "Tasks by Status — donut chart", "Dispatch Locations — geo widget on map", "Monthly Trend — area sparkline"] },
      { file: "dashboard-switcher.png", caption: "Dashboard switcher dropdown — flip between built-in dashboards or create a new one", details: ["Lists every dashboard available to the current user", "Active dashboard highlighted in brand orange", "+ Create New Dashboard at the bottom"] },
      { file: "dashboard-manager-empty.png", caption: "Custom Dashboard Manager — empty state", details: ["Empty state: 'No dashboards yet. Create one to get started.'", "15 widget types available: KPI, Bar, Line, Area, Pie, Donut, Funnel, Gauge, Heatmap, Map, Radar, Sparkline, Table, Background"] },
      { file: "dashboard-edit-mode.png", caption: "Dashboard Edit mode — drag, resize and reorder widgets", details: ["Toolbar: Rename, + Add Widget, Period selector, Auto-refresh, Grid settings, Cancel, Save", "Each widget shows drag handle, swap-data-source icon, × remove button"] },
      { file: "dashboard-rename-modal.png", caption: "Rename Dashboard modal — change the dashboard title in place", details: ["Single 'Dashboard Name' text input pre-filled with current name", "Cancel / Save actions"] },
      { file: "dashboard-add-widget-modal.png", caption: "Add Widget — pick from 14 widget types", details: ["Tabs: Add Widget (raw types) and Templates (preset widget + data source)", "Types: KPI Card, Sparkline, Bar Chart, Pie Chart, Donut, Line, Area, Funnel, Radar, Stacked Bar, Heatmap, Data Table, Map, Gauge"] },
      { file: "dashboard-add-widget-templates.png", caption: "Templates tab — ready-made widgets bound to a data source", details: ["One-click presets: Sales Revenue, Total Contacts, Sales by Status, Offers Pipeline, Conversion Rate, Sales Trend, Tasks by Status, Service Orders by Status", "Clicking a template adds the widget instantly"] },
      { file: "dashboard-widget-config.png", caption: "Configure Widget — set title, data source and metric", details: ["Widget Title, Data Source dropdown, Metric dropdown (Count, Sum, Average, Min, Max)", "+ Add Widget finalises and drops onto the grid"] },
      { file: "dashboard-grid-settings.png", caption: "Grid Settings — fine-tune spacing, density and animation", details: ["Preset: Compact / Comfortable / Spacious", "Sliders: Spacing, Row Height, Corner Radius", "Card Style: Default / Flat / Elevated / Bordered", "Widget Entrance animation: None / Fade / Slide / Scale / Bounce"] },
      { file: "dashboard-period-selector.png", caption: "Global period selector — applies to every widget at once", details: ["Options: All Time, Last 7/30/90 Days, Last 6 Months, Last Year, Custom Range", "Custom Range opens a date-range picker; selection is persisted"] },
      { file: "dashboard-save-toast.png", caption: "Save confirmation — dashboard returns to view mode", details: ["Toast 'Dashboard saved successfully' appears bottom-right", "Layout, period, auto-refresh, grid settings and widget configurations are all persisted"] },
    ],
  },
  {
    key: "contacts",
    name: "Contacts (CRM)",
    category: "CRM",
    description: "Unified directory of Persons, Companies and Suppliers. Each contact carries identity, fiscal IDs (CIN, Matricule Fiscale), address with geolocation, status and a 360° history across Offers, Sales, Service Orders, Purchases and Notes.",
    features: [
      "Three contact types — Person, Company, Supplier",
      "Tunisian fiscal fields — CIN and Matricule Fiscale",
      "Address with interactive geolocation map",
      "List with KPIs, full-text Search, advanced Filters, Map view",
      "360° tabs on every contact — Installations, Offers, Sales, Service Orders, Purchases, Notes",
      "Bulk Import — Dynamic (any Excel headers) or Structured Import",
      "Dedicated Suppliers area at /dashboard/suppliers",
      "Multi-company aware",
    ],
    screenshots: [
      { file: "contacts-list-full.png", caption: "Contacts list — Persons + Companies + Suppliers with KPIs, Search, Filters, Map toggle, Import & Add Contact", details: ["KPI tiles: Total / Persons / Companies", "Search bar: full-text across name, email, phone, company", "Toolbar: + Add Contact, Bulk Import, Map / List toggle, Filters, Column picker, CSV export"] },
      { file: "contacts-list.png", caption: "Contacts list — compact table view with row actions" },
      { file: "contacts-add-person.png", caption: "Add Contact (Person)", details: ["Identity: First / Last name, Position, Email, Phone, Mobile", "Address: Street, City, Country, Postal code + map preview", "Fiscal: CIN, Tax ID (Matricule Fiscale)", "Work info: Department, Hire date, Status, Tags"] },
      { file: "contacts-detail-person.png", caption: "Person detail — 360° tabs", details: ["Tabs: Overview / Installations / Offers / Sales / Service Orders / Purchases / Notes", "Header card: avatar, name, status, type, favorite toggle", "Overview: contact info, address with embedded map, recent activity feed"] },
      { file: "contacts-detail-company.png", caption: "Company detail", details: ["Company-specific fields: Legal name, Tax ID, Industry, Size, Website", "Linked installations / offers / sales / service orders / purchases tabs"] },
      { file: "contacts-detail-supplier.png", caption: "Supplier detail", details: ["Supplier-only fields: payment terms, RS rate category, bank account", "Purchases tab: PO history, receipts, invoices, outstanding balance", "Performance: on-time delivery %, avg lead time, total spend YTD"] },
      { file: "contacts-edit-modal.png", caption: "Edit Contact modal", details: ["Switch type Person ↔ Company ↔ Supplier", "Address with interactive map: click to drop pin or 'Use My Location'", "Unsaved-changes guard if you try to close"] },
      { file: "contacts-suppliers-list.png", caption: "Suppliers list (/dashboard/suppliers)", details: ["Same UX as Contacts list, scoped to type=Supplier", "Extra columns: RS category, Outstanding balance, Last PO date"] },
      { file: "contacts-add-supplier.png", caption: "Add Supplier", details: ["Supplier Type radio: Person / Company", "Supplier-specific: RS category, default payment terms, bank IBAN"] },
      { file: "contacts-import.png", caption: "Bulk Import Contacts", details: ["Two modes: Dynamic Import (any Excel headers) or Structured Import (fixed template)", "Drag-and-drop file zone with size + row count preview"] },
      { file: "contacts-filters.png", caption: "Advanced Filters drawer", details: ["Status: Active / Inactive; Type: Person / Company / Supplier", "Multi-select Tags filter with color chips", "Boolean filters: Favorites only, Has email, Has phone, Has geolocation"] },
      { file: "contacts-map-view.png", caption: "Contacts Map view", details: ["Markers clustered by zoom level; click marker to open mini-card", "Filter by type directly on the map toolbar"] },
      { file: "contacts-notes-modal.png", caption: "Contact Notes modal", details: ["Rich-text note body, author + timestamps", "Inline edit, soft-delete with undo toast"] },
      { file: "contacts-tags-manager.png", caption: "Tags manager", details: ["Color picker (10 preset palette + custom hex)", "Delete cascades to remove the tag from all contacts"] },
      { file: "contacts-delete-confirm.png", caption: "Delete Contact confirmation", details: ["Soft-delete by default (contact archived, restorable)", "Lists linked records that keep the historical reference"] },
      { file: "contacts-import-mapping.png", caption: "Dynamic Import — column mapping", details: ["Auto-detected headers from the uploaded .xlsx", "Drag headers onto target fields", "Preview first 10 rows after mapping; errors highlighted", "Duplicate strategy: Skip / Update by email / Create anyway"] },
    ],
  },
  {
    key: "articles",
    name: "Articles & Catalog",
    category: "Inventory",
    description: "Product & service catalog — the single source of truth for any line item used in Offers, Sales, Purchases, Stock and Service Orders. Each article has identity, pricing, taxation, supplier links, stock thresholds and a bulk import/export system.",
    features: [
      "Type — Product (stocked) / Service (non-stocked)",
      "Pricing — Selling price HT, Cost price, Margin %, default Discount %, VAT %",
      "Stock fields — Quantity on hand, Min/Max stock, Reorder point",
      "Suppliers — primary supplier + alternates, supplier reference, last purchase price",
      "List page — KPIs, search, filters (Category, Type, Status), Table/Grid view, bulk-select",
      "Bulk Import — Dynamic or Structured (.xlsx)",
      "Inventory Transactions — Stock In/Out/Transfer/Adjustment",
      "Audit fields — created by, updated by, soft delete",
    ],
    screenshots: [
      { file: "articles-list.png", caption: "Articles & Materials — unified catalogue with KPI cards, filters and pagination", details: ["KPI strip: Materials, Services, Low Stock, Total Items", "Columns: Type icon, Name, Reference/Category, Status, Stock, Price, Location, Actions", "Pagination with selectable page size"] },
      { file: "articles-detail.png", caption: "Article Detail — overview with stock levels, pricing and audit info", details: ["Article Information: Reference, Category, Group, Description", "Stock Levels: Current Stock, Minimum Stock, Cost/Sell Price, Location, Supplier", "Audit Information: Created/Modified Date and By"] },
      { file: "articles-edit-modal.png", caption: "Edit Article modal — Material/Service toggle with full property form", details: ["Article Type tabs: Material / Service", "Required fields: Name, Category, Status", "Inventory Details: Current Stock, Minimum Stock Level, Cost Price, Sell Price", "Sourcing: Supplier, Location, Group, Sub-Location, Notes"] },
      { file: "articles-edit.png", caption: "Edit Article — expanded form view with all fields" },
      { file: "articles-transfer-modal.png", caption: "Record Inventory Transaction — stock in / out / transfer dialog", details: ["Transaction Type: Stock In, Stock Out, Transfer, Adjustment, Damaged, Lost, Return", "Quantity, To Location, Reason (required for audit trail)", "Reference field for PO / SO / invoice numbers"] },
      { file: "articles-transaction.png", caption: "Record Inventory Transaction — Stock In / Out / Transfer / Adjustment detail", details: ["Ties to reference documents (PO, SO)", "All transactions feed the Articles audit log and Stock Management history"] },
      { file: "articles-inventory-services.png", caption: "Inventory & Services — unified view with Filters and grid/list toggle", details: ["KPI strip: Total Items, Materials, Services, Low Stock", "Multi-select checkboxes for bulk actions", "Service rows show duration instead of stock"] },
      { file: "articles-stock-management.png", caption: "Stock Management — gauge cards per material with quick actions", details: ["Circular gauge showing % of capacity per material", "Card actions: Add Stock, Remove Stock, View History", "Status: Good (≥ min), Low (< min), Critical (= 0)"] },
      { file: "articles-import.png", caption: "Import Articles — Dynamic Import (map your own columns)", details: ["Upload an Excel file with custom headers and map them after upload", "Supported formats: Excel (.xlsx, .xls)"] },
      { file: "articles-import-structured.png", caption: "Import Articles — Structured Import with templates", details: ["Download Empty Template or Template with Examples", "Drop the filled template to bulk-create or update articles"] },
      { file: "articles-filters.png", caption: "Inventory & Services — Filters drawer expanded", details: ["Filter by Type (All / Material / Service) and Location", "Combine with Search and pagination for fast lookup"] },
      { file: "articles-delete-confirm.png", caption: "Delete confirmation — irreversible action guard", details: ["'This action cannot be undone. This will permanently delete the article.'", "Cancel (secondary) and Delete (destructive primary)"] },
      { file: "articles-error-state.png", caption: "Error boundary — graceful fallback when a page crashes", details: ["'We hit an unexpected snag' centered card", "Go back (primary) and Return home actions", "Reference ID shown for support traceability"] },
    ],
  },
  {
    key: "stock-management",
    name: "Stock Management",
    category: "Inventory",
    description: "Multi-warehouse stock control. Tracks every movement (in/out/adjust/transfer), supports per-warehouse quantities, low-stock alerts and replenishment proposals.",
    features: [
      "Warehouses — multiple physical or logical locations per company",
      "Stock transactions log — date, type, source document, quantity, before/after balance",
      "Manual adjustment — single-line or bulk with reason picklist",
      "Inter-warehouse transfer — two-step confirm (sent / received)",
      "Reservations — soft-reserve stock for an Offer/Sale/Service Order",
      "Low-stock alerts — daily job compares quantity vs min stock",
      "Replenishment proposal — auto-generates draft Purchase Orders",
    ],
    screenshots: [
      { file: "stock-management-grid.png", caption: "Stock Management — at-a-glance grid with current levels", details: ["Top KPI strip: Total Materials, Critical, Low Stock and Healthy Stock counts", "Each card: name, group, fill-level gauge, current quantity, status badge", "Per-card actions: Add Stock, Remove Stock, View History"] },
      { file: "stock-management-filters.png", caption: "Filters bar — narrow the grid by Status and Location", details: ["Status: All / Critical / Low Stock / Healthy", "Location: filter by warehouse, vehicle or any configured stock location"] },
      { file: "stock-management-replenish.png", caption: "Replenish Stock dialog — Add or Remove with optional notes", details: ["Toggle between Add Stock and Remove Stock", "Shows current quantity, asks for delta and optional notes", "Submitting writes a fully-audited row to the Stock Transactions log"] },
      { file: "stock-management-history.png", caption: "Stock Transaction History — full audit log per material", details: ["Lists every add, remove, sale deduction, transfer and adjustment", "Each entry records previous → new stock, reason, reference, performer and timestamp"] },
    ],
  },
  {
    key: "purchases",
    name: "Purchases (Procure-to-Pay)",
    category: "Procurement",
    description: "End-to-end Procure-to-Pay workflow tailored for the Tunisian fiscal context: Purchase Order → Goods Receipt → Supplier Invoice → Payment, with three-way matching, retenue à la source (RS), TEJ / Facture en Ligne compliance, and a full audit trail.",
    features: [
      "Purchase Orders — multi-line items, payment terms, fiscal stamp, auto totals",
      "PO statuses — Draft → Pending → Approved → Sent → Partially Received → Received → Closed → Cancelled",
      "Goods Receipts — full or partial reception against a PO, automatic stock movement creation",
      "Supplier Invoices — 3-way match, retenue à la source (RS) computed automatically",
      "Compliance dashboard — RS yearly total, Facture en Ligne counts, TEJ sync status",
      "Reports — Supplier Performance, Price Evolution, Invoice Aging, Monthly Spending",
      "Audit Log — every create/update/delete with user, timestamp and description",
    ],
    screenshots: [
      { file: "purchases-overview.png", caption: "Purchases hub — KPIs + recent activity", details: ["KPI tiles: Open POs, Pending receipts, Unpaid invoices, This-month spend", "Quick links: New PO, New Receipt, New Invoice, Compliance, Reports, Audit Log", "Compliance widget: RS YTD, Facture en Ligne pending, TEJ sync status"] },
      { file: "purchases-orders.png", caption: "Purchase Orders list", details: ["Columns: PO #, Supplier, Order date, Expected delivery, Status, Total HT, TVA, Total TTC", "Status pipeline as colored chips (Draft / Pending / Approved / Sent / Partially Received / Received / Closed / Cancelled)", "Row actions: View, Edit, Duplicate, Cancel, Generate Receipt, Generate Invoice, Download PDF"] },
      { file: "purchases-orders-add.png", caption: "Create Purchase Order", details: ["Header: Supplier, PO #, Order date, Expected delivery, Currency, Payment terms", "Line items: Article, Supplier ref, Description, Qty, Unit, Unit price, Discount %, Tax %", "Auto totals: Subtotal HT, Discount, Tax breakdown, Fiscal stamp, Grand Total TTC", "Save as Draft, Submit for approval, or Approve & Send"] },
      { file: "purchases-receipts.png", caption: "Goods Receipts", details: ["Match against PO: select open POs, receive partial or full quantities per line", "Auto-creates stock movements (IN) for each received line", "Status: Draft / Posted / Cancelled; PDF export"] },
      { file: "purchases-invoices.png", caption: "Supplier Invoices", details: ["Three-way match: invoice ↔ PO ↔ receipt; mismatches highlighted in red", "Retenue à la Source (RS): rate auto-picked per supplier category; withheld + net to pay computed", "Payment status: Unpaid / Partially paid / Paid; record payments with date, method, reference"] },
      { file: "purchases-compliance.png", caption: "Fiscal Compliance dashboard", details: ["Retenue à la Source: YTD total withheld, breakdown by supplier and rate", "Facture en Ligne: counts of Pending / Sent / Validated invoices", "TEJ Integration: connection status, last sync timestamp, queued items"] },
      { file: "purchases-reports.png", caption: "Reports hub", details: ["Supplier Performance: on-time delivery %, avg lead time, total spend", "Price Evolution: per article + supplier price history line chart", "Supplier Invoice Aging: outstanding amounts grouped by buckets (Current / 1-30 / 31-60 / 61-90 / 90+ days)"] },
      { file: "purchases-audit-log.png", caption: "Purchases Audit Log", details: ["Columns: Date/time, User, Entity, Entity #, Action, Description", "Filters: User, Entity type, Action, Date range", "Click row to open the diff (before/after JSON) for full traceability"] },
    ],
  },
  {
    key: "service-orders",
    name: "Service Orders",
    category: "Operations",
    description: "End-to-end field service order lifecycle. Manages Jobs, Dispatches, Time & Expenses, Materials, Attachments, Checklists and Activity from creation through invoicing.",
    features: [
      "Status flow: Pending → Ready for Planning → Scheduled → In Progress → Technically Completed → Ready for Invoice → Invoiced → Closed",
      "Three view modes — Table, Cards, Map",
      "Detail tabs — Overview, Jobs, Dispatches, Time & Expenses, Materials, Attachments, Checklists, Activity",
      "Auto-creation from Sales (when sale contains service items)",
      "PDF report generation and email sending",
      "Geolocation-based Map view",
    ],
    screenshots: [
      { file: "service-orders-list.png", caption: "Service Orders — Table view", details: ["KPI strip: Total Orders, Active, Completed, Total Value", "Columns: Order #, Company, Customer, Status badge, Related Sale, Created date", "Toolbar: search, Filters, three view modes (Cards / Table / Map), Create"] },
      { file: "service-orders-filters.png", caption: "Inline filters", details: ["Filter by Status, Priority, Technician, and time range (Any / Today / Week / Month / Custom)", "Clear button resets all filters"] },
      { file: "service-orders-cards-view.png", caption: "Cards view", details: ["Each card: order number, status badge, customer, technician count, created date, total amount", "Quick actions: View, Generate report, Delete"] },
      { file: "service-orders-map-view.png", caption: "Map view", details: ["Geo-located service orders pinned on the map", "Click markers for details; 'Open in Maps' link for navigation", "Below the map: same card list"] },
      { file: "service-orders-actions-menu.png", caption: "Row actions menu", details: ["Per-row: View Details, Delete Order"] },
      { file: "service-orders-create.png", caption: "Create Service Order", details: ["Pick the Target Company (multi-tenant)", "Optionally link to an existing Offer or Sale", "Choose a customer (Person or Company) from contacts"] },
      { file: "service-orders-detail-overview.png", caption: "Detail — Overview tab", details: ["Header: order #, status flow stepper, header actions (PDF report, email, share, convert to invoice)", "Service Order Details: ID, related sale, description, priority, contact, service type, estimated cost, target completion date"] },
      { file: "service-orders-detail-jobs.png", caption: "Detail — Jobs tab", details: ["Jobs grouped by Installation (or 'No installation')", "Per-job: title, code, Status (Dispatched / Unscheduled / In Progress / Completed), Work Type"] },
      { file: "service-orders-detail-dispatches.png", caption: "Detail — Dispatches tab", details: ["Each dispatch row: dispatch #, status, priority, assigned technician, scheduled date and time window", "View Schedules to see all dispatches on the planner"] },
      { file: "service-orders-detail-time-expenses.png", caption: "Detail — Time & Expenses tab", details: ["Two parallel logs: Time Tracking (start/end, technician, duration) and Expense Tracking", "Each entry linked back to its source dispatch", "Add Time / Add Expense buttons; per-row edit and delete"] },
      { file: "service-orders-detail-materials.png", caption: "Detail — Materials tab", details: ["Materials Used table: Material, Installation, Qty, Unit Cost, Total", "Add Material picks from the catalog and deducts from stock"] },
      { file: "service-orders-detail-attachments.png", caption: "Detail — Attachments tab", details: ["Drag & drop documents (photos, PDFs, signed forms) or click Add Document"] },
      { file: "service-orders-detail-checklists.png", caption: "Detail — Checklists tab", details: ["Attach a Dynamic Form as a checklist; technicians fill it from the field app"] },
      { file: "service-orders-detail-activity.png", caption: "Detail — Activity tab", details: ["Full audit trail: every status change, expense, time entry, dispatch action and user note", "Add Note action to leave manual annotations"] },
    ],
  },
  {
    key: "hr",
    name: "Human Resources (HR)",
    category: "HR",
    description: "Complete HR suite tuned for Tunisian payroll law (CNSS, CSS, IRPP, abattements). Manages the full employee lifecycle — Recruitment → Hire → Attendance → Leaves → Payroll → Bonuses → CNSS declaration → Performance review.",
    features: [
      "Employee directory with payroll-readiness segmentation",
      "Attendance — Daily entries, List & Matrix views",
      "Leaves — request workflow, calendar, balances, manager approvals",
      "Payroll runs — CNSS, CSS, IRPP progressive brackets, PDF payslips",
      "Bonuses & Deductions — typed entries, period-bound, feed payroll",
      "CNSS — configurable rates, monthly declaration, CSV export",
      "Departments & Org Chart",
      "Performance Management — Goals, Review Cycles, Reviews",
      "Recruitment pipeline — Kanban from Applied → Hired",
    ],
    screenshots: [
      { file: "hr-dashboard.png", caption: "HR dashboard — KPIs and shortcuts to every HR sub-module", details: ["KPI tiles: Active employees, Pending leaves, Attendance today (%), Estimated monthly payroll (TND)", "Quick actions: Add employee, Run payroll, Approve leaves, Export CNSS", "Charts: Headcount evolution, Absences by type, Payroll cost trend"] },
      { file: "hr-employees.png", caption: "Employees list with payroll-readiness segmentation", details: ["Columns: Employee (avatar + name), Position, Department, Contract type, Salary, CNSS #, Status", "Tabs: All / Payroll-ready / Incomplete / On leave / Terminated", "Row actions: Open detail, Edit, Generate payslip, Add bonus/deduction, Mark as terminated"] },
      { file: "hr-employee-detail.png", caption: "Employee detail — multi-tab file (Profile / Salary / CNSS / Bonuses / Leaves / Documents)", details: ["Profile: identity, CIN, contact, address, hire date, contract end date, manager, department", "Salary: base gross, allowances (transport, meal, housing), abattements", "CNSS: CNSS number, affiliation date, employee + employer rate snapshot"] },
      { file: "hr-attendance.png", caption: "Monthly attendance — List & Matrix views", details: ["Matrix view: rows = employees, columns = days; color-coded statuses (present / absent / late / remote / leave)", "Period picker (month/year), department filter, employee search", "Auto-computed totals: worked hours, overtime, late count, absences"] },
      { file: "hr-attendance-add-modal.png", caption: "Add Attendance Entry modal", details: ["Fields: Employee, Date, Check-in, Check-out, Break (min), Status (present/absent/late/remote)", "Optional: Notes, Overtime hours (auto-feeds payroll)", "Prevents overlapping entries on the same day"] },
      { file: "hr-leaves.png", caption: "Leaves — Calendar / List / Balances / Approvals", details: ["Calendar tab: team calendar with overlap detection (max simultaneous absences per dept)", "List tab: every request with type, period, days, status (Pending / Approved / Rejected)", "Balances tab: per leave type — entitled, taken, remaining", "Approvals tab: manager queue with one-click approve/reject + comment"] },
      { file: "hr-payroll.png", caption: "Payroll runs — Tunisian 2025 law (CNSS / IRPP / CSS)", details: ["Period selector, generate Draft pulling Employees + Attendance + Bonuses + Leaves", "Per-employee: Gross, Overtime, CNSS, Taxable gross, Abattement, IRPP, CSS, Net", "Workflow: Draft → Confirmed (locks values) → Paid"] },
      { file: "hr-bonuses.png", caption: "Bonuses, allowances, deductions, reimbursements", details: ["Entry types: Bonus / Allowance / Deduction / Reimbursement (taxable flag per type)", "Running totals row: Bonuses, Deductions, Net effect — feeds the next payroll run"] },
      { file: "hr-cnss.png", caption: "CNSS rates & monthly declaration", details: ["Rate config: employee % + employer % with effective-from date and history table", "Monthly declaration table: per CNSS number — gross, base, employee share, employer share, total", "Export CSV in the format expected by the CNSS portal"] },
      { file: "hr-departments.png", caption: "Departments & org chart", details: ["List: Code, Name, Manager, Employee count, Created at", "Org chart view: hierarchical tree with manager avatars", "CRUD: add / edit / delete department; reassign employees on delete"] },
      { file: "hr-performance.png", caption: "Performance Management — Goals / Cycles / Reviews", details: ["Goals: per employee, weighted, with target date, progress %, status (On track / At risk / Done)", "Review Cycles: define a period, include departments, set template", "Reviews: self-review + manager review, rating per competency, free-text feedback, sign-off"] },
      { file: "hr-recruitment.png", caption: "Recruitment pipeline", details: ["Job openings: title, department, location, contract type, status (Open / On hold / Closed)", "Applicants per job with stage: Applied → Screening → Interview → Offer → Hired / Rejected", "Drag-and-drop kanban to move applicants across stages"] },
      { file: "hr-reports.png", caption: "HR reports with CSV + Excel export", details: ["Employee cost: Gross + Bonuses − Deductions + Employer CNSS = Total cost", "Payroll report: aggregate per period", "CNSS report: monthly contributions, year-to-date, by employee", "Absences report: count + days per leave type, per department"] },
      { file: "hr-settings.png", caption: "HR settings", details: ["CNSS rates: timeline of (employee %, employer %, effective date)", "Public holidays: Tunisian calendar pre-seeded, add custom company days off", "General: currency (TND), locale (fr-TN), fiscal year, default working week, overtime multiplier"] },
    ],
  },
  {
    key: "dynamic-forms",
    name: "Dynamic Forms",
    category: "Productivity",
    description: "Visual drag-and-drop form builder. Create bilingual (EN/FR) forms with 15+ field types, release them for internal or public use, collect submissions, export responses and generate branded PDFs.",
    features: [
      "15+ field types: Text, Textarea, Number, Email, Phone, Checkbox, Radio, Dropdown, Date, Signature, Rating, Content Block, Page Break",
      "Bilingual (EN/FR) forms with language switcher",
      "Draft / Released / Archived status workflow",
      "Public link for unauthenticated submission",
      "Response inbox — CSV/Excel export, PDF per response",
      "Convert responses to CRM records (Contact, Offer, Sale)",
      "Attach as checklist to Service Orders, Dispatches, Offers",
    ],
    screenshots: [
      { file: "dynamic-forms-list.png", caption: "Dynamic Forms — list of all forms with status, field count and last updated", details: ["Columns: Name, Status (Draft / Released / Archived), Fields count, Last Updated, Share, Actions", "Toolbar: Search, Status filter, + Create Form", "Click a row to open the form preview"] },
      { file: "dynamic-forms-actions-menu.png", caption: "Row actions menu — Preview, Edit, Duplicate, View Responses, Make Public, Archive, Delete", details: ["Edit is blocked on Released forms — restore to Draft first", "Make Public exposes the form at /public/forms/:slug for unauthenticated submission", "Delete is a soft delete (form goes to Archived state)"] },
      { file: "dynamic-forms-create-basic.png", caption: "Create New Form — bilingual basic info (EN/FR) and category", details: ["Side-by-side English & French content blocks: Name (required) and Description", "Category picker driven by Lookups with inline 'Manage' shortcut", "Save button creates a Draft form, then opens the full builder"] },
      { file: "dynamic-forms-builder-palette.png", caption: "Form Builder — Field Palette with all available field types", details: ["Basic Fields: Text Input, Text Area, Number, Email, Phone", "Choice Fields: Checkbox (Yes/No), Radio Buttons (single), Dropdown Select", "Advanced Fields: Date Picker, Section Header, Signature, Star Rating, Content Block", "Layout & Structure: Page Break (split into multi-step forms)", "Right pane: live Form Preview with Preview / Structure toggle"] },
      { file: "dynamic-forms-preview.png", caption: "Form Preview — branded rendering used for sharing and PDF export", details: ["Header: company logo, 'Completed on' date, EN/FR language toggle", "Body: title, description, then each field with its label and input", "Footer: form name, copyright, page count", "Top-right: Save Response and Download PDF"] },
      { file: "dynamic-forms-responses.png", caption: "Form Responses — every submission with submitter, timestamp and linked entity", details: ["Columns: #, Submitted By, Submitted At, Linked Entity, Actions (view / export PDF)", "Top-right actions: Export to Entity and Export Responses (CSV / Excel)"] },
      { file: "dynamic-forms-response-detail.png", caption: "Response detail modal — read-only view of one submission with PDF export", details: ["Header: Submitted By, Submitted At", "One card per field showing the answered value (or 'Not answered')", "Export as PDF button generates a branded PDF of that single response"] },
    ],
  },
  {
    key: "workflow",
    name: "Workflow Automation",
    category: "Operations",
    description: "Visual no-code/low-code automation engine. Design end-to-end business processes — wire entity Triggers to Actions through Conditions, Loops, Switches and Parallel branches. Includes an AI workflow builder, live execution debugger, version history and real-time SignalR streaming.",
    features: [
      "Visual canvas — React-Flow-based builder with pan/zoom, mini-map, snap-to-grid, multi-select, undo/redo",
      "Node palette — Triggers, Entities, Actions, Conditions, Integrations — searchable",
      "Trigger types — Webhook, Scheduled (CRON), Status-change (Offer/Sale/SO/Dispatch), Entity-created",
      "Action nodes — Create Sale/SO/Dispatch, Update Status, Send Email, HTTP Request, Notify",
      "Condition nodes — IF/Else, Switch, Loop, Parallel, Try/Catch",
      "Build with AI — natural-language to graph generation",
      "Workflow versioning — every Save bumps version; restore prior versions",
      "Live execution debugger — color-coded nodes with input/output JSON per step",
      "Execution History — paginated list of every run with status and timing",
      "Dispatch Board — Kanban by status with Calendar / Map views",
      "Workflow Calendar — plan interventions with drag-and-drop rescheduling",
    ],
    screenshots: [
      { file: "workflow-builder-overview.png", caption: "Workflow Builder — three-pane layout (Node Palette / Canvas / Toolbar)", details: ["Top-right toolbar: Build with AI, Debug, Duplicate, Export, Import, Save, Edit, Stop", "Left palette: Triggers (6), Entities (5), Actions (8), Conditions, Integrations", "Canvas: React-Flow nodes color-coded by type with smart edges", "Pre-built default business workflow: Offer Accepted → Create Sale → ... → Sale Closed"] },
      { file: "workflow-canvas-loaded.png", caption: "Live canvas — full default business workflow with palette open", details: ["Shows the canonical 'order-to-cash + service' flow", "Triggers in orange, Conditions in yellow, Actions in green/blue", "Each node displays its type chip, FROM/TO statuses and 1-line summary"] },
      { file: "workflow-ai-builder.png", caption: "Build with AI — natural-language to graph", details: ["4 starter prompts: confirmed-sale email, offer follow-up after 3 days, dispatch-completed notification, daily 9am summary", "Free-text 'Describe your workflow…' input", "Apply to Canvas commits the generated nodes/edges in one click"] },
      { file: "workflow-ai-builder-modal.png", caption: "Build with AI — full modal with starter prompts", details: ["Header 'Build with AI' with branded hex icon", "4 starter cards with pre-written prompts", "Free-text textarea + send button; Reset and Apply to Canvas footer actions"] },
      { file: "workflow-edit-mode.png", caption: "Edit mode — protected canvas with explicit Save / Cancel", details: ["Yellow 'Editing' badge while edit mode is on", "Cancel discards changes (with unsaved-changes guard)", "Save bumps the workflow version", "All edits gated behind the Edit button"] },
      { file: "workflow-version-history.png", caption: "Version History — restore, compare, fork prior versions", details: ["Lists every version with author, date, status and short diff summary", "Restore promotes an old version to active; Compare opens side-by-side graph diff", "Fork creates a new Draft from any prior version"] },
      { file: "workflow-version-tooltip.png", caption: "Version History tooltip on the clock icon", details: ["Hovering the clock icon shows 'Version History — Current Workflow'", "Click opens the full version history popover"] },
      { file: "workflow-palette-full.png", caption: "Node palette — Conditions, Communication, AI and Integration categories", details: ["Conditions: If/Else, Switch, Loop", "Communication: Send Notification, Email, Request Approval, Delay, Human Input Form, Wait for Event", "AI: AI Email, AI Analyzer, AI Agent, Custom LLM", "Integration: Dynamic Form, Data Transfer, HTTP Request, Code (JavaScript)"] },
      { file: "workflow-calendar.png", caption: "Workflow Calendar — Mois / Semaine / Jour / Tableau of interventions", details: ["Period switcher + alternative table view", "Planifier intervention CTA opens the dispatch creation dialog", "Drag-and-drop reschedule; conflict highlighting; intelligent planning hints"] },
      { file: "workflow-calendar-empty.png", caption: "Workflow Calendar — empty state before interventions are planned" },
      { file: "workflow-dispatch-board.png", caption: "Dispatch Board — Kanban by status with Calendar / Map views", details: ["Columns: Scheduled, En route, In progress, Finished, Cancelled", "Drag a card to change status; writes to /api/dispatches", "Inventory search; Calendar view & Map view (Mapbox/Leaflet) toggles"] },
      { file: "workflow-dispatch-board-empty.png", caption: "Dispatch Board — empty state before any dispatches are created" },
    ],
  },
  {
    key: "external",
    name: "External Endpoints",
    category: "Integrations",
    description: "Receive and process inbound webhooks and form submissions from external sources. Each endpoint gets a unique signed URL and API key. Inbound payloads are logged, reviewable and convertible to CRM records.",
    features: [
      "Unique slug URL per endpoint (auto-generated)",
      "API key with reveal / copy / rotate actions",
      "Quick-start templates: Landing page (vehicle quote), Generic contact form, B2B Lead capture, Webhook passthrough",
      "Allowed HTTP methods per endpoint (GET/POST/PUT/DELETE)",
      "Inbound log: Date/time, Method, Source IP, Status code, Payload preview",
      "Convert inbound payload to Offer / Sale / Contact in one click",
      "Bulk: Mark all as read, Clear all logs, Export CSV",
    ],
    screenshots: [
      { file: "external-list.png", caption: "External Endpoints list", details: ["KPIs: Total Endpoints, Active, Received Today, Total Received", "Table: Name, Slug URL, Status (Active/Inactive toggle), Methods, Received count, Last received", "Search + filter; quick actions: View, Edit, Copy URL, Test, Delete"] },
      { file: "external-create.png", caption: "Create Endpoint — templates + custom", details: ["Quick-start templates: Landing page, Generic contact form, B2B Lead capture, Webhook passthrough", "Custom mode: name, description, allowed HTTP methods, Active toggle, optional JSON Schema", "Auto-generated slug + API key on save"] },
      { file: "external-detail.png", caption: "Endpoint detail — Public URL, API key, inbound log", details: ["Public URL: full https:// slug URL, one-click copy, QR code for mobile testing", "API key: hidden by default, Reveal / Copy / Rotate actions", "Inbound log: Date/time, Method, Source IP, Status code, Payload preview", "Bulk: Mark all as read, Clear all logs, Export CSV"] },
      { file: "external-edit.png", caption: "Edit Endpoint", details: ["Editable: name, description, allowed methods, Active toggle, schema", "Slug is read-only after creation", "Rotate API key with confirmation (old key invalidated immediately)", "Danger zone: Delete endpoint (cascade deletes inbound log)"] },
    ],
  },
  {
    key: "lookups",
    name: "Lookups",
    category: "System",
    description: "Centralized configuration for all dropdown lists and pick-lists used across modules. Manage values for Task Status Types, Priorities, Article Categories, Leave Types, Locations, Work Types and more.",
    features: [
      "Two-pane layout — left category browser, right item list",
      "Categories: Task Status Types, Priorities, Article Categories, Article Groups, Service Categories, Leave Types, Locations, Offer Sources, Work Types, Expense Types, Project Types, Form Categories, Document Types",
      "Add / Edit / Delete items with name, active toggle, sort order",
      "Default value per category (star toggle)",
      "Active/Inactive status — inactive values preserved on historical records",
      "Extra fields per category (Paid for Leave Types, Completed for Task Statuses)",
    ],
    screenshots: [
      { file: "lookups-overview.png", caption: "Lookups — category browser (left) with empty detail pane", details: ["Two-pane layout: left list of all lookup categories, right detail pane", "Each category row shows name and item count", "Sidebar entry 'Lookups' under SYSTEM group"] },
      { file: "lookups-task-status.png", caption: "Task Status Types — values table", details: ["Columns: Default (star toggle), Name, Completed, Status (Active/Inactive), Actions", "Star = mark default value (one per category)", "Status badge: Active values are pickable in the app"] },
      { file: "lookups-priorities.png", caption: "Priorities — with default value highlighted", details: ["Used by Tasks, Offers, Service Orders, Dispatches and Deals priority pickers"] },
      { file: "lookups-article-categories.png", caption: "Article Categories — taxonomy used by Articles & Inventory", details: ["14 entries (BODY, CLEANING, DETAILING, ELECTRICAL, INSPECTION, MECHANICAL, PAINTING…)", "Drives Articles module filtering and reporting"] },
      { file: "lookups-article-groups.png", caption: "Article Groups — secondary grouping", details: ["18 entries; orthogonal to Categories, used for pricing groups and stock segmentation"] },
      { file: "lookups-service-categories.png", caption: "Service Categories — applied to service-type articles & service orders", details: ["10 entries (Electrical & Diagnostics, Inspection & Support, Maintenance & Care, Mechanical, Painting & Body…)"] },
      { file: "lookups-leave-types.png", caption: "Leave Types — extra Paid/Unpaid column for HR payroll integration", details: ["Paid badge: drives whether the leave deducts from salary in payroll runs"] },
      { file: "lookups-locations.png", caption: "Locations — physical locations / branches used across modules", details: ["Used by Stock Management, Dispatcher and Service Orders to attach a site"] },
      { file: "lookups-list-extended.png", caption: "Full category list — all lookup categories visible", details: ["Scrolled view showing remaining categories: Offer Sources, Installation Categories, Work Types, Expense Types, Project Types, Form Categories, Document Types"] },
      { file: "lookups-add-item.png", caption: "Create New Item dialog", details: ["Name (required), Active toggle, Sort Order", "Some categories add extra fields (Paid for Leave Types, Completed for Task Statuses)"] },
      { file: "lookups-edit-item.png", caption: "Edit Item dialog — same shape as Create, prefilled", details: ["Renaming a value updates it everywhere it is referenced", "Toggle Active off to retire a value without breaking historical records"] },
    ],
  },
  {
    key: "scheduling",
    name: "Dispatcher & Scheduler",
    category: "Operations",
    description: "Interactive drag-and-drop planner for technician dispatch scheduling. Swimlane view with technician rows and time columns, supporting 1d/3d/5d/7d/14d/30d time horizons.",
    features: [
      "Swimlane timeline — technician rows × hour columns",
      "Time horizons — 1d / 3d / 5d / 7d / 14d / 30d",
      "30-day monthly calendar with technician avatars per day",
      "Drag-drop to reschedule or reassign jobs",
      "Resize job pills to extend or shorten duration",
      "Real-time orange line marking the current time",
      "Unassigned Service Orders right rail with search",
      "Conflict detection and non-working time hatching",
      "Rule-based auto-planner (Manage Planning)",
    ],
    screenshots: [
      { file: "planner-timeline-3d.png", caption: "Planner — 3-day timeline view with technician swimlanes", details: ["Toolbar: Today shortcut, navigation, date-range picker, Range tabs (1d/3d/5d/7d/14d/30d), Zoom in/out, Status filter", "Left column: technician roster — avatar, name, availability", "Grid: hours 08–17 per day, vertical orange line marks the current time", "Job pills: colored bar with priority dot + label anchored to hour slot", "Right rail: Service Orders panel with toggle 'Service Orders / Per Installation'"] },
      { file: "planner-timeline-7d.png", caption: "7-day view — full week with weekend Day Off highlighting", details: ["Same swimlane grid expanded across 7 days (Wed → Tue)", "Weekends rendered with a soft red overlay and a 'Day Off' chip per technician row"] },
      { file: "planner-month-30d.png", caption: "30-day overview — monthly calendar with technician avatars per day", details: ["Monthly grid (Sun → Sat) showing the full 30-day window", "Each day cell stacks the avatars of technicians with at least one dispatch", "Today highlighted with brand orange in the day number badge", "Click any day cell to drill back into the daily / 3-day timeline"] },
    ],
  },
  {
    key: "settings",
    name: "Settings",
    category: "System",
    description: "Application settings covering Personal (Profile, Company, Security, Preferences, Offline Data) and Administration (Companies, Users, Roles, Integrations, Subscription, System Config, Sync History).",
    features: [
      "Profile — avatar, display name, contact details, language, timezone",
      "Company — branding, logo, legal name, Tax ID, default currency",
      "Security — password change, active session management",
      "Preferences — theme (Light/Dark/System), accent color, layout density",
      "Offline Data — per-module cache toggles, last refresh timestamp",
      "Companies — multi-tenant company manager, pin default company",
      "Users — invite, edit, deactivate users; role assignment",
      "Roles — RBAC with fine-grained permission matrix",
      "Integrations — connected apps and API keys",
      "Subscription — plan details, billing, usage",
      "System Config — application-wide toggles",
      "Sync History — audit of data sync operations",
    ],
    screenshots: [
      { file: "settings-01-profile.png", caption: "Profile section — avatar, identity & contact", details: ["Avatar upload (PNG/JPG, < 2 MB)", "First name, Last name, Email, Phone, Job title (required fields marked)", "Language (EN/FR) and Timezone selectors", "Save changes / Cancel actions"] },
      { file: "settings-02-company.png", caption: "Company branding & identity", details: ["Company logo (used on PDFs, sidebar, login screen)", "Company name, Website, Phone, Industry, Default currency", "Appears in invoices and emails"] },
      { file: "settings-03-security.png", caption: "Password change form", details: ["Current password, New password (min 8 chars, strength meter), Confirm new password", "Update password re-authenticates and rotates the JWT; other sessions invalidated"] },
      { file: "settings-04-preferences-top.png", caption: "Theme, accent color & layout density", details: ["Theme: Light · Dark · System (follows OS)", "Primary color: choose accent — updates CSS variables live", "Layout style: Compact · Comfortable", "Sidebar collapsed toggle persisted in localStorage"] },
      { file: "settings-05-offline-data.png", caption: "Per-module offline cache toggles", details: ["Per-module toggles: Contacts, Articles, Offers, Sales, Service Orders, HR", "Last cache refresh timestamp", "Refresh now (forces re-pull) and Clear cache buttons"] },
      { file: "settings-06-companies.png", caption: "Companies list with pinned & target indicators", details: ["Multi-tenant company manager", "Pin icon to set as default Target Company on next login", "Edit, Delete (soft-deletes, data retained 30 days)"] },
      { file: "settings-06b-companies-new-modal.png", caption: "New Company modal", details: ["Company name, Legal name, Tax ID, Country, Default currency, Logo (optional)", "Create provisions the company and switches the Target Company picker to it"] },
      { file: "settings-07-users.png", caption: "Users table — search, filters, status", details: ["Full-text search on name + email", "Filter by role and active/inactive status", "Row: Edit (update profile, role, status), Deactivate (revokes access, preserves history)"] },
      { file: "settings-07b-users-create-modal.png", caption: "Create User modal", details: ["First name, Last name, Email, Role (drives permissions), Initial password, Send invite email toggle", "If blank password: sends invitation email with sign-in link"] },
      { file: "settings-08-roles.png", caption: "Roles — RBAC role list", details: ["Each role defines what its members can view, create, edit and delete across all modules", "Built-in roles: Admin, Manager, User, Technician (read-only for field operations)"] },
      { file: "settings-08b-roles-create-modal.png", caption: "Create Role modal", details: ["Role name, description, and permission template picker", "Permissions can be fine-tuned per module after creation"] },
      { file: "settings-08c-roles-actions-menu.png", caption: "Role row actions menu", details: ["View, Edit General Info, Edit Permissions, Duplicate, Delete"] },
      { file: "settings-08d-roles-edit-general.png", caption: "Edit Role — General Info tab", details: ["Name, description, color tag, default dashboard override"] },
      { file: "settings-08e-roles-edit-permissions.png", caption: "Edit Role — Permissions matrix", details: ["Per-module permission rows: View / Create / Edit / Delete toggles", "Modules: Dashboard, Contacts, Offers, Sales, Service Orders, Articles, Purchases, HR, Workflow, Dynamic Forms, Lookups, Settings…", "Save persists the RBAC matrix and immediately affects all users in this role"] },
      { file: "settings-09-integrations.png", caption: "Integrations — connected apps and API keys", details: ["List of connected integrations (Google, Microsoft, TEJ, etc.)", "API Key management for external integrations"] },
      { file: "settings-10-subscription.png", caption: "Subscription — plan details, billing and usage", details: ["Current plan, billing cycle, usage vs limits", "Upgrade / Downgrade / Cancel actions"] },
      { file: "settings-11-system.png", caption: "System Config — application-wide toggles", details: ["Application-wide settings and feature toggles", "Numbering settings for documents (offers, sales, purchase orders)"] },
      { file: "settings-12-sync-history.png", caption: "Sync History — audit of data sync operations", details: ["Chronological log of sync operations with status, duration and record counts"] },
    ],
  },
];

// ─── Image to Base64 ──────────────────────────────────────────────────────────

function imageToBase64(filePath) {
  if (!fs.existsSync(filePath)) return null;
  const data = fs.readFileSync(filePath);
  const ext = path.extname(filePath).slice(1).toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${data.toString("base64")}`;
}

// ─── HTML Generation ──────────────────────────────────────────────────────────

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function buildHTML() {
  // Use the Flowentra logo from src/assets; fall back to krossier if missing
  const logoPath =
    path.join(ROOT, "src", "assets", "flowentra-logo.png");
  const logoBase64 = imageToBase64(logoPath);

  const tocItems = MODULES.map(
    (m, i) =>
      `<li><a href="#module-${m.key}">${i + 1}. ${escapeHtml(m.name)}</a></li>`
  ).join("\n");

  const moduleChapters = MODULES.map((mod, modIdx) => {
    const moduleNum = modIdx + 1;
    const screenshotCards = (mod.screenshots || [])
      .map((shot, shotIdx) => {
        const imgPath = path.join(SCREENSHOTS_DIR, shot.file);
        const b64 = imageToBase64(imgPath);
        const imgTag = b64
          ? `<img src="${b64}" alt="${escapeHtml(shot.caption)}" />`
          : `<div class="img-missing">Screenshot not found: ${escapeHtml(shot.file)}</div>`;

        const detailsList =
          shot.details && shot.details.length
            ? `<ul class="details">${shot.details.map((d) => `<li>${escapeHtml(d)}</li>`).join("")}</ul>`
            : "";

        return `
        <div class="screenshot-card">
          <div class="screenshot-img">${imgTag}</div>
          <div class="screenshot-meta">
            <span class="shot-num">${moduleNum}.${shotIdx + 1}</span>
            <p class="shot-caption">${escapeHtml(shot.caption)}</p>
            ${detailsList}
          </div>
        </div>`;
      })
      .join("\n");

    const featuresList = mod.features
      ? `<ul class="features">${mod.features.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}</ul>`
      : "";

    return `
    <section class="module" id="module-${mod.key}">
      <div class="module-header">
        <div class="module-header-inner">
          <div class="module-category">${escapeHtml(mod.category)}</div>
          <h2>${moduleNum}. ${escapeHtml(mod.name)}</h2>
          <p class="module-description">${escapeHtml(mod.description)}</p>
        </div>
      </div>
      ${
        mod.features
          ? `<div class="features-section">
          <h3>Key Features</h3>
          ${featuresList}
        </div>`
          : ""
      }
      ${
        mod.screenshots && mod.screenshots.length
          ? `<div class="screenshots-section">
          <h3>Screenshots &amp; Walkthroughs</h3>
          ${screenshotCards}
        </div>`
          : ""
      }
    </section>`;
  }).join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Flowentra — Complete Documentation</title>
  <style>
    /* ── Reset ── */
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    /* ── Variables ── */
    :root {
      --orange: hsl(237 84% 67%);
      --orange-light: hsl(237 84% 97%);
      --dark: #111827;
      --muted: #6b7280;
      --border: #e5e7eb;
      --bg: #ffffff;
      --card-bg: #f9fafb;
      --page-width: 210mm;
      --font: 'Segoe UI', system-ui, -apple-system, sans-serif;
    }

    /* ── Base ── */
    html, body { background: var(--bg); color: var(--dark); font-family: var(--font); font-size: 10pt; line-height: 1.5; }

    /* ── Print settings ── */
    @page { size: A4 portrait; margin: 15mm 12mm 15mm 12mm; }
    @media print {
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .module { page-break-before: always; }
      .screenshot-card { page-break-inside: avoid; }
      a { color: inherit; text-decoration: none; }
    }

    /* ── Cover Page ── */
    .cover {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      text-align: center;
      background: linear-gradient(135deg, #fff7ed 0%, #ffffff 60%, #eff6ff 100%);
      padding: 40px;
      page-break-after: always;
    }
    .cover-logo { width: 80px; height: 80px; object-fit: contain; margin-bottom: 24px; }
    .cover-title { font-size: 36pt; font-weight: 800; color: var(--orange); letter-spacing: -1px; margin-bottom: 8px; }
    .cover-subtitle { font-size: 16pt; color: var(--muted); margin-bottom: 32px; }
    .cover-meta { font-size: 10pt; color: #9ca3af; }
    .cover-divider { width: 80px; height: 4px; background: var(--orange); border-radius: 2px; margin: 24px auto; }

    /* ── Table of Contents ── */
    .toc {
      padding: 40px 50px;
      page-break-after: always;
    }
    .toc h1 { font-size: 18pt; font-weight: 700; margin-bottom: 24px; color: var(--dark); border-bottom: 2px solid var(--orange); padding-bottom: 8px; }
    .toc ol { list-style: none; counter-reset: toc-item; }
    .toc li { counter-increment: toc-item; padding: 6px 0; border-bottom: 1px solid var(--border); display: flex; align-items: center; }
    .toc li::before { content: counter(toc-item) "."; color: var(--orange); font-weight: 700; width: 30px; flex-shrink: 0; }
    .toc a { color: var(--dark); text-decoration: none; font-size: 11pt; }
    .toc a:hover { color: var(--orange); }

    /* ── Module ── */
    .module { padding: 30px 40px; }
    .module-header { background: linear-gradient(135deg, var(--orange-light) 0%, white 100%); border: 1px solid #fed7aa; border-radius: 12px; padding: 24px 28px; margin-bottom: 24px; }
    .module-category { font-size: 8pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: var(--orange); margin-bottom: 6px; }
    .module-header h2 { font-size: 20pt; font-weight: 800; color: var(--dark); margin-bottom: 10px; }
    .module-description { font-size: 10pt; color: #374151; line-height: 1.6; }

    /* ── Features ── */
    .features-section { margin-bottom: 24px; }
    .features-section h3 { font-size: 12pt; font-weight: 700; color: var(--dark); margin-bottom: 10px; padding-left: 10px; border-left: 3px solid var(--orange); }
    .features { list-style: none; display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; }
    .features li { font-size: 9pt; color: #374151; padding: 3px 0 3px 14px; position: relative; }
    .features li::before { content: "•"; color: var(--orange); position: absolute; left: 0; font-weight: 700; }

    /* ── Screenshots ── */
    .screenshots-section h3 { font-size: 12pt; font-weight: 700; color: var(--dark); margin-bottom: 16px; padding-left: 10px; border-left: 3px solid var(--orange); }
    .screenshot-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px; overflow: hidden; margin-bottom: 20px; page-break-inside: avoid; }
    .screenshot-img { width: 100%; background: #f3f4f6; text-align: center; }
    .screenshot-img img { width: 100%; height: auto; display: block; max-height: 480px; object-fit: contain; }
    .img-missing { padding: 40px; color: var(--muted); font-size: 9pt; font-style: italic; }
    .screenshot-meta { padding: 12px 16px; }
    .shot-num { display: inline-block; background: var(--orange); color: white; font-size: 7pt; font-weight: 700; padding: 2px 6px; border-radius: 4px; margin-bottom: 6px; }
    .shot-caption { font-size: 10pt; font-weight: 600; color: var(--dark); margin-bottom: 8px; }
    .details { list-style: none; margin-top: 6px; }
    .details li { font-size: 8.5pt; color: #4b5563; padding: 2px 0 2px 12px; position: relative; }
    .details li::before { content: "›"; color: var(--orange); position: absolute; left: 0; font-weight: 700; }

    /* ── Footer ── */
    .doc-footer { text-align: center; padding: 40px; color: var(--muted); font-size: 9pt; border-top: 1px solid var(--border); margin-top: 40px; }
  </style>
</head>
<body>

<!-- Cover -->
<div class="cover">
  ${logoBase64 ? `<img src="${logoBase64}" alt="Flowentra logo" class="cover-logo" />` : ""}
  <div class="cover-title">Flowentra</div>
  <div class="cover-subtitle">Complete Application Documentation</div>
  <div class="cover-divider"></div>
  <div class="cover-meta">
    Generated on ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} &nbsp;•&nbsp;
    ${MODULES.length} modules &nbsp;•&nbsp;
    ${MODULES.reduce((acc, m) => acc + (m.screenshots?.length || 0), 0)} screenshots
  </div>
</div>

<!-- Table of Contents -->
<div class="toc">
  <h1>Table of Contents</h1>
  <ol>${tocItems}</ol>
</div>

<!-- Module Chapters -->
${moduleChapters}

<!-- Footer -->
<div class="doc-footer">
  Flowentra Application Documentation &nbsp;•&nbsp; Confidential &nbsp;•&nbsp; ${new Date().getFullYear()}
</div>

</body>
</html>`;
}

// ─── PDF Generation via MS Edge ───────────────────────────────────────────────

function findEdge() {
  const candidates = [
    "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
    "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
    process.env.LOCALAPPDATA
      ? `${process.env.LOCALAPPDATA}\\Microsoft\\Edge\\Application\\msedge.exe`
      : null,
  ].filter(Boolean);

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🔧 Building documentation HTML...");
  const html = buildHTML();
  fs.writeFileSync(OUTPUT_HTML, html, "utf8");
  const htmlSize = (fs.statSync(OUTPUT_HTML).size / 1024 / 1024).toFixed(1);
  console.log(`✅ HTML written: ${OUTPUT_HTML} (${htmlSize} MB)`);

  const edgePath = findEdge();
  if (!edgePath) {
    console.warn(
      "\n⚠️  Microsoft Edge not found. Open the HTML file in your browser and print to PDF (Ctrl+P → Save as PDF)."
    );
    console.log(`📄 HTML file: ${OUTPUT_HTML}`);
    return;
  }

  console.log(`\n🖨️  Converting to PDF using Edge headless...`);
  console.log(`   ${edgePath}`);

  const args = [
    "--headless",
    "--disable-gpu",
    "--no-sandbox",
    "--disable-software-rasterizer",
    `--print-to-pdf=${OUTPUT_PDF}`,
    `--print-to-pdf-no-header`,
    `--no-pdf-header-footer`,
    `file:///${OUTPUT_HTML.replace(/\\/g, "/")}`,
  ];

  try {
    execSync(`"${edgePath}" ${args.map((a) => `"${a}"`).join(" ")}`, {
      stdio: "inherit",
      timeout: 120000,
    });
    if (fs.existsSync(OUTPUT_PDF)) {
      const pdfSize = (fs.statSync(OUTPUT_PDF).size / 1024 / 1024).toFixed(1);
      console.log(`\n✅ PDF generated: ${OUTPUT_PDF} (${pdfSize} MB)`);
    } else {
      throw new Error("PDF file not found after conversion");
    }
  } catch (err) {
    console.error("\n❌ Edge PDF conversion failed:", err.message);
    console.log(
      "\n💡 Tip: Open the HTML file in Chrome/Edge and press Ctrl+P → More settings → Paper size A4 → Save as PDF"
    );
    console.log(`📄 HTML file: ${OUTPUT_HTML}`);
  }
}

main().catch(console.error);
