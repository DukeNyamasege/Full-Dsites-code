import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Globe, Key, Bot, FileCode, Loader2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface PendingBot {
  id: string;
  name: string;
  order: number;
  isValid: boolean;
}

interface BotFileData {
  id: string;
  data: string;
}

const SetupSummary = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [siteId, setSiteId] = useState<string | null>(null);
  const [domainName, setDomainName] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);
  const [bots, setBots] = useState<PendingBot[]>([]);
  const [botFiles, setBotFiles] = useState<BotFileData[]>([]);

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

    // Load pending bots from sessionStorage
    const pendingBots = sessionStorage.getItem('pendingBots');
    const pendingBotFiles = sessionStorage.getItem('pendingBotFiles');
    
    if (pendingBots) {
      const parsed = JSON.parse(pendingBots) as PendingBot[];
      setBots(parsed.filter(b => b.isValid));
    }
    
    if (pendingBotFiles) {
      setBotFiles(JSON.parse(pendingBotFiles));
    }

    // Fetch site details to get App ID
    const fetchSiteDetails = async () => {
      const { data, error } = await supabase
        .from('sites')
        .select('deriv_affiliate_id')
        .eq('id', siteIdParam)
        .single();

      if (!error && data) {
        setAppId(data.deriv_affiliate_id);
      }
    };

    fetchSiteDetails();
  }, [searchParams, navigate]);

  // Sanitize filename for storage - replace special chars with safe alternatives
  const sanitizeFilename = (filename: string): string => {
    // Replace # with underscore, spaces with underscores, and remove other problematic chars
    return filename
      .replace(/[#]/g, '_')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_.\-]/g, '_')
      .replace(/_+/g, '_'); // Replace multiple underscores with single
  };

  const handleSubmit = async () => {
    if (!siteId || !user) {
      toast.error('Missing required information');
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload XML files to storage
      const validBots = bots.filter(b => b.isValid);
      
      for (const bot of validBots) {
        const fileData = botFiles.find(f => f.id === bot.id);
        if (!fileData) continue;

        // Convert base64 back to blob
        const response = await fetch(fileData.data);
        const blob = await response.blob();
        
        // Sanitize filename for storage path and ensure uniqueness to avoid collisions
        const sanitizedName = sanitizeFilename(bot.name);
        const uniquePrefix = sanitizeFilename(`${bot.order + 1}-${bot.id}`);
        const filePath = `${user.id}/${siteId}/${uniquePrefix}-${sanitizedName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('xml-bots')
          .upload(filePath, blob, {
            contentType: 'text/xml',
            upsert: true,
          });

        if (uploadError) {
          console.error('Upload error:', uploadError);
          throw new Error(`Failed to upload ${bot.name}`);
        }

        // Save bot record to database with original display name
        const { error: dbError } = await supabase
          .from('xml_bots')
          .insert({
            site_id: siteId,
            user_id: user.id,
            file_name: bot.name, // Keep original name for display
            file_path: filePath, // Use sanitized path for storage
            display_order: bot.order,
          });

        if (dbError) {
          console.error('DB error:', dbError);
          throw new Error(`Failed to save ${bot.name} record`);
        }
      }

      // Auto-activate site (skip admin review)
      const { error: updateError } = await supabase
        .from('sites')
        .update({ status: 'active' })
        .eq('id', siteId)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Clear sessionStorage
      sessionStorage.removeItem('pendingBots');
      sessionStorage.removeItem('pendingBotFiles');

      toast.success('Site is now live!');
      navigate('/dashboard?setup=complete');
    } catch (err) {
      console.error('Error submitting:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to submit configuration');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validBots = bots.filter(b => b.isValid);

  return (
    <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Progress indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-medium text-foreground">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">App ID</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-green-500" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-medium text-foreground">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">Token</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-green-500" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-sm font-medium text-foreground">
              <Check className="w-4 h-4" />
            </div>
            <span className="text-sm text-muted-foreground hidden sm:inline">XML Bots</span>
          </div>
          <div className="w-8 sm:w-12 h-0.5 bg-primary" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-sm font-medium text-foreground">4</div>
            <span className="text-sm text-foreground hidden sm:inline">Review</span>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Review Your Configuration</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Review your site settings before submitting. Your site will go live within 10 minutes to 1 hour.
          </p>
        </div>

        {/* Summary Card */}
        <div className="rounded-2xl panel-bg border border-white/10 p-6 mb-6 space-y-6">
          {/* Domain */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <Globe className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Domain Name</p>
              <p className="text-lg font-semibold text-foreground">{domainName || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* App ID */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Key className="w-5 h-5 text-amber-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-1">Deriv App ID</p>
              <p className="text-lg font-semibold text-foreground">{appId || 'N/A'}</p>
            </div>
          </div>

          <div className="border-t border-white/10" />

          {/* XML Bots */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground mb-2">XML Bots ({validBots.length})</p>
              <div className="space-y-2">
                {validBots.map((bot, index) => (
                  <div key={bot.id} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                    <div className="w-6 h-6 rounded bg-purple-500/20 flex items-center justify-center">
                      <span className="text-xs font-bold text-purple-400">{index + 1}</span>
                    </div>
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground truncate">{bot.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Notice */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 mb-6">
          <p className="text-sm text-muted-foreground">
            <span className="text-blue-400 font-medium">Note:</span> After submission, your site will be queued for deployment. 
            It typically goes live within <span className="text-foreground font-medium">10 minutes to 1 hour</span>.
          </p>
        </div>

        <Button 
          onClick={handleSubmit}
          disabled={isSubmitting || validBots.length === 0}
          className="w-full btn-primary h-12 text-base"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Submit & Launch Site
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default SetupSummary;
