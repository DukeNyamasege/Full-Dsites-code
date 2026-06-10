import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DerivResponse {
  error?: { message: string; code: string };
  authorize?: {
    balance: number;
    currency: string;
    email: string;
    loginid: string;
  };
  statement?: {
    count: number;
    transactions: Array<{
      action_type: string;
      amount: number;
      balance_after: number;
      transaction_id: number;
      transaction_time: number;
      longcode?: string;
      contract_id?: number;
    }>;
  };
  profit_table?: {
    count: number;
    transactions: Array<{
      buy_price: number;
      sell_price: number;
      profit: number;
      transaction_id: number;
      purchase_time: number;
      sell_time: number;
    }>;
  };
}

async function connectToDerivWebSocket(apiToken: string, startDate: number, endDate: number): Promise<DerivResponse[]> {
  return new Promise((resolve, reject) => {
    const responses: DerivResponse[] = [];
    const appId = "1089"; // Default Deriv app ID for testing
    const ws = new WebSocket(`wss://ws.derivws.com/websockets/v3?app_id=${appId}`);
    let authorized = false;
    let statementReceived = false;
    
    const timeout = setTimeout(() => {
      ws.close();
      reject(new Error("WebSocket connection timeout"));
    }, 30000);

    ws.onopen = () => {
      console.log("WebSocket connected, authorizing...");
      ws.send(JSON.stringify({ authorize: apiToken }));
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as DerivResponse;
        console.log("Received message type:", Object.keys(data).filter(k => k !== 'echo_req' && k !== 'req_id')[0]);
        
        if (data.error) {
          console.error("Deriv API error:", data.error);
          clearTimeout(timeout);
          ws.close();
          reject(new Error(data.error.message));
          return;
        }

        if (data.authorize) {
          authorized = true;
          responses.push(data);
          console.log("Authorized, fetching statement...");
          
          // Fetch statement with date range
          ws.send(JSON.stringify({
            statement: 1,
            description: 1,
            limit: 500,
            date_from: startDate,
            date_to: endDate,
          }));
        }

        if (data.statement) {
          statementReceived = true;
          responses.push(data);
          console.log(`Statement received with ${data.statement.count} transactions`);
          clearTimeout(timeout);
          ws.close();
          resolve(responses);
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      clearTimeout(timeout);
      reject(new Error("WebSocket connection error"));
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      clearTimeout(timeout);
      if (!statementReceived && authorized) {
        resolve(responses);
      }
    };
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    let adminMode = false;
    try {
      const body = await req.json();
      adminMode = body?.adminMode === true;
    } catch {
      // No body or invalid JSON, continue with default
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetching Deriv commissions for user: ${user.id}, adminMode: ${adminMode}`);

    // Check if admin mode requested
    let sites;
    let totalSites = 0;
    let activeSitesCount = 0;

    if (adminMode) {
      // Check if user is admin using service role
      const adminSupabase = createClient(supabaseUrl, serviceRoleKey);
      const { data: isAdminResult } = await adminSupabase
        .rpc('has_role', { _user_id: user.id, _role: 'admin' });
      
      if (!isAdminResult) {
        return new Response(
          JSON.stringify({ error: "Admin access required" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get ALL sites for admin
      const { data: allSites, error: sitesError } = await adminSupabase
        .from("sites")
        .select("id, name, deriv_api_token, deriv_affiliate_id, status")
        .neq("status", "deleted");

      if (sitesError) {
        console.error("Error fetching sites:", sitesError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch sites" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      totalSites = allSites?.length || 0;
      activeSitesCount = allSites?.filter(s => s.status === 'active').length || 0;
      sites = allSites?.filter(s => s.deriv_api_token) || [];
    } else {
      // Get user's sites with Deriv API tokens
      const { data: userSites, error: sitesError } = await supabase
        .from("sites")
        .select("id, name, deriv_api_token, deriv_affiliate_id, status")
        .eq("user_id", user.id)
        .not("deriv_api_token", "is", null)
        .neq("status", "deleted");

      if (sitesError) {
        console.error("Error fetching sites:", sitesError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch sites" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      sites = userSites || [];
    }

    if (!sites || sites.length === 0) {
      console.log("No sites with Deriv API tokens found");
      const baseResponse = {
        todayCommissions: 0,
        monthCommissions: 0,
        todayDeveloperShare: 0,
        monthDeveloperShare: 0,
        currency: "USD",
        hasToken: false,
        message: "No Deriv API token configured",
      };

      if (adminMode) {
        return new Response(
          JSON.stringify({
            ...baseResponse,
            totalSites,
            activeSites: activeSitesCount,
            sitesWithTokens: 0,
            siteBreakdown: [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify(baseResponse),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate date ranges (UTC)
    const now = new Date();
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    
    const todayStartTimestamp = Math.floor(todayStart.getTime() / 1000);
    const monthStartTimestamp = Math.floor(monthStart.getTime() / 1000);
    const nowTimestamp = Math.floor(now.getTime() / 1000);

    console.log(`Date range - Month start: ${new Date(monthStartTimestamp * 1000).toISOString()}, Today start: ${new Date(todayStartTimestamp * 1000).toISOString()}`);

    let totalTodayCommissions = 0;
    let totalMonthCommissions = 0;
    let validTokenCount = 0;
    let tokenErrors: string[] = [];
    const siteBreakdown: Array<{ siteName: string; todayCommissions: number; monthCommissions: number }> = [];

    // Process each site's Deriv API token
    for (const site of sites) {
      if (!site.deriv_api_token) continue;

      let siteTodayCommissions = 0;
      let siteMonthCommissions = 0;

      try {
        console.log(`Processing site: ${site.name} (${site.id})`);
        
        const responses = await connectToDerivWebSocket(
          site.deriv_api_token,
          monthStartTimestamp,
          nowTimestamp
        );

        validTokenCount++;

        // Process statement transactions
        const statementResponse = responses.find(r => r.statement);
        if (statementResponse?.statement?.transactions) {
          const transactions = statementResponse.statement.transactions;
          console.log(`Found ${transactions.length} transactions for site ${site.name}`);

          for (const tx of transactions) {
            // Only count deposit/credit transactions as commissions
            if (tx.amount > 0 && (tx.action_type === "deposit" || tx.action_type === "affiliate_commission" || tx.action_type === "referral")) {
              const txTime = tx.transaction_time;
              
              // Add to monthly total
              if (txTime >= monthStartTimestamp) {
                totalMonthCommissions += tx.amount;
                siteMonthCommissions += tx.amount;
              }
              
              // Add to today's total
              if (txTime >= todayStartTimestamp) {
                totalTodayCommissions += tx.amount;
                siteTodayCommissions += tx.amount;
              }
            }
          }
        }

        if (adminMode) {
          siteBreakdown.push({
            siteName: site.name,
            todayCommissions: Math.round(siteTodayCommissions * 100) / 100,
            monthCommissions: Math.round(siteMonthCommissions * 100) / 100,
          });
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error(`Error processing site ${site.name}:`, errorMessage);
        tokenErrors.push(`${site.name}: ${errorMessage}`);
        
        if (adminMode) {
          siteBreakdown.push({
            siteName: site.name,
            todayCommissions: 0,
            monthCommissions: 0,
          });
        }
      }
    }

    // Calculate 8% developer share
    const todayDeveloperShare = totalTodayCommissions * 0.08;
    const monthDeveloperShare = totalMonthCommissions * 0.08;

    // Round to 2 decimal places
    const response: Record<string, unknown> = {
      todayCommissions: Math.round(totalTodayCommissions * 100) / 100,
      monthCommissions: Math.round(totalMonthCommissions * 100) / 100,
      todayDeveloperShare: Math.round(todayDeveloperShare * 100) / 100,
      monthDeveloperShare: Math.round(monthDeveloperShare * 100) / 100,
      currency: "USD",
      hasToken: validTokenCount > 0,
      validTokenCount,
      tokenErrors: tokenErrors.length > 0 ? tokenErrors : undefined,
      lastUpdated: new Date().toISOString(),
    };

    if (adminMode) {
      response.totalSites = totalSites;
      response.activeSites = activeSitesCount;
      response.sitesWithTokens = sites.length;
      response.siteBreakdown = siteBreakdown;
    }

    console.log("Commission response:", response);

    return new Response(
      JSON.stringify(response),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in fetch-deriv-commissions:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Internal server error",
        todayCommissions: 0,
        monthCommissions: 0,
        todayDeveloperShare: 0,
        monthDeveloperShare: 0,
        currency: "USD",
        hasToken: false,
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
