/**
 * Maps all 80+ website builder component types to semantic HTML.
 * Each handler converts a BuilderComponent into an HTML string.
 */
import type { BuilderComponent } from '../../types/component';
import type { SiteTheme } from '../../types/site';
import type { BlockHtmlContext } from './types';
import { styleAttr } from './types';
import { getIconSvg, getSocialIconSvg } from './iconSvgs';

// ──────────────────────────────────────────────────
// Helper utilities
// ──────────────────────────────────────────────────

function esc(s: string | undefined): string {
  if (!s) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/**
 * Safely convert a value to an array.
 * Handles cases where API returns objects, strings, or undefined instead of arrays.
 */
function toArray<T = any>(value: unknown): T[] {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  if (typeof value === 'object') {
    // If it's an object with numeric keys or iterable, try to convert
    if (typeof (value as any).length === 'number') {
      return Array.from(value as ArrayLike<T>);
    }
    // Single object - wrap in array if it has expected properties
    return [];
  }
  return [];
}

function mergeStyles(...objs: (React.CSSProperties | undefined)[]): React.CSSProperties {
  const merged: Record<string, any> = {};
  for (const o of objs) {
    if (o) Object.assign(merged, o);
  }
  return merged;
}

function btnStyle(theme: SiteTheme, variant: string = 'primary', color?: string, textColor?: string): string {
  const bg = color || theme.primaryColor;
  const fg = textColor || '#ffffff';
  const radius = theme.borderRadius + 'px';

  switch (variant) {
    case 'secondary':
      return `background-color: ${theme.secondaryColor}; color: #ffffff; border-radius: ${radius}; padding: 12px 24px; text-decoration: none; display: inline-block; font-weight: 600; border: none; cursor: pointer;`;
    case 'outline':
      return `background-color: transparent; color: ${bg}; border: 2px solid ${bg}; border-radius: ${radius}; padding: 10px 22px; text-decoration: none; display: inline-block; font-weight: 600; cursor: pointer;`;
    case 'ghost':
      return `background-color: transparent; color: ${bg}; border: none; border-radius: ${radius}; padding: 12px 24px; text-decoration: none; display: inline-block; font-weight: 600; cursor: pointer;`;
    default:
      return `background-color: ${bg}; color: ${fg}; border-radius: ${radius}; padding: 12px 24px; text-decoration: none; display: inline-block; font-weight: 600; border: none; cursor: pointer; transition: transform 0.2s, box-shadow 0.2s;`;
  }
}

function sectionWrap(inner: string, bgColor: string | undefined, theme: SiteTheme, extraStyle?: string, className?: string): string {
  const bg = bgColor ? `background-color: ${bgColor};` : '';
  const style = `font-family: ${theme.bodyFont}; ${bg} ${extraStyle || ''}`.trim();
  return `<section class="${className || 'wb-section'}" style="${style}"><div class="container">${inner}</div></section>`;
}

function animAttr(component: BuilderComponent): string {
  const anim = component.animation;
  if (!anim?.entrance) return '';
  const delay = anim.delay ? ` data-delay="${anim.delay}"` : '';
  const speed = anim.speed || 'normal';
  return ` data-entrance="${anim.entrance}" data-speed="${speed}"${delay}`;
}

function renderStars(count: number, color: string): string {
  const full = Math.floor(count);
  const stars: string[] = [];
  for (let i = 0; i < 5; i++) {
    const fill = i < full ? color : '#e2e8f0';
    stars.push(`<svg width="16" height="16" viewBox="0 0 24 24" fill="${fill}" stroke="${fill}" stroke-width="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`);
  }
  return stars.join('');
}

// ──────────────────────────────────────────────────
// Main converter
// ──────────────────────────────────────────────────

/** Counter for generating unique IDs for responsive style blocks */
let _responsiveCounter = 0;

export function componentToHtml(component: BuilderComponent, ctx: BlockHtmlContext): string {
  const { theme } = ctx;
  const p = component.props || {};
  const anim = animAttr(component);
  const compStyle = component.styles?.desktop;

  // Handle per-device hidden state
  const hidden = component.hidden;
  const hiddenClasses: string[] = [];
  if (hidden?.desktop) hiddenClasses.push('wb-hide-desktop');
  if (hidden?.tablet) hiddenClasses.push('wb-hide-tablet');
  if (hidden?.mobile) hiddenClasses.push('wb-hide-mobile');

  // If hidden on all devices, skip rendering entirely
  if (hidden?.desktop && hidden?.tablet && hidden?.mobile) {
    return '';
  }

  // Generate responsive style overrides (tablet/mobile)
  let responsiveCss = '';
  const tabletStyle = component.styles?.tablet;
  const mobileStyle = component.styles?.mobile;
  let responsiveId = '';
  
  if (tabletStyle || mobileStyle) {
    _responsiveCounter++;
    responsiveId = `wb-r${_responsiveCounter}`;
    
    const tabletCss = tabletStyle ? Object.entries(tabletStyle)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        const cssKey = k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        const cssVal = typeof v === 'number' && !cssKey.includes('opacity') && !cssKey.includes('z-index') && !cssKey.includes('flex') && !cssKey.includes('order')
          ? v + 'px' : String(v);
        return `${cssKey}: ${cssVal} !important`;
      }).join('; ') : '';
    
    const mobileCss = mobileStyle ? Object.entries(mobileStyle)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => {
        const cssKey = k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
        const cssVal = typeof v === 'number' && !cssKey.includes('opacity') && !cssKey.includes('z-index') && !cssKey.includes('flex') && !cssKey.includes('order')
          ? v + 'px' : String(v);
        return `${cssKey}: ${cssVal} !important`;
      }).join('; ') : '';

    if (tabletCss) {
      responsiveCss += `<style>@media(max-width:1023px){.${responsiveId}{${tabletCss}}}</style>`;
    }
    if (mobileCss) {
      responsiveCss += `<style>@media(max-width:767px){.${responsiveId}{${mobileCss}}}</style>`;
    }
  }

  // Build the main HTML for this component
  let html = renderComponent(component, ctx, p, theme, anim, compStyle);
  
  // Wrap with hidden classes and responsive class if needed
  const extraClasses = [...hiddenClasses, responsiveId].filter(Boolean);
  if (extraClasses.length > 0) {
    // Inject classes into the outermost element
    const classAttr = extraClasses.join(' ');
    if (html.startsWith('<')) {
      // Find the first > or space after the tag name
      const firstTagEnd = html.indexOf('>');
      const firstSpace = html.indexOf(' ');
      if (firstSpace > 0 && firstSpace < firstTagEnd) {
        // Has attributes — check for existing class
        const classMatch = html.match(/class="([^"]*)"/);
        if (classMatch) {
          html = html.replace(`class="${classMatch[1]}"`, `class="${classMatch[1]} ${classAttr}"`);
        } else {
          html = html.slice(0, firstSpace) + ` class="${classAttr}"` + html.slice(firstSpace);
        }
      } else {
        // No attributes — add class before >
        html = html.slice(0, firstTagEnd) + ` class="${classAttr}"` + html.slice(firstTagEnd);
      }
    }
  }

  return responsiveCss + html;
}

