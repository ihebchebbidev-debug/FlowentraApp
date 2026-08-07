export type ActivitySource =
  | 'sales'
  | 'offers'
  | 'deals'
  | 'invoices'
  | 'purchases'
  | 'service'
  | 'dispatches'
  | 'articles'
  | 'hr'
  | 'contacts'
  | 'settings';

export type ActivityLevel = 'info' | 'success' | 'warning' | 'error';

/** Coarse buckets used for stats/filters — business-event oriented. */
export type ActivityBucket = 'created' | 'updated' | 'status' | 'other';

export interface ActivityActor {
  id?: string;
  name: string;
  kind: 'user' | 'system';
}

export interface ActivityEvent {
  id: string;
  source: ActivitySource;
  entityType: string;
  entityId: string | number;
  entityLabel: string;
  entityUrl?: string;
  action: string;
  actionLabel: string;
  level: ActivityLevel;
  bucket: ActivityBucket;
  actor: ActivityActor;
  performedAt: string;
  message: string;
  metadata?: Record<string, unknown>;
  oldValue?: string;
  newValue?: string;
}

export interface ActivityFilters {
  search?: string;
  source?: ActivitySource | 'all';
  bucket?: ActivityBucket | 'all';
  actor?: string;
  fromDate?: string;
  toDate?: string;
}

/** Workspace → domain sources it should surface. */
export const WORKSPACE_SOURCES: Record<string, ActivitySource[]> = {
  sales: ['sales', 'offers', 'deals', 'invoices', 'contacts', 'articles'],
  purchases: ['purchases', 'articles'],
  service: ['service', 'dispatches', 'articles'],
  hr: ['hr'],
  contacts: ['contacts'],
  projects: ['service', 'dispatches', 'sales'],
  administration: ['settings', 'hr'],
};

export const ALL_SOURCES: ActivitySource[] = [
  'sales',
  'offers',
  'deals',
  'invoices',
  'purchases',
  'service',
  'dispatches',
  'articles',
  'hr',
  'contacts',
  'settings',
];
