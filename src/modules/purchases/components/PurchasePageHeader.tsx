import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';

export function PurchasePageHeader(props: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  backTo?: { to: string; label: string };
  actions?: React.ReactNode;
}) {
  const Icon = props.icon;

  return (
    <div className="border-b border-border bg-card/50 backdrop-blur">
      {/* Mobile */}
      <div className="md:hidden flex items-center justify-between gap-2 p-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {Icon && (
            <div className="p-1.5 rounded-lg bg-primary/10 flex-shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-base font-semibold text-foreground truncate">{props.title}</h1>
            {props.subtitle && <p className="text-px-10 text-muted-foreground truncate">{props.subtitle}</p>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {props.backTo && (
            <Button asChild size="sm" variant="outline">
              <Link to={props.backTo.to}>{props.backTo.label}</Link>
            </Button>
          )}
          {props.actions}
        </div>
      </div>

      {/* Desktop */}
      <div className={cn("hidden md:flex items-center justify-between p-4")}>
        <div className="flex items-center gap-3 min-w-0">
          {Icon && (
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Icon className="h-6 w-6 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-foreground truncate">{props.title}</h1>
            {props.subtitle && <p className="text-px-11 text-muted-foreground truncate">{props.subtitle}</p>}
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
