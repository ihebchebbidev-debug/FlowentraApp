// ─── Dashboard Builder Types ───

export type WidgetType =
  | 'kpi'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'line'
  | 'area'
  | 'table'
  | 'gauge'
  | 'sparkline'
  | 'funnel'
  | 'radar'
  | 'stackedBar'
  | 'heatmap'
  | 'map';

export type DataSourceKey =
  | 'sales'
  | 'offers'
  | 'contacts'
  | 'tasks'
  | 'articles'
  | 'serviceOrders'
  | 'dispatches'
  | 'timeExpenses'
  | 'externalApi';

export type MetricKey =
  | 'count'
  | 'total'
  | 'revenue'
  | 'average'
  | 'statusBreakdown'
  | 'priorityBreakdown'
  | 'monthlyTrend'
  | 'topItems'
  | 'conversionRate'
  | 'completionRate';

export interface WidgetLayout {
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

export interface ExternalApiConfig {
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  body?: string;
  valuePath?: string;  // JSONPath-like dot notation, e.g. "data.total" or "length"
  labelPath?: string;  // dot notation for chart label field, e.g. "name"
  dataPath?: string;   // dot notation to the array in response, e.g. "data.items"
  refreshInterval?: number; // seconds, 0 = no auto-refresh
}

export type KpiBgStyle = 'subtle' | 'solid' | 'gradient' | 'glass';
export type KpiBgEffect = 'none' | 'wave' | 'dots' | 'rings' | 'diagonal' | 'glow' | 'mesh' | 'hexagons' | 'noise' | 'crosshatch' | 'aurora';

export interface KpiBgConfig {
  style: KpiBgStyle;
  color1?: string;       // primary bg color (hex)
  color2?: string;       // secondary color for gradients
  gradientAngle?: number; // degrees, default 135
  effect?: KpiBgEffect;
  opacity?: number;      // 0-100, background opacity
  textLight?: boolean;   // force light text on dark backgrounds
}

export interface WidgetConfig {
  color?: string;
  showLegend?: boolean;
  showLabels?: boolean;
  showGrid?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  unit?: string;
  maxValue?: number;
  prefix?: string;
  suffix?: string;
  columns?: string[];
  sparklineType?: 'line' | 'area';
  funnelDirection?: 'horizontal' | 'vertical';
  fontSize?: 'sm' | 'md' | 'lg';
  fontWeight?: 'normal' | 'semibold' | 'bold';
  borderRadius?: number;
  animated?: boolean;
  icon?: string; // lucide icon name for KPI cards
  externalApi?: ExternalApiConfig;
  kpiBg?: KpiBgConfig;
}

export interface DashboardWidget {
  id: string;
  type: WidgetType;
  titleKey: string; // i18n key
  titleCustom?: string; // custom override
  descriptionKey?: string; // i18n key for subtitle
  descriptionCustom?: string; // custom subtitle override
  dataSource: DataSourceKey;
  metric: MetricKey;
  filters?: Record<string, any>;
  layout: WidgetLayout;
  config?: WidgetConfig;
}

export interface DashboardGridSettings {
  gap?: number;
  rowHeight?: number;
  radius?: number;
  cardStyle?: 'default' | 'flat' | 'elevated' | 'bordered';
  widgetAnimation?: 'none' | 'fade' | 'slide' | 'scale' | 'bounce';
}

export interface Dashboard {
  id: number;
  name: string;
  description?: string;
  templateKey?: 'crm' | 'field' | 'executive' | 'custom';
  isDefault: boolean;
  isShared: boolean;
  sharedWithRoles?: string[];
  createdBy: number;
  widgets: DashboardWidget[];
  gridSettings?: DashboardGridSettings;
  dataSnapshot?: Record<string, any>; // Serialized data for public sharing
  snapshotAt?: string; // When the snapshot was taken
  createdAt: string;
  updatedAt: string;
}

export interface DashboardCreateDto {
  name: string;
  description?: string;
  templateKey?: string;
  isShared?: boolean;
  sharedWithRoles?: string[];
  widgets: DashboardWidget[];
}

export interface DashboardUpdateDto {
  name?: string;
  description?: string;
  isShared?: boolean;
  sharedWithRoles?: string[];
  widgets?: DashboardWidget[];
  gridSettings?: DashboardGridSettings;
}

// Widget registry entry
export interface WidgetRegistryEntry {
  type: WidgetType;
  labelKey: string; // i18n key
  icon: string; // lucide icon name
  defaultLayout: WidgetLayout;
  supportedMetrics: MetricKey[];
  supportedDataSources: DataSourceKey[];
  category: 'kpi' | 'chart' | 'data' | 'progress';
}
