import { useState, useEffect } from "react";
import { ArrowLeft, Save, Package, Wrench, Minus, Loader2 } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import technicianData from "@/data/mock/technicians.json";
import { articlesApi } from "@/services/api/articlesApi";
import { articleCategoriesApi, serviceCategoriesApi, locationsApi, articleGroupsApi, LookupItem } from "@/services/api/lookupsApi";
import { UNIT_OPTIONS, isDecimalUnit } from "@/constants/units";


const subLocations = [
  "Section A", "Section B", "Section C", "Shelf 1", "Shelf 2", "Storage Room"
];

const availableSkills = [
  "Basic Mechanics", "Advanced Mechanics", "Brake Systems", "Engine Diagnostics",
  "Electronics", "Painting", "Body Work", "Electrical Systems", "HVAC Systems",
  "Plumbing", "Welding", "Fabrication"
];

const availableEquipment = [
  "Hydraulic Lift", "Engine Hoist", "Diagnostic Scanner", "Paint Booth",
  "Welding Equipment", "Air Compressor", "Hand Tools", "Power Tools",
  "Pressure Washer", "Oil Drain Pan", "Filter Wrench"
];

const availableMaterials = [
  "Motor Oil", "Oil Filter", "Brake Pads", "Brake Fluid", "Coolant",
  "Spark Plugs", "Air Filter", "Paint", "Primer", "Gaskets", "Seals", "Fasteners"
];

