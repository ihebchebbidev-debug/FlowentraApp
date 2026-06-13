import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { dealsApi, type CreateDealRequest } from "@/services/api/dealsApi";
import { DealForm, type DealFormValues } from "../components/DealForm";

export function EditDeal() {
  const { t } = useTranslation("deals");
  const { id } = useParams();
  const navigate = useNavigate();
  const dealId = Number(id);

  const [initial, setInitial] = useState<Partial<DealFormValues> | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!dealId) return;
    dealsApi.getById(dealId).then(d => {
      setInitial({
        title: d.title,
        contactId: d.contactId,
        stage: d.stage,
        estimatedValue: d.estimatedValue,
        currency: d.currency,
        probability: d.probability,
        expectedCloseDate: d.expectedCloseDate ? d.expectedCloseDate.slice(0, 10) : "",
        category: d.category || "",
        source: d.source || "",
        description: d.description || "",
        notes: d.notes || "",
        items: (d.items || []).map(it => ({
          articleId: it.articleId ?? null,
          type: it.type,
          itemName: it.itemName,
          itemCode: it.itemCode,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount ?? 0,
          discountType: (it.discountType as any) || "percentage",
        })),
      });
    }).catch(() => toast.error(t("toast.loadError")));
  }, [dealId, t]);

  const handleSubmit = async (payload: CreateDealRequest) => {
    setSubmitting(true);
    try {
      const { items, ...rest } = payload;
      await dealsApi.update(dealId, rest);
      // Sync line items: replace the existing set with the submitted one.
      const current = await dealsApi.getById(dealId);
      await Promise.all((current.items || []).filter(it => it.id).map(it => dealsApi.deleteItem(dealId, it.id!)));
      for (const it of items || []) {
        await dealsApi.addItem(dealId, it);
      }
      toast.success(t("toast.updated"));
      navigate(`/dashboard/deals/${dealId}`);
    } catch {
      toast.error(t("toast.saveError"));
    } finally {
      setSubmitting(false);
    }
  };

  if (!initial) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="h-5 w-5 animate-spin" /></div>;
  }

  return <DealForm mode="edit" initial={initial} submitting={submitting} onSubmit={handleSubmit} />;
}

export default EditDeal;
