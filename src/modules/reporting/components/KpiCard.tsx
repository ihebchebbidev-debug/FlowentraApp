import { ArrowUp, ArrowDown, Minus, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RagDot, RagStatus } from './RagDot';

export type KpiTone = 'primary' | 'accent' | 'info' | 'success' | 'warning' | 'destructive' | 'purple';

interface KpiCardProps {
  icon: LucideIcon;
  tone?: KpiTone;
  tag?: string;
  value: React.ReactNode;
  label: string;
  trend?: string;
  trendDirection?: 'up' | 'down' | 'neutral';
  rag?: RagStatus;
  suffix?: React.ReactNode;
}

const toneMap: Record<KpiTone, { bg: string; fg: string; corner: string }> = {
  primary: { bg: 'bg-primary/10', fg: 'text-primary', corner: 'bg-primary' },
  accent: { bg: 'bg-accent/10', fg: 'text-accent', corner: 'bg-accent' },
  info: { bg: 'bg-info/10', fg: 'text-info', corner: 'bg-info' },
  success: { bg: 'bg-success/10', fg: 'text-success', corner: 'bg-success' },
  warning: { bg: 'bg-warning/10', fg: 'text-warning', corner: 'bg-warning' },
  destructive: { bg: 'bg-destructive/10', fg: 'text-destructive', corner: 'bg-destructive' },
  purple: { bg: 'bg-[hsl(var(--chart-6)/0.12)]', fg: 'text-[hsl(var(--chart-6))]', corner: 'bg-[hsl(var(--chart-6))]' },
};

export const KpiCard = ({
  icon: Icon,
  tone = 'primary',
  tag,
  value,
  label,
  trend,
  trendDirection = 'neutral',
  rag,
  suffix,
}: KpiCardProps) => {
  const t = toneMap[tone];
  const TrendIcon = trendDirection === 'up' ? ArrowUp : trendDirection === 'down' ? ArrowDown : Minus;
  const trendCls =
    trendDirection === 'up' ? 'text-success' : trendDirection === 'down' ? 'text-destructive' : 'text-muted-foreground';

  return (
    <div className="relative overflow-hidden rounded-lg border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <span
        aria-hidden
        className={cn('absolute right-0 top-0 h-14 w-14 rounded-bl-[3.5rem] opacity-[0.08]', t.corner)}
      />
      <div className="flex items-center justify-between">
        <div className={cn('flex h-8 w-8 items-center justify-center rounded-md', t.bg)}>
          <Icon className={cn('h-4 w-4', t.fg)} />
        </div>
        <div className="flex items-center gap-2">
          {rag && <RagDot status={rag} />}
          {tag && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground">
              {tag}
            </span>
          )}
        </div>
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <div className="text-2xl font-bold leading-none text-foreground">{value}</div>
        {suffix && <div className="text-xs text-muted-foreground">{suffix}</div>}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {trend && (
        <div className={cn('mt-2 flex items-center gap-1 text-[11px] font-medium', trendCls)}>
          <TrendIcon className="h-3 w-3" />
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
};
