/**
 * Activity Logger Service
 * 
 * Provides utility functions to log activities (time entries, expenses, materials, status changes)
 * to dispatches and service orders via their notes API.
 * Also propagates activities up the chain: Dispatch → Service Order → Sale → Offer
 */

import { dispatchesApi } from './api/dispatchesApi';
import { serviceOrdersApi } from './api/serviceOrdersApi';

export type ActivityType = 
  | 'created'
  | 'time_entry_added'
  | 'time_entry_updated'
  | 'time_entry_deleted'
  | 'expense_added'
  | 'expense_updated'
  | 'expense_deleted'
  | 'material_added'
  | 'material_updated'
  | 'material_deleted'
  | 'status_changed'
  | 'dispatch_started'
  | 'dispatch_completed'
  | 'dispatch_cancelled';

interface ActivityDetails {
  type: ActivityType;
  entityName?: string;
  userName?: string;
  oldValue?: string;
  newValue?: string;
  amount?: number | string;
  quantity?: number;
  duration?: string;
  workType?: string;
  expenseType?: string;
  articleName?: string;
  currency?: string;
}

// Helper to get current user info
const getCurrentUserInfo = () => {
  try {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const parsed = JSON.parse(userData);
      return {
        id: String(parsed.id || ''),
        name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'User'
      };
    }
  } catch {
    // ignore
  }
  return { id: '', name: 'User' };
};

// Format activity message based on type
const formatActivityMessage = (details: ActivityDetails): string => {
  const user = details.userName || getCurrentUserInfo().name;
  const timestamp = new Date().toLocaleString();
  
  switch (details.type) {
    // Creation - keep it simple and clean
    case 'created':
      return details.entityName || 'Record created';
    
    // Time Entries
    case 'time_entry_added':
      return `⏱️ Time entry added by ${user}\n` +
        `• Type: ${details.workType || 'Work'}\n` +
        `• Duration: ${details.duration || 'N/A'}\n` +
        (details.entityName ? `• Description: ${details.entityName}\n` : '') +
        `• Date: ${timestamp}`;
    
    case 'time_entry_updated':
      return `✏️ Time entry updated by ${user}\n` +
        `• Type: ${details.workType || 'Work'}\n` +
        `• Duration: ${details.duration || 'N/A'}\n` +
        `• Date: ${timestamp}`;
    
    case 'time_entry_deleted':
      return `🗑️ Time entry deleted by ${user}\n` +
        `• Type: ${details.workType || 'Work'}\n` +
        `• Duration: ${details.duration || 'N/A'}\n` +
        `• Date: ${timestamp}`;
    
    // Expenses
    case 'expense_added':
      return `💰 Expense added by ${user}\n` +
        `• Type: ${details.expenseType || 'Other'}\n` +
        `• Amount: ${details.amount} ${details.currency || 'TND'}\n` +
        (details.entityName ? `• Description: ${details.entityName}\n` : '') +
        `• Date: ${timestamp}`;
    
    case 'expense_updated':
      return `✏️ Expense updated by ${user}\n` +
        `• Type: ${details.expenseType || 'Other'}\n` +
        `• Amount: ${details.amount} ${details.currency || 'TND'}\n` +
        `• Date: ${timestamp}`;
    
    case 'expense_deleted':
      return `🗑️ Expense deleted by ${user}\n` +
        `• Type: ${details.expenseType || 'Other'}\n` +
        `• Amount: ${details.amount} ${details.currency || 'TND'}\n` +
        `• Date: ${timestamp}`;
    
    // Materials
    case 'material_added':
      return `📦 Material added by ${user}\n` +
        `• Article: ${details.articleName || 'Unknown'}\n` +
        `• Quantity: ${details.quantity || 1}\n` +
        (details.amount ? `• Cost: ${details.amount} ${details.currency || 'TND'}\n` : '') +
        `• Date: ${timestamp}`;
    
    case 'material_updated':
      return `✏️ Material updated by ${user}\n` +
        `• Article: ${details.articleName || 'Unknown'}\n` +
        `• Quantity: ${details.quantity || 1}\n` +
        (details.amount ? `• Cost: ${details.amount} ${details.currency || 'TND'}\n` : '') +
        `• Date: ${timestamp}`;
    
    case 'material_deleted':
      return `🗑️ Material removed by ${user}\n` +
        `• Article: ${details.articleName || 'Unknown'}\n` +
        `• Quantity: ${details.quantity || 1}\n` +
        `• Date: ${timestamp}`;
    
    // Status changes
    case 'status_changed':
      return `🔄 Status changed by ${user}\n` +
        `• From: ${details.oldValue || 'Unknown'}\n` +
        `• To: ${details.newValue || 'Unknown'}\n` +
        `• Date: ${timestamp}`;
    
    case 'dispatch_started':
      return `▶️ Dispatch started by ${user}\n` +
        `• Date: ${timestamp}`;
    
    case 'dispatch_completed':
      return `✅ Dispatch completed by ${user}\n` +
        `• Date: ${timestamp}`;
    
    case 'dispatch_cancelled':
      return `❌ Dispatch cancelled by ${user}\n` +
        `• Date: ${timestamp}`;
    
    default:
      return `📝 Activity by ${user} at ${timestamp}`;
  }
};

