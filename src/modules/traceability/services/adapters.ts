import { salesApi } from '@/services/api/salesApi';
import { offersApi } from '@/services/api/offersApi';
import { dealsApi } from '@/services/api/dealsApi';
import { customerInvoicesApi } from '@/services/api/customerInvoicesApi';
import { purchaseOrderService } from '@/modules/purchases/services/purchaseService';
import { dispatchesApi } from '@/services/api/dispatchesApi';
import { hrApi } from '@/modules/hr/services/hrApi';
import { contactsApi } from '@/services/api/contactsApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { articlesApi, transactionsApi } from '@/services/api/articlesApi';
import { logsApi } from '@/services/api/logsApi';
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
  note_added: 'info',
  imported: 'info',
  exported: 'info',
  // Invoice lifecycle events mirrored onto the related sale's feed.
  invoice_created: 'info',
  invoice_posted: 'info',
  invoice_marked_paid: 'success',
  invoice_auto_marked_paid: 'success',
  invoice_voided: 'warning',
  invoice_deleted: 'warning',
  invoice_reopened: 'warning',
  invoice_auto_reopened: 'warning',
};

const SETTINGS_ACTION_MAP: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  import: 'imported',
  export: 'exported',
};

function levelFor(action?: string): ActivityLevel {
  if (!action) return 'info';
  return LEVEL_BY_ACTION[action] ?? 'info';
}

function bucketFor(action?: string): ActivityBucket {
  const a = (action || '').toLowerCase();
  if (!a) return 'other';
  if (a.startsWith('invoice_')) return a === 'invoice_created' ? 'created' : 'status';
  if (/(created|added|opened)/.test(a)) return 'created';
  if (/(status|posted|sent|paid|voided|void|reopened|completed|started|assigned|confirmed|cancelled|accepted|rejected)/.test(a))
    return 'status';
  if (/(stock_)/.test(a)) return 'status';
  if (/(note_added|imported|exported)/.test(a)) return 'other';
  if (/(updated|edited|changed|modified|note_updated)/.test(a)) return 'updated';
  return 'other';
}

function humanize(action?: string): string {
  if (!action) return '—';
  return action.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}


interface SynthEvent {
  key: string;
  action: string;
  performedAt: string;
  message: string;
  actorId?: string;
  actorName?: string;
  newValue?: string;
}

/**
 * Builds real business events for records that have no dedicated activity
 * endpoint: creation, last update, current status and user-authored notes.
 */
