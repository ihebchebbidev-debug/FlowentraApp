import { useState, useEffect } from "react";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Edit,
  Trash2,
  FileDown,
  Send,
  TrendingUp,
  AlertCircle,
  FileText,
  ExternalLink,
  Wrench,
  CheckCircle,
  Zap,
  Info,
  MoreVertical,
  LayoutDashboard,
  Package,
  CreditCard,
  StickyNote,
  CheckSquare,
  FolderOpen,
} from "lucide-react";

import { Sale } from "../types";
import { SalesService } from "../services/sales.service";
import { useSkipServiceOrder } from "../hooks/useSkipServiceOrder";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { toast } from "sonner";
import { SalePDFPreviewModal } from "./SalePDFPreviewModal";
import { ConvertToServiceOrderDialog } from "./ConvertToServiceOrderDialog";
import { SaleStatusFlow, SaleStatus } from "./SaleStatusFlow";
import { ServiceOrderConfig } from "./ServiceOrderConfigModal";
import { SendSaleModal } from "./SendSaleModal";
import { useWorkflowStatus } from "@/modules/workflow/hooks/useWorkflowStatus";
import { getStatusColorClass } from "@/config/entity-statuses";

// Import tab components
import { OverviewTab } from "./tabs/OverviewTab";
import { ItemsTab } from "./tabs/ItemsTab";
import { NotesTab } from "./tabs/NotesTab";
import { ChecklistsTab } from "./tabs/ChecklistsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { PaymentsTab } from "@/modules/payments/components/PaymentsTab";
import { EditableEntityNumber } from "@/components/shared/EditableEntityNumber";
import { salesApi } from "@/services/api/salesApi";
import { checkDuplicateDocumentNumber } from "@/services/documentNumberValidator";
import { CompanyBadge } from "@/components/CompanyBadge";
import { TenantSelector } from "@/components/TenantSelector";


