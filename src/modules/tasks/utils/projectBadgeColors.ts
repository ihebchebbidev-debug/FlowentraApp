/**
 * Shared badge color tokens for project status / type.
 * Kept in one place so the detail header, overview tab and cards can't drift
 * apart (they previously had three slightly different copies, and 'client'
 * projects fell through to the muted default in some of them).
 */

const STATUS_COLORS: Record<string, string> = {
  active: 'bg-success text-success-foreground',
  completed: 'bg-primary text-primary-foreground',
  'on-hold': 'bg-warning text-warning-foreground',
  onhold: 'bg-warning text-warning-foreground',
  cancelled: 'bg-destructive text-destructive-foreground',
  canceled: 'bg-destructive text-destructive-foreground',
  planning: 'bg-secondary text-secondary-foreground',
};

const TYPE_COLORS: Record<string, string> = {
  service: 'bg-primary/10 text-primary',
  sales: 'bg-success/10 text-success',
  client: 'bg-muted text-muted-foreground',
  internal: 'bg-secondary text-secondary-foreground',
  custom: 'bg-warning/10 text-warning',
};

const normalize = (value?: string | null) =>
  String(value ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');

export const getProjectStatusColor = (status?: string | null): string =>
  STATUS_COLORS[normalize(status)] ?? 'bg-secondary text-secondary-foreground';

export const getProjectTypeColor = (type?: string | null): string =>
  TYPE_COLORS[normalize(type)] ?? 'bg-muted text-muted-foreground';
