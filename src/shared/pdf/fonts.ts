/**
 * Unicode font registration for @react-pdf/renderer.
 *
 * Built-in Helvetica / Times-Roman only cover Latin-1. Registering Noto Sans
 * gives us extended-Latin coverage (accented characters used in French, German,
 * Portuguese, Turkish, etc.) and a stable fallback for previews.
 *
 * RTL note: react-pdf does not currently do bidirectional text shaping, so
 * Arabic/Hebrew characters render left-to-right without joining. If full RTL
 * support is required, an alternate renderer (server-side, e.g. Puppeteer) is
 * the pragmatic path — Noto Sans Arabic can be registered below, but glyph
 * joining will still be missing.
 */
import { Font } from '@react-pdf/renderer';

export const UNICODE_FONT_FAMILY = 'NotoSans';

let registered = false;

export function registerUnicodeFonts(): void {
  if (registered) return;
  // Hyphenation is registered first and outside the try: react-pdf's default
  // hyphenator butchers non-English words, and it must stay disabled even if
  // the font registration below throws.
  try {
    Font.registerHyphenationCallback((word) => [word]);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn('[pdf/fonts] Could not disable hyphenation:', err);
  }

  try {
    Font.register({
      family: UNICODE_FONT_FAMILY,
      fonts: [
        {
          src: 'https://fonts.gstatic.com/s/notosans/v27/o-0IIpQlx3QUlC5A4PNr5TRA.ttf',
          fontWeight: 400,
        },
        {
          src: 'https://fonts.gstatic.com/s/notosans/v27/o-0NIpQlx3QUlC5A4PNjXhFVadyBx2pqPIif.ttf',
          fontWeight: 700,
        },
      ],
    });
    registered = true;
  } catch (err) {
    // Never break the PDF pipeline if font fetch fails at register time.
    // NOTE: these are fetched from the Google Fonts CDN at first render. On a
    // network failure react-pdf silently falls back to Helvetica, which mangles
    // accented text. Self-hosting these two weights is the durable fix.
    // eslint-disable-next-line no-console
    console.error('[pdf/fonts] Failed to register Unicode fonts:', err);
  }
}
