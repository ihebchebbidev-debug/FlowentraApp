// Retenue à la Source (RS) API Service - Connects to .NET backend
import { API_CONFIG } from '@/config/api.config';
import { getAuthHeaders , getMutationHeaders, getMutationHeadersNoContentType} from '@/utils/apiHeaders';

const BASE_URL = `${API_CONFIG.baseURL}/api/retenue-source`;

// ─── Types ───

export interface RSRecordDto {
  id: number;
  entityType: string;
  entityId: number;
  entityNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  paymentDate: string;
  amountPaid: number;
  rsAmount: number;
  rsTypeCode: string;
  supplierName: string;
  supplierTaxId: string;
  supplierAddress?: string;
  payerName: string;
  payerTaxId: string;
  payerAddress?: string;
  status: string;
  tejExported: boolean;
  tejFileName?: string;
  notes?: string;
  createdAt: string;
  createdBy: string;
  modifiedAt?: string;
  modifiedBy?: string;
  // 🔴 CRITICAL Compliance Fields
  declarationDeadline?: string;
  isOverdue?: boolean;
  daysLate?: number;
  penaltyAmount?: number;
  // 🟡 MEDIUM Classification Fields
  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string;
  // 🟢 TRACKING Fields
  tejAcceptanceNumber?: string;
  tejTransmissionStatus?: 'pending' | 'accepted' | 'rejected';
}

export interface CreateRSRecordDto {
  entityType: string;
  entityId: number;
  entityNumber?: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceAmount: number;
  paymentDate: string;
  amountPaid: number;
  rsTypeCode: string;
  supplierName: string;
  supplierTaxId: string;
  supplierAddress?: string;
  payerName: string;
  payerTaxId: string;
  payerAddress?: string;
  notes?: string;
  // 🟡 MEDIUM Classification Fields
  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string;
}

export interface UpdateRSRecordDto {
  invoiceNumber?: string;
  invoiceDate?: string;
  invoiceAmount?: number;
  paymentDate?: string;
  amountPaid?: number;
  rsTypeCode?: string;
  supplierName?: string;
  supplierTaxId?: string;
  supplierAddress?: string;
  payerName?: string;
  payerTaxId?: string;
  payerAddress?: string;
  notes?: string;
  status?: string;
  // 🟡 MEDIUM Classification Fields (updateable)
  supplierType?: 'individual' | 'company' | 'non_resident';
  isExemptByTreaty?: boolean;
  treatyCode?: string;
}

export interface TEJExportRequestDto {
  month: number;
  year: number;
  /** Scope the export to one document (e.g. 'supplier_invoice') instead of the whole period. */
  entityType?: string;
  entityId?: number;
  declarant?: {
    name: string;
    taxId: string;
    address: string;
  };
}

export interface TEJExportResponseDto {
  logId: number;
  fileName: string;
  recordCount: number;
  totalRSAmount: number;
  status: string;
  errorMessage?: string;
  documentId?: number;
}

export interface TEJExportLogDto {
  id: number;
  fileName: string;
  exportDate: string;
  exportedBy: string;
  month: number;
  year: number;
  recordCount: number;
  totalRSAmount: number;
  status: string;
  errorMessage?: string;
  documentId?: number;
}

export interface RSCalculationDto {
  amountPaid: number;
  rsTypeCode: string;
  rsRate: number;
  rsAmount: number;
  netPayment: number;
}

export interface RSStatsDto {
  totalRecords: number;
  pendingRecords: number;
  exportedRecords: number;
  totalRSAmount: number;
  totalAmountPaid: number;
}

interface PaginatedResponse {
  records: RSRecordDto[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ─── API Functions ───

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const err = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(err.error?.message || `HTTP ${response.status}`);
  }
  const json = await response.json();
  return json.data ?? json;
}

export async function fetchRSRecords(params?: {
  entityType?: string;
  entityId?: number;
  month?: number;
  year?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse> {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.set('entity_type', params.entityType);
  if (params?.entityId) qs.set('entity_id', String(params.entityId));
  if (params?.month) qs.set('month', String(params.month));
  if (params?.year) qs.set('year', String(params.year));
  if (params?.status) qs.set('status', params.status);
  if (params?.search) qs.set('search', params.search);
  if (params?.page) qs.set('page', String(params.page));
  if (params?.limit) qs.set('limit', String(params.limit));

  const res = await fetch(`${BASE_URL}?${qs}`, { headers: getAuthHeaders() });
  return handleResponse<PaginatedResponse>(res);
}

export async function fetchRSRecordById(id: number): Promise<RSRecordDto> {
  const res = await fetch(`${BASE_URL}/${id}`, { headers: getAuthHeaders() });
  return handleResponse<RSRecordDto>(res);
}

export async function createRSRecord(dto: CreateRSRecordDto): Promise<RSRecordDto> {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: getMutationHeaders(),
    body: JSON.stringify(dto),
  });
  return handleResponse<RSRecordDto>(res);
}

export async function updateRSRecord(id: number, dto: UpdateRSRecordDto): Promise<RSRecordDto> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PATCH',
    headers: getMutationHeaders(),
    body: JSON.stringify(dto),
  });
  return handleResponse<RSRecordDto>(res);
}

export async function deleteRSRecord(id: number): Promise<void> {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getMutationHeaders(),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
}

export async function calculateRS(amountPaid: number, rsTypeCode: string): Promise<RSCalculationDto> {
  const qs = new URLSearchParams({ amount_paid: String(amountPaid), rs_type_code: rsTypeCode });
  const res = await fetch(`${BASE_URL}/calculate?${qs}`, { headers: getAuthHeaders() });
  return handleResponse<RSCalculationDto>(res);
}

export async function exportTEJ(request: TEJExportRequestDto): Promise<TEJExportResponseDto> {
  const res = await fetch(`${BASE_URL}/tej-export`, {
    method: 'POST',
    headers: getMutationHeaders(),
    body: JSON.stringify(request),
  });
  return handleResponse<TEJExportResponseDto>(res);
}

export async function fetchTEJExportLogs(year?: number): Promise<TEJExportLogDto[]> {
  const qs = year ? `?year=${year}` : '';
  const res = await fetch(`${BASE_URL}/tej-logs${qs}`, { headers: getAuthHeaders() });
  return handleResponse<TEJExportLogDto[]>(res);
}

export async function fetchRSStats(params?: {
  entityType?: string;
  entityId?: number;
  month?: number;
  year?: number;
}): Promise<RSStatsDto> {
  const qs = new URLSearchParams();
  if (params?.entityType) qs.set('entity_type', params.entityType);
  if (params?.entityId) qs.set('entity_id', String(params.entityId));
  if (params?.month) qs.set('month', String(params.month));
  if (params?.year) qs.set('year', String(params.year));

  const res = await fetch(`${BASE_URL}/stats?${qs}`, { headers: getAuthHeaders() });
  return handleResponse<RSStatsDto>(res);
}
