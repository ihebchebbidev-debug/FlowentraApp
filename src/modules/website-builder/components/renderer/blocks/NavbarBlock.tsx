import React, { useState, useRef, useEffect } from 'react';
import { SiteTheme, DeviceView, SiteLanguage } from '../../../types';
import { NavLink as NavLinkType, ComponentAction } from '../../../types/shared';
import { Menu, X, Plus, Trash2, ChevronDown, Search, ArrowRight, Globe, Check } from 'lucide-react';
import { DynamicIcon } from '../../editor/IconPicker';
import { getButtonStyle, getThemeShadow } from '../../../utils/themeUtils';
import { ActionLink } from '../ActionButton';

/** Real flag images via CDN for consistent cross-platform rendering */
const FLAG_IMAGES: Record<string, string> = {
  en: 'https://flagcdn.com/w40/gb.png',
  fr: 'https://flagcdn.com/w40/fr.png',
  es: 'https://flagcdn.com/w40/es.png',
  de: 'https://flagcdn.com/w40/de.png',
  it: 'https://flagcdn.com/w40/it.png',
  pt: 'https://flagcdn.com/w40/pt.png',
  nl: 'https://flagcdn.com/w40/nl.png',
  ru: 'https://flagcdn.com/w40/ru.png',
  zh: 'https://flagcdn.com/w40/cn.png',
  ja: 'https://flagcdn.com/w40/jp.png',
  ko: 'https://flagcdn.com/w40/kr.png',
  ar: 'https://flagcdn.com/w40/tn.png',
  he: 'https://flagcdn.com/w40/il.png',
  tr: 'https://flagcdn.com/w40/tr.png',
  hi: 'https://flagcdn.com/w40/in.png',
};

/** Fallback emoji flags */
const FLAG_EMOJIS: Record<string, string> = {
  en: '🇬🇧', fr: '🇫🇷', es: '🇪🇸', de: '🇩🇪', it: '🇮🇹', pt: '🇵🇹',
  nl: '🇳🇱', ru: '🇷🇺', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', ar: '🇹🇳',
  he: '🇮🇱', tr: '🇹🇷', hi: '🇮🇳',
};

