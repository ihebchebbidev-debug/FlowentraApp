import { useState, useCallback, useEffect, useRef } from 'react';
import { contactsApi, type ContactSearchParams } from '@/services/contactsApi';
import {
  ensureContactVisibilityLoaded,
  filterVisibleContacts,
} from '@/services/contactVisibility';

export type ContactSearchRequest = ContactSearchParams & {
  searchTerm?: string;
  status?: string;
  type?: string;
  pageSize?: number;
};

// Fetch contacts from backend with correctly mapped params
const fetchContacts = async (searchParams?: ContactSearchRequest) => {
  const apiParams: ContactSearchParams = {
    searchTerm: searchParams?.searchTerm || undefined,
    pageNumber: searchParams?.pageNumber ?? searchParams?.page ?? 1,
    pageSize: searchParams?.pageSize ?? searchParams?.limit ?? 100,
    sortBy: searchParams?.sortBy,
    sortDirection: searchParams?.sortDirection ?? searchParams?.sortOrder,
  };

  const response = await contactsApi.getAllContacts(apiParams);
  let list = response.contacts;

  // Client-side filters to mimic server filtering
  if (searchParams?.status && searchParams.status !== 'all') {
    const s = String(searchParams.status).toLowerCase();
    list = list.filter((c: any) => String(c.status || '').toLowerCase() === s);
  }
  if (searchParams?.type && searchParams.type !== 'all') {
    const t = String(searchParams.type).toLowerCase();
    // Map UI types to data values: 'person' ↔ 'individual', 'company' ↔ 'organization'
    const aliases: Record<string, string[]> = {
      person: ['person', 'individual'],
      individual: ['person', 'individual'],
      company: ['company', 'organization'],
      organization: ['company', 'organization'],
    };
    const allowed = aliases[t] || [t];
    list = list.filter((c: any) => allowed.includes(String(c.type || 'individual').toLowerCase()));
  }

  // User-group visibility: contacts assigned to a user group are only shown to
  // members of that group (MainAdminUser always sees everything).
  await ensureContactVisibilityLoaded();
  return filterVisibleContacts(list);
};

export const useContactsData = (searchParams?: ContactSearchRequest) => {
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const inFlight = useRef(0);
  const paramsKey = JSON.stringify(searchParams ?? {});

  const load = useCallback(async () => {
    const myId = ++inFlight.current;
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchContacts(JSON.parse(paramsKey) as ContactSearchRequest);
      // Only apply latest result
      if (inFlight.current === myId) {
        setData(result);
      }
    } catch (err) {
      if (inFlight.current === myId) {
        setError(err as Error);
      }
    } finally {
      if (inFlight.current === myId) {
        setIsLoading(false);
      }
    }
  }, [paramsKey]);

  useEffect(() => {
    load();
    return () => {
      // invalidate previous loads
      inFlight.current++;
    };
  }, [load, refreshKey]);

  const refresh = () => setRefreshKey((k) => k + 1);

  return { data, error, isLoading, refresh };
};