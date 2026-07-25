import { salesApi } from '@/services/api/salesApi';
import { offersApi } from '@/services/api/offersApi';
import { dealsApi } from '@/services/api/dealsApi';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import { purchaseOrderService } from '@/modules/purchases/services/purchaseService';
import { dispatchesApi } from '@/services/api/dispatchesApi';
import { hrApi } from '@/modules/hr/services/hrApi';
import { contactsApi } from '@/services/api/contactsApi';
import { contactActivityApi } from '@/services/api/contactActivityApi';
import type {
  ActivityBucket,
  ActivityEvent,
  ActivityLevel,
  ActivitySource,
} from '../types';
import { ALL_SOURCES } from '../types';

const LEVEL_BY_ACTION: Record<string, ActivityLevel> = {
  created: 'success',
  created_from_sale: 'success',
  posted: 'info',
  sent: 'info',
  updated: 'info',
  status_changed: 'info',
  paid: 'success',
  auto_marked_paid: 'success',
  manual_marked_paid: 'success',
  voided: 'warning',
  void: 'warning',
  auto_reopened: 'warning',
  manual_reopened: 'warning',
  deleted: 'warning',
};

function levelFor(action?: string): ActivityLevel {
  if (!action) return 'info';
  return LEVEL_BY_ACTION[action] ?? 'info';
}

function bucketFor(action?: string): ActivityBucket {
  const a = (action || '').toLowerCase();
  if (!a) return 'other';
  if (/(created|added|opened)/.test(a)) return 'created';
  if (/(status|posted|sent|paid|voided|void|reopened|completed|started|assigned|confirmed|cancelled|accepted|rejected)/.test(a))
    return 'status';
  if (/(updated|edited|changed|modified|note_updated)/.test(a)) return 'updated';
  return 'other';
}

