import { useTranslation } from "react-i18next";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TejMissingInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Human-readable "please fill X" items returned by the backend. */
  missing: string[];
}

/**
 * Shown when the user tries to download the TEJ/RiTEJ XML but some required
 * information is still missing. Lists exactly what to complete so they can fix it.
 */
export function TejMissingInfoDialog({ open, onOpenChange, missing }: TejMissingInfoDialogProps) {
  const { t } = useTranslation("purchases");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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

        <ul className="space-y-2 py-1">
          {missing.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>
            {t("tej.missingGotIt", "Got it")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
