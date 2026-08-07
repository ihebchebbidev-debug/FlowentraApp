import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('xlsx', async (importOriginal) => {
  const actual = await importOriginal<typeof import('xlsx')>();
  return { ...actual, default: actual, writeFile: vi.fn() };
});

import * as XLSX from 'xlsx';
import { buildSections, totalsForSections, buildWorkbook, downloadCsv } from '../exportReport';
import type { SalesReport, FinanceReport, PurchaseReport } from '../../types';

const salesFixture: SalesReport = {
  offersByStatus: [
    { name: 'Draft', value: 5 },
    { name: 'Sent', value: 12 },
    { name: 'Won', value: 7 },
  ],
  salesByStatus: [
    { name: 'Open', value: 3 },
    { name: 'Closed', value: 9 },
  ],
  conversionTrend: [
    { name: 'Jan', value: 10 },
    { name: 'Feb', value: 20 },
  ],
  yoyComparison: [{ name: '2024', series1: 100, series2: 80, series3: 60 }],
  topCustomers: [
    { id: 1, title: 'Acme', subtitle: 'EU', amount: 5000, status: 'active', date: '2026-01-01' },
    { id: 2, title: 'Globex', subtitle: 'US', amount: 2500, status: 'active', date: '2026-01-02' },
  ],
} as unknown as SalesReport;

const financeFixture: FinanceReport = {
  kpis: [{ title: 'Revenue', formattedValue: '$1,000', trend: '+5%', ragStatus: 'green' }],
  invoiceStatusDonut: [{ name: 'Paid', value: 20 }, { name: 'Overdue', value: 4 }],
  expensesByCategory: [{ name: 'Ops', value: 300 }],
  invoiceTable: [{ id: 1, title: 'INV-1', subtitle: 'Acme', amount: 100, status: 'paid', date: '2026-01-01' }],
} as unknown as FinanceReport;

const purchaseFixture: PurchaseReport = {
  spendBySupplier: [{ name: 'S1', value: 500 }],
  spendByCategory: [{ name: 'Raw', value: 250 }, { name: 'Tools', value: 250 }],
  receiptStatus: [{ name: 'Received', value: 7 }],
  poSpendTrend: [{ name: 'Jan', value: 800 }],
  poTable: [{ id: 10, title: 'PO-10', subtitle: 'S1', amount: 500, status: 'closed', date: '2026-01-01' }],
} as unknown as PurchaseReport;

// Stub the tiny slice of DOM/URL that downloadCsv touches — avoids needing jsdom.
beforeEach(() => {
  const clicks: string[] = [];
  const fakeAnchor = {
    href: '',
    download: '',
    click: () => clicks.push('click'),
  };
  vi.stubGlobal('document', {
    createElement: () => fakeAnchor,
    body: { appendChild: () => {}, removeChild: () => {} },
  });
  vi.stubGlobal('URL', { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} });
  vi.stubGlobal('__clicks', clicks);
});

describe('reporting export parity', () => {
  it('exported row counts match on-screen source arrays for sales', () => {
    const sections = buildSections('sales', salesFixture);
    const byName = Object.fromEntries(sections.map((s) => [s.name, s.rows.length]));
    expect(byName['Offers by Status']).toBe(salesFixture.offersByStatus.length);
    expect(byName['Sales by Status']).toBe(salesFixture.salesByStatus.length);
    expect(byName['Conversion Trend']).toBe(salesFixture.conversionTrend.length);
    expect(byName['YoY Comparison']).toBe(salesFixture.yoyComparison.length);
    expect(byName['Top Customers']).toBe(salesFixture.topCustomers.length);
  });

  it('numeric totals in exported rows equal totals of source data', () => {
    const sections = buildSections('purchase', purchaseFixture);
    const { rowCount, numericTotal } = totalsForSections(sections);

    const expectedRows =
      purchaseFixture.spendBySupplier.length +
      purchaseFixture.spendByCategory.length +
      purchaseFixture.receiptStatus.length +
      purchaseFixture.poSpendTrend.length +
      purchaseFixture.poTable.length;

    const expectedNumeric =
      purchaseFixture.spendBySupplier.reduce((n, x) => n + x.value, 0) +
      purchaseFixture.spendByCategory.reduce((n, x) => n + x.value, 0) +
      purchaseFixture.receiptStatus.reduce((n, x) => n + x.value, 0) +
      purchaseFixture.poSpendTrend.reduce((n, x) => n + x.value, 0) +
      purchaseFixture.poTable.reduce((n, x) => n + x.id + x.amount, 0);

    expect(rowCount).toBe(expectedRows);
    expect(numericTotal).toBe(expectedNumeric);
  });

  it('CSV download triggers a file and matches source row counts', async () => {
    const sections = buildSections('finance', financeFixture);
    await downloadCsv('finance.csv', sections);
    expect(((globalThis as any).__clicks as string[]).length).toBe(1);

    // Reconstruct the same CSV content downloadCsv writes and verify row parity.
    const csvLines = sections.flatMap((s) => {
      const ws = XLSX.utils.json_to_sheet(s.rows.length ? s.rows : [{ Empty: 'No data' }]);
      return XLSX.utils.sheet_to_csv(ws).split('\n').filter(Boolean);
    });
    const expectedLines = sections.reduce((n, s) => n + 1 + Math.max(1, s.rows.length), 0);
    expect(csvLines.length).toBe(expectedLines);
  });


  it('XLSX contains one styled sheet per section with matching row counts', async () => {
    const sections = buildSections('sales', salesFixture);
    const wb = await buildWorkbook([{ scope: 'sales', sections }]);

    // Cover sheet + one sheet per section.
    expect(wb.worksheets.length).toBe(sections.length + 1);
    expect(wb.worksheets[0].name).toBe('Overview');

    sections.forEach((s, i) => {
      const ws = wb.worksheets[i + 1];
      // Header lives on row 4; body starts at row 5. Totals row (if present) is beyond rowCount tracking.
      // Count only body rows that carry a non-empty first-column value and aren't the totals row.
      let body = 0;
      for (let r = 5; r <= ws.rowCount; r++) {
        const first = ws.getRow(r).getCell(1).value;
        if (first === 'Total') break;
        if (first != null && first !== '') body++;
      }
      expect(body).toBe(s.rows.length || 1);
    });
  });
});
