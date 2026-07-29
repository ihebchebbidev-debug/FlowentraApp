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

/**
 * Variants of the same demo data (different casing, suffixes like "Inc.",
 * placeholder phone/email/website patterns). Exact-string matching alone let
 * "Peak Solutions Inc." or "info@yourcompany.com" through into real footers.
 */
const DEMO_PATTERNS: RegExp[] = [
  /^peak\s*solutions\b/i,
  /^your\s+company\b/i,
  /^(acme|example)\s+(corp|company|inc)\b/i,
  /^(company|your)\s*(name|address|logo)$/i,
  /^\s*(n\/a|tbd|xxx+|lorem ipsum)\s*$/i,
  /\b1234\s+(service|business|main)\s+street\b/i,
  /\btech city,?\s*tc\s*12345\b/i,
  /\bcity,\s*state\s*12345\b/i,
  /^\+?\(?555\)?[\s.-]?\d{3}[\s.-]?\d{4}$/,
  /^\(555\)\s*\d{3}-\d{4}$/,
  /@(peaksolutions|yourcompany|example|test)\.(com|org|net)$/i,
  /^(https?:\/\/)?(www\.)?(peaksolutions|yourcompany|example)\.(com|org|net)\/?$/i,
  /^(mountain service excellence|professional field services)$/i,
];

export function isDemoValue(value: string | undefined | null): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (DEMO_VALUES.has(trimmed.toLowerCase())) return true;
  return DEMO_PATTERNS.some(re => re.test(trimmed));
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
  /**
   * The tenant that OWNS the record being printed. Pass it whenever the record
   * carries one (cross-company "view all" mode shows records from tenants other
   * than the active one — without this the footer would print the wrong company).
   */
  ownerTenantId?: number | null,
) {
  const { loadActiveCompany } = await import('@/shared/company/activeCompany');
  const company = await loadActiveCompany(ownerTenantId ?? undefined);
  return resolvePdfCompany(override, company, logoBase64);
}

/** Read the owning tenant id off a record, whatever casing the API used. */
export function getRecordTenantId(record: unknown): number | undefined {
  if (!record || typeof record !== 'object') return undefined;
  const r = record as Record<string, unknown>;
  const raw = r.tenantId ?? r.TenantId ?? r.companyId ?? r.CompanyId;
  const n = typeof raw === 'string' ? Number(raw) : raw;
  return typeof n === 'number' && Number.isFinite(n) && n > 0 ? n : undefined;
}
