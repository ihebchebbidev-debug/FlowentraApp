import { useMemo, useCallback, useRef, type ComponentType } from 'react';
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import { motion } from 'framer-motion';
import 'react-grid-layout/css/styles.css';
import '../styles/grid.css';
import type { DashboardWidget, WidgetType, DataSourceKey } from '../types';
import { WidgetRenderer } from './widgets/WidgetRenderer';
import type { GridSettings, WidgetAnimation } from './GridSettingsPopover';
import { DEFAULT_GRID_SETTINGS } from './GridSettingsPopover';

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

function getWidgetAnimationProps(anim: WidgetAnimation, index: number, hasInit: boolean) {
  const delay = hasInit ? 0 : index * 0.04;
  const base = {
    animate: { opacity: 1, scale: 1, y: 0, x: 0 },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
  };
  switch (anim) {
    case 'none':
      return { initial: { opacity: 1 }, animate: { opacity: 1 }, transition: { duration: 0 } };
    case 'slide':
      return { ...base, initial: { opacity: 0, y: 24 }, transition: { duration: 0.4, delay, ease: EASE } };
    case 'scale':
      return { ...base, initial: { opacity: 0, scale: 0.85 }, transition: { duration: 0.35, delay, ease: EASE } };
    case 'bounce':
      return { ...base, initial: { opacity: 0, y: 30, scale: 0.9 }, transition: { duration: 0.5, delay, type: 'spring' as const, bounce: 0.4 } };
    case 'fade':
    default:
      return { ...base, initial: { opacity: 0, y: 6 }, transition: { duration: 0.3, delay, ease: EASE } };
  }
}
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  GripVertical, X, Settings2, Hash, BarChart3, PieChart, CircleDot,
  TrendingUp, AreaChart, Table, Gauge, Activity, Filter,
  Users, FileText, CheckCircle, Package, ClipboardList, Calendar, Clock,
  ExternalLink, Radar, Grid3x3, Globe, MapPin,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const ResponsiveGridLayout = WidthProvider(Responsive) as unknown as ComponentType<any>;

const WIDGET_TYPE_ICONS: Record<WidgetType, LucideIcon> = {
  kpi: Hash,
  bar: BarChart3,
  pie: PieChart,
  donut: CircleDot,
  line: TrendingUp,
  area: AreaChart,
  table: Table,
  gauge: Gauge,
  sparkline: Activity,
  funnel: Filter,
  radar: Radar,
  stackedBar: BarChart3,
  heatmap: Grid3x3,
  map: MapPin,
};

const DATASOURCE_ICONS: Record<DataSourceKey, LucideIcon> = {
  sales: TrendingUp,
  contacts: Users,
  offers: FileText,
  tasks: CheckCircle,
  articles: Package,
  serviceOrders: ClipboardList,
  dispatches: Calendar,
  timeExpenses: Clock,
  externalApi: Globe,
};

interface Props {
  widgets: DashboardWidget[];
  isEditing: boolean;
  gridSettings?: GridSettings;
  onLayoutChange?: (widgets: DashboardWidget[]) => void;
  onRemoveWidget?: (id: string) => void;
  onEditWidget?: (id: string) => void;
}

const BREAKPOINTS = { lg: 900, md: 700, sm: 500, xs: 380, xxs: 0 };
const COLS = { lg: 12, md: 9, sm: 6, xs: 4, xxs: 2 };

