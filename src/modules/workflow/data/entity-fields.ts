// ============================================================================
// Entity Field Registry - Real data fields from backend models
// Used by workflow nodes (if/else, switch, email, code) for intelligent
// field selection, variable insertion, and data-aware configurations.
// ============================================================================

export interface EntityField {
  /** Field path (e.g. "status", "contact.email", "assignedTechnicians[0].email") */
  path: string;
  /** Human-readable label */
  label: string;
  /** Data type for operator selection */
  type: 'string' | 'number' | 'boolean' | 'date' | 'array' | 'object' | 'enum';
  /** Possible enum values (for status fields, priority, etc.) */
  enumValues?: string[];
  /** Category for grouping in UI */
  category: 'core' | 'status' | 'dates' | 'financial' | 'relations' | 'meta';
  /** Whether this is a good candidate for email recipients */
  isRecipient?: boolean;
  /** Description for tooltip */
  description?: string;
}

export interface EntityFieldGroup {
  entityType: string;
  label: string;
  fields: EntityField[];
}

// ============================================================================
// DISPATCH FIELDS (from Dispatch.cs + DispatchTechnician + related DTOs)
// ============================================================================
export const dispatchFields: EntityField[] = [
  // Core
  { path: 'id', label: 'ID', type: 'number', category: 'core' },
  { path: 'dispatchNumber', label: 'Dispatch Number', type: 'string', category: 'core' },
  { path: 'description', label: 'Description', type: 'string', category: 'core' },
  { path: 'siteAddress', label: 'Site Address', type: 'string', category: 'core' },
  { path: 'jobId', label: 'Job ID', type: 'string', category: 'core' },
  { path: 'completionPercentage', label: 'Completion %', type: 'number', category: 'core' },
  { path: 'actualDuration', label: 'Actual Duration (min)', type: 'number', category: 'core' },
  // Status
  { path: 'status', label: 'Status', type: 'enum', category: 'status', enumValues: ['planned', 'dispatched', 'en_route', 'on_site', 'in_progress', 'paused', 'completed', 'cancelled', 'rescheduled'] },
  { path: 'priority', label: 'Priority', type: 'enum', category: 'status', enumValues: ['low', 'medium', 'high', 'urgent'] },
  // Dates
  { path: 'scheduledDate', label: 'Scheduled Date', type: 'date', category: 'dates' },
  { path: 'completedDate', label: 'Completed Date', type: 'date', category: 'dates' },
  { path: 'dispatchedAt', label: 'Dispatched At', type: 'date', category: 'dates' },
  { path: 'actualStartTime', label: 'Actual Start Time', type: 'date', category: 'dates' },
  { path: 'actualEndTime', label: 'Actual End Time', type: 'date', category: 'dates' },
  // Relations
  { path: 'contactId', label: 'Contact ID', type: 'number', category: 'relations' },
  { path: 'contact.name', label: 'Contact Name', type: 'string', category: 'relations' },
  { path: 'contact.email', label: 'Contact Email', type: 'string', category: 'relations', isRecipient: true },
  { path: 'contact.phone', label: 'Contact Phone', type: 'string', category: 'relations' },
  { path: 'serviceOrderId', label: 'Service Order ID', type: 'number', category: 'relations' },
  { path: 'assignedTechnicians', label: 'Assigned Technicians', type: 'array', category: 'relations', description: 'Array of technician assignments' },
  { path: 'assignedTechnicians[0].userId', label: 'First Technician ID', type: 'number', category: 'relations' },
  { path: 'assignedTechnicians[0].email', label: 'First Technician Email', type: 'string', category: 'relations', isRecipient: true },
  { path: 'assignedTechnicians[0].fullName', label: 'First Technician Name', type: 'string', category: 'relations' },
  { path: 'dispatchedBy', label: 'Dispatched By', type: 'string', category: 'relations' },
  { path: 'requiredSkills', label: 'Required Skills', type: 'array', category: 'core' },
  // Meta
  { path: 'createdBy', label: 'Created By', type: 'string', category: 'meta', isRecipient: true },
  { path: 'createdDate', label: 'Created Date', type: 'date', category: 'meta' },
  { path: 'modifiedBy', label: 'Modified By', type: 'string', category: 'meta' },
  { path: 'modifiedDate', label: 'Modified Date', type: 'date', category: 'meta' },
];

