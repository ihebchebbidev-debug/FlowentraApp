import { useCallback, useRef, useState } from 'react';

/**
 * Prevents double-submission from rapid double-clicks. Unlike a plain
 * `disabled={loading}` guard which only takes effect after React re-renders,
 * this uses a synchronous ref lock so a second click in the same tick is
 * ignored immediately.
 *
 * Usage:
 *   const { guard, pending } = useSubmitGuard();
 *   const onSave = guard(async () => { await api.save(); });
 *   <Button onClick={onSave} disabled={pending}>Save</Button>
 */
export function useSubmitGuard() {
  const lockRef = useRef(false);
  const [pending, setPending] = useState(false);

  const guard = useCallback(
    <TArgs extends unknown[], TResult>(
      fn: (...args: TArgs) => Promise<TResult> | TResult,
    ) => {
      return async (...args: TArgs): Promise<TResult | undefined> => {
        if (lockRef.current) return undefined;
        lockRef.current = true;
        setPending(true);
        try {
          return await fn(...args);
        } finally {
          lockRef.current = false;
          setPending(false);
        }
      };
    },
    [],
  );

  return { guard, pending };
}
