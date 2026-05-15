import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { InstallationDataTable } from '@/shared/components/PDFInstallationTable';

/**
 * Professional Service Order Technical Report
 * ─ Technical overview: customer, SO details, dispatches, technicians,
 *   jobs, materials, time tracking. No financial/pricing data.
 * ─ Matches the visual style of Sale/Offer PDFs (9pt Helvetica, bordered info boxes, etc.)
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
  statusCol: { width: 70 },
  durationCol: { width: 60, textAlign: 'right' as const },
  qtyCol: { width: 45, textAlign: 'right' as const },
  unitCol: { width: 70, textAlign: 'right' as const },
  costCol: { width: 70, textAlign: 'right' as const },
  amountCol: { width: 80, textAlign: 'right' as const },
  typeCol: { width: 70 },
  dateCol: { width: 70 },
  techCol: { width: 80 },
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

function formatAddress(address: any): string {
  if (!address) return '';
  if (typeof address === 'string') return address;
  return `${address.street || ''}, ${address.city || ''}, ${address.state || ''} ${address.zipCode || ''}`
    .replace(/^,\s*|,\s*$/g, '')
    .trim();
}

// ── Component ──

interface SOPdfTranslations {
  customerInformation: string; email: string; phone: string; address: string;
  taxId: string; cin: string; serviceOrderDetails: string; date: string;
  status: string; priority: string; promisedDate: string; location: string;
  saleRef: string; technicians: string; repairDescription: string;
  dispatches: string; dispatch: string; dateCol: string; technician: string;
  statusCol: string; duration: string; servicesJobs: string; service: string;
  materialsUsed: string; article: string; description: string;
  qty: string; timeTracking: string; type: string;
  totalTime: string; technicalSummary: string; totalDispatches: string;
  totalJobs: string; materialsCount: string; notes: string;
  page: string; thankYouMessage: string;
  model: string; serialNumber: string; matricule: string; manufacturer: string;
}

const defaultTranslations: SOPdfTranslations = {
  customerInformation: 'Customer Information', email: 'Email:', phone: 'Phone:',
  address: 'Address:', taxId: 'Tax ID:', cin: 'CIN:',
  serviceOrderDetails: 'Service Order Details', date: 'Date:', status: 'Status:',
  priority: 'Priority:', promisedDate: 'Promised Date:', location: 'Location:',
  saleRef: 'Sale Ref:', technicians: 'Technicians:',
  repairDescription: 'Repair Description', dispatches: 'Dispatches',
  dispatch: 'Dispatch', dateCol: 'Date', technician: 'Technician',
  statusCol: 'Status', duration: 'Duration', servicesJobs: 'Services / Jobs',
  service: 'Service', materialsUsed: 'Materials Used',
  article: 'Article', description: 'Description', qty: 'Qty',
  timeTracking: 'Time Tracking', type: 'Type',
  totalTime: 'Total Time', technicalSummary: 'Technical Summary',
  totalDispatches: 'Total Dispatches', totalJobs: 'Total Jobs',
  materialsCount: 'Materials Used', notes: 'Notes', page: 'Page',
  thankYouMessage: 'Thank you for choosing our services.',
  model: 'Model', serialNumber: 'Serial Number', matricule: 'Matricule', manufacturer: 'Manufacturer',
};

export interface InstallationDetails {
  name?: string;
  model?: string;
  serialNumber?: string;
  matricule?: string;
  manufacturer?: string;
  siteAddress?: string;
  location?: string;
}

interface ServiceOrderPDFDocumentProps {
  serviceOrder: any;
  formatCurrency: (amount: number) => string;
  settings?: any;
  translations?: SOPdfTranslations;
  currencyCode?: string;
  language?: string;
  installationsData?: Record<string, InstallationDetails>;
}

export function ServiceOrderPDFDocument({ serviceOrder, settings, translations, installationsData }: ServiceOrderPDFDocumentProps) {
  const tr = translations || defaultTranslations;
  const config = settings || {
    company: { name: '', address: '', phone: '', email: '', website: '' },
    showElements: {
      customerInfo: true, serviceOrderInfo: true, repairDescription: true,
      dispatchesTable: true, servicesTable: true, materialsTable: true,
      timeTrackingTable: true, expensesTable: true, technicianSummary: true,
      footer: false, logo: false, pageNumbers: true,
    },
    table: { showPositions: true, showArticleCodes: true, showQuantity: true, showUnitPrice: true, showDuration: true, showCost: true, alternateRowColors: true },
    dateFormat: 'en-US', currencySymbol: '$', taxRate: 0, paperSize: 'A4',
  };

  const formatDate = (dateString: string | Date) => {
    const locale = config.dateFormat === 'en-US' ? 'en-US' : config.dateFormat === 'en-GB' ? 'en-GB' : config.dateFormat === 'iso' ? 'sv-SE' : 'de-DE';
    return new Date(dateString).toLocaleDateString(locale, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // ── Data extraction ──
  const customer = serviceOrder.customer || {};
  const customerName = customer.contactPerson || customer.name || '-';
  const customerCompany = customer.company || '';
  const customerAddress = formatAddress(customer.address);
  const customerEmail = customer.email || '';
  const customerPhone = customer.phone || '';
  const customerTaxId = customer.matriculeFiscale || customer.taxId || '';
  const customerCin = customer.cin || '';

  const jobs = serviceOrder.jobs || [];
  const dispatches = serviceOrder.dispatches || [];
  const materials = serviceOrder.materials || serviceOrder.workDetails?.materials || [];
  const timeEntries = serviceOrder.workDetails?.timeTracking || [];

  // Build unique technicians from all sources
  const technicianSet = new Set<string>();
  // From top-level assignedTechnicians
  (serviceOrder.assignedTechnicians || []).forEach((t: any) => {
    const name = typeof t === 'string' ? t : (t.name || t.fullName || t.technicianName || '');
    if (name) technicianSet.add(name);
  });
  // From each dispatch's assignedTechnicians
  dispatches.forEach((d: any) => {
    (d.assignedTechnicians || []).forEach((t: any) => {
      const name = typeof t === 'string' ? t : (t.name || t.fullName || t.technicianName || '');
      if (name) technicianSet.add(name);
    });
    // Also check single technician field
    if (d.technicianName) technicianSet.add(d.technicianName);
    if (d.technician && typeof d.technician === 'string') technicianSet.add(d.technician);
  });
  const technicians = Array.from(technicianSet);

  // ── Technical calculations (no financial data) ──
  const totalTimeMinutes = timeEntries.reduce((sum: number, t: any) => sum + (t.duration || 0), 0);

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

          {/* ── Customer + SO Details ── */}
          <View style={styles.infoGrid}>
            {config.showElements?.customerInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{tr.customerInformation}</Text>
                <Text style={styles.clientName}>{customerName}</Text>
                {customerCompany ? <View style={styles.infoRow}><Text style={styles.infoValue}>{customerCompany}</Text></View> : null}
                {customerEmail ? <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.email}</Text><Text style={styles.infoValue}>{customerEmail}</Text></View> : null}
                {customerPhone ? <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.phone}</Text><Text style={styles.infoValue}>{customerPhone}</Text></View> : null}
                {customerAddress ? <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.address}</Text><Text style={styles.infoValue}>{customerAddress}</Text></View> : null}
                {customerTaxId ? <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.taxId}</Text><Text style={styles.infoValue}>{customerTaxId}</Text></View> : null}
                {customerCin ? <View style={styles.infoRow}><Text style={styles.infoLabel}>{tr.cin}</Text><Text style={styles.infoValue}>{customerCin}</Text></View> : null}
              </View>
            )}

            {config.showElements?.serviceOrderInfo !== false && (
              <View style={styles.infoBox}>
                <Text style={styles.infoBoxTitle}>{tr.serviceOrderDetails}</Text>
                <Text style={styles.clientName}>{serviceOrder.orderNumber || `SO-${serviceOrder.id}`}</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.date}</Text>
                  <Text style={styles.infoValue}>{formatDate(serviceOrder.createdAt || new Date())}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.status}</Text>
                  <Text style={styles.infoValue}>{(serviceOrder.status || 'pending').replace(/_/g, ' ').toUpperCase()}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{tr.priority}</Text>
                  <Text style={styles.infoValue}>{(serviceOrder.priority || 'normal').toUpperCase()}</Text>
                </View>
                {serviceOrder.repair?.promisedRepairDate && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{tr.promisedDate}</Text>
                    <Text style={styles.infoValue}>{formatDate(serviceOrder.repair.promisedRepairDate)}</Text>
                  </View>
                )}
                {serviceOrder.repair?.location && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{tr.location}</Text>
                    <Text style={styles.infoValue}>{serviceOrder.repair.location}</Text>
                  </View>
                )}
                {serviceOrder.saleNumber && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{tr.saleRef}</Text>
                    <Text style={styles.infoValue}>{serviceOrder.saleNumber}</Text>
                  </View>
                )}
                {technicians.length > 0 && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>{tr.technicians}</Text>
                    <Text style={styles.infoValue}>{technicians.join(', ')}</Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {/* ── Repair Description ── */}
          {config.showElements?.repairDescription !== false && serviceOrder.repair?.description && (
            <View style={styles.sectionBox}>
              <Text style={styles.infoBoxTitle}>{tr.repairDescription}</Text>
              <Text style={styles.cell}>{serviceOrder.repair.description}</Text>
            </View>
          )}

          {/* ── Dispatches Table ── */}
          {config.showElements?.dispatchesTable !== false && dispatches.length > 0 && (
            <View style={styles.tableContainer} wrap={false}>
              <Text style={styles.tableTitle}>{tr.dispatches}</Text>
              <View style={styles.tableHeader}>
                {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.tableHeaderText}>#</Text></View>}
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>{tr.dispatch}</Text></View>
                <View style={styles.dateCol}><Text style={styles.tableHeaderText}>{tr.dateCol}</Text></View>
                <View style={styles.techCol}><Text style={styles.tableHeaderText}>{tr.technician}</Text></View>
                <View style={styles.statusCol}><Text style={styles.tableHeaderText}>{tr.statusCol}</Text></View>
                {config.table?.showDuration !== false && <View style={styles.durationCol}><Text style={styles.tableHeaderText}>{tr.duration}</Text></View>}
              </View>
              {dispatches.map((d: any, i: number) => (
                <View key={d.id || i} style={[styles.tableRow, config.table?.alternateRowColors !== false && i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.cell}>{i + 1}</Text></View>}
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{d.dispatchNumber || d.jobNumber || `D-${d.id}`}</Text>
                    {d.title && <Text style={styles.cellMuted}>{d.title}</Text>}
                  </View>
                  <View style={styles.dateCol}><Text style={styles.cell}>{d.scheduledDate ? formatDate(d.scheduledDate) : '-'}</Text></View>
                  <View style={styles.techCol}>
                    <Text style={styles.cell}>
                      {d.assignedTechnicians?.map((t: any) => typeof t === 'string' ? t : t.name).join(', ') || '-'}
                    </Text>
                  </View>
                  <View style={styles.statusCol}><Text style={styles.cell}>{(d.status || '-').replace(/_/g, ' ')}</Text></View>
                  {config.table?.showDuration !== false && (
                    <View style={styles.durationCol}><Text style={styles.cell}>{d.estimatedDuration ? fmtDuration(d.estimatedDuration) : '-'}</Text></View>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ── Jobs / Services Table (no cost column) ── */}
          {config.showElements?.servicesTable !== false && jobs.length > 0 && (() => {
            // Group jobs by installationId
            const jobGroups: { key: string; label: string; jobs: any[] }[] = [];
            const groupMap = new Map<string, any[]>();
            const generalJobs: any[] = [];

            jobs.forEach((job: any) => {
              const instId = job.installationId;
              if (instId) {
                if (!groupMap.has(String(instId))) groupMap.set(String(instId), []);
                groupMap.get(String(instId))!.push(job);
              } else {
                generalJobs.push(job);
              }
            });

            if (generalJobs.length > 0) jobGroups.push({ key: '_general', label: 'General', jobs: generalJobs });
            groupMap.forEach((items, key) => {
              const instName = items[0].installationName || items[0].installation?.name || `Installation ${key}`;
              jobGroups.push({ key, label: `Installation: ${instName}`, jobs: items });
            });

            return jobGroups.map((group) => {
              const instData = group.key !== '_general' && installationsData ? installationsData[group.key] : undefined;
              
              // Create installation object for rendering - always create one with at least the name
              const installationName = group.key !== '_general' ? group.label.replace('Installation: ', '') : undefined;
              const installationObj = {
                name: installationName || instData?.name,
                model: instData?.model,
                serialNumber: instData?.serialNumber,
                matricule: instData?.matricule,
                manufacturer: instData?.manufacturer,
                siteAddress: instData?.siteAddress,
                location: instData?.location,
              };

              return (
                <View key={group.key} style={styles.tableContainer} wrap={false}>
                  {/* Group header */}
                  <View style={{ backgroundColor: '#E5E7EB', paddingVertical: 6, paddingHorizontal: 10 }}>
                    <Text style={{ fontSize: 9, color: '#1F2937', fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>{group.label}</Text>
                  </View>
                  {/* Installation details table */}
                  {group.key !== '_general' && installationObj && (
                    <InstallationDataTable
                      installation={installationObj}
                      translations={tr}
                    />
                  )}
                  <View style={styles.tableHeader}>
                    {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.tableHeaderText}>#</Text></View>}
                    <View style={styles.descCol}><Text style={styles.tableHeaderText}>{tr.service}</Text></View>
                    <View style={styles.statusCol}><Text style={styles.tableHeaderText}>{tr.statusCol}</Text></View>
                    {config.table?.showDuration !== false && <View style={styles.durationCol}><Text style={styles.tableHeaderText}>{tr.duration}</Text></View>}
                  </View>
                  {group.jobs.map((job: any, i: number) => (
                    <View key={job.id || i} style={[styles.tableRow, config.table?.alternateRowColors !== false && i % 2 === 1 ? styles.tableRowAlt : {}]}>
                      {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.cell}>{i + 1}</Text></View>}
                      <View style={styles.descCol}>
                        <Text style={styles.cell}>{job.title || job.name || 'Service'}</Text>
                        {job.description && <Text style={styles.cellMuted}>{job.description}</Text>}
                      </View>
                      <View style={styles.statusCol}><Text style={styles.cell}>{(job.status || 'pending').replace(/_/g, ' ')}</Text></View>
                      {config.table?.showDuration !== false && (
                        <View style={styles.durationCol}><Text style={styles.cell}>{job.estimatedDuration ? fmtDuration(job.estimatedDuration) : '-'}</Text></View>
                      )}
                    </View>
                  ))}
                </View>
              );
            });
          })()}

          {/* ── Materials Used Table (qty only, no pricing) ── */}
          {config.showElements?.materialsTable !== false && materials.length > 0 && (
            <View style={styles.tableContainer} wrap={false}>
              <Text style={styles.tableTitle}>{tr.materialsUsed}</Text>
              <View style={styles.tableHeader}>
                {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.tableHeaderText}>#</Text></View>}
                {config.table?.showArticleCodes !== false && <View style={styles.articleCol}><Text style={styles.tableHeaderText}>{tr.article}</Text></View>}
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>{tr.description}</Text></View>
                {config.table?.showQuantity !== false && <View style={styles.qtyCol}><Text style={styles.tableHeaderText}>{tr.qty}</Text></View>}
              </View>
              {materials.map((m: any, i: number) => (
                <View key={m.id || i} style={[styles.tableRow, config.table?.alternateRowColors !== false && i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.cell}>{i + 1}</Text></View>}
                  {config.table?.showArticleCodes !== false && <View style={styles.articleCol}><Text style={styles.cell}>{m.sku || m.articleNumber || m.code || '-'}</Text></View>}
                  <View style={styles.descCol}>
                    <Text style={styles.cell}>{m.name || m.articleName || 'Material'}</Text>
                    {m.description && <Text style={styles.cellMuted}>{m.description}</Text>}
                  </View>
                  {config.table?.showQuantity !== false && <View style={styles.qtyCol}><Text style={styles.cell}>{m.quantity || 1}</Text></View>}
                </View>
              ))}
            </View>
          )}

          {/* ── Time Tracking Table (duration only, no cost) ── */}
          {config.showElements?.timeTrackingTable !== false && timeEntries.length > 0 && (
            <View style={styles.tableContainer} wrap={false}>
              <Text style={styles.tableTitle}>{tr.timeTracking}</Text>
              <View style={styles.tableHeader}>
                {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.tableHeaderText}>#</Text></View>}
                <View style={styles.typeCol}><Text style={styles.tableHeaderText}>{tr.type}</Text></View>
                <View style={styles.descCol}><Text style={styles.tableHeaderText}>{tr.description}</Text></View>
                <View style={styles.durationCol}><Text style={styles.tableHeaderText}>{tr.duration}</Text></View>
              </View>
              {timeEntries.map((t: any, i: number) => (
                <View key={t.id || i} style={[styles.tableRow, config.table?.alternateRowColors !== false && i % 2 === 1 ? styles.tableRowAlt : {}]}>
                  {config.table?.showPositions !== false && <View style={styles.posCol}><Text style={styles.cell}>{i + 1}</Text></View>}
                  <View style={styles.typeCol}><Text style={styles.cell}>{(t.workType || t.type || '-').replace(/_/g, ' ')}</Text></View>
                  <View style={styles.descCol}><Text style={styles.cell}>{t.description || '-'}</Text></View>
                  <View style={styles.durationCol}><Text style={styles.cell}>{fmtDuration(t.duration || 0)}</Text></View>
                </View>
              ))}
            </View>
          )}

          {/* ── Technical Summary (replaces Cost Summary) ── */}
          {config.showElements?.technicianSummary !== false && (
            <View style={styles.summaryWrap} wrap={false}>
              <View style={styles.summaryBox}>
                {dispatches.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{tr.totalDispatches}</Text>
                    <Text style={styles.summaryValue}>{dispatches.length}</Text>
                  </View>
                )}
                {jobs.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{tr.totalJobs}</Text>
                    <Text style={styles.summaryValue}>{jobs.length}</Text>
                  </View>
                )}
                {materials.length > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{tr.materialsCount}</Text>
                    <Text style={styles.summaryValue}>{materials.length}</Text>
                  </View>
                )}
                {totalTimeMinutes > 0 && (
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>{tr.totalTime}</Text>
                    <Text style={styles.summaryValue}>{fmtDuration(totalTimeMinutes)}</Text>
                  </View>
                )}
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>{tr.technicalSummary}</Text>
                  <Text style={styles.totalValue}>
                    {technicians.length > 0
                      ? `${technicians.length} ${tr.technicians.replace(':', '')} (${technicians.join(', ')})`
                      : dispatches.length > 0
                        ? `${dispatches.length} ${tr.technicians.replace(':', '')}`
                        : `1 ${tr.technicians.replace(':', '')}`
                    }
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* ── Notes ── */}
          {serviceOrder.followUp?.maintenanceNotes && (
            <View style={styles.sectionBox}>
              <Text style={styles.infoBoxTitle}>{tr.notes}</Text>
              <Text style={styles.cell}>{serviceOrder.followUp.maintenanceNotes}</Text>
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