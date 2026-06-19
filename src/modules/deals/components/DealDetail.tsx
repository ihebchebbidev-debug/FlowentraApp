import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Edit, GitBranch, Trash2, Loader2, Building2, User, Calendar,
  DollarSign, Target, Send, ShoppingCart, Briefcase, FileText, CheckCircle2,
  Package, Wrench, ExternalLink,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { formatCurrencyValue } from "@/lib/formatters";
import { dealsApi, type Deal, type DealActivity } from "@/services/api/dealsApi";
import { stageBadgeClass } from "../lib/dealStages";
import { ConvertDealModal } from "./ConvertDealModal";
import { UnifiedDocumentsSection, type DocumentEntityRef } from "@/modules/shared/components/documents/UnifiedDocumentsSection";
import { ChecklistsSection } from "@/modules/shared/components/documents";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function DealDetail() {
  const { t } = useTranslation("deals");
  const { id } = useParams();
  const navigate = useNavigate();
  const dealId = Number(id);

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [convertOpen, setConvertOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setDeal(await dealsApi.getById(dealId));
    } catch {
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

  if (loading || !deal) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  const converted = deal.convertedToSaleId || deal.convertedToProjectId || deal.convertedToOfferId;

  return (
    <div className="min-h-screen bg-background">
      {/* Header — full-width sticky card (matches offers/sales) */}
      <div className="border-b border-border bg-gradient-subtle backdrop-blur-sm sticky top-0 z-20 shadow-soft">
        <div className="p-4 lg:p-6">
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
                <div className="flex items-center justify-between gap-6 flex-wrap">
                  <div className="flex items-center gap-3 min-w-0 flex-wrap">
                    <h1 className="text-xl font-bold truncate">{deal.title}</h1>
                    <Badge variant="secondary" className={stageBadgeClass(deal.stage)}>{t(`stages.${deal.stage}`)}</Badge>
                    <span className="text-sm text-muted-foreground">
                      {deal.dealNumber} · {deal.contactName || deal.contact?.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/deals/${dealId}/edit`)} className="gap-1.5">
                      <Edit className="h-4 w-4" /> {t("actions.edit")}
                    </Button>
                    <Button size="sm" onClick={() => setConvertOpen(true)} className="gap-1.5">
                      <GitBranch className="h-4 w-4" /> {t("actions.convert")}
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => setDeleteOpen(true)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
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

        <Tabs defaultValue="overview">
          <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-lg grid grid-cols-3 sm:grid-cols-6">
            <TabsTrigger value="overview">{t("detail.tabs.overview")}</TabsTrigger>
            <TabsTrigger value="items">{t("detail.tabs.items")}</TabsTrigger>
            <TabsTrigger value="documents">{t("detail.tabs.documents")}</TabsTrigger>
            <TabsTrigger value="checklists">{t("detail.tabs.checklists")}</TabsTrigger>
            <TabsTrigger value="activity">{t("detail.tabs.activity")}</TabsTrigger>
            <TabsTrigger value="notes">{t("detail.tabs.notes")}</TabsTrigger>
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview"><OverviewTab deal={deal} /></TabsContent>
            <TabsContent value="items"><ItemsTab deal={deal} /></TabsContent>
            <TabsContent value="documents"><DocumentsTab deal={deal} /></TabsContent>
            <TabsContent value="checklists"><ChecklistsTab deal={deal} /></TabsContent>
            <TabsContent value="activity"><ActivityTab dealId={dealId} /></TabsContent>
            <TabsContent value="notes"><NotesTab deal={deal} onSaved={load} /></TabsContent>
          </div>
        </Tabs>
      </div>

      {convertOpen && (
        <ConvertDealModal deal={deal} open={convertOpen} onClose={() => setConvertOpen(false)} onConverted={() => { setConvertOpen(false); load(); }} />
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

function OverviewTab({ deal }: { deal: Deal }) {
  const { t } = useTranslation("deals");
  const rows: [any, string, string][] = [
    [User, t("detail.customer"), deal.contactName || deal.contact?.name || "—"],
    [Building2, t("detail.category"), deal.category || "—"],
    [Calendar, t("detail.created"), deal.createdAt ? format(new Date(deal.createdAt), "dd MMM yyyy") : "—"],
    [User, t("detail.owner"), deal.assignedToName || deal.createdByName || "—"],
  ];
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {rows.map(([Icon, label, value], i) => (
            <div key={i} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{label}:</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-1">{t("detail.description")}</p>
          <p className="text-sm">{deal.description || t("detail.noDescription")}</p>
        </div>
      </CardContent>
    </Card>
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
              <TableHead>{t("items.name")}</TableHead>
              <TableHead>{t("items.type")}</TableHead>
              <TableHead className="text-center">{t("items.quantity")}</TableHead>
              <TableHead className="text-right">{t("items.unitPrice")}</TableHead>
              <TableHead className="text-right">{t("items.discount", { defaultValue: "Discount" })}</TableHead>
              <TableHead className="text-right">{t("items.lineTotal")}</TableHead>
              <TableHead className="text-center">{t("items.installation", { defaultValue: "Installation" })}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(it => (
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
  const { t } = useTranslation("deals");
  const [activities, setActivities] = useState<DealActivity[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    dealsApi.getActivities(dealId).then(r => setActivities(r.activities)).catch(() => {});
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
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("activity.none")}</p>
        ) : (
          <div className="space-y-2">
            {activities.map(a => (
              <div key={a.id} className="flex items-start gap-2 border-l-2 border-muted pl-3 py-1">
                <div className="min-w-0">
                  <p className="text-sm">{a.description}</p>
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
