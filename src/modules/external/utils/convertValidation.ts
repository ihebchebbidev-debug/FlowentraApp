import { z } from 'zod';

/**
 * Shared validation for fields that come from converted external-endpoint
 * payloads (or the Add Offer / Add Sale forms in general). Heuristic parsers
 * can produce dirty values (long strings, malformed emails, negative prices),
 * so every create-form must validate before hitting the API.
 *
 * All limits are intentionally generous to match what the backend columns
 * accept, but tight enough to block obvious abuse / DoS payloads.
 */

const optionalTrimmed = (max: number) =>
  z.string().trim().max(max).optional().or(z.literal('').transform(() => undefined));

export const itemSchema = z.object({
  description: z.string().trim().max(500).optional(),
  quantity: z.number({ invalid_type_error: 'Quantity must be a number' })
    .positive({ message: 'Quantity must be greater than 0' })
    .max(1_000_000, { message: 'Quantity too large' }),
  unitPrice: z.number({ invalid_type_error: 'Unit price must be a number' })
    .min(0, { message: 'Unit price cannot be negative' })
    .max(1_000_000_000, { message: 'Unit price too large' }),
  totalPrice: z.number().min(0).max(1_000_000_000_000).optional(),
});

/**
 * Schema used by both AddOffer and AddSale. Pages map their field names
 * (contactName/customerName, contactEmail/customerEmail, …) onto these keys
 * before calling `validateConvertibleForm`.
 */
export const convertibleFormSchema = z.object({
  title: z.string().trim().min(1, { message: 'Title is required' }).max(255),
  contactName: z.string().trim().min(1, { message: 'Contact name is required' }).max(255),
  contactEmail: optionalTrimmed(255).pipe(
    z.union([z.string().email({ message: 'Invalid email address' }), z.undefined()])
  ),
  // Phones come from many regions — keep permissive but block junk.
  contactPhone: optionalTrimmed(40).pipe(
    z.union([
      z.string().regex(/^[+()\-.\s\d]{4,40}$/, { message: 'Invalid phone number' }),
      z.undefined(),
    ])
  ),
  contactAddress: optionalTrimmed(500),
  notes: optionalTrimmed(2000),
  currency: z.string().trim().min(2).max(8).optional(),
  amount: z.number().min(0, { message: 'Amount cannot be negative' }).max(1_000_000_000_000).optional(),
  items: z.array(itemSchema).max(500).optional(),
});

export type ConvertibleFormInput = z.input<typeof convertibleFormSchema>;

export interface ValidationResult {
  ok: boolean;
  /** First error message, ready to show in a toast. */
  message?: string;
}

export function validateConvertibleForm(input: ConvertibleFormInput): ValidationResult {
  const r = convertibleFormSchema.safeParse(input);
  if (r.success) return { ok: true };
  const first = r.error.issues[0];
  const path = first.path.length ? `${first.path.join('.')}: ` : '';
  return { ok: false, message: `${path}${first.message}` };
}
