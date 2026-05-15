/**
 * HTML Export Engine
 *
 * Converts a full WebsiteSite into a collection of static HTML files,
 * a unified CSS stylesheet, and a small vanilla JS file for interactivity.
 * 
 * Features:
 * - Generates production-ready HTML/CSS/JS
 * - Extracts embedded data-URI images to separate asset files
 * - Provides real-time progress updates during export
 */
import type { WebsiteSite, SitePage, SiteTheme } from '../../types';
import type { ExportedFile, BlockHtmlContext, ExportProgressCallback } from './types';
import { componentToHtml } from './blockToHtml';
import { extractImageAssets, type ImageExtractionOptions } from './imageAssetExtractor';
import type { ImageOptimizationOptions } from './imageOptimizer';
import { type HostingPlatform, getHostingPreset } from './hostingPresets';

// ──────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────

export interface HtmlExportResult {
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

export interface HtmlExportOptions {
  /** Form action URL for contact forms */
  formActionUrl?: string;
  /** Target hosting platform */
  platform?: HostingPlatform;
  /** Image optimization settings */
  imageOptimization?: ImageOptimizationOptions;
}

// ──────────────────────────────────────────────────
// Main entry point
// ──────────────────────────────────────────────────

/**
 * Generate a complete static HTML website from a site definition.
 * Returns files ready to be zipped and downloaded.
 */
export async function generateSiteHtml(
  site: WebsiteSite,
  onProgress?: ExportProgressCallback,
  options?: HtmlExportOptions,
): Promise<ExportedFile[]> {
  const result = await generateSiteHtmlWithStats(site, onProgress, options);
  return result.files;
}

/**
 * Generate HTML with detailed statistics (for progress display).
 */
export async function generateSiteHtmlWithStats(
  site: WebsiteSite,
  onProgress?: ExportProgressCallback,
  options?: HtmlExportOptions,
): Promise<HtmlExportResult> {
  const rawFiles: ExportedFile[] = [];
  const { theme, pages } = site;

  // Count total pages including translations for accurate progress
  let translationCount = 0;
  for (const page of pages) {
    if (page.translations) {
      translationCount += Object.keys(page.translations).length;
    }
  }
  const totalPages = pages.length + translationCount;
  let currentPage = 0;

  // 1. Generate global CSS
  rawFiles.push({ path: 'styles.css', content: generateThemeCss(theme) });

  // 2. Generate global JS
  rawFiles.push({ path: 'scripts.js', content: generateScriptsJs() });

  // 3. Generate each page
  pages.forEach((page) => {
    currentPage++;
    onProgress?.({
      phase: 'generating',
      current: currentPage,
      total: totalPages,
      message: `Generating page: ${page.title}...`,
    });

    const ctx: BlockHtmlContext = {
      theme,
      pages,
      currentPageSlug: page.slug,
      formActionUrl: options?.formActionUrl,
      isHomePage: page.isHomePage,
    };

    const isHome = page.isHomePage;
    const cssPath = isHome ? 'styles.css' : '../styles.css';
    const jsPath = isHome ? 'scripts.js' : '../scripts.js';

    const pageComponents = Array.isArray(page.components) ? page.components : [];
    const componentsHtml = pageComponents
      .map((c) => componentToHtml(c, ctx))
      .join('\n');

    const html = generatePageHtml(site, page, componentsHtml, cssPath, jsPath);
    const filePath = isHome ? 'index.html' : `${page.slug}/index.html`;
    rawFiles.push({ path: filePath, content: html });
  });

  // 4. Multi-language pages (if translations exist)
  for (const page of pages) {
    if (!page.translations) continue;
    for (const [langCode, translation] of Object.entries(page.translations)) {
      currentPage++;
      onProgress?.({
        phase: 'generating',
        current: currentPage,
        total: totalPages,
        message: `Generating ${page.title} (${langCode.toUpperCase()})...`,
      });

      const ctx: BlockHtmlContext = {
        theme,
        pages,
        currentPageSlug: page.slug,
        language: langCode,
        formActionUrl: options?.formActionUrl,
        isHomePage: page.isHomePage,
      };

      const translationComponents = Array.isArray(translation.components) ? translation.components : [];
      const componentsHtml = translationComponents
        .map((c) => componentToHtml(c, ctx))
        .join('\n');

      const cssPath = `../../styles.css`;
      const jsPath = `../../scripts.js`;
      const seo = { ...page.seo, ...translation.seo };
      const langPage = { ...page, seo, components: translation.components };
      const html = generatePageHtml(site, langPage, componentsHtml, cssPath, jsPath);
      const filePath = page.isHomePage
        ? `${langCode}/index.html`
        : `${langCode}/${page.slug}/index.html`;
      rawFiles.push({ path: filePath, content: html });
    }
  }

  // 5. Extract embedded images to assets folder (with optional optimization)
  onProgress?.({
    phase: 'extracting-images',
    current: 0,
    total: 1,
    message: 'Scanning for embedded images...',
  });

  const extractionOptions: ImageExtractionOptions = {
    optimization: options?.imageOptimization,
  };

  const extractionResult = await extractImageAssets(rawFiles, (imgProgress) => {
    onProgress?.({
      phase: 'extracting-images',
      current: imgProgress.current,
      total: imgProgress.total,
      message: imgProgress.message,
      imageCount: imgProgress.current,
    });
  }, extractionOptions);

  // 6. Add hosting platform config files
  const platformFiles: ExportedFile[] = [];
  if (options?.platform) {
    const preset = getHostingPreset(options.platform);
    for (const configFile of preset.configFiles) {
      // Skip empty placeholder files
      if (configFile.content || configFile.path === '.nojekyll') {
        platformFiles.push({
          path: configFile.path,
          content: configFile.content,
        });
      }
    }
  }

  // Combine modified HTML files with extracted assets and platform configs
  const finalFiles = [...extractionResult.modifiedFiles, ...extractionResult.assets, ...platformFiles];

  // Final progress update
  onProgress?.({
    phase: 'packaging',
    current: finalFiles.length,
    total: finalFiles.length,
    message: `Packaging ${finalFiles.length} files...`,
    fileCount: finalFiles.length,
    imageCount: extractionResult.imageCount,
  });

  return {
    files: finalFiles,
    stats: {
      pageCount: pages.length,
      translationCount,
      imageCount: extractionResult.imageCount,
      totalFiles: finalFiles.length,
      originalImageSize: extractionResult.originalSize,
      optimizedImageSize: extractionResult.optimizedSize,
    },
  };
}

// ──────────────────────────────────────────────────
// Page HTML generator
// ──────────────────────────────────────────────────

function generatePageHtml(
  site: WebsiteSite,
  page: SitePage,
  bodyContent: string,
  cssPath: string,
  jsPath: string,
): string {
  const { theme } = site;
  const seo = page.seo || {};
  const pageTitle = seo.title || page.title || site.name;
  const description = seo.description || site.description || '';
  const ogTitle = seo.ogTitle || pageTitle;
  const ogDescription = seo.ogDescription || description;
  const ogImage = seo.ogImage || '';
  const dir = theme.direction || 'ltr';

  // Extract font families for Google Fonts
  const fonts = extractGoogleFonts(theme);

  return `<!DOCTYPE html>
<html lang="${site.defaultLanguage || 'en'}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escHtml(pageTitle)}</title>
  ${description ? `<meta name="description" content="${escHtml(description)}" />` : ''}
  ${ogTitle ? `<meta property="og:title" content="${escHtml(ogTitle)}" />` : ''}
  ${ogDescription ? `<meta property="og:description" content="${escHtml(ogDescription)}" />` : ''}
  ${ogImage ? `<meta property="og:image" content="${escHtml(ogImage)}" />` : ''}
  <meta property="og:type" content="website" />
  ${site.favicon ? `<link rel="icon" href="${escHtml(site.favicon)}" />` : ''}
  ${fonts ? `<link rel="preconnect" href="https://fonts.googleapis.com" />\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n  <link href="${fonts}" rel="stylesheet" />` : ''}
  <link rel="stylesheet" href="${cssPath}" />
</head>
<body>
${bodyContent}
<script src="${jsPath}" defer></script>
</body>
</html>`;
}

function escHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function extractGoogleFonts(theme: SiteTheme): string {
  const families = new Set<string>();

  const addFont = (fontStr: string | undefined) => {
    if (!fontStr) return;
    const name = fontStr.split(',')[0].trim().replace(/'/g, '');
    if (name && !['sans-serif', 'serif', 'monospace', 'cursive', 'system-ui'].includes(name.toLowerCase())) {
      families.add(name);
    }
  };

  addFont(theme.headingFont);
  addFont(theme.bodyFont);

  if (families.size === 0) return '';

  const params = Array.from(families)
    .map((f) => `family=${encodeURIComponent(f)}:wght@300;400;500;600;700;800`)
    .join('&');
  return `https://fonts.googleapis.com/css2?${params}&display=swap`;
}

// ──────────────────────────────────────────────────
// CSS generation
// ──────────────────────────────────────────────────

export function generateThemeCss(theme: SiteTheme): string {
  const radius = theme.borderRadius;
  const spacing = theme.spacing;
  const fontScale = theme.fontScale || 1;
  const sectionPad = theme.sectionPadding || 1;

  // Shadow presets
  const shadows: Record<string, string> = {
    none: 'none',
    subtle: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
    medium: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    dramatic: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
  };
  const shadow = shadows[theme.shadowStyle || 'subtle'] || shadows.subtle;

  return `/* ═══════════════════════════════════════════════════
   Generated by Website Builder — Theme Stylesheet
   ═══════════════════════════════════════════════════ */

/* ── CSS Custom Properties ── */
:root {
  --primary-color: ${theme.primaryColor};
  --secondary-color: ${theme.secondaryColor};
  --accent-color: ${theme.accentColor};
  --background-color: ${theme.backgroundColor};
  --text-color: ${theme.textColor};
  --heading-font: ${theme.headingFont || 'Inter, sans-serif'};
  --body-font: ${theme.bodyFont || 'Inter, sans-serif'};
  --border-radius: ${radius}px;
  --spacing: ${spacing}px;
  --shadow: ${shadow};
  --font-scale: ${fontScale};
  --section-padding: ${Math.round(64 * sectionPad)}px;
  --container-max: 1200px;
  --container-gutter: 24px;
}

/* ── Reset & Base ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; -webkit-text-size-adjust: 100%; }
body {
  font-family: var(--body-font);
  color: var(--text-color);
  background-color: var(--background-color);
  line-height: 1.6;
  font-size: ${Math.round(16 * fontScale)}px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  overflow-x: hidden;
}
img { max-width: 100%; height: auto; display: block; }
a { color: inherit; }
h1, h2, h3, h4, h5, h6 { font-family: var(--heading-font); line-height: 1.2; overflow-wrap: break-word; ${theme.letterSpacing ? `letter-spacing: ${theme.letterSpacing}em;` : ''} ${theme.headingTransform && theme.headingTransform !== 'none' ? `text-transform: ${theme.headingTransform};` : ''} }
p { overflow-wrap: break-word; }

/* ── Container ── */
.container { max-width: var(--container-max); margin: 0 auto; width: 100%; padding-left: var(--container-gutter); padding-right: var(--container-gutter); }

/* ── Icon sizes ── */
.icon-xs { width: 12px; height: 12px; }
.icon-sm { width: 16px; height: 16px; }
.icon-md { width: 24px; height: 24px; }
.icon-lg { width: 32px; height: 32px; }
.icon-xl { width: 48px; height: 48px; }
svg.icon-xs, svg.icon-sm, svg.icon-md, svg.icon-lg, svg.icon-xl { display: inline-block; vertical-align: middle; flex-shrink: 0; }

/* ── Link styles ── */
${theme.linkStyle === 'underline' ? 'a { text-decoration: underline; }' : theme.linkStyle === 'hover-underline' ? 'a { text-decoration: none; } a:hover { text-decoration: underline; }' : 'a { text-decoration: none; }'}

/* ── Buttons ── */
button { font-family: var(--body-font); cursor: pointer; }
a[style*="border-radius"] { transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease; }
a[style*="border-radius"]:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
${theme.buttonStyle === 'pill' ? 'button, a[style*="border-radius"] { border-radius: 999px !important; }' : ''}

/* ── Cards & interactive elements ── */
.wb-card { border-radius: var(--border-radius); box-shadow: var(--shadow); }
[style*="border: 1px solid"] { transition: box-shadow 0.2s ease, transform 0.2s ease; }
[style*="border: 1px solid"]:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
section [style*="border-radius"][style*="border: 1px solid"]:hover { transform: translateY(-2px); }

/* ── Navbar ── */
.wb-navbar .nav-link { font-size: ${Math.round(14 * fontScale)}px; }

/* ── FAQ Accordion ── */
.faq-item .faq-answer { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.35s ease; }
.faq-item.open .faq-answer { max-height: 500px; }
.faq-item.open .faq-icon { transform: rotate(180deg); }

/* ── Tabs ── */
.tab-button.active { opacity: 1 !important; }

/* ── Marquee ── */
.wb-marquee .marquee-inner {
  display: inline-block;
  animation: marquee-scroll 20s linear infinite;
}
@keyframes marquee-scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-33.33%); }
}

/* ── Scroll to top ── */
.wb-scroll-top.visible { display: flex !important; }

/* ── Entrance Animations ── */
[data-entrance] { opacity: 0; transform: translateY(20px); transition: opacity 0.6s ease, transform 0.6s ease; }
[data-entrance].animated { opacity: 1; transform: none; }
[data-entrance="fade-in"].animated { opacity: 1; }
[data-entrance="slide-up"].animated { transform: translateY(0); }
[data-entrance="slide-down"] { transform: translateY(-20px); }
[data-entrance="slide-down"].animated { transform: translateY(0); }
[data-entrance="slide-left"] { transform: translateX(-30px); }
[data-entrance="slide-left"].animated { transform: translateX(0); }
[data-entrance="slide-right"] { transform: translateX(30px); }
[data-entrance="slide-right"].animated { transform: translateX(0); }
[data-entrance="zoom-in"] { transform: scale(0.9); }
[data-entrance="zoom-in"].animated { transform: scale(1); }
[data-entrance="zoom-out"] { transform: scale(1.1); }
[data-entrance="zoom-out"].animated { transform: scale(1); }
[data-entrance="flip"] { transform: perspective(600px) rotateY(90deg); }
[data-entrance="flip"].animated { transform: perspective(600px) rotateY(0); }
[data-entrance="bounce"].animated { animation: bounce-in 0.6s ease; }

@keyframes bounce-in {
  0% { transform: scale(0.9); opacity: 0; }
  50% { transform: scale(1.05); }
  70% { transform: scale(0.98); }
  100% { transform: scale(1); opacity: 1; }
}

/* ── Speed modifiers ── */
[data-speed="slow"] { transition-duration: 1s !important; }
[data-speed="fast"] { transition-duration: 0.3s !important; }

/* ── Responsive ── */

/* Tablet (≤1023px) */
@media (max-width: 1023px) {
  .wb-hero { min-height: 400px !important; }
  .wb-hero-split { grid-template-columns: 1fr !important; }
  .wb-navbar .nav-links { display: none !important; }
  .wb-navbar .nav-cta { display: none !important; }
  .wb-navbar .mobile-menu-toggle { display: flex !important; }
  .wb-navbar .top-bar-links { display: none !important; }
  [style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
  [style*="grid-template-columns: repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
  [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: 1fr !important; }
  .footer-columns { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-about .container[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-image-text .container[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-map-split { grid-template-columns: 1fr !important; }
  .wb-map-split > div { min-height: 300px; }
  .wb-comparison-table { overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .wb-comparison-table table { min-width: 500px; }
  .wb-hero-carousel .slide-buttons { flex-wrap: wrap; gap: 8px !important; }
  .wb-pricing .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-icon-text .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-blog-grid .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-columns[style*="grid-template-columns: repeat(3"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-columns[style*="grid-template-columns: repeat(4"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-columns[style*="grid-template-columns: repeat(5"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-floating-header .container[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
}

/* Mobile (≤767px) */
@media (max-width: 767px) {
  :root { --container-gutter: 16px; }
  body { font-size: ${Math.round(14 * fontScale)}px; }
  .wb-hero h1 { font-size: clamp(24px, 7vw, 36px) !important; }
  .wb-hero h2 { font-size: clamp(14px, 3.5vw, 18px) !important; }
  .wb-hero .container, .wb-hero > div[style*="z-index"] { padding-left: 16px; padding-right: 16px; }
  [style*="grid-template-columns: repeat(2"] { grid-template-columns: 1fr !important; }
  .footer-columns { grid-template-columns: 1fr !important; }
  .wb-navbar .mobile-menu.open { display: flex !important; }
  .wb-navbar .top-bar { flex-direction: column; text-align: center; gap: 4px !important; padding: 6px 12px !important; }
  section[style*="padding: 64px"] { padding-top: 40px !important; padding-bottom: 40px !important; }
  section[style*="padding: 80px"] { padding-top: 48px !important; padding-bottom: 48px !important; }
  section[style*="padding: 96px"] { padding-top: 48px !important; padding-bottom: 48px !important; }
  .wb-features .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-testimonials .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-stats .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-team .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-icon-text .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-blog-grid .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-pricing .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-service-cards .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-lightbox-gallery .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; }
  .wb-before-after { max-width: 100%; overflow: hidden; }
  .wb-cta-banner h2 { font-size: clamp(20px, 5vw, 28px) !important; }
  .wb-cta-banner .container { flex-direction: column !important; text-align: center !important; }
  .wb-cta-banner .container > div { align-items: center !important; }
  .wb-trust-badges .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; gap: 12px !important; }
  .wb-timeline .timeline-item { padding-left: 24px !important; }
  .wb-countdown .container > div[style*="grid-template-columns"],
  .wb-countdown .container > div[style*="display: flex"] { gap: 12px !important; }
  .wb-countdown .cd-box { min-width: 60px !important; padding: 12px !important; }
  .wb-countdown .cd-box .cd-value { width: 60px !important; height: 60px !important; font-size: 24px !important; }
  .wb-hero-carousel .slide-content { padding: 0 16px !important; }
  .wb-hero-carousel .slide-arrow { display: none !important; }
  .wb-parallax h2 { font-size: clamp(22px, 5.5vw, 32px) !important; }
  .wb-newsletter .container > div { flex-direction: column !important; }
  .wb-newsletter input, .wb-newsletter button { width: 100% !important; }
  .wb-reviews .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-columns { grid-template-columns: 1fr !important; }
  .wb-floating-header .container[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-floating-header { margin-top: -30px !important; }
  /* Touch-friendly tap targets */
  button, a[style*="border-radius"], input, select, textarea { min-height: 44px; }
}

/* Small mobile (≤480px) */
@media (max-width: 480px) {
  :root { --container-gutter: 12px; }
  .wb-hero { min-height: 350px !important; }
  .wb-hero h1 { font-size: clamp(22px, 6vw, 30px) !important; }
  .wb-stats .container > div[style*="grid-template-columns"] { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
  .wb-team .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-trust-badges .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-lightbox-gallery .container > div[style*="grid-template-columns"] { grid-template-columns: 1fr !important; }
  .wb-floating-header { margin-top: -20px !important; }
  .wb-floating-header .container[style*="grid-template-columns"] { gap: 8px !important; }
}

/* ── Per-device visibility ── */
.wb-hide-desktop { }
@media (max-width: 1023px) {
  .wb-hide-tablet { display: none !important; }
}
@media (min-width: 1024px) {
  .wb-hide-desktop { display: none !important; }
}
@media (max-width: 767px) {
  .wb-hide-mobile { display: none !important; }
}

/* ── Print ── */
@media print {
  .wb-navbar, .wb-cookie-consent, .wb-whatsapp, .wb-floating-cta, .wb-scroll-top { display: none !important; }
}
`;
}

// ──────────────────────────────────────────────────
// JavaScript generation
// ──────────────────────────────────────────────────

export function generateScriptsJs(): string {
  return `/* ═══════════════════════════════════════════════════
   Generated by Website Builder — Interactive Scripts
   ═══════════════════════════════════════════════════ */
(function() {
  'use strict';

  /* ── Entrance Animations via IntersectionObserver ── */
  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var delay = parseInt(el.getAttribute('data-delay') || '0', 10);
          setTimeout(function() { el.classList.add('animated'); }, delay);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    document.querySelectorAll('[data-entrance]').forEach(function(el) {
      observer.observe(el);
    });
  } else {
    // Fallback: show everything
    document.querySelectorAll('[data-entrance]').forEach(function(el) {
      el.classList.add('animated');
    });
  }

  /* ── FAQ Accordion ── */
  document.querySelectorAll('.faq-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var item = btn.closest('.faq-item');
      if (!item) return;
      var isOpen = item.classList.contains('open');
      // Close all siblings
      var parent = item.parentElement;
      if (parent) {
        parent.querySelectorAll('.faq-item.open').forEach(function(openItem) {
          openItem.classList.remove('open');
          var answer = openItem.querySelector('.faq-answer');
          if (answer) answer.style.maxHeight = '0';
        });
      }
      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
        var answer = item.querySelector('.faq-answer');
        if (answer) answer.style.maxHeight = answer.scrollHeight + 'px';
      }
    });
  });

  /* ── Tab Switching ── */
  document.querySelectorAll('.wb-tabs').forEach(function(tabSection) {
    var buttons = tabSection.querySelectorAll('.tab-button');
    var panels = tabSection.querySelectorAll('.tab-panel');
    buttons.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var idx = btn.getAttribute('data-tab');
        buttons.forEach(function(b) {
          b.classList.remove('active');
          b.style.borderBottomColor = 'transparent';
          b.style.opacity = '0.6';
        });
        panels.forEach(function(p) { p.style.display = 'none'; p.classList.remove('active'); });
        btn.classList.add('active');
        btn.style.opacity = '1';
        btn.style.borderBottomColor = 'currentColor';
        var panel = tabSection.querySelector('.tab-panel[data-tab="' + idx + '"]');
        if (panel) { panel.style.display = 'block'; panel.classList.add('active'); }
      });
    });
  });

  /* ── Mobile Navigation ── */
  document.querySelectorAll('.mobile-menu-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      var nav = btn.closest('.wb-navbar');
      if (!nav) return;
      var menu = nav.querySelector('.mobile-menu');
      if (!menu) return;
      var isOpen = menu.classList.contains('open');
      if (isOpen) {
        menu.classList.remove('open');
        menu.style.display = 'none';
      } else {
        menu.classList.add('open');
        menu.style.display = 'flex';
      }
    });
  });

  /* ── Scroll to Top ── */
  var scrollBtn = document.querySelector('.wb-scroll-top');
  if (scrollBtn) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 400) {
        scrollBtn.classList.add('visible');
      } else {
        scrollBtn.classList.remove('visible');
      }
    });
  }

  /* ── Countdown Timers ── */
  document.querySelectorAll('.wb-countdown').forEach(function(section) {
    var container = section.querySelector('[data-target]');
    if (!container) return;
    var target = new Date(container.getAttribute('data-target')).getTime();
    function updateCountdown() {
      var now = Date.now();
      var diff = Math.max(0, target - now);
      var days = Math.floor(diff / 86400000);
      var hours = Math.floor((diff % 86400000) / 3600000);
      var minutes = Math.floor((diff % 3600000) / 60000);
      var seconds = Math.floor((diff % 60000) / 1000);
      var vals = container.querySelectorAll('.cd-value');
      vals.forEach(function(el) {
        var unit = el.getAttribute('data-unit');
        if (unit === 'days') el.textContent = days;
        else if (unit === 'hours') el.textContent = hours;
        else if (unit === 'minutes') el.textContent = minutes;
        else if (unit === 'seconds') el.textContent = seconds;
      });
    }
    updateCountdown();
    setInterval(updateCountdown, 1000);
  });

  /* ── Hero Carousel Auto-Play ── */
  document.querySelectorAll('.wb-hero-carousel').forEach(function(carousel) {
    var slides = carousel.querySelectorAll('.carousel-slide');
    var dots = carousel.querySelectorAll('.carousel-dot');
    var prevBtn = carousel.querySelector('.slide-arrow-prev');
    var nextBtn = carousel.querySelector('.slide-arrow-next');
    if (slides.length < 2) return;
    var currentSlide = 0;
    var autoPlayInterval = parseInt(carousel.getAttribute('data-autoplay-interval') || '5', 10) * 1000;
    var isPaused = false;

    function showSlide(idx) {
      slides.forEach(function(s, i) {
        s.style.opacity = i === idx ? '1' : '0';
        s.style.zIndex = i === idx ? '2' : '1';
        s.style.pointerEvents = i === idx ? 'auto' : 'none';
      });
      dots.forEach(function(d, i) {
        d.style.opacity = i === idx ? '1' : '0.5';
        d.style.transform = i === idx ? 'scale(1.2)' : 'scale(1)';
      });
      currentSlide = idx;
    }

    function nextSlide() { showSlide((currentSlide + 1) % slides.length); }
    function prevSlide() { showSlide((currentSlide - 1 + slides.length) % slides.length); }

    if (nextBtn) nextBtn.addEventListener('click', function() { nextSlide(); });
    if (prevBtn) prevBtn.addEventListener('click', function() { prevSlide(); });
    dots.forEach(function(dot, i) {
      dot.addEventListener('click', function() { showSlide(i); });
    });

    carousel.addEventListener('mouseenter', function() { isPaused = true; });
    carousel.addEventListener('mouseleave', function() { isPaused = false; });

    setInterval(function() { if (!isPaused) nextSlide(); }, autoPlayInterval);
    showSlide(0);
  });

  /* ── Smooth Anchor Scrolling ── */
  document.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  /* ── Form submission fallback ── */
  document.querySelectorAll('form[action="#"]').forEach(function(form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      if (btn) {
        var origText = btn.textContent;
        btn.textContent = 'Thank you! ✓';
        btn.disabled = true;
        btn.style.opacity = '0.7';
        setTimeout(function() {
          btn.textContent = origText;
          btn.disabled = false;
          btn.style.opacity = '1';
          form.reset();
        }, 3000);
      }
    });
  });
})();
`;
}
