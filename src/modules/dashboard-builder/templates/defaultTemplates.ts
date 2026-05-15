import type { DashboardWidget } from '../types';

/**
 * Resolves the user's --primary CSS variable to hex at runtime.
 */
function getPrimaryHex(): string {
  try {
    const raw = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim();
    if (!raw) return '#e63b2e';
    const [h, s, l] = raw.split(/\s+/).map(v => parseFloat(v));
    return hslToHex(h, s, l);
  } catch {
    return '#e63b2e';
  }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function lighten(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

function darken(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c * (1 - amount)).toString(16).padStart(2, '0');
  return `#${mix(r)}${mix(g)}${mix(b)}`;
}

// ════════════════════════════════════════════════════════════════
// CRM DASHBOARD — Sales & Revenue focused
// Layout: 4 KPIs → Revenue trend + Pipeline donut → Sales bar + Gauge + Top table → Offers trend + Sparkline
// ════════════════════════════════════════════════════════════════

function createCrmWidgets(): DashboardWidget[] {
  const p = getPrimaryHex();
  const p2 = lighten(p, 0.25);
  const p3 = darken(p, 0.15);
  const accent = '#10b981';

  return [
    // ── Row 0: 4 KPI cards ──
    {
      id: 'crm-revenue', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.salesRevenue',
      dataSource: 'sales', metric: 'revenue',
      layout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        prefix: '', fontSize: 'lg', fontWeight: 'bold', icon: 'DollarSign', color: p,
        kpiBg: { style: 'gradient', color1: p, color2: p3, gradientAngle: 135, opacity: 92, textLight: true, effect: 'glow' },
      },
    },
    {
      id: 'crm-sales-count', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalSales',
      dataSource: 'sales', metric: 'count',
      layout: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'ShoppingCart', color: accent,
        kpiBg: { style: 'subtle', color1: accent, opacity: 10, effect: 'wave' },
      },
    },
    {
      id: 'crm-offers-count', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalOffers',
      dataSource: 'offers', metric: 'count',
      layout: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'FileText', color: '#6366f1',
        kpiBg: { style: 'subtle', color1: '#6366f1', opacity: 10, effect: 'dots' },
      },
    },
    {
      id: 'crm-contacts', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalContacts',
      dataSource: 'contacts', metric: 'count',
      layout: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'Users', color: '#f59e0b',
        kpiBg: { style: 'subtle', color1: '#f59e0b', opacity: 10, effect: 'rings' },
      },
    },

    // ── Row 1: Revenue area (dominant) + Pipeline donut ──
    {
      id: 'crm-sales-trend', type: 'area',
      titleKey: 'dashboardBuilder.presets.salesTrend',
      descriptionKey: 'dashboardBuilder.presets.salesTrendDesc',
      dataSource: 'sales', metric: 'monthlyTrend',
      layout: { x: 0, y: 1, w: 8, h: 5, minW: 5, minH: 3 },
      config: { color: p, showGrid: true, animated: true },
    },
    {
      id: 'crm-offers-pipeline', type: 'donut',
      titleKey: 'dashboardBuilder.presets.offersPipeline',
      descriptionKey: 'dashboardBuilder.presets.offersPipelineDesc',
      dataSource: 'offers', metric: 'statusBreakdown',
      layout: { x: 8, y: 1, w: 4, h: 5, minW: 3, minH: 3 },
      config: { showLegend: true, innerRadius: 55, animated: true },
    },

    // ── Row 6: Sales bar + Gauge + Top sales table ──
    {
      id: 'crm-sales-status', type: 'bar',
      titleKey: 'dashboardBuilder.presets.salesStatus',
      descriptionKey: 'dashboardBuilder.presets.salesStatusDesc',
      dataSource: 'sales', metric: 'statusBreakdown',
      layout: { x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      config: { color: p, showLabels: true, borderRadius: 6 },
    },
    {
      id: 'crm-conversion-gauge', type: 'gauge',
      titleKey: 'dashboardBuilder.presets.conversionRate',
      dataSource: 'sales', metric: 'conversionRate',
      layout: { x: 4, y: 6, w: 3, h: 4, minW: 2, minH: 3 },
      config: { color: accent, animated: true },
    },
    {
      id: 'crm-top-sales', type: 'table',
      titleKey: 'dashboardBuilder.presets.topSales',
      dataSource: 'sales', metric: 'topItems',
      layout: { x: 7, y: 6, w: 5, h: 4, minW: 3, minH: 3 },
    },

    // ── Row 10: Offers trend + Sparklines ──
    {
      id: 'crm-offers-trend', type: 'line',
      titleKey: 'dashboardBuilder.presets.offersPipeline',
      descriptionKey: 'dashboardBuilder.presets.offersPipelineDesc',
      dataSource: 'offers', metric: 'monthlyTrend',
      layout: { x: 0, y: 10, w: 6, h: 4, minW: 4, minH: 3 },
      config: { color: '#6366f1', showGrid: true },
    },
    {
      id: 'crm-revenue-spark', type: 'sparkline',
      titleKey: 'dashboardBuilder.presets.salesRevenue',
      dataSource: 'sales', metric: 'monthlyTrend',
      layout: { x: 6, y: 10, w: 3, h: 4, minW: 2, minH: 2 },
      config: { color: p, sparklineType: 'area' },
    },
    {
      id: 'crm-contacts-funnel', type: 'funnel',
      titleKey: 'dashboardBuilder.presets.offersPipeline',
      dataSource: 'offers', metric: 'statusBreakdown',
      layout: { x: 9, y: 10, w: 3, h: 4, minW: 3, minH: 3 },
      config: { color: p2 },
    },
  ];
}

