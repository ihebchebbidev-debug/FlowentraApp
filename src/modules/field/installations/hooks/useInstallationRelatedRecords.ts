// Hook to fetch related records for an installation
import { useQuery } from '@tanstack/react-query';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';
import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';

export function useInstallationRelatedRecords(installationId: number | null) {
  const installationIdStr = installationId?.toString();

  // Fetch all service orders and filter by installationId
  const { data: serviceOrdersData, isLoading: serviceOrdersLoading } = useQuery({
    queryKey: ['installation-service-orders', installationId],
    queryFn: async () => {
      const response = await serviceOrdersApi.getAll({});
      const allOrders = response?.data?.serviceOrders || [];
      
      console.log('[Installation Related] Service Orders raw response:', allOrders);
      console.log('[Installation Related] Looking for installationId:', installationIdStr);
      
      const filtered = allOrders.filter((so: any) => {
        // Check direct installationId on service order
        const soInstallId = String(so.installationId || so.InstallationId || '');
        if (soInstallId === installationIdStr) {
          console.log('[Installation Related] SO match on direct installationId:', so.id);
          return true;
        }
        
        // Check jobs array for matching installationId
        const jobs = so.jobs || so.Jobs || [];
        const hasMatchingJob = jobs.some((job: any) => {
          const jobInstallId = String(job.installationId || job.InstallationId || '');
          return jobInstallId === installationIdStr;
        });
        if (hasMatchingJob) {
          console.log('[Installation Related] SO match on job installationId:', so.id, so.orderNumber);
          return true;
        }
        
        // Check materials array for matching installationId
        const materials = so.materials || so.Materials || [];
        const hasMatchingMaterial = materials.some((mat: any) => {
          const matInstallId = String(mat.installationId || mat.InstallationId || '');
          return matInstallId === installationIdStr;
        });
        if (hasMatchingMaterial) {
          console.log('[Installation Related] SO match on material installationId:', so.id, so.orderNumber);
          return true;
        }
        
        return false;
      });
      
      console.log('[Installation Related] Filtered service orders:', filtered.length);
      return filtered;
    },
    enabled: !!installationId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all offers and filter by installationId (check items)
  const { data: offersData, isLoading: offersLoading } = useQuery({
    queryKey: ['installation-offers', installationId],
    queryFn: async () => {
      const response = await offersApi.getAll({});
      const allOffers = response?.data?.offers || [];
      
      console.log('[Installation Related] Offers raw:', allOffers);
      
      const filtered = allOffers.filter((o: any) => {
        const items = o.items || o.Items || [];
        return items.some((item: any) => {
          const itemInstallId = String(item.installationId || item.InstallationId || '');
          return itemInstallId === installationIdStr;
        });
      });
      
      console.log('[Installation Related] Filtered offers:', filtered.length);
      return filtered;
    },
    enabled: !!installationId,
    staleTime: 2 * 60 * 1000,
  });

  // Fetch all sales and filter by installationId (check items)
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['installation-sales', installationId],
    queryFn: async () => {
      const response = await salesApi.getAll({});
      const allSales = response?.data?.sales || [];
      
      console.log('[Installation Related] Sales raw:', allSales);
      
      const filtered = allSales.filter((s: any) => {
        const items = s.items || s.Items || [];
        return items.some((item: any) => {
          const itemInstallId = String(item.installationId || item.InstallationId || '');
          return itemInstallId === installationIdStr;
        });
      });
      
      console.log('[Installation Related] Filtered sales:', filtered.length);
      return filtered;
    },
    enabled: !!installationId,
    staleTime: 2 * 60 * 1000,
  });

  // Normalize records for display
  const serviceOrders = (serviceOrdersData || []).map((so: any) => ({
    id: so.id || so.Id,
    number: so.orderNumber || so.OrderNumber || so.serviceOrderNumber || so.ServiceOrderNumber || `SO-${so.id || so.Id}`,
    title: so.title || so.Title || so.description || so.Description,
    status: so.status || so.Status || 'unknown',
    date: so.createdDate || so.CreatedDate || so.scheduledDate || so.ScheduledDate,
    amount: so.totalAmount || so.TotalAmount || 0,
  }));

  const offers = (offersData || []).map((o: any) => ({
    id: o.id || o.Id,
    number: o.offerNumber || o.OfferNumber || `OFF-${o.id || o.Id}`,
    title: o.title || o.Title || o.subject || o.Subject,
    status: o.status || o.Status || 'unknown',
    date: o.createdDate || o.CreatedDate || o.offerDate || o.OfferDate,
    amount: o.totalAmount || o.TotalAmount || o.amount || o.Amount || 0,
  }));

  const sales = (salesData || []).map((s: any) => ({
    id: s.id || s.Id,
    number: s.saleNumber || s.SaleNumber || `SALE-${s.id || s.Id}`,
    title: s.title || s.Title || s.description || s.Description,
    status: s.status || s.Status || 'unknown',
    date: s.createdDate || s.CreatedDate || s.saleDate || s.SaleDate,
    amount: s.totalAmount || s.TotalAmount || s.amount || s.Amount || 0,
  }));

  return {
    serviceOrders,
    offers,
    sales,
    isLoading: serviceOrdersLoading || offersLoading || salesLoading,
  };
}
