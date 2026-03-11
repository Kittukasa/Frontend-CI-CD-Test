/**
 * Analytics React Query Hooks
 * Custom hooks for fetching analytics data with caching
 */

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { analyticsAPI, type DashboardData, type AnalyticsParams } from '@/services/api/analytics.api';

/**
 * Hook to fetch complete dashboard data
 * Replaces multiple sequential API calls with a single request
 */
export function useDashboardData(
    params: AnalyticsParams,
    options?: {
        enabled?: boolean;
    }
): UseQueryResult<DashboardData> {
    return useQuery({
        queryKey: queryKeys.analytics.dashboard(params.storeId, params.dateRange),
        queryFn: () => analyticsAPI.getDashboardData(params),
        enabled: options?.enabled !== false && !!params.storeId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
}

/**
 * Hook to fetch revenue data
 */
export function useRevenue(
    params: AnalyticsParams,
    options?: {
        enabled?: boolean;
    }
) {
    return useQuery({
        queryKey: queryKeys.analytics.revenue(params.storeId, params.dateRange),
        queryFn: () => analyticsAPI.getRevenue(params),
        enabled: options?.enabled !== false && !!params.storeId
    });
}

/**
 * Hook to fetch invoices
 */
export function useInvoices(
    params: AnalyticsParams,
    options?: {
        enabled?: boolean;
    }
) {
    return useQuery({
        queryKey: queryKeys.analytics.invoices(params.storeId, params.dateRange),
        queryFn: () => analyticsAPI.getInvoices(params),
        enabled: options?.enabled !== false && !!params.storeId
    });
}

/**
 * Hook to fetch campaigns
 */
export function useCampaigns(
    params: AnalyticsParams,
    options?: {
        enabled?: boolean;
    }
) {
    return useQuery({
        queryKey: queryKeys.analytics.campaigns(params.storeId, params.dateRange),
        queryFn: () => analyticsAPI.getCampaigns(params),
        enabled: options?.enabled !== false && !!params.storeId
    });
}
