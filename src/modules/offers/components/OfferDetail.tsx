import { useState, useEffect } from "react";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Edit, Trash2, FileDown, RefreshCw, Send, Check, X, ShoppingCart, Loader2, Zap, Info, Receipt, MoreVertical, LayoutDashboard, Package, StickyNote, CheckSquare, FolderOpen } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { OffersService } from "../services/offers.service";
import { offersApi } from "@/services/api/offersApi";
import { entityFormDocumentsService } from "@/modules/shared/services/entityFormDocumentsService";
import { salesApi } from "@/services/api/salesApi";
import { Offer } from "../types";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { toast } from "sonner";
import { OfferPDFPreviewModal } from "./OfferPDFPreviewModal";
import { OverviewTab } from "./tabs/OverviewTab";
import { ItemsTab } from "./tabs/ItemsTab";
import { NotesTab } from "./tabs/NotesTab";
import { ChecklistsTab } from "./tabs/ChecklistsTab";
import { DocumentsTab } from "./tabs/DocumentsTab";
import { RSRecordModal } from "@/modules/shared/components/RSRecordModal";
import { TEJExportModal } from "@/modules/shared/components/TEJExportModal";
import { OfferStatusFlow, OfferStatus } from "./OfferStatusFlow";
import { SendOfferModal } from "./SendOfferModal";
import { useWorkflowStatus } from "@/modules/workflow/hooks/useWorkflowStatus";
import { getStatusColorClass, offerStatusConfig, getWorkflowStepIndex, getPositiveTerminalStatuses, getNegativeStatuses } from "@/config/entity-statuses";
import { EditableEntityNumber } from "@/components/shared/EditableEntityNumber";
import { checkDuplicateDocumentNumber } from "@/services/documentNumberValidator";
import { CompanyBadge } from "@/components/CompanyBadge";
import { TenantSelector } from "@/components/TenantSelector";

