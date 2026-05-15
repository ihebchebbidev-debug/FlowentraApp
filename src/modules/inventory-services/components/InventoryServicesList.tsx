import React, { useState, useMemo, useCallback } from "react";
import { PageSizeSelector } from "@/components/shared/PageSizeSelector";
import { PageSkeleton } from "@/components/ui/page-skeleton";
import { AlertTriangle, Package, Wrench, Loader2, Plus, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useLookups } from "@/shared/contexts/LookupsContext";
import { InventoryHeader } from "./InventoryHeader";
import { InventoryStats, type InventoryStat } from "./InventoryStats";
import { InventorySearchControls } from "./InventorySearchControls";
import { InventoryListView } from "./InventoryListView";
import { InventoryTableView } from "./InventoryTableView";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { ArticleImportModal } from "./ArticleImportModal";

// Helper to translate status
const translateStatus = (status: string, t: (key: string, options?: any) => string): string => {
  const statusMap: Record<string, string> = {
    available: t('available'),
    low_stock: t('low_stock'),
    out_of_stock: t('out_of_stock'),
    discontinued: t('discontinued'),
    active: t('active'),
    inactive: t('inactive'),
  };
  return statusMap[status] || t('detail.unknown');
};

// Compute status from stock levels
const computeStatus = (stock: number, minStock: number): string => {
  if (stock <= 0) return 'out_of_stock';
  if (stock <= minStock) return 'low_stock';
  return 'available';
};

// Convert API Article to display format
const convertToArticleFormat = (
  article: any, 
  t: (key: string, options?: any) => string,
  getCategoryName: (id: number) => string,
  getLocationName: (id: number) => string
) => {
  const stock = article.stockQuantity ?? article.stock ?? 0;
  const minStock = article.minStockLevel ?? article.minStock ?? 0;
  const rawStatus = article.status || computeStatus(stock, minStock);
  // Read type from API response - default to 'material' if not present
  const articleType = article.type === 'service' ? 'service' : 'material';
  
  // For services, price is stored in salesPrice on backend
  const servicePrice = article.salesPrice ?? article.basePrice ?? 0;
  const materialSellPrice = article.salesPrice ?? article.sellPrice ?? 0;

  // Resolve category ID to name
  const categoryId = article.categoryId || article.category;
  const categoryName = categoryId ? getCategoryName(Number(categoryId)) : t('general');

  // Resolve location ID to name
  const locationId = article.locationId || article.location;
  const locationName = locationId ? getLocationName(Number(locationId)) : t('no_location');
  
  return {
    id: article.id,
    type: articleType as 'material' | 'service',
    name: article.name || t('unnamed'),
    sku: article.articleNumber || article.sku || '',
    category: categoryName,
    stock: stock,
    minStock: minStock,
    costPrice: article.purchasePrice ?? article.costPrice ?? 0,
    sellPrice: materialSellPrice,
    supplier: article.supplier || '',
    location: locationName,
    subLocation: undefined,
    basePrice: servicePrice,
    duration: article.duration ?? 0,
    skillsRequired: undefined,
    materialsNeeded: [],
    preferredUsers: [],
    lastUsed: article.modifiedDate ? new Date(article.modifiedDate) : undefined,
    lastUsedBy: undefined,
    tags: [],
    notes: article.description,
    status: rawStatus,
    statusDisplay: translateStatus(rawStatus, t),
    description: article.description,
    createdAt: article.createdDate ? new Date(article.createdDate) : new Date(),
    updatedAt: article.modifiedDate ? new Date(article.modifiedDate) : new Date(),
    createdBy: "system",
    modifiedBy: "system"
  };
};

