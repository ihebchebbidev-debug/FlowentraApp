import { Star, Inbox } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useFavoritesStore, FavoriteWidget } from '../store/useFavoritesStore';
import { ExplainNote } from './ExplainNote';

interface ChartCardProps {
  title: string;
  favorite?: FavoriteWidget;
  actions?: React.ReactNode;
  children: React.ReactNode;
  bodyClassName?: string;
  className?: string;
  empty?: boolean;
  emptyLabel?: string;
  /** TEMPORARY: plain-language note on how this card is calculated. */
  explain?: React.ReactNode;
}

export const ChartCard = ({
  title,
  favorite,
  actions,
  children,
  bodyClassName,
  className,
  empty,
  emptyLabel,
  explain,
}: ChartCardProps) => {
  const { t } = useTranslation('reporting');
  const { has, toggle } = useFavoritesStore();
  const isFav = favorite ? has(favorite.id) : false;
  const emptyText = emptyLabel ?? t('general.noData', 'No data');

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
              aria-pressed={isFav}
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
      {explain && <ExplainNote className="m-3 mb-0">{explain}</ExplainNote>}
      <div className={cn('flex-1 p-4', bodyClassName)}>
        {empty ? (
          <div className="flex h-full min-h-[160px] flex-col items-center justify-center gap-2 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground/50" />
            <span className="text-xs text-muted-foreground">{emptyText}</span>
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
};
