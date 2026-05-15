import type {
  PurchaseOrder, GoodsReceipt, SupplierInvoice, ArticleSupplier,
  ArticleSupplierPriceHistory, PurchaseActivity, PurchaseStats
} from '../types';

// ─── Suppliers (references to Contacts with type=supplier) ───
const suppliers = [
  { id: '101', name: 'TechParts SARL', email: 'contact@techparts.tn', phone: '+216 71 123 456', matriculeFiscale: '1234567/A/B/C/000', address: 'Zone Industrielle, Tunis' },
  { id: '102', name: 'ElectroPro Tunisia', email: 'info@electropro.tn', phone: '+216 71 234 567', matriculeFiscale: '2345678/A/B/C/000', address: 'Rue de la Liberté, Sfax' },
  { id: '103', name: 'MechaSolutions', email: 'sales@mechasolutions.tn', phone: '+216 71 345 678', matriculeFiscale: '3456789/A/B/C/000', address: 'Avenue Bourguiba, Sousse' },
  { id: '104', name: 'BuildMat SA', email: 'orders@buildmat.tn', phone: '+216 71 456 789', matriculeFiscale: '4567890/A/B/C/000', address: 'Route de Bizerte, Ariana' },
  { id: '105', name: 'GlobalSupply Co', email: 'procurement@globalsupply.tn', phone: '+216 71 567 890', matriculeFiscale: '5678901/A/B/C/000', address: 'Lac 1, Tunis' },
];

// ─── Article-Supplier ───
export const mockArticleSuppliers: ArticleSupplier[] = [
  { id: 'as-1', articleId: '1', articleName: 'Climatiseur Split 12000 BTU', articleNumber: 'ART-001', supplierId: '101', supplierName: 'TechParts SARL', supplierRef: 'TP-CLM-12K', purchasePrice: 850.00, currency: 'TND', minOrderQty: 5, leadTimeDays: 7, isPreferred: true, isActive: true, createdDate: '2025-01-15', createdBy: 'admin' },
  { id: 'as-2', articleId: '1', articleName: 'Climatiseur Split 12000 BTU', articleNumber: 'ART-001', supplierId: '102', supplierName: 'ElectroPro Tunisia', supplierRef: 'EP-AC-12', purchasePrice: 890.00, currency: 'TND', minOrderQty: 3, leadTimeDays: 10, isPreferred: false, isActive: true, createdDate: '2025-02-01', createdBy: 'admin' },
  { id: 'as-3', articleId: '2', articleName: 'Filtre à air standard', articleNumber: 'ART-002', supplierId: '101', supplierName: 'TechParts SARL', supplierRef: 'TP-FLT-STD', purchasePrice: 12.50, currency: 'TND', minOrderQty: 50, leadTimeDays: 3, isPreferred: true, isActive: true, createdDate: '2025-01-15', createdBy: 'admin' },
  { id: 'as-4', articleId: '3', articleName: 'Compresseur rotatif', articleNumber: 'ART-003', supplierId: '103', supplierName: 'MechaSolutions', supplierRef: 'MS-CMP-R01', purchasePrice: 320.00, currency: 'TND', minOrderQty: 2, leadTimeDays: 14, isPreferred: true, isActive: true, createdDate: '2025-01-20', createdBy: 'admin' },
  { id: 'as-5', articleId: '4', articleName: 'Tube cuivre 1/4"', articleNumber: 'ART-004', supplierId: '104', supplierName: 'BuildMat SA', supplierRef: 'BM-TCU-025', purchasePrice: 8.00, currency: 'TND', minOrderQty: 100, leadTimeDays: 5, isPreferred: true, isActive: true, createdDate: '2025-02-10', createdBy: 'admin' },
  { id: 'as-6', articleId: '5', articleName: 'Thermostat digital', articleNumber: 'ART-005', supplierId: '102', supplierName: 'ElectroPro Tunisia', supplierRef: 'EP-THR-D01', purchasePrice: 45.00, currency: 'TND', minOrderQty: 10, leadTimeDays: 7, isPreferred: true, isActive: true, createdDate: '2025-03-01', createdBy: 'admin' },
  { id: 'as-7', articleId: '6', articleName: 'Gaz réfrigérant R410A', articleNumber: 'ART-006', supplierId: '105', supplierName: 'GlobalSupply Co', supplierRef: 'GS-R410A-10', purchasePrice: 180.00, currency: 'TND', minOrderQty: 5, leadTimeDays: 21, isPreferred: true, isActive: true, createdDate: '2025-01-10', createdBy: 'admin' },
  { id: 'as-8', articleId: '7', articleName: 'Support mural universel', articleNumber: 'ART-007', supplierId: '104', supplierName: 'BuildMat SA', supplierRef: 'BM-SUP-UNI', purchasePrice: 25.00, currency: 'TND', minOrderQty: 20, leadTimeDays: 3, isPreferred: true, isActive: true, createdDate: '2025-02-15', createdBy: 'admin' },
];

