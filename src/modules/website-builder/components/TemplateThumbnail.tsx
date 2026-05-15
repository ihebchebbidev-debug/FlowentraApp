/**
 * TemplateThumbnail — Mini live preview of a template for gallery cards.
 * Renders actual template components at a very small scale.
 */
import React, { useMemo, useRef, useEffect, useState } from 'react';
import { SiteTemplate } from '../utils/siteTemplates';
import { ComponentRenderer } from './renderer/ComponentRenderer';

interface TemplateThumbnailProps {
  template: SiteTemplate;
  className?: string;
}

const SCALE = 0.18;
const PREVIEW_WIDTH = 1280;

export function TemplateThumbnail({ template, className = '' }: TemplateThumbnailProps) {
  const [height, setHeight] = useState<number>(180);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Memoize pages to avoid regenerating on every render
  const pages = useMemo(() => template.pages(), [template.id]);
  const homePage = pages.find(p => p.isHomePage) || pages[0];
  
  // Only render first few components for performance (hero + 2-3 sections)
  const previewComponents = useMemo(() => {
    if (!homePage) return [];
    // Take first 4 components max for thumbnail
    return homePage.components.slice(0, 4);
  }, [homePage]);

  // Measure and set height
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          // Cap the height to avoid overly tall previews
          const scaledH = Math.min(entry.contentRect.height * SCALE, 220);
          setHeight(scaledH);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, [previewComponents]);

  if (!homePage || previewComponents.length === 0) {
    // Fallback to color placeholder
    return (
      <div 
        className={`w-full h-full flex items-center justify-center ${className}`}
        style={{ backgroundColor: template.theme.backgroundColor }}
      >
        <div className="text-4xl">{template.icon}</div>
      </div>
    );
  }

  const scaledWidth = PREVIEW_WIDTH * SCALE;

  return (
    <div 
      className={`overflow-hidden flex justify-start ${className}`}
      style={{ 
        backgroundColor: template.theme.backgroundColor,
      }}
    >
      <div
        style={{
          width: scaledWidth,
          height,
          flexShrink: 0,
        }}
      >
        <div
          ref={contentRef}
          className="pointer-events-none select-none"
          style={{
            width: PREVIEW_WIDTH,
            transform: `scale(${SCALE})`,
            transformOrigin: 'top left',
          }}
        >
          {previewComponents.map(comp => (
            <ComponentRenderer
              key={comp.id}
              component={comp}
              device="desktop"
              theme={template.theme}
              isEditing={false}
              isSelected={false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