// ============================================================================
// OFFER FIELDS (from Offer.cs + OfferItem)
// ============================================================================
export const offerFields: EntityField[] = [
  { path: 'id', label: 'ID', type: 'number', category: 'core' },
  { path: 'offerNumber', label: 'Offer Number', type: 'string', category: 'core' },
  { path: 'title', label: 'Title', type: 'string', category: 'core' },
  { path: 'description', label: 'Description', type: 'string', category: 'core' },
  { path: 'status', label: 'Status', type: 'enum', category: 'status', enumValues: ['draft', 'sent', 'accepted', 'rejected', 'expired', 'cancelled'] },
  // Financial
  { path: 'totalAmount', label: 'Total Amount', type: 'number', category: 'financial' },
  { path: 'discountPercent', label: 'Discount %', type: 'number', category: 'financial' },
  { path: 'taxRate', label: 'Tax Rate', type: 'number', category: 'financial' },
  { path: 'currency', label: 'Currency', type: 'string', category: 'financial' },
  // Dates
  { path: 'validUntil', label: 'Valid Until', type: 'date', category: 'dates' },
  { path: 'sentDate', label: 'Sent Date', type: 'date', category: 'dates' },
  { path: 'acceptedDate', label: 'Accepted Date', type: 'date', category: 'dates' },
  // Relations
  { path: 'contactId', label: 'Contact ID', type: 'number', category: 'relations' },
  { path: 'contact.name', label: 'Contact Name', type: 'string', category: 'relations' },
  { path: 'contact.email', label: 'Contact Email', type: 'string', category: 'relations', isRecipient: true },
  { path: 'contact.phone', label: 'Contact Phone', type: 'string', category: 'relations' },
  { path: 'items', label: 'Offer Items', type: 'array', category: 'relations', description: 'Array of offer line items' },
  { path: 'items[].type', label: 'Item Type', type: 'string', category: 'relations' },
  { path: 'items[].requiresServiceOrder', label: 'Item Requires Service Order', type: 'boolean', category: 'relations' },
  // Meta
  { path: 'createdBy', label: 'Created By', type: 'string', category: 'meta', isRecipient: true },
  { path: 'createdDate', label: 'Created Date', type: 'date', category: 'meta' },
];

// ============================================================================
// SALE FIELDS (from Sale.cs + SaleItem)
// ============================================================================
export const saleFields: EntityField[] = [
  { path: 'id', label: 'ID', type: 'number', category: 'core' },
  { path: 'saleNumber', label: 'Sale Number', type: 'string', category: 'core' },
  { path: 'title', label: 'Title', type: 'string', category: 'core' },
  { path: 'status', label: 'Status', type: 'enum', category: 'status', enumValues: ['open', 'in_progress', 'closed', 'cancelled', 'invoiced'] },
  { path: 'fulfillmentStatus', label: 'Fulfillment Status', type: 'enum', category: 'status', enumValues: ['unfulfilled', 'partial', 'fulfilled'] },
  // Financial
  { path: 'totalAmount', label: 'Total Amount', type: 'number', category: 'financial' },
  { path: 'paidAmount', label: 'Paid Amount', type: 'number', category: 'financial' },
  { path: 'remainingAmount', label: 'Remaining Amount', type: 'number', category: 'financial' },
  { path: 'currency', label: 'Currency', type: 'string', category: 'financial' },
  { path: 'paymentMethod', label: 'Payment Method', type: 'string', category: 'financial' },
  // Dates
  { path: 'saleDate', label: 'Sale Date', type: 'date', category: 'dates' },
  { path: 'dueDate', label: 'Due Date', type: 'date', category: 'dates' },
  { path: 'closedDate', label: 'Closed Date', type: 'date', category: 'dates' },
  // Relations
  { path: 'contactId', label: 'Contact ID', type: 'number', category: 'relations' },
  { path: 'contact.name', label: 'Contact Name', type: 'string', category: 'relations' },
  { path: 'contact.email', label: 'Contact Email', type: 'string', category: 'relations', isRecipient: true },
  { path: 'offerId', label: 'Source Offer ID', type: 'number', category: 'relations' },
  { path: 'items', label: 'Sale Items', type: 'array', category: 'relations' },
  { path: 'items[].type', label: 'Item Type', type: 'string', category: 'relations' },
  { path: 'items[].requiresServiceOrder', label: 'Item Requires Service Order', type: 'boolean', category: 'relations' },
  { path: 'items[].quantity', label: 'Item Quantity', type: 'number', category: 'relations' },
  { path: 'items[].unitPrice', label: 'Item Unit Price', type: 'number', category: 'relations' },
  // Meta
  { path: 'createdBy', label: 'Created By', type: 'string', category: 'meta', isRecipient: true },
  { path: 'createdDate', label: 'Created Date', type: 'date', category: 'meta' },
];