function renderComponent(component: BuilderComponent, ctx: BlockHtmlContext, p: Record<string, any>, theme: SiteTheme, anim: string, compStyle: React.CSSProperties | undefined): string {

  switch (component.type) {
    // ───── NAVIGATION ─────
    case 'navbar':
      return renderNavbar(p, ctx, anim, compStyle);
    case 'footer':
      return renderFooter(p, ctx, anim, compStyle);

    // ───── HERO ─────
    case 'hero':
      return renderHero(p, ctx, anim, compStyle);

    // ───── LAYOUT ─────
    case 'section':
      return renderSection(component, ctx);
    case 'columns':
      return renderColumns(component, ctx);
    case 'spacer':
      return `<div${anim} style="height: ${p.height || 48}px;${styleAttr(compStyle).replace(' style="', '').replace('"', '')}"></div>`;
    case 'divider':
      return `<div class="wb-divider" style="padding: 16px 24px;${p.bgColor ? ` background-color: ${p.bgColor};` : ''}"><hr style="border-color: ${p.color || '#e2e8f0'}; border-width: ${p.thickness || 1}px;" /></div>`;
    case 'sticky':
      return `<div style="position: sticky; top: 0; z-index: 40;">${toArray(component.children).map(c => componentToHtml(c, ctx)).join('')}</div>`;

    // ───── TEXT & CONTENT ─────
    case 'heading':
      return renderHeading(p, theme, anim, compStyle);
    case 'paragraph':
      return `<div${anim} class="wb-paragraph" style="padding: 24px; font-family: ${theme.bodyFont}; color: ${theme.textColor};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">${p.text || p.content || ''}</div>`;
    case 'rich-text':
      return `<div${anim} class="wb-richtext" style="padding: 24px; font-family: ${theme.bodyFont}; color: ${theme.textColor};">${p.content || ''}</div>`;
    case 'blockquote':
      return `<blockquote${anim} style="padding: 24px 48px; border-left: 4px solid ${theme.primaryColor}; font-family: ${theme.bodyFont}; font-style: italic; color: ${theme.textColor}; opacity: 0.8; margin: 24px;">${esc(p.quote || p.text || p.content || '')}${(p.author) ? `<footer style="margin-top: 12px; font-style: normal; font-size: 14px; font-weight: 500; color: ${theme.secondaryColor};">— ${esc(p.author)}${p.source ? `, <cite>${esc(p.source)}</cite>` : ''}</footer>` : ''}</blockquote>`;
    case 'code-block':
      return `<pre${anim} style="padding: 24px; background: #1e293b; color: #e2e8f0; border-radius: ${theme.borderRadius}px; overflow-x: auto; margin: 16px 24px; font-family: 'Fira Code', monospace; font-size: 14px;"><code>${esc(p.code || p.content || '')}</code></pre>`;
    case 'list':
      return renderList(p, theme, anim);
    case 'callout':
      return renderCallout(p, theme, anim);
    case 'icon-text':
      return renderIconText(p, theme, anim, compStyle);

    // ───── MEDIA ─────
    case 'image-text':
      return renderImageText(p, theme, anim, compStyle);
    case 'image-gallery':
      return renderImageGallery(p, theme, anim, compStyle);
    case 'gallery-masonry':
      return renderMasonryGallery(p, theme, anim, compStyle);
    case 'video-embed':
      return renderVideoEmbed(p, theme, anim, compStyle);
    case 'background-video':
      return `<div${anim} style="position: relative; overflow: hidden;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}"><video autoplay loop muted playsinline style="width: 100%; height: 100%; object-fit: cover;"><source src="${esc(p.url || p.videoUrl || '')}" type="video/mp4" /></video></div>`;
    case 'audio-player':
      return `<div${anim} style="padding: 24px;"><audio controls style="width: 100%; max-width: 600px; margin: 0 auto; display: block;"><source src="${esc(p.url || p.audioUrl || '')}" /></audio></div>`;
    case 'map':
      return renderMap(p, anim, compStyle);
    case 'lightbox-gallery':
      return renderImageGallery(p, theme, anim, compStyle);
    case 'before-after':
      return `<div${anim} class="wb-before-after" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding: 24px; max-width: 800px; margin: 0 auto;"><img src="${esc(p.beforeImage || '')}" alt="Before" style="width: 100%; border-radius: ${theme.borderRadius}px;" /><img src="${esc(p.afterImage || '')}" alt="After" style="width: 100%; border-radius: ${theme.borderRadius}px;" /></div>`;

    // ───── BUSINESS & MARKETING ─────
    case 'about':
      return renderAbout(p, theme, anim, compStyle);
    case 'features':
      return renderFeatures(p, theme, anim, compStyle);
    case 'service-card':
      return renderServiceCard(p, theme, anim, compStyle);
    case 'pricing':
      return renderPricing(p, theme, anim, compStyle);
    case 'testimonials':
      return renderTestimonials(p, theme, anim, compStyle);
    case 'reviews':
      return renderTestimonials(p, theme, anim, compStyle);
    case 'stats':
    case 'animated-stats':
      return renderStats(p, theme, anim, compStyle);
    case 'cta-banner':
      return renderCtaBanner(p, theme, anim, compStyle);
    case 'logo-cloud':
      return renderLogoCloud(p, theme, anim, compStyle);
    case 'team-grid':
      return renderTeamGrid(p, theme, anim, compStyle);
    case 'trust-badges':
      return renderTrustBadges(p, theme, anim, compStyle);
    case 'countdown':
      return renderCountdown(p, theme, anim, compStyle);
    case 'floating-header':
      return renderFloatingHeader(p, theme, anim, compStyle);
    case 'comparison-table':
      return renderComparisonTable(p, theme, anim, compStyle);
    case 'timeline':
      return renderTimeline(p, theme, anim, compStyle);
    case 'banner':
    case 'announcement-bar':
      return `<div${anim} class="wb-banner" style="background-color: ${p.bgColor || theme.primaryColor}; color: ${p.textColor || '#ffffff'}; text-align: center; padding: 12px 24px; font-family: ${theme.bodyFont}; font-size: 14px;">${esc(p.text || p.message || '')}</div>`;
    case 'marquee':
      return `<div${anim} class="wb-marquee" style="overflow: hidden; white-space: nowrap; padding: 16px 0; font-family: ${theme.bodyFont}; color: ${theme.textColor};"><div class="marquee-inner">${esc(p.text || '')}&nbsp;&nbsp;&nbsp;${esc(p.text || '')}&nbsp;&nbsp;&nbsp;${esc(p.text || '')}</div></div>`;
    case 'popup':
      return '';

    // ───── INTERACTIVE & FORMS ─────
    case 'contact-form':
      return renderContactForm(p, ctx, anim, compStyle);
    case 'newsletter':
      return renderNewsletter(p, theme, anim, compStyle);
    case 'button':
      return renderButton(p, theme, anim, compStyle);
    case 'button-group':
      return renderButtonGroup(p, theme, anim, compStyle);
    case 'social-links':
      return renderSocialLinks(p, theme, anim, compStyle);
    case 'tabs':
      return renderTabs(p, theme, anim, compStyle);
    case 'faq':
      return renderFaq(p, theme, anim, compStyle);
    case 'progress':
      return renderProgress(p, theme, anim);
    case 'form':
      return renderGenericForm(p, ctx, anim, compStyle);
    case 'login-form':
    case 'signup-form':
      return renderAuthForm(p, theme, component.type, anim);
    case 'search-bar':
      return `<div${anim} style="padding: 24px; max-width: 600px; margin: 0 auto;"><input type="search" placeholder="${esc(p.placeholder || 'Search...')}" style="width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px; font-family: ${theme.bodyFont}; font-size: 16px; outline: none;" /></div>`;
    case 'rating':
      return `<div${anim} style="padding: 16px; text-align: center; display: flex; justify-content: center; gap: 4px;">${renderStars(p.value || p.rating || 5, p.color || theme.primaryColor)}</div>`;
    case 'avatar':
      return `<div${anim} style="padding: 16px; text-align: center;"><img src="${esc(p.src || p.imageUrl || '')}" alt="${esc(p.name || '')}" style="width: ${p.size || 64}px; height: ${p.size || 64}px; border-radius: 50%; object-fit: cover;" /></div>`;

    // ───── E-COMMERCE ─────
    case 'product-card':
      return renderProductCard(p, theme, anim);
    case 'product-detail':
      return renderProductDetail(p, theme, anim);
    case 'product-carousel':
    case 'quick-view':
    case 'wishlist-grid':
    case 'cart':
    case 'product-filter':
    case 'checkout':
      return `<div${anim} class="wb-ecommerce-placeholder" style="padding: 48px; text-align: center; font-family: ${theme.bodyFont}; color: ${theme.secondaryColor}; background: ${theme.primaryColor}08; border-radius: ${theme.borderRadius}px; margin: 24px;"><p style="font-size: 14px; opacity: 0.6;">E-commerce component (${component.type}) — requires backend integration</p></div>`;

    // ───── BLOG ─────
    case 'blog-grid':
      return renderBlogGrid(p, theme, anim);
    case 'comments':
      return `<div${anim} style="padding: 24px; font-family: ${theme.bodyFont};"><h3 style="color: ${theme.textColor}; margin-bottom: 16px;">Comments</h3><p style="color: ${theme.secondaryColor}; opacity: 0.6; font-size: 14px;">Comments require backend integration.</p></div>`;
    case 'tags-cloud':
      return renderTagsCloud(p, theme, anim);

    // ───── USER ─────
    case 'user-profile':
      return `<div${anim} style="padding: 48px; text-align: center; font-family: ${theme.bodyFont};"><p style="color: ${theme.secondaryColor}; opacity: 0.6;">User profile requires authentication.</p></div>`;

    // ───── ADVANCED ─────
    case 'custom-html':
      return p.html || '';
    case 'cookie-consent':
      return renderCookieConsent(p, theme);
    case 'parallax':
      return `<div${anim} style="background-image: url('${esc(p.imageUrl || p.backgroundImage || '')}'); background-attachment: fixed; background-size: cover; background-position: center; min-height: ${p.height === 'small' ? '300' : p.height === 'medium' ? '400' : '500'}px; display: flex; align-items: center; justify-content: center;"><div style="position: absolute; inset: 0; background: rgba(0,0,0,${(p.overlayOpacity != null ? (p.overlayOpacity > 1 ? p.overlayOpacity / 100 : p.overlayOpacity) : 0.4)});"></div><div style="position: relative; text-align: center; color: #ffffff; text-shadow: 0 2px 8px rgba(0,0,0,0.5);">${(p.heading || p.title) ? `<h2 style="font-size: 36px; font-weight: bold; font-family: ${theme.headingFont};">${esc(p.heading || p.title)}</h2>` : ''}${(p.subheading || p.subtitle) ? `<p style="font-size: 18px; opacity: 0.9;">${esc(p.subheading || p.subtitle)}</p>` : ''}</div></div>`;

    // ───── INTEGRATIONS & WIDGETS ─────
    case 'whatsapp-button':
      return `<a href="https://wa.me/${esc(p.phone || p.number || '')}" target="_blank" rel="noopener" class="wb-whatsapp" style="position: fixed; bottom: 24px; right: 24px; z-index: 999; width: 56px; height: 56px; border-radius: 50%; background: #25D366; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px rgba(0,0,0,0.2); color: white;">${getIconSvg('message-circle', 'icon-md')}</a>`;
    case 'floating-cta':
      return `<a href="${esc(p.link || p.url || '#')}" class="wb-floating-cta" style="position: fixed; bottom: 24px; right: ${p.phone ? '96px' : '24px'}; z-index: 998; padding: 12px 24px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}; color: #ffffff; text-decoration: none; font-weight: 600; box-shadow: 0 4px 12px rgba(0,0,0,0.2); font-family: ${theme.bodyFont};">${esc(p.text || 'Get Started')}</a>`;
    case 'scroll-to-top':
      return `<button class="wb-scroll-top" style="position: fixed; bottom: 24px; right: 24px; z-index: 997; width: 44px; height: 44px; border-radius: 50%; background: ${theme.primaryColor}; color: #ffffff; border: none; cursor: pointer; display: none; align-items: center; justify-content: center; box-shadow: 0 2px 8px rgba(0,0,0,0.15);" onclick="window.scrollTo({top:0,behavior:'smooth'})">${getIconSvg('arrow-up', 'icon-sm')}</button>`;
    case 'facebook-pixel':
      return p.pixelId ? `<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${esc(p.pixelId)}');fbq('track','PageView');</script>` : '';
    case 'google-analytics':
      return p.trackingId ? `<script async src="https://www.googletagmanager.com/gtag/js?id=${esc(p.trackingId)}"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${esc(p.trackingId)}');</script>` : '';
    case 'loading-screen':
      return '';
    case 'language-switcher':
      return renderLanguageSwitcher(p, theme, anim);
    case 'mega-menu':
      return renderNavbar(p, ctx, anim, compStyle);
    case 'breadcrumb':
      return renderBreadcrumb(p, theme, anim);
    case 'pagination':
      return `<nav${anim} style="padding: 24px; display: flex; justify-content: center; gap: 8px; font-family: ${theme.bodyFont};"><span style="padding: 8px 16px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}; color: #fff;">1</span><span style="padding: 8px 16px; border-radius: ${theme.borderRadius}px; border: 1px solid #e2e8f0;">2</span><span style="padding: 8px 16px; border-radius: ${theme.borderRadius}px; border: 1px solid #e2e8f0;">3</span></nav>`;

    // ───── LEGACY ─────
    case 'carousel':
      return renderHero(p, ctx, anim, compStyle);

    default:
      return `<!-- Unknown component type: ${component.type} -->`;
  }
}

// ──────────────────────────────────────────────────
// Individual block renderers
// ──────────────────────────────────────────────────

function renderNavbar(p: Record<string, any>, ctx: BlockHtmlContext, anim: string, compStyle?: React.CSSProperties): string {
  const { theme } = ctx;
  const links = toArray(p.links) as Array<{ label: string; url?: string; href?: string; children?: any[] }>;
  const bg = p.bgColor || theme.backgroundColor;
  const logoUrl = p.logoUrl || '';
  const logoText = p.logo || p.siteName || p.title || '';
  const variant = p.variant || 'default';
  const isTransparent = variant === 'transparent' || variant === 'overlay';

  let navLinks = '';
  for (const link of links) {
    const href = link.url || link.href || '#';
    navLinks += `<a href="${esc(href)}" class="nav-link" style="color: ${isTransparent ? '#ffffff' : theme.textColor}; text-decoration: none; font-weight: 500; padding: 8px 16px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${esc(link.label)}</a>`;
  }

  const ctaBtn = p.ctaText ? `<a href="${esc(p.ctaLink || '#')}" style="${btnStyle(theme, 'primary', p.ctaColor)}">${esc(p.ctaText)}</a>` : '';

  // Determine logo HTML - could be image URL or text
  const isLogoImage = logoUrl || (logoText && (logoText.startsWith('http') || logoText.startsWith('data:')));
  const logoHtml = isLogoImage
    ? `<img src="${esc(logoUrl || logoText)}" alt="Logo" style="height: 32px; object-fit: contain;" />`
    : (logoText ? `<span style="font-family: ${theme.headingFont}; font-weight: 700; font-size: 18px; color: ${isTransparent ? '#ffffff' : theme.textColor};">${esc(logoText)}</span>` : '');

  return `<nav${anim} class="wb-navbar" style="background-color: ${isTransparent ? 'transparent' : bg}; padding: 16px 24px; font-family: ${theme.bodyFont}; position: ${p.sticky !== false ? 'sticky' : 'relative'}; top: 0; z-index: 50;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: flex; align-items: center; justify-content: space-between; max-width: 1200px; margin: 0 auto;">
    <div style="display: flex; align-items: center; gap: 12px;">
      ${logoHtml}
    </div>
    <div class="nav-links" style="display: flex; align-items: center; gap: 4px;">${navLinks}</div>
    ${ctaBtn ? `<div class="nav-cta">${ctaBtn}</div>` : ''}
    <button class="mobile-menu-toggle" style="display: none; background: none; border: none; cursor: pointer; padding: 8px; color: ${isTransparent ? '#ffffff' : theme.textColor};">${getIconSvg('menu', 'icon-md')}</button>
  </div>
  <div class="mobile-menu" style="display: none; padding: 16px 0; flex-direction: column; gap: 8px;">${navLinks}${ctaBtn ? `<div style="padding-top: 8px;">${ctaBtn}</div>` : ''}</div>
</nav>`;
}

