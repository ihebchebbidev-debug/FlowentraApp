import React, { useState, useRef } from 'react';
import { SiteTheme, DeviceView } from '../../../types';
import { Menu, X, ChevronDown, ChevronRight, ArrowRight, Search } from 'lucide-react';
import { DynamicIcon } from '../../editor/IconPicker';

interface MegaMenuItem {
  title: string;
  description?: string;
  href: string;
  icon?: string;
}

interface MegaMenu {
  label: string;
  icon?: string;
  items: MegaMenuItem[];
}

interface MegaMenuBlockProps {
  logo: string;
  logoImage?: string;
  menus: MegaMenu[];
  ctaText?: string;
  ctaLink?: string;
  ctaColor?: string;
  ctaTextColor?: string;
  showSearch?: boolean;
  variant?: 'default' | 'cards' | 'grid';
  theme: SiteTheme;
  device?: DeviceView;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function MegaMenuBlock({
  logo, logoImage, menus, ctaText, ctaLink, ctaColor, ctaTextColor,
  showSearch, variant = 'default',
  theme, device, isEditing, onUpdate, style,
}: MegaMenuBlockProps) {
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedMobile, setExpandedMobile] = useState<number | null>(null);
  const isMobile = device === 'mobile' || device === 'tablet';
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const fg = theme.textColor;
  const bg = theme.backgroundColor;

