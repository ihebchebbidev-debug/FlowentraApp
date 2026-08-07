import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { LogOut, Bell, Sidebar, LayoutGrid, User, Settings as SettingsIcon, Sun, Moon, Monitor, HelpCircle, PlayCircle, Search, Wifi, WifiOff } from "lucide-react";
import { AiLogoIcon } from "@/components/ai-assistant/AiLogoIcon";
import { UserAvatar } from "@/components/ui/user-avatar";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { GlobalSearch } from "@/components/ui/global-search";
import { useTranslation } from 'react-i18next';
import QuickCreateModal from '@/components/ui/QuickCreateModal';
import { Plus } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCompanyLogo } from '@/hooks/useCompanyLogo';

import { useLayoutModeContext } from "@/hooks/useLayoutMode";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/hooks/useTheme';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationCenterSheet } from "@/components/navigation/NotificationCenterSheet";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { EmailVerificationBanner } from "@/shared/components/EmailVerificationBanner";
import { TwoFactorReminderBanner } from "@/shared/components/TwoFactorReminderBanner";
import { useProductTourContext } from "@/contexts/ProductTourContext";
import { AiAssistantSidebar } from "@/components/ai-assistant/AiAssistantSidebar";
import { usePermissions } from "@/hooks/usePermissions";
import ReportIssueModal from "@/components/ReportIssueModal";
import { useOffline } from "@/contexts/OfflineContext";
import { useAiAssistantAvailable } from "@/hooks/useAiAssistantAvailable";
import { GlobalCompanyFilter } from "@/components/CompanyFilter";
import { INCIDENT_PREFILL_EVENT, type ReportIssuePrefill } from "@/services/incident/incidentTypes";

// Safe sidebar state hook — returns null when not inside SidebarProvider
function useSidebarState() {
  try {
    const ctx = useSidebar();
    return ctx.state;
  } catch {
    return null;
  }
}

