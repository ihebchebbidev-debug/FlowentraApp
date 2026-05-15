import { useTranslation } from 'react-i18next';
import { useWidgetData } from '../../hooks/useWidgetData';
import type { DashboardWidget, DataSourceKey } from '../../types';
import { WidgetSkeleton } from './WidgetSkeleton';
import {
  TrendingUp, Users, FileText, CheckCircle, Package,
  ClipboardList, Briefcase, Calendar, MapPin, Clock, Activity,
  DollarSign, ShoppingCart, BarChart3, Zap, Target, Star,
  Heart, Shield, Globe, Layers, Send, Eye, Award,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { buildBgStyle, BgEffect } from './WidgetBackground';

const DATASOURCE_ICONS: Record<DataSourceKey, LucideIcon> = {
  sales: TrendingUp, contacts: Users, offers: FileText,
  tasks: CheckCircle, articles: Package, serviceOrders: ClipboardList,
  dispatches: Calendar, timeExpenses: Clock, externalApi: Globe,
};

export const KPI_ICON_MAP: Record<string, LucideIcon> = {
  TrendingUp, Users, FileText, CheckCircle, Package,
  ClipboardList, Briefcase, Calendar, MapPin, Clock, Activity,
  DollarSign, ShoppingCart, BarChart3, Zap, Target, Star,
  Heart, Shield, Globe, Layers, Send, Eye, Award,
};

export const KPI_ICON_NAMES = Object.keys(KPI_ICON_MAP);

const DEFAULT_KPI_COLOR = '#f43f5e';

interface Props { widget: DashboardWidget; }

export function WidgetKPI({ widget }: Props) {
  const { t } = useTranslation('dashboard');
  const { value, isLoading } = useWidgetData(widget.dataSource, widget.metric, widget.config?.externalApi);
  const title = widget.titleCustom || t(widget.titleKey);
  const cfg = widget.config || {};
  const bg = cfg.kpiBg;

  const IconComp = (cfg.icon && KPI_ICON_MAP[cfg.icon]) || DATASOURCE_ICONS[widget.dataSource] || Activity;
  const accentColor = cfg.color || DEFAULT_KPI_COLOR;

  const bgStyle = buildBgStyle(bg, accentColor);
  const useEffect_ = bg?.effect || ((!bg || bg.style === 'subtle') ? 'wave' : 'none');
  const isSolidBg = bg?.style === 'solid' || bg?.style === 'gradient' || bg?.style === 'glass';
  const showLightText = (bg?.textLight ?? false) && isSolidBg;

  if (isLoading) return <WidgetSkeleton type="kpi" />;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[inherit]">
      <div className="absolute inset-0" style={bgStyle} />
      <BgEffect effect={useEffect_} color={bg?.color1 || accentColor} id={widget.id} />

      <div className="relative h-full flex items-center gap-3.5 px-4 py-3">
        <div
          className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl"
          style={{
            backgroundColor: showLightText ? 'rgba(255,255,255,0.2)' : `${accentColor}15`,
            color: showLightText ? 'white' : accentColor,
          }}
        >
          <IconComp className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="text-xs font-semibold truncate leading-tight"
            style={{ color: showLightText ? 'rgba(255,255,255,0.85)' : undefined }}>
            {title}
          </h4>
          <p className="text-2xl font-bold truncate leading-tight mt-1"
            style={{ color: showLightText ? 'white' : undefined }}>
            {cfg.prefix}{value}{cfg.suffix}
          </p>
          <p
            className={showLightText ? 'text-[11px] truncate mt-0.5' : 'text-[11px] text-muted-foreground truncate mt-0.5'}
            style={{ color: showLightText ? 'rgba(255,255,255,0.6)' : undefined }}>
            {widget.descriptionCustom || (widget.descriptionKey ? t(widget.descriptionKey) : `${t(`dashboardBuilder.dataSources.${widget.dataSource}`)} · ${t(`dashboardBuilder.metrics.${widget.metric}`)}`)}
          </p>
        </div>
      </div>
    </div>
  );
}
