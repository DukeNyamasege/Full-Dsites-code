import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Key, ArrowRight, Info, Check, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const REQUIRED_SCOPES = ['read', 'trade', 'trading_information'];

const SetupAppId = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [appId, setAppId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);

  useEffect(() => {
    const siteIdParam = searchParams.get('siteId');
    const domainParam = searchParams.get('domain');
    
    if (!siteIdParam) {
      toast.error('Missing site information');
      navigate('/domains');
      return;
    }
    
    setSiteId(siteIdParam);
    setDomainName(domainParam);
  }, [searchParams, navigate]);

  const handleContinue = async () => {
    if (!appId.trim()) {
      toast.error('Please enter your Deriv App ID');
      return;
    }

    if (!/^\d+$/.test(appId.trim())) {
      toast.error('App ID must be a number');
      return;
    }

    if (!siteId || !user) {
      toast.error('Missing required information');
      return;
    }

    setIsLoading(true);

    try {
      // Update the site with the Deriv App ID
      const { error } = await supabase
        .from('sites')
        .update({ deriv_affiliate_id: appId.trim() })
        .eq('id', siteId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('App ID saved successfully');
      navigate(`/setup/token?siteId=${siteId}&domain=${encodeURIComponent(domainName || '')}`);
    } catch (err) {
      console.error('Error saving App ID:', err);
      toast.error('Failed to save App ID');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-foreground">1</div>
            <span className="text-sm text-foreground hidden sm:inline">App ID</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-muted-foreground">2</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Token</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-muted-foreground">3</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">XML Bots</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-white/20" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm font-medium text-muted-foreground">4</div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Review</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl gradient-purple flex items-center justify-center glow-purple mx-auto mb-4">
            <Key className="w-8 h-8 text-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Enter Your Deriv App ID</h1>
          {domainName && (
            <p className="text-primary font-medium mb-2">{domainName}</p>
          )}
          <p className="text-muted-foreground max-w-md mx-auto">
            Your Deriv App ID connects your site to your Deriv affiliate account for commission tracking.
          </p>
        </div>

        {/* App ID Form */}
        <div className="rounded-2xl panel-bg border border-white/10 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2">
                Deriv App ID <span className="text-red-400">*</span>
              </label>
              <Input
                placeholder="Enter your App ID (e.g., 12345)"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                className="bg-sidebar-bg border-white/10 h-12 text-lg"
                type="text"
                inputMode="numeric"
              />
            </div>

            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-foreground mb-2">Required Scopes</p>
                  <p className="text-sm text-muted-foreground mb-3">
                    Make sure your App ID has the following scopes enabled:
                  </p>
                  <ul className="space-y-1.5">
                    {REQUIRED_SCOPES.map((scope) => (
                      <li key={scope} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-green-400" />
                        <code className="px-1.5 py-0.5 rounded bg-white/10 text-foreground">{scope}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a 
                href="https://api.deriv.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Create App ID on Deriv API
              </a>
              <span className="hidden sm:inline text-muted-foreground">|</span>
              <a 
                href="#" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                <ExternalLink className="w-4 h-4" />
                Watch Tutorial (Coming Soon)
              </a>
            </div>
          </div>
        </div>

        <Button 
          onClick={handleContinue}
          disabled={!appId.trim() || isLoading}
          className="w-full btn-primary h-12 text-base"
        >
          {isLoading ? 'Saving...' : 'Continue to XML Bots'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SetupAppId;