// ============================================================================
// SERVICE ORDER FIELDS
// ============================================================================
export const serviceOrderFields: EntityField[] = [
  { path: 'id', label: 'ID', type: 'number', category: 'core' },
  { path: 'serviceOrderNumber', label: 'Service Order Number', type: 'string', category: 'core' },
  { path: 'title', label: 'Title', type: 'string', category: 'core' },
  { path: 'description', label: 'Description', type: 'string', category: 'core' },
  { path: 'serviceType', label: 'Service Type', type: 'string', category: 'core' },
  { path: 'status', label: 'Status', type: 'enum', category: 'status', enumValues: ['draft', 'confirmed', 'scheduled', 'in_progress', 'technically_completed', 'invoiced', 'closed', 'cancelled'] },
  { path: 'priority', label: 'Priority', type: 'enum', category: 'status', enumValues: ['low', 'medium', 'high', 'urgent'] },
  // Progress
  { path: 'serviceCount', label: 'Total Service Count', type: 'number', category: 'core' },
  { path: 'completedDispatchCount', label: 'Completed Dispatches', type: 'number', category: 'core' },
  // Dates
  { path: 'scheduledStartDate', label: 'Scheduled Start', type: 'date', category: 'dates' },
  { path: 'scheduledEndDate', label: 'Scheduled End', type: 'date', category: 'dates' },
  { path: 'actualStartDate', label: 'Actual Start', type: 'date', category: 'dates' },
  { path: 'actualEndDate', label: 'Actual End', type: 'date', category: 'dates' },
  // Financial
  { path: 'estimatedCost', label: 'Estimated Cost', type: 'number', category: 'financial' },
  { path: 'actualCost', label: 'Actual Cost', type: 'number', category: 'financial' },
  // Relations
  { path: 'contactId', label: 'Contact ID', type: 'number', category: 'relations' },
  { path: 'contact.name', label: 'Contact Name', type: 'string', category: 'relations' },
  { path: 'contact.email', label: 'Contact Email', type: 'string', category: 'relations', isRecipient: true },
  { path: 'saleId', label: 'Source Sale ID', type: 'number', category: 'relations' },
  { path: 'assignedTo', label: 'Assigned To (User)', type: 'string', category: 'relations', isRecipient: true },
  // Meta
  { path: 'createdBy', label: 'Created By', type: 'string', category: 'meta', isRecipient: true },
  { path: 'createdDate', label: 'Created Date', type: 'date', category: 'meta' },
];

// ============================================================================
// CONTACT FIELDS
// ============================================================================
export const contactFields: EntityField[] = [
  { path: 'id', label: 'ID', type: 'number', category: 'core' },
  { path: 'name', label: 'Name', type: 'string', category: 'core' },
  { path: 'email', label: 'Email', type: 'string', category: 'core', isRecipient: true },
  { path: 'phone', label: 'Phone', type: 'string', category: 'core' },
  { path: 'company', label: 'Company', type: 'string', category: 'core' },
  { path: 'position', label: 'Position', type: 'string', category: 'core' },
  { path: 'status', label: 'Status', type: 'enum', category: 'status', enumValues: ['active', 'inactive', 'prospect', 'customer'] },
  { path: 'type', label: 'Type', type: 'enum', category: 'status', enumValues: ['individual', 'company'] },
  { path: 'tags', label: 'Tags', type: 'array', category: 'core' },
  { path: 'lastContact', label: 'Last Contact Date', type: 'date', category: 'dates' },
  { path: 'createdAt', label: 'Created Date', type: 'date', category: 'meta' },
];

// ============================================================================
// LOOKUP & HELPERS
// ============================================================================

export type WorkflowEntityType = 'dispatch' | 'offer' | 'sale' | 'service_order' | 'contact';

const entityFieldsMap: Record<WorkflowEntityType, EntityField[]> = {
  dispatch: dispatchFields,
  offer: offerFields,
  sale: saleFields,
  service_order: serviceOrderFields,
  contact: contactFields,
};

const entityLabels: Record<WorkflowEntityType, string> = {
  dispatch: 'Dispatch',
  offer: 'Offer',
  sale: 'Sale',
  service_order: 'Service Order',
  contact: 'Contact',
};

export const ALL_ENTITY_TYPES: WorkflowEntityType[] = ['dispatch', 'offer', 'sale', 'service_order', 'contact'];

export function getEntityFields(entityType: WorkflowEntityType): EntityField[] {
  return entityFieldsMap[entityType] || [];
}

export function getEntityLabel(entityType: WorkflowEntityType): string {
  return entityLabels[entityType] || entityType;
}

