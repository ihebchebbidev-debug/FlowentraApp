import { useState } from "react";
import { useTranslation } from 'react-i18next';
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';

const categories = ["Tools", "Electrical", "Plumbing", "Safety", "Hardware", "Materials", "Equipment"];
const locations = ["Warehouse A", "Warehouse B", "Service Van 1", "Service Van 2", "Main Office"];

interface FastAddFormProps {
  onSuccess?: () => void;
  onSwitchToDetailed?: () => void;
}

export function FastAddForm({ onSuccess, onSwitchToDetailed }: FastAddFormProps) {
  const { toast } = useToast();
  const { t } = useTranslation('articles');
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    category: "",
    location: "",
    stock: "",
    sellPrice: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTenantRequired) {
      toast({ title: t('add.error'), description: 'Please select a target company first.', variant: "destructive" });
      return;
    }
    
    try {
      // Here you would save to Supabase
      console.log("Quick saving article:", formData);
      
      toast({
        title: t('add.success'),
        description: t('add.success_message'),
      });
      
      // Reset form
      setFormData({
        name: "",
        sku: "",
        category: "",
        location: "",
        stock: "",
        sellPrice: ""
      });
      
      onSuccess?.();
    } catch (error) {
  const _err = error;
      toast({
        title: t('add.error'),
        description: t('add.error_message'),
        variant: "destructive",
      });
    }
  };

  const isFormValid = formData.name && formData.sku && formData.category && formData.location;

  return (
    <Card className="shadow-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{t('add.quick_add')}</span>
          <Button variant="outline" size="sm" onClick={onSwitchToDetailed}>
            {t('add.detailed_form')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fast-name">{t('add.article_name')} *</Label>
              <Input
                id="fast-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder={t('add.article_name_placeholder')}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fast-sku">{t('fields.sku')} *</Label>
              <Input
                id="fast-sku"
                value={formData.sku}
                onChange={(e) => handleInputChange("sku", e.target.value)}
                placeholder={t('add.sku_placeholder')}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fast-category">{t('add.category')} *</Label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('add.select_category')} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fast-location">{t('add.select_location')} *</Label>
              <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('add.select_location')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fast-stock">{t('add.current_stock')}</Label>
              <Input
                id="fast-stock"
                type="number"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fast-sellPrice">{t('add.sell_price')}</Label>
              <Input
                id="fast-sellPrice"
                type="number"
                step="0.01"
                value={formData.sellPrice}
                onChange={(e) => handleInputChange("sellPrice", e.target.value)}
                placeholder="0.00"
                min="0"
              />
            </div>
          </div>

          <Button type="submit" disabled={!isFormValid} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            {t('add.save_article')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}