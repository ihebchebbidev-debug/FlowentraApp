import { useState, useCallback, useEffect, useRef } from 'react';
import { contactsApi, type ContactSearchParams } from '@/services/contactsApi';

export type ContactSearchRequest = ContactSearchParams & {
  searchTerm?: string;
  status?: string;
  type?: string;
  pageSize?: number;
};

// Fetch contacts from static mock with transformed params
const fetchContacts = async (searchParams?: ContactSearchRequest) => {
  const apiParams: ContactSearchParams = {
    search: searchParams?.searchTerm,
    page: 1,
    limit: searchParams?.pageSize ?? 100,
    sortBy: undefined,
    sortOrder: undefined,
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

  return list;
};

export const useContactsData = (searchParams?: ContactSearchRequest) => {
  const [data, setData] = useState<any[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const inFlight = useRef(0);

  const load = useCallback(async () => {
    const myId = ++inFlight.current;
    try {
      setIsLoading(true);
      setError(null);
      const result = await fetchContacts(searchParams);
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
  }, [searchParams]);

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