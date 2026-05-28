// Pick the best-sounding installed Web Speech voice for a given language.
// Prefers premium Google / Microsoft Natural / Neural / Apple Enhanced voices
// over basic eSpeak / Compact voices that ship with most OSes.

const PREMIUM_HINTS = [
  'natural', 'neural', 'premium', 'enhanced', 'wavenet',
  'google', 'microsoft',
];

const FRIENDLY_NAME_BONUS_EN = [
  'jenny', 'aria', 'guy', 'ava', 'samantha', 'serena', 'evelyn',
  'libby', 'sonia', 'ryan', 'natasha',
];
const FRIENDLY_NAME_BONUS_FR = [
  'denise', 'henri', 'brigitte', 'celeste', 'thomas', 'audrey',
  'amelie', 'amélie', 'rémy', 'remy',
];

const BAD_HINTS = ['espeak', 'compact', 'novelty', 'whisper', 'organ', 'cellos'];

function scoreVoice(v: SpeechSynthesisVoice, lang: 'en' | 'fr'): number {
  const name = v.name.toLowerCase();
  const voiceLang = v.lang.toLowerCase();
  if (!voiceLang.startsWith(lang)) return -Infinity;

  let score = 0;
  PREMIUM_HINTS.forEach((h) => { if (name.includes(h)) score += 10; });
  const friendly = lang === 'fr' ? FRIENDLY_NAME_BONUS_FR : FRIENDLY_NAME_BONUS_EN;
  friendly.forEach((h) => { if (name.includes(h)) score += 6; });
  BAD_HINTS.forEach((h) => { if (name.includes(h)) score -= 15; });

  // Prefer non-local (cloud) Google/Microsoft voices — they're the high-quality ones.
  if (!v.localService && (name.includes('google') || name.includes('microsoft'))) score += 4;
  // Prefer region-tagged voices (en-US, fr-FR) over generic 'en' / 'fr'.
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
    // turn ellipses into a sentence boundary
    .replace(/\u2026|\.{3}/g, '. ')
    // add a soft pause after colons / semicolons / em-dashes
    .replace(/([:;\u2014])\s+/g, '$1. ')
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function languageTagFor(i18nLang: string): { code: 'en' | 'fr'; bcp47: string } {
  const isFr = (i18nLang || 'en').toLowerCase().startsWith('fr');
  return { code: isFr ? 'fr' : 'en', bcp47: isFr ? 'fr-FR' : 'en-US' };
}
