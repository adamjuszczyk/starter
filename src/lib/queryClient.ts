import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
      retry: 1,
      // Don't refetch on window focus — people switch apps on a phone constantly, and every return would hit the database
      refetchOnWindowFocus: false,
    },
  },
})
