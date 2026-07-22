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
    // Disable hyphenation — react-pdf's default hyphenator butchers non-English
    // words. Callers can override per-document if needed.
    Font.registerHyphenationCallback((word) => [word]);
    registered = true;
  } catch (err) {
    // Never break the PDF pipeline if font fetch fails at register time.
    // eslint-disable-next-line no-console
    console.error('[pdf/fonts] Failed to register Unicode fonts:', err);
  }
}
