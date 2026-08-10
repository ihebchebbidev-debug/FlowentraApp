import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, PackageSearch } from "lucide-react";
import { formatCurrencyValue } from "@/lib/formatters";
import { articlesApi } from "@/services/api/articlesApi";
import type { Article } from "@/types/articles";

export interface DealItemDraft {
  articleId?: number | null;
  type: "article" | "service";
  itemName: string;
  itemCode?: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  discountType: "percentage" | "fixed";
  installationId?: string | null;
  installationName?: string | null;
}

interface Props {
  items: DealItemDraft[];
  onChange: (items: DealItemDraft[]) => void;
  currency?: string;
}

/** Mirrors the server's ComputeLineTotal exactly (2-dp rounding) so the preview
 *  total never drifts a cent away from the value the API stores. */
function lineTotal(it: DealItemDraft): number {
  const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
  const gross = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
  const discount = Number(it.discount) || 0;
  if (discount <= 0) return round2(gross);
  const net = it.discountType === "fixed" ? gross - discount : gross * (1 - discount / 100);
  return round2(Math.max(net, 0));
}


export function DealItemsManager({ items, onChange, currency = "TND" }: Props) {
  const { t } = useTranslation("deals");
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    articlesApi.getAll({ limit: 200 } as any).then(r => setArticles(r.data || [])).catch(() => {});
  }, []);

  const update = (idx: number, patch: Partial<DealItemDraft>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const remove = (idx: number) => onChange(items.filter((_, i) => i !== idx));

  const addBlank = () =>
    onChange([...items, { type: "article", itemName: "", quantity: 1, unitPrice: 0, discount: 0, discountType: "percentage" }]);

  const pickArticle = (idx: number, articleId: string) => {
    const a = articles.find(x => x.id === articleId);
    if (!a) return;
    const isService = a.type === "service";
    update(idx, {
      articleId: /^\d+$/.test(a.id) ? Number(a.id) : null,
      type: isService ? "service" : "article",
      itemName: a.name,
      itemCode: a.sku,
      unitPrice: (isService ? a.basePrice : a.sellPrice) ?? a.sellPrice ?? a.basePrice ?? 0,
    });
  };

  const subtotal = items.reduce((s, it) => s + lineTotal(it), 0);

  return (
    <div className="space-y-2">
      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">{t("items.none")}</p>
      )}

      {items.map((it, idx) => (
        <div key={idx} className="grid grid-cols-12 gap-2 items-end border rounded-lg p-2">
          <div className="col-span-12 md:col-span-4">
            <label className="text-xs text-muted-foreground">{t("items.name")}</label>
            <div className="flex gap-1">
              <Input value={it.itemName} onChange={e => update(idx, { itemName: e.target.value })} placeholder={t("items.name")} />
              <Select onValueChange={v => pickArticle(idx, v)}>
                <SelectTrigger className="w-9 px-0 justify-center" title={t("items.fromCatalog")}>
                  <PackageSearch className="h-4 w-4" />
                </SelectTrigger>
                <SelectContent>
                  {articles.map(a => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="col-span-4 md:col-span-2">
            <label className="text-xs text-muted-foreground">{t("items.type")}</label>
            <Select value={it.type} onValueChange={v => update(idx, { type: v as DealItemDraft["type"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="article">{t("items.article")}</SelectItem>
                <SelectItem value="service">{t("items.service")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-3 md:col-span-1">
            <label className="text-xs text-muted-foreground">{t("items.quantity")}</label>
            <Input type="number" min={0} value={it.quantity} onChange={e => update(idx, { quantity: Number(e.target.value) })} />
          </div>
          <div className="col-span-5 md:col-span-2">
            <label className="text-xs text-muted-foreground">{t("items.unitPrice")}</label>
            <Input type="number" min={0} value={it.unitPrice} onChange={e => update(idx, { unitPrice: Number(e.target.value) })} />
          </div>
          <div className="col-span-6 md:col-span-2 text-right">
            <label className="text-xs text-muted-foreground block">{t("items.lineTotal")}</label>
            <span className="text-sm font-medium">{formatCurrencyValue(lineTotal(it), currency)}</span>
          </div>
          <div className="col-span-6 md:col-span-1 flex justify-end">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => remove(idx)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ))}

      <div className="flex items-center justify-between pt-1">
        <Button type="button" variant="outline" size="sm" onClick={addBlank} className="gap-1.5">
          <Plus className="h-4 w-4" /> {t("items.add")}
        </Button>
        {items.length > 0 && (
          <span className="text-sm font-semibold">{formatCurrencyValue(subtotal, currency)}</span>
        )}
      </div>
    </div>
  );
}

export default DealItemsManager;
