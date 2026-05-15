import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Users, Plus, TrendingUp, TrendingDown, Minus, Calendar, Building2 } from "lucide-react";
import { mockArticleSuppliers, mockPriceHistory } from "@/modules/purchases/data/mockData";

interface ArticleSuppliersTabProps {
  articleId: string;
  articleName: string;
}

export function ArticleSuppliersTab({ articleId, articleName }: ArticleSuppliersTabProps) {
  const { t } = useTranslation('articles');
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Find suppliers for this article from mock data
  const articleSuppliers = mockArticleSuppliers.filter(as => as.articleId === articleId);
  const priceHistory = mockPriceHistory.filter(ph => 
    articleSuppliers.some(as => as.id === ph.articleSupplierId)
  ).sort((a, b) => b.changedAt.localeCompare(a.changedAt));

  const fmt = (n: number) => n.toLocaleString('fr-TN', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      {/* Suppliers Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {t('detail.suppliers.title')}
          </CardTitle>
          <Button size="sm" variant="outline" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-3.5 w-3.5 mr-1" /> {t('detail.suppliers.add')}
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">{t('detail.suppliers.supplierName')}</TableHead>
                <TableHead className="text-xs">{t('detail.suppliers.supplierRef')}</TableHead>
                <TableHead className="text-xs text-right">{t('detail.suppliers.purchasePrice')}</TableHead>
                <TableHead className="text-xs text-center">{t('detail.suppliers.leadTime')}</TableHead>
                <TableHead className="text-xs text-center">{t('detail.suppliers.moq')}</TableHead>
                <TableHead className="text-xs text-center">{t('detail.suppliers.preferred')}</TableHead>
                <TableHead className="text-xs">{t('detail.suppliers.lastDelivery')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {articleSuppliers.map(as => (
                <TableRow key={as.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs font-medium">{as.supplierName}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">{as.supplierRef}</TableCell>
                  <TableCell className="text-xs text-right font-medium">{fmt(as.purchasePrice)} TND</TableCell>
                  <TableCell className="text-xs text-center">{as.leadTimeDays} {t('detail.suppliers.days')}</TableCell>
                  <TableCell className="text-xs text-center">{as.minOrderQty}</TableCell>
                  <TableCell className="text-xs text-center">
                    {as.isPreferred ? (
                      <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20">★ {t('detail.suppliers.preferredLabel')}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {as.modifiedDate || '-'}
                  </TableCell>
                </TableRow>
              ))}
              {articleSuppliers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Users className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground">{t('detail.suppliers.empty')}</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Price History */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('detail.suppliers.priceHistory')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {priceHistory.length > 0 ? (
            <div className="space-y-3">
              {priceHistory.map(ph => {
                const diff = ph.newPrice - ph.oldPrice;
                const pctChange = ((diff / ph.oldPrice) * 100).toFixed(1);
                const isUp = diff > 0;

                return (
                  <div key={ph.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${isUp ? 'bg-destructive/10' : diff < 0 ? 'bg-green-100 dark:bg-green-900/20' : 'bg-muted'}`}>
                        {isUp ? <TrendingUp className="h-3.5 w-3.5 text-destructive" /> : diff < 0 ? <TrendingDown className="h-3.5 w-3.5 text-green-600" /> : <Minus className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">{fmt(ph.oldPrice)} → {fmt(ph.newPrice)} TND</span>
                          <Badge variant="outline" className={`text-[10px] ${isUp ? 'text-destructive border-destructive/30' : 'text-green-600 border-green-600/30'}`}>
                            {isUp ? '+' : ''}{pctChange}%
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {ph.changedAt}
                          <span className="ml-1">• {ph.changedBy}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">{t('detail.suppliers.noPriceHistory')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Supplier Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{t('detail.suppliers.addTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label className="text-xs">{t('detail.suppliers.supplierName')}</Label><Input className="h-8 mt-1" placeholder={t('detail.suppliers.selectSupplier')} /></div>
            <div><Label className="text-xs">{t('detail.suppliers.supplierRef')}</Label><Input className="h-8 mt-1" placeholder="e.g. SUP-REF-001" /></div>
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">{t('detail.suppliers.purchasePrice')}</Label><Input type="number" className="h-8 mt-1" placeholder="0.00" /></div>
              <div><Label className="text-xs">{t('detail.suppliers.leadTime')}</Label><Input type="number" className="h-8 mt-1" placeholder="7" /></div>
              <div><Label className="text-xs">{t('detail.suppliers.moq')}</Label><Input type="number" className="h-8 mt-1" placeholder="1" /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddDialogOpen(false)}>{t('common.cancel', 'Cancel')}</Button>
            <Button size="sm" onClick={() => setAddDialogOpen(false)}>{t('detail.suppliers.add')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
