import { cn } from '@/lib/utils';

export type RagStatus = 'green' | 'yellow' | 'red' | 'orange' | 'neutral';

const dotClass: Record<RagStatus, string> = {
  green: 'bg-[hsl(var(--rag-green))]',
  yellow: 'bg-[hsl(var(--rag-yellow))]',
  red: 'bg-[hsl(var(--rag-red))]',
  orange: 'bg-[hsl(var(--rag-orange))]',
  neutral: 'bg-[hsl(var(--rag-neutral))]',
};

export const RagDot = ({ status, className }: { status: RagStatus; className?: string }) => (
  <span
    aria-hidden
    className={cn('inline-block h-2.5 w-2.5 rounded-full flex-shrink-0', dotClass[status], className)}
  />
);

const badgeClass: Record<RagStatus, string> = {
  green: 'bg-[hsl(var(--rag-green)/0.12)] text-[hsl(var(--rag-green))] border-[hsl(var(--rag-green)/0.3)]',
  yellow: 'bg-[hsl(var(--rag-yellow)/0.12)] text-[hsl(var(--rag-yellow))] border-[hsl(var(--rag-yellow)/0.3)]',
  red: 'bg-[hsl(var(--rag-red)/0.12)] text-[hsl(var(--rag-red))] border-[hsl(var(--rag-red)/0.3)]',
  orange: 'bg-[hsl(var(--rag-orange)/0.12)] text-[hsl(var(--rag-orange))] border-[hsl(var(--rag-orange)/0.3)]',
  neutral: 'bg-muted text-muted-foreground border-border',
};

export const RagBadge = ({
  status,
  children,
  className,
}: {
  status: RagStatus;
  children: React.ReactNode;
  className?: string;
}) => (
  <span
    className={cn(
      'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium',
      badgeClass[status],
      className
    )}
  >
    {children}
  </span>
);
