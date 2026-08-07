import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Import default data from JSON files
import defaultTaskStatusesData from '@/data/mock/taskStatuses.json';
import defaultEventTypesData from '@/data/mock/eventTypes.json';
import defaultServiceCategoriesData from '@/data/mock/serviceCategories.json';
import defaultCurrenciesData from '@/data/mock/currencies.json';
import defaultPrioritiesData from '@/data/mock/priorities.json';
import defaultOfferCategoriesData from '@/data/mock/offer-categories.json';
import defaultOfferSourcesData from '@/data/mock/offer-sources.json';

// Use types from API
import type { LookupItem } from '@/services/lookupsApi';
export type { LookupItem } from '@/services/lookupsApi';

interface LookupsContextType {
  taskStatuses: LookupItem[];
  eventTypes: LookupItem[];
  serviceCategories: LookupItem[];
  articleCategories: LookupItem[];
  locations: LookupItem[];
  currencies: LookupItem[];
  priorities: LookupItem[];
  offerCategories: LookupItem[];
  offerSources: LookupItem[];
  documentTypes: LookupItem[];
  setDefaultCurrency: (id: string) => void;
  updateTaskStatuses: (statuses: LookupItem[]) => void;
  updateEventTypes: (types: LookupItem[]) => void;
  updateServiceCategories: (categories: LookupItem[]) => void;
  updateArticleCategories: (categories: LookupItem[]) => void;
  updateLocations: (locations: LookupItem[]) => void;
  updatePriorities: (list: LookupItem[]) => void;
  updateOfferCategories: (categories: LookupItem[]) => void;
  updateOfferSources: (sources: LookupItem[]) => void;
  updateDocumentTypes: (types: LookupItem[]) => void;
  getPriorityById: (id: string) => LookupItem | undefined;
  getTaskStatusById: (id: string) => LookupItem | undefined;
  getEventTypeById: (id: string) => LookupItem | undefined;
  getServiceCategoryById: (id: string) => LookupItem | undefined;
  getArticleCategoryById: (id: number) => LookupItem | undefined;
  getLocationById: (id: number) => LookupItem | undefined;
  getOfferCategoryById: (id: string) => LookupItem | undefined;
  getOfferSourceById: (id: string) => LookupItem | undefined;
  getDocumentTypeById: (id: string) => LookupItem | undefined;
  // Get default (favorite) items
  getDefaultOfferCategory: () => LookupItem | undefined;
  getDefaultOfferSource: () => LookupItem | undefined;
  getDefaultPriority: () => LookupItem | undefined;
  getDefaultTaskStatus: () => LookupItem | undefined;
  getDefaultEventType: () => LookupItem | undefined;
  getDefaultServiceCategory: () => LookupItem | undefined;
  refreshLookups: () => Promise<void>;
}

// Convert JSON data to LookupItem format
const defaultTaskStatuses: LookupItem[] = defaultTaskStatusesData.map(item => ({
  id: item.id,
  name: item.name,
  color: item.color,
  description: item.description,
  sortOrder: item.position,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  isActive: true, // Default to active
}));

const defaultEventTypes: LookupItem[] = defaultEventTypesData.map(item => ({
  id: item.id,
  name: item.name,
  color: item.color,
  description: item.description,
  sortOrder: item.position,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  isActive: true, // Default to active
}));

const defaultServiceCategories: LookupItem[] = defaultServiceCategoriesData.map(item => ({
  id: item.id,
  name: item.name,
  color: item.color,
  description: item.description,
  sortOrder: item.position,
  createdAt: item.createdAt,
  updatedAt: item.updatedAt,
  isActive: true, // Default to active
}));

const defaultCurrencies: LookupItem[] = defaultCurrenciesData.map(item => ({
  id: item.id,
  name: item.name,
  description: item.symbol,
  isActive: true, // Default to active
}));

const defaultPriorities: LookupItem[] = defaultPrioritiesData.map(item => ({
  id: item.id,
  name: item.name,
  color: item.color,
  isActive: true, // Default to active
}));

const defaultOfferCategories: LookupItem[] = defaultOfferCategoriesData.map(item => ({
  id: item.id,
  name: item.name,
  description: item.description,
  color: item.color,
  sortOrder: item.sortOrder,
  isActive: item.isActive,
}));

const defaultOfferSources: LookupItem[] = defaultOfferSourcesData.map(item => ({
  id: item.id,
  name: item.name,
  description: item.description,
  color: item.color,
  sortOrder: item.sortOrder,
  isActive: item.isActive,
}));

// Import real API services
import { 
  taskStatusesApi,
  eventTypesApi,
  serviceCategoriesApi,
  articleCategoriesApi,
  locationsApi,
  currenciesApi,
  prioritiesApi,
  offerCategoriesApi,
  offerSourcesApi,
  documentTypesApi
} from '@/services/api/lookupsApi';

// Update the LookupsContext to use real API service
const LookupsContext = createContext<LookupsContextType | undefined>(undefined);

