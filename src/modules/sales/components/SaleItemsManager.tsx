import { useState } from "react";
import { Package, Wrench, Edit, Trash2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SaleItem } from "../types";
import { AddSaleItemModal } from "./AddSaleItemModal";
import { EditSaleItemModal } from "./EditSaleItemModal";

interface SaleItemsManagerProps {
  items: SaleItem[];
  onUpdateItems: (items: SaleItem[]) => void;
  currency?: string;
  readonly?: boolean;
}

export function SaleItemsManager({ items, onUpdateItems, currency = 'USD', readonly = false }: SaleItemsManagerProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SaleItem | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const handleAddItem = (newItem: SaleItem) => {
    onUpdateItems([...items, newItem]);
  };

  const handleEditItem = (updatedItem: SaleItem) => {
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            Sale Items ({items.length})
          </CardTitle>
          {!readonly && (
            <Button onClick={() => setIsAddModalOpen(true)} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-lg">No items added yet</p>
              <p className="text-sm">Start by adding articles or services to this sale</p>
              {!readonly && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setIsAddModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </div>
          ) : (
            <>
              {items.map((item, index) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className={`p-2 rounded-lg ${
                        item.type === 'article' 
                          ? 'bg-primary/10 text-primary' 
                          : 'bg-success/10 text-success'
                      }`}>
                        {item.type === 'article' ? (
                          <Package className="h-4 w-4" />
                        ) : (
                          <Wrench className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium">{item.itemName}</p>
                          <Badge variant="outline" className="text-xs">
                            {item.type === 'article' ? 'Article' : 'Service'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>Code: {item.itemCode}</span>
                          <span>Qty: {Number(item.quantity).toFixed(2)}</span>
                          <span>@ {formatCurrency(item.unitPrice)}</span>
                          {item.installationName && (
                            <span className="text-primary">📍 {item.installationName}</span>
                          )}
                        </div>
                        {item.itemCode && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {item.itemCode}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <p className="font-semibold text-lg">
                          {formatCurrency(item.totalPrice)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {Number(item.quantity).toFixed(2)} × {formatCurrency(item.unitPrice)}
                        </p>
                      </div>
                      {!readonly && (
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                  {index < items.length - 1 && <Separator className="my-2" />}
                </div>
              ))}

              {/* Subtotal */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">Items Subtotal:</span>
                  <span className="font-bold text-xl">
                    {formatCurrency(calculateSubtotal())}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Total of {items.length} item{items.length !== 1 ? 's' : ''}
                </p>
              </div>
            </>
          )}
        </div>
      </CardContent>

      {/* Add Item Modal */}
      <AddSaleItemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddItem={handleAddItem}
        existingItems={items}
      />

      {/* Edit Item Modal */}
      {editingItem && (
        <EditSaleItemModal
          item={editingItem}
          isOpen={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSave={handleEditItem}
        />
      )}
    </Card>
  );
}