export const mockPriceHistory: ArticleSupplierPriceHistory[] = [
  { id: 'ph-1', articleSupplierId: 'as-1', oldPrice: 800.00, newPrice: 850.00, currency: 'TND', changedAt: '2025-06-01', changedBy: 'admin', reason: 'Annual price increase' },
  { id: 'ph-2', articleSupplierId: 'as-1', oldPrice: 780.00, newPrice: 800.00, currency: 'TND', changedAt: '2025-01-15', changedBy: 'admin', reason: 'Initial pricing' },
  { id: 'ph-3', articleSupplierId: 'as-3', oldPrice: 11.00, newPrice: 12.50, currency: 'TND', changedAt: '2025-04-01', changedBy: 'admin', reason: 'Raw material cost increase' },
  { id: 'ph-4', articleSupplierId: 'as-4', oldPrice: 300.00, newPrice: 320.00, currency: 'TND', changedAt: '2025-05-15', changedBy: 'admin', reason: 'Currency adjustment' },
  { id: 'ph-5', articleSupplierId: 'as-7', oldPrice: 160.00, newPrice: 180.00, currency: 'TND', changedAt: '2025-03-01', changedBy: 'admin', reason: 'Supplier price update' },
];

// ─── Purchase Orders ───
export const mockPurchaseOrders: PurchaseOrder[] = [
  {
    id: 'po-1', orderNumber: 'PO-2026-0001', supplierId: '101', supplierName: 'TechParts SARL', supplierEmail: 'contact@techparts.tn', supplierPhone: '+216 71 123 456', supplierAddress: 'Zone Industrielle, Tunis', supplierMatriculeFiscale: '1234567/A/B/C/000',
    title: 'Q1 AC Units Restock', status: 'received', orderDate: '2026-01-10', expectedDelivery: '2026-01-20', actualDelivery: '2026-01-18',
    currency: 'TND', subTotal: 4250.00, discount: 5, discountType: 'percentage', taxAmount: 769.13, fiscalStamp: 1.000, grandTotal: 4807.63,
    paymentTerms: 'net30', paymentStatus: 'paid', notes: 'Urgent restock for winter season', tags: ['urgent', 'q1'],
    billingAddress: '10 Rue de Carthage, Tunis', deliveryAddress: 'Warehouse A, Zone Industrielle',
    items: [
      { id: 'poi-1', purchaseOrderId: 'po-1', articleId: '1', articleName: 'Climatiseur Split 12000 BTU', articleNumber: 'ART-001', supplierRef: 'TP-CLM-12K', description: 'Split AC 12K BTU', quantity: 5, receivedQty: 5, unitPrice: 850.00, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 4250.00, unit: 'piece', displayOrder: 0 },
    ],
    createdDate: '2026-01-10', createdBy: 'admin', createdByName: 'Admin User',
  },
  {
    id: 'po-2', orderNumber: 'PO-2026-0002', supplierId: '102', supplierName: 'ElectroPro Tunisia', supplierEmail: 'info@electropro.tn', supplierPhone: '+216 71 234 567', supplierAddress: 'Rue de la Liberté, Sfax', supplierMatriculeFiscale: '2345678/A/B/C/000',
    title: 'Thermostat Bulk Order', status: 'ordered', orderDate: '2026-02-15', expectedDelivery: '2026-02-25',
    currency: 'TND', subTotal: 900.00, discount: 0, discountType: 'fixed', taxAmount: 171.00, fiscalStamp: 1.000, grandTotal: 1072.00,
    paymentTerms: 'net30', paymentStatus: 'pending', tags: ['bulk'],
    items: [
      { id: 'poi-2', purchaseOrderId: 'po-2', articleId: '5', articleName: 'Thermostat digital', articleNumber: 'ART-005', supplierRef: 'EP-THR-D01', description: 'Digital thermostat', quantity: 20, receivedQty: 0, unitPrice: 45.00, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 900.00, unit: 'piece', displayOrder: 0 },
    ],
    createdDate: '2026-02-15', createdBy: 'admin', createdByName: 'Admin User',
  },
  {
    id: 'po-3', orderNumber: 'PO-2026-0003', supplierId: '103', supplierName: 'MechaSolutions', supplierEmail: 'sales@mechasolutions.tn', supplierAddress: 'Avenue Bourguiba, Sousse', supplierMatriculeFiscale: '3456789/A/B/C/000',
    title: 'Compressor Replacement Parts', status: 'partially_received', orderDate: '2026-03-01', expectedDelivery: '2026-03-15',
    currency: 'TND', subTotal: 1280.00, discount: 0, discountType: 'fixed', taxAmount: 243.20, fiscalStamp: 1.000, grandTotal: 1524.20,
    paymentTerms: 'net60', paymentStatus: 'pending', tags: ['maintenance'],
    items: [
      { id: 'poi-3', purchaseOrderId: 'po-3', articleId: '3', articleName: 'Compresseur rotatif', articleNumber: 'ART-003', supplierRef: 'MS-CMP-R01', description: 'Rotary compressor', quantity: 4, receivedQty: 2, unitPrice: 320.00, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 1280.00, unit: 'piece', displayOrder: 0 },
    ],
    createdDate: '2026-03-01', createdBy: 'admin', createdByName: 'Admin User',
  },
  {
    id: 'po-4', orderNumber: 'PO-2026-0004', supplierId: '104', supplierName: 'BuildMat SA', supplierEmail: 'orders@buildmat.tn', supplierAddress: 'Route de Bizerte, Ariana', supplierMatriculeFiscale: '4567890/A/B/C/000',
    title: 'Installation Materials', status: 'draft', orderDate: '2026-03-20',
    currency: 'TND', subTotal: 1300.00, discount: 10, discountType: 'percentage', taxAmount: 222.30, fiscalStamp: 1.000, grandTotal: 1393.30,
    paymentTerms: 'net30', paymentStatus: 'pending', tags: ['materials'],
    items: [
      { id: 'poi-4', purchaseOrderId: 'po-4', articleId: '4', articleName: 'Tube cuivre 1/4"', articleNumber: 'ART-004', supplierRef: 'BM-TCU-025', description: 'Copper tube 1/4"', quantity: 100, receivedQty: 0, unitPrice: 8.00, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 800.00, unit: 'meter', displayOrder: 0 },
      { id: 'poi-5', purchaseOrderId: 'po-4', articleId: '7', articleName: 'Support mural universel', articleNumber: 'ART-007', supplierRef: 'BM-SUP-UNI', description: 'Universal wall mount', quantity: 20, receivedQty: 0, unitPrice: 25.00, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 500.00, unit: 'piece', displayOrder: 1 },
    ],
    createdDate: '2026-03-20', createdBy: 'admin', createdByName: 'Admin User',
  },
  {
    id: 'po-5', orderNumber: 'PO-2026-0005', supplierId: '105', supplierName: 'GlobalSupply Co', supplierEmail: 'procurement@globalsupply.tn', supplierAddress: 'Lac 1, Tunis', supplierMatriculeFiscale: '5678901/A/B/C/000',
    title: 'Refrigerant Gas Annual Supply', status: 'validated', orderDate: '2026-04-01', expectedDelivery: '2026-04-22',
    currency: 'TND', subTotal: 1800.00, discount: 0, discountType: 'fixed', taxAmount: 342.00, fiscalStamp: 1.000, grandTotal: 2143.00,
    paymentTerms: 'immediate', paymentStatus: 'pending', tags: ['annual'],
    items: [
      { id: 'poi-6', purchaseOrderId: 'po-5', articleId: '6', articleName: 'Gaz réfrigérant R410A', articleNumber: 'ART-006', supplierRef: 'GS-R410A-10', description: 'R410A Refrigerant Gas 10kg', quantity: 10, receivedQty: 0, unitPrice: 180.00, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 1800.00, unit: 'piece', displayOrder: 0 },
    ],
    createdDate: '2026-04-01', createdBy: 'admin', createdByName: 'Admin User',
  },
  {
    id: 'po-6', orderNumber: 'PO-2026-0006', supplierId: '101', supplierName: 'TechParts SARL', supplierEmail: 'contact@techparts.tn', supplierAddress: 'Zone Industrielle, Tunis', supplierMatriculeFiscale: '1234567/A/B/C/000',
    title: 'Filters Restock', status: 'cancelled', orderDate: '2026-02-01',
    currency: 'TND', subTotal: 625.00, discount: 0, discountType: 'fixed', taxAmount: 118.75, fiscalStamp: 1.000, grandTotal: 744.75,
    paymentTerms: 'net30', paymentStatus: 'pending', tags: [],
    items: [
      { id: 'poi-7', purchaseOrderId: 'po-6', articleId: '2', articleName: 'Filtre à air standard', articleNumber: 'ART-002', supplierRef: 'TP-FLT-STD', description: 'Standard air filter', quantity: 50, receivedQty: 0, unitPrice: 12.50, taxRate: 19, discount: 0, discountType: 'percentage', lineTotal: 625.00, unit: 'piece', displayOrder: 0 },
    ],
    createdDate: '2026-02-01', createdBy: 'admin', createdByName: 'Admin User',
  },
];

