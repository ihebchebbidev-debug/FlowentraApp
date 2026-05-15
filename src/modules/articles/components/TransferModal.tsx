import { useState } from "react";
import { ArrowRight, Package, User, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
const technicians = [
  { id: "1", name: "John Smith", location: "Service Van 1" },
  { id: "2", name: "Mike Johnson", location: "Service Van 2" },
  { id: "3", name: "Sarah Davis", location: "Field Office" },
  { id: "4", name: "Tom Wilson", location: "Mobile Unit A" },
];

const locations = [
  "Warehouse A",
  "Warehouse B", 
  "Service Van 1",
  "Service Van 2",
  "Main Office",
  "Field Office",
  "Mobile Unit A",
  "Mobile Unit B"
];

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  article?: {
    id: string;
    name: string;
    sku: string;
    stock: number;
    location: string;
  };
}

export function TransferModal({ isOpen, onClose, article }: TransferModalProps) {
  const { toast } = useToast();
  const { t } = useTranslation('articles');
  const [transferData, setTransferData] = useState({
    quantity: "",
    toLocation: "",
    toTechnician: "",
    reason: "",
    notes: ""
  });

  const handleInputChange = (field: string, value: string) => {
    setTransferData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Here you would create a transfer transaction in Supabase
      console.log("Creating transfer:", {
        articleId: article?.id,
        ...transferData
      });
      
      toast({
        title: t('transfer.success'),
        description: t('transfer.success_message', { quantity: transferData.quantity, name: article?.name }),
      });
      
      // Reset form and close modal
      setTransferData({
        quantity: "",
        toLocation: "",
        toTechnician: "",
        reason: "",
        notes: ""
      });
      onClose();
    } catch (error) {
      const _err = error as any;
      toast({
        title: t('transfer.error'),
        description: t('transfer.error_message'),
        variant: "destructive",
      });
    }
  };

  const selectedTechnician = technicians.find(t => t.id === transferData.toTechnician);
  const isFormValid = transferData.quantity && (transferData.toLocation || transferData.toTechnician) && transferData.reason;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {t('transfer.title')}
          </DialogTitle>
        </DialogHeader>

        {article && (
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{article.name}</h3>
                  <p className="text-sm text-muted-foreground">SKU: {article.sku}</p>
                </div>
                <div className="text-right">
                  <Badge className="status-info">
                    <MapPin className="h-3 w-3 mr-1" />
                    {article.location}
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t('transfer.available_units', { count: article.stock })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">{t('transfer.quantity_label')} *</Label>
              <Input
                id="quantity"
                type="number"
                value={transferData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder={t('detail.enter_quantity')}
                min="1"
                max={article?.stock}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">{t('transfer.reason_label')} *</Label>
              <Select value={transferData.reason} onValueChange={(value) => handleInputChange("reason", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transfer.select_reason')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="field_service">{t('transfer.reasons.field_service')}</SelectItem>
                  <SelectItem value="maintenance">{t('transfer.reasons.maintenance')}</SelectItem>
                  <SelectItem value="restocking">{t('transfer.reasons.restocking')}</SelectItem>
                  <SelectItem value="emergency">{t('transfer.reasons.emergency')}</SelectItem>
                  <SelectItem value="project">{t('transfer.reasons.project')}</SelectItem>
                  <SelectItem value="other">{t('transfer.reasons.other')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label>{t('transfer.destination')}</Label>
            
            {/* Location Option */}
            <div className="space-y-2">
              <Label htmlFor="toLocation" className="text-sm font-normal">{t('transfer.to_location')}</Label>
              <Select value={transferData.toLocation} onValueChange={(value) => handleInputChange("toLocation", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transfer.select_location')} />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-center text-sm text-muted-foreground">{t('transfer.or')}</div>

            {/* Technician Option */}
            <div className="space-y-2">
              <Label htmlFor="toTechnician" className="text-sm font-normal">{t('transfer.to_technician')}</Label>
              <Select value={transferData.toTechnician} onValueChange={(value) => handleInputChange("toTechnician", value)}>
                <SelectTrigger>
                  <SelectValue placeholder={t('transfer.select_technician')} />
                </SelectTrigger>
                <SelectContent>
                  {technicians.map((tech) => (
                    <SelectItem key={tech.id} value={tech.id}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>{tech.name}</span>
                        <span className="text-muted-foreground">({tech.location})</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTechnician && (
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2 text-sm">
                    <ArrowRight className="h-4 w-4 text-primary" />
                    <span>{t('transfer.will_transfer_to', { name: selectedTechnician.name, location: selectedTechnician.location })}</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{t('transfer.notes')}</Label>
            <Textarea
              id="notes"
              value={transferData.notes}
              onChange={(e) => handleInputChange("notes", e.target.value)}
              placeholder={t('transfer.notes_placeholder')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              {t('transfer.cancel')}
            </Button>
            <Button type="submit" disabled={!isFormValid} className="gradient-primary text-white">
              <ArrowRight className="h-4 w-4 mr-2" />
              {t('transfer.complete')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}