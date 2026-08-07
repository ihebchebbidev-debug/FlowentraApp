import { useState, useEffect } from 'react';
import { WorkflowService } from '../services/workflow.service';
import { 
  WorkflowOffer, 
  WorkflowSale, 
  WorkflowServiceOrder, 
  WorkflowTechnician,
  WorkflowActivity,
  WorkflowNotification
} from '../types';

export const useWorkflowOffers = (contactId?: string) => {
  const [offers, setOffers] = useState<WorkflowOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOffers = async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getOffers(contactId);
      setOffers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOffers();
  }, [contactId]);

  return { offers, loading, error, refetch: fetchOffers };
};

export const useWorkflowSales = (contactId?: string) => {
  const [sales, setSales] = useState<WorkflowSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSales = async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getSales(contactId);
      setSales(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [contactId]);

  return { sales, loading, error, refetch: fetchSales };
};

export const useWorkflowServiceOrders = (contactId?: string) => {
  const [serviceOrders, setServiceOrders] = useState<WorkflowServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceOrders = async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getServiceOrders(contactId);
      setServiceOrders(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceOrders();
  }, [contactId]);

  return { serviceOrders, loading, error, refetch: fetchServiceOrders };
};

export const useWorkflowTechnicians = () => {
  const [technicians, setTechnicians] = useState<WorkflowTechnician[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTechnicians = async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getTechnicians();
      setTechnicians(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch technicians');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechnicians();
  }, []);

  return { technicians, loading, error, refetch: fetchTechnicians };
};

export const useWorkflowActivities = (relatedId?: string) => {
  const [activities, setActivities] = useState<WorkflowActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getActivities(relatedId);
      setActivities(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch activities');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, [relatedId]);

  return { activities, loading, error, refetch: fetchActivities };
};

export const useWorkflowNotifications = () => {
  const [notifications, setNotifications] = useState<WorkflowNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await WorkflowService.getNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await WorkflowService.markNotificationAsRead(notificationId);
      setNotifications(prev => prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to mark notification as read');
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  return { notifications, loading, error, refetch: fetchNotifications, markAsRead };
};