import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft } from "lucide-react";
import { getStatusColorClass } from "@/config/entity-statuses";

export function OfferDetail() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('offers');
  const navigate = useNavigate();

  // TODO: Replace with actual data fetching
  const status = 'pending';

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
            {t('backToOffers', 'Back to Offers')}
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{t('offerTitle', 'Offer')} {id}</h1>
            <p className="text-muted-foreground">{t('offerDetails', 'Offer Details')}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={getStatusColorClass('offer', status)}>
            {t(`status.${status}`, { defaultValue: status })}
          </Badge>
          <Button variant="outline" size="sm">
            {t('copyLink', 'Copy Link')}
          </Button>
          <Button variant="outline" size="sm">
            {t('download_pdf', 'Download PDF')}
          </Button>
          <Button>
            {t('send_offer', 'Send')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('offerDetails', 'Offer Details')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            {t('implementationPending', 'Implementation pending')} - {t('offerDetails', 'Offer Details')} {id}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