export function getAllFieldGroups(): EntityFieldGroup[] {
  return ALL_ENTITY_TYPES.map(et => ({
    entityType: et,
    label: entityLabels[et],
    fields: entityFieldsMap[et],
  }));
}

export function getRecipientFields(): { entityType: WorkflowEntityType; field: EntityField }[] {
  const result: { entityType: WorkflowEntityType; field: EntityField }[] = [];
  for (const et of ALL_ENTITY_TYPES) {
    for (const f of entityFieldsMap[et]) {
      if (f.isRecipient) {
        result.push({ entityType: et, field: f });
      }
    }
  }
  return result;
}

/** Get operators applicable to a field type */
export function getOperatorsForType(fieldType: EntityField['type']): { value: string; label: string }[] {
  const common = [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Not Equals' },
    { value: 'is_empty', label: 'Is Empty' },
    { value: 'is_not_empty', label: 'Is Not Empty' },
  ];

  switch (fieldType) {
    case 'string':
    case 'enum':
      return [
        ...common,
        { value: 'contains', label: 'Contains' },
        { value: 'not_contains', label: 'Does Not Contain' },
        { value: 'starts_with', label: 'Starts With' },
        { value: 'ends_with', label: 'Ends With' },
      ];
    case 'number':
      return [
        ...common,
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' },
        { value: 'greater_or_equal', label: 'Greater or Equal' },
        { value: 'less_or_equal', label: 'Less or Equal' },
      ];
    case 'date':
      return [
        ...common,
        { value: 'greater_than', label: 'After' },
        { value: 'less_than', label: 'Before' },
        { value: 'within_days', label: 'Within X Days' },
        { value: 'older_than_days', label: 'Older Than X Days' },
      ];
    case 'boolean':
      return [
        { value: 'equals', label: 'Equals' },
        { value: 'not_equals', label: 'Not Equals' },
      ];
    case 'array':
      return [
        { value: 'contains', label: 'Contains Item' },
        { value: 'not_contains', label: 'Does Not Contain' },
        { value: 'any_match', label: 'Any Item Matches' },
        { value: 'all_match', label: 'All Items Match' },
        { value: 'none_match', label: 'No Items Match' },
        { value: 'is_empty', label: 'Is Empty' },
        { value: 'is_not_empty', label: 'Is Not Empty' },
        { value: 'greater_than', label: 'Count Greater Than' },
        { value: 'less_than', label: 'Count Less Than' },
      ];
    default:
      return common;
  }
}

/** Format a field path as a variable reference: {{entity.field}} */
export function toVariable(entityType: string, fieldPath: string): string {
  return `{{${entityType}.${fieldPath}}}`;
}

/** Get common variable snippets for email/notification templates */
export function getVariableSnippets(entityType?: WorkflowEntityType): { variable: string; label: string }[] {
  const snippets: { variable: string; label: string }[] = [];
  
  if (entityType) {
    const fields = entityFieldsMap[entityType] || [];
    for (const f of fields) {
      if (f.category === 'core' || f.category === 'status' || f.category === 'financial') {
        snippets.push({ variable: `{{${entityType}.${f.path}}}`, label: `${entityLabels[entityType]} → ${f.label}` });
      }
    }
    // Add relation fields (contact name/email)
    for (const f of fields) {
      if (f.category === 'relations' && (f.path.includes('contact.') || f.isRecipient)) {
        snippets.push({ variable: `{{${entityType}.${f.path}}}`, label: `${entityLabels[entityType]} → ${f.label}` });
      }
    }
  } else {
    // Generic: add top variables from all entities
    for (const et of ALL_ENTITY_TYPES) {
      snippets.push({ variable: `{{${et}.id}}`, label: `${entityLabels[et]} ID` });
      snippets.push({ variable: `{{${et}.status}}`, label: `${entityLabels[et]} Status` });
      const emailField = entityFieldsMap[et].find(f => f.path === 'contact.email' || f.path === 'email');
      if (emailField) {
        snippets.push({ variable: `{{${et}.${emailField.path}}}`, label: `${entityLabels[et]} → ${emailField.label}` });
      }
    }
  }

  // Always add common workflow variables
  snippets.push(
    { variable: '{{trigger.entityId}}', label: 'Trigger Entity ID' },
    { variable: '{{trigger.entityType}}', label: 'Trigger Entity Type' },
    { variable: '{{trigger.fromStatus}}', label: 'Previous Status' },
    { variable: '{{trigger.toStatus}}', label: 'New Status' },
    { variable: '{{context.userId}}', label: 'Current User' },
    { variable: '{{context.timestamp}}', label: 'Current Timestamp' },
  );

  return snippets;
}
