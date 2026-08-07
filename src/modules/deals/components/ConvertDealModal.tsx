import { useState } from "react";
import { useTranslation } from "react-i18next";
import { usePlugins } from '@/modules/shared/plugins/usePlugins';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShoppingCart, Briefcase, FileText, Loader2, CheckCircle2, Building2 } from "lucide-react";
import { dealsApi, type Deal } from "@/services/api/dealsApi";
import { useTargetTenant } from "@/hooks/useTargetTenant";

interface Props {
  deal: Deal;
  open: boolean;
  onClose: () => void;
  onConverted: () => void;
}

export function ConvertDealModal({ deal, open, onClose, onConverted }: Props) {
  const { t } = useTranslation("deals");
  const { isEnabled: isPluginEnabled } = usePlugins();
  // In "view all companies" mode a MainAdmin has no single target tenant, so the
  // backend rejects mutations. Force them to pick the deal's company from the
  // top bar before converting (the conversion writes into that company).
  const { viewAll } = useTargetTenant();
  const [toSale, setToSale] = useState(false);
  const [toProject, setToProject] = useState(false);
  const [toOffer, setToOffer] = useState(false);
  const [busy, setBusy] = useState(false);

  const alreadySale = !!deal.convertedToSaleId;
  const alreadyProject = !!deal.convertedToProjectId;
  const alreadyOffer = !!deal.convertedToOfferId;

  const targets = [
    { key: "sale", icon: ShoppingCart, checked: toSale, set: setToSale, disabled: alreadySale,
      title: t("convert.toSale"), desc: t("convert.toSaleDesc"), note: alreadySale ? t("convert.alreadySale") : null },
    { key: "project", icon: Briefcase, checked: toProject, set: setToProject, disabled: alreadyProject,
      title: t("convert.toProject"), desc: t("convert.toProjectDesc"), note: alreadyProject ? t("convert.alreadyProject") : null },
    { key: "offer", icon: FileText, checked: toOffer, set: setToOffer, disabled: alreadyOffer,
      title: t("convert.toOffer"), desc: t("convert.toOfferDesc"), note: alreadyOffer ? t("convert.alreadyOffer") : null },
  ].filter((target) => isPluginEnabled(
    target.key === "sale" ? "PL0002SALES" : target.key === "project" ? "PL0004PROJECTS" : "PL0005OFFERS"
  ));

  const handleConvert = async () => {
    if (viewAll) {
      toast.error(t("tenant.selectCompany", { defaultValue: "Select a company from the top bar first." }));
      return;
    }
    if (!toSale && !toProject && !toOffer) {
      toast.error(t("convert.pickOne"));
      return;
    }
    setBusy(true);
    try {
      await dealsApi.convert(deal.id, { convertToSale: toSale, convertToProject: toProject, convertToOffer: toOffer });
      toast.success(t("toast.converted"));
      onConverted();
    } catch (e: any) {
      toast.error(e?.message || t("toast.convertError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={o => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("convert.title")}</DialogTitle>
          <DialogDescription>{t("convert.description")}</DialogDescription>
        </DialogHeader>

        {viewAll && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-3 text-sm text-amber-700 dark:text-amber-300">
            <Building2 className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{t("tenant.selectCompanyHint", { defaultValue: "You're viewing all companies. Select this deal's company from the top bar to convert it." })}</span>
          </div>
        )}

        <div className="space-y-2">
          {targets.map(tg => (
            <label
              key={tg.key}
              className={`flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                tg.disabled ? "opacity-60 cursor-not-allowed" : "hover:bg-muted/50"
              } ${tg.checked ? "border-primary bg-primary/5" : ""}`}
            >
              <Checkbox
                checked={tg.checked}
                disabled={tg.disabled}
                onCheckedChange={v => tg.set(!!v)}
                className="mt-0.5"
              />
              <tg.icon className="h-5 w-5 text-primary mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="font-medium text-sm">{tg.title}</p>
                <p className="text-xs text-muted-foreground">{tg.desc}</p>
                {tg.note && (
                  <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="h-3 w-3" /> {tg.note}
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>{t("actions.cancel")}</Button>
          <Button onClick={handleConvert} disabled={busy || viewAll} className="gap-1.5">
            {busy ? <><Loader2 className="h-4 w-4 animate-spin" /> {t("convert.converting")}</> : t("convert.confirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConvertDealModal;
