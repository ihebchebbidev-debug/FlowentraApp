import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import type {
  SalesReport,
  ServiceReport,
  FinanceReport,
  HrReport,
  PurchaseReport,
} from '../types';

export type ExportScope = 'sales' | 'service' | 'finance' | 'hr' | 'purchase';
export type ExportFormat = 'xlsx' | 'csv';

type AnyReport = SalesReport | ServiceReport | FinanceReport | HrReport | PurchaseReport;
type Row = Record<string, string | number>;
export type Section = { name: string; rows: Row[] };

/**
 * Neutralize CSV / Excel formula-injection payloads.
 * A cell that begins with `=`, `+`, `-`, `@`, TAB, or CR is treated by Excel/Sheets
 * as a formula and can execute DDE / HYPERLINK / cmd payloads. Prefix a single
 * quote so the value is preserved as text but not evaluated.
 * See OWASP: "CSV Injection".
 */
const FORMULA_TRIGGERS = /^[=+\-@\t\r]/;
const safeStr = (v: unknown): string => {
  const s = v == null ? '' : String(v);
  return FORMULA_TRIGGERS.test(s) ? `'${s}` : s;
};

const kpiRows = (kpis: { title: string; formattedValue: string; trend: string; ragStatus: string }[]): Row[] =>
  kpis.map((k) => ({ KPI: safeStr(k.title), Value: safeStr(k.formattedValue), Trend: safeStr(k.trend), Status: safeStr(k.ragStatus) }));

const chartRows = (data: { name: string; value: number; target?: number }[]): Row[] =>
  data.map((d) => ({ Name: safeStr(d.name), Value: Number(d.value ?? 0), ...(d.target != null ? { Target: Number(d.target) } : {}) }));

const multiRows = (data: { name: string; series1: number; series2: number; series3: number }[]): Row[] =>
  data.map((d) => ({ Name: safeStr(d.name), Series1: Number(d.series1 ?? 0), Series2: Number(d.series2 ?? 0), Series3: Number(d.series3 ?? 0) }));

const tableRows = (rows: { id: number; title: string; subtitle: string; amount: number; status: string; date: string }[]): Row[] =>
  rows.map((r) => ({ ID: r.id, Title: safeStr(r.title), Subtitle: safeStr(r.subtitle), Amount: Number(r.amount ?? 0), Status: safeStr(r.status), Date: safeStr(r.date) }));

export function buildSections(scope: ExportScope, data: AnyReport): Section[] {
  switch (scope) {
    case 'sales': {
      const d = data as SalesReport;
      return [
        { name: 'Offers by Status', rows: chartRows(d.offersByStatus ?? []) },
        { name: 'Sales by Status', rows: chartRows(d.salesByStatus ?? []) },
        { name: 'Conversion Trend', rows: chartRows(d.conversionTrend ?? []) },
        { name: 'YoY Comparison', rows: multiRows(d.yoyComparison ?? []) },
        { name: 'Top Customers', rows: tableRows(d.topCustomers ?? []) },
      ];
    }
    case 'service': {
      const d = data as ServiceReport;
      return [
        { name: 'Completion by Month', rows: chartRows(d.completionByMonth ?? []) },
        { name: 'Orders by Status', rows: chartRows(d.workOrdersByStatus ?? []) },
        { name: 'Orders by Type', rows: chartRows(d.workOrdersByType ?? []) },
        { name: 'Dispatches per Tech', rows: multiRows(d.dispatchesPerTech ?? []) },
        { name: 'Consumed vs Planned', rows: chartRows(d.consumedVsPlanned ?? []) },
        { name: 'Technicians', rows: tableRows(d.technicianTable ?? []) },
      ];
    }
    case 'finance': {
      const d = data as FinanceReport;
      return [
        { name: 'KPIs', rows: kpiRows(d.kpis ?? []) },
        { name: 'Invoice Status', rows: chartRows(d.invoiceStatusDonut ?? []) },
        { name: 'Expenses by Category', rows: chartRows(d.expensesByCategory ?? []) },
        { name: 'Invoices', rows: tableRows(d.invoiceTable ?? []) },
      ];
    }
    case 'hr': {
      const d = data as HrReport;
      return [
        { name: 'Headcount by Dept', rows: chartRows(d.headcountByDepartment ?? []) },
        { name: 'Salary by Dept', rows: chartRows(d.salaryByDepartment ?? []) },
        { name: 'Performance', rows: chartRows(d.performanceDistribution ?? []) },
        { name: 'Hiring vs Turnover', rows: multiRows(d.hiringVsTurnover ?? []) },
        { name: 'Employees', rows: tableRows(d.employeeTable ?? []) },
      ];
    }
    case 'purchase': {
      const d = data as PurchaseReport;
      return [
        { name: 'Spend by Supplier', rows: chartRows(d.spendBySupplier ?? []) },
        { name: 'Spend by Category', rows: chartRows(d.spendByCategory ?? []) },
        { name: 'Receipt Status', rows: chartRows(d.receiptStatus ?? []) },
        { name: 'PO Spend Trend', rows: chartRows(d.poSpendTrend ?? []) },
        { name: 'Purchase Orders', rows: tableRows(d.poTable ?? []) },
      ];
    }
  }
}

