/**
 * React Project Export Engine
 * Generates a complete Vite + React + TypeScript project from site data.
 * 
 * Uses the same HTML renderer as the static export but wraps pages in
 * proper React components with embedded styles for pixel-perfect fidelity.
 * 
 * Features:
 * - Extracts data-URI images to public/assets/ (with deduplication)
 * - Applies image optimization settings (quality, resize, WebP conversion)
 * - Generates SEO meta tags per page
 * - Handles multi-language translation pages
 * - Generates client-side interactivity scripts
 * - Robust handling of edge cases (empty pages, missing props, special chars)
 */
import type { WebsiteSite, SitePage, SiteTheme } from '../../types';
import type { ExportedFile, ExportProgressCallback } from './types';
import { componentToHtml } from './blockToHtml';
import type { BlockHtmlContext } from './types';
import { generateThemeCss, generateScriptsJs } from './htmlExporter';
import { optimizeImage, formatBytes, DEFAULT_OPTIMIZATION_OPTIONS } from './imageOptimizer';
import type { ImageOptimizationOptions } from './imageOptimizer';
import { type HostingPlatform, getHostingPreset } from './hostingPresets';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

export interface ReactExportOptions {
  /** Image optimization settings */
  imageOptimization?: ImageOptimizationOptions;
  /** Target hosting platform (for config files) */
  platform?: HostingPlatform;
}

export interface ReactExportResult {
  files: ExportedFile[];
  stats: {
    pageCount: number;
    translationCount: number;
    imageCount: number;
    totalFiles: number;
    originalImageSize: number;
    optimizedImageSize: number;
  };
}

// ──────────────────────────────────────────────────
// Image extraction
// ──────────────────────────────────────────────────

/** Regex to match data-URI images */
const DATA_URI_REGEX = /data:image\/(png|jpe?g|gif|webp|svg\+xml|avif);base64,([A-Za-z0-9+/=]+)/g;

/** Shared state for image extraction across pages */
interface ImageExtractionState {
  uriToPath: Map<string, string>;
  assets: ExportedFile[];
  counter: number;
  totalOriginalSize: number;
  totalOptimizedSize: number;
}

/**
 * Extract data-URI images from an HTML string, returning modified HTML
 * and asset files placed in public/assets/.
 * Deduplicates identical images across all pages.
 */
async function extractDataUriImages(
  html: string,
  prefix: string,
  state: ImageExtractionState,
  optimizationOptions: ImageOptimizationOptions,
  onProgress?: ExportProgressCallback,
): Promise<string> {
  // Reset regex lastIndex for fresh matching
  const regex = new RegExp(DATA_URI_REGEX.source, 'g');
  const matches = [...html.matchAll(regex)];
  
  if (matches.length === 0) return html;
  
  let result = html;

  for (const match of matches) {
    const fullUri = match[0];
    const mimeType = match[1];
    const base64Data = match[2];

    // Skip if already extracted (dedup)
    let assetRelPath = state.uriToPath.get(fullUri);
    if (!assetRelPath) {
      state.counter++;
      try {
        const optimized = await optimizeImage(base64Data, mimeType, optimizationOptions);
        const fileName = `image-${state.counter}.${optimized.extension}`;
        assetRelPath = `/assets/${fileName}`;
        
        state.assets.push({ path: `${prefix}/public/assets/${fileName}`, content: optimized.content });
        state.uriToPath.set(fullUri, assetRelPath);
        
        state.totalOriginalSize += optimized.originalSize;
        state.totalOptimizedSize += optimized.optimizedSize;

        onProgress?.({
          phase: 'extracting-images',
          current: state.counter,
          total: 0, // unknown total
          message: `Extracted image-${state.counter}.${optimized.extension} (${formatBytes(optimized.optimizedSize)})`,
          imageCount: state.counter,
        });
      } catch (err) {
        console.warn(`[ReactExporter] Failed to extract image ${state.counter}:`, err);
        continue;
      }
    }

    // Replace all occurrences of this data URI
    result = result.split(fullUri).join(assetRelPath);
  }

  return result;
}

// ──────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────

export async function generateReactProject(
  site: WebsiteSite,
  onProgress?: ExportProgressCallback,
  options?: ReactExportOptions,
): Promise<ExportedFile[]> {
  const result = await generateReactProjectWithStats(site, onProgress, options);
  return result.files;
}

