import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import offerStatuses from '@/data/mock/offer-statuses.json';
import type { OfferStatus } from "./AddOfferModal";

interface EditOfferStatusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: OfferStatus;
  onUpdate: (status: OfferStatus) => void;
  offerTitle?: string;
}

export default function EditOfferStatusModal({ open, onOpenChange, currentStatus, onUpdate, offerTitle }: EditOfferStatusModalProps) {
  const handleChange = (value: OfferStatus) => {
    onUpdate(value);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Offer Status{offerTitle ? ` — ${offerTitle}` : ''}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={currentStatus} onValueChange={handleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {offerStatuses.map(s => (
                  <SelectItem key={s.id} value={s.id as any}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