// ─── i18n ──────────────────────────────────────────────────────────────────────
export type XlsxI18n = {
  cover: {
    title: string;
    generated: string;      // "Generated {when}"
    colScope: string;
    colSections: string;
    colTotalRows: string;
    colNotes: string;
    allPopulated: string;
    emptySections: (n: number) => string;
    footerNote: string;
    sheetName: string;      // "Overview"
  };
  section: {
    subtitle: (scope: string, count: number, when: string) => string;
    total: string;
    noData: string;
  };
  scopes: Record<string, string>;
  sections: Record<string, string>;
  headers: Record<string, string>;
};

export const DEFAULT_I18N: XlsxI18n = {
  cover: {
    title: 'Reporting Export',
    generated: 'Generated {when}',
    colScope: 'Scope',
    colSections: 'Sections',
    colTotalRows: 'Total Rows',
    colNotes: 'Notes',
    allPopulated: 'All sections populated',
    emptySections: (n) => `${n} empty section${n > 1 ? 's' : ''}`,
    footerNote:
      'Each sheet contains its own title band, filterable header, banded rows, number formatting and a totals row where applicable.',
    sheetName: 'Overview',
  },
  section: {
    subtitle: (scope, count, when) =>
      `${scope} report  •  ${count} row${count === 1 ? '' : 's'}  •  Generated ${when}`,
    total: 'Total',
    noData: 'No data available for this section.',
  },
  scopes: {},
  sections: {},
  headers: {},
};

const scopeLabel = (i18n: XlsxI18n, scope: string) => i18n.scopes[scope] ?? titleCase(scope);
const sectionLabel = (i18n: XlsxI18n, name: string) => i18n.sections[name] ?? name;
const headerLabel = (i18n: XlsxI18n, key: string) => i18n.headers[key] ?? titleCase(key);

// Excel sheet name: <=31 chars, no []:*?/\
const sanitizeSheet = (name: string) => name.replace(/[\[\]\*\?\/\\:]/g, '-').slice(0, 31);

const yieldToUi = () => new Promise<void>((r) => setTimeout(r, 0));

export type ProgressFn = (info: { current: number; total: number; label: string }) => void;

