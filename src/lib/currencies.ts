/**
 * Full ISO 4217 currency list used by the global currency setting.
 * Every currency the admin can pick is here — the app will display it
 * everywhere via useCurrency() / getGlobalCurrencyCode().
 */
export interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
}

export const SUPPORTED_CURRENCIES: CurrencyOption[] = [
  // Default first
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' },

  // Major
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },

  // Middle East & North Africa
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'د.ك' },
  { code: 'BHD', name: 'Bahraini Dinar', symbol: '.د.ب' },
  { code: 'OMR', name: 'Omani Rial', symbol: '﷼' },
  { code: 'JOD', name: 'Jordanian Dinar', symbol: 'د.أ' },
  { code: 'LBP', name: 'Lebanese Pound', symbol: 'ل.ل' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'IRR', name: 'Iranian Rial', symbol: '﷼' },
  { code: 'IQD', name: 'Iraqi Dinar', symbol: 'ع.د' },
  { code: 'SYP', name: 'Syrian Pound', symbol: 'LS' },
  { code: 'YER', name: 'Yemeni Rial', symbol: '﷼' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'د.م.' },
  { code: 'DZD', name: 'Algerian Dinar', symbol: 'د.ج' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'LYD', name: 'Libyan Dinar', symbol: 'ل.د' },
  { code: 'SDG', name: 'Sudanese Pound', symbol: 'ج.س.' },
  { code: 'MRU', name: 'Mauritanian Ouguiya', symbol: 'UM' },
  { code: 'DJF', name: 'Djiboutian Franc', symbol: 'Fdj' },
  { code: 'SOS', name: 'Somali Shilling', symbol: 'Sh' },

  // Sub-Saharan Africa
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'GHS', name: 'Ghanaian Cedi', symbol: 'GH₵' },
  { code: 'UGX', name: 'Ugandan Shilling', symbol: 'USh' },
  { code: 'TZS', name: 'Tanzanian Shilling', symbol: 'TSh' },
  { code: 'RWF', name: 'Rwandan Franc', symbol: 'FRw' },
  { code: 'ETB', name: 'Ethiopian Birr', symbol: 'Br' },
  { code: 'XOF', name: 'West African CFA Franc', symbol: 'CFA' },
  { code: 'XAF', name: 'Central African CFA Franc', symbol: 'FCFA' },
  { code: 'CDF', name: 'Congolese Franc', symbol: 'FC' },
  { code: 'AOA', name: 'Angolan Kwanza', symbol: 'Kz' },
  { code: 'ZMW', name: 'Zambian Kwacha', symbol: 'ZK' },
  { code: 'MZN', name: 'Mozambican Metical', symbol: 'MT' },
  { code: 'BWP', name: 'Botswana Pula', symbol: 'P' },
  { code: 'NAD', name: 'Namibian Dollar', symbol: 'N$' },
  { code: 'MUR', name: 'Mauritian Rupee', symbol: '₨' },
  { code: 'MGA', name: 'Malagasy Ariary', symbol: 'Ar' },
  { code: 'MWK', name: 'Malawian Kwacha', symbol: 'MK' },
  { code: 'SCR', name: 'Seychellois Rupee', symbol: '₨' },
  { code: 'CVE', name: 'Cape Verdean Escudo', symbol: '$' },
  { code: 'GMD', name: 'Gambian Dalasi', symbol: 'D' },
  { code: 'GNF', name: 'Guinean Franc', symbol: 'FG' },
  { code: 'LRD', name: 'Liberian Dollar', symbol: 'L$' },
  { code: 'SLL', name: 'Sierra Leonean Leone', symbol: 'Le' },
  { code: 'SLE', name: 'Sierra Leonean Leone (new)', symbol: 'Le' },
  { code: 'ZWL', name: 'Zimbabwean Dollar', symbol: 'Z$' },
  { code: 'BIF', name: 'Burundian Franc', symbol: 'FBu' },
  { code: 'KMF', name: 'Comorian Franc', symbol: 'CF' },
  { code: 'ERN', name: 'Eritrean Nakfa', symbol: 'Nfk' },
  { code: 'LSL', name: 'Lesotho Loti', symbol: 'L' },
  { code: 'SZL', name: 'Swazi Lilangeni', symbol: 'E' },
  { code: 'STN', name: 'São Tomé & Príncipe Dobra', symbol: 'Db' },
  { code: 'SSP', name: 'South Sudanese Pound', symbol: '£' },

  // Europe
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'ISK', name: 'Icelandic Króna', symbol: 'kr' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'RSD', name: 'Serbian Dinar', symbol: 'дин' },
  { code: 'MKD', name: 'Macedonian Denar', symbol: 'ден' },
  { code: 'ALL', name: 'Albanian Lek', symbol: 'L' },
  { code: 'BAM', name: 'Bosnia-Herzegovina Mark', symbol: 'KM' },
  { code: 'MDL', name: 'Moldovan Leu', symbol: 'L' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'BYN', name: 'Belarusian Ruble', symbol: 'Br' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'GEL', name: 'Georgian Lari', symbol: '₾' },
  { code: 'AMD', name: 'Armenian Dram', symbol: '֏' },
  { code: 'AZN', name: 'Azerbaijani Manat', symbol: '₼' },
  { code: 'GIP', name: 'Gibraltar Pound', symbol: '£' },

  // Americas
  { code: 'MXN', name: 'Mexican Peso', symbol: 'MX$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: '$' },
  { code: 'CLP', name: 'Chilean Peso', symbol: '$' },
  { code: 'COP', name: 'Colombian Peso', symbol: '$' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/' },
  { code: 'UYU', name: 'Uruguayan Peso', symbol: '$U' },
  { code: 'PYG', name: 'Paraguayan Guarani', symbol: '₲' },
  { code: 'BOB', name: 'Bolivian Boliviano', symbol: 'Bs' },
  { code: 'VES', name: 'Venezuelan Bolívar', symbol: 'Bs' },
  { code: 'GTQ', name: 'Guatemalan Quetzal', symbol: 'Q' },
  { code: 'HNL', name: 'Honduran Lempira', symbol: 'L' },
  { code: 'NIO', name: 'Nicaraguan Córdoba', symbol: 'C$' },
  { code: 'CRC', name: 'Costa Rican Colón', symbol: '₡' },
  { code: 'PAB', name: 'Panamanian Balboa', symbol: 'B/.' },
  { code: 'DOP', name: 'Dominican Peso', symbol: 'RD$' },
  { code: 'CUP', name: 'Cuban Peso', symbol: '$' },
  { code: 'HTG', name: 'Haitian Gourde', symbol: 'G' },
  { code: 'JMD', name: 'Jamaican Dollar', symbol: 'J$' },
  { code: 'TTD', name: 'Trinidad & Tobago Dollar', symbol: 'TT$' },
  { code: 'BBD', name: 'Barbadian Dollar', symbol: 'Bds$' },
  { code: 'BSD', name: 'Bahamian Dollar', symbol: 'B$' },
  { code: 'BZD', name: 'Belize Dollar', symbol: 'BZ$' },
  { code: 'XCD', name: 'East Caribbean Dollar', symbol: 'EC$' },
  { code: 'SRD', name: 'Surinamese Dollar', symbol: '$' },
  { code: 'GYD', name: 'Guyanese Dollar', symbol: 'G$' },

  // Asia
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'LKR', name: 'Sri Lankan Rupee', symbol: '₨' },
  { code: 'NPR', name: 'Nepalese Rupee', symbol: '₨' },
  { code: 'BTN', name: 'Bhutanese Ngultrum', symbol: 'Nu.' },
  { code: 'MVR', name: 'Maldivian Rufiyaa', symbol: 'Rf' },
  { code: 'AFN', name: 'Afghan Afghani', symbol: '؋' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'KPW', name: 'North Korean Won', symbol: '₩' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'MOP', name: 'Macanese Pataca', symbol: 'MOP$' },
  { code: 'MNT', name: 'Mongolian Tögrög', symbol: '₮' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'LAK', name: 'Lao Kip', symbol: '₭' },
  { code: 'KHR', name: 'Cambodian Riel', symbol: '៛' },
  { code: 'MMK', name: 'Myanmar Kyat', symbol: 'K' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'BND', name: 'Brunei Dollar', symbol: 'B$' },
  { code: 'FJD', name: 'Fijian Dollar', symbol: 'FJ$' },
  { code: 'PGK', name: 'Papua New Guinean Kina', symbol: 'K' },
  { code: 'SBD', name: 'Solomon Islands Dollar', symbol: 'SI$' },
  { code: 'TOP', name: 'Tongan Paʻanga', symbol: 'T$' },
  { code: 'WST', name: 'Samoan Tala', symbol: 'WS$' },
  { code: 'VUV', name: 'Vanuatu Vatu', symbol: 'VT' },
  { code: 'KZT', name: 'Kazakhstani Tenge', symbol: '₸' },
  { code: 'UZS', name: 'Uzbekistani Som', symbol: 'so\'m' },
  { code: 'KGS', name: 'Kyrgyzstani Som', symbol: 'с' },
  { code: 'TJS', name: 'Tajikistani Somoni', symbol: 'SM' },
  { code: 'TMT', name: 'Turkmenistani Manat', symbol: 'T' },

  // Metals & special
  { code: 'XAU', name: 'Gold (troy ounce)', symbol: 'Au' },
  { code: 'XAG', name: 'Silver (troy ounce)', symbol: 'Ag' },
];

