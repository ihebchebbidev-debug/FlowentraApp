import { Star, Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavoritesStore, FavoriteWidget } from '../store/useFavoritesStore';

interface ChartCardProps {
  title: string;
  favorite?: FavoriteWidget;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  empty?: boolean;
  emptyLabel?: string;
}

export const ChartCard = ({
  title,
  favorite,
  actions,
  children,
  bodyClassName,
  className,
  empty,
  emptyLabel = 'No data',
}: ChartCardProps) => {
  const { has, toggle } = useFavoritesStore();
  const isFav = favorite ? has(favorite.id) : false;

  return (
    <div className={cn('flex flex-col overflow-hidden rounded-lg border bg-card shadow-sm', className)}>
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {actions}
          {favorite && (
            <button
              type="button"
              onClick={() => toggle(favorite)}
              aria-label={isFav ? 'Unpin from My Dashboard' : 'Pin to My Dashboard'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded transition',
                isFav ? 'text-warning' : 'text-muted-foreground hover:bg-muted hover:text-warning'
              )}
            >
              <Star className={cn('h-4 w-4', isFav && 'fill-current')} />
            </button>
          )}
        </div>
      </div>
      <div className={cn('flex-1 p-4', bodyClassName)}>
        {empty ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">{emptyLabel}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
