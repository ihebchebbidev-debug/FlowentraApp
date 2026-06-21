import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Package, Wrench, DollarSign, Percent } from "lucide-react";
import { OfferItem } from "../types";
import PlannedEntriesEditor from "@/shared/components/planning/PlannedEntriesEditor";
import { ChecklistsSection } from "@/modules/shared/components/documents";

interface EditOfferItemModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: OfferItem;
  onUpdateItem: (item: OfferItem | OfferItem[]) => void;
  currency: string;
  selectedItems?: OfferItem[];
}

export function EditOfferItemModal({ open, onOpenChange, item, onUpdateItem, currency, selectedItems = [] }: EditOfferItemModalProps) {
  const { t } = useTranslation('offers');
  const [quantity, setQuantity] = useState(item.quantity);
  const [unitPrice, setUnitPrice] = useState(item.unitPrice);
  const [discount, setDiscount] = useState(item.discount || 0);
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>(item.discountType || 'percentage');
  const [description, setDescription] = useState(item.description || '');
  const [applyToAll, setApplyToAll] = useState(false);
  const hasBulkItems = selectedItems.length > 1;

  useEffect(() => {
    setQuantity(item.quantity);
    setUnitPrice(item.unitPrice);
    setDiscount(item.discount || 0);
    setDiscountType(item.discountType || 'percentage');
    setDescription(item.description || '');
  }, [item]);

  const calculateSubtotal = () => {
    return quantity * unitPrice;
  };

  const calculateDiscountAmount = () => {
    const subtotal = calculateSubtotal();
    return discountType === 'percentage' 
      ? subtotal * (discount / 100)
      : discount;
  };

  const calculateTotal = () => {
    return calculateSubtotal() - calculateDiscountAmount();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (quantity <= 0 || unitPrice < 0) {
      return;
    }

    const updatedItem: OfferItem = {
      ...item,
      quantity: quantity,
      unitPrice: unitPrice,
      totalPrice: calculateTotal(),
      discount: discount > 0 ? discount : undefined,
      discountType: discount > 0 ? discountType : undefined,
      description: description || undefined,
    };

    // Apply to all selected items or just current item
    if (applyToAll && hasBulkItems) {
      const updatedItems = selectedItems.map(sel => ({
        ...sel,
        quantity: quantity,
        unitPrice: unitPrice,
        totalPrice: sel.quantity * unitPrice - (discountType === 'percentage' 
          ? sel.quantity * unitPrice * (discount / 100)
          : discount),
        discount: discount > 0 ? discount : undefined,
        discountType: discount > 0 ? discountType : undefined,
        description: description || undefined,
      }));
      onUpdateItem(updatedItems);
    } else {
      onUpdateItem(updatedItem);
    }
    
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>{t('editItemDetails')}</DialogTitle>
            {hasBulkItems && (
              <Badge variant="secondary">{t('itemsSelected', { count: selectedItems.length })}</Badge>
            )}
          </div>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Item Basic Info */}
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              {item.type === 'article' ? (
                <Package className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Wrench className="h-5 w-5 text-muted-foreground" />
              )}
              <span className="font-medium">{item.itemName}</span>
              <Badge variant="outline" className="text-xs capitalize">
                {item.type === 'article' ? t('material') : t('service')}
              </Badge>
            </div>
            {item.itemCode && (
              <p className="text-sm text-muted-foreground">{t('code')}: {item.itemCode}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('quantity')} *</Label>
              <Input
                id="quantity"
                type="number"
                min="0.01"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                required
              />
            </div>

            {/* Unit Price */}
            <div className="space-y-2">
              <Label htmlFor="unitPrice">{t('unit')} ({currency}) *</Label>
              <Input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('description')}</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('description')}
              rows={2}
            />
          </div>

          {/* Discount Section */}
          <div className="border rounded-lg p-4 space-y-4 bg-blue-50 dark:bg-blue-950/20">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <h3 className="font-semibold">{t('editItem.perItemDiscount')}</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Discount Type */}
              <div className="space-y-2">
                <Label htmlFor="discountType">{t('editItem.discountType')}</Label>
                <Select value={discountType} onValueChange={(value: 'percentage' | 'fixed') => setDiscountType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">{t('editItem.percentage')}</SelectItem>
                    <SelectItem value="fixed">{t('editItem.fixedAmount')} ({currency})</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Discount Value */}
              <div className="space-y-2">
                <Label htmlFor="discount">{t('editItem.discountAmount')}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="discount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                  />
                  <span className="text-sm font-medium w-8 text-right">
                    {discountType === 'percentage' ? '%' : currency}
                  </span>
                </div>
              </div>
            </div>

            {/* Discount Preview */}
            {discount > 0 && (
              <div className="bg-white dark:bg-slate-900 p-3 rounded space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>{t('subtotal')}:</span>
                  <span className="font-medium">{calculateSubtotal().toLocaleString()} {currency}</span>
                </div>
                <div className="flex justify-between text-amber-600 dark:text-amber-400">
                  <span>{t('discount')} ({discountType === 'percentage' ? `${discount}%` : `${currency}`}):</span>
                  <span className="font-medium">-{calculateDiscountAmount().toLocaleString()} {currency}</span>
                </div>
              </div>
            )}
          </div>

          {/* Total Calculation */}
          <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-lg border-2 border-primary/20">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{t('subtotal')}:</span>
                <span>{calculateSubtotal().toLocaleString()} {currency}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                  <span>{t('discount')}:</span>
                  <span>-{calculateDiscountAmount().toLocaleString()} {currency}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-semibold">{t('total')}:</span>
                <span className="text-lg font-bold text-primary">
                  {calculateTotal().toLocaleString()} {currency}
                </span>
              </div>
            </div>
          </div>

          {/* Bulk Apply Option */}
          {hasBulkItems && (
            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <Checkbox
                id="applyToAll"
                checked={applyToAll}
                onCheckedChange={(checked) => setApplyToAll(checked as boolean)}
              />
              <label htmlFor="applyToAll" className="text-sm cursor-pointer flex-1">
                {t('editItem.applyToAll', { count: selectedItems.length })}
              </label>
            </div>
          )}

          {/*
            Planning panel — shown for every line type. Service lines mainly
            use planned time, article/material lines use planned expenses
            (subcontractor / materials buckets). Hiding it for non-services
            meant article lines could never have a planned expense budget.
          */}
          <PlannedEntriesEditor
            parentType="offer_item"
            parentId={Number(item.id)}
            currency={currency}
          />

          {/* Checklists on a service line follow offer → sale → service-order job. */}
          {item.type === 'service' && Number(item.id) > 0 && (
            <ChecklistsSection entityType="offer_item" entityId={Number(item.id)} />
          )}

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button type="button" onClick={handleSubmit} className="gap-2">
              {applyToAll && hasBulkItems ? t('editItem.updateAll', { count: selectedItems.length }) : t('editItem.updateItem')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
