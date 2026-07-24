import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { BuilderComponent, AnimationSettings, DeviceView } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RichTextInput } from './RichTextInput';
import { BackgroundEditor } from './BackgroundEditor';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Trash2, Copy, ChevronUp, ChevronDown, X, MousePointerClick, Settings2, ClipboardCopy, Monitor, Tablet, Smartphone, Eye, EyeOff } from 'lucide-react';
import {
  ColorPicker,
  FontSelect,
  SelectEditor,
  SliderEditor,
  ButtonListEditor,
  ArrayItemEditor,
  EditorSection,
} from './property-editors';
import type { CTAButton } from './property-editors';
import { AnimationEditor } from './AnimationEditor';
import { IconPicker } from './IconPicker';
import { LogoUploader } from './LogoUploader';
import { LogoEditor } from './LogoEditor';
import { ImageUploader } from './ImageUploader';
import { FormSettingsEditor } from './FormSettingsEditor';
import { StoreRulesEditor, RULES_ENABLED_BLOCKS } from './StoreRulesEditor';
import { DimensionsEditor } from './DimensionsEditor';
import { DesignPanel } from './DesignPanel';
import { LanguageSwitcherEditor } from './LanguageSwitcherEditor';
import { NavbarStylePresets } from './NavbarStylePresets';
import { FooterStylePresets } from './FooterStylePresets';
import { BlockStylePresets } from './BlockStylePresets';
import { CatalogSyncEditor, CATALOG_SYNC_BLOCKS } from './CatalogSyncEditor';
import {
  TESTIMONIALS_PRESETS, TESTIMONIALS_VARIANTS,
  PRICING_PRESETS, PRICING_VARIANTS,
  FAQ_PRESETS, FAQ_VARIANTS,
  FEATURES_PRESETS, FEATURES_VARIANTS,
  CTA_PRESETS,
} from './presets';
import {
  LOGO_KEYS, LOGO_TEXT_KEYS, TEXTAREA_KEYS, FORM_COMPONENTS,
  SELECT_OPTIONS, ARRAY_FIELD_DEFS, ARRAY_DEFAULTS,
  formatLabel, isColorValue,
} from '../../config/propertyConfig';
import { categorizeProps } from '../../utils/categorizeProps';

/** Component types that show navbar style presets */
const NAVBAR_COMPONENTS = new Set(['navbar', 'header', 'mega-menu', 'navigation']);

/** Component types that show footer style presets */
const FOOTER_COMPONENTS = new Set(['footer']);

/** Component types with block style presets */
const PRESET_CONFIG: Record<string, { label: string; presets: any[]; variants?: any[] }> = {
  testimonials: { label: 'Testimonial Style', presets: TESTIMONIALS_PRESETS, variants: TESTIMONIALS_VARIANTS },
  reviews: { label: 'Review Style', presets: TESTIMONIALS_PRESETS, variants: TESTIMONIALS_VARIANTS },
  pricing: { label: 'Pricing Style', presets: PRICING_PRESETS, variants: PRICING_VARIANTS },
  faq: { label: 'FAQ Style', presets: FAQ_PRESETS, variants: FAQ_VARIANTS },
  features: { label: 'Features Style', presets: FEATURES_PRESETS, variants: FEATURES_VARIANTS },
  'cta-banner': { label: 'CTA Style', presets: CTA_PRESETS },
};

interface PropertiesPanelProps {
  component: BuilderComponent | null;
  onUpdate: (id: string, props: Record<string, any>) => void;
  onUpdateStyles: (id: string, styles: Record<string, any>) => void;
  onUpdateVisibility: (id: string, device: DeviceView, hidden: boolean) => void;
  onUpdateAnimation: (id: string, animation: AnimationSettings) => void;
  /** Store currency from the site theme — used to format catalog-synced prices. */
  storeCurrency?: string;
  storeCurrencyPosition?: 'before' | 'after';
  onRemove: (id: string) => void;
  onDuplicate: (id: string) => void;
  onCopy?: (id: string) => void;
  onMove: (id: string, direction: 'up' | 'down') => void;
  onDeselect: () => void;
}

