// Scans all Backend/**/*.sql files, extracts CREATE TABLE blocks,
// merges duplicates (later definitions augment earlier), parses columns + FKs,
// categorizes by module, and writes src/modules/settings/data/dbSchema.generated.ts
import fs from "node:fs";
import path from "node:path";

const ROOT = "Backend";
const OUT = "src/modules/settings/data/dbSchema.generated.ts";

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".sql")) acc.push(p);
  }
  return acc;
}

const CATEGORY_RULES = [
  [/^(MainAdminUsers|Users|UserPreferences|UserSignatures|UserAi|TokenRefreshLog)/i, "Identity & Auth"],
  [/^(Roles|UserRoles|RoleSkills|RolePermissions|Skills|UserSkills)/i, "Roles & Permissions"],
  [/^Tenants?$/i, "Tenancy"],
  [/^(Contacts|ContactNotes|ContactTags|ContactTagAssignments)/i, "CRM • Contacts"],
  [/^(Articles|ArticleCategories|ArticleNotes|ArticleSuppliers|ArticleSupplierPriceHistory|InventoryTransactions|stock_transactions|Locations)/i, "Inventory & Articles"],
  [/^(Offers|OfferItems|OfferActivities)/i, "Sales • Offers"],
  [/^(Sales|SaleItems|SaleActivities|sales|sale_items|sale_activities)/i, "Sales • Orders"],
  [/^(PurchaseOrders|PurchaseOrderItems|PurchaseActivities|GoodsReceipts|GoodsReceiptItems|SupplierInvoices|SupplierInvoiceItems)/i, "Purchases"],
  [/^(payments|payment_)/i, "Payments"],
  [/^(Projects|ProjectTasks|ProjectNotes|ProjectActivities|ProjectColumns|ProjectSettings|DailyTasks|RecurringTasks?|RecurringTaskLogs|TaskAttachments|TaskChecklists?|TaskChecklistItems|TaskComments|TaskTimeEntries|TimeEntries)/i, "Projects & Tasks"],
  [/^(ServiceOrders|ServiceOrderJobs|ServiceOrderMaterials|ServiceOrderNotes|ServiceOrderTimeEntries|ServiceOrderExpenses|MaterialUsage|Expenses)/i, "Service Orders"],
  [/^(Dispatches|DispatchJobs|DispatchTechnicians|DispatchHistory)/i, "Dispatches"],
  [/^(Installations|InstallationNotes|MaintenanceHistory)/i, "Installations"],
  [/^(CalendarEvents|EventAttendees|EventReminders|EventTypes|calendar_events|event_)/i, "Calendar"],
  [/^(SupportTickets|SupportTicketComments|SupportTicketAttachments|SupportTicketLinks)/i, "Support Tickets"],
  [/^(DynamicForms|DynamicFormResponses|EntityFormDocuments)/i, "Dynamic Forms"],
  [/^(WB_)/i, "Website Builder"],
  [/^(Workflow|WorkflowExecutionLogs)/i, "Workflow Engine"],
  [/^(Notifications|EmailBlocklistItems|ConnectedEmailAccounts|SyncedEmails|SyncedEmailAttachments|SyncedCalendarEvents)/i, "Notifications & Email"],
  [/^(SystemLogs|TokenRefreshLog|SyncFailureLog|SyncPerformanceLog)/i, "System & Audit"],
  [/^(LookupItems|Currencies|EventTypes|article_categories|article_notes)/i, "Lookups"],
  [/^(NumberSequences|NumberingSettings)/i, "Numbering"],
  [/^(PdfSettings|Documents|Attachments|Notes)/i, "Documents"],
  [/^(Dashboards)/i, "Dashboards"],
  [/^(AiConversations|AiMessages|UserAi)/i, "AI"],
  [/^(hr_|Hr|user_leaves|user_status_history|user_working_hours|RSRecords|TEJExportLogs)/i, "HR & Payroll"],
  [/^(__EFMigrationsHistory)/i, "System"],
];
const categorize = (n) => CATEGORY_RULES.find(([r]) => r.test(n))?.[1] ?? "Other";

const tables = new Map(); // name -> { name, category, src:[], cols:Map, fks:[] }

