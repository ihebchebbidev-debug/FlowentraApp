// Real API-based Workflow Service
import { offersApi, type Offer as ApiOffer } from '@/services/api/offersApi';
import { salesApi, type Sale as ApiSale } from '@/services/api/salesApi';
import { serviceOrdersApi, type ServiceOrder as ApiServiceOrder } from '@/services/api/serviceOrdersApi';
import { dispatchesApi, type Dispatch as ApiDispatch } from '@/services/api/dispatchesApi';
import { usersApi } from '@/services/api/usersApi';
import { 
  WorkflowOffer, 
  WorkflowSale, 
  WorkflowServiceOrder, 
  WorkflowDispatch,
  WorkflowTechnician,
  WorkflowActivity,
  WorkflowNotification,
  QuickCreateWorkflowData 
} from '../types';

// Cache for technicians
let cachedTechnicians: WorkflowTechnician[] = [];

// Helper to map API offer to workflow offer
const mapApiOfferToWorkflow = (offer: ApiOffer): WorkflowOffer => ({
  id: String(offer.id),
  title: offer.title,
  contactId: String(offer.contactId),
  items: (offer.items || []).map(item => ({
    id: String(item.id || ''),
    itemCode: item.itemCode || '',
    itemName: item.itemName,
    type: item.type === 'service' ? 'service' : 'article',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice,
  })),
  amount: offer.totalAmount || 0,
  status: offer.status as WorkflowOffer['status'],
  validUntil: offer.validUntil ? new Date(offer.validUntil) : undefined,
  shareLink: '',
  createdAt: offer.createdDate ? new Date(offer.createdDate) : new Date(),
  updatedAt: offer.modifiedDate ? new Date(offer.modifiedDate) : new Date(),
});

// Helper to map API sale to workflow sale
const mapApiSaleToWorkflow = (sale: ApiSale): WorkflowSale => ({
  id: String(sale.id),
  title: sale.title,
  contactId: String(sale.contactId),
  offerId: sale.offerId ? String(sale.offerId) : undefined,
  items: (sale.items || []).map(item => ({
    id: String(item.id || ''),
    itemCode: item.itemCode || '',
    itemName: item.itemName,
    type: item.type === 'service' ? 'service' : 'article',
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    totalPrice: item.quantity * item.unitPrice,
  })),
  totalAmount: sale.totalAmount || 0,
  status: sale.status as WorkflowSale['status'],
  createdAt: sale.createdDate ? new Date(sale.createdDate) : new Date(),
  updatedAt: sale.modifiedDate ? new Date(sale.modifiedDate) : new Date(),
});

// Helper to map API service order to workflow service order
const mapApiServiceOrderToWorkflow = (so: ApiServiceOrder): WorkflowServiceOrder => ({
  id: String(so.id),
  title: so.title || so.orderNumber,
  contactId: String(so.contactId),
  saleId: so.saleId ? String(so.saleId) : undefined,
  status: so.status as WorkflowServiceOrder['status'],
  priority: so.priority as WorkflowServiceOrder['priority'],
  dispatches: [],
  completionPercentage: 0,
  createdAt: so.createdDate ? new Date(so.createdDate) : new Date(),
  updatedAt: so.modifiedDate ? new Date(so.modifiedDate) : new Date(),
});

// Helper to map API dispatch to workflow dispatch
const mapApiDispatchToWorkflow = (dispatch: ApiDispatch): WorkflowDispatch => ({
  id: String(dispatch.id),
  serviceOrderId: String(dispatch.serviceOrderId || dispatch.jobId),
  title: `Dispatch #${dispatch.dispatchNumber}`,
  description: dispatch.notes,
  status: dispatch.status as WorkflowDispatch['status'],
  priority: dispatch.priority as WorkflowDispatch['priority'],
  startAt: dispatch.scheduledDate ? new Date(dispatch.scheduledDate) : undefined,
  endAt: dispatch.actualEndTime ? new Date(dispatch.actualEndTime) : undefined,
  estimatedDuration: 120,
  location: { address: dispatch.siteAddress || '' },
  tags: [],
  createdAt: dispatch.createdDate ? new Date(dispatch.createdDate) : new Date(),
  updatedAt: dispatch.modifiedDate ? new Date(dispatch.modifiedDate) : new Date(),
});