// ── Number prop renderer ──
/**
 * Config map for numeric props: any key listed here renders as a Slider
 * with the given min/max/step/unit. Everything else falls back to a
 * plain number input.
 */
const NUMERIC_SLIDER_CONFIG: Record<string, { label?: string; min: number; max: number; step?: number; unit?: string }> = {
  overlayOpacity: { label: 'Overlay Opacity', min: 0, max: 100, unit: '%' },
  opacity: { label: 'Opacity', min: 0, max: 100, unit: '%' },
  height: { min: 100, max: 800, unit: 'px' },
  minHeight: { label: 'Min Height', min: 100, max: 900, unit: 'px' },
  maxHeight: { label: 'Max Height', min: 100, max: 1200, unit: 'px' },
  width: { min: 50, max: 1600, unit: 'px' },
  maxWidth: { label: 'Max Width', min: 200, max: 1600, unit: 'px' },
  columns: { min: 1, max: 6 },
  gap: { min: 0, max: 96, unit: 'px' },
  gapX: { label: 'Gap X', min: 0, max: 96, unit: 'px' },
  gapY: { label: 'Gap Y', min: 0, max: 96, unit: 'px' },
  padding: { min: 0, max: 160, unit: 'px' },
  paddingX: { label: 'Padding X', min: 0, max: 160, unit: 'px' },
  paddingY: { label: 'Padding Y', min: 0, max: 160, unit: 'px' },
  margin: { min: 0, max: 160, unit: 'px' },
  borderRadius: { label: 'Border Radius', min: 0, max: 64, unit: 'px' },
  borderWidth: { label: 'Border Width', min: 0, max: 16, unit: 'px' },
  fontSize: { label: 'Font Size', min: 8, max: 96, unit: 'px' },
  lineHeight: { label: 'Line Height', min: 0.8, max: 3, step: 0.1 },
  letterSpacing: { label: 'Letter Spacing', min: -0.1, max: 0.5, step: 0.01, unit: 'em' },
  duration: { label: 'Duration', min: 0, max: 10, step: 0.1, unit: 's' },
  delay: { label: 'Delay', min: 0, max: 5, step: 0.1, unit: 's' },
  speed: { min: 0, max: 100 },
  interval: { min: 1, max: 30, unit: 's' },
  autoplaySpeed: { label: 'Autoplay Speed', min: 500, max: 10000, step: 100, unit: 'ms' },
  rows: { min: 1, max: 12 },
  itemsPerPage: { label: 'Items per Page', min: 1, max: 48 },
  limit: { min: 1, max: 100 },
  maxItems: { label: 'Max Items', min: 1, max: 100 },
  rating: { min: 0, max: 5, step: 0.5 },
  offsetX: { label: 'Offset X', min: -200, max: 200, unit: 'px' },
  offsetY: { label: 'Offset Y', min: -200, max: 200, unit: 'px' },
  zIndex: { label: 'Z-Index', min: 0, max: 100 },
  blur: { min: 0, max: 40, unit: 'px' },
  scale: { min: 0.5, max: 2, step: 0.1 },
  rotate: { label: 'Rotate', min: -180, max: 180, unit: '°' },
  progress: { min: 0, max: 100, unit: '%' },
  percentage: { min: 0, max: 100, unit: '%' },
};

function renderNumberProp(key: string, value: number, onChange: (v: number) => void) {
  const cfg = NUMERIC_SLIDER_CONFIG[key];
  if (cfg && typeof value === 'number') {
    return (
      <SliderEditor
        key={key}
        label={cfg.label || formatLabel(key)}
        value={value}
        min={cfg.min}
        max={cfg.max}
        step={cfg.step}
        unit={cfg.unit}
        onChange={onChange}
      />
    );
  }
  return (
    <div key={key} className="space-y-1.5">
      <Label className="text-px-11 font-medium text-foreground/70">{formatLabel(key)}</Label>
      <Input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-8 text-xs border-border/40 bg-background"
      />
    </div>
  );
}

