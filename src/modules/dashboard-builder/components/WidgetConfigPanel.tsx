import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { DashboardWidget, WidgetConfig, WidgetType, DataSourceKey, MetricKey, ExternalApiConfig, KpiBgConfig } from '../types';
import { BG_PRESETS, BG_EFFECTS } from './widgets/WidgetBackground';
import { KPI_ICON_MAP, KPI_ICON_NAMES } from './widgets/WidgetKPI';
import { WIDGET_REGISTRY } from '../registry/widgetRegistry';
import { WidgetRenderer } from './widgets/WidgetRenderer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Palette, RotateCcw, Type, Settings2, Eye, Sliders,
  BarChart3, PieChart, TrendingUp, Activity, CircleDot,
  Table, Gauge, Filter, AreaChart, Hash, AlignLeft, Database,
  Radar, Grid3x3, Globe,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

interface Props {
  widget: DashboardWidget | null;
  open: boolean;
  onClose: () => void;
  onSave: (widget: DashboardWidget) => void;
}

const PRESET_COLORS = [
  '#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#14b8a6', '#a855f7',
];

const WIDGET_ICONS: Record<WidgetType, React.ReactNode> = {
  kpi: <Hash className="h-4 w-4" />,
  bar: <BarChart3 className="h-4 w-4" />,
  pie: <PieChart className="h-4 w-4" />,
  donut: <CircleDot className="h-4 w-4" />,
  line: <TrendingUp className="h-4 w-4" />,
  area: <AreaChart className="h-4 w-4" />,
  table: <Table className="h-4 w-4" />,
  gauge: <Gauge className="h-4 w-4" />,
  sparkline: <Activity className="h-4 w-4" />,
  funnel: <Filter className="h-4 w-4" />,
  radar: <Radar className="h-4 w-4" />,
  stackedBar: <BarChart3 className="h-4 w-4" />,
  heatmap: <Grid3x3 className="h-4 w-4" />,
  map: <Globe className="h-4 w-4" />,
};

type ConfigField = 'color' | 'showLegend' | 'showLabels' | 'prefix' | 'suffix' | 'unit' | 'sparklineType' | 'funnelDirection' | 'innerRadius' | 'outerRadius' | 'maxValue' | 'fontSize' | 'fontWeight' | 'showGrid' | 'animated' | 'borderRadius' | 'icon';

const WIDGET_CONFIG_FIELDS: Record<WidgetType, ConfigField[]> = {
  kpi: ['icon', 'color', 'prefix', 'suffix', 'fontSize', 'fontWeight', 'animated'],
  bar: ['color', 'showLabels', 'showLegend', 'showGrid', 'borderRadius', 'animated'],
  pie: ['color', 'showLegend', 'animated'],
  donut: ['color', 'showLegend', 'innerRadius', 'animated'],
  line: ['color', 'showLegend', 'showGrid', 'animated'],
  area: ['color', 'showLegend', 'showGrid', 'animated'],
  table: ['color', 'showLabels'],
  gauge: ['color', 'maxValue', 'animated'],
  sparkline: ['color', 'sparklineType', 'animated'],
  funnel: ['color', 'funnelDirection', 'animated'],
  radar: ['color', 'showGrid', 'animated'],
  stackedBar: ['color', 'showLegend', 'showGrid', 'borderRadius', 'animated'],
  heatmap: ['color', 'animated'],
  map: ['color'],
};

// Which tab each field belongs to
const FIELD_TAB: Record<ConfigField, string> = {
  icon: 'style',
  color: 'style',
  fontSize: 'style',
  fontWeight: 'style',
  borderRadius: 'style',
  prefix: 'display',
  suffix: 'display',
  unit: 'display',
  showLegend: 'display',
  showLabels: 'display',
  showGrid: 'display',
  sparklineType: 'display',
  funnelDirection: 'display',
  innerRadius: 'display',
  outerRadius: 'display',
  maxValue: 'display',
  animated: 'advanced',
};

