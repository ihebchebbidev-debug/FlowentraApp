// Retenue à la Source (RS) Calculation Service
import { RS_TRANSACTION_TYPES, RSTypeCode, type RSRecord, type CreateRSRecordData } from '../types/retenue-source';

/**
 * Calculate the RS (withholding tax) amount
 * RS is applied at payment time, not invoice creation
 */
export function calculateRSAmount(amountPaid: number, rsTypeCode: RSTypeCode): number {
  const txType = RS_TRANSACTION_TYPES.find(t => t.code === rsTypeCode);
  if (!txType) throw new Error(`Unknown RS type code: ${rsTypeCode}`);
  
  const rsAmount = amountPaid * (txType.rate / 100);
  // Round to 2 decimal places per Tunisian tax rules
  return Math.round(rsAmount * 100) / 100;
}

/**
 * Calculate net payment after RS deduction
 */
export function calculateNetPayment(amountPaid: number, rsAmount: number): number {
  return Math.round((amountPaid - rsAmount) * 100) / 100;
}

/**
 * Get RS rate for a transaction type
 */
export function getRSRate(rsTypeCode: RSTypeCode): number {
  const txType = RS_TRANSACTION_TYPES.find(t => t.code === rsTypeCode);
  return txType?.rate ?? 0;
}

/**
 * Validate RS record data before creation
 */
export function validateRSRecord(data: CreateRSRecordData): string[] {
  const errors: string[] = [];

  if (!data.invoiceNumber?.trim()) errors.push('Invoice number is required');
  if (!data.invoiceDate) errors.push('Invoice date is required');
  if (!data.paymentDate) errors.push('Payment date is required');
  if (!data.supplierTaxId?.trim()) errors.push('Supplier Tax ID (Matricule Fiscal) is required');
  if (!data.supplierName?.trim()) errors.push('Supplier name is required');
  if (!data.payerTaxId?.trim()) errors.push('Payer Tax ID is required');
  if (!data.payerName?.trim()) errors.push('Payer name is required');

  if (data.invoiceAmount <= 0) errors.push('Invoice amount must be positive');
  if (data.amountPaid <= 0) errors.push('Amount paid must be positive');
  
  const rsAmount = calculateRSAmount(data.amountPaid, data.rsTypeCode);
  if (rsAmount > data.invoiceAmount) errors.push('RS amount cannot exceed invoice amount');
  if (rsAmount < 0) errors.push('RS amount cannot be negative');

  // Validate date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (data.invoiceDate && !dateRegex.test(data.invoiceDate)) errors.push('Invoice date must be YYYY-MM-DD');
  if (data.paymentDate && !dateRegex.test(data.paymentDate)) errors.push('Payment date must be YYYY-MM-DD');

  return errors;
}

// ==========================================
// Local Storage-based RS Record Management
// (Will be replaced with backend API later)
// ==========================================

const RS_STORAGE_KEY = 'flowservice_rs_records';
const TEJ_LOG_KEY = 'flowservice_tej_logs';

function getStoredRecords(): RSRecord[] {
  try {
    const stored = localStorage.getItem(RS_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveRecords(records: RSRecord[]) {
  localStorage.setItem(RS_STORAGE_KEY, JSON.stringify(records));
}

export function getAllRSRecords(entityType?: 'offer' | 'sale', entityId?: string): RSRecord[] {
  let records = getStoredRecords();
  if (entityType) records = records.filter(r => r.entityType === entityType);
  if (entityId) records = records.filter(r => r.entityId === entityId);
  return records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getRSRecordsByMonth(year: number, month: number): RSRecord[] {
  return getStoredRecords().filter(r => {
    const d = new Date(r.paymentDate);
    return d.getFullYear() === year && (d.getMonth() + 1) === month;
  });
}

export function createRSRecord(data: CreateRSRecordData): RSRecord {
  const errors = validateRSRecord(data);
  if (errors.length > 0) throw new Error(errors.join('; '));

  const rsAmount = calculateRSAmount(data.amountPaid, data.rsTypeCode);

  // Check for duplicates
  const existing = getStoredRecords();
  const duplicate = existing.find(
    r => r.invoiceNumber === data.invoiceNumber && r.paymentDate === data.paymentDate && r.entityId === data.entityId
  );
  if (duplicate) throw new Error('Duplicate RS entry for this invoice and payment date');

  const record: RSRecord = {
    id: `RS-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    ...data,
    rsAmount,
    status: 'pending',
    tejExported: false,
    createdAt: new Date().toISOString(),
    createdBy: 'current-user',
  };

  existing.push(record);
  saveRecords(existing);
  return record;
}

export function updateRSRecord(id: string, updates: Partial<RSRecord>): RSRecord {
  const records = getStoredRecords();
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) throw new Error('RS record not found');

  records[idx] = {
    ...records[idx],
    ...updates,
    modifiedAt: new Date().toISOString(),
    modifiedBy: 'current-user',
  };
  saveRecords(records);
  return records[idx];
}

export function deleteRSRecord(id: string): void {
  const records = getStoredRecords();
  const filtered = records.filter(r => r.id !== id);
  if (filtered.length === records.length) throw new Error('RS record not found');
  saveRecords(filtered);
}

// TEJ Export logs
export function getTEJExportLogs(): any[] {
  try {
    const stored = localStorage.getItem(TEJ_LOG_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveTEJExportLog(log: any): void {
  const logs = getTEJExportLogs();
  logs.unshift(log);
  localStorage.setItem(TEJ_LOG_KEY, JSON.stringify(logs));
}
