import { useMemo } from 'react';
import type { SalaryInput } from '../types/hr.types';
import { calculateTunisianNetSalary, TUNISIAN_2025_DEFAULT_RATES, type TunisianTaxEngineRates } from '../utils/tunisianTaxEngine';

export function usePayrollCalculation(input: SalaryInput | null | undefined, rates?: TunisianTaxEngineRates) {
  return useMemo(() => {
    if (!input) return null;
    return calculateTunisianNetSalary(input, rates ?? TUNISIAN_2025_DEFAULT_RATES);
  }, [input, rates]);
}

