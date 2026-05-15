import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { 
  ShoppingCart,
  Calculator,
  MapPin,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { QuickCreateWorkflowData, WorkflowItem } from "../types";
import { useTranslation } from 'react-i18next';
import { WorkflowService } from "../services/workflow.service";
import { useToast } from "@/hooks/use-toast";

const ITEM_TYPES = [
  { id: 'article', name: 'Article' },
  { id: 'service', name: 'Service' },
];

interface QuickCreateWorkflowProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  onComplete: (result: { offerId: string; saleId?: string; serviceOrderId?: string }) => void;
}

const STEPS = (t: any) => [
  { id: 'items', title: t('quickCreate.itemsTitle') || 'Items & Services', icon: ShoppingCart },
  { id: 'pricing', title: t('quickCreate.pricingTitle') || 'Pricing', icon: Calculator },
  { id: 'delivery', title: t('quickCreate.deliveryTitle') || 'Delivery & Location', icon: MapPin },
  { id: 'notifications', title: t('quickCreate.notificationsTitle') || 'Notifications', icon: Bell },
  { id: 'review', title: t('quickCreate.reviewTitle') || 'Review & Send', icon: Check }
];

export function QuickCreateWorkflow({ 
  open, 
  onOpenChange, 
  contactId, 
  onComplete 
}: QuickCreateWorkflowProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [data, setData] = useState<QuickCreateWorkflowData>({
    contactId,
    items: [
      {
        id: 'item-1',
        itemCode: 'PROD-001',
        itemName: '',
        type: 'article',
        quantity: 1,
        unitPrice: 0,
        totalPrice: 0
      }
    ],
    pricing: {
      subtotal: 0,
      taxes: 0,
      discount: 0,
      total: 0
    },
    delivery: {
      address: '',
      notes: ''
    },
    notifications: {
      autoCreateSale: false,
      notifyCustomer: true,
      sendReminders: true
    }
  });

  const updatePricing = () => {
    const subtotal = data.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const afterDiscount = subtotal - data.pricing.discount;
    const taxes = afterDiscount * 0.2; // 20% TVA applied AFTER discount
    const total = afterDiscount + taxes;
    
    setData(prev => ({
      ...prev,
      pricing: {
        ...prev.pricing,
        subtotal,
        taxes,
        total
      }
    }));
  };

  const addItem = () => {
    const newItem: WorkflowItem = {
      id: `item-${data.items.length + 1}`,
      itemCode: `PROD-${String(data.items.length + 1).padStart(3, '0')}`,
      itemName: '',
      type: 'article',
      quantity: 1,
      unitPrice: 0,
      totalPrice: 0
    };
    
    setData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const updateItem = (index: number, updates: Partial<WorkflowItem>) => {
    setData(prev => {
      const newItems = [...prev.items];
      const item = { ...newItems[index], ...updates };
      
      if (updates.quantity !== undefined || updates.unitPrice !== undefined) {
        item.totalPrice = item.quantity * item.unitPrice;
      }
      
      newItems[index] = item;
      
      const newData = { ...prev, items: newItems };
      
      // Update pricing
      const subtotal = newItems.reduce((sum, item) => sum + item.totalPrice, 0);
      const afterDiscount = subtotal - prev.pricing.discount;
      const taxes = afterDiscount * 0.2; // TVA after discount
      const total = afterDiscount + taxes;
      
      newData.pricing = {
        ...prev.pricing,
        subtotal,
        taxes,
        total
      };
      
      return newData;
    });
  };

  const removeItem = (index: number) => {
    if (data.items.length > 1) {
      setData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const result = await WorkflowService.createWorkflow(data);
      
      toast({
        title: "Workflow créé avec succès",
  description: t('quickCreate.description', { offerId: result.offerId, saleId: result.saleId || '' }),
      });
      
      onComplete(result);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de créer le workflow",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentStepData = STEPS(t)[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <currentStepData.icon className="h-5 w-5" />
            {currentStepData.title}
          </DialogTitle>
        </DialogHeader>

        {/* Progress Steps */}
        <div className="flex items-center gap-2 pb-6">
          {STEPS(t).map((step, index) => (
            <div key={step.id} className="flex items-center gap-2">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                index <= currentStep
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {index + 1}
              </div>
              {index < STEPS.length - 1 && (
                <div className={`h-0.5 w-12 ${
                  index < currentStep ? 'bg-primary' : 'bg-muted'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{t('quickCreate.itemsTitle')}</h3>
                <Button onClick={addItem} variant="outline" size="sm">
                  {t('quickCreate.addItemButton')}
                </Button>
              </div>
              
              {data.items.map((item, index) => (
                <Card key={item.id}>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label>{t('quickCreate.itemCodeLabel')}</Label>
                        <Input
                          value={item.itemCode}
                          onChange={(e) => updateItem(index, { itemCode: e.target.value })}
                        />
                      </div>
                      <div>
                        <Label>{t('quickCreate.itemNameLabel')}</Label>
                        <Input
                          value={item.itemName}
                          onChange={(e) => updateItem(index, { itemName: e.target.value })}
                          placeholder={t('quickCreate.itemNamePlaceholder') as string}
                        />
                      </div>
                      <div>
                        <Label>{t('quickCreate.typeLabel')}</Label>
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          value={item.type}
                          onChange={(e) => updateItem(index, { type: e.target.value as 'article' | 'service' })}
                        >
                          {ITEM_TYPES.map((it) => (
                            <option key={it.id} value={it.id}>{t(`quickCreate.typeOption${it.name}`) || it.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end gap-2">
                        <div className="flex-1">
                          <Label>{t('quickCreate.quantityLabel')}</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                            min="1"
                          />
                        </div>
                        {data.items.length > 1 && (
                          <Button
                            onClick={() => removeItem(index)}
                            variant="outline"
                            size="sm"
                          >
                            {t('quickCreate.removeButton')}
                          </Button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>{t('quickCreate.unitPriceLabel')}</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(index, { unitPrice: Number(e.target.value) })}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      <div>
                        <Label>{t('quickCreate.totalPriceLabel')}</Label>
                        <Input
                          value={item.totalPrice.toFixed(2)}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <Label>{t('quickCreate.descriptionLabel')}</Label>
                        <Input
                          value={item.description || ''}
                          onChange={(e) => updateItem(index, { description: e.target.value })}
                          placeholder={t('quickCreate.descriptionPlaceholder') as string}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t('quickCreate.pricingTitle')}</h3>
              
              <Card>
                <CardContent className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span>{t('quickCreate.subtotalLabel')}</span>
                    <span className="font-medium">{data.pricing.subtotal.toFixed(2)} €</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <Label htmlFor="discount">{t('quickCreate.discountLabel')}</Label>
                    <Input
                      id="discount"
                      type="number"
                      value={data.pricing.discount}
                      onChange={(e) => setData(prev => ({
                        ...prev,
                        pricing: {
                          ...prev.pricing,
                          discount: Number(e.target.value),
                          total: (() => { const ad = prev.pricing.subtotal - Number(e.target.value); return ad + ad * 0.2; })()
                        }
                      }))}
                      className="w-32"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>{t('quickCreate.taxLabel')}</span>
                    <span className="font-medium">{data.pricing.taxes.toFixed(2)} €</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>{t('quickCreate.totalLabel')}</span>
                    <span>{data.pricing.total.toFixed(2)} €</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t('quickCreate.deliveryTitle')}</h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="address">{t('quickCreate.addressLabel')}</Label>
                  <Textarea
                    id="address"
                    value={data.delivery?.address || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      delivery: {
                        ...prev.delivery,
                        address: e.target.value
                      }
                    }))}
                    placeholder={t('quickCreate.addressPlaceholder') as string}
                  />
                </div>
                
                <div>
                  <Label htmlFor="delivery-notes">{t('quickCreate.deliveryNotesLabel')}</Label>
                  <Textarea
                    id="delivery-notes"
                    value={data.delivery?.notes || ''}
                    onChange={(e) => setData(prev => ({
                      ...prev,
                      delivery: {
                        ...prev.delivery,
                        notes: e.target.value
                      }
                    }))}
                    placeholder={t('quickCreate.deliveryNotesPlaceholder') as string}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t('quickCreate.notificationsTitle')}</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('quickCreate.autoCreateSaleLabel')}</Label>
                    <p className="text-[11px] text-muted-foreground">{t('quickCreate.autoCreateSaleDesc')}</p>
                  </div>
                  <Switch
                    checked={data.notifications.autoCreateSale}
                    onCheckedChange={(checked) => setData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        autoCreateSale: checked
                      }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('quickCreate.notifyCustomerLabel')}</Label>
                    <p className="text-[11px] text-muted-foreground">{t('quickCreate.notifyCustomerDesc')}</p>
                  </div>
                  <Switch
                    checked={data.notifications.notifyCustomer}
                    onCheckedChange={(checked) => setData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        notifyCustomer: checked
                      }
                    }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>{t('quickCreate.sendRemindersLabel')}</Label>
                    <p className="text-[11px] text-muted-foreground">{t('quickCreate.sendRemindersDesc')}</p>
                  </div>
                  <Switch
                    checked={data.notifications.sendReminders}
                    onCheckedChange={(checked) => setData(prev => ({
                      ...prev,
                      notifications: {
                        ...prev.notifications,
                        sendReminders: checked
                      }
                    }))}
                  />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium">{t('quickCreate.reviewTitle')}</h3>
              
              <Card>
                <CardHeader>
                  <CardTitle>{t('quickCreate.summaryTitle')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">{t('quickCreate.itemsSummaryTitle', { count: data.items.length })}</h4>
                    {data.items.map((item, index) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.itemName || t('quickCreate.unnamedItem')}</span>
                        <span>{item.totalPrice.toFixed(2)} €</span>
                      </div>
                    ))}
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">{t('quickCreate.totalTitle')}</h4>
                    <div className="text-lg font-bold">{data.pricing.total.toFixed(2)} €</div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <h4 className="font-medium mb-2">{t('quickCreate.enabledOptionsTitle')}</h4>
                    <div className="flex flex-wrap gap-2">
                      {data.notifications.autoCreateSale && (
                        <Badge variant="secondary">{t('quickCreate.badgeAutoSale')}</Badge>
                      )}
                      {data.notifications.notifyCustomer && (
                        <Badge variant="secondary">{t('quickCreate.badgeNotifyCustomer')}</Badge>
                      )}
                      {data.notifications.sendReminders && (
                        <Badge variant="secondary">{t('quickCreate.badgeSendReminders')}</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between pt-6">
          <Button
            onClick={handleBack}
            variant="outline"
            disabled={currentStep === 0}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            {t('quickCreate.prevButton')}
          </Button>
          
          {isLastStep ? (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? t('quickCreate.creating') : t('quickCreate.createButton')}
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext} className="gap-2">
              {t('quickCreate.nextButton')}
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}