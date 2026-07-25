import { useState } from "react";
import { Edit2, Package, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaleItem } from "../types";

import { ChecklistsSection } from "@/modules/shared/components/documents";

interface EditSaleItemModalProps {
  item: SaleItem;
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: SaleItem) => void;
}

export function EditSaleItemModal({ item, isOpen, onClose, onSave }: EditSaleItemModalProps) {
  const [editedItem, setEditedItem] = useState<SaleItem>({ ...item });

  const handleFieldChange = (field: keyof SaleItem, value: any) => {
    const updated = { ...editedItem, [field]: value };
    
    // Recalculate total price when quantity or unit price changes
    if (field === 'quantity' || field === 'unitPrice') {
      updated.totalPrice = updated.quantity * updated.unitPrice;
    }
    
    setEditedItem(updated);
  };

  const handleSave = () => {
    onSave(editedItem);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit2 className="h-5 w-5" />
            Edit Sale Item
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Info */}
          <Card className="bg-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
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
                <div>
                  <p className="font-medium">{item.itemName}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {item.type === 'article' ? 'Article' : 'Service'}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Code: {item.itemCode}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Editable Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={editedItem.quantity}
                onChange={(e) => handleFieldChange('quantity', parseFloat(e.target.value) || 0)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ($) *</Label>
              <Input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={editedItem.unitPrice}
                onChange={(e) => handleFieldChange('unitPrice', parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={editedItem.description || ''}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              placeholder="Add any additional notes or specifications"
              rows={3}
            />
          </div>

          {/* Total Calculation */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total Price:</span>
                <span className="text-2xl font-bold">
                  ${editedItem.totalPrice.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                {editedItem.quantity.toFixed(2)} × ${editedItem.unitPrice.toFixed(2)}
              </p>
            </CardContent>
          </Card>


          {/* Checklists on a service line follow sale → service-order job → dispatch. */}
          {editedItem.type === 'service' && Number(editedItem.id) > 0 && (
            <ChecklistsSection entityType="sale_item" entityId={Number(editedItem.id)} />
          )}


          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Edit2 className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}