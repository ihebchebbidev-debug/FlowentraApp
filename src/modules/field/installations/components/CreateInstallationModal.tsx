import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Save, Package, Loader2, Settings2 } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { CreateInstallationDto, InstallationDto } from "../types";
import { installationsApi } from "@/services/api/installationsApi";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import CustomerSearch from "../../service-orders/components/CustomerSearch";
import { useInstallationCategories } from "@/modules/lookups/hooks/useLookups";
import { format } from "date-fns";

interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: string;
  type: string;
}

interface CreateInstallationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInstallationCreated: (installation: InstallationDto) => void;
  preselectedContactId?: number;
}

interface FormData {
  name: string;
  model: string;
  manufacturer: string;
  serialNumber?: string;
  matricule?: string;
  category: string;
  type?: string;
  location?: {
    address?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

export function CreateInstallationModal({ 
  open, 
  onOpenChange, 
  onInstallationCreated,
  preselectedContactId 
}: CreateInstallationModalProps) {
  const { t } = useTranslation('installations');
  const location = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Build returnUrl for lookups navigation
  const currentPath = location.pathname;
  const [hasWarranty, setHasWarranty] = useState(false);
  const [hasLocation, setHasLocation] = useState(false);
  const [warrantyFrom, setWarrantyFrom] = useState('');
  const [warrantyTo, setWarrantyTo] = useState('');
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
    reset
  } = useForm<FormData>();

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

  // Create mutation for API call
  const createMutation = useMutation({
    mutationFn: async (data: CreateInstallationDto) => {
      return installationsApi.create(data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['installations'] });
      toast({
        title: t('installation_created'),
        description: t('installation_created_desc'),
      });
      onInstallationCreated(result);
      handleClose();
    },
    onError: (error: any) => {
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

  const onSubmit = (data: FormData) => {
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

    // Format dates properly for backend
    const toUtcIsoDate = (dateStr: string) => `${dateStr}T00:00:00Z`;
    
    const installationDto: CreateInstallationDto = {
      contactId: selectedCustomer.id,
      name: data.name,
      model: data.model,
      manufacturer: data.manufacturer,
      serialNumber: data.serialNumber,
      matricule: data.matricule,
      category: data.category || 'general',
      status: 'active',
      type: data.type,
      installationType: data.type,
      warranty: hasWarranty && warrantyFrom && warrantyTo ? {
        hasWarranty: true,
        warrantyFrom: toUtcIsoDate(warrantyFrom),
        warrantyTo: toUtcIsoDate(warrantyTo),
      } : { hasWarranty: false },
      siteAddress: siteAddress,
    };

    createMutation.mutate(installationDto);
  };

  const handleClose = () => {
    reset();
    setSelectedCustomer(null);
    setHasWarranty(false);
    setHasLocation(false);
    setWarrantyFrom('');
    setWarrantyTo('');
    setSelectedType('external');
    setSelectedCategory('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('create.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={(e) => { e.stopPropagation(); handleSubmit(onSubmit)(e); }} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Form */}
            <div className="lg:col-span-2 space-y-6">
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
                        {...register("name", { required: t('validation.name_required') })}
                        placeholder={t('placeholders.name')}
                      />
                      {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="model">{t('model')} *</Label>
                      <Input
                        id="model"
                        {...register("model", { required: t('validation.model_required') })}
                        placeholder={t('placeholders.model')}
                      />
                      {errors.model && <p className="text-sm text-destructive">{errors.model.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="manufacturer">{t('manufacturer')} *</Label>
                      <Input
                        id="manufacturer"
                        {...register("manufacturer", { required: t('validation.manufacturer_required') })}
                        placeholder={t('placeholders.manufacturer')}
                      />
                      {errors.manufacturer && <p className="text-sm text-destructive">{errors.manufacturer.message}</p>}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="serialNumber">{t('serial_number')}</Label>
                      <Input
                        id="serialNumber"
                        {...register("serialNumber")}
                        placeholder={t('placeholders.serial_number')}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="matricule">{t('matricule')}</Label>
                      <Input
                        id="matricule"
                        {...register("matricule")}
                        placeholder={t('placeholders.matricule')}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="internal">{t('internal_sold')}</SelectItem>
                          <SelectItem value="external">{t('external_owned')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

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
                      {loadingCategories ? (
                        <div className="flex items-center gap-2 h-10 px-3 border rounded-md">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">{t('loading')}</span>
                        </div>
                      ) : (
                        <Select 
                          value={selectedCategory} 
                          onValueChange={(value) => {
                            setSelectedCategory(value);
                            const cat = installationCategories.find(c => c.id === value);
                            setValue("category", cat?.value || cat?.name || value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t('select_category')} />
                          </SelectTrigger>
                          <SelectContent>
                            {installationCategories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {t(`categories.${cat.name.toLowerCase().replace(/\s+/g, '_')}`, cat.name)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                          placeholder={t('placeholders.address')}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">{t('city')}</Label>
                          <Input
                            id="city"
                            {...register("location.city")}
                            placeholder={t('placeholders.city')}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state">{t('state_province')}</Label>
                          <Input
                            id="state"
                            {...register("location.state")}
                            placeholder={t('placeholders.state')}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="country">{t('country')}</Label>
                          <Input
                            id="country"
                            {...register("location.country")}
                            placeholder={t('placeholders.country')}
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="zipCode">{t('zip_postal_code')}</Label>
                          <Input
                            id="zipCode"
                            {...register("location.zipCode")}
                            placeholder={t('placeholders.zip_code')}
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
                        <Label htmlFor="warrantyFrom">{t('warranty_start_date')} *</Label>
                        <Input
                          id="warrantyFrom"
                          type="date"
                          value={warrantyFrom}
                          onChange={(e) => setWarrantyFrom(e.target.value)}
                          required={hasWarranty}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="warrantyTo">{t('warranty_end_date')} *</Label>
                        <Input
                          id="warrantyTo"
                          type="date"
                          value={warrantyTo}
                          onChange={(e) => setWarrantyTo(e.target.value)}
                          required={hasWarranty}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Customer Information Sidebar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">{t('customer_assignment')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CustomerSearch 
                    onSelect={handleCustomerSelect}
                    selectedCustomer={selectedCustomer}
                  />
                  
                  {selectedCustomer && (
                    <div className="mt-4 text-sm text-muted-foreground">
                      {t('installation_will_be_assigned')}
                    </div>
                  )}
                  
                  {!selectedCustomer && (
                    <div className="mt-4 p-3 border border-warning/20 bg-warning/10 rounded-lg">
                      <p className="text-sm text-foreground">
                        {t('please_select_customer')}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
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
                  {t('create.creating')}
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
      </DialogContent>
    </Dialog>
  );
}
