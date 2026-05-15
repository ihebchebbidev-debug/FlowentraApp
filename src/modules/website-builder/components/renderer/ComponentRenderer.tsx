import React, { memo, Suspense } from 'react';
import { BuilderComponent, DeviceView, SiteTheme } from '../../types';
import { BLOCK_MAP } from './blockRegistry';
import { BlockFallback } from './BlockFallback';
import { BlockErrorBoundary } from './BlockErrorBoundary';
import { useAnimationObserver } from '../../hooks/useAnimationObserver';

/** Component types that render as fixed/floating overlays, not inline blocks */
const FLOATING_TYPES = new Set(['whatsapp-button', 'scroll-to-top', 'floating-cta']);

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
  const Block = BLOCK_MAP[component.type];
  if (!Block) return null;
  if (component.hidden?.[device]) return null;

  // Animation — only apply in non-editing mode (preview / published)
  const { ref: animRef, style: animStyle } = useAnimationObserver(
    isEditing ? undefined : component.animation
  );

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

  // Non-editing: wrap with animation
  if (!isEditing) {
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
      }`}
    >
      <div className={`absolute -top-5 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded-t z-10 transition-opacity ${
        isSelected ? 'bg-primary text-primary-foreground opacity-100' : 'bg-muted text-muted-foreground opacity-0 group-hover:opacity-100'
      }`}>
        {component.label}
      </div>
      {content}
    </div>
  );
}

/** Memoized to prevent re-renders when sibling components change */
export const ComponentRenderer = memo(ComponentRendererInner);
