import { cn } from '@/lib/utils';

export type ProgressTone = 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'destructive' | 'purple';

const toneMap: Record<ProgressTone, string> = {
  primary: 'bg-primary',
  accent: 'bg-accent',
  info: 'bg-info',
  success: 'bg-success',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
  purple: 'bg-[hsl(var(--chart-6))]',
};

export const ProgressRow = ({
  label,
  value,
  max = 100,
  tone = 'primary',
  suffix = '%',
}: {
  label: string;
  value: number;
  max?: number;
  tone?: ProgressTone;
  suffix?: string;
}) => {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className="min-w-[100px] flex-shrink-0 text-xs font-medium text-foreground">{label}</span>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', toneMap[tone])} style={{ width: `${pct}%` }} />
      </div>
      <span className="min-w-[42px] text-right text-xs font-semibold text-foreground">
        {value}
        {suffix}
      </span>
    </div>
  );
};