// ════════════════════════════════════════════════════════════════
// FIELD OPERATIONS — Service Orders, Tasks, Dispatches
// Layout: 4 KPIs → Task donut + SO bar → Map + Dispatch funnel + Monthly area → Gauge + SO trend
// ════════════════════════════════════════════════════════════════

function createFieldWidgets(): DashboardWidget[] {
  const p = getPrimaryHex();
  const p2 = lighten(p, 0.20);
  const p3 = darken(p, 0.12);
  const teal = '#14b8a6';
  const amber = '#f59e0b';

  return [
    // ── Row 0: 4 KPI cards ──
    {
      id: 'field-so-count', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.activeServiceOrders',
      dataSource: 'serviceOrders', metric: 'count',
      layout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        fontSize: 'lg', icon: 'ClipboardList', color: p,
        kpiBg: { style: 'gradient', color1: p, color2: p3, gradientAngle: 135, opacity: 92, textLight: true, effect: 'wave' },
      },
    },
    {
      id: 'field-tasks', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalTasks',
      dataSource: 'tasks', metric: 'count',
      layout: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'CheckCircle', color: teal,
        kpiBg: { style: 'subtle', color1: teal, opacity: 10, effect: 'dots' },
      },
    },
    {
      id: 'field-dispatches', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalDispatches',
      dataSource: 'dispatches', metric: 'count',
      layout: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'Send', color: '#8b5cf6',
        kpiBg: { style: 'subtle', color1: '#8b5cf6', opacity: 10, effect: 'rings' },
      },
    },
    {
      id: 'field-completion', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.completionRate',
      dataSource: 'tasks', metric: 'completionRate',
      layout: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'Target', color: amber, suffix: '%',
        kpiBg: { style: 'subtle', color1: amber, opacity: 10, effect: 'glow' },
      },
    },

    // ── Row 1: SO status bar (wide) + Task donut ──
    {
      id: 'field-so-status', type: 'bar',
      titleKey: 'dashboardBuilder.presets.serviceOrderStatus',
      descriptionKey: 'dashboardBuilder.presets.serviceOrderStatusDesc',
      dataSource: 'serviceOrders', metric: 'statusBreakdown',
      layout: { x: 0, y: 1, w: 7, h: 5, minW: 4, minH: 3 },
      config: { color: p, showLabels: true, borderRadius: 6, animated: true },
    },
    {
      id: 'field-task-status', type: 'donut',
      titleKey: 'dashboardBuilder.presets.tasksByStatus',
      descriptionKey: 'dashboardBuilder.presets.tasksByStatusDesc',
      dataSource: 'tasks', metric: 'statusBreakdown',
      layout: { x: 7, y: 1, w: 5, h: 5, minW: 3, minH: 3 },
      config: { showLegend: true, innerRadius: 55, animated: true },
    },

    // ── Row 6: Map + Dispatch funnel + Task trend ──
    {
      id: 'field-dispatch-map', type: 'map',
      titleKey: 'dashboardBuilder.presets.dispatchLocations',
      dataSource: 'dispatches', metric: 'count',
      layout: { x: 0, y: 6, w: 5, h: 5, minW: 3, minH: 3 },
      config: { color: p },
    },
    {
      id: 'field-dispatch-funnel', type: 'funnel',
      titleKey: 'dashboardBuilder.presets.dispatchStatus',
      descriptionKey: 'dashboardBuilder.presets.dispatchStatusDesc',
      dataSource: 'dispatches', metric: 'statusBreakdown',
      layout: { x: 5, y: 6, w: 3, h: 5, minW: 3, minH: 3 },
      config: { color: '#8b5cf6' },
    },
    {
      id: 'field-monthly', type: 'area',
      titleKey: 'dashboardBuilder.presets.monthlyTrend',
      descriptionKey: 'dashboardBuilder.presets.monthlyTrendDesc',
      dataSource: 'tasks', metric: 'monthlyTrend',
      layout: { x: 8, y: 6, w: 4, h: 5, minW: 3, minH: 3 },
      config: { color: teal, showGrid: true, animated: true },
    },

    // ── Row 11: Gauge + SO trend line + Sparkline ──
    {
      id: 'field-completion-gauge', type: 'gauge',
      titleKey: 'dashboardBuilder.presets.completionRate',
      dataSource: 'tasks', metric: 'completionRate',
      layout: { x: 0, y: 11, w: 3, h: 4, minW: 2, minH: 3 },
      config: { color: amber, animated: true },
    },
    {
      id: 'field-so-trend', type: 'line',
      titleKey: 'dashboardBuilder.presets.serviceOrderStatus',
      dataSource: 'serviceOrders', metric: 'monthlyTrend',
      layout: { x: 3, y: 11, w: 6, h: 4, minW: 4, minH: 3 },
      config: { color: p, showGrid: true },
    },
    {
      id: 'field-task-spark', type: 'sparkline',
      titleKey: 'dashboardBuilder.presets.totalTasks',
      dataSource: 'tasks', metric: 'monthlyTrend',
      layout: { x: 9, y: 11, w: 3, h: 4, minW: 2, minH: 2 },
      config: { color: teal, sparklineType: 'area' },
    },
  ];
}

