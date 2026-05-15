import type { IRPPBracketDetail, SalaryBreakdown, SalaryInput } from '../types/hr.types';

export type TunisianTaxEngineRates = {
  cnssRate: number; // default: 0.0918 (Tunisia RSNA employee share, aligned with backend HrService)
  cssRate: number; // default: 0.01
  brackets: Array<{ from: number; to: number | null; rate: number }>;
  abattement: {
    headOfFamily: number; // default 150
    perChild: number; // default 100
  };
};

export const TUNISIAN_2025_DEFAULT_RATES: TunisianTaxEngineRates = {
  cnssRate: 0.0918,
  cssRate: 0.01,
  abattement: { headOfFamily: 150, perChild: 100 },
  brackets: [
    { from: 0, to: 416.67, rate: 0 },
    { from: 416.67, to: 833.33, rate: 0.15 },
    { from: 833.33, to: 1666.67, rate: 0.25 },
    { from: 1666.67, to: 2500.0, rate: 0.3 },
    { from: 2500.0, to: 3333.33, rate: 0.33 },
    { from: 3333.33, to: 4166.67, rate: 0.36 },
    { from: 4166.67, to: 5833.33, rate: 0.38 },
    { from: 5833.33, to: null, rate: 0.4 },
  ],
};

const clampNonNegative = (n: number) => (Number.isFinite(n) ? Math.max(0, n) : 0);

/**
 * Pure calculation engine (no dependencies).
 * Notes:
 * - Uses progressive taxation (per bracket portion).
 * - Rounding is left to UI/backend; returns raw numbers as JS floats.
 */
export function calculateTunisianNetSalary(
  input: SalaryInput,
  rates: TunisianTaxEngineRates = TUNISIAN_2025_DEFAULT_RATES
): SalaryBreakdown {
  const grossSalary = clampNonNegative(input.grossSalary);
  const childrenCount = clampNonNegative(input.childrenCount);
  const isHeadOfFamily = Boolean(input.isHeadOfFamily);

  // Step 1 — CNSS
  const cnss = grossSalary * rates.cnssRate;

  // Step 2 — Taxable Gross
  const taxableGross = grossSalary - cnss;

  // Step 3 — Abattement
  const headOfFamilyAb = isHeadOfFamily ? rates.abattement.headOfFamily : 0;
  const childrenAb = childrenCount * rates.abattement.perChild;
  const abattement = headOfFamilyAb + childrenAb;

  // Step 4 — Taxable Base
  const taxableBase = Math.max(0, taxableGross - abattement);

  // Step 5 — IRPP (progressive)
  const irppBrackets: IRPPBracketDetail[] = [];
  let remaining = taxableBase;
  let irpp = 0;

  for (const b of rates.brackets) {
    if (remaining <= 0) break;
    const from = b.from;
    const to = b.to ?? Number.POSITIVE_INFINITY;
    const bracketSpan = Math.max(0, to - from);

    // Taxable in bracket is the overlap of taxableBase with [from,to)
    const taxableInBracket = clampNonNegative(Math.min(Math.max(taxableBase - from, 0), bracketSpan));
    if (taxableInBracket <= 0) continue;

    const taxAmount = taxableInBracket * b.rate;
    irpp += taxAmount;
    remaining -= taxableInBracket;

    irppBrackets.push({
      from,
      to: b.to ?? Number.POSITIVE_INFINITY,
      rate: b.rate,
      taxableInBracket,
      taxAmount,
    });
  }

  // Step 6 — CSS
  const css = taxableGross * rates.cssRate;

  // Step 7 — Net
  const netSalary = grossSalary - cnss - irpp - css;

  return {
    grossSalary,
    cnss,
    cnssRate: rates.cnssRate,
    taxableGross,
    abattement,
    abattementDetail: { headOfFamily: headOfFamilyAb, children: childrenAb },
    taxableBase,
    irpp,
    irppBrackets,
    css,
    cssRate: rates.cssRate,
    netSalary,
  };
}

