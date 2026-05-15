import React, { useRef, useCallback } from 'react';
import { BuilderComponent, SiteTheme } from '../../types';
import { ComponentRenderer } from '../renderer/ComponentRenderer';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DeviceComparisonProps {
  components: BuilderComponent[];
  theme: SiteTheme;
  syncScroll?: boolean;
}

export function DeviceComparison({ components, theme, syncScroll = true }: DeviceComparisonProps) {
  const desktopRef = useRef<HTMLDivElement>(null);
  const mobileRef = useRef<HTMLDivElement>(null);
  const isSyncing = useRef(false);

  const handleScroll = useCallback((source: 'desktop' | 'mobile') => {
    if (!syncScroll || isSyncing.current) return;
    isSyncing.current = true;

    const sourceEl = source === 'desktop' ? desktopRef.current : mobileRef.current;
    const targetEl = source === 'desktop' ? mobileRef.current : desktopRef.current;
    if (!sourceEl || !targetEl) { isSyncing.current = false; return; }

    const ratio = sourceEl.scrollTop / (sourceEl.scrollHeight - sourceEl.clientHeight || 1);
    targetEl.scrollTop = ratio * (targetEl.scrollHeight - targetEl.clientHeight);

    requestAnimationFrame(() => { isSyncing.current = false; });
  }, [syncScroll]);

  return (
    <div className="flex-1 flex gap-4 p-4 overflow-hidden bg-muted/30">
      {/* Desktop panel */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Desktop</span>
          <span className="text-[10px] text-muted-foreground/50 ml-auto">1440px</span>
        </div>
        <ScrollArea
          ref={desktopRef}
          className="flex-1 bg-background rounded-xl shadow-sm border"
          onScroll={() => handleScroll('desktop')}
        >
          {components.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
              Add components to see comparison
            </div>
          ) : (
            components.map(comp => (
              <ComponentRenderer key={comp.id} component={comp} device="desktop" theme={theme} />
            ))
          )}
        </ScrollArea>
      </div>

      {/* Mobile panel */}
      <div className="flex flex-col" style={{ width: 375 }}>
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Mobile</span>
          <span className="text-[10px] text-muted-foreground/50 ml-auto">375px</span>
        </div>
        <ScrollArea
          ref={mobileRef}
          className="flex-1 bg-background rounded-xl shadow-sm border"
          onScroll={() => handleScroll('mobile')}
        >
          {components.length === 0 ? (
            <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
              No components
            </div>
          ) : (
            components.map(comp => (
              <ComponentRenderer key={comp.id} component={comp} device="mobile" theme={theme} />
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
