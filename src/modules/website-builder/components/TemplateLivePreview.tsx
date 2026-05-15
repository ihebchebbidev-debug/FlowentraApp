/**
 * Live rendered preview of a site template.
 * Renders actual template components at a scaled-down size so users
 * can see exactly how the template will look before selecting it.
 */
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { SitePage, SiteTheme, DeviceView } from '../types';
import { ComponentRenderer } from './renderer/ComponentRenderer';
import { Monitor, Tablet, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TemplateLivePreviewProps {
  pages: SitePage[];
  theme: SiteTheme;
}

const SCALE = 0.38;
const DESKTOP_W = 1280;

const DEVICE_CONFIGS: { view: DeviceView; icon: typeof Monitor; label: string; width: number }[] = [
  { view: 'desktop', icon: Monitor, label: 'Desktop', width: 1280 },
  { view: 'tablet', icon: Tablet, label: 'Tablet', width: 768 },
  { view: 'mobile', icon: Smartphone, label: 'Mobile', width: 375 },
];

export function TemplateLivePreview({ pages, theme }: TemplateLivePreviewProps) {
  const [activePage, setActivePage] = useState(0);
  const [device, setDevice] = useState<DeviceView>('desktop');
  const [scaledHeight, setScaledHeight] = useState<number | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const currentPage = pages[activePage];
  const deviceConfig = DEVICE_CONFIGS.find(d => d.view === device)!;
  const scaledWidth = deviceConfig.width * SCALE;

  // Measure content height and calculate scaled height
  useEffect(() => {
    if (contentRef.current) {
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const actualHeight = entry.contentRect.height;
          setScaledHeight(actualHeight * SCALE);
        }
      });
      resizeObserver.observe(contentRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [activePage, device]);

  if (!currentPage) return null;

  return (
    <div className="flex flex-col h-full">
      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/30">
        {/* Page tabs */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {pages.map((pg, idx) => (
            <button
              key={pg.id}
              onClick={() => setActivePage(idx)}
              className={`text-[11px] px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
                idx === activePage
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              {pg.title}
              {pg.isHomePage && <span className="ml-1 opacity-60">•</span>}
            </button>
          ))}
        </div>

        {/* Device switcher */}
        <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5">
          {DEVICE_CONFIGS.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => setDevice(view)}
              title={label}
              className={`p-1.5 rounded-md transition-colors ${
                device === view
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      </div>

      {/* Live preview area */}
      <div className="flex-1 overflow-auto bg-muted/20 flex justify-center py-6">
        <div
          className="origin-top bg-background rounded-lg shadow-xl border border-border overflow-hidden shrink-0"
          style={{ 
            width: scaledWidth,
            height: scaledHeight ?? 'auto',
          }}
        >
          <div
            ref={contentRef}
            style={{
              width: deviceConfig.width,
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
            }}
          >
            {currentPage.components.map(comp => (
              <ComponentRenderer
                key={comp.id}
                component={comp}
                device={device}
                theme={theme}
                isEditing={false}
                isSelected={false}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Component count */}
      <div className="px-4 py-2 border-t border-border bg-muted/20 flex items-center gap-2">
        <Badge variant="outline" className="text-[10px]">
          {currentPage.components.length} components
        </Badge>
        <span className="text-[10px] text-muted-foreground">
          /{currentPage.slug || ''}
        </span>
      </div>
    </div>
  );
}
