/**
 * Frontend-only contact visibility filter.
 *
 * Rule (agreed with the product owner):
 *   • MainAdminUser                          → sees everything, always.
 *   • Contact with NO user group assigned    → visible to everyone.
 *   • Contact WITH one or more user groups   → visible only to users who are
 *     an active member of at least one of those groups. Everyone else does
 *     not see the contact, nor any record linked to it (service orders,
 *     dispatches, sales, offers, invoices, installations, deals...).
 *
 * IMPORTANT: this is a presentation-level filter. The API still returns the
 * full data set; this only decides what the UI renders.
 */
import { getAuthClaims } from '@/utils/authClaims';
import { contactsApi } from '@/services/api/contactsApi';
import { userGroupsApi } from '@/services/api/userGroupsApi';

type Listener = () => void;

interface VisibilityState {
  ready: boolean;
  isMainAdmin: boolean;
  myGroupIds: Set<number>;
  /** contactId → assigned user-group ids (empty array = ungrouped = public) */
  contactGroups: Map<number, number[]>;
}

const EMPTY_STATE: VisibilityState = {
  ready: false,
  isMainAdmin: false,
  myGroupIds: new Set<number>(),
  contactGroups: new Map<number, number[]>(),
};

let state: VisibilityState = EMPTY_STATE;
let loading: Promise<void> | null = null;
let version = 0;
const listeners = new Set<Listener>();

function notify() {
  version++;
  Array.from(listeners).forEach((fn) => {
    try {
      fn();
    } catch {
      /* never let one subscriber break the others */
    }
  });
}

export function subscribeContactVisibility(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getContactVisibilityVersion(): number {
  return version;
}

export function getContactVisibilityState(): VisibilityState {
  return state;
}

/** Drop every cached membership/assignment. Call on logout or tenant switch. */
export function invalidateContactVisibility(): void {
  state = EMPTY_STATE;
  loading = null;
  notify();
}

async function load(): Promise<void> {
  const claims = getAuthClaims();

  if (claims.isMainAdmin) {
    state = {
      ready: true,
      isMainAdmin: true,
      myGroupIds: new Set<number>(),
      contactGroups: new Map<number, number[]>(),
    };
    notify();
    return;
  }

  const myGroupIds = new Set<number>();
  const contactGroups = new Map<number, number[]>();

  try {
    if (claims.userId != null) {
      const groups = await userGroupsApi.getUserGroups(claims.userId);
      groups.forEach((g) => myGroupIds.add(g.id));
    }
  } catch {
    /* membership unknown → treated as "member of nothing" below */
  }

  try {
    const response = await contactsApi.getAllRaw({ pageSize: 5000 });
    (response?.contacts ?? []).forEach((c: any) => {
      contactGroups.set(
        Number(c.id),
        Array.isArray(c.userGroups) ? c.userGroups.map((g: any) => Number(g.id)) : [],
      );
    });
  } catch {
    /* contact map unknown → unknown ids stay visible (fail-open, see below) */
  }

  state = { ready: true, isMainAdmin: false, myGroupIds, contactGroups };
  notify();
}

/** Load (once) the current user's groups and the contact → groups map. */
export function ensureContactVisibilityLoaded(): Promise<void> {
  if (state.ready) return Promise.resolve();
  if (!loading) {
    loading = load().finally(() => {
      loading = null;
    });
  }
  return loading;
}

function allowedByGroups(groupIds: number[] | undefined): boolean {
  if (!groupIds || groupIds.length === 0) return true; // ungrouped = public
  return groupIds.some((id) => state.myGroupIds.has(id));
}

/** Can the current user see this contact object (uses its own `userGroups`)? */
export function canSeeContact(contact: any): boolean {
  if (!contact) return true;
  if (state.isMainAdmin || !state.ready) return true;
  const inline = Array.isArray(contact.userGroups)
    ? contact.userGroups.map((g: any) => Number(g.id))
    : undefined;
  if (inline) return allowedByGroups(inline);
  return canSeeContactId(contact.id);
}

/**
 * Can the current user see records attached to this contact id?
 * Unknown ids (not loaded / no contact link) stay visible so nothing silently
 * disappears because of a cache miss.
 */
export function canSeeContactId(contactId?: number | string | null): boolean {
  if (state.isMainAdmin || !state.ready) return true;
  if (contactId === null || contactId === undefined || contactId === '') return true;
  const id = Number(contactId);
  if (Number.isNaN(id)) return true;
  if (!state.contactGroups.has(id)) return true;
  return allowedByGroups(state.contactGroups.get(id));
}

/** Filter any list of records that carry a contact id. */
export function filterByContactVisibility<T>(
  rows: T[] | null | undefined,
  getContactId: (row: T) => number | string | null | undefined = (row: any) =>
    row?.contactId ?? row?.contact?.id,
): T[] {
  if (!rows) return [];
  if (state.isMainAdmin || !state.ready) return rows;
  return rows.filter((row) => canSeeContactId(getContactId(row)));
}

/** Filter a list of contacts themselves. */
export function filterVisibleContacts<T>(contacts: T[] | null | undefined): T[] {
  if (!contacts) return [];
  if (state.isMainAdmin || !state.ready) return contacts;
  return contacts.filter((c) => canSeeContact(c));
}
/**
 * Filter one page of server-paginated rows and repair the pagination counters
 * so the pager never advertises records the user is not allowed to see.
 *
 * The API paginates on the server, so we can only observe the rows of the
 * current page. We therefore subtract the rows hidden on this page from the
 * reported total (best effort) and recompute the page count.
 */
export function filterPageByContactVisibility<T>(
  rows: T[] | null | undefined,
  pagination: { total?: number; totalCount?: number; totalPages?: number; pageSize?: number; limit?: number } | null | undefined,
  getContactId?: (row: T) => number | string | null | undefined,
): { rows: T[]; total: number; totalPages: number; hidden: number } {
  const all = rows ?? [];
  const visible = filterByContactVisibility(all, getContactId as any);
  const hidden = all.length - visible.length;

  const rawTotal = Number(pagination?.total ?? pagination?.totalCount ?? all.length) || 0;
  const pageSize = Number(pagination?.pageSize ?? pagination?.limit ?? all.length) || visible.length || 1;
  const total = Math.max(visible.length, rawTotal - hidden);
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  return { rows: visible, total, totalPages, hidden };
}
