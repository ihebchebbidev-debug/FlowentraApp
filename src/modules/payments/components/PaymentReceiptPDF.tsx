import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { numberToWords } from '@/lib/numberToWords';
import { calculateEntityTotal } from '@/lib/calculateTotal';
import type { Payment } from '@/modules/payments/types';
import { getStatusTranslationKey } from '@/config/entity-statuses';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

// Reuse styles from OfferPDFDocument with additions for payment section
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
    justifyContent: 'flex-start',
    alignItems: 'center',
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
  infoLabel: { fontSize: 9, color: '#6B7280', width: 85 },
  infoValue: { fontSize: 9, color: '#1F2937', flex: 1 },
  infoValueBold: { fontSize: 9, color: '#1F2937', flex: 1, fontFamily: 'Helvetica-Bold' },

  // Table
  tableContainer: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'hidden',
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

  // Summary
  summaryWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  summaryBox: {
    width: 240,
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
  totalLabel: { fontSize: 9, color: '#1F2937' },
  totalValue: { fontSize: 9, color: '#1F2937' },

  // Payment section
  paymentSection: {
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'hidden',
  },
  paymentHeader: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#D1FAE5',
    borderBottomStyle: 'solid',
  },
  paymentHeaderText: {
    fontSize: 10,
    color: '#065F46',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontFamily: 'Helvetica-Bold',
  },
  paymentBody: {
    padding: 12,
  },
  paymentGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 8,
  },
  paymentCol: {
    flex: 1,
  },
  paymentAmountBox: {
    backgroundColor: '#F0FDF4',
    borderRadius: 4,
    padding: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  paymentAmountLabel: {
    fontSize: 8,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  paymentAmountValue: {
    fontSize: 14,
    color: '#065F46',
    fontFamily: 'Helvetica-Bold',
  },

  // Balance summary
  balanceSection: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'hidden',
  },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    borderBottomStyle: 'solid',
  },
  balanceLabel: { fontSize: 9, color: '#6B7280' },
  balanceValue: { fontSize: 9, color: '#1F2937' },
  balanceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FEF3C7',
  },
  balanceTotalLabel: { fontSize: 9, color: '#92400E', fontFamily: 'Helvetica-Bold' },
  balanceTotalValue: { fontSize: 9, color: '#92400E', fontFamily: 'Helvetica-Bold' },

  // Notes
  notesBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },
  installBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
  },

  // Footer
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

const methodLabels: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  check: 'Check',
  card: 'Card',
  other: 'Other',
};

interface PaymentReceiptPDFProps {
  offer: any;
  payment: Payment;
  payments: Payment[]; // All payments for balance calculation
  formatCurrency: (amount: number) => string;
  settings?: any;
  currencyCode?: string;
  language?: string;
}