function renderFooter(p: Record<string, any>, ctx: BlockHtmlContext, anim: string, compStyle?: React.CSSProperties): string {
  const { theme } = ctx;
  const bg = p.bgColor || '#1e293b';
  const textColor = p.textColor || '#94a3b8';
  const companyName = p.companyName || '';
  const description = p.description || '';
  const columns = toArray(p.columns || p.sections);
  const linkGroups = toArray(p.linkGroups);
  const links = toArray(p.links);
  const copyright = p.copyright || (companyName ? `© ${new Date().getFullYear()} ${companyName}. All rights reserved.` : '');
  const socialLinks = toArray(p.socialLinks);

  // Build columns from linkGroups (builder format) or columns (legacy format)
  let colsHtml = '';
  const colData = linkGroups.length > 0 ? linkGroups : columns;
  if (colData.length > 0) {
    const colItems = colData.map((col: any) => {
      const title = col.title || '';
      const colLinks = toArray(col.links).map((l: any) =>
        `<a href="${esc(l.url || l.href || '#')}" style="color: ${textColor}; text-decoration: none; display: block; padding: 4px 0; font-size: 14px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${esc(l.label || l.text || '')}</a>`
      ).join('');
      return `<div><h4 style="color: #ffffff; font-family: ${theme.headingFont}; font-weight: 600; margin-bottom: 16px; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">${esc(title)}</h4>${colLinks}</div>`;
    }).join('');
    colsHtml = `<div class="footer-columns" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 48px; margin-bottom: 32px;">${colItems}</div>`;
  }

  // Simple links row (for non-column footers)
  let linksHtml = '';
  if (links.length > 0 && colData.length === 0) {
    linksHtml = `<div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 24px; margin-bottom: 16px;">${
      links.map((l: any) => `<a href="${esc(l.url || l.href || '#')}" style="color: ${textColor}; text-decoration: none; font-size: 14px; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${esc(l.label || l.text || '')}</a>`).join('')
    }</div>`;
  }

  let socialHtml = '';
  if (socialLinks.length > 0 && p.showSocial !== false) {
    socialHtml = `<div style="display: flex; gap: 12px; justify-content: center; margin-bottom: 16px;">${
      socialLinks.map((s: any) =>
        `<a href="${esc(s.url || '#')}" target="_blank" rel="noopener" style="color: ${textColor}; transition: opacity 0.2s;" onmouseover="this.style.opacity='0.7'" onmouseout="this.style.opacity='1'">${getSocialIconSvg(s.platform || s.icon || 'link', 'icon-sm')}</a>`
      ).join('')
    }</div>`;
  }

  // Company name / description header for column footers
  const brandHtml = (companyName || description) && colData.length > 0
    ? `<div style="margin-bottom: 32px;"><h3 style="font-family: ${theme.headingFont}; font-weight: 700; font-size: 18px; color: #ffffff; margin-bottom: 8px;">${esc(companyName)}</h3>${description ? `<p style="font-size: 14px; color: ${textColor}; opacity: 0.7; max-width: 300px;">${esc(description)}</p>` : ''}</div>`
    : '';

  return `<footer${anim} style="background-color: ${bg}; padding: 64px 24px 32px; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 1200px; margin: 0 auto;">
    ${brandHtml}
    ${colsHtml}
    <div style="border-top: 1px solid rgba(255,255,255,0.1); padding-top: 24px; text-align: center;">
      ${linksHtml}
      ${socialHtml}
      ${copyright ? `<p style="color: ${textColor}; font-size: 13px; opacity: 0.6;">${esc(copyright)}</p>` : ''}
    </div>
  </div>
</footer>`;
}

function renderHero(p: Record<string, any>, ctx: BlockHtmlContext, anim: string, compStyle?: React.CSSProperties): string {
  const { theme } = ctx;
  const variant = p.variant || 'centered';
  const bgImage = p.backgroundImage || p.imageUrl || '';
  const overlay = p.overlayOpacity != null ? (p.overlayOpacity > 1 ? p.overlayOpacity / 100 : p.overlayOpacity) : 0.5;
  const title = p.heading || p.title || '';
  const subtitle = p.subheading || p.subtitle || '';
  const ctaText = p.ctaText || '';
  const ctaLink = p.ctaLink || '#';
  const cta2Text = p.cta2Text || p.secondaryCtaText || '';
  const cta2Link = p.cta2Link || p.secondaryCtaLink || '#';
  const height = p.height || 'large';
  const heightMap: Record<string, string> = { small: '400px', medium: '500px', large: '600px', full: '100vh' };
  const minH = heightMap[height] || '600px';
  const textColor = p.headingColor || p.textColor || '#ffffff';
  const subColor = p.subheadingColor || p.textColor || '#ffffff';

  // Handle buttons array (carousel-style hero)
  const buttons = toArray(p.buttons);
  let ctaHtml = '';
  let cta2Html = '';
  if (buttons.length > 0) {
    ctaHtml = buttons.map((b: any) =>
      `<a href="${esc(b.link || b.url || '#')}" style="${btnStyle(theme, b.variant || 'primary', b.color || p.ctaColor, b.textColor || p.ctaTextColor)}">${esc(b.text || '')}</a>`
    ).join('');
  } else {
    ctaHtml = ctaText ? `<a href="${esc(ctaLink)}" style="${btnStyle(theme, 'primary', p.ctaColor, p.ctaTextColor)}">${esc(ctaText)}</a>` : '';
    cta2Html = cta2Text ? `<a href="${esc(cta2Link)}" style="${btnStyle(theme, 'outline', p.cta2Color)}">${esc(cta2Text)}</a>` : '';
  }

  const bgStyle = bgImage
    ? `background-image: url('${esc(bgImage)}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor});`;

  const overlayDiv = bgImage
    ? `<div style="position: absolute; inset: 0; background: rgba(0,0,0,${overlay});"></div>`
    : '';

  const ctasDiv = (ctaHtml || cta2Html)
    ? `<div style="display: flex; gap: 12px; justify-content: ${variant === 'left-aligned' || variant === 'split' ? 'flex-start' : 'center'}; flex-wrap: wrap; margin-top: 24px;">${ctaHtml}${cta2Html}</div>`
    : '';

  // Handle carousel variant
  if (variant === 'carousel') {
    return renderHeroCarousel(p, ctx, anim, compStyle);
  }

  if (variant === 'split') {
    const sideImage = p.splitImage || p.sideImage || bgImage || '';
    return `<section${anim} class="wb-hero wb-hero-split" style="display: grid; grid-template-columns: 1fr 1fr; min-height: ${minH}; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div style="display: flex; flex-direction: column; justify-content: center; padding: 48px 64px; background-color: ${theme.backgroundColor};">
    ${title ? `<h1 style="font-family: ${theme.headingFont}; font-size: clamp(32px, 4vw, 56px); font-weight: 800; color: ${theme.textColor}; line-height: 1.1; margin-bottom: 16px;">${esc(title)}</h1>` : ''}
    ${subtitle ? `<p style="font-size: 18px; color: ${theme.secondaryColor}; opacity: 0.8; line-height: 1.6;">${esc(subtitle)}</p>` : ''}
    ${ctasDiv}
  </div>
  <div style="background-image: url('${esc(sideImage)}'); background-size: cover; background-position: center; min-height: 400px;"></div>
</section>`;
  }

  const align = variant === 'left-aligned' ? 'flex-start' : 'center';
  const textAlign = variant === 'left-aligned' ? 'left' : 'center';

  return `<section${anim} class="wb-hero" style="position: relative; min-height: ${minH}; display: flex; align-items: center; justify-content: center; ${bgStyle} font-family: ${theme.bodyFont}; overflow: hidden;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  ${overlayDiv}
  <div style="position: relative; z-index: 1; max-width: 800px; padding: 48px 24px; text-align: ${textAlign}; display: flex; flex-direction: column; align-items: ${align};">
    ${p.badge ? `<span style="display: inline-block; padding: 4px 16px; border-radius: 999px; background: rgba(255,255,255,0.15); color: ${textColor}; font-size: 13px; font-weight: 500; margin-bottom: 16px; backdrop-filter: blur(4px);">${esc(p.badge)}</span>` : ''}
    ${title ? `<h1 style="font-family: ${theme.headingFont}; font-size: clamp(36px, 5vw, 64px); font-weight: 800; color: ${textColor}; line-height: 1.1; margin-bottom: 16px;">${esc(title)}</h1>` : ''}
    ${subtitle ? `<p style="font-size: clamp(16px, 2vw, 20px); color: ${subColor}; opacity: 0.9; line-height: 1.6; max-width: 600px;">${esc(subtitle)}</p>` : ''}
    ${ctasDiv}
  </div>
</section>`;
}

/** Render a carousel hero with multiple slides */
function renderHeroCarousel(p: Record<string, any>, ctx: BlockHtmlContext, anim: string, compStyle?: React.CSSProperties): string {
  const { theme } = ctx;
  const slides = toArray(p.slides);
  const height = p.height || 'large';
  const heightMap: Record<string, string> = { small: '400px', medium: '500px', large: '600px', full: '100vh' };
  const minH = heightMap[height] || '600px';
  const autoPlayInterval = p.autoPlayInterval || 5;
  const showDots = p.showDots !== false;
  const showArrows = p.showArrows !== false;
  const alignment = p.alignment || 'center';

  if (slides.length === 0) {
    return renderHero({ ...p, variant: 'standard' }, ctx, anim, compStyle);
  }

  const slidesHtml = slides.map((slide: any, idx: number) => {
    const bgImage = slide.backgroundImage || '';
    const overlay = slide.overlayOpacity != null ? (slide.overlayOpacity > 1 ? slide.overlayOpacity / 100 : slide.overlayOpacity) : 0.4;
    const heading = slide.heading || '';
    const subheading = slide.subheading || '';
    const slideButtons = toArray(slide.buttons);

    const bgStyle = bgImage
      ? `background-image: url('${esc(bgImage)}'); background-size: cover; background-position: center;`
      : `background: linear-gradient(135deg, ${theme.primaryColor}, ${theme.secondaryColor});`;

    const buttonsHtml = slideButtons.length > 0
      ? `<div class="slide-buttons" style="display: flex; gap: 12px; justify-content: ${alignment === 'left' ? 'flex-start' : 'center'}; flex-wrap: wrap; margin-top: 24px;">${slideButtons.map((b: any) =>
          `<a href="${esc(b.link || '#')}" style="${btnStyle(theme, b.variant || 'primary')}">${esc(b.text || '')}</a>`
        ).join('')}</div>`
      : '';

    return `<div class="carousel-slide" style="position: absolute; inset: 0; ${bgStyle} opacity: ${idx === 0 ? 1 : 0}; transition: opacity 0.8s ease; z-index: ${idx === 0 ? 2 : 1}; pointer-events: ${idx === 0 ? 'auto' : 'none'};">
      ${bgImage ? `<div style="position: absolute; inset: 0; background: rgba(0,0,0,${overlay});"></div>` : ''}
      <div class="slide-content" style="position: relative; z-index: 1; display: flex; flex-direction: column; align-items: ${alignment === 'left' ? 'flex-start' : 'center'}; justify-content: center; height: 100%; padding: 48px 64px; max-width: 900px; ${alignment === 'center' ? 'margin: 0 auto; text-align: center;' : ''}">
        ${heading ? `<h1 style="font-family: ${theme.headingFont}; font-size: clamp(32px, 5vw, 56px); font-weight: 800; color: #ffffff; line-height: 1.1; margin-bottom: 16px;">${esc(heading)}</h1>` : ''}
        ${subheading ? `<p style="font-size: clamp(16px, 2vw, 20px); color: #ffffff; opacity: 0.9; line-height: 1.6; max-width: 600px;">${esc(subheading)}</p>` : ''}
        ${buttonsHtml}
      </div>
    </div>`;
  }).join('');

  const dotsHtml = showDots && slides.length > 1
    ? `<div class="carousel-dots" style="position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 10; display: flex; gap: 8px;">${slides.map((_: any, i: number) =>
        `<button class="carousel-dot" style="width: 10px; height: 10px; border-radius: 50%; background: #ffffff; border: none; cursor: pointer; opacity: ${i === 0 ? 1 : 0.5}; transition: opacity 0.3s, transform 0.3s; transform: ${i === 0 ? 'scale(1.2)' : 'scale(1)'}; padding: 0;"></button>`
      ).join('')}</div>`
    : '';

  const arrowsHtml = showArrows && slides.length > 1
    ? `<button class="slide-arrow slide-arrow-prev" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center;">${getIconSvg('chevron-left', 'icon-md')}</button>
      <button class="slide-arrow slide-arrow-next" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); z-index: 10; width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.2); backdrop-filter: blur(4px); border: none; cursor: pointer; color: #ffffff; display: flex; align-items: center; justify-content: center;">${getIconSvg('chevron-right', 'icon-md')}</button>`
    : '';

  return `<section${anim} class="wb-hero wb-hero-carousel" style="position: relative; min-height: ${minH}; overflow: hidden; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}" data-autoplay-interval="${autoPlayInterval}">
  ${slidesHtml}
  ${arrowsHtml}
  ${dotsHtml}
</section>`;
}

function renderSection(component: BuilderComponent, ctx: BlockHtmlContext): string {
  const p = component.props || {};
  const anim = animAttr(component);
  const children = (component.children || []).map(c => componentToHtml(c, ctx)).join('');
  const bg = p.bgColor ? `background-color: ${p.bgColor};` : '';
  return `<section${anim} style="${bg} padding: 48px 24px; font-family: ${ctx.theme.bodyFont};"><div class="container">${children}</div></section>`;
}

function renderColumns(component: BuilderComponent, ctx: BlockHtmlContext): string {
  const p = component.props || {};
  const cols = toArray(component.children);
  const colCount = p.columns || cols.length || 2;
  const gap = p.gap || 24;
  const anim = animAttr(component);

  const colsHtml = cols.map(c => `<div>${componentToHtml(c, ctx)}</div>`).join('');
  return `<div${anim} class="wb-columns" style="display: grid; grid-template-columns: repeat(${colCount}, 1fr); gap: ${gap}px; padding: 24px;">${colsHtml}</div>`;
}

function renderHeading(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const level = p.level || 'h2';
  const text = p.text || '';
  const alignment = p.alignment || 'left';
  const color = p.color || theme.textColor;
  const font = p.font || theme.headingFont;
  const subtitle = p.subtitle || '';
  const badge = p.badge || '';
  const icon = p.icon || '';
  const decoration = p.decoration || 'none';
  const sizeMap: Record<string, number> = { h1: 48, h2: 36, h3: 30, h4: 24, h5: 20, h6: 18 };
  const size = sizeMap[level] || 36;

  let badgeHtml = '';
  if (badge) {
    badgeHtml = `<span style="display: inline-block; padding: 4px 12px; border-radius: 999px; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 12px; background-color: ${(p.badgeColor || theme.primaryColor)}15; color: ${p.badgeColor || theme.primaryColor};">${esc(badge)}</span>`;
  }

  let iconHtml = '';
  if (icon) {
    iconHtml = `<span style="color: ${theme.primaryColor}; margin-right: 12px; display: inline-flex; vertical-align: middle;">${getIconSvg(icon, 'icon-lg')}</span>`;
  }

  let decoHtml = '';
  if (decoration === 'underline') {
    decoHtml = `<div style="width: 60px; height: 4px; border-radius: 2px; background-color: ${theme.primaryColor}; margin-top: 12px; ${alignment === 'center' ? 'margin-left: auto; margin-right: auto;' : alignment === 'right' ? 'margin-left: auto;' : ''}"></div>`;
  } else if (decoration === 'gradient-underline') {
    decoHtml = `<div style="width: 100px; height: 4px; border-radius: 2px; background: linear-gradient(90deg, ${theme.primaryColor}, ${theme.primaryColor}40); margin-top: 12px; ${alignment === 'center' ? 'margin-left: auto; margin-right: auto;' : ''}"></div>`;
  } else if (decoration === 'dot') {
    decoHtml = `<div style="display: flex; gap: 6px; margin-top: 12px; ${alignment === 'center' ? 'justify-content: center;' : ''}"><span style="width: 8px; height: 8px; border-radius: 50%; background: ${theme.primaryColor};"></span><span style="width: 8px; height: 8px; border-radius: 50%; background: ${theme.primaryColor}60;"></span><span style="width: 8px; height: 8px; border-radius: 50%; background: ${theme.primaryColor}30;"></span></div>`;
  }

  const subtitleHtml = subtitle ? `<p style="margin-top: 8px; font-size: ${Math.round(size * 0.45)}px; color: ${color}; opacity: 0.6; font-family: ${theme.bodyFont};">${esc(subtitle)}</p>` : '';

  return `<div${anim} style="padding: 24px; text-align: ${alignment}; font-family: ${font};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div style="max-width: 1200px; margin: 0 auto;">
    ${badgeHtml}
    <${level} style="font-size: clamp(${Math.round(size * 0.7)}px, 3vw, ${size}px); font-weight: 700; color: ${color}; line-height: 1.2; font-family: ${font};">${iconHtml}${esc(text)}</${level}>
    ${subtitleHtml}
    ${decoHtml}
  </div>
</div>`;
}

function renderAbout(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const description = p.description || '';
  const imageUrl = p.imageUrl || '';
  const stats = toArray(p.stats);
  const layout = p.layout || p.imagePosition || 'left';

  const imageHtml = imageUrl
    ? `<div style="border-radius: ${theme.borderRadius}px; overflow: hidden;"><img src="${esc(imageUrl)}" alt="${esc(title)}" style="width: 100%; height: 100%; object-fit: cover; min-height: 300px;" /></div>`
    : `<div style="background: ${theme.primaryColor}12; border-radius: ${theme.borderRadius}px; min-height: 300px; display: flex; align-items: center; justify-content: center;"><span style="color: ${theme.secondaryColor}; opacity: 0.5;">Image</span></div>`;

  let statsHtml = '';
  if (stats.length > 0) {
    statsHtml = `<div style="display: flex; gap: 32px; margin-top: 24px;">${
      stats.map((s: any) => `<div><div style="font-size: 24px; font-weight: 700; color: ${theme.primaryColor};">${esc(String(s.value || s.number || ''))}</div><div style="font-size: 13px; color: ${theme.secondaryColor}; opacity: 0.7;">${esc(String(s.label || ''))}</div></div>`).join('')
    }</div>`;
  }

  const textHtml = `<div style="display: flex; flex-direction: column; justify-content: center;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 16px;">${esc(title)}</h2>
    <div style="color: ${theme.secondaryColor}; line-height: 1.7; opacity: 0.8;">${description}</div>
    ${statsHtml}
  </div>`;

  const gridOrder = layout === 'right' ? `${textHtml}${imageHtml}` : `${imageHtml}${textHtml}`;

  return `<section${anim} class="wb-about" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;">${gridOrder}</div>
</section>`;
}

function renderFeatures(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const subtitle = p.subtitle || '';
  const features = toArray(p.features);
  const columns = p.columns || 3;
  const variant = p.variant || 'cards';

  const headerHtml = title ? `<div style="text-align: center; margin-bottom: 48px;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor};">${esc(title)}</h2>
    ${subtitle ? `<p style="color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 8px; max-width: 600px; margin-left: auto; margin-right: auto;">${esc(subtitle)}</p>` : ''}
  </div>` : '';

  const cardsHtml = features.map((f: any) => {
    const icon = f.icon ? `<div style="width: 48px; height: 48px; border-radius: 12px; background: ${theme.primaryColor}12; display: flex; align-items: center; justify-content: center; color: ${theme.primaryColor}; margin-bottom: 16px;">${getIconSvg(f.icon, 'icon-md')}</div>` : '';
    return `<div style="padding: 24px; border-radius: ${theme.borderRadius}px; ${variant === 'cards' ? `border: 1px solid #e2e8f0; background: ${theme.backgroundColor};` : ''}">
      ${icon}
      <h3 style="font-family: ${theme.headingFont}; font-size: 18px; font-weight: 600; color: ${theme.textColor}; margin-bottom: 8px;">${esc(f.title || '')}</h3>
      <p style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; line-height: 1.6;">${esc(f.description || '')}</p>
    </div>`;
  }).join('');

  return `<section${anim} class="wb-features" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">
    ${headerHtml}
    <div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 24px;">${cardsHtml}</div>
  </div>
</section>`;
}

function renderServiceCard(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const subtitle = p.subtitle || '';
  const services = toArray(p.services);
  const columns = p.columns || 3;

  const headerHtml = title ? `<div style="text-align: center; margin-bottom: 48px;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor};">${esc(title)}</h2>
    ${subtitle ? `<p style="color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 8px;">${esc(subtitle)}</p>` : ''}
  </div>` : '';

  const cardsHtml = services.map((s: any) => {
    const icon = s.icon ? `<div style="color: ${theme.primaryColor}; margin-bottom: 16px;">${getIconSvg(s.icon, 'icon-lg')}</div>` : '';
    const price = s.price ? `<p style="font-weight: 600; color: ${theme.primaryColor}; margin-top: 12px;">${esc(s.price)}</p>` : '';
    return `<div style="padding: 32px; border-radius: ${theme.borderRadius}px; border: 1px solid #e2e8f0; text-align: center; transition: transform 0.2s, box-shadow 0.2s;">
      ${icon}
      <h3 style="font-family: ${theme.headingFont}; font-size: 18px; font-weight: 600; color: ${theme.textColor}; margin-bottom: 8px;">${esc(s.title || '')}</h3>
      <p style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; line-height: 1.6;">${esc(s.description || '')}</p>
      ${price}
    </div>`;
  }).join('');

  return `<section${anim} class="wb-services" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">${headerHtml}<div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 24px;">${cardsHtml}</div></div>
</section>`;
}

function renderPricing(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const subtitle = p.subtitle || '';
  const plans = toArray(p.plans);

  const headerHtml = title ? `<div style="text-align: center; margin-bottom: 48px;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor};">${esc(title)}</h2>
    ${subtitle ? `<p style="color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 8px;">${esc(subtitle)}</p>` : ''}
  </div>` : '';

  const cardsHtml = plans.map((plan: any) => {
    const isPopular = plan.popular || plan.highlighted;
    const border = isPopular ? `border: 2px solid ${theme.primaryColor};` : 'border: 1px solid #e2e8f0;';
    const features = toArray(plan.features).map((f: any) => {
      const text = typeof f === 'string' ? f : f.text || f.name || '';
      const included = typeof f === 'string' ? true : f.included !== false;
      return `<li style="padding: 8px 0; display: flex; align-items: center; gap: 8px; color: ${included ? theme.textColor : theme.secondaryColor}; opacity: ${included ? 1 : 0.4};">${getIconSvg(included ? 'check' : 'x', 'icon-sm')} ${esc(text)}</li>`;
    }).join('');

    return `<div style="padding: 32px; border-radius: ${theme.borderRadius}px; ${border} background: ${theme.backgroundColor}; position: relative; ${isPopular ? 'transform: scale(1.05); box-shadow: 0 20px 40px -12px rgba(0,0,0,0.15);' : ''}">
      ${isPopular ? `<div style="position: absolute; top: -12px; left: 50%; transform: translateX(-50%); padding: 4px 16px; border-radius: 999px; background: ${theme.primaryColor}; color: #ffffff; font-size: 12px; font-weight: 600;">Popular</div>` : ''}
      <h3 style="font-family: ${theme.headingFont}; font-size: 20px; font-weight: 600; color: ${theme.textColor};">${esc(plan.name || plan.title || '')}</h3>
      ${plan.description ? `<p style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 4px;">${esc(plan.description)}</p>` : ''}
      <div style="margin: 24px 0;">
        <span style="font-size: 42px; font-weight: 800; color: ${theme.textColor};">${esc(plan.price || '$0')}</span>
        ${plan.period ? `<span style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.6;">/${esc(plan.period)}</span>` : ''}
      </div>
      <ul style="list-style: none; padding: 0; margin: 0 0 24px 0; font-size: 14px;">${features}</ul>
      <a href="${esc(plan.ctaLink || '#')}" style="${btnStyle(theme, isPopular ? 'primary' : 'outline')} width: 100%; text-align: center; box-sizing: border-box;">${esc(plan.ctaText || plan.buttonText || 'Get Started')}</a>
    </div>`;
  }).join('');

  return `<section${anim} class="wb-pricing" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">${headerHtml}<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: start;">${cardsHtml}</div></div>
</section>`;
}

function renderTestimonials(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const testimonials = toArray(p.testimonials || p.reviews);
  const columns = p.columns || 3;

  const headerHtml = title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 48px;">${esc(title)}</h2>` : '';

  const cardsHtml = testimonials.map((t: any) => {
    const avatar = t.avatar || t.image || '';
    const rating = t.rating || 5;
    return `<div style="padding: 24px; border-radius: ${theme.borderRadius}px; border: 1px solid #e2e8f0; background: ${theme.backgroundColor};">
      <div style="display: flex; gap: 4px; margin-bottom: 12px;">${renderStars(rating, theme.primaryColor)}</div>
      <p style="font-size: 14px; color: ${theme.textColor}; line-height: 1.7; margin-bottom: 16px; font-style: italic;">"${esc(t.text || t.content || t.quote || '')}"</p>
      <div style="display: flex; align-items: center; gap: 12px;">
        ${avatar ? `<img src="${esc(avatar)}" alt="${esc(t.name || '')}" style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;" />` : `<div style="width: 40px; height: 40px; border-radius: 50%; background: ${theme.primaryColor}15; display: flex; align-items: center; justify-content: center; font-weight: 600; color: ${theme.primaryColor};">${(t.name || '?')[0]}</div>`}
        <div>
          <div style="font-weight: 600; font-size: 14px; color: ${theme.textColor};">${esc(t.name || '')}</div>
          ${t.role || t.title || t.company ? `<div style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.7;">${esc(t.role || t.title || '')}${t.company ? ` · ${esc(t.company)}` : ''}</div>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');

  return `<section${anim} class="wb-testimonials" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">${headerHtml}<div style="display: grid; grid-template-columns: repeat(${Math.min(columns, 3)}, 1fr); gap: 24px;">${cardsHtml}</div></div>
</section>`;
}

function renderStats(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const stats = toArray(p.stats);

  const headerHtml = title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 48px;">${esc(title)}</h2>` : '';

  const statsHtml = stats.map((s: any) => {
    const icon = s.icon ? `<div style="color: ${theme.primaryColor}; margin-bottom: 8px;">${getIconSvg(s.icon, 'icon-md')}</div>` : '';
    return `<div style="text-align: center; padding: 24px;">
      ${icon}
      <div style="font-size: 36px; font-weight: 800; color: ${theme.primaryColor};">${esc(s.value || s.number || '0')}</div>
      <div style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 4px;">${esc(s.label || '')}</div>
    </div>`;
  }).join('');

  return `<section${anim} class="wb-stats" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">${headerHtml}<div style="display: grid; grid-template-columns: repeat(${Math.min(stats.length, 4)}, 1fr); gap: 24px;">${statsHtml}</div></div>
</section>`;
}

function renderCtaBanner(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.heading || p.title || '';
  const subtitle = p.subheading || p.subtitle || p.description || '';
  const ctaText = p.ctaText || p.buttonText || '';
  const ctaLink = p.ctaLink || p.buttonLink || '#';
  const bgColor = p.bgColor || theme.primaryColor;
  const textColor = p.textColor || '#ffffff';

  return `<section${anim} class="wb-cta wb-cta-banner" style="padding: 64px 24px; background: linear-gradient(135deg, ${bgColor}, ${bgColor}dd); text-align: center; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">
    <h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${textColor}; margin-bottom: 12px;">${esc(title)}</h2>
    ${subtitle ? `<p style="color: ${textColor}; opacity: 0.9; margin-bottom: 24px; font-size: 16px;">${esc(subtitle)}</p>` : ''}
    ${ctaText ? `<a href="${esc(ctaLink)}" style="display: inline-block; padding: 14px 32px; background: #ffffff; color: ${bgColor}; border-radius: ${theme.borderRadius}px; font-weight: 600; text-decoration: none; transition: transform 0.2s;">${esc(ctaText)}</a>` : ''}
  </div>
</section>`;
}

function renderFaq(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const items = toArray(p.items || p.faqs);
  const variant = p.variant || 'default';

  const headerHtml = title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 48px;">${esc(title)}</h2>` : '';

  const faqsHtml = items.map((item: any, i: number) => {
    const q = item.question || item.title || '';
    const a = item.answer || item.content || '';
    return `<div class="faq-item" style="border-bottom: 1px solid #e2e8f0; ${variant === 'cards' ? `border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px; margin-bottom: 8px; padding: 0;` : ''}">
      <button class="faq-toggle" style="width: 100%; text-align: left; padding: 16px ${variant === 'cards' ? '20px' : '0'}; display: flex; align-items: center; justify-content: space-between; background: none; border: none; cursor: pointer; font-family: ${theme.bodyFont}; font-size: 16px; font-weight: 600; color: ${theme.textColor}; gap: 12px;">
        <span>${esc(q)}</span>
        <span class="faq-icon" style="transition: transform 0.3s; flex-shrink: 0;">${getIconSvg('chevron-down', 'icon-sm')}</span>
      </button>
      <div class="faq-answer" style="max-height: 0; overflow: hidden; transition: max-height 0.3s ease; padding: 0 ${variant === 'cards' ? '20px' : '0'};">
        <div style="padding-bottom: 16px; color: ${theme.secondaryColor}; font-size: 14px; line-height: 1.7;">${a}</div>
      </div>
    </div>`;
  }).join('');

  return `<section${anim} class="wb-faq" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 800px;">${headerHtml}${faqsHtml}</div>
</section>`;
}

function renderContactForm(p: Record<string, any>, ctx: BlockHtmlContext, anim: string, compStyle?: React.CSSProperties): string {
  const { theme } = ctx;
  const title = p.title || '';
  const subtitle = p.subtitle || '';
  const buttonText = p.buttonText || p.submitText || 'Send Message';
  const webhookUrl = p.formSettings?.webhookUrl || p.webhookUrl || ctx.formActionUrl || '';
  const emailTo = p.formSettings?.emailTo || p.emailTo || '';

  // Normalize fields: builder stores string[] like ['name', 'email', 'message']
  // but we need object[] like [{name, label, type, required}]
  const fieldTypeMap: Record<string, { label: string; type: string }> = {
    name: { label: 'Name', type: 'text' },
    email: { label: 'Email', type: 'email' },
    message: { label: 'Message', type: 'textarea' },
    phone: { label: 'Phone', type: 'tel' },
    subject: { label: 'Subject', type: 'text' },
    company: { label: 'Company', type: 'text' },
    address: { label: 'Address', type: 'text' },
    city: { label: 'City', type: 'text' },
    country: { label: 'Country', type: 'text' },
    website: { label: 'Website', type: 'url' },
  };

  const rawFields = toArray(p.fields);
  const fields = rawFields.length > 0
    ? rawFields.map((f: any) => {
        // If field is a string (builder format), convert to object
        if (typeof f === 'string') {
          const mapped = fieldTypeMap[f.toLowerCase()] || { label: f.charAt(0).toUpperCase() + f.slice(1), type: 'text' };
          return { name: f, label: mapped.label, type: mapped.type, required: f === 'name' || f === 'email' || f === 'message' };
        }
        return f;
      })
    : [
        { name: 'name', label: 'Name', type: 'text', required: true },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'message', label: 'Message', type: 'textarea', required: true },
      ];

  const action = webhookUrl || (emailTo ? `mailto:${emailTo}` : '#');
  const method = emailTo ? 'POST' : 'POST';
  const enctype = emailTo ? ' enctype="text/plain"' : '';

  const inputStyle = `width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px; font-family: ${theme.bodyFont}; font-size: 14px; outline: none; box-sizing: border-box;`;

  const fieldsHtml = fields.map((f: any) => {
    const label = f.label || f.name || '';
    const req = f.required ? ' required' : '';
    if (f.type === 'textarea') {
      return `<div><label style="display: block; font-size: 13px; font-weight: 500; color: ${theme.textColor}; margin-bottom: 6px;">${esc(label)}</label><textarea name="${esc(f.name || label)}" rows="4" style="${inputStyle} resize: vertical;"${req}></textarea></div>`;
    }
    if (f.type === 'select') {
      const options = toArray(f.options).map((o: string) => `<option value="${esc(String(o))}">${esc(String(o))}</option>`).join('');
      return `<div><label style="display: block; font-size: 13px; font-weight: 500; color: ${theme.textColor}; margin-bottom: 6px;">${esc(label)}</label><select name="${esc(f.name || label)}" style="${inputStyle}"${req}><option value="">Select...</option>${options}</select></div>`;
    }
    return `<div><label style="display: block; font-size: 13px; font-weight: 500; color: ${theme.textColor}; margin-bottom: 6px;">${esc(label)}</label><input type="${f.type || 'text'}" name="${esc(f.name || label)}" style="${inputStyle}"${req} /></div>`;
  }).join('');

  const headerHtml = title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 8px;">${esc(title)}</h2>` : '';
  const subtitleHtml = subtitle ? `<p style="color: ${theme.secondaryColor}; opacity: 0.7; text-align: center; margin-bottom: 32px;">${esc(subtitle)}</p>` : '';

  return `<section${anim} class="wb-contact-form" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 600px;">
    ${headerHtml}${subtitleHtml}
    <form action="${esc(action)}" method="${method}"${enctype} class="wb-form" style="display: flex; flex-direction: column; gap: 16px;">
      ${fieldsHtml}
      <button type="submit" style="${btnStyle(theme, 'primary', p.buttonColor, p.buttonTextColor)} width: 100%; text-align: center; cursor: pointer;">${esc(buttonText)}</button>
    </form>
  </div>
</section>`;
}

function renderNewsletter(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const subtitle = p.subtitle || '';
  const buttonText = p.buttonText || 'Subscribe';
  const placeholder = p.placeholder || 'Enter your email';
  const variant = p.variant || 'inline';

  const webhookUrl = p.formSettings?.webhookUrl || '';
  const action = webhookUrl || '#';

  if (variant === 'banner') {
    return `<section${anim} style="padding: 24px; background-color: ${theme.primaryColor}; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
    <div><h2 style="font-size: 18px; font-weight: 700; color: #ffffff; font-family: ${theme.headingFont};">${esc(title)}</h2>${subtitle ? `<p style="font-size: 14px; color: #ffffff; opacity: 0.8;">${esc(subtitle)}</p>` : ''}</div>
    <form action="${esc(action)}" method="POST" style="display: flex; gap: 12px;"><input type="email" name="email" required placeholder="${esc(placeholder)}" style="padding: 12px 16px; border: none; border-radius: ${theme.borderRadius}px; font-size: 14px; width: 220px;" /><button type="submit" style="padding: 12px 24px; border-radius: ${theme.borderRadius}px; background: #ffffff; color: ${theme.primaryColor}; font-weight: 600; border: none; cursor: pointer;">${esc(buttonText)}</button></form>
  </div>
</section>`;
  }

  return `<section${anim} class="wb-newsletter" style="padding: 64px 24px; background-color: ${p.bgColor || theme.primaryColor + '08'}; text-align: center; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 500px;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 24px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 8px;">${esc(title)}</h2>
    ${subtitle ? `<p style="color: ${theme.secondaryColor}; opacity: 0.7; margin-bottom: 24px; font-size: 14px;">${esc(subtitle)}</p>` : '<div style="margin-bottom: 24px;"></div>'}
    <form action="${esc(action)}" method="POST" style="display: flex; gap: 12px; max-width: 400px; margin: 0 auto;">
      <input type="email" name="email" required placeholder="${esc(placeholder)}" style="flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px; font-size: 14px; outline: none;" />
      <button type="submit" style="${btnStyle(theme)} white-space: nowrap;">${esc(buttonText)}</button>
    </form>
  </div>
</section>`;
}

function renderButton(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const text = p.text || 'Click me';
  const link = p.link || '#';
  const variant = p.variant || 'primary';
  const fullWidth = p.fullWidth;
  const icon = p.icon ? getIconSvg(p.icon, 'icon-sm') : '';
  const iconPos = p.iconPosition || 'left';

  const style = btnStyle(theme, variant, p.color, p.textColor);
  const content = icon
    ? (iconPos === 'right' ? `${esc(text)} ${icon}` : `${icon} ${esc(text)}`)
    : esc(text);

  return `<div${anim} style="padding: 16px 24px; display: flex; ${fullWidth ? '' : 'justify-content: center;'}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <a href="${esc(link)}" style="${style} ${fullWidth ? 'width: 100%; text-align: center; box-sizing: border-box;' : ''} display: inline-flex; align-items: center; gap: 8px;">${content}</a>
</div>`;
}

function renderButtonGroup(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const buttons = toArray(p.buttons);
  const alignment = p.alignment || 'center';
  const justify = alignment === 'center' ? 'center' : alignment === 'right' ? 'flex-end' : 'flex-start';

  const btnsHtml = buttons.map((b: any) => {
    const variant = b.variant || 'primary';
    const icon = b.icon ? getIconSvg(b.icon, 'icon-sm') : '';
    return `<a href="${esc(b.link || b.url || '#')}" style="${btnStyle(theme, variant, b.color, b.textColor)} display: inline-flex; align-items: center; gap: 8px;">${icon}${esc(b.text || '')}</a>`;
  }).join('');

  return `<div${anim} style="padding: 16px 24px; display: flex; gap: 12px; justify-content: ${justify}; flex-wrap: wrap;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">${btnsHtml}</div>`;
}

function renderSocialLinks(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const links = toArray(p.links);

  const linksHtml = links.map((link: any) =>
    `<a href="${esc(link.url || '#')}" target="_blank" rel="noopener" style="width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background: ${theme.primaryColor}15; color: ${theme.primaryColor}; transition: transform 0.2s;" title="${esc(link.platform || '')}">${getSocialIconSvg(link.platform || 'link', 'icon-sm')}</a>`
  ).join('');

  return `<section${anim} style="padding: 48px 24px; text-align: center; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">
    ${title ? `<h3 style="font-size: 18px; font-weight: 600; color: ${theme.textColor}; font-family: ${theme.headingFont}; margin-bottom: 24px;">${esc(title)}</h3>` : ''}
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 16px;">${linksHtml}</div>
  </div>
</section>`;
}

function renderTabs(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const tabs = toArray(p.tabs);

  const tabBtns = tabs.map((t: any, i: number) =>
    `<button class="tab-button${i === 0 ? ' active' : ''}" data-tab="${i}" style="padding: 10px 16px; font-size: 14px; font-weight: 500; border: none; border-bottom: 2px solid ${i === 0 ? theme.primaryColor : 'transparent'}; background: none; cursor: pointer; color: ${i === 0 ? theme.primaryColor : theme.secondaryColor}; opacity: ${i === 0 ? 1 : 0.6}; font-family: ${theme.bodyFont};">${esc(t.label || `Tab ${i + 1}`)}</button>`
  ).join('');

  const tabPanels = tabs.map((t: any, i: number) =>
    `<div class="tab-panel${i === 0 ? ' active' : ''}" data-tab="${i}" style="display: ${i === 0 ? 'block' : 'none'}; padding: 16px 0; color: ${theme.textColor}; font-size: 14px; line-height: 1.7;">${t.content || ''}</div>`
  ).join('');

  return `<section${anim} class="wb-tabs" style="padding: 48px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 800px;">
    <div class="tab-buttons" style="display: flex; border-bottom: 1px solid #e2e8f0; gap: 4px; margin-bottom: 24px;">${tabBtns}</div>
    <div class="tab-panels" style="min-height: 100px;">${tabPanels}</div>
  </div>
</section>`;
}

function renderImageText(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const description = p.description || '';
  const imageUrl = p.imageUrl || '';
  const imagePosition = p.imagePosition || 'left';

  const imgHtml = imageUrl
    ? `<div style="border-radius: ${theme.borderRadius}px; overflow: hidden; aspect-ratio: 16/9;"><img src="${esc(imageUrl)}" alt="${esc(title)}" style="width: 100%; height: 100%; object-fit: cover;" /></div>`
    : `<div style="background: ${theme.primaryColor}08; border-radius: ${theme.borderRadius}px; aspect-ratio: 16/9; display: flex; align-items: center; justify-content: center;"><span style="color: ${theme.secondaryColor}; opacity: 0.5;">No image</span></div>`;

  const textHtml = `<div style="display: flex; flex-direction: column; justify-content: center;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 16px;">${esc(title)}</h2>
    <div style="color: ${theme.secondaryColor}; opacity: 0.8; line-height: 1.7; font-family: ${theme.bodyFont};">${description}</div>
  </div>`;

  const order = imagePosition === 'right' ? `${textHtml}${imgHtml}` : `${imgHtml}${textHtml}`;

  return `<section${anim} class="wb-image-text" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: center;">${order}</div>
</section>`;
}

function renderImageGallery(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const images = toArray(p.images);
  const columns = p.columns || 3;
  const gap = p.gap || 8;

  const imgsHtml = images.length > 0
    ? images.map((img: any) => {
        const imgSrc = typeof img === 'string' ? img : (img.url || img.src || '');
        return `<div style="aspect-ratio: 1; border-radius: ${theme.borderRadius}px; overflow: hidden;"><img src="${esc(imgSrc)}" alt="" style="width: 100%; height: 100%; object-fit: cover;" loading="lazy" /></div>`;
      }).join('')
    : Array.from({ length: 3 }).map((_, i) =>
      `<div style="aspect-ratio: 1; border-radius: ${theme.borderRadius}px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;"><span style="color: #94a3b8; font-size: 12px;">Image ${i + 1}</span></div>`
    ).join('');

  return `<section${anim} style="padding: 32px 24px;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: ${gap}px;">${imgsHtml}</div>
</section>`;
}

function renderMasonryGallery(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const images = toArray(p.images);
  const columns = p.columns || 3;

  const imgsHtml = images.map((img: any) => {
    const imgSrc = typeof img === 'string' ? img : (img.url || img.src || '');
    return `<div style="break-inside: avoid; margin-bottom: 8px;"><img src="${esc(imgSrc)}" alt="" style="width: 100%; border-radius: ${theme.borderRadius}px;" loading="lazy" /></div>`;
  }).join('');

  return `<section${anim} style="padding: 32px 24px;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}"><div class="container" style="columns: ${columns}; column-gap: 8px;">${imgsHtml}</div></section>`;
}

function renderVideoEmbed(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const url = p.url || '';
  const aspectRatio = p.aspectRatio || '16/9';

  let embedUrl = url;
  if (url.includes('youtube.com/watch')) {
    const vid = new URL(url).searchParams.get('v');
    embedUrl = `https://www.youtube.com/embed/${vid}${p.autoplay ? '?autoplay=1&mute=1' : ''}`;
  } else if (url.includes('youtu.be/')) {
    const vid = url.split('youtu.be/')[1]?.split('?')[0];
    embedUrl = `https://www.youtube.com/embed/${vid}${p.autoplay ? '?autoplay=1&mute=1' : ''}`;
  } else if (url.includes('vimeo.com/')) {
    const vid = url.split('vimeo.com/')[1]?.split('?')[0];
    embedUrl = `https://player.vimeo.com/video/${vid}${p.autoplay ? '?autoplay=1&muted=1' : ''}`;
  }

  return `<section${anim} style="padding: 32px 24px;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 900px;">
    ${p.title ? `<h3 style="font-family: ${theme.headingFont}; font-size: 20px; font-weight: 600; color: ${theme.textColor}; margin-bottom: 16px; text-align: center;">${esc(p.title)}</h3>` : ''}
    <div style="aspect-ratio: ${aspectRatio}; border-radius: ${theme.borderRadius}px; overflow: hidden;">
      <iframe src="${esc(embedUrl)}" frameborder="0" allowfullscreen style="width: 100%; height: 100%;" allow="autoplay; encrypted-media"></iframe>
    </div>
  </div>
</section>`;
}

function renderMap(p: Record<string, any>, anim: string, compStyle?: React.CSSProperties): string {
  const lat = p.lat || p.latitude || 0;
  const lng = p.lng || p.longitude || 0;
  const zoom = p.zoom || 13;
  const height = p.height || 400;

  return `<div${anim} style="padding: 24px;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <iframe src="https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik" style="width: 100%; height: ${height}px; border: none; border-radius: 8px;"></iframe>
</div>`;
}

function renderTimeline(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const items = toArray(p.items);

  const headerHtml = title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 48px;">${esc(title)}</h2>` : '';

  const itemsHtml = items.map((item: any) =>
    `<div style="position: relative; padding-left: 48px; padding-bottom: 32px;">
      <div style="position: absolute; left: 10px; top: 4px; width: 12px; height: 12px; border-radius: 50%; border: 2px solid ${theme.primaryColor}; background: ${theme.backgroundColor};"></div>
      <span style="font-size: 12px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.05em; color: ${theme.primaryColor};">${esc(String(item.date || ''))}</span>
      <h3 style="font-size: 18px; font-weight: 600; color: ${theme.textColor}; margin-top: 4px;">${esc(String(item.title || ''))}</h3>
      <div style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 4px; line-height: 1.6;">${item.description || ''}</div>
    </div>`
  ).join('');

  return `<section${anim} class="wb-timeline" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 800px;">
    ${headerHtml}
    <div style="position: relative; padding-left: 0;">
      <div style="position: absolute; left: 16px; top: 0; bottom: 0; width: 2px; background: ${theme.primaryColor}30;"></div>
      ${itemsHtml}
    </div>
  </div>
</section>`;
}

function renderLogoCloud(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const logos = toArray(p.logos);

  const logosHtml = logos.length > 0
    ? logos.map((logo: any) => {
        const logoSrc = typeof logo === 'string' ? logo : (logo.url || logo.src || '');
        return `<img src="${esc(logoSrc)}" alt="" style="height: 32px; object-fit: contain; opacity: 0.5; filter: grayscale(1); transition: opacity 0.2s, filter 0.2s;" onmouseover="this.style.opacity='1';this.style.filter='grayscale(0)'" onmouseout="this.style.opacity='0.5';this.style.filter='grayscale(1)'" />`;
      }).join('')
    : Array.from({ length: 5 }).map((_, i) =>
      `<div style="height: 40px; width: 96px; border-radius: 4px; background: #f1f5f9; display: flex; align-items: center; justify-content: center;"><span style="font-size: 10px; color: #94a3b8;">Logo ${i + 1}</span></div>`
    ).join('');

  return `<section${anim} style="padding: 48px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">
    ${title ? `<p style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; text-align: center; color: ${theme.secondaryColor}; opacity: 0.5; margin-bottom: 32px;">${esc(title)}</p>` : ''}
    <div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: center; gap: 32px;">${logosHtml}</div>
  </div>
</section>`;
}

function renderTeamGrid(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const subtitle = p.subtitle || '';
  const members = toArray(p.members);
  const columns = p.columns || 4;

  const headerHtml = title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: ${subtitle ? '8px' : '48px'};">${esc(title)}</h2>${subtitle ? `<p style="color: ${theme.secondaryColor}; opacity: 0.7; text-align: center; margin-bottom: 48px; max-width: 600px; margin-left: auto; margin-right: auto;">${esc(subtitle)}</p>` : ''}` : '';

  const membersHtml = members.map((m: any) => {
    const avatar = m.avatar || '';
    return `<div style="text-align: center;">
      <div style="width: 96px; height: 96px; border-radius: 50%; margin: 0 auto 16px; overflow: hidden; background: ${theme.primaryColor}15; display: flex; align-items: center; justify-content: center;">
        ${avatar ? `<img src="${esc(avatar)}" alt="${esc(m.name || '')}" style="width: 100%; height: 100%; object-fit: cover;" />` : `<span style="font-weight: 700; font-size: 24px; color: ${theme.primaryColor};">${(m.name || '?')[0]}</span>`}
      </div>
      <h3 style="font-size: 14px; font-weight: 600; color: ${theme.textColor}; font-family: ${theme.headingFont};">${esc(m.name || '')}</h3>
      <p style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.6; margin-top: 2px;">${esc(m.role || '')}</p>
      ${m.bio ? `<p style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.5; margin-top: 8px; line-height: 1.5;">${esc(m.bio)}</p>` : ''}
    </div>`;
  }).join('');

  return `<section${anim} class="wb-team" style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">${headerHtml}<div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 32px;">${membersHtml}</div></div>
</section>`;
}

function renderCountdown(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const targetDate = p.targetDate || new Date(Date.now() + 7 * 86400000).toISOString();
  const id = 'cd-' + Math.random().toString(36).slice(2, 8);

  return `<section${anim} class="wb-countdown" style="padding: 64px 24px; text-align: center; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 800px;">
    ${title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 32px;">${esc(title)}</h2>` : ''}
    <div id="${id}" style="display: flex; justify-content: center; gap: 16px;" data-target="${esc(targetDate)}">
      <div class="cd-box" style="text-align: center; min-width: 80px;"><div class="cd-value" data-unit="days" style="width: 80px; height: 80px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}12; color: ${theme.primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700;">0</div><p style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.6; margin-top: 8px;">Days</p></div>
      <div class="cd-box" style="text-align: center; min-width: 80px;"><div class="cd-value" data-unit="hours" style="width: 80px; height: 80px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}12; color: ${theme.primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700;">0</div><p style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.6; margin-top: 8px;">Hours</p></div>
      <div class="cd-box" style="text-align: center; min-width: 80px;"><div class="cd-value" data-unit="minutes" style="width: 80px; height: 80px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}12; color: ${theme.primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700;">0</div><p style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.6; margin-top: 8px;">Minutes</p></div>
      <div class="cd-box" style="text-align: center; min-width: 80px;"><div class="cd-value" data-unit="seconds" style="width: 80px; height: 80px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}12; color: ${theme.primaryColor}; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700;">0</div><p style="font-size: 12px; color: ${theme.secondaryColor}; opacity: 0.6; margin-top: 8px;">Seconds</p></div>
    </div>
  </div>
</section>`;
}

function renderTrustBadges(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const badges = toArray(p.badges || p.items);
  return `<section${anim} style="padding: 48px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 32px;">
    ${badges.map((b: any) => `<div style="text-align: center; display: flex; flex-direction: column; align-items: center; gap: 8px;">
      ${b.icon ? `<div style="color: ${theme.primaryColor};">${getIconSvg(b.icon, 'icon-lg')}</div>` : ''}
      ${b.image ? `<img src="${esc(b.image)}" alt="${esc(b.label || '')}" style="height: 40px; object-fit: contain;" />` : ''}
      <span style="font-size: 13px; font-weight: 500; color: ${theme.textColor};">${esc(b.label || b.title || '')}</span>
    </div>`).join('')}
  </div>
</section>`;
}

function renderComparisonTable(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const title = p.title || '';
  const headers = toArray(p.headers).length > 0 ? toArray(p.headers) : ['Feature', 'Basic', 'Pro'];
  const rows = toArray(p.rows);

  return `<section${anim} style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 900px;">
    ${title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 32px;">${esc(title)}</h2>` : ''}
    <table style="width: 100%; border-collapse: collapse;">
      <thead><tr>${headers.map((h: any) => `<th style="padding: 12px 16px; text-align: left; border-bottom: 2px solid #e2e8f0; font-size: 14px; font-weight: 600; color: ${theme.textColor};">${esc(String(h))}</th>`).join('')}</tr></thead>
      <tbody>${rows.map((row: any) => `<tr>${toArray(row).map((cell: any) => `<td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9; font-size: 14px; color: ${theme.secondaryColor};">${String(cell) === 'true' || String(cell) === '✓' ? getIconSvg('check', 'icon-sm') : String(cell) === 'false' || String(cell) === '✗' ? getIconSvg('x', 'icon-sm') : esc(String(cell))}</td>`).join('')}</tr>`).join('')}</tbody>
    </table>
  </div>
</section>`;
}

function renderProgress(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const items = toArray(p.items || p.bars);
  return `<section${anim} style="padding: 48px 24px; font-family: ${theme.bodyFont};">
  <div class="container" style="max-width: 600px;">
    ${items.map((item: any) => `<div style="margin-bottom: 16px;">
      <div style="display: flex; justify-content: space-between; margin-bottom: 4px;"><span style="font-size: 14px; font-weight: 500; color: ${theme.textColor};">${esc(String(item.label || ''))}</span><span style="font-size: 14px; color: ${theme.secondaryColor};">${item.value || 0}%</span></div>
      <div style="height: 8px; border-radius: 4px; background: #e2e8f0; overflow: hidden;"><div style="height: 100%; width: ${item.value || 0}%; background: ${theme.primaryColor}; border-radius: 4px; transition: width 1s;"></div></div>
    </div>`).join('')}
  </div>
</section>`;
}

function renderList(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const items = toArray(p.items);
  const ordered = p.ordered || false;
  const tag = ordered ? 'ol' : 'ul';
  const listStyle = ordered ? 'decimal' : p.icon ? 'none' : 'disc';

  const itemsHtml = items.map((item: any) => {
    const text = typeof item === 'string' ? item : item.text || '';
    const icon = (typeof item === 'object' && item.icon) ? getIconSvg(item.icon, 'icon-sm') : '';
    return `<li style="padding: 4px 0; display: flex; align-items: center; gap: 8px;">${icon}${esc(String(text))}</li>`;
  }).join('');

  return `<div${anim} style="padding: 24px 48px; font-family: ${theme.bodyFont}; color: ${theme.textColor};"><${tag} style="list-style: ${listStyle}; padding-left: ${listStyle === 'none' ? '0' : '20px'}; line-height: 1.8;">${itemsHtml}</${tag}></div>`;
}

function renderCallout(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const type = p.variant || p.type || 'info';
  const colorMap: Record<string, string> = { info: '#3b82f6', warning: '#f59e0b', error: '#ef4444', success: '#22c55e' };
  const color = colorMap[type] || theme.primaryColor;
  const icon = p.icon || (type === 'warning' ? 'alert-circle' : type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info');
  const title = p.title || '';
  const text = p.text || p.content || '';

  return `<div${anim} style="padding: 16px 24px; margin: 16px 24px; border-left: 4px solid ${color}; background: ${color}08; border-radius: 0 ${theme.borderRadius}px ${theme.borderRadius}px 0; font-family: ${theme.bodyFont};">
  <div style="display: flex; gap: 12px; align-items: flex-start;">
    <div style="color: ${color}; flex-shrink: 0; margin-top: 2px;">${getIconSvg(icon, 'icon-sm')}</div>
    <div>
      ${title ? `<h4 style="font-weight: 600; font-size: 14px; color: ${theme.textColor}; margin-bottom: 4px;">${esc(title)}</h4>` : ''}
      <div style="color: ${theme.textColor}; font-size: 14px; line-height: 1.6; opacity: 0.8;">${esc(text)}</div>
    </div>
  </div>
</div>`;
}

function renderIconText(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  // Handle items array (builder uses items[]) or single item (legacy)
  const items = toArray(p.items);
  
  if (items.length > 0) {
    const columns = p.columns || Math.min(items.length, 3);
    const layout = p.layout || 'vertical';
    
    const itemsHtml = items.map((item: any) => {
      const icon = item.icon ? `<div style="color: ${theme.primaryColor}; flex-shrink: 0; margin-bottom: ${layout === 'vertical' ? '12px' : '0'};">${getIconSvg(item.icon, 'icon-lg')}</div>` : '';
      return `<div style="display: flex; ${layout === 'vertical' ? 'flex-direction: column; align-items: center; text-align: center;' : 'align-items: flex-start; gap: 16px;'} padding: 24px;">
        ${icon}
        <div>
          ${item.title ? `<h4 style="font-weight: 600; color: ${theme.textColor}; font-family: ${theme.headingFont}; margin-bottom: 4px; font-size: 16px;">${esc(item.title)}</h4>` : ''}
          ${item.description ? `<p style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; line-height: 1.6;">${esc(item.description)}</p>` : ''}
        </div>
      </div>`;
    }).join('');

    return `<section${anim} class="wb-icon-text" style="padding: 48px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container">
    ${p.title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 48px;">${esc(p.title)}</h2>` : ''}
    <div style="display: grid; grid-template-columns: repeat(${columns}, 1fr); gap: 24px;">${itemsHtml}</div>
  </div>
</section>`;
  }

  // Fallback: single icon-text (legacy)
  const icon = p.icon || 'info';
  const title = p.title || '';
  const description = p.description || '';

  return `<div${anim} style="padding: 24px; display: flex; gap: 16px; align-items: flex-start; font-family: ${theme.bodyFont};${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div style="color: ${theme.primaryColor}; flex-shrink: 0;">${getIconSvg(icon, 'icon-lg')}</div>
  <div>
    ${title ? `<h4 style="font-weight: 600; color: ${theme.textColor}; font-family: ${theme.headingFont}; margin-bottom: 4px;">${esc(title)}</h4>` : ''}
    ${description ? `<p style="font-size: 14px; color: ${theme.secondaryColor}; opacity: 0.7; line-height: 1.6;">${esc(description)}</p>` : ''}
  </div>
</div>`;
}

function renderProductCard(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  return `<div${anim} style="padding: 24px; max-width: 320px; margin: 0 auto;">
  <div style="border-radius: ${theme.borderRadius}px; border: 1px solid #e2e8f0; overflow: hidden;">
    ${p.image || p.imageUrl ? `<img src="${esc(p.image || p.imageUrl)}" alt="${esc(p.name || p.title || '')}" style="width: 100%; aspect-ratio: 1; object-fit: cover;" />` : `<div style="width: 100%; aspect-ratio: 1; background: #f1f5f9; display: flex; align-items: center; justify-content: center;"><span style="color: #94a3b8;">Product Image</span></div>`}
    <div style="padding: 16px;">
      <h3 style="font-family: ${theme.headingFont}; font-size: 16px; font-weight: 600; color: ${theme.textColor};">${esc(p.name || p.title || '')}</h3>
      <p style="font-size: 20px; font-weight: 700; color: ${theme.primaryColor}; margin-top: 8px;">${esc(p.price || '')}</p>
      ${p.description ? `<p style="font-size: 13px; color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 4px;">${esc(p.description)}</p>` : ''}
      <button style="${btnStyle(theme)} width: 100%; text-align: center; margin-top: 12px;">Add to Cart</button>
    </div>
  </div>
</div>`;
}

function renderProductDetail(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  return `<section${anim} style="padding: 64px 24px; font-family: ${theme.bodyFont};">
  <div class="container" style="display: grid; grid-template-columns: 1fr 1fr; gap: 48px; align-items: start;">
    <div style="border-radius: ${theme.borderRadius}px; overflow: hidden;">${p.image || p.imageUrl ? `<img src="${esc(p.image || p.imageUrl)}" alt="${esc(p.name || '')}" style="width: 100%;" />` : `<div style="aspect-ratio: 1; background: #f1f5f9; display: flex; align-items: center; justify-content: center;"><span style="color: #94a3b8;">Product</span></div>`}</div>
    <div>
      <h1 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor};">${esc(p.name || p.title || '')}</h1>
      <p style="font-size: 28px; font-weight: 700; color: ${theme.primaryColor}; margin: 16px 0;">${esc(p.price || '')}</p>
      ${p.description ? `<div style="color: ${theme.secondaryColor}; line-height: 1.7; margin-bottom: 24px;">${p.description}</div>` : ''}
      <button style="${btnStyle(theme)} width: 100%; text-align: center;">Add to Cart</button>
    </div>
  </div>
</section>`;
}

function renderBlogGrid(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const title = p.title || '';
  const posts = toArray(p.posts);

  return `<section${anim} style="padding: 64px 24px; font-family: ${theme.bodyFont};">
  <div class="container">
    ${title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 30px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 48px;">${esc(title)}</h2>` : ''}
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px;">
      ${posts.map((post: any) => `<div style="border-radius: ${theme.borderRadius}px; border: 1px solid #e2e8f0; overflow: hidden;">
        ${post.image ? `<img src="${esc(post.image)}" alt="${esc(post.title || '')}" style="width: 100%; aspect-ratio: 16/9; object-fit: cover;" />` : ''}
        <div style="padding: 16px;">
          <h3 style="font-size: 16px; font-weight: 600; color: ${theme.textColor}; font-family: ${theme.headingFont};">${esc(String(post.title || ''))}</h3>
          ${post.excerpt ? `<p style="font-size: 13px; color: ${theme.secondaryColor}; opacity: 0.7; margin-top: 8px; line-height: 1.5;">${esc(String(post.excerpt))}</p>` : ''}
        </div>
      </div>`).join('')}
    </div>
  </div>
</section>`;
}

function renderTagsCloud(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const tags = toArray(p.tags);
  return `<div${anim} style="padding: 24px; display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;">
    ${tags.map((tag: any) => `<span style="padding: 4px 12px; border-radius: 999px; background: ${theme.primaryColor}10; color: ${theme.primaryColor}; font-size: 13px; font-weight: 500;">${esc(String(tag))}</span>`).join('')}
  </div>`;
}

function renderGenericForm(p: Record<string, any>, ctx: BlockHtmlContext, anim: string, compStyle?: React.CSSProperties): string {
  const { theme } = ctx;
  const title = p.title || '';
  const fields = toArray(p.fields);
  const buttonText = p.buttonText || 'Submit';
  const action = p.formSettings?.webhookUrl || ctx.formActionUrl || '#';
  const inputStyle = `width: 100%; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px; font-family: ${theme.bodyFont}; font-size: 14px; box-sizing: border-box;`;

  const fieldsHtml = fields.map((f: any) => {
    const label = f.label || f.name || '';
    const req = f.required ? ' required' : '';
    if (f.type === 'textarea') return `<div><label style="display: block; font-size: 13px; font-weight: 500; color: ${theme.textColor}; margin-bottom: 6px;">${esc(label)}</label><textarea name="${esc(f.name || '')}" rows="4" style="${inputStyle} resize: vertical;"${req}></textarea></div>`;
    if (f.type === 'select') return `<div><label style="display: block; font-size: 13px; font-weight: 500; color: ${theme.textColor}; margin-bottom: 6px;">${esc(label)}</label><select name="${esc(f.name || '')}" style="${inputStyle}"${req}><option value="">Select...</option>${toArray(f.options).map((o: any) => `<option>${esc(String(o))}</option>`).join('')}</select></div>`;
    if (f.type === 'checkbox') return `<div style="display: flex; align-items: center; gap: 8px;"><input type="checkbox" name="${esc(f.name || '')}"${req} /><label style="font-size: 14px; color: ${theme.textColor};">${esc(label)}</label></div>`;
    return `<div><label style="display: block; font-size: 13px; font-weight: 500; color: ${theme.textColor}; margin-bottom: 6px;">${esc(label)}</label><input type="${f.type || 'text'}" name="${esc(f.name || '')}" style="${inputStyle}"${req} /></div>`;
  }).join('');

  return `<section${anim} style="padding: 64px 24px; font-family: ${theme.bodyFont}; ${p.bgColor ? `background-color: ${p.bgColor};` : ''}${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="max-width: 600px;">
    ${title ? `<h2 style="font-family: ${theme.headingFont}; font-size: 24px; font-weight: 700; color: ${theme.textColor}; margin-bottom: 24px; text-align: center;">${esc(title)}</h2>` : ''}
    <form action="${esc(action)}" method="POST" style="display: flex; flex-direction: column; gap: 16px;">${fieldsHtml}<button type="submit" style="${btnStyle(theme)} width: 100%; text-align: center;">${esc(buttonText)}</button></form>
  </div>
</section>`;
}

function renderAuthForm(p: Record<string, any>, theme: SiteTheme, type: string, anim: string): string {
  const isSignup = type === 'signup-form';
  const title = p.title || (isSignup ? 'Create Account' : 'Sign In');
  return `<section${anim} style="padding: 64px 24px; font-family: ${theme.bodyFont};">
  <div style="max-width: 400px; margin: 0 auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px;">
    <h2 style="font-family: ${theme.headingFont}; font-size: 24px; font-weight: 700; color: ${theme.textColor}; text-align: center; margin-bottom: 24px;">${esc(title)}</h2>
    <form style="display: flex; flex-direction: column; gap: 16px;">
      ${isSignup ? `<input type="text" placeholder="Full Name" style="padding: 12px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px;" />` : ''}
      <input type="email" placeholder="Email" style="padding: 12px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px;" />
      <input type="password" placeholder="Password" style="padding: 12px; border: 1px solid #e2e8f0; border-radius: ${theme.borderRadius}px;" />
      <button type="submit" style="${btnStyle(theme)} width: 100%; text-align: center;">${esc(isSignup ? 'Sign Up' : 'Sign In')}</button>
    </form>
    <p style="text-align: center; margin-top: 16px; font-size: 13px; color: ${theme.secondaryColor};">This form requires backend authentication.</p>
  </div>
</section>`;
}

function renderCookieConsent(p: Record<string, any>, theme: SiteTheme): string {
  const text = p.text || p.message || 'We use cookies to improve your experience.';
  const buttonText = p.buttonText || 'Accept';
  return `<div class="wb-cookie-consent" style="position: fixed; bottom: 0; left: 0; right: 0; z-index: 9999; padding: 16px 24px; background: ${theme.textColor}; color: ${theme.backgroundColor}; display: flex; align-items: center; justify-content: space-between; gap: 16px; font-family: ${theme.bodyFont}; font-size: 14px;">
  <p style="margin: 0;">${esc(text)}</p>
  <button onclick="this.parentElement.style.display='none'" style="padding: 8px 24px; border-radius: ${theme.borderRadius}px; background: ${theme.primaryColor}; color: #ffffff; border: none; cursor: pointer; font-weight: 600; white-space: nowrap;">${esc(buttonText)}</button>
</div>`;
}

function renderLanguageSwitcher(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const languages = toArray(p.languages);
  if (!languages.length) return '';
  return `<div${anim} style="display: flex; gap: 8px; padding: 8px;">
    ${languages.map((lang: any) =>
      `<a href="/${lang.code || ''}" style="display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 4px; text-decoration: none; font-size: 13px; color: ${theme.textColor}; border: 1px solid #e2e8f0;">
        <img src="https://flagcdn.com/w40/${(lang.code || 'us').toLowerCase()}.png" alt="" style="width: 20px; height: 14px; object-fit: cover; border-radius: 2px;" />
        ${esc(String(lang.label || lang.code || ''))}
      </a>`
    ).join('')}
  </div>`;
}

function renderBreadcrumb(p: Record<string, any>, theme: SiteTheme, anim: string): string {
  const items = toArray(p.items);
  return `<nav${anim} style="padding: 12px 24px; font-family: ${theme.bodyFont};">
  <div class="container" style="display: flex; align-items: center; gap: 8px; font-size: 13px;">
    ${items.map((item: any, i: number) => {
      const isLast = i === items.length - 1;
      return isLast
        ? `<span style="color: ${theme.textColor}; font-weight: 500;">${esc(String(item.label || item.text || ''))}</span>`
        : `<a href="${esc(item.url || '#')}" style="color: ${theme.secondaryColor}; text-decoration: none; opacity: 0.7;">${esc(String(item.label || item.text || ''))}</a><span style="color: ${theme.secondaryColor}; opacity: 0.4;">/</span>`;
    }).join('')}
  </div>
</nav>`;
}

function renderFloatingHeader(p: Record<string, any>, theme: SiteTheme, anim: string, compStyle?: React.CSSProperties): string {
  const items = toArray(p.items);
  const variant = p.variant || 'cards';
  const columns = p.columns || 4;
  const offsetY = p.offsetY ?? -60;

  const colCount = Math.min(columns, items.length || 4);

  const itemsHtml = items.map((item: any) => {
    const iconHtml = item.icon ? `<div style="width: 44px; height: 44px; border-radius: ${theme.borderRadius}px; margin: 0 auto 12px; display: flex; align-items: center; justify-content: center; background-color: ${theme.primaryColor}14; color: ${theme.primaryColor};">${getIconSvg(item.icon, 'icon-md')}</div>` : '';
    const valueHtml = `<div style="font-size: 28px; font-weight: 800; line-height: 1; margin-bottom: 4px; color: ${variant === 'glass' ? theme.primaryColor : theme.textColor}; font-family: ${theme.headingFont};">${esc(String(item.value || '0'))}${esc(item.suffix || '')}</div>`;
    const labelHtml = `<div style="font-size: 11px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.6; color: ${theme.textColor}; font-family: ${theme.bodyFont};">${esc(String(item.label || ''))}</div>`;

    if (variant === 'pills') {
      return `<div style="display: flex; align-items: center; gap: 12px; padding: 12px 24px; border-radius: 999px; background: rgba(255,255,255,0.85); box-shadow: 0 4px 12px rgba(0,0,0,0.1); backdrop-filter: blur(8px); border: 1px solid rgba(255,255,255,0.3);">
        ${item.icon ? `<div style="width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; background-color: ${theme.primaryColor}14; color: ${theme.primaryColor};">${getIconSvg(item.icon, 'icon-sm')}</div>` : ''}
        <span style="font-size: 18px; font-weight: 700; color: ${theme.primaryColor}; font-family: ${theme.headingFont};">${esc(String(item.value || '0'))}${esc(item.suffix || '')}</span>
        <span style="font-size: 12px; font-weight: 500; opacity: 0.6; color: ${theme.textColor};">${esc(String(item.label || ''))}</span>
      </div>`;
    }

    // cards + glass variants
    const cardBg = variant === 'glass'
      ? 'background: linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7)); backdrop-filter: blur(12px); border: 1px solid rgba(255,255,255,0.2);'
      : 'background: #ffffff; border: 1px solid rgba(0,0,0,0.06);';

    return `<div style="padding: 24px; border-radius: ${theme.borderRadius + 2}px; ${cardBg} box-shadow: 0 8px 24px rgba(0,0,0,0.08); text-align: center; transition: transform 0.3s, box-shadow 0.3s;">
      ${iconHtml}${valueHtml}${labelHtml}
    </div>`;
  }).join('');

  if (variant === 'pills') {
    return `<section${anim} class="wb-floating-header" style="position: relative; z-index: 10; margin-top: ${offsetY}px; margin-bottom: 16px; padding: 0 24px;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: flex; flex-wrap: wrap; justify-content: center; gap: 12px;">${itemsHtml}</div>
</section>`;
  }

  return `<section${anim} class="wb-floating-header" style="position: relative; z-index: 10; margin-top: ${offsetY}px; margin-bottom: 16px; padding: 0 24px;${compStyle ? ' ' + styleAttr(compStyle).replace(' style="', '').replace('"', '') : ''}">
  <div class="container" style="display: grid; grid-template-columns: repeat(${colCount}, 1fr); gap: 20px;">${itemsHtml}</div>
</section>`;
}
