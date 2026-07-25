import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, Suspense } from "react";
import Login from "./modules/auth/pages/Login";
import UserLogin from "./modules/auth/pages/UserLogin";
// SSO callback route kept for OAuth callback page
import ApiTestsPage from "./modules/testing/pages/ApiTestsPage";
// Dashboard is gated to show a preloading screen and warm data/assets
import DashboardGate from "./modules/dashboard/components/DashboardGate";
import Onboarding from "./modules/onboarding/pages/Onboarding";
import VerifyEmail from "./pages/VerifyEmail";
import TwoFactorChallenge from "./pages/TwoFactorChallenge";
import NotFound from "./pages/NotFound";
import PublicFormPage from "./modules/dynamic-forms/pages/PublicFormPage";
import { lazyWithRetry } from "./lib/lazyWithRetry";
const PublicWebsitePage = lazyWithRetry(() => import("./modules/website-builder/pages/PublicWebsitePage"));
const PublicDashboardPage = lazyWithRetry(() => import("./modules/dashboard-builder/pages/PublicDashboardPage"));
const DbConsolePage = lazyWithRetry(() => import("./modules/settings/pages/DbConsolePage"));

import { OAuthCallbackPage } from "./modules/email-calendar/components/OAuthCallbackPage";
import { LookupsProvider } from "./shared/contexts/LookupsContext";
import { LoadingProvider } from "./shared";
import { TopProgressBar } from "./shared/components/TopProgressBar";
import "./lib/i18n";
import { ScrollToTop } from "./shared/components/ScrollToTop";
import AppLoader from "./shared/components/AppLoader";
import { runWhenIdle, preloadDashboard, preloadSupport, preloadOnboarding, preloadLogin } from "./shared/prefetch";
import { AuthProvider } from "@/contexts/AuthContext";
import { PreferencesProvider } from "./contexts/PreferencesProvider";
import { OfflineProvider } from "./contexts/OfflineContext";
import { TenantMapProvider } from "./contexts/TenantMapContext";
import { PrefixRedirect } from "./components/PrefixRedirect";
import { RequireCompany } from "./components/RequireCompany";
import { RequireEmailVerified } from "./components/RequireEmailVerified";
const SelectCompany = lazyWithRetry(() => import("./modules/auth/pages/SelectCompany"));
import { useTenantDocumentTitle } from "./hooks/useTenantDocumentTitle";

const TenantTitleSync: React.FC = () => {
  useTenantDocumentTitle();
  return null;
};
import { PreferencesLoader } from "./components/PreferencesLoader";
import { SessionExpiredBanner } from "./components/SessionExpiredBanner";
// ErrorBoundary component is available at ./components/ErrorBoundary for module-level use
import { useErrorTracking } from "./hooks/useErrorTracking";
import { logger } from "./hooks/useLogger";
import { reportIncident } from "./services/incident/incidentService";
import { installIncidentMonitor } from "./services/incident/installIncidentMonitor";
import { DeploymentNotificationSystem } from "./components/DeploymentNotificationSystem";
import { OfflineSyncRedirector } from "./components/offline/OfflineSyncRedirector";
import { OfflineSyncLoadingOverlay } from "./components/offline/OfflineSyncLoadingOverlay";
// OfflineSyncCenter removed — was mounted but hidden; use OfflineStatusBar instead.
import { installOfflineFetchGuard } from "./services/offline/offlineFetchGuard";
import { getCurrentTenant } from "./utils/tenant";

import { restoreAppState, applyRestoredState } from "./lib/appStatePreservation";

import { setQueryClient } from "./services/ai/aiTaskCreationService";
import { setQueryClientForFormCreation } from "./services/ai/aiFormCreationService";

// Import optimized QueryClient with caching configuration
import { initializeQueryPersistence, queryClient } from "./lib/queryClient";

// Set the query client reference for AI services
setQueryClient(queryClient);
setQueryClientForFormCreation(queryClient);



// Global error tracking component
const GlobalErrorTracker: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useErrorTracking({
    enableConsoleCapture: true,
    enableUnhandledRejections: true,
    enableWindowErrors: true,
  });
  useEffect(() => {
    installIncidentMonitor();
  }, []);
  return <>{children}</>;
};

