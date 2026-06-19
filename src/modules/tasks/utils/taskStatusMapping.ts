import type { Column } from '../types';

/** Normalize UI / legacy status values to backend ProjectTask.Status values. */
export function normalizeTaskStatus(status: unknown): string {
  const raw = String(status ?? 'open').trim().toLowerCase();
  if (!raw || /^\d+$/.test(raw)) return 'open';
  if (raw === 'todo' || raw === 'open') return 'open';
  if (raw === 'in-progress' || raw === 'in progress' || raw === 'in_progress') return 'in progress';
  if (raw === 'done' || raw === 'completed') return 'completed';
  if (raw === 'cancelled' || raw === 'canceled') return 'cancelled';
  if (raw === 'review') return 'in progress';
  return raw;
}

export function isCompletedTaskStatus(status: unknown): boolean {
  const s = normalizeTaskStatus(status);
  return s === 'completed' || s === 'cancelled';
}

/** Map backend status to a kanban column id for display. */
export function mapTaskStatusToColumnId(status: unknown, columns: Column[] = []): string {
  const normalized = normalizeTaskStatus(status);

  if (columns.length > 0) {
    const byTitle = (pattern: RegExp) =>
      columns.find((c) => pattern.test(String(c.title || '').toLowerCase()));

    if (normalized === 'completed' || normalized === 'cancelled') {
      return String(byTitle(/done|completed|termin|fini/)?.id ?? columns[columns.length - 1].id);
    }
    if (normalized === 'in progress') {
      return String(byTitle(/progress|cours|review|révision/)?.id ?? columns[Math.min(1, columns.length - 1)].id);
    }
    return String(byTitle(/todo|open|faire|backlog|à faire/)?.id ?? columns[0].id);
  }

  if (normalized === 'completed' || normalized === 'cancelled') return 'done';
  if (normalized === 'in progress') return 'in-progress';
  return 'todo';
}

export function buildCreateProjectTaskPayload(
  input: Record<string, unknown>,
  fallbackProjectId?: number
) {
  const relatedEntityIdRaw =
    input.relatedEntityId ??
    input.projectId ??
    (fallbackProjectId != null ? fallbackProjectId : undefined);
  const relatedEntityId =
    relatedEntityIdRaw != null ? parseInt(String(relatedEntityIdRaw), 10) : undefined;

  const assignedUserIdRaw = input.assignedUserId ?? input.assigneeId;
  const assignedUserId =
    assignedUserIdRaw != null ? parseInt(String(assignedUserIdRaw), 10) : undefined;

  const dueDateRaw = input.dueDate;
  let dueDate: string | undefined;
  if (dueDateRaw instanceof Date) {
    dueDate = dueDateRaw.toISOString();
  } else if (dueDateRaw) {
    dueDate = new Date(String(dueDateRaw)).toISOString();
  }

  return {
    title: String(input.title || '').trim(),
    description: input.description ? String(input.description) : undefined,
    taskType: String(input.taskType || 'follow-up'),
    status: normalizeTaskStatus(input.status),
    relatedEntityType: String(input.relatedEntityType || (relatedEntityId ? 'project' : '')) || undefined,
    relatedEntityId: relatedEntityId != null && !isNaN(relatedEntityId) ? relatedEntityId : undefined,
    assignedUserId: assignedUserId != null && !isNaN(assignedUserId) ? assignedUserId : undefined,
    dueDate,
  };
}
