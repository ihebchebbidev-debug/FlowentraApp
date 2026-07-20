// Centralized technician-id normalization used across dispatcher services.
// Input can be "42", "tech-42", "admin-22", "loc-3-tech-42", etc.
// We keep the LAST digit-run because compound ids like "loc-3-tech-42" mean the
// technician id is 42 (not the location id 3). Falls back to the raw string when
// no digits are present.
export const normalizeTechId = (raw: string | number | null | undefined): string => {
  if (raw === null || raw === undefined) return '';
  const s = String(raw);
  const m = s.match(/(\d+)(?!.*\d)/);
  return m?.[1] ?? s;
};