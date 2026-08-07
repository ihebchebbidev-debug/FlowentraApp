import { useState, useEffect, useCallback, useRef } from 'react';
import { SalesService } from '@/modules/sales/services/sales.service';
import { OffersService } from '@/modules/offers/services/offers.service';
import { ArticlesService, type InventoryArticle } from '@/modules/articles/services/articles.service';
import { tasksApi } from '@/services/api/tasksApi';
import { contactsApi } from '@/services/api/contactsApi';
import { serviceOrdersApi, type ServiceOrder } from '@/services/api/serviceOrdersApi';
import { dispatchesApi, type Dispatch } from '@/services/api/dispatchesApi';
import type { Sale, SaleStats } from '@/modules/sales/types';
import type { Offer, OfferStats } from '@/modules/offers/types';
import type { Task } from '@/modules/tasks/types';
import type { Contact } from '@/types/contacts';
import { useDashboardSnapshot } from '@/modules/dashboard/context/DashboardSnapshotContext';
import dayjs from 'dayjs';

export interface DashboardData {
  sales: Sale[];
  salesStats: SaleStats;
  wonSales: number;
  lostSales: number;
  closedSales: number;
  cancelledSales: number;
  activeSales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  closedSalesRevenue: number;
  offers: Offer[];
  offersStats: OfferStats;
  acceptedOffers: number;
  pendingOffers: number;
  contacts: Contact[];
  totalContacts: number;
  activeContacts: number;
  tasks: Task[];
  overdueTasks: Task[];
  pendingTasks: number;
  articles: InventoryArticle[];
  totalArticles: number;
  lowStockArticles: number;
  serviceOrders: ServiceOrder[];
  dispatches: Dispatch[];
  isLoading: boolean;
  salesLoading: boolean;
  offersLoading: boolean;
  tasksLoading: boolean;
  articlesLoading: boolean;
  contactsLoading: boolean;
  serviceOrdersLoading: boolean;
  dispatchesLoading: boolean;
  refetch?: {
    sales: (silent?: boolean) => Promise<void>;
    offers: (silent?: boolean) => Promise<void>;
    contacts: (silent?: boolean) => Promise<void>;
    tasks: (silent?: boolean) => Promise<void>;
    articles: (silent?: boolean) => Promise<void>;
    serviceOrders: (silent?: boolean) => Promise<void>;
    dispatches: (silent?: boolean) => Promise<void>;
    all: (silent?: boolean) => Promise<void>;
  };
  silentRefresh?: () => void;
}

const initialSalesStats: SaleStats = {
  totalSales: 0, activeSales: 0, wonSales: 0, lostSales: 0,
  totalValue: 0, averageValue: 0, conversionRate: 0, monthlyGrowth: 0,
};

const initialOffersStats: OfferStats = {
  totalOffers: 0, draftOffers: 0, activeOffers: 0, acceptedOffers: 0,
  declinedOffers: 0, totalValue: 0, averageValue: 0, conversionRate: 0, monthlyGrowth: 0,
};

