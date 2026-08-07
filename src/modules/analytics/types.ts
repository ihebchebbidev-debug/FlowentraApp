// Database Tables/Entities for Analytics Module
export interface AnalyticsEvent {
  id: string;
  eventName: string;
  userId?: string;
  sessionId: string;
  properties: Record<string, any>;
  timestamp: Date;
  source: string;
  page: string;
  userAgent: string;
  ipAddress: string;
}

export interface AnalyticsSession {
  id: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  pageViews: number;
  events: number;
  source: string;
  referrer?: string;
  device: string;
  browser: string;
  os: string;
  country?: string;
}

export interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  date: Date;
  period: 'hour' | 'day' | 'week' | 'month' | 'year';
  dimensions: Record<string, string>;
  createdAt: Date;
}

export interface MetricData {
  label: string;
  value: number;
  change?: number;
  trend?: 'up' | 'down' | 'stable';
}
