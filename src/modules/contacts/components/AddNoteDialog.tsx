import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';

interface AddNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (note: string) => Promise<void>;
  isLoading?: boolean;
  mode?: 'add' | 'edit';
  initialValue?: string;
}

export function AddNoteDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  mode = 'add',
  initialValue = '',
}: AddNoteDialogProps) {
  const { t } = useTranslation('contacts');
  const [note, setNote] = useState(initialValue);

  useEffect(() => {
    if (open) setNote(initialValue);
  }, [open, initialValue]);

  const isEdit = mode === 'edit';

  const handleSubmit = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;

    await onSubmit(trimmed);
    setNote('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setNote('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('detail.notes.edit') : t('detail.notes.add')}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? t('detail.notes.edit_description')
              : t('detail.notes.description')}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t('detail.notes.placeholder')}
            className="min-h-[120px] resize-none"
            autoFocus
          />
        </div>
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            {t('detail.notes.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={!note.trim() || isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEdit ? t('detail.notes.updating') : t('detail.notes.adding')}
              </>
            ) : isEdit ? (
              t('detail.notes.update')
            ) : (
              t('detail.notes.add')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