export function WidgetConfigPanel({ widget, open, onClose, onSave }: Props) {
  const { t } = useTranslation('dashboard');
  const [config, setConfig] = useState<WidgetConfig>({});
  const [customTitle, setCustomTitle] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [selectedDataSource, setSelectedDataSource] = useState<DataSourceKey>('sales');
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('count');

  useEffect(() => {
    if (widget) {
      setConfig(widget.config || {});
      setCustomTitle(widget.titleCustom || '');
      setCustomDescription(widget.descriptionCustom || '');
      setSelectedDataSource(widget.dataSource);
      setSelectedMetric(widget.metric);
    }
  }, [widget]);

  // Build a preview widget from current state (must be before early return)
  const previewWidget = useMemo<DashboardWidget | null>(() => {
    if (!widget) return null;
    return {
      ...widget,
      titleCustom: customTitle || undefined,
      descriptionCustom: customDescription || undefined,
      dataSource: selectedDataSource,
      metric: selectedMetric,
      config: Object.keys(config).length > 0 ? config : undefined,
    };
  }, [widget, customTitle, customDescription, selectedDataSource, selectedMetric, config]);

  if (!widget || !previewWidget) return null;

  const fields = WIDGET_CONFIG_FIELDS[widget.type] || [];

  const hasFieldsInTab = (tab: string) => fields.some(f => FIELD_TAB[f] === tab);

  const updateConfig = (key: keyof WidgetConfig, value: any) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    onSave({
      ...widget,
      titleCustom: customTitle || undefined,
      descriptionCustom: customDescription || undefined,
      dataSource: selectedDataSource,
      metric: selectedMetric,
      config: Object.keys(config).length > 0 ? config : undefined,
    });
    onClose();
  };

  const handleResetColor = () => {
    setConfig(prev => {
      const { color, ...rest } = prev;
      return rest;
    });
  };

  const handleResetAll = () => {
    setConfig({});
    setCustomTitle('');
    setCustomDescription('');
    if (widget) {
      setSelectedDataSource(widget.dataSource);
      setSelectedMetric(widget.metric);
    }
  };

  // Get supported metrics for the selected data source and widget type
  const registryEntry = WIDGET_REGISTRY[widget.type];
  const supportedDataSources = registryEntry?.supportedDataSources || [];
  const supportedMetrics = registryEntry?.supportedMetrics || [];

  const DATA_SOURCE_LABELS: Record<DataSourceKey, string> = {
    sales: t('dashboardBuilder.dataSources.sales'),
    offers: t('dashboardBuilder.dataSources.offers'),
    contacts: t('dashboardBuilder.dataSources.contacts'),
    tasks: t('dashboardBuilder.dataSources.tasks'),
    articles: t('dashboardBuilder.dataSources.articles'),
    serviceOrders: t('dashboardBuilder.dataSources.serviceOrders'),
    dispatches: t('dashboardBuilder.dataSources.dispatches'),
    timeExpenses: t('dashboardBuilder.dataSources.timeExpenses'),
    externalApi: t('dashboardBuilder.dataSources.externalApi', 'External API'),
  };

  const METRIC_LABELS: Record<MetricKey, string> = {
    count: t('dashboardBuilder.metrics.count'),
    total: t('dashboardBuilder.metrics.total'),
    revenue: t('dashboardBuilder.metrics.revenue'),
    average: t('dashboardBuilder.metrics.average'),
    statusBreakdown: t('dashboardBuilder.metrics.statusBreakdown'),
    priorityBreakdown: t('dashboardBuilder.metrics.priorityBreakdown'),
    monthlyTrend: t('dashboardBuilder.metrics.monthlyTrend'),
    topItems: t('dashboardBuilder.metrics.topItems'),
    conversionRate: t('dashboardBuilder.metrics.conversionRate'),
    completionRate: t('dashboardBuilder.metrics.completionRate'),
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2.5 text-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
              {WIDGET_ICONS[widget.type]}
            </div>
            {t('dashboardBuilder.configPanel.title')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {t('dashboardBuilder.configPanel.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-4 max-h-[70vh] overflow-y-auto sm:overflow-y-hidden">
          {/* ── Preview: above on mobile, left on desktop ── */}
          <div className="w-full sm:w-[240px] flex-shrink-0 flex flex-col gap-2">
            <Label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Eye className="h-3 w-3" />
              {t('dashboardBuilder.configPanel.livePreview')}
            </Label>
            <div
              className="rounded-xl border border-border/60 bg-card overflow-hidden shadow-sm"
              style={{ height: previewWidget.type === 'kpi' || previewWidget.type === 'sparkline' ? '120px' : '220px' }}
            >
              <WidgetRenderer widget={previewWidget} />
            </div>
            {/* Widget type info */}
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40">
              <div className="flex items-center justify-center w-6 h-6 rounded bg-background border border-border/40 text-muted-foreground">
                {WIDGET_ICONS[widget.type]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-foreground truncate">
                  {t(`dashboardBuilder.widgets.${widget.type}`)}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {DATA_SOURCE_LABELS[selectedDataSource]} · {METRIC_LABELS[selectedMetric]}
                </p>
              </div>
            </div>
          </div>

          {/* ── Settings ── */}
          <div className="flex-1 min-w-0 space-y-4 sm:overflow-y-auto pr-1">

          {/* Custom title */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              {t('dashboardBuilder.widgetTitle')}
            </Label>
            <Input
              value={customTitle}
              onChange={e => setCustomTitle(e.target.value)}
              placeholder={t(widget.titleKey)}
              className="h-9"
            />
          </div>

          {/* Custom description / subtitle */}
          <div className="space-y-1.5">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
              {t('dashboardBuilder.configPanel.subtitle')}
            </Label>
            <Input
              value={customDescription}
              onChange={e => setCustomDescription(e.target.value)}
              placeholder={widget.descriptionKey ? t(widget.descriptionKey) : t('dashboardBuilder.configPanel.subtitlePlaceholder')}
              className="h-9"
            />
            <p className="text-[10px] text-muted-foreground">
              {t('dashboardBuilder.configPanel.subtitleHint')}
            </p>
          </div>

          <Separator className="my-1" />

          {/* Data Source & Metric */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-muted-foreground" />
                {t('dashboardBuilder.configPanel.dataSource')}
              </Label>
              <Select value={selectedDataSource} onValueChange={(v) => setSelectedDataSource(v as DataSourceKey)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {supportedDataSources.map(ds => (
                    <SelectItem key={ds} value={ds}>{DATA_SOURCE_LABELS[ds] || ds}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />
                {t('dashboardBuilder.configPanel.metric')}
              </Label>
              <Select value={selectedMetric} onValueChange={(v) => setSelectedMetric(v as MetricKey)}>
                <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {supportedMetrics.map(m => (
                    <SelectItem key={m} value={m}>{METRIC_LABELS[m] || m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* External API Configuration */}
          {selectedDataSource === 'externalApi' && (
            <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
              <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                <Globe className="h-3.5 w-3.5" />
                {t('dashboardBuilder.externalApi.title', 'External API Configuration')}
              </Label>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.url', 'API URL')}</Label>
                <Input
                  value={config.externalApi?.url || ''}
                  onChange={e => updateConfig('externalApi', { ...config.externalApi, url: e.target.value } as ExternalApiConfig)}
                  placeholder="https://api.example.com/data"
                  className="h-8 text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.method', 'Method')}</Label>
                  <Select
                    value={config.externalApi?.method || 'GET'}
                    onValueChange={v => updateConfig('externalApi', { ...config.externalApi, method: v } as ExternalApiConfig)}
                  >
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GET">GET</SelectItem>
                      <SelectItem value="POST">POST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.refreshInterval', 'Refresh (sec)')}</Label>
                  <Input
                    type="number"
                    value={config.externalApi?.refreshInterval || 0}
                    onChange={e => updateConfig('externalApi', { ...config.externalApi, refreshInterval: parseInt(e.target.value) || 0 } as ExternalApiConfig)}
                    placeholder="0"
                    className="h-8 text-xs"
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.dataPath', 'Data Array Path')}</Label>
                <Input
                  value={config.externalApi?.dataPath || ''}
                  onChange={e => updateConfig('externalApi', { ...config.externalApi, dataPath: e.target.value } as ExternalApiConfig)}
                  placeholder="data.items"
                  className="h-8 text-xs font-mono"
                />
                <p className="text-[10px] text-muted-foreground">{t('dashboardBuilder.externalApi.dataPathHint', 'Dot path to the array in the JSON response')}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.valuePath', 'Value Path')}</Label>
                  <Input
                    value={config.externalApi?.valuePath || ''}
                    onChange={e => updateConfig('externalApi', { ...config.externalApi, valuePath: e.target.value } as ExternalApiConfig)}
                    placeholder="amount"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.labelPath', 'Label Path')}</Label>
                  <Input
                    value={config.externalApi?.labelPath || ''}
                    onChange={e => updateConfig('externalApi', { ...config.externalApi, labelPath: e.target.value } as ExternalApiConfig)}
                    placeholder="name"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {config.externalApi?.method === 'POST' && (
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">{t('dashboardBuilder.externalApi.body', 'Request Body (JSON)')}</Label>
                  <Input
                    value={config.externalApi?.body || ''}
                    onChange={e => updateConfig('externalApi', { ...config.externalApi, body: e.target.value } as ExternalApiConfig)}
                    placeholder='{"key": "value"}'
                    className="h-8 text-xs font-mono"
                  />
                </div>
              )}
            </div>
          )}

          <Separator className="my-2" />

          {/* Tabbed settings */}
          <Tabs defaultValue="style" className="w-full">
            <TabsList className="w-full h-8 bg-muted/40">
              <TabsTrigger value="style" className="text-xs gap-1.5 flex-1 h-7">
                <Palette className="h-3 w-3" />
                {t('dashboardBuilder.configPanel.tabStyle')}
              </TabsTrigger>
              <TabsTrigger value="display" className="text-xs gap-1.5 flex-1 h-7">
                <Eye className="h-3 w-3" />
                {t('dashboardBuilder.configPanel.tabDisplay')}
              </TabsTrigger>
              <TabsTrigger value="advanced" className="text-xs gap-1.5 flex-1 h-7">
                <Sliders className="h-3 w-3" />
                {t('dashboardBuilder.configPanel.tabAdvanced')}
              </TabsTrigger>
            </TabsList>

            {/* ── Style Tab ── */}
            <TabsContent value="style" className="space-y-4 mt-3">
              {/* Icon picker (KPI) */}
              {fields.includes('icon') && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    {t('dashboardBuilder.configPanel.icon')}
                  </Label>
                  <ScrollArea className="h-[120px] rounded-md border border-border/60 p-2">
                    <div className="grid grid-cols-8 gap-1.5">
                      {KPI_ICON_NAMES.map((name) => {
                        const Icon = KPI_ICON_MAP[name];
                        const isSelected = config.icon === name;
                        return (
                          <button
                            key={name}
                            type="button"
                            onClick={() => updateConfig('icon', name)}
                            className={`p-2 rounded-md transition-all duration-150 flex items-center justify-center ${
                              isSelected
                                ? 'bg-primary/15 text-primary ring-1 ring-primary/30'
                                : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                            }`}
                            title={name}
                          >
                            <Icon className="h-4 w-4" />
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              )}
              {/* Color picker */}
              {fields.includes('color') && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                      {t('dashboardBuilder.configPanel.color')}
                    </Label>
                    {config.color && (
                      <Button variant="ghost" size="sm" onClick={handleResetColor} className="h-6 px-2 text-xs gap-1">
                        <RotateCcw className="h-3 w-3" />
                        {t('dashboardBuilder.configPanel.reset')}
                      </Button>
                    )}
                  </div>
                  <div className="flex gap-2 items-center">
                    <div className="relative">
                      <input
                        type="color"
                        value={config.color || '#6366f1'}
                        onChange={(e) => updateConfig('color', e.target.value)}
                        className="w-10 h-10 rounded-lg border border-border/50 cursor-pointer bg-background p-0.5"
                      />
                    </div>
                    <Input
                      value={config.color || ''}
                      onChange={(e) => updateConfig('color', e.target.value)}
                      placeholder={t('dashboardBuilder.configPanel.defaultColor')}
                      className="h-9 flex-1 font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {PRESET_COLORS.map((color, i) => (
                      <button
                        key={i}
                        onClick={() => updateConfig('color', color)}
                        className={`w-full aspect-square rounded-md border-2 transition-all duration-150 hover:scale-110 ${
                          config.color === color ? 'border-foreground ring-1 ring-foreground/20 scale-110' : 'border-border/20 hover:border-border/60'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Widget Background Config — available for ALL widget types */}
              <div className="space-y-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                <Label className="text-xs font-semibold flex items-center gap-1.5 text-primary">
                  <Palette className="h-3.5 w-3.5" />
                  {t('dashboardBuilder.bgConfig.title')}
                </Label>

                {/* Background style */}
                <div className="space-y-1.5">
                  <Label className="text-[11px] font-medium">{t('dashboardBuilder.bgConfig.style')}</Label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(['subtle', 'solid', 'gradient', 'glass'] as const).map((key) => (
                      <button key={key} type="button"
                        onClick={() => updateConfig('kpiBg', { ...config.kpiBg, style: key } as KpiBgConfig)}
                        className={`px-2 py-1.5 rounded-md text-[10px] font-medium capitalize transition-all border ${
                          (config.kpiBg?.style || 'subtle') === key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}>{key}</button>
                    ))}
                  </div>
                </div>

                {/* Colors row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.color1')}</Label>
                    <div className="flex items-center gap-1.5">
                      <input type="color" value={config.kpiBg?.color1 || config.color || '#6366f1'}
                        onChange={(e) => updateConfig('kpiBg', { ...config.kpiBg, color1: e.target.value } as KpiBgConfig)}
                        className="w-8 h-8 rounded-md border border-border/50 cursor-pointer bg-background p-0.5" />
                      <Input value={config.kpiBg?.color1 || ''} placeholder={t('dashboardBuilder.bgConfig.auto')}
                        onChange={(e) => updateConfig('kpiBg', { ...config.kpiBg, color1: e.target.value } as KpiBgConfig)}
                        className="h-8 text-[10px] font-mono flex-1" />
                    </div>
                  </div>
                  {(config.kpiBg?.style === 'gradient' || config.kpiBg?.style === 'glass') && (
                    <div className="space-y-1">
                      <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.color2')}</Label>
                      <div className="flex items-center gap-1.5">
                        <input type="color" value={config.kpiBg?.color2 || '#3b82f6'}
                          onChange={(e) => updateConfig('kpiBg', { ...config.kpiBg, color2: e.target.value } as KpiBgConfig)}
                          className="w-8 h-8 rounded-md border border-border/50 cursor-pointer bg-background p-0.5" />
                        <Input value={config.kpiBg?.color2 || ''} placeholder="#3b82f6"
                          onChange={(e) => updateConfig('kpiBg', { ...config.kpiBg, color2: e.target.value } as KpiBgConfig)}
                          className="h-8 text-[10px] font-mono flex-1" />
                      </div>
                    </div>
                  )}
                </div>

                {/* Gradient angle */}
                {(config.kpiBg?.style === 'gradient' || config.kpiBg?.style === 'glass') && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.angle')}: {config.kpiBg?.gradientAngle ?? 135}°</Label>
                    <input type="range" min={0} max={360} value={config.kpiBg?.gradientAngle ?? 135}
                      onChange={(e) => updateConfig('kpiBg', { ...config.kpiBg, gradientAngle: parseInt(e.target.value) } as KpiBgConfig)}
                      className="w-full h-1.5 accent-primary" />
                  </div>
                )}

                {/* Opacity */}
                {config.kpiBg?.style && config.kpiBg.style !== 'subtle' && (
                  <div className="space-y-1">
                    <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.opacity')}: {config.kpiBg?.opacity ?? 8}%</Label>
                    <input type="range" min={5} max={100} value={config.kpiBg?.opacity ?? 8}
                      onChange={(e) => updateConfig('kpiBg', { ...config.kpiBg, opacity: parseInt(e.target.value) } as KpiBgConfig)}
                      className="w-full h-1.5 accent-primary" />
                  </div>
                )}

                {/* Effect — now with 11 options */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.effect')}</Label>
                  <div className="grid grid-cols-4 gap-1">
                    {BG_EFFECTS.map(({ key, label }) => (
                      <button key={key} type="button"
                        onClick={() => updateConfig('kpiBg', { ...config.kpiBg, effect: key } as KpiBgConfig)}
                        className={`px-1.5 py-1 rounded-md text-[9px] font-medium transition-all border ${
                          (config.kpiBg?.effect || 'none') === key
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-border/40 text-muted-foreground hover:border-border hover:text-foreground'
                        }`}>{label}</button>
                    ))}
                  </div>
                </div>

                {/* Light text toggle */}
                {widget.type === 'kpi' && config.kpiBg?.style && config.kpiBg.style !== 'subtle' && (
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.lightText')}</Label>
                    <Switch checked={config.kpiBg?.textLight ?? false}
                      onCheckedChange={(v) => updateConfig('kpiBg', { ...config.kpiBg, textLight: v } as KpiBgConfig)} />
                  </div>
                )}

                {/* Preset gradient combos — 12 options */}
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-medium">{t('dashboardBuilder.bgConfig.quickPresets')}</Label>
                  <div className="grid grid-cols-6 gap-1.5">
                    {BG_PRESETS.map((preset, i) => (
                      <button key={i} type="button"
                        onClick={() => updateConfig('kpiBg', {
                          ...config.kpiBg, style: 'gradient', color1: preset.c1, color2: preset.c2,
                          opacity: widget.type === 'kpi' ? 85 : 15, textLight: widget.type === 'kpi', effect: 'none',
                        } as KpiBgConfig)}
                        className="w-full aspect-square rounded-md border border-border/30 hover:scale-110 transition-transform"
                        style={{ background: `linear-gradient(135deg, ${preset.c1}, ${preset.c2})` }}
                        title={preset.label} />
                    ))}
                  </div>
                </div>
              </div>

              {fields.includes('fontSize') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('dashboardBuilder.configPanel.fontSize')}
                  </Label>
                  <Select value={config.fontSize || 'md'} onValueChange={v => updateConfig('fontSize', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sm">{t('dashboardBuilder.configPanel.fontSizeSm')}</SelectItem>
                      <SelectItem value="md">{t('dashboardBuilder.configPanel.fontSizeMd')}</SelectItem>
                      <SelectItem value="lg">{t('dashboardBuilder.configPanel.fontSizeLg')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Font Weight (KPI) */}
              {fields.includes('fontWeight') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.fontWeight')}</Label>
                  <Select value={config.fontWeight || 'semibold'} onValueChange={v => updateConfig('fontWeight', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">{t('dashboardBuilder.configPanel.fontWeightNormal')}</SelectItem>
                      <SelectItem value="semibold">{t('dashboardBuilder.configPanel.fontWeightSemibold')}</SelectItem>
                      <SelectItem value="bold">{t('dashboardBuilder.configPanel.fontWeightBold')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Border radius (bar charts) */}
              {fields.includes('borderRadius') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    {t('dashboardBuilder.configPanel.borderRadius')}
                  </Label>
                  <Select value={String(config.borderRadius ?? 6)} onValueChange={v => updateConfig('borderRadius', parseInt(v))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">{t('dashboardBuilder.configPanel.borderRadiusNone')}</SelectItem>
                      <SelectItem value="4">{t('dashboardBuilder.configPanel.borderRadiusSm')}</SelectItem>
                      <SelectItem value="6">{t('dashboardBuilder.configPanel.borderRadiusMd')}</SelectItem>
                      <SelectItem value="12">{t('dashboardBuilder.configPanel.borderRadiusLg')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {!hasFieldsInTab('style') && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t('dashboardBuilder.configPanel.noStyleOptions')}
                </p>
              )}
            </TabsContent>

            {/* ── Display Tab ── */}
            <TabsContent value="display" className="space-y-4 mt-3">
              {/* Show Legend */}
              {fields.includes('showLegend') && (
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('dashboardBuilder.configPanel.showLegend')}
                  </Label>
                  <Switch
                    checked={config.showLegend !== false}
                    onCheckedChange={(v) => updateConfig('showLegend', v)}
                  />
                </div>
              )}

              {/* Show Labels */}
              {fields.includes('showLabels') && (
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('dashboardBuilder.configPanel.showLabels')}
                  </Label>
                  <Switch
                    checked={config.showLabels !== false}
                    onCheckedChange={(v) => updateConfig('showLabels', v)}
                  />
                </div>
              )}

              {/* Show Grid */}
              {fields.includes('showGrid') && (
                <div className="flex items-center justify-between py-1">
                  <Label className="text-xs font-medium flex items-center gap-1.5">
                    <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('dashboardBuilder.configPanel.showGrid')}
                  </Label>
                  <Switch
                    checked={config.showGrid !== false}
                    onCheckedChange={(v) => updateConfig('showGrid', v)}
                  />
                </div>
              )}

              {/* Prefix / Suffix (KPI) */}
              {fields.includes('prefix') && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.prefix')}</Label>
                    <Input
                      value={config.prefix || ''}
                      onChange={e => updateConfig('prefix', e.target.value)}
                      placeholder="$"
                      className="h-9"
                    />
                  </div>
                  {fields.includes('suffix') && (
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.suffix')}</Label>
                      <Input
                        value={config.suffix || ''}
                        onChange={e => updateConfig('suffix', e.target.value)}
                        placeholder="%"
                        className="h-9"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Sparkline type */}
              {fields.includes('sparklineType') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.sparklineType')}</Label>
                  <Select value={config.sparklineType || 'area'} onValueChange={v => updateConfig('sparklineType', v)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="line">{t('dashboardBuilder.configPanel.sparklineLine')}</SelectItem>
                      <SelectItem value="area">{t('dashboardBuilder.configPanel.sparklineArea')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Funnel direction */}
              {fields.includes('funnelDirection') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.funnelDirection')}</Label>
                  <Select value={config.funnelDirection || 'horizontal'} onValueChange={v => updateConfig('funnelDirection', v as any)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal">{t('dashboardBuilder.configPanel.horizontal')}</SelectItem>
                      <SelectItem value="vertical">{t('dashboardBuilder.configPanel.vertical')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Inner Radius (donut) */}
              {fields.includes('innerRadius') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.innerRadius')}</Label>
                  <Select value={String(config.innerRadius ?? 45)} onValueChange={v => updateConfig('innerRadius', parseInt(v))}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">{t('dashboardBuilder.configPanel.innerRadiusThin')}</SelectItem>
                      <SelectItem value="45">{t('dashboardBuilder.configPanel.innerRadiusMedium')}</SelectItem>
                      <SelectItem value="60">{t('dashboardBuilder.configPanel.innerRadiusThick')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Max value (gauge) */}
              {fields.includes('maxValue') && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.maxValue')}</Label>
                  <Input
                    type="number"
                    value={config.maxValue || 100}
                    onChange={e => updateConfig('maxValue', parseInt(e.target.value) || 100)}
                    className="h-9"
                  />
                </div>
              )}

              {!hasFieldsInTab('display') && (
                <p className="text-xs text-muted-foreground text-center py-4">
                  {t('dashboardBuilder.configPanel.noDisplayOptions')}
                </p>
              )}
            </TabsContent>

            {/* ── Advanced Tab ── */}
            <TabsContent value="advanced" className="space-y-4 mt-3">
              {/* Animation */}
              {fields.includes('animated') && (
                <div className="flex items-center justify-between py-1">
                  <div>
                    <Label className="text-xs font-medium flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5 text-muted-foreground" />
                      {t('dashboardBuilder.configPanel.animated')}
                    </Label>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {t('dashboardBuilder.configPanel.animatedDesc')}
                    </p>
                  </div>
                  <Switch
                    checked={config.animated !== false}
                    onCheckedChange={(v) => updateConfig('animated', v)}
                  />
                </div>
              )}

              {/* Reset all */}
              <Separator />
              <div className="flex items-center justify-between py-1">
                <div>
                  <Label className="text-xs font-medium">{t('dashboardBuilder.configPanel.resetAll')}</Label>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {t('dashboardBuilder.configPanel.resetAllDesc')}
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={handleResetAll} className="h-7 px-2.5 text-xs gap-1">
                  <RotateCcw className="h-3 w-3" />
                  {t('dashboardBuilder.configPanel.reset')}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </div>

        <DialogFooter className="gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('dashboardBuilder.cancel')}
          </Button>
          <Button size="sm" onClick={handleSave} className="gap-1.5">
            <Settings2 className="h-3 w-3" />
            {t('dashboardBuilder.configPanel.apply')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
