import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import itemTypes from '@/data/mock/offer-item-types.json';
import { Textarea } from "@/components/ui/textarea";
import { OfferItem } from "../types";
import { Package, Wrench, DollarSign } from "lucide-react";

interface AddOfferItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddItem: (item: OfferItem | OfferItem[]) => void;
  currency: string;
  existingItems?: OfferItem[];
}

export function AddOfferItemModal({ open, onOpenChange, onAddItem, currency, existingItems = [] }: AddOfferItemModalProps) {
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    type: 'article' as 'article' | 'service',
    itemName: '',
    itemCode: '',
    description: '',
    quantity: 1,
    unitPrice: 0,
    discount: 0,
    discountType: 'percentage' as 'percentage' | 'fixed',
    duration: 60 // Default 60 minutes for services
  });

  const calculateTotal = () => {
    const subtotal = formData.quantity * formData.unitPrice;
    const discountAmount = formData.discountType === 'percentage' 
      ? subtotal * (formData.discount / 100)
      : formData.discount;
    return subtotal - discountAmount;
  };

  const toggleItemSelection = (itemId: string) => {
    const newSelection = new Set(selectedItemIds);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItemIds(newSelection);
  };

  const handleBulkSubmit = () => {
    // Keep the user's selection order (Set preserves insertion order), not the
    // order items happen to appear in the catalog list.
    const selectedItems = Array.from(selectedItemIds)
      .map(id => existingItems.find(item => item.id === id))
      .filter((item): item is OfferItem => !!item);
    if (selectedItems.length > 0) {
      onAddItem(selectedItems);
      onOpenChange(false);
      setSelectedItemIds(new Set());
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.itemName || formData.quantity <= 0 || formData.unitPrice <= 0) {
      return;
    }

    const newItem: OfferItem = {
      id: `item-${Date.now()}`,
      offerId: '', // Will be set when offer is created
      type: formData.type,
      itemId: `${formData.type}-${Date.now()}`,
      itemName: formData.itemName,
      itemCode: formData.itemCode || undefined,
      quantity: formData.quantity,
      unitPrice: formData.unitPrice,
      totalPrice: calculateTotal(),
      description: formData.description || undefined,
      discount: formData.discount || undefined,
      discountType: formData.discount > 0 ? formData.discountType : undefined,
      // Include duration for service items
      duration: formData.type === 'service' ? formData.duration : undefined
    };

    onAddItem(newItem);
    onOpenChange(false);
    
    // Reset form
    setFormData({
      type: 'article',
      itemName: '',
      itemCode: '',
      description: '',
      quantity: 1,
      unitPrice: 0,
      discount: 0,
      discountType: 'percentage',
      duration: 60
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Add Offer Item</DialogTitle>
            {existingItems.length > 0 && (
              <Button
                variant={bulkMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedItemIds(new Set());
                }}
              >
                {bulkMode ? 'Single Item' : 'Bulk Select'} ({selectedItemIds.size})
              </Button>
            )}
          </div>
        </DialogHeader>
        
        {bulkMode ? (
          <div className="space-y-4">
            <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
              {existingItems.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-2 hover:bg-muted rounded">
                  <Checkbox
                    checked={selectedItemIds.has(item.id)}
                    onCheckedChange={() => toggleItemSelection(item.id)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {item.type === 'article' ? (
                        <Package className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      ) : (
                        <Wrench className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      )}
                      <span className="font-medium truncate">{item.itemName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Qty: {Number(item.quantity).toFixed(2)} × {Number(item.unitPrice).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => setBulkMode(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleBulkSubmit}
                disabled={selectedItemIds.size === 0}
              >
                Add {selectedItemIds.size > 0 ? `(${selectedItemIds.size})` : ''} Items
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <Select value={formData.type} onValueChange={(value: 'article' | 'service') => setFormData(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {itemTypes.map(it => (
                    <SelectItem key={it.id} value={it.id}>{it.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="itemCode">Item Code</Label>
              <Input
                id="itemCode"
                value={formData.itemCode}
                onChange={(e) => setFormData(prev => ({ ...prev, itemCode: e.target.value }))}
                placeholder="SKU001"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName">Item Name *</Label>
            <Input
              id="itemName"
              value={formData.itemName}
              onChange={(e) => setFormData(prev => ({ ...prev, itemName: e.target.value }))}
              placeholder="Enter item name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Item description"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="unitPrice">Unit Price ({currency}) *</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData(prev => ({ ...prev, unitPrice: parseFloat(e.target.value) || 0 }))}
                required
              />
            </div>
          </div>

          {/* Duration field for services */}
          {formData.type === 'service' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (minutes) *</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                step="15"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: parseInt(e.target.value) || 60 }))}
                placeholder="60"
                required
              />
            </div>
          )}

          {/* Discount Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-semibold">Per-Item Discount (Optional)</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="discountType">Discount Type</Label>
                <Select value={formData.discountType} onValueChange={(value: 'percentage' | 'fixed') => setFormData(prev => ({ ...prev, discountType: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount ({currency})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount">Discount Amount</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.discount}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount: parseFloat(e.target.value) || 0 }))}
                    placeholder="Enter discount"
                  />
                  <span className="text-sm font-medium w-8 text-right">
                    {formData.discountType === 'percentage' ? '%' : currency}
                  </span>
                </div>
              </div>
            </div>

            {formData.discount > 0 && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-medium">{(formData.quantity * formData.unitPrice).toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>Discount ({formData.discountType === 'percentage' ? `${formData.discount}%` : currency}):</span>
                  <span className="font-medium">
                    -{formData.discountType === 'percentage' 
                      ? (formData.quantity * formData.unitPrice * (formData.discount / 100)).toLocaleString()
                      : formData.discount.toLocaleString()
                    } {currency}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Price Summary */}
          <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-900 p-4 rounded-lg border-2 border-primary/20">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Qty × Unit Price:</span>
                <span>{formData.quantity} × {formData.unitPrice.toLocaleString()} = {(formData.quantity * formData.unitPrice).toLocaleString()} {currency}</span>
              </div>
              {formData.discount > 0 && (
                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span>Discount:</span>
                  <span>
                    -{formData.discountType === 'percentage' 
                      ? (formData.quantity * formData.unitPrice * (formData.discount / 100)).toLocaleString()
                      : formData.discount.toLocaleString()
                    } {currency}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">Total:</span>
                <span className="text-lg font-bold text-primary">
                  {calculateTotal().toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">
              Add Item
            </Button>
          </div>
        </form>
        )}

      </DialogContent>
    </Dialog>
  );
}