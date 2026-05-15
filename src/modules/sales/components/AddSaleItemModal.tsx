import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Package, Wrench, X, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SaleItem } from "../types";
import articlesData from "@/data/mock/articles.json";
import servicesData from "@/data/mock/services.json";
import itemTypes from '@/data/mock/offer-item-types.json';

interface AddSaleItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: SaleItem) => void;
  existingItems: SaleItem[];
}

export function AddSaleItemModal({ isOpen, onClose, onAddItem, existingItems }: AddSaleItemModalProps) {
  const { t } = useTranslation('sales');
  const [selectedType, setSelectedType] = useState<'article' | 'service'>('article');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | null>(null);

  const articles = articlesData.filter(article => 
    article.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const services = servicesData.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.serviceCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setCustomPrice(selectedType === 'article' ? item.sellPrice : item.basePrice);
  };

  const handleAddItem = () => {
    if (!selectedItem) return;

    const unitPrice = customPrice || (selectedType === 'article' ? selectedItem.sellPrice : selectedItem.basePrice);
    const totalPrice = unitPrice * quantity;

    const newItem: SaleItem = {
      id: `item-${Date.now()}`,
      saleId: '', // Will be set by parent
      type: selectedType,
      itemId: selectedItem.id,
      itemName: selectedItem.name,
      itemCode: selectedType === 'article' ? selectedItem.sku : selectedItem.serviceCode,
      quantity,
      unitPrice,
      totalPrice,
      description: selectedItem.description || ''
    };

    onAddItem(newItem);
    
    // Reset form
    setSelectedItem(null);
    setQuantity(1);
    setCustomPrice(null);
    setSearchTerm('');
    onClose();
  };

  const resetForm = () => {
    setSelectedItem(null);
    setQuantity(1);
    setCustomPrice(null);
    setSearchTerm('');
    setSelectedType('article');
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        resetForm();
        onClose();
      }
    }}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('addItemModal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Type Selection */}
          <div className="space-y-2">
            <Label>Item Type</Label>
            <Select value={selectedType} onValueChange={(value: 'article' | 'service') => {
              setSelectedType(value);
              setSelectedItem(null);
              setSearchTerm('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
                <SelectContent>
                  {itemTypes.map((it: any) => (
                    <SelectItem key={it.id} value={it.id}>
                      <div className="flex items-center gap-2">
                        {it.id === 'article' ? <Package className="h-4 w-4" /> : <Wrench className="h-4 w-4" />}
                        {it.name}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label>{t('search', 'Search')} {selectedType === 'article' ? t('addItemModal.articles') : t('addItemModal.services')}</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('addItemModal.searchPlaceholder', { type: selectedType === 'article' ? t('addItemModal.articles') : t('addItemModal.services') })}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-2">
            <Label>{t('available', 'Available')} {selectedType === 'article' ? t('addItemModal.articles') : t('addItemModal.services')}</Label>
            <div className="grid gap-2 max-h-60 overflow-y-auto border rounded-lg p-2">
              {selectedType === 'article' ? (
                articles.length > 0 ? articles.map((article) => (
                  <Card
                    key={article.id}
                    className={`cursor-pointer transition-colors hover:bg-muted ${
                      selectedItem?.id === article.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectItem(article)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-primary/10">
                            <Package className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{article.name}</p>
                            <p className="text-sm text-muted-foreground">SKU: {article.sku}</p>
                            <p className="text-xs text-muted-foreground">Stock: {article.stock} units</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${article.sellPrice}</p>
                          <Badge variant="outline" className="text-xs">
                            {article.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-center text-muted-foreground py-4">{t('addItemModal.noArticlesFound')}</p>
                )
              ) : (
                services.length > 0 ? services.map((service) => (
                  <Card
                    key={service.id}
                    className={`cursor-pointer transition-colors hover:bg-muted ${
                      selectedItem?.id === service.id ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectItem(service)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-success/10">
                            <Wrench className="h-4 w-4 text-success" />
                          </div>
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">{t('addItemModal.code')}: {service.serviceCode}</p>
                            <p className="text-xs text-muted-foreground">{service.estimatedDuration}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${service.basePrice}</p>
                          <Badge variant="outline" className="text-xs">
                            {service.category}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )) : (
                  <p className="text-center text-muted-foreground py-4">{t('addItemModal.noServicesFound')}</p>
                )
              )}
            </div>
          </div>

          {/* Selected Item Details */}
          {selectedItem && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3">{t('addItemModal.selectedItem')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">{t('addItemModal.quantity')}</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">{t('addItemModal.unitPrice')} ($)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      step="0.01"
                      value={customPrice || ''}
                      onChange={(e) => setCustomPrice(parseFloat(e.target.value) || 0)}
                      placeholder={selectedType === 'article' ? selectedItem.sellPrice.toString() : selectedItem.basePrice.toString()}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('addItemModal.totalPrice')}</Label>
                    <div className="h-10 px-3 py-2 border rounded-md bg-muted flex items-center">
                      ${((customPrice || (selectedType === 'article' ? selectedItem.sellPrice : selectedItem.basePrice)) * quantity).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <Label>Description</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedItem.description || 'No description available'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => {
              resetForm();
              onClose();
            }}>
              {t('addItemModal.cancel')}
            </Button>
            <Button 
              onClick={handleAddItem}
              disabled={!selectedItem}
            >
              <Plus className="h-4 w-4 mr-2" />
              {t('addItemModal.addItem')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}