export function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('offers');
  const { format: formatCurrency } = useCurrency();
  const { isMobile } = useLayoutModeContext();
  const workflowStatus = useWorkflowStatus();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isConverting, setIsConverting] = useState(false);
  const [showConvertDialog, setShowConvertDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showRSModal, setShowRSModal] = useState(false);
  const [showTEJExport, setShowTEJExport] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const offerData = await OffersService.getOfferById(id);
        setOffer(offerData);
      } catch (error) {
        toast.error(t('failedToFetchOffer'));
      } finally {
        setLoading(false);
      }
    };
    fetchOffer();
  }, [id, t]);

  const handleSendOfferSuccess = async () => {
    if (!offer) return;
    try {
      const updatedOffer = await OffersService.sendOffer(offer.id);
      setOffer(updatedOffer);
    } catch (error) {
      console.error('Failed to update offer status after send:', error);
    }
  };

  const handleAcceptOffer = async () => {
    if (!offer) return;
    try {
      setActionLoading('accept');
      await OffersService.updateOffer(offer.id, { status: 'accepted' });
      setOffer({ ...offer, status: 'accepted' });
      toast.success(t('detail.offerAccepted'));
      
      // Only show convert dialog if workflow automation is NOT active
      // When workflow is active, conversion happens automatically via backend
      if (!workflowStatus.isActive) {
        setShowConvertDialog(true);
      } else {
        // Auto-conversion happens silently via workflow
      }
    } catch (error) {
      toast.error(t('detail.failedToAcceptOffer'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineOffer = async () => {
    if (!offer) return;
    try {
      setActionLoading('decline');
      await OffersService.updateOffer(offer.id, { status: 'declined' });
      setOffer({ ...offer, status: 'declined' });
      toast.success(t('detail.offerDeclined'));
    } catch (error) {
      toast.error(t('detail.failedToDeclineOffer'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleConvertToSale = async () => {
    if (!offer) return;
    
    if (offer.convertedToSaleId) {
      toast.info(t('detail.offerAlreadyConverted'));
      navigate(`/dashboard/sales/${offer.convertedToSaleId}`);
      return;
    }
    
    try {
      setIsConverting(true);
      const result = await OffersService.convertOffer({
        offerId: offer.id,
        convertToSale: true,
        convertToServiceOrder: false,
      });

      setShowConvertDialog(false);

      const saleId = result.saleId ? Number.parseInt(String(result.saleId), 10) : NaN;
      if (Number.isFinite(saleId) && saleId > 0) {
        const offerId = parseInt(offer.id, 10);
        
        if (!result.alreadyConverted) {
          try {
            await offersApi.addActivity(offerId, {
              type: 'conversion',
              description: `Offer converted to Sale #${saleId}`,
              details: `This offer was successfully converted to a sale on ${new Date().toLocaleDateString()}`,
            });
          } catch (e) {
            console.warn('Failed to log offer conversion activity:', e);
          }
          
          // Copy checklists from offer to sale
          try {
            await entityFormDocumentsService.copyToEntity('offer', offerId, 'sale', saleId);
          } catch (e) {
            console.warn('Failed to copy checklists from offer to sale:', e);
          }
          
          // Note: Backend already creates the activity with proper offer number
        }
        
        setOffer({
          ...offer,
          convertedToSaleId: String(saleId),
          convertedAt: new Date(),
          status: 'accepted',
        });

        if (result.alreadyConverted) {
          toast.info(t('detail.alreadyConvertedNavigating'));
        } else {
          toast.success(t('detail.offerConvertedSuccessfully'));
        }
        navigate(`/dashboard/sales/${saleId}`);
        return;
      }

      toast.error(t('detail.conversionFailed'));
      navigate('/dashboard/sales');
    } catch (error) {
      toast.error(t('detail.failedToConvertOffer'));
    } finally {
      setIsConverting(false);
    }
  };

  const handleRenewOffer = async () => {
    if (!offer) return;
    try {
      setActionLoading('renew');
      await OffersService.renewOffer(offer.id);
      toast.success(t('detail.offerRenewedSuccessfully'));
      navigate('/dashboard/offers');
    } catch (error) {
      toast.error(t('detail.failedToRenewOffer'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusFlowChange = async (newStatus: OfferStatus) => {
    if (!offer) return;

    try {
      setActionLoading(newStatus);
      // StatusFlow now emits canonical config IDs directly — no mapping needed
      await OffersService.updateOffer(offer.id, { status: newStatus as any });
      
      // Refetch to get the actual backend state
      const updatedOffer = await OffersService.getOfferById(offer.id);
      if (updatedOffer) {
        setOffer(updatedOffer);
      }
      
      toast.success(t('detail.statusUpdatedTo', { status: t(`status.${newStatus}`) }));
      
      // Show convert dialog when positively terminal — ONLY if workflow is NOT active
      const positiveTerminals = getPositiveTerminalStatuses(offerStatusConfig);
      if (positiveTerminals.includes(newStatus) && !workflowStatus.isActive) {
        setShowConvertDialog(true);
      } else if (positiveTerminals.includes(newStatus) && workflowStatus.isActive) {
        // Auto-conversion happens silently via workflow
        const pollForSale = async (retries = 10, delay = 1000) => {
          for (let i = 0; i < retries; i++) {
            await new Promise(r => setTimeout(r, delay));
            const refreshed = await OffersService.getOfferById(offer.id);
            if (refreshed?.convertedToSaleId) {
              navigate(`/dashboard/sales/${refreshed.convertedToSaleId}`);
              return;
            }
          }
        };
        pollForSale();
      }
    } catch (error) {
      console.error('Failed to update offer status:', error);
      toast.error(t('detail.failedToUpdateStatus'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteOffer = async () => {
    if (!offer) return;
    try {
      setActionLoading('delete');
      await OffersService.deleteOffer(offer.id);
      toast.success(t('detail.offerDeleted'));
      navigate('/dashboard/offers');
    } catch (error) {
      toast.error(t('detail.failedToDeleteOffer'));
    } finally {
      setActionLoading(null);
      setShowDeleteDialog(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const colorClass = getStatusColorClass('offer', status);
    const label = t(`status.${status}`, { defaultValue: status });
    return <Badge className={`${colorClass} text-sm px-3 py-1 border`}>{label}</Badge>;
  };

  const getWorkflowStep = (status: string) => {
    const idx = getWorkflowStepIndex(offerStatusConfig, status);
    return idx === -1 ? 1 : idx + 1;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          {/* Elegant pulsing loader */}
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
            <p className="text-sm text-muted-foreground mt-2">{t('detail.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!offer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
        <h2 className="text-2xl font-semibold text-foreground mb-2">{t('offerNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{t('offerNotFoundDescription', { id })}</p>
        <Button onClick={() => navigate('/dashboard/offers')} variant="outline">
          {t('backToOffers')}
        </Button>
      </div>
    );
  }

  const currentStep = getWorkflowStep(offer.status);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">

        {/* ── Mobile Header ── */}
        <div className="md:hidden">
          {/* Row 1: Back + actions menu */}
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/offers')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('backToOffers')}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 bg-background/95 backdrop-blur-sm border border-border/50">
                <DropdownMenuItem onClick={() => setShowSendModal(true)} className="gap-2">
                  <Send className="h-4 w-4" />
                  {t('send_offer')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setIsPDFModalOpen(true)} className="gap-2">
                  <FileDown className="h-4 w-4" />
                  {t('download_pdf')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate(`/dashboard/offers/${offer.id}/edit`)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  {t('edit_offer')}
                </DropdownMenuItem>
                {getPositiveTerminalStatuses(offerStatusConfig).includes(offer.status) && !offer.convertedToSaleId && !workflowStatus.isActive && (
                  <DropdownMenuItem onClick={() => setShowConvertDialog(true)} className="gap-2">
                    <ShoppingCart className="h-4 w-4" />
                    {t('convert_to_sale')}
                  </DropdownMenuItem>
                )}
                {getNegativeStatuses(offerStatusConfig).includes(offer.status) && (
                  <DropdownMenuItem onClick={handleRenewOffer} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    {t('detail.renewOffer')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="gap-2 text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4" />
                  {t('delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Row 2: Offer number + sent count + status */}
          <div className="p-3 space-y-2.5">
            <div className="min-w-0">
              <EditableEntityNumber
                value={offer.offerNumber || offer.title}
                onSave={async (newValue) => {
                  await offersApi.update(Number(offer.id), { offerNumber: newValue });
                  setOffer({ ...offer, offerNumber: newValue });
                }}
                validate={async (newValue) => {
                  const result = await checkDuplicateDocumentNumber(newValue, 'offer', offer.id);
                  return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                }}
                className="text-xl font-bold"
              />
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border">
                  <Send className="w-3.5 h-3.5 text-primary" />
                  <span>{t('sent', 'Sent')} {offer.sentCount || 0} {t('time', 'time')}{(offer.sentCount || 0) !== 1 ? 's' : ''}</span>
                </div>
                <CompanyBadge tenantId={(offer as any)?.tenantId} />
              </div>
            </div>
            {/* Status flow – full width, scrollable on mobile */}
            <div className="overflow-x-auto">
              <OfferStatusFlow
                currentStatus={offer.status}
                onStatusChange={handleStatusFlowChange}
                disabled={actionLoading !== null}
                isUpdating={actionLoading !== null}
              />
            </div>
          </div>
        </div>

        {/* ── Desktop Header – Compact Card Style ── */}
        <div className="hidden md:block p-4 lg:p-6 space-y-3">
          <div className="flex items-center gap-4">
            {/* Back Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard/offers')}
              className="h-9 w-9 shrink-0 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            {/* Offer Info Card */}
            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-6">
                  {/* Left: Title */}
                  <div className="flex items-center gap-6 min-w-0 flex-wrap">
                    <EditableEntityNumber
                      value={offer.offerNumber || offer.title}
                      onSave={async (newValue) => {
                        await offersApi.update(Number(offer.id), { offerNumber: newValue });
                        setOffer({ ...offer, offerNumber: newValue });
                      }}
                      validate={async (newValue) => {
                        const result = await checkDuplicateDocumentNumber(newValue, 'offer', offer.id);
                        return result.isDuplicate ? `This number already exists in ${result.foundIn}` : null;
                      }}
                    />
                    {/* Sent Count Display */}
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-md border border-border">
                      <Send className="w-3.5 h-3.5 text-primary" />
                      <span>{t('sent', 'Sent')} {offer.sentCount || 0} {t('time', 'time')}{(offer.sentCount || 0) !== 1 ? 's' : ''}</span>
                    </div>
                    <CompanyBadge tenantId={(offer as any)?.tenantId} />
                    <TenantSelector value={(offer as any)?.tenantId} readOnly compact onChange={() => {}} />
                  </div>

                  {/* Right: Actions only – status flow moved to its own row below */}
                  <div className="flex items-center gap-4 shrink-0">

                    <TooltipProvider delayDuration={300}>
                      <div className="flex items-center gap-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setShowSendModal(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              {actionLoading === 'send' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('send_offer')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setIsPDFModalOpen(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                              <FileDown className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('download_pdf')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Link to={`/dashboard/offers/${offer.id}/edit`}>
                              <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-foreground hover:bg-accent">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">{t('edit_offer')}</TooltipContent>
                        </Tooltip>
                        {getPositiveTerminalStatuses(offerStatusConfig).includes(offer.status) && !offer.convertedToSaleId && !workflowStatus.isActive && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon-sm" onClick={() => setShowConvertDialog(true)} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                                <ShoppingCart className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t('convert_to_sale')}</TooltipContent>
                          </Tooltip>
                        )}
                        {getNegativeStatuses(offerStatusConfig).includes(offer.status) && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon-sm" onClick={handleRenewOffer} className="text-muted-foreground hover:text-foreground hover:bg-accent">
                                {actionLoading === 'renew' ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">{t('detail.renewOffer')}</TooltipContent>
                          </Tooltip>
                        )}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon-sm" onClick={() => setShowDeleteDialog(true)} className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
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

          {/* Status pipeline – its own full-width row under the header card */}
          <div className="pl-13">
            <OfferStatusFlow
              currentStatus={offer.status}
              onStatusChange={handleStatusFlowChange}
              disabled={actionLoading !== null}
              isUpdating={actionLoading !== null}
            />
          </div>
        </div>

      </div>

      <div className="px-4 py-6 space-y-6 bg-white">

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="w-full mb-6">
            {/* Mobile: Dropdown Select */}
            {isMobile ? (
              (() => {
                const TABS = [
                  { value: 'overview',   icon: LayoutDashboard, label: t('tabs.overview') },
                  { value: 'items',      icon: Package,          label: t('tabs.items') },
                  { value: 'notes',      icon: StickyNote,       label: t('tabs.notes') },
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
                <TabsTrigger value="notes">{t('tabs.notes')}</TabsTrigger>
                <TabsTrigger value="checklists">{t('tabs.checklists')}</TabsTrigger>
                <TabsTrigger value="documents">{t('tabs.documents')}</TabsTrigger>
              </TabsList>

            )}
          </div>

          <TabsContent value="overview" className="mt-0">
            <OverviewTab offer={offer} />
          </TabsContent>

          <TabsContent value="items">
            <ItemsTab 
              offer={offer} 
              onItemsUpdated={async () => {
                if (id) {
                  const updatedOffer = await OffersService.getOfferById(id);
                  if (updatedOffer) setOffer(updatedOffer);
                }
              }}
            />
          </TabsContent>

          

          <TabsContent value="notes">
            <NotesTab offer={offer} />
          </TabsContent>

          <TabsContent value="checklists">
            <ChecklistsTab offer={offer} />
          </TabsContent>

          <TabsContent value="documents">
            {offer && <DocumentsTab offer={offer} />}
          </TabsContent>

        </Tabs>


      </div>

      {isPDFModalOpen && offer && (
        <OfferPDFPreviewModal
          offer={offer}
          isOpen={isPDFModalOpen}
          onClose={() => setIsPDFModalOpen(false)}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Convert to Sale Dialog */}
      <Dialog open={showConvertDialog} onOpenChange={setShowConvertDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5" />
              {t('detail.convertOfferToSale')}
            </DialogTitle>
            <DialogDescription>
              {t('detail.convertOfferDescription')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('offer')}:</span>
                <span className="font-medium">{offer.title}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('detail.customer')}:</span>
                <span className="font-medium">{offer.contactName}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t('tabs.items')}:</span>
                <span className="font-medium">{offer.items.length} {t('detail.items')}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">{t('detail.totalAmount')}:</span>
                <span className="font-bold text-primary">
                      {(() => {
                        const subtotal = offer.items.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
                        const discountAmt = (offer.discount ?? 0) > 0
                          ? (offer.discountType === 'percentage'
                            ? subtotal * ((offer.discount ?? 0) / 100)
                            : (offer.discount ?? 0))
                          : 0;
                        const afterDiscount = subtotal - discountAmt;
                        const tax = (offer.taxes ?? 0) > 0
                          ? (offer.taxType === 'percentage'
                            ? afterDiscount * ((offer.taxes ?? 0) / 100)
                            : (offer.taxes ?? 0))
                          : 0;
                        const fiscalStampAmt = offer.fiscalStamp ?? 0;
                        const totalWithTax = afterDiscount + tax + fiscalStampAmt;
                        return formatCurrency(totalWithTax);
                      })()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertDialog(false)} disabled={isConverting}>
              {t('cancel')}
            </Button>
            <Button onClick={handleConvertToSale} disabled={isConverting} className="gap-2">
              {isConverting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('detail.converting')}
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  {t('convert_to_sale')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('deleteConfirm.title')}</DialogTitle>
            <DialogDescription>
              {t('deleteConfirm.description')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)} disabled={actionLoading === 'delete'}>
              {t('deleteConfirm.cancel')}
            </Button>
            <Button variant="destructive" onClick={handleDeleteOffer} disabled={actionLoading === 'delete'} className="gap-2">
              {actionLoading === 'delete' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {t('deleteConfirm.confirm')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Offer Modal */}
      {offer && (
        <SendOfferModal
          open={showSendModal}
          onOpenChange={setShowSendModal}
          offer={offer}
          onSendSuccess={handleSendOfferSuccess}
        />
      )}

      {/* RS Record Modal */}
      {offer && (
        <RSRecordModal
          open={showRSModal}
          onOpenChange={setShowRSModal}
          entityType="offer"
          entityId={offer.id}
          entityNumber={offer.offerNumber ?? offer.id}
          entityAmount={calculateEntityTotal(offer).total || offer.totalAmount || offer.amount || 0}
          contactName={offer.contactName}
          contactTaxId={offer.contactMatriculeFiscale}
          contactAddress={offer.contactAddress}
          onSuccess={async () => {
            if (id) {
              const updated = await OffersService.getOfferById(id);
              if (updated) setOffer(updated);
            }
          }}
        />
      )}

      {/* TEJ Export Modal */}
      {offer && (
        <TEJExportModal
          open={showTEJExport}
          onOpenChange={setShowTEJExport}
          entityType="offer"
          entityId={Number(offer.id)}
          onExportComplete={() => {}}
        />
      )}
    </div>
  );
}
