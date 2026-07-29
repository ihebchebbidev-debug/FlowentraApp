/**
 * resolvePdfCompany / buildFooterLines
 *
 * Single place where a report's company block is assembled.
 *
 * Precedence, per field:
 *   1. module override  (only when `useOverride` is on AND the field is filled)
 *   2. the OWNING COMPANY's Company Information (per-tenant, never shared)
 *   3. empty string
 *
 * Because the source is the active company's own tenant row, company A's
 * reports can never print company B's address.
 */
import type { CompanyProfile } from '@/shared/company/activeCompany';

/** The company block stored inside every module's PDF settings. */
export interface PdfCompanyBlock {
  useOverride?: boolean;
  name?: string;
  tagline?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  state?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  registrationNumber?: string;
  shareCapital?: string;
  bankName?: string;
  bankAccount?: string;
  bankSwift?: string;
  footerMessage?: string;
  logo?: string;
}

/** Demo values that shipped as defaults — never print these. */
const DEMO_VALUES = new Set(
  [
    'PEAK SOLUTIONS',
    'YOUR COMPANY',
    'Mountain Service Excellence',
    'Professional Field Services',
    '1234 Service Street, Tech City, TC 12345',
    '1234 Business Street, City, State 12345',
    '(555) 123-4567',
    'service@peaksolutions.com',
    'www.peaksolutions.com',
    'service@yourcompany.com',
    'www.yourcompany.com',
  ].map(v => v.toLowerCase()),
);

export function isDemoValue(value: string | undefined | null): boolean {
  if (!value) return false;
  return DEMO_VALUES.has(value.trim().toLowerCase());
}

const clean = (v: string | undefined | null): string => {
  const t = typeof v === 'string' ? v.trim() : '';
  return isDemoValue(t) ? '' : t;
};

type CompanyField = keyof Omit<PdfCompanyBlock, 'useOverride' | 'logo'>;

const FIELD_MAP: Record<CompanyField, keyof CompanyProfile> = {
  name: 'name',
  tagline: 'tagline',
  address: 'address',
  city: 'city',
  postalCode: 'postalCode',
  state: 'state',
  country: 'country',
  phone: 'phone',
  email: 'email',
  website: 'website',
  taxId: 'taxId',
  registrationNumber: 'registrationNumber',
  shareCapital: 'shareCapital',
  bankName: 'bankName',
  bankAccount: 'bankAccount',
  bankSwift: 'bankSwift',
  footerMessage: 'footerMessage',
};

/**
 * Merge the module override on top of the owning company's own details.
 * `logoBase64` wins over anything stored in settings (only base64 renders
 * inside react-pdf without tripping CORS).
 */
export function resolvePdfCompany(
  override: PdfCompanyBlock | undefined,
  company: CompanyProfile | undefined,
  logoBase64?: string,
): Required<Omit<PdfCompanyBlock, 'useOverride'>> & { useOverride: boolean } {
  const useOverride = override?.useOverride === true;
  const out = {} as Record<string, string>;

  (Object.keys(FIELD_MAP) as CompanyField[]).forEach(field => {
    const overridden = useOverride ? clean(override?.[field] as string | undefined) : '';
    const inherited = clean(company?.[FIELD_MAP[field]] as string | undefined);
    out[field] = overridden || inherited || '';
  });

  return {
    ...(out as unknown as Required<Omit<PdfCompanyBlock, 'useOverride' | 'logo'>>),
    logo: logoBase64 || override?.logo || '',
    useOverride,
  };
}

const join = (parts: (string | undefined)[], sep = ' • '): string =>
  parts.map(p => (p ?? '').trim()).filter(Boolean).join(sep);

/** One-line postal address: "Street, 1000 City, Region, Country". */
export function buildAddressLine(c: PdfCompanyBlock): string {
  const locality = join([c.postalCode, c.city], ' ');
  return join([c.address, locality, c.state, c.country], ', ');
}

/**
 * The footer, as up to three lines. Empty fields collapse, so a company that
 * filled in only a phone number never gets stray "• •" separators.
 */
export function buildFooterLines(c: PdfCompanyBlock | undefined): string[] {
  if (!c) return [];
  const contact = join([buildAddressLine(c), c.phone, c.email, c.website]);
  const legal = join([
    c.taxId ? `Tax ID: ${c.taxId}` : '',
    c.registrationNumber ? `Reg: ${c.registrationNumber}` : '',
    c.shareCapital ? `Capital: ${c.shareCapital}` : '',
  ]);
  const bank = join([c.bankName, c.bankAccount, c.bankSwift ? `SWIFT ${c.bankSwift}` : '']);
  return [contact, legal, bank].filter(Boolean);
}

/**
 * Async convenience used by report pages / preview modals: resolves the
 * OWNING company's own details, then applies the module override on top.
 */
export async function resolveCompanyForPdf(
  override: PdfCompanyBlock | undefined,
  logoBase64?: string,
) {
  const { loadActiveCompany } = await import('@/shared/company/activeCompany');
  const company = await loadActiveCompany();
  return resolvePdfCompany(override, company, logoBase64);
}