// ─── Goods Receipts ───
export const mockGoodsReceipts: GoodsReceipt[] = [
  {
    id: 'gr-1', receiptNumber: 'GR-2026-0001', purchaseOrderId: 'po-1', purchaseOrderNumber: 'PO-2026-0001', supplierId: '101', supplierName: 'TechParts SARL',
    receiptDate: '2026-01-18', status: 'complete', deliveryNoteRef: 'BL-TP-20260118', receivedBy: 'admin', receivedByName: 'Admin User',
    items: [
      { id: 'gri-1', goodsReceiptId: 'gr-1', purchaseOrderItemId: 'poi-1', articleId: '1', articleName: 'Climatiseur Split 12000 BTU', articleNumber: 'ART-001', orderedQty: 5, quantityReceived: 5, quantityRejected: 0 },
    ],
    createdDate: '2026-01-18', createdBy: 'admin',
  },
  {
    id: 'gr-2', receiptNumber: 'GR-2026-0002', purchaseOrderId: 'po-3', purchaseOrderNumber: 'PO-2026-0003', supplierId: '103', supplierName: 'MechaSolutions',
    receiptDate: '2026-03-12', status: 'partial', deliveryNoteRef: 'BL-MS-20260312', receivedBy: 'admin', receivedByName: 'Admin User',
    items: [
      { id: 'gri-2', goodsReceiptId: 'gr-2', purchaseOrderItemId: 'poi-3', articleId: '3', articleName: 'Compresseur rotatif', articleNumber: 'ART-003', orderedQty: 4, quantityReceived: 2, quantityRejected: 0 },
    ],
    createdDate: '2026-03-12', createdBy: 'admin',
  },
];

