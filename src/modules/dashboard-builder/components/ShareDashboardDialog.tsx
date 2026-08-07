import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation } from '@tanstack/react-query';
import { dashboardShareApi, type SharedDashboardInfo } from '../services/dashboardShareApi';

import { useDashboardData } from '@/modules/dashboard/hooks/useDashboardData';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Copy, ExternalLink, Loader2, LinkIcon, Unlink, Camera } from 'lucide-react';

interface Props {
  dashboardId: number | null;
  dashboardName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Serialize DashboardData into a plain JSON-safe object (strip functions, circular refs) */
function serializeSnapshot(dd: Record<string, any>): Record<string, any> {
  const keys = [
    'sales', 'salesStats', 'wonSales', 'lostSales', 'closedSales', 'cancelledSales',
    'activeSales', 'totalRevenue', 'monthlyRevenue', 'closedSalesRevenue',
    'offers', 'offersStats', 'acceptedOffers', 'pendingOffers',
    'contacts', 'totalContacts', 'activeContacts',
    'tasks', 'overdueTasks', 'pendingTasks',
    'articles', 'totalArticles', 'lowStockArticles',
    'serviceOrders', 'dispatches',
  ];
  const snapshot: Record<string, any> = {};
  for (const key of keys) {
    snapshot[key] = dd[key];
  }
  return JSON.parse(JSON.stringify(snapshot)); // deep clone, strip non-serializable
}

export function ShareDashboardDialog({ dashboardId, dashboardName, open, onOpenChange }: Props) {
  const { t } = useTranslation('dashboard');
  const dd = useDashboardData();
  const [shareInfo, setShareInfo] = useState<SharedDashboardInfo | null>(null);

  const generateMutation = useMutation({
    mutationFn: () => {
      const snapshot = serializeSnapshot(dd);
      return dashboardShareApi.generateShareLink(dashboardId!, snapshot);
    },
    onSuccess: (info) => {
      setShareInfo(info);
      toast.success(t('dashboardBuilder.share.linkGenerated', 'Share link generated with data snapshot!'));
    },
    onError: () => toast.error(t('dashboardBuilder.share.generateError', 'Failed to generate share link')),
  });

  const revokeMutation = useMutation({
    mutationFn: () => dashboardShareApi.revokeShareLink(dashboardId!),
    onSuccess: () => {
      setShareInfo(null);
      toast.success(t('dashboardBuilder.share.linkRevoked', 'Share link revoked'));
    },
    onError: () => toast.error(t('dashboardBuilder.share.revokeError', 'Failed to revoke link')),
  });

  const publicUrl = shareInfo
    ? `${window.location.origin}/public/dashboards/${shareInfo.shareToken}`
    : '';

  const handleCopy = useCallback(async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      toast.success(t('dashboardBuilder.share.copied', 'Link copied to clipboard!'));
    } catch {
      toast.error('Failed to copy');
    }
  }, [publicUrl, t]);

  const handleGenerate = () => {
    if (dashboardId) generateMutation.mutate();
  };

  const handleRevoke = () => {
    if (dashboardId) revokeMutation.mutate();
  };

  const handleClose = (val: boolean) => {
    if (!val) setShareInfo(null);
    onOpenChange(val);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            {t('dashboardBuilder.share.title', 'Share Dashboard')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboardBuilder.share.description', 'Generate a public link so clients can view this dashboard without logging in.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1">
            <Label className="text-xs font-medium text-muted-foreground">
              {t('dashboardBuilder.share.dashboard', 'Dashboard')}
            </Label>
            <p className="text-sm font-medium text-foreground">{dashboardName}</p>
          </div>

          {!shareInfo ? (
            <div className="space-y-3">
              <div className="flex items-start gap-3 rounded-md border border-primary/20 bg-primary/5 p-3">
                <Camera className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  {t('dashboardBuilder.share.snapshotInfo', 'A snapshot of the current data will be included so anyone with the link can view the dashboard without needing to log in.')}
                </p>
              </div>
              <Button onClick={handleGenerate} disabled={generateMutation.isPending || dd.isLoading} className="w-full gap-2">
                {generateMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LinkIcon className="h-4 w-4" />
                )}
                {t('dashboardBuilder.share.generateLink', 'Generate Public Link')}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('dashboardBuilder.share.publicLink', 'Public Link')}</Label>
                <div className="flex gap-2">
                  <Input value={publicUrl} readOnly className="h-9 text-xs font-mono" />
                  <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" onClick={handleCopy}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="outline" size="icon" className="h-9 w-9 flex-shrink-0" asChild>
                    <a href={publicUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                {t('dashboardBuilder.share.snapshotWarning', 'The shared view shows a snapshot of your data at the time of sharing. To update the data, revoke and re-generate the link.')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          {shareInfo && (
            <Button variant="destructive" size="sm" onClick={handleRevoke} disabled={revokeMutation.isPending} className="gap-1.5">
              {revokeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
              {t('dashboardBuilder.share.revoke', 'Revoke Link')}
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => handleClose(false)}>
            {t('dashboardBuilder.cancel', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
