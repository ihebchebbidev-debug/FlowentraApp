import React from 'react';
import type { DashboardWidget, WidgetType } from '../../types';
import { WidgetKPI } from './WidgetKPI';
import { WidgetBar } from './WidgetBar';
import { WidgetPie } from './WidgetPie';
import { WidgetDonut } from './WidgetDonut';
import { WidgetLine } from './WidgetLine';
import { WidgetArea } from './WidgetArea';
import { WidgetTable } from './WidgetTable';
import { WidgetGauge } from './WidgetGauge';
import { WidgetSparkline } from './WidgetSparkline';
import { WidgetFunnel } from './WidgetFunnel';
import { WidgetRadar } from './WidgetRadar';
import { WidgetStackedBar } from './WidgetStackedBar';
import { WidgetHeatmap } from './WidgetHeatmap';
import { WidgetMap } from './WidgetMap';
import { useTranslation } from 'react-i18next';

const WIDGET_MAP: Record<WidgetType, React.ComponentType<{ widget: DashboardWidget }>> = {
  kpi: WidgetKPI,
  bar: WidgetBar,
  pie: WidgetPie,
  donut: WidgetDonut,
  line: WidgetLine,
  area: WidgetArea,
  table: WidgetTable,
  gauge: WidgetGauge,
  sparkline: WidgetSparkline,
  funnel: WidgetFunnel,
  radar: WidgetRadar,
  stackedBar: WidgetStackedBar,
  heatmap: WidgetHeatmap,
  map: WidgetMap,
};

interface Props {
  widget: DashboardWidget;
}

export function WidgetRenderer({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const Component = WIDGET_MAP[widget.type];
  if (!Component) return <div className="p-2 text-destructive text-xs">{t('dashboardBuilder.unknownWidget')}</div>;
  return <Component widget={widget} />;
}
