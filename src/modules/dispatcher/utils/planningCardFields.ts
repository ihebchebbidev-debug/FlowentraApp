import type { Job } from '../types';
import type { PlanningCardField } from '../types/planningProfile';

/** Field options offered in the planning-profile settings pickers. */
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

/** Compose the card's main label from the configured primary fields. */
export function formatCardLabel(
  job: Job,
  fields: PlanningCardField[] | undefined,
  separator: string | undefined,
  extras?: CardFieldExtras,
): string {
  const list = fields && fields.length ? fields : (['serviceOrderNumber'] as PlanningCardField[]);
  const parts = list.map(f => getJobFieldValue(job, f, extras)).filter(Boolean);
  // Always fall back to something readable so a block is never blank.
  return parts.join(separator ?? ' · ') || job.serviceOrderNumber || job.title || '';
}

/** Build labelled rows for the hover tooltip from the configured hover fields. */
export function buildHoverRows(
  job: Job,
  fields: PlanningCardField[] | undefined,
  extras?: CardFieldExtras,
): { label: string; value: string }[] {
  const list = fields && fields.length ? fields : ([] as PlanningCardField[]);
  return list
    .map(f => ({ label: planningFieldLabel(f), value: getJobFieldValue(job, f, extras) }))
    .filter(r => r.value);
}
