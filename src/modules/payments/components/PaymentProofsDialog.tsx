import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Paperclip, Pencil, Trash2, Eye, Check, X, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { paymentsApi } from '@/services/api/paymentsApi';
import type { EntityType, Payment, PaymentProofDocument } from '@/modules/payments/types';
import { uploadPaymentProofs, PROOF_ACCEPT, PROOF_MAX_BYTES } from './paymentProofUpload';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  payment: Payment;
  entityType: EntityType;
  entityId: string;
  entityNumber?: string;
  onPreview: (documentId?: string) => void;
  onChanged: () => void;
}

export function PaymentProofsDialog({
  open, onOpenChange, payment, entityType, entityId, entityNumber, onPreview, onChanged,
}: Props) {
  const { t } = useTranslation('payments');
  const [proofs, setProofs] = useState<PaymentProofDocument[]>(payment.proofDocuments ?? []);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setProofs(await paymentsApi.getProofs(entityType, entityId, payment.id));
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, payment.id]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const handleUpload = async (files: FileList | null) => {
    if (!files?.length) return;
    const list = Array.from(files);
    if (list.some((f) => f.size > PROOF_MAX_BYTES)) {
      toast.error(t('fileTooLarge', 'File is too large (max 20MB)'));
      return;
    }
    setUploading(true);
    try {
      const uploaded = await uploadPaymentProofs(list, {
        entityType, entityId, entityNumber, reference: payment.paymentReference || payment.receiptNumber,
      });
      await paymentsApi.addProofs(entityType, entityId, payment.id, uploaded);
      toast.success(t('proofAdded', 'Proof added'));
      await load();
      onChanged();
    } catch (err: any) {
      console.error('[PaymentProofsDialog] Upload failed:', err);
      toast.error(err?.message || 'Failed to add proof document');
    } finally {
      setUploading(false);
    }
  };

  const handleRename = async (proof: PaymentProofDocument) => {
    const name = editName.trim();
    if (!name) return;
    setBusyId(proof.id);
    try {
      await paymentsApi.renameProof(entityType, entityId, payment.id, proof.id, name);
      setEditingId(null);
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to rename');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (proof: PaymentProofDocument) => {
    setBusyId(proof.id);
    try {
      await paymentsApi.deleteProof(entityType, entityId, payment.id, proof.id);
      toast.success(t('proofRemoved', 'Proof removed'));
      await load();
      onChanged();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to remove proof');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip className="h-4 w-4" />
            {t('proofOfPayment', 'Proof of payment')}
          </DialogTitle>
          <DialogDescription>
            {payment.paymentReference || payment.receiptNumber || payment.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-1 max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground py-4 justify-center">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('loading', 'Loading...')}
            </div>
          ) : proofs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {t('noProofDocuments', 'No proof documents yet.')}
            </p>
          ) : (
            proofs.map((proof) => (
              <div key={proof.id} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                <Paperclip className="h-3.5 w-3.5 text-primary shrink-0" />
                {editingId === proof.id ? (
                  <>
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-7 text-xs flex-1"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === 'Enter') handleRename(proof); }}
                    />
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleRename(proof)} disabled={busyId === proof.id}>
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingId(null)}>
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-xs truncate flex-1" title={proof.documentName}>
                      {proof.documentName || `#${proof.documentId}`}
                    </span>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary"
                      title={t('view', 'View')}
                      onClick={() => onPreview(proof.documentId)}
                      disabled={!proof.documentId}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-primary"
                      title={t('rename', 'Rename')}
                      onClick={() => { setEditingId(proof.id); setEditName(proof.documentName || ''); }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      title={t('delete', 'Delete')}
                      onClick={() => handleDelete(proof)}
                      disabled={busyId === proof.id}
                    >
                      {busyId === proof.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                    </Button>
                  </>
                )}
              </div>
            ))
          )}
        </div>

        <div className="space-y-1.5">
          <Input
            type="file"
            multiple
            accept={PROOF_ACCEPT}
            className="cursor-pointer"
            disabled={uploading}
            onChange={(e) => { handleUpload(e.target.files); e.target.value = ''; }}
          />
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
            {uploading
              ? t('uploading', 'Uploading...')
              : t('proofOfPaymentHint', "PDF or image. Saved to this record's documents.")}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('close', 'Close')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