export function PaymentReceiptPDF({
  offer,
  payment,
  payments,
  formatCurrency,
  settings,
  currencyCode = 'TND',
  language = 'en',
}: PaymentReceiptPDFProps) {
  const { t } = useTranslation('payments');
  const config = settings || {
    company: { name: '', address: '', phone: '', email: '', website: '' },
    showElements: { customerInfo: true, quoteInfo: true, itemsTable: true, summary: true, footer: true, logo: false, companyName: false, quoteDetails: true, pageNumbers: true },
    table: { showPositions: true, showArticleCodes: true, showQuantity: true, showUnitPrice: true, alternateRowColors: true },
    dateFormat: 'en-US',
    paperSize: 'A4',
  };

  const formatDate = (dateString: string | Date) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy');
    } catch {
      return '-';
    }
  };

  const totals = calculateEntityTotal(offer as any);
  const subtotal = totals.subtotal;
  const discountAmount = totals.discountAmount;
  const afterDiscount = totals.afterDiscount;
  const taxAmount = totals.taxAmount;
  const fiscalStamp = totals.fiscalStamp;
  const total = totals.total;

  // Calculate payment balance
  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const paidBeforeThis = payments
    .filter(p => p.status === 'completed' && p.id !== payment.id && new Date(p.paymentDate) <= new Date(payment.paymentDate))
    .reduce((sum, p) => sum + p.amount, 0);
  const remainingAfter = total - totalPaid;

  const entityLabel = offer.offerNumber ? 'Offer' : 'Sale';
  const entityNumber = offer.offerNumber || offer.saleNumber || `${entityLabel}-${offer.id}`;

  return (
    <Document>
      <Page size={config.paperSize as any} style={styles.page} wrap>

        {/* ── HEADER ── */}
        <View style={styles.headerContainer}>
          {config.showElements?.logo && config.company?.logo?.startsWith('data:image/') ? (
            <Image
              src={config.company.logo as any}
              style={{
                width: config.logoSize || 48,
                maxHeight: 50,
                objectFit: 'contain',
              }}
            />
          ) : <View />}
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>

          {/* ── PAYMENT RECEIPT BADGE ── */}
          <View style={styles.paymentSection} wrap={false}>
            <View style={styles.paymentHeader}>
              <Text style={styles.paymentHeaderText}>Payment Receipt</Text>
            </View>
            <View style={styles.paymentBody}>
              <View style={styles.paymentGrid}>
                <View style={styles.paymentCol}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Reference:</Text>
                    <Text style={styles.infoValueBold}>{payment.paymentReference || payment.receiptNumber || '—'}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Date:</Text>
                    <Text style={styles.infoValue}>{formatDate(payment.paymentDate)}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Method:</Text>
                    <Text style={styles.infoValue}>{methodLabels[payment.paymentMethod] || payment.paymentMethod}</Text>
                  </View>
                </View>
                <View style={styles.paymentCol}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{entityLabel} N°:</Text>
                    <Text style={styles.infoValue}>{entityNumber}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Status:</Text>
                    <Text style={styles.infoValueBold}>{payment.status?.toUpperCase()}</Text>
                  </View>
                  {payment.notes && (
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Notes:</Text>
                      <Text style={styles.infoValue}>{payment.notes}</Text>
                    </View>
                  )}
                </View>
              </View>
              <View style={styles.paymentAmountBox}>
                <Text style={styles.paymentAmountLabel}>Amount Paid</Text>
                <Text style={styles.paymentAmountValue}>{formatCurrency(payment.amount)}</Text>
              </View>
            </View>
          </View>

          {/* Customer + Offer Details */}
          <View style={styles.infoGrid}>
            {config.showElements?.customerInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>Customer Information</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Name:</Text>
                  <Text style={styles.infoValue}>{offer.contactName || '-'}</Text>
                </View>
                {offer.contactCompany && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{offer.contactCompany}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoValue}>{offer.contactAddress || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{offer.contactPhone || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={styles.infoValue}>{offer.contactEmail || '-'}</Text>
                </View>
                {offer.contactMatriculeFiscale && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tax ID:</Text>
                    <Text style={styles.infoValue}>{offer.contactMatriculeFiscale}</Text>
                  </View>
                )}
              </View>
            )}

            {config.showElements?.quoteInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{entityLabel} Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{entityLabel} N°:</Text>
                  <Text style={styles.infoValue}>{entityNumber}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>{formatDate(offer.createdAt || new Date())}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Status:</Text>
                  <Text style={styles.infoValueBold}>{t(getStatusTranslationKey('offer', offer.status), { defaultValue: (offer.status || 'DRAFT').toUpperCase() })}</Text>
                </View>
              </View>
            )}
          </View>

          {/* Installation */}
          {offer.linkedInstallation && (
            <View style={styles.installBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>Installation Information</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Name:</Text>
                <Text style={styles.infoValue}>{offer.linkedInstallation.name}</Text>
              </View>
              {offer.linkedInstallation.model && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Model:</Text>
                  <Text style={styles.infoValue}>{offer.linkedInstallation.model}</Text>
                </View>
              )}
              {offer.linkedInstallation.serialNumber && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Serial Number:</Text>
                  <Text style={styles.infoValue}>{offer.linkedInstallation.serialNumber}</Text>
                </View>
              )}
            </View>
          )}

          {/* Items Table */}
          {config.showElements?.itemsTable !== false && offer.items && offer.items.length > 0 && (
            <View style={styles.tableContainer} wrap={false}>
              <View style={styles.tableHeader}>
                {config.table?.showPositions && (
                  <View style={styles.posCol}><Text style={styles.tableHeaderText}>Pos</Text></View>
                )}
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>Description</Text></View>
                {config.table?.showQuantity && (
                  <View style={styles.qtyCol}><Text style={styles.tableHeaderText}>Qty</Text></View>
                )}
                {config.table?.showUnitPrice && (
                  <View style={styles.unitCol}><Text style={styles.tableHeaderText}>Unit</Text></View>
                )}
                <View style={styles.amountCol}><Text style={styles.tableHeaderText}>Total</Text></View>
              </View>

              {offer.items.map((item: any, index: number) => (
                <View
                  key={item.id || index}
                  style={[styles.tableRow, config.table?.alternateRowColors && index % 2 === 1 ? styles.tableRowAlt : {}]}
                >
                  {config.table?.showPositions && (
                    <View style={styles.posCol}><Text style={styles.cellBold}>{index + 1}</Text></View>
                  )}
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{item.itemName}</Text>
                    {item.itemCode && <Text style={styles.cellMuted}>{item.itemCode}</Text>}
                  </View>
                  {config.table?.showQuantity && (
                    <View style={styles.qtyCol}><Text style={styles.cell}>{item.quantity}</Text></View>
                  )}
                  {config.table?.showUnitPrice && (
                    <View style={styles.unitCol}><Text style={styles.cell}>{formatCurrency(item.unitPrice)}</Text></View>
                  )}
                  <View style={styles.amountCol}><Text style={styles.cellBold}>{formatCurrency(item.totalPrice)}</Text></View>
                </View>
              ))}

              {/* Subtotal footer row */}
              <View style={[styles.tableRow, { backgroundColor: '#F3F4F6', borderBottomWidth: 0 }]}>
                {config.table?.showPositions && <View style={styles.posCol} />}
                <View style={styles.descCol}>
                  <Text style={[styles.cellBold, { fontFamily: 'Helvetica-Bold' }]}>Subtotal (HT)</Text>
                </View>
                {config.table?.showQuantity && <View style={styles.qtyCol} />}
                {config.table?.showUnitPrice && <View style={styles.unitCol} />}
                <View style={styles.amountCol}>
                  <Text style={[styles.cellBold, { fontFamily: 'Helvetica-Bold' }]}>{formatCurrency(subtotal)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Financial Summary */}
          {config.showElements?.summary !== false && (
            <View style={styles.summaryWrap} wrap={false}>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal (HT)</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Discount {(offer.discountType || 'fixed') === 'percentage' ? `(${offer.discount || 0}%)` : ''}</Text>
                    <Text style={styles.summaryValue}>-{formatCurrency(discountAmount)}</Text>
                  </View>
                )}
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Net HT</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(afterDiscount)}</Text>
                  </View>
                )}
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>TVA {(offer.taxType || 'percentage') === 'percentage' ? `(${offer.taxes || 0}%)` : ''}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
                </View>
                {fiscalStamp > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Fiscal Stamp</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(fiscalStamp)}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Total (TTC)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* ── PAYMENT BALANCE SECTION ── */}
          <View style={styles.balanceSection} wrap={false}>
            <View style={{ backgroundColor: '#F9FAFB', paddingHorizontal: 12, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid' }}>
              <Text style={{ fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8 }}>Payment Balance</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Total Amount</Text>
              <Text style={styles.balanceValue}>{formatCurrency(total)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={styles.balanceLabel}>Previously Paid</Text>
              <Text style={styles.balanceValue}>{formatCurrency(paidBeforeThis)}</Text>
            </View>
            <View style={styles.balanceRow}>
              <Text style={{ ...styles.balanceLabel, color: '#065F46' }}>This Payment</Text>
              <Text style={{ ...styles.balanceValue, color: '#065F46', fontFamily: 'Helvetica-Bold' }}>{formatCurrency(payment.amount)}</Text>
            </View>
            <View style={styles.balanceTotalRow}>
              <Text style={styles.balanceTotalLabel}>Remaining Balance</Text>
              <Text style={styles.balanceTotalValue}>{formatCurrency(Math.max(0, remainingAfter))}</Text>
            </View>
          </View>

          {/* Amount in Words */}
          {payment.amount > 0 && (
            <View style={{ marginBottom: 16, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 2 }}>Amount in Words:</Text>
              <Text style={{ fontSize: 9, color: '#1F2937', fontStyle: 'italic' }}>
                {numberToWords(payment.amount, currencyCode, language)}
              </Text>
            </View>
          )}

          {/* Notes */}
          {offer.notes && (
            <View style={styles.notesBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>Additional Notes</Text>
              <Text style={styles.cell}>{offer.notes}</Text>
            </View>
          )}
        </View>

        {/* ── FOOTER ── */}
        {config.showElements?.footer !== false && (
          <View style={styles.footer} wrap={false}>
            <View>
              <Text style={styles.footerText}>
                {config.company?.name || ''} • {config.company?.address || ''}
              </Text>
              <Text style={styles.footerText}>
                {config.company?.phone || ''} • {config.company?.email || ''} • {config.company?.website || ''}
              </Text>
              {config.company?.footerMessage && (
                <Text style={styles.footerText}>{config.company.footerMessage}</Text>
              )}
            </View>
            {config.showElements?.pageNumbers && (
              <Text style={styles.pageNum}>Page 1 / 1</Text>
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
