import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { WIDGET_REGISTRY, getWidgetsByCategory } from '../registry/widgetRegistry';
import type { DashboardWidget, DataSourceKey, MetricKey, WidgetType } from '../types';
import {
  Plus, ArrowLeft, Hash, BarChart3, PieChart, CircleDot,
  TrendingUp, AreaChart, Table, Gauge, Activity, Filter,
  Radar, Grid3x3, Zap, MapPin,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  map: <MapPin className="h-4 w-4" />,
};

// Pre-built widget templates for quick add
interface WidgetTemplate {
  id: string;
  labelKey: string;
  widget: Omit<DashboardWidget, 'id'>;
}

const WIDGET_TEMPLATES: WidgetTemplate[] = [
  {
    id: 'tpl-revenue-kpi',
    labelKey: 'dashboardBuilder.presets.salesRevenue',
    widget: {
      type: 'kpi', titleKey: 'dashboardBuilder.presets.salesRevenue',
      dataSource: 'sales', metric: 'revenue',
      layout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      config: { icon: 'TrendingUp', color: '#f43f5e', fontSize: 'lg', fontWeight: 'bold' },
    },
  },
  {
    id: 'tpl-contacts-kpi',
    labelKey: 'dashboardBuilder.presets.totalContacts',
    widget: {
      type: 'kpi', titleKey: 'dashboardBuilder.presets.totalContacts',
      dataSource: 'contacts', metric: 'count',
      layout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
      config: { icon: 'Users', color: '#3b82f6' },
    },
  },
  {
    id: 'tpl-sales-status-bar',
    labelKey: 'dashboardBuilder.presets.salesStatus',
    widget: {
      type: 'bar', titleKey: 'dashboardBuilder.presets.salesStatus',
      descriptionKey: 'dashboardBuilder.presets.salesStatusDesc',
      dataSource: 'sales', metric: 'statusBreakdown',
      layout: { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    },
  },
  {
    id: 'tpl-offers-pipeline',
    labelKey: 'dashboardBuilder.presets.offersPipeline',
    widget: {
      type: 'donut', titleKey: 'dashboardBuilder.presets.offersPipeline',
      descriptionKey: 'dashboardBuilder.presets.offersPipelineDesc',
      dataSource: 'offers', metric: 'statusBreakdown',
      layout: { x: 0, y: 0, w: 4, h: 4, minW: 3, minH: 3 },
    },
  },
  {
    id: 'tpl-conversion-gauge',
    labelKey: 'dashboardBuilder.presets.conversionRate',
    widget: {
      type: 'gauge', titleKey: 'dashboardBuilder.presets.conversionRate',
      dataSource: 'sales', metric: 'conversionRate',
      layout: { x: 0, y: 0, w: 3, h: 3, minW: 2, minH: 2 },
    },
  },
  {
    id: 'tpl-sales-trend',
    labelKey: 'dashboardBuilder.presets.salesTrend',
    widget: {
      type: 'area', titleKey: 'dashboardBuilder.presets.salesTrend',
      descriptionKey: 'dashboardBuilder.presets.salesTrendDesc',
      dataSource: 'sales', metric: 'monthlyTrend',
      layout: { x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
    },
  },
  {
    id: 'tpl-task-radar',
    labelKey: 'dashboardBuilder.presets.tasksByStatus',
    widget: {
      type: 'radar', titleKey: 'dashboardBuilder.presets.tasksByStatus',
      dataSource: 'tasks', metric: 'statusBreakdown',
      layout: { x: 0, y: 0, w: 5, h: 4, minW: 3, minH: 3 },
    },
  },
  {
    id: 'tpl-so-heatmap',
    labelKey: 'dashboardBuilder.presets.serviceOrderStatus',
    widget: {
      type: 'heatmap', titleKey: 'dashboardBuilder.presets.serviceOrderStatus',
      dataSource: 'serviceOrders', metric: 'statusBreakdown',
      layout: { x: 0, y: 0, w: 6, h: 3, minW: 3, minH: 2 },
    },
  },
  {
    id: 'tpl-stacked-tasks',
    labelKey: 'dashboardBuilder.presets.tasksByStatus',
    widget: {
      type: 'stackedBar', titleKey: 'dashboardBuilder.presets.tasksByStatus',
      descriptionKey: 'dashboardBuilder.presets.tasksByStatusDesc',
      dataSource: 'tasks', metric: 'statusBreakdown',
      layout: { x: 0, y: 0, w: 6, h: 4, minW: 3, minH: 3 },
    },
  },
  {
    id: 'tpl-top-sales-table',
    labelKey: 'dashboardBuilder.presets.topSales',
    widget: {
      type: 'table', titleKey: 'dashboardBuilder.presets.topSales',
      dataSource: 'sales', metric: 'topItems',
      layout: { x: 0, y: 0, w: 6, h: 5, minW: 4, minH: 3 },
    },
  },
];

interface Props {
  onAdd: (widget: DashboardWidget) => void;
}

export function WidgetPalette({ onAdd }: Props) {
  const { t } = useTranslation('dashboard');
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'type' | 'config'>('type');
  const [selectedType, setSelectedType] = useState<WidgetType | null>(null);
  const [dataSource, setDataSource] = useState<DataSourceKey>('sales');
  const [metric, setMetric] = useState<MetricKey>('count');
  const [customTitle, setCustomTitle] = useState('');

  const categories = getWidgetsByCategory();

  const handleSelectType = (type: WidgetType) => {
    setSelectedType(type);
    const reg = WIDGET_REGISTRY[type];
    setDataSource(reg.supportedDataSources[0]);
    setMetric(reg.supportedMetrics[0]);
    setStep('config');
  };

  const handleAdd = useCallback(() => {
    if (!selectedType) return;
    const reg = WIDGET_REGISTRY[selectedType];
    const widget: DashboardWidget = {
      id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: selectedType,
      titleKey: reg.labelKey,
      titleCustom: customTitle || undefined,
      dataSource,
      metric,
      layout: { ...reg.defaultLayout },
    };
    onAdd(widget);
    setOpen(false);
    setStep('type');
    setSelectedType(null);
    setCustomTitle('');
  }, [selectedType, dataSource, metric, customTitle, onAdd]);

  const handleAddTemplate = useCallback((tpl: WidgetTemplate) => {
    const widget: DashboardWidget = {
      ...tpl.widget,
      id: `widget-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    };
    onAdd(widget);
    setOpen(false);
    setStep('type');
  }, [onAdd]);

  const resetAndClose = () => { setOpen(false); setStep('type'); setSelectedType(null); setCustomTitle(''); };

  const CATEGORY_ORDER = [
    { key: 'kpi', label: 'kpi' },
    { key: 'chart', label: 'chart' },
    { key: 'data', label: 'data' },
    { key: 'progress', label: 'progress' },
  ] as const;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="h-7 px-2.5 text-xs gap-1.5">
        <Plus className="h-3 w-3" />
        {t('dashboardBuilder.addWidget')}
      </Button>

      <Dialog open={open} onOpenChange={(v) => { if (!v) resetAndClose(); else setOpen(true); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              {step === 'config' && (
                <button onClick={() => { setStep('type'); setSelectedType(null); }} className="p-1 rounded hover:bg-muted transition-colors">
                  <ArrowLeft className="h-4 w-4" />
                </button>
              )}
              {step === 'type' ? t('dashboardBuilder.selectWidgetType') : t('dashboardBuilder.configureWidget')}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {step === 'type' ? t('dashboardBuilder.selectWidgetTypeDesc') : t('dashboardBuilder.configureWidgetDesc')}
            </DialogDescription>
          </DialogHeader>

          {step === 'type' ? (
            <Tabs defaultValue="widgets" className="w-full">
              <TabsList className="w-full h-8 bg-muted/40 mb-3">
                <TabsTrigger value="widgets" className="text-xs gap-1.5 flex-1 h-7">
                  <Plus className="h-3 w-3" />
                  {t('dashboardBuilder.addWidget')}
                </TabsTrigger>
                <TabsTrigger value="templates" className="text-xs gap-1.5 flex-1 h-7">
                  <Zap className="h-3 w-3" />
                  {t('dashboardBuilder.widgetTemplates')}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="widgets">
                <div className="space-y-4 max-h-[55vh] overflow-y-auto">
                  {CATEGORY_ORDER.map(({ key, label }) => {
                    const entries = categories[key as keyof typeof categories];
                    if (!entries?.length) return null;
                    return (
                      <div key={key}>
                        <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
                          {t(`dashboardBuilder.categories.${label}`)}
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {entries.map(entry => (
                            <button
                              key={entry.type}
                              onClick={() => handleSelectType(entry.type)}
                              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                            >
                              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/60 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                                {WIDGET_ICONS[entry.type]}
                              </div>
                              <span className="text-xs font-medium text-foreground">{t(entry.labelKey)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="templates">
                <div className="space-y-1.5 max-h-[55vh] overflow-y-auto">
                  {WIDGET_TEMPLATES.map(tpl => (
                    <button
                      key={tpl.id}
                      onClick={() => handleAddTemplate(tpl)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-md bg-muted/60 group-hover:bg-primary/10 text-muted-foreground group-hover:text-primary transition-colors">
                        {WIDGET_ICONS[tpl.widget.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{t(tpl.labelKey)}</p>
                        <p className="text-[10px] text-muted-foreground truncate">
                          {t(`dashboardBuilder.widgets.${tpl.widget.type}`)} · {t(`dashboardBuilder.dataSources.${tpl.widget.dataSource}`)}
                        </p>
                      </div>
                      <Plus className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          ) : selectedType ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/50 border border-border/60">
                <div className="flex items-center justify-center w-9 h-9 rounded-md bg-primary/10 text-primary">
                  {WIDGET_ICONS[selectedType]}
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{t(WIDGET_REGISTRY[selectedType].labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(`dashboardBuilder.categories.${WIDGET_REGISTRY[selectedType].category}`)}</p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('dashboardBuilder.widgetTitle')}</Label>
                <Input value={customTitle} onChange={e => setCustomTitle(e.target.value)}
                  placeholder={t(WIDGET_REGISTRY[selectedType].labelKey)} className="h-9" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.dataSource')}</Label>
                  <Select value={dataSource} onValueChange={v => setDataSource(v as DataSourceKey)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WIDGET_REGISTRY[selectedType].supportedDataSources.map(ds => (
                        <SelectItem key={ds} value={ds}>{t(`dashboardBuilder.dataSources.${ds}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">{t('dashboardBuilder.metric')}</Label>
                  <Select value={metric} onValueChange={v => setMetric(v as MetricKey)}>
                    <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WIDGET_REGISTRY[selectedType].supportedMetrics.map(m => (
                        <SelectItem key={m} value={m}>{t(`dashboardBuilder.metrics.${m}`)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end pt-1">
                <Button size="sm" onClick={handleAdd} className="h-8 text-xs gap-1.5">
                  <Plus className="h-3 w-3" />
                  {t('dashboardBuilder.add')}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
