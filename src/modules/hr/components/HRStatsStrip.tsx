import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

/**
 * Reusable KPI strip styled like OffersStats / SalesStats — colored icon
 * tiles, hover-lift cards, optional click-to-filter behaviour.
 *
 * Each item picks one of the chart-1..5 design tokens for its color so the
 * full Tailwind class name is emitted statically and the JIT can pick it up
 * (`bg-chart-1/10`, `text-chart-1`, etc.).
 */
export interface HRStatItem {
  key: string;
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5' | 'primary' */
  color?: string;
  /** When truthy, the card becomes clickable and fires `onSelect(key)`. */
  filterable?: boolean;
}

interface HRStatsStripProps {
  items: HRStatItem[];
  selectedKey?: string | null;
  onSelect?: (key: string) => void;
  /** Override the column count (defaults to items.length capped at 4). */
  columns?: 2 | 3 | 4 | 5;
}

export function HRStatsStrip({ items, selectedKey, onSelect, columns }: HRStatsStripProps) {
  const cols = columns ?? Math.min(items.length, 4);
  const gridClass = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-3',
    4: 'grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-2 lg:grid-cols-5',
  }[cols] ?? 'grid-cols-2 lg:grid-cols-4';

  return (
    <div className={cn('grid gap-3 sm:gap-4', gridClass)}>
      {items.map((stat) => {
        const Icon = stat.icon;
        const color = stat.color ?? 'chart-1';
        const isSelected = selectedKey === stat.key;
        const clickable = !!stat.filterable && !!onSelect;
        return (
          <Card
            key={stat.key}
            onClick={clickable ? () => onSelect?.(stat.key) : undefined}
            className={cn(
              'shadow-card hover-lift gradient-card group transition-all',
              clickable && 'cursor-pointer hover:shadow-lg',
              isSelected ? 'border-2 border-primary bg-primary/5' : 'border-0',
            )}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div
                    className={cn(
                      'p-2 rounded-lg flex-shrink-0 transition-all',
                      isSelected
                        ? 'bg-primary/20'
                        : `bg-${color}/10 group-hover:bg-${color}/20`,
                    )}
                  >
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-all',
                        isSelected ? 'text-primary' : `text-${color}`,
                      )}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground font-medium truncate">
                    {stat.label}
                  </p>
                </div>
                <p className="text-sm font-bold text-foreground flex-shrink-0">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}