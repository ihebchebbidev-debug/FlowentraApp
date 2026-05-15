import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldError } from "@/components/ui/field-error";
import { validateAmount } from "../hooks/useContactValidation";
import offerStatuses from '@/data/mock/offer-statuses.json';

export type OfferStatus = "pending" | "negotiation" | "won" | "lost";

export interface NewOfferInput {
  title: string;
  amount: number;
  status: OfferStatus;
}

interface AddOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (offer: NewOfferInput) => void;
}

export default function AddOfferModal({ open, onOpenChange, onAdd }: AddOfferModalProps) {
  const { t } = useTranslation('contacts');
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [status, setStatus] = useState<OfferStatus>("pending");
  const [errors, setErrors] = useState<Record<string, string | null>>({});

  const reset = () => {
    setTitle("");
    setAmount("");
    setStatus("pending");
    setErrors({});
  };

  const setFieldError = (field: string, error: string | null) => {
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    setFieldError('title', value.trim() ? null : t('addPage.validation.title_required'));
  };

  const handleAmountChange = (value: string) => {
    setAmount(value);
    setFieldError('amount', validateAmount(value, t));
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = () => {
    if (submitting) return;
    const titleErr = !title.trim() ? t('addPage.validation.title_required') : null;
    const amountErr = validateAmount(amount, t);
    setErrors({ title: titleErr, amount: amountErr });
    if (titleErr || amountErr) return;

    setSubmitting(true);
    onAdd({ title: title.trim(), amount: Number(amount), status });
    reset();
    setSubmitting(false);
    onOpenChange(false);
  };

  const hasErrors = Object.values(errors).some(e => e !== null);

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t('detail.modal.new_offer')} (TND)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offer-title">{t('addPage.validation.title_required').replace(/\s*est requis|is required/i, '')}</Label>
            <Input
              id="offer-title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="e.g. Enterprise Package"
              className={errors.title ? 'border-destructive' : ''}
            />
            <FieldError error={errors.title} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-amount">{t('addPage.validation.amount_required').replace(/\s*est requis|is required/i, '')} (TND)</Label>
            <Input
              id="offer-amount"
              type="number"
              min="0"
              step="1"
              value={amount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="e.g. 150000"
              className={errors.amount ? 'border-destructive' : ''}
            />
            <FieldError error={errors.amount} />
          </div>
          <div className="space-y-2">
            <Label>{t('addPage.fields.status_label')}</Label>
            <Select value={status} onValueChange={(v: OfferStatus) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder={t('addPage.fields.status_label')} />
              </SelectTrigger>
              <SelectContent>
                {offerStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id as OfferStatus}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-3">
            <Button variant="outline" size="sm" onClick={() => { reset(); onOpenChange(false); }}>{t('contacts.form.cancel')}</Button>
            <Button size="sm" onClick={handleSubmit} disabled={submitting || hasErrors}>{t('detail.modal.new_offer')}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
