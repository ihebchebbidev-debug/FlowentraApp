import { useState, useEffect, useMemo } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { Package, Wrench, Trash2, Plus, Minus, Search, ChevronLeft, ChevronRight, Edit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { OfferItem } from "../types";
import { EditOfferItemModal } from "./EditOfferItemModal";
import { articlesApi } from "@/services/api/articlesApi";
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


interface OfferItemsSelectorAdvancedProps {
  items: OfferItem[];
  onUpdateItems: (items: OfferItem[]) => void;
  currency?: string;
  readonly?: boolean;
  installations?: any[];
}

export function OfferItemsSelectorAdvanced({ items, onUpdateItems, currency = 'TND', readonly = false, installations = [] }: OfferItemsSelectorAdvancedProps) {
  const { t } = useTranslation('offers');
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState<'article' | 'service'>('article');
  const [selectedInstallationId, setSelectedInstallationId] = useState<string>("");
  const [showItemSelector, setShowItemSelector] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferItem | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  
  // Multi-selection state
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string | number>>(new Set());
  
  // Real data from backend
  const [allArticles, setAllArticles] = useState<ArticleItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Fetch articles from backend when modal opens
  useEffect(() => {
    if (showItemSelector) {
      fetchArticles();
    }
  }, [showItemSelector]);

  const fetchArticles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await articlesApi.getAll({ limit: 1000 });
      const articlesData = response.data || response;
      const articlesList = Array.isArray(articlesData) ? articlesData : [];
      
      // Map backend response to our format
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
      setError(t('failedToLoadArticles'));
      toast.error(t('failedToLoadArticles'));
    } finally {
      setIsLoading(false);
    }
  };


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  // Filter articles based on type, search, and category
  // Filter articles based on type and search
  const filteredItems = useMemo(() => {
    const typeFilter = selectedType === 'article' ? 'material' : 'service';
    return allArticles.filter(article => {
      const matchesType = article.type === typeFilter;
      const matchesSearch = !searchTerm || 
        article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (article.sku && article.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (article.articleNumber && article.articleNumber.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesType && matchesSearch;
    });
  }, [allArticles, selectedType, searchTerm]);

  // Paginated items
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(start, start + itemsPerPage);
  }, [filteredItems, currentPage]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedType]);

  const getSelectedInstallation = () => {
    if (!selectedInstallationId || selectedInstallationId === 'none') return null;
    return installations.find(i => String(i.id) === selectedInstallationId) || null;
  };

  // Auto-select first installation when only one available
  useEffect(() => {
    if (installations.length === 1 && !selectedInstallationId) {
      setSelectedInstallationId(String(installations[0].id));
    }
  }, [installations]);

  const handleSelectItem = (item: ArticleItem) => {
    const unitPrice = item.salesPrice || item.sellPrice || item.basePrice || 0;
    const totalPrice = unitPrice * selectedQuantity;
    const inst = getSelectedInstallation();

    const newOfferItem: OfferItem = {
      id: `item-${Date.now()}`,
      offerId: '',
      type: selectedType,
      itemId: String(item.id),
      itemName: item.name,
      itemCode: item.sku || item.articleNumber || item.serviceCode || '',
      quantity: selectedQuantity,
      unitPrice: unitPrice,
      totalPrice: totalPrice,
      description: item.description || undefined,
      installationId: inst?.id ? String(inst.id) : undefined,
      installationName: inst?.name || undefined,
      duration: item.type === 'service' ? item.duration : undefined
    };

    onUpdateItems([...items, newOfferItem]);
    setShowItemSelector(false);
    setSearchTerm("");
    setSelectedQuantity(1);
    setSelectedItemIds(new Set());
  };

  // Toggle single item selection
  const toggleItemSelection = (itemId: string | number) => {
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  // Select/Deselect all items on current page
  const toggleSelectAll = () => {
    if (selectedItemIds.size === paginatedItems.length && selectedItemIds.size > 0) {
      // Deselect all
      const newSelected = new Set(selectedItemIds);
      paginatedItems.forEach(item => newSelected.delete(item.id));
      setSelectedItemIds(newSelected);
    } else {
      // Select all
      const newSelected = new Set(selectedItemIds);
      paginatedItems.forEach(item => newSelected.add(item.id));
      setSelectedItemIds(newSelected);
    }
  };

  // Add all selected items at once
  const handleAddSelectedItems = () => {
    if (selectedItemIds.size === 0) {
      toast.error(t('pleaseSelectAtLeastOneItem'));
      return;
    }

    const inst = getSelectedInstallation();
    const newOfferItems: OfferItem[] = [];
    const selectedArticles = allArticles.filter(article => selectedItemIds.has(article.id));

    selectedArticles.forEach((article, index) => {
      const unitPrice = article.salesPrice || article.sellPrice || article.basePrice || 0;
      const totalPrice = unitPrice * selectedQuantity;

      newOfferItems.push({
        id: `item-${Date.now()}-${index}`,
        offerId: '',
        type: selectedType,
        itemId: String(article.id),
        itemName: article.name,
        itemCode: article.sku || article.articleNumber || article.serviceCode || '',
        quantity: selectedQuantity,
        unitPrice: unitPrice,
        totalPrice: totalPrice,
        description: article.description || undefined,
        installationId: inst?.id ? String(inst.id) : undefined,
        installationName: inst?.name || undefined,
        duration: article.type === 'service' ? article.duration : undefined
      });
    });

    onUpdateItems([...items, ...newOfferItems]);
    setShowItemSelector(false);
    setSearchTerm("");
    setSelectedQuantity(1);
    setSelectedItemIds(new Set());
    toast.success(t('itemsAddedCount', { count: newOfferItems.length }));
  };

  const handleEditItem = (updatedItem: OfferItem) => {
    const updatedItems = items.map(item => 
      item.id === updatedItem.id ? updatedItem : item
    );
    onUpdateItems(updatedItems);
    setEditingItem(null);
  };

  const handleDeleteItem = (itemId: string) => {
    const updatedItems = items.filter(item => item.id !== itemId);
    onUpdateItems(updatedItems);
  };

  const handleQuantityChange = (itemId: string, delta: number) => {
    const updatedItems = items.map(item => {
      if (item.id === itemId) {
        const newQuantity = Math.max(0.01, Number((item.quantity + delta).toFixed(2)));
        return {
          ...item,
          quantity: newQuantity,
          totalPrice: item.unitPrice * newQuantity
        };
      }
      return item;
    });
    onUpdateItems(updatedItems);
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{t('selectItemsToSell')}</Label>
        {!readonly && (
          <Button type="button" variant="outline" onClick={() => setShowItemSelector(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('addItems')}
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>{t('noItemsAddedYet')}</p>
          {!readonly && (
            <p className="text-sm">{t('clickAddItemsToStart')}</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <Card key={item.id} className="border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {item.type === 'article' ? (
                        <Package className="h-4 w-4" />
                      ) : (
                        <Wrench className="h-4 w-4" />
                      )}
                      <span className="font-medium">{item.itemName}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {item.itemCode && (
                          <p className="mb-1">{item.itemCode}</p>
                        )}
                       <div className="flex items-center gap-4">
                         <div className="flex items-center gap-2">
                           <span>{t('qty')}:</span>
                           {!readonly ? (
                             <div className="flex items-center gap-1">
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 className="h-6 w-6"
                                 onClick={() => handleQuantityChange(item.id, -1)}
                                 disabled={item.quantity <= 1}
                               >
                                 <Minus className="h-3 w-3" />
                               </Button>
                               <span className="w-12 text-center font-medium">{Number(item.quantity).toFixed(2)}</span>
                               <Button
                                 type="button"
                                 variant="outline"
                                 size="icon"
                                 className="h-6 w-6"
                                 onClick={() => handleQuantityChange(item.id, 1)}
                               >
                                 <Plus className="h-3 w-3" />
                               </Button>
                             </div>
                           ) : (
                             <span>{Number(item.quantity).toFixed(2)}</span>
                           )}
                         </div>
                         <span>{t('unit')}: {formatCurrency(item.unitPrice)}</span>
                         {item.discount && item.discount > 0 && (
                           <span>{t('discount')}: {item.discountType === 'percentage' ? `${item.discount}%` : formatCurrency(item.discount)}</span>
                         )}
                       </div>
                       {item.installationName && (
                         <div className="text-xs text-muted-foreground mt-1">
                           {t('installation')}: {item.installationName}
                         </div>
                       )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {!readonly && (
                      <>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                          title={t('editItemDetails')}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {items.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">{t('subtotal')}:</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(calculateSubtotal())}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Item Selector Dialog */}
      <Dialog open={showItemSelector} onOpenChange={setShowItemSelector}>
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
                    onChange={(e) => setSearchTerm(e.target.value)}
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

            {/* Installation picker */}
            {installations.length > 0 && (
              <div className="border-t pt-4">
                <Label>{t('linkToInstallation')}</Label>
                <Select value={selectedInstallationId} onValueChange={setSelectedInstallationId}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('noInstallation')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">{t('noInstallation')}</SelectItem>
                    {installations.map((inst) => (
                      <SelectItem key={inst.id} value={String(inst.id)}>{inst.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Results count */}
            {!isLoading && !error && filteredItems.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {t('showingItems', { start: ((currentPage - 1) * itemsPerPage) + 1, end: Math.min(currentPage * itemsPerPage, filteredItems.length), total: filteredItems.length })}
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
                  <p>{t('noItemsMatchingFilters', { type: selectedType === 'article' ? t('materials') : t('services') })}</p>
                ) : (
                  <p>{t('noItemsAvailable', { type: selectedType === 'article' ? t('materials') : t('services') })}</p>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between py-2 border-b">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedItemIds.size === paginatedItems.length && paginatedItems.length > 0}
                      onCheckedChange={toggleSelectAll}
                      id="select-all"
                    />
                    <label htmlFor="select-all" className="text-sm cursor-pointer">
                      {selectedItemIds.size > 0 
                        ? t('itemsSelected', { count: selectedItemIds.size })
                        : t('selectAllOnPage')}
                    </label>
                  </div>
                  {selectedItemIds.size > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedItemIds(new Set())}
                    >
                      {t('clearSelection')}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto">
                  {paginatedItems.map((item) => (
                    <Card 
                      key={item.id} 
                      className={`border cursor-pointer transition-colors ${
                        selectedItemIds.has(item.id)
                          ? 'bg-primary/5 border-primary'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedItemIds.has(item.id)}
                            onCheckedChange={() => toggleItemSelection(item.id)}
                            className="mt-1"
                          />
                          <div 
                            className="flex-1 min-w-0 cursor-pointer"
                            onClick={() => toggleItemSelection(item.id)}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <div className="p-1 rounded bg-primary/10">
                                {item.type === 'material' ? (
                                  <Package className="h-3 w-3 text-primary" />
                                ) : (
                                  <Wrench className="h-3 w-3 text-primary" />
                                )}
                              </div>
                            </div>
                            <h4 className="font-medium text-sm break-words line-clamp-2">{item.name}</h4>
                            <p className="text-xs text-muted-foreground">
                              {item.sku || item.articleNumber || '-'}
                            </p>
                            <p className="text-sm font-medium text-primary mt-1">
                              {formatCurrency(item.salesPrice || item.sellPrice || item.basePrice || 0)}
                            </p>
                            {item.categoryName && (
                              <Badge variant="secondary" className="text-xs mt-1">
                                {item.categoryName}
                              </Badge>
                            )}
                            {item.type === 'material' && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('stock')}: {item.stockQuantity || item.stock || 0}
                              </p>
                            )}
                            {item.type === 'service' && item.duration && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {t('duration')}: {item.duration} {t('durationMin')}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      {t('pagination.page', { current: currentPage, total: totalPages })}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        {t('pagination.previous')}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        {t('pagination.next')}
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="flex justify-between gap-2 pt-4 border-t">
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={toggleSelectAll}
                  disabled={paginatedItems.length === 0}
                >
                  {selectedItemIds.size === paginatedItems.length && paginatedItems.length > 0
                    ? t('deselectAll')
                    : t('selectAll')}
                </Button>
              </div>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => {
                    setShowItemSelector(false);
                    setSelectedItemIds(new Set());
                  }}
                >
                  {t('cancel')}
                </Button>
                <Button 
                  type="button"
                  onClick={handleAddSelectedItems}
                  disabled={selectedItemIds.size === 0}
                >
                  {selectedItemIds.size > 0
                    ? `${t('add')} (${selectedItemIds.size})`
                    : t('add')}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Item Modal */}
      {editingItem && (
        <EditOfferItemModal
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
          item={editingItem}
          onUpdateItem={handleEditItem}
          currency={currency}
        />
      )}

    </div>
  );
}