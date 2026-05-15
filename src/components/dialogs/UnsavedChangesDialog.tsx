import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslation } from "react-i18next";
import { Save, X } from "lucide-react";

interface UnsavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesDialog({
  open,
  onOpenChange,
  onSave,
  onDiscard,
  onCancel,
  isSaving = false,
}: UnsavedChangesDialogProps) {
  const { t } = useTranslation('unsavedChanges');

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-warning/10">
              <Save className="h-5 w-5 text-warning" />
            </div>
            {t('title')}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {t('description')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-col sm:flex-row gap-2">
          <AlertDialogCancel 
            onClick={onCancel}
            className="mt-0"
          >
            {t('cancel')}
          </AlertDialogCancel>
          <button
            onClick={onDiscard}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 px-4 py-2 border border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4 mr-2" />
            {t('discard')}
          </button>
          <AlertDialogAction
            onClick={onSave}
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? t('saving') : t('save')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
