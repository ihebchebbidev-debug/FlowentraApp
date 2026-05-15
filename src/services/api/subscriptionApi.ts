/**
 * Subscription API Service — uses real endpoints by default.
 * Set `VITE_SUBSCRIPTION_USE_MOCK=true` to use local mock data (dev/demo only).
 */
import { apiFetch } from './apiClient';

// ─── Types ───

export type PlanKey = 'free' | 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
export type BillingInterval = 'monthly' | 'yearly';
export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'void';

export interface SubscriptionPlan {
  id: number;
  planKey: PlanKey;
  name: string;
  description: string;
  monthlyPricePerSeat: number;
  yearlyPricePerSeat: number;
  currency: string;
  maxSeats: number | null;
  creditsPerPeriod: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
}

export interface Subscription {
  id: number;
  tenantId: number;
  planKey: PlanKey;
  status: SubscriptionStatus;
  interval: BillingInterval;
  pricePerSeat: number;
  currency: string;
  seats: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEnd: string | null;
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionUsage {
  id: number;
  subscriptionId: number;
  usageType: string;
  usedAmount: number;
  grantedAmount: number;
  rolloverAmount: number;
  periodStart: string;
  periodEnd: string;
}

export interface BillingInvoice {
  id: number;
  subscriptionId: number;
  stripeInvoiceId: string | null;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  invoiceDate: string;
  paidAt: string | null;
  pdfUrl: string | null;
  description: string;
}

/** When true, subscription screens use embedded mock data (no network). */
const USE_MOCK = import.meta.env.VITE_SUBSCRIPTION_USE_MOCK === 'true';

const MOCK_PLANS: SubscriptionPlan[] = [
  {
    id: 1, planKey: 'free', name: 'Free', description: 'Basic features for small teams',
    monthlyPricePerSeat: 0, yearlyPricePerSeat: 0, currency: 'TND',
    maxSeats: 3, creditsPerPeriod: 100, isActive: true, sortOrder: 0,
    features: ['3 users', '100 credits/month', 'Basic CRM', 'Email support'],
  },
  {
    id: 2, planKey: 'starter', name: 'Starter', description: 'Growing teams with more power',
    monthlyPricePerSeat: 35, yearlyPricePerSeat: 27, currency: 'TND',
    maxSeats: 10, creditsPerPeriod: 1000, isActive: true, sortOrder: 1,
    features: ['10 users', '1,000 credits/month', 'Full CRM', 'Workflows', 'Priority support'],
  },
  {
    id: 3, planKey: 'pro', name: 'Pro', description: 'Advanced features for scaling businesses',
    monthlyPricePerSeat: 89, yearlyPricePerSeat: 72, currency: 'TND',
    maxSeats: 50, creditsPerPeriod: 10000, isActive: true, sortOrder: 2,
    features: ['50 users', '10,000 credits/month', 'AI assistant', 'Custom forms', 'Advanced analytics'],
  },
  {
    id: 4, planKey: 'enterprise', name: 'Enterprise', description: 'Unlimited power for large organizations',
    monthlyPricePerSeat: 179, yearlyPricePerSeat: 149, currency: 'TND',
    maxSeats: null, creditsPerPeriod: 100000, isActive: true, sortOrder: 3,
    features: ['Unlimited users', '100,000 credits/month', 'Dedicated support', 'Custom integrations', 'SSO', 'SLA guarantee'],
  },
];

const MOCK_SUBSCRIPTION: Subscription = {
  id: 1, tenantId: 1, planKey: 'pro', status: 'active', interval: 'monthly',
  pricePerSeat: 89, currency: 'TND', seats: 5,
  currentPeriodStart: '2026-02-01T00:00:00Z',
  currentPeriodEnd: '2026-03-01T00:00:00Z',
  trialEnd: null,
  stripeSubscriptionId: 'sub_mock_123',
  stripeCustomerId: 'cus_mock_456',
  createdAt: '2025-06-15T10:00:00Z',
  updatedAt: '2026-02-01T00:00:00Z',
};

const MOCK_USAGE: SubscriptionUsage[] = [
  {
    id: 1, subscriptionId: 1, usageType: 'workflow_credits',
    usedAmount: 3420, grantedAmount: 10000, rolloverAmount: 500,
    periodStart: '2026-02-01T00:00:00Z', periodEnd: '2026-03-01T00:00:00Z',
  },
];

const MOCK_INVOICES: BillingInvoice[] = [
  { id: 1, subscriptionId: 1, stripeInvoiceId: 'inv_001', amount: 445, currency: 'TND', status: 'paid', invoiceDate: '2026-02-01T00:00:00Z', paidAt: '2026-02-01T08:30:00Z', pdfUrl: null, description: 'Pro Plan - 5 seats - February 2026' },
  { id: 2, subscriptionId: 1, stripeInvoiceId: 'inv_002', amount: 445, currency: 'TND', status: 'paid', invoiceDate: '2026-01-01T00:00:00Z', paidAt: '2026-01-01T09:00:00Z', pdfUrl: null, description: 'Pro Plan - 5 seats - January 2026' },
  { id: 3, subscriptionId: 1, stripeInvoiceId: 'inv_003', amount: 445, currency: 'TND', status: 'paid', invoiceDate: '2025-12-01T00:00:00Z', paidAt: '2025-12-01T10:00:00Z', pdfUrl: null, description: 'Pro Plan - 5 seats - December 2025' },
  { id: 4, subscriptionId: 1, stripeInvoiceId: 'inv_004', amount: 356, currency: 'TND', status: 'paid', invoiceDate: '2025-11-01T00:00:00Z', paidAt: '2025-11-01T07:45:00Z', pdfUrl: null, description: 'Pro Plan - 4 seats - November 2025' },
];

const mockDelay = <T>(data: T, ms = 400): Promise<{ data: T }> =>
  new Promise(resolve => setTimeout(() => resolve({ data }), ms));

function unwrapList<T>(raw: unknown): T[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw as T[];
  const o = raw as Record<string, unknown>;
  const inner = o.data ?? o.items ?? o.plans ?? o.invoices;
  if (Array.isArray(inner)) return inner as T[];
  return [];
}

const BASE = '/api/subscriptions';

export const subscriptionApi = {
  getPlans: async (): Promise<{ data: SubscriptionPlan[] }> => {
    if (USE_MOCK) return mockDelay(MOCK_PLANS);
    const r = await apiFetch<unknown>(`${BASE}/plans`);
    return { data: unwrapList<SubscriptionPlan>(r.data) };
  },

  getCurrentSubscription: async (): Promise<{ data: Subscription | null }> => {
    if (USE_MOCK) return mockDelay(MOCK_SUBSCRIPTION);
    const r = await apiFetch<Subscription>(`${BASE}/current`);
    return { data: r.data ?? null };
  },

  getUsage: async (): Promise<{ data: SubscriptionUsage[] }> => {
    if (USE_MOCK) return mockDelay(MOCK_USAGE);
    const r = await apiFetch<unknown>(`${BASE}/usage`);
    return { data: unwrapList<SubscriptionUsage>(r.data) };
  },

  getInvoices: async (): Promise<{ data: BillingInvoice[] }> => {
    if (USE_MOCK) return mockDelay(MOCK_INVOICES);
    const r = await apiFetch<unknown>(`${BASE}/invoices`);
    return { data: unwrapList<BillingInvoice>(r.data) };
  },

  switchPlan: async (planKey: PlanKey): Promise<{ data: Subscription }> => {
    if (USE_MOCK) return mockDelay({ ...MOCK_SUBSCRIPTION, planKey });
    const r = await apiFetch<Subscription>(`${BASE}/switch-plan`, {
      method: 'POST',
      body: JSON.stringify({ planKey }),
    });
    if (!r.data) throw new Error(r.error || 'Failed to switch plan');
    return { data: r.data };
  },

  switchInterval: async (interval: BillingInterval): Promise<{ data: Subscription }> => {
    if (USE_MOCK) return mockDelay({ ...MOCK_SUBSCRIPTION, interval });
    const r = await apiFetch<Subscription>(`${BASE}/switch-interval`, {
      method: 'POST',
      body: JSON.stringify({ interval }),
    });
    if (!r.data) throw new Error(r.error || 'Failed to switch billing interval');
    return { data: r.data };
  },

  cancel: async (): Promise<{ data: { success: boolean } }> => {
    if (USE_MOCK) return mockDelay({ success: true });
    const r = await apiFetch<{ success: boolean }>(`${BASE}/cancel`, { method: 'POST' });
    return { data: r.data ?? { success: false } };
  },

  getBillingPortalUrl: async (): Promise<{ data: { url: string } }> => {
    if (USE_MOCK) return mockDelay({ url: '#billing-portal' });
    const r = await apiFetch<{ url: string }>(`${BASE}/billing-portal`);
    return { data: r.data ?? { url: '' } };
  },
};