const EditUnifiedArticle = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('inventory-services');
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [articleType, setArticleType] = useState<'material' | 'service'>('material');
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [groups, setGroups] = useState<LookupItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    status: "",
    
    // Inventory fields
    stock: "",
    minStock: "",
    costPrice: "",
    sellPrice: "",
    tvaRate: "19",
    sellPriceTTC: "",
    supplier: "",
    locationId: "",
    groupId: "",
    subLocation: "",
    unit: "piece",
    
    // Service fields
    basePrice: "",
    basePriceTTC: "",
    duration: "",
    skillsRequired: [] as string[],
    materialsNeeded: [] as string[],
    preferredUsers: [] as string[],
    
    // Common
    tags: [] as string[],
    notes: ""
  });

  // Load categories based on article type
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const api = articleType === 'material' ? articleCategoriesApi : serviceCategoriesApi;
        const response = await api.getAll();
        setCategories(response.items || []);
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [articleType]);

  // Load locations for material type
  useEffect(() => {
    const loadLocations = async () => {
      if (articleType !== 'material') return;
      setLoadingLocations(true);
      try {
        const response = await locationsApi.getAll();
        setLocations(response.items || []);
      } catch (error) {
        console.error('Failed to load locations:', error);
        setLocations([]);
      } finally {
        setLoadingLocations(false);
      }
    };
    loadLocations();
  }, [articleType]);

  // Load groups for all article types  
  useEffect(() => {
    const loadGroups = async () => {
      setLoadingGroups(true);
      try {
        const response = await articleGroupsApi.getAll();
        setGroups(response.items || []);
      } catch (error) {
        console.error('Failed to load groups:', error);
        setGroups([]);
      } finally {
        setLoadingGroups(false);
      }
    };
    loadGroups();
  }, []);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const article = await articlesApi.getById(id);
        
        if (!article) {
          toast({
            title: t('toast.error'),
            description: t('toast.not_found'),
            variant: "destructive",
          });
          navigate("/dashboard/inventory-services");
          return;
        }
        
        // Set article type from API response (now stored in Type column)
        const apiArticle = article as any;
        const storedType = apiArticle.type || article.type;
        setArticleType(storedType === 'service' ? 'service' : 'material');
        
        // Get categoryId and locationId from API response
        const categoryId = apiArticle.categoryId?.toString() || "";
        const locationId = apiArticle.locationId?.toString() || "";
        const groupId = apiArticle.groupId?.toString() || "";
        
        const tvaRateVal = (apiArticle.tvaRate ?? 19).toString();
        const sellPriceVal = (apiArticle.salesPrice ?? article.sellPrice ?? "").toString();
        const basePriceVal = (article.basePrice ?? "").toString();
        const tva = parseFloat(tvaRateVal) || 0;
        const sellPriceTTC = sellPriceVal ? (parseFloat(sellPriceVal) * (1 + tva / 100)).toFixed(2) : "";
        const basePriceTTC = basePriceVal ? (parseFloat(basePriceVal) * (1 + tva / 100)).toFixed(2) : "";
        
        setFormData({
          name: article.name || "",
          sku: apiArticle.articleNumber || article.sku || "",
          description: article.description || "",
          categoryId: categoryId,
          status: apiArticle.isActive === false ? 'discontinued' : (article.status || 'available'),
          stock: (apiArticle.stockQuantity ?? article.stock ?? "").toString(),
          minStock: (apiArticle.minStockLevel ?? article.minStock ?? "").toString(),
          costPrice: (apiArticle.purchasePrice ?? article.costPrice ?? "").toString(),
          sellPrice: sellPriceVal,
          tvaRate: tvaRateVal,
          sellPriceTTC: sellPriceTTC,
          supplier: apiArticle.supplier || "",
          locationId: locationId,
          groupId: groupId,
          subLocation: article.subLocation || "",
          unit: apiArticle.unit || article.unit || "piece",
          basePrice: basePriceVal,
          basePriceTTC: basePriceTTC,
          duration: article.duration?.toString() || "",
          skillsRequired: article.skillsRequired || [],
          materialsNeeded: article.materialsNeeded || [],
          preferredUsers: article.preferredUsers || [],
          tags: article.tags || [],
          notes: apiArticle.notes || ""
        });
      } catch (error) {
        console.error("Failed to fetch article:", error);
        toast({
          title: t('toast.error'),
          description: t('toast.load_error'),
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArticle();
  }, [id, toast, navigate]);

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const tva = parseFloat(String(updated.tvaRate)) || 0;
      
      if (field === 'sellPrice' || (field === 'tvaRate' && articleType === 'material')) {
        const ht = parseFloat(String(field === 'sellPrice' ? value : updated.sellPrice)) || 0;
        updated.sellPriceTTC = ht > 0 ? (ht * (1 + tva / 100)).toFixed(2) : "";
      }
      if (field === 'sellPriceTTC') {
        const ttc = parseFloat(String(value)) || 0;
        updated.sellPrice = ttc > 0 ? (ttc / (1 + tva / 100)).toFixed(2) : "";
      }
      if (field === 'basePrice' || (field === 'tvaRate' && articleType === 'service')) {
        const ht = parseFloat(String(field === 'basePrice' ? value : updated.basePrice)) || 0;
        updated.basePriceTTC = ht > 0 ? (ht * (1 + tva / 100)).toFixed(2) : "";
      }
      if (field === 'basePriceTTC') {
        const ttc = parseFloat(String(value)) || 0;
        updated.basePrice = ttc > 0 ? (ttc / (1 + tva / 100)).toFixed(2) : "";
      }
      
      return updated;
    });
  };

  // Helper functions for arrays
  const addToArray = (field: string, value: string, currentArray: string[]) => {
    if (!currentArray.includes(value)) {
      handleInputChange(field, [...currentArray, value]);
    }
  };

  const removeFromArray = (field: string, value: string, currentArray: string[]) => {
    handleInputChange(field, currentArray.filter(item => item !== value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSubmitting || !id) return;
    setIsSubmitting(true);
    
    try {
      const articleData = {
        id,
        name: formData.name,
        type: articleType,
        categoryId: formData.categoryId ? parseInt(formData.categoryId) : undefined,
        status: formData.status || 'active',
        description: formData.description || '',
        sku: formData.sku || undefined,
        stock: formData.stock ? (isDecimalUnit(formData.unit) ? parseFloat(String(formData.stock)) : parseInt(String(formData.stock))) : undefined,
        minStock: formData.minStock ? (isDecimalUnit(formData.unit) ? parseFloat(String(formData.minStock)) : parseInt(String(formData.minStock))) : undefined,
        costPrice: formData.costPrice ? parseFloat(String(formData.costPrice)) : undefined,
        sellPrice: formData.sellPrice ? parseFloat(String(formData.sellPrice)) : undefined,
        supplier: formData.supplier || undefined,
        locationId: formData.locationId ? parseInt(formData.locationId) : undefined,
        groupId: formData.groupId ? parseInt(formData.groupId) : undefined,
        subLocation: formData.subLocation || undefined,
        unit: formData.unit || 'piece',
        basePrice: formData.basePrice ? parseFloat(String(formData.basePrice)) : undefined,
        duration: formData.duration ? parseFloat(String(formData.duration)) : undefined,
        tvaRate: formData.tvaRate ? parseFloat(String(formData.tvaRate)) : 19,
        skillsRequired: formData.skillsRequired || [],
        materialsNeeded: formData.materialsNeeded || [],
        preferredUsers: formData.preferredUsers || [],
        tags: formData.tags || [],
        notes: formData.notes || '',
      };

      console.log("Updating article:", articleData);
      
      await articlesApi.update(id, articleData as any);
      
      toast({
        title: t('toast.success'),
        description: t('toast.update_success', { type: articleType === 'material' ? t('material') : t('service') }),
      });
      
      navigate("/dashboard/inventory-services");
    } catch (error: any) {
      console.error("Failed to update article:", error);
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.update_error', { type: articleType === 'material' ? t('material') : t('service') }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.categoryId && 
    (articleType === 'material' ? (formData.locationId && formData.sellPrice) : (formData.basePrice && formData.duration));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading article...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/inventory-services">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">Edit Article</h1>
            <p className="text-muted-foreground">Update {articleType} information</p>
          </div>
        </div>
      </div>

      {/* Article Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Article Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                articleType === 'material' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/20 hover:border-muted-foreground/40'
              }`} onClick={() => setArticleType('material')}>
                <Package className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-medium">Material</Label>
                <p className="text-sm text-muted-foreground">Physical items with stock tracking</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                articleType === 'service' 
                  ? 'border-primary bg-primary/10' 
                  : 'border-muted-foreground/20 hover:border-muted-foreground/40'
              }`} onClick={() => setArticleType('service')}>
                <Wrench className="h-6 w-6" />
              </div>
              <div>
                <Label className="text-base font-medium">Service</Label>
                <p className="text-sm text-muted-foreground">Services with duration and requirements</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Quick Edit Mode - Same structure as Add page */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {articleType === 'material' ? <Package className="h-5 w-5 text-primary" /> : <Wrench className="h-5 w-5 text-primary" />}
              {articleType === 'material' ? 'Material Information' : 'Service Information'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder={`Enter ${articleType} name`}
                  required
                />
              </div>
              {articleType === 'material' && (
                <div className="space-y-2">
                  <Label htmlFor="sku">SKU</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder="Enter SKU"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                placeholder={`Brief description of the ${articleType}`}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingCategories ? "Loading..." : "Select category"} />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {articleType === 'material' && (
                <div className="space-y-2">
                  <Label htmlFor="location">Location *</Label>
                  <Select value={formData.locationId} onValueChange={(value) => handleInputChange("locationId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingLocations ? "Loading..." : "Select location"} />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map((loc) => (
                        <SelectItem key={loc.id} value={loc.id}>
                          {loc.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="group">{t('addForm.group')}</Label>
                <Select value={formData.groupId} onValueChange={(value) => handleInputChange("groupId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingGroups ? t('addForm.loading') : t('addForm.select_group')} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((grp) => (
                      <SelectItem key={grp.id} value={grp.id}>
                        {grp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {articleType === 'material' ? (
              <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="unit">{t('addForm.unit')}</Label>
                  <Select value={formData.unit} onValueChange={(value) => handleInputChange("unit", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t('addForm.select_unit')} />
                    </SelectTrigger>
                    <SelectContent>
                      {UNIT_OPTIONS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {t(`units.${u.value}`, { defaultValue: u.labelEn })}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
                  <Label htmlFor="minStock">Min Stock</Label>
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
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="costPrice">Cost Price (TND)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    step="0.01"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange("costPrice", e.target.value)}
                    placeholder="0.00"
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sellPrice">Prix HT (TND) *</Label>
                  <Input
                    id="sellPrice"
                    type="number"
                    step="0.01"
                    value={formData.sellPrice}
                    onChange={(e) => handleInputChange("sellPrice", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvaRate">TVA (%)</Label>
                  <Input
                    id="tvaRate"
                    type="number"
                    step="0.01"
                    value={formData.tvaRate}
                    onChange={(e) => handleInputChange("tvaRate", e.target.value)}
                    placeholder="19"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2 col-span-2 lg:col-span-1">
                  <Label htmlFor="sellPriceTTC">Prix TTC</Label>
                  <Input
                    id="sellPriceTTC"
                    type="number"
                    step="0.01"
                    value={formData.sellPriceTTC}
                    onChange={(e) => handleInputChange("sellPriceTTC", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className="bg-muted/30"
                  />
                </div>
              </div>
              </>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basePrice">Prix HT (TND) *</Label>
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
                  <Label htmlFor="tvaRate">TVA (%)</Label>
                  <Input
                    id="tvaRate"
                    type="number"
                    step="0.01"
                    value={formData.tvaRate}
                    onChange={(e) => handleInputChange("tvaRate", e.target.value)}
                    placeholder="19"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="basePriceTTC">Prix TTC</Label>
                  <Input
                    id="basePriceTTC"
                    type="number"
                    step="0.01"
                    value={formData.basePriceTTC}
                    onChange={(e) => handleInputChange("basePriceTTC", e.target.value)}
                    placeholder="0.00"
                    min="0"
                    className="bg-muted/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (hours) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    step="0.1"
                    value={formData.duration}
                    onChange={(e) => handleInputChange("duration", e.target.value)}
                    placeholder="2"
                    min="0.1"
                    required
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Information Card */}
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {articleType === 'material' ? (
                      <>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="low_stock">Low Stock</SelectItem>
                        <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                        <SelectItem value="discontinued">Discontinued</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              {articleType === 'material' && (
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => handleInputChange("supplier", e.target.value)}
                    placeholder="Enter supplier name"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Additional notes..."
                rows={3}
              />
            </div>

            {/* Tags */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeFromArray('tags', tag, formData.tags)}
                      className="ml-1 hover:text-destructive"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a tag..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const value = (e.target as HTMLInputElement).value.trim();
                      if (value) {
                        addToArray('tags', value, formData.tags);
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button" asChild>
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
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditUnifiedArticle;
