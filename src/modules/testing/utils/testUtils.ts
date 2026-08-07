/**
 * API Test Utilities - Shared helpers for all test modules
 */

import { RequestData, ResponseData } from '../types/testTypes';
import { addTestDataRecord } from '../stores/testDataStore';

import { API_URL } from '@/config/api';
export { API_URL };

// Map URL patterns to table names
const getTableFromUrl = (url: string): string | null => {
  const patterns: Record<string, string> = {
    '/api/users': 'Users',
    '/api/roles': 'Roles',
    '/api/skills': 'Skills',
    '/api/contacts': 'Contacts',
    '/api/contact-tags': 'ContactTags',
    '/api/contact-notes': 'ContactNotes',
    '/api/articles': 'Articles',
    '/api/projects': 'Projects',
    '/api/tasks': 'Tasks',
    '/api/task-comments': 'TaskComments',
    '/api/installations': 'Installations',
    '/api/offers': 'Offers',
    '/api/sales': 'Sales',
    '/api/service-orders': 'ServiceOrders',
    '/api/dispatches': 'Dispatches',
    '/api/lookups': 'Lookups',
    '/api/preferences': 'Preferences',
  };
  
  const lowerUrl = url.toLowerCase();
  for (const [pattern, table] of Object.entries(patterns)) {
    if (lowerUrl.includes(pattern.toLowerCase())) {
      return table;
    }
  }
  return null;
};

// Determine operation type from HTTP method
const getOperationType = (method: string): 'create' | 'update' | 'delete' | null => {
  const upperMethod = method.toUpperCase();
  if (upperMethod === 'POST') return 'create';
  if (upperMethod === 'PUT' || upperMethod === 'PATCH') return 'update';
  if (upperMethod === 'DELETE') return 'delete';
  return null;
};

// Extract record ID from response data - handles nested structures
const extractRecordId = (data: any, url: string): string | number => {
  if (!data) return 'unknown';
  
  // Handle different response structures
  let record = data;
  
  // Check nested data property
  if (data.data && typeof data.data === 'object' && !Array.isArray(data.data)) {
    record = data.data;
  }
  
  // Try common ID fields
  const id = record.id || record.Id || record.ID || record.userId || record.contactId || record.articleId;
  if (id !== undefined && id !== null) return id;
  
  // For delete operations, try to extract ID from URL
  const urlMatch = url.match(/\/(\d+)(?:\?|$)/);
  if (urlMatch) return parseInt(urlMatch[1], 10);
  
  return 'unknown';
};

// Extract the actual record data from response - handles various structures
const extractRecordData = (data: any): Record<string, any> => {
  if (!data) return {};
  
  // Handle nested response structures: { data: { ... } } or { success: true, data: { ... } }
  let record = data;
  
  if (data.data && typeof data.data === 'object') {
    // If data.data is an array, skip (list responses)
    if (Array.isArray(data.data)) return {};
    record = data.data;
  }
  
  // If it's an array, skip tracking (list responses shouldn't be tracked as single records)
  if (Array.isArray(record)) return {};
  
  // Return the record if it's a valid object
  if (typeof record === 'object' && record !== null) {
    // Filter out very large nested objects to keep data clean
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          cleaned[key] = `[${value.length} items]`;
        } else {
          // Keep small objects, summarize large ones
          const objSize = JSON.stringify(value).length;
          if (objSize < 200) {
            cleaned[key] = value;
          } else {
            cleaned[key] = '{...}';
          }
        }
      } else {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  
  return { value: record };
};

// Test data storage for cleanup (shared across all test modules)
export const testDataIds: Record<string, number | string> = {};

// Test session credentials (generated for each test run)
export const testSessionCredentials = {
  email: '',
  password: '',
  token: '',
  userId: 0,
};

// Reset test session
export const resetTestSession = () => {
  testSessionCredentials.email = '';
  testSessionCredentials.password = '';
  testSessionCredentials.token = '';
  testSessionCredentials.userId = 0;
};

// Generate unique test credentials for this test session
export const generateTestCredentials = () => {
  const randomId = Math.random().toString(36).substring(2, 10);
  const timestamp = Date.now();
  testSessionCredentials.email = `apitest_${randomId}_${timestamp}@test.flowservice.com`;
  testSessionCredentials.password = `TestPass${randomId}!@#${timestamp}`;
  return testSessionCredentials;
};

// Helper to get auth headers - uses test session token first, then localStorage
export const getAuthHeaders = (): Record<string, string> => {
  const token = testSessionCredentials.token || localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Helper for API calls with detailed request/response tracking
export const apiCall = async <T>(
  url: string,
  options: RequestInit = {}
): Promise<{ 
  data: T | null; 
  status: number; 
  error?: string; 
  responseSize: string;
  requestData: RequestData;
  responseData: ResponseData;
}> => {
  const fullUrl = `${API_URL}${url}`;
  const headers = { ...getAuthHeaders(), ...(options.headers as Record<string, string> || {}) };
  
  // Build request data for debugging
  let requestBody: any = undefined;
  if (options.body && typeof options.body === 'string') {
    try {
      requestBody = JSON.parse(options.body);
    } catch {
      requestBody = options.body;
    }
  }
  
  const requestData: RequestData = {
    method: options.method || 'GET',
    url: fullUrl,
    headers,
    body: requestBody,
  };
  
  try {
    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });
    
    const text = await response.text();
    const responseSize = `${(new Blob([text]).size / 1024).toFixed(2)} KB`;
    
    let parsedBody: any = text;
    let data: T | null = null;
    
    if (text) {
      try {
        data = JSON.parse(text);
        parsedBody = data;
      } catch {
        data = null;
      }
    }
    
    const responseData: ResponseData = {
      status: response.status,
      statusText: response.statusText,
      body: parsedBody,
    };
    
    if (!response.ok) {
      const errorMessage = typeof parsedBody === 'object' && parsedBody !== null 
        ? parsedBody.message || parsedBody.error || response.statusText
        : response.statusText;
      return { data: null, status: response.status, error: errorMessage, responseSize, requestData, responseData };
    }
    
    // Track data changes for successful mutating operations (POST, PUT, PATCH, DELETE)
    const method = (options.method || 'GET').toUpperCase();
    if (method !== 'GET' && response.ok) {
      const table = getTableFromUrl(url);
      const operation = getOperationType(method);
      
      if (table && operation) {
        const recordId = extractRecordId(data, url);
        const recordData = extractRecordData(data);
        
        // Only track if we have meaningful data (not empty objects or arrays)
        if (Object.keys(recordData).length > 0 || operation === 'delete') {
          addTestDataRecord({
            id: recordId,
            table,
            operation,
            data: operation === 'delete' ? { id: recordId, deleted: true } : recordData,
          });
        }
      }
    }
    
    return { data, status: response.status, responseSize, requestData, responseData };
  } catch (error) {
    const responseData: ResponseData = {
      status: 0,
      statusText: 'Network Error',
      body: { error: String(error) },
    };
    return { 
      data: null, 
      status: 0, 
      error: String(error), 
      responseSize: '0 KB',
      requestData,
      responseData
    };
  }
};

// Helper to generate random ID
export const randomId = (length = 6) => Math.random().toString(36).substring(2, 2 + length);

// Helper to format date
export const formatDate = (date: Date) => {
  return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
};
