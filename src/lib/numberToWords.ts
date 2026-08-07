/**
 * Convert a number to words in English or French, with currency support.
 * Supports TND (dinars/millimes), EUR (euros/centimes), USD (dollars/cents), GBP (pounds/pence).
 */

const EN_ONES = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
  'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

const FR_ONES = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf',
  'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
const FR_TENS = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];

interface CurrencyNames {
  main: [string, string]; // [singular, plural]
  sub: [string, string];  // [singular, plural]
  subDecimals: number;     // 3 for millimes, 2 for cents
}

const CURRENCIES: Record<string, Record<string, CurrencyNames>> = {
  en: {
    TND: { main: ['dinar', 'dinars'], sub: ['millime', 'millimes'], subDecimals: 3 },
    EUR: { main: ['euro', 'euros'], sub: ['cent', 'cents'], subDecimals: 2 },
    USD: { main: ['dollar', 'dollars'], sub: ['cent', 'cents'], subDecimals: 2 },
    GBP: { main: ['pound', 'pounds'], sub: ['penny', 'pence'], subDecimals: 2 },
  },
  fr: {
    TND: { main: ['dinar', 'dinars'], sub: ['millime', 'millimes'], subDecimals: 3 },
    EUR: { main: ['euro', 'euros'], sub: ['centime', 'centimes'], subDecimals: 2 },
    USD: { main: ['dollar', 'dollars'], sub: ['cent', 'cents'], subDecimals: 2 },
    GBP: { main: ['livre', 'livres'], sub: ['penny', 'pence'], subDecimals: 2 },
  },
};

function chunkToWordsEN(n: number): string {
  if (n === 0) return '';
  if (n < 20) return EN_ONES[n];
  if (n < 100) {
    const t = EN_TENS[Math.floor(n / 10)];
    const o = EN_ONES[n % 10];
    return o ? `${t}-${o}` : t;
  }
  const h = EN_ONES[Math.floor(n / 100)];
  const rest = n % 100;
  if (rest === 0) return `${h} hundred`;
  return `${h} hundred ${chunkToWordsEN(rest)}`;
}

function chunkToWordsFR(n: number): string {
  if (n === 0) return '';
  if (n < 20) return FR_ONES[n];
  if (n < 100) {
    const tensIdx = Math.floor(n / 10);
    const onesIdx = n % 10;
    // French special: 70-79 = soixante-dix..., 90-99 = quatre-vingt-dix...
    if (tensIdx === 7) {
      return `soixante-${FR_ONES[10 + onesIdx]}`;
    }
    if (tensIdx === 9) {
      return `quatre-vingt-${FR_ONES[10 + onesIdx]}`;
    }
    if (onesIdx === 0) {
      return tensIdx === 8 ? 'quatre-vingts' : FR_TENS[tensIdx];
    }
    if (onesIdx === 1 && (tensIdx === 2 || tensIdx === 3 || tensIdx === 4 || tensIdx === 5 || tensIdx === 6)) {
      return `${FR_TENS[tensIdx]} et un`;
    }
    return `${FR_TENS[tensIdx]}-${FR_ONES[onesIdx]}`;
  }
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  let prefix = '';
  if (hundreds === 1) {
    prefix = 'cent';
  } else if (rest === 0) {
    prefix = `${FR_ONES[hundreds]} cents`;
  } else {
    prefix = `${FR_ONES[hundreds]} cent`;
  }
  if (rest === 0) return prefix;
  return `${prefix} ${chunkToWordsFR(rest)}`;
}

function intToWords(n: number, lang: string): string {
  if (n === 0) return lang === 'fr' ? 'zéro' : 'zero';
  
  const chunkFn = lang === 'fr' ? chunkToWordsFR : chunkToWordsEN;
  const scales = lang === 'fr'
    ? ['', 'mille', 'million', 'milliard']
    : ['', 'thousand', 'million', 'billion'];
  const pluralScales = lang === 'fr'
    ? ['', 'mille', 'millions', 'milliards']
    : ['', 'thousand', 'million', 'billion'];

  const chunks: number[] = [];
  let remaining = Math.abs(n);
  while (remaining > 0) {
    chunks.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const parts: string[] = [];
  for (let i = chunks.length - 1; i >= 0; i--) {
    if (chunks[i] === 0) continue;
    const words = chunkFn(chunks[i]);
    const scale = chunks[i] > 1 ? pluralScales[i] : scales[i];
    
    // French: "mille" not "un mille"
    if (lang === 'fr' && i === 1 && chunks[i] === 1) {
      parts.push('mille');
    } else if (scale) {
      parts.push(`${words} ${scale}`);
    } else {
      parts.push(words);
    }
  }

  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

/**
 * Convert amount to words with currency.
 * @param amount - The numeric amount (e.g., 1234.500)
 * @param currencyCode - 'TND', 'EUR', 'USD', 'GBP'
 * @param lang - 'en' or 'fr'
 * @returns e.g., "one thousand two hundred thirty-four dinars and five hundred millimes"
 */
export function numberToWords(amount: number, currencyCode: string = 'TND', lang: string = 'en'): string {
  const normalizedLang = lang && typeof lang === 'string' && lang.startsWith('fr') ? 'fr' : 'en';
  const currency = CURRENCIES[normalizedLang]?.[currencyCode] || CURRENCIES[normalizedLang]?.TND || CURRENCIES.en.TND;

  const isNegative = amount < 0;

  // Work in integer minor units to avoid floating point rounding issues
  const factor = Math.pow(10, currency.subDecimals);
  const totalMinor = Math.round(Math.abs(amount) * factor);

  const mainPart = Math.floor(totalMinor / factor);
  const subPart = totalMinor % factor;

  const mainWords = intToWords(mainPart, normalizedLang);
  const mainUnit = mainPart === 1 ? currency.main[0] : currency.main[1];

  const connector = normalizedLang === 'fr' ? 'et' : 'and';

  // Handle zero amount explicitly
  if (mainPart === 0 && subPart === 0) {
    const zeroWord = normalizedLang === 'fr' ? 'zéro' : 'zero';
    return `${isNegative ? (normalizedLang === 'fr' ? 'moins ' : 'minus ') : ''}${zeroWord} ${mainUnit}`;
  }

  if (subPart === 0) {
    return `${isNegative ? (normalizedLang === 'fr' ? 'moins ' : 'minus ') : ''}${mainWords} ${mainUnit}`;
  }

  const subWords = intToWords(subPart, normalizedLang);
  const subUnit = subPart === 1 ? currency.sub[0] : currency.sub[1];

  return `${isNegative ? (normalizedLang === 'fr' ? 'moins ' : 'minus ') : ''}${mainWords} ${mainUnit} ${connector} ${subWords} ${subUnit}`;
}