export function DashboardGrid({ widgets, isEditing, gridSettings, onLayoutChange, onRemoveWidget, onEditWidget }: Props) {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();
  const gs = gridSettings || DEFAULT_GRID_SETTINGS;

  const layouts = useMemo(() => {
    const lgLayout: Layout[] = widgets.map(w => ({
      i: w.id, x: w.layout.x, y: w.layout.y, w: w.layout.w, h: w.layout.h,
      minW: w.layout.minW, minH: w.layout.minH, maxW: w.layout.maxW, maxH: w.layout.maxH,
      static: !isEditing,
    }));

    // md: 9 cols – KPIs forced to 2 per row (w=4 or w=5 to fill), charts proportional
    const mdLayout: Layout[] = (() => {
      let curX = 0, curY = 0, rowH = 0;
      let kpiCount = 0;
      return widgets.map((w) => {
        const isSmall = w.type === 'kpi' || w.type === 'sparkline';
        let mw: number;
        if (isSmall) {
          // 2 KPIs per row: alternate between 5 and 4 to fill 9 cols
          mw = kpiCount % 2 === 0 ? 5 : 4;
          kpiCount++;
        } else {
          mw = Math.min(w.layout.w, 9);
        }
        if (curX + mw > 9) { curX = 0; curY += rowH; rowH = 0; }
        const item = { i: w.id, x: curX, y: curY, w: mw, h: w.layout.h, minW: w.layout.minW, minH: w.layout.minH, static: !isEditing };
        curX += mw; rowH = Math.max(rowH, w.layout.h);
        return item;
      });
    })();

    // sm: 6 cols – KPIs 2 per row (w=3 each), charts full width
    const smLayout: Layout[] = (() => {
      let curX = 0, curY = 0, rowH = 0;
      return widgets.map((w) => {
        const isSmall = w.type === 'kpi' || w.type === 'sparkline';
        const sw = isSmall ? 3 : 6;
        if (curX + sw > 6) { curX = 0; curY += rowH; rowH = 0; }
        const item = { i: w.id, x: curX, y: curY, w: sw, h: isSmall ? w.layout.h : Math.max(w.layout.h, 3), minH: w.layout.minH, static: !isEditing };
        curX += sw; rowH = Math.max(rowH, item.h);
        return item;
      });
    })();

    // xs: 4 cols – KPIs 2 per row (w=2 each)
    const xsLayout: Layout[] = (() => {
      let curX = 0, curY = 0, rowH = 0;
      return widgets.map((w) => {
        const isSmall = w.type === 'kpi' || w.type === 'sparkline';
        const xw = isSmall ? 2 : 4;
        if (curX + xw > 4) { curX = 0; curY += rowH; rowH = 0; }
        const item = { i: w.id, x: curX, y: curY, w: xw, h: isSmall ? w.layout.h : Math.max(w.layout.h, 3), minH: w.layout.minH, static: !isEditing };
        curX += xw; rowH = Math.max(rowH, item.h);
        return item;
      });
    })();

    const xxsLayout: Layout[] = widgets.map((w, i) => ({
      i: w.id, x: 0, y: i * 4, w: 2, h: Math.max(w.layout.h, 3), static: !isEditing,
    }));

    return { lg: lgLayout, md: mdLayout, sm: smLayout, xs: xsLayout, xxs: xxsLayout } as Layouts;
  }, [widgets, isEditing]);

  const handleLayoutChange = useCallback(
    (_currentLayout: Layout[], allLayouts: Layouts) => {
      if (!isEditing || !onLayoutChange) return;
      const lgLayout = allLayouts.lg || _currentLayout;
      const updated = widgets.map(w => {
        const item = lgLayout.find(l => l.i === w.id);
        if (!item) return w;
        return { ...w, layout: { ...w.layout, x: item.x, y: item.y, w: item.w, h: item.h } };
      });
      onLayoutChange(updated);
    },
    [widgets, isEditing, onLayoutChange]
  );

  const hasInitialised = useRef(false);
  if (!hasInitialised.current && widgets.length > 0) {
    setTimeout(() => { hasInitialised.current = true; }, 400);
  }

  if (!widgets.length) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">{t('dashboardBuilder.emptyState')}</p>
      </div>
    );
  }

  return (
    <ResponsiveGridLayout
      className="dashboard-grid"
      layouts={layouts}
      breakpoints={BREAKPOINTS}
      cols={COLS}
      rowHeight={gs.rowHeight}
      onLayoutChange={handleLayoutChange}
      isDraggable={isEditing}
      isResizable={isEditing}
      compactType="vertical"
      margin={[gs.gap, gs.gap]}
      containerPadding={[0, 0]}
      draggableHandle=".widget-drag-handle"
      style={{ '--grid-radius': `${gs.radius}px` } as React.CSSProperties}
      data-card-style={gs.cardStyle}
    >
      {widgets.map((widget, index) => {
        const isCompact = widget.type === 'kpi' || widget.type === 'sparkline';
        const isChart = ['bar', 'pie', 'donut', 'line', 'area', 'funnel'].includes(widget.type);
        const WidgetIcon = DATASOURCE_ICONS[widget.dataSource] || WIDGET_TYPE_ICONS[widget.type];
        const title = widget.titleCustom || t(widget.titleKey);
        const description = widget.descriptionCustom || (widget.descriptionKey ? t(widget.descriptionKey) : undefined);

        const viewAllRouteMap: Record<DataSourceKey, string | null> = {
          sales: '/dashboard/sales',
          offers: '/dashboard/offers',
          contacts: '/dashboard/contacts',
          tasks: '/dashboard/tasks',
          articles: '/dashboard/articles',
          serviceOrders: '/dashboard/field/service-orders',
          dispatches: '/dashboard/field/dispatches',
          timeExpenses: '/dashboard/field/time-expenses',
          externalApi: null,
        };

        return (
          <div key={widget.id} className="group">
            <motion.div
              {...getWidgetAnimationProps(gs.widgetAnimation, index, hasInitialised.current)}
              layout={isEditing ? 'position' : false}
              style={{ borderRadius: `${gs.radius}px` }}
              className={`h-full border overflow-hidden flex flex-col relative ${
                isCompact
                  ? 'border-border/20 bg-card'
                  : 'bg-card border-border/40'
              } ${
                isEditing
                  ? 'ring-1 ring-transparent hover:ring-primary/30 transition-shadow duration-200 shadow-sm'
                  : 'hover:border-border/60 shadow-sm hover:shadow-md transition-all duration-200'
              }`}
            >
              {/* ── Edit overlay — floating toolbar ── */}
              {isEditing && (
                <div className="absolute top-1.5 left-1.5 right-1.5 z-20 flex items-center justify-between">
                  <div className="widget-drag-handle cursor-grab active:cursor-grabbing flex items-center gap-1 px-1.5 py-1 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm text-muted-foreground hover:text-foreground transition-colors">
                    <GripVertical className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-medium truncate max-w-[100px]">
                      {title}
                    </span>
                  </div>
                  <div className="flex items-center gap-0.5 px-1 py-0.5 rounded-md bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm">
                    {onEditWidget && (
                      <button onClick={() => onEditWidget(widget.id)}
                        className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        title={t('dashboardBuilder.configPanel.title')}>
                        <Settings2 className="h-3 w-3" />
                      </button>
                    )}
                    {onRemoveWidget && (
                      <button onClick={() => onRemoveWidget(widget.id)}
                        className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title={t('dashboardBuilder.delete')}>
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── Title bar (view mode) — non-KPI widgets only ── */}
              {!isEditing && !isCompact && (
                <div className="flex items-center justify-between flex-shrink-0 px-4 pt-3.5 pb-1">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="rounded-lg bg-primary/10 shrink-0 p-2">
                      <WidgetIcon className="text-primary h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-foreground truncate text-sm">
                        {title}
                      </h4>
                      {description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {onEditWidget && (
                      <button
                        onClick={() => onEditWidget(widget.id)}
                        className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all"
                        title={t('dashboardBuilder.configPanel.title')}
                      >
                        <Settings2 className="h-3 w-3" />
                      </button>
                    )}
                    {(() => {
                      const route = viewAllRouteMap[widget.dataSource];
                      if (!route) return null;
                      return (
                        <button
                          onClick={() => navigate(route)}
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap"
                        >
                          {t('overview.viewAll')}
                          <ExternalLink className="h-3 w-3" />
                        </button>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* KPI view mode: settings button overlay */}
              {!isEditing && isCompact && onEditWidget && (
                <button
                  onClick={() => onEditWidget(widget.id)}
                  className="absolute top-2 right-2 p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-all z-10"
                  title={t('dashboardBuilder.configPanel.title')}
                >
                  <Settings2 className="h-3 w-3" />
                </button>
              )}

              {/* Content */}
              <div className={`flex-1 min-h-0 ${
                isEditing ? 'px-2 pb-2 pt-1' 
                : isCompact ? '' 
                : 'px-3 pb-3'
              } overflow-hidden`}>
                <WidgetRenderer widget={widget} />
              </div>
            </motion.div>
          </div>
        );
      })}
    </ResponsiveGridLayout>
  );
}