/** Flag component — real image with emoji fallback */
function FlagIcon({ code, size = 20, className = '' }: { code: string; size?: number; className?: string }) {
  const imgSrc = FLAG_IMAGES[code];
  if (imgSrc) {
    return (
      <img
        src={imgSrc}
        alt={code.toUpperCase()}
        width={size}
        height={Math.round(size * 0.75)}
        className={`inline-block object-cover rounded-sm ${className}`}
        style={{ width: size, height: Math.round(size * 0.75) }}
        loading="lazy"
        onError={(e) => {
          // Fallback to emoji if image fails
          const span = document.createElement('span');
          span.textContent = FLAG_EMOJIS[code] || '🌐';
          span.style.fontSize = `${size * 0.8}px`;
          e.currentTarget.replaceWith(span);
        }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.8 }}>{FLAG_EMOJIS[code] || '🌐'}</span>;
}

type LanguageSwitcherVariant = 'icon' | 'flags' | 'dropdown' | 'pills' | 'text';

interface NavbarBlockProps {
  logo: string;
  logoImage?: string;
  links: NavLinkType[];
  sticky?: boolean;
  transparent?: boolean;
  bgColor?: string;
  textColor?: string;
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  ctaTextColor?: string;
  variant?: 'default' | 'centered' | 'minimal' | 'bordered' | 'split' | 'stacked';
  topBarText?: string;
  topBarLinks?: Array<{ label: string; href: string }>;
  topBarBgColor?: string;
  showSearch?: boolean;
  socialLinks?: Array<{ platform: string; url: string }>;
  // Language switcher options
  showLanguageSwitcher?: boolean;
  languageSwitcherVariant?: LanguageSwitcherVariant;
  languages?: SiteLanguage[];
  currentLanguage?: string;
  theme: SiteTheme;
  device?: DeviceView;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

/* ── Desktop dropdown ────────────────── */
function DesktopDropdown({
  items,
  isOpen,
  linkColor,
  theme,
  isEditing,
}: {
  items: NavLinkType['children'];
  isOpen: boolean;
  linkColor: string;
  theme: SiteTheme;
  isEditing: boolean;
}) {
  if (!items?.length || !isOpen) return null;
  return (
    <div
      className="absolute top-full left-1/2 -translate-x-1/2 pt-2 z-50"
      style={{ minWidth: 220 }}
    >
      <div
        className="rounded-xl border shadow-xl overflow-hidden backdrop-blur-md"
        style={{ backgroundColor: theme.backgroundColor + 'f5', borderColor: theme.textColor + '15' }}
      >
        {items.map((child, ci) => (
          <a
            key={ci}
            href={isEditing ? undefined : child.href}
            className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-black/[0.03]"
          >
            {child.icon && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                style={{ backgroundColor: theme.primaryColor + '12' }}
              >
                <DynamicIcon name={child.icon} className="h-4 w-4" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium" style={{ color: theme.textColor }}>
                {child.label}
              </p>
              {child.description && (
                <p className="text-xs mt-0.5 opacity-50" style={{ color: theme.textColor }}>
                  {child.description}
                </p>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ── Mobile sidebar ────────────────── */
function MobileSidebar({
  isOpen,
  onClose,
  logo,
  logoImage,
  links,
  ctaText,
  ctaLink,
  ctaColor,
  ctaTextColor,
  socialLinks,
  showSearch,
  showLanguageSwitcher,
  languages,
  currentLanguage,
  onUpdate,
  theme,
  isEditing,
}: {
  isOpen: boolean;
  onClose: () => void;
  logo: string;
  logoImage?: string;
  links: NavLinkType[];
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  ctaTextColor?: string;
  socialLinks?: Array<{ platform: string; url: string }>;
  showSearch?: boolean;
  showLanguageSwitcher?: boolean;
  languages?: SiteLanguage[];
  currentLanguage?: string;
  onUpdate?: (props: Record<string, any>) => void;
  theme: SiteTheme;
  isEditing: boolean;
}) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const fg = theme.textColor;

  // Always use fixed positioning so sidebar covers the full viewport height
  const posClass = 'fixed';

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${posClass} inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-200`}
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      />
      {/* Drawer */}
      <div
        className={`${posClass} top-0 right-0 bottom-0 w-[280px] z-[101] shadow-2xl animate-in slide-in-from-right duration-250 flex flex-col`}
        style={{ backgroundColor: theme.backgroundColor }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: fg + '12' }}>
          <div className="flex items-center gap-2.5">
            {logoImage && <img src={logoImage} alt={logo} className="h-7 w-auto object-contain" />}
            <span className="text-lg font-bold" style={{ color: fg, fontFamily: theme.headingFont }}>
              {logo}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl transition-colors hover:bg-black/5"
          >
            <X className="h-4 w-4" style={{ color: fg }} />
          </button>
        </div>

        {/* Search */}
        {showSearch && (
          <div className="px-5 py-3 border-b" style={{ borderColor: fg + '08' }}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: fg + '06' }}>
              <Search className="h-3.5 w-3.5 opacity-40" style={{ color: fg }} />
              <span className="text-sm opacity-40" style={{ color: fg }}>Search...</span>
            </div>
          </div>
        )}

        {/* Language Switcher in mobile */}
        {showLanguageSwitcher && languages && languages.length > 0 && (
          <div className="px-5 py-3 border-b" style={{ borderColor: fg + '08' }}>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 opacity-50" style={{ color: fg }} />
              <span className="text-xs font-medium uppercase tracking-wider opacity-50" style={{ color: fg }}>Language</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    lang.code === currentLanguage
                      ? 'ring-2 ring-primary/30'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: lang.code === currentLanguage ? theme.primaryColor + '12' : fg + '06',
                    color: lang.code === currentLanguage ? theme.primaryColor : fg,
                  }}
                  onClick={() => {
                    if (!isEditing) onUpdate?.({ currentLanguage: lang.code });
                  }}
                >
                  <FlagIcon code={lang.code} size={20} />
                  <span>{lang.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Links */}
        <div className="flex-1 overflow-y-auto py-3 px-3">
          {links.map((link, i) => {
            const hasChildren = link.children && link.children.length > 0;
            const isExpanded = expandedIdx === i;
            return (
              <div key={i}>
                <a
                  href={isEditing || hasChildren ? undefined : link.href}
                  onClick={hasChildren ? () => setExpandedIdx(isExpanded ? null : i) : () => onClose()}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors hover:bg-black/[0.03] cursor-pointer"
                  style={{ color: fg }}
                >
                  {link.icon && (
                    <DynamicIcon name={link.icon} className="h-4 w-4 opacity-60" />
                  )}
                  <span className="flex-1">{link.label}</span>
                  {hasChildren && (
                    <ChevronDown
                      className={`h-3.5 w-3.5 opacity-40 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  )}
                </a>
                {/* Sub-links */}
                {hasChildren && isExpanded && (
                  <div className="ml-4 pl-3 border-l-2 mb-1" style={{ borderColor: theme.primaryColor + '25' }}>
                    {link.children!.map((child, ci) => (
                      <a
                        key={ci}
                        href={isEditing ? undefined : child.href}
                        onClick={() => onClose()}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-black/[0.03]"
                        style={{ color: fg }}
                      >
                        {child.icon && <DynamicIcon name={child.icon} className="h-3.5 w-3.5 opacity-50" />}
                        <div className="min-w-0">
                          <span className="block text-[13px]">{child.label}</span>
                          {child.description && (
                            <span className="block text-[11px] opacity-40 truncate">{child.description}</span>
                          )}
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA button */}
        {ctaText && (
          <div className="px-5 py-3 border-t" style={{ borderColor: fg + '08' }}>
            <a
              href={isEditing ? undefined : ctaLink}
              className="flex items-center justify-center gap-2 w-full px-4 py-3 text-sm font-semibold transition-transform hover:scale-[1.02]"
              style={{
                ...getButtonStyle('primary', theme, ctaColor, ctaTextColor),
                boxShadow: theme.shadowStyle !== 'none' ? getThemeShadow(theme) : undefined,
              }}
            >
              {ctaText}
              <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        )}

        {/* Social links */}
        {socialLinks && socialLinks.length > 0 && (
          <div className="px-5 py-4 border-t flex items-center justify-center gap-3" style={{ borderColor: fg + '08' }}>
            {socialLinks.map((sl, si) => (
              <a
                key={si}
                href={isEditing ? undefined : sl.url}
                className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/[0.05]"
              >
                <DynamicIcon name={sl.platform} className="h-4 w-4 opacity-50" />
              </a>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
/* ── Inline Language Switcher ────────────────── */
function NavLanguageSwitcher({
  variant = 'icon',
  languages,
  currentLanguage,
  theme,
  linkColor,
  isEditing,
  onUpdate,
}: {
  variant: LanguageSwitcherVariant;
  languages: SiteLanguage[];
  currentLanguage: string;
  theme: SiteTheme;
  linkColor: string;
  isEditing: boolean;
  onUpdate?: (props: Record<string, any>) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const currentLang = languages.find(l => l.code === currentLanguage) || languages[0];
  const borderRadius = theme.buttonStyle === 'pill' ? '9999px' : 
                       theme.buttonStyle === 'square' ? '0px' : 
                       `${theme.borderRadius}px`;

  const handleSelect = (code: string) => {
    if (!isEditing) onUpdate?.({ currentLanguage: code });
    setIsOpen(false);
  };

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <div className="relative">
        <button
          className="p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          style={{ borderRadius, color: linkColor }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="h-4 w-4" />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute top-full mt-1 right-0 z-50 min-w-[150px] bg-card border rounded-lg shadow-lg overflow-hidden"
              style={{ borderRadius, backgroundColor: theme.backgroundColor }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full px-3 py-2 text-sm font-medium text-left flex items-center gap-2.5 transition-colors ${
                    lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  style={{ color: lang.code === currentLanguage ? theme.primaryColor : theme.textColor }}
                  onClick={() => handleSelect(lang.code)}
                >
                  <FlagIcon code={lang.code} size={20} />
                  <span className="flex-1">{lang.label}</span>
                  {lang.code === currentLanguage && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Flags-only variant
  if (variant === 'flags') {
    return (
      <div className="flex items-center gap-1.5">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all overflow-hidden ${
              lang.code === currentLanguage
                ? 'ring-2 ring-primary ring-offset-1 ring-offset-background scale-110'
                : 'opacity-60 hover:opacity-100 hover:scale-105'
            }`}
            title={lang.label}
            onClick={() => handleSelect(lang.code)}
          >
            <FlagIcon code={lang.code} size={24} />
          </button>
        ))}
      </div>
    );
  }

  // Pills variant
  if (variant === 'pills') {
    return (
      <div 
        className="inline-flex items-center gap-0.5 p-0.5 bg-black/5 dark:bg-white/10 rounded-lg"
        style={{ borderRadius }}
      >
        {languages.map((lang) => (
          <button
            key={lang.code}
            className="px-2 py-1 text-xs font-medium transition-all"
            style={{
              borderRadius: `calc(${borderRadius} - 2px)`,
              backgroundColor: lang.code === currentLanguage ? theme.backgroundColor : 'transparent',
              color: lang.code === currentLanguage ? theme.primaryColor : linkColor,
              boxShadow: lang.code === currentLanguage ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
            }}
            onClick={() => handleSelect(lang.code)}
          >
            <FlagIcon code={lang.code} size={16} className="mr-1" />
            {lang.code.toUpperCase()}
          </button>
        ))}
      </div>
    );
  }

  // Text-only variant
  if (variant === 'text') {
    return (
      <div className="relative">
        <button
          className="inline-flex items-center gap-1 text-sm font-medium opacity-70 hover:opacity-100 transition-opacity"
          style={{ color: linkColor }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>{currentLang?.code.toUpperCase()}</span>
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute top-full mt-1 right-0 z-50 min-w-[130px] bg-card border rounded-lg shadow-lg overflow-hidden"
              style={{ borderRadius, backgroundColor: theme.backgroundColor }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full px-3 py-2 text-sm font-medium text-left flex items-center gap-2 transition-colors ${
                    lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  style={{ color: lang.code === currentLanguage ? theme.primaryColor : theme.textColor }}
                  onClick={() => handleSelect(lang.code)}
                >
                  <FlagIcon code={lang.code} size={18} />
                  <span className="flex-1">{lang.label}</span>
                  {lang.code === currentLanguage && <Check className="h-3.5 w-3.5" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div className="relative">
      <button
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-sm font-medium transition-colors hover:bg-black/5"
        style={{ color: linkColor, borderRadius, borderColor: linkColor + '30' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        <FlagIcon code={currentLang?.code || 'en'} size={20} />
        <span>{currentLang?.code.toUpperCase()}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            className="absolute top-full mt-1 right-0 z-50 min-w-[150px] bg-card border rounded-lg shadow-lg overflow-hidden"
            style={{ borderRadius, backgroundColor: theme.backgroundColor }}
          >
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`w-full px-3 py-2 text-sm font-medium text-left flex items-center gap-2 transition-colors ${
                  lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                }`}
                style={{ color: lang.code === currentLanguage ? theme.primaryColor : theme.textColor }}
                onClick={() => handleSelect(lang.code)}
              >
                <FlagIcon code={lang.code} size={20} />
                <span className="flex-1">{lang.label}</span>
                {lang.code === currentLanguage && <Check className="h-3.5 w-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main NavbarBlock ────────────────── */
export function NavbarBlock({
  logo, logoImage, links, sticky, transparent, bgColor, textColor: navTextColor,
  ctaText, ctaLink, ctaColor, ctaTextColor,
  variant = 'default', showSearch, socialLinks,
  topBarText, topBarLinks, topBarBgColor,
  showLanguageSwitcher, languageSwitcherVariant = 'icon', languages, currentLanguage = 'en',
  theme, device, isEditing, onUpdate, style,
}: NavbarBlockProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<number | null>(null);
  const isMobile = device === 'mobile' || device === 'tablet';

  // Auto-detect if logo text is actually an image path
  const logoIsImage = logo && /\.(png|jpe?g|gif|webp|svg|avif)(\?|$)/i.test(logo) && (logo.startsWith('/') || logo.startsWith('http') || logo.startsWith('data:'));
  const effectiveLogoImage = logoImage || (logoIsImage ? logo : '');
  const effectiveLogoText = logoIsImage ? '' : logo;
  const dropdownTimeout = useRef<ReturnType<typeof setTimeout>>();

  const dir = theme.direction || 'ltr';
  const bg = transparent ? 'transparent' : bgColor || theme.backgroundColor;
  const fg = navTextColor || theme.textColor;
  const linkColor = navTextColor || theme.secondaryColor;

  const updateLink = (index: number, field: 'label' | 'href', value: string) => {
    const updated = links.map((l, i) => i === index ? { ...l, [field]: value } : l);
    onUpdate?.({ links: updated });
  };

  const addLink = () => {
    onUpdate?.({ links: [...links, { label: 'New Link', href: '#' }] });
  };

  const removeLink = (index: number) => {
    onUpdate?.({ links: links.filter((_, i) => i !== index) });
  };

  const handleDropdownEnter = (idx: number) => {
    clearTimeout(dropdownTimeout.current);
    setOpenDropdown(idx);
  };
  const handleDropdownLeave = () => {
    dropdownTimeout.current = setTimeout(() => setOpenDropdown(null), 150);
  };

  // Variant-specific classes
  const variantClasses: Record<string, string> = {
    default: 'py-4 px-6 border-b',
    centered: 'py-4 px-6 border-b',
    minimal: 'py-3 px-6',
    bordered: 'py-4 px-6 border-b-2',
    split: 'py-4 px-6 border-b',
    stacked: 'border-b',
  };

  const isCentered = variant === 'centered';
  const isSplit = variant === 'split';
  const isStacked = variant === 'stacked';

  // ═══ STACKED VARIANT ═══
  if (isStacked) {
    const topBg = topBarBgColor || theme.primaryColor;
    return (
      <nav dir={dir} className={`${variantClasses[variant]} ${sticky ? 'sticky top-0 z-50' : ''}`} style={{ fontFamily: theme.bodyFont, ...style }}>
        {/* Top bar */}
        <div className="py-2 px-6 text-xs" style={{ backgroundColor: topBg, color: '#fff' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {isEditing ? (
                <span
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ topBarText: e.currentTarget.textContent || '' })}
                  className="outline-none focus:ring-1 focus:ring-white/30 rounded px-1"
                >{topBarText || 'Add announcement...'}</span>
              ) : topBarText ? (
                <span>{topBarText}</span>
              ) : null}
            </div>
            <div className="flex items-center gap-4">
              {topBarLinks?.map((tl, ti) => (
                <a key={ti} href={isEditing ? undefined : tl.href} className="hover:underline opacity-80 hover:opacity-100">
                  {tl.label}
                </a>
              ))}
              {socialLinks && socialLinks.length > 0 && (
                <div className="flex items-center gap-2 ml-2">
                  {socialLinks.map((sl, si) => (
                    <a key={si} href={isEditing ? undefined : sl.url} className="opacity-70 hover:opacity-100">
                      <DynamicIcon name={sl.platform} className="h-3.5 w-3.5" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        {/* Main nav row */}
        <div className="py-4 px-6" style={{ backgroundColor: bg, borderColor: fg + '12' }}>
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              {effectiveLogoImage && <img src={effectiveLogoImage} alt={effectiveLogoText} className="h-8 w-auto object-contain" />}
              {isEditing ? (
                <span
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ logo: e.currentTarget.textContent || '' })}
                  className="text-xl font-bold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                  style={{ color: fg, fontFamily: theme.headingFont }}
                >{effectiveLogoText}</span>
              ) : (
                !effectiveLogoImage && effectiveLogoText ? (
                  <span className="text-xl font-bold" style={{ color: fg, fontFamily: theme.headingFont }}>{effectiveLogoText}</span>
                ) : null
              )}
            </div>

            {/* Desktop links + CTA */}
            {!isMobile ? (
              <div className="flex items-center gap-1">
                {links.map((link, i) => {
                  const hasChildren = link.children && link.children.length > 0;
                  return (
                    <div
                      key={i}
                      className="relative group/link"
                      onMouseEnter={() => hasChildren && handleDropdownEnter(i)}
                      onMouseLeave={() => hasChildren && handleDropdownLeave()}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          {link.icon && <DynamicIcon name={link.icon} className="h-3.5 w-3.5 opacity-60" />}
                          <span
                            contentEditable suppressContentEditableWarning
                            onBlur={(e) => updateLink(i, 'label', e.currentTarget.textContent || '')}
                            className="text-sm font-medium outline-none focus:ring-1 focus:ring-primary/30 rounded px-1.5 py-1"
                            style={{ color: linkColor }}
                          >{link.label}</span>
                          {hasChildren && <ChevronDown className="h-3 w-3 opacity-40" style={{ color: linkColor }} />}
                          <button onClick={() => removeLink(i)} className="p-0.5 text-destructive opacity-0 group-hover/link:opacity-100 transition-opacity">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <a
                          href={hasChildren ? undefined : link.href}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/[0.04] cursor-pointer"
                          style={{ color: linkColor }}
                        >
                          {link.icon && <DynamicIcon name={link.icon} className="h-3.5 w-3.5" />}
                          {link.label}
                          {hasChildren && (
                            <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${openDropdown === i ? 'rotate-180' : ''}`} />
                          )}
                        </a>
                      )}
                      {!isEditing && (
                        <DesktopDropdown items={link.children} isOpen={openDropdown === i} linkColor={linkColor} theme={theme} isEditing={isEditing} />
                      )}
                    </div>
                  );
                })}
                {isEditing && (
                  <button onClick={addLink} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                )}
                {showSearch && !isEditing && (
                  <button className="p-2 rounded-lg transition-colors hover:bg-black/[0.04] ml-1">
                    <Search className="h-4 w-4" style={{ color: linkColor }} />
                  </button>
                )}
                {(ctaText || isEditing) && (
                  isEditing ? (
                    <span
                      contentEditable suppressContentEditableWarning
                      onBlur={(e) => onUpdate?.({ ctaText: e.currentTarget.textContent || '' })}
                      className="ml-2 px-5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50"
                      style={{ ...getButtonStyle('primary', theme, ctaColor, ctaTextColor) }}
                    >{ctaText || 'Add CTA...'}</span>
                  ) : ctaText ? (
                    <a
                      href={ctaLink || '#'}
                      className="ml-2 px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
                      style={{ ...getButtonStyle('primary', theme, ctaColor, ctaTextColor), boxShadow: theme.shadowStyle !== 'none' ? getThemeShadow(theme) : undefined }}
                    >{ctaText}</a>
                  ) : null
                )}
              </div>
            ) : (
              <button onClick={(e) => { e.stopPropagation(); setMobileOpen(true); }} className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors">
                <Menu className="h-5 w-5" style={{ color: fg }} />
              </button>
            )}
          </div>
        </div>
        <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} logo={effectiveLogoText} logoImage={effectiveLogoImage} links={links} ctaText={ctaText} ctaLink={ctaLink} ctaColor={ctaColor} ctaTextColor={ctaTextColor} socialLinks={socialLinks} showSearch={showSearch} showLanguageSwitcher={showLanguageSwitcher} languages={languages} currentLanguage={currentLanguage} onUpdate={onUpdate} theme={theme} isEditing={isEditing || false} />
      </nav>
    );
  }

  // ═══ SPLIT VARIANT (logo left, links center, CTA right) ═══
  if (isSplit) {
    return (
      <nav dir={dir} className={`${variantClasses[variant]} ${sticky ? 'sticky top-0 z-50' : ''}`} style={{ backgroundColor: bg, fontFamily: theme.bodyFont, borderColor: fg + '12', ...style }}>
        <div className="max-w-6xl mx-auto flex items-center">
          {/* Logo - left */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            {effectiveLogoImage && <img src={effectiveLogoImage} alt={effectiveLogoText} className="h-8 w-auto object-contain" />}
            {isEditing ? (
              <span
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ logo: e.currentTarget.textContent || '' })}
                className="text-xl font-bold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
                style={{ color: fg, fontFamily: theme.headingFont }}
              >{effectiveLogoText}</span>
            ) : (
              !effectiveLogoImage && effectiveLogoText ? (
                <span className="text-xl font-bold" style={{ color: fg, fontFamily: theme.headingFont }}>{effectiveLogoText}</span>
              ) : null
            )}
          </div>

          {/* Links - center (flex-1 with justify-center) */}
          {!isMobile ? (
            <div className="flex-1 flex items-center justify-center gap-1">
              {links.map((link, i) => {
                const hasChildren = link.children && link.children.length > 0;
                return (
                  <div
                    key={i}
                    className="relative group/link"
                    onMouseEnter={() => hasChildren && handleDropdownEnter(i)}
                    onMouseLeave={() => hasChildren && handleDropdownLeave()}
                  >
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        {link.icon && <DynamicIcon name={link.icon} className="h-3.5 w-3.5 opacity-60" />}
                        <span
                          contentEditable suppressContentEditableWarning
                          onBlur={(e) => updateLink(i, 'label', e.currentTarget.textContent || '')}
                          className="text-sm font-medium outline-none focus:ring-1 focus:ring-primary/30 rounded px-1.5 py-1"
                          style={{ color: linkColor }}
                        >{link.label}</span>
                        {hasChildren && <ChevronDown className="h-3 w-3 opacity-40" style={{ color: linkColor }} />}
                        <button onClick={() => removeLink(i)} className="p-0.5 text-destructive opacity-0 group-hover/link:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <a
                        href={hasChildren ? undefined : link.href}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/[0.04] cursor-pointer"
                        style={{ color: linkColor }}
                      >
                        {link.icon && <DynamicIcon name={link.icon} className="h-3.5 w-3.5" />}
                        {link.label}
                        {hasChildren && (
                          <ChevronDown className={`h-3 w-3 opacity-50 transition-transform duration-200 ${openDropdown === i ? 'rotate-180' : ''}`} />
                        )}
                      </a>
                    )}
                    {!isEditing && (
                      <DesktopDropdown items={link.children} isOpen={openDropdown === i} linkColor={linkColor} theme={theme} isEditing={isEditing} />
                    )}
                  </div>
                );
              })}
              {isEditing && (
                <button onClick={addLink} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          ) : null}

          {/* CTA - right */}
          {!isMobile ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              {showSearch && !isEditing && (
                <button className="p-2 rounded-lg transition-colors hover:bg-black/[0.04]">
                  <Search className="h-4 w-4" style={{ color: linkColor }} />
                </button>
              )}
              {(ctaText || isEditing) && (
                isEditing ? (
                  <span
                    contentEditable suppressContentEditableWarning
                    onBlur={(e) => onUpdate?.({ ctaText: e.currentTarget.textContent || '' })}
                    className="px-5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50"
                    style={{ ...getButtonStyle('primary', theme, ctaColor, ctaTextColor) }}
                  >{ctaText || 'Add CTA...'}</span>
                ) : ctaText ? (
                  <a
                    href={ctaLink || '#'}
                    className="px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
                    style={{ ...getButtonStyle('primary', theme, ctaColor, ctaTextColor), boxShadow: theme.shadowStyle !== 'none' ? getThemeShadow(theme) : undefined }}
                  >{ctaText}</a>
                ) : null
              )}
            </div>
          ) : (
            <button onClick={(e) => { e.stopPropagation(); setMobileOpen(true); }} className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors ml-auto">
              <Menu className="h-5 w-5" style={{ color: fg }} />
            </button>
          )}
        </div>
        <MobileSidebar isOpen={mobileOpen} onClose={() => setMobileOpen(false)} logo={effectiveLogoText} logoImage={effectiveLogoImage} links={links} ctaText={ctaText} ctaLink={ctaLink} ctaColor={ctaColor} ctaTextColor={ctaTextColor} socialLinks={socialLinks} showSearch={showSearch} showLanguageSwitcher={showLanguageSwitcher} languages={languages} currentLanguage={currentLanguage} onUpdate={onUpdate} theme={theme} isEditing={isEditing || false} />
      </nav>
    );
  }

  // ═══ DEFAULT / CENTERED / MINIMAL / BORDERED VARIANTS ═══
  return (
    <nav
      dir={dir}
      className={`${variantClasses[variant] || variantClasses.default} ${sticky ? 'sticky top-0 z-50' : ''}`}
      style={{ backgroundColor: bg, fontFamily: theme.bodyFont, borderColor: fg + '12', ...style }}
    >
      <div className={`max-w-6xl mx-auto flex items-center ${isCentered ? 'justify-center gap-8' : 'justify-between'}`}>
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {effectiveLogoImage && <img src={effectiveLogoImage} alt={effectiveLogoText} className="h-8 w-auto object-contain" />}
          {isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ logo: e.currentTarget.textContent || '' })}
              className="text-xl font-bold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: fg, fontFamily: theme.headingFont }}
            >{effectiveLogoText}</span>
          ) : (
            !effectiveLogoImage && effectiveLogoText ? (
              <span className="text-xl font-bold" style={{ color: fg, fontFamily: theme.headingFont }}>{effectiveLogoText}</span>
            ) : null
          )}
        </div>

        {/* Desktop links */}
        {!isMobile ? (
          <div className="flex items-center gap-1">
            {links.map((link, i) => {
              const hasChildren = link.children && link.children.length > 0;
              return (
                <div
                  key={i}
                  className="relative group/link"
                  onMouseEnter={() => hasChildren && handleDropdownEnter(i)}
                  onMouseLeave={() => hasChildren && handleDropdownLeave()}
                >
                  <div className="flex items-center gap-0.5">
                    {isEditing ? (
                      <div className="flex items-center gap-1">
                        {link.icon && <DynamicIcon name={link.icon} className="h-3.5 w-3.5 opacity-60" />}
                        <span
                          contentEditable suppressContentEditableWarning
                          onBlur={(e) => updateLink(i, 'label', e.currentTarget.textContent || '')}
                          className="text-sm font-medium outline-none focus:ring-1 focus:ring-primary/30 rounded px-1.5 py-1"
                          style={{ color: linkColor }}
                        >{link.label}</span>
                        {hasChildren && <ChevronDown className="h-3 w-3 opacity-40" style={{ color: linkColor }} />}
                        <button onClick={() => removeLink(i)} className="p-0.5 text-destructive opacity-0 group-hover/link:opacity-100 transition-opacity">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <a
                        href={hasChildren ? undefined : link.href}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-black/[0.04] cursor-pointer"
                        style={{ color: linkColor }}
                      >
                        {link.icon && <DynamicIcon name={link.icon} className="h-3.5 w-3.5" />}
                        {link.label}
                        {hasChildren && (
                          <ChevronDown
                            className={`h-3 w-3 opacity-50 transition-transform duration-200 ${openDropdown === i ? 'rotate-180' : ''}`}
                          />
                        )}
                      </a>
                    )}
                  </div>
                  {/* Dropdown */}
                  {!isEditing && (
                    <DesktopDropdown
                      items={link.children}
                      isOpen={openDropdown === i}
                      linkColor={linkColor}
                      theme={theme}
                      isEditing={isEditing}
                    />
                  )}
                </div>
              );
            })}

            {isEditing && (
              <button onClick={addLink} className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors">
                <Plus className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Language Switcher */}
            {showLanguageSwitcher && languages && languages.length > 0 && (
              <NavLanguageSwitcher
                variant={languageSwitcherVariant}
                languages={languages}
                currentLanguage={currentLanguage}
                theme={theme}
                linkColor={linkColor}
                isEditing={isEditing || false}
                onUpdate={onUpdate}
              />
            )}

            {/* Search icon */}
            {showSearch && !isEditing && (
              <button className="p-2 rounded-lg transition-colors hover:bg-black/[0.04] ml-1">
                <Search className="h-4 w-4" style={{ color: linkColor }} />
              </button>
            )}

            {/* CTA */}
            {(ctaText || isEditing) && (
              isEditing ? (
                <span
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ ctaText: e.currentTarget.textContent || '' })}
                  className="ml-2 px-5 py-2 text-sm font-semibold outline-none focus:ring-2 focus:ring-primary/50"
                  style={{
                    ...getButtonStyle('primary', theme, ctaColor, ctaTextColor),
                  }}
                >{ctaText || 'Add CTA...'}</span>
              ) : ctaText ? (
                <a
                  href={ctaLink || '#'}
                  className="ml-2 px-5 py-2 text-sm font-semibold transition-all hover:scale-105"
                  style={{
                    ...getButtonStyle('primary', theme, ctaColor, ctaTextColor),
                    boxShadow: theme.shadowStyle !== 'none' ? getThemeShadow(theme) : undefined,
                  }}
                >{ctaText}</a>
              ) : null
            )}
          </div>
        ) : (
          /* Mobile hamburger */
          <button
            onClick={(e) => { e.stopPropagation(); setMobileOpen(true); }}
            className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
          >
            <Menu className="h-5 w-5" style={{ color: fg }} />
          </button>
        )}
      </div>

      {/* Mobile sidebar */}
      <MobileSidebar
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        logo={effectiveLogoText}
        logoImage={effectiveLogoImage}
        links={links}
        ctaText={ctaText}
        ctaLink={ctaLink}
        ctaColor={ctaColor}
        ctaTextColor={ctaTextColor}
        socialLinks={socialLinks}
        showSearch={showSearch}
        showLanguageSwitcher={showLanguageSwitcher}
        languages={languages}
        currentLanguage={currentLanguage}
        onUpdate={onUpdate}
        theme={theme}
        isEditing={isEditing || false}
      />
    </nav>
  );
}
