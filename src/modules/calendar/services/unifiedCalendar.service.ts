/**
 * Unified Calendar Service
 * Aggregates data from tasks, dispatches, offers, sales, and service orders
 * via real API calls — falls back to mock data if backend is unavailable.
 */
import type { CalendarEvent } from '../types';
import { startOfDay, endOfDay, addMinutes, parseISO, isValid } from 'date-fns';

// Source module identifier
export type CalendarSourceModule = 'task' | 'dispatch' | 'offer' | 'sale' | 'service_order' | 'manual';

// Color palette per source
const SOURCE_COLORS: Record<CalendarSourceModule, string> = {
  task: '#8b5cf6',        // violet
  dispatch: '#10b981',    // emerald
  offer: '#f59e0b',       // amber
  sale: '#3b82f6',        // blue
  service_order: '#ef4444', // red
  manual: '#6b7280',      // gray
};

// Labels per source
export const SOURCE_LABELS: Record<CalendarSourceModule, string> = {
  task: 'Task',
  dispatch: 'Dispatch',
  offer: 'Offer',
  sale: 'Sale',
  service_order: 'Service Order',
  manual: 'Event',
};

function safeParse(dateish: string | Date | undefined | null): Date | null {
  if (!dateish) return null;
  const d = typeof dateish === 'string' ? parseISO(dateish) : new Date(dateish);
  return isValid(d) ? d : null;
}

function toCalendarEvent(
  id: string,
  title: string,
  start: Date,
  end: Date,
  source: CalendarSourceModule,
  extra: Partial<CalendarEvent> = {}
): CalendarEvent {
  return {
    id,
    title,
    start,
    end,
    allDay: false,
    type: source,
    status: extra.status || 'scheduled',
    priority: extra.priority || 'medium',
    color: SOURCE_COLORS[source],
    isPrivate: false,
    createdAt: extra.createdAt || new Date(),
    updatedAt: extra.updatedAt || new Date(),
    createdBy: extra.createdBy || 'system',
    description: extra.description,
    location: extra.location,
    relatedType: extra.relatedType,
    relatedId: extra.relatedId,
    ...extra,
  };
}

// ── API-based Loaders ──────────────────────────────────────────────

