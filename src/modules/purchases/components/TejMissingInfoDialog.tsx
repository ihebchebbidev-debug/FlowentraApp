import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2, Loader2, FileDown, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RS_TRANSACTION_TYPES } from "@/modules/shared/types/retenue-source";

interface TejMissingInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable "please fill X" items returned by the backend. */
  missing: string[];
  /** Current invoice RS state — when RS isn't enabled the dialog offers to activate it inline. */
  rsApplicable?: boolean;
  rsTypeCode?: string | null;
  /**
   * Apply an RS type to the invoice and retry the TEJ download. Provided only for
   * invoice-level dialogs (the PO-level dialog leaves this undefined).
   */
  onApplyRs?: (rsTypeCode: string) => Promise<void>;
  /** True while an apply+download is in flight. */
  applying?: boolean;
  /** Current supplier fiscal fields so they can be edited inline when missing. */
  supplierCin?: string;
  supplierMatriculeFiscale?: string;
  onSaveSupplier?: (payload: { cin?: string; matriculeFiscale?: string }) => Promise<void>;
  savingSupplier?: boolean;
}

/**
 * Shown when the user tries to download the TEJ/RiTEJ XML but some required
 * information is still missing. Lists exactly what to complete — and, when the
 * blocker is simply that Retenue à la Source isn't enabled on the invoice yet,
 * lets the user activate it (pick the withholding type) and download right here.
 */
export function TejMissingInfoDialog({
  open,
  onOpenChange,
  missing,
  rsApplicable,
  rsTypeCode,
  onApplyRs,
  applying = false,
  supplierCin,
  supplierMatriculeFiscale,
  onSaveSupplier,
  savingSupplier = false,
}: TejMissingInfoDialogProps) {
  const { t } = useTranslation("purchases");
  const [selectedType, setSelectedType] = useState<string>(rsTypeCode || "10");
  const [cin, setCin] = useState<string>(supplierCin || "");
  const [matriculeFiscale, setMatriculeFiscale] = useState<string>(supplierMatriculeFiscale || "");

  useEffect(() => {
    setCin(supplierCin || "");
  }, [supplierCin]);

  useEffect(() => {
    setMatriculeFiscale(supplierMatriculeFiscale || "");
  }, [supplierMatriculeFiscale]);

  const canActivateRs = !!onApplyRs && (!rsApplicable || !rsTypeCode);
  const canEditSupplier = !!onSaveSupplier && missing.some((item) => /matricule fiscal|cin/i.test(item));
  const saveSupplierDisabled = applying || savingSupplier || (!matriculeFiscale.trim() && !cin.trim());

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!applying && !savingSupplier) onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 text-amber-600 dark:bg-amber-500/15">
              <AlertTriangle className="h-5 w-5" />
            </span>
            {t("tej.missingTitle", "Information needed for the TEJ XML")}
          </DialogTitle>
          <DialogDescription>
            {t(
              "tej.missingDescription",
              "Please complete the following before downloading the TEJ XML, then try again.",
            )}
          </DialogDescription>
        </DialogHeader>

        {missing.length > 0 && (
          <ul className="space-y-2 py-1">
            {missing.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Inline fix: activate Retenue à la Source on this invoice and download. */}
        {canActivateRs && (
          <div className="rounded-lg border border-primary/20 bg-primary/[0.04] p-3 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("tej.activateTitle", "Activate Retenue à la Source")}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "tej.activateDescription",
                "Choose the withholding type — we'll apply it to this invoice (the amount is computed automatically) and generate the XML.",
              )}
            </p>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">{t("tej.rsType", "Withholding type")}</Label>
              <Select value={selectedType} onValueChange={setSelectedType} disabled={applying}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RS_TRANSACTION_TYPES.map((r) => (
                    <SelectItem key={r.code} value={r.code}>
                      {r.rate}% — {r.labelFr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full gap-1.5"
              disabled={applying}
              onClick={() => onApplyRs?.(selectedType)}
            >
              {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {applying
                ? t("tej.applying", "Applying…")
                : t("tej.applyAndDownload", "Apply & Download XML")}
            </Button>
          </div>
        )}

        {canEditSupplier && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Sparkles className="h-4 w-4 text-primary" />
              {t("tej.supplierInfoTitle", "Supplier fiscal information")}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {t(
                "tej.supplierInfoDescription",
                "Update the supplier's fiscal identifier here and retry downloading the TEJ XML. This saves the information for future exports.",
              )}
            </p>
            <div className="grid gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">{t("fields.matriculeFiscale", "Matricule fiscale")}</Label>
                <Input
                  className="h-9"
                  value={matriculeFiscale}
                  onChange={(e) => setMatriculeFiscale(e.target.value)}
                  disabled={savingSupplier || applying}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">{t("fields.cin", "CIN")}</Label>
                <Input
                  className="h-9"
                  value={cin}
                  onChange={(e) => setCin(e.target.value)}
                  disabled={savingSupplier || applying}
                />
              </div>
            </div>
            <Button
              className="w-full gap-1.5"
              disabled={saveSupplierDisabled}
              onClick={() => onSaveSupplier?.({ cin: cin.trim() || undefined, matriculeFiscale: matriculeFiscale.trim() || undefined })}
            >
              {savingSupplier ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
              {savingSupplier
                ? t("tej.savingSupplier", "Saving…")
                : t("tej.saveSupplierAndRetry", "Save supplier & retry")}
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying || savingSupplier}>
            {t("tej.missingGotIt", "Got it")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
