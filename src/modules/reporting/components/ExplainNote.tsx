import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TEMPORARY calculation note.
 * Shows end-users exactly how a card / dashboard number is computed.
 * Remove this component (and the `explain` props) when the documentation
 * period is over — it is intentionally loud so it is easy to spot.
 */
export const ExplainNote = ({
  children,
  variant = 'card',
  className,
}: {
  children: React.ReactNode;
  variant?: 'card' | 'page';
  className?: string;
}) => (
  <div
    className={cn(
      'flex items-start gap-2 rounded-md border border-warning/40 bg-warning/10 text-warning-foreground',
      variant === 'page' ? 'px-3 py-2 text-xs' : 'px-2.5 py-1.5 text-px-11 leading-snug',
      className
    )}
  >
    <Info className="mt-[1px] h-3.5 w-3.5 shrink-0 text-warning" />
    <span className="min-w-0 text-muted-foreground">
      <span className="mr-1 font-semibold uppercase tracking-wide text-warning">
        {variant === 'page' ? 'How this dashboard is calculated' : 'How it is calculated'}
      </span>
      {children}
    </span>
  </div>
);
