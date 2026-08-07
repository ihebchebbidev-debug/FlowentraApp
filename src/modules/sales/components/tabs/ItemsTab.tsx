import { Fragment, useState } from "react";

import { calculateEntityTotal } from "@/lib/calculateTotal";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Package, Wrench, Eye, ExternalLink, Plus, Loader2, Search, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { Sale, SaleItem } from "../../types";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { SalesService } from "../../services/sales.service";
import { salesApi } from "@/services/api/salesApi";
import { offersApi } from "@/services/api/offersApi";
import { articlesApi } from "@/services/api/articlesApi";
import { InstallationSelector } from "@/modules/field/installations/components/InstallationSelector";
import { CreateInstallationModal } from "@/modules/field/installations/components/CreateInstallationModal";
import { DeleteConfirmationModal } from "@/shared/components/DeleteConfirmationModal";
import { toast } from "sonner";

interface ArticleItem {
  id: string | number;
  name: string;
  sku?: string;
  articleNumber?: string;
  serviceCode?: string;
  description?: string;
  type: 'material' | 'service';
  salesPrice?: number;
  sellPrice?: number;
  basePrice?: number;
  purchasePrice?: number;
  stockQuantity?: number;
  stock?: number;
  duration?: number;
  categoryId?: number;
  categoryName?: string;
}

interface ItemsTabProps {
  sale: Sale;
  onItemsUpdated?: () => void;
}