export function InventoryServicesList() {
  const { t } = useTranslation('inventory-services');
  const { serviceCategories, articleCategories, locations } = useLookups();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<'list' | 'table'>('table');
  const [filterType, setFilterType] = useState<'all' | 'material' | 'service' | 'low_stock'>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [selectedStat, setSelectedStat] = useState<string>('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [invPage, setInvPage] = useState(1);
  const [invPageSize, setInvPageSize] = useState(50);
  // Selection state lifted up for bulk action bar positioning
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  
  // Bulk delete state
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  
  // Use React Query hook for automatic refresh
  const { articles, pagination, isLoading, deleteArticle } = useArticles({ limit: 99999 });

  // Helper functions to resolve IDs to names - memoized to update when lookups change
  const getCategoryName = useCallback((id: number): string => {
    const allCategories = [...articleCategories, ...serviceCategories];
    const category = allCategories.find(c => Number(c.id) === id);
    return category?.name || t('general');
  }, [articleCategories, serviceCategories, t]);

  const getLocationName = useCallback((id: number): string => {
    const location = locations.find(l => Number(l.id) === id);
    return location?.name || t('no_location');
  }, [locations, t]);
  
  // Convert API articles to display format - useMemo to recalculate when dependencies change
  const { allItems, mockInventoryItems, mockServices } = useMemo(() => {
    console.log('InventoryServicesList: Recalculating with lookups:', {
      articleCategories: articleCategories.length,
      serviceCategories: serviceCategories.length,
      locations: locations.length
    });
    const items = articles.map(article => convertToArticleFormat(article, t, getCategoryName, getLocationName));
    return {
      allItems: items,
      mockInventoryItems: items.filter(item => item.type === 'material'),
      mockServices: items.filter(item => item.type === 'service')
    };
  }, [articles, t, getCategoryName, getLocationName, articleCategories, serviceCategories, locations]);

  const handleItemClick = (item: any) => {
    navigate(`/dashboard/inventory-services/article/${item.id}`);
  };
  
  const handleAddArticle = () => {
    navigate('/dashboard/inventory-services/add-article');
  };
  
  const handleStatClick = (statType: 'all' | 'material' | 'service' | 'low_stock') => {
    setSelectedStat(statType);
    setFilterType(statType);
    setInvPage(1);
    if (statType !== 'material' && statType !== 'all') {
      setFilterLocation('all');
    }
  };

  const handleFilterChange = (value: 'all' | 'material' | 'service' | 'low_stock') => {
    setFilterType(value);
    setSelectedStat(value);
    setInvPage(1);
    if (value !== 'material' && value !== 'all') {
      setFilterLocation('all');
    }
  };

  // Bulk delete handler
  const handleBulkDelete = async () => {
    const idsToDelete = Array.from(selectedIds);
    setIsBulkDeleting(true);
    setBulkDeleteProgress(0);

    for (let i = 0; i < idsToDelete.length; i++) {
      await deleteArticle(idsToDelete[i]);
      setBulkDeleteProgress(Math.round(((i + 1) / idsToDelete.length) * 100));
    }

    setIsBulkDeleting(false);
    setShowBulkDeleteDialog(false);
    setSelectedIds(new Set());
    setBulkDeleteProgress(0);
  };

  const filteredItems = allItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.sku?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || 
                       item.type === filterType || 
                       (filterType === 'low_stock' && item.type === 'material' && item.stock < item.minStock) ||
                       (serviceCategories.some(cat => cat.id === filterType) && item.category.toLowerCase() === filterType.toLowerCase());
    
    // Location filter - only applies to materials
    const matchesLocation = filterLocation === 'all' || 
                           item.type === 'service' || // Don't filter services by location
                           (item.type === 'material' && item.location === locations.find(l => l.id === filterLocation)?.name);
    
    return matchesSearch && matchesType && matchesLocation;
  });

  // Paginate filtered items
  const paginatedItems = useMemo(() => {
    if (invPageSize >= 99999) return filteredItems;
    const start = (invPage - 1) * invPageSize;
    return filteredItems.slice(start, start + invPageSize);
  }, [filteredItems, invPage, invPageSize]);

  const lowStockItems = mockInventoryItems.filter(item => item.stock < item.minStock);
  
  const stats: InventoryStat[] = [{
    label: t('stats.total_items'),
    value: allItems.length,
    icon: Package,
    color: "chart-1",
    filter: "all"
  }, {
    label: t('stats.materials'),
    value: mockInventoryItems.length,
    icon: Package,
    color: "chart-2",
    filter: "material"
  }, {
    label: t('stats.services'),
    value: mockServices.length,
    icon: Wrench,
    color: "chart-3",
    filter: "service"
  }, {
    label: t('stats.low_stock'),
    value: lowStockItems.length,
    icon: AlertTriangle,
    color: "chart-4",
    filter: "low_stock"
  }];

  if (isLoading) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col">
      <InventoryHeader onAddArticle={handleAddArticle} onImport={() => setShowImportModal(true)} />
      
      <ArticleImportModal
        open={showImportModal}
        onOpenChange={setShowImportModal}
      />

      <InventoryStats stats={stats} selected={selectedStat} onSelect={handleStatClick} />

      <InventorySearchControls
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={handleFilterChange}
        filterLocation={filterLocation}
        setFilterLocation={setFilterLocation}
        serviceCategories={serviceCategories}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Bulk Action Bar - positioned below search/filters, outside table container */}
      {selectedIds.size > 0 && (
        <div className="sticky top-0 z-30 bg-destructive/10 border-b border-destructive/20 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={filteredItems.length > 0 && filteredItems.every(item => selectedIds.has(String(item.id)))}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedIds(new Set(filteredItems.map(item => String(item.id))));
                  } else {
                    setSelectedIds(new Set());
                  }
                }}
              />
              <span className="text-sm font-medium text-foreground">
                {t('table.selected_count', { count: selectedIds.size })}
              </span>
              <Button variant="ghost" size="sm" onClick={() => setSelectedIds(new Set())} className="text-muted-foreground">
                {t('table.deselect_all')}
              </Button>
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {t('table.delete_selected')}
            </Button>
          </div>
        </div>
      )}

      {/* Pagination - Top */}
      {filteredItems.length > 0 && (
        <div className="px-3 sm:px-4 lg:px-6">
          <PageSizeSelector
            currentPage={invPage}
            totalPages={Math.ceil(filteredItems.length / invPageSize)}
            totalItems={filteredItems.length}
            pageSize={invPageSize}
            startIndex={(invPage - 1) * invPageSize}
            endIndex={Math.min(invPage * invPageSize, filteredItems.length)}
            onPageChange={setInvPage}
            onPageSizeChange={(size) => { setInvPageSize(size); setInvPage(1); }}
            hasPreviousPage={invPage > 1}
            hasNextPage={invPage < Math.ceil(filteredItems.length / invPageSize)}
          />
        </div>
      )}

      {/* Items List */}
      <div className="p-3 sm:p-4 lg:p-6">
        <div className="bg-card rounded-lg">
          {filteredItems.length === 0 ? (
            <div className="py-16 px-8 text-center">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">{t('no_items_found')}</h3>
              <p className="text-muted-foreground">
                {searchTerm ? t('no_items_description') : t('no_items_description_empty')}
              </p>
            </div>
          ) : viewMode === 'list' ? (
            <InventoryListView items={paginatedItems} onClick={handleItemClick} />
          ) : (
            <InventoryTableView 
              items={paginatedItems} 
              onClick={handleItemClick}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
            />
          )}
        </div>
      </div>

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={(open) => !isBulkDeleting && setShowBulkDeleteDialog(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('table.bulk_delete_title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('table.bulk_delete_confirm', { count: selectedIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {isBulkDeleting && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-muted-foreground">{t('table.deleting_progress')}</span>
                <span className="text-sm font-medium">{bulkDeleteProgress}%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="bg-destructive h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${bulkDeleteProgress}%` }}
                />
              </div>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkDeleting}>{t('table.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isBulkDeleting}
            >
              {isBulkDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isBulkDeleting ? t('table.deleting') : t('table.delete_selected')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