async function loadTasks(): Promise<CalendarEvent[]> {
  try {
    const { tasksApi } = await import('@/services/api/tasksApi');
    // Try fetching daily tasks for all users (use userId=0 or current user)
    // The API may not support this, so we'll try and fall back
    const { getAuthToken } = await import('@/utils/apiHeaders');
    const token = getAuthToken();
    if (!token) return loadTasksFallback();
    
    const { API_URL } = await import('@/config/api');
    const { getAuthHeaders } = await import('@/utils/apiHeaders');
    
    const res = await fetch(`${API_URL}/api/Tasks/daily`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    
    if (!res.ok) return loadTasksFallback();
    
    const tasks: any[] = await res.json();
    return tasks
      .filter((t: any) => t.dueDate || t.scheduledDate)
      .map((t: any) => {
        const due = safeParse(t.dueDate || t.scheduledDate);
        if (!due) return null;
        const start = startOfDay(due);
        const end = t.estimatedHours
          ? addMinutes(start, (t.estimatedHours as number) * 60)
          : endOfDay(due);
        return toCalendarEvent(
          `task-${t.id}`,
          t.title,
          start,
          end,
          'task',
          {
            description: t.description,
            priority: t.priority || 'medium',
            status: t.status === 'Done' || t.status === 'completed' ? 'completed' : 'scheduled',
            createdAt: safeParse(t.createdAt || t.createdDate) || new Date(),
            updatedAt: safeParse(t.updatedAt || t.modifiedDate) || new Date(),
          }
        );
      })
      .filter(Boolean) as CalendarEvent[];
  } catch (err) {
    console.warn('[UnifiedCalendar] API failed for tasks, using fallback:', err);
    return loadTasksFallback();
  }
}

async function loadTasksFallback(): Promise<CalendarEvent[]> {
  try {
    const tasks = (await import('@/data/mock/contactTasks.json')).default as any[];
    return tasks
      .filter((t: any) => t.dueDate)
      .map((t: any) => {
        const due = safeParse(t.dueDate);
        if (!due) return null;
        const start = startOfDay(due);
        const end = t.estimatedHours ? addMinutes(start, (t.estimatedHours as number) * 60) : endOfDay(due);
        return toCalendarEvent(`task-${t.id}`, t.title, start, end, 'task', {
          description: t.description,
          priority: t.priority || 'medium',
          status: t.status === 'Done' ? 'completed' : 'scheduled',
        });
      })
      .filter(Boolean) as CalendarEvent[];
  } catch { return []; }
}

async function loadDispatches(): Promise<CalendarEvent[]> {
  try {
    const { dispatchesApi } = await import('@/services/api/dispatchesApi');
    const result = await dispatchesApi.getAll({ pageSize: 200 });
    const dispatches = result.data || [];
    return dispatches
      .filter((d: any) => d.scheduledAt || d.scheduledDate || d.startDate)
      .map((d: any) => {
        const start = safeParse(d.scheduledAt || d.scheduledDate || d.startDate);
        if (!start) return null;
        const end = addMinutes(start, d.estimatedDuration || 60);
        return toCalendarEvent(
          `dispatch-${d.id}`,
          d.title || d.jobNumber || `Dispatch #${d.id}`,
          start,
          end,
          'dispatch',
          {
            description: d.description || d.notes,
            priority: d.priority || 'medium',
            status: d.status || 'scheduled',
            location: d.customerAddress || d.location,
            relatedType: 'service_order',
            relatedId: d.serviceOrderId?.toString(),
            createdAt: safeParse(d.createdAt || d.createdDate) || new Date(),
            updatedAt: safeParse(d.updatedAt || d.modifiedDate) || new Date(),
            metadata: {
              technicianName: d.technicianName || d.assignedTo,
              jobNumber: d.jobNumber,
              serviceOrderId: d.serviceOrderId?.toString(),
              customerAddress: d.customerAddress || d.location,
              estimatedDuration: d.estimatedDuration,
              contactName: d.customerName || d.contactName,
            },
          }
        );
      })
      .filter(Boolean) as CalendarEvent[];
  } catch (err) {
    console.warn('[UnifiedCalendar] API failed for dispatches, using fallback:', err);
    return loadDispatchesFallback();
  }
}

async function loadDispatchesFallback(): Promise<CalendarEvent[]> {
  try {
    const dispatches = (await import('@/data/mock/dispatches.json')).default as any[];
    return dispatches
      .filter((d: any) => d.scheduledAt)
      .map((d: any) => {
        const start = safeParse(d.scheduledAt);
        if (!start) return null;
        const end = addMinutes(start, d.estimatedDuration || 60);
        return toCalendarEvent(`dispatch-${d.id}`, d.title, start, end, 'dispatch', {
          description: d.description,
          priority: d.priority || 'medium',
          status: d.status || 'scheduled',
          location: d.customer?.address ? `${d.customer.address.street}, ${d.customer.address.city}` : undefined,
          relatedType: 'service_order',
          relatedId: d.serviceOrderId,
        });
      })
      .filter(Boolean) as CalendarEvent[];
  } catch { return []; }
}

async function loadOffers(): Promise<CalendarEvent[]> {
  try {
    const { offersApi } = await import('@/services/api/offersApi');
    const result = await offersApi.getAll({ limit: 200 });
    const offers = result.data?.offers || [];
    return offers
      .filter((o: any) => o.validUntil || o.createdAt || o.createdDate)
      .map((o: any) => {
        const date = safeParse(o.validUntil || o.createdAt || o.createdDate);
        if (!date) return null;
        const start = startOfDay(date);
        const end = endOfDay(date);
        return toCalendarEvent(
          `offer-${o.id}`,
          `📋 ${o.title || o.offerNumber || `Offer #${o.id}`}`,
          start,
          end,
          'offer',
          {
            allDay: true,
            description: o.description || '',
            priority: 'medium',
            status: o.status,
            relatedType: 'offer',
            relatedId: o.id?.toString(),
            createdAt: safeParse(o.createdAt || o.createdDate) || new Date(),
            updatedAt: safeParse(o.updatedAt || o.modifiedDate) || new Date(),
            metadata: {
              amount: o.totalAmount || o.amount,
              currency: o.currency,
              contactName: o.contactName,
              offerNumber: o.offerNumber,
            },
          }
        );
      })
      .filter(Boolean) as CalendarEvent[];
  } catch (err) {
    console.warn('[UnifiedCalendar] API failed for offers, using fallback:', err);
    return loadOffersFallback();
  }
}

async function loadOffersFallback(): Promise<CalendarEvent[]> {
  try {
    const offers = (await import('@/data/mock/offers.json')).default as any[];
    return offers
      .filter((o: any) => o.validUntil || o.createdAt)
      .map((o: any) => {
        const date = safeParse(o.validUntil || o.createdAt);
        if (!date) return null;
        return toCalendarEvent(`offer-${o.id}`, `📋 ${o.title}`, startOfDay(date), endOfDay(date), 'offer', {
          allDay: true,
          description: `${o.description || ''}\nAmount: ${o.amount} ${o.currency}\nContact: ${o.contactName}`.trim(),
          status: o.status,
          relatedType: 'offer',
          relatedId: o.id,
        });
      })
      .filter(Boolean) as CalendarEvent[];
  } catch { return []; }
}

async function loadSales(): Promise<CalendarEvent[]> {
  try {
    const { salesApi } = await import('@/services/api/salesApi');
    const result = await salesApi.getAll({ limit: 200 });
    const sales = result.data?.sales || [];
    return sales
      .filter((s: any) => s.estimatedCloseDate || s.actualCloseDate || s.createdAt || s.createdDate)
      .map((s: any) => {
        const date = safeParse(s.estimatedCloseDate || s.actualCloseDate || s.createdAt || s.createdDate);
        if (!date) return null;
        const start = startOfDay(date);
        const end = endOfDay(date);
        return toCalendarEvent(
          `sale-${s.id}`,
          `💰 ${s.title || s.saleNumber || `Sale #${s.id}`}`,
          start,
          end,
          'sale',
          {
            allDay: true,
            description: s.description || '',
            priority: s.priority || 'medium',
            status: s.status,
            relatedType: 'sale',
            relatedId: s.id?.toString(),
            createdAt: safeParse(s.createdAt || s.createdDate) || new Date(),
            updatedAt: safeParse(s.updatedAt || s.modifiedDate) || new Date(),
            metadata: {
              amount: s.totalAmount || s.amount,
              currency: s.currency,
              contactName: s.contactName,
              saleNumber: s.saleNumber,
            },
          }
        );
      })
      .filter(Boolean) as CalendarEvent[];
  } catch (err) {
    console.warn('[UnifiedCalendar] API failed for sales, using fallback:', err);
    return loadSalesFallback();
  }
}

async function loadSalesFallback(): Promise<CalendarEvent[]> {
  try {
    const sales = (await import('@/data/mock/sales.json')).default as any[];
    return sales
      .filter((s: any) => s.estimatedCloseDate || s.actualCloseDate || s.createdAt)
      .map((s: any) => {
        const date = safeParse(s.estimatedCloseDate || s.actualCloseDate || s.createdAt);
        if (!date) return null;
        return toCalendarEvent(`sale-${s.id}`, `💰 ${s.title}`, startOfDay(date), endOfDay(date), 'sale', {
          allDay: true,
          description: `${s.description || ''}\nAmount: ${s.amount} ${s.currency}\nContact: ${s.contactName}`.trim(),
          priority: s.priority || 'medium',
          status: s.status,
          relatedType: 'sale',
          relatedId: s.id,
        });
      })
      .filter(Boolean) as CalendarEvent[];
  } catch { return []; }
}

async function loadServiceOrders(): Promise<CalendarEvent[]> {
  try {
    const { serviceOrdersApi } = await import('@/services/api/serviceOrdersApi');
    const result = await serviceOrdersApi.getAll({ pageSize: 200 });
    const orders = result.data?.serviceOrders || [];
    return orders
      .filter((so: any) => so.startDate || so.targetCompletionDate || so.createdDate || so.createdAt)
      .map((so: any) => {
        const start = safeParse(so.startDate || so.targetCompletionDate || so.createdDate || so.createdAt);
        if (!start) return null;
        const end = addMinutes(start, so.estimatedDuration || 60);
        return toCalendarEvent(
          `so-${so.id}`,
          `🔧 ${so.title || so.orderNumber || `SO #${so.id}`}`,
          start,
          end,
          'service_order',
          {
            description: so.notes || so.description,
            priority: so.priority || 'medium',
            status: so.status || 'scheduled',
            location: so.contactAddress || so.location,
            relatedType: 'service_order',
            relatedId: so.id?.toString(),
            createdAt: safeParse(so.createdDate || so.createdAt) || new Date(),
            updatedAt: safeParse(so.modifiedDate || so.updatedAt) || new Date(),
            metadata: {
              orderNumber: so.orderNumber,
              contactName: so.contactName || so.customerName,
              customerAddress: so.contactAddress || so.location,
              estimatedDuration: so.estimatedDuration,
              assignedTo: so.assignedTo || so.technicianName,
            },
          }
        );
      })
      .filter(Boolean) as CalendarEvent[];
  } catch (err) {
    console.warn('[UnifiedCalendar] API failed for service orders, using fallback:', err);
    return loadServiceOrdersFallback();
  }
}

async function loadServiceOrdersFallback(): Promise<CalendarEvent[]> {
  try {
    const orders = (await import('@/data/mock/serviceOrders.json')).default as any[];
    return orders
      .filter((so: any) => so.scheduledAt || so.createdAt)
      .map((so: any) => {
        const start = safeParse(so.scheduledAt || so.createdAt);
        if (!start) return null;
        const end = addMinutes(start, so.estimatedDuration || 60);
        return toCalendarEvent(`so-${so.id}`, `🔧 ${so.title}`, start, end, 'service_order', {
          description: so.description || so.notes,
          priority: so.priority || 'medium',
          status: so.status || 'scheduled',
          location: so.customer?.address ? `${so.customer.address.street}, ${so.customer.address.city}` : undefined,
          relatedType: 'service_order',
          relatedId: so.id,
        });
      })
      .filter(Boolean) as CalendarEvent[];
  } catch { return []; }
}

// ── Public API ───────────────────────────────────────────

let _cachedEvents: CalendarEvent[] | null = null;
let _manualEvents: CalendarEvent[] = [];

export const UnifiedCalendarService = {
  /**
   * Load all events from every source module via APIs.
   * Falls back to mock data if backend is unavailable.
   * Results are cached for the session (call refresh() to reload).
   */
  async loadAll(): Promise<CalendarEvent[]> {
    if (_cachedEvents) return [..._cachedEvents, ..._manualEvents];

    const [tasks, dispatches, offers, sales, serviceOrders] = await Promise.all([
      loadTasks(),
      loadDispatches(),
      loadOffers(),
      loadSales(),
      loadServiceOrders(),
    ]);

    _cachedEvents = [...tasks, ...dispatches, ...offers, ...sales, ...serviceOrders];
    return [..._cachedEvents, ..._manualEvents];
  },

  /** Force reload from all sources. */
  async refresh(): Promise<CalendarEvent[]> {
    _cachedEvents = null;
    return this.loadAll();
  },

  /** Create a manual calendar event (not tied to any module). */
  create(data: { title: string; start: Date; end: Date; type: string; description?: string; location?: string }): CalendarEvent {
    const id = `manual-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const event = toCalendarEvent(id, data.title, data.start, data.end, 'manual', {
      description: data.description,
      location: data.location,
    });
    _manualEvents.push(event);
    return event;
  },

  /** Update a manual event. */
  update(eventId: string, patch: Partial<CalendarEvent>): CalendarEvent | null {
    const idx = _manualEvents.findIndex(e => e.id === eventId);
    if (idx === -1) return null;
    _manualEvents[idx] = { ..._manualEvents[idx], ...patch, updatedAt: new Date() };
    return _manualEvents[idx];
  },

  /** Delete a manual event. */
  remove(eventId: string): boolean {
    const idx = _manualEvents.findIndex(e => e.id === eventId);
    if (idx === -1) return false;
    _manualEvents.splice(idx, 1);
    return true;
  },

  /** Check if an event is editable (only manual events). */
  isEditable(eventId: string): boolean {
    return eventId.startsWith('manual-');
  },

  /**
   * Get the navigation URL for a module-generated event.
   */
  getSourceUrl(eventId: string): string | null {
    if (eventId.startsWith('manual-')) return null;
    if (eventId.startsWith('dispatch-')) {
      const originalId = eventId.replace(/^dispatch-/, '');
      return `/dashboard/field/dispatches/${originalId}`;
    }
    if (eventId.startsWith('offer-')) {
      const originalId = eventId.replace(/^offer-/, '');
      return `/dashboard/offers/${originalId}`;
    }
    if (eventId.startsWith('sale-')) {
      const originalId = eventId.replace(/^sale-/, '');
      return `/dashboard/sales/${originalId}`;
    }
    if (eventId.startsWith('so-')) {
      const originalId = eventId.replace(/^so-/, '');
      return `/dashboard/field/service-orders/${originalId}`;
    }
    if (eventId.startsWith('task-')) {
      return `/dashboard/tasks/daily`;
    }
    return null;
  },

  /** Get source color map. */
  getSourceColors() {
    return { ...SOURCE_COLORS };
  },

  /** Get source labels map. */
  getSourceLabels() {
    return { ...SOURCE_LABELS };
  },
};
