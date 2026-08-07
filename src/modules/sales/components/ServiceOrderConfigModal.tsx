import { useState, useEffect } from "react";
import { ContentSkeleton } from "@/components/ui/page-skeleton";
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
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Loader2, CalendarIcon, AlertTriangle, Building2, Zap } from "lucide-react";
import { Sale, SaleItem } from "../types";
import { installationsApi } from "@/services/api/installationsApi";
import { cn } from "@/lib/utils";

interface ServiceOrderConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sale: Sale;
  onConfirm: (config: ServiceOrderConfig) => void;
  onCancel: () => void;
}

export interface ServiceOrderConfig {
  priority: string;
  notes: string;
  startDate?: string;
  targetCompletionDate?: string;
  installationIds?: number[];
  itemInstallations?: Record<string, string>;
}

interface InstallationOption {
  id: string;
  name: string;
  address?: string;
  contactName?: string;
}

/**
 * Modal shown when workflow is active and sale status changes to "in_progress"
 * Allows user to configure service order details before auto-creation
 */
export function ServiceOrderConfigModal({
  open,
  onOpenChange,
  sale,
  onConfirm,
  onCancel,
}: ServiceOrderConfigModalProps) {
  const { t } = useTranslation('sales');
  const [isConfirming, setIsConfirming] = useState(false);
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

  // Fetch installations from API
  const { data: installationsData, isLoading: isLoadingInstallations } = useQuery({
    queryKey: ['installations-for-config'],
    queryFn: async () => {
      const response = await installationsApi.getAll({ pageSize: 200 });
      return response.installations.map(inst => ({
        id: String(inst.id),
        name: inst.name || `Installation #${inst.id}`,
        address: inst.siteAddress || inst.location?.address,
        contactName: inst.contact?.primaryContactName,
      })) as InstallationOption[];
    },
    enabled: open && itemsNeedingInstallation.length > 0,
    staleTime: 30000,
  });

  const installations = installationsData || [];

  // Check if all items needing installation have been assigned
  const allItemsAssigned = itemsNeedingInstallation.length === 0 || 
    itemsNeedingInstallation.every(item => itemInstallations[item.id || '']);

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
      setPriority(sale.priority || "medium");
    }
  }, [open, sale.priority]);

  const handleInstallationChange = (itemId: string, installationId: string) => {
    setItemInstallations(prev => ({
      ...prev,
      [itemId]: installationId,
    }));
  };

  const handleConfirm = async () => {
    // Check if all items needing installation have been assigned
    if (itemsNeedingInstallation.length > 0 && !allItemsAssigned) {
      return;
    }

    setIsConfirming(true);
    try {
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

      const config: ServiceOrderConfig = {
        priority,
        notes: notes || sale.description || sale.notes || "",
        startDate: startDate ? startDate.toISOString() : undefined,
        targetCompletionDate: targetDate ? targetDate.toISOString() : undefined,
        installationIds: allInstallationIds.length > 0 ? allInstallationIds : undefined,
        itemInstallations,
      };

      onConfirm(config);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-background border border-border max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                {t('serviceOrderConfig.title', 'Configure Service Order')}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {t('serviceOrderConfig.description', 'Set up the service order that will be created automatically by the workflow.')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">

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
          {itemsNeedingInstallation.length > 0 && (
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

          {/* Date Fields */}
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
                    {startDate ? format(startDate, "PPP") : t('convertDialog.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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
              <Label className="text-sm font-medium">{t('convertDialog.targetDate')}</Label>
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
                    {targetDate ? format(targetDate, "PPP") : t('convertDialog.pickDate')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
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

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">{t('convertDialog.notesLabel')}</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t('convertDialog.notesPlaceholder')}
              className="h-20 bg-background resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={isConfirming}
          >
            {t('cancel')}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isConfirming || (itemsNeedingInstallation.length > 0 && !allItemsAssigned)}
            className="gap-2"
          >
            {isConfirming ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('serviceOrderConfig.processing', 'Processing...')}
              </>
            ) : (
              <>
                <Wrench className="h-4 w-4" />
                {t('serviceOrderConfig.confirmAndProceed', 'Confirm & Proceed')}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
