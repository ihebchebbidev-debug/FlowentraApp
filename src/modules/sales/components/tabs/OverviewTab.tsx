import { useTranslation } from "react-i18next";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText } from "lucide-react";
import { Sale } from "../../types";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { offersApi } from '@/services/api/offersApi';

interface OverviewTabProps {
  sale: Sale;
}

export function OverviewTab({ sale }: OverviewTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrency();
  const [fetchedOfferNumber, setFetchedOfferNumber] = useState<string | null>(null);

  useEffect(() => {
    const fetchOfferNumber = async () => {
      if (sale.offerId && !sale.offerNumber) {
        try {
          const numId = parseInt(sale.offerId, 10);
          if (!isNaN(numId)) {
            const offer = await offersApi.getById(numId);
            if (offer?.offerNumber) {
              setFetchedOfferNumber(offer.offerNumber);
            }
          }
        } catch (error) {
          console.error('Failed to fetch offer number:', error);
        }
      }
    };
    fetchOfferNumber();
  }, [sale.offerId, sale.offerNumber]);

  const displayOfferNumber = sale.offerNumber || fetchedOfferNumber;

  const formatDate = (date: Date | string) => new Date(date).toLocaleDateString();
  const formatDateTime = (date: Date | string) => new Date(date).toLocaleString();

  const totals = calculateEntityTotal(sale);
  const totalItemsValue = totals.subtotal;
  const discountAmount = totals.discountAmount;
  const taxAmount = totals.taxAmount;
  const fiscalStampAmount = totals.fiscalStamp;
  const calculatedTotal = totals.total;

  const hasServices = sale.items.some(item => item.type === 'service');
  const hasServiceOrder = !!sale.convertedToServiceOrderId;

  const itemsCount = sale.items.length;
  const servicesCount = sale.items.filter(i => i.type === 'service').length;
  const articlesCount = sale.items.filter(i => i.type === 'article').length;
  const totalQuantity = sale.items.reduce((sum, i) => sum + (Number(i.quantity) || 0), 0);
  const shippingCost = Number(sale.shippingCost) || 0;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t('overview.saleDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.description')}</label>
                <p className="text-foreground font-medium mt-1">{sale.description || t('overview.noDescription')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.affectedContact')}</label>
                <div className="mt-1">
                  <Button
                    variant="link"
                    className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center md:max-w-none max-w-[200px] truncate"
                    onClick={() => navigate(`/dashboard/contacts/${sale.contactId}`)}
                  >
                    <span className="truncate">{sale.contactName || sale.contactCompany || t('overview.unknownContact')}</span>
                    <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                  </Button>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.contactEmail')}</label>
                <p className="text-foreground font-medium mt-1">{sale.contactEmail || t('overview.notSpecified')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.contactPhone')}</label>
                <p className="text-foreground font-medium mt-1">{sale.contactPhone || t('overview.notSpecified')}</p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.closeDate')}</label>
                <p className="text-foreground font-medium mt-1">
                  {sale.actualCloseDate ? formatDate(sale.actualCloseDate) : t('overview.notSet')}
                </p>
              </div>

              {sale.source && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('overview.source')}</label>
                  <p className="text-foreground font-medium mt-1 capitalize">{sale.source}</p>
                </div>
              )}

              {sale.category && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('overview.category')}</label>
                  <p className="text-foreground font-medium mt-1 capitalize">{sale.category}</p>
                </div>
              )}
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.saleAmount')}</label>
                <p className="text-sm text-foreground mt-1">
                  {discountAmount > 0 && (
                    <span className="text-muted-foreground line-through mr-2">
                      {formatCurrency(totalItemsValue + (sale.taxType === 'percentage' ? totalItemsValue * ((sale.taxes || 0) / 100) : (sale.taxes || 0)) + fiscalStampAmount)}
                    </span>
                  )}
                  {formatCurrency(calculatedTotal)}
                  {taxAmount > 0 && (
                    <span className="text-muted-foreground ml-2">({t('overview.inclTva')})</span>
                  )}
                </p>
                {discountAmount > 0 && (
                  <p className="text-sm text-success mt-0.5">
                    -{formatCurrency(discountAmount)} {t('discount')}
                    {sale.discountType === 'percentage' && ` (${sale.discount}%)`}
                  </p>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.createdDate')}</label>
                <p className="text-foreground font-medium mt-1">
                  {sale.createdAt ? formatDateTime(sale.createdAt) : t('overview.notSet')}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-muted-foreground">{t('overview.createdBy')}</label>
                <p className="text-foreground font-medium mt-1">{sale.createdByName || t('overview.unknown')}</p>
              </div>

              {sale.offerId && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('overview.relatedOffer')}</label>
                  <div className="mt-1">
                    <Button
                      variant="link"
                      className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center"
                      onClick={() => navigate(`/dashboard/offers/${sale.offerId}`)}
                    >
                      <span>{displayOfferNumber || `#${sale.offerId}`}</span>
                      <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                    </Button>
                  </div>
                </div>
              )}

              {hasServices && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('overview.relatedServiceOrder')}</label>
                  <div className="mt-1">
                    {hasServiceOrder ? (
                      <Button
                        variant="link"
                        className="p-0 h-auto text-left font-semibold text-primary hover:underline inline-flex items-center"
                        onClick={() => navigate(`/dashboard/field/service-orders/${sale.convertedToServiceOrderId}`)}
                      >
                        <span>#{sale.convertedToServiceOrderId}</span>
                        <ExternalLink className="ml-2 h-3 w-3 flex-shrink-0" />
                      </Button>
                    ) : (
                      <span className="text-sm text-muted-foreground">{t('overview.notConvertedYet')}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {itemsCount > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{t('overview.itemsSummary')}</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{t('overview.totalItems')}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{itemsCount}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{t('overview.totalQuantity')}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{totalQuantity}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{t('overview.articles')}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{articlesCount}</p>
                  </div>
                  <div className="rounded-md border bg-muted/30 p-3">
                    <p className="text-xs text-muted-foreground">{t('overview.services')}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{servicesCount}</p>
                  </div>
                </div>
              </div>

              <Separator />
              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">{t('overview.financialBreakdown')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t('overview.itemsTotalValue')}</span>
                    <span className="text-foreground font-medium">{formatCurrency(totalItemsValue)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('overview.discount')}
                        {sale.discountType === 'percentage' && ` (${sale.discount}%)`}
                      </span>
                      <span className="text-success font-medium">-{formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {taxAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        {t('overview.tva')}
                        {sale.taxType === 'percentage' && ` (${sale.taxes}%)`}
                      </span>
                      <span className="text-foreground font-medium">{formatCurrency(taxAmount)}</span>
                    </div>
                  )}
                  {shippingCost > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('overview.shipping')}</span>
                      <span className="text-foreground font-medium">{formatCurrency(shippingCost)}</span>
                    </div>
                  )}
                  {fiscalStampAmount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('overview.fiscalStamp')}</span>
                      <span className="text-foreground font-medium">{formatCurrency(fiscalStampAmount)}</span>
                    </div>
                  )}
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-foreground font-semibold">{t('overview.totalAmount')}</span>
                    <span className="text-foreground font-semibold">{formatCurrency(calculatedTotal)}</span>
                  </div>
                </div>
              </div>
            </>
          )}

        </CardContent>
      </Card>
    </div>
  );
}


function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground mt-1">{value}</p>
    </div>
  );
}
