import { Loader2, ArrowDown } from "lucide-react";

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  refreshing: boolean;
  threshold?: number;
}

export function PullToRefreshIndicator({ pullDistance, refreshing, threshold = 80 }: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !refreshing) return null;
  const ready = pullDistance >= threshold;

  return (
    <div
      className="flex items-center justify-center overflow-hidden transition-all duration-200"
      style={{ height: refreshing ? 40 : pullDistance > 0 ? Math.min(pullDistance, 60) : 0 }}
    >
      {refreshing ? (
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
      ) : (
        <ArrowDown
          className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${ready ? 'rotate-180 text-primary' : ''}`}
        />
      )}
    </div>
  );
}
