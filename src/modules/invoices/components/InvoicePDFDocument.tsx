import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import type { Invoice } from '../types';
import { buildFooterLines } from '@/shared/pdf/resolveCompany';
import { formatSaleItemLabel } from '@/modules/sales/utils/saleItemLabel';

// Shared "facture" style — matches SalePDFDocument / OfferPDFDocument
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 12,
    fontFamily: 'Helvetica',
    fontSize: 9,
  },

  headerContainer: {
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  logoImage: { width: 180, height: 75, objectFit: 'contain' },
  docTitleBlock: { alignItems: 'flex-end' },
  docTitle: {
    fontSize: 14,
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: 'Helvetica-Bold',
  },
  docNumber: { fontSize: 9, color: '#374151', marginTop: 4 },
  docDate: { fontSize: 9, color: '#6B7280', marginTop: 2 },
  statusPill: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    borderWidth: 1,
    borderStyle: 'solid',
    borderColor: '#D1D5DB',
    fontSize: 8,
    color: '#374151',
    textTransform: 'uppercase',
  },

  content: { flex: 1 },

  infoGrid: { flexDirection: 'row', marginBottom: 18, gap: 16 },
  infoBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 12,
  },
  infoBoxTitle: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
  },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { fontSize: 9, color: '#6B7280', width: 95 },
  infoValue: { fontSize: 9, color: '#1F2937', flex: 1 },

  tableContainer: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderBottomStyle: 'solid',
  },
  tableHeaderText: {
    fontSize: 9,
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderBottomStyle: 'solid',
  },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  posCol: { width: 30 },
  descCol: { flex: 1, paddingRight: 4 },
  qtyCol: { width: 45, textAlign: 'right' },
  unitCol: { width: 70, textAlign: 'right' },
  amountCol: { width: 80, textAlign: 'right' },
  cell: { fontSize: 9, color: '#1F2937' },
  cellBold: { fontSize: 9, color: '#1F2937' },
  cellMuted: { fontSize: 9, color: '#9CA3AF', marginTop: 1 },

  twoColWrap: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  summaryBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderBottomStyle: 'solid',
  },
  summaryLabel: { fontSize: 9, color: '#6B7280' },
  summaryValue: { fontSize: 9, color: '#1F2937' },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  totalLabel: { fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold' },
  dueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: '#ECFDF5',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderBottomStyle: 'solid',
  },

  notesBox: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 10,
  },
  notesTitle: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  notesText: { fontSize: 9, color: '#1F2937', lineHeight: 1.4 },

  footer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#D1D5DB',
    borderTopStyle: 'solid',
    marginTop: 'auto',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  footerText: { fontSize: 9, color: '#9CA3AF', lineHeight: 1.4 },
  pageNum: { fontSize: 9, color: '#9CA3AF' },
});

export interface InvoicePDFTranslations {
  invoice: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  status: string;
  customerInformation: string;
  invoiceDetails: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  saleReference: string;
  currency: string;
  items: string;
  pos: string;
  description: string;
  qty: string;
  unit: string;
  total: string;
  subtotal: string;
  tax: string;
  /** Shown when the stored grand total is below subtotal + tax. */
  discount?: string;
  /** Shown when the stored grand total exceeds subtotal + tax (stamp, rounding…). */
  adjustment?: string;
  grandTotal: string;
  paymentSummary: string;
  amountPaid: string;
  amountDue: string;
  notes: string;
  page: string;
  draftNumber: string;
}

const defaultTranslations: InvoicePDFTranslations = {
  invoice: 'INVOICE',
  invoiceNumber: 'Invoice N°',
  issueDate: 'Issue date',
  dueDate: 'Due date',
  status: 'Status',
  customerInformation: 'Customer Information',
  invoiceDetails: 'Invoice Details',
  name: 'Name',
  email: 'Email',
  phone: 'Phone',
  address: 'Address',
  saleReference: 'Sale reference',
  currency: 'Currency',
  items: 'Items',
  pos: 'Pos',
  description: 'Description',
  qty: 'Qty',
  unit: 'Unit price',
  total: 'Total',
  subtotal: 'Subtotal (HT)',
  tax: 'Tax',
  grandTotal: 'Grand total (TTC)',
  paymentSummary: 'Payment Summary',
  amountPaid: 'Paid',
  amountDue: 'Amount due',
  notes: 'Notes',
  page: 'Page',
  draftNumber: 'DRAFT',
};

interface InvoicePDFDocumentProps {
  invoice: Invoice & {
    contactCompany?: string;
    contactPhone?: string;
    contactEmail?: string;
    contactAddress?: string;
  };
  formatCurrency: (amount: number) => string;
  settings?: any;
  translations?: Partial<InvoicePDFTranslations>;
  statusLabel?: string;
}

