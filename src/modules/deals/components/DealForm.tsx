import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { contactsApi } from "@/services/api/contactsApi";
import type { Contact } from "@/types/contacts";
import { DEAL_STAGES } from "../lib/dealStages";
import { DealItemsManager, type DealItemDraft } from "./DealItemsManager";
import type { CreateDealRequest } from "@/services/api/dealsApi";

const CURRENCIES = ["TND", "USD", "EUR", "GBP"];

export interface DealFormValues {
  title: string;
  contactId: number | null;
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
}

interface Props {
  mode: "add" | "edit";
  initial?: Partial<DealFormValues>;
  submitting: boolean;
  onSubmit: (payload: CreateDealRequest) => void;
}

export function DealForm({ mode, initial, submitting, onSubmit }: Props) {
  const { t } = useTranslation("deals");
  const navigate = useNavigate();
  const [contacts, setContacts] = useState<Contact[]>([]);

  const [v, setV] = useState<DealFormValues>({
    title: "",
    contactId: null,
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
    ...initial,
  });

  useEffect(() => {
    if (initial) setV(prev => ({ ...prev, ...initial }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(initial)]);

  useEffect(() => {
    contactsApi.getAll({ pageSize: 200 } as any).then(r => setContacts(r.contacts || [])).catch(() => {});
  }, []);

  const set = <K extends keyof DealFormValues>(k: K, val: DealFormValues[K]) => setV(prev => ({ ...prev, [k]: val }));

  const handleSubmit = () => {
    if (!v.title.trim() || !v.contactId) {
      toast.error(t("form.required"));
      return;
    }
    const payload: CreateDealRequest = {
      title: v.title.trim(),
      description: v.description || undefined,
      contactId: v.contactId,
      stage: v.stage as any,
      probability: v.probability,
      estimatedValue: v.estimatedValue,
      currency: v.currency,
      expectedCloseDate: v.expectedCloseDate || undefined,
      category: v.category || undefined,
      source: v.source || undefined,
      notes: v.notes || undefined,
      items: v.items.map(it => ({
        articleId: it.articleId ?? null,
        type: it.type,
        itemName: it.itemName,
        itemCode: it.itemCode,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        discount: it.discount,
        discountType: it.discountType,
      })),
    };
    onSubmit(payload);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/deals")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-xl font-bold">{mode === "add" ? t("form.addTitle") : t("form.editTitle")}</h1>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div>
            <Label>{t("form.title")} *</Label>
            <Input value={v.title} onChange={e => set("title", e.target.value)} placeholder={t("form.titlePlaceholder")} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("form.customer")} *</Label>
              <Select value={v.contactId ? String(v.contactId) : ""} onValueChange={val => set("contactId", Number(val))}>
                <SelectTrigger><SelectValue placeholder={t("form.selectCustomer")} /></SelectTrigger>
                <SelectContent>
                  {contacts.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}{c.company ? ` — ${c.company}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("form.stage")}</Label>
              <Select value={v.stage} onValueChange={val => set("stage", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DEAL_STAGES.map(s => <SelectItem key={s.id} value={s.id}>{t(`stages.${s.id}`)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label>{t("form.value")}</Label>
              <Input type="number" min={0} value={v.estimatedValue} onChange={e => set("estimatedValue", Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("form.currency")}</Label>
              <Select value={v.currency} onValueChange={val => set("currency", val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>{t("form.probability")}</Label>
              <Input type="number" min={0} max={100} value={v.probability} onChange={e => set("probability", Number(e.target.value))} />
            </div>
            <div>
              <Label>{t("form.expectedClose")}</Label>
              <Input type="date" value={v.expectedCloseDate} onChange={e => set("expectedCloseDate", e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t("form.category")}</Label>
              <Input value={v.category} onChange={e => set("category", e.target.value)} />
            </div>
            <div>
              <Label>{t("form.source")}</Label>
              <Input value={v.source} onChange={e => set("source", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>{t("form.description")}</Label>
            <Textarea value={v.description} onChange={e => set("description", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">{t("form.items")}</CardTitle></CardHeader>
        <CardContent>
          <DealItemsManager items={v.items} onChange={items => set("items", items)} currency={v.currency} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <Label>{t("form.notes")}</Label>
          <Textarea value={v.notes} onChange={e => set("notes", e.target.value)} rows={2} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate("/dashboard/deals")} disabled={submitting}>{t("actions.cancel")}</Button>
        <Button onClick={handleSubmit} disabled={submitting} className="gap-1.5">
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {submitting ? t("actions.saving") : t("actions.save")}
        </Button>
      </div>
    </div>
  );
}

export default DealForm;
