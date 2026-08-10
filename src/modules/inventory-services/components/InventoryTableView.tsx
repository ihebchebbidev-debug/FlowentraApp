import { useCurrency } from '@/shared/hooks/useCurrency';
import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Table as TableComponent, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, Edit, Eye, Trash2, Loader2 } from "lucide-react";
import { getLocationIcon, getTypeIcon } from "./utils";
import { useArticles } from "@/modules/articles/hooks/useArticles";
import { isViewAllMode } from '@/utils/tenant';
import { CompanyBadge } from '@/components/CompanyBadge';
import { TableRowActions } from "@/shared/components/TableRowActions";
import { SortableHeader } from "@/components/shared/SortableHeader";
import type { SortDirection } from "@/hooks/useTableSort";

interface InventoryTableViewProps {
  items: any[];
  onClick: (item: any) => void;
  selectedIds: Set<string>;
  onSelectionChange: (ids: Set<string>) => void;
  sortKey?: string | null;
  sortDirection?: SortDirection;
  onSort?: (key: string) => void;
}

export function InventoryTableView({ items, onClick, selectedIds, onSelectionChange, sortKey = null, sortDirection = null, onSort }: InventoryTableViewProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('inventory-services');
  const { current: currency } = useCurrency();
  const { deleteArticle, isDeleting } = useArticles();
  
  // Single item delete state
  const [deleteItem, setDeleteItem] = useState<any>(null);
  
  // Bulk delete dialog state
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [bulkDeleteProgress, setBulkDeleteProgress] = useState(0);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Check if all items are selected
  const allSelected = useMemo(() => {
    return items.length > 0 && items.every(item => selectedIds.has(String(item.id)));
  }, [items, selectedIds]);

  // Check if some items are selected (for indeterminate state)
  const someSelected = useMemo(() => {
    return selectedIds.size > 0 && !allSelected;
  }, [selectedIds, allSelected]);

  // Toggle all items selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(new Set(items.map(item => String(item.id))));
    } else {
      onSelectionChange(new Set());
    }
  };

  // Toggle single item selection
  const handleSelectItem = (itemId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(itemId);
    } else {
      newSelected.delete(itemId);
    }
    onSelectionChange(newSelected);
  };

  // Single item delete
  const handleDelete = () => {
    if (deleteItem) {
      deleteArticle(String(deleteItem.id));
      setDeleteItem(null);
    }
  };

  // Bulk delete - calls delete API for each selected item
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
    onSelectionChange(new Set());
    setBulkDeleteProgress(0);
  };

  return (
    <>
      <div className="w-full">
      <Card className="shadow-card border-0 bg-transparent w-full">
        <CardContent className="p-0">
          <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent"
               style={{ WebkitOverflowScrolling: 'touch' }}>
            <TableComponent className="min-w-[1000px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label={t('table.select_all')}
                    className={someSelected ? "data-[state=checked]:bg-primary" : ""}
                  />
                </TableHead>
                {onSort ? (
                  <>
                    <SortableHeader columnKey="item" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>{t('table.item_service')}</SortableHeader>
                    {isViewAllMode() && <SortableHeader columnKey="company" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>Company</SortableHeader>}
                    <SortableHeader columnKey="category" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>{t('table.category')}</SortableHeader>
                    <SortableHeader columnKey="location" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>{t('table.location_duration')}</SortableHeader>
                    <SortableHeader columnKey="price" sortKey={sortKey} sortDirection={sortDirection} onSort={onSort}>{t('table.price')}</SortableHeader>
                  </>
                ) : (
                  <>
                    <TableHead>{t('table.item_service')}</TableHead>
                    {isViewAllMode() && <TableHead>Company</TableHead>}
                    <TableHead>{t('table.category')}</TableHead>
                    <TableHead>{t('table.location_duration')}</TableHead>
                    <TableHead>{t('table.price')}</TableHead>
                  </>
                )}
                <TableHead>{t('table.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map(item => {
                const TypeIcon = getTypeIcon(item.type);
                const isSelected = selectedIds.has(String(item.id));
                return (
                  <TableRow 
                    key={item.id} 
                    className={`cursor-pointer hover:bg-muted/50 ${isSelected ? 'bg-muted/30' : ''}`} 
                    onClick={() => onClick(item)}
                  >
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => handleSelectItem(String(item.id), !!checked)}
                        aria-label={t('table.select_item', { name: item.name })}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary">
                            <TypeIcon className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div>{item.name}</div>
                          
                        </div>
                      </div>
                    </TableCell>
                    {isViewAllMode() && (
                      <TableCell><CompanyBadge tenantId={(item as any).tenantId} forceShow /></TableCell>
                    )}
                    <TableCell>{item.category || t('general')}</TableCell>
                    <TableCell>
                      {item.type === 'material' ? (
                        <div className="flex items-center gap-1">
                          {React.createElement(getLocationIcon((item as any).locationType), {
                            className: "h-3 w-3"
                          })}
                          <span className="text-sm">{(item as any).location || t('table.na')}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span className="text-sm">
                            {((item as any).duration || 0) % 1 !== 0 ? ((item as any).duration).toFixed(1) : (item as any).duration} {t('hours')}
                          </span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <span>
                        {item.type === 'material' 
                          ? `${Math.floor((item as any).sellPrice || 0)} ${currency.code}` 
                          : `${Math.floor((item as any).basePrice || 0)} ${currency.code}`}
                      </span>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <TableRowActions actions={[
                        { icon: Eye, label: t('table.view_details'), onClick: (e) => { e.stopPropagation(); onClick(item); } },
                        { icon: Edit, label: item.type === 'material' ? t('table.edit_material') : t('table.edit_service'), onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/inventory-services/article/${item.id}/edit`); } },
                        { icon: Trash2, label: t('table.delete'), onClick: (e) => { e.stopPropagation(); setDeleteItem(item); }, variant: 'destructive' }
                      ]} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            </TableComponent>
          </div>
        </CardContent>
      </Card>

      {/* Single Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('table.delete_article')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('table.delete_confirm', { name: deleteItem?.name })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('table.cancel')}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {t('table.delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
    </>
  );
}
