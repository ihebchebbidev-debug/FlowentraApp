import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Package, Users, Loader2 } from "lucide-react";
import { UpdateInstallationDto, InstallationDto } from "../types";
import { useToast } from "@/hooks/use-toast";
import { installationsApi } from "@/services/api/installationsApi";
import { useMutation, useQuery } from "@tanstack/react-query";
import CustomerSearch from "../../service-orders/components/CustomerSearch";
import { contactsApi } from "@/services/api/contactsApi";
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

export default function EditInstallation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation('installations');
  const { logFormSubmit } = useActionLogger('Installations');
  const [hasWarranty, setHasWarranty] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const { viewAll, targetTenantId, handleTenantChange } = useTargetTenant();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<Partial<UpdateInstallationDto>>();

  const { data: installation, isLoading } = useQuery({
    queryKey: ['installation', id],
    queryFn: () => installationsApi.getById(id!),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: UpdateInstallationDto) => installationsApi.update(id!, data),
    onSuccess: () => {
      // Log successful update
      logFormSubmit('Edit Installation', true, { 
        entityType: 'Installation', 
        entityId: id,
        details: `Updated installation: ${installation?.name || id}`
      });
      toast({
        title: t('installation_updated'),
        description: t('installation_updated_desc'),
      });
      navigate(`/dashboard/field/installations/${id}`);
    },
    onError: (error: any) => {
      // Log failed update
      logFormSubmit('Edit Installation', false, { 
        entityType: 'Installation', 
        entityId: id,
        details: `Failed to update installation: ${error.message || 'Unknown error'}`
      });
      toast({
        title: t('error_updating'),
        description: error.response?.data?.error?.message || t('error_updating'),
        variant: "destructive"
      });
    }
  });

  // Fetch the contact details when installation loads
  useEffect(() => {
    const loadContactDetails = async () => {
      if (installation?.contactId) {
        try {
          const contact = await contactsApi.getById(installation.contactId);
          setSelectedCustomer({
            id: contact.id,
            name: contact.name || contact.company || `Contact #${contact.id}`,
            email: contact.email || '',
            phone: contact.phone || '',
            company: contact.company || '',
            status: contact.status || 'active',
            type: contact.type || 'customer'
          });
        } catch (error) {
          console.error('Failed to fetch contact details:', error);
          // Fallback to basic info
          setSelectedCustomer({
            id: installation.contactId,
            name: installation.contact?.primaryContactName || `Contact #${installation.contactId}`,
            email: installation.contact?.primaryContactEmail || '',
            phone: installation.contact?.primaryContactPhone || '',
            company: '',
            status: 'active',
            type: 'customer'
          });
        }
      }
    };

    if (installation) {
      reset({
        name: installation.name,
        model: installation.model,
        manufacturer: installation.manufacturer,
        serialNumber: installation.serialNumber,
        matricule: installation.matricule,
        category: installation.category,
        type: installation.type,
        status: installation.status,
        warranty: installation.warranty,
        location: installation.location,
      });
      setHasWarranty(installation.warranty?.hasWarranty || false);
      loadContactDetails();
    }
  }, [installation, reset]);

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);
    setValue('contactId', customer.id);
  };

  const onSubmit = (data: Partial<UpdateInstallationDto>) => {
    // Include contactId if customer was changed
    const updateData: UpdateInstallationDto = {
      ...data,
      contactId: selectedCustomer?.id
    };
    updateMutation.mutate(updateData);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6 animate-pulse">
        <div className="h-7 w-48 bg-muted rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-muted/60 rounded-lg" />
          ))}
        </div>
        <div className="h-48 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  if (!installation) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('installation_not_found')}</h1>
          <Button onClick={() => navigate('/dashboard/field/installations')}>
            {t('back_to_installations')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(`/dashboard/field/installations/${id}`)}>
          <ArrowLeft className="h-4 w-4" />
          {t('back_to_details')}
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{t('edit_installation')}</h1>
          <p className="text-muted-foreground">{t('update_installation')}: {installation.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Tenant Selector for View All mode (read-only for edit) */}
        <TenantSelector value={targetTenantId} onChange={handleTenantChange} readOnly />

        {/* Installation Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t('installation_details')}
            </CardTitle>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">{t('type')} *</Label>
                <Select onValueChange={(value) => setValue("type", value)} defaultValue={installation.type}>
                  <SelectTrigger>
                    <SelectValue placeholder={t('select_type')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="internal">{t('internal_sold')}</SelectItem>
                    <SelectItem value="external">{t('external_owned')}</SelectItem>
                  </SelectContent>
                </Select>
                {errors.type && <p className="text-sm text-destructive">{errors.type.message}</p>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Assigned Customer - Full Width */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              {t('assigned_customer')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerSearch 
              onSelect={handleCustomerSelect}
              selectedCustomer={selectedCustomer}
            />
            
            {!selectedCustomer && (
              <div className="mt-4 p-3 border border-warning/30 bg-warning/10 rounded-lg">
                <p className="text-sm text-foreground">
                  {t('please_select_customer')}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Warranty Information */}
        <Card>
          <CardHeader>
            <CardTitle>{t('warranty_information')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="hasWarranty"
                checked={hasWarranty}
                onCheckedChange={(checked) => {
                  setHasWarranty(checked);
                  setValue("warranty", { ...installation.warranty, hasWarranty: checked });
                }}
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
                    defaultValue={installation.warranty?.warrantyFrom?.split('T')[0]}
                    onChange={(e) => setValue("warranty", { 
                      ...installation.warranty, 
                      hasWarranty,
                      warrantyFrom: e.target.value 
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="warrantyTo">{t('warranty_end_date')} *</Label>
                  <Input
                    id="warrantyTo"
                    type="date"
                    defaultValue={installation.warranty?.warrantyTo?.split('T')[0]}
                    onChange={(e) => setValue("warranty", { 
                      ...installation.warranty,
                      hasWarranty,
                      warrantyTo: e.target.value 
                    })}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate(`/dashboard/field/installations/${id}`)}
            disabled={updateMutation.isPending}
          >
            {t('cancel')}
          </Button>
          <Button 
            type="submit" 
            className="bg-primary text-white hover:bg-primary/90"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('saving')}
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                {t('save_changes')}
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
