import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useContactAccessGuard } from '@/hooks/useContactAccessGuard';
import { ContactAccessDenied } from '@/components/access/ContactAccessDenied';
import { useTranslation } from "react-i18next";
import { translateNote } from "@/modules/shared/utils/noteTranslation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Edit, GitBranch, Trash2, Loader2, Building2, User, Calendar,
  DollarSign, Target, Send, ShoppingCart, Briefcase, FileText, CheckCircle2,
  Package, Wrench, ExternalLink, Mail, Phone, MapPin, FileDown, MoreVertical,
  LayoutDashboard, Activity, FolderOpen, CheckSquare, StickyNote,
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrencyValue } from "@/lib/formatters";
import { useCurrency } from "@/shared/hooks/useCurrency";
import { dealsApi, type Deal, type DealActivity } from "@/services/api/dealsApi";
import { DealPDFPreviewModal } from "./DealPDFPreviewModal";
import { stageBadgeClass } from "../lib/dealStages";
import { isFollowUpOverdue } from "../lib/dealAnalytics";
import { ConvertDealModal } from "./ConvertDealModal";
import { UnifiedDocumentsSection, type DocumentEntityRef } from "@/modules/shared/components/documents/UnifiedDocumentsSection";
import { ChecklistsSection } from "@/modules/shared/components/documents";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { usePermissions } from "@/hooks/usePermissions";
import { ContactUserGroupsInline } from "@/modules/contacts/components/ContactUserGroupsInline";
import { useTableSort } from "@/hooks/useTableSort";
import { SortableHeader } from "@/components/shared/SortableHeader";

