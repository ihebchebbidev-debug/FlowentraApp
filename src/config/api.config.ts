// API Configuration — keep baseURL identical to `API_URL` in ./api.ts (single source of truth).
import { API_URL } from './api';

export const API_CONFIG = {
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
};

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
  PROFILE: '/auth/profile',
  
  // Users
  USERS: '/users',
  USER_BY_ID: (id: string) => `/users/${id}`,
  
  // Contacts
  CONTACTS: '/contacts',
  CONTACT_BY_ID: (id: string) => `/contacts/${id}`,
  CONTACT_TAGS: '/contacttags', 
  CONTACT_NOTES: '/contactnotes',
  
  // Tasks
  TASKS: '/tasks',
  TASK_BY_ID: (id: string) => `/tasks/${id}`,
  
  // Projects
  PROJECTS: '/projects',
  PROJECT_BY_ID: (id: string) => `/projects/${id}`,
  
  // Lookups
  LOOKUPS: '/lookups',
  ARTICLE_CATEGORIES: '/lookups/article-categories',
  TASK_STATUSES: '/lookups/task-statuses',
  SERVICE_CATEGORIES: '/lookups/service-categories',
  PRIORITIES: '/lookups/priorities',
  TECHNICIAN_STATUSES: '/lookups/technician-statuses',
  LEAVE_TYPES: '/lookups/leave-types',
  PROJECT_STATUSES: '/lookups/project-statuses',
  PROJECT_TYPES: '/lookups/project-types', 
  OFFER_STATUSES: '/lookups/offer-statuses',
  SKILLS: '/lookups/skills',
  COUNTRIES: '/lookups/countries',
  CURRENCIES: '/lookups/currencies',
  
  // Articles
  ARTICLES: '/articles',
  
  // Newsletter
  NEWSLETTER_SUBSCRIBE: '/newsletter/subscribe',
  NEWSLETTER_UNSUBSCRIBE: '/newsletter/unsubscribe',
  NEWSLETTER_LISTS: '/newsletter/lists',
  NEWSLETTER_LIST_BY_ID: (id: string) => `/newsletter/lists/${id}`,
  NEWSLETTER_SUBSCRIBERS: '/newsletter/subscribers',
  NEWSLETTER_SUBSCRIBER_BY_ID: (id: string) => `/newsletter/subscribers/${id}`,
  NEWSLETTER_CAMPAIGNS: '/newsletter/campaigns',
  NEWSLETTER_CAMPAIGN_BY_ID: (id: string) => `/newsletter/campaigns/${id}`,
  
  // E-Commerce / Checkout
  CHECKOUT: '/checkout',
  CHECKOUT_SESSION: '/checkout/session',
  CHECKOUT_VALIDATE_COUPON: '/checkout/validate-coupon',
  CHECKOUT_CALCULATE_SHIPPING: '/checkout/calculate-shipping',
  CHECKOUT_CALCULATE_TAX: '/checkout/calculate-tax',
  ORDERS: '/orders',
  ORDER_BY_ID: (id: string) => `/orders/${id}`,
  ORDER_STATUS: (id: string) => `/orders/${id}/status`,
  
  // Products
  PRODUCTS: '/products',
  PRODUCT_BY_ID: (id: string) => `/products/${id}`,
  PRODUCT_CATEGORIES: '/products/categories',
  PRODUCT_SEARCH: '/products/search',
  PRODUCT_FILTERS: '/products/filters',

  // AI / GenerateWish (local Ollama LLM)
  GENERATE_WISH: '/api/GenerateWish',
  GENERATE_WISH_STREAM: '/api/GenerateWish/stream',

  // Dashboards
  DASHBOARDS: '/api/Dashboards',
  DASHBOARD_BY_ID: (id: number) => `/api/Dashboards/${id}`,
  DASHBOARD_DUPLICATE: (id: number) => `/api/Dashboards/${id}/duplicate`,
};