export function LookupsProvider({ children }: { children: ReactNode }) {
  // Use API-backed service for all data
  const [taskStatuses, setTaskStatuses] = useState<LookupItem[]>([]);
  const [eventTypes, setEventTypes] = useState<LookupItem[]>([]);
  const [serviceCategories, setServiceCategories] = useState<LookupItem[]>([]);
  const [articleCategories, setArticleCategories] = useState<LookupItem[]>([]);
  const [locations, setLocations] = useState<LookupItem[]>([]);
  const [currencies, setCurrencies] = useState<LookupItem[]>([]);
  const [priorities, setPriorities] = useState<LookupItem[]>([]);
  const [offerCategories, setOfferCategories] = useState<LookupItem[]>([]);
  const [offerSources, setOfferSources] = useState<LookupItem[]>([]);
  const [documentTypes, setDocumentTypes] = useState<LookupItem[]>([]);

  // Function to load lookup data from API
  const refreshLookups = async () => {
    // Check if user is authenticated before making API calls
    const token = localStorage.getItem('access_token');
    if (!token) {
      // Use default data if not authenticated
      setTaskStatuses(defaultTaskStatuses);
      setEventTypes(defaultEventTypes);
      setServiceCategories(defaultServiceCategories);
      setArticleCategories([]);
      setLocations([]);
      setCurrencies(defaultCurrencies);
      setPriorities(defaultPriorities);
      setOfferCategories([]);
      setOfferSources([]);
      setDocumentTypes([]);
      return;
    }

    try {
      // Use Promise.allSettled to handle individual failures gracefully
      const results = await Promise.allSettled([
        taskStatusesApi.getAll(),
        eventTypesApi.getAll(),
        serviceCategoriesApi.getAll(),
        articleCategoriesApi.getAll(),
        locationsApi.getAll(),
        currenciesApi.getAll(),
        prioritiesApi.getAll(),
        offerCategoriesApi.getAll(),
        offerSourcesApi.getAll(),
        documentTypesApi.getAll(),
      ]);
      
      // Process results - use API data if successful, fallback to defaults otherwise
      const [tasksRes, eventsRes, servicesRes, articleCatsRes, locsRes, currenciesRes, prioritiesRes, offerCatsRes, offerSrcsRes, documentTypesRes] = results;
      
      setTaskStatuses(tasksRes.status === 'fulfilled' && tasksRes.value.items?.length ? tasksRes.value.items : defaultTaskStatuses);
      setEventTypes(eventsRes.status === 'fulfilled' && eventsRes.value.items?.length ? eventsRes.value.items : defaultEventTypes);
      setServiceCategories(servicesRes.status === 'fulfilled' && servicesRes.value.items?.length ? servicesRes.value.items : defaultServiceCategories);
      setArticleCategories(articleCatsRes.status === 'fulfilled' ? articleCatsRes.value.items || [] : []);
      setLocations(locsRes.status === 'fulfilled' ? locsRes.value.items || [] : []);
      setCurrencies(currenciesRes.status === 'fulfilled' && currenciesRes.value.currencies?.length ? currenciesRes.value.currencies : defaultCurrencies);
      setPriorities(prioritiesRes.status === 'fulfilled' && prioritiesRes.value.items?.length ? prioritiesRes.value.items : defaultPriorities);
      
      // Offer categories and sources - only use API data, no hardcoded fallback
      setOfferCategories(offerCatsRes.status === 'fulfilled' ? offerCatsRes.value.items || [] : []);
      setOfferSources(offerSrcsRes.status === 'fulfilled' ? offerSrcsRes.value.items || [] : []);
      setDocumentTypes(documentTypesRes.status === 'fulfilled' ? documentTypesRes.value.items || [] : []);
    } catch (error) {
      console.error('Failed to load lookup data from API:', error);
      // Fallback to default data if API fails
      setTaskStatuses(defaultTaskStatuses);
      setEventTypes(defaultEventTypes);
      setServiceCategories(defaultServiceCategories);
      setArticleCategories([]);
      setLocations([]);
      setCurrencies(defaultCurrencies);
      setPriorities(defaultPriorities);
      setOfferCategories([]);
      setOfferSources([]);
      setDocumentTypes([]);
    }
  };

  // Load data from real API on mount - only when authenticated
  useEffect(() => {
    refreshLookups();
    
    // Also listen for storage changes (token added after login)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'access_token' && e.newValue) {
        refreshLookups();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateTaskStatuses = (statuses: LookupItem[]) => {
    setTaskStatuses(statuses);
  };

  const updateEventTypes = (types: LookupItem[]) => {
    setEventTypes(types);
  };

  const updatePriorities = (list: LookupItem[]) => setPriorities(list);

  const updateServiceCategories = (categories: LookupItem[]) => {
    setServiceCategories(categories);
  };

  const updateArticleCategories = (categories: LookupItem[]) => {
    setArticleCategories(categories);
  };

  const updateLocations = (locs: LookupItem[]) => {
    setLocations(locs);
  };

  const updateOfferCategories = (categories: LookupItem[]) => {
    setOfferCategories(categories);
  };

  const updateOfferSources = (sources: LookupItem[]) => {
    setOfferSources(sources);
  };

  const updateDocumentTypes = (types: LookupItem[]) => {
    setDocumentTypes(types);
  };

  const setDefaultCurrency = async (id: string) => {
    try {
      await currenciesApi.setDefault(id);
      const response = await currenciesApi.getAll();
      setCurrencies(response.currencies || []);
    } catch (error) {
      console.error('Failed to set default currency:', error);
    }
  };

  const getTaskStatusById = (id: string) => {
    return taskStatuses.find(status => status.id === id);
  };

  const getEventTypeById = (id: string) => {
    return eventTypes.find(type => type.id === id);
  };

  const getServiceCategoryById = (id: string) => {
    return serviceCategories.find(category => category.id === id);
  };

  const getArticleCategoryById = (id: number) => {
    return articleCategories.find(category => Number(category.id) === id);
  };

  const getLocationById = (id: number) => {
    return locations.find(loc => Number(loc.id) === id);
  };

  const getPriorityById = (id: string) => priorities.find(p => p.id === id);

  const getOfferCategoryById = (id: string) => offerCategories.find(c => c.id === id);

  const getOfferSourceById = (id: string) => offerSources.find(s => s.id === id);

  const getDocumentTypeById = (id: string) => documentTypes.find(d => d.id === id);

  // Get default (favorite) helpers - use value field if available
  const getDefaultOfferCategory = () => offerCategories.find(c => c.isDefault) || offerCategories[0];
  const getDefaultOfferSource = () => offerSources.find(s => s.isDefault) || offerSources[0];
  const getDefaultPriority = () => priorities.find(p => p.isDefault) || priorities[0];
  const getDefaultTaskStatus = () => taskStatuses.find(s => s.isDefault) || taskStatuses[0];
  const getDefaultEventType = () => eventTypes.find(e => e.isDefault) || eventTypes[0];
  const getDefaultServiceCategory = () => serviceCategories.find(c => c.isDefault) || serviceCategories[0];

  const value = {
    taskStatuses,
    eventTypes,
    serviceCategories,
    articleCategories,
    locations,
    currencies,
    priorities,
    offerCategories,
    offerSources,
    documentTypes,
    setDefaultCurrency,
    updateTaskStatuses,
    updateEventTypes,
    updateServiceCategories,
    updateArticleCategories,
    updateLocations,
    updatePriorities,
    updateOfferCategories,
    updateOfferSources,
    updateDocumentTypes,
    getPriorityById,
    getTaskStatusById,
    getEventTypeById,
    getServiceCategoryById,
    getArticleCategoryById,
    getLocationById,
    getOfferCategoryById,
    getOfferSourceById,
    getDocumentTypeById,
    getDefaultOfferCategory,
    getDefaultOfferSource,
    getDefaultPriority,
    getDefaultTaskStatus,
    getDefaultEventType,
    getDefaultServiceCategory,
    refreshLookups,
  };


  return (
    <LookupsContext.Provider value={value}>
      {children}
    </LookupsContext.Provider>
  );
}

export function useLookups() {
  const context = useContext(LookupsContext);
  if (context === undefined) {
    // Defensive fallback for hot-reload or initialization edge cases
    console.warn('useLookups called outside of LookupsProvider - returning defaults');
    return {
      taskStatuses: [],
      eventTypes: [],
      serviceCategories: [],
      articleCategories: [],
      locations: [],
      currencies: [],
      priorities: [],
      offerCategories: [],
      offerSources: [],
      documentTypes: [],
      setDefaultCurrency: () => {},
      updateTaskStatuses: () => {},
      updateEventTypes: () => {},
      updateServiceCategories: () => {},
      updateArticleCategories: () => {},
      updateLocations: () => {},
      updatePriorities: () => {},
      updateOfferCategories: () => {},
      updateOfferSources: () => {},
      updateDocumentTypes: () => {},
      getPriorityById: () => undefined,
      getTaskStatusById: () => undefined,
      getEventTypeById: () => undefined,
      getServiceCategoryById: () => undefined,
      getArticleCategoryById: () => undefined,
      getLocationById: () => undefined,
      getOfferCategoryById: () => undefined,
      getOfferSourceById: () => undefined,
      getDocumentTypeById: () => undefined,
      getDefaultOfferCategory: () => undefined,
      getDefaultOfferSource: () => undefined,
      getDefaultPriority: () => undefined,
      getDefaultTaskStatus: () => undefined,
      getDefaultEventType: () => undefined,
      getDefaultServiceCategory: () => undefined,
      refreshLookups: async () => {},
    } as LookupsContextType;
  }
  return context;
}