const TABLE_RE = /CREATE\s+TABLE(?:\s+IF\s+NOT\s+EXISTS)?\s+(?:public\.)?["']?([A-Za-z_][A-Za-z0-9_]*)["']?\s*\(([\s\S]*?)\n\s*\)\s*;/gi;
const FK_RE = /(?:CONSTRAINT\s+["']?[\w]+["']?\s+)?FOREIGN\s+KEY\s*\(\s*["']?([\w]+)["']?\s*\)\s+REFERENCES\s+["']?([\w]+)["']?\s*\(\s*["']?([\w]+)["']?\s*\)/i;

function parseBody(body) {
  const parts = [];
  let depth = 0, buf = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    if (ch === ")") depth--;
    if (ch === "," && depth === 0) { parts.push(buf.trim()); buf = ""; continue; }
    buf += ch;
  }
  if (buf.trim()) parts.push(buf.trim());
  const cols = []; const fks = []; const uniques = []; let pk = null;
  for (const p of parts) {
    const cleaned = p.replace(/--.*$/gm, "").trim();
    if (!cleaned) continue;
    const fkMatch = cleaned.match(FK_RE);
    if (fkMatch) { fks.push({ from: fkMatch[1], to: fkMatch[2], col: fkMatch[3] }); continue; }
    const pkMatch = cleaned.match(/^(?:CONSTRAINT\s+["']?\w+["']?\s+)?PRIMARY\s+KEY\s*\(\s*([^)]+)\s*\)/i);
    if (pkMatch) { pk = pkMatch[1].split(",").map(s => s.replace(/["']/g, "").trim()); continue; }
    const uqMatch = cleaned.match(/^(?:CONSTRAINT\s+["']?\w+["']?\s+)?UNIQUE\s*\(\s*([^)]+)\s*\)/i);
    if (uqMatch) { uniques.push(uqMatch[1].split(",").map(s => s.replace(/["']/g, "").trim())); continue; }
    if (/^(CHECK|CONSTRAINT)\b/i.test(cleaned)) continue;
    const m = cleaned.match(/^["']?([A-Za-z_][\w]*)["']?\s+(.+)$/s);
    if (m) {
      const def = m[2].replace(/\s+/g, " ").trim();
      const col = { name: m[1], def };
      if (/PRIMARY\s+KEY/i.test(def)) { pk = pk ?? [m[1]]; }
      cols.push(col);
    }
  }
  return { cols, fks, pk, uniques };
}

const files = walk(ROOT).sort();
for (const f of files) {
  let sql;
  try { sql = fs.readFileSync(f, "utf8"); } catch { continue; }
  let m;
  while ((m = TABLE_RE.exec(sql)) !== null) {
    const name = m[1];
    if (name.startsWith("__")) continue;
    const { cols, fks, pk, uniques } = parseBody(m[2]);
    if (!tables.has(name)) {
      tables.set(name, { name, category: categorize(name), src: new Set(), cols: new Map(), fks: [], pk: null, uniques: [], indexes: [] });
    }
    const t = tables.get(name);
    t.src.add(path.relative(ROOT, f));
    for (const c of cols) if (!t.cols.has(c.name)) t.cols.set(c.name, c);
    for (const fk of fks) if (!t.fks.find(x => x.from === fk.from && x.to === fk.to)) t.fks.push(fk);
    if (pk && !t.pk) t.pk = pk;
    for (const u of uniques) t.uniques.push(u);
  }
}

// FKs from ALTER TABLE
const ALTER_FK_RE = /ALTER\s+TABLE\s+(?:ONLY\s+)?(?:public\.)?["']?([\w]+)["']?[\s\S]*?FOREIGN\s+KEY\s*\(\s*["']?([\w]+)["']?\s*\)\s+REFERENCES\s+(?:public\.)?["']?([\w]+)["']?\s*\(\s*["']?([\w]+)["']?\s*\)/gi;
const INDEX_RE = /CREATE\s+(UNIQUE\s+)?INDEX(?:\s+IF\s+NOT\s+EXISTS)?\s+["']?([\w]+)["']?\s+ON\s+(?:public\.)?["']?([\w]+)["']?\s*(?:USING\s+\w+\s*)?\(([^)]+)\)/gi;
for (const f of files) {
  const sql = fs.readFileSync(f, "utf8");
  let m;
  while ((m = ALTER_FK_RE.exec(sql)) !== null) {
    const t = tables.get(m[1]); if (!t) continue;
    if (!t.fks.find(x => x.from === m[2] && x.to === m[3])) t.fks.push({ from: m[2], to: m[3], col: m[4] });
  }
  while ((m = INDEX_RE.exec(sql)) !== null) {
    const t = tables.get(m[3]); if (!t) continue;
    const cols = m[4].split(",").map(s => s.replace(/["']/g, "").trim().replace(/\s+(ASC|DESC)$/i, ""));
    if (!t.indexes.find(i => i.name === m[2])) t.indexes.push({ name: m[2], unique: !!m[1], columns: cols });
  }
}

const arr = [...tables.values()].map(t => ({
  name: t.name,
  category: t.category,
  sources: [...t.src],
  primaryKey: t.pk,
  uniques: t.uniques,
  indexes: t.indexes,
  columns: [...t.cols.values()],
  foreignKeys: t.fks,
})).sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

const out = `// AUTO-GENERATED by scripts/generateDbSchema.mjs — do not edit by hand.
export type DbColumn = { name: string; def: string };
export type DbForeignKey = { from: string; to: string; col: string };
export type DbIndex = { name: string; unique: boolean; columns: string[] };
export type DbTableSchema = {
  name: string;
  category: string;
  sources: string[];
  primaryKey: string[] | null;
  uniques: string[][];
  indexes: DbIndex[];
  columns: DbColumn[];
  foreignKeys: DbForeignKey[];
};
export const DB_SCHEMA: DbTableSchema[] = ${JSON.stringify(arr, null, 2)};
`;
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, out);
console.log(`Wrote ${arr.length} tables to ${OUT}`);
const byCat = arr.reduce((a, t) => ((a[t.category] = (a[t.category] || 0) + 1), a), {});
console.log(byCat);
const totalFks = arr.reduce((a, t) => a + t.foreignKeys.length, 0);
const totalIdx = arr.reduce((a, t) => a + t.indexes.length, 0);
console.log({ totalFks, totalIdx });
