import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Domains from "./pages/Domains";
import PlatformUpdates from "./pages/PlatformUpdates";
import XMLBots from "./pages/XMLBots";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import SetupAppId from "./pages/SetupAppId";
import SetupToken from "./pages/SetupToken";
import SetupBots from "./pages/SetupBots";
import SetupSummary from "./pages/SetupSummary";
import Admin from "./pages/Admin";
import Support from "./pages/Support";
import ApiPlatforms from "./pages/ApiPlatforms";
import SiteRuntimeConfig from "./pages/SiteRuntimeConfig";
import Sidebar from "./components/Sidebar";
import MobileNav from "./components/MobileNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/reset-password" element={<ResetPassword />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen flex flex-col lg:flex-row">
                    <MobileNav />
                    <Sidebar />
                    <main className="flex-1 lg:ml-[260px] flex flex-col pt-14 lg:pt-0">
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/dashboard" element={<Dashboard />} />
                        <Route path="/domains" element={<Domains />} />
                        <Route path="/platform-updates" element={<PlatformUpdates />} />
                        <Route path="/xml-bots" element={<XMLBots />} />
                        <Route path="/settings" element={<Settings />} />
                        <Route path="/support" element={<Support />} />
                        <Route path="/api-platforms" element={<ApiPlatforms />} />
                        <Route path="/setup/app-id" element={<SetupAppId />} />
                        <Route path="/setup/token" element={<SetupToken />} />
                        <Route path="/setup/bots" element={<SetupBots />} />
                        <Route path="/setup/summary" element={<SetupSummary />} />
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/sites/:siteId/config" element={<SiteRuntimeConfig />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </main>
                  </div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