// ─── Styling palette (ARGB) ────────────────────────────────────────────────────
const THEME = {
  brand:      'FF1E293B', // slate-800 — cover + header fills
  brandLight: 'FF334155', // slate-700 — subtitle band
  headerText: 'FFFFFFFF',
  bodyText:   'FF0F172A', // slate-900
  mutedText:  'FF64748B', // slate-500
  band:       'FFF1F5F9', // slate-100 — alternate row
  border:     'FFE2E8F0', // slate-200
  totalsFill: 'FFE0E7FF', // indigo-100
  ragGreen:   'FF10B981',
  ragYellow: 'FFF59E0B',
  ragRed:     'FFEF4444',
  ragNeutral:'FF94A3B8',
};

const RAG_COLORS: Record<string, string> = {
  green: THEME.ragGreen,
  yellow: THEME.ragYellow,
  amber: THEME.ragYellow,
  red: THEME.ragRed,
  neutral: THEME.ragNeutral,
  gray: THEME.ragNeutral,
};

const CURRENCY_FMT = '#,##0.00;[Red](#,##0.00);"—"';
const INT_FMT = '#,##0;[Red](#,##0);"—"';
const PCT_FMT = '0.0%;[Red](-0.0%);"—"';

function pickNumberFormat(header: string): string | null {
  const h = header.toLowerCase();
  if (h === 'amount' || h === 'revenue' || h === 'spend' || h === 'salary' || h === 'total') return CURRENCY_FMT;
  if (h.endsWith('rate') || h.endsWith('%') || h.includes('percent')) return PCT_FMT;
  if (h === 'id' || h === 'value' || h === 'target' || h.startsWith('series') || h === 'count') return INT_FMT;
  return null;
}

function autoWidth(rows: Row[], header: string): number {
  let max = header.length;
  for (const r of rows) {
    const v = r[header];
    const len = v == null ? 0 : String(v).length;
    if (len > max) max = len;
  }
  return Math.min(Math.max(max + 4, 12), 48);
}

const titleCase = (s: string) =>
  s.replace(/(^|\s|-)([a-z])/g, (_, sep, c) => sep + c.toUpperCase());

/**
 * Populate one worksheet with a section: title band, styled header, banded body,
 * number formats, RAG coloring, totals row, freeze pane and autofilter.
 */
