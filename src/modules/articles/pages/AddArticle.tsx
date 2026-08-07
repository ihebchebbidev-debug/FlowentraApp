import { useCurrency } from '@/shared/hooks/useCurrency';
import { useState } from "react";
import { ArrowLeft, Save, Package, Zap, LinkIcon, Wrench } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FastAddForm } from "../components/FastAddForm";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { articlesApi } from '@/services/api/articlesApi';
import { articleSupplierService } from '@/modules/purchases/services/purchaseService';

const categories = [
  "Tools",
  "Electrical",
  "Plumbing", 
  "Safety",
  "Hardware",
  "Materials",
  "Equipment"
];

const locations = [
  "Warehouse A",
  "Warehouse B", 
  "Service Van 1",
  "Service Van 2",
  "Main Office"
];

const AddArticle = () => {
  const { t } = useTranslation('articles');
  const { current: currency, format: formatMoney } = useCurrency();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [showFastForm, setShowFastForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [articleType, setArticleType] = useState<'material' | 'service'>('material');
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();

  // Supplier linking from URL params
  const linkedSupplierId = searchParams.get('supplierId');
  const linkedSupplierName = searchParams.get('supplierName') || '';

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    category: "",
    location: "",
    stock: "",
    minStock: "",
    price: "",
    sellPrice: "",
    supplier: linkedSupplierName,
    notes: "",
    // Service fields
    basePrice: "",
    duration: "60",
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (type: 'material' | 'service') => {
    setArticleType(type);
    setFormData(prev => ({ ...prev, category: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isTenantRequired) {
      toast({ title: t("add.error"), description: 'Please select a target company first.', variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      // 1. Create the article via backend API
      const createdArticle = await articlesApi.create({
        type: articleType,
        name: formData.name,
        sku: formData.sku,
        description: formData.description,
        category: formData.category || 'Materials',
        status: 'available',
        stock: articleType === 'material' && formData.stock ? Number(formData.stock) : 0,
        minStock: articleType === 'material' && formData.minStock ? Number(formData.minStock) : undefined,
        costPrice: articleType === 'material' && formData.price ? Number(formData.price) : 0,
        sellPrice: articleType === 'material' && formData.sellPrice ? Number(formData.sellPrice) : 0,
        supplier: formData.supplier,
        location: articleType === 'material' ? formData.location : undefined,
        basePrice: articleType === 'service' && formData.basePrice ? Number(formData.basePrice) : undefined,
        duration: articleType === 'service' && formData.duration ? Number(formData.duration) : undefined,
        notes: formData.notes,
      });

      // 2. If coming from a supplier, create the article-supplier link
      if (linkedSupplierId && createdArticle?.id) {
        try {
          await articleSupplierService.create({
            articleId: String(createdArticle.id),
            supplierId: linkedSupplierId,
            supplierRef: '',
            purchasePrice: formData.price ? Number(formData.price) : 0,
            currency: currency.code,
            minOrderQty: 0,
            leadTimeDays: 0,
            isPreferred: true,
            isActive: true,
          });
        } catch (linkError) {
          console.warn('Article created but supplier link failed:', linkError);
          // Still show success for the article itself
        }
      }

      toast({
        title: t("add.success"),
        description: t("add.success_message"),
      });

      // Navigate back to supplier detail if we came from there, otherwise articles list
      if (linkedSupplierId) {
        navigate(`/dashboard/suppliers/${linkedSupplierId}`);
      } else {
        navigate("/dashboard/articles");
      }
    } catch (error) {
      const _err = error as any;
      toast({
        title: t("add.error"),
        description: _err?.message || t("add.error_message"),
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const isFormValid = formData.name && formData.category && 
    (articleType === 'material' ? formData.location : (formData.basePrice && formData.duration));

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild> 
          <Link to={linkedSupplierId ? `/dashboard/suppliers/${linkedSupplierId}` : "/dashboard/articles"}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("detail.back_to_articles")}
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{t("add.title")}</h1>
          <p className="text-muted-foreground">
            {t("add.subtitle")}
            {linkedSupplierName && (
              <Badge variant="outline" className="ml-2 gap-1">
                <LinkIcon className="h-3 w-3" />
                {linkedSupplierName}
              </Badge>
            )}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => setShowFastForm(!showFastForm)}
          className="gap-2"
        >
          <Zap className="h-4 w-4" />
          {showFastForm ? t("add.detailed_form") : t("add.quick_add")}
        </Button>
      </div>

      {/* Fast Form Option */}
      {showFastForm && (
        <div>
          <FastAddForm 
            onSuccess={() => navigate("/dashboard/articles")}
            onSwitchToDetailed={() => setShowFastForm(false)}
          />
        </div>
      )}

      {!showFastForm && (

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Tenant Selector for View All mode */}
        <TenantSelector value={targetTenantId} onChange={handleTenantChange} />

        {/* Article Type Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t("add.article_type", "Article Type")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  articleType === 'material' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                }`} onClick={() => handleTypeChange('material')}>
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <Label className="text-base font-medium cursor-pointer" onClick={() => handleTypeChange('material')}>
                    {t("add.material_label", "Material")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("add.material_description", "Physical items, stock, inventory")}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                  articleType === 'service' 
                    ? 'border-primary bg-primary/10' 
                    : 'border-muted-foreground/20 hover:border-muted-foreground/40'
                }`} onClick={() => handleTypeChange('service')}>
                  <Wrench className="h-6 w-6" />
                </div>
                <div>
                  <Label className="text-base font-medium cursor-pointer" onClick={() => handleTypeChange('service')}>
                    {t("add.service_label", "Service")}
                  </Label>
                  <p className="text-sm text-muted-foreground">{t("add.service_description", "Labor, consulting, time-based work")}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                {t("add.basic_information")}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t("add.article_name")} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t("add.article_name_placeholder")}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t("fields.sku")} *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder={t("add.sku_placeholder")}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t("add.description")}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder={t("add.description_placeholder")}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t("add.category")} *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("add.select_category")} />
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
                  <Label htmlFor="location">Location {articleType === 'material' ? '*' : ''}</Label>
                  <Select value={formData.location} onValueChange={(value) => handleInputChange("location", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
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
            </CardContent>
          </Card>

          {/* Inventory & Pricing — Material */}
          {articleType === 'material' && (
          <Card>
            <CardHeader>
              <CardTitle>{t("add.inventory_pricing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Current Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={formData.stock}
                  onChange={(e) => handleInputChange("stock", e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="minStock">Minimum Stock</Label>
                <Input
                  id="minStock"
                  type="number"
                  value={formData.minStock}
                  onChange={(e) => handleInputChange("minStock", e.target.value)}
                  placeholder="0"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Cost Price</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange("price", e.target.value)}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sellPrice">Sell Price</Label>
                <Input
                  id="sellPrice"
                  type="number"
                  step="0.01"
                  value={formData.sellPrice}
                  onChange={(e) => handleInputChange("sellPrice", e.target.value)}
                  placeholder="0.00"
                  min="0"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                  readOnly={!!linkedSupplierId}
                  className={linkedSupplierId ? "bg-muted cursor-not-allowed" : ""}
                />
                {linkedSupplierId && (
                  <p className="text-xs text-muted-foreground">
                    {t('add.linked_supplier_hint', 'This article will be linked to this supplier automatically.')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          )}

          {/* Service Pricing & Duration */}
          {articleType === 'service' && (
          <Card>
            <CardHeader>
              <CardTitle>{t("add.service_pricing", "Service Pricing")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="basePrice">{t("add.base_price", "Base Price")} *</Label>
                <Input
                  id="basePrice"
                  type="number"
                  step="0.01"
                  value={formData.basePrice}
                  onChange={(e) => handleInputChange("basePrice", e.target.value)}
                  placeholder="0.00"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">{t("add.duration_minutes", "Duration (minutes)")} *</Label>
                <Input
                  id="duration"
                  type="number"
                  value={formData.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  placeholder="60"
                  min="1"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={formData.supplier}
                  onChange={(e) => handleInputChange("supplier", e.target.value)}
                  placeholder="Enter supplier name"
                  readOnly={!!linkedSupplierId}
                  className={linkedSupplierId ? "bg-muted cursor-not-allowed" : ""}
                />
                {linkedSupplierId && (
                  <p className="text-xs text-muted-foreground">
                    {t('add.linked_supplier_hint', 'This article will be linked to this supplier automatically.')}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
          )}
        </div>

        {/* Additional Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional notes or specifications"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild>
              <Link to={linkedSupplierId ? `/dashboard/suppliers/${linkedSupplierId}` : "/dashboard/articles"}>{t("add.cancel")}</Link>
            </Button>
            <Button type="submit" disabled={!isFormValid || saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? t("add.saving", "Saving...") : t("add.save_article")}
            </Button>
        </div>
      </form>
      )}
    </div>
  );
};

export default AddArticle;