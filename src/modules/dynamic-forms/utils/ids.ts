// Collision-safe ID generator for form fields and options.
// `Date.now()` collides when two items are created within the same millisecond
// (rapid add / duplicate), which corrupts response keys, conditions and React keys.

export function genId(prefix: string): string {
  const rand =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${rand}`;
}