// ─── Supplier Invoices ───
export const mockSupplierInvoices: SupplierInvoice[] = [
  {
    id: 'si-1', invoiceNumber: 'SINV-2026-0001', supplierInvoiceRef: 'FAC-TP-2026-0045', supplierId: '101', supplierName: 'TechParts SARL', supplierMatriculeFiscale: '1234567/A/B/C/000',
    purchaseOrderId: 'po-1', purchaseOrderNumber: 'PO-2026-0001', invoiceDate: '2026-01-20', dueDate: '2026-02-20', status: 'paid',
    currency: 'TND', subTotal: 4250.00, discount: 5, discountType: 'percentage', taxAmount: 769.13, fiscalStamp: 1.000, grandTotal: 4807.63, amountPaid: 4807.63, paymentMethod: 'bank_transfer', paymentDate: '2026-02-15',
    rsApplicable: true, rsTypeCode: '10', rsAmount: 403.75, rsRecordId: 'rs-1',
    factureEnLigneId: 'FEL-2026-001', factureEnLigneStatus: 'validated', factureEnLigneSentAt: '2026-01-20',
    tejSynced: true, tejSyncDate: '2026-01-25', tejSyncStatus: 'synced',
    items: [
      { id: 'sii-1', supplierInvoiceId: 'si-1', purchaseOrderItemId: 'poi-1', articleId: '1', articleName: 'Climatiseur Split 12000 BTU', description: 'Split AC 12K BTU', quantity: 5, unitPrice: 850.00, taxRate: 19, lineTotal: 4250.00, displayOrder: 0 },
    ],
    createdDate: '2026-01-20', createdBy: 'admin',
  },
  {
    id: 'si-2', invoiceNumber: 'SINV-2026-0002', supplierInvoiceRef: 'FAC-MS-2026-012', supplierId: '103', supplierName: 'MechaSolutions', supplierMatriculeFiscale: '3456789/A/B/C/000',
    purchaseOrderId: 'po-3', purchaseOrderNumber: 'PO-2026-0003', invoiceDate: '2026-03-14', dueDate: '2026-05-14', status: 'validated',
    currency: 'TND', subTotal: 640.00, discount: 0, discountType: 'fixed', taxAmount: 121.60, fiscalStamp: 1.000, grandTotal: 762.60, amountPaid: 0,
    rsApplicable: true, rsTypeCode: '10', rsAmount: 64.00,
    factureEnLigneStatus: 'pending', tejSynced: false, tejSyncStatus: 'pending',
    items: [
      { id: 'sii-2', supplierInvoiceId: 'si-2', articleId: '3', articleName: 'Compresseur rotatif', description: 'Rotary compressor (partial delivery)', quantity: 2, unitPrice: 320.00, taxRate: 19, lineTotal: 640.00, displayOrder: 0 },
    ],
    createdDate: '2026-03-14', createdBy: 'admin',
  },
  {
    id: 'si-3', invoiceNumber: 'SINV-2026-0003', supplierId: '104', supplierName: 'BuildMat SA', supplierMatriculeFiscale: '4567890/A/B/C/000',
    invoiceDate: '2026-03-25', dueDate: '2026-04-25', status: 'draft',
    currency: 'TND', subTotal: 500.00, discount: 0, discountType: 'fixed', taxAmount: 95.00, fiscalStamp: 1.000, grandTotal: 596.00, amountPaid: 0,
    rsApplicable: false, rsAmount: 0, tejSynced: false,
    items: [
      { id: 'sii-3', supplierInvoiceId: 'si-3', articleId: '7', articleName: 'Support mural universel', description: 'Wall mounts', quantity: 20, unitPrice: 25.00, taxRate: 19, lineTotal: 500.00, displayOrder: 0 },
    ],
    createdDate: '2026-03-25', createdBy: 'admin',
  },
];