export function ItemsTab({ sale, onItemsUpdated }: ItemsTabProps) {
  const { t } = useTranslation('sales');
  const { format: formatCurrency } = useCurrency();
  const [selectedItem, setSelectedItem] = useState<SaleItem | null>(null);
  
  
  // Add Items Modal state
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<'article' | 'service'>('article');
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedInstallation, setSelectedInstallation] = useState<any | null>(null);
  const [showCreateInstallation, setShowCreateInstallation] = useState(false);
  const [allArticles, setAllArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<SaleItem | null>(null);
  const itemsPerPage = 12;

  const getItemTypeIcon = (type: string) => {
    switch (type) {
      case 'service':
        return <Wrench className="h-4 w-4" />;
      case 'article':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getItemTypeBadge = (type: string) => {
    switch (type) {
      case 'service':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{t('service')}</Badge>;
      case 'article':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/30">{t('article')}</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const totals = calculateEntityTotal(sale);
  const totalAmount = totals.subtotal;
  const discountAmount = totals.discountAmount;
  const taxAmount = totals.taxAmount;
  const fiscalStampAmount = totals.fiscalStamp;
  const computedTotal = totals.total;

  // Fetch articles when modal opens
  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await articlesApi.getAll({ limit: 1000 });
      const articlesData = response.data || response;
      const articlesList = Array.isArray(articlesData) ? articlesData : [];
      
      const mappedArticles: ArticleItem[] = articlesList.map((article: any) => ({
        id: article.id,
        name: article.name,
        sku: article.articleNumber || article.sku || '',
        articleNumber: article.articleNumber,
        serviceCode: article.articleNumber || article.serviceCode || '',
        description: article.description,
        type: article.type === 'service' ? 'service' : 'material',
        salesPrice: article.salesPrice || 0,
        sellPrice: article.salesPrice || article.sellPrice || 0,
        basePrice: article.salesPrice || article.basePrice || 0,
        purchasePrice: article.purchasePrice || 0,
        stockQuantity: article.stockQuantity || 0,
        stock: article.stockQuantity || article.stock || 0,
        duration: article.duration,
        categoryId: article.categoryId,
        categoryName: article.categoryName || article.category,
      }));
      
      setAllArticles(mappedArticles);
    } catch (err) {
      console.error('Failed to fetch articles:', err);
      setError(t('failedToLoadItems'));
      toast.error(t('failedToLoadItems'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAddItems = () => {
    setShowAddItemsModal(true);
    fetchArticles();
  };

  // Filter articles based on type and search
  const filteredItems = allArticles.filter(article => {
    const typeFilter = selectedType === 'article' ? 'material' : 'service';
    const matchesType = article.type === typeFilter;
    const matchesSearch = !searchTerm || 
      article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (article.sku && article.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (article.articleNumber && article.articleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesType && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSelectItem = async (item: ArticleItem) => {
    setIsSaving(true);
    try {
      const unitPrice = item.salesPrice || item.sellPrice || item.basePrice || 0;

      const newItem = {
        type: selectedType as 'article' | 'service',
        itemName: item.name,
        itemCode: item.sku || item.articleNumber || item.serviceCode || '',
        description: item.description || undefined,
        quantity: selectedQuantity,
        unitPrice: unitPrice,
        discount: 0,
        installationId: selectedInstallation?.id?.toString() || undefined,
        installationName: selectedInstallation?.name || undefined,
        requiresServiceOrder: selectedType === 'service',
      };

      // Call API to add item to sale
      const saleId = parseInt(sale.id, 10);
      await salesApi.addItem(saleId, newItem);
      
      // Log activity for adding item to sale
      try {
        await salesApi.addActivity(saleId, {
          type: 'update',
          description: t('activityItemAdded', { 
            itemName: item.name, 
            quantity: selectedQuantity,
            type: selectedType === 'article' ? t('article') : t('service')
          }),
        });
      } catch (activityErr) {
        console.warn('Failed to log sale activity:', activityErr);
      }
      
      // If sale has a related offer, also add activity to the offer
      if (sale.offerId) {
        try {
          const offerId = parseInt(sale.offerId, 10);
          if (!isNaN(offerId)) {
            await offersApi.addActivity(offerId, {
              type: 'update',
              description: t('activityItemAddedFromSale', { 
                itemName: item.name, 
                quantity: selectedQuantity,
                type: selectedType === 'article' ? t('article') : t('service'),
                saleNumber: sale.saleNumber || sale.id
              }),
            });
          }
        } catch (offerActivityErr) {
          console.warn('Failed to log offer activity:', offerActivityErr);
        }
      }
      
      toast.success(t('itemAdded'));
      
      // Reset form
      setSearchTerm("");
      setSelectedQuantity(1);
      setSelectedInstallation(null);
      setShowAddItemsModal(false);
      
      // Trigger refresh of sale data
      if (onItemsUpdated) {
        onItemsUpdated();
      }
    } catch (err) {
      console.error('Failed to add item:', err);
      toast.error(t('failedToAddItem'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = async (item: SaleItem) => {
    if (!item.id) return;
    
    setItemToDelete(null);
    setDeletingItemId(item.id);
    try {
      const saleId = parseInt(sale.id, 10);
      const itemId = parseInt(item.id, 10);
      
      await salesApi.deleteItem(saleId, itemId);
      
      // Log activity for removing item from sale
      try {
        await salesApi.addActivity(saleId, {
          type: 'update',
          description: t('activityItemRemoved', { 
            itemName: item.itemName, 
            quantity: item.quantity,
            type: item.type === 'article' ? t('article') : t('service')
          }),
        });
      } catch (activityErr) {
        console.warn('Failed to log sale activity:', activityErr);
      }
      
      // If sale has a related offer, also add activity to the offer
      if (sale.offerId) {
        try {
          const offerId = parseInt(sale.offerId, 10);
          if (!isNaN(offerId)) {
            await offersApi.addActivity(offerId, {
              type: 'update',
              description: t('activityItemRemovedFromSale', { 
                itemName: item.itemName, 
                quantity: item.quantity,
                type: item.type === 'article' ? t('article') : t('service'),
                saleNumber: sale.saleNumber || sale.id
              }),
            });
          }
        } catch (offerActivityErr) {
          console.warn('Failed to log offer activity:', offerActivityErr);
        }
      }
      
      toast.success(t('itemRemoved'));
      
      // Trigger refresh of sale data
      if (onItemsUpdated) {
        onItemsUpdated();
      }
    } catch (err) {
      console.error('Failed to delete item:', err);
      toast.error(t('failedToRemoveItem'));
    } finally {
      setDeletingItemId(null);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {t('itemsTab.saleItems')} ({sale.items.length})
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleOpenAddItems}>
                <Plus className="h-4 w-4 mr-2" />
                {t('addItems')}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sale.items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t('itemsTab.noItemsInSale')}</p>
              <Button 
                size="sm"
                className="mt-4"
                onClick={handleOpenAddItems}
              >
                <Plus className="h-4 w-4 mr-2" />
                {t('addItems')}
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>{t('itemsTab.item')}</TableHead>
                    
                    <TableHead className="text-center">{t('quantity')}</TableHead>
                    <TableHead className="text-right">{t('itemsTab.unitPrice')}</TableHead>
                    <TableHead className="text-right">{t('total')}</TableHead>
                    <TableHead className="text-center">{t('installation')}</TableHead>
                    <TableHead className="text-center">{t('itemsTab.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.items.map((item, index) => {
                    const parentIdNum = Number(item.id);
                    
                    return (
                    <Fragment key={item.id || index}>
                    <TableRow className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-center">
                        {getItemTypeIcon(item.type)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="text-sm text-foreground">{item.itemName}</span>
                          {item.itemCode && (
                            <p className="text-sm text-muted-foreground line-clamp-2">{item.itemCode}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center text-sm text-foreground">
                        {Number(item.quantity).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-sm text-foreground">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right text-sm font-medium text-foreground">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.installationId ? (
                          <Link 
                            to={`/dashboard/field/installations/${item.installationId}`}
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                          >
                            {item.installationName || t('itemsTab.viewInstallation')}
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0"
                            onClick={() => setSelectedItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setItemToDelete(item)}
                            disabled={deletingItemId === item.id}
                          >
                            {deletingItemId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    </Fragment>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {sale.items.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {sale.items.filter(item => item.type === 'service').length} {t('services')}, {' '}
                  {sale.items.filter(item => item.type === 'article').length} {t('article')}s
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">{t('totalItemsValue')}</p>
                  { discountAmount > 0 && (
                    <p className="text-sm text-success">
                      -{formatCurrency(discountAmount)} {t('discount')}
                      {sale.discountType === 'percentage' && ` (${sale.discount}%)`}
                    </p>
                  )}
                  { (sale.taxes ?? 0) > 0 && (
                    <p className="text-sm text-muted-foreground">{t('tva')} {sale.taxType === 'percentage' ? `(${sale.taxes}%)` : ''}: {formatCurrency(taxAmount)}</p>
                  )}
                  <p className="text-sm font-medium text-foreground">{formatCurrency(computedTotal)}</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Item Detail Modal */}
      <Dialog open={!!selectedItem} onOpenChange={(open) => !open && setSelectedItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedItem && getItemTypeIcon(selectedItem.type)}
              {t('itemsTab.itemDetails')}
            </DialogTitle>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4">
              {/* Item Name & Type */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{selectedItem.itemName}</span>
                {getItemTypeBadge(selectedItem.type)}
              </div>

              {/* Item Code */}
              {selectedItem.itemCode && (
                <div>
                  <span className="text-sm text-muted-foreground">{t('itemsTab.itemCode')}</span>
                  <p className="text-sm text-foreground font-mono mt-1">{selectedItem.itemCode}</p>
                </div>
              )}

              {/* Pricing Details */}
              <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                <div>
                  <span className="text-sm text-muted-foreground">{t('quantity')}</span>
                  <p className="text-sm text-foreground mt-1">{Number(selectedItem.quantity).toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">{t('itemsTab.unitPrice')}</span>
                  <p className="text-sm text-foreground mt-1">{formatCurrency(selectedItem.unitPrice)}</p>
                </div>
              </div>

              {/* Discount */}
              {selectedItem.discount && selectedItem.discount > 0 && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">{t('discount')}</span>
                    <p className="text-sm text-success mt-1">
                      {selectedItem.discountType === 'percentage' 
                        ? `${selectedItem.discount}%` 
                        : formatCurrency(selectedItem.discount)}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">{t('itemsTab.discountType')}</span>
                    <p className="text-sm text-foreground mt-1 capitalize">{selectedItem.discountType || 'fixed'}</p>
                  </div>
                </div>
              )}

              {/* Total */}
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{t('itemsTab.totalPrice')}</span>
                  <span className="text-sm font-medium text-foreground">{formatCurrency(selectedItem.totalPrice)}</span>
                </div>
              </div>

              {/* Installation (for all item types) */}
              <div className="pt-2 border-t">
                <span className="text-sm text-muted-foreground">{t('installation')}</span>
                {selectedItem.installationId ? (
                  <Link 
                    to={`/dashboard/field/installations/${selectedItem.installationId}`}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {selectedItem.installationName || t('itemsTab.viewInstallation')}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('itemsTab.noInstallationLinked')}</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Items Modal */}
      <Dialog open={showAddItemsModal} onOpenChange={setShowAddItemsModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              {t('selectItemsToAdd')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Type, Search and Quantity */}
            <div className="flex flex-wrap gap-4">
              <div className="w-36">
                <Label>{t('itemType')}</Label>
                <Select value={selectedType} onValueChange={(value: 'article' | 'service') => {
                  setSelectedType(value);
                  setSearchTerm("");
                  setCurrentPage(1);
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="article">{t('materials')}</SelectItem>
                    <SelectItem value="service">{t('services')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex-1 min-w-[200px]">
                <Label>{t('search')}</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={`${t('search')}...`}
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="w-24">
                <Label>{t('quantity')}</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={selectedQuantity}
                  onChange={(e) => setSelectedQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            {/* Installation Selection */}
            <div className="border-t pt-4">
              <InstallationSelector
                onSelect={setSelectedInstallation}
                selectedInstallation={selectedInstallation}
                onCreateNew={() => setShowCreateInstallation(true)}
              />
            </div>

            {/* Results count */}
            {!isLoading && !error && filteredItems.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {t('showingItems', { 
                  start: ((currentPage - 1) * itemsPerPage) + 1, 
                  end: Math.min(currentPage * itemsPerPage, filteredItems.length), 
                  total: filteredItems.length 
                })}
              </div>
            )}

            {/* Items Grid */}
            {isLoading ? (
              <ContentSkeleton rows={6} />
            ) : error ? (
              <div className="text-center py-8 text-destructive">
                <p>{error}</p>
                <Button type="button" variant="outline" onClick={fetchArticles} className="mt-2">
                  {t('retry')}
                </Button>
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? (
                  <p>{t('noItemsMatchingSearch')}</p>
                ) : (
                  <p>{t('noItemsAvailable')}</p>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {paginatedItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className="border cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => !isSaving && handleSelectItem(item)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            {item.type === 'material' ? (
                              <Package className="h-4 w-4 text-primary" />
                            ) : (
                              <Wrench className="h-4 w-4 text-primary" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-foreground break-words line-clamp-2 block">{item.name}</span>
                            <span className="text-sm text-muted-foreground truncate block">
                              {item.sku || item.articleNumber || '-'}
                            </span>
                            <span className="text-sm font-medium text-foreground mt-1 block">
                              {formatCurrency(item.salesPrice || item.sellPrice || item.basePrice || 0)}
                            </span>
                            {item.type === 'material' && (
                              <span className="text-sm text-muted-foreground block">
                                {t('stock')}: {item.stockQuantity || item.stock || 0}
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {t('pageOf', { current: currentPage, total: totalPages })}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowAddItemsModal(false);
                setSelectedInstallation(null);
              }}
            >
              {t('cancel')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Installation Modal */}
      <CreateInstallationModal
        open={showCreateInstallation}
        onOpenChange={setShowCreateInstallation}
        onInstallationCreated={(installation) => {
          setSelectedInstallation(installation);
          setShowCreateInstallation(false);
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!itemToDelete}
        onClose={() => setItemToDelete(null)}
        onConfirm={() => itemToDelete && handleDeleteItem(itemToDelete)}
        title={t('deleteItemConfirmTitle')}
        description={t('deleteItemConfirmDescription', { itemName: itemToDelete?.itemName })}
        itemName={itemToDelete?.itemName}
        itemType={t('item')}
      />
    </>
  );
}
