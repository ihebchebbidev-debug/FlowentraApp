/**
 * LanguageSwitcherBlock — Enhanced language switcher with multiple display modes.
 * Supports dropdown, inline, flags, pills, vertical list, carousel, and sidebar modes.
 */
import React, { useState, useRef, useEffect } from 'react';
import { SiteTheme, SiteLanguage } from '../../../types';
import { Globe, ChevronDown, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import { getButtonStyle, getThemeShadow } from '../../../utils/themeUtils';

type SwitcherVariant = 
  | 'dropdown' 
  | 'inline' 
  | 'flags' 
  | 'button' 
  | 'pills' 
  | 'icon' 
  | 'text'
  // New variants
  | 'vertical'
  | 'carousel'
  | 'sidebar'
  | 'grid'
  | 'minimal'
  | 'floating';

interface LanguageSwitcherBlockProps {
  languages?: SiteLanguage[];
  currentLanguage?: string;
  variant?: SwitcherVariant;
  alignment?: 'left' | 'center' | 'right';
  showFlags?: boolean;
  showLabels?: boolean;
  showNativeNames?: boolean;
  compact?: boolean;
  bgColor?: string;
  textColor?: string;
  accentColor?: string;
  // Layout options
  columns?: 2 | 3 | 4;
  maxVisible?: number;
  // Animation
  animated?: boolean;
  // Behavior
  persistSelection?: boolean;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

const FLAG_EMOJIS: Record<string, string> = {
  en: '🇬🇧', 'en-us': '🇺🇸', 'en-gb': '🇬🇧', 'en-au': '🇦🇺', 'en-ca': '🇨🇦',
  fr: '🇫🇷', 'fr-ca': '🇨🇦', 'fr-be': '🇧🇪', 'fr-ch': '🇨🇭',
  es: '🇪🇸', 'es-mx': '🇲🇽', 'es-ar': '🇦🇷',
  de: '🇩🇪', 'de-at': '🇦🇹', 'de-ch': '🇨🇭',
  it: '🇮🇹', pt: '🇵🇹', 'pt-br': '🇧🇷',
  nl: '🇳🇱', 'nl-be': '🇧🇪',
  ru: '🇷🇺', uk: '🇺🇦',
  zh: '🇨🇳', 'zh-tw': '🇹🇼', 'zh-hk': '🇭🇰',
  ja: '🇯🇵', ko: '🇰🇷',
  ar: '🇸🇦', 'ar-eg': '🇪🇬', 'ar-ma': '🇲🇦',
  he: '🇮🇱', fa: '🇮🇷', ur: '🇵🇰',
  tr: '🇹🇷', hi: '🇮🇳', bn: '🇧🇩',
  th: '🇹🇭', vi: '🇻🇳', id: '🇮🇩', ms: '🇲🇾',
  pl: '🇵🇱', cs: '🇨🇿', sk: '🇸🇰', hu: '🇭🇺', ro: '🇷🇴',
  sv: '🇸🇪', da: '🇩🇰', fi: '🇫🇮', no: '🇳🇴', nb: '🇳🇴',
  el: '🇬🇷', bg: '🇧🇬', hr: '🇭🇷', sr: '🇷🇸', sl: '🇸🇮',
};

const DEFAULT_LANGS: SiteLanguage[] = [
  { code: 'en', label: 'English', direction: 'ltr' },
  { code: 'fr', label: 'Français', direction: 'ltr' },
  { code: 'es', label: 'Español', direction: 'ltr' },
  { code: 'ar', label: 'العربية', direction: 'rtl' },
];

export function LanguageSwitcherBlock({
  languages = DEFAULT_LANGS,
  currentLanguage = 'en',
  variant = 'dropdown',
  alignment = 'right',
  showFlags = true,
  showLabels = true,
  showNativeNames = true,
  compact = false,
  bgColor,
  textColor,
  accentColor,
  columns = 2,
  maxVisible = 5,
  animated = true,
  persistSelection = true,
  theme,
  isEditing,
  onUpdate,
  style,
}: LanguageSwitcherBlockProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const dir = theme.direction || 'ltr';
  const alignClass = alignment === 'left' ? 'justify-start' : alignment === 'center' ? 'justify-center' : 'justify-end';
  const bg = bgColor || 'transparent';
  const fg = textColor || theme.textColor;
  const accent = accentColor || theme.primaryColor;
  const currentLang = languages.find((l) => l.code === currentLanguage) || languages[0];
  const borderRadius = theme.buttonStyle === 'pill' ? '9999px' : 
                       theme.buttonStyle === 'square' ? '0px' : 
                       `${theme.borderRadius}px`;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [isOpen]);

  const handleSelect = (code: string) => {
    if (!isEditing) onUpdate?.({ currentLanguage: code });
    setIsOpen(false);
    setSidebarOpen(false);
  };

  const getFlag = (code: string) => FLAG_EMOJIS[code] || FLAG_EMOJIS[code.split('-')[0]] || '🌐';

  const transitionClass = animated ? 'transition-all duration-200' : '';

  // ═══ VERTICAL VARIANT ═══
  // Languages stacked vertically, one per line
  if (variant === 'vertical') {
    return (
      <section dir={dir} className={`py-4 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="flex flex-col gap-1 min-w-[180px]" ref={containerRef}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg ${transitionClass} ${
                lang.code === currentLanguage
                  ? 'bg-primary/10 ring-1 ring-primary/30'
                  : 'hover:bg-muted/50'
              }`}
              style={{ 
                color: lang.code === currentLanguage ? accent : fg,
                borderRadius,
              }}
              onClick={() => handleSelect(lang.code)}
            >
              {showFlags && <span className="text-xl">{getFlag(lang.code)}</span>}
              <div className="flex-1 text-left">
                {showLabels && (
                  <span className="font-medium text-sm">{lang.label}</span>
                )}
                {showNativeNames && lang.code !== currentLanguage && (
                  <span className="text-xs opacity-60 ml-2">({lang.code.toUpperCase()})</span>
                )}
              </div>
              {lang.code === currentLanguage && <Check className="h-4 w-4" />}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // ═══ CAROUSEL VARIANT ═══
  // One language at a time with prev/next arrows
  if (variant === 'carousel') {
    const currentIndex = languages.findIndex(l => l.code === currentLanguage);
    const displayIndex = currentIndex >= 0 ? currentIndex : 0;
    const displayLang = languages[displayIndex];
    
    const goPrev = () => {
      const newIndex = (displayIndex - 1 + languages.length) % languages.length;
      handleSelect(languages[newIndex].code);
    };
    
    const goNext = () => {
      const newIndex = (displayIndex + 1) % languages.length;
      handleSelect(languages[newIndex].code);
    };

    return (
      <section dir={dir} className={`py-3 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="flex items-center gap-2" ref={containerRef}>
          <button
            className={`p-1.5 rounded-lg hover:bg-muted/50 ${transitionClass}`}
            style={{ color: fg }}
            onClick={goPrev}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          
          <div 
            className={`flex items-center gap-2 px-4 py-2 rounded-lg min-w-[140px] justify-center ${transitionClass}`}
            style={{ backgroundColor: accent + '10', borderRadius }}
          >
            {showFlags && <span className="text-xl">{getFlag(displayLang?.code || 'en')}</span>}
            {showLabels && (
              <span className="font-medium text-sm" style={{ color: accent }}>
                {compact ? displayLang?.code.toUpperCase() : displayLang?.label}
              </span>
            )}
          </div>
          
          <button
            className={`p-1.5 rounded-lg hover:bg-muted/50 ${transitionClass}`}
            style={{ color: fg }}
            onClick={goNext}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          
          {/* Dots indicator */}
          <div className="flex items-center gap-1 ml-2">
            {languages.map((lang, i) => (
              <button
                key={lang.code}
                className={`rounded-full ${transitionClass} ${
                  i === displayIndex ? 'w-4 h-1.5' : 'w-1.5 h-1.5 opacity-40 hover:opacity-70'
                }`}
                style={{ backgroundColor: accent }}
                onClick={() => handleSelect(lang.code)}
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ═══ SIDEBAR VARIANT ═══
  // Full sidebar panel with all languages
  if (variant === 'sidebar') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <button
          className={`flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted/50 ${transitionClass}`}
          style={{ color: fg, borderRadius, borderColor: fg + '20' }}
          onClick={() => setSidebarOpen(true)}
        >
          {showFlags && <span className="text-base">{getFlag(currentLang?.code || 'en')}</span>}
          <Globe className="h-4 w-4" />
          {showLabels && <span className="text-sm font-medium">{currentLang?.label}</span>}
        </button>
        
        {/* Sidebar overlay */}
        {sidebarOpen && (
          <>
            <div 
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-200"
              onClick={() => setSidebarOpen(false)}
            />
            <div 
              className={`fixed top-0 ${dir === 'rtl' ? 'left-0' : 'right-0'} bottom-0 w-[300px] bg-background z-[101] shadow-2xl animate-in ${dir === 'rtl' ? 'slide-in-from-left' : 'slide-in-from-right'} duration-300 flex flex-col`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5" style={{ color: accent }} />
                  <span className="font-semibold">Select Language</span>
                </div>
                <button
                  className="p-2 rounded-lg hover:bg-muted/50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Languages list */}
              <div className="flex-1 overflow-y-auto p-4">
                <div className="space-y-1">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl ${transitionClass} ${
                        lang.code === currentLanguage
                          ? 'bg-primary/10'
                          : 'hover:bg-muted/50'
                      }`}
                      style={{ color: lang.code === currentLanguage ? accent : fg }}
                      onClick={() => handleSelect(lang.code)}
                    >
                      <span className="text-2xl">{getFlag(lang.code)}</span>
                      <div className="flex-1 text-left">
                        <div className="font-medium">{lang.label}</div>
                        <div className="text-xs opacity-60">
                          {lang.code.toUpperCase()} • {lang.direction.toUpperCase()}
                        </div>
                      </div>
                      {lang.code === currentLanguage && (
                        <Check className="h-5 w-5" style={{ color: accent }} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Footer */}
              <div className="px-5 py-3 border-t text-center text-xs text-muted-foreground">
                {languages.length} languages available
              </div>
            </div>
          </>
        )}
      </section>
    );
  }

  // ═══ GRID VARIANT ═══
  // Grid layout with columns
  if (variant === 'grid') {
    return (
      <section dir={dir} className={`py-4 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div 
          className={`grid gap-2`}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          ref={containerRef}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl ${transitionClass} ${
                lang.code === currentLanguage
                  ? 'bg-primary/10 ring-2 ring-primary/30'
                  : 'hover:bg-muted/50 border border-border/30'
              }`}
              style={{ 
                color: lang.code === currentLanguage ? accent : fg,
                borderRadius,
              }}
              onClick={() => handleSelect(lang.code)}
            >
              {showFlags && <span className="text-3xl">{getFlag(lang.code)}</span>}
              {showLabels && (
                <span className="font-medium text-sm text-center">
                  {compact ? lang.code.toUpperCase() : lang.label}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // ═══ MINIMAL VARIANT ═══
  // Just code text, super minimal
  if (variant === 'minimal') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="flex items-center gap-1" ref={containerRef}>
          {languages.slice(0, maxVisible).map((lang, i) => (
            <React.Fragment key={lang.code}>
              {i > 0 && <span className="text-xs opacity-30 mx-1">/</span>}
              <button
                className={`text-xs font-medium ${transitionClass} ${
                  lang.code === currentLanguage
                    ? 'opacity-100'
                    : 'opacity-50 hover:opacity-80'
                }`}
                style={{ color: lang.code === currentLanguage ? accent : fg }}
                onClick={() => handleSelect(lang.code)}
              >
                {lang.code.toUpperCase()}
              </button>
            </React.Fragment>
          ))}
        </div>
      </section>
    );
  }

  // ═══ FLOATING VARIANT ═══
  // Floating button with expanded dropdown
  if (variant === 'floating') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="relative" ref={containerRef}>
          <button
            className={`w-12 h-12 rounded-full shadow-lg flex items-center justify-center text-2xl ${transitionClass} hover:scale-110`}
            style={{ 
              backgroundColor: accent,
              boxShadow: `0 4px 20px ${accent}40`,
            }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {getFlag(currentLang?.code || 'en')}
          </button>
          
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div
                className={`absolute bottom-full mb-3 ${dir === 'rtl' ? 'left-0' : 'right-0'} z-50 min-w-[200px] bg-card border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200`}
                style={{ borderRadius: '16px' }}
              >
                <div className="p-2">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${transitionClass} ${
                        lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                      }`}
                      style={{ color: lang.code === currentLanguage ? accent : fg }}
                      onClick={() => handleSelect(lang.code)}
                    >
                      <span className="text-xl">{getFlag(lang.code)}</span>
                      <span className="flex-1 text-left font-medium text-sm">{lang.label}</span>
                      {lang.code === currentLanguage && <Check className="h-4 w-4" />}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  // ═══ EXISTING VARIANTS (unchanged) ═══

  // Icon-only variant
  if (variant === 'icon') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="relative" ref={containerRef}>
          <button
            className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 ${transitionClass}`}
            style={{ borderRadius, color: fg }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Globe className="h-5 w-5" />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div
                className="absolute top-full mt-1 right-0 z-50 min-w-[160px] bg-card border rounded-lg shadow-lg overflow-hidden"
                style={{ borderRadius }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full px-3 py-2.5 text-sm font-medium text-left flex items-center gap-2.5 ${transitionClass} ${
                      lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    style={{ color: lang.code === currentLanguage ? accent : fg }}
                    onClick={() => handleSelect(lang.code)}
                  >
                    {showFlags && <span className="text-lg">{getFlag(lang.code)}</span>}
                    <span className="flex-1">{lang.label}</span>
                    {lang.code === currentLanguage && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  // Text-only variant
  if (variant === 'text') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="relative" ref={containerRef}>
          <button
            className={`inline-flex items-center gap-1.5 text-sm font-medium opacity-70 hover:opacity-100 ${transitionClass}`}
            style={{ fontFamily: theme.bodyFont, color: fg }}
            onClick={() => setIsOpen(!isOpen)}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>{currentLang?.code.toUpperCase()}</span>
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div
                className="absolute top-full mt-1 right-0 z-50 min-w-[140px] bg-card border rounded-lg shadow-lg overflow-hidden"
                style={{ borderRadius }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full px-3 py-2 text-sm font-medium text-left flex items-center gap-2 ${transitionClass} ${
                      lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    style={{ color: lang.code === currentLanguage ? accent : fg }}
                    onClick={() => handleSelect(lang.code)}
                  >
                    {showFlags && <span>{getFlag(lang.code)}</span>}
                    <span className="flex-1">{lang.label}</span>
                    {lang.code === currentLanguage && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  // Pills variant
  if (variant === 'pills') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div 
          className={`inline-flex items-center gap-1 p-1 bg-black/5 dark:bg-white/10 rounded-lg`}
          style={{ borderRadius }}
          ref={containerRef}
        >
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`px-3 py-1.5 text-sm font-medium ${transitionClass}`}
              style={{
                fontFamily: theme.bodyFont,
                borderRadius: `calc(${borderRadius} - 4px)`,
                backgroundColor: lang.code === currentLanguage ? theme.backgroundColor : 'transparent',
                color: lang.code === currentLanguage ? accent : fg,
                boxShadow: lang.code === currentLanguage ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              }}
              onClick={() => handleSelect(lang.code)}
            >
              {showFlags && <span className="mr-1.5">{getFlag(lang.code)}</span>}
              {showLabels ? (compact ? lang.code.toUpperCase() : lang.label) : ''}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Button variant
  if (variant === 'button') {
    const buttonStyle = getButtonStyle('outline', theme);
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="relative" ref={containerRef}>
          <button
            className={`flex items-center gap-2 px-3 py-2 border hover:bg-black/5 dark:hover:bg-white/10 ${transitionClass}`}
            style={{ ...buttonStyle, borderRadius }}
            onClick={() => setIsOpen(!isOpen)}
          >
            {showFlags && <span className="text-lg">{getFlag(currentLang?.code || 'en')}</span>}
            {showLabels && (
              <span className="font-medium" style={{ fontFamily: theme.bodyFont }}>
                {compact ? currentLang?.code.toUpperCase() : currentLang?.label}
              </span>
            )}
            <ChevronDown className={`h-3.5 w-3.5 opacity-60 ${transitionClass} ${isOpen ? 'rotate-180' : ''}`} />
          </button>
          {isOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
              <div
                className="absolute top-full mt-1 right-0 z-50 min-w-[180px] bg-card border rounded-lg shadow-lg overflow-hidden"
                style={{ borderRadius }}
              >
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    className={`w-full px-3 py-2.5 text-sm font-medium text-left flex items-center gap-2.5 ${transitionClass} ${
                      lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                    }`}
                    style={{ color: lang.code === currentLanguage ? accent : fg }}
                    onClick={() => handleSelect(lang.code)}
                  >
                    {showFlags && <span className="text-lg">{getFlag(lang.code)}</span>}
                    <div className="flex-1">
                      <div className="font-medium" style={{ fontFamily: theme.bodyFont }}>{lang.label}</div>
                      <div className="text-xs opacity-60">{lang.code.toUpperCase()}</div>
                    </div>
                    {lang.code === currentLanguage && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    );
  }

  // Inline variant
  if (variant === 'inline') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="flex items-center gap-2 flex-wrap" ref={containerRef}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${transitionClass} ${
                lang.code === currentLanguage
                  ? 'bg-primary/10 ring-1 ring-primary/30 scale-105'
                  : 'hover:bg-muted/50 hover:scale-102'
              }`}
              style={{ 
                color: lang.code === currentLanguage ? accent : fg,
                borderRadius,
              }}
              onClick={() => handleSelect(lang.code)}
            >
              {showFlags && <span className="mr-1.5 text-base">{getFlag(lang.code)}</span>}
              {showLabels ? (compact ? lang.code.toUpperCase() : lang.label) : ''}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Flags-only variant
  if (variant === 'flags') {
    return (
      <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
        <div className="flex items-center gap-1.5" ref={containerRef}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-xl ${transitionClass} ${
                lang.code === currentLanguage
                  ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-110'
                  : 'opacity-60 hover:opacity-100 hover:scale-105'
              }`}
              title={lang.label}
              onClick={() => handleSelect(lang.code)}
            >
              {getFlag(lang.code)}
            </button>
          ))}
        </div>
      </section>
    );
  }

  // Default: Dropdown variant
  return (
    <section dir={dir} className={`py-2 px-6 flex ${alignClass}`} style={{ backgroundColor: bg, ...style }}>
      <div className="relative" ref={containerRef}>
        <button
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm font-medium hover:bg-muted/50 ${transitionClass}`}
          style={{ color: fg, borderRadius }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Globe className="h-4 w-4" />
          {showFlags && <span className="text-base">{getFlag(currentLang?.code || 'en')}</span>}
          <span>{compact ? currentLang?.code.toUpperCase() : currentLang?.label}</span>
          <ChevronDown className={`h-3 w-3 ${transitionClass} ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div
              className="absolute top-full mt-1 right-0 z-50 min-w-[160px] bg-card border rounded-lg shadow-lg overflow-hidden"
              style={{ borderRadius }}
            >
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  className={`w-full px-3 py-2.5 text-sm font-medium text-left flex items-center gap-2 ${transitionClass} ${
                    lang.code === currentLanguage ? 'bg-primary/10' : 'hover:bg-muted/50'
                  }`}
                  style={{ color: lang.code === currentLanguage ? accent : fg }}
                  onClick={() => handleSelect(lang.code)}
                >
                  {showFlags && <span className="text-base">{getFlag(lang.code)}</span>}
                  <span className="flex-1">{lang.label}</span>
                  {lang.code === currentLanguage && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
