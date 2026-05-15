// Context Data Fetching Service - Fetches real-time data for AI context
// When user is viewing a specific entity (contact, offer, etc.), this fetches relevant data

import { getEntityTypeFromRoute } from './contextAwareness';
import { apiFetch } from '@/services/api/apiClient';
import { API_URL } from '@/config/api';

// Fetch via apiClient for offline cache + synthetic support
const safeFetch = async <T>(url: string): Promise<T | null> => {
  try {
    const base = API_URL.replace(/\/$/, '');
    const path = url.startsWith(base) ? url.slice(base.length) : url;
    const endpoint = path.startsWith('/') ? path : `/${path}`;
    const { data, error } = await apiFetch<T>(endpoint);
    if (error || data == null) return null;
    return (data as any)?.data ?? data;
  } catch {
    return null;
  }
};

// Format contact data for AI context
const formatContactContext = async (id: string): Promise<string> => {
  const contact = await safeFetch<any>(`${API_URL}/api/Contacts/${id}`);
  if (!contact) return '';
  
  const parts = [
    `**Contact Details (ID: ${id})**`,
    `- Name: ${contact.name || contact.firstName + ' ' + contact.lastName}`,
    contact.company && `- Company: ${contact.company}`,
    contact.email && `- Email: ${contact.email}`,
    contact.phone && `- Phone: ${contact.phone}`,
    contact.type && `- Type: ${contact.type}`,
    contact.status && `- Status: ${contact.status}`,
    contact.address && `- Address: ${contact.address}`,
    contact.tags?.length && `- Tags: ${contact.tags.join(', ')}`,
    contact.notes && `- Notes: ${contact.notes.substring(0, 200)}${contact.notes.length > 200 ? '...' : ''}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format offer data for AI context
const formatOfferContext = async (id: string): Promise<string> => {
  const offer = await safeFetch<any>(`${API_URL}/api/offers/${id}`);
  if (!offer) return '';
  
  const items = offer.items || [];
  const itemsSummary = items.length > 0 
    ? items.map((i: any) => `  - ${i.itemName}: ${i.quantity} x ${i.unitPrice} = ${i.quantity * i.unitPrice}`).join('\n')
    : '  No items';
  
  const parts = [
    `**Offer Details (ID: ${id})**`,
    offer.offerNumber && `- Offer Number: ${offer.offerNumber}`,
    `- Title: ${offer.title}`,
    `- Contact: ${offer.contactName || 'N/A'}`,
    `- Status: ${offer.status}`,
    `- Total Amount: ${offer.totalAmount} ${offer.currency || 'USD'}`,
    offer.validUntil && `- Valid Until: ${new Date(offer.validUntil).toLocaleDateString()}`,
    offer.taxes && `- Taxes: ${offer.taxes}${offer.taxType === 'percentage' ? '%' : ''}`,
    offer.discount && `- Discount: ${offer.discount}`,
    `- Line Items (${items.length}):`,
    itemsSummary,
    offer.description && `- Description: ${offer.description.substring(0, 200)}`,
    offer.convertedToSaleId && `- Converted to Sale ID: ${offer.convertedToSaleId}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format sale data for AI context
const formatSaleContext = async (id: string): Promise<string> => {
  const sale = await safeFetch<any>(`${API_URL}/api/sales/${id}`);
  if (!sale) return '';
  
  const items = sale.items || [];
  const itemsSummary = items.length > 0 
    ? items.map((i: any) => `  - ${i.itemName} (${i.type}): ${i.quantity} x ${i.unitPrice}${i.requiresServiceOrder ? ' [Requires Service]' : ''}`).join('\n')
    : '  No items';
  
  const parts = [
    `**Sale Details (ID: ${id})**`,
    sale.saleNumber && `- Sale Number: ${sale.saleNumber}`,
    `- Title: ${sale.title}`,
    `- Contact: ${sale.contactName || 'N/A'}`,
    `- Status: ${sale.status}`,
    `- Stage: ${sale.stage}`,
    `- Priority: ${sale.priority}`,
    `- Total Amount: ${sale.totalAmount} ${sale.currency || 'USD'}`,
    sale.offerId && `- From Offer ID: ${sale.offerId}`,
    sale.convertedToServiceOrderId && `- Service Order ID: ${sale.convertedToServiceOrderId}`,
    `- Line Items (${items.length}):`,
    itemsSummary,
    sale.notes && `- Notes: ${sale.notes.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format service order data for AI context
const formatServiceOrderContext = async (id: string): Promise<string> => {
  const so = await safeFetch<any>(`${API_URL}/api/service-orders/${id}?includeJobs=true`);
  if (!so) return '';
  
  const jobs = so.jobs || [];
  const jobsSummary = jobs.length > 0 
    ? jobs.map((j: any) => `  - ${j.title} (${j.status}): ${j.jobDescription?.substring(0, 50) || 'No description'}`).join('\n')
    : '  No jobs';
  
  const parts = [
    `**Service Order Details (ID: ${id})**`,
    so.orderNumber && `- Order Number: ${so.orderNumber}`,
    so.title && `- Title: ${so.title}`,
    `- Contact: ${so.contactName || 'N/A'}`,
    `- Status: ${so.status}`,
    `- Priority: ${so.priority}`,
    so.serviceType && `- Service Type: ${so.serviceType}`,
    so.saleId && `- From Sale ID: ${so.saleId}`,
    so.startDate && `- Start Date: ${new Date(so.startDate).toLocaleDateString()}`,
    so.targetCompletionDate && `- Target Completion: ${new Date(so.targetCompletionDate).toLocaleDateString()}`,
    so.estimatedCost && `- Estimated Cost: ${so.estimatedCost}`,
    so.actualCost && `- Actual Cost: ${so.actualCost}`,
    `- Jobs (${jobs.length}):`,
    jobsSummary,
    so.notes && `- Notes: ${so.notes.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format dispatch data for AI context
const formatDispatchContext = async (id: string): Promise<string> => {
  const dispatch = await safeFetch<any>(`${API_URL}/api/dispatches/${id}`);
  if (!dispatch) return '';
  
  const parts = [
    `**Dispatch Details (ID: ${id})**`,
    dispatch.dispatchNumber && `- Dispatch Number: ${dispatch.dispatchNumber}`,
    `- Status: ${dispatch.status}`,
    dispatch.assignedUserName && `- Assigned To: ${dispatch.assignedUserName}`,
    dispatch.scheduledDate && `- Scheduled Date: ${new Date(dispatch.scheduledDate).toLocaleDateString()}`,
    dispatch.scheduledStartTime && `- Start Time: ${dispatch.scheduledStartTime}`,
    dispatch.scheduledEndTime && `- End Time: ${dispatch.scheduledEndTime}`,
    dispatch.jobTitle && `- Job: ${dispatch.jobTitle}`,
    dispatch.serviceOrderNumber && `- Service Order: ${dispatch.serviceOrderNumber}`,
    dispatch.contactName && `- Customer: ${dispatch.contactName}`,
    dispatch.address && `- Location: ${dispatch.address}`,
    dispatch.notes && `- Notes: ${dispatch.notes.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format installation data for AI context
const formatInstallationContext = async (id: string): Promise<string> => {
  const installation = await safeFetch<any>(`${API_URL}/api/installations/${id}`);
  if (!installation) return '';
  
  const parts = [
    `**Installation Details (ID: ${id})**`,
    installation.installationNumber && `- Installation Number: ${installation.installationNumber}`,
    installation.name && `- Name: ${installation.name}`,
    `- Type: ${installation.installationType || installation.type || 'N/A'}`,
    `- Status: ${installation.status}`,
    installation.manufacturer && `- Manufacturer: ${installation.manufacturer}`,
    installation.model && `- Model: ${installation.model}`,
    installation.serialNumber && `- Serial Number: ${installation.serialNumber}`,
    installation.siteAddress && `- Site Address: ${installation.siteAddress}`,
    installation.installationDate && `- Installation Date: ${new Date(installation.installationDate).toLocaleDateString()}`,
    installation.warrantyExpiry && `- Warranty Expiry: ${new Date(installation.warrantyExpiry).toLocaleDateString()}`,
    installation.category && `- Category: ${installation.category}`,
    installation.notes && `- Notes: ${installation.notes.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format article/inventory data for AI context
const formatArticleContext = async (id: string): Promise<string> => {
  const article = await safeFetch<any>(`${API_URL}/api/articles/${id}`);
  if (!article) return '';
  
  const parts = [
    `**Article Details (ID: ${id})**`,
    article.code && `- Code/SKU: ${article.code}`,
    `- Name: ${article.name}`,
    `- Type: ${article.type}`,
    article.category && `- Category: ${article.category}`,
    `- Unit Price: ${article.unitPrice}`,
    article.type === 'article' && article.stockQuantity !== undefined && `- Stock Quantity: ${article.stockQuantity}`,
    article.type === 'article' && article.minStockLevel !== undefined && `- Min Stock Level: ${article.minStockLevel}`,
    article.unit && `- Unit: ${article.unit}`,
    article.description && `- Description: ${article.description.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format task data for AI context (tries project-task then daily-task)
const formatTaskContext = async (id: string): Promise<string> => {
  let task = await safeFetch<any>(`${API_URL}/api/Tasks/project-task/${id}`);
  if (!task) {
    task = await safeFetch<any>(`${API_URL}/api/Tasks/daily-task/${id}`);
  }
  if (!task) return '';
  
  const parts = [
    `**Task Details (ID: ${id})**`,
    `- Title: ${task.title}`,
    `- Status: ${task.status}`,
    `- Priority: ${task.priority}`,
    task.dueDate && `- Due Date: ${new Date(task.dueDate).toLocaleDateString()}`,
    task.assignedToName && `- Assigned To: ${task.assignedToName}`,
    task.projectName && `- Project: ${task.projectName}`,
    task.description && `- Description: ${task.description.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format project data for AI context
const formatProjectContext = async (id: string): Promise<string> => {
  const project = await safeFetch<any>(`${API_URL}/api/Projects/${id}`);
  if (!project) return '';
  
  const parts = [
    `**Project Details (ID: ${id})**`,
    `- Name: ${project.name}`,
    `- Status: ${project.status}`,
    project.startDate && `- Start Date: ${new Date(project.startDate).toLocaleDateString()}`,
    project.endDate && `- End Date: ${new Date(project.endDate).toLocaleDateString()}`,
    project.progress !== undefined && `- Progress: ${project.progress}%`,
    project.taskCount !== undefined && `- Total Tasks: ${project.taskCount}`,
    project.completedTaskCount !== undefined && `- Completed Tasks: ${project.completedTaskCount}`,
    project.description && `- Description: ${project.description.substring(0, 200)}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Format user data for AI context
const formatUserContext = async (id: string): Promise<string> => {
  const user = await safeFetch<any>(`${API_URL}/api/Users/${id}`);
  if (!user) return '';
  
  const parts = [
    `**User Details (ID: ${id})**`,
    `- Name: ${user.firstName} ${user.lastName}`,
    `- Email: ${user.email}`,
    user.role && `- Role: ${user.role}`,
    user.userType && `- User Type: ${user.userType}`,
    user.status && `- Status: ${user.status}`,
    user.phone && `- Phone: ${user.phone}`,
    user.department && `- Department: ${user.department}`
  ];
  
  return parts.filter(Boolean).join('\n');
};

// Main function to fetch context data based on current route
export const fetchContextData = async (route: string): Promise<string | null> => {
  const entityInfo = getEntityTypeFromRoute(route);
  
  if (!entityInfo || !entityInfo.id) {
    return null;
  }
  
  const { type, id } = entityInfo;
  
  try {
    switch (type) {
      case 'contact':
        return await formatContactContext(id);
      case 'offer':
        return await formatOfferContext(id);
      case 'sale':
        return await formatSaleContext(id);
      case 'serviceOrder':
        return await formatServiceOrderContext(id);
      case 'dispatch':
        return await formatDispatchContext(id);
      case 'installation':
        return await formatInstallationContext(id);
      case 'article':
        return await formatArticleContext(id);
      case 'task':
        return await formatTaskContext(id);
      case 'project':
        return await formatProjectContext(id);
      case 'user':
        return await formatUserContext(id);
      default:
        return null;
    }
  } catch (error) {
    console.warn('Failed to fetch context data:', error);
    return null;
  }
};

// Check if current route is a detail page that needs data fetching
export const isDetailPage = (route: string): boolean => {
  const entityInfo = getEntityTypeFromRoute(route);
  return entityInfo !== null && entityInfo.id !== undefined;
};
