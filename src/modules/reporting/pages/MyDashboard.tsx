import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Star, TrendingUp, Wrench, Landmark, Users, ShoppingCart, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportShell } from '../components/ReportShell';
import { useFavoritesStore, FavoriteWidget } from '../store/useFavoritesStore';
import { cn } from '@/lib/utils';

const sourceIcon: Record<FavoriteWidget['source'], typeof Star> = {
  Sales: TrendingUp,
  Service: Wrench,
  Finance: Landmark,
  HR: Users,
  Purchase: ShoppingCart,
};
const sourceTone: Record<FavoriteWidget['source'], string> = {
  Sales: 'text-primary bg-primary/10',
  Service: 'text-accent bg-accent/10',
  Finance: 'text-info bg-info/10',
  HR: 'text-[hsl(var(--chart-6))] bg-[hsl(var(--chart-6)/0.12)]',
  Purchase: 'text-warning bg-warning/10',
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
  const { widgets, remove } = useFavoritesStore();

  return (
    <ReportShell
      icon={Star}
      tone="gold"
      title={t('my.title', 'My Dashboard')}
      subtitle={t('my.subtitle', 'Your favorited widgets from all reports')}
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {widgets.map((w) => {
            const Icon = sourceIcon[w.source];
            return (
              <div key={w.id} className="rounded-lg border bg-card p-4 shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', sourceTone[w.source])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <button
                    onClick={() => remove(w.id)}
                    aria-label="Remove"
                    className="rounded p-1 text-muted-foreground transition hover:bg-muted hover:text-destructive"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="mt-3 text-sm font-semibold text-foreground">{w.title}</div>
                <div className="text-[11px] text-muted-foreground">{w.source}</div>
                <Button variant="outline" size="sm" className="mt-3 w-full" onClick={() => nav(sourceRoute[w.source])}>
                  {t('my.open', 'Open')}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </ReportShell>
  );
};