export function PropertiesPanel({ component, onUpdate, onUpdateStyles, onUpdateVisibility, onUpdateAnimation, onRemove, onDuplicate, onCopy, onMove, onDeselect, storeCurrency, storeCurrencyPosition }: PropertiesPanelProps) {
  const { t } = useTranslation();
  // Memoize prop categorization — only recomputes when component props change
  const categories = useMemo(
    () => component ? categorizeProps(component) : null,
    [component?.id, component?.props, component?.type]
  );

  if (!component || !categories) {
    return (
      <div className="h-full flex flex-col items-center justify-center px-6 py-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-muted/40 flex items-center justify-center mb-4 border border-border/30">
          <MousePointerClick className="h-6 w-6 text-muted-foreground/30" />
        </div>
        <p className="text-sm font-medium text-foreground/50 mb-1">{t('wb:properties.noBlockSelected')}</p>
        <p className="text-xs text-muted-foreground/40 leading-relaxed max-w-[180px]">
          {t('wb:properties.noBlockSelectedDesc')}
        </p>
      </div>
    );
  }

  const handlePropChange = (key: string, value: any) => {
    onUpdate(component.id, { [key]: value });
  };

  const { textProps, colorProps, fontProps, layoutProps, mediaProps, imageProps, boolProps, numberProps, arrayProps, ctaProps, iconProps, logoProps, otherProps } = categories;

  const renderTextProp = (key: string, value: string) => {
    const isRichText = TEXTAREA_KEYS.has(key) || value.length > 60;
    return (
      <div key={key} className="space-y-1.5">
        <Label className="text-px-11 font-medium text-foreground/70">{formatLabel(key)}</Label>
        {isRichText ? (
          <RichTextInput
            value={value}
            onChange={(html) => handlePropChange(key, html)}
            placeholder={`Enter ${formatLabel(key)}`}
            minHeight={50}
          />
        ) : (
          <Input
            value={value || ''}
            onChange={(e) => handlePropChange(key, e.target.value)}
            className="h-8 text-xs border-border/40 bg-background"
            placeholder={`Enter ${formatLabel(key)}`}
          />
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary/8 flex items-center justify-center shrink-0">
              <Settings2 className="h-4 w-4 text-primary/70" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{component.label}</p>
              <p className="text-px-10 text-muted-foreground/50">{component.type}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground" onClick={onDeselect}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-7 text-px-10 flex-1 gap-1 border-border/40" onClick={() => onMove(component.id, 'up')}>
            <ChevronUp className="h-3 w-3" /> {t('wb:properties.up')}
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-px-10 flex-1 gap-1 border-border/40" onClick={() => onMove(component.id, 'down')}>
            <ChevronDown className="h-3 w-3" /> {t('wb:properties.down')}
          </Button>
          {onCopy && (
            <Button variant="outline" size="sm" className="h-7 text-px-10 px-2 border-border/40" onClick={() => onCopy(component.id)} title={t('wb:common.copiedToClipboard')}>
              <ClipboardCopy className="h-3 w-3" />
            </Button>
          )}
          <Button variant="outline" size="sm" className="h-7 text-px-10 px-2 border-border/40" onClick={() => onDuplicate(component.id)} title={t('wb:editor.duplicatePage')}>
            <Copy className="h-3 w-3" />
          </Button>
          <Button variant="outline" size="sm" className="h-7 text-px-10 px-2 border-destructive/30 text-destructive hover:bg-destructive/5" onClick={() => onRemove(component.id)} title={t('wb:common.delete')}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>

        {/* Catalog sync — pull real products/services from the Inventory module */}
        {CATALOG_SYNC_BLOCKS.has(component.type) && (
          <CatalogSyncEditor
            componentType={component.type}
            onApply={(props) => onUpdate(component.id, props)}
            currency={storeCurrency}
            currencyPosition={storeCurrencyPosition}
          />
        )}

        {/* Logo */}
        {logoProps.length > 0 && (
          <EditorSection title={t('wb:properties.logoAndBranding')}>
            {(() => {
              const textKey = logoProps.find(([k]) => LOGO_TEXT_KEYS.has(k));
              const imageKey = logoProps.find(([k]) => LOGO_KEYS.has(k));
              const remainingProps = logoProps.filter(([k]) => !LOGO_TEXT_KEYS.has(k) && !LOGO_KEYS.has(k));

              return (
                <>
                  {(textKey || imageKey) && (
                    <LogoEditor
                      logoText={textKey ? (textKey[1] as string) : ''}
                      logoImage={imageKey ? (imageKey[1] as string) : ''}
                      onTextChange={(v) => textKey && handlePropChange(textKey[0], v)}
                      onImageChange={(v) => imageKey ? handlePropChange(imageKey[0], v) : handlePropChange('logoImage', v)}
                    />
                  )}
                  {remainingProps.map(([key, value]) => (
                    <LogoUploader key={key} label={formatLabel(key)} value={value as string} onChange={(v) => handlePropChange(key, v)} />
                  ))}
                </>
              );
            })()}
          </EditorSection>
        )}

        {/* Navbar/Header Style Presets */}
        {NAVBAR_COMPONENTS.has(component.type) && (
          <>
            <EditorSection title={t('wb:properties.headerStyle')}>
              <NavbarStylePresets
                currentProps={component.props}
                onApply={(props) => {
                  Object.entries(props).forEach(([key, value]) => handlePropChange(key, value));
                }}
              />
            </EditorSection>
            
            {/* Language Switcher Configuration */}
            <LanguageSwitcherEditor
              showLanguageSwitcher={component.props.showLanguageSwitcher || false}
              languageSwitcherVariant={component.props.languageSwitcherVariant || 'icon'}
              languages={component.props.languages || []}
              currentLanguage={component.props.currentLanguage || 'en'}
              onUpdate={(props) => {
                Object.entries(props).forEach(([key, value]) => handlePropChange(key, value));
              }}
            />
          </>
        )}

        {/* Footer Style Presets */}
        {FOOTER_COMPONENTS.has(component.type) && (
          <EditorSection title={t('wb:properties.footerStyle')}>
            <FooterStylePresets
              currentProps={component.props}
              onApply={(props) => {
                Object.entries(props).forEach(([key, value]) => handlePropChange(key, value));
              }}
            />
          </EditorSection>
        )}

        {/* Block Style Presets (Testimonials, Pricing, FAQ, Features, CTA) */}
        {PRESET_CONFIG[component.type] && (
          <EditorSection title={PRESET_CONFIG[component.type].label}>
            <BlockStylePresets
              label={PRESET_CONFIG[component.type].label}
              presets={PRESET_CONFIG[component.type].presets}
              currentProps={component.props}
              onApply={(props) => {
                Object.entries(props).forEach(([key, value]) => handlePropChange(key, value));
              }}
              variants={PRESET_CONFIG[component.type].variants}
              currentVariant={component.props.variant as string}
              onVariantChange={(v) => handlePropChange('variant', v)}
            />
          </EditorSection>
        )}

        {/* Text & Content */}
        {textProps.length > 0 && (
          <EditorSection title={t('wb:properties.content')}>
            {textProps.map(([key, value]) => renderTextProp(key, value as string))}
          </EditorSection>
        )}

        {/* Icons */}
        {iconProps.length > 0 && (
          <EditorSection title={t('wb:properties.icons')}>
            {iconProps.map(([key, value]) => (
              <IconPicker
                key={key}
                label={formatLabel(key)}
                value={value as string}
                onChange={(v) => handlePropChange(key, v)}
                showSocial={component.type === 'social-links' || component.type === 'footer'}
              />
            ))}
          </EditorSection>
        )}

        {/* CTA Buttons (for hero, cta-banner) */}
        {component.props.buttons && (
          <EditorSection title={t('wb:properties.buttons')}>
            <ButtonListEditor label={t('wb:properties.callToAction')} buttons={component.props.buttons as CTAButton[]} onChange={(btns) => handlePropChange('buttons', btns)} />
          </EditorSection>
        )}

        {/* CTA Props (legacy single CTA text/link) */}
        {ctaProps.length > 0 && !component.props.buttons && (
          <EditorSection title={t('wb:properties.callToAction')}>
            {ctaProps.map(([key, value]) => {
              if (isColorValue(key, value)) {
                return <ColorPicker key={key} label={formatLabel(key)} value={value as string} onChange={(v) => handlePropChange(key, v)} />;
              }
              return renderTextProp(key, value as string);
            })}
          </EditorSection>
        )}

        {/* Layout & Display */}
        {layoutProps.length > 0 && (
          <EditorSection title={t('wb:properties.layout')}>
            {layoutProps.map(([key, value]) => (
              <SelectEditor
                key={key}
                label={formatLabel(key)}
                value={String(value)}
                options={SELECT_OPTIONS[key] || []}
                onChange={(v) => handlePropChange(key, key === 'columns' ? Number(v) : v)}
              />
            ))}
          </EditorSection>
        )}

        {/* Dimensions */}
        <EditorSection title={t('wb:properties.dimensions')} defaultOpen={false}>
          <DimensionsEditor
            styles={component.styles || {}}
            onChange={(newStyles) => onUpdateStyles(component.id, newStyles)}
          />
        </EditorSection>

        {/* Universal Design — typography, background, border, effects per breakpoint */}
        <EditorSection title={t('wb:properties.design', 'Design')} defaultOpen={false}>
          <DesignPanel
            styles={component.styles || {}}
            onChange={(newStyles) => onUpdateStyles(component.id, newStyles)}
          />
        </EditorSection>

        {/* Responsive visibility — hide this block per device (like WordPress) */}
        <EditorSection title={t('wb:properties.visibility', 'Visibility')} defaultOpen={false}>
          <p className="text-px-10 text-muted-foreground/60 leading-snug mb-1">
            {t('wb:properties.visibilityHint', 'Hide this block on specific screen sizes. It stays in the layout on the others.')}
          </p>
          {([
            { device: 'desktop' as DeviceView, icon: Monitor, label: t('wb:editor.desktop', 'Desktop') },
            { device: 'tablet' as DeviceView, icon: Tablet, label: t('wb:editor.tablet', 'Tablet') },
            { device: 'mobile' as DeviceView, icon: Smartphone, label: t('wb:editor.mobile', 'Mobile') },
          ]).map(({ device, icon: Icon, label }) => {
            const isHidden = !!component.hidden?.[device];
            return (
              <div key={device} className="flex items-center justify-between py-1">
                <Label className="text-px-11 font-medium text-foreground/70 flex items-center gap-1.5">
                  <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                  {label}
                  <span className={`flex items-center gap-1 text-px-10 ${isHidden ? 'text-destructive' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {isHidden ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    {isHidden ? t('wb:properties.hidden', 'Hidden') : t('wb:properties.shown', 'Shown')}
                  </span>
                </Label>
                <Switch
                  checked={!isHidden}
                  onCheckedChange={(shown) => onUpdateVisibility(component.id, device, !shown)}
                  aria-label={`${label} visibility`}
                />
              </div>
            );
          })}
        </EditorSection>

        {/* Colors */}
        {colorProps.length > 0 && (
          <EditorSection title={t('wb:properties.colors')}>
            {colorProps.map(([key, value]) =>
              key === 'bgColor' ? (
                <BackgroundEditor key={key} value={value as string} onChange={(v) => handlePropChange(key, v)} />
              ) : (
                <ColorPicker key={key} label={formatLabel(key)} value={value as string} onChange={(v) => handlePropChange(key, v)} />
              )
            )}
          </EditorSection>
        )}

        {/* Typography */}
        {fontProps.length > 0 && (
          <EditorSection title={t('wb:properties.typography')}>
            {fontProps.map(([key, value]) => (
              <FontSelect key={key} label={formatLabel(key)} value={value as string} onChange={(v) => handlePropChange(key, v)} />
            ))}
          </EditorSection>
        )}

        {/* Images */}
        {imageProps.length > 0 && (
          <EditorSection title={t('wb:properties.images')}>
            {imageProps.map(([key, value]) => (
              <ImageUploader
                key={key}
                label={formatLabel(key)}
                value={value as string}
                onChange={(v) => handlePropChange(key, v)}
              />
            ))}
          </EditorSection>
        )}

        {/* Media & Links */}
        {mediaProps.length > 0 && (
          <EditorSection title={t('wb:properties.mediaLinks')}>
            {mediaProps.map(([key, value]) => (
              <div key={key} className="space-y-1.5">
                <Label className="text-px-11 font-medium text-foreground/70">{formatLabel(key)}</Label>
                <Input
                  value={(value as string) || ''}
                  onChange={(e) => handlePropChange(key, e.target.value)}
                  className="h-8 text-xs border-border/40 bg-background"
                  placeholder={`Enter ${formatLabel(key)}`}
                />
              </div>
            ))}
          </EditorSection>
        )}

        {/* Numbers */}
        {numberProps.length > 0 && (
          <EditorSection title={t('wb:properties.sizing')}>
            {numberProps.map(([key, value]) => renderNumberProp(key, value as number, (v) => handlePropChange(key, v)))}
          </EditorSection>
        )}

        {/* Toggles */}
        {boolProps.length > 0 && (
          <EditorSection title={t('wb:properties.options')}>
            {boolProps.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between py-1">
                <Label className="text-px-11 font-medium text-foreground/70">{formatLabel(key)}</Label>
                <Switch checked={value as boolean} onCheckedChange={(checked) => handlePropChange(key, checked)} />
              </div>
            ))}
          </EditorSection>
        )}

        {/* Arrays */}
        {arrayProps.length > 0 && (
          <EditorSection title={t('wb:properties.items')} defaultOpen={false}>
            {arrayProps.map(([key, value]) => {
              const fields = ARRAY_FIELD_DEFS[key];
              if (fields && Array.isArray(value)) {
                return (
                  <ArrayItemEditor
                    key={key}
                    label={formatLabel(key)}
                    items={value as Record<string, any>[]}
                    fields={fields}
                    onChange={(items) => handlePropChange(key, items)}
                    defaultItem={ARRAY_DEFAULTS[key] || {}}
                  />
                );
              }
              return (
                <div key={key} className="space-y-1">
                  <Label className="text-px-11 font-medium text-foreground/70">{formatLabel(key)}</Label>
                  <p className="text-px-10 text-muted-foreground/50">{Array.isArray(value) ? t('wb:properties.items_count', { count: (value as any[]).length }) : t('wb:properties.complexData')}</p>
                </div>
              );
            })}
          </EditorSection>
        )}

        {/* Other/unknown props */}
        {otherProps.length > 0 && (
          <EditorSection title={t('wb:properties.other')} defaultOpen={false}>
            {otherProps.map(([key, value]) => (
              <div key={key} className="space-y-1">
                <Label className="text-px-11 font-medium text-foreground/70">{formatLabel(key)}</Label>
                <p className="text-px-10 text-muted-foreground/50">{typeof value === 'object' ? JSON.stringify(value).slice(0, 60) : String(value)}</p>
              </div>
            ))}
          </EditorSection>
        )}

        {/* Animation */}
        <AnimationEditor
          animation={component.animation}
          onChange={(anim) => onUpdateAnimation(component.id, anim)}
        />

        {/* Form Settings — only for form components */}
        {FORM_COMPONENTS.has(component.type) && (
          <FormSettingsEditor component={component} onPropChange={handlePropChange} />
        )}

        {/* Store Rules — cart / mini-cart / checkout / order-confirmation */}
        {RULES_ENABLED_BLOCKS.has(component.type) && (
          <StoreRulesEditor component={component} onPropChange={handlePropChange} />
        )}
      </div>
    </ScrollArea>
  );
}
