import { useState, useEffect, useCallback, useMemo } from 'react';
import { serviceOrdersApi, type ServiceOrder } from '@/services/api/serviceOrdersApi';
import { usersApi } from '@/services/api/usersApi';

export interface ServiceOrderListItem {
  id: number;
  orderNumber: string;
  title: string;
  contactName: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  targetCompletionDate?: string;
  createdDate?: string;
  createdBy?: string;
  jobsCount: number;
}

interface UseServiceOrdersListState {
  serviceOrders: ServiceOrderListItem[];
  totalCount: number;
  isLoading: boolean;
  error: string | null;
}

interface UseServiceOrdersListFilters {
  status?: string;
  priority?: string;
  search?: string;
}

export function useServiceOrdersList(pageSize: number = 6) {
  const [state, setState] = useState<UseServiceOrdersListState>({
    serviceOrders: [],
    totalCount: 0,
    isLoading: true,
    error: null,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<UseServiceOrdersListFilters>({});
  const [userMap, setUserMap] = useState<Record<string, string>>({});

  // Fetch users once to build a name lookup map
  // MainAdminUsers (id=1) are stored separately, regular Users (id>=2) are from Users table
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const map: Record<string, string> = {};
        
        // Get MainAdminUser info from local storage (id=1 is always the main admin)
        try {
          const userData = localStorage.getItem('user_data');
          if (userData) {
            const adminUser = JSON.parse(userData);
            if (adminUser.id) {
              const adminName = `${adminUser.firstName || ''} ${adminUser.lastName || ''}`.trim() 
                || adminUser.email 
                || 'Admin';
              map['1'] = adminName;
            }
          }
        } catch (e) {
          console.warn('Failed to get admin user from localStorage:', e);
        }
        
        // Fetch regular users from Users table (id >= 2)
        const res = await usersApi.getAll();
        const users = res.users || [];
        users.forEach((u) => {
          const displayName = `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || `User ${u.id}`;
          map[String(u.id)] = displayName;
        });
        
        setUserMap(map);
      } catch (err) {
        console.warn('Failed to fetch users for name lookup:', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchServiceOrders = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await serviceOrdersApi.getAll({
        page: currentPage,
        pageSize,
        status: filters.status,
        priority: filters.priority,
        search: filters.search,
      });

      const serviceOrders = response.data?.serviceOrders || [];
      const pagination = response.data?.pagination || { total: 0 };

      const listItems: ServiceOrderListItem[] = serviceOrders.map((so: ServiceOrder) => {
        const createdById = String((so as any).createdBy || '');
        const createdByName = userMap[createdById] || (createdById ? `User ${createdById}` : '-');
        
        return {
          id: so.id,
          orderNumber: so.orderNumber,
          title: so.title || so.notes?.substring(0, 50) || `Service Order #${so.orderNumber}`,
          contactName: so.contactName || (so as any).customerName || (so as any).contact?.name || '-',
          status: so.status,
          priority: so.priority,
          targetCompletionDate: so.targetCompletionDate,
          createdDate: so.createdDate,
          createdBy: createdByName,
          jobsCount: so.jobs?.length || 0,
        };
      });

      setState({
        serviceOrders: listItems,
        totalCount: pagination.total || listItems.length,
        isLoading: false,
        error: null,
      });
    } catch (err: any) {
      console.error('Failed to fetch service orders:', err);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || 'Failed to load service orders',
      }));
    }
  }, [currentPage, pageSize, filters, userMap]);

  useEffect(() => {
    fetchServiceOrders();
  }, [fetchServiceOrders]);

  const totalPages = useMemo(() => {
    return Math.ceil(state.totalCount / pageSize);
  }, [state.totalCount, pageSize]);

  const goToNextPage = useCallback(() => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  }, [currentPage, totalPages]);

  const goToPrevPage = useCallback(() => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  }, [currentPage]);

  const updateFilters = useCallback((newFilters: Partial<UseServiceOrdersListFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  return {
    serviceOrders: state.serviceOrders,
    totalCount: state.totalCount,
    currentPage,
    totalPages,
    isLoading: state.isLoading,
    error: state.error,
    filters,
    goToNextPage,
    goToPrevPage,
    updateFilters,
    clearFilters,
    refetch: fetchServiceOrders,
  };
}
