import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Flowentra Android app.
 *
 * Strategy: the app loads the LIVE hosted site (server.url). This is the most
 * reliable wrapper for a multi-tenant SaaS — tenant subdomain detection, OAuth
 * redirects, the API, and the offline cache all behave exactly as they do in a
 * normal browser, with zero frontend rewrite.
 *
 * ▸ To target a specific company, point server.url at that tenant's subdomain,
 *   e.g. 'https://krossier.flowentra.app' or 'https://demo.flowentra.app'.
 * ▸ To ship a fully OFFLINE/bundled app instead, delete the `server.url` line,
 *   run `npm run build`, and Capacitor will load the local `dist/` build. (Note:
 *   in that mode the in-app tenant must be chosen in the UI, since there is no
 *   hostname to derive it from — see notes in chat.)
 */
const config: CapacitorConfig = {
  appId: 'app.flowentra.mobile',
  appName: 'Flowentra',
  webDir: 'dist',
  server: {
    // CHANGE this to the tenant/host you want the APK to open.
    url: 'https://demo.flowentra.app',
    androidScheme: 'https',
    cleartext: false,
    // Keep these navigations inside the app's webview (so login redirects work).
    allowNavigation: [
      '*.flowentra.app',
      'flowentra.app',
      'api.flowentra.app',
      '*.demo.dev',
      'demo.dev',
    ],
  },
  android: {
    // Allow mixed content only in debug if you ever test against http dev hosts.
    allowMixedContent: false,
  },
};

export default config;
