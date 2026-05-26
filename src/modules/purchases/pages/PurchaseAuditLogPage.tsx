import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Clock } from "lucide-react";
import { purchaseOrderService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { ListTableSkeleton } from "../components/PurchaseSkeletons";
import { toast } from "sonner";
import type { PurchaseActivity } from "../types";

const ACTION_COLORS: Record<string, string> = {
  created: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  status_changed: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sent: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  deleted: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

function PurchaseAuditLogContent() {
  const { t } = useTranslation('purchases');
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activities, setActivities] = useState<PurchaseActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // The current backend only exposes activities per-order; we'll load a combined view
  // by fetching recent orders and their activities. In a production app you'd want a
  // dedicated audit-log endpoint.
  const fetchActivities = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);
      // Fetch recent orders to get their activities
      const result = await purchaseOrderService.getAll({ limit: 50 });
      const orders = result.orders || [];
      const allActivities: PurchaseActivity[] = [];
      // Fetch activities for each order (limit to first 10 to avoid too many requests)
      const promises = orders.slice(0, 10).map(async (order) => {
        try {
          const acts = await purchaseOrderService.getActivities(order.id, 1, 20);
          return acts || [];
        } catch { return []; }
      });
      const results = await Promise.all(promises);
      results.forEach(acts => allActivities.push(...acts));
      // Sort by date desc
      allActivities.sort((a, b) => b.performedAt.localeCompare(a.performedAt));
      setActivities(allActivities);
    } catch (e: any) {
      setError(e?.message || t('common.loadError', 'Failed to load'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchActivities(); }, [fetchActivities]);

  const filtered = activities.filter(a => {
    if (!search) return true;
    const q = search.toLowerCase();
    return a.description.toLowerCase().includes(q) || a.performedByName.toLowerCase().includes(q);
  });

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('auditLog.title')}
        subtitle={t('auditLog.subtitle')}
        icon={Clock}
        backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }}
      />

      <div className="p-4 md:p-6 space-y-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t('auditLog.searchPlaceholder')} value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8" />
        </div>

        {loading && <ListTableSkeleton columns={5} rows={8} />}

        {!loading && error && (
          <PurchaseErrorFallback error={error} onRetry={fetchActivities} backTo="/dashboard/purchases" />
        )}

        {!loading && !error && (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">{t('auditLog.dateTime')}</TableHead>
                    <TableHead className="text-xs">{t('auditLog.user')}</TableHead>
                    <TableHead className="text-xs">{t('auditLog.entityType')}</TableHead>
                    <TableHead className="text-xs">{t('auditLog.action')}</TableHead>
                    <TableHead className="text-xs">{t('auditLog.description')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{new Date(a.performedAt).toLocaleString()}</TableCell>
                      <TableCell className="text-xs">{a.performedByName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px]">{t(`auditLog.entity.${a.entityType}`, a.entityType)}</Badge></TableCell>
                      <TableCell><Badge variant="secondary" className={`text-[10px] ${ACTION_COLORS[a.action] || ''}`}>{t(`auditLog.actionLabel.${a.action}`, a.action?.replace(/_/g, ' ') || '—')}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[300px] truncate">{a.description}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">{t('auditLog.empty')}</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function PurchaseAuditLogPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <PurchaseAuditLogContent />
    </PurchaseErrorBoundary>
  );
}
