import { cn } from '@/lib/utils';

const pulse = 'animate-pulse bg-muted rounded';

/** KPI: icon circle + text lines */
function KpiSkeleton() {
  return (
    <div className="h-full flex items-center gap-3.5 px-4 py-3">
      <div className={cn(pulse, 'w-11 h-11 rounded-xl shrink-0')} />
      <div className="flex-1 space-y-2">
        <div className={cn(pulse, 'h-3 w-20')} />
        <div className={cn(pulse, 'h-6 w-16')} />
        <div className={cn(pulse, 'h-2.5 w-28')} />
      </div>
    </div>
  );
}

/** Bar / StackedBar: vertical bars */
function BarSkeleton() {
  return (
    <div className="h-full flex items-end gap-2 px-6 pb-6 pt-4">
      {[60, 85, 45, 70, 55, 90, 40].map((h, i) => (
        <div key={i} className={cn(pulse, 'flex-1 rounded-t-md')} style={{ height: `${h}%` }} />
      ))}
    </div>
  );
}

/** Line / Area: wavy line approximation */
function LineSkeleton() {
  return (
    <div className="h-full flex flex-col px-6 py-4 gap-3">
      <div className="flex-1 flex items-end">
        <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,50 Q25,30 50,35 T100,20 T150,30 T200,15"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="4"
            strokeLinecap="round"
            className="animate-pulse"
          />
          <path
            d="M0,50 Q25,30 50,35 T100,20 T150,30 T200,15 L200,60 L0,60 Z"
            fill="hsl(var(--muted))"
            opacity="0.3"
            className="animate-pulse"
          />
        </svg>
      </div>
      <div className="flex justify-between">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={cn(pulse, 'h-2.5 w-8')} />
        ))}
      </div>
    </div>
  );
}

/** Pie / Donut: circle */
function PieSkeleton() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-3">
      <div className={cn(pulse, 'w-24 h-24 rounded-full')} />
      <div className="flex gap-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-1.5">
            <div className={cn(pulse, 'w-2.5 h-2.5 rounded-full')} />
            <div className={cn(pulse, 'h-2.5 w-10')} />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Table: header + rows */
function TableSkeleton() {
  return (
    <div className="h-full p-3 space-y-2">
      <div className="flex gap-3 pb-2 border-b border-border/40">
        <div className={cn(pulse, 'h-3 w-24')} />
        <div className={cn(pulse, 'h-3 w-16')} />
        <div className={cn(pulse, 'h-3 w-14 ml-auto')} />
      </div>
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-3 items-center py-1.5">
          <div className={cn(pulse, 'h-3.5 flex-1 max-w-[140px]')} />
          <div className={cn(pulse, 'h-5 w-16 rounded-full')} />
          <div className={cn(pulse, 'h-3.5 w-12 ml-auto')} />
        </div>
      ))}
    </div>
  );
}

/** Gauge: circle arc */
function GaugeSkeleton() {
  return (
    <div className="h-full flex flex-col items-center justify-center gap-2">
      <div className="relative">
        <div className={cn(pulse, 'w-[100px] h-[100px] rounded-full')} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-[72px] h-[72px] rounded-full bg-background" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={cn(pulse, 'h-5 w-10')} />
        </div>
      </div>
      <div className={cn(pulse, 'h-3 w-20')} />
    </div>
  );
}

/** Sparkline: value + tiny chart */
function SparklineSkeleton() {
  return (
    <div className="h-full flex flex-col justify-between py-2 px-2">
      <div className="space-y-1.5">
        <div className={cn(pulse, 'h-3 w-20')} />
        <div className={cn(pulse, 'h-5 w-12')} />
      </div>
      <div className="flex-1 min-h-0 mt-2">
        <svg viewBox="0 0 120 30" className="w-full h-full" preserveAspectRatio="none">
          <path
            d="M0,20 Q15,10 30,15 T60,8 T90,18 T120,5"
            fill="none"
            stroke="hsl(var(--muted))"
            strokeWidth="3"
            strokeLinecap="round"
            className="animate-pulse"
          />
        </svg>
      </div>
    </div>
  );
}

/** Funnel: decreasing horizontal bars */
function FunnelSkeleton() {
  return (
    <div className="h-full flex flex-col justify-center gap-2.5 px-4 py-3">
      {[95, 72, 50, 30].map((w, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={cn(pulse, 'h-2.5 w-16')} />
          <div className={cn(pulse, 'h-7 rounded-md')} style={{ width: `${w}%` }} />
        </div>
      ))}
    </div>
  );
}

