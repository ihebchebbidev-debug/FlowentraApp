/**
 * Editor state and palette types.
 */
import type { DeviceView, ComponentType, ResponsiveStyles, BuilderComponent } from './component';

/** Component palette entry (for the drag palette) */
export interface PaletteItem {
  type: ComponentType;
  label: string;
  icon: string;
  description?: string;
  defaultProps: Record<string, any>;
  defaultStyles?: ResponsiveStyles;
  category: 'layout' | 'navigation' | 'text' | 'media' | 'business' | 'interactive' | 'ecommerce' | 'blog' | 'advanced';
}

/** Editor state */
export interface EditorState {
  selectedComponentId: string | null;
  activeDeviceView: DeviceView;
  isDragging: boolean;
  history: BuilderComponent[][];
  historyIndex: number;
}