export function SaleDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { format: formatCurrency } = useCurrency();
  const { isMobile } = useLayoutModeContext();
  const workflowStatus = useWorkflowStatus();
  const [sale, setSale] = useState<Sale | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showServiceOrderDialog, setShowServiceOrderDialog] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [hasShownAutoPrompt, setHasShownAutoPrompt] = useState(false);

  // Check if sale has service items and conversion status
  const hasServiceItems = sale?.items?.some((item) => item.type === "service") || false;
  const isAlreadyConverted = !!sale?.convertedToServiceOrderId;
  const { skip: skipServiceOrder, setSkip: setSkipServiceOrder } = useSkipServiceOrder(id);

  const fetchSale = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const saleData = await SalesService.getSaleById(id);
      setSale(saleData);
    } catch (error) {
      console.error('Failed to fetch sale:', error);
      toast.error("Failed to load sale details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSale();
  }, [id]);

  // Callback to refresh sale data after conversion
  const handleConversionComplete = async (serviceOrderId: string) => {
    fetchSale();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <div className="w-6 h-6 rounded-lg bg-primary/20 animate-pulse" />
            </div>
            <div className="absolute inset-0 rounded-xl bg-primary/5 animate-ping" style={{ animationDuration: '1.5s' }} />
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-1 w-32 bg-muted rounded-full overflow-hidden">
              <div className="h-full w-1/2 bg-primary/60 rounded-full animate-[shimmer_1.2s_ease-in-out_infinite]"
                style={{ transform: 'translateX(-100%)', animation: 'shimmer 1.2s ease-in-out infinite' }} />
            </div>
            <p className="text-sm text-muted-foreground mt-2">{t('detail.loadingSale')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!sale) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-semibold text-foreground mb-2">{t('detail.saleNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{t('detail.saleNotFoundDescription', { id })}</p>
        <Button onClick={() => navigate('/dashboard/sales')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          {t('backToSales')}
        </Button>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    return getStatusColorClass('sale', status);
  };

  const handleSendSaleSuccess = () => {
    // Status update can be added here if needed
    toast.success(t('detail.saleSent'));
  };

  const handleSendInvoice = () => {
    toast.success(t('detail.invoiceSent'));
  };

  const handleDownloadPDF = () => {
    setIsPDFModalOpen(true);
  };

  const handleEditSale = () => {
    navigate(`/dashboard/sales/${id}/edit`);
  };

  const handleDeleteSale = () => {
    toast.success(t('detail.saleDeleted'));
    navigate('/dashboard/sales');
  };

  const handleConvertToServiceOrder = () => {
    setShowServiceOrderDialog(true);
  };

  const handleStatusChange = async (newStatus: SaleStatus, serviceOrderConfig?: ServiceOrderConfig) => {
    if (!sale || !id) return;
    const oldStatus = sale.status;
    setIsStatusUpdating(true);
    try {
      // If we have a service order config (from workflow modal), include it in the update
      // so the backend knows the configuration for auto-creation
      const updateData: any = { status: newStatus as any };

      if (serviceOrderConfig) {
        updateData.serviceOrderConfig = serviceOrderConfig;
      }

      await SalesService.updateSale(id, updateData);

      // Log activity in the sale
      const { salesApi } = await import('@/services/api/salesApi');
      const saleId = parseInt(id, 10);
      if (!isNaN(saleId)) {
        await salesApi.addActivity(saleId, {
          type: 'status_changed',
          description: `Status changed from "${oldStatus}" to "${newStatus}"`,
          details: serviceOrderConfig
            ? `Sale status updated with service order config (Priority: ${serviceOrderConfig.priority})`
            : `Sale status updated on ${new Date().toLocaleDateString()}`,
        });
      }

      // If sale was converted from an offer, log activity in the offer too
      if (sale.offerId) {
        try {
          const { offersApi } = await import('@/services/api/offersApi');
          const offerId = parseInt(sale.offerId, 10);
          if (!isNaN(offerId)) {
            await offersApi.addActivity(offerId, {
              type: 'sale_status_changed',
              description: `Related Sale status changed from "${oldStatus}" to "${newStatus}"`,
              details: `Sale #${sale.saleNumber || sale.id} status was updated`,
            });
          }
        } catch (offerActivityError) {
          console.warn('Failed to log activity in related offer:', offerActivityError);
        }
      }

      toast.success(t('sales:statusFlow.statusUpdated'));

      // Show additional toast if service order was auto-created
      if (serviceOrderConfig && workflowStatus.isActive) {
        toast.info(t('sales:serviceOrderAutoCreated', 'Service order is being created automatically...'));
      }

      fetchSale();
    } catch (error) {
      console.error('Failed to update sale status:', error);
      toast.error(t('sales:error'));
    } finally {
      setIsStatusUpdating(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        {/* Mobile Header */}
        <div className="md:hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/sales')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('detail.back')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-background/95 backdrop-blur-sm border border-border/50">
                <DropdownMenuItem onClick={handleDownloadPDF} className="gap-2">
                  <FileDown className="h-4 w-4" />
                  {t('detail.downloadPdf')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSendInvoice} className="gap-2">
                  <Send className="h-4 w-4" />
                  {t('detail.sendInvoice')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDeleteSale} className="gap-2 text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {t('deleteSale')}
                </DropdownMenuItem>
                {hasServiceItems && (
                  <>
                    <DropdownMenuSeparator />
                    {!isAlreadyConverted ? (
                      <>
                        <DropdownMenuItem onClick={handleConvertToServiceOrder} className="gap-2 text-primary">
                          <Wrench className="h-4 w-4" />
                          {skipServiceOrder
                            ? t('detail.convertAnyway', 'Convert anyway')
                            : t('detail.convertToServiceOrder')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const next = !skipServiceOrder;
                            setSkipServiceOrder(next);
                            toast.success(
                              next
                                ? t('detail.skipServiceOrderEnabled', 'This sale will stay in Sales only')
                                : t('detail.skipServiceOrderDisabled', 'Service Order conversion re-enabled')
                            );
                          }}
                          className="gap-2"
                        >
                          <CheckCircle className="h-4 w-4" />
                          {skipServiceOrder
                            ? t('detail.enableServiceOrder', 'Enable Service Order conversion')
                            : t('detail.skipServiceOrder', 'Keep in Sales only (skip Service Order)')}
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => navigate(`/dashboard/field/service-orders/${sale.convertedToServiceOrderId}`)}
                        className="gap-2 text-success"
                      >
                        <Wrench className="h-4 w-4" />
                        {t('detail.viewServiceOrder')}
                      </DropdownMenuItem>
                    )}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="p-4 space-y-3">
            <div className="flex-1 min-w-0">
              <EditableEntityNumber
                value={sale.saleNumber || sale.title}
                onSave={async (newValue) => {
                  await salesApi.update(Number(sale.id), { saleNumber: newValue });
                  setSale({ ...sale, saleNumber: newValue });
                }}
                validate={async (newValue) => {
                  const result = await checkDuplicateDocumentNumber(newValue, 'sale', sale.id);
                  return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                }}
                className="text-xl font-bold"
              />
              <p className="text-lg font-semibold text-primary mb-2">
                {(() => {
                  const subtotal = sale.items?.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0) || 0;
                  const discountAmt = (sale.discount ?? 0) > 0
                    ? (sale.discountType === 'percentage'
                      ? subtotal * ((sale.discount ?? 0) / 100)
                      : (sale.discount ?? 0))
                    : 0;
                  const afterDiscount = subtotal - discountAmt;
                  const tax = (sale.taxes ?? 0) > 0
                    ? (sale.taxType === 'percentage'
                      ? afterDiscount * ((sale.taxes ?? 0) / 100)
                      : (sale.taxes ?? 0))
                    : 0;
                  const fiscalStampAmt = sale.fiscalStamp ?? 0;
                  const totalWithTax = afterDiscount + tax + fiscalStampAmt;
                  return formatCurrency(sale.totalAmount || totalWithTax);
                })()}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <CompanyBadge tenantId={(sale as any)?.tenantId} />
                <TenantSelector value={(sale as any)?.tenantId} readOnly compact onChange={() => {}} />
                {sale.convertedToServiceOrderId && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/dashboard/field/service-orders/${sale.convertedToServiceOrderId}`)}
                    className="gap-1 text-xs h-6 px-2 text-muted-foreground hover:text-primary"
                  >
                    <Wrench className="h-3 w-3" />
                    {t('viewServiceOrder')} #{sale.convertedToServiceOrderId}
                  </Button>
                )}
              </div>
            </div>
            {/* Status flow below title/amount on mobile */}
            <div className="flex justify-start">
              <SaleStatusFlow
                currentStatus={sale.status}
                onStatusChange={handleStatusChange}
                sale={sale}
                isUpdating={isStatusUpdating}
              />
            </div>
          </div>
        </div>

        {/* Desktop Header - Compact Card Style */}
        <div className="hidden md:block p-4 lg:p-6 space-y-3">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/sales')}
              className="h-9 w-9 shrink-0 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Sale Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Title */}
                  <div className="flex items-center gap-6 min-w-0">
                    <EditableEntityNumber
                      value={sale.saleNumber || sale.title}
                      onSave={async (newValue) => {
                        await salesApi.update(Number(sale.id), { saleNumber: newValue });
                        setSale({ ...sale, saleNumber: newValue });
                      }}
                      validate={async (newValue) => {
                        const result = await checkDuplicateDocumentNumber(newValue, 'sale', sale.id);
                        return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                      }}
                    />
                    <CompanyBadge tenantId={(sale as any)?.tenantId} />
                    <TenantSelector value={(sale as any)?.tenantId} readOnly compact onChange={() => {}} />
                  </div>

                  {/* Right: Actions only – status pipeline moved below */}
                  <div className="flex items-center gap-4 shrink-0">


                    <TooltipProvider delayDuration={300}>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setShowSendModal(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <Send className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('sendInvoice')}</TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={handleDownloadPDF} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('downloadPdf')}</TooltipContent>
                        </Tooltip>

                        {/* Retenue à la Source (RS) + TEJ XML export are purchases-only — removed from sales. */}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={handleDeleteSale} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('delete')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Status pipeline – own full-width row */}
          <div className="pl-13">
            <SaleStatusFlow
              currentStatus={sale.status}
              onStatusChange={handleStatusChange}
              sale={sale}
              isUpdating={isStatusUpdating}
            />
          </div>
        </div>

      </div>

      {/* Service Order Status Banner - Only shown when sale has service items */}
      {hasServiceItems && (
        <div className="border-b border-border">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {isAlreadyConverted
                      ? t('serviceOrderCreatedBanner')
                      : skipServiceOrder
                        ? t('detail.salesOnlyBanner', 'Service Order skipped — Sales only')
                        : workflowStatus.isActive
                        ? t('sales:workflowAutoConversion', 'Workflow automation active')
                        : t('containsServiceItems')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {isAlreadyConverted
                      ? t('serviceOrderCreatedDescription', { id: sale.convertedToServiceOrderId })
                      : skipServiceOrder
                        ? t('detail.salesOnlyBannerDesc', 'This sale will be completed entirely in Sales. No Service Order will be created.')
                        : workflowStatus.isActive
                        ? t('sales:workflowAutoConversionDesc', 'Service order will be created automatically when status changes to "In Progress"')
                        : t('createServiceOrderPrompt')
                    }
                  </p>
                </div>
              </div>
              {isAlreadyConverted ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/dashboard/field/service-orders/${sale.convertedToServiceOrderId}`)}
                  className="gap-2 shrink-0"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t('viewServiceOrder')}
                </Button>
              ) : skipServiceOrder ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="gap-1 text-muted-foreground border-border bg-muted/30">
                    <CheckCircle className="h-3 w-3" />
                    {t('detail.salesOnly', 'Sales only')}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSkipServiceOrder(false);
                      toast.success(t('detail.skipServiceOrderDisabled', 'Service Order conversion re-enabled'));
                    }}
                  >
                    {t('detail.undo', 'Undo')}
                  </Button>
                </div>
              ) : !workflowStatus.isActive ? (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSkipServiceOrder(true);
                      toast.success(t('detail.skipServiceOrderEnabled', 'This sale will stay in Sales only'));
                    }}
                    className="text-muted-foreground"
                  >
                    {t('detail.skipServiceOrderShort', 'Skip')}
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleConvertToServiceOrder}
                    className="gap-2"
                  >
                    <Wrench className="h-4 w-4" />
                    {t('convertToServiceOrder')}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSkipServiceOrder(true);
                      toast.success(t('detail.skipServiceOrderEnabled', 'This sale will stay in Sales only'));
                    }}
                    className="text-muted-foreground"
                  >
                    {t('detail.skipServiceOrderShort', 'Skip')}
                  </Button>
                  <Badge variant="outline" className="gap-1 text-warning border-warning/30 bg-warning/10">
                    <Zap className="h-3 w-3" />
                    {t('sales:autoMode', 'Auto')}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tabs Content */}
      <div className="px-4 py-6 bg-white min-h-screen">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full mb-6">
            {/* Mobile: Dropdown Select */}
            {isMobile ? (
              (() => {
                const TABS = [
                  { value: 'overview',   icon: LayoutDashboard, label: t('tabs.overview') },
                  { value: 'items',      icon: Package,          label: t('tabs.items') },
                  { value: 'payments',   icon: CreditCard,       label: t('payments:title', 'Payments') },
                  { value: 'notes',      icon: StickyNote,       label: t('tabs.notesActivity') },
                  { value: 'checklists', icon: CheckSquare,      label: t('tabs.checklists') },
                  { value: 'documents',  icon: FolderOpen,       label: t('tabs.documents') },
                ];
                const current = TABS.find(tab => tab.value === activeTab);
                return (
                  <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="w-full h-11 rounded-xl border-primary/20 bg-primary/5 text-foreground font-medium shadow-sm focus:ring-primary/30">
                      <SelectValue>
                        {current && (
                          <span className="flex items-center gap-2">
                            <current.icon className="h-4 w-4 text-primary flex-shrink-0" />
                            {current.label}
                          </span>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-card rounded-xl shadow-lg border-border/60">
                      {TABS.map(({ value, icon: Icon, label }) => (
                        <SelectItem key={value} value={value} className="rounded-lg cursor-pointer py-2.5">
                          <span className="flex items-center gap-2.5">
                            <span className={`p-1 rounded-md ${activeTab === value ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Icon className={`h-3.5 w-3.5 ${activeTab === value ? 'text-primary' : 'text-muted-foreground'}`} />
                            </span>
                            <span className={activeTab === value ? 'text-primary font-medium' : ''}>{label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                );
              })()
            ) : (
              <TabsList variant="underline">
                <TabsTrigger value="overview">{t('tabs.overview')}</TabsTrigger>
                <TabsTrigger value="items">{t('tabs.items')}</TabsTrigger>
                <TabsTrigger value="payments">{t('payments:title', 'Payments')}</TabsTrigger>
                <TabsTrigger value="notes">{t('tabs.notesActivity')}</TabsTrigger>
                <TabsTrigger value="checklists">{t('tabs.checklists')}</TabsTrigger>
                <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
              </TabsList>

            )}
          </div>

          <TabsContent value="overview" className="mt-0">
            <OverviewTab sale={sale} />
          </TabsContent>

          <TabsContent value="items">
            <ItemsTab sale={sale} onItemsUpdated={fetchSale} />
          </TabsContent>

          <TabsContent value="payments">
            <PaymentsTab
              entityType="sale"
              entityId={sale.id}
              entityNumber={sale.saleNumber ?? sale.id}
              totalAmount={calculateEntityTotal(sale).total}
              currency={sale.currency ?? 'TND'}
              items={(sale.items ?? []).map(item => ({
                id: item.id,
                itemName: item.itemName,
                totalPrice: item.totalPrice ?? 0,
              }))}
              entityData={sale}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab sale={sale} />
          </TabsContent>

          <TabsContent value="checklists">
            <ChecklistsTab sale={sale} />
          </TabsContent>

          <TabsContent value="documents">
            {sale && <DocumentsTab sale={sale} />}
          </TabsContent>
        </Tabs>
      </div>

      {/* PDF Preview Modal */}
      {isPDFModalOpen && sale && (
        <SalePDFPreviewModal
          isOpen={isPDFModalOpen}
          onClose={() => setIsPDFModalOpen(false)}
          sale={sale}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Convert to Service Order Dialog */}
      {sale && hasServiceItems && (
        <ConvertToServiceOrderDialog
          open={showServiceOrderDialog}
          onOpenChange={setShowServiceOrderDialog}
          sale={sale}
          onConversionComplete={handleConversionComplete}
        />
      )}

      {/* Send Sale Modal */}
      {sale && (
        <SendSaleModal
          open={showSendModal}
          onOpenChange={setShowSendModal}
          sale={sale}
          onSendSuccess={handleSendSaleSuccess}
        />
      )}

    </div>
  );
}