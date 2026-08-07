import React from 'react';
import { SiteTheme } from '../../../types';
import { ComponentAction } from '../../../types/shared';
import { Plus, Trash2 } from 'lucide-react';
import { DynamicIcon } from '../../editor/IconPicker';
import { ActionLink } from '../ActionButton';
import { sanitizeHtml } from '@/utils/sanitize';
import {
  getHeadingStyle,
  getScaledFontSize,
  getSectionPadding,
  // getThemeShadow removed — unused
  getLinkClass,
} from '../../../utils/themeUtils';

type FooterVariant = 'default' | 'columns' | 'centered' | 'branded' | 'minimal';

interface FooterBlockProps {
  companyName: string;
  links: Array<{ label: string; href: string; action?: ComponentAction }>;
  copyright?: string;
  bgColor?: string;
  textColor?: string;
  showSocial?: boolean;
  socialLinks?: Array<{ platform: string; url: string; action?: ComponentAction }>;
  columns?: number;
  description?: string;
  logoImage?: string;
  variant?: FooterVariant;
  linkGroups?: Array<{ title: string; links: Array<{ label: string; href: string; action?: ComponentAction }> }>;
  phone?: string;
  email?: string;
  address?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function FooterBlock({
  companyName, links, copyright, bgColor, textColor: footerTextColor, showSocial = false,
  socialLinks = [], columns: _columns, description, logoImage, variant = 'default',
  linkGroups = [], phone, email, address,
  theme, isEditing, onUpdate, style,
}: FooterBlockProps) {
  const year = new Date().getFullYear();
  const dir = theme.direction || 'ltr';
  const bg = bgColor || theme.textColor;
  const fg = footerTextColor || '#ffffff';

  // Theme-derived styles
  const headingStyles = getHeadingStyle(theme, { color: fg });
  const sectionPadding = getSectionPadding(theme, 48);
  const linkClassName = getLinkClass(theme);

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

  const copyrightText = copyright || `© ${year} ${companyName}. All rights reserved.`;

  const renderSocialLinks = (size: 'sm' | 'md' = 'sm') => {
    if (!showSocial && (!socialLinks || socialLinks.length === 0)) return null;
    const sz = size === 'md' ? 'w-10 h-10' : 'w-9 h-9';
    const iconSz = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
    return (
      <div className="flex items-center gap-3">
        {socialLinks.map((sl, i) => (
          <a
            key={i}
            href={isEditing ? undefined : sl.url}
            className={`${sz} rounded-full flex items-center justify-center transition-transform hover:scale-110 opacity-60 hover:opacity-100`}
            style={{ backgroundColor: fg + '15', color: fg, borderRadius: `${theme.borderRadius}px` }}
            title={sl.platform}
          >
            <DynamicIcon name={sl.platform} className={iconSz} />
          </a>
        ))}
      </div>
    );
  };

  const renderEditableCompanyName = () =>
    isEditing ? (
      <span
        contentEditable suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ companyName: e.currentTarget.textContent || '' })}
        className="text-lg font-bold outline-none focus:ring-1 focus:ring-primary/30 rounded px-1 block"
        style={{ ...headingStyles, fontSize: getScaledFontSize(18, theme) }}
      >{companyName}</span>
    ) : (
      <span className="text-lg font-bold" style={{ ...headingStyles, fontSize: getScaledFontSize(18, theme) }}>{companyName}</span>
    );

  const renderEditableDescription = () => {
    if (!description && !isEditing) return null;
    return isEditing ? (
      <p
        contentEditable suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ description: e.currentTarget.innerHTML })}
        className="mt-1 opacity-50 outline-none focus:ring-1 focus:ring-white/20 rounded px-1 max-w-xs"
        style={{ color: fg, fontSize: getScaledFontSize(12, theme), fontFamily: theme.bodyFont }}
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(description || 'Add description...') }}
      />
    ) : (
      <p 
        className="mt-1 opacity-50 max-w-xs" 
        style={{ color: fg, fontSize: getScaledFontSize(12, theme), fontFamily: theme.bodyFont }} 
        dangerouslySetInnerHTML={{ __html: sanitizeHtml(description) }} 
      />
    );
  };

  const renderLinks = () => (
    <div className="flex items-center gap-4 flex-wrap">
      {links.map((link, i) => (
        <div key={i} className="relative group/flink flex items-center gap-0.5">
          {isEditing ? (
            <span
              contentEditable suppressContentEditableWarning
              onBlur={(e) => updateLink(i, 'label', e.currentTarget.textContent || '')}
              className="opacity-60 outline-none focus:ring-1 focus:ring-white/30 rounded px-0.5"
              style={{ color: fg, fontSize: getScaledFontSize(14, theme), fontFamily: theme.bodyFont }}
            >{link.label}</span>
          ) : (
            <ActionLink 
              action={link.action}
              href={link.href} 
              className={`opacity-60 hover:opacity-80 transition-colors ${linkClassName}`} 
              style={{ color: fg, fontSize: getScaledFontSize(14, theme), fontFamily: theme.bodyFont }}
            >{link.label}</ActionLink>
          )}
          {isEditing && (
            <button onClick={() => removeLink(i)} className="p-0.5 text-destructive opacity-0 group-hover/flink:opacity-100 transition-opacity">
              <Trash2 className="h-3 w-3" />
            </button>
          )}
        </div>
      ))}
      {isEditing && (
        <button onClick={addLink} className="p-1 opacity-60 hover:opacity-80 hover:bg-white/10 rounded transition-colors" style={{ color: fg }}>
          <Plus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  const renderCopyright = () =>
    isEditing ? (
      <p
        contentEditable suppressContentEditableWarning
        onBlur={(e) => onUpdate?.({ copyright: e.currentTarget.textContent || '' })}
        className="opacity-40 outline-none focus:ring-1 focus:ring-white/20 rounded px-1"
        style={{ color: fg, fontSize: getScaledFontSize(12, theme), fontFamily: theme.bodyFont }}
      >{copyrightText}</p>
    ) : (
      <p className="opacity-40" style={{ color: fg, fontSize: getScaledFontSize(12, theme), fontFamily: theme.bodyFont }}>{copyrightText}</p>
    );

  const renderLogo = () =>
    logoImage ? <img src={logoImage} alt={companyName} className="h-8 w-auto object-contain" /> : null;

  // ── Variant: columns ──
  if (variant === 'columns') {
    return (
      <footer 
        dir={dir} 
        className="border-t" 
        style={{ 
          backgroundColor: bg, 
          paddingTop: `${sectionPadding}px`, 
          paddingBottom: `${sectionPadding}px`, 
          paddingLeft: '24px', 
          paddingRight: '24px',
          fontFamily: theme.bodyFont,
          ...style 
        }}
      >
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand column */}
            <div className="md:col-span-1">
              <div className="flex items-center gap-3 mb-3">
                {renderLogo()}
                {renderEditableCompanyName()}
              </div>
              {renderEditableDescription()}
              <div className="mt-4">{renderSocialLinks()}</div>
            </div>
            {/* Link groups */}
            {linkGroups.map((group, gi) => (
              <div key={gi}>
                <h4 
                  className="font-semibold mb-3 opacity-80" 
                  style={{ color: fg, fontSize: getScaledFontSize(14, theme), fontFamily: theme.headingFont }}
                >{group.title}</h4>
                <ul className="space-y-2">
                  {group.links.map((l, li) => (
                    <li key={li}>
                      <a 
                        href={isEditing ? undefined : l.href} 
                        className={`opacity-50 hover:opacity-80 transition-colors ${linkClassName}`} 
                        style={{ color: fg, fontSize: getScaledFontSize(14, theme) }}
                      >{l.label}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {/* Fallback if no link groups */}
            {linkGroups.length === 0 && (
              <>
                <div>
                  <h4 className="font-semibold mb-3 opacity-80" style={{ color: fg, fontSize: getScaledFontSize(14, theme), fontFamily: theme.headingFont }}>Quick Links</h4>
                  <ul className="space-y-2">
                    {links.map((l, i) => (
                      <li key={i}>
                        <a 
                          href={isEditing ? undefined : l.href} 
                          className={`opacity-50 hover:opacity-80 transition-colors ${linkClassName}`}
                          style={{ color: fg, fontSize: getScaledFontSize(14, theme) }}
                        >{l.label}</a>
                      </li>
                    ))}
                  </ul>
                </div>
                {(phone || email || address) && (
                  <div>
                    <h4 className="font-semibold mb-3 opacity-80" style={{ color: fg, fontSize: getScaledFontSize(14, theme), fontFamily: theme.headingFont }}>Contact</h4>
                    <ul className="space-y-2 opacity-50" style={{ color: fg, fontSize: getScaledFontSize(14, theme) }}>
                      {phone && <li className="flex items-center gap-2"><DynamicIcon name="Phone" className="h-3.5 w-3.5" />{phone}</li>}
                      {email && <li className="flex items-center gap-2"><DynamicIcon name="Mail" className="h-3.5 w-3.5" />{email}</li>}
                      {address && <li className="flex items-center gap-2"><DynamicIcon name="MapPin" className="h-3.5 w-3.5" />{address}</li>}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
          <div className="mt-10 pt-6 border-t border-white/10 text-center">
            {renderCopyright()}
          </div>
        </div>
      </footer>
    );
  }

  // ── Variant: centered ──
  if (variant === 'centered') {
    return (
      <footer 
        dir={dir} 
        className="border-t" 
        style={{ 
          backgroundColor: bg, 
          paddingTop: `${sectionPadding * 0.75}px`, 
          paddingBottom: `${sectionPadding * 0.75}px`, 
          paddingLeft: '24px', 
          paddingRight: '24px',
          fontFamily: theme.bodyFont,
          ...style 
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          {renderLogo() && <div className="flex justify-center mb-4">{renderLogo()}</div>}
          <div className="mb-2">{renderEditableCompanyName()}</div>
          {renderEditableDescription()}
          <div className="my-6">{renderLinks()}</div>
          <div className="flex justify-center mb-6">{renderSocialLinks('md')}</div>
          {renderCopyright()}
        </div>
      </footer>
    );
  }

  // ── Variant: branded (large logo emphasis) ──
  if (variant === 'branded') {
    return (
      <footer 
        dir={dir} 
        className="border-t" 
        style={{ 
          backgroundColor: bg, 
          paddingTop: `${sectionPadding}px`, 
          paddingBottom: `${sectionPadding}px`, 
          paddingLeft: '24px', 
          paddingRight: '24px',
          fontFamily: theme.bodyFont,
          ...style 
        }}
      >
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center mb-8">
            {logoImage ? (
              <img src={logoImage} alt={companyName} className="h-16 w-auto object-contain mb-4" />
            ) : (
              <div className="font-bold mb-4" style={{ ...headingStyles, fontSize: getScaledFontSize(30, theme) }}>{companyName}</div>
            )}
            {renderEditableDescription()}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 py-6 border-t border-b border-white/10">
            {renderLinks()}
            {renderSocialLinks()}
          </div>
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mt-6">
            {renderCopyright()}
            {(phone || email) && (
              <div className="flex items-center gap-4 opacity-50" style={{ color: fg, fontSize: getScaledFontSize(12, theme) }}>
                {phone && <span className="flex items-center gap-1"><DynamicIcon name="Phone" className="h-3 w-3" />{phone}</span>}
                {email && <span className="flex items-center gap-1"><DynamicIcon name="Mail" className="h-3 w-3" />{email}</span>}
              </div>
            )}
          </div>
        </div>
      </footer>
    );
  }

  // ── Variant: minimal ──
  if (variant === 'minimal') {
    return (
      <footer 
        dir={dir} 
        className="border-t" 
        style={{ 
          backgroundColor: bg, 
          paddingTop: `${sectionPadding * 0.4}px`, 
          paddingBottom: `${sectionPadding * 0.4}px`, 
          paddingLeft: '24px', 
          paddingRight: '24px',
          fontFamily: theme.bodyFont,
          ...style 
        }}
      >
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {renderLogo()}
            <span className="font-medium" style={{ ...headingStyles, fontSize: getScaledFontSize(14, theme) }}>{companyName}</span>
          </div>
          {renderLinks()}
          <div className="flex items-center gap-4">
            {renderSocialLinks()}
            <span className="opacity-40" style={{ color: fg, fontSize: getScaledFontSize(12, theme) }}>{copyrightText}</span>
          </div>
        </div>
      </footer>
    );
  }

  // ── Default variant ──
  return (
    <footer 
      dir={dir} 
      className="border-t" 
      style={{ 
        backgroundColor: bg, 
        paddingTop: `${sectionPadding * 0.75}px`, 
        paddingBottom: `${sectionPadding * 0.75}px`, 
        paddingLeft: '24px', 
        paddingRight: '24px',
        fontFamily: theme.bodyFont,
        ...style 
      }}
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            {renderLogo()}
            <div>
              {renderEditableCompanyName()}
              {renderEditableDescription()}
            </div>
          </div>
          {renderLinks()}
        </div>

        {(showSocial || (socialLinks && socialLinks.length > 0)) && (
          <div className="mt-6 flex items-center justify-center gap-3">
            {renderSocialLinks()}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-white/10 text-center">
          {renderCopyright()}
        </div>
      </div>
    </footer>
  );
}
