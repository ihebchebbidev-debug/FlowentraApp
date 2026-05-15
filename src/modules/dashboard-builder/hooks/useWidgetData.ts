import { useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDashboardData } from '@/modules/dashboard/hooks/useDashboardData';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useDashboardFilter } from '../context/DashboardFilterContext';
import { useExternalApiData } from './useExternalApiData';
import type { DataSourceKey, MetricKey, ExternalApiConfig } from '../types';
import { entityStatusConfigs, normalizeStatus, type EntityType } from '@/config/entity-statuses';

// Map widget dataSource keys → entity status config keys for status canonicalization
const DATASOURCE_TO_ENTITY: Partial<Record<string, EntityType>> = {
  sales: 'sale',
  offers: 'offer',
  serviceOrders: 'service_order',
  dispatches: 'dispatch',
  // tasks/contacts have no canonical status config — counted as-is
};

interface WidgetDataResult {
  value: number | string;
  chartData: Array<{ name: string; value: number; color?: string }>;
  tableData: Array<Record<string, any>>;
  trendData: Array<{ value: number }>;
  maxValue: number;
  isLoading: boolean;
  error?: string | null;
}

const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(217 91% 60%)',
  'hsl(142 76% 36%)',
  'hsl(0 84% 60%)',
];

export function useWidgetData(
  dataSource: DataSourceKey,
  metric: MetricKey,
  externalApiConfig?: ExternalApiConfig,
): WidgetDataResult {
  const dd = useDashboardData();
  const { format } = useCurrency();
  const { i18n, t } = useTranslation('workflow');
  const { filterItems } = useDashboardFilter();
  const externalData = useExternalApiData(
    dataSource === 'externalApi' ? externalApiConfig : undefined
  );

  // Cache previous result to avoid flashing on silent refresh
  const prevResult = useRef<WidgetDataResult | null>(null);

  return useMemo(() => {
    // ── External API data source ──
    if (dataSource === 'externalApi') {
      if (externalData.isLoading && !prevResult.current) {
        return { value: 0, chartData: [], tableData: [], trendData: [], maxValue: 100, isLoading: true, error: null };
      }
      if (externalData.error) {
        const fallback: WidgetDataResult = {
          value: 0, chartData: [], tableData: [], trendData: [], maxValue: 100,
          isLoading: false, error: externalData.error,
        };
        prevResult.current = fallback;
        return fallback;
      }
      const result: WidgetDataResult = {
        value: externalData.value,
        chartData: externalData.chartData,
        tableData: externalData.tableData,
        trendData: externalData.chartData.map(d => ({ value: d.value })),
        maxValue: Math.max(100, ...externalData.chartData.map(d => d.value)),
        isLoading: false,
        error: null,
      };
      prevResult.current = result;
      return result;
    }

    // ── Internal data sources ──
    const result: WidgetDataResult = {
      value: 0,
      chartData: [],
      tableData: [],
      trendData: [],
      maxValue: 100,
      isLoading: false,
    };

    if (dd.isLoading && !prevResult.current) {
      return { ...result, isLoading: true };
    }
    if (dd.isLoading && prevResult.current) {
      return prevResult.current;
    }

    const getSourceItems = (): any[] => {
      switch (dataSource) {
        case 'sales': return dd.sales;
        case 'offers': return dd.offers;
        case 'contacts': return dd.contacts;
        case 'tasks': return dd.tasks;
        case 'articles': return dd.articles;
        case 'serviceOrders': return dd.serviceOrders;
        case 'dispatches': return dd.dispatches;
        case 'timeExpenses': return [];
        default: return [];
      }
    };

    const items = filterItems(getSourceItems());

    switch (metric) {
      case 'count':
        result.value = items.length;
        break;

      case 'total':
        result.value = items.length;
        break;

      case 'revenue':
        if (dataSource === 'sales') {
          const salesRevenue = items.reduce((s, i: any) => s + (i.totalAmount || i.amount || 0), 0);
          result.value = format(Math.round(salesRevenue));
        } else if (dataSource === 'offers') {
          const totalVal = items.reduce((s, o: any) => s + (o.totalAmount || o.amount || 0), 0);
          result.value = format(Math.round(totalVal));
        } else {
          result.value = format(0);
        }
        break;

      case 'average':
        if (items.length > 0) {
          const total = items.reduce((s, i: any) => s + (i.totalAmount || i.amount || 0), 0);
          result.value = format(Math.round(total / items.length));
        }
        break;

      case 'conversionRate':
        if (dataSource === 'sales') {
          result.value = dd.salesStats.conversionRate || 0;
          result.maxValue = 100;
        } else if (dataSource === 'offers') {
          result.value = dd.offersStats.conversionRate || 0;
          result.maxValue = 100;
        }
        break;

      case 'completionRate': {
        const completedStatuses = ['done', 'completed', 'closed', 'invoiced'];
        const done = items.filter((t: any) => completedStatuses.includes(t.status)).length;
        result.value = items.length > 0 ? Math.round((done / items.length) * 100) : 0;
        result.maxValue = 100;
        break;
      }

      case 'statusBreakdown': {
        // Canonicalize raw status using entity config aliases so e.g. "draft" and "created"
        // (alias of draft) collapse into a single bucket instead of producing duplicate
        // bars with the same translated label.
        const entityType = DATASOURCE_TO_ENTITY[dataSource];
        const config = entityType ? entityStatusConfigs[entityType] : undefined;
        const statusMap: Record<string, number> = {};
        items.forEach((item: any) => {
          const raw = (item.status || 'unknown').toString().toLowerCase();
          const canonical = config ? normalizeStatus(config, raw) : raw;
          statusMap[canonical] = (statusMap[canonical] || 0) + 1;
        });
        // Map dataSource to translation prefix for status labels
        const statusNsMap: Record<string, string> = {
          sales: 'sale',
          offers: 'offer',
          serviceOrders: 'serviceOrder',
          dispatches: 'dispatch',
          tasks: 'task',
          contacts: 'contact',
        };
        const statusNs = statusNsMap[dataSource] || dataSource;
        result.chartData = Object.entries(statusMap).map(([name, value], i) => {
          const translationKey = `status.${statusNs}.${name}`;
          const translated = t(translationKey, { defaultValue: '' });
          // Fallback: capitalize and replace underscores
          const label = translated && translated !== translationKey
            ? translated
            : name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          return {
            name: label,
            value,
            color: CHART_COLORS[i % CHART_COLORS.length],
          };
        });
        break;
      }

      case 'priorityBreakdown': {
        const prioMap: Record<string, number> = {};
        items.forEach((item: any) => {
          const prio = item.priority || 'none';
          prioMap[prio] = (prioMap[prio] || 0) + 1;
        });
        result.chartData = Object.entries(prioMap).map(([name, value], i) => ({
          name: name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
          value,
          color: CHART_COLORS[i % CHART_COLORS.length],
        }));
        break;
      }

      case 'monthlyTrend': {
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const monthItems = items.filter((item: any) => {
            const created = new Date(item.createdAt || item.date || '');
            return created.getMonth() === d.getMonth() && created.getFullYear() === d.getFullYear();
          });
          const monthName = d.toLocaleDateString(i18n.language, { month: 'short' });
          result.chartData.push({ name: monthName, value: monthItems.length });
          result.trendData.push({ value: monthItems.length });
        }
        break;
      }

      case 'topItems': {
        result.tableData = items.slice(0, 10).map((item: any) => ({
          id: item.id,
          name: item.name || item.title || item.orderNumber || `#${item.id}`,
          status: item.status || '-',
          amount: item.totalAmount || item.amount || 0,
          date: item.createdAt || item.date || '-',
        }));
        break;
      }
    }

    prevResult.current = result;
    return result;
  }, [dd, dataSource, metric, format, i18n.language, filterItems, externalData]);
}