export function DealDetail() {
  const { t } = useTranslation("deals");
  const { id } = useParams();
  const navigate = useNavigate();
  const dealId = Number(id);
  const { canUpdate, canDelete, isMainAdmin } = usePermissions();
  const hasUpdateAccess = isMainAdmin || canUpdate('deals');
  const hasDeleteAccess = isMainAdmin || canDelete('deals');

  const { format: formatCurrency } = useCurrency();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setNotFound(false);
      setDeal(await dealsApi.getById(dealId));
    } catch {
      // A deleted (or foreign-tenant) deal must not spin forever — show a real
      // "not found" state instead of an endless loader.
      setNotFound(true);
      toast.error(t("toast.loadError"));
    } finally {
      setLoading(false);
    }
  }, [dealId, t]);

  useEffect(() => { if (dealId) load(); }, [dealId, load]);

  const handleDelete = async () => {
    try {
      await dealsApi.delete(dealId);
      toast.success(t("toast.deleted"));
      navigate("/dashboard/deals");
    } catch {
      toast.error(t("toast.deleteError"));
    }
  };

  const contactAccess = useContactAccessGuard((deal as any)?.contactId);

  if (!loading && notFound) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 h-60 text-center">
        <p className="text-lg font-semibold">{t("detail.notFound", { defaultValue: "Deal not found" })}</p>
        <p className="text-sm text-muted-foreground">{t("detail.notFoundHint", { defaultValue: "It may have been deleted or you no longer have access to it." })}</p>
        <Button variant="outline" onClick={() => navigate("/dashboard/deals")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t("backToDeals", { defaultValue: "Deals" })}
        </Button>
      </div>
    );
  }

  if (loading || !deal) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const converted = deal.convertedToSaleId || deal.convertedToProjectId || deal.convertedToOfferId;

  if (!contactAccess.checking && !contactAccess.allowed) {
    return <ContactAccessDenied entityLabel={'deal'} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header — full-width sticky card (matches offers/sales) */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        {/* Mobile Header */}
        <div className="md:hidden">
          {/* Row 1: Back + actions menu */}
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard/deals")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("backToDeals", { defaultValue: "Deals" })}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52">
                <DropdownMenuItem onClick={() => setIsPDFModalOpen(true)}>
                  <FileDown className="h-4 w-4 mr-2" />
                  {t("actions.pdf", { defaultValue: "PDF" })}
                </DropdownMenuItem>
                {hasUpdateAccess && (
                  <DropdownMenuItem onClick={() => navigate(`/dashboard/deals/${dealId}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    {t("actions.edit")}
                  </DropdownMenuItem>
                )}
                {hasUpdateAccess && (
                  <DropdownMenuItem onClick={() => setConvertOpen(true)}>
                    <GitBranch className="h-4 w-4 mr-2" />
                    {t("actions.convert")}
                  </DropdownMenuItem>
                )}
                {hasDeleteAccess && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteOpen(true)} className="text-destructive focus:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      {t("actions.delete")}
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {/* Row 2: Deal title + stage badge */}
          <div className="p-3 space-y-1.5">
            <div className="flex items-center gap-2 min-w-0 flex-wrap">
              <h1 className="text-xl font-bold truncate">{deal.title}</h1>
              <Badge variant="secondary" className={stageBadgeClass(deal.stage)}>{t(`stages.${deal.stage}`)}</Badge>
              {isFollowUpOverdue(deal) && (
                <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                  <Send className="h-3 w-3" /> {t("detail.followUpOverdue", { defaultValue: "Follow-up overdue" })}
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">{deal.dealNumber} · {deal.contactName || deal.contact?.name}</p>
          </div>
        </div>

        {/* Desktop Header */}
        <div className="hidden md:block p-4 lg:p-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard/deals")}
              className="h-9 w-9 shrink-0 hover:bg-background/80"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>

            <Card className="flex-1 shadow-sm border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <h1 className="text-xl font-bold truncate">{deal.title}</h1>
                    <Badge variant="secondary" className={stageBadgeClass(deal.stage)}>{t(`stages.${deal.stage}`)}</Badge>
                    {isFollowUpOverdue(deal) && (
                      <Badge variant="secondary" className="gap-1 bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                        <Send className="h-3 w-3" /> {t("detail.followUpOverdue", { defaultValue: "Follow-up overdue" })}
                      </Badge>
                    )}
                    <span className="text-sm text-muted-foreground">
                      {deal.dealNumber} · {deal.contactName || deal.contact?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap shrink-0">
                    <Button variant="outline" size="sm" onClick={() => setIsPDFModalOpen(true)} className="gap-1.5">
                      <FileDown className="h-4 w-4" /> {t("actions.pdf", { defaultValue: "PDF" })}
                    </Button>
                    {hasUpdateAccess && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/deals/${dealId}/edit`)} className="gap-1.5">
                        <Edit className="h-4 w-4" /> {t("actions.edit")}
                      </Button>
                    )}
                    {hasUpdateAccess && (
                      <Button size="sm" onClick={() => setConvertOpen(true)} className="gap-1.5">
                        <GitBranch className="h-4 w-4" /> {t("actions.convert")}
                      </Button>
                    )}
                    {hasDeleteAccess && (
                      <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 bg-white">
        {/* Converted banner */}
        {converted && (
          <Card className="border-green-200 bg-green-50 dark:bg-green-900/10">
            <CardContent className="p-3 flex flex-wrap items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="text-sm font-medium">{t("detail.convertedBanner")}:</span>
              {deal.convertedToSaleId && (
                <Button variant="link" size="sm" className="h-auto p-0 gap-1" onClick={() => navigate(`/dashboard/sales/${deal.convertedToSaleId}`)}>
                  <ShoppingCart className="h-3.5 w-3.5" /> {t("detail.viewSale")}
                </Button>
              )}
              {deal.convertedToProjectId && (
                <Button variant="link" size="sm" className="h-auto p-0 gap-1" onClick={() => navigate(`/dashboard/tasks/projects/${deal.convertedToProjectId}`)}>
                  <Briefcase className="h-3.5 w-3.5" /> {t("detail.viewProject")}
                </Button>
              )}
              {deal.convertedToOfferId && (
                <Button variant="link" size="sm" className="h-auto p-0 gap-1" onClick={() => navigate(`/dashboard/offers/${deal.convertedToOfferId}`)}>
                  <FileText className="h-3.5 w-3.5" /> {t("detail.viewOffer")}
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Key metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Metric icon={DollarSign} label={t("detail.value")} value={formatCurrencyValue(deal.estimatedValue, deal.currency)} />
          <Metric icon={Target} label={t("detail.probability")} value={`${deal.probability}%`} />
          <Metric icon={Calendar} label={t("detail.expectedClose")} value={deal.expectedCloseDate ? format(new Date(deal.expectedCloseDate), "dd MMM yyyy") : "—"} />
          <Metric icon={Send} label={t("detail.source")} value={deal.source || "—"} />
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-white p-4 rounded-md min-h-screen">
          {/* Mobile: Select dropdown */}
          {(() => {
            const TABS = [
              { value: 'overview',   icon: LayoutDashboard, label: t('detail.tabs.overview') },
              { value: 'items',      icon: Package,         label: t('detail.tabs.items') },
              { value: 'documents',  icon: FolderOpen,      label: t('detail.tabs.documents') },
              { value: 'checklists', icon: CheckSquare,     label: t('detail.tabs.checklists') },
              { value: 'notes',      icon: StickyNote,      label: t('detail.tabs.notes') },
              { value: 'activity',   icon: Activity,        label: t('detail.tabs.activity') },
            ];
            const current = TABS.find(tab => tab.value === activeTab);
            return (
              <div className="md:hidden mb-4">
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
              </div>
            );
          })()}
          {/* Desktop: tab pills */}
          <div className="hidden md:block">
            <TabsList variant="underline">
              <TabsTrigger value="overview">{t("detail.tabs.overview")}</TabsTrigger>
              <TabsTrigger value="items">{t("detail.tabs.items")}</TabsTrigger>
              <TabsTrigger value="documents">{t("detail.tabs.documents")}</TabsTrigger>
              <TabsTrigger value="checklists">{t("detail.tabs.checklists")}</TabsTrigger>
              <TabsTrigger value="notes">{t("detail.tabs.notes")}</TabsTrigger>
              <TabsTrigger value="activity">{t("detail.tabs.activity")}</TabsTrigger>
            </TabsList>

          </div>

          <div className="mt-6">
            <TabsContent value="overview"><OverviewTab deal={deal} /></TabsContent>
            <TabsContent value="items"><ItemsTab deal={deal} /></TabsContent>
            <TabsContent value="documents"><DocumentsTab deal={deal} /></TabsContent>
            <TabsContent value="checklists"><ChecklistsTab deal={deal} /></TabsContent>
            <TabsContent value="notes"><NotesTab deal={deal} onSaved={load} /></TabsContent>
            <TabsContent value="activity"><ActivityTab dealId={deal.id} /></TabsContent>
          </div>
        </Tabs>
      </div>

      {convertOpen && (
        <ConvertDealModal deal={deal} open={convertOpen} onClose={() => setConvertOpen(false)} onConverted={() => { setConvertOpen(false); load(); }} />
      )}

      {isPDFModalOpen && (
        <DealPDFPreviewModal
          deal={deal}
          isOpen={isPDFModalOpen}
          onClose={() => setIsPDFModalOpen(false)}
          formatCurrency={formatCurrency}
        />
      )}

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("delete.title")}</AlertDialogTitle>
            <AlertDialogDescription>{t("delete.description")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("actions.cancel")}</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={handleDelete}>{t("delete.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground truncate">{label}</p>
          <p className="text-sm font-semibold truncate">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground mt-1 break-words">{value}</p>
    </div>
  );
}

function OverviewTab({ deal }: { deal: Deal }) {
  const { t } = useTranslation("deals");
  const contact = deal.contact;
  const fmtDate = (d?: string) => (d ? format(new Date(d), "dd MMM yyyy") : t("detail.notSpecified", { defaultValue: "—" }));

  // Unique installations referenced by the deal's line items.
  const installations = Array.from(
    new Map(
      (deal.items || [])
        .filter(it => it.installationId)
        .map(it => [String(it.installationId), { id: it.installationId as string, name: it.installationName || `#${it.installationId}` }]),
    ).values(),
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Deal details — two columns (mirrors offers/sales) */}
      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left */}
            <div className="space-y-4">
              <DetailField label={t("detail.dealNumber", { defaultValue: "Deal number" })} value={deal.dealNumber || "—"} />
              <DetailField label={t("detail.title", { defaultValue: "Title" })} value={deal.title} />
              <DetailField label={t("detail.description")} value={deal.description || t("detail.noDescription")} />
              <div>
                <span className="text-sm text-muted-foreground">{t("detail.customer")}</span>
                <div className="mt-1">
                  <Link
                    to={`/dashboard/contacts/${deal.contactId}`}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1.5 max-w-full"
                  >
                    <span className="truncate">{deal.contactName || contact?.name || contact?.company || "—"}</span>
                    <ExternalLink className="h-3 w-3 shrink-0" />
                  </Link>
                </div>
              </div>
              <DetailField label={t("detail.category")} value={deal.category || "—"} />
              <DetailField label={t("detail.source")} value={deal.source || "—"} />
              {(deal.contactId || (contact as any)?.userGroups) && (
                <ContactUserGroupsInline
                  groups={(contact as any)?.userGroups}
                  contactId={deal.contactId as any}
                  variant="labeled"
                  editable
                />
              )}
            </div>

            {/* Right */}
            <div className="space-y-4">
              <DetailField
                label={t("detail.value")}
                value={<span className="font-semibold">{formatCurrencyValue(deal.estimatedValue, deal.currency)}</span>}
              />
              <div>
                <span className="text-sm text-muted-foreground">{t("detail.stage")}</span>
                <div className="mt-1">
                  <Badge variant="secondary" className={stageBadgeClass(deal.stage)}>{t(`stages.${deal.stage}`)}</Badge>
                </div>
              </div>
              <DetailField label={t("detail.probability")} value={`${deal.probability}%`} />
              <DetailField label={t("detail.expectedClose")} value={fmtDate(deal.expectedCloseDate)} />
              <DetailField label={t("detail.created")} value={fmtDate(deal.createdAt)} />
              <DetailField label={t("detail.owner")} value={deal.assignedToName || deal.createdByName || "—"} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next action / follow-up */}
      {(deal.nextAction || deal.nextActionDate) && (
        <div className={`rounded-lg border p-3 ${isFollowUpOverdue(deal) ? "border-amber-300 bg-amber-50 dark:bg-amber-900/10" : "border-border bg-muted/30"}`}>
          <div className="flex items-center gap-2 flex-wrap">
            <Send className={`h-4 w-4 ${isFollowUpOverdue(deal) ? "text-amber-600" : "text-primary"}`} />
            <span className="text-sm font-medium">{deal.nextAction || t("detail.followUp", { defaultValue: "Follow up" })}</span>
            {deal.nextActionDate && (
              <Badge variant="secondary" className={isFollowUpOverdue(deal) ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300" : ""}>
                {format(new Date(deal.nextActionDate), "dd MMM yyyy")}
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Lost reason */}
      {deal.stage === "lost" && deal.lostReason && (
        <div className="rounded-lg border border-red-200 bg-red-50 dark:bg-red-900/10 p-3">
          <p className="text-xs text-red-600 font-medium mb-0.5">{t("detail.lostReason", { defaultValue: "Lost reason" })}</p>
          <p className="text-sm">{deal.lostReason}</p>
        </div>
      )}

      {/* Customer card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-primary" />
            {t("detail.customerInfo", { defaultValue: "Customer" })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{deal.contactName || contact?.name || "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{contact?.company || t("detail.notSpecified", { defaultValue: "—" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="truncate">{contact?.email || t("detail.notSpecified", { defaultValue: "—" })}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <span>{contact?.phone || t("detail.notSpecified", { defaultValue: "—" })}</span>
            </div>
            {(contact?.address || contact?.city) && (
              <div className="flex items-start gap-2 sm:col-span-2">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <span>{[contact?.address, contact?.city].filter(Boolean).join(", ")}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Related installations */}
      {installations.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-primary" />
              {t("detail.installations", { defaultValue: "Installations" })} ({installations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {installations.map(inst => (
                <Link
                  key={inst.id}
                  to={`/dashboard/field/installations/${inst.id}`}
                  className="flex items-center justify-between gap-3 p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <span className="flex items-center gap-2 min-w-0">
                    <Package className="h-4 w-4 text-primary shrink-0" />
                    <span className="text-sm truncate">{inst.name}</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ItemsTab({ deal }: { deal: Deal }) {
  const { t } = useTranslation("deals");
  const items = deal.items || [];
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p className="text-sm">{t("items.none")}</p>
        </CardContent>
      </Card>
    );
  }
  const subtotal = items.reduce((s, it) => s + (it.lineTotal ?? 0), 0);
  const services = items.filter(it => it.type === "service").length;
  const articles = items.filter(it => it.type === "article").length;
  const { sortKey, sortDirection, toggleSort, sortItems } = useTableSort<typeof items[number]>({
    name: (it) => it.itemName,
    type: (it) => it.type,
    quantity: (it) => it.quantity,
    unitPrice: (it) => it.unitPrice,
    discount: (it) => it.discount,
    lineTotal: (it) => it.lineTotal,
    installation: (it) => it.installationName,
  });
  const sortedItems = sortItems(items);
  return (
    <Card>
      <div className="flex items-center gap-2 px-4 py-3 border-b">
        <Package className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">{t("detail.tabs.items")} ({items.length})</span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <SortableHeader columnKey="name" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t("items.name")}</SortableHeader>
              <SortableHeader columnKey="type" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort}>{t("items.type")}</SortableHeader>
              <SortableHeader columnKey="quantity" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="center">{t("items.quantity")}</SortableHeader>
              <SortableHeader columnKey="unitPrice" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="right">{t("items.unitPrice")}</SortableHeader>
              <SortableHeader columnKey="discount" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="right">{t("items.discount", { defaultValue: "Discount" })}</SortableHeader>
              <SortableHeader columnKey="lineTotal" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="right">{t("items.lineTotal")}</SortableHeader>
              <SortableHeader columnKey="installation" sortKey={sortKey} sortDirection={sortDirection} onSort={toggleSort} align="center">{t("items.installation", { defaultValue: "Installation" })}</SortableHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedItems.map(it => (
              <TableRow key={it.id} className="hover:bg-muted/50 transition-colors">
                <TableCell className="text-center">
                  {it.type === "service" ? <Wrench className="h-4 w-4 text-muted-foreground" /> : <Package className="h-4 w-4 text-muted-foreground" />}
                </TableCell>
                <TableCell>
                  <span className="text-sm font-medium">{it.itemName}</span>
                  {it.itemCode && <p className="text-xs text-muted-foreground">{it.itemCode}</p>}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs capitalize">{t(`items.${it.type}`, { defaultValue: it.type })}</Badge>
                </TableCell>
                <TableCell className="text-center">{Number(it.quantity).toFixed(2)}</TableCell>
                <TableCell className="text-right">{formatCurrencyValue(it.unitPrice, deal.currency)}</TableCell>
                <TableCell className="text-right text-muted-foreground">
                  {it.discount && it.discount > 0
                    ? (it.discountType === "percentage" ? `${it.discount}%` : formatCurrencyValue(it.discount, deal.currency))
                    : "—"}
                </TableCell>
                <TableCell className="text-right font-medium">{formatCurrencyValue(it.lineTotal ?? 0, deal.currency)}</TableCell>
                <TableCell className="text-center">
                  {it.installationId ? (
                    <Link to={`/dashboard/field/installations/${it.installationId}`} className="inline-flex items-center gap-1 text-sm text-primary hover:underline">
                      {it.installationName || t("items.viewInstallation", { defaultValue: "View" })}
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between px-4 py-3 border-t">
        <span className="text-xs text-muted-foreground">
          {services} {t("items.service", { defaultValue: "service" })} · {articles} {t("items.article", { defaultValue: "article" })}
        </span>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">{t("form.itemsSubtotal", { defaultValue: "Items subtotal" })}</p>
          <p className="text-sm font-semibold">{formatCurrencyValue(subtotal, deal.currency)}</p>
        </div>
      </div>
    </Card>
  );
}

function DocumentsTab({ deal }: { deal: Deal }) {
  // Pull documents up from what this deal became (sale / offer), like offers do.
  const relatedEntities: DocumentEntityRef[] = [];
  if (deal.convertedToSaleId) relatedEntities.push({ moduleType: "sales", moduleId: deal.convertedToSaleId });
  if (deal.convertedToOfferId) relatedEntities.push({ moduleType: "offers", moduleId: deal.convertedToOfferId });
  return (
    <UnifiedDocumentsSection
      entityType="deal"
      entityId={deal.id}
      moduleType="deals"
      moduleName={deal.title}
      relatedEntities={relatedEntities}
      showFileUpload
    />
  );
}

function ChecklistsTab({ deal }: { deal: Deal }) {
  const linkedSale = deal.convertedToSaleId;
  const linkedOffer = deal.convertedToOfferId;
  return (
    <ChecklistsSection
      entityType="deal"
      entityId={deal.id}
      linkedEntityType={linkedSale ? "sale" : linkedOffer ? "offer" : undefined}
      linkedEntityId={linkedSale || linkedOffer || undefined}
    />
  );
}

function ActivityTab({ dealId }: { dealId: number }) {
  const { t, i18n } = useTranslation("deals");
  const currentLocale = (i18n.language.startsWith("fr") ? "fr" : "en") as "en" | "fr";
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  // A silently swallowed fetch error used to render as "no activity", which is
  // indistinguishable from an empty timeline. Surface it instead.
  const [loadError, setLoadError] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    dealsApi.getActivities(dealId)
      .then(r => { setActivities(r.activities); setLoadError(false); })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
  }, [dealId]);
  useEffect(() => { load(); }, [load]);

  const add = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await dealsApi.addActivity(dealId, { type: "note", description: note.trim() });
      setNote("");
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <Textarea value={note} onChange={e => setNote(e.target.value)} placeholder={t("activity.placeholder")} rows={2} />
          <Button onClick={add} disabled={busy || !note.trim()}>{t("activity.add")}</Button>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">…</p>
        ) : loadError ? (
          <div className="flex items-center gap-2">
            <p className="text-sm text-destructive">{t("activity.loadFailed", "Could not load activity.")}</p>
            <Button variant="outline" size="sm" onClick={load}>{t("common.retry", "Retry")}</Button>
          </div>
        ) : activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("activity.none")}</p>
        ) : (

          <div className="space-y-2">
            {activities.map(a => (
              <div key={a.id} className="flex items-start gap-2 border-l-2 border-muted pl-3 py-1">
                <div className="min-w-0">
                  <p className="text-sm">{translateNote(a.description || "", currentLocale)}</p>
                  <p className="text-xs text-muted-foreground">
                    {t(`activity.types.${a.type}`, a.type)} · {format(new Date(a.createdAt), "dd MMM yyyy HH:mm")}
                    {a.createdByName ? ` · ${a.createdByName}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function NotesTab({ deal, onSaved }: { deal: Deal; onSaved: () => void }) {
  const { t } = useTranslation("deals");
  const [notes, setNotes] = useState(deal.notes || "");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setBusy(true);
    try {
      await dealsApi.update(deal.id, { notes });
      toast.success(t("toast.updated"));
      onSaved();
    } catch {
      toast.error(t("toast.saveError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <Textarea value={notes} onChange={e => setNotes(e.target.value)} rows={6} placeholder={t("form.notes")} />
        <div className="flex justify-end">
          <Button onClick={save} disabled={busy} className="gap-1.5">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{t("actions.save")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default DealDetail;