// Format a shorter activity description for propagation to parent entities
const formatShortActivityDescription = (details: ActivityDetails, dispatchNumber?: string): string => {
  const prefix = dispatchNumber ? `[From ${dispatchNumber}] ` : '';
  
  switch (details.type) {
    case 'time_entry_added':
      return `${prefix}Time entry added: ${details.workType || 'Work'} (${details.duration || 'N/A'})`;
    case 'time_entry_updated':
      return `${prefix}Time entry updated: ${details.workType || 'Work'} (${details.duration || 'N/A'})`;
    case 'time_entry_deleted':
      return `${prefix}Time entry deleted: ${details.workType || 'Work'}`;
    case 'expense_added':
      return `${prefix}Expense added: ${details.expenseType || 'Other'} - ${details.amount} ${details.currency || 'TND'}`;
    case 'expense_updated':
      return `${prefix}Expense updated: ${details.expenseType || 'Other'} - ${details.amount} ${details.currency || 'TND'}`;
    case 'expense_deleted':
      return `${prefix}Expense deleted: ${details.expenseType || 'Other'}`;
    case 'material_added':
      return `${prefix}Material added: ${details.articleName || 'Unknown'} x${details.quantity || 1}`;
    case 'material_updated':
      return `${prefix}Material updated: ${details.articleName || 'Unknown'} x${details.quantity || 1}`;
    case 'material_deleted':
      return `${prefix}Material removed: ${details.articleName || 'Unknown'}`;
    default:
      return `${prefix}Activity: ${details.type.replace(/_/g, ' ')}`;
  }
};

// Map activity type to note category for backend
const getActivityCategory = (type: ActivityType): string => {
  if (type === 'created') return 'created_from_sale';
  if (type.includes('time_entry')) return 'time_entry';
  if (type.includes('expense')) return 'expense';
  if (type.includes('material')) return 'material_added';
  if (type.includes('status') || type.includes('dispatch_')) return 'status_changed';
  return 'general';
};

// Map dispatch activity type to parent entity activity type
const mapToParentActivityType = (type: ActivityType): string => {
  if (type.includes('time_entry')) return 'dispatch_time_entry';
  if (type.includes('expense')) return 'dispatch_expense';
  if (type.includes('material')) return 'dispatch_material';
  return 'dispatch_activity';
};

/**
 * Log an activity to a dispatch
 */
export const logDispatchActivity = async (
  dispatchId: number,
  details: ActivityDetails
): Promise<void> => {
  try {
    const message = formatActivityMessage(details);
    const category = getActivityCategory(details.type);
    await dispatchesApi.addNote(dispatchId, message, category);
    console.log(`Activity logged to dispatch ${dispatchId}:`, details.type);
  } catch (error) {
    console.warn(`Failed to log activity to dispatch ${dispatchId}:`, error);
    // Don't throw - activity logging should not break the main operation
  }
};

/**
 * Log an activity to a service order
 */
export const logServiceOrderActivity = async (
  serviceOrderId: number,
  details: ActivityDetails,
  dispatchNumber?: string
): Promise<void> => {
  try {
    let message = formatActivityMessage(details);
    
    // Add dispatch reference if provided
    if (dispatchNumber) {
      message = `[From ${dispatchNumber}]\n${message}`;
    }
    
    const noteType = getActivityCategory(details.type);
    await serviceOrdersApi.addNote(serviceOrderId, {
      content: message,
      type: noteType,
    });
    console.log(`Activity logged to service order ${serviceOrderId}:`, details.type);
  } catch (error) {
    console.warn(`Failed to log activity to service order ${serviceOrderId}:`, error);
    // Don't throw - activity logging should not break the main operation
  }
};

