/**
 * Analytics API endpoints
 */

import apiClient from './client';

export interface AnalyticsParams {
  storeId: string;
  dateRange?: string;
  customStart?: string;
  customEnd?: string;
}

export interface RevenueData {
  total: number;
  period: string;
  // Add other revenue fields as needed
}

export interface InvoicesData {
  invoices: unknown[];
  total: number;
  // Add other invoice fields as needed
}

export interface CampaignsData {
  campaigns: unknown[];
  total: number;
  // Add other campaign fields as needed
}

export interface DashboardData {
  revenue: RevenueData;
  invoices: InvoicesData;
  campaigns: CampaignsData;
  customers: {
    total: number;
    eBillCustomers: number;
  };
  metrics: {
    avgItemsPerOrder: number;
    discountRate: number;
  };
}

/**
 * Get complete dashboard data in a single request
 * This reduces multiple API calls to one
 */
export async function getDashboardData(params: AnalyticsParams): Promise<DashboardData> {
  const response = await apiClient.get<DashboardData>('/analytics/dashboard', {
    params: {
      store_id: params.storeId,
      date_range: params.dateRange,
      custom_start: params.customStart,
      custom_end: params.customEnd,
    },
  });
  return response.data;
}

/**
 * Get revenue data
 */
export async function getRevenue(params: AnalyticsParams): Promise<RevenueData> {
  const response = await apiClient.get<RevenueData>('/analytics/revenue', {
    params: {
      store_id: params.storeId,
      date_range: params.dateRange,
      custom_start: params.customStart,
      custom_end: params.customEnd,
    },
  });
  return response.data;
}

/**
 * Get invoices
 */
export async function getInvoices(params: AnalyticsParams): Promise<InvoicesData> {
  const response = await apiClient.get<InvoicesData>('/analytics/invoices', {
    params: {
      store_id: params.storeId,
      date_range: params.dateRange,
      custom_start: params.customStart,
      custom_end: params.customEnd,
    },
  });
  return response.data;
}

/**
 * Get campaigns
 */
export async function getCampaigns(params: AnalyticsParams): Promise<CampaignsData> {
  const response = await apiClient.get<CampaignsData>('/analytics/campaigns', {
    params: {
      store_id: params.storeId,
      date_range: params.dateRange,
      custom_start: params.customStart,
      custom_end: params.customEnd,
    },
  });
  return response.data;
}

export const analyticsAPI = {
  getDashboardData,
  getRevenue,
  getInvoices,
  getCampaigns,
};
