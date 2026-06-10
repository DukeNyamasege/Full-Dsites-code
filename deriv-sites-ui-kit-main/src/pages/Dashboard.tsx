import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Globe, Clock, AlertCircle, RefreshCw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useDashboard } from "@/hooks/useDashboard";
import { differenceInDays } from "date-fns";
import { toast } from "sonner";

const Dashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { sites, subscription, isLoading } = useDashboard();
  const [showSetupNotification, setShowSetupNotification] = useState(false);

  useEffect(() => {
    if (searchParams.get('setup') === 'complete') {
      toast.success('Site configuration submitted! Your site will go live within 10 minutes to 1 hour.');
      setShowSetupNotification(true);
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  const pendingSites = sites.filter(site => site.status === 'pending');
  const activeSites = sites.filter(s => s.status === 'active').length;

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const daysToExpire = subscription?.plan_type === 'onetime' && subscription.end_date
    ? differenceInDays(new Date(subscription.end_date), new Date())
    : null;

  return (
    <div className="flex-1 flex flex-col">
      {/* Header */}
      <header className="py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
        <div>
          <h1 className="text-lg sm:text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Quick overview of your sites
          </p>
        </div>
      </header>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-8 space-y-6">
        {/* Pending Sites Notification */}
        {(pendingSites.length > 0 || showSetupNotification) && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground mb-1">
                  {pendingSites.length > 0
                    ? `${pendingSites.length} site${pendingSites.length > 1 ? 's' : ''} pending deployment`
                    : 'Site submitted for deployment'
                  }
                </h3>
                <p className="text-sm text-muted-foreground">
                  Your site will go live within <span className="text-amber-400 font-medium">10 minutes to 1 hour</span>.
                  You'll be notified once it's live.
                </p>
                {pendingSites.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {pendingSites.map(site => (
                      <span
                        key={site.id}
                        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white/5 text-xs text-foreground"
                      >
                        <Globe className="w-3 h-3" />
                        {site.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Renewal Reminder — shown when expiring within 30 days */}
        {daysToExpire !== null && daysToExpire <= 30 && (
          <div className={`p-4 rounded-xl border ${daysToExpire <= 7 ? 'bg-red-500/10 border-red-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${daysToExpire <= 7 ? 'bg-red-500/20' : 'bg-orange-500/20'}`}>
                <RefreshCw className={`w-5 h-5 ${daysToExpire <= 7 ? 'text-red-400' : 'text-orange-400'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground mb-1">
                  {daysToExpire <= 0
                    ? 'Your subscription has expired'
                    : daysToExpire === 1
                    ? 'Your subscription expires tomorrow!'
                    : `Your subscription expires in ${daysToExpire} days`}
                </h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {daysToExpire <= 0
                    ? 'Renew your Full Ownership plan to continue accessing all features.'
                    : 'Renew now to avoid any service interruption and keep your sites running.'}
                </p>
                <button
                  onClick={() => navigate('/support')}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-foreground transition-colors ${daysToExpire <= 7 ? 'bg-red-500 hover:bg-red-600' : 'bg-orange-500 hover:bg-orange-600'}`}
                >
                  <RefreshCw className="w-4 h-4" />
                  Renew Subscription
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {/* Active Sites */}
          <div className="p-4 sm:p-5 rounded-xl bg-panel-bg border border-white/10">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Active Sites</span>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-foreground">{activeSites}</p>
            <p className="text-xs text-muted-foreground">{sites.length} total sites</p>
          </div>

          {/* Full Ownership - Days to Expire */}
          <div className="p-4 sm:p-5 rounded-xl bg-panel-bg border border-white/10">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
              </div>
              <span className="text-xs sm:text-sm text-muted-foreground">Full Ownership</span>
            </div>
            {subscription?.plan_type === 'onetime' ? (
              <>
                <p className="text-xl sm:text-2xl font-bold text-foreground">
                  {daysToExpire !== null ? `${daysToExpire} days` : 'Lifetime'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {daysToExpire !== null && daysToExpire > 0 ? 'Until expiry' : daysToExpire === 0 ? 'Expires today' : 'No expiration set'}
                </p>
              </>
            ) : (
              <>
                <p className="text-xl sm:text-2xl font-bold text-muted-foreground">—</p>
                <p className="text-xs text-muted-foreground">No active subscription</p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