export function DashboardHeader() {
  const [createOpen, setCreateOpen] = useState(false);
  const [aiSidebarOpen, setAiSidebarOpen] = useState(false);
  const [reportIssueOpen, setReportIssueOpen] = useState(false);
  const [reportIssuePrefill, setReportIssuePrefill] = useState<ReportIssuePrefill | undefined>();
  const companyLogo = useCompanyLogo();
  const sidebarState = useSidebarState();
  const { t } = useTranslation('dashboard');
  const { t: tOnboarding } = useTranslation('onboarding');
  const { t: tAi } = useTranslation('aiAssistant');
  const { layoutMode, setLayoutMode, isMobile } = useLayoutModeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();
  const { startTour } = useProductTourContext();
  const { hasPermission, isMainAdmin } = usePermissions();
  const { enabled: offlineEnabled, online, pendingCount, setEnabled: setOfflineEnabled } = useOffline();
  const aiAssistantAvailable = useAiAssistantAvailable();

  useEffect(() => {
    const onPrefill = (event: Event) => {
      const detail = (event as CustomEvent<ReportIssuePrefill>).detail;
      if (detail) setReportIssuePrefill(detail);
      setReportIssueOpen(true);
    };
    window.addEventListener(INCIDENT_PREFILL_EVENT, onPrefill);
    return () => window.removeEventListener(INCIDENT_PREFILL_EVENT, onPrefill);
  }, []);
  
  // Check AI Assistant permission
  const canAccessAi = isMainAdmin || hasPermission('ai_assistant', 'read');
  
  // Use dynamic notifications
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch: refetchNotifications } = useNotifications();
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  
  // Get user initials from first and last name
  const getUserInitials = (firstName?: string, lastName?: string) => {
    if (!firstName || !lastName) return 'U';
    return `${firstName.charAt(0).toUpperCase()}${lastName.charAt(0).toUpperCase()}`;
  };
  
  // Check if we're on the planner interface or website builder (sidebar auto-collapses there)
  const isPlannerInterface = location.pathname === '/dashboard/field/dispatcher/interface';
  const isWebsiteBuilder = location.pathname.startsWith('/dashboard/website-builder');
  const hideSidebarTrigger = isPlannerInterface || isWebsiteBuilder;

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        title: t('signOutFailed'),
        description: t('signOutFailedDescription'),
        variant: "destructive"
      });
    }
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({ title: t('allCaughtUp'), description: t('notificationsMarkedRead') });
  };

  const handleNotificationClick = (notification: { id: string; link?: string }) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const toggleLayoutMode = () => {
    setLayoutMode(layoutMode === 'sidebar' ? 'topbar' : 'sidebar');
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'info': return 'bg-info';
      case 'message': return 'bg-accent';
      default: return 'bg-primary';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'sale': return { label: t('sales'), variant: 'default' as const };
      case 'offer': return { label: t('offers'), variant: 'secondary' as const };
      case 'service_order': return { label: t('services'), variant: 'outline' as const };
      case 'task': return { label: t('tasks'), variant: 'destructive' as const };
      default: return { label: t('system'), variant: 'secondary' as const };
    }
  };

  function ThemeOptions() {
    const { setTheme } = useTheme();
    const { t } = useTranslation('dashboard');

    return (
      <>
        <DropdownMenuItem onClick={() => setTheme('light')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
          <Sun className="h-3.5 w-3.5 text-muted-foreground" />
          {t('lightMode')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('dark')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
          <Moon className="h-3.5 w-3.5 text-muted-foreground" />
          {t('darkMode')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme('system')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
          <Monitor className="h-3.5 w-3.5 text-muted-foreground" />
          {t('system')}
        </DropdownMenuItem>
      </>
    );
  }

  return (
    <div className="sticky top-0 z-50">
      <EmailVerificationBanner />
      <TwoFactorReminderBanner />
      <header data-tour="dashboard-header" className="h-14 min-w-0 max-w-full border-b border-border bg-card">
      <div className="flex h-full min-w-0 items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* App Logo — show in topbar mode always, or in sidebar mode when collapsed (desktop only),
              including on the planner interface where the sidebar auto-collapses. Sits next to the
              global search on the left of the header. */}
          {(layoutMode === 'topbar' || (layoutMode === 'sidebar' && sidebarState === 'collapsed' && !isMobile) || (isPlannerInterface && !isMobile)) && companyLogo && (
            <div className="flex items-center gap-3">
              <img
                src={companyLogo}
                alt="Company Logo"
                className="h-10 object-contain"
              />
            </div>
          )}
          
        </div>
        
        {/* Global Search - Centered and responsive */}
        <div className="min-w-0 flex-1 flex items-center justify-center gap-2 px-2 md:px-4">
          <div data-tour="global-search" className="flex-1 max-w-2xl md:max-w-3xl lg:max-w-4xl">
            <GlobalSearch />
          </div>
          <div className="hidden md:flex items-center shrink-0">
            <Button data-tour="quick-create" onClick={() => setCreateOpen(true)} className="h-10 px-3 dark:text-white" variant="default">
              <Plus className="h-4 w-4 mr-2" />
              <span className="text-sm">{t('create')}</span>
            </Button>
          </div>
        </div>
        
        <div className="flex min-w-0 items-center gap-1.5 flex-shrink-0">
          <QuickCreateModal open={createOpen} onOpenChange={setCreateOpen} />

          {/* Active Company picker — only visible in view-all mode (MainAdmin
              with multiple companies). Selecting a company makes Create/Edit/
              Delete on this page target it via the X-Target-Tenant header. */}
          <GlobalCompanyFilter />

          {/* Offline switch near Ask AI — label hidden on small screens to reduce crowding */}
          <Button
            variant={offlineEnabled ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1 relative px-2 lg:px-3"
            onClick={() => setOfflineEnabled(!offlineEnabled)}
            title={offlineEnabled ? "Offline mode enabled" : "Offline mode disabled"}
            aria-label={offlineEnabled ? "Offline mode enabled" : "Offline mode disabled"}
          >
            {offlineEnabled || !online ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="text-xs hidden lg:inline">{offlineEnabled ? "Offline" : "Online"}</span>
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-px-10 leading-none px-1">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Button>

          {/* Ask AI Button - Hidden for now */}
          {false && canAccessAi && aiAssistantAvailable && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAiSidebarOpen(true)}
              className="hidden sm:flex items-center gap-2 h-8 px-2.5 border-primary/30 hover:bg-primary/10 hover:border-primary/50 transition-colors"
              title={tAi('askAiTooltip')}
              data-tour="ask-ai"
            >
              <AiLogoIcon size={16} variant="auto" />
              <span className="text-sm font-medium">{tAi('askAi')}</span>
            </Button>
          )}

          {/* Mobile Ask AI Button - Hidden for now */}
          {false && canAccessAi && aiAssistantAvailable && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setAiSidebarOpen(true)}
              className="sm:hidden h-8 w-8"
              title={tAi('askAiTooltip')}
              data-tour="mobile-ask-ai"
            >
              <AiLogoIcon size={16} variant="auto" />
            </Button>
          )}

          {/* Notifications — right-side drawer with notifications + activity trace */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            data-tour="notifications"
            aria-label={t('notifications') ?? 'Notifications'}
            title={t('notifications') ?? 'Notifications'}
            onClick={() => setNotificationPanelOpen(true)}
          >
            <div className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-px-10 leading-none px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
          </Button>

          <NotificationCenterSheet
            open={notificationPanelOpen}
            onOpenChange={setNotificationPanelOpen}
            notifications={notifications}
            unreadCount={unreadCount}
            loading={loading}
            onMarkAsRead={markAsRead}
            onMarkAllAsRead={markAllAsRead}
            onRefreshNotifications={refetchNotifications}
          />

          <ReportIssueModal
            open={reportIssueOpen}
            onOpenChange={(open) => {
              setReportIssueOpen(open);
              if (!open) setReportIssuePrefill(undefined);
            }}
            prefill={reportIssuePrefill}
          />

          {/* Layout toggle — hidden for now */}
          {/* {!isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleLayoutMode} title={layoutMode === 'sidebar' ? t('switchToTopNavigation') : t('switchToSidebar')}>
              {layoutMode === 'sidebar' ? <LayoutGrid className="h-4 w-4" /> : <Sidebar className="h-4 w-4" />}
            </Button>
          )} */}

          {/* User avatar + dropdown — always visible in header, sits after Help */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tour="user-menu">
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-full p-0 overflow-hidden ring-1 ring-border hover:ring-primary/40 transition-all ml-1"
                aria-label={t('userMenu') || 'User menu'}
                title={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || t('userMenu') || 'User menu'}
              >
                <UserAvatar
                  src={user?.profilePictureUrl}
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  seed={user?.id ?? 'admin'}
                  size="md"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-64 p-1.5">
              <div className="px-2.5 py-2.5">
                <div className="flex items-center gap-3">
                  <UserAvatar
                    src={user?.profilePictureUrl}
                    name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    seed={user?.id ?? 'admin'}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-foreground leading-tight truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={() => navigate('/dashboard/profile')} className="text-xs gap-2 px-2.5 py-2 rounded-md cursor-pointer">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                {t('profile') || 'Profile'}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-xs gap-2 px-2.5 py-2 rounded-md cursor-pointer">
                <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startTour} className="text-xs gap-2 px-2.5 py-2 rounded-md cursor-pointer">
                <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />
                {tOnboarding('tour.replayTour')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuLabel className="px-2.5 pt-1 pb-0.5 text-px-10 font-medium uppercase tracking-wider text-muted-foreground/70">{t('theme')}</DropdownMenuLabel>
              <ThemeOptions />
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={handleSignOut} className="text-xs gap-2 px-2.5 py-2 rounded-md text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="h-3.5 w-3.5" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* AI Assistant Sidebar */}
      {canAccessAi && (
        <AiAssistantSidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
      )}
      </header>
    </div>
  );
}