function writeSection(ws: ExcelJS.Worksheet, scope: string, section: Section, i18n: XlsxI18n) {
  const rows = section.rows.length ? section.rows : [{ Info: i18n.section.noData }];
  const headers = Object.keys(rows[0]);

  ws.views = [{ state: 'frozen', ySplit: 4 }];

  // Title band (row 1-2)
  ws.mergeCells(1, 1, 1, headers.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = sectionLabel(i18n, section.name);
  titleCell.font = { name: 'Calibri', size: 16, bold: true, color: { argb: THEME.headerText } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.brand } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, headers.length);
  const subCell = ws.getCell(2, 1);
  subCell.value = i18n.section.subtitle(scopeLabel(i18n, scope), rows.length, new Date().toLocaleString());
  subCell.font = { name: 'Calibri', size: 10, italic: true, color: { argb: THEME.headerText } };
  subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.brandLight } };
  subCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  ws.getRow(2).height = 18;

  // Spacer row 3 kept blank for breathing room.
  ws.getRow(3).height = 6;

  // Header row (row 4) — display label is localized; the underlying column key
  // (English) drives number format & RAG logic below.
  const headerRow = ws.getRow(4);
  headers.forEach((h, i) => {
    const cell = headerRow.getCell(i + 1);
    cell.value = headerLabel(i18n, h);
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.brand } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
    cell.border = {
      top:    { style: 'thin', color: { argb: THEME.border } },
      bottom: { style: 'thin', color: { argb: THEME.border } },
      left:   { style: 'thin', color: { argb: THEME.border } },
      right:  { style: 'thin', color: { argb: THEME.border } },
    };
  });
  headerRow.height = 22;

  // Column widths + number formats (driven by the English key, not the label).
  headers.forEach((h, i) => {
    const col = ws.getColumn(i + 1);
    col.width = autoWidth(rows, h);
    const fmt = pickNumberFormat(h);
    if (fmt) col.numFmt = fmt;
  });

  // Body rows
  rows.forEach((r, rIdx) => {
    const row = ws.getRow(5 + rIdx);
    headers.forEach((h, cIdx) => {
      const cell = row.getCell(cIdx + 1);
      const v = r[h];
      // Preserve numeric type so Excel formats + sorts correctly.
      cell.value = typeof v === 'number' ? v : (v as string);
      cell.font = { name: 'Calibri', size: 11, color: { argb: THEME.bodyText } };
      cell.alignment = { vertical: 'middle', horizontal: typeof v === 'number' ? 'right' : 'left', indent: typeof v === 'number' ? 0 : 1 };
      cell.border = {
        bottom: { style: 'hair', color: { argb: THEME.border } },
      };

      // Banded rows
      if (rIdx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.band } };
      }

      // RAG pill for the Status column (finance/hr/table sections). The status
      // strings come from the backend and stay in their original locale-neutral form.
      if (h.toLowerCase() === 'status' && typeof v === 'string') {
        const key = v.toLowerCase();
        const color =
          RAG_COLORS[key] ??
          (['paid', 'closed', 'received', 'won', 'active', 'completed'].includes(key) ? THEME.ragGreen
            : ['pending', 'partial', 'open', 'draft', 'sent'].includes(key) ? THEME.ragYellow
            : ['overdue', 'failed', 'cancelled', 'lost'].includes(key) ? THEME.ragRed
            : null);
        if (color) {
          cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
      }
    });
    row.height = 20;
  });

  // Totals row (only when there are ≥2 numeric rows).
  const numericHeaders = headers.filter((h) => rows.some((r) => typeof r[h] === 'number'));
  if (rows.length >= 2 && numericHeaders.length > 0 && section.rows.length > 0) {
    const totalsRowIdx = 5 + rows.length;
    const totalsRow = ws.getRow(totalsRowIdx);
    headers.forEach((h, cIdx) => {
      const cell = totalsRow.getCell(cIdx + 1);
      cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.bodyText } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.totalsFill } };
      cell.border = { top: { style: 'medium', color: { argb: THEME.brand } } };
      if (cIdx === 0) {
        cell.value = i18n.section.total;
        cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
      } else if (numericHeaders.includes(h)) {
        const colLetter = ws.getColumn(cIdx + 1).letter;
        cell.value = { formula: `SUM(${colLetter}5:${colLetter}${totalsRowIdx - 1})` };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }
    });
    totalsRow.height = 22;
  }

  // Auto-filter over the header + body (excludes totals row).
  const lastCol = ws.getColumn(headers.length).letter;
  ws.autoFilter = { from: `A4`, to: `${lastCol}${4 + rows.length}` };

  // Page setup for printing.
  ws.pageSetup = { orientation: 'landscape', fitToPage: true, fitToWidth: 1, fitToHeight: 0, margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } };
  ws.headerFooter = { oddFooter: `&L${scopeLabel(i18n, scope)} — ${sectionLabel(i18n, section.name)}&R&P / &N` };
}


