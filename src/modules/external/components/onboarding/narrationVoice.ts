// Pick the best-sounding FEMALE Web Speech voice for a given language.
// Priority: named female premium voices > generic female-labelled > any premium.
// Male voices are penalised so the picker never falls back to them when a
// female voice of any quality exists.

const PREMIUM_HINTS = [
  'natural', 'neural', 'premium', 'enhanced', 'wavenet',
  'google', 'microsoft',
];

// Known female voice names (EN)
const FEMALE_NAMES_EN = [
  'jenny', 'aria', 'ava', 'samantha', 'serena', 'evelyn',
  'libby', 'sonia', 'natasha', 'zira', 'karen', 'hazel',
  'moira', 'fiona', 'tessa', 'alice', 'lisa', 'emma',
  'emily', 'victoria', 'heather', 'cortana', 'elsa',
];

// Known female voice names (FR)
const FEMALE_NAMES_FR = [
  'denise', 'brigitte', 'celeste', 'audrey', 'amelie', 'amélie',
  'elise', 'julie', 'claire', 'lucie', 'camille',
];

// Known male voice names — these receive a penalty
const MALE_NAMES_EN = [
  'guy', 'ryan', 'david', 'mark', 'james', 'daniel',
  'fred', 'george', 'paul', 'reed', 'liam',
];
const MALE_NAMES_FR = [
  'henri', 'thomas', 'rémy', 'remy', 'nicolas', 'pierre', 'xavier',
];

const BAD_HINTS = ['espeak', 'compact', 'novelty', 'whisper', 'organ', 'cellos'];

function scoreVoice(v: SpeechSynthesisVoice, lang: 'en' | 'fr'): number {
  const name = v.name.toLowerCase();
  const voiceLang = v.lang.toLowerCase();
  if (!voiceLang.startsWith(lang)) return -Infinity;

  let score = 0;

  // Explicitly labelled female/male (e.g. "Google UK English Female")
  if (name.includes('female')) score += 20;
  if (name.includes(' male') && !name.includes('female')) score -= 25;

  // Premium quality hints
  PREMIUM_HINTS.forEach((h) => { if (name.includes(h)) score += 10; });

  // Female name bonuses
  const femaleNames = lang === 'fr' ? FEMALE_NAMES_FR : FEMALE_NAMES_EN;
  femaleNames.forEach((h) => { if (name.includes(h)) score += 8; });

  // Male name penalties
  const maleNames = lang === 'fr' ? MALE_NAMES_FR : MALE_NAMES_EN;
  maleNames.forEach((h) => { if (name.includes(h)) score -= 12; });

  // Quality penalties
  BAD_HINTS.forEach((h) => { if (name.includes(h)) score -= 15; });

  // Prefer non-local (cloud) Google/Microsoft voices
  if (!v.localService && (name.includes('google') || name.includes('microsoft'))) score += 4;
  // Prefer region-tagged voices (en-US, fr-FR) over generic 'en' / 'fr'
  if (voiceLang.length >= 5) score += 1;

  return score;
}

export function pickBestVoice(lang: 'en' | 'fr'): SpeechSynthesisVoice | null {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  let best: SpeechSynthesisVoice | null = null;
  let bestScore = -Infinity;
  for (const v of voices) {
    const s = scoreVoice(v, lang);
    if (s > bestScore) { bestScore = s; best = v; }
  }
  return bestScore > -Infinity ? best : null;
}

// Split a caption into natural utterance chunks so the engine breathes
// between sentences instead of running the whole paragraph together.
export function splitForSpeech(text: string): string[] {
  return text
    .replace(/…|\.{3}/g, '. ')
    .replace(/([:;—])\s+/g, '$1. ')
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function languageTagFor(i18nLang: string): { code: 'en' | 'fr'; bcp47: string } {
  const isFr = (i18nLang || 'en').toLowerCase().startsWith('fr');
  return { code: isFr ? 'fr' : 'en', bcp47: isFr ? 'fr-FR' : 'en-US' };
}
