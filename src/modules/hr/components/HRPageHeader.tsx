import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

/**
 * Unified HR page header — visual parity with OffersHeader / SalesHeader.
 * Big gradient-tinted icon tile, large title, descriptive subtitle, and a slot
 * for module CTAs (export, create, etc.). Stays compact on mobile.
 *
 * `accentColor` lets each HR sub-page pick its own brand color from the
 * chart-1..5 token range (e.g. payroll = chart-3, attendance = chart-2).
 */
export function HRPageHeader(props: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  /** One of: 'primary' | 'chart-1' | 'chart-2' | 'chart-3' | 'chart-4' | 'chart-5'. Default 'chart-1'. */
  accentColor?: string;
  backTo?: { to: string; label: string };
  actions?: React.ReactNode;
}) {
  const Icon = props.icon;
  const accent = props.accentColor ?? 'chart-1';

  return (
    <div className="border-b border-border bg-card/40 backdrop-blur-sm">
      {/* Mobile */}
      <div className="md:hidden p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            {Icon && (
              <div className={cn('p-2 rounded-xl shadow-soft flex-shrink-0', `bg-${accent}/10`)}>
                <Icon className={cn('h-5 w-5', `text-${accent}`)} />
              </div>
            )}
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{props.title}</h1>
              {props.subtitle && (
                <p className="text-px-11 text-muted-foreground truncate">{props.subtitle}</p>
              )}
            </div>
          </div>
          {props.backTo && (
            <Button asChild size="sm" variant="outline" className="flex-shrink-0">
              <Link to={props.backTo.to}>{props.backTo.label}</Link>
            </Button>
          )}
        </div>
        {props.actions && (
          <div className="flex flex-wrap items-center gap-2">{props.actions}</div>
        )}
      </div>

      {/* Desktop */}
      <div className="hidden md:flex items-center justify-between gap-4 p-5 lg:p-6">
        <div className="flex items-center gap-4 min-w-0">
          {Icon && (
            <div className={cn('p-3 rounded-xl shadow-soft flex-shrink-0', `bg-${accent}/10`)}>
              <Icon className={cn('h-8 w-8 lg:h-9 lg:w-9', `text-${accent}`)} />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground truncate">
              {props.title}
            </h1>
            {props.subtitle && (
              <p className="text-sm lg:text-base text-muted-foreground mt-1 truncate">
                {props.subtitle}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {props.backTo && (
            <Button asChild variant="outline" size="sm">
              <Link to={props.backTo.to}>{props.backTo.label}</Link>
            </Button>
          )}
          {props.actions}
        </div>
      </div>
    </div>
  );
}

