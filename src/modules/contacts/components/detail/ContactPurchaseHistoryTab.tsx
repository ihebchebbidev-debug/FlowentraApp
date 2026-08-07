import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { ShoppingCart, FileText, Package, ExternalLink, Calendar, Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  purchaseOrderService,
  goodsReceiptService,
  supplierInvoiceService,
} from "@/modules/purchases/services/purchaseService";
import { useCurrency } from "@/shared/hooks/useCurrency";

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  validated: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  ordered: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  partially_received: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  received: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  partial: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  complete: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  partially_paid: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

interface ContactPurchaseHistoryTabProps {
  /** Backwards-compat — kept so older call sites don't break */
  contactName?: string;
  /** Real contact id used to query purchases by supplierId */
  contactId?: number;
  /** Limit per sub-list */
  limit?: number;
}

const RECORD_LIMIT_DEFAULT = 10;

export function ContactPurchaseHistoryTab({
  contactId,
  limit = RECORD_LIMIT_DEFAULT,
}: ContactPurchaseHistoryTabProps) {
  const { t } = useTranslation('contacts');
  const navigate = useNavigate();
  const [subTab, setSubTab] = useState('orders');
  const { format: formatMoney } = useCurrency();

  const supplierId = contactId != null ? String(contactId) : undefined;
  const enabled = !!supplierId;

  const ordersQuery = useQuery({
    queryKey: ['contact-purchases', 'orders', supplierId, limit],
    queryFn: () => purchaseOrderService.getAll({ supplierId, page: 1, limit }),
    enabled,
    staleTime: 30_000,
  });

  const receiptsQuery = useQuery({
    queryKey: ['contact-purchases', 'receipts', supplierId, limit],
    queryFn: () => goodsReceiptService.getAll({ supplierId, page: 1, limit }),
    enabled,
    staleTime: 30_000,
  });

  const invoicesQuery = useQuery({
    queryKey: ['contact-purchases', 'invoices', supplierId, limit],
    queryFn: () => supplierInvoiceService.getAll({ supplierId, page: 1, limit }),
    enabled,
    staleTime: 30_000,
  });

  const orders = ordersQuery.data?.orders ?? [];
  const receipts = receiptsQuery.data?.receipts ?? [];
  const invoices = invoicesQuery.data?.invoices ?? [];

  const ordersTotal = ordersQuery.data?.pagination?.total ?? orders.length;
  const receiptsTotal = receiptsQuery.data?.pagination?.total ?? receipts.length;
  const invoicesTotal = invoicesQuery.data?.pagination?.total ?? invoices.length;

  const formatDate = (d?: string) => {
    if (!d) return '-';
    const dt = new Date(d);
    return isNaN(dt.getTime()) ? d : dt.toLocaleDateString();
  };

  const EmptyState = ({ icon: Icon, label }: { icon: any; label: string }) => (
    <div className="text-center py-12">
      <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-medium">{t('detail.related.no_records')}</h3>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
    </div>
  );

  const LoadingState = () => (
    <div className="flex items-center justify-center py-12 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin mr-2" />
      <span className="text-sm">{t('common.loading', 'Loading…')}</span>
    </div>
  );

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          {t('detail.tabs.purchases')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={subTab} onValueChange={setSubTab}>
          <TabsList className="h-8 mb-4">
            <TabsTrigger value="orders" className="text-xs">
              {t('detail.purchases.orders')} ({ordersTotal})
            </TabsTrigger>
            <TabsTrigger value="receipts" className="text-xs">
              {t('detail.purchases.receipts')} ({receiptsTotal})
            </TabsTrigger>
            <TabsTrigger value="invoices" className="text-xs">
              {t('detail.purchases.invoices')} ({invoicesTotal})
            </TabsTrigger>
          </TabsList>

          {/* Orders */}
          <TabsContent value="orders">
            {ordersQuery.isLoading ? (
              <LoadingState />
            ) : orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((po) => (
                  <div
                    key={po.id}
                    onClick={() => navigate(`/dashboard/purchases/orders/${po.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium">{po.orderNumber}</span>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[po.status] || ''}`}>
                          {po.status?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(po.orderDate)}
                        {po.title && <span className="ml-2">• {po.title}</span>}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <span className="font-semibold">{formatMoney(po.grandTotal)}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                {ordersTotal > orders.length && (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/purchases/orders?supplierId=${supplierId}`)}
                    className="w-full text-xs text-primary hover:underline pt-2"
                  >
                    {t('detail.purchases.view_all', 'View all')} ({ordersTotal})
                  </button>
                )}
              </div>
            ) : (
              <EmptyState icon={ShoppingCart} label={t('detail.purchases.noOrders')} />
            )}
          </TabsContent>

          {/* Receipts */}
          <TabsContent value="receipts">
            {receiptsQuery.isLoading ? (
              <LoadingState />
            ) : receipts.length > 0 ? (
              <div className="space-y-2">
                {receipts.map((gr) => (
                  <div
                    key={gr.id}
                    onClick={() => navigate(`/dashboard/purchases/receipts/${gr.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium">{gr.receiptNumber}</span>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[gr.status] || ''}`}>
                          {gr.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(gr.receiptDate)}
                        {gr.purchaseOrderNumber && (
                          <span className="ml-2">• PO: {gr.purchaseOrderNumber}</span>
                        )}
                      </div>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                {receiptsTotal > receipts.length && (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/purchases/receipts?supplierId=${supplierId}`)}
                    className="w-full text-xs text-primary hover:underline pt-2"
                  >
                    {t('detail.purchases.view_all', 'View all')} ({receiptsTotal})
                  </button>
                )}
              </div>
            ) : (
              <EmptyState icon={Package} label={t('detail.purchases.noReceipts')} />
            )}
          </TabsContent>

          {/* Invoices */}
          <TabsContent value="invoices">
            {invoicesQuery.isLoading ? (
              <LoadingState />
            ) : invoices.length > 0 ? (
              <div className="space-y-2">
                {invoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => navigate(`/dashboard/purchases/invoices/${inv.id}`)}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted cursor-pointer transition-colors group border"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-medium">{inv.invoiceNumber}</span>
                        <Badge variant="outline" className={`text-xs ${STATUS_COLORS[inv.status] || ''}`}>
                          {inv.status?.replace(/_/g, ' ')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        {formatDate(inv.invoiceDate)}
                        {inv.dueDate && <span className="ml-2">• Due: {formatDate(inv.dueDate)}</span>}
                      </div>
                    </div>
                    <div className="text-right mr-4">
                      <span className="font-semibold">{formatMoney(inv.grandTotal)}</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
                {invoicesTotal > invoices.length && (
                  <button
                    type="button"
                    onClick={() => navigate(`/dashboard/purchases/invoices?supplierId=${supplierId}`)}
                    className="w-full text-xs text-primary hover:underline pt-2"
                  >
                    {t('detail.purchases.view_all', 'View all')} ({invoicesTotal})
                  </button>
                )}
              </div>
            ) : (
              <EmptyState icon={FileText} label={t('detail.purchases.noInvoices')} />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