// Enhanced App Error Boundary with logging
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; errorId: string | null }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, errorId: null };
  }
  
  static getDerivedStateFromError() { 
    return { hasError: true }; 
  }
  
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const errorId = `APP-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.setState({ errorId });

    // Detect chunk load errors and auto-reload once
    const msg = error.message?.toLowerCase() || '';
    const isChunk = msg.includes('dynamically imported module') || msg.includes('loading chunk') || msg.includes('error loading') || error.name === 'ChunkLoadError';
    if (isChunk) {
      const key = 'app-chunk-reload';
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1');
        window.location.reload();
        return;
      }
      sessionStorage.removeItem(key);
    }
    
    // Log to backend
    logger.error(
      `Application crashed: ${error.message}`,
      'App',
      'other',
      {
        entityType: 'AppCrash',
        entityId: errorId,
        details: JSON.stringify({
          errorId,
          name: error.name,
          message: error.message,
          stack: error.stack,
          componentStack: errorInfo.componentStack,
          url: window.location.href,
          timestamp: new Date().toISOString(),
        }),
      }
    ).catch(() => {});

    void reportIncident({
      incidentType: 'app_crash',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      referenceId: errorId,
    });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-background">
          <div className="max-w-lg w-full bg-card border border-border rounded-2xl p-10 shadow-lg">
            <div className="flex flex-col items-center gap-6 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <svg className="w-8 h-8 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M12 8v4m0 4h.01M4.93 4.93l14.14 14.14M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>

              <div className="space-y-3">
                <h2 className="text-2xl font-semibold text-foreground tracking-tight">
                  We hit an unexpected snag
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Something didn't go as planned on this page. Our engineering team has
                  been automatically notified and is already looking into it — no action
                  needed on your end.
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  You can head back to the previous page and continue working.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    if (window.history.length > 1) {
                      window.history.back();
                    } else {
                      window.location.href = '/';
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors font-medium"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Go back
                </button>
                <button
                  onClick={() => { window.location.href = '/'; }}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors font-medium"
                >
                  Return home
                </button>
              </div>

              {this.state.errorId && (
                <p className="text-xs text-muted-foreground font-mono pt-2 border-t border-border w-full">
                  Reference ID: {this.state.errorId}
                </p>
              )}
            </div>
          </div>
        </div>
      );
    }
    // Clear chunk reload flag on successful render
    sessionStorage.removeItem('app-chunk-reload');
    return this.props.children as any;
  }
}

const App = () => {
  // Set dynamic document title based on tenant subdomain

  useEffect(() => {
  const RESET_VERSION = "force-reset-v1"; // change this to trigger again later
  const alreadyDone = localStorage.getItem("app_reset_version");

  if (alreadyDone !== RESET_VERSION) {
    // --- CLEAR EVERYTHING ---
    localStorage.clear();
    sessionStorage.clear();

    // Clear IndexedDB
    if ("indexedDB" in window) {
      indexedDB.databases?.().then((dbs) => {
        dbs.forEach((db) => {
          if (db.name) indexedDB.deleteDatabase(db.name);
        });
      });
    }

    // --- MARK AS DONE ---
    localStorage.setItem("app_reset_version", RESET_VERSION);

    // --- REDIRECT ---
    window.location.href = "/";
  }
}, []);
  
  useEffect(() => {
    initializeQueryPersistence();
    installOfflineFetchGuard();
  }, []);

  useEffect(() => {
    const hostname = window.location.hostname;
    const BASE_DOMAIN = 'flowentra.app';
    let tenant: string | null = null;
    
    const override = localStorage.getItem('tenant_override');
    if (override) {
      tenant = override.trim().toLowerCase();
    } else if (hostname.endsWith(`.${BASE_DOMAIN}`)) {
      const sub = hostname.slice(0, hostname.length - `.${BASE_DOMAIN}`.length);
      if (sub && !sub.includes('.')) tenant = sub.toLowerCase();
    } else {
      try {
        const tp = new URL(window.location.href).searchParams.get('tenant');
        if (tp) tenant = tp.trim().toLowerCase();
      } catch {}
    }

    if (tenant) {
      const capitalized = tenant.charAt(0).toUpperCase() + tenant.slice(1);
      document.title = `${capitalized} - CRM & Service`;
    } else {
      document.title = 'Flowentra - CRM & Service Management';
    }
  }, []);

  useEffect(() => {
    // ─── Restore app state after silent reload ───
    const savedState = restoreAppState();
    if (savedState) {
      applyRestoredState(savedState);
      console.log('✓ App state restored after silent update');
    }

    // ─── Purge stale caches on app start ───
    // Keep 'company-logo' intact — TenantSwitcher/SelectCompany pre-write it
    // before a reload so the module-level bootstrap in useCompanyLogo.ts reads
    // the correct value instantly (no flash). TenantMapContext re-confirms on
    // every load, so there is no risk of serving a stale value.
    localStorage.removeItem('company-logo-blob-data'); // PDF base64 cache only
    // Clear cached PDF settings (logo embedded inside, lookups references, etc.)
    ['pdf-settings', 'pdf-settings-offers', 'pdf-settings-sales', 'pdf-settings-service-orders', 'pdf-settings-dispatches', 'pdf-settings-payments'].forEach(k => localStorage.removeItem(k));
    console.log('[App] Cleared stale PDF caches on startup');

    // Initialize theme on app start
    const savedTheme = localStorage.getItem('flowsolution-theme') || 'system';
    const root = window.document.documentElement;
    
    // Always clear existing theme classes first
    root.classList.remove('light', 'dark');
    
    if (savedTheme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
    } else {
      root.classList.add(savedTheme);
    }

    // Warm critical routes during idle to improve perceived nav speed
    runWhenIdle(() => {
      preloadDashboard();
      preloadOnboarding();
      preloadSupport();
      preloadLogin();
    }, 800);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <OfflineProvider>
        <PreferencesProvider>
          <PreferencesLoader />
          <LoadingProvider>
          <GlobalErrorTracker>
          <LookupsProvider>
          <TenantMapProvider>
            <TenantTitleSync />
            <TooltipProvider>
              <TopProgressBar />
              <SessionExpiredBanner />
              <DeploymentNotificationSystem />
              
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <OfflineSyncRedirector />
                <OfflineSyncLoadingOverlay />
                
                <ScrollToTop />
                <AppErrorBoundary>
                  <Suspense fallback={<AppLoader />}>
                   <Routes>
                     <Route path="/" element={<Login />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/user-login" element={<UserLogin />} />
                    {/* OAuth callback route for email/calendar */}
                   <Route path="/verify-email" element={<VerifyEmail />} />
                   <Route path="/two-factor" element={<TwoFactorChallenge />} />
                    <Route path="/onboarding" element={<RequireEmailVerified><Onboarding /></RequireEmailVerified>} />
                    {/* API Testing System */}
                    <Route path="/tests" element={<ApiTestsPage />} />

                    {/* Redirect standalone paths into dashboard so sidebar shows. PrefixRedirect preserves trailing segments (e.g. /sales/9 → /dashboard/sales/9). */}
                    <Route path="/offers" element={<Navigate to="/dashboard/offers" replace />} />
                    <Route path="/offers/*" element={<PrefixRedirect to="/dashboard/offers" />} />
                    <Route path="/sales" element={<Navigate to="/dashboard/sales" replace />} />
                    <Route path="/sales/*" element={<PrefixRedirect to="/dashboard/sales" />} />
                    <Route path="/service-orders" element={<Navigate to="/dashboard/field/service-orders" replace />} />
                    <Route path="/service-orders/*" element={<PrefixRedirect to="/dashboard/field/service-orders" />} />
                    <Route path="/calendar" element={<Navigate to="/dashboard/calendar" replace />} />
                    <Route path="/calendar/*" element={<PrefixRedirect to="/dashboard/calendar" />} />
                    <Route path="/ticketsadmin" element={<Navigate to="/dashboard/ticketsadmin" replace />} />
                   <Route path="/projects" element={<Navigate to="/dashboard/tasks/projects" replace />} />
                   <Route path="/projects/*" element={<PrefixRedirect to="/dashboard/tasks/projects" />} />

                   <Route path="/select-company" element={<SelectCompany />} />
                   <Route path="/dashboard/*" element={<RequireEmailVerified><RequireCompany><DashboardGate /></RequireCompany></RequireEmailVerified>} />
                     {/* Customer Support Module — redirect standalone /support paths into dashboard so sidebar shows */}
                     <Route path="/support" element={<Navigate to="/dashboard/support/tickets/dashboard" replace />} />
                     <Route path="/support/*" element={<PrefixRedirect to="/dashboard/support" />} />
                    {/* Public Forms (no authentication required) */}
                    <Route path="/public/forms/:slug" element={<PublicFormPage />} />
                    {/* Public Dashboards (no authentication required) */}
                    <Route path="/public/dashboards/:token" element={<Suspense fallback={<AppLoader />}><PublicDashboardPage /></Suspense>} />
                    {/* Public Websites (no authentication required) */}
                    <Route path="/public/sites/:siteSlug" element={<PublicWebsitePage />} />
                    <Route path="/public/sites/:siteSlug/:pageSlug" element={<PublicWebsitePage />} />
                    {/* OAuth callback pages (opened in popup during Gmail/Outlook connection) */}
                    <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
                    <Route path="/oauth/google/callback" element={<OAuthCallbackPage />} />
                    <Route path="/oauth/microsoft/callback" element={<OAuthCallbackPage />} />
                    {/* Hidden DB console — public route, password-gated inside */}
                    <Route path="/db-console" element={<Suspense fallback={<AppLoader />}><DbConsolePage /></Suspense>} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  </Suspense>
                </AppErrorBoundary>
              </BrowserRouter>
            </TooltipProvider>
          </TenantMapProvider>
          </LookupsProvider>
          </GlobalErrorTracker>
          </LoadingProvider>
        </PreferencesProvider>
        </OfflineProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