export async function generateReactProjectWithStats(
  site: WebsiteSite,
  onProgress?: ExportProgressCallback,
  options?: ReactExportOptions,
): Promise<ReactExportResult> {
  const files: ExportedFile[] = [];
  const prefix = sanitizeSlug(site.slug || 'my-website');
  const theme = site.theme || {} as SiteTheme;

  // Provide safe defaults for all theme properties
  const safeTheme: SiteTheme = {
    primaryColor: theme.primaryColor || '#3b82f6',
    secondaryColor: theme.secondaryColor || '#64748b',
    accentColor: theme.accentColor || '#f59e0b',
    backgroundColor: theme.backgroundColor || '#ffffff',
    textColor: theme.textColor || '#1e293b',
    headingFont: theme.headingFont || 'Inter, sans-serif',
    bodyFont: theme.bodyFont || 'Inter, sans-serif',
    borderRadius: theme.borderRadius ?? 8,
    spacing: theme.spacing ?? 16,
    direction: theme.direction,
    shadowStyle: theme.shadowStyle,
    buttonStyle: theme.buttonStyle,
    sectionPadding: theme.sectionPadding,
    fontScale: theme.fontScale,
    letterSpacing: theme.letterSpacing,
    linkStyle: theme.linkStyle,
    headingTransform: theme.headingTransform,
  };

  const pages = Array.isArray(site.pages) ? site.pages : [];
  
  // Count translations for progress tracking
  let translationCount = 0;
  for (const page of pages) {
    if (page.translations) {
      translationCount += Object.keys(page.translations).length;
    }
  }
  const totalPages = pages.length + translationCount;

  onProgress?.({ phase: 'generating', current: 1, total: totalPages + 4, message: 'Scaffolding project...' });

  // ── Scaffold files ──

  // package.json
  files.push({ path: `${prefix}/package.json`, content: JSON.stringify({
    name: prefix,
    private: true,
    version: '1.0.0',
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'tsc && vite build',
      preview: 'vite preview',
      lint: 'tsc --noEmit',
    },
    dependencies: {
      'react': '^18.3.1',
      'react-dom': '^18.3.1',
      'react-router-dom': '^6.26.2',
    },
    devDependencies: {
      '@types/react': '^18.3.0',
      '@types/react-dom': '^18.3.0',
      '@vitejs/plugin-react': '^4.3.0',
      'typescript': '^5.4.0',
      'vite': '^5.3.0',
    },
  }, null, 2) });

  // vite.config.ts — production-ready
  files.push({ path: `${prefix}/vite.config.ts`, content: [
    `import { defineConfig } from 'vite';`,
    `import react from '@vitejs/plugin-react';`,
    ``,
    `export default defineConfig({`,
    `  plugins: [react()],`,
    `  build: {`,
    `    outDir: 'dist',`,
    `    sourcemap: false,`,
    `    target: 'es2020',`,
    `    cssTarget: 'chrome80',`,
    `    minify: 'esbuild',`,
    `    cssMinify: true,`,
    `    assetsInlineLimit: 4096,`,
    `    chunkSizeWarningLimit: 600,`,
    `    rollupOptions: {`,
    `      output: {`,
    `        manualChunks: {`,
    `          vendor: ['react', 'react-dom'],`,
    `          router: ['react-router-dom'],`,
    `        },`,
    `        chunkFileNames: 'assets/js/[name]-[hash].js',`,
    `        entryFileNames: 'assets/js/[name]-[hash].js',`,
    `        assetFileNames: 'assets/[ext]/[name]-[hash][extname]',`,
    `      },`,
    `    },`,
    `  },`,
    `  server: {`,
    `    open: true,`,
    `    port: 3000,`,
    `  },`,
    `});`,
    ``,
  ].join('\n') });

  // tsconfig.json
  files.push({ path: `${prefix}/tsconfig.json`, content: JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      useDefineForClassFields: true,
      lib: ['ES2020', 'DOM', 'DOM.Iterable'],
      module: 'ESNext',
      skipLibCheck: true,
      moduleResolution: 'bundler',
      allowImportingTsExtensions: true,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: 'react-jsx',
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noFallthroughCasesInSwitch: true,
    },
    include: ['src'],
    references: [{ path: './tsconfig.node.json' }],
  }, null, 2) });

  // tsconfig.node.json — needed for vite.config.ts
  files.push({ path: `${prefix}/tsconfig.node.json`, content: JSON.stringify({
    compilerOptions: {
      composite: true,
      skipLibCheck: true,
      module: 'ESNext',
      moduleResolution: 'bundler',
      allowSyntheticDefaultImports: true,
    },
    include: ['vite.config.ts'],
  }, null, 2) });

  // .npmrc — avoid peer dependency issues
  files.push({ path: `${prefix}/.npmrc`, content: `legacy-peer-deps=true\n` });

  // .gitignore
  files.push({ path: `${prefix}/.gitignore`, content: [
    `node_modules`,
    `dist`,
    `.vite`,
    `*.local`,
    `.DS_Store`,
    ``,
  ].join('\n') });

  // index.html with Google Fonts & SEO
  const fonts = extractGoogleFontsUrl(safeTheme);
  const homePage = pages.find(p => p.isHomePage);
  const siteDescription = site.description || homePage?.seo?.description || '';
  
  files.push({ path: `${prefix}/index.html`, content: `<!DOCTYPE html>
<html lang="${site.defaultLanguage || 'en'}" dir="${safeTheme.direction || 'ltr'}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <title>${escapeHtml(site.name || 'My Website')}</title>
  ${siteDescription ? `<meta name="description" content="${escapeHtml(siteDescription)}" />` : ''}
  <meta name="theme-color" content="${safeTheme.primaryColor}" />
  ${site.favicon ? `<link rel="icon" href="${escapeHtml(site.favicon)}" />` : ''}
  ${fonts ? `<link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link href="${fonts}" rel="stylesheet" />` : ''}
  <script>
    // Apply saved theme before first paint to prevent flash
    (function(){var t=localStorage.getItem('theme');if(t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches))document.documentElement.classList.add('dark')})();
  </script>
</head>
<body>
  <noscript>You need to enable JavaScript to run this app.</noscript>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
` });

  // src/main.tsx
  files.push({ path: `${prefix}/src/main.tsx`, content: [
    `import React from 'react';`,
    `import ReactDOM from 'react-dom/client';`,
    `import App from './App';`,
    `import './reset.css';`,
    `import './styles.css';`,
    ``,
    `ReactDOM.createRoot(document.getElementById('root')!).render(`,
    `  <React.StrictMode>`,
    `    <App />`,
    `  </React.StrictMode>`,
    `);`,
    ``,
  ].join('\n') });

  // src/reset.css — modern CSS reset (separate for clarity)
  files.push({ path: `${prefix}/src/reset.css`, content: generateCssReset() });

  // src/styles.css — theme CSS with dark mode
  files.push({ path: `${prefix}/src/styles.css`, content: generateThemeCss(safeTheme) + '\n' + generateDarkModeCss(safeTheme) });

  // src/scripts.ts — client-side interactivity
  // Extract the function body from the IIFE, stripping the wrapper and comments reliably
  const scriptsJs = generateScriptsJs();
  const iifeBodyMatch = scriptsJs.match(/\(function\s*\(\)\s*\{\s*(?:'use strict';?\s*)?/);
  let scriptBody: string;
  if (iifeBodyMatch) {
    const startIdx = iifeBodyMatch.index! + iifeBodyMatch[0].length;
    // Find the matching closing `})();` at the end
    const endMatch = scriptsJs.lastIndexOf('})();');
    scriptBody = endMatch > startIdx
      ? scriptsJs.slice(startIdx, endMatch).trim()
      : scriptsJs.slice(startIdx).trim();
  } else {
    // Fallback: use the raw script content (shouldn't happen)
    scriptBody = scriptsJs;
  }
  files.push({ path: `${prefix}/src/scripts.ts`, content: [
    `// Auto-initialize interactive elements after each page render`,
    `export function initInteractivity(): void {`,
    scriptBody.split('\n').map(line => `  ${line}`).join('\n'),
    `}`,
    ``,
  ].join('\n') });

  // ── Build routes & pages ──

  const routes: Array<{ compName: string; path: string; page: SitePage }> = [];
  const translationRoutes: Array<{ compName: string; path: string }> = [];

  for (const page of pages) {
    const compName = pageComponentName(page);
    const routePath = page.isHomePage ? '/' : `/${page.slug || 'page'}`;
    routes.push({ compName, path: routePath, page });

    // Translation routes
    if (page.translations) {
      for (const langCode of Object.keys(page.translations)) {
        const langCompName = `${compName}${langCode.charAt(0).toUpperCase() + langCode.slice(1)}`;
        const langPath = page.isHomePage ? `/${langCode}` : `/${langCode}/${page.slug || 'page'}`;
        translationRoutes.push({ compName: langCompName, path: langPath });
      }
    }
  }

  const allRoutes = [...routes, ...translationRoutes];

  // Use React.lazy for route-level code splitting
  const lazyImports = allRoutes.map(r =>
    `const ${r.compName} = lazy(() => import('./pages/${r.compName}'));`
  ).join('\n');

  // Generate a loading fallback component
  files.push({ path: `${prefix}/src/components/PageLoader.tsx`, content: [
    `export default function PageLoader() {`,
    `  return (`,
    `    <div style={{`,
    `      display: 'flex',`,
    `      alignItems: 'center',`,
    `      justifyContent: 'center',`,
    `      minHeight: '60vh',`,
    `      fontFamily: 'var(--body-font, system-ui, sans-serif)',`,
    `      color: 'var(--text-color, #1e293b)',`,
    `      opacity: 0.6,`,
    `    }}>`,
    `      <div style={{ textAlign: 'center' }}>`,
    `        <div style={{`,
    `          width: 32,`,
    `          height: 32,`,
    `          border: '3px solid currentColor',`,
    `          borderTopColor: 'transparent',`,
    `          borderRadius: '50%',`,
    `          animation: 'spin 0.8s linear infinite',`,
    `          margin: '0 auto 12px',`,
    `        }} />`,
    `        <p style={{ fontSize: 14 }}>Loading…</p>`,
    `        <style>{\`@keyframes spin { to { transform: rotate(360deg) } }\`}</style>`,
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
  ].join('\n') });

  // Generate 404 Not Found page
  files.push({ path: `${prefix}/src/pages/NotFound.tsx`, content: [
    `import { useEffect } from 'react';`,
    `import { useLocation, Link } from 'react-router-dom';`,
    ``,
    `export default function NotFound() {`,
    `  const location = useLocation();`,
    ``,
    `  useEffect(() => {`,
    `    document.title = '404 — Page Not Found';`,
    `  }, []);`,
    ``,
    `  return (`,
    `    <div style={{`,
    `      display: 'flex',`,
    `      alignItems: 'center',`,
    `      justifyContent: 'center',`,
    `      minHeight: '100vh',`,
    `      fontFamily: 'var(--body-font, system-ui, sans-serif)',`,
    `      color: 'var(--text-color, #1e293b)',`,
    `      backgroundColor: 'var(--background-color, #ffffff)',`,
    `      padding: '24px',`,
    `    }}>`,
    `      <div style={{ textAlign: 'center', maxWidth: 520 }}>`,
    `        <p style={{`,
    `          fontSize: 'clamp(80px, 15vw, 160px)',`,
    `          fontWeight: 800,`,
    `          lineHeight: 1,`,
    `          fontFamily: 'var(--heading-font, system-ui, sans-serif)',`,
    `          background: 'linear-gradient(135deg, var(--primary-color, #3b82f6), var(--accent-color, #f59e0b))',`,
    `          WebkitBackgroundClip: 'text',`,
    `          WebkitTextFillColor: 'transparent',`,
    `          backgroundClip: 'text',`,
    `          margin: '0 0 8px',`,
    `        }}>404</p>`,
    `        <h1 style={{`,
    `          fontSize: 'clamp(20px, 4vw, 32px)',`,
    `          fontWeight: 700,`,
    `          fontFamily: 'var(--heading-font, system-ui, sans-serif)',`,
    `          margin: '0 0 12px',`,
    `        }}>Page not found</h1>`,
    `        <p style={{`,
    `          fontSize: 16,`,
    `          opacity: 0.6,`,
    `          lineHeight: 1.6,`,
    `          margin: '0 0 32px',`,
    `        }}>`,
    `          The page <code style={{`,
    `            background: 'var(--primary-color, #3b82f6)',`,
    `            color: '#fff',`,
    `            padding: '2px 8px',`,
    `            borderRadius: 'var(--border-radius, 6px)',`,
    `            fontSize: 14,`,
    `          }}>{location.pathname}</code> doesn't exist or has been moved.`,
    `        </p>`,
    `        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>`,
    `          <Link to="/" style={{`,
    `            display: 'inline-flex',`,
    `            alignItems: 'center',`,
    `            gap: 8,`,
    `            padding: '12px 28px',`,
    `            backgroundColor: 'var(--primary-color, #3b82f6)',`,
    `            color: '#ffffff',`,
    `            borderRadius: 'var(--border-radius, 8px)',`,
    `            fontWeight: 600,`,
    `            fontSize: 15,`,
    `            textDecoration: 'none',`,
    `            transition: 'transform 0.2s, box-shadow 0.2s',`,
    `          }}>`,
    `            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    `            Back to Home`,
    `          </Link>`,
    `          <button onClick={() => window.history.back()} style={{`,
    `            display: 'inline-flex',`,
    `            alignItems: 'center',`,
    `            gap: 8,`,
    `            padding: '12px 28px',`,
    `            backgroundColor: 'transparent',`,
    `            color: 'var(--primary-color, #3b82f6)',`,
    `            border: '2px solid var(--primary-color, #3b82f6)',`,
    `            borderRadius: 'var(--border-radius, 8px)',`,
    `            fontWeight: 600,`,
    `            fontSize: 15,`,
    `            cursor: 'pointer',`,
    `            transition: 'transform 0.2s, box-shadow 0.2s',`,
    `          }}>`,
    `            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>`,
    `            Go Back`,
    `          </button>`,
    `        </div>`,
    `      </div>`,
    `    </div>`,
    `  );`,
    `}`,
    ``,
  ].join('\n') });

  files.push({ path: `${prefix}/src/App.tsx`, content: [
    `import { lazy, Suspense } from 'react';`,
    `import { BrowserRouter, Routes, Route } from 'react-router-dom';`,
    `import { ThemeProvider } from './hooks/useTheme';`,
    `import ThemeToggle from './components/ThemeToggle';`,
    `import PageLoader from './components/PageLoader';`,
    `import NotFound from './pages/NotFound';`,
    ``,
    lazyImports,
    ``,
    `export default function App() {`,
    `  return (`,
    `    <ThemeProvider>`,
    `      <BrowserRouter>`,
    `        <ThemeToggle />`,
    `        <Suspense fallback={<PageLoader />}>`,
    `          <Routes>`,
    ...allRoutes.map(r => `            <Route path="${r.path}" element={<${r.compName} />} />`),
    `            <Route path="*" element={<NotFound />} />`,
    `          </Routes>`,
    `        </Suspense>`,
    `      </BrowserRouter>`,
    `    </ThemeProvider>`,
    `  );`,
    `}`,
    ``,
  ].join('\n') });

  // src/hooks/useTheme.tsx — theme context & hook
  files.push({ path: `${prefix}/src/hooks/useTheme.tsx`, content: generateUseThemeHook() });

  // src/components/ThemeToggle.tsx — toggle button
  files.push({ path: `${prefix}/src/components/ThemeToggle.tsx`, content: generateThemeToggleComponent(safeTheme) });

  onProgress?.({ phase: 'generating', current: 3, total: totalPages + 4, message: 'Generating pages...' });

  // ── Image extraction state (shared for dedup) ──
  const optimizationOptions = options?.imageOptimization || DEFAULT_OPTIMIZATION_OPTIONS;
  const imgState: ImageExtractionState = {
    uriToPath: new Map(),
    assets: [],
    counter: 0,
    totalOriginalSize: 0,
    totalOptimizedSize: 0,
  };

  // ── Generate page components ──
  let pageIdx = 0;
  for (const page of pages) {
    pageIdx++;
    const ctx: BlockHtmlContext = {
      theme: safeTheme,
      pages,
      currentPageSlug: page.slug || '',
      isHomePage: page.isHomePage,
    };
    
    const pageComponents = Array.isArray(page.components) ? page.components : [];
    let html: string;
    
    try {
      html = pageComponents.map(c => componentToHtml(c, ctx)).join('\n');
    } catch (err) {
      console.warn(`[ReactExporter] Failed to render page "${page.title}":`, err);
      html = `<div style="padding: 48px; text-align: center; color: #888;">Page could not be rendered.</div>`;
    }
    
    const compName = pageComponentName(page);

    onProgress?.({ phase: 'generating', current: 3 + pageIdx, total: totalPages + 4, message: `Processing ${page.title}...` });

    // Extract data-URI images
    html = await extractDataUriImages(html, prefix, imgState, optimizationOptions, onProgress);

    // Generate page component with SEO
    const seo = page.seo || {};
    const pageTitle = seo.title || page.title || site.name || '';
    const pageDesc = seo.description || '';
    
    files.push({
      path: `${prefix}/src/pages/${compName}.tsx`,
      content: generatePageComponent(compName, html, pageTitle, pageDesc),
    });

    // Translation pages
    if (page.translations) {
      for (const [langCode, translation] of Object.entries(page.translations)) {
        pageIdx++;
        const langCtx: BlockHtmlContext = {
          theme: safeTheme,
          pages,
          currentPageSlug: page.slug || '',
          language: langCode,
          isHomePage: page.isHomePage,
        };
        
        const translationComponents = Array.isArray(translation.components) ? translation.components : [];
        let langHtml: string;
        
        try {
          langHtml = translationComponents.map(c => componentToHtml(c, langCtx)).join('\n');
        } catch (err) {
          console.warn(`[ReactExporter] Failed to render translation "${page.title}" (${langCode}):`, err);
          langHtml = `<div style="padding: 48px; text-align: center; color: #888;">Translation could not be rendered.</div>`;
        }

        const langCompName = `${compName}${langCode.charAt(0).toUpperCase() + langCode.slice(1)}`;

        langHtml = await extractDataUriImages(langHtml, prefix, imgState, optimizationOptions, onProgress);
        
        const langSeo = { ...seo, ...translation.seo };
        const langTitle = langSeo.title || page.title || '';
        const langDesc = langSeo.description || '';
        
        files.push({
          path: `${prefix}/src/pages/${langCompName}.tsx`,
          content: generatePageComponent(langCompName, langHtml, langTitle, langDesc),
        });
      }
    }
  }

  // ── Add extracted image assets ──
  files.push(...imgState.assets);

  if (imgState.counter > 0) {
    const savingsInfo = imgState.totalOriginalSize !== imgState.totalOptimizedSize
      ? ` (${formatBytes(imgState.totalOriginalSize)} → ${formatBytes(imgState.totalOptimizedSize)})`
      : '';
    onProgress?.({
      phase: 'extracting-images',
      current: imgState.counter,
      total: imgState.counter,
      message: `Extracted ${imgState.counter} image${imgState.counter !== 1 ? 's' : ''} to public/assets/${savingsInfo}`,
      imageCount: imgState.counter,
    });
  }

  // ── Add hosting platform config files ──
  // Always include a basic SPA fallback even without a platform selected
  if (options?.platform) {
    const preset = getHostingPreset(options.platform);
    for (const configFile of preset.configFiles) {
      if (configFile.content || configFile.path === '.nojekyll') {
        files.push({
          path: `${prefix}/${configFile.path}`,
          content: configFile.content,
        });
      }
    }
  } else {
    // Generic: add a public/_redirects as a hint for common hosts
    files.push({
      path: `${prefix}/public/_redirects`,
      content: `# SPA fallback — uncomment for Netlify/Cloudflare Pages\n# /*    /index.html   200\n`,
    });
  }

  // ── Add README ──
  const platformName = options?.platform ? getHostingPreset(options.platform).name : null;
  const deploySection = options?.platform
    ? [
        `## Deploy to ${platformName}`,
        ``,
        ...getHostingPreset(options.platform).deploySteps.map((s, i) => `${i + 1}. ${s}`),
        ``,
      ]
    : [
        `## Deployment`,
        ``,
        `This is a single-page application (SPA). When deploying, configure your`,
        `hosting provider to serve \`index.html\` for all routes.`,
        ``,
        `**Netlify**: Add a \`netlify.toml\` or use the [\`_redirects\` file](https://docs.netlify.com/routing/redirects/)`,
        `**Vercel**: Add a \`vercel.json\` with [rewrites](https://vercel.com/docs/projects/project-configuration#rewrites)`,
        `**Cloudflare Pages**: Use a \`_redirects\` file in \`public/\``,
        ``,
      ];

  files.push({ path: `${prefix}/README.md`, content: [
    `# ${site.name || 'My Website'}`,
    ``,
    siteDescription ? `${siteDescription}\n` : '',
    `## Getting Started`,
    ``,
    `\`\`\`bash`,
    `npm install`,
    `npm run dev`,
    `\`\`\``,
    ``,
    `## Build for Production`,
    ``,
    `\`\`\`bash`,
    `npm run build`,
    `npm run preview  # test the production build locally`,
    `\`\`\``,
    ``,
    `The production output is in the \`dist/\` folder.`,
    ``,
    ...deploySection,
    `---`,
    ``,
    `Built with React, Vite, and TypeScript. Pages are lazy-loaded for optimal performance.`,
    ``,
  ].join('\n') });

  // ── Generate SEO files: sitemap.xml & robots.txt ──
  const siteUrl = site.publishedUrl
    ? site.publishedUrl.replace(/\/$/, '')
    : `https://${prefix}.example.com`; // placeholder — update after deploying

  const today = new Date().toISOString().split('T')[0];
  const sitemapUrls = allRoutes.map(r => {
    const priority = r.path === '/' ? '1.0' : '0.8';
    const freq = r.path === '/' ? 'weekly' : 'monthly';
    return [
      `  <url>`,
      `    <loc>${siteUrl}${r.path === '/' ? '' : r.path}</loc>`,
      `    <lastmod>${today}</lastmod>`,
      `    <changefreq>${freq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      `  </url>`,
    ].join('\n');
  }).join('\n');

  files.push({ path: `${prefix}/public/sitemap.xml`, content: [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    sitemapUrls,
    `</urlset>`,
    ``,
  ].join('\n') });

  files.push({ path: `${prefix}/public/robots.txt`, content: [
    `# robots.txt`,
    `User-agent: *`,
    `Allow: /`,
    ``,
    `# Sitemap`,
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ``,
    `# Disallow admin/API paths`,
    `Disallow: /api/`,
    ``,
  ].join('\n') });

  onProgress?.({ phase: 'generating', current: totalPages + 4, total: totalPages + 4, message: 'Done!' });

  return {
    files,
    stats: {
      pageCount: pages.length,
      translationCount,
      imageCount: imgState.counter,
      totalFiles: files.length,
      originalImageSize: imgState.totalOriginalSize,
      optimizedImageSize: imgState.totalOptimizedSize,
    },
  };
}

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

