import { useEffect, useState } from 'react';
import {
  canSeeContact,
  canSeeContactId,
  ensureContactVisibilityLoaded,
  getContactVisibilityVersion,
  subscribeContactVisibility,
} from '@/services/contactVisibility';

/**
 * Detail-page guard: resolves whether the current user may open a record that
 * belongs to `contactId`. While the visibility map is loading, `checking` is
 * true so pages can keep their own skeleton instead of flashing the block page.
 */
export function useContactAccessGuard(
  contactId?: number | string | null,
  contact?: unknown,
): { checking: boolean; allowed: boolean } {
  const [ready, setReady] = useState(false);
  const [, setVersion] = useState(() => getContactVisibilityVersion());

  useEffect(() => {
    let active = true;
    const unsubscribe = subscribeContactVisibility(() =>
      setVersion(getContactVisibilityVersion()),
    );
    void ensureContactVisibilityLoaded().finally(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const hasTarget =
    contact != null || (contactId !== null && contactId !== undefined && contactId !== '');

  if (!ready) return { checking: true, allowed: true };
  if (!hasTarget) return { checking: false, allowed: true };

  const allowed = contact != null ? canSeeContact(contact) : canSeeContactId(contactId);
  return { checking: false, allowed };
}
