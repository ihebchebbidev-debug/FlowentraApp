import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// ─── Dashboard Skeleton ─────────────────────────────────────────────────────

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-7 w-14" />
                </div>
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Tables */}
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-7 w-16" />
            </CardHeader>
            <CardContent className="p-0">
              <TableSkeletonRows columns={4} rows={4} />
            </CardContent>
          </Card>
        ))}
      </div>
      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 rounded-md" />)}
      </div>
    </div>
  );
}

// ─── Table Skeleton ─────────────────────────────────────────────────────────

function TableSkeletonRows({ columns, rows }: { columns: number; rows: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          {[...Array(columns)].map((_, i) => (
            <TableHead key={i}><Skeleton className="h-3 w-16" /></TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {[...Array(rows)].map((_, r) => (
          <TableRow key={r}>
            {[...Array(columns)].map((_, c) => (
              <TableCell key={c}>
                <Skeleton className={`h-3 ${c === 0 ? 'w-24' : c === columns - 1 ? 'w-16 ml-auto' : 'w-20'}`} />
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function ListTableSkeleton({ columns = 6, rows = 8 }: { columns?: number; rows?: number }) {
  return (
    <div className="space-y-4 animate-in fade-in duration-300">
      <Card>
        <CardContent className="p-0">
          <TableSkeletonRows columns={columns} rows={rows} />
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Detail Page Skeleton ───────────────────────────────────────────────────

export function DetailSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in duration-300">
      {/* Status flow */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center flex-1">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-3 w-16 ml-1 hidden sm:block" />
                {i < 4 && <Skeleton className="flex-1 h-0.5 mx-1" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Tabs placeholder */}
      <Skeleton className="h-8 w-64" />
      {/* Content */}
      <div className="grid md:grid-cols-2 gap-4">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-28" /></CardHeader>
            <CardContent className="space-y-3">
              {[...Array(5)].map((_, j) => (
                <div key={j} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Compliance / Reports Skeleton ──────────────────────────────────────────

export function CardGridSkeleton({ cards = 3 }: { cards?: number }) {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in duration-300">
      <div className={`grid md:grid-cols-${cards} gap-4`}>
        {[...Array(cards)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-3">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-3 w-full" />
              {[...Array(3)].map((_, j) => (
                <div key={j} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-4 animate-in fade-in duration-300">
      <div className="grid md:grid-cols-2 gap-6">
        {[...Array(2)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2"><Skeleton className="h-4 w-32" /></CardHeader>
            <CardContent>
              <Skeleton className="h-[240px] w-full rounded-md" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
