import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save, Handshake, Package, X } from "lucide-react";
import { toast } from "sonner";
import { DEAL_STAGES } from "../lib/dealStages";
import type { DealItemDraft } from "./DealItemsManager";
import { ContactSelectorWithType } from "@/modules/offers/components/ContactSelectorWithType";
import { OfferItemsSelectorAdvanced } from "@/modules/offers/components/OfferItemsSelectorAdvanced";
import type { OfferItem } from "@/modules/offers/types";
import { InstallationSelector } from "@/modules/field/installations/components/InstallationSelector";
import { CreateInstallationModal } from "@/modules/field/installations/components/CreateInstallationModal";
import type { CreateDealRequest } from "@/services/api/dealsApi";

const CURRENCIES = ["TND", "USD", "EUR", "GBP"];

export interface DealFormValues {
  title: string;
  contactId: number | null;
  /** Optional contact display details (used to pre-fill the selector in edit mode). */
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  contactAddress: string;
  stage: string;
  estimatedValue: number;
  currency: string;
  probability: number;
  expectedCloseDate: string;
  category: string;
  source: string;
  description: string;
  notes: string;
  items: DealItemDraft[];
  /** Set when creating a deal from within a project — links it to that project. */
  projectId: number | null;
}

interface Props {
  mode: "add" | "edit";
  initial?: Partial<DealFormValues>;
  submitting: boolean;
  onSubmit: (payload: CreateDealRequest) => void;
}

// Discount-aware line total, matching the backend's ComputeLineTotal.
const lineTotalOf = (it: { quantity: number; unitPrice: number; discount?: number; discountType?: string }) => {
  const gross = (it.quantity || 0) * (it.unitPrice || 0);
  const d = it.discount || 0;
  if (d <= 0) return gross;
  return it.discountType === "fixed" ? Math.max(gross - d, 0) : gross * (1 - d / 100);
};

// ── Bridge the shared offer items selector (OfferItem) to the deal payload (DealItemDraft) ──
const draftsToOfferItems = (drafts: DealItemDraft[]): OfferItem[] =>
  drafts.map((d, i) => ({
    id: `deal-item-${i}-${Date.now()}`,
    offerId: "",
    type: d.type,
    itemId: d.articleId != null ? String(d.articleId) : "",
    itemName: d.itemName,
    itemCode: d.itemCode,
    quantity: d.quantity,
    unitPrice: d.unitPrice,
    totalPrice: lineTotalOf(d),
    discount: d.discount,
    discountType: d.discountType,
    installationId: d.installationId ?? undefined,
    installationName: d.installationName ?? undefined,
  }));

const offerItemsToDrafts = (items: OfferItem[]): DealItemDraft[] =>
  items.map(it => ({
    articleId: it.itemId ? Number(it.itemId) || null : null,
    type: it.type,
    itemName: it.itemName,
    itemCode: it.itemCode,
    quantity: it.quantity,
    unitPrice: it.unitPrice,
    discount: it.discount ?? 0,
    discountType: it.discountType ?? "percentage",
    installationId: it.installationId ?? null,
    installationName: it.installationName ?? null,
  }));

