import { withAdminAuthHeaders } from "@/utils/adminAuth";

const parseMetricResponse = async (response: Response, metricName: string): Promise<number> => {
  if (!response.ok) {
    throw new Error(`Failed to load ${metricName}`);
  }

  const payload = (await response.json()) as { value?: number };
  if (typeof payload.value !== "number" || Number.isNaN(payload.value)) {
    throw new Error(`Invalid ${metricName} payload`);
  }

  return payload.value;
};

const fetchMetric = (path: string, metricName: string) =>
  fetch(path, { credentials: "include", headers: withAdminAuthHeaders() }).then((response) =>
    parseMetricResponse(response, metricName)
  );

export const fetchTotalInvoices = () => fetchMetric("/api/admin/metrics/total-invoices", "total invoices");
export const fetchTotalStores = () => fetchMetric("/api/admin/metrics/total-stores", "total stores");
export const fetchEBillCustomers = () => fetchMetric("/api/admin/metrics/ebill-customers", "e-bill customers");
export const fetchAnonymousCustomers = () => fetchMetric("/api/admin/metrics/anonymous-customers", "anonymous customers");
export const fetchTotalCampaigns = () => fetchMetric("/api/admin/metrics/total-campaigns", "total campaigns");
export const fetchMessagesSent = () => fetchMetric("/api/admin/metrics/messages-sent", "messages sent");
