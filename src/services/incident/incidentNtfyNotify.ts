import type { IncidentReportPayload, IncidentSeverity } from '@/services/incident/incidentTypes';
import type { AutoIncidentResult } from '@/services/incident/incidentTypes';
import { sendNtfyNotification, type NtfyPriority } from '@/services/notifications/ntfyService';

const recentNtfy = new Map<string, number>();
const NTFY_DEDUP_MS = 45_000;

function severityToPriority(severity?: IncidentSeverity): NtfyPriority {
  switch (severity) {
    case 'critical':
      return '5';
    case 'high':
      return '4';
    case 'low':
      return '2';
    default:
      return '3';
  }
}

function severityEmoji(severity?: IncidentSeverity): string {
  switch (severity) {
    case 'critical':
      return '🔴';
    case 'high':
      return '🟠';
    case 'low':
      return '🟢';
    default:
      return '🟡';
  }
}

function shouldDedupNtfy(fingerprint: string): boolean {
  const now = Date.now();
  const last = recentNtfy.get(fingerprint);
  if (last && now - last < NTFY_DEDUP_MS) return true;
  recentNtfy.set(fingerprint, now);
  return false;
}

export async function notifyIssueViaNtfy(
  payload: IncidentReportPayload,
  result?: AutoIncidentResult | null,
  extra?: { ticketApiFailed?: boolean }
): Promise<void> {
  const fp = payload.fingerprint || payload.message;
  if (shouldDedupNtfy(fp)) return;

  const emoji = severityEmoji(payload.severity);
  const module = payload.module || 'app';
  const typeLabel = payload.incidentType.replace(/_/g, ' ');
  const isNew = result?.created === true;
  const skipped = result?.skipped === true;
  const count = result?.occurrenceCount ?? payload.clientOccurrenceCount ?? 1;

  const titleParts = [
    emoji,
    skipped ? 'Issue detected' : isNew && !extra?.ticketApiFailed ? 'New issue' : 'Issue update',
    `· ${module}`,
  ];

  const lines = [
    `${typeLabel.toUpperCase()}`,
    payload.message.slice(0, 280),
    '',
    `Page: ${payload.currentPage || '—'}`,
    payload.userEmail ? `User: ${payload.userEmail}` : null,
    payload.httpStatus ? `HTTP: ${payload.httpMethod || 'GET'} ${payload.endpoint} → ${payload.httpStatus}` : null,
    payload.referenceId ? `Ref: ${payload.referenceId}` : null,
    result?.ticketId ? `Ticket #${result.ticketId}` : extra?.ticketApiFailed ? 'Ticket: pending (API failed)' : null,
    result?.skipReason ? `Note: ${result.skipReason}` : null,
    count > 1 ? `Occurrences: ${count}` : null,
  ].filter(Boolean);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const click = result?.ticketId
    ? `${origin}/dashboard/ticketsadmin`
    : payload.relatedUrl || payload.currentPage
      ? `${origin}${payload.currentPage || ''}`
      : undefined;

  await sendNtfyNotification({
    title: titleParts.join(' '),
    body: lines.join('\n'),
    priority: severityToPriority(payload.severity),
    tags: ['bug', module, payload.incidentType.split('_')[0] || 'issue'],
    click,
  });
}