export function DealForm({ mode, initial, submitting, onSubmit }: Props) {
  const { t } = useTranslation("deals");
  const navigate = useNavigate();

  const [v, setV] = useState<DealFormValues>({
    title: "",
    contactId: null,
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
    stage: "lead",
    estimatedValue: 0,
    currency: "TND",
    probability: 20,
    expectedCloseDate: "",
    category: "",
    source: "",
    description: "",
    notes: "",
    items: [],
    projectId: null,
    ...initial,
  });

  // Items are held in the shared selector's shape so we can reuse it verbatim.
  const [offerItems, setOfferItems] = useState<OfferItem[]>(() => draftsToOfferItems(initial?.items ?? []));
  const [selectedInstallations, setSelectedInstallations] = useState<any[]>([]);
  const [showCreateInstallation, setShowCreateInstallation] = useState(false);

  useEffect(() => {
    if (!initial) return;
    setV(prev => ({ ...prev, ...initial }));
    if (initial.items) setOfferItems(draftsToOfferItems(initial.items));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  const set = <K extends keyof DealFormValues>(k: K, val: DealFormValues[K]) => setV(prev => ({ ...prev, [k]: val }));

  // Items drive the value once any exist; otherwise the manual estimate is used.
  const itemsSubtotal = useMemo(() => offerItems.reduce((s, it) => s + lineTotalOf(it), 0), [offerItems]);
  const effectiveValue = offerItems.length > 0 ? itemsSubtotal : v.estimatedValue;

  const handleContactSelect = (contact: { id: string; name: string; email?: string; phone?: string; address?: string } | null) => {
    setSelectedInstallations([]); // installations belong to a contact — reset on change
    if (!contact) {
      setV(prev => ({ ...prev, contactId: null, contactName: "", contactEmail: "", contactPhone: "", contactAddress: "" }));
      return;
    }
    setV(prev => ({
      ...prev,
      contactId: Number(contact.id) || null,
      contactName: contact.name,
      contactEmail: contact.email || "",
      contactPhone: contact.phone || "",
      contactAddress: contact.address || "",
    }));
  };

  const handleSubmit = () => {
    if (!v.title.trim() || !v.contactId) {
      toast.error(t("form.required"));
      return;
    }
    const drafts = offerItemsToDrafts(offerItems);
    const payload: CreateDealRequest = {
      title: v.title.trim(),
      description: v.description || undefined,
      contactId: v.contactId,
      projectId: v.projectId ?? undefined,
      stage: v.stage as any,
      probability: v.probability,
      estimatedValue: drafts.length > 0 ? Math.round(itemsSubtotal * 100) / 100 : v.estimatedValue,
      currency: v.currency,
      expectedCloseDate: v.expectedCloseDate || undefined,
      category: v.category || undefined,
      source: v.source || undefined,
      notes: v.notes || undefined,
      items: drafts.map(it => ({
        articleId: it.articleId ?? null,
        type: it.type,
        itemName: it.itemName,
        itemCode: it.itemCode,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        discountType: it.discountType,
        installationId: it.installationId ?? null,
        installationName: it.installationName ?? null,
      })),
    };
    onSubmit(payload);
  };

  const selectedContact = v.contactId
    ? { id: String(v.contactId), name: v.contactName, email: v.contactEmail, phone: v.contactPhone, address: v.contactAddress }
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard/deals" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t("form.backToDeals", { defaultValue: "Back to deals" })}
            </Link>
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10">
              <Handshake className="h-4 w-4 text-primary" />
            </div>
            <h1 className="text-sm font-medium">{mode === "add" ? t("form.addTitle") : t("form.editTitle")}</h1>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Deal information */}
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="title">{t("form.title")} *</Label>
                  <Input
                    id="title"
                    value={v.title}
                    onChange={e => set("title", e.target.value)}
                    placeholder={t("form.titlePlaceholder")}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">{t("form.category")}</Label>
                    <Input id="category" value={v.category} onChange={e => set("category", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="source">{t("form.source")}</Label>
                    <Input id="source" value={v.source} onChange={e => set("source", e.target.value)} />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">{t("form.description")}</Label>
                  <Textarea
                    id="description"
                    value={v.description}
                    onChange={e => set("description", e.target.value)}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardContent className="pt-6">
                <ContactSelectorWithType onContactSelect={handleContactSelect} selectedContact={selectedContact} />
              </CardContent>
            </Card>

            {/* Installations — link items to physical equipment (mirrors offers/sales) */}
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  <InstallationSelector
                    onSelect={(installation: any) => {
                      setSelectedInstallations(prev => (prev.some(i => i.id === installation.id) ? prev : [...prev, installation]));
                    }}
                    selectedInstallation={null}
                    selectedInstallations={selectedInstallations}
                    onCreateNew={() => setShowCreateInstallation(true)}
                  />

                  {selectedInstallations.length > 0 && (
                    <div className="space-y-2">
                      {selectedInstallations.map(inst => (
                        <div key={inst.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4 text-primary" />
                            <div>
                              <span className="font-medium text-sm">{inst.name}</span>
                              <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                                {inst.model && <div>{inst.manufacturer} - {inst.model}</div>}
                                {inst.serialNumber && <div>{t("form.installationSerial", { defaultValue: "Serial" })}: {inst.serialNumber}</div>}
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive h-7 w-7 p-0"
                            onClick={() => {
                              setSelectedInstallations(prev => prev.filter(i => i.id !== inst.id));
                              // Unlink items that referenced the removed installation.
                              setOfferItems(prev => prev.map(it =>
                                it.installationId === String(inst.id)
                                  ? { ...it, installationId: undefined, installationName: undefined }
                                  : it,
                              ));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Items — only after a contact is chosen (mirrors offers/sales) */}
            {v.contactId && (
              <Card>
                <CardContent className="pt-6">
                  <OfferItemsSelectorAdvanced
                    items={offerItems}
                    onUpdateItems={setOfferItems}
                    currency={v.currency}
                    installations={selectedInstallations}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Deal settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t("form.dealSettings", { defaultValue: "Deal settings" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>{t("form.stage")}</Label>
                  <Select value={v.stage} onValueChange={val => set("stage", val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DEAL_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{t(`stages.${s.id}`)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>{t("form.probability")}</Label>
                    <Input type="number" min={0} max={100} value={v.probability} onChange={e => set("probability", Number(e.target.value))} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("form.currency")}</Label>
                    <Select value={v.currency} onValueChange={val => set("currency", val)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t("form.expectedClose")}</Label>
                  <Input type="date" value={v.expectedCloseDate} onChange={e => set("expectedCloseDate", e.target.value)} />
                </div>
              </CardContent>
            </Card>

            {/* Value summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t("form.valueSummary", { defaultValue: "Value" })}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {offerItems.length > 0 ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>{t("form.itemsSubtotal", { defaultValue: "Items subtotal" })}:</span>
                      <span className="font-medium">{itemsSubtotal.toLocaleString()} {v.currency}</span>
                    </div>
                    <div className="flex justify-between font-semibold text-base border-t pt-2">
                      <span>{t("form.value")}:</span>
                      <span>{effectiveValue.toLocaleString()} {v.currency}</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="estimatedValue">{t("form.value")}</Label>
                    <div className="flex gap-2">
                      <Input
                        id="estimatedValue"
                        type="number"
                        min={0}
                        value={v.estimatedValue}
                        onChange={e => set("estimatedValue", Number(e.target.value))}
                        className="flex-1"
                      />
                      <div className="flex h-10 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                        {v.currency}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{t("form.valueHint", { defaultValue: "Add items to compute this automatically." })}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t("form.notes")}</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea value={v.notes} onChange={e => set("notes", e.target.value)} rows={4} />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex justify-end gap-3 pt-6 border-t mt-6">
          <Button variant="outline" onClick={() => navigate("/dashboard/deals")} disabled={submitting}>
            {t("actions.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {submitting ? t("actions.saving") : t("actions.save")}
          </Button>
        </div>
      </div>

      <CreateInstallationModal
        open={showCreateInstallation}
        onOpenChange={setShowCreateInstallation}
        onInstallationCreated={(installation: any) => {
          const newInst = {
            id: installation.id,
            name: installation.name,
            model: installation.model,
            manufacturer: installation.manufacturer,
            serialNumber: installation.serialNumber,
          };
          setSelectedInstallations(prev => (prev.some(i => i.id === newInst.id) ? prev : [...prev, newInst]));
          setShowCreateInstallation(false);
        }}
      />
    </div>
  );
}

export default DealForm;