// ════════════════════════════════════════════════════════════════
// EXECUTIVE HUB — Full business overview with premium styling
// Layout: 4 gradient KPIs → Sales line + Offers pie + Gauge → Heatmap + Radar + Table → Map + Stacked bar + Sparkline + Donut
// ════════════════════════════════════════════════════════════════

function createExecutiveWidgets(): DashboardWidget[] {
  const p = getPrimaryHex();
  const p2 = lighten(p, 0.25);
  const p3 = darken(p, 0.15);
  const emerald = '#10b981';
  const violet = '#8b5cf6';

  return [
    // ── Row 0: 4 premium gradient KPI cards ──
    {
      id: 'exec-revenue', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.salesRevenue',
      dataSource: 'sales', metric: 'revenue',
      layout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        prefix: '', fontSize: 'lg', fontWeight: 'bold', icon: 'DollarSign', color: p,
        kpiBg: { style: 'gradient', color1: p, color2: p3, gradientAngle: 135, opacity: 92, textLight: true, effect: 'glow' },
      },
    },
    {
      id: 'exec-contacts', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalContacts',
      dataSource: 'contacts', metric: 'count',
      layout: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'Users', color: emerald,
        kpiBg: { style: 'gradient', color1: emerald, color2: darken(emerald, 0.2), gradientAngle: 135, opacity: 90, textLight: true, effect: 'wave' },
      },
    },
    {
      id: 'exec-tasks', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.totalTasks',
      dataSource: 'tasks', metric: 'count',
      layout: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'Briefcase', color: violet,
        kpiBg: { style: 'gradient', color1: violet, color2: darken(violet, 0.15), gradientAngle: 135, opacity: 88, textLight: true, effect: 'dots' },
      },
    },
    {
      id: 'exec-conversion', type: 'kpi',
      titleKey: 'dashboardBuilder.presets.conversionRate',
      dataSource: 'sales', metric: 'conversionRate',
      layout: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
      config: {
        icon: 'Target', color: '#f59e0b', suffix: '%',
        kpiBg: { style: 'gradient', color1: '#f59e0b', color2: '#d97706', gradientAngle: 135, opacity: 90, textLight: true, effect: 'rings' },
      },
    },

    // ── Row 1: Sales line (dominant) + Offers pie + Gauge ──
    {
      id: 'exec-sales-trend', type: 'line',
      titleKey: 'dashboardBuilder.presets.salesTrend',
      descriptionKey: 'dashboardBuilder.presets.salesTrendDesc',
      dataSource: 'sales', metric: 'monthlyTrend',
      layout: { x: 0, y: 1, w: 5, h: 5, minW: 4, minH: 3 },
      config: {
        color: p, showGrid: true, animated: true,
        kpiBg: { style: 'glass', color1: p, color2: p2, opacity: 6, effect: 'aurora' },
      },
    },
    {
      id: 'exec-offers-pie', type: 'pie',
      titleKey: 'dashboardBuilder.presets.offersPipeline',
      descriptionKey: 'dashboardBuilder.presets.offersPipelineDesc',
      dataSource: 'offers', metric: 'statusBreakdown',
      layout: { x: 5, y: 1, w: 4, h: 5, minW: 3, minH: 3 },
      config: {
        showLegend: true, animated: true,
        kpiBg: { style: 'glass', color1: violet, color2: p, opacity: 5, effect: 'hexagons' },
      },
    },
    {
      id: 'exec-completion', type: 'gauge',
      titleKey: 'dashboardBuilder.presets.completionRate',
      dataSource: 'tasks', metric: 'completionRate',
      layout: { x: 9, y: 1, w: 3, h: 5, minW: 2, minH: 3 },
      config: {
        color: emerald, animated: true,
        kpiBg: { style: 'glass', color1: emerald, color2: p2, opacity: 6, effect: 'mesh' },
      },
    },

    // ── Row 6: Heatmap + Radar + Top sales table ──
    {
      id: 'exec-so-heatmap', type: 'heatmap',
      titleKey: 'dashboardBuilder.presets.serviceOrderStatus',
      descriptionKey: 'dashboardBuilder.presets.serviceOrderStatusDesc',
      dataSource: 'serviceOrders', metric: 'statusBreakdown',
      layout: { x: 0, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      config: {
        color: p,
        kpiBg: { style: 'glass', color1: p3, color2: p, opacity: 5, effect: 'diagonal' },
      },
    },
    {
      id: 'exec-task-radar', type: 'radar',
      titleKey: 'dashboardBuilder.presets.tasksByStatus',
      descriptionKey: 'dashboardBuilder.presets.tasksByStatusDesc',
      dataSource: 'tasks', metric: 'statusBreakdown',
      layout: { x: 4, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
      config: {
        color: violet, animated: true,
        kpiBg: { style: 'glass', color1: violet, color2: p2, opacity: 5, effect: 'crosshatch' },
      },
    },
    {
      id: 'exec-top-sales', type: 'table',
      titleKey: 'dashboardBuilder.presets.topSales',
      dataSource: 'sales', metric: 'topItems',
      layout: { x: 8, y: 6, w: 4, h: 4, minW: 3, minH: 3 },
    },

    // ── Row 10: Map + Stacked bar + Sparkline + Donut ──
    {
      id: 'exec-dispatch-map', type: 'map',
      titleKey: 'dashboardBuilder.presets.dispatchLocations',
      dataSource: 'dispatches', metric: 'count',
      layout: { x: 0, y: 10, w: 4, h: 5, minW: 3, minH: 3 },
      config: { color: p },
    },
    {
      id: 'exec-sales-stacked', type: 'stackedBar',
      titleKey: 'dashboardBuilder.presets.salesStatus',
      descriptionKey: 'dashboardBuilder.presets.salesStatusDesc',
      dataSource: 'sales', metric: 'statusBreakdown',
      layout: { x: 4, y: 10, w: 5, h: 5, minW: 3, minH: 3 },
      config: {
        showLegend: true, showGrid: true, animated: true, borderRadius: 6,
        kpiBg: { style: 'glass', color1: p, color2: emerald, opacity: 5, effect: 'noise' },
      },
    },
    {
      id: 'exec-revenue-spark', type: 'sparkline',
      titleKey: 'dashboardBuilder.presets.salesRevenue',
      dataSource: 'sales', metric: 'monthlyTrend',
      layout: { x: 9, y: 10, w: 3, h: 2, minW: 2, minH: 2 },
      config: { color: p, sparklineType: 'area' },
    },
    {
      id: 'exec-offers-donut', type: 'donut',
      titleKey: 'dashboardBuilder.presets.offersPipeline',
      dataSource: 'offers', metric: 'statusBreakdown',
      layout: { x: 9, y: 12, w: 3, h: 3, minW: 3, minH: 3 },
      config: {
        showLegend: false, innerRadius: 55, animated: true,
        kpiBg: { style: 'glass', color1: p3, color2: violet, opacity: 6, effect: 'glow' },
      },
    },
  ];
}

// Backward-compat static exports
export const CRM_TEMPLATE_WIDGETS = createCrmWidgets();
export const FIELD_TEMPLATE_WIDGETS = createFieldWidgets();
export const EXECUTIVE_TEMPLATE_WIDGETS = createExecutiveWidgets();

// Factory map — call the function each time so it picks up the latest primary color
export const TEMPLATE_MAP: Record<string, { nameKey: string; widgets: () => DashboardWidget[] }> = {
  crm: { nameKey: 'dashboardBuilder.templates.crm', widgets: createCrmWidgets },
  field: { nameKey: 'dashboardBuilder.templates.field', widgets: createFieldWidgets },
  executive: { nameKey: 'dashboardBuilder.templates.executive', widgets: createExecutiveWidgets },
};
