import { useTranslation } from "react-i18next";
import { calculateEntityTotal } from "@/lib/calculateTotal";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ExternalLink, FileText } from "lucide-react";
import { Offer } from "../../types";
import { useCurrency } from '@/shared/hooks/useCurrency';
import { useLookups } from '@/shared/contexts/LookupsContext';
import { getStatusColorClass } from "@/config/entity-statuses";

interface OverviewTabProps {
  offer: Offer;
}

export function OverviewTab({ offer }: OverviewTabProps) {
  const { t } = useTranslation('offers');
  const navigate = useNavigate();
  const { format: formatCurrency } = useCurrency();
  const { offerCategories, offerSources } = useLookups();

  const statusColor = (status: string) => getStatusColorClass('offer', status);

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return t('overviewTab.notSpecified');
    const parsed = new Date(date);
    if (isNaN(parsed.getTime())) return t('overviewTab.notSpecified');
    return parsed.toLocaleDateString();
  };

  const getCategoryName = (categoryValue: string | undefined) => {
    if (!categoryValue) return t('overviewTab.notSpecified');
    const category = offerCategories.find(c => c.id === categoryValue || c.name === categoryValue);
    return category?.name || categoryValue;
  };

  const getSourceName = (sourceValue: string | undefined) => {
    if (!sourceValue) return t('overviewTab.notSpecified');
    const source = offerSources.find(s => s.id === sourceValue || s.name === sourceValue);
    return source?.name || sourceValue;
  };

  const totals = calculateEntityTotal(offer);
  const totalItemsValue = totals.subtotal;
  const discountAmount = totals.discountAmount;
  const afterDiscount = totals.afterDiscount;
  const taxAmount = totals.taxAmount;
  const fiscalStampAmount = totals.fiscalStamp;
  const computedTotal = totals.total;
  const hasConvertedToSale = !!offer.convertedToSaleId;

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t('overviewTab.offerDetails')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <DetailField label={t('overviewTab.offerNumber')} value={offer.offerNumber || '-'} />
              <DetailField label={t('overviewTab.offerTitle')} value={offer.title} />
              <DetailField label={t('overviewTab.offerDescription')} value={offer.description || t('overviewTab.noDescriptionProvided')} />

              <div>
                <span className="text-sm text-muted-foreground">{t('overviewTab.affectedContact')}</span>
                <div className="mt-1">
                  <Button 
                    variant="link" 
                    className="p-0 h-auto text-sm text-primary hover:underline inline-flex items-center max-w-full truncate"
                    onClick={() => navigate(`/dashboard/contacts/${offer.contactId}`)}
                  >
                    <span className="truncate">{offer.contactName || offer.contactCompany || t('overviewTab.unknownContact')}</span>
                    <ExternalLink className="ml-1.5 h-3 w-3 shrink-0" />
                  </Button>
                </div>
              </div>

              <DetailField label={t('overviewTab.contactEmail')} value={offer.contactEmail || t('overviewTab.notSpecified')} />

              <div>
                <span className="text-sm text-muted-foreground">{t('overviewTab.relatedSaleOrder')}</span>
                <div className="mt-1">
                  {hasConvertedToSale ? (
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-sm text-primary hover:underline inline-flex items-center max-w-full truncate"
                      onClick={() => navigate(`/dashboard/sales/${offer.convertedToSaleId}`)}
                    >
                      <span className="truncate">{t('overviewTab.saleNumber', { id: offer.convertedToSaleId })}</span>
                      <ExternalLink className="ml-1.5 h-3 w-3 shrink-0" />
                    </Button>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t('overviewTab.notConvertedYet')}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <span className="text-sm text-muted-foreground">{t('overviewTab.offerAmount')}</span>
                <p className="text-sm text-foreground mt-1">
                  {discountAmount > 0 && (
                    <span className="text-muted-foreground line-through mr-2">
                      {formatCurrency(totalItemsValue + taxAmount + fiscalStampAmount)}
                    </span>
                  )}
                  {formatCurrency(computedTotal)}
                  {taxAmount > 0 && (
                    <span className="text-muted-foreground ml-2">
                      ({t('overviewTab.inclTva')})
                    </span>
                  )}
                </p>
                {discountAmount > 0 && (
                  <p className="text-sm text-success mt-0.5">
                    -{formatCurrency(discountAmount)} {t('overviewTab.discount', 'Discount')}
                    {offer.discountType === 'percentage' && (
                      <span className="ml-1">({offer.discount}%)</span>
                    )}
                  </p>
                )}
              </div>

              <DetailField label={t('overviewTab.validUntil')} value={formatDate(offer.validUntil)} />

              <div>
                <span className="text-sm text-muted-foreground">{t('overviewTab.currentStatus')}</span>
                <div className="mt-1">
                  <Badge className={`${statusColor(offer.status)} border`}>
                    {t(`status.${offer.status}`)}
                  </Badge>
                </div>
              </div>

              <DetailField label={t('category')} value={getCategoryName(offer.category)} />
              <DetailField label={t('source')} value={getSourceName(offer.source)} />
              <DetailField label={t('createdBy')} value={offer.createdByName || offer.createdBy || t('unknown')} />
            </div>
          </div>

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
