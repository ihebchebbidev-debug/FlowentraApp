import React from 'react';
import { SiteTheme } from '../../../types';

interface UserProfileBlockProps {
  name: string;
  bio?: string;
  avatar?: string;
  coverImage?: string;
  stats?: Array<{ label: string; value: string }>;
  socialLinks?: Array<{ platform: string; url: string }>;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function UserProfileBlock({ name, bio, avatar, coverImage, stats, socialLinks, theme, isEditing, onUpdate, style }: UserProfileBlockProps) {
  const initials = name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="py-8 px-6" style={style}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl overflow-hidden border" style={{ borderRadius: theme.borderRadius }}>
          {/* Cover */}
          <div className="h-40 relative" style={{ background: coverImage ? `url(${coverImage}) center/cover` : `linear-gradient(135deg, ${theme.primaryColor}, ${theme.accentColor})` }}>
            {isEditing && (
              <button
                onClick={() => { const u = prompt('Cover image URL:', coverImage); if (u !== null) onUpdate?.({ coverImage: u }); }}
                className="absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] bg-black/50 text-white hover:bg-black/70"
              >Change Cover</button>
            )}
          </div>

          {/* Profile content */}
          <div className="px-6 pb-6 -mt-12 relative">
            <div className="w-24 h-24 rounded-full border-4 border-white overflow-hidden flex items-center justify-center text-2xl font-bold mb-4" style={{ backgroundColor: theme.primaryColor + '20', color: theme.primaryColor }}>
              {avatar ? <img src={avatar} alt={name} className="w-full h-full object-cover" /> : initials}
            </div>

            {isEditing ? (
              <h2
                contentEditable suppressContentEditableWarning
                onBlur={(e) => onUpdate?.({ name: e.currentTarget.textContent || '' })}
                className="text-xl font-bold outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
                style={{ color: theme.textColor, fontFamily: theme.headingFont }}
              >{name}</h2>
            ) : (
              <h2 className="text-xl font-bold" style={{ color: theme.textColor, fontFamily: theme.headingFont }}>{name}</h2>
            )}

            {bio && (
              isEditing ? (
                <p
                  contentEditable suppressContentEditableWarning
                  onBlur={(e) => onUpdate?.({ bio: e.currentTarget.textContent || '' })}
                  className="text-sm mt-2 outline-none focus:ring-1 focus:ring-primary/50 rounded px-1"
                  style={{ color: theme.secondaryColor }}
                >{bio}</p>
              ) : (
                <p className="text-sm mt-2" style={{ color: theme.secondaryColor }}>{bio}</p>
              )
            )}

            {/* Stats */}
            {stats && stats.length > 0 && (
              <div className="flex gap-6 mt-4 pt-4 border-t">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="font-bold text-lg" style={{ color: theme.textColor }}>{s.value}</p>
                    <p className="text-xs" style={{ color: theme.secondaryColor }}>{s.label}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Social */}
            {socialLinks && socialLinks.length > 0 && (
              <div className="flex gap-3 mt-4">
                {socialLinks.map((link, i) => (
                  <a key={i} href={isEditing ? undefined : link.url} className="px-3 py-1.5 rounded-lg text-xs font-medium border hover:bg-gray-50" style={{ borderRadius: theme.borderRadius, color: theme.textColor }}>
                    {link.platform}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
