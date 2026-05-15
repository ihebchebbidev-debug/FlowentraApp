import { useState, useEffect } from "react";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { GitBranch, ShoppingCart, Wrench, FileText } from "lucide-react";
import { Offer } from "../types";
import { entityFormDocumentsService } from "@/modules/shared/services/entityFormDocumentsService";

interface ConvertOfferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer | null;
  onConvert: (data: { convertToSale: boolean; convertToServiceOrder: boolean }) => void;
}

export function ConvertOfferModal({ 
  open, 
  onOpenChange, 
  offer, 
  onConvert 
}: ConvertOfferModalProps) {
  const { t } = useTranslation('offers');
  const [convertToSale, setConvertToSale] = useState(true);
  const [convertToServiceOrder, setConvertToServiceOrder] = useState(false);
  const [formDocumentsCount, setFormDocumentsCount] = useState(0);

  // Fetch form documents count when modal opens
  useEffect(() => {
    async function fetchFormDocumentsCount() {
      if (offer?.id) {
        try {
          const offerId = typeof offer.id === 'string' ? parseInt(offer.id, 10) : offer.id;
          const documents = await entityFormDocumentsService.getByEntity('offer', offerId);
          setFormDocumentsCount(documents.length);
        } catch (error) {
          console.error('Failed to fetch form documents count:', error);
          setFormDocumentsCount(0);
        }
      }
    }

    if (open && offer) {
      fetchFormDocumentsCount();
    }
  }, [open, offer]);

  const handleConvert = () => {
    if (!convertToSale && !convertToServiceOrder) {
      return; // At least one option should be selected
    }
    
    onConvert({ convertToSale, convertToServiceOrder });
    onOpenChange(false);
    
    // Reset state
    setConvertToSale(true);
    setConvertToServiceOrder(false);
  };

  if (!offer) return null;

  // Business rule: Subtotal → Discount → Tax (on afterDiscount) → Fiscal Stamp
  const offerTotals = calculateEntityTotal(offer);
  const totalItemsValue = offerTotals.subtotal;
  const taxAmount = offerTotals.taxAmount;
  const computedTotal = offerTotals.total;

  // Check if offer contains services
  const hasServices = offer.items.some(item => item.type === 'service');
  const hasProducts = offer.items.some(item => item.type === 'article');
  const productCount = offer.items.filter(item => item.type === 'article').length;
  const serviceCount = offer.items.filter(item => item.type === 'service').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            {t('conversion.convert_offer')}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold">{offer.title}</h3>
            <p className="text-muted-foreground">
              {offer.contactName} • {computedTotal.toLocaleString()} {offer.currency}
            </p>
          </div>

          <div className="grid gap-4">
            <Card className={convertToSale ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="convert-sale"
                    checked={convertToSale}
                    onCheckedChange={(checked) => setConvertToSale(!!checked)}
                  />
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-chart-2" />
                    <CardTitle className="text-base">{t('convert_to_sale')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="ml-7">
                  {t('convert_to_sale_description')}
                </CardDescription>
              </CardHeader>
              {hasProducts && (
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground ml-7">
                    {t('conversion.will_convert_products', { count: productCount })}
                  </div>
                </CardContent>
              )}
            </Card>

            <Card className={convertToServiceOrder ? "ring-2 ring-primary" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Checkbox 
                    id="convert-service"
                    checked={convertToServiceOrder}
                    onCheckedChange={(checked) => setConvertToServiceOrder(!!checked)}
                    disabled={!hasServices}
                  />
                  <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-chart-3" />
                    <CardTitle className="text-base">{t('convert_to_service_order')}</CardTitle>
                  </div>
                </div>
                <CardDescription className="ml-7">
                  {t('convert_to_service_order_description')}
                  {!hasServices && ` (${t('conversion.no_services_in_offer')})`}
                </CardDescription>
              </CardHeader>
              {hasServices && (
                <CardContent className="pt-0">
                  <div className="text-sm text-muted-foreground ml-7">
                    {t('conversion.will_convert_services', { count: serviceCount })}
                  </div>
                </CardContent>
              )}
            </Card>
          </div>

          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">{t('conversion.conversion_summary')}:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• {t('conversion.status_will_change')}</li>
              {convertToSale && <li>• {t('conversion.new_sale_order')}</li>}
              {convertToServiceOrder && hasServices && <li>• {t('conversion.new_service_order')}</li>}
              <li>• {t('conversion.original_offer_remains')}</li>
              {convertToSale && formDocumentsCount > 0 && (
                <li className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {t('conversion.form_documents_count', { count: formDocumentsCount })}
                </li>
              )}
            </ul>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              {t('cancel')}
            </Button>
            <Button 
              onClick={handleConvert}
              disabled={!convertToSale && !convertToServiceOrder}
              className="bg-primary hover:bg-primary/90"
            >
              <GitBranch className="h-4 w-4 mr-2" />
              {t('conversion.convert_button')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
