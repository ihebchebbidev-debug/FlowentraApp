export interface UnitOption {
  value: string;
  labelEn: string;
  labelFr: string;
  allowDecimals: boolean;
}

export const UNIT_OPTIONS: UnitOption[] = [
  { value: 'piece', labelEn: 'Piece', labelFr: 'Pièce', allowDecimals: false },
  { value: 'kg', labelEn: 'Kg', labelFr: 'Kg', allowDecimals: true },
  { value: 'gram', labelEn: 'Gram', labelFr: 'Gramme', allowDecimals: true },
  { value: 'liter', labelEn: 'Liter', labelFr: 'Litre', allowDecimals: true },
  { value: 'ml', labelEn: 'mL', labelFr: 'mL', allowDecimals: true },
  { value: 'meter', labelEn: 'Meter', labelFr: 'Mètre', allowDecimals: true },
  { value: 'cm', labelEn: 'cm', labelFr: 'cm', allowDecimals: true },
  { value: 'm2', labelEn: 'm²', labelFr: 'm²', allowDecimals: true },
  { value: 'm3', labelEn: 'm³', labelFr: 'm³', allowDecimals: true },
  { value: 'hour', labelEn: 'Hour', labelFr: 'Heure', allowDecimals: true },
  { value: 'set', labelEn: 'Set', labelFr: 'Ensemble', allowDecimals: false },
  { value: 'roll', labelEn: 'Roll', labelFr: 'Rouleau', allowDecimals: false },
  { value: 'box', labelEn: 'Box', labelFr: 'Boîte', allowDecimals: false },
  { value: 'pack', labelEn: 'Pack', labelFr: 'Paquet', allowDecimals: false },
];

/**
 * Get the translated label for a unit value.
 * Uses the i18n translation function if available, falls back to built-in labels.
 */
export function getUnitLabel(unit: string, t?: (key: string) => string): string {
  const option = UNIT_OPTIONS.find(o => o.value === unit);
  if (!option) return unit;

  // Try translation key first
  if (t) {
    const translated = t(`units.${unit}`);
    // If translation returned the key itself, use built-in label
    if (translated && translated !== `units.${unit}`) {
      return translated;
    }
  }

  // Fallback to English label
  return option.labelEn;
}

/**
 * Returns true if the unit allows decimal quantities.
 */
export function isDecimalUnit(unit: string): boolean {
  const option = UNIT_OPTIONS.find(o => o.value === unit);
  return option?.allowDecimals ?? false;
}

/**
 * Returns the full array of unit options.
 */
export function getUnitOptions(): UnitOption[] {
  return UNIT_OPTIONS;
}
