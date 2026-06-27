// Pick the best-sounding FEMALE Web Speech voice for a given language.
// Priority: top-tier named female voices > generic female-labelled > any premium.
// Male voices are penalised so the picker never falls back to them when a
// female voice of any quality exists.

const PREMIUM_HINTS = [
  'natural', 'neural', 'premium', 'enhanced', 'wavenet',
  'google', 'microsoft',
];

// Top-tier voices — highest clarity & naturalness across platforms.
// Samantha = macOS default female (very clear), Jenny/Aria = Windows Neural,
// Google US English Female = Chrome cloud voice, Denise = Microsoft FR Neural.
const TOP_TIER_EN = ['samantha', 'jenny', 'aria', 'ava'];
const TOP_TIER_FR = ['denise', 'amélie', 'amelie', 'claire'];

// Other known female voice names (EN)
const FEMALE_NAMES_EN = [
  'serena', 'evelyn', 'libby', 'sonia', 'natasha', 'zira',
  'karen', 'hazel', 'moira', 'fiona', 'tessa', 'alice',
  'lisa', 'emma', 'emily', 'victoria', 'heather', 'elsa',
  'cortana', 'nova', 'alloy', 'shimmer',
];

// Other known female voice names (FR)
const FEMALE_NAMES_FR = [
  'brigitte', 'celeste', 'audrey', 'elise', 'julie', 'lucie', 'camille',
  'léa', 'lea', 'marie', 'sophie',
];

// Known male voice names — these receive a penalty
const MALE_NAMES_EN = [
  'guy', 'ryan', 'david', 'mark', 'james', 'daniel',
  'fred', 'george', 'paul', 'reed', 'liam', 'echo', 'onyx', 'fable',
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

  // Top-tier voices get a strong bonus — these are the clearest on their platform
  const topTier = lang === 'fr' ? TOP_TIER_FR : TOP_TIER_EN;
  topTier.forEach((h) => { if (name.includes(h)) score += 30; });

  // Premium quality hints
  PREMIUM_HINTS.forEach((h) => { if (name.includes(h)) score += 10; });

  // Other female name bonuses
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

// Configure an utterance with settings tuned for a clear female voice.
// rate=0.88 is unhurried; pitch=1.1 reliably sits in the female register.
export function configureUtteranceForFemaleVoice(
  u: SpeechSynthesisUtterance,
  voice: SpeechSynthesisVoice | null,
): void {
  if (voice) u.voice = voice;
  u.rate = 0.88;
  u.pitch = 1.1;
  u.volume = 1;
}

// Split a caption into natural utterance chunks so the engine breathes
// between sentences instead of running the whole paragraph together.
export function splitForSpeech(text: string): string[] {
  return text
    .replace(/\u2019/g, "'")     // normalize curly apostrophe → straight
    .replace(/…|\.{3}/g, ‘. ‘)        // ellipses → sentence boundary
    .replace(/([:;—])\s+/g, ‘. ‘)     // colons / semicolons / em-dashes → pause
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-Ý])/u)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function languageTagFor(i18nLang: string): { code: 'en' | 'fr'; bcp47: string } {
  const isFr = (i18nLang || 'en').toLowerCase().startsWith('fr');
  return { code: isFr ? 'fr' : 'en', bcp47: isFr ? 'fr-FR' : 'en-US' };
}