export function InvoicePDFDocument({
  invoice,
  formatCurrency,
  settings,
  translations,
  statusLabel,
}: InvoicePDFDocumentProps) {
  const t: InvoicePDFTranslations = { ...defaultTranslations, ...(translations || {}) };

  const config = settings || {
    company: { name: '', address: '', phone: '', email: '', website: '' },
    showElements: {
      customerInfo: true,
      itemsTable: true,
      summary: true,
      footer: true,
      logo: true,
      pageNumbers: true,
    },
    dateFormat: 'en-US',
    paperSize: 'A4',
  };

  const formatDate = (d?: string | Date) => {
    if (!d) return '—';
    const locale =
      config.dateFormat === 'en-US'
        ? 'en-US'
        : config.dateFormat === 'en-GB'
        ? 'en-GB'
        : config.dateFormat === 'iso'
        ? 'sv-SE'
        : 'de-DE';
    return new Date(d).toLocaleDateString(locale, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const currency = invoice.currency || 'TND';
  const lines = invoice.lines || [];

  // Totals reconciliation: invoices store only subtotal / tax / grandTotal, so a
  // document-level discount (or stamp) applied upstream used to silently vanish
  // from the PDF and the printed rows didn't add up. Derive the residual and
  // render it as an explicit adjustment row when it's non-trivial.
  const subtotalValue =
    invoice.subtotal ?? lines.reduce((sum: number, line: any) => sum + (line.lineTotal ?? line.total ?? 0), 0);
  const taxValue = invoice.taxAmount ?? 0;
  const grandTotalValue = invoice.grandTotal ?? subtotalValue + taxValue;
  const adjustmentValue = grandTotalValue - (subtotalValue + taxValue);
  const hasAdjustment = Math.abs(adjustmentValue) >= 0.005;

  return (
    <Document>
      <Page size={(config.paperSize as any) || 'A4'} style={styles.page} wrap>
        {/* Header */}
        <View style={styles.headerContainer}>
          {config.showElements?.logo && config.company?.logo?.startsWith?.('data:image/') ? (
            <Image
              src={config.company.logo as any}
              style={{
                width: config.logoSize || 140,
                maxHeight: 60,
                objectFit: 'contain',
              }}
            />
          ) : (
            <View>
              {config.company?.name ? (
                <Text style={{ fontSize: 12, color: '#1F2937', fontFamily: 'Helvetica-Bold' }}>
                  {config.company.name}
                </Text>
              ) : null}
            </View>
          )}
          {/* Title/number/date/status intentionally omitted here — they are shown
              in the structured "Invoice Details" box below to avoid duplication. */}

        </View>

        <View style={{ borderBottomWidth: 2, borderBottomColor: '#374151', marginBottom: 14 }} />

        <View style={styles.content}>
          {/* Info grid */}
          <View style={styles.infoGrid}>
            {config.showElements?.customerInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{t.customerInformation}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.name}:</Text>
                  <Text style={styles.infoValue}>
                    {invoice.contactName || `#${invoice.contactId}`}
                  </Text>
                </View>
                {invoice.contactCompany ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{invoice.contactCompany}</Text>
                  </View>
                ) : null}
                {invoice.contactAddress ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t.address}:</Text>
                    <Text style={styles.infoValue}>{invoice.contactAddress}</Text>
                  </View>
                ) : null}
                {invoice.contactPhone ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t.phone}:</Text>
                    <Text style={styles.infoValue}>{invoice.contactPhone}</Text>
                  </View>
                ) : null}
                {invoice.contactEmail ? (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t.email}:</Text>
                    <Text style={styles.infoValue}>{invoice.contactEmail}</Text>
                  </View>
                ) : null}
              </View>
            )}

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{t.invoiceDetails}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.invoiceNumber}:</Text>
                <Text style={styles.infoValue}>{invoice.invoiceNumber || t.draftNumber}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.issueDate}:</Text>
                <Text style={styles.infoValue}>
                  {formatDate(invoice.issueDate || invoice.createdAt)}
                </Text>
              </View>
              {invoice.dueDate ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.dueDate}:</Text>
                  <Text style={styles.infoValue}>{formatDate(invoice.dueDate)}</Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.status}:</Text>
                <Text style={styles.infoValue}>{statusLabel || invoice.status}</Text>
              </View>
              {invoice.saleId ? (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.saleReference}:</Text>
                  <Text style={styles.infoValue}>
                    {invoice.saleNumber || `#${invoice.saleId}`}
                  </Text>
                </View>
              ) : null}
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{t.currency}:</Text>
                <Text style={styles.infoValue}>{currency}</Text>
              </View>
            </View>
          </View>

          {/* Items */}
          {config.showElements?.itemsTable !== false && lines.length > 0 && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader} wrap={false}>
                <View style={styles.posCol}>
                  <Text style={styles.tableHeaderText}>{t.pos}</Text>
                </View>
                <View style={styles.descCol}>
                  <Text style={styles.tableHeaderText}>{t.description}</Text>
                </View>
                <View style={styles.qtyCol}>
                  <Text style={styles.tableHeaderText}>{t.qty}</Text>
                </View>
                <View style={styles.unitCol}>
                  <Text style={styles.tableHeaderText}>{t.unit}</Text>
                </View>
                <View style={styles.amountCol}>
                  <Text style={styles.tableHeaderText}>{t.total}</Text>
                </View>
              </View>
              {lines.map((line, index) => (
                <View
                  key={line.id ?? index}
                  style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
                  wrap={false}
                >
                  <View style={styles.posCol}>
                    <Text style={styles.cellBold}>{index + 1}</Text>
                  </View>
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{formatSaleItemLabel(line.itemName) || '-'}</Text>
                    {line.description ? (
                      <Text style={styles.cellMuted}>{line.description}</Text>
                    ) : null}
                  </View>
                  <View style={styles.qtyCol}>
                    <Text style={styles.cell}>
                      {Number(line.quantity || 0).toFixed(2)}
                      {line.unit ? ` ${line.unit}` : ''}
                    </Text>
                  </View>
                  <View style={styles.unitCol}>
                    <Text style={styles.cell}>{formatCurrency(line.unitPrice || 0)}</Text>
                  </View>
                  <View style={styles.amountCol}>
                    <Text style={styles.cellBold}>{formatCurrency(line.lineTotal || 0)}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Totals + Payment Summary side by side */}
          {config.showElements?.summary !== false && (
            <View style={styles.twoColWrap} wrap={false}>
              {/* Payment summary */}
              <View style={styles.summaryBox}>
                <View
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    backgroundColor: '#F9FAFB',
                    borderBottomWidth: 1,
                    borderBottomColor: '#E5E7EB',
                    borderBottomStyle: 'solid',
                  }}
                >
                  <Text
                    style={{
                      fontSize: 9,
                      color: '#374151',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontFamily: 'Helvetica-Bold',
                    }}
                  >
                    {t.paymentSummary}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.grandTotal}</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(invoice.grandTotal || 0)} {currency}
                  </Text>
                </View>
                <View style={styles.paidRow}>
                  <Text style={styles.summaryLabel}>{t.amountPaid}</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(invoice.amountPaid || 0)} {currency}
                  </Text>
                </View>
                <View style={styles.dueRow}>
                  <Text style={styles.totalLabel}>{t.amountDue}</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(invoice.amountDue || 0)} {currency}
                  </Text>
                </View>
              </View>

              {/* Totals */}
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.subtotal}</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(subtotalValue)} {currency}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.tax}</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(taxValue)} {currency}
                  </Text>
                </View>
                {hasAdjustment ? (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>
                      {adjustmentValue < 0 ? t.discount ?? 'Discount' : t.adjustment ?? 'Adjustment'}
                    </Text>
                    <Text style={styles.summaryValue}>
                      {formatCurrency(adjustmentValue)} {currency}
                    </Text>
                  </View>
                ) : null}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t.grandTotal}</Text>
                  <Text style={styles.totalValue}>
                    {formatCurrency(grandTotalValue)} {currency}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Notes */}
          {invoice.notes ? (
            <View style={styles.notesBox} wrap={false}>
              <Text style={styles.notesTitle}>{t.notes}</Text>
              <Text style={styles.notesText}>{invoice.notes}</Text>
            </View>
          ) : null}
        </View>

        {/* Footer */}
        {config.showElements?.footer !== false && (
          <View style={styles.footer} wrap={false} fixed>
            <View>
              {config.company?.name ? (
                <Text style={styles.footerText}>{config.company.name}</Text>
              ) : null}
              {buildFooterLines(config.company).map((line, idx) => (
                <Text key={idx} style={styles.footerText}>{line}</Text>
              ))}
              {config.company?.footerMessage ? (
                <Text style={styles.footerText}>{config.company.footerMessage}</Text>
              ) : null}
            </View>
            {config.showElements?.pageNumbers !== false && (
              <Text
                style={styles.pageNum}
                render={({ pageNumber, totalPages }) => `${t.page} ${pageNumber} / ${totalPages}`}
              />
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}

export default InvoicePDFDocument;
