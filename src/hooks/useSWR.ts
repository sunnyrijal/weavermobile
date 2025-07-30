import useSWR, { SWRConfiguration } from 'swr';
import { useAuth } from './useAuth';

// Custom fetcher function
const fetcher = async (url: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

// Custom hook for contacts with SWR
export function useContactsSWR(options?: SWRConfiguration) {
  const { currentUser } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    currentUser ? `/api/contacts?ownerId=${currentUser.uid}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      ...options,
    }
  );

  return {
    contacts: data?.contacts || [],
    isLoading,
    error,
    mutate,
  };
}

// Custom hook for memories with SWR
export function useMemoriesSWR(options?: SWRConfiguration) {
  const { currentUser } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    currentUser ? `/api/memories?ownerId=${currentUser.uid}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      ...options,
    }
  );

  return {
    memories: data?.memories || [],
    isLoading,
    error,
    mutate,
  };
}

// Custom hook for a single contact with SWR
export function useContactSWR(contactId: string | null, options?: SWRConfiguration) {
  const { currentUser } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    currentUser && contactId ? `/api/contacts/${contactId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      ...options,
    }
  );

  return {
    contact: data?.contact || null,
    isLoading,
    error,
    mutate,
  };
}

// Custom hook for memories by contact ID with SWR
export function useMemoriesByContactSWR(contactId: string | null, options?: SWRConfiguration) {
  const { currentUser } = useAuth();
  
  const { data, error, isLoading, mutate } = useSWR(
    currentUser && contactId ? `/api/memories/search?ownerId=${currentUser.uid}&contactId=${contactId}` : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000, // 1 minute
      ...options,
    }
  );

  return {
    memories: data?.memories || [],
    isLoading,
    error,
    mutate,
  };
} 