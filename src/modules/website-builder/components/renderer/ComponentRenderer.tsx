import React, { memo, Suspense } from 'react';
import { BuilderComponent, DeviceView, SiteTheme } from '../../types';
import { BLOCK_MAP } from './blockRegistry';
import { BlockFallback } from './BlockFallback';
import { BlockErrorBoundary } from './BlockErrorBoundary';
import { useAnimationObserver } from '../../hooks/useAnimationObserver';

/** Component types that render as fixed/floating overlays, not inline blocks */
const FLOATING_TYPES = new Set(['whatsapp-button', 'scroll-to-top', 'floating-cta', 'mini-cart']);

interface ComponentRendererProps {
  component: BuilderComponent;
  device: DeviceView;
  theme: SiteTheme;
  isEditing?: boolean;
  isSelected?: boolean;
  activeLanguage?: string | null;
  onSelect?: (id: string) => void;
  onUpdate?: (id: string, props: Record<string, any>) => void;
  renderChildren?: (children: BuilderComponent[]) => React.ReactNode;
}

function ComponentRendererInner({
  component, device, theme, isEditing = false, isSelected = false, activeLanguage, onSelect, onUpdate, renderChildren,
}: ComponentRendererProps) {
  // Hooks must run unconditionally (Rules of Hooks) — call before any early
  // return so toggling `hidden`/block type never changes the hook count.
  const Block = BLOCK_MAP[component.type];

  // Animation — only apply in non-editing mode (preview / published)
  const { ref: animRef, style: animStyle } = useAnimationObserver(
    isEditing ? undefined : component.animation
  );

  if (!Block) {
    // Unknown/legacy block type. Stay invisible on the published site, but surface
    // a selectable placeholder while editing so the content isn't silently lost.
    if (!isEditing) return null;
    return (
      <div
        onClick={(e) => { e.stopPropagation(); onSelect?.(component.id); }}
        className={`rounded-lg border border-dashed border-amber-400 bg-amber-50 text-amber-700 px-4 py-3 text-sm ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''}`}
      >
        Unknown block: <strong>{component.label || component.type}</strong> <span className="opacity-70">({component.type})</span>
      </div>
    );
  }
  // Hidden on this device: truly removed in preview/published, but kept visible
  // (dimmed + badged) while editing so it stays selectable to toggle back.
  const hiddenHere = !!component.hidden?.[device];
  if (!isEditing && hiddenHere) return null;

  const baseStyles = component.styles?.desktop || {};
  const deviceStyles = component.styles?.[device] || {};
  const mergedStyles = { ...baseStyles, ...deviceStyles };

  // Resolve bgColor: gradients/rgba need the `background` CSS shorthand
  const blockProps = { ...component.props };

  // Inject active language into navbar/language-switcher blocks so they stay in sync
  if ((component.type === 'navbar' || component.type === 'language-switcher') && activeLanguage !== undefined) {
    blockProps.currentLanguage = activeLanguage || blockProps.currentLanguage || 'en';
  }

  const bgValue = blockProps.bgColor as string | undefined;
  let bgStyleOverride: React.CSSProperties = {};
  if (bgValue && (bgValue.includes('gradient') || bgValue.includes('rgba'))) {
    bgStyleOverride = { background: bgValue };
    blockProps.bgColor = 'transparent';
  }

  const handleClick = (e: React.MouseEvent) => {
    if (isEditing && onSelect) {
      e.stopPropagation();
      onSelect(component.id);
    }
  };

  const handleUpdate = (newProps: Record<string, any>) => {
    onUpdate?.(component.id, newProps);
  };

  const isFloating = FLOATING_TYPES.has(component.type);

  const content = (
    <BlockErrorBoundary blockLabel={component.label} blockType={component.type}>
      <Suspense fallback={<BlockFallback />}>
        <Block
          {...blockProps}
          style={{ ...mergedStyles, ...bgStyleOverride }}
          theme={theme}
          device={device}
          isEditing={isEditing}
          onUpdate={handleUpdate}
        >
          {component.children && renderChildren ? renderChildren(component.children) : null}
        </Block>
      </Suspense>
    </BlockErrorBoundary>
  );

  // Non-editing: wrap with animation only if an animation is configured
  if (!isEditing) {
    const anim = component.animation;
    const hasAnimation = !!anim && (anim.entrance !== 'none' || anim.hover !== 'none');
    if (!hasAnimation) {
      return content;
    }
    return (
      <div ref={animRef} style={animStyle}>
        {content}
      </div>
    );
  }

  // Floating widgets in editing mode
  if (isFloating) {
    return (
      <div
        onClick={handleClick}
        className={`relative ${isSelected ? 'ring-2 ring-primary ring-offset-2 rounded-lg' : ''}`}
      >
        {content}
      </div>
    );
  }

  return (
    <div
      onClick={handleClick}
      className={`relative group transition-all duration-150 ${
        isSelected ? 'ring-2 ring-primary ring-offset-2' : 'hover:ring-1 hover:ring-primary/40 hover:ring-offset-1'
      } ${hiddenHere ? 'opacity-40' : ''}`}
    >
      <div className={`absolute -top-5 left-1 text-px-10 font-medium px-1.5 py-0.5 rounded-t z-10 transition-opacity ${
        isSelected ? 'bg-primary text-primary-foreground opacity-100' : 'bg-muted text-muted-foreground opacity-0 group-hover:opacity-100'
      }`}>
        {component.label}
      </div>
      {hiddenHere && (
        <div className="absolute -top-5 right-1 z-10 flex items-center gap-1 text-px-10 font-medium px-1.5 py-0.5 rounded-t bg-amber-500 text-white">
          <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m2 2 20 20M6.7 6.7A10 10 0 0 0 2 12s3 7 10 7a9.3 9.3 0 0 0 5.3-1.7M9.9 4.2A10 10 0 0 1 12 5c7 0 10 7 10 7a13.2 13.2 0 0 1-1.7 2.7" /></svg>
          Hidden on {device}
        </div>
      )}
      {content}
    </div>
  );
}

/** Memoized to prevent re-renders when sibling components change */
export const ComponentRenderer = memo(ComponentRendererInner);
