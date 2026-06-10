import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface AdminCommissionData {
  todayCommissions: number;
  monthCommissions: number;
  todayDeveloperShare: number;
  monthDeveloperShare: number;
  totalSites: number;
  activeSites: number;
  sitesWithTokens: number;
  currency: string;
  lastUpdated: string;
  siteBreakdown?: Array<{
    siteName: string;
    todayCommissions: number;
    monthCommissions: number;
  }>;
}

export function useAdminCommissions(isAdmin: boolean) {
  return useQuery({
    queryKey: ['admin-commissions'],
    queryFn: async (): Promise<AdminCommissionData> => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        throw new Error("No session");
      }

      const { data, error } = await supabase.functions.invoke('fetch-deriv-commissions', {
        body: { adminMode: true },
      });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}