  const handleEnter = (idx: number) => {
    clearTimeout(timeoutRef.current);
    setOpenMenu(idx);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpenMenu(null), 120);
  };

  /* ── Desktop Dropdown Panel ── */
  const renderDropdown = (menu: MegaMenu, idx: number) => {
    if (openMenu !== idx) return null;
    const isCards = variant === 'cards';
    const isGrid = variant === 'grid';
    const cols = menu.items.length <= 3 ? menu.items.length : menu.items.length <= 6 ? 3 : 4;

    return (
      <div
        className="absolute top-full left-1/2 pt-2 z-50"
        style={{ transform: 'translateX(-50%)', minWidth: isGrid ? 500 : 320 }}
        onMouseEnter={() => handleEnter(idx)}
        onMouseLeave={handleLeave}
      >
        <div
          className="rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md"
          style={{ backgroundColor: bg + 'f8', borderColor: fg + '10' }}
        >
          {/* Header label */}
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: fg + '08' }}>
            {menu.icon && <DynamicIcon name={menu.icon} className="h-4 w-4 opacity-50" />}
            <span className="text-xs font-bold uppercase tracking-wider opacity-40" style={{ color: fg }}>
              {menu.label}
            </span>
          </div>

          <div className={`p-3 ${isGrid ? `grid grid-cols-${Math.min(cols, 4)} gap-1` : 'space-y-0.5'}`}>
            {menu.items.map((item, ii) => (
              <a
                key={ii}
                href={isEditing ? undefined : item.href}
                className={`flex items-start gap-3 rounded-xl transition-colors hover:bg-black/[0.04] ${
                  isCards ? 'p-4 border' : 'px-4 py-3'
                }`}
                style={isCards ? { borderColor: fg + '08' } : undefined}
              >
                {item.icon && (
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: theme.primaryColor + '10' }}
                  >
                    <DynamicIcon name={item.icon} className="h-4 w-4" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-tight" style={{ color: fg }}>
                    {item.title}
                  </p>
                  {item.description && (
                    <p className="text-xs mt-1 leading-relaxed opacity-50" style={{ color: fg }}>
                      {item.description}
                    </p>
                  )}
                </div>
                <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-30 mt-0.5 shrink-0" style={{ color: fg }} />
              </a>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <nav
      className="relative border-b"
      style={{ backgroundColor: bg, fontFamily: theme.bodyFont, borderColor: fg + '10', ...style }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="flex items-center gap-2.5">
          {logoImage && <img src={logoImage} alt={logo} className="h-8 w-auto object-contain" />}
          {isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ logo: e.currentTarget.textContent || '' })}
              className="text-lg font-bold outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
              style={{ color: fg, fontFamily: theme.headingFont }}
            >{logo}</span>
          ) : (
            !logoImage ? (
              <span className="text-lg font-bold" style={{ color: fg, fontFamily: theme.headingFont }}>{logo}</span>
            ) : null
          )}
        </div>

        {isMobile ? (
          /* ── Mobile hamburger ── */
          <>
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 rounded-xl hover:bg-black/[0.04] transition-colors"
            >
              <Menu className="h-5 w-5" style={{ color: fg }} />
            </button>

            {/* Mobile Drawer */}
            {mobileOpen && (
              <>
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] animate-in fade-in duration-200" onClick={() => setMobileOpen(false)} />
                <div
                  className="fixed top-0 right-0 bottom-0 w-[300px] z-[101] shadow-2xl animate-in slide-in-from-right duration-250 flex flex-col"
                  style={{ backgroundColor: bg }}
                >
                  {/* Drawer Header */}
                  <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: fg + '12' }}>
                    <div className="flex items-center gap-2">
                      {logoImage && <img src={logoImage} alt={logo} className="h-6 w-auto object-contain" />}
                      <span className="font-bold" style={{ color: fg, fontFamily: theme.headingFont }}>{logo}</span>
                    </div>
                    <button onClick={() => setMobileOpen(false)} className="p-2 rounded-xl hover:bg-black/5">
                      <X className="h-4 w-4" style={{ color: fg }} />
                    </button>
                  </div>

                  {/* Search */}
                  {showSearch && (
                    <div className="px-5 py-3">
                      <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ backgroundColor: fg + '06' }}>
                        <Search className="h-3.5 w-3.5 opacity-40" style={{ color: fg }} />
                        <span className="text-sm opacity-40" style={{ color: fg }}>Search...</span>
                      </div>
                    </div>
                  )}

                  {/* Menu items */}
                  <div className="flex-1 overflow-y-auto px-3 py-2">
                    {menus.map((menu, mi) => {
                      const isExp = expandedMobile === mi;
                      return (
                        <div key={mi} className="mb-1">
                          <button
                            onClick={() => setExpandedMobile(isExp ? null : mi)}
                            className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-colors hover:bg-black/[0.03]"
                            style={{ color: fg }}
                          >
                            {menu.icon && <DynamicIcon name={menu.icon} className="h-4 w-4 opacity-60" />}
                            <span className="flex-1 text-left">{menu.label}</span>
                            <ChevronDown
                              className={`h-3.5 w-3.5 opacity-40 transition-transform duration-200 ${isExp ? 'rotate-180' : ''}`}
                            />
                          </button>
                          {isExp && (
                            <div className="ml-3 pl-3 border-l-2 space-y-0.5 mb-2" style={{ borderColor: theme.primaryColor + '20' }}>
                              {menu.items.map((item, ii) => (
                                <a
                                  key={ii}
                                  href={isEditing ? undefined : item.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors hover:bg-black/[0.03]"
                                  style={{ color: fg }}
                                >
                                  {item.icon && <DynamicIcon name={item.icon} className="h-3.5 w-3.5 opacity-50" />}
                                  <div className="min-w-0">
                                    <span className="block text-[13px]">{item.title}</span>
                                    {item.description && (
                                      <span className="block text-[11px] opacity-40 truncate">{item.description}</span>
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

                  {/* CTA */}
                  {ctaText && (
                    <div className="px-5 py-3 border-t" style={{ borderColor: fg + '08' }}>
                      <a
                        href={isEditing ? undefined : ctaLink}
                        className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-semibold"
                        style={{
                          backgroundColor: ctaColor || theme.primaryColor,
                          color: ctaTextColor || '#ffffff',
                          borderRadius: theme.borderRadius,
                        }}
                      >
                        {ctaText}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        ) : (
          /* ── Desktop menus ── */
          <div className="flex items-center gap-1">
            {menus.map((menu, mi) => (
              <div
                key={mi}
                className="relative"
                onMouseEnter={() => handleEnter(mi)}
                onMouseLeave={handleLeave}
              >
                <button
                  className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    openMenu === mi ? 'bg-black/[0.04]' : 'hover:bg-black/[0.03]'
                  }`}
                  style={{ color: fg }}
                >
                  {menu.icon && <DynamicIcon name={menu.icon} className="h-3.5 w-3.5 opacity-60" />}
                  {menu.label}
                  <ChevronDown
                    className={`h-3 w-3 opacity-40 transition-transform duration-200 ${openMenu === mi ? 'rotate-180' : ''}`}
                  />
                </button>
                {renderDropdown(menu, mi)}
              </div>
            ))}

            {showSearch && (
              <button className="p-2 rounded-lg transition-colors hover:bg-black/[0.04] ml-1">
                <Search className="h-4 w-4" style={{ color: fg }} />
              </button>
            )}

            {ctaText && (
              <a
                href={isEditing ? undefined : ctaLink}
                className="ml-3 px-5 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105 hover:shadow-md"
                style={{
                  backgroundColor: ctaColor || theme.primaryColor,
                  color: ctaTextColor || '#ffffff',
                  borderRadius: theme.borderRadius,
                }}
              >
                {ctaText}
              </a>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