/**
 * Generate a React page component with SEO and interactivity.
 */
function generatePageComponent(
  compName: string,
  html: string,
  title: string,
  description: string,
): string {
  // Escape template literal special chars
  const escaped = html
    .replace(/\\/g, '\\\\')
    .replace(/`/g, '\\`')
    .replace(/\$\{/g, '\\${');

  const seoLines: string[] = [];
  if (title) {
    seoLines.push(`    document.title = \`${title.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`;`);
  }
  if (description) {
    seoLines.push(`    const metaDesc = document.querySelector('meta[name="description"]');`);
    seoLines.push(`    if (metaDesc) metaDesc.setAttribute('content', \`${description.replace(/`/g, '\\`').replace(/\$\{/g, '\\${')}\`);`);
  }

  return [
    `import { useEffect, useRef } from 'react';`,
    `import { initInteractivity } from '../scripts';`,
    ``,
    `export default function ${compName}() {`,
    `  const containerRef = useRef<HTMLDivElement>(null);`,
    ``,
    `  useEffect(() => {`,
    `    // Initialize interactive elements (FAQ accordion, tabs, mobile nav, etc.)`,
    `    initInteractivity();`,
    `    // Scroll to top on page load`,
    `    window.scrollTo(0, 0);`,
    ...(seoLines.length > 0 ? [`    // SEO`, ...seoLines] : []),
    `  }, []);`,
    ``,
    `  return (`,
    `    <div ref={containerRef} dangerouslySetInnerHTML={{ __html: \`${escaped}\` }} />`,
    `  );`,
    `}`,
    ``,
  ].join('\n');
}

/**
 * Convert a page to a valid React component name.
 * Handles special characters, numbers, and edge cases.
 */
function pageComponentName(page: SitePage): string {
  if (page.isHomePage) return 'HomePage';
  const slug = page.slug || page.title || 'page';
  
  // Convert slug to PascalCase, handling special chars
  const name = slug
    .replace(/[^a-zA-Z0-9-_]/g, '-') // Replace special chars with dash
    .split(/[-_]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
  
  // Ensure starts with letter
  const safeName = /^[A-Z]/.test(name) ? name : `Page${name}`;
  
  return `${safeName}Page`;
}

/**
 * Sanitize a slug for use as folder name.
 */
function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'my-website';
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Extract Google Fonts URL from theme font settings.
 */
function extractGoogleFontsUrl(theme: SiteTheme): string {
  const families = new Set<string>();
  const addFont = (s: string | undefined) => {
    if (!s) return;
    const name = s.split(',')[0].trim().replace(/'/g, '');
    if (name && !['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui'].includes(name.toLowerCase())) {
      families.add(name);
    }
  };
  addFont(theme.headingFont);
  addFont(theme.bodyFont);
  if (!families.size) return '';
  return `https://fonts.googleapis.com/css2?${Array.from(families).map(f => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`).join('&')}&display=swap`;
}

/**
 * Generate a comprehensive modern CSS reset.
 * Based on modern-normalize + best practices for cross-browser consistency.
 */
function generateCssReset(): string {
  return `/* ═══════════════════════════════════════════════════
   Modern CSS Reset — Cross-browser baseline
   ═══════════════════════════════════════════════════ */

/* Box sizing */
*, *::before, *::after { box-sizing: border-box; }

/* Remove default margins & padding */
* { margin: 0; padding: 0; }

/* Document */
html {
  -webkit-text-size-adjust: 100%;
  -moz-text-size-adjust: 100%;
  text-size-adjust: 100%;
  scroll-behavior: smooth;
  tab-size: 4;
  line-height: 1.15;
}

/* Body defaults */
body {
  min-height: 100vh;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
}

/* Media defaults */
img, picture, video, canvas, svg {
  display: block;
  max-width: 100%;
}

img, video { height: auto; }

/* Inherit fonts for form elements */
input, button, textarea, select {
  font: inherit;
  color: inherit;
}

/* Button reset */
button {
  cursor: pointer;
  background: none;
  border: none;
}

/* Anchor reset */
a {
  color: inherit;
  text-decoration: inherit;
}

/* Remove list styles */
ul, ol { list-style: none; }

/* Heading reset — sizes set by theme */
h1, h2, h3, h4, h5, h6 {
  font-size: inherit;
  font-weight: inherit;
}

/* Table reset */
table {
  border-collapse: collapse;
  border-spacing: 0;
}

/* Textarea resize */
textarea { resize: vertical; }

/* Remove search input styling */
input[type="search"]::-webkit-search-decoration,
input[type="search"]::-webkit-search-cancel-button {
  -webkit-appearance: none;
}

/* Focus visible */
:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* Prevent text overflow */
p, h1, h2, h3, h4, h5, h6 {
  overflow-wrap: break-word;
}

/* Root stacking context */
#root {
  isolation: isolate;
  min-height: 100vh;
}
`;
}

/**
 * Generate dark mode CSS variables derived from the light theme.
 */
function generateDarkModeCss(theme: SiteTheme): string {
  // Derive dark mode colors from the light theme
  const darken = (hex: string, amount: number) => {
    const r = Math.max(0, parseInt(hex.slice(1, 3), 16) - amount);
    const g = Math.max(0, parseInt(hex.slice(3, 5), 16) - amount);
    const b = Math.max(0, parseInt(hex.slice(5, 7), 16) - amount);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  };
  const lighten = (hex: string, amount: number) => {
    const r = Math.min(255, parseInt(hex.slice(1, 3), 16) + amount);
    const g = Math.min(255, parseInt(hex.slice(3, 5), 16) + amount);
    const b = Math.min(255, parseInt(hex.slice(5, 7), 16) + amount);
    return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
  };

  const bgColor = theme.backgroundColor || '#ffffff';
  const textColor = theme.textColor || '#1e293b';

  // If background is light, dark mode inverts; if already dark, adjust slightly
  const isLightBg = parseInt(bgColor.slice(1, 3), 16) > 128;
  const darkBg = isLightBg ? '#0f172a' : lighten(bgColor, 20);
  const darkText = isLightBg ? '#e2e8f0' : textColor;
  const darkSecondaryBg = isLightBg ? '#1e293b' : lighten(bgColor, 30);

  return `/* ── Dark Mode ── */
html.dark {
  --background-color: ${darkBg};
  --text-color: ${darkText};
  --secondary-bg: ${darkSecondaryBg};
  color-scheme: dark;
}

html.dark body {
  color: ${darkText};
  background-color: ${darkBg};
}

/* Dark mode card/section adjustments */
html.dark [style*="background-color: #fff"],
html.dark [style*="background-color: #ffffff"],
html.dark [style*="background-color: rgb(255, 255, 255)"],
html.dark [style*="background: #fff"],
html.dark [style*="background: #ffffff"] {
  background-color: ${darkSecondaryBg} !important;
}

html.dark [style*="color: #1"], html.dark [style*="color: #2"],
html.dark [style*="color: #0"] {
  color: ${darkText} !important;
}

html.dark [style*="border: 1px solid"] {
  border-color: rgba(255,255,255,0.1) !important;
}

html.dark [style*="box-shadow"] {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3), 0 2px 4px -1px rgba(0,0,0,0.2) !important;
}

/* Dark mode for specific white backgrounds */
html.dark section[style*="background-color: #f"],
html.dark section[style*="background: #f"],
html.dark div[style*="background-color: #f"] {
  background-color: ${darken(darkBg, -15)} !important;
}

/* Ensure primary/accent colors remain vibrant */
html.dark a[style*="background-color: var(--primary-color)"],
html.dark button[style*="background-color: var(--primary-color)"] {
  opacity: 0.95;
}
`;
}

/**
 * Generate the useTheme hook for the exported project.
 */
function generateUseThemeHook(): string {
  return `import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'system',
  resolvedTheme: 'light',
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('theme') as Theme) || 'system';
    }
    return 'system';
  });

  const [resolvedTheme, setResolved] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const root = document.documentElement;
    let effective: 'light' | 'dark';

    if (theme === 'system') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    } else {
      effective = theme;
    }

    root.classList.toggle('dark', effective === 'dark');
    setResolved(effective);
    localStorage.setItem('theme', theme);

    // Update meta theme-color
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', effective === 'dark' ? '#0f172a' : getComputedStyle(root).getPropertyValue('--primary-color').trim() || '#3b82f6');
    }
  }, [theme]);

  // Listen for system preference changes
  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      document.documentElement.classList.toggle('dark', e.matches);
      setResolved(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}
`;
}

/**
 * Generate the ThemeToggle component for the exported project.
 */
function generateThemeToggleComponent(theme: SiteTheme): string {
  return `import { useTheme } from '../hooks/useTheme';

export default function ThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme();

  const cycleTheme = () => {
    const order = ['light', 'dark', 'system'] as const;
    const idx = order.indexOf(theme);
    setTheme(order[(idx + 1) % order.length]);
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={\`Switch to \${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} mode\`}
      title={\`Theme: \${theme}\`}
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 9999,
        width: 44,
        height: 44,
        borderRadius: '50%',
        border: '1px solid ' + (resolvedTheme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'),
        backgroundColor: resolvedTheme === 'dark' ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
        backdropFilter: 'blur(8px)',
        color: resolvedTheme === 'dark' ? '#e2e8f0' : '#1e293b',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 10px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s, box-shadow 0.2s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.1)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
    >
      {resolvedTheme === 'dark' ? (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </svg>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      )}
    </button>
  );
}
`;
}