export const DEFAULT_CURRENCY_CODE = 'TND';

/** Guaranteed TND fallback option (used whenever lookup fails). */
export const DEFAULT_CURRENCY: CurrencyOption =
  SUPPORTED_CURRENCIES.find(c => c.code === DEFAULT_CURRENCY_CODE) ??
  { code: 'TND', name: 'Tunisian Dinar', symbol: 'د.ت' };

export function getCurrencyByCode(code?: string | null): CurrencyOption {
  try {
    if (!code) return DEFAULT_CURRENCY;
    const upper = String(code).toUpperCase();
    const match = SUPPORTED_CURRENCIES.find(c => c.code.toUpperCase() === upper);
    if (match) return match;
    if (!upper.trim()) return DEFAULT_CURRENCY;
    return { code: upper, name: upper, symbol: upper };
  } catch {
    return DEFAULT_CURRENCY;
  }
}

/**
 * Non-React accessor for services (aiDataService, workers, exporters, ...).
 * Mirrors the resolution order of useCurrency():
 *   1. preferences.currency (global, set by MainAdminUser)
 *   2. user_data.preferences.currency
 *   3. 'TND'
 */
export function getGlobalCurrencyCode(): string {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem('user-preferences') : null;
    if (raw) {
      const p = JSON.parse(raw);
      if (p?.currency) {
        const c = String(p.currency).trim().toUpperCase();
        if (c) return c;
      }
    }
    const ud = typeof localStorage !== 'undefined' ? localStorage.getItem('user_data') : null;
    if (ud) {
      const u = JSON.parse(ud);
      const prefs = typeof u?.preferences === 'string' ? JSON.parse(u.preferences) : u?.preferences;
      if (prefs?.currency) {
        const c = String(prefs.currency).trim().toUpperCase();
        if (c) return c;
      }
    }
  } catch {}
  return DEFAULT_CURRENCY_CODE;
}

/**
 * Shared helper: resolve a currency code with a guaranteed 'TND' fallback.
 * Any error, empty value, or missing preference falls back to DEFAULT_CURRENCY_CODE.
 */
export function resolveCurrencyCode(preferred?: string | null): string {
  try {
    const p = preferred == null ? '' : String(preferred).trim();
    if (p) return p.toUpperCase();
    const code = getGlobalCurrencyCode();
    if (code && code.trim()) return code.toUpperCase();
  } catch {}
  return DEFAULT_CURRENCY_CODE;
}
