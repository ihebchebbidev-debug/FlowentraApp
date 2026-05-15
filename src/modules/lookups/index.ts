// Export all lookups module components and hooks
export { default as LookupsPage } from './pages/LookupsPage';
export { LookupTable } from './components/LookupTable';
export { 
  useTaskStatuses, 
  useEventTypes, 
  useServiceCategories, 
  usePriorities, 
  useArticleCategories,
  useCurrencies 
} from './hooks/useLookups';
export type { UseLookupHookReturn, UseCurrencyHookReturn } from './hooks/useLookups';