import { withAdminAuthHeaders } from '@/utils/adminAuth';

export interface StoreOverviewMetrics {
  totalInvoices: number;
  eBillCustomers: number;
  anonymousCustomers: number;
  totalCampaigns: number;
  messagesSent: number;
}

export const fetchStoreOverviewMetrics = async (storeId: string): Promise<StoreOverviewMetrics> => {
  const response = await fetch(`/api/admin/vendor-monitor/stores/${storeId}/metrics`, {
    credentials: 'include',
    headers: withAdminAuthHeaders(),
  });
  if (!response.ok) {
    throw new Error('Failed to load store overview');
  }
  return (await response.json()) as StoreOverviewMetrics;
};
