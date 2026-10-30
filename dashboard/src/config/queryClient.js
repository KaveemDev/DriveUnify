import { QueryClient } from '@tanstack/react-query';

// Listing every file across accounts is expensive, so cache for a while and don't refetch on focus
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
