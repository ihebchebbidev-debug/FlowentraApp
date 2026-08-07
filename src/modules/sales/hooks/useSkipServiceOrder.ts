import { useCallback, useEffect, useState } from "react";

/**
 * Per-sale opt-out for Service Order conversion.
 * Stored in localStorage so the choice persists across reloads
 * without requiring a backend schema change.
 *
 * When `skip` is true:
 *  - The "create service order" workflow modal is bypassed on status change
 *  - The conversion banner switches to a "kept in Sales only" state
 *  - The convert action is replaced by a "Convert anyway" action
 */
const storageKey = (saleId: string | undefined) =>
  saleId ? `sale:skip-service-order:${saleId}` : null;

export function useSkipServiceOrder(saleId: string | undefined) {
  const [skip, setSkipState] = useState<boolean>(false);

  useEffect(() => {
    const key = storageKey(saleId);
    if (!key) return;
    try {
      setSkipState(localStorage.getItem(key) === "1");
    } catch {
      setSkipState(false);
    }
  }, [saleId]);

  const setSkip = useCallback(
    (value: boolean) => {
      const key = storageKey(saleId);
      setSkipState(value);
      if (!key) return;
      try {
        if (value) localStorage.setItem(key, "1");
        else localStorage.removeItem(key);
      } catch {
        /* ignore storage errors */
      }
    },
    [saleId]
  );

  return { skip, setSkip };
}