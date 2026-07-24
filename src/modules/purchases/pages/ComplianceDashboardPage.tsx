import { useCurrency } from '@/shared/hooks/useCurrency';
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, FileText, AlertTriangle, CheckCircle, Clock, RefreshCcw } from "lucide-react";
import { supplierInvoiceService, purchaseStatsService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { CardGridSkeleton } from "../components/PurchaseSkeletons";
import type { SupplierInvoice, PurchaseStats } from "../types";

function ComplianceDashboardContent() {
  const { t } = useTranslation('purchases');
  const { current: currency } = useCurrency();
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [stats, setStats] = useState<PurchaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    setLoading(true);
    try {
      const [invData, statsData] = await Promise.all([
        supplierInvoiceService.getAll({ limit: 100 }),
        purchaseStatsService.getDashboardStats(),
      ]);
      setInvoices(invData.invoices || []);
      setStats(statsData);
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return <><PurchasePageHeader title={t('compliance.title')} subtitle={t('compliance.subtitle')} icon={Shield} backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }} /><CardGridSkeleton cards={3} /></>;
  if (error) return <><PurchasePageHeader title={t('compliance.title')} subtitle={t('compliance.subtitle')} icon={Shield} backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }} /><PurchaseErrorFallback error={error} onRetry={load} backTo="/dashboard/purchases" /></>;

  const rsInvoices = invoices.filter(i => i.rsApplicable);
  const felInvoices = invoices.filter(i => i.factureEnLigneStatus);
  const tejPending = invoices.filter(i => i.tejSyncStatus === 'pending' || !i.tejSynced);
  const fmt = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2 });

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={t('compliance.title')}
        subtitle={t('compliance.subtitle')}
        icon={Shield}
        backTo={{ to: '/dashboard/purchases', label: t('dashboard.title') }}
      />

      <div className="p-4 md:p-6 space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-amber-500" /> {t('compliance.rs')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="text-2xl font-bold">{fmt(stats?.rsTotal ?? 0)} <span className="text-xs font-normal text-muted-foreground">{currency.code}</span></div>
              <p className="text-xs text-muted-foreground">{t('compliance.totalRsThisYear')}</p>
              <div className="space-y-2">
                {rsInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <div>
                      <p className="text-xs font-medium">{inv.invoiceNumber}</p>
                      <p className="text-[10px] text-muted-foreground">{inv.supplierName}</p>
                    </div>
                    <span className="text-xs font-medium">{fmt(inv.rsAmount)} {currency.code}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-blue-500" /> {t('compliance.factureEnLigne')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-lg font-bold text-amber-600">{felInvoices.filter(i => i.factureEnLigneStatus === 'pending').length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('factureStatus.pending')}</p>
                </div>
                <div className="p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-lg font-bold text-blue-600">{felInvoices.filter(i => i.factureEnLigneStatus === 'sent').length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('factureStatus.sent')}</p>
                </div>
                <div className="p-2 rounded bg-green-50 dark:bg-green-900/20">
                  <p className="text-lg font-bold text-green-600">{felInvoices.filter(i => i.factureEnLigneStatus === 'validated').length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('factureStatus.validated')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {felInvoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-xs">{inv.invoiceNumber}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {inv.factureEnLigneStatus === 'validated' && <CheckCircle className="h-3 w-3 mr-1 text-green-500" />}
                      {inv.factureEnLigneStatus === 'pending' && <Clock className="h-3 w-3 mr-1 text-amber-500" />}
                      {t(`factureStatus.${inv.factureEnLigneStatus || 'pending'}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><RefreshCcw className="h-4 w-4 text-purple-500" /> {t('compliance.tej')}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2 rounded bg-green-50 dark:bg-green-900/20">
                  <p className="text-lg font-bold text-green-600">{invoices.filter(i => i.tejSynced).length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('tejStatus.synced')}</p>
                </div>
                <div className="p-2 rounded bg-amber-50 dark:bg-amber-900/20">
                  <p className="text-lg font-bold text-amber-600">{tejPending.length}</p>
                  <p className="text-[10px] text-muted-foreground">{t('tejStatus.pending')}</p>
                </div>
              </div>
              <div className="space-y-2">
                {invoices.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                    <span className="text-xs">{inv.invoiceNumber}</span>
                    <Badge variant={inv.tejSynced ? 'default' : 'outline'} className="text-[10px]">
                      {inv.tejSynced ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertTriangle className="h-3 w-3 mr-1" />}
                      {t(`tejStatus.${inv.tejSyncStatus || 'pending'}`)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function ComplianceDashboardPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases">
      <ComplianceDashboardContent />
    </PurchaseErrorBoundary>
  );
}
