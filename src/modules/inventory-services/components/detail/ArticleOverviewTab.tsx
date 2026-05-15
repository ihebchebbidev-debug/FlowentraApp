import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import { 
  Package, 
  Warehouse, 
  Calendar, 
  DollarSign,
  Tag,
  Hash,
  Building,
  AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { getUnitLabel } from "@/constants/units";

interface ArticleOverviewTabProps {
  article: any;
  getUserName: (userId: string | number | undefined) => string;
}

export function ArticleOverviewTab({ article, getUserName }: ArticleOverviewTabProps) {
  const { t } = useTranslation('inventory-services');

  // Computed values
  const stock = article.stockQuantity ?? article.stock ?? 0;
  const minStock = article.minStockLevel ?? article.minStock ?? 10;
  const costPrice = article.purchasePrice ?? article.costPrice ?? 0;
  const sellPrice = article.salesPrice ?? article.sellPrice ?? 0;
  const margin = sellPrice - costPrice;
  const marginPercentage = costPrice > 0 ? ((margin / costPrice) * 100).toFixed(1) : '0';
  const isLowStock = stock <= minStock;

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '-';
    try {
      return format(new Date(dateStr), 'PPP');
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Left Column - Article Details */}
      <div className="space-y-6">
        {/* Article Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" />
              {t('detail.article_information')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <InfoRow icon={Package} label={t('description')} value={article.description} />
            <InfoRow icon={Hash} label={t('sku')} value={article.articleNumber || article.sku} />
            <InfoRow icon={Tag} label={t('category')} value={article.category} />
            <InfoRow
              icon={Package}
              label={t('detail.type')}
              value={t(article.type === 'service' ? 'service' : 'material', { defaultValue: article.type })}
              capitalize
            />
            <InfoRow icon={Package} label={t('detail.unit')} value={article.unit} />
            <InfoRow icon={Building} label={t('supplier')} value={article.supplier} />
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              {t('pricing')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('detail.cost_price')}</p>
                <p className="text-sm font-medium">{costPrice.toFixed(2)} TND</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('detail.sell_price')}</p>
                <p className="text-sm font-medium">{sellPrice.toFixed(2)} TND</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('detail.margin')}</p>
                <p className="text-sm font-medium">{margin.toFixed(2)} TND ({marginPercentage}%)</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Stock & Audit */}
      <div className="space-y-6">
        {/* Stock Information */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Warehouse className="h-5 w-5 text-primary" />
              {t('detail.stock_levels')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Package className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('current_stock')}</p>
                <p className="text-sm font-medium">{Number(stock) % 1 !== 0 ? Number(stock).toFixed(1) : stock} {getUnitLabel(article.unit || 'piece', t)}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('minimum_stock')}</p>
                <p className="text-sm font-medium">{Number(minStock) % 1 !== 0 ? Number(minStock).toFixed(1) : minStock} {getUnitLabel(article.unit || 'piece', t)}</p>
              </div>
            </div>
            <InfoRow icon={Warehouse} label={t('location')} value={article.location} />
            {article.subLocation && (
              <InfoRow icon={Warehouse} label={t('detail.sub_location')} value={article.subLocation} />
            )}
            
            {isLowStock && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">{t('detail.low_stock_alert')}</p>
                  <p className="text-xs text-muted-foreground">{t('detail.low_stock_message')}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Audit Trail */}
        <Card className="shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {t('detail.audit_info')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div className="min-w-0 flex-1">
                <p className="text-xs text-muted-foreground">{t('detail.created_date')}</p>
                <p className="text-sm font-medium">{formatDate(article.createdDate)}</p>
                <p className="text-xs text-muted-foreground">
                  {t('detail.created_by')}: {getUserName(article.createdBy)}
                </p>
              </div>
            </div>
            {article.modifiedDate && (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">{t('detail.modified_date')}</p>
                  <p className="text-sm font-medium">{formatDate(article.modifiedDate)}</p>
                  {article.modifiedBy && (
                    <p className="text-xs text-muted-foreground">
                      {t('detail.modified_by')}: {getUserName(article.modifiedBy)}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper component for info rows
function InfoRow({ 
  icon: Icon, 
  label, 
  value, 
  capitalize = false 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  value?: string | null; 
  capitalize?: boolean;
}) {
  if (!value) return null;
  
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5" />
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-sm font-medium ${capitalize ? 'capitalize' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
