import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, Save, Package, Loader2, CalendarIcon, Settings2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { CreateInstallationDto } from "../types";
import { installationsApi } from "@/services/api/installationsApi";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import CustomerSearch from "../../service-orders/components/CustomerSearch";
import { useInstallationCategories } from "@/modules/lookups/hooks/useLookups";
import { useActionLogger } from "@/hooks/useActionLogger";
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  type: string;
}

export default function CreateInstallation() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { t } = useTranslation('installations');
  const { logFormSubmit, logButtonClick } = useActionLogger('Installations');
  const { viewAll, targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  const [hasWarranty, setHasWarranty] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [warrantyFrom, setWarrantyFrom] = useState<Date | undefined>(undefined);
  const [warrantyTo, setWarrantyTo] = useState<Date | undefined>(undefined);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedType, setSelectedType] = useState<string>('external');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Load installation categories from lookups
  const { items: installationCategories, isLoading: loadingCategories } = useInstallationCategories();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<{name: string; model: string; manufacturer: string; serialNumber?: string; matricule?: string; category: string; type?: string; location?: {address?: string; city?: string; state?: string; country?: string; zipCode?: string}}>();

  // Set default type value
  useEffect(() => {
    if (selectedType) {
      setValue("type", selectedType);
    }
  }, [selectedType, setValue]);

  // Pre-select default installation category
  useEffect(() => {
    if (installationCategories.length > 0 && !selectedCategory) {
      const defaultCategory = installationCategories.find(c => c.isDefault);
      if (defaultCategory) {
        setSelectedCategory(defaultCategory.id);
        setValue("category", defaultCategory.value || defaultCategory.name);
      }
    }
  }, [installationCategories, selectedCategory, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: CreateInstallationDto) => {
      console.log('[CreateInstallation] Submitting data:', JSON.stringify(data, null, 2));
      return installationsApi.create(data);
    },
    onSuccess: (result) => {
      console.log('[CreateInstallation] Success:', result);
      // Log successful creation
      logFormSubmit('Create Installation', true, { 
        entityType: 'Installation', 
        entityId: result?.id,
        details: `Created installation: ${result?.name || 'Unknown'}`
      });
      // Invalidate installations query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast({
        title: t('installation_created'),
        description: t('installation_created_desc'),
      });
      navigate('/dashboard/field/installations');
    },
    onError: (error: any) => {
      console.error('[CreateInstallation] Error:', error);
      console.error('[CreateInstallation] Error response:', error.response?.data);
      console.error('[CreateInstallation] Error status:', error.response?.status);
      // Log failed creation
      logFormSubmit('Create Installation', false, { 
        entityType: 'Installation',
        details: `Failed to create installation: ${error.message || 'Unknown error'}`
      });
      const errorMessage = error.response?.data?.error?.message 
        || error.response?.data?.message 
        || error.message 
        || t('error_creating');
      toast({
        title: t('error_creating'),
        description: errorMessage,
        variant: "destructive"
      });
    }
  });

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const onSubmit = (data: {name: string; model: string; manufacturer: string; serialNumber?: string; matricule?: string; category: string; type?: string; location?: {address?: string; city?: string; state?: string; country?: string; zipCode?: string}}) => {
    if (isTenantRequired) {
      toast({ title: t('error_creating'), description: 'Please select a target company first.', variant: "destructive" });
      return;
    }
    if (!selectedCustomer) {
      toast({
        title: t('customer_required'),
        description: t('customer_required_desc'),
        variant: "destructive"
      });
      return;
    }
    
    // Build siteAddress from location fields if location is enabled
    let siteAddress: string | undefined;
    if (hasLocation && data.location) {
      const parts = [
        data.location.address,
        data.location.city,
        data.location.state,
        data.location.zipCode,
        data.location.country
      ].filter(Boolean);
      siteAddress = parts.join(', ');
    }

    // IMPORTANT: Backend stores timestamps as "timestamp with time zone" (timestamptz) and requires UTC.
    // If we send a date-only string (YYYY-MM-DD), .NET parses it as DateTimeKind.Unspecified and Npgsql rejects it.
    const toUtcIsoDate = (d: Date) => `${format(d, 'yyyy-MM-dd')}T00:00:00Z`;
    
    const installationDto: CreateInstallationDto = {
      contactId: selectedCustomer.id,
      name: data.name,
      model: data.model,
      manufacturer: data.manufacturer,
      serialNumber: data.serialNumber,
      matricule: data.matricule || undefined,
      category: data.category || 'general',
      status: 'active',
      type: data.type,
      installationType: data.type, // Backend expects installationType
      warranty: hasWarranty && warrantyFrom && warrantyTo ? {
        hasWarranty: true,
        warrantyFrom: toUtcIsoDate(warrantyFrom),
        warrantyTo: toUtcIsoDate(warrantyTo),
      } : { hasWarranty: false },
      siteAddress: siteAddress,
    };

    createMutation.mutate(installationDto);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/field/installations" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('back_to_installations')}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Package className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-medium">{t('add_new_installation')}</h1>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Tenant Selector for View All mode */}
          <TenantSelector value={targetTenantId} onChange={handleTenantChange} />

          {/* Installation Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t('installation_details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('installation_name')} *</Label>
                  <Input
                    id="name"
                    {...register("name", { required: "Installation name is required" })}
                    placeholder="e.g., Production Server Alpha"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="model">{t('model')} *</Label>
                  <Input
                    id="model"
                    {...register("model", { required: "Model is required" })}
                    placeholder="e.g., Dell PowerEdge R750"
                  />
                  {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">{t('manufacturer')} *</Label>
                  <Input
                    id="manufacturer"
                    {...register("manufacturer", { required: "Manufacturer is required" })}
                    placeholder="e.g., Dell Technologies"
                  />
                  {errors.manufacturer && <p className="text-sm text-destructive">{errors.manufacturer.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="type">{t('type')} *</Label>
                  <Select 
                    value={selectedType}
                    onValueChange={(value) => {
                      setSelectedType(value);
                      setValue("type", value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('select_type')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="external">{t('external')}</SelectItem>
                      <SelectItem value="internal">{t('internal')}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="category">{t('detail.category')} *</Label>
                    <Link 
                      to={`/dashboard/lookups?tab=installationCategories&returnUrl=${encodeURIComponent(currentPath)}`}
                      className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1 transition-colors"
                    >
                      <Settings2 className="h-3 w-3" />
                      {t('manage', 'Manage')}
                    </Link>
                  </div>
                  <Select 
                    value={selectedCategory}
                    onValueChange={(value) => {
                      setSelectedCategory(value);
                      const selectedItem = installationCategories.find(c => c.id === value);
                      setValue("category", selectedItem?.value || selectedItem?.name || value);
                    }}
                    disabled={loadingCategories}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={loadingCategories ? t('loading') : t('select_category')} />
                    </SelectTrigger>
                    <SelectContent>
                      {installationCategories.filter(c => c.isActive).map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="serialNumber">{t('serial_number')}</Label>
                  <Input
                    id="serialNumber"
                    {...register("serialNumber")}
                    placeholder="e.g., SN123456789"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="matricule">{t('matricule')}</Label>
                  <Input
                    id="matricule"
                    {...register("matricule")}
                    placeholder={t('placeholders.matricule')}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Assignment - Full Width */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t('customer_assignment')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <CustomerSearch 
                    onSelect={handleCustomerSelect}
                    selectedCustomer={selectedCustomer}
                  />
                </div>
                
                <div>
                  {selectedCustomer ? (
                    <div className="p-4 border rounded-lg bg-muted/50 h-full">
                      <p className="text-sm text-muted-foreground mb-2">{t('selected_customer')}</p>
                      <p className="font-semibold text-foreground text-lg">{selectedCustomer.name}</p>
                      {selectedCustomer.company && (
                        <p className="text-sm text-muted-foreground">{selectedCustomer.company}</p>
                      )}
                      {selectedCustomer.email && (
                        <p className="text-sm text-muted-foreground mt-1">{selectedCustomer.email}</p>
                      )}
                      {selectedCustomer.phone && (
                        <p className="text-sm text-muted-foreground">{selectedCustomer.phone}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-3">
                        {t('installation_will_be_assigned')}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 border border-warning/30 bg-warning/10 rounded-lg h-full flex items-center justify-center">
                      <p className="text-sm text-foreground text-center">
                        {t('please_select_customer')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t('location_information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasLocation"
                  checked={hasLocation}
                  onCheckedChange={setHasLocation}
                />
                <Label htmlFor="hasLocation">{t('add_location_information')}</Label>
              </div>

              {hasLocation && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="address">{t('address')}</Label>
                    <Input
                      id="address"
                      {...register("location.address")}
                      placeholder="e.g., 123 Main Street"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="city">{t('city')}</Label>
                      <Input
                        id="city"
                        {...register("location.city")}
                        placeholder="e.g., New York"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="state">{t('state_province')}</Label>
                      <Input
                        id="state"
                        {...register("location.state")}
                        placeholder="e.g., NY"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="country">{t('country')}</Label>
                      <Input
                        id="country"
                        {...register("location.country")}
                        placeholder="e.g., United States"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="zipCode">{t('zip_postal_code')}</Label>
                      <Input
                        id="zipCode"
                        {...register("location.zipCode")}
                        placeholder="e.g., 10001"
                      />
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Warranty Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-semibold">{t('warranty_information')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasWarranty"
                  checked={hasWarranty}
                  onCheckedChange={setHasWarranty}
                />
                <Label htmlFor="hasWarranty">{t('this_installation_has_warranty')}</Label>
              </div>

              {hasWarranty && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{t('warranty_start_date')} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !warrantyFrom && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {warrantyFrom ? format(warrantyFrom, "PPP") : <span>{t('pick_date')}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={warrantyFrom}
                          onSelect={setWarrantyFrom}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>{t('warranty_end_date')} *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !warrantyTo && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {warrantyTo ? format(warrantyTo, "PPP") : <span>{t('pick_date')}</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-50" align="start">
                        <Calendar
                          mode="single"
                          selected={warrantyTo}
                          onSelect={setWarrantyTo}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/dashboard/field/installations')}
            disabled={createMutation.isPending}
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            className="bg-primary text-white hover:bg-primary/90"
            disabled={createMutation.isPending}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('create_installation')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}