/**
 * Test Data Store
 * Tracks all test data created/updated during test runs
 */

// Define TestDataRecord here to avoid circular imports
export interface TestDataRecord {
  id: string | number;
  table: string;
  operation: 'create' | 'update' | 'delete';
  data: Record<string, any>;
  timestamp: Date;
  testId?: string;
}

// Global store for test data records
let testDataRecords: TestDataRecord[] = [];
let autoCleanupEnabled = true;

// Listeners for state changes
type Listener = () => void;
const listeners = new Set<Listener>();

const notify = () => {
  listeners.forEach(listener => listener());
};

// Subscribe to store changes
export const subscribeToTestData = (listener: Listener): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

// Get all test data records
export const getTestDataRecords = (): TestDataRecord[] => [...testDataRecords];

// Add a test data record
export const addTestDataRecord = (record: Omit<TestDataRecord, 'timestamp'>): void => {
  testDataRecords.push({
    ...record,
    timestamp: new Date(),
  });
  notify();
};

// Add multiple test data records
export const addTestDataRecords = (records: Omit<TestDataRecord, 'timestamp'>[]): void => {
  records.forEach(record => {
    testDataRecords.push({
      ...record,
      timestamp: new Date(),
    });
  });
  notify();
};

// Clear all test data records (for new test run)
export const clearTestDataRecords = (): void => {
  testDataRecords = [];
  notify();
};

// Get auto-cleanup setting
export const getAutoCleanup = (): boolean => {
  const stored = localStorage.getItem('test_auto_cleanup');
  if (stored !== null) {
    return stored === 'true';
  }
  return autoCleanupEnabled;
};

// Set auto-cleanup setting
export const setAutoCleanup = (enabled: boolean): void => {
  autoCleanupEnabled = enabled;
  localStorage.setItem('test_auto_cleanup', String(enabled));
  notify();
};

// Parse response data and extract records for tracking
export const extractRecordFromResponse = (
  table: string,
  operation: 'create' | 'update' | 'delete',
  responseData: any,
  testId?: string
): TestDataRecord | null => {
  if (!responseData) return null;
  
  // Handle various response structures
  const data = responseData.body || responseData.data || responseData;
  
  if (!data || typeof data !== 'object') return null;
  
  // Extract ID from various possible locations
  const id = data.id || data.Id || data.data?.id || data.data?.Id || 'unknown';
  
  return {
    id,
    table,
    operation,
    data: data.data || data,
    timestamp: new Date(),
    testId,
  };
};

// Helper to determine table name from test category
export const getCategoryTableName = (category: string): string => {
  const mapping: Record<string, string> = {
    'Users': 'Users',
    'Roles': 'Roles',
    'Skills': 'Skills',
    'Contacts': 'Contacts',
    'Contact Tags': 'ContactTags',
    'Contact Notes': 'ContactNotes',
    'Articles': 'Articles',
    'Projects': 'Projects',
    'Tasks': 'Tasks',
    'Task Comments': 'TaskComments',
    'Installations': 'Installations',
    'Offers': 'Offers',
    'Sales': 'Sales',
    'Service Orders': 'ServiceOrders',
    'Service Order Full Info': 'ServiceOrders',
    'Dispatches': 'Dispatches',
    'Lookups': 'Lookups',
    'Preferences': 'Preferences',
    'Uploads': 'Files',
  };
  return mapping[category] || category;
};

// Export summary of data by table
export const getDataSummary = (): Record<string, { created: number; updated: number; deleted: number }> => {
  const summary: Record<string, { created: number; updated: number; deleted: number }> = {};
  
  testDataRecords.forEach(record => {
    if (!summary[record.table]) {
      summary[record.table] = { created: 0, updated: 0, deleted: 0 };
    }
    summary[record.table][record.operation]++;
  });
  
  return summary;
};
