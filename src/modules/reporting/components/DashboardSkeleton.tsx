import { Skeleton } from '@/components/ui/skeleton';

interface DashboardSkeletonProps {
  /** Number of KPI cards to render */
  kpis?: number;
  /** Chart-card row descriptors: each entry defines the number of columns in that row */
  rows?: number[];
}

/**
 * Lazy-loading skeleton for reporting dashboards. Mirrors the KPI grid + chart
 * card layout so the paint doesn't jump when real data arrives.
 */
export const DashboardSkeleton = ({
  kpis = 4,
  rows = [3, 2, 1],
}: DashboardSkeletonProps) => {
  const gridColsClass = (n: number) =>
    n === 1
      ? 'grid-cols-1'
      : n === 2
        ? 'grid-cols-1 lg:grid-cols-2'
        : n === 3
          ? 'grid-cols-1 lg:grid-cols-3'
          : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4';

  return (
    <div className="animate-in fade-in duration-300">
      <div className={`grid gap-3 ${gridColsClass(kpis)}`}>
        {Array.from({ length: kpis }).map((_, i) => (
          <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-8 rounded-md" />
              <Skeleton className="h-4 w-10 rounded" />
            </div>
            <Skeleton className="mt-3 h-7 w-24" />
            <Skeleton className="mt-2 h-3 w-32" />
            <Skeleton className="mt-3 h-3 w-20" />
          </div>
        ))}
      </div>

      {rows.map((cols, ri) => (
        <div key={ri} className={`mt-3 grid gap-3 ${gridColsClass(cols)}`}>
          {Array.from({ length: cols }).map((_, ci) => (
            <div key={ci} className="rounded-lg border bg-card shadow-sm">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
              <div className="space-y-3 p-4">
                <Skeleton className="h-[180px] w-full rounded-md" />
                <div className="flex justify-between gap-2">
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-14" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};
