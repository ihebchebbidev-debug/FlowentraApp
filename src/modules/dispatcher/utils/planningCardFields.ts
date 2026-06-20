import type { Job } from '../types';
import type { PlanningCardField } from '../types/planningProfile';

/** Maps each card field to its i18n translation key (under dispatcher.profiles.*). */
export const PLANNING_CARD_FIELD_I18N_KEYS: Record<PlanningCardField, string> = {
  serviceOrderNumber: 'dispatcher.profiles.field_service_order_number',
  serviceOrderTitle:  'dispatcher.profiles.field_service_order_name',
  description:        'dispatcher.profiles.field_description',
  contactName:        'dispatcher.profiles.field_contact_name',
  customerCompany:    'dispatcher.profiles.field_customer_company',
  customerPhone:      'dispatcher.profiles.field_customer_phone',
  installationName:   'dispatcher.profiles.field_installation',
  jobTitle:           'dispatcher.profiles.field_job_title',
  status:             'dispatcher.profiles.field_status',
  priority:           'dispatcher.profiles.field_priority',
  duration:           'dispatcher.profiles.field_duration',
  address:            'dispatcher.profiles.field_address',
  technician:         'dispatcher.profiles.field_technician',
  jobCount:           'dispatcher.profiles.field_job_count',
};

/** Field options offered in the planning-profile settings pickers (fallback English labels). */
export const PLANNING_CARD_FIELD_OPTIONS: { value: PlanningCardField; label: string }[] = [
  { value: 'serviceOrderNumber', label: 'Service order number' },
  { value: 'serviceOrderTitle', label: 'Service order name' },
  { value: 'description', label: 'Description' },
  { value: 'contactName', label: 'Contact / customer name' },
  { value: 'customerCompany', label: 'Company' },
  { value: 'customerPhone', label: 'Phone' },
  { value: 'installationName', label: 'Installation' },
  { value: 'jobTitle', label: 'Job title' },
  { value: 'status', label: 'Status' },
  { value: 'priority', label: 'Priority' },
  { value: 'duration', label: 'Duration' },
  { value: 'address', label: 'Address' },
  { value: 'technician', label: 'Technician' },
  { value: 'jobCount', label: 'Number of jobs' },
];

const FIELD_LABEL: Record<PlanningCardField, string> = PLANNING_CARD_FIELD_OPTIONS.reduce(
  (acc, o) => { acc[o.value] = o.label; return acc; },
  {} as Record<PlanningCardField, string>,
);

export function planningFieldLabel(field: PlanningCardField): string {
  return FIELD_LABEL[field] ?? field;
}

export interface CardFieldExtras {
  jobCount?: number;
  technicianName?: string;
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h && m) return `${h}h ${m}m`;
  if (h) return `${h}h`;
  return `${m}m`;
}

const titleCase = (s?: string) =>
  s ? s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';

/** Resolve a single field to a display string for a job (or SO-representative job). */
export function getJobFieldValue(job: Job, field: PlanningCardField, extras?: CardFieldExtras): string {
  switch (field) {
    case 'serviceOrderNumber': return job.serviceOrderNumber || '';
    case 'serviceOrderTitle': return job.serviceOrderTitle || '';
    case 'description': return job.description || '';
    case 'contactName': return job.customerName || '';
    case 'customerCompany': return job.customerCompany || '';
    case 'customerPhone': return job.customerPhone || '';
    case 'installationName': return job.installationName || '';
    case 'jobTitle': return job.title || '';
    case 'status': return titleCase(job.status);
    case 'priority': return titleCase(job.priority);
    case 'duration': return formatDuration(job.estimatedDuration);
    case 'address': return job.location?.address || '';
    case 'technician': return extras?.technicianName || '';
    case 'jobCount': return extras?.jobCount != null ? String(extras.jobCount) : '';
    default: return '';
  }
}

/**
 * Resolve the configured fields to display rows, de-duplicated so the same piece
 * of information never appears twice — neither the same field picked twice, nor
 * two different fields that resolve to the identical value (e.g. when a service
 * order's name and description are the same text). Empty values are dropped.
 */
export function getCardFieldRows(
  job: Job,
  fields: PlanningCardField[] | undefined,
  extras?: CardFieldExtras,
  fallback: PlanningCardField[] = [],
): { field: PlanningCardField; label: string; value: string }[] {
  const list = fields && fields.length ? fields : fallback;
  const seenFields = new Set<PlanningCardField>();
  const seenValues = new Set<string>();
  const rows: { field: PlanningCardField; label: string; value: string }[] = [];
  for (const f of list) {
    if (seenFields.has(f)) continue;
    seenFields.add(f);
    const value = getJobFieldValue(job, f, extras);
    if (!value) continue;
    const key = value.trim().toLowerCase();
    if (seenValues.has(key)) continue;
    seenValues.add(key);
    rows.push({ field: f, label: planningFieldLabel(f), value });
  }
  return rows;
}

/** Compose the card's main label from the configured primary fields (de-duplicated). */
export function formatCardLabel(
  job: Job,
  fields: PlanningCardField[] | undefined,
  separator: string | undefined,
  extras?: CardFieldExtras,
): string {
  const rows = getCardFieldRows(job, fields, extras, ['serviceOrderNumber']);
  // When every chosen field is empty for this record, fall back to the job title
  // (populated and distinct per card) before the order number, so a sparse-data
  // selection still produces a meaningful, visibly different label.
  return rows.map(r => r.value).join(separator ?? ' - ') || job.title || job.serviceOrderNumber || '';
}

/** Build labelled rows for the hover tooltip from the configured hover fields (de-duplicated). */
export function buildHoverRows(
  job: Job,
  fields: PlanningCardField[] | undefined,
  extras?: CardFieldExtras,
): { label: string; value: string }[] {
  return getCardFieldRows(job, fields, extras).map(({ label, value }) => ({ label, value }));
}
