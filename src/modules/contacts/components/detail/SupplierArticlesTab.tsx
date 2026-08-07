import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ExternalLink, Star, Plus } from 'lucide-react';
import { articleSupplierService } from '@/modules/purchases/services/purchaseService';
import type { ArticleSupplier } from '@/modules/purchases/types';

interface SupplierArticlesTabProps {
  supplierId: number;
  supplierName?: string;
}

export function SupplierArticlesTab({ supplierId, supplierName }: SupplierArticlesTabProps) {
  const { t } = useTranslation('contacts');
  const navigate = useNavigate();
  const [items, setItems] = useState<ArticleSupplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    articleSupplierService
      .getBySupplier(String(supplierId))
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data) ? data : []);
      })
      .catch((e: any) => {
        if (!cancelled) setError(e?.message || 'Failed to load articles');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [supplierId]);

  const handleAddArticle = () => {
    const params = new URLSearchParams();
    params.set('supplierId', String(supplierId));
    if (supplierName) params.set('supplierName', supplierName);
    navigate(`/dashboard/articles/add?${params.toString()}`);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-destructive">{error}</CardContent>
      </Card>
    );
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">
            {t('detail.articles.empty', 'No articles linked to this supplier')}
          </p>
          <Button onClick={handleAddArticle} className="mt-4" size="sm">
            <Plus className="h-4 w-4 mr-1" />
            {t('detail.articles.addArticle', 'Add Article')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          {t('detail.articles.title', 'Supplier Articles')}
          <Badge variant="secondary" className="ml-2">{items.length}</Badge>
          <div className="ml-auto">
            <Button onClick={handleAddArticle} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-1" />
              {t('detail.articles.addArticle', 'Add Article')}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div
            key={it.id}
            className="flex items-center justify-between gap-4 p-3 rounded-lg border hover:bg-muted/40 transition-colors"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">
                  {it.articleName || `#${it.articleId}`}
                </span>
                {it.articleNumber && (
                  <Badge variant="outline" className="text-xs">{it.articleNumber}</Badge>
                )}
                {it.isPreferred && (
                  <Badge className="bg-warning/10 text-warning border-warning/20 text-xs gap-1">
                    <Star className="h-3 w-3 fill-current" />
                    {t('detail.articles.preferred', 'Preferred')}
                  </Badge>
                )}
                {!it.isActive && (
                  <Badge variant="outline" className="text-xs opacity-60">
                    {t('detail.articles.inactive', 'Inactive')}
                  </Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-x-4 gap-y-1">
                {it.supplierRef && (
                  <span>{t('detail.articles.ref', 'Ref')}: {it.supplierRef}</span>
                )}
                <span>
                  {t('detail.articles.price', 'Price')}: {it.purchasePrice} {it.currency}
                </span>
                {it.minOrderQty > 0 && (
                  <span>{t('detail.articles.moq', 'MOQ')}: {it.minOrderQty}</span>
                )}
                {it.leadTimeDays > 0 && (
                  <span>{t('detail.articles.lead', 'Lead')}: {it.leadTimeDays}d</span>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/dashboard/inventory-services/${it.articleId}`)}
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
