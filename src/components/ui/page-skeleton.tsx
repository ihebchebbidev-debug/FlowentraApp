import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

/** Full-page skeleton shown while lazy-loaded modules mount */
export function PageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6 animate-in fade-in duration-300", className)}>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-7 w-48" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-24 rounded-md" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4 rounded" />
            </div>
            <Skeleton className="h-7 w-16" />
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-border bg-card">
        {/* Table header */}
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-28 ml-auto" />
        </div>
        {/* Table rows */}
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0">
            <Skeleton className="h-4 w-4 rounded" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Card skeleton for dashboard KPI cards */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card p-4 space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-4 rounded" />
      </div>
      <Skeleton className="h-7 w-20" />
      <Skeleton className="h-3 w-32" />
    </div>
  );
}

/** List skeleton for notification panels, sidebar lists etc. */
export function ListSkeleton({ rows = 5, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 p-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Dashboard layout skeleton matching sidebar + header + content */
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen flex w-full bg-background">
      {/* Sidebar skeleton */}
      <div className="w-[260px] border-r border-border bg-card hidden md:flex flex-col">
        {/* Logo area */}
        <div className="p-4 border-b border-border">
          <Skeleton className="h-8 w-32" />
        </div>
        {/* Nav items */}
        <div className="flex-1 p-3 space-y-1">
          {[1, 2, 3].map(group => (
            <div key={group} className="mb-4">
              <Skeleton className="h-3 w-16 mb-3" />
              {[1, 2, 3].map(item => (
                <div key={item} className="flex items-center gap-2.5 px-2 py-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-3.5 w-24" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex flex-col">
        {/* Header skeleton */}
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
          <Skeleton className="h-8 w-8 rounded" />
          <Skeleton className="h-8 w-96 rounded-md" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </div>
        </div>

        {/* Content skeleton */}
        <PageSkeleton />
      </div>
    </div>
  );
}

/** Detail page skeleton — back button, title, tabs, info cards */
export function DetailPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("p-6 space-y-6 animate-in fade-in duration-300", className)}>
      {/* Back button + title */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-8 w-8 rounded" />
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-32" />
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Skeleton className="h-8 w-20 rounded-md" />
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>
      </div>
      {/* Tabs */}
      <div className="flex gap-4 border-b border-border pb-2">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-4 w-20" />
        ))}
      </div>
      {/* Two-column info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2].map(i => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <Skeleton className="h-4 w-32" />
            {[1, 2, 3, 4].map(j => (
              <div key={j} className="flex justify-between">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-3.5 w-36" />
              </div>
            ))}
          </div>
        ))}
      </div>
      {/* Table section */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center gap-4 p-4 border-b border-border">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24 ml-auto" />
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact content skeleton — for inline loading areas (cards, sections, panels) */
export function ContentSkeleton({ rows = 4, className }: { rows?: number; className?: string }) {
  return (
    <div className={cn("space-y-3 p-4 animate-in fade-in duration-200", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}

/** Full-screen centered skeleton — replaces full-page spinner */
export function FullPageSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("min-h-screen bg-background", className)}>
      <PageSkeleton />
    </div>
  );
}

/** Table-only skeleton for inline table loading */
export function TableSkeleton({ rows = 5, cols = 4, className }: { rows?: number; cols?: number; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-border bg-card animate-in fade-in duration-200", className)}>
      <div className="flex items-center gap-4 p-4 border-b border-border">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === 0 ? "w-32" : i === cols - 1 ? "w-24 ml-auto" : "w-20")} />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border-b border-border/50 last:border-0">
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className={cn("h-4", j === 0 ? "w-40" : j === cols - 1 ? "w-24 ml-auto" : "w-20")} />
          ))}
        </div>
      ))}
    </div>
  );
}
