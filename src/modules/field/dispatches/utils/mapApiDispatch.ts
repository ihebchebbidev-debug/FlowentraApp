import type { Dispatch as ApiDispatch } from '@/services/api/dispatchesApi';
import type { DispatchJob } from '../types';

const emptyAddress = {
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: '',
  longitude: 0,
  latitude: 0,
  hasLocation: 0,
};

const toDate = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

/** "13:00:00" -> "13:00"; tolerates null/undefined and ISO strings. */
const toTimeLabel = (value?: string | null): string => {
  if (!value) return '';
  if (/^\d{2}:\d{2}/.test(value)) return value.slice(0, 5);
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toTimeString().slice(0, 5);
};

const technicianName = (tech: any, index: number): string => {
  if (!tech) return `Technician ${index + 1}`;
  if (typeof tech === 'string') return tech;
  const composed = [tech.firstName, tech.lastName].filter(Boolean).join(' ').trim();
  return tech.name || tech.technicianName || tech.fullName || composed || tech.email || tech.id || `Technician ${index + 1}`;
};

/**
 * Maps a backend dispatch onto the DispatchJob view model used by the
 * Operations list. Every field is defensive: legacy rows can have null
 * status/priority/address and no technician objects.
 */
export function mapApiDispatchToDispatchJob(dispatch: ApiDispatch & Record<string, any>): DispatchJob {
  const techSource: any[] = Array.isArray(dispatch.assignedTechnicians) && dispatch.assignedTechnicians.length > 0
    ? dispatch.assignedTechnicians
    : (dispatch.assignedTechnicianIds || []).map((id) => ({ id }));

  const address = { ...emptyAddress, city: dispatch.siteAddress || '' };

  return {
    id: String(dispatch.id),
    jobNumber: dispatch.dispatchNumber || `DSP-${dispatch.id}`,
    serviceOrderId: dispatch.serviceOrderId != null ? String(dispatch.serviceOrderId) : '',
    serviceOrderNumber: (dispatch as any).serviceOrderNumber || '',
    title: (dispatch as any).title || dispatch.jobs?.[0]?.title || dispatch.installationName || '',
    description: dispatch.notes || (dispatch as any).description || '',
    status: (dispatch.status || 'assigned') as DispatchJob['status'],
    priority: (dispatch.priority || 'medium') as DispatchJob['priority'],
    customer: {
      id: dispatch.contactId != null ? String(dispatch.contactId) : '',
      company: dispatch.contactName || (dispatch as any).customerName || '',
      contactPerson: dispatch.contactName || '',
      phone: (dispatch as any).contactPhone || '',
      email: (dispatch as any).contactEmail || '',
      address,
    },
    assignedTechnicians: techSource.map((tech, index) => ({
      id: String(tech?.id ?? tech?.technicianId ?? index),
      name: technicianName(tech, index),
      email: tech?.email || '',
      phone: tech?.phone || '',
      skills: Array.isArray(tech?.skills) ? tech.skills : [],
      status: 'available' as const,
    })),
    requiredSkills: dispatch.requiredSkills || [],
    scheduledDate: toDate(dispatch.scheduledDate || dispatch.scheduling?.scheduledDate) ?? new Date(),
    scheduledStartTime: toTimeLabel(dispatch.scheduledStartTime || dispatch.scheduling?.scheduledStartTime),
    scheduledEndTime: toTimeLabel(dispatch.scheduledEndTime || dispatch.scheduling?.scheduledEndTime),
    estimatedDuration: dispatch.scheduling?.estimatedDuration ?? 0,
    workLocation: {
      address: dispatch.siteAddress || '',
      longitude: 0,
      latitude: 0,
      hasLocation: 0,
    },
    timeEntries: [],
    actualStartTime: toDate(dispatch.actualStartTime),
    actualEndTime: toDate(dispatch.actualEndTime),
    expenses: [],
    articlesUsed: [],
    attachments: [],
    notes: [],
    dispatchedBy: dispatch.dispatchedBy || '',
    dispatchedAt: toDate(dispatch.dispatchedAt) ?? new Date(),
    createdAt: toDate(dispatch.createdDate) ?? new Date(),
    updatedAt: toDate(dispatch.modifiedDate) ?? toDate(dispatch.createdDate) ?? new Date(),
    completionPercentage: (dispatch as any).completionPercentage ?? 0,
    ...(dispatch.tenantId != null ? { tenantId: dispatch.tenantId } : {}),
  } as DispatchJob;
}
