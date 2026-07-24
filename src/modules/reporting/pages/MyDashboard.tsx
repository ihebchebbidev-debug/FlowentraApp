import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp, Wrench, Landmark, Users, ShoppingCart, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportShell } from '../components/ReportShell';
import { useFavoritesStore, FavoriteWidget } from '../store/useFavoritesStore';
import { FavoriteWidgetCard, getWidgetSize } from '../widgets/FavoriteWidgets';
import { cn } from '@/lib/utils';

const sourceIcon: Record<FavoriteWidget['source'], typeof Star> = {
  Sales: TrendingUp,
  Service: Wrench,
  Finance: Landmark,
  HR: Users,
  Purchase: ShoppingCart,
};
const sourceRoute: Record<FavoriteWidget['source'], string> = {
  Sales: '/reporting/sales',
  Service: '/reporting/service',
  Finance: '/reporting/finance',
  HR: '/reporting/hr',
  Purchase: '/reporting/purchase',
};

export const MyDashboard = () => {
  const { t } = useTranslation('reporting');
  const nav = useNavigate();
  const { widgets, resetAll } = useFavoritesStore();

  return (
    <ReportShell
      icon={Star}
      tone="gold"
      title={t('my.title', 'My Dashboard')}
      subtitle={t('my.subtitle', 'Your favorited widgets from all reports')}
      actions={
        widgets.length > 0 ? (
          <Button variant="outline" size="sm" className="h-8" onClick={resetAll}>
            {t('my.clearAll', 'Clear all')}
          </Button>
        ) : undefined
      }
    >
      {widgets.length === 0 ? (
        <div className="rounded-lg border bg-card p-10 shadow-sm">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3 text-center">
            <Star className="h-10 w-10 text-muted-foreground/40" />
            <h3 className="text-sm font-semibold">{t('my.emptyTitle', 'No widgets pinned yet')}</h3>
            <p className="text-xs text-muted-foreground">{t('my.emptyDesc', 'Click the ☆ star on any widget in the dashboards below to pin it here.')}</p>
            <div className="mt-2 flex flex-wrap justify-center gap-2">
              {(Object.keys(sourceRoute) as FavoriteWidget['source'][]).map((s) => {
                const Icon = sourceIcon[s];
                return (
                  <Button key={s} variant="outline" size="sm" onClick={() => nav(sourceRoute[s])}>
                    <Icon className="mr-1.5 h-3.5 w-3.5" />
                    {s}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {widgets.map((w) => {
            const size = getWidgetSize(w.id);
            return (
              <div
                key={w.id}
                className={cn(
                  'group relative min-w-0',
                  size === 'wide'
                    ? 'sm:col-span-2 xl:col-span-4'
                    : size === 'chart'
                      ? 'sm:col-span-2 xl:col-span-2'
                      : 'col-span-1'
                )}
              >
                <button
                  type="button"
                  onClick={() => nav(sourceRoute[w.source])}
                  aria-label={t('my.openSource', 'Open source dashboard')}
                  title={`${w.source} · ${t('my.open', 'Open')}`}
                  className="absolute -top-2 left-2 z-10 hidden items-center gap-1 rounded-full border bg-card px-2 py-0.5 text-px-10 font-medium text-muted-foreground shadow-sm transition hover:text-foreground group-hover:flex"
                >
                  <ExternalLink className="h-3 w-3" />
                  {w.source}
                </button>
                <FavoriteWidgetCard fav={w} />
              </div>
            );
          })}
        </div>
      )}
    </ReportShell>
  );
};