function writeCoverSheet(
  ws: ExcelJS.Worksheet,
  workbookSections: { scope: string; sections: Section[] }[],
  i18n: XlsxI18n,
) {
  ws.views = [{ showGridLines: false }];
  ws.columns = [{ width: 4 }, { width: 32 }, { width: 22 }, { width: 22 }, { width: 46 }];
  ws.pageSetup = {
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 1,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
  };

  // Big title
  ws.mergeCells('B2:E2');
  const title = ws.getCell('B2');
  title.value = i18n.cover.title;
  title.font = { name: 'Calibri', size: 26, bold: true, color: { argb: THEME.brand } };
  ws.getRow(2).height = 40;

  ws.mergeCells('B3:E3');
  const sub = ws.getCell('B3');
  sub.value = i18n.cover.generated.replace('{when}', new Date().toLocaleString());
  sub.font = { name: 'Calibri', size: 11, italic: true, color: { argb: THEME.mutedText } };

  // Summary table header
  const headerRowIdx = 5;
  const cols = [i18n.cover.colScope, i18n.cover.colSections, i18n.cover.colTotalRows, i18n.cover.colNotes];
  cols.forEach((c, i) => {
    const cell = ws.getCell(headerRowIdx, 2 + i);
    cell.value = c;
    cell.font = { name: 'Calibri', size: 11, bold: true, color: { argb: THEME.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.brand } };
    cell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  });
  ws.getRow(headerRowIdx).height = 22;

  workbookSections.forEach((w, idx) => {
    const rowIdx = headerRowIdx + 1 + idx;
    const totalRows = w.sections.reduce((n, s) => n + s.rows.length, 0);
    const emptySections = w.sections.filter((s) => s.rows.length === 0).length;
    const cells = [
      scopeLabel(i18n, w.scope),
      w.sections.length,
      totalRows,
      emptySections ? i18n.cover.emptySections(emptySections) : i18n.cover.allPopulated,
    ];
    cells.forEach((val, i) => {
      const cell = ws.getCell(rowIdx, 2 + i);
      cell.value = val as string | number;
      cell.font = { name: 'Calibri', size: 11, color: { argb: THEME.bodyText } };
      cell.alignment = { vertical: 'middle', horizontal: i === 0 || i === 3 ? 'left' : 'right', indent: i === 0 || i === 3 ? 1 : 0 };
      if (idx % 2 === 1) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: THEME.band } };
      }
      cell.border = { bottom: { style: 'hair', color: { argb: THEME.border } } };
    });
    ws.getRow(rowIdx).height = 20;
  });

  // Footer note
  const footerRow = headerRowIdx + workbookSections.length + 3;
  ws.mergeCells(footerRow, 2, footerRow, 5);
  const foot = ws.getCell(footerRow, 2);
  foot.value = i18n.cover.footerNote;
  foot.font = { name: 'Calibri', size: 10, italic: true, color: { argb: THEME.mutedText } };
  foot.alignment = { wrapText: true, vertical: 'top' };
}

/**
 * Build a fully styled ExcelJS workbook. Pure — no DOM. Exposed so tests
 * can inspect the resulting structure without hitting the browser.
 */
export async function buildWorkbook(
  workbookSections: { scope: string; sections: Section[] }[],
  onProgress?: ProgressFn,
  i18n: XlsxI18n = DEFAULT_I18N,
): Promise<ExcelJS.Workbook> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Reporting';
  wb.created = new Date();
  wb.properties.date1904 = false;

  const overviewName = sanitizeSheet(i18n.cover.sheetName || 'Overview');
  writeCoverSheet(
    wb.addWorksheet(overviewName, { properties: { tabColor: { argb: THEME.brand } } }),
    workbookSections,
    i18n,
  );

  const usedNames = new Set<string>([overviewName]);
  const total = workbookSections.reduce((n, w) => n + w.sections.length, 0);
  let current = 0;
  for (const { scope, sections } of workbookSections) {
    for (const s of sections) {
      const scopeLbl = scopeLabel(i18n, scope);
      const sectionLbl = sectionLabel(i18n, s.name);
      let name = sanitizeSheet(`${scopeLbl} - ${sectionLbl}`);
      let i = 2;
      while (usedNames.has(name)) name = sanitizeSheet(`${scopeLbl} - ${sectionLbl} ${i++}`);
      usedNames.add(name);
      const ws = wb.addWorksheet(name, { properties: { tabColor: { argb: THEME.brandLight } } });
      writeSection(ws, scope, s, i18n);
      current += 1;
      onProgress?.({ current, total, label: `${scope} — ${s.name}` });
      if (current % 3 === 0) await yieldToUi();
    }
  }
  return wb;
}