// ─── Activities ───
export const mockPurchaseActivities: PurchaseActivity[] = [
  { id: 'pa-1', entityType: 'purchase_order', entityId: 'po-1', action: 'created', description: 'Purchase order PO-2026-0001 created', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-01-10T09:00:00Z' },
  { id: 'pa-2', entityType: 'purchase_order', entityId: 'po-1', action: 'status_changed', description: 'Status changed from draft to validated', oldValue: 'draft', newValue: 'validated', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-01-10T10:30:00Z' },
  { id: 'pa-3', entityType: 'purchase_order', entityId: 'po-1', action: 'sent', description: 'PO sent to supplier TechParts SARL', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-01-10T11:00:00Z' },
  { id: 'pa-4', entityType: 'goods_receipt', entityId: 'gr-1', action: 'created', description: 'Goods receipt GR-2026-0001 created for PO-2026-0001', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-01-18T14:00:00Z' },
  { id: 'pa-5', entityType: 'purchase_order', entityId: 'po-1', action: 'status_changed', description: 'Status changed to received', oldValue: 'ordered', newValue: 'received', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-01-18T14:30:00Z' },
  { id: 'pa-6', entityType: 'supplier_invoice', entityId: 'si-1', action: 'created', description: 'Invoice SINV-2026-0001 created', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-01-20T09:00:00Z' },
  { id: 'pa-7', entityType: 'supplier_invoice', entityId: 'si-1', action: 'paid', description: 'Invoice SINV-2026-0001 paid via bank transfer', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-02-15T10:00:00Z' },
  { id: 'pa-8', entityType: 'purchase_order', entityId: 'po-2', action: 'created', description: 'Purchase order PO-2026-0002 created', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-02-15T08:00:00Z' },
  { id: 'pa-9', entityType: 'purchase_order', entityId: 'po-3', action: 'created', description: 'Purchase order PO-2026-0003 created', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-03-01T09:00:00Z' },
  { id: 'pa-10', entityType: 'goods_receipt', entityId: 'gr-2', action: 'created', description: 'Partial receipt GR-2026-0002 for PO-2026-0003', performedBy: 'admin', performedByName: 'Admin User', performedAt: '2026-03-12T15:00:00Z' },
];

// ─── Stats ───
export const mockPurchaseStats: PurchaseStats = {
  totalOrders: 6,
  pendingReceipts: 2,
  openInvoices: 2,
  monthlySpend: 4807.63,
  totalSpendThisYear: 11684.88,
  avgLeadTime: 9,
  overdueInvoices: 0,
  rsTotal: 467.75,
};
