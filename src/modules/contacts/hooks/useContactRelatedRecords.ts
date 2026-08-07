import { useQuery } from '@tanstack/react-query';
import { installationsApi } from '@/services/api/installationsApi';
import { offersApi } from '@/services/api/offersApi';
import { salesApi } from '@/services/api/salesApi';
import { serviceOrdersApi } from '@/services/api/serviceOrdersApi';

interface RelatedRecord {
  id: number | string;
  number?: string;
  title?: string;
  status: string;
  date?: string;
  amount?: number;
}

interface ContactRelatedRecords {
  installations: RelatedRecord[];
  offers: RelatedRecord[];
  sales: RelatedRecord[];
  serviceOrders: RelatedRecord[];
}

export function useContactRelatedRecords(contactId: number | null) {
  // Fetch installations for this contact
  const installationsQuery = useQuery({
    queryKey: ['contact-installations', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await installationsApi.getAll({ 
        contactId: String(contactId),
        pageSize: 10 
      });
      return response.installations.map(inst => ({
        id: inst.id,
        number: inst.installationNumber || `INS-${inst.id}`,
        title: inst.name || inst.siteAddress || 'Installation',
        status: inst.status || 'active',
        date: inst.installationDate || inst.createdDate,
      }));
    },
    enabled: !!contactId,
    staleTime: 30000,
  });

  // Fetch offers for this contact
  const offersQuery = useQuery({
    queryKey: ['contact-offers', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await offersApi.getAll({ 
        contactId: contactId,
        limit: 10 
      });
      return response.data.offers.map(offer => ({
        id: offer.id,
        number: offer.offerNumber || `OFF-${offer.id}`,
        title: offer.title,
        status: offer.status,
        date: offer.createdDate || offer.modifiedDate,
        amount: offer.totalAmount,
      }));
    },
    enabled: !!contactId,
    staleTime: 30000,
  });

  // Fetch sales for this contact
  const salesQuery = useQuery({
    queryKey: ['contact-sales', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await salesApi.getAll({ 
        contactId: contactId,
        limit: 10 
      });
      return response.data.sales.map(sale => ({
        id: sale.id,
        number: sale.saleNumber || `SO-${sale.id}`,
        title: sale.title,
        status: sale.status,
        date: sale.createdDate || sale.modifiedDate,
        amount: sale.totalAmount,
      }));
    },
    enabled: !!contactId,
    staleTime: 30000,
  });

  // Fetch service orders for this contact
  const serviceOrdersQuery = useQuery({
    queryKey: ['contact-serviceOrders', contactId],
    queryFn: async () => {
      if (!contactId) return [];
      const response = await serviceOrdersApi.getAll({ 
        contactId: contactId,
        pageSize: 10 
      });
      return response.data.serviceOrders.map(so => ({
        id: so.id,
        number: so.orderNumber || `SVC-${so.id}`,
        title: so.title || 'Service Order',
        status: so.status,
        date: so.createdDate || so.modifiedDate,
      }));
    },
    enabled: !!contactId,
    staleTime: 30000,
  });

  const isLoading = 
    installationsQuery.isLoading || 
    offersQuery.isLoading || 
    salesQuery.isLoading || 
    serviceOrdersQuery.isLoading;

  const relatedRecords: ContactRelatedRecords = {
    installations: installationsQuery.data || [],
    offers: offersQuery.data || [],
    sales: salesQuery.data || [],
    serviceOrders: serviceOrdersQuery.data || [],
  };

  return {
    ...relatedRecords,
    isLoading,
    refetch: () => {
      installationsQuery.refetch();
      offersQuery.refetch();
      salesQuery.refetch();
      serviceOrdersQuery.refetch();
    },
  };
}
