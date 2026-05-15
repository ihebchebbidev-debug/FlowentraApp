import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { WebsiteSite } from '../types';
import { ComponentRenderer } from './renderer/ComponentRenderer';

interface SiteMiniPreviewProps {
  site: WebsiteSite;
}

export function SiteMiniPreview({ site }: SiteMiniPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [containerSize, setContainerSize] = useState({ w: 0, h: 0 });

  const homePage = useMemo(
    () => site.pages.find(p => p.isHomePage) || site.pages[0],
    [site.pages]
  );
  const components = homePage?.components || [];

  // Lazy: only render when scrolled into view
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setIsVisible(true); observer.disconnect(); } },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (components.length === 0) return null;

  const renderWidth = 1280;
  const scale = containerSize.w > 0 ? containerSize.w / renderWidth : 0.25;
  // Height of the inner content after scaling — we clip to container height
  const maxInnerHeight = containerSize.h > 0 ? containerSize.h / scale : 2000;

  return (
    <div ref={containerRef} className="w-full h-full overflow-hidden relative" style={{ backgroundColor: site.theme.backgroundColor }}>
      {isVisible && containerSize.w > 0 && (
        <div
          ref={innerRef}
          style={{
            width: renderWidth,
            maxHeight: maxInnerHeight,
            overflow: 'hidden',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
            pointerEvents: 'none',
          }}
        >
          {components.slice(0, 6).map(comp => (
            <ComponentRenderer
              key={comp.id}
              component={comp}
              device="desktop"
              theme={site.theme}
              isEditing={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
