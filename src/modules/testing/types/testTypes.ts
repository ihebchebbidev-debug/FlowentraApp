/**
 * API Test Types & Interfaces
 */

export interface RequestData {
  method: string;
  url: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ResponseData {
  status: number;
  statusText: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface TestResult {
  id: string;
  name: string;
  category: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  details?: string;
  timestamp?: Date;
  httpStatus?: number;
  responseSize?: string;
  requestData?: RequestData;
  responseData?: ResponseData;
}

export interface TestCategory {
  name: string;
  tests: TestResult[];
  totalPassed: number;
  totalFailed: number;
  totalSkipped: number;
}

export interface TestResponse {
  success: boolean;
  details?: string;
  error?: string;
  httpStatus?: number;
  responseSize?: string;
  requestData?: RequestData;
  responseData?: ResponseData;
}

export type TestFunction = () => Promise<TestResponse>;

export interface TestDefinition {
  id: string;
  name: string;
  category: string;
  description?: string;
  test: TestFunction;
  cleanup?: () => Promise<void>;
  dependsOn?: string[];
}
