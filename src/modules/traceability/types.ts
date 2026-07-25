export type ActivitySource =
  | 'sales'
  | 'offers'
  | 'deals'
  | 'invoices'
  | 'purchases'
  | 'service'
  | 'hr'
  | 'contacts'
  | 'system';

export type ActivityLevel = 'info' | 'success' | 'warning' | 'error';

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
  level?: ActivityLevel | 'all';
  actor?: string;
  fromDate?: string;
  toDate?: string;
}
