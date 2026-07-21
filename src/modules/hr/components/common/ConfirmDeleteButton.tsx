import { ReactNode } from 'react';
import { Button, type ButtonProps } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useTranslation } from 'react-i18next';

interface Props extends Omit<ButtonProps, 'onClick'> {
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  triggerContent: ReactNode;
  disabled?: boolean;
}

/**
 * Small wrapper that gates a destructive action behind an AlertDialog confirm.
 * Prevents accidental clicks on trash icons across HR pages.
 */
export function ConfirmDeleteButton({
  onConfirm,
  title,
  description,
  confirmLabel,
  cancelLabel,
  triggerContent,
  disabled,
  ...buttonProps
}: Props) {
  const { t } = useTranslation('hr');
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button {...buttonProps} disabled={disabled}>
          {triggerContent}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title ?? t('common.deleteTitle', { defaultValue: 'Delete this item?' })}</AlertDialogTitle>
          <AlertDialogDescription>
            {description ?? t('common.deleteHint', { defaultValue: 'This action cannot be undone.' })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel ?? t('cancel', { defaultValue: 'Cancel' })}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {confirmLabel ?? t('common.delete', { defaultValue: 'Delete' })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
