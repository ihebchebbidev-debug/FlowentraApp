import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Clock, DollarSign, Edit, Eye, MapPin, Package, Trash2, Wrench, Loader2 } from "lucide-react";
import { getStatusColor, getTypeIcon } from "./utils";
import { TableRowActions } from "@/shared/components/TableRowActions";
import { useArticles } from "@/modules/articles/hooks/useArticles";

export function InventoryListView({ items, onClick }: { items: any[]; onClick: (item: any) => void; }) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { deleteArticle, isDeleting } = useArticles();
  const [deleteItem, setDeleteItem] = useState<any>(null);

  const handleDelete = () => {
    if (deleteItem) {
      deleteArticle(String(deleteItem.id));
      setDeleteItem(null);
    }
  };

  return (
    <div className="p-3 sm:p-4 lg:p-6">
      <div className="list-editorial">
        {items.map(item => {
          const TypeIcon = getTypeIcon(item.type);
          const price = item.type === 'material'
            ? (item.sellPrice ?? 0)
            : (item.basePrice ?? 0);
          return (
            <div
              key={item.id}
              className="list-row-editorial"
              onClick={() => onClick(item)}
            >
              {/* Header: icon + name + status badge */}
              <div className="flex items-start gap-3 mb-2.5">
                <div className="list-row-avatar mt-0.5">
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="flex-1 font-semibold text-foreground text-px-13 leading-snug tracking-tight line-clamp-2 break-words">{item.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className="text-px-10 px-2 py-0.5 capitalize">
                        {item.type}
                      </Badge>
                      <Badge className={`${getStatusColor(item.status)} text-px-10 px-2 py-0.5 capitalize`}>
                        {item.statusDisplay || item.status?.replace(/_/g, ' ') || 'Unknown'}
                      </Badge>
                    </div>
                  </div>
                  <p className="list-row-subtitle">
                    {item.sku ? `${t('sku', 'SKU')}: ${item.sku} · ` : ''}{item.category || 'General'}
                  </p>
                </div>
              </div>

              {/* Details */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-[52px] mb-3">
                {item.type === 'material' && (
                  <div className="list-row-meta-item">
                    <Package className="h-3.5 w-3.5 shrink-0" />
                    <span>Stock: {item.stock ?? 0}</span>
                  </div>
                )}
                {item.type === 'service' && (
                  <div className="list-row-meta-item">
                    <Wrench className="h-3.5 w-3.5 shrink-0" />
                    <span>
                      {((item.duration || 0) % 1 !== 0 ? item.duration.toFixed(1) : item.duration)} {t('hours', 'h')}
                    </span>
                  </div>
                )}
                {item.type === 'material' && item.location && (
                  <div className="list-row-meta-item">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{item.location}</span>
                  </div>
                )}
                {item.lastUsed && (
                  <div className="list-row-meta-item">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.lastUsed}</span>
                  </div>
                )}
              </div>

              {/* Footer: price + actions */}
              <div className="flex items-center justify-between pl-[52px]" onClick={e => e.stopPropagation()}>
                <span className="inline-flex items-center gap-1 text-px-11 sm:text-px-13 font-semibold text-foreground tabular-nums">
                  <DollarSign className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                  {Number(price).toFixed(2)} TND
                </span>
                <div className="ml-auto">
                  <TableRowActions actions={[
                    { icon: Eye, label: 'View Details', onClick: (e) => { e.stopPropagation(); onClick(item); } },
                    { icon: Edit, label: `Edit ${item.type}`, onClick: (e) => { e.stopPropagation(); navigate(`/dashboard/inventory-services/article/${item.id}/edit`); } },
                    { icon: Trash2, label: 'Delete', onClick: (e) => { e.stopPropagation(); setDeleteItem(item); }, variant: 'destructive' },
                  ]} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteItem} onOpenChange={(open) => !open && setDeleteItem(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Article</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteItem?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
            >
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export function InventoryTableView({ items: _items, onClick: _onClick }: { items: any[]; onClick: (item: any) => void; }) {
  return null; // Placeholder for future extraction
}
