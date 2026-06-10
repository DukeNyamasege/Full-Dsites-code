import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { startOfMonth, startOfDay, isWithinInterval } from "date-fns";

export interface Site {
  id: string;
  name: string;
  status: string;
  domain_id: string | null;
  deriv_affiliate_id: string | null;
  created_at: string;
  domain_purchases?: {
    domain_name: string;
  } | null;
}

export interface Subscription {
  id: string;
  plan_type: '8percent' | 'onetime';
  status: string;
  start_date: string;
  end_date: string | null;
}

export interface Commission {
  id: string;
  amount: number;
  commission_fee: number;
  net_amount: number;
  period_start: string;
  period_end: string;
  status: string;
  site_id: string;
  created_at: string;
}

export interface DashboardStats {
  totalSites: number;
  activeSites: number;
  todayCommissions: number;
  currentMonthCommissions: number;
}

export function useDashboard() {
  const { user } = useAuth();

  const { data: sites, isLoading: sitesLoading, refetch: refetchSites } = useQuery({
    queryKey: ['sites', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sites')
        .select(`
          *,
          domain_purchases(domain_name)
        `)
        .eq('user_id', user!.id)
        .neq('status', 'deleted')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Site[];
    },
    enabled: !!user,
  });

  const { data: subscription, isLoading: subscriptionLoading } = useQuery({
    queryKey: ['subscription', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('*')
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .maybeSingle();

      if (error) throw error;
      return data as Subscription | null;
    },
    enabled: !!user,
  });

  const { data: commissions, isLoading: commissionsLoading } = useQuery({
    queryKey: ['commissions', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('commissions')
        .select('*')
        .eq('user_id', user!.id)
        .order('period_end', { ascending: false });

      if (error) throw error;
      return data as Commission[];
    },
    enabled: !!user,
  });

  const now = new Date();
  const todayStart = startOfDay(now);
  const monthStart = startOfMonth(now);

  const todayCommissions = commissions?.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= todayStart;
  }).reduce((sum, c) => sum + Number(c.net_amount), 0) ?? 0;

  const currentMonthCommissions = commissions?.filter(c => {
    const createdAt = new Date(c.created_at);
    return createdAt >= monthStart;
  }).reduce((sum, c) => sum + Number(c.net_amount), 0) ?? 0;

  const stats: DashboardStats = {
    totalSites: sites?.length ?? 0,
    activeSites: sites?.filter(s => s.status === 'active').length ?? 0,
    todayCommissions,
    currentMonthCommissions,
  };

  return {
    sites: sites ?? [],
    subscription,
    commissions: commissions ?? [],
    stats,
    isLoading: sitesLoading || subscriptionLoading || commissionsLoading,
    refetch: refetchSites,
  };
}
