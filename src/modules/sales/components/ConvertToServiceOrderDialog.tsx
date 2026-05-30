import { useState, useEffect } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, ArrowRight, X, Loader2, User, MapPin, CalendarIcon, CheckCircle2, ExternalLink, AlertTriangle, Building2 } from "lucide-react";
import { Sale, SaleItem } from "../types";
import { SalesService } from "../services/sales.service";
import { installationsApi } from "@/services/api/installationsApi";
import { serviceOrdersApi } from "@/services/api/serviceOrdersApi";
import { logServiceOrderActivity } from "@/services/activityLogger";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { appSettingsApi } from "@/services/api/appSettingsApi";

interface ConvertToServiceOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onConversionComplete?: (serviceOrderId: string) => void;
}

interface InstallationOption {
  id: string;
  name: string;
  address?: string;
  contactName?: string;
}

export function ConvertToServiceOrderDialog({
  open,
  onOpenChange,
  sale,
  onConversionComplete,
}: ConvertToServiceOrderDialogProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isConverting, setIsConverting] = useState(false);
  const [notes, setNotes] = useState("");
  const [priority, setPriority] = useState<string>(sale.priority || "medium");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  
  // Track installation assignments for service items without installations
  const [itemInstallations, setItemInstallations] = useState<Record<string, string>>({});

  // Get service items from sale
  const serviceItems = sale.items?.filter((item) => item.type === "service") || [];
  
  // Service items that need installation assignment
  const itemsNeedingInstallation = serviceItems.filter(item => !item.installationId);
  const itemsWithInstallation = serviceItems.filter(item => !!item.installationId);

  // Check if already converted
  const isAlreadyConverted = !!sale.convertedToServiceOrderId;

  // Fetch job conversion mode from app settings
  const { data: jobConversionMode } = useQuery({
    queryKey: ['appSetting', 'JobConversionMode'],
    queryFn: async () => {
      const value = await appSettingsApi.getSetting('JobConversionMode');
      return value || 'installation';
    },
    enabled: open && !isAlreadyConverted,
    staleTime: 30000,
    retry: 1,
  });

  // Fetch installations from API
  const { data: installationsData, isLoading: isLoadingInstallations, isError: isInstallationsError } = useQuery({
    queryKey: ['installations-for-conversion'],
    queryFn: async () => {
      const response = await installationsApi.getAll({ pageSize: 200 });
      return response.installations.map(inst => ({
        id: String(inst.id),
        name: inst.name || `Installation #${inst.id}`,
        address: inst.siteAddress || inst.location?.address,
        contactName: inst.contact?.primaryContactName,
      })) as InstallationOption[];
    },
    enabled: open && !isAlreadyConverted && itemsNeedingInstallation.length > 0,
    staleTime: 30000,
    retry: 1,
  });

  const installations = installationsData || [];

  // Check if all items needing installation have been assigned
  const allItemsAssigned = itemsNeedingInstallation.every(
    item => itemInstallations[item.id || '']
  );

  // Initialize notes from sale notes if available
  useEffect(() => {
    if (sale.notes && !notes) {
      setNotes(sale.notes);
    }
  }, [sale.notes]);

  // Reset item installations when dialog opens
  useEffect(() => {
    if (open) {
      setItemInstallations({});
    }
  }, [open]);

  const handleInstallationChange = (itemId: string, installationId: string) => {
    setItemInstallations(prev => ({
      ...prev,
      [itemId]: installationId,
    }));
  };

  const handleConvert = async () => {
    // If already converted, navigate to the service order
    if (isAlreadyConverted && sale.convertedToServiceOrderId) {
      navigate(`/dashboard/field/service-orders/${sale.convertedToServiceOrderId}`);
      onOpenChange(false);
      return;
    }

    // Check if all items needing installation have been assigned
    if (itemsNeedingInstallation.length > 0 && !allItemsAssigned) {
      toast.error(t('convertDialog.assignInstallationsError'));
      return;
    }

    try {
      setIsConverting(true);
      
      // Get installation IDs from both existing items and newly assigned ones
      const existingInstallationIds = itemsWithInstallation
        .filter((item) => item.installationId)
        .map((item) => parseInt(String(item.installationId), 10))
        .filter((id) => !isNaN(id));

      const assignedInstallationIds = Object.values(itemInstallations)
        .map(id => parseInt(id, 10))
        .filter(id => !isNaN(id));

      // Combine and deduplicate installation IDs
      const allInstallationIds = [...new Set([...existingInstallationIds, ...assignedInstallationIds])];

      const result = await SalesService.createServiceOrder(String(sale.id), {
        priority: priority,
        notes: notes || sale.description || sale.notes || "",
        startDate: startDate ? format(startDate, 'yyyy-MM-dd') : undefined,
        targetCompletionDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
        installationIds: allInstallationIds.length > 0 ? allInstallationIds : undefined,
        jobConversionMode: jobConversionMode || 'installation',
      });

      // Log the conversion activity on the Sale
      try {
        const saleId = typeof sale.id === 'string' ? parseInt(sale.id, 10) : Number(sale.id);
        const { salesApi } = await import('@/services/api/salesApi');
        await salesApi.addActivity(saleId, {
          type: 'converted_to_service_order',
          description: `Sale converted to Service Order #${result.serviceOrderId}`,
          details: `Service items: ${serviceItems.map(i => i.itemName).join(', ')}`,
        });
      } catch (activityError) {
        console.warn('Failed to log conversion activity on sale:', activityError);
      }

      // Log the creation activity on the Service Order
      try {
        const serviceOrderIdNum = typeof result.serviceOrderId === 'string' 
          ? parseInt(result.serviceOrderId, 10) 
          : Number(result.serviceOrderId);
        
        // Get current user name from localStorage
        let currentUserName = 'System';
        try {
          const userData = localStorage.getItem('user_data');
          if (userData) {
            const parsed = JSON.parse(userData);
            currentUserName = `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'User';
          }
        } catch {
          // ignore
        }
        
        // Log the "created from sale" activity
        await logServiceOrderActivity(serviceOrderIdNum, {
          type: 'created',
          userName: currentUserName,
          entityName: `Service Order created from Sale #${sale.id}`,
        });
        
        // If there are notes, log them as a separate note activity
        if (notes && notes.trim()) {
          await serviceOrdersApi.addNote(serviceOrderIdNum, {
            content: notes.trim(),
            type: 'internal',
          });
        }
      } catch (activityError) {
        console.warn('Failed to log creation activity on service order:', activityError);
      }

      onOpenChange(false);
      
      // Call the callback to refresh sale data - parent decides what to do
      if (onConversionComplete) {
        onConversionComplete(result.serviceOrderId);
      } else {
        // If no callback, navigate to the service order
        toast.success(t('convertDialog.serviceOrderCreated'));
        navigate(`/dashboard/field/service-orders/${result.serviceOrderId}`);
      }
    } catch (error) {
      console.error("Failed to create service order:", error);
      toast.error(error instanceof Error ? error.message : t('error', 'Failed to create service order'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleViewServiceOrder = () => {
    if (sale.convertedToServiceOrderId) {
      navigate(`/dashboard/field/service-orders/${sale.convertedToServiceOrderId}`);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-full ${isAlreadyConverted ? 'bg-primary/10' : 'bg-primary/10'}`}>
              {isAlreadyConverted ? (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              ) : (
                <Wrench className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-xl">
                {isAlreadyConverted ? t('convertDialog.titleConverted') : t('convertDialog.title')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {isAlreadyConverted 
                  ? t('convertDialog.descriptionConverted')
                  : t('convertDialog.description')
                }
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Already Converted Banner */}
          {isAlreadyConverted && (
            <div className="rounded-lg bg-primary/10 border border-primary/20 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-primary">
                    Service Order #{sale.convertedToServiceOrderId}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('convertDialog.createdFromSale')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewServiceOrder}
                  className="gap-2"
                >
                  {t('convertDialog.viewServiceOrder')}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          )}

          {/* Customer Information */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('convertDialog.customerInformation')}</Label>
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{sale.contactName || sale.customerName || "N/A"}</span>
                {sale.contactCompany && (
                  <span className="text-muted-foreground">• {sale.contactCompany}</span>
                )}
              </div>
              {(sale.contactEmail || sale.customerEmail) && (
                <p className="text-xs text-muted-foreground pl-6">
                  {sale.contactEmail || sale.customerEmail}
                </p>
              )}
              {(sale.customerAddress) && (
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 mt-0.5" />
                  <span>{sale.customerAddress}</span>
                </div>
              )}
            </div>
          </div>

          {/* Service Items with Installations */}
          {itemsWithInstallation.length > 0 && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t('convertDialog.serviceItemsWithInstallation')} ({itemsWithInstallation.length})</Label>
              <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2 max-h-32 overflow-y-auto">
                {itemsWithInstallation.map((item, index) => (
                  <div key={item.id || index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 shrink-0">
                        {t('service')}
                      </Badge>
                      <span className="font-medium truncate">{item.itemName}</span>
                      <span className="text-xs text-muted-foreground truncate">
                        @ {item.installationName || `Installation #${item.installationId}`}
                      </span>
                    </div>
                    <span className="text-muted-foreground shrink-0 ml-2">x{Number(item.quantity || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Items Needing Installation Assignment */}
          {!isAlreadyConverted && itemsNeedingInstallation.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Label className="text-sm font-medium">{t('convertDialog.assignInstallations')}</Label>
                <Badge variant="outline" className="text-xs bg-warning/10 text-warning border-warning/20">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {t('convertDialog.required')}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('convertDialog.installationExplanation')}
              </p>
              
              <div className="space-y-3">
                {itemsNeedingInstallation.map((item, index) => (
                  <div key={item.id || index} className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                          {t('service')}
                        </Badge>
                        <span className="font-medium text-sm">{item.itemName}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">x{Number(item.quantity || 0).toFixed(2)}</span>
                    </div>
                    
                    <Select 
                      value={itemInstallations[item.id || ''] || ''} 
                      onValueChange={(value) => handleInstallationChange(item.id || '', value)}
                    >
                      <SelectTrigger className="bg-background">
                        <SelectValue placeholder={isLoadingInstallations ? t('convertDialog.loadingInstallations') : t('convertDialog.selectInstallation')} />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border z-50 max-h-60">
                        {isLoadingInstallations ? (
                          <div className="flex items-center justify-center py-4">
                            <ContentSkeleton rows={2} className="p-0" />
                          </div>
                        ) : isInstallationsError ? (
                          <div className="py-4 px-2 text-center text-sm text-destructive">
                            {t('common.failedToLoad', 'Failed to load installations')}
                          </div>
                        ) : installations.length === 0 ? (
                          <div className="py-4 px-2 text-center text-sm text-muted-foreground">
                            {t('convertDialog.noInstallations')}
                          </div>
                        ) : (
                          installations.map((installation) => (
                            <SelectItem key={installation.id} value={installation.id}>
                              <div className="flex items-center gap-2">
                                <Building2 className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                <div className="flex flex-col">
                                  <span className="font-medium">{installation.name}</span>
                                  {installation.address && (
                                    <span className="text-xs text-muted-foreground">{installation.address}</span>
                                  )}
                                </div>
                              </div>
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration (only show if not converted) */}
          {!isAlreadyConverted && (
            <>
              {/* Priority */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">{t('convertDialog.priorityLabel')}</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder={t('convertDialog.selectPriority')} />
                  </SelectTrigger>
                  <SelectContent className="bg-background border border-border z-50">
                    <SelectItem value="low">{t('low')}</SelectItem>
                    <SelectItem value="medium">{t('medium')}</SelectItem>
                    <SelectItem value="high">{t('high')}</SelectItem>
                    <SelectItem value="urgent">{t('urgent')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('convertDialog.startDate')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !startDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ? format(startDate, "PPP") : <span>{t('convertDialog.selectDate', 'Select date')}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">{t('convertDialog.targetCompletion')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !targetDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {targetDate ? format(targetDate, "PPP") : <span>{t('convertDialog.selectDate', 'Select date')}</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-popover z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={targetDate}
                        onSelect={setTargetDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Notes Input */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium">
                  {t('convertDialog.notesLabel')}
                </Label>
                <Textarea
                  id="notes"
                  placeholder={t('convertDialog.notesPlaceholder')}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
              </div>
            </>
          )}

          {/* Info Box */}
          {!isAlreadyConverted && (
            <div className="rounded-lg bg-muted/50 border border-border p-3">
              <div className="flex items-start gap-2">
                <ArrowRight className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{t('convertDialog.infoTitle')}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('convertDialog.infoText')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isConverting}
          >
            <X className="h-4 w-4 mr-2" />
            {t('convertDialog.cancel')}
          </Button>
          
          {!isAlreadyConverted && (
            <Button
              type="button"
              onClick={handleConvert}
              disabled={isConverting || (itemsNeedingInstallation.length > 0 && !allItemsAssigned)}
              className="gap-2"
            >
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('convertDialog.creating')}
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  {t('convertDialog.createServiceOrder')}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
