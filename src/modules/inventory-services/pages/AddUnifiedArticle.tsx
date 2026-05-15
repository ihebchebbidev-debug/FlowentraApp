import { useState, useEffect } from "react";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { ArrowLeft, Save, Package, Wrench, Loader2, Settings2 } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
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

const AddUnifiedArticle = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation('inventory-services');
  const [articleType, setArticleType] = useState<'material' | 'service'>('material');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<LookupItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [groups, setGroups] = useState<LookupItem[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  
  const [formData, setFormData, clearFormData] = useFormPersistence('add-unified-article', {
    name: "",
    sku: "",
    description: "",
    categoryId: "",
    status: articleType === 'material' ? "available" : "active",
    
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
    duration: "120",
    skillsRequired: [] as string[],
    materialsNeeded: [] as string[],
    preferredUsers: [] as string[],
    
    // Common
    tags: [] as string[],
    notes: ""
  });

  // Load categories based on article type and pre-select
  // Logic: 1 item → select it, many items → select default or first
  useEffect(() => {
    const loadCategories = async () => {
      setLoadingCategories(true);
      try {
        const api = articleType === 'material' ? articleCategoriesApi : serviceCategoriesApi;
        const response = await api.getAll();
        const items = response.items || [];
        setCategories(items);
        
        // Auto-select logic: 1 item → select it, many → default or first
        if (items.length > 0) {
          let selectedId = '';
          if (items.length === 1) {
            selectedId = String(items[0].id);
          } else {
            const defaultItem = items.find(item => item.isDefault);
            selectedId = defaultItem ? String(defaultItem.id) : String(items[0].id);
          }
          setFormData(prev => ({ ...prev, categoryId: selectedId }));
        }
      } catch (error) {
        console.error('Failed to load categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();
  }, [articleType]);

  // Load locations for material type and pre-select
  // Logic: 1 item → select it, many items → select default or first
  useEffect(() => {
    const loadLocations = async () => {
      if (articleType !== 'material') return;
      setLoadingLocations(true);
      try {
        const response = await locationsApi.getAll();
        const items = response.items || [];
        setLocations(items);
        
        // Auto-select logic: 1 item → select it, many → default or first
        if (items.length > 0) {
          let selectedId = '';
          if (items.length === 1) {
            selectedId = String(items[0].id);
          } else {
            const defaultItem = items.find(item => item.isDefault);
            selectedId = defaultItem ? String(defaultItem.id) : String(items[0].id);
          }
          setFormData(prev => ({ ...prev, locationId: selectedId }));
        }
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

  const handleInputChange = (field: string, value: string | string[]) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      const tva = parseFloat(String(updated.tvaRate)) || 0;
      
      // Auto-calc sellPrice = costPrice, and TTC = costPrice * (1 + TVA/100)
      if (field === 'costPrice' || (field === 'tvaRate' && articleType === 'material')) {
        const cost = parseFloat(String(field === 'costPrice' ? value : updated.costPrice)) || 0;
        updated.sellPrice = cost > 0 ? cost.toFixed(2) : "";
        updated.sellPriceTTC = cost > 0 ? (cost * (1 + tva / 100)).toFixed(2) : "";
      }
      if (field === 'sellPriceTTC') {
        const ttc = parseFloat(String(value)) || 0;
        const cost = ttc > 0 ? (ttc / (1 + tva / 100)).toFixed(2) : "";
        updated.sellPrice = cost;
        updated.costPrice = cost;
      }
      
      // Auto-calc TTC when HT or TVA changes (service)
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

  const handleTypeChange = (type: 'material' | 'service') => {
    setArticleType(type);
    setFormData(prev => ({
      ...prev,
      status: type === 'material' ? "available" : "active",
      categoryId: "" // Reset category when type changes
    }));
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
    
    // Prevent double submission
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    try {
      // Import the real API and call it
      const { articlesApi } = await import('@/services/api/articlesApi');
      
      const articleData = {
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

      console.log("Submitting article to API:", articleData);
      
      const result = await articlesApi.create(articleData as any);
      console.log("Article created successfully:", result);
      
      toast({
        title: t('toast.success'),
        description: t('toast.add_success', { type: articleType === 'material' ? t('material') : t('service') }),
      });
      
      clearFormData();
      navigate("/dashboard/inventory-services");
    } catch (error: any) {
      console.error("Failed to create article:", error);
      toast({
        title: t('toast.error'),
        description: error.message || t('toast.add_error', { type: articleType === 'material' ? t('material') : t('service') }),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.name && formData.categoryId && 
    (articleType === 'material' ? (formData.locationId && formData.costPrice) : (formData.basePrice && formData.duration));

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/inventory-services">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {t('addForm.back_to_articles')}
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">{t('addForm.add_new_article')}</h1>
            <p className="text-muted-foreground">{t('addForm.create_new_subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Article Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t('addForm.article_type')}</CardTitle>
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
                <Label className="text-base font-medium">{t('addForm.material_label')}</Label>
                <p className="text-sm text-muted-foreground">{t('addForm.material_description')}</p>
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
                <Label className="text-base font-medium">{t('addForm.service_label')}</Label>
                <p className="text-sm text-muted-foreground">{t('addForm.service_description')}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="shadow-card border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {articleType === 'material' ? <Package className="h-5 w-5 text-primary" /> : <Wrench className="h-5 w-5 text-primary" />}
              {articleType === 'material' ? t('addForm.material_information') : t('addForm.service_information')}
            </CardTitle>
          </CardHeader>
            <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('addForm.name')} *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder={t('addForm.name_placeholder', { type: articleType === 'material' ? t('material') : t('service') })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="sku">{t('addForm.sku')}</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) => handleInputChange("sku", e.target.value)}
                    placeholder={t('addForm.sku_placeholder')}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('addForm.description')}</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange("description", e.target.value)}
                  placeholder={t('addForm.description_placeholder', { type: articleType === 'material' ? t('material') : t('service') })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">{t('addForm.category')} *</Label>
                    <Link 
                      to={`/dashboard/lookups?tab=${articleType === 'material' ? 'articleCategories' : 'serviceCategories'}&returnUrl=${encodeURIComponent(location.pathname)}`}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Settings2 className="h-3 w-3" />
                      {t('addForm.manage')}
                    </Link>
                  </div>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? t('addForm.loading') : t('addForm.select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={String(cat.id)} value={String(cat.id)}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {articleType === 'material' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="location">{t('addForm.location')} *</Label>
                      <Link 
                        to={`/dashboard/lookups?tab=locations&returnUrl=${encodeURIComponent(location.pathname)}`}
                        className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                      >
                        <Settings2 className="h-3 w-3" />
                        {t('addForm.manage')}
                      </Link>
                    </div>
                    <Select value={formData.locationId} onValueChange={(value) => handleInputChange("locationId", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder={loadingLocations ? t('addForm.loading') : t('addForm.select_location')} />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={String(loc.id)} value={String(loc.id)}>
                            {loc.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="group">{t('addForm.group')}</Label>
                  <Link 
                    to={`/dashboard/lookups?tab=articleGroups&returnUrl=${encodeURIComponent(location.pathname)}`}
                    className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                  >
                    <Settings2 className="h-3 w-3" />
                    {t('addForm.manage')}
                  </Link>
                </div>
                <Select value={formData.groupId} onValueChange={(value) => handleInputChange("groupId", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={loadingGroups ? t('addForm.loading') : t('addForm.select_group')} />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((grp) => (
                      <SelectItem key={String(grp.id)} value={String(grp.id)}>
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
                    <Label htmlFor="stock">{t('addForm.current_stock')}</Label>
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
                    <Label htmlFor="minStock">{t('addForm.min_stock')}</Label>
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
                    <Label htmlFor="costPrice">{t('addForm.cost_price')} *</Label>
                    <Input
                      id="costPrice"
                      type="number"
                      step="0.01"
                      value={formData.costPrice}
                      onChange={(e) => handleInputChange("costPrice", e.target.value)}
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
                    <Label htmlFor="sellPriceTTC">Prix de Vente TTC</Label>
                    <Input
                      id="sellPriceTTC"
                      type="number"
                      step="0.01"
                      value={formData.sellPriceTTC}
                      onChange={(e) => handleInputChange("sellPriceTTC", e.target.value)}
                      placeholder="0.00"
                      min="0"
                      readOnly
                      className="bg-muted/30"
                    />
                  </div>
                </div>
                </>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="basePrice">{t('addForm.price') || 'Prix HT'} *</Label>
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
                    <Label htmlFor="duration">{t('addForm.duration')} *</Label>
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

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-end gap-3">
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link to="/dashboard/inventory-services">{t('addForm.cancel')}</Link>
          </Button>
          <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full sm:w-auto">
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('addForm.saving')}
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                {articleType === 'material' ? t('addForm.save_material') : t('addForm.save_service')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default AddUnifiedArticle;