export class WorkflowService {
  static async createWorkflow(data: QuickCreateWorkflowData): Promise<{ offerId: string; saleId?: string; serviceOrderId?: string }> {
    // Create offer first
    const offerResult = await offersApi.create({
      title: `Devis pour ${data.items[0]?.itemName || 'Services'}`,
      contactId: parseInt(data.contactId, 10) || 0,
      status: 'draft',
      currency: 'USD',
      taxes: data.pricing.taxes,
      discount: data.pricing.discount,
      items: data.items.map(item => ({
        type: item.type as 'article' | 'service',
        itemName: item.itemName,
        itemCode: item.itemCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });

    const result: { offerId: string; saleId?: string; serviceOrderId?: string } = {
      offerId: String(offerResult.id)
    };

    // Auto-create sale if requested
    if (data.notifications.autoCreateSale) {
      try {
        const saleConversion = await offersApi.convertToSale(offerResult.id);
        result.saleId = String(saleConversion.saleId);

        // Create service order if services exist
        const hasServices = data.items.some(item => item.type === 'service');
        if (hasServices && saleConversion.saleId) {
          try {
            const soResult = await salesApi.createServiceOrder(saleConversion.saleId, {
              priority: 'medium',
              notes: `Auto-created from workflow for sale #${saleConversion.saleId}`,
            });
            result.serviceOrderId = String(soResult.serviceOrderId);
          } catch (e) {
            console.error('Failed to auto-create service order:', e);
          }
        }
      } catch (e) {
        console.error('Failed to auto-create sale:', e);
      }
    }

    return result;
  }

  static async getOffers(contactId?: string): Promise<WorkflowOffer[]> {
    try {
      const params: { contactId?: number; limit?: number } = { limit: 100 };
      if (contactId) params.contactId = parseInt(contactId, 10);
      
      const response = await offersApi.getAll(params);
      return response.data.offers.map(mapApiOfferToWorkflow);
    } catch (error) {
      console.error('Failed to fetch workflow offers:', error);
      return [];
    }
  }

  static async getSales(contactId?: string): Promise<WorkflowSale[]> {
    try {
      const params: { contactId?: number; limit?: number } = { limit: 100 };
      if (contactId) params.contactId = parseInt(contactId, 10);
      
      const response = await salesApi.getAll(params);
      return response.data.sales.map(mapApiSaleToWorkflow);
    } catch (error) {
      console.error('Failed to fetch workflow sales:', error);
      return [];
    }
  }

  static async getServiceOrders(contactId?: string): Promise<WorkflowServiceOrder[]> {
    try {
      const params: { contactId?: number; pageSize?: number } = { pageSize: 100 };
      if (contactId) params.contactId = parseInt(contactId, 10);
      
      const response = await serviceOrdersApi.getAll(params);
      
      // Fetch dispatches for each service order
      const serviceOrders = await Promise.all(
        response.data.serviceOrders.map(async (so) => {
          const workflowSO = mapApiServiceOrderToWorkflow(so);
          try {
            const dispatches = await serviceOrdersApi.getDispatches(so.id);
            workflowSO.dispatches = dispatches.map(mapApiDispatchToWorkflow);
            const completed = workflowSO.dispatches.filter(d => d.status === 'completed').length;
            workflowSO.completionPercentage = workflowSO.dispatches.length > 0 
              ? (completed / workflowSO.dispatches.length) * 100 
              : 0;
          } catch (e) {
            // Dispatches fetch failed, keep empty array
          }
          return workflowSO;
        })
      );
      
      return serviceOrders;
    } catch (error) {
      console.error('Failed to fetch workflow service orders:', error);
      return [];
    }
  }

  static async getTechnicians(): Promise<WorkflowTechnician[]> {
    try {
      const response = await usersApi.getAll();
      const users = Array.isArray(response) ? response : (response as any).users || [];
      
      cachedTechnicians = users.map((user: any) => ({
        id: String(user.id),
        name: `${user.firstName || user.first_name || ''} ${user.lastName || user.last_name || ''}`.trim() || user.email,
        email: user.email || '',
        phone: user.phone || '',
        status: (user.status || 'available') as WorkflowTechnician['status'],
        skills: user.skills || [],
        avatar: user.avatar,
      }));
      
      return cachedTechnicians;
    } catch (error) {
      console.error('Failed to fetch technicians:', error);
      return cachedTechnicians;
    }
  }

  static async updateDispatchStatus(dispatchId: string, status: WorkflowDispatch['status'], technicianId?: string): Promise<void> {
    const numId = parseInt(dispatchId, 10);
    if (isNaN(numId)) throw new Error('Invalid dispatch ID');
    
    if (status === 'in_progress') {
      await dispatchesApi.start(numId);
    } else if (status === 'completed') {
      await dispatchesApi.complete(numId);
    } else {
      await dispatchesApi.updateStatus(numId, status);
    }
  }

  static async createDispatch(serviceOrderId: string, dispatchData: Partial<WorkflowDispatch>): Promise<WorkflowDispatch> {
    // First get service order jobs
    const numSOId = parseInt(serviceOrderId, 10);
    if (isNaN(numSOId)) throw new Error('Invalid service order ID');
    
    const serviceOrder = await serviceOrdersApi.getById(numSOId, true);
    if (!serviceOrder.jobs || serviceOrder.jobs.length === 0) {
      throw new Error('Service order has no jobs to dispatch');
    }
    
    // Create dispatch from first job
    const jobId = serviceOrder.jobs[0].id;
    const dispatch = await dispatchesApi.createFromJob(jobId, {
      assignedTechnicianIds: dispatchData.assignedTechnician?.id ? [dispatchData.assignedTechnician.id] : [],
      scheduledDate: dispatchData.startAt?.toISOString() || new Date().toISOString(),
      priority: dispatchData.priority || 'medium',
      notes: dispatchData.description,
      siteAddress: dispatchData.location?.address,
    });
    
    return mapApiDispatchToWorkflow(dispatch);
  }

  static async getActivities(relatedId?: string): Promise<WorkflowActivity[]> {
    // Activities would come from a dedicated API endpoint in a full implementation
    // For now, return empty array
    return [];
  }

  static async getNotifications(): Promise<WorkflowNotification[]> {
    // Notifications would come from a dedicated API endpoint in a full implementation
    // For now, return empty array
    return [];
  }

  static async markNotificationAsRead(notificationId: string): Promise<void> {
    // Would call notification API in full implementation
  }
}
