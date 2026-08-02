import { useEffect, useMemo, useState } from 'react';
import {
  canSeeContact,
  canSeeContactId,
  ensureContactVisibilityLoaded,
  filterByContactVisibility,
  filterVisibleContacts,
  getContactVisibilityState,
  getContactVisibilityVersion,
  subscribeContactVisibility,
} from '@/services/contactVisibility';

/**
 * React binding for the contact user-group visibility filter.
 * Re-renders whenever the memberships / contact map are (re)loaded.
 */
export function useContactVisibility() {
  const [, setVersion] = useState(() => getContactVisibilityVersion());

  useEffect(() => {
    const unsubscribe = subscribeContactVisibility(() =>
      setVersion(getContactVisibilityVersion()),
    );
    void ensureContactVisibilityLoaded();
    return unsubscribe;
  }, []);

  const state = getContactVisibilityState();

  return {
    ready: state.ready,
    isMainAdmin: state.isMainAdmin,
    canSeeContact,
    canSeeContactId,
    filterByContactVisibility,
    filterVisibleContacts,
  };
}

/** Filter any array of records carrying a `contactId` (memoised). */
export function useVisibleByContact<T>(
  rows: T[] | null | undefined,
  getContactId?: (row: T) => number | string | null | undefined,
): T[] {
  const { ready, isMainAdmin } = useContactVisibility();
  return useMemo(
    () => filterByContactVisibility(rows, getContactId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rows, ready, isMainAdmin],
  );
}