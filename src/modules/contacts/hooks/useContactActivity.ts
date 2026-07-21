import { useQuery } from '@tanstack/react-query';
import { contactActivityApi, ContactActivityDto } from '@/services/api/contactActivityApi';

export type { ContactActivityDto };

export function useContactActivity(contactId: number | null) {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['contact-activity', contactId],
    queryFn: () => contactActivityApi.getByContact(contactId!),
    enabled: !!contactId,
    staleTime: 60 * 1000,
  });

  const activities: ContactActivityDto[] = data?.activities ?? [];
  return { activities, totalCount: data?.totalCount ?? 0, isLoading, error, refetch };
}