function humanize(action?: string): string {
  if (!action) return '—';
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

async function collectFrom<T, A>(opts: {
  fetchList: () => Promise<T[]>;
  parentCap?: number;
  fetchActivities: (item: T) => Promise<A[]>;
  toEvent: (activity: A, item: T) => ActivityEvent | null;
}): Promise<ActivityEvent[]> {
  const { fetchList, fetchActivities, toEvent, parentCap = 15 } = opts;
  try {
    const list = (await fetchList()).slice(0, parentCap);
    const results = await Promise.allSettled(
      list.map(async (item) => {
        try {
          return { item, activities: await fetchActivities(item) };
        } catch {
          return { item, activities: [] as A[] };
        }
      }),
    );
    const events: ActivityEvent[] = [];
    for (const r of results) {
      if (r.status !== 'fulfilled') continue;
      for (const a of r.value.activities) {
        const ev = toEvent(a, r.value.item);
        if (ev) events.push(ev);
      }
    }
    return events;
  } catch {
    return [];
  }
}

export const adapters: Record<ActivitySource, () => Promise<ActivityEvent[]>> = {
  async sales() {
    return collectFrom({
      fetchList: async () => {
        const res = await salesApi.getAll({ page: 1, limit: 25 });
        return res.data?.sales || [];
      },
      fetchActivities: async (s: any) => {
        const r = await salesApi.getActivities(s.id, undefined, 1, 15);
        return r.activities || [];
      },
      toEvent: (a: any, s: any) => ({
        id: `sales:${a.id}`,
        source: 'sales',
        entityType: 'sale',
        entityId: s.id,
        entityLabel: s.saleNumber || s.number || `#${s.id}`,
        entityUrl: `/dashboard/sales/${s.id}`,
        action: a.type,
        actionLabel: humanize(a.type),
        level: levelFor(a.type),
        bucket: bucketFor(a.type),
        actor: { id: a.createdBy, name: a.createdBy || 'System', kind: a.createdBy ? 'user' : 'system' },
        performedAt: a.createdAt,
        message: a.description,
        oldValue: a.oldValue,
        newValue: a.newValue,
      }),
    });
  },

  async offers() {
    return collectFrom({
      fetchList: async () => {
        const res = await offersApi.getAll({ page: 1, limit: 25 });
        return res.data?.offers || [];
      },
      fetchActivities: async (o: any) => {
        const r = await offersApi.getActivities(o.id, undefined, 1, 15);
        return r.activities || [];
      },
      toEvent: (a: any, o: any) => ({
        id: `offers:${a.id}`,
        source: 'offers',
        entityType: 'offer',
        entityId: o.id,
        entityLabel: o.offerNumber || o.number || o.title || `#${o.id}`,
        entityUrl: `/dashboard/offers/${o.id}`,
        action: a.type,
        actionLabel: humanize(a.type),
        level: levelFor(a.type),
        bucket: bucketFor(a.type),
        actor: { id: a.createdBy, name: a.createdBy || 'System', kind: a.createdBy ? 'user' : 'system' },
        performedAt: a.createdAt,
        message: a.description,
        oldValue: a.oldValue,
        newValue: a.newValue,
      }),
    });
  },

  async deals() {
    return collectFrom({
      fetchList: async () => {
        const res = await dealsApi.getAll({ page: 1, limit: 25 });
        return (res as any).data?.deals || (res as any).deals || [];
      },
      fetchActivities: async (d: any) => {
        const r = await dealsApi.getActivities(d.id, undefined, 1, 15);
        return r.activities || [];
      },
      toEvent: (a: any, d: any) => ({
        id: `deals:${a.id}`,
        source: 'deals',
        entityType: 'deal',
        entityId: d.id,
        entityLabel: d.title || d.name || `#${d.id}`,
        entityUrl: `/dashboard/deals/${d.id}`,
        action: a.type,
        actionLabel: humanize(a.type),
        level: levelFor(a.type),
        bucket: bucketFor(a.type),
        actor: {
          id: a.createdBy,
          name: a.createdByName || a.createdBy || 'System',
          kind: a.createdBy ? 'user' : 'system',
        },
        performedAt: a.createdAt,
        message: a.description,
        oldValue: a.oldValue,
        newValue: a.newValue,
      }),
    });
  },

  async invoices() {
    return collectFrom({
      fetchList: async () => {
        const res = await customerInvoicesApi.list({ page: 1, limit: 25 });
        return res.data || [];
      },
      fetchActivities: async (inv: any) => {
        return await customerInvoicesApi.getActivities(inv.id);
      },
      toEvent: (a: any, inv: any) => ({
        id: `invoices:${a.id}`,
        source: 'invoices',
        entityType: 'invoice',
        entityId: inv.id,
        entityLabel: inv.invoiceNumber || `#${inv.id}`,
        entityUrl: `/dashboard/invoices/${inv.id}`,
        action: a.type,
        actionLabel: humanize(a.type),
        level: levelFor(a.type),
        bucket: bucketFor(a.type),
        actor: { id: a.createdBy, name: a.createdBy || 'System', kind: a.createdBy ? 'user' : 'system' },
        performedAt: a.createdAt,
        message: a.description || humanize(a.type),
        oldValue: a.oldValue,
        newValue: a.newValue,
      }),
    });
  },

  async purchases() {
    return collectFrom({
      fetchList: async () => {
        const res = await purchaseOrderService.getAll({ limit: 25 } as any);
        return (res as any).orders || [];
      },
      fetchActivities: async (o: any) => {
        return await purchaseOrderService.getActivities(o.id, 1, 15);
      },
      toEvent: (a: any, o: any) => ({
        id: `purchases:${a.id}`,
        source: 'purchases',
        entityType: a.entityType || 'purchase_order',
        entityId: o.id,
        entityLabel: o.orderNumber || o.number || `#${o.id}`,
        entityUrl: `/dashboard/purchases/orders/${o.id}`,
        action: a.activityType || a.action,
        actionLabel: humanize(a.activityType || a.action),
        level: levelFor(a.activityType || a.action),
        bucket: bucketFor(a.activityType || a.action),
        actor: {
          id: a.performedBy,
          name: a.performedByName || a.performedBy || 'System',
          kind: a.performedBy ? 'user' : 'system',
        },
        performedAt: a.performedAt,
        message: a.description,
        oldValue: a.oldValue,
        newValue: a.newValue,
      }),
    });
  },

  async service() {
    return collectFrom({
      fetchList: async () => {
        const res = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 25 } as any);
        return (res as any).data || [];
      },
      fetchActivities: async (d: any) => {
        return await dispatchesApi.getActivityLog(d.id);
      },
      toEvent: (a: any, d: any) => ({
        id: `service:${a.id}`,
        source: 'service',
        entityType: 'dispatch',
        entityId: d.id,
        entityLabel: d.dispatchNumber || d.number || `#${d.id}`,
        entityUrl: `/dashboard/field/dispatches/${d.id}`,
        action: a.action,
        actionLabel: humanize(a.action),
        level: levelFor(a.action),
        bucket: bucketFor(a.action),
        actor: {
          id: a.changedBy,
          name: a.changedBy || 'System',
          kind: a.changedBy ? 'user' : 'system',
        },
        performedAt: a.changedAt,
        message: `${humanize(a.action)}${a.newValue ? ` → ${a.newValue}` : ''}`,
        oldValue: a.oldValue,
        newValue: a.newValue,
      }),
    });
  },

  async hr() {
    try {
      const logs = await hrApi.getAuditLog({ take: 100 });
      return (logs || []).map((l: any): ActivityEvent => ({
        id: `hr:${l.id}`,
        source: 'hr',
        entityType: 'hr_event',
        entityId: l.userId ?? l.actorId ?? l.id,
        entityLabel: l.userId ? `Employee #${l.userId}` : `HR #${l.id}`,
        entityUrl: l.userId ? `/dashboard/hr/employees/${l.userId}` : undefined,
        action: l.eventType || 'other',
        actionLabel: humanize(l.eventType),
        level: levelFor(l.eventType),
        bucket: bucketFor(l.eventType),
        actor: {
          id: l.actorId ? String(l.actorId) : undefined,
          name: l.actorId ? `User #${l.actorId}` : 'System',
          kind: l.actorId ? 'user' : 'system',
        },
        performedAt: l.timestamp,
        message: l.description || humanize(l.eventType),
        metadata: l.metadata,
      }));
    } catch {
      return [];
    }
  },

  async contacts() {
    return collectFrom({
      fetchList: async () => {
        const res = await contactsApi.getAll({ pageNumber: 1, pageSize: 25 } as any);
        return res.contacts || [];
      },
      fetchActivities: async (c: any) => {
        const r = await contactActivityApi.getByContact(c.id, 1, 15);
        return r.activities || [];
      },
      toEvent: (a: any, c: any) => ({
        id: `contacts:${a.id}`,
        source: 'contacts',
        entityType: 'contact',
        entityId: c.id,
        entityLabel: c.name || `${c.firstName ?? ''} ${c.lastName ?? ''}`.trim() || `#${c.id}`,
        entityUrl: `/dashboard/contacts/${c.id}`,
        action: a.type,
        actionLabel: humanize(a.type),
        level: levelFor(a.type),
        bucket: bucketFor(a.type),
        actor: {
          id: a.createdBy || undefined,
          name: a.createdBy || 'System',
          kind: a.createdBy ? 'user' : 'system',
        },
        performedAt: a.createdAt,
        message: a.description || humanize(a.type),
      }),
    });
  },
};

export const ADAPTER_KEYS: ActivitySource[] = ALL_SOURCES;

export async function fetchAggregated(
  sources: ActivitySource[] = ADAPTER_KEYS,
): Promise<ActivityEvent[]> {
  const jobs = sources
    .filter((s) => s in adapters)
    .map((s) => adapters[s]());
  const results = await Promise.allSettled(jobs);
  const all: ActivityEvent[] = [];
  for (const r of results) if (r.status === 'fulfilled') all.push(...r.value);
  all.sort((a, b) => (b.performedAt || '').localeCompare(a.performedAt || ''));
  return all;
}