function synthesizeRecordEvents(record: any, notes: any[] = []): SynthEvent[] {
  const out: SynthEvent[] = [];
  const createdAt = record?.createdAt || record?.created_at;
  const updatedAt = record?.updatedAt || record?.updated_at;
  const createdBy = record?.createdBy || record?.created_by;
  const updatedBy = record?.updatedBy || record?.updated_by;
  if (createdAt) {
    out.push({
      key: 'created',
      action: 'created',
      performedAt: createdAt,
      message: 'Record created',
      actorId: createdBy,
      actorName: record?.createdByName || createdBy,
    });
  }
  if (updatedAt && updatedAt !== createdAt) {
    out.push({
      key: 'updated',
      action: record?.status ? 'status_changed' : 'updated',
      performedAt: updatedAt,
      message: record?.status ? `Current status: ${record.status}` : 'Record updated',
      actorId: updatedBy,
      actorName: record?.updatedByName || updatedBy,
      newValue: record?.status ? String(record.status) : undefined,
    });
  }
  for (const n of notes) {
    const at = n?.createdAt || n?.created_at;
    if (!at) continue;
    out.push({
      key: `note:${n.id}`,
      action: 'note_added',
      performedAt: at,
      message: n.content || n.note || 'Note added',
      actorId: n.createdBy || n.userId,
      actorName: n.createdByName || n.createdBy,
    });
  }
  return out;
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

  async dispatches() {
    return collectFrom({
      fetchList: async () => {
        const res = await dispatchesApi.getAll({ pageNumber: 1, pageSize: 25 } as any);
        return (res as any).data || [];
      },
      fetchActivities: async (d: any) => {
        return await dispatchesApi.getActivityLog(d.id);
      },
      toEvent: (a: any, d: any) => ({
        id: `dispatches:${a.id}`,
        source: 'dispatches',
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

  /**
   * Service orders have no dedicated activity endpoint, so we derive real
   * business events from the record itself (created / updated / status) plus
   * its notes, which are user-authored actions.
   */
  async service() {
    return collectFrom({
      fetchList: async () => {
        const res = await serviceOrdersApi.getAll({ page: 1, pageSize: 25 } as any);
        return res.data?.serviceOrders || [];
      },
      fetchActivities: async (o: any) => {
        const notes = await serviceOrdersApi.getNotes(o.id).catch(() => []);
        return synthesizeRecordEvents(o, notes || []);
      },
      toEvent: (a: any, o: any) => ({
        id: `service:${o.id}:${a.key}`,
        source: 'service',
        entityType: 'service_order',
        entityId: o.id,
        entityLabel: o.orderNumber || o.serviceOrderNumber || o.title || `#${o.id}`,
        entityUrl: `/dashboard/service-orders/${o.id}`,
        action: a.action,
        actionLabel: humanize(a.action),
        level: levelFor(a.action),
        bucket: bucketFor(a.action),
        actor: { id: a.actorId, name: a.actorName || 'System', kind: a.actorId ? 'user' : 'system' },
        performedAt: a.performedAt,
        message: a.message,
        newValue: a.newValue,
      }),
    });
  },

  /**
   * Articles: creations / updates on the article record plus every stock
   * movement (in, out, adjustment) recorded against it.
   */
  async articles() {
    const events: ActivityEvent[] = [];
    try {
      const res = await articlesApi.getAll({ page: 1, limit: 25 } as any);
      const list = (res as any)?.data || [];
      for (const art of list) {
        for (const ev of synthesizeRecordEvents(art, [])) {
          events.push({
            id: `articles:${art.id}:${ev.key}`,
            source: 'articles',
            entityType: 'article',
            entityId: art.id,
            entityLabel: art.name || art.sku || art.articleNumber || `#${art.id}`,
            entityUrl: `/dashboard/articles/${art.id}`,
            action: ev.action,
            actionLabel: humanize(ev.action),
            level: levelFor(ev.action),
            bucket: bucketFor(ev.action),
            actor: { id: ev.actorId, name: ev.actorName || 'System', kind: ev.actorId ? 'user' : 'system' },
            performedAt: ev.performedAt,
            message: ev.message,
            newValue: ev.newValue,
          });
        }
      }
    } catch {
      /* ignore — other sources still render */
    }
    try {
      const txs = await transactionsApi.getAll();
      for (const tx of (txs || []).slice(0, 50) as any[]) {
        const type = (tx.type || tx.transactionType || 'stock_movement').toString().toLowerCase();
        events.push({
          id: `articles:tx:${tx.id}`,
          source: 'articles',
          entityType: 'stock_transaction',
          entityId: tx.articleId ?? tx.id,
          entityLabel: tx.articleName || tx.articleNumber || `Article #${tx.articleId ?? '—'}`,
          entityUrl: tx.articleId ? `/dashboard/articles/${tx.articleId}` : undefined,
          action: `stock_${type}`,
          actionLabel: humanize(`stock_${type}`),
          level: 'info',
          bucket: 'status',
          actor: {
            id: tx.createdBy || tx.userId,
            name: tx.createdByName || tx.createdBy || 'System',
            kind: tx.createdBy || tx.userId ? 'user' : 'system',
          },
          performedAt: tx.createdAt || tx.transactionDate || tx.date,
          message: `${humanize(type)} ${tx.quantity ?? ''}${tx.reason ? ` — ${tx.reason}` : ''}`.trim(),
          newValue: tx.quantity != null ? String(tx.quantity) : undefined,
        });
      }
    } catch {
      /* ignore */
    }
    return events.filter((e) => !!e.performedAt);
  },

  /**
   * Settings: configuration changes recorded in the system log. Only real
   * data mutations are surfaced — never errors or read traffic.
   */
  async settings() {
    try {
      const res = await logsApi.getAll({ module: 'settings', pageSize: 50, pageNumber: 1 } as any);
      const logs = (res?.logs || []).filter((l: any) =>
        ['create', 'update', 'delete', 'import', 'export'].includes((l.action || '').toLowerCase()),
      );
      return logs.map((l: any): ActivityEvent => ({
        id: `settings:${l.id}`,
        source: 'settings',
        entityType: l.entityType || 'setting',
        entityId: l.entityId ?? l.id,
        entityLabel: l.entityType ? `${l.entityType}${l.entityId ? ` #${l.entityId}` : ''}` : 'Settings',
        entityUrl: '/dashboard/settings',
        action: SETTINGS_ACTION_MAP[(l.action || '').toLowerCase()] || 'updated',
        actionLabel: humanize(SETTINGS_ACTION_MAP[(l.action || '').toLowerCase()] || 'updated'),
        level: 'info',
        bucket: bucketFor(SETTINGS_ACTION_MAP[(l.action || '').toLowerCase()] || 'updated'),
        actor: { id: l.userId, name: l.userName || l.userId || 'System', kind: l.userId ? 'user' : 'system' },
        performedAt: l.timestamp,
        message: l.message || l.details || humanize(l.action),
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