export function useDashboardData(): DashboardData {
  // If a snapshot is available (public dashboard view), return it directly
  const snapshot = useDashboardSnapshot();
  
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesStats, setSalesStats] = useState<SaleStats>(initialSalesStats);
  const [salesLoading, setSalesLoading] = useState(true);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [offersStats, setOffersStats] = useState<OfferStats>(initialOffersStats);
  const [offersLoading, setOffersLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [articles, setArticles] = useState<InventoryArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([]);
  const [serviceOrdersLoading, setServiceOrdersLoading] = useState(true);
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [dispatchesLoading, setDispatchesLoading] = useState(true);

  // Track if initial load is done (to avoid showing spinner on refresh)
  const initialLoadDone = useRef(false);

  const fetchSales = useCallback(async (silent = false) => {
    try {
      if (!silent) setSalesLoading(true);
      const [salesData, statsData] = await Promise.all([
        SalesService.getSales(),
        SalesService.getSaleStats(),
      ]);
      setSales(salesData);
      setSalesStats(statsData);
    } catch (error) {
      console.error('Dashboard: Failed to fetch sales:', error);
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const fetchOffers = useCallback(async (silent = false) => {
    try {
      if (!silent) setOffersLoading(true);
      const [offersData, statsData] = await Promise.all([
        OffersService.getOffers(),
        OffersService.getOfferStats(),
      ]);
      setOffers(offersData);
      setOffersStats(statsData);
    } catch (error) {
      console.error('Dashboard: Failed to fetch offers:', error);
    } finally {
      setOffersLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async (silent = false) => {
    try {
      if (!silent) setContactsLoading(true);
      const response = await contactsApi.getAll({ pageSize: 1000 });
      setContacts(response.contacts || []);
    } catch (error) {
      console.error('Dashboard: Failed to fetch contacts:', error);
    } finally {
      setContactsLoading(false);
    }
  }, []);

  const fetchTasks = useCallback(async (silent = false) => {
    try {
      if (!silent) setTasksLoading(true);
      const tasksData = await tasksApi.searchTasks({});
      setTasks(tasksData.tasks || []);
    } catch (error) {
      console.error('Dashboard: Failed to fetch tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const fetchArticles = useCallback(async (silent = false) => {
    try {
      if (!silent) setArticlesLoading(true);
      const articlesData = await ArticlesService.listAsync();
      setArticles(articlesData);
    } catch (error) {
      console.error('Dashboard: Failed to fetch articles:', error);
    } finally {
      setArticlesLoading(false);
    }
  }, []);

  const fetchServiceOrders = useCallback(async (silent = false) => {
    try {
      if (!silent) setServiceOrdersLoading(true);
      const result = await serviceOrdersApi.getAll({ pageSize: 1000 });
      setServiceOrders(result?.data?.serviceOrders || []);
    } catch (error) {
      console.error('Dashboard: Failed to fetch service orders:', error);
    } finally {
      setServiceOrdersLoading(false);
    }
  }, []);

  const fetchDispatches = useCallback(async (silent = false) => {
    try {
      if (!silent) setDispatchesLoading(true);
      const result = await dispatchesApi.getAll({ pageSize: 1000 });
      setDispatches(result?.data || []);
    } catch (error) {
      console.error('Dashboard: Failed to fetch dispatches:', error);
    } finally {
      setDispatchesLoading(false);
    }
  }, []);

  const fetchAll = useCallback(async (silent = false) => {
    await Promise.all([
      fetchSales(silent),
      fetchOffers(silent),
      fetchContacts(silent),
      fetchTasks(silent),
      fetchArticles(silent),
      fetchServiceOrders(silent),
      fetchDispatches(silent),
    ]);
    initialLoadDone.current = true;
  }, [fetchSales, fetchOffers, fetchContacts, fetchTasks, fetchArticles, fetchServiceOrders, fetchDispatches]);

  // Silent refresh (no loading spinners)
  const silentRefresh = useCallback(() => {
    if (initialLoadDone.current) {
      fetchAll(true);
    }
  }, [fetchAll]);

  // Initial load
  useEffect(() => {
    if (!snapshot) fetchAll(false);
  }, [fetchAll, snapshot]);

  // If snapshot data available (public view), return it directly — skip all API-derived state
  if (snapshot) return snapshot;

  // Derived data
  const closedSales = sales.filter(s => s.status === 'closed' || s.status === 'invoiced').length;
  const cancelledSales = sales.filter(s => s.status === 'cancelled').length;
  const activeSales = sales.filter(s => s.status === 'created' || s.status === 'in_progress').length;
  const totalRevenue = salesStats.totalValue || sales.reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0);
  const closedSalesRevenue = sales
    .filter(s => s.status === 'closed' || s.status === 'invoiced' || s.status === 'partially_invoiced')
    .reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0);
  const startOfMonth = dayjs().startOf('month');
  const monthlyRevenue = sales
    .filter(s => (s.status === 'closed' || s.status === 'invoiced') && dayjs(s.createdAt).isAfter(startOfMonth))
    .reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0);
  const acceptedOffers = offers.filter(o => o.status === 'accepted').length;
  const pendingOffers = offers.filter(o => o.status === 'sent' || o.status === 'draft' || o.status === 'negotiation').length;
  const totalContacts = contacts.length;
  const activeContacts = contacts.filter(c => c.status === 'active').length;
  const overdueTasks = tasks.filter(t => {
    if (t.status === 'done' || t.status === 'completed') return false;
    if (!t.dueDate) return false;
    return dayjs(t.dueDate).isBefore(dayjs(), 'day');
  });
  const pendingTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'completed').length;
  const lowStockArticles = articles.filter(a => (a.stock || 0) < (a.minStock || 10)).length;

  const isLoading = salesLoading || offersLoading || tasksLoading || articlesLoading || contactsLoading || serviceOrdersLoading || dispatchesLoading;

  return {
    sales, salesStats, closedSales, cancelledSales, activeSales,
    wonSales: salesStats.wonSales, lostSales: salesStats.lostSales,
    totalRevenue, monthlyRevenue, closedSalesRevenue,
    offers, offersStats, acceptedOffers, pendingOffers,
    contacts, totalContacts, activeContacts,
    tasks, overdueTasks, pendingTasks,
    articles, totalArticles: articles.length, lowStockArticles,
    serviceOrders, dispatches,
    isLoading, salesLoading, offersLoading, tasksLoading, articlesLoading, contactsLoading, serviceOrdersLoading, dispatchesLoading,
    refetch: {
      sales: fetchSales,
      offers: fetchOffers,
      contacts: fetchContacts,
      tasks: fetchTasks,
      articles: fetchArticles,
      serviceOrders: fetchServiceOrders,
      dispatches: fetchDispatches,
      all: fetchAll,
    },
    silentRefresh,
  };
}
