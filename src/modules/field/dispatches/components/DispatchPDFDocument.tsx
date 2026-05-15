import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { InstallationDataTable } from '@/shared/components/PDFInstallationTable';

/**
 * Professional Dispatch Technical Report
 * ─ Specific to one dispatch: customer, dispatch details, assigned technicians,
 *   time tracking, materials/articles used, notes. No financial/pricing data.
 * ─ Matches the visual style of Sale/Offer/ServiceOrder PDFs (9pt Helvetica, bordered info boxes, etc.)
 */

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

  /* ── Header ── */
  headerContainer: {
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },

  /* ── Content ── */
  content: {
    flex: 1,
  },

  /* ── Two-column info grid ── */
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
    width: 95,
  },
  infoValue: {
    fontSize: 9,
    color: '#1F2937',
    flex: 1,
  },
  clientName: {
    fontSize: 9,
    color: '#1F2937',
    marginBottom: 4,
  },

  /* ── Section box ── */
  sectionBox: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'solid',
    borderRadius: 4,
    padding: 12,
    marginBottom: 18,
  },

  /* ── Table ── */
  tableContainer: {
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderStyle: 'solid',
    borderRadius: 4,
    overflow: 'hidden',
  },
  tableTitle: {
    fontSize: 9,
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 0,
    paddingBottom: 6,
    paddingHorizontal: 10,
    paddingTop: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    borderBottomStyle: 'solid',
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

  /* Column widths */
  posCol: { width: 30 },
  articleCol: { width: 75 },
  descCol: { flex: 1, paddingRight: 4 },
  typeCol: { width: 70 },
  dateCol: { width: 70 },
  statusCol: { width: 70 },
  durationCol: { width: 70, textAlign: 'right' as const },
  qtyCol: { width: 45, textAlign: 'right' as const },
  unitCol: { width: 70, textAlign: 'right' as const },
  costCol: { width: 70, textAlign: 'right' as const },
  amountCol: { width: 80, textAlign: 'right' as const },
  cell: { fontSize: 9, color: '#1F2937' },
  cellMuted: { fontSize: 9, color: '#9CA3AF', marginTop: 1 },

  /* ── Summary ── */
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

  /* ── Footer ── */
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

// ── Helpers ──

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

// ── Component ──

interface DispatchPdfTranslations {
  customerInformation: string; email: string; phone: string; address: string;
  dispatchDetails: string; serviceOrder: string; status: string; priority: string;
  scheduled: string; estDuration: string; actualDuration: string;
  assignmentDetails: string; technicians: string; requiredSkills: string;
  installation: string; model: string; serialNumber: string; matricule: string; manufacturer: string; location: string;
  dispatchedBy: string; jobDescription: string; timeTracking: string;
  type: string; description: string; duration: string;
  materialsArticles: string; sku: string; article: string; qty: string;
  replacing: string;
  date: string; statusCol: string;
  technicalSummary: string; totalTime: string; estDurationSummary: string;
  materialsCount: string; notes: string; page: string;
  thankYouMessage: string;
}

const defaultTranslations: DispatchPdfTranslations = {
  customerInformation: 'Customer Information', email: 'Email:', phone: 'Phone:',
  address: 'Address:', dispatchDetails: 'Dispatch Details',
  serviceOrder: 'Service Order:', status: 'Status:', priority: 'Priority:',
  scheduled: 'Scheduled:', estDuration: 'Est. Duration:',
  actualDuration: 'Actual Duration:', assignmentDetails: 'Assignment Details',
  technicians: 'Technician(s):', requiredSkills: 'Required Skills:',
  installation: 'Installation:', model: 'Model:', serialNumber: 'Serial Number:',
  matricule: 'Matricule:', manufacturer: 'Manufacturer:',
  location: 'Location:', dispatchedBy: 'Dispatched By:',
  jobDescription: 'Job Description', timeTracking: 'Time Tracking',
  type: 'Type', description: 'Description', duration: 'Duration',
  materialsArticles: 'Materials / Articles Used', sku: 'SKU', article: 'Article',
  qty: 'Qty', replacing: 'Replacing:',
  date: 'Date', statusCol: 'Status',
  technicalSummary: 'Technical Summary', totalTime: 'Total Time',
  estDurationSummary: 'Est. Duration', materialsCount: 'Materials Used',
  notes: 'Notes', page: 'Page',
  thankYouMessage: 'Thank you for choosing our services.',
};

interface DispatchPDFDocumentProps {
  dispatch: any;
  customer: any;
  installation: any;
  timeData: any[];
  formatCurrency: (amount: number) => string;
  settings?: any;
  translations?: DispatchPdfTranslations;
  currencyCode?: string;
  language?: string;
}

export function DispatchPDFDocument({ dispatch, customer, installation, timeData, settings, translations }: DispatchPDFDocumentProps) {
  const tr = translations || defaultTranslations;
  const config = settings || {
    company: { name: '', address: '', phone: '', email: '', website: '' },
    showElements: {
      customerInfo: true, dispatchInfo: true, technicianDetails: true,
      timeTracking: true, expensesTable: true, materialsUsed: true,
      notesSection: true, footer: false, logo: false, pageNumbers: true,
    },
    table: { showPositions: true, showArticleCodes: true, showQuantity: true, showUnitPrice: true, showDuration: true, showCost: true, alternateRowColors: true },
    dateFormat: 'en-US', currencySymbol: '$', taxRate: 0, paperSize: 'A4',
  };

  const formatDate = (dateString: string | Date) => {
    const locale = config.dateFormat === 'en-US' ? 'en-US' : config.dateFormat === 'en-GB' ? 'en-GB' : config.dateFormat === 'iso' ? 'sv-SE' : 'de-DE';
    return new Date(dateString).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // ── Data extraction ──
  const articles = dispatch.articlesUsed || [];
  const notes = dispatch.notes || [];

  // ── Technical calculations (no financial data) ──
  const totalTimeMinutes = timeData.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

  // Technicians
  const techs = dispatch.assignedTechnicians || [];
  const techNames = techs.map((t: any) => typeof t === 'string' ? t : t.name).join(', ') || '-';

  return (
    <Document key={JSON.stringify(settings)}>
      <Page size={config.paperSize as any} style={styles.page} wrap>

        {/* ═══════ HEADER ═══════ */}
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

        {/* ═══════ CONTENT ═══════ */}
        <View style={styles.content}>

          {/* ── Customer + Dispatch Details ── */}
          <View style={styles.infoGrid}>
            {config.showElements?.customerInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{tr.customerInformation}</Text>
                <Text style={styles.clientName}>{customer?.contactPerson || customer?.name || '-'}</Text>
                {customer?.company && <View style={styles.infoRow}><Text style={styles.infoValue}>{customer.company}</Text></View>}
                {customer?.email && <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.email}</Text><Text style={styles.infoValue}>{customer.email}</Text></View>}
                {customer?.phone && <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.phone}</Text><Text style={styles.infoValue}>{customer.phone}</Text></View>}
                {customer?.address && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{tr.address}</Text>
                    <Text style={styles.infoValue}>
                      {typeof customer.address === 'string' ? customer.address : `${customer.address.street || ''}, ${customer.address.city || ''}, ${customer.address.state || ''} ${customer.address.zipCode || ''}`.replace(/^,\s*|,\s*$/g, '').trim()}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {config.showElements?.dispatchInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{tr.dispatchDetails}</Text>
                <Text style={styles.clientName}>
                  {dispatch.dispatchNumber || dispatch.jobNumber || `D-${dispatch.id}`}
                </Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.serviceOrder}</Text>
                  <Text style={styles.infoValue}>{dispatch.serviceOrderNumber || '-'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.status}</Text>
                  <Text style={styles.infoValue}>{(dispatch.status || '-').replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.priority}</Text>
                  <Text style={styles.infoValue}>{(dispatch.priority || '-').toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.scheduled}</Text>
                  <Text style={styles.infoValue}>
                    {dispatch.scheduledDate ? formatDate(dispatch.scheduledDate) : '-'} {dispatch.scheduledStartTime || ''}{dispatch.scheduledEndTime ? ` - ${dispatch.scheduledEndTime}` : ''}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.estDuration}</Text>
                  <Text style={styles.infoValue}>{dispatch.estimatedDuration ? fmtDuration(dispatch.estimatedDuration) : '-'}</Text>
                </View>
                {dispatch.actualDuration && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{tr.actualDuration}</Text>
                    <Text style={styles.infoValue}>{fmtDuration(dispatch.actualDuration)}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Technician & Installation Details ── */}
          {config.showElements?.technicianDetails !== false && (
            <View style={styles.sectionBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>{tr.assignmentDetails}</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{tr.technicians}</Text>
                <Text style={styles.infoValue}>{techNames}</Text>
              </View>
              {dispatch.requiredSkills && dispatch.requiredSkills.length > 0 && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.requiredSkills}</Text>
                  <Text style={styles.infoValue}>{dispatch.requiredSkills.join(', ')}</Text>
                </View>
              )}
              {installation && (installation.name || installation.model || installation.serialNumber) && (
                <InstallationDataTable
                  installation={installation}
                  translations={tr}
                />
              )}
              {dispatch.dispatchedBy && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.dispatchedBy}</Text>
                  <Text style={styles.infoValue}>{dispatch.dispatchedBy}</Text>
                </View>
              )}
            </View>
          )}

          {/* ── Job Description ── */}
          {dispatch.description && (
            <View style={styles.sectionBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>{tr.jobDescription}</Text>
              <Text style={styles.cell}>{dispatch.description}</Text>
            </View>
          )}

          {/* ── Time Tracking Table ── */}
          {config.showElements?.timeTracking !== false && timeData.length > 0 && (
            <View style={styles.tableContainer} wrap={false}>
              <Text style={styles.tableTitle}>{tr.timeTracking}</Text>
              <View style={styles.tableHeader}>
                {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.tableHeaderText}>#</Text></View>}
                <View style={styles.typeCol}><Text style={styles.tableHeaderText}>{tr.type}</Text></View>
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>{tr.description}</Text></View>
                <View style={styles.durationCol}><Text style={styles.tableHeaderText}>{tr.duration}</Text></View>
              </View>
              {timeData.map((t: any, i: number) => (
                <View key={t.id || i} style={[styles.tableRow, config.table?.alternateRowColors !== false && i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.cell}>{i + 1}</Text></View>}
                  <View style={styles.typeCol}><Text style={styles.cell}>{(t.workType || t.type || '-').replace(/_/g, ' ')}</Text></View>
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{t.description || '-'}</Text>
                    {t.technicianName && <Text style={styles.cellMuted}>{t.technicianName}</Text>}
                  </View>
                  <View style={styles.durationCol}><Text style={styles.cell}>{fmtDuration(t.duration || 0)}</Text></View>
                </View>
              ))}
            </View>
          )}

          {/* ── Materials / Articles Used Table (qty only, no pricing) ── */}
          {config.showElements?.materialsUsed !== false && articles.length > 0 && (
            <View style={styles.tableContainer} wrap={false}>
              <Text style={styles.tableTitle}>{tr.materialsArticles}</Text>
              <View style={styles.tableHeader}>
                {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.tableHeaderText}>#</Text></View>}
                {config.table?.showArticleCodes !== false && <View style={styles.articleCol}><Text style={styles.tableHeaderText}>{tr.sku}</Text></View>}
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>{tr.article}</Text></View>
                {config.table?.showQuantity !== false && <View style={styles.qtyCol}><Text style={styles.tableHeaderText}>{tr.qty}</Text></View>}
              </View>
              {articles.map((a: any, i: number) => (
                <View key={a.id || i} style={[styles.tableRow, config.table?.alternateRowColors !== false && i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.cell}>{i + 1}</Text></View>}
                  {config.table?.showArticleCodes !== false && <View style={styles.articleCol}><Text style={styles.cell}>{a.sku || '-'}</Text></View>}
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{a.articleName || '-'}</Text>
                    {a.replacing && <Text style={styles.cellMuted}>{tr.replacing} {a.oldArticleModel || 'previous item'}</Text>}
                    {a.externalComment && <Text style={styles.cellMuted}>{a.externalComment}</Text>}
                  </View>
                  {config.table?.showQuantity !== false && <View style={styles.qtyCol}><Text style={styles.cell}>{a.quantity || 1}</Text></View>}
                </View>
              ))}
            </View>
          )}

          {/* ── Technical Summary (replaces Cost Summary) ── */}
          <View style={styles.summaryWrap} wrap={false}>
            <View style={styles.summaryBox}>
              {articles.length > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{tr.materialsCount}</Text>
                  <Text style={styles.summaryValue}>{articles.length}</Text>
                </View>
              )}
              {totalTimeMinutes > 0 && (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>{tr.totalTime}</Text>
                  <Text style={styles.summaryValue}>{fmtDuration(totalTimeMinutes)}</Text>
                </View>
              )}
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{tr.estDurationSummary}</Text>
                <Text style={styles.summaryValue}>{dispatch.estimatedDuration ? fmtDuration(dispatch.estimatedDuration) : '-'}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>{tr.technicalSummary}</Text>
                <Text style={styles.totalValue}>{techNames}</Text>
              </View>
            </View>
          </View>

          {/* ── Notes ── */}
          {config.showElements?.notesSection !== false && notes.length > 0 && (
            <View style={styles.sectionBox} wrap={false}>
              <Text style={styles.infoBoxTitle}>{tr.notes}</Text>
              {notes.map((n: any, i: number) => (
                <View key={n.id || i} style={{ marginBottom: i < notes.length - 1 ? 6 : 0 }}>
                  <Text style={styles.cell}>{n.content || n.text || ''}</Text>
                  <Text style={styles.cellMuted}>
                    {n.createdByName || n.createdBy || ''}{n.createdAt ? ` • ${formatDate(n.createdAt)}` : ''}{n.category ? ` • ${n.category}` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ═══════ FOOTER ═══════ */}
        {config.showElements?.footer !== false && (
          <View style={styles.footer} wrap={false}>
            <View>
              <Text style={styles.footerText}>
                {config.company?.name || ''} {config.company?.address ? `• ${config.company.address}` : ''}
              </Text>
              <Text style={styles.footerText}>
                {config.company?.phone || ''} {config.company?.email ? `• ${config.company.email}` : ''} {config.company?.website ? `• ${config.company.website}` : ''}
              </Text>
              {config.company?.footerMessage && (
                <Text style={styles.footerText}>{config.company.footerMessage}</Text>
              )}
            </View>
            {config.showElements?.pageNumbers !== false && (
              <Text style={styles.pageNum} render={({ pageNumber, totalPages }: any) => `${tr.page} ${pageNumber} / ${totalPages}`} />
            )}
          </View>
        )}
      </Page>
    </Document>
  );
}