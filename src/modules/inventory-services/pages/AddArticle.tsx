import { useState, useEffect } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { ArrowLeft, Save, Package, Loader2, Settings2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTranslation } from 'react-i18next';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import lookupsApi from "@/services/api/lookupsApi";


interface LookupItem {
  id: number;
  name: string;
  value?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

const AddArticle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('inventory-services');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [loadingLookups, setLoadingLookups] = useState(true);
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  
  const [formData, setFormData, clearFormData] = useFormPersistence('add-article', {
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    locationId: "",
    stock: "",
    minStock: "",
    price: "",
    sellPrice: "",
    supplier: "",
    notes: ""
  });

  // Fetch lookups on mount
  useEffect(() => {
    const fetchLookups = async () => {
      try {
        setLoadingLookups(true);
        const [categoriesData, locationsData] = await Promise.all([
          lookupsApi.articleCategories.getAll().then(res => res.items || []).catch(() => []),
          lookupsApi.locations.getAll().then(res => res.items || []).catch(() => [])
        ]);
        
        // Map lookup response to our format
        const mapLookups = (data: any[]): LookupItem[] => {
          return data
            .filter((item: any) => item.isActive !== false)
            .map((item: any) => ({
              id: item.id,
              name: item.name || item.value || `Item ${item.id}`,
              value: item.value,
              isActive: item.isActive,
              isDefault: item.isDefault
            }));
        };
        
        setCategories(mapLookups(categoriesData));
        setLocations(mapLookups(locationsData));
      } catch (error) {
        console.error('Failed to fetch lookups:', error);
        toast({
          title: t('toast.warning'),
          description: t('toast.lookups_warning'),
          variant: "destructive",
        });
      } finally {
        setLoadingLookups(false);
      }
    };
    
    fetchLookups();
  }, [toast]);

  // Auto-select: default lookup or single option for category and location
  useEffect(() => {
    if (!loadingLookups && categories.length > 0 && !formData.categoryId) {
      const defaultCat = categories.find(c => c.isDefault);
      if (defaultCat) {
        setFormData(prev => ({ ...prev, categoryId: String(defaultCat.id) }));
      } else if (categories.length === 1) {
        setFormData(prev => ({ ...prev, categoryId: String(categories[0].id) }));
      }
    }
    if (!loadingLookups && locations.length > 0 && !formData.locationId) {
      const defaultLoc = locations.find(l => l.isDefault);
      if (defaultLoc) {
        setFormData(prev => ({ ...prev, locationId: String(defaultLoc.id) }));
      } else if (locations.length === 1) {
        setFormData(prev => ({ ...prev, locationId: String(locations[0].id) }));
      }
    }
  }, [loadingLookups, categories, locations]);
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Import the real API and call it
      const { articlesApi } = await import('@/services/api/articlesApi');
      
      const articleData: Record<string, any> = {
        name: formData.name,
        type: 'material',
        status: 'active',
        description: formData.description || '',
        sku: formData.sku || undefined,
        stock: formData.stock ? parseInt(formData.stock) : undefined,
        minStock: formData.minStock ? parseInt(formData.minStock) : undefined,
        costPrice: formData.price ? parseFloat(formData.price) : undefined,
        sellPrice: formData.sellPrice ? parseFloat(formData.sellPrice) : undefined,
        supplier: formData.supplier || undefined,
        notes: formData.notes || '',
      };

      // CategoryId - send as integer if selected
      if (formData.categoryId) {
        articleData.categoryId = parseInt(formData.categoryId, 10);
      }
      
      // LocationId - send as integer if selected
      if (formData.locationId) {
        articleData.locationId = parseInt(formData.locationId, 10);
      }

      console.log("Submitting article to API:", articleData);
      
      const result = await articlesApi.create(articleData as any);
      console.log("Article created successfully:", result);
      
      toast({
        title: t('toast.success'),
        description: t('toast.add_success', { type: t('material') }),
      });
      
      clearFormData();
      navigate("/dashboard/inventory-services");
    } catch (error: any) {
      console.error("Failed to create article:", error);
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.add_error', { type: t('material') }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.sku;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/inventory-services">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('inventory_services.back_to_inventory') || t('back_to_inventory') || 'Back to Inventory'}
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{t('add_inventory_item') || 'Add New Article'}</h1>
          <p className="text-muted-foreground">{t('inventory_services.add_article_subtitle') || t('add_article_subtitle') || 'Add a new item to your inventory'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Basic Information */}
          <Card className="lg:col-span-2">
              <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t('inventory_services.basic_information') || t('basic_information') || 'Basic Information'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Article Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter article name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">Reference *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Enter reference code"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder="Enter article description"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="categoryId">{t('category', 'Category')}</Label>
                    <Link to={`/dashboard/lookups?tab=articleCategories&returnUrl=${encodeURIComponent(currentPath)}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                      <Settings2 className="h-3 w-3" /> {t('common.manage', 'Manage')}
                    </Link>
                  </div>
                  <Select 
                    value={formData.categoryId} 
                    onValueChange={(value) => handleInputChange("categoryId", value)}
                    disabled={loadingLookups}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingLookups ? "Loading..." : "Select category"} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={String(category.id)}>
                          {category.name}
                        </SelectItem>
                      ))}
                      {categories.length === 0 && !loadingLookups && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No categories found. <Link to={`/dashboard/lookups?tab=articleCategories&returnUrl=${encodeURIComponent(currentPath)}`} className="text-primary hover:underline">Add some</Link>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="locationId">{t('location', 'Location')}</Label>
                    <Link to={`/dashboard/lookups?tab=locations&returnUrl=${encodeURIComponent(currentPath)}`} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors">
                      <Settings2 className="h-3 w-3" /> {t('common.manage', 'Manage')}
                    </Link>
                  </div>
                  <Select 
                    value={formData.locationId} 
                    onValueChange={(value) => handleInputChange("locationId", value)}
                    disabled={loadingLookups}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingLookups ? "Loading..." : "Select location"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((location) => (
                        <SelectItem key={location.id} value={String(location.id)}>
                          {location.name}
                        </SelectItem>
                      ))}
                      {locations.length === 0 && !loadingLookups && (
                        <div className="p-2 text-sm text-muted-foreground text-center">
                          No locations found. <Link to={`/dashboard/lookups?tab=locations&returnUrl=${encodeURIComponent(currentPath)}`} className="text-primary hover:underline">Add some</Link>
                        </div>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Inventory & Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>{t('inventory_services.inventory_pricing') || t('inventory_pricing') || 'Inventory & Pricing'}</CardTitle>
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
                  step="0.1"
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
                  step="0.1"
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
                />
              </div>
            </CardContent>
          </Card>
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
            <Link to="/dashboard/inventory-services">Cancel</Link>
          </Button>
          <Button type="submit" disabled={!isFormValid || isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Article
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddArticle;