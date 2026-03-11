import { useEffect, useState } from "react";
import { withAdminAuthHeaders } from "@/utils/adminAuth";

export interface AdminVendor {
  franchise_id: string | null;
  vendor_name: string;
  store_id: string;
  store_name: string;
  onboarding_status: "Active" | "Pending" | "Disabled" | string;
  brand_name?: string | null;
}

interface UseAdminVendorsResult {
  vendors: AdminVendor[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useAdminVendors = (): UseAdminVendorsResult => {
  const [vendors, setVendors] = useState<AdminVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVendors = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/vendors", {
        credentials: "include",
        headers: withAdminAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error("Failed to load vendors");
      }
      const data = (await response.json()) as AdminVendor[];
      setVendors(data);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  return { vendors, isLoading, error, refetch: fetchVendors };
};