/** Radar: pentagon-ish shape */
function RadarSkeleton() {
  return (
    <div className="h-full flex items-center justify-center">
      <div className="relative">
        <div className={cn(pulse, 'w-28 h-28 rounded-full')} />
        <div className="absolute inset-3 rounded-full bg-background/60" />
        <div className="absolute inset-6 rounded-full bg-background/40" />
      </div>
    </div>
  );
}

/** Heatmap: grid of cells */
function HeatmapSkeleton() {
  return (
    <div className="h-full p-3 space-y-1.5">
      <div className="flex gap-1 pl-14">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className={cn(pulse, 'flex-1 h-3')} />
        ))}
      </div>
      {[1, 2].map(r => (
        <div key={r} className="flex gap-1 items-stretch">
          <div className={cn(pulse, 'w-14 h-8')} />
          {[1, 2, 3, 4, 5].map(c => (
            <div key={c} className={cn(pulse, 'flex-1 h-8 rounded-md')} />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Map: rectangle placeholder */
function MapSkeleton() {
  return (
    <div className="h-full w-full relative">
      <div className={cn(pulse, 'absolute inset-0 rounded-[inherit]')} />
      <div className="absolute top-2 left-2 z-10 flex items-center gap-1.5 bg-background/60 rounded-md px-2 py-1">
        <div className={cn(pulse, 'w-2 h-2 rounded-full')} />
        <div className={cn(pulse, 'h-2.5 w-16')} />
      </div>
    </div>
  );
}

/** Full-page skeleton for DashboardManager loading */
export function DashboardPageSkeleton() {
  return (
    <div className="h-[calc(100vh-80px)] flex flex-col">
      {/* Top bar skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className={cn(pulse, 'h-6 w-36')} />
          <div className={cn(pulse, 'h-6 w-12')} />
          <div className={cn(pulse, 'h-6 w-12')} />
        </div>
        <div className="flex items-center gap-2">
          <div className={cn(pulse, 'h-6 w-20')} />
        </div>
      </div>
      {/* Grid skeleton */}
      <div className="flex-1 p-3 sm:p-4 grid grid-cols-4 gap-3 auto-rows-[120px]">
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-2 row-span-2 rounded-xl')} />
        <div className={cn(pulse, 'col-span-2 row-span-2 rounded-xl')} />
      </div>
    </div>
  );
}

/** Full-page skeleton for PublicDashboardPage loading */
export function PublicDashboardSkeleton() {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col animate-pulse">
      {/* Header */}
      <div className="border-b border-border bg-card px-4 sm:px-6 py-3 flex items-center gap-3">
        <div className={cn(pulse, 'w-5 h-5 rounded')} />
        <div className="flex-1 space-y-1.5">
          <div className={cn(pulse, 'h-4 w-40')} />
          <div className={cn(pulse, 'h-3 w-56')} />
        </div>
      </div>
      {/* Grid */}
      <div className="flex-1 p-3 sm:p-4 grid grid-cols-4 gap-3 auto-rows-[120px]">
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-1 rounded-xl')} />
        <div className={cn(pulse, 'col-span-2 row-span-2 rounded-xl')} />
        <div className={cn(pulse, 'col-span-2 row-span-2 rounded-xl')} />
      </div>
      {/* Footer */}
      <div className="border-t border-border bg-card px-4 py-2 flex justify-center">
        <div className={cn(pulse, 'h-3 w-40')} />
      </div>
    </div>
  );
}

type SkeletonType = 'kpi' | 'bar' | 'line' | 'area' | 'pie' | 'donut' | 'table' | 'gauge' | 'sparkline' | 'funnel' | 'radar' | 'stackedBar' | 'heatmap' | 'map';

const SKELETON_MAP: Record<SkeletonType, () => JSX.Element> = {
  kpi: KpiSkeleton,
  bar: BarSkeleton,
  stackedBar: BarSkeleton,
  line: LineSkeleton,
  area: LineSkeleton,
  pie: PieSkeleton,
  donut: PieSkeleton,
  table: TableSkeleton,
  gauge: GaugeSkeleton,
  sparkline: SparklineSkeleton,
  funnel: FunnelSkeleton,
  radar: RadarSkeleton,
  heatmap: HeatmapSkeleton,
  map: MapSkeleton,
};

interface Props {
  type: SkeletonType;
}

export function WidgetSkeleton({ type }: Props) {
  const Comp = SKELETON_MAP[type] || KpiSkeleton;
  return <Comp />;
}
