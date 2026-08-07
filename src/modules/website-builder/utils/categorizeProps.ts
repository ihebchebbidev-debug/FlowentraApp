/**
 * Prop categorizer — analyzes a BuilderComponent's props and groups them
 * by kind (text, color, font, layout, media, image, bool, number, array, etc.).
 *
 * Extracted from PropertiesPanel for testability and reuse.
 */
import { BuilderComponent } from '../types';
import {
  COLOR_KEYS, FONT_KEYS, ICON_KEYS, LOGO_KEYS, LOGO_TEXT_KEYS,
  IMAGE_KEYS, URL_KEYS, TEXTAREA_KEYS, CTA_COMPONENTS, SELECT_OPTIONS,
  isColorValue,
} from '../config/propertyConfig';

export interface CategorizedProps {
  textProps: [string, any][];
  colorProps: [string, any][];
  fontProps: [string, any][];
  layoutProps: [string, any][];
  mediaProps: [string, any][];
  imageProps: [string, any][];
  boolProps: [string, any][];
  numberProps: [string, any][];
  arrayProps: [string, any][];
  ctaProps: [string, any][];
  iconProps: [string, any][];
  logoProps: [string, any][];
  otherProps: [string, any][];
}

/** Component types that do NOT support bgColor (have their own background logic) */
const NO_BGCOLOR_SUPPORT = new Set([
  'hero', 'navbar', 'footer', 'custom-html', 'cookie-consent',
  'facebook-pixel', 'google-analytics', 'loading-screen',
]);

export function categorizeProps(component: BuilderComponent): CategorizedProps {
  const textProps: [string, any][] = [];
  const colorProps: [string, any][] = [];
  const fontProps: [string, any][] = [];
  const layoutProps: [string, any][] = [];
  const mediaProps: [string, any][] = [];
  const imageProps: [string, any][] = [];
  const boolProps: [string, any][] = [];
  const numberProps: [string, any][] = [];
  const arrayProps: [string, any][] = [];
  const ctaProps: [string, any][] = [];
  const iconProps: [string, any][] = [];
  const logoProps: [string, any][] = [];
  const otherProps: [string, any][] = [];

  let hasBgColor = false;

  Object.entries(component.props).forEach(([key, value]) => {
    if (key === 'bgColor') hasBgColor = true;
    if (key === 'buttons') {
      ctaProps.push([key, value]);
    } else if (key === 'formSettings') {
      // Handled by FormSettingsEditor
    } else if (LOGO_TEXT_KEYS.has(key) && typeof value === 'string') {
      logoProps.push([key, value]);
    } else if (LOGO_KEYS.has(key) && typeof value === 'string') {
      logoProps.push([key, value]);
    } else if (IMAGE_KEYS.has(key) && typeof value === 'string') {
      imageProps.push([key, value]);
    } else if (ICON_KEYS.has(key) && typeof value === 'string') {
      iconProps.push([key, value]);
    } else if (Array.isArray(value)) {
      arrayProps.push([key, value]);
    } else if (isColorValue(key, value)) {
      colorProps.push([key, value]);
    } else if (FONT_KEYS.has(key)) {
      fontProps.push([key, value]);
    } else if (typeof value === 'boolean') {
      boolProps.push([key, value]);
    } else if (typeof value === 'number') {
      numberProps.push([key, value]);
    } else if (SELECT_OPTIONS[key]) {
      layoutProps.push([key, value]);
    } else if (URL_KEYS.has(key)) {
      mediaProps.push([key, value]);
    } else if (typeof value === 'string' && (TEXTAREA_KEYS.has(key) || value.length > 60)) {
      textProps.push([key, value]);
    } else if (typeof value === 'string') {
      if (CTA_COMPONENTS.has(component.type) && (key === 'ctaText' || key === 'ctaLink' || key === 'secondaryCtaText' || key === 'secondaryCtaLink')) {
        ctaProps.push([key, value]);
      } else {
        textProps.push([key, value]);
      }
    } else {
      otherProps.push([key, value]);
    }
  });

  // Always inject bgColor for blocks that support it so the color picker appears
  if (!hasBgColor && !NO_BGCOLOR_SUPPORT.has(component.type)) {
    colorProps.unshift(['bgColor', '']);
  }

  return { textProps, colorProps, fontProps, layoutProps, mediaProps, imageProps, boolProps, numberProps, arrayProps, ctaProps, iconProps, logoProps, otherProps };
}
