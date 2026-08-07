/**
 * Format a quantity value with exactly 2 decimal places.
 * Used for item/service/material quantities (hours, minutes, units, etc.)
 * to match the precision of monetary amounts on quotes and invoices.
 */
export function formatQuantity(value: number | string | null | undefined): string {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? 0));
  if (!Number.isFinite(n)) return "0.00";
  return n.toFixed(2);
}