export async function downloadXlsx(
  fileName: string,
  workbookSections: { scope: string; sections: Section[] }[],
  onProgress?: ProgressFn,
  i18n: XlsxI18n = DEFAULT_I18N,
) {
  const wb = await buildWorkbook(workbookSections, onProgress, i18n);
  await yieldToUi();
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  triggerDownload(blob, fileName);
}

export async function downloadCsv(
  fileName: string,
  sections: Section[],
  onProgress?: ProgressFn,
  i18n: XlsxI18n = DEFAULT_I18N,
) {
  const parts: string[] = [];
  const total = sections.length;
  let current = 0;
  for (const s of sections) {
    parts.push(`# ${sectionLabel(i18n, s.name)}`);
    if (s.rows.length) {
      // Translate header keys for CSV column titles while preserving values.
      const translated = s.rows.map((r) => {
        const out: Row = {};
        for (const k of Object.keys(r)) out[headerLabel(i18n, k)] = r[k];
        return out;
      });
      const ws = XLSX.utils.json_to_sheet(translated);
      parts.push(XLSX.utils.sheet_to_csv(ws));
    } else {
      parts.push(`(${i18n.section.noData})`);
    }
    parts.push('');
    current += 1;
    onProgress?.({ current, total, label: s.name });
    if (current % 4 === 0) await yieldToUi();
  }
  // BOM ensures Excel decodes UTF-8 correctly (non-ASCII names stay intact).
  const blob = new Blob(['\uFEFF', parts.join('\n')], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(blob, fileName);
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Defer revoke — some browsers abort the download when the object URL is
  // revoked synchronously right after `.click()`.
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

/** Download one file per scope with a small delay so the browser doesn't collapse the downloads. */
export async function downloadPerScope(
  workbookSections: { scope: string; sections: Section[] }[],
  format: ExportFormat,
  onProgress?: ProgressFn,
  i18n: XlsxI18n = DEFAULT_I18N,
): Promise<string[]> {
  const stamp = new Date().toISOString().slice(0, 10);
  const names: string[] = [];
  const total = workbookSections.length;
  let current = 0;
  for (const w of workbookSections) {
    const base = `${w.scope}-report-${stamp}`;
    if (format === 'csv') {
      const name = `${base}.csv`;
      await downloadCsv(name, w.sections, undefined, i18n);
      names.push(name);
    } else {
      const name = `${base}.xlsx`;
      await downloadXlsx(name, [w], undefined, i18n);
      names.push(name);
    }
    current += 1;
    onProgress?.({ current, total, label: w.scope });
    await new Promise((r) => setTimeout(r, 250));
  }
  return names;
}

export async function exportSingleReport(
  scope: ExportScope,
  data: AnyReport,
  format: ExportFormat = 'xlsx',
  i18n: XlsxI18n = DEFAULT_I18N,
): Promise<void> {
  const sections = buildSections(scope, data);
  const stamp = new Date().toISOString().slice(0, 10);
  const base = `${scope}-report-${stamp}`;
  try {
    if (format === 'csv') await downloadCsv(`${base}.csv`, sections, undefined, i18n);
    else await downloadXlsx(`${base}.xlsx`, [{ scope, sections }], undefined, i18n);
  } catch (e) {
    // Surface failures so single-dashboard "Export" buttons don't silently no-op.
    // Callers can catch this Promise if they want a toast; we still log for triage.
    console.error('[reporting] exportSingleReport failed', { scope, format, error: e });
    throw e;
  }
}

/** Aggregate row count + numeric sum across sections; used by parity tests. */
export function totalsForSections(sections: Section[]): { rowCount: number; numericTotal: number } {
  let rowCount = 0;
  let numericTotal = 0;
  for (const s of sections) {
    rowCount += s.rows.length;
    for (const r of s.rows) {
      for (const v of Object.values(r)) if (typeof v === 'number') numericTotal += v;
    }
  }
  return { rowCount, numericTotal };
}
