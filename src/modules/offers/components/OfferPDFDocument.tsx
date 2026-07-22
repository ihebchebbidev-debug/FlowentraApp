import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { numberToWords } from '@/lib/numberToWords';
import { getStatusTranslationKey } from '@/config/entity-statuses';
import { calculateEntityTotal } from '@/lib/calculateTotal';
import { InstallationDataTable } from '@/shared/components/PDFInstallationTable';

import { registerUnicodeFonts, UNICODE_FONT_FAMILY } from '@/shared/pdf/fonts';

registerUnicodeFonts();
// Professional devis/facture — structured, bordered sections, clean typography
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 30,
    paddingTop: 20,
    paddingBottom: 12,
    fontFamily: UNICODE_FONT_FAMILY,
    fontSize: 9,
  },

  // Header — logo left, no border
  headerContainer: {
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  logoImage: {
    width: 180,
    height: 75,
    objectFit: 'contain',
  },
  docTitleBlock: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
  },
  docTitle: {
    fontSize: 9,
    color: '#1F2937',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  docNumber: {
    fontSize: 9,
    color: '#374151',
    marginTop: 3,
  },
  docDate: {
    fontSize: 9,
    color: '#6B7280',
    marginTop: 2,
  },

  // Divider line
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#D1D5DB',
    borderBottomStyle: 'solid',
  },
  dividerThick: {
    borderBottomWidth: 2,
    borderBottomColor: '#374151',
    borderBottomStyle: 'solid',
  },

  // Content area
  content: {
    flex: 1,
  },

  // Two-column info grid
  infoGrid: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 16,
  },
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
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 9,
    color: '#6B7280',
    width: 85,
  },
  infoValue: {
    fontSize: 9,
    color: '#1F2937',
    flex: 1,
  },
  infoValueBold: {
    fontSize: 9,
    color: '#1F2937',
    flex: 1,
  },
  clientName: {
    fontSize: 9,
    color: '#1F2937',
    marginBottom: 4,
  },

  // Table
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
  tableRowAlt: {
    backgroundColor: '#FAFAFA',
  },
  posCol: { width: 30 },
  descCol: { flex: 1, paddingRight: 4 },
  qtyCol: { width: 45, textAlign: 'right' },
  unitCol: { width: 70, textAlign: 'right' },
  amountCol: { width: 80, textAlign: 'right' },
  cell: { fontSize: 9, color: '#1F2937' },
  cellBold: { fontSize: 9, color: '#1F2937' },
  cellMuted: { fontSize: 9, color: '#9CA3AF', marginTop: 1 },

  // Summary — right-aligned box
  summaryWrap: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 16,
  },
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

  // Notes
  notesBox: {
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

interface PdfTranslations {
  offer: string; offerNumber: string; date: string; client: string;
  customerInformation: string; offerDetails: string; position: string;
  name: string; email: string; phone: string; address: string; status: string;
  created: string; validUntil: string; assignedTo: string; description: string;
  offerItems: string; pos: string; qty: string; unit: string; total: string;
  subtotal: string; tax: string; tva: string; discount: string;
  additionalNotes: string; thankYouMessage: string; page: string;
  taxId: string; cin: string;
  installationInfo: string; installationName: string; model: string; serialNumber: string;
  matricule: string; manufacturer: string;
  fiscalStamp: string; amountInWords: string;
  statusValue?: string; validity?: string;
}

export interface InstallationDetails {
  name?: string;
  model?: string;
  serialNumber?: string;
  matricule?: string;
  manufacturer?: string;
  siteAddress?: string;
}

interface OfferPDFDocumentProps {
  offer: any;
  formatCurrency: (amount: number) => string;
  settings?: any;
  translations?: PdfTranslations;
  currencyCode?: string;
  language?: string;
  signatureImage?: string;
  installationsData?: Record<string, InstallationDetails>;
}

export function OfferPDFDocument({ offer, formatCurrency, settings, translations, currencyCode = 'TND', language = 'en', signatureImage, installationsData }: OfferPDFDocumentProps) {
  const t = translations || {
    offer: 'OFFER', offerNumber: 'Offer N°', date: 'Date', client: 'CLIENT',
    customerInformation: 'Customer Information', offerDetails: 'Offer Details',
    name: 'Name', position: 'Position', email: 'Email', phone: 'Phone', address: 'Address',
    status: 'Status', created: 'Created', validUntil: 'Valid Until',
    assignedTo: 'Assigned To', description: 'Description', offerItems: 'Offer Items',
    pos: 'Pos', qty: 'Qty', unit: 'Unit', total: 'Total',
    subtotal: 'Subtotal', tax: 'Tax', tva: 'TVA', discount: 'Discount',
    additionalNotes: 'Additional Notes', thankYouMessage: 'Thank you for considering our offer.',
    page: 'Page 1 / 1', taxId: 'Tax ID', cin: 'CIN',
    installationInfo: 'Installation Information', installationName: 'Name',
    model: 'Model', serialNumber: 'Serial Number', matricule: 'Matricule', manufacturer: 'Manufacturer',
    fiscalStamp: 'Fiscal Stamp', amountInWords: 'Amount in Words',
  };

  const config = settings || {
    company: { name: '', address: '', phone: '', email: '', website: '' },
    showElements: { customerInfo: true, quoteInfo: true, itemsTable: true, summary: true, footer: false, logo: false, companyName: false, quoteDetails: true, pageNumbers: true },
    table: { showPositions: true, showArticleCodes: true, showQuantity: true, showUnitPrice: true, alternateRowColors: true },
    dateFormat: 'en-US', currencySymbol: '$', taxRate: 0, paperSize: 'A4',
  };

  const formatDate = (dateString: string | Date) => {
    const locale = config.dateFormat === 'en-US' ? 'en-US' : config.dateFormat === 'en-GB' ? 'en-GB' : config.dateFormat === 'iso' ? 'sv-SE' : 'de-DE';
    return new Date(dateString).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  const totals = calculateEntityTotal(offer as any);
  const subtotal = totals.subtotal;
  const discountAmount = totals.discountAmount;
  const afterDiscount = totals.afterDiscount;
  const taxAmount = totals.taxAmount;
  const fiscalStamp = totals.fiscalStamp;
  const total = totals.total;

  return (
    <Document key={JSON.stringify(settings)}>
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
                alignSelf: 'flex-start',
              }}
            />
          ) : <View />}
        </View>

        {/* ── CONTENT ── */}
        <View style={styles.content}>

          {/* Customer + Offer Details */}
          <View style={styles.infoGrid}>
            {config.showElements?.customerInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{t.customerInformation}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.name}:</Text>
                  <Text style={styles.infoValue}>{offer.contactName || '-'}</Text>
                </View>
                {offer.contactCompany && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoValue}>{offer.contactCompany}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.address}:</Text>
                  <Text style={styles.infoValue}>{offer.contactAddress || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.phone}:</Text>
                  <Text style={styles.infoValue}>{offer.contactPhone || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.email}:</Text>
                  <Text style={styles.infoValue}>{offer.contactEmail || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.taxId}:</Text>
                  <Text style={styles.infoValue}>{offer.contactMatriculeFiscale || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.cin}:</Text>
                  <Text style={styles.infoValue}>{offer.contactCin || '-'}</Text>
                </View>
              </View>
            )}

            {config.showElements?.quoteInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{t.offerDetails}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.offerNumber}:</Text>
                  <Text style={styles.infoValue}>{offer.offerNumber || `OFF-${offer.id}`}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.date}:</Text>
                  <Text style={styles.infoValue}>{formatDate(offer.createdAt || new Date())}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.status}:</Text>
                  <Text style={styles.infoValueBold}>{t.statusValue || (offer.status || 'DRAFT').toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t.validUntil}:</Text>
                  <Text style={styles.infoValue}>{offer.validUntil ? formatDate(offer.validUntil) : '-'}</Text>
                </View>
                {offer.assignedToName && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{t.assignedTo}:</Text>
                    <Text style={styles.infoValue}>{offer.assignedToName}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* Installation */}
          {offer.linkedInstallation && (
            <InstallationDataTable
              installation={offer.linkedInstallation}
              translations={t}
            />
          )}

          {/* Items Table — grouped by installation */}
          {config.showElements?.itemsTable !== false && offer.items && offer.items.length > 0 && (() => {
            // Group items by installation
            const groups: { key: string; label: string; items: any[] }[] = [];
            const groupMap = new Map<string, any[]>();
            const generalItems: any[] = [];
            offer.items.forEach((item: any) => {
              if (item.installationId && item.installationName) {
                const key = String(item.installationId);
                if (!groupMap.has(key)) groupMap.set(key, []);
                groupMap.get(key)!.push(item);
              } else {
                generalItems.push(item);
              }
            });
            if (generalItems.length > 0) groups.push({ key: '_general', label: 'General Items', items: generalItems });
            groupMap.forEach((items, key) => {
              groups.push({ key, label: `Installation: ${items[0].installationName}`, items });
            });

            let globalPos = 0;
            return groups.map((group) => {
              return (
              <View
                key={group.key}
                style={styles.tableContainer}
              >
                {/* Group header + installation info should not be orphaned */}
                <View wrap={false} minPresenceAhead={110}>
                  <View style={{ backgroundColor: '#E5E7EB', paddingVertical: 6, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {group.label}
                    </Text>
                  </View>
                  {/* Installation details mini-table */}
                  {group.key !== '_general' && (
                    <InstallationDataTable
                      installation={installationsData && installationsData[group.key] ? installationsData[group.key] : { name: group.items[0].installationName }}
                      translations={t}
                    />
                  )}
                </View>

                {/* Table header should not end a page alone */}
                <View style={styles.tableHeader} wrap={false} minPresenceAhead={40}>
                  {config.table?.showPositions && (
                    <View style={styles.posCol}><Text style={styles.tableHeaderText}>{t.pos}</Text></View>
                  )}
                  <View style={styles.descCol}><Text style={styles.tableHeaderText}>{t.description}</Text></View>
                  {config.table?.showQuantity && (
                    <View style={styles.qtyCol}><Text style={styles.tableHeaderText}>{t.qty}</Text></View>
                  )}
                  {config.table?.showUnitPrice && (
                    <View style={styles.unitCol}><Text style={styles.tableHeaderText}>{t.unit}</Text></View>
                  )}
                  <View style={styles.amountCol}><Text style={styles.tableHeaderText}>{t.total}</Text></View>
                </View>
                {/* Rows */}
                {group.items.map((item: any, index: number) => {
                  globalPos++;
                  return (
                    <View
                      key={item.id || index}
                      style={[styles.tableRow, config.table?.alternateRowColors && index % 2 === 1 ? styles.tableRowAlt : {}]}
                      wrap={false}
                    >
                      {config.table?.showPositions && (
                        <View style={styles.posCol}><Text style={styles.cellBold}>{globalPos}</Text></View>
                      )}
                      <View style={styles.descCol}>
                        <Text style={styles.cell}>{item.itemName}</Text>
                        {item.itemCode && <Text style={styles.cellMuted}>{item.itemCode}</Text>}
                      </View>
                      {config.table?.showQuantity && (
                        <View style={styles.qtyCol}><Text style={styles.cell}>{Number(item.quantity || 0).toFixed(2)}</Text></View>
                      )}
                      {config.table?.showUnitPrice && (
                        <View style={styles.unitCol}><Text style={styles.cell}>{formatCurrency(item.unitPrice)}</Text></View>
                      )}
                      <View style={styles.amountCol}><Text style={styles.cellBold}>{formatCurrency(item.totalPrice)}</Text></View>
                    </View>
                  );
                })}
                {/* Group subtotal row */}
                <View style={[styles.tableRow, { backgroundColor: '#F3F4F6', borderBottomWidth: 0 }]} wrap={false} minPresenceAhead={40}>
                  {config.table?.showPositions && <View style={styles.posCol} />}
                  <View style={styles.descCol}>
                    <Text style={[styles.cellBold, { fontFamily: 'Helvetica-Bold' }]}>
                      {groups.length > 1 ? `${t.subtotal} — ${group.label}` : `${t.subtotal} (HT)`}
                    </Text>
                  </View>
                  {config.table?.showQuantity && <View style={styles.qtyCol} />}
                  {config.table?.showUnitPrice && <View style={styles.unitCol} />}
                  <View style={styles.amountCol}>
                    <Text style={[styles.cellBold, { fontFamily: 'Helvetica-Bold' }]}>
                      {formatCurrency(group.items.reduce((sum: number, it: any) => sum + (it.totalPrice || 0), 0))}
                    </Text>
                  </View>
                </View>
              </View>
            );
            })
          })()}

          {/* Summary */}
          {config.showElements?.summary !== false && (
            <View style={styles.summaryWrap} wrap={false}>
              <View style={styles.summaryBox}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{t.subtotal} (HT)</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(subtotal)}</Text>
                </View>
                {discountAmount > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t.discount} {(offer.discountType || 'fixed') === 'percentage' ? `(${offer.discount || 0}%)` : ''}</Text>
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
                  <Text style={styles.summaryLabel}>{t.tva} {(offer.taxType || 'percentage') === 'percentage' ? `(${offer.taxes || 0}%)` : ''}</Text>
                  <Text style={styles.summaryValue}>{formatCurrency(taxAmount)}</Text>
                </View>
                {fiscalStamp > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{t.fiscalStamp}</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(fiscalStamp)}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{t.total} (TTC)</Text>
                  <Text style={styles.totalValue}>{formatCurrency(total)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Amount in Words */}
          {total > 0 && (
            <View style={{ marginBottom: 16, paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 8, color: '#6B7280', marginBottom: 2 }}>{t.amountInWords}:</Text>
              <Text style={{ fontSize: 9, color: '#1F2937', fontStyle: 'italic' }}>
                {numberToWords(Math.round(total), currencyCode, language)}
              </Text>
            </View>
          )}

          {/* Signature block removed — signing is now done via on-document annotation */}

          {/* Notes */}
          {offer.notes && (
            <View style={styles.notesBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>{t.additionalNotes}</Text>
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
              <Text
                style={styles.pageNum}
                render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`}
              />
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}