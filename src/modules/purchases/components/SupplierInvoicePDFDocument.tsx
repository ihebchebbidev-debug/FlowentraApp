import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { numberToWords } from '@/lib/numberToWords';

const styles = StyleSheet.create({
  page: { flexDirection: 'column', backgroundColor: '#FFFFFF', paddingHorizontal: 30, paddingTop: 20, paddingBottom: 12, fontFamily: 'Helvetica', fontSize: 9 },
  headerContainer: { paddingBottom: 14, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  content: { flex: 1 },
  infoGrid: { flexDirection: 'row', marginBottom: 18, gap: 16 },
  infoBox: { flex: 1, borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'solid', borderRadius: 4, padding: 12 },
  infoBoxTitle: { fontSize: 9, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', borderBottomStyle: 'solid' },
  infoRow: { flexDirection: 'row', marginBottom: 3 },
  infoLabel: { fontSize: 9, color: '#6B7280', width: 95 },
  infoValue: { fontSize: 9, color: '#1F2937', flex: 1 },
  infoValueBold: { fontSize: 9, color: '#1F2937', flex: 1, fontFamily: 'Helvetica-Bold' },
  tableContainer: { marginBottom: 18, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'solid', borderRadius: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F3F4F6', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#D1D5DB', borderBottomStyle: 'solid' },
  tableHeaderText: { fontSize: 9, color: '#374151', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', borderBottomStyle: 'solid' },
  tableRowAlt: { backgroundColor: '#FAFAFA' },
  posCol: { width: 30 },
  descCol: { flex: 1, paddingRight: 4 },
  qtyCol: { width: 45, textAlign: 'right' },
  unitCol: { width: 70, textAlign: 'right' },
  amountCol: { width: 80, textAlign: 'right' },
  cell: { fontSize: 9, color: '#1F2937' },
  cellBold: { fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold' },
  cellMuted: { fontSize: 9, color: '#9CA3AF', marginTop: 1 },
  summaryWrap: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: 16 },
  summaryBox: { width: 260, borderWidth: 1, borderColor: '#D1D5DB', borderStyle: 'solid', borderRadius: 4, overflow: 'hidden' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 5, borderBottomWidth: 1, borderBottomColor: '#F3F4F6', borderBottomStyle: 'solid' },
  summaryLabel: { fontSize: 9, color: '#6B7280' },
  summaryValue: { fontSize: 9, color: '#1F2937' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#F3F4F6' },
  totalLabel: { fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold' },
  totalValue: { fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold' },
  complianceBox: { borderWidth: 1, borderColor: '#FDE68A', borderStyle: 'solid', borderRadius: 4, padding: 12, marginBottom: 16, backgroundColor: '#FFFBEB' },
  notesBox: { borderWidth: 1, borderColor: '#E5E7EB', borderStyle: 'solid', borderRadius: 4, padding: 12, marginBottom: 16 },
  footer: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#D1D5DB', borderTopStyle: 'solid', marginTop: 'auto', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  footerText: { fontSize: 9, color: '#9CA3AF', lineHeight: 1.4 },
  pageNum: { fontSize: 9, color: '#9CA3AF' },
});

interface InvoicePdfTranslations {
  supplierInvoice: string; invoiceNumber: string; date: string;
  supplierInformation: string; invoiceDetails: string;
  name: string; email: string; phone: string; address: string; taxId: string;
  status: string; dueDate: string; poReference: string; supplierRef: string;
  description: string; pos: string; qty: string; unitPrice: string; total: string;
  subtotal: string; tax: string; tva: string; discount: string;
  fiscalStamp: string; rsDeduction: string; netPayable: string;
  additionalNotes: string; amountInWords: string; page: string;
  complianceInfo: string; rsType: string; rsRate: string; rsAmount: string;
  statusValue?: string;
}

interface SupplierInvoicePDFDocumentProps {
  invoice: any;
  formatCurrency: (amount: number) => string;
  settings?: any;
  translations?: InvoicePdfTranslations;
  currencyCode?: string;
  language?: string;
}

export function SupplierInvoicePDFDocument({ invoice, formatCurrency, settings, translations, currencyCode = 'TND', language = 'en' }: SupplierInvoicePDFDocumentProps) {
  const t = translations || {
    supplierInvoice: 'SUPPLIER INVOICE', invoiceNumber: 'Invoice N°', date: 'Date',
    supplierInformation: 'Supplier Information', invoiceDetails: 'Invoice Details',
    name: 'Name', email: 'Email', phone: 'Phone', address: 'Address', taxId: 'Tax ID',
    status: 'Status', dueDate: 'Due Date', poReference: 'PO Reference', supplierRef: 'Supplier Ref',
    description: 'Description', pos: 'Pos', qty: 'Qty', unitPrice: 'Unit Price', total: 'Total',
    subtotal: 'Subtotal', tax: 'Tax', tva: 'TVA', discount: 'Discount',
    fiscalStamp: 'Fiscal Stamp', rsDeduction: 'RS Deduction', netPayable: 'Net Payable',
    additionalNotes: 'Additional Notes', amountInWords: 'Amount in Words', page: 'Page',
    complianceInfo: 'Compliance Information', rsType: 'RS Type', rsRate: 'RS Rate', rsAmount: 'RS Amount',
  };

  const config = settings || {
    company: { name: '', address: '', phone: '', email: '' },
    showElements: { customerInfo: true, quoteInfo: true, itemsTable: true, summary: true, footer: false, logo: false, pageNumbers: true },
    table: { showPositions: true, showQuantity: true, showUnitPrice: true, alternateRowColors: true },
    dateFormat: 'en-US', paperSize: 'A4',
  };

  const formatDate = (dateString: string | Date) => {
    const locale = config.dateFormat === 'en-US' ? 'en-US' : config.dateFormat === 'en-GB' ? 'en-GB' : 'de-DE';
    return new Date(dateString).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const items = invoice.items || [];
  const subTotal = invoice.subTotal || 0;
  const discountAmount = invoice.discountType === 'percentage' ? subTotal * ((invoice.discount || 0) / 100) : (invoice.discount || 0);
  const afterDiscount = subTotal - discountAmount;
  const taxAmount = invoice.taxAmount || 0;
  const fiscalStamp = invoice.fiscalStamp || 0;
  const rsAmount = invoice.rsAmount || 0;
  const grandTotal = invoice.grandTotal || (afterDiscount + taxAmount + fiscalStamp);
  const netPayable = grandTotal - rsAmount;

  return (
    <Document>
      <Page size={(config.paperSize || 'A4') as any} style={styles.page} wrap>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          {config.showElements?.logo && config.company?.logo?.startsWith('data:image/') ? (
            <Image src={config.company.logo as any} style={{ width: config.logoSize || 48, maxHeight: 50, objectFit: 'contain', alignSelf: 'flex-start' }} />
          ) : <View />}
        </View>

        <View style={styles.content}>
          {/* Supplier + Invoice Details */}
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{t.supplierInformation}</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.name}:</Text><Text style={styles.infoValueBold}>{invoice.supplierName || '-'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.taxId}:</Text><Text style={styles.infoValue}>{invoice.supplierMatriculeFiscale || '-'}</Text></View>
            </View>

            <View style={styles.infoBox}>
              <Text style={styles.infoBoxTitle}>{t.invoiceDetails}</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.invoiceNumber}:</Text><Text style={styles.infoValueBold}>{invoice.invoiceNumber || '-'}</Text></View>
              {invoice.supplierInvoiceRef && <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.supplierRef}:</Text><Text style={styles.infoValue}>{invoice.supplierInvoiceRef}</Text></View>}
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.date}:</Text><Text style={styles.infoValue}>{formatDate(invoice.invoiceDate || new Date())}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.dueDate}:</Text><Text style={styles.infoValue}>{invoice.dueDate ? formatDate(invoice.dueDate) : '-'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.status}:</Text><Text style={styles.infoValue}>{t.statusValue || (invoice.status || 'draft').toUpperCase()}</Text></View>
              {invoice.purchaseOrderNumber && <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.poReference}:</Text><Text style={styles.infoValue}>{invoice.purchaseOrderNumber}</Text></View>}
            </View>
          </View>

          {/* Items Table */}
          {items.length > 0 && (
            <View style={styles.tableContainer}>
              <View style={styles.tableHeader} wrap={false}>
                {config.table?.showPositions && <View style={styles.posCol}><Text style={styles.tableHeaderText}>{t.pos}</Text></View>}
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>{t.description}</Text></View>
                {config.table?.showQuantity && <View style={styles.qtyCol}><Text style={styles.tableHeaderText}>{t.qty}</Text></View>}
                {config.table?.showUnitPrice && <View style={styles.unitCol}><Text style={styles.tableHeaderText}>{t.unitPrice}</Text></View>}
                <View style={styles.amountCol}><Text style={styles.tableHeaderText}>{t.total}</Text></View>
              </View>
              {items.map((item: any, index: number) => (
                <View key={item.id || index} style={[styles.tableRow, config.table?.alternateRowColors && index % 2 === 1 ? styles.tableRowAlt : {}]} wrap={false}>
                  {config.table?.showPositions && <View style={styles.posCol}><Text style={styles.cellBold}>{index + 1}</Text></View>}
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{item.articleName || item.description}</Text>
                  </View>
                  {config.table?.showQuantity && <View style={styles.qtyCol}><Text style={styles.cell}>{Number(item.quantity || 0).toFixed(2)}</Text></View>}
                  {config.table?.showUnitPrice && <View style={styles.unitCol}><Text style={styles.cell}>{formatCurrency(item.unitPrice)}</Text></View>}
                  <View style={styles.amountCol}><Text style={styles.cellBold}>{formatCurrency(item.lineTotal)}</Text></View>
                </View>
              ))}
            </View>
          )}

          {/* Summary */}
          <View style={styles.summaryWrap} wrap={false}>
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t.subtotal} (HT)</Text>
                <Text style={styles.summaryValue}>{formatCurrency(subTotal)}</Text>
              </View>
              {discountAmount > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.discount} {invoice.discountType === 'percentage' ? `(${invoice.discount}%)` : ''}</Text>
                  <Text style={styles.summaryValue}>-{formatCurrency(discountAmount)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{t.tva}</Text>
                <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
              </View>
              {fiscalStamp > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.fiscalStamp}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(fiscalStamp)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>{t.total} (TTC)</Text>
                <Text style={styles.totalValue}>{formatCurrency(grandTotal)}</Text>
              </View>
              {rsAmount > 0 && (
                <View style={[styles.summaryRow, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.summaryLabel, { color: '#92400E' }]}>{t.rsDeduction}</Text>
                  <Text style={[styles.summaryValue, { color: '#92400E' }]}>-{formatCurrency(rsAmount)}</Text>
                </View>
              )}
              {rsAmount > 0 && (
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t.netPayable}</Text>
                  <Text style={styles.totalValue}>{formatCurrency(netPayable)}</Text>
                </View>
              )}
            </View>
          </View>

          {/* Amount in Words */}
          {grandTotal > 0 && (
            <View style={{ marginBottom: 16, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 2 }}>{t.amountInWords}:</Text>
              <Text style={{ fontSize: 9, color: '#1F2937', fontStyle: 'italic' }}>
                {numberToWords(Math.round(grandTotal), currencyCode, language)}
              </Text>
            </View>
          )}

          {/* Compliance Info */}
          {invoice.rsApplicable && (
            <View style={styles.complianceBox} wrap={false}>
              <Text style={[styles.infoBoxTitle, { color: '#92400E' }]}>{t.complianceInfo}</Text>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.rsType}:</Text><Text style={styles.infoValue}>{invoice.rsTypeCode || '-'}</Text></View>
              <View style={styles.infoRow}><Text style={styles.infoLabel}>{t.rsAmount}:</Text><Text style={styles.infoValue}>{formatCurrency(rsAmount)}</Text></View>
            </View>
          )}

          {/* Notes */}
          {invoice.notes && (
            <View style={styles.notesBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>{t.additionalNotes}</Text>
              <Text style={styles.cell}>{invoice.notes}</Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        {config.showElements?.footer !== false && (
          <View style={styles.footer} wrap={false}>
            <View>
              <Text style={styles.footerText}>{config.company?.name || ''} • {config.company?.address || ''}</Text>
              <Text style={styles.footerText}>{config.company?.phone || ''} • {config.company?.email || ''}</Text>
            </View>
            {config.showElements?.pageNumbers && (
              <Text style={styles.pageNum} render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}
