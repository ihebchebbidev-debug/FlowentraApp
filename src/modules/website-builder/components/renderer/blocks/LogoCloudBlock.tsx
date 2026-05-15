import React from 'react';
import { SiteTheme } from '../../../types';
import { Plus, Trash2 } from 'lucide-react';

interface LogoCloudBlockProps {
  title?: string;
  logos: string[];
  bgColor?: string;
  theme: SiteTheme;
  isEditing?: boolean;
  onUpdate?: (props: Record<string, any>) => void;
  style?: React.CSSProperties;
}

export function LogoCloudBlock({ title, logos, bgColor, theme, isEditing, onUpdate, style }: LogoCloudBlockProps) {
  const handleAddLogo = () => {
    const url = prompt('Enter logo image URL:');
    if (url) onUpdate?.({ logos: [...logos, url] });
  };

  const removeLogo = (index: number) => {
    onUpdate?.({ logos: logos.filter((_, i) => i !== index) });
  };

  return (
    <section className="py-12 px-6" style={{ fontFamily: theme.bodyFont, backgroundColor: bgColor || 'transparent', ...style }}>
      <div className="max-w-5xl mx-auto">
        {(title || isEditing) && (
          isEditing ? (
            <p
              contentEditable suppressContentEditableWarning
              onBlur={(e) => onUpdate?.({ title: e.currentTarget.textContent || '' })}
              className="text-xs font-semibold uppercase tracking-widest text-center mb-8 opacity-50 outline-none focus:ring-1 focus:ring-primary/30 rounded px-1"
              style={{ color: theme.secondaryColor }}
            >{title || 'Add title...'}</p>
          ) : title ? (
            <p className="text-xs font-semibold uppercase tracking-widest text-center mb-8 opacity-50" style={{ color: theme.secondaryColor }}>{title}</p>
          ) : null
        )}
        <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
          {logos.length > 0 ? logos.map((logo, i) => (
            <div key={i} className="relative group/logo">
              <img src={logo} alt="" className="h-8 md:h-10 object-contain opacity-50 hover:opacity-100 transition-opacity grayscale hover:grayscale-0" />
              {isEditing && (
                <button onClick={() => removeLogo(i)} className="absolute -top-2 -right-2 p-0.5 rounded-full bg-destructive/80 text-white opacity-0 group-hover/logo:opacity-100 transition-opacity">
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              )}
            </div>
          )) : (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 w-24 rounded bg-muted flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground">Logo {i + 1}</span>
              </div>
            ))
          )}
        </div>
        {isEditing && (
          <div className="text-center mt-6">
            <button onClick={handleAddLogo} className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
              <Plus className="h-3 w-3" /> Add Logo
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
