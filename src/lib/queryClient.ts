/**
 * React Query Configuration
 * Centralized configuration for data fetching and caching
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: Data is considered fresh for 5 minutes
      staleTime: 5 * 60 * 1000,

      // Cache time: Keep unused data in cache for 10 minutes
      gcTime: 10 * 60 * 1000,

      // Retry failed requests 2 times with exponential backoff
      retry: 2,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),

      // Refetch on window focus for real-time data
      refetchOnWindowFocus: true,

      // Don't refetch on mount if data is still fresh
      refetchOnMount: false,

      // Refetch on reconnect
      refetchOnReconnect: true,
    },
    mutations: {
      // Retry failed mitations once
      retry: 1,
      retryDelay: 1000,
    },
  },
});

/**
 * Query keys factory for consistent cache key management
 */
export const queryKeys = {
  // Auth
  auth: {
    config: ['auth', 'config'] as const,
    user: ['auth', 'user'] as const,
  },

  // Analytics
  analytics: {
    all: ['analytics'] as const,
    dashboard: (storeId: string, dateRange?: string) =>
      ['analytics', 'dashboard', storeId, dateRange] as const,
    revenue: (storeId: string, dateRange?: string) =>
      ['analytics', 'revenue', storeId, dateRange] as const,
    invoices: (storeId: string, dateRange?: string) =>
      ['analytics', 'invoices', storeId, dateRange] as const,
    campaigns: (storeId: string, dateRange?: string) =>
      ['analytics', 'campaigns', storeId, dateRange] as const,
  },

  // Store
  store: {
    all: ['store'] as const,
    details: (storeId: string) => ['store', storeId] as const,
    profile: (storeId: string) => ['store', 'profile', storeId] as const,
  },

  // WhatsApp
  whatsapp: {
    all: ['whatsapp'] as const,
    messages: (storeId: string) => ['whatsapp', 'messages', storeId] as const,
    templates: (storeId: string) => ['whatsapp', 'templates', storeId] as const,
  },

  // Campaigns
  campaigns: {
    all: ['campaigns'] as const,
    list: (storeId: string) => ['campaigns', 'list', storeId] as const,
    details: (campaignId: string) => ['campaigns', 'details', campaignId] as const,
    progress: (campaignId: string) => ['campaigns', 'progress', campaignId] as const,
  },
};
