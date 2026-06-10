import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DerivCommissions {
  todayCommissions: number;
  monthCommissions: number;
  todayDeveloperShare: number;
  monthDeveloperShare: number;
  currency: string;
  hasToken: boolean;
  validTokenCount?: number;
  tokenErrors?: string[];
  lastUpdated?: string;
  error?: string;
}

export function useDerivCommissions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['deriv-commissions', user?.id],
    queryFn: async (): Promise<DerivCommissions> => {
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (!sessionData.session) {
        throw new Error("No session");
      }

      const { data, error } = await supabase.functions.invoke('fetch-deriv-commissions', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        console.error("Error fetching Deriv commissions:", error);
        throw error;
      }

      return data as DerivCommissions;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
    retry: 1,
  });
}
