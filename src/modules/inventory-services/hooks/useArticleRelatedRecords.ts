// Hook to fetch related records (Service Orders, Offers, Sales) for an Article
import { useQuery } from '@tanstack/react-query';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';

interface RelatedRecord {
  id: number | string;
  number?: string;
  title?: string;
  status: string;
  date?: string;
  amount?: number;
}

export function useArticleRelatedRecords(articleId: number | null) {
  // Fetch all service orders
  const { data: soData, isLoading: soLoading } = useQuery({
    queryKey: ['service-orders-for-article', articleId],
    queryFn: () => serviceOrdersApi.getAll({}),
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all offers
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['offers-for-article', articleId],
    queryFn: () => offersApi.getAll({ page: 1, limit: 100 }),
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all sales
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-for-article', articleId],
    queryFn: () => salesApi.getAll({ page: 1, limit: 100 }),
    enabled: !!articleId,
    staleTime: 2 * 60 * 1000,
  });

  const articleIdStr = String(articleId);

  // Filter service orders that have materials referencing this article
  const soList = (soData as any)?.serviceOrders || (soData as any)?.data || soData || [];
  const serviceOrders: RelatedRecord[] = (Array.isArray(soList) ? soList : [])
    .filter((so: any) => {
      const materials = so.materials || so.Materials || [];
      return materials.some((m: any) => 
        String(m.articleId || m.ArticleId) === articleIdStr
      );
    })
    .map((so: any) => ({
      id: so.id || so.Id,
      number: so.orderNumber || so.OrderNumber || so.serviceOrderNumber,
      status: so.status || so.Status || 'unknown',
      date: so.createdDate || so.CreatedDate || so.createdAt,
      amount: so.totalAmount || so.TotalAmount || 0,
    }));

  // Filter offers that contain items referencing this article
  const offersList = (offersData as any)?.offers || (offersData as any)?.data || offersData || [];
  const offers: RelatedRecord[] = (Array.isArray(offersList) ? offersList : [])
    .filter((offer: any) => {
      const items = offer.items || offer.Items || offer.offerItems || [];
      return items.some((item: any) => 
        String(item.articleId || item.ArticleId) === articleIdStr
      );
    })
    .map((offer: any) => ({
      id: offer.id || offer.Id,
      number: offer.offerNumber || offer.OfferNumber,
      title: offer.title || offer.Title,
      status: offer.status || offer.Status || 'unknown',
      date: offer.offerDate || offer.createdDate || offer.createdAt,
      amount: offer.totalAmount || offer.TotalAmount || 0,
    }));

  // Filter sales that contain items referencing this article
  const salesList = (salesData as any)?.sales || (salesData as any)?.data || salesData || [];
  const sales: RelatedRecord[] = (Array.isArray(salesList) ? salesList : [])
    .filter((sale: any) => {
      const items = sale.items || sale.Items || sale.saleItems || [];
      return items.some((item: any) => 
        String(item.articleId || item.ArticleId) === articleIdStr
      );
    })
    .map((sale: any) => ({
      id: sale.id || sale.Id,
      number: sale.saleNumber || sale.SaleNumber || sale.orderNumber,
      title: sale.title || sale.Title,
      status: sale.status || sale.Status || 'unknown',
      date: sale.saleDate || sale.createdDate || sale.createdAt,
      amount: sale.totalAmount || sale.TotalAmount || 0,
    }));

  return {
    serviceOrders,
    offers,
    sales,
    isLoading: soLoading || offersLoading || salesLoading,
  };
}