/**
 * Log an activity to a dispatch AND propagate it up to service order, sale, and offer
 * This is the main function to use for dispatch activities that should be visible in parent entities
 */
export const logDispatchActivityWithPropagation = async (
  dispatchId: number,
  details: ActivityDetails,
  options?: {
    dispatchNumber?: string;
    serviceOrderId?: number;
  }
): Promise<void> => {
  // 1. Log to dispatch notes
  await logDispatchActivity(dispatchId, details);
  
  // 2. Try to get dispatch data to find service order and propagate up
  try {
    let serviceOrderId = options?.serviceOrderId;
    let dispatchNumber = options?.dispatchNumber;
    
    // If we don't have service order ID, fetch dispatch to get it
    if (!serviceOrderId) {
      try {
        const dispatch = await dispatchesApi.getById(dispatchId);
        serviceOrderId = dispatch.serviceOrderId;
        dispatchNumber = dispatchNumber || dispatch.dispatchNumber || `DISP-${dispatchId}`;
      } catch (fetchError) {
        console.warn('Failed to fetch dispatch for propagation:', fetchError);
        return;
      }
    }
    
    if (!serviceOrderId) {
      console.log('No service order ID found, skipping propagation');
      return;
    }
    
    // 3. Log to service order
    const shortDescription = formatShortActivityDescription(details, dispatchNumber);
    const parentActivityType = mapToParentActivityType(details.type);
    
    try {
      await serviceOrdersApi.addNote(serviceOrderId, {
        content: shortDescription,
        type: parentActivityType,
      });
      console.log(`Activity propagated to service order ${serviceOrderId}`);
    } catch (soError) {
      console.warn('Failed to propagate to service order:', soError);
    }
    
    // 4. Get service order to find sale and offer IDs
    try {
      const serviceOrder: any = await serviceOrdersApi.getById(serviceOrderId, true);
      
      // 5. Propagate to sale
      if (serviceOrder.saleId) {
        try {
          const { salesApi } = await import('./api/salesApi');
          await salesApi.addActivity(serviceOrder.saleId, {
            type: parentActivityType,
            description: shortDescription,
          });
          console.log(`Activity propagated to sale ${serviceOrder.saleId}`);
          
          // 6. Get sale to find offer ID
          const sale = await salesApi.getById(serviceOrder.saleId);
          if (sale.offerId) {
            try {
              const { offersApi } = await import('./api/offersApi');
              await offersApi.addActivity(sale.offerId, {
                type: parentActivityType,
                description: shortDescription,
              });
              console.log(`Activity propagated to offer ${sale.offerId}`);
            } catch (offerError) {
              console.warn('Failed to propagate to offer:', offerError);
            }
          }
        } catch (saleError) {
          console.warn('Failed to propagate to sale:', saleError);
        }
      }
      
      // 7. Also check if service order has direct offer ID (in case no sale)
      if (!serviceOrder.saleId && serviceOrder.offerId) {
        try {
          const { offersApi } = await import('./api/offersApi');
          await offersApi.addActivity(serviceOrder.offerId, {
            type: parentActivityType,
            description: shortDescription,
          });
          console.log(`Activity propagated to offer ${serviceOrder.offerId}`);
        } catch (offerError) {
          console.warn('Failed to propagate to offer:', offerError);
        }
      }
    } catch (fetchError) {
      console.warn('Failed to fetch service order for propagation:', fetchError);
    }
  } catch (error) {
    console.warn('Failed to propagate dispatch activity:', error);
    // Don't throw - activity logging should not break the main operation
  }
};

/**
 * Format duration from minutes to human readable string
 */
export const formatDurationForLog = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

/**
 * Calculate duration in minutes between two dates
 */
export const calculateDurationMinutes = (startTime: Date, endTime: Date): number => {
  return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
};

export const activityLogger = {
  logDispatchActivity,
  logDispatchActivityWithPropagation,
  logServiceOrderActivity,
  formatDurationForLog,
  calculateDurationMinutes,
};

export default activityLogger;
