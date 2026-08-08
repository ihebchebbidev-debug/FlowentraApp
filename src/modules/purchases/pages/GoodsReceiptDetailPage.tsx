import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Building2, Calendar, FileText, Pencil, Printer, Boxes } from "lucide-react";
import { goodsReceiptService } from "../services/purchaseService";
import { PurchasePageHeader } from "../components/PurchasePageHeader";
import { PurchaseErrorBoundary, PurchaseErrorFallback } from "../components/PurchaseErrorBoundary";
import { DetailSkeleton } from "../components/PurchaseSkeletons";
import type { GoodsReceipt } from "../types";
import { formatPurchaseDate, formatPaymentTerms } from '../utils/format';

function GoodsReceiptDetailContent() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('purchases');
  const [gr, setGr] = useState<GoodsReceipt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    if (!id) return;
    setError(null);
    setLoading(true);
    goodsReceiptService.getById(id)
      .then(setGr)
      .catch((e: any) => setError(e?.message || 'Failed to load'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <DetailSkeleton />;
  if (error) return <PurchaseErrorFallback error={error} onRetry={fetchData} backTo="/dashboard/purchases/receipts" />;
  if (!gr) return <PurchaseErrorFallback error={t('receipts.notFound')} backTo="/dashboard/purchases/receipts" />;

  // Defensive: backend filters out soft-deleted receipts (`!IsDeleted`) from
  // both list and detail queries, but if a deleted record is ever exposed
  // (admin tooling, legacy bookmark) we surface its state clearly so users
  // don't try to act on a record that's no longer part of the working set.
  const isDeleted = gr.isDeleted === true;

  // Stock impact: only accepted (received) quantities are posted to stock —
  // rejected quantities stay with the supplier, matching GoodsReceiptService.
  const acceptedQty = (gr.items || []).reduce((sum, it) => sum + (Number(it.quantityReceived) || 0), 0);
  const rejectedQty = (gr.items || []).reduce((sum, it) => sum + (Number(it.quantityRejected) || 0), 0);
  const postedLines = (gr.items || []).filter(it => (Number(it.quantityReceived) || 0) > 0).length;

  return (
    <div className="flex flex-col">
      <PurchasePageHeader
        title={gr.receiptNumber}
        icon={Package}
        backTo={{ to: '/dashboard/purchases/receipts', label: t('receipts.title') }}
        actions={
          <div className="flex items-center gap-2">
            {isDeleted && (
              <Badge variant="destructive">{t('receipts.deletedBadge', 'Deleted')}</Badge>
            )}
            <Badge className={gr.status === 'complete' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}>
              {t(`receiptStatus.${gr.status}`)}
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/dashboard/purchases/receipts/${gr.id}/report`)}
            >
              <Printer className="h-3.5 w-3.5 mr-1" />
              {t('receipts.deliverySheet', 'Delivery sheet')}
            </Button>
            {!isDeleted && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/dashboard/purchases/receipts/${gr.id}/edit`)}
              >
                <Pencil className="h-3.5 w-3.5 mr-1" />
                {t('actions.edit', 'Edit')}
              </Button>
            )}
          </div>
        }
      />

      <div className={`p-4 md:p-6 space-y-4 ${isDeleted ? 'opacity-75' : ''}`}>
        {isDeleted && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {t('receipts.deletedNotice', 'This goods receipt has been deleted and is kept for audit purposes only. Stock movements have been reversed.')}
            {gr.deletedAt && <span className="ml-1 text-muted-foreground">({new Date(gr.deletedAt).toLocaleString()})</span>}
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.receiptInfo')}</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex items-center gap-2"><FileText className="h-3.5 w-3.5 text-muted-foreground" /><span>{t('fields.orderNumber')}: <span className="font-medium text-primary cursor-pointer" onClick={() => navigate(`/dashboard/purchases/orders/${gr.purchaseOrderId}`)}>{gr.purchaseOrderNumber}</span></span></div>
              <div className="flex items-center gap-2"><Building2 className="h-3.5 w-3.5 text-muted-foreground" /><span>{gr.supplierName}</span></div>
              <div className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span>{formatPurchaseDate(gr.receiptDate)}</span></div>
              {gr.deliveryNoteRef && <div className="flex items-center gap-2"><Package className="h-3.5 w-3.5 text-muted-foreground" /><span>{t('fields.deliveryNote')}: {gr.deliveryNoteRef}</span></div>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Boxes className="h-3.5 w-3.5 text-muted-foreground" />
                {t('receipts.stockImpact', 'Stock impact')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('receipts.accepted', 'Accepted')}</span>
                <span className="font-medium text-green-600">
                  +{acceptedQty.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('receipts.rejected', 'Rejected')}</span>
                <span className={rejectedQty > 0 ? 'font-medium text-destructive' : 'font-medium'}>
                  {rejectedQty.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t('receipts.linesPosted', 'Lines posted to stock')}</span>
                <span className="font-medium">{postedLines}</span>
              </div>
              <p className="text-muted-foreground pt-1 border-t border-border">
                {isDeleted
                  ? t('receipts.deletedNotice')
                  : t('receipts.stockImpactNote', 'Accepted quantities were posted to stock. Rejected quantities were not.')}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">{t('detail.receivedItems')}</CardTitle></CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table className="min-w-[480px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">{t('fields.article')}</TableHead>
                  <TableHead className="text-xs text-center">{t('fields.orderedQty')}</TableHead>
                  <TableHead className="text-xs text-center">{t('fields.receivedQty')}</TableHead>
                  <TableHead className="text-xs text-center">{t('fields.rejectedQty')}</TableHead>
                  <TableHead className="text-xs">{t('fields.notes')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gr.items.map(item => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="text-xs font-medium">{item.articleName}</div>
                      <div className="text-px-10 text-muted-foreground">{item.articleNumber}</div>
                    </TableCell>
                    <TableCell className="text-xs text-center">{Number(item.orderedQty || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-center text-green-600 font-medium">{Number(item.quantityReceived || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-xs text-center">{item.quantityRejected > 0 ? <span className="text-destructive">{Number(item.quantityRejected).toFixed(2)}</span> : '-'}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{item.rejectionReason || item.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function GoodsReceiptDetailPage() {
  return (
    <PurchaseErrorBoundary backTo="/dashboard/purchases/receipts">
      <GoodsReceiptDetailContent />
    </PurchaseErrorBoundary>
  );
}
