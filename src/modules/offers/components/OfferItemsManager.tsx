import { useState } from "react";
import { Package, Wrench, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { OfferItem } from "../types";
import { AddOfferItemModal } from "./AddOfferItemModal";
import { EditOfferItemModal } from "./EditOfferItemModal";

interface OfferItemsManagerProps {
  items: OfferItem[];
  onUpdateItems: (items: OfferItem[]) => void;
  currency?: string;
  readonly?: boolean;
}

export function OfferItemsManager({ items, onUpdateItems, currency = 'TND', readonly = false }: OfferItemsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OfferItem | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleAddItem = (newItem: OfferItem) => {
    onUpdateItems([...items, newItem]);
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

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Offer Items</h3>
        {!readonly && (
          <Button onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No items added yet</p>
          {!readonly && (
            <p className="text-sm">Click "Add Item" to get started</p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const subtotal = item.quantity * item.unitPrice;
            const discountAmount = item.discountType === 'percentage' 
              ? subtotal * ((item.discount || 0) / 100)
              : (item.discount || 0);
            const hasDiscount = item.discount && item.discount > 0;
            
            return (
            <Card key={item.id} className={`border ${hasDiscount ? 'border-amber-200 dark:border-amber-800 bg-amber-50/30 dark:bg-amber-950/20' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {item.type === 'article' ? (
                        <Package className="h-4 w-4 flex-shrink-0" />
                      ) : (
                        <Wrench className="h-4 w-4 flex-shrink-0" />
                      )}
                      <span className="font-medium">{item.itemName}</span>
                      <Badge variant="outline" className="text-xs">
                        {item.type}
                      </Badge>
                      {hasDiscount && (
                        <Badge variant="secondary" className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100">
                          {item.discountType === 'percentage' ? `${item.discount}% OFF` : `${formatCurrency(item.discount)} OFF`}
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      {item.itemCode && (
                        <p>{item.itemCode}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Qty: {Number(item.quantity).toFixed(2)}</span>
                        <span>Price: {formatCurrency(item.unitPrice)}</span>
                        <span className="font-medium text-foreground">Subtotal: {formatCurrency(subtotal)}</span>
                      </div>
                      {hasDiscount && (
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-400 font-medium">
                          <span>Discount: -{formatCurrency(discountAmount)}</span>
                        </div>
                      )}
                      {item.description && (
                        <p className="text-xs italic mt-1 max-w-sm">{item.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${hasDiscount ? 'text-green-600 dark:text-green-400' : ''}`}>
                        {formatCurrency(item.totalPrice)}
                      </div>
                      {hasDiscount && (
                        <div className="text-xs text-muted-foreground line-through">
                          {formatCurrency(subtotal)}
                        </div>
                      )}
                    </div>
                    {!readonly && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingItem(item)}
                          className="h-8 w-8 p-0"
                          title="Edit item"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          title="Delete item"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          })}
          
          {items.length > 0 && (
            <>
              <Separator />
              <div className="flex justify-between items-center py-2">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-semibold text-lg">
                  {formatCurrency(calculateSubtotal())}
                </span>
              </div>
            </>
          )}
        </div>
      )}

      <AddOfferItemModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onAddItem={handleAddItem}
        currency={currency}
      />

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