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
import { useState } from 'react';
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
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { useProductTourContext } from "@/contexts/ProductTourContext";
import { AiAssistantSidebar } from "@/components/ai-assistant/AiAssistantSidebar";
import { usePermissions } from "@/hooks/usePermissions";
import ReportIssueModal from "@/components/ReportIssueModal";
import SupportChoiceModal from "@/components/SupportChoiceModal";
import { useOffline } from "@/contexts/OfflineContext";
import { useAiAssistantAvailable } from "@/hooks/useAiAssistantAvailable";
import { GlobalCompanyFilter } from "@/components/CompanyFilter";

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
  const [supportChoiceOpen, setSupportChoiceOpen] = useState(false);
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
  
  // Check AI Assistant permission
  const canAccessAi = isMainAdmin || hasPermission('ai_assistant', 'read');
  
  // Use dynamic notifications
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
  
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
    <header data-tour="dashboard-header" className="h-14 min-w-0 max-w-full overflow-hidden border-b border-border bg-card sticky top-0 z-50">
      <div className="flex h-full min-w-0 items-center justify-between px-4 gap-3">
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* App Logo — show in topbar mode always, or in sidebar mode when collapsed (desktop only) */}
          {(layoutMode === 'topbar' || (layoutMode === 'sidebar' && sidebarState === 'collapsed' && !isMobile)) && companyLogo && (
            <div className="flex items-center gap-3">
              <img 
                src={companyLogo} 
                alt="Company Logo" 
                className="h-14 object-contain"
              />
            </div>
          )}
          
        </div>
        
        {/* Global Search - Centered and responsive */}
        <div className="min-w-0 flex-1 flex justify-center px-2 md:px-4">
          <div data-tour="global-search" className="w-full max-w-2xl md:max-w-3xl lg:max-w-4xl relative">
            <GlobalSearch />
            {/* Quick action on the right side of the search */}
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2 mr-1 hidden md:flex items-center gap-2">
              <Button data-tour="quick-create" onClick={() => setCreateOpen(true)} className="h-10 px-3 dark:text-white" variant="default">
                <Plus className="h-4 w-4 mr-2" />
                <span className="text-sm">{t('create')}</span>
              </Button>
            </div>
          </div>
        </div>
        
        <div className="flex min-w-0 items-center gap-1.5 flex-shrink-0">
          <QuickCreateModal open={createOpen} onOpenChange={setCreateOpen} />

          {/* Active Company picker — only visible in view-all mode (MainAdmin
              with multiple companies). Selecting a company makes Create/Edit/
              Delete on this page target it via the X-Target-Tenant header. */}
          <GlobalCompanyFilter />

          {/* Offline switch near Ask AI */}
          <Button
            variant={offlineEnabled ? "default" : "outline"}
            size="sm"
            className="h-8 gap-1 relative"
            onClick={() => setOfflineEnabled(!offlineEnabled)}
            title={offlineEnabled ? "Offline mode enabled" : "Offline mode disabled"}
          >
            {offlineEnabled || !online ? <WifiOff className="h-3.5 w-3.5" /> : <Wifi className="h-3.5 w-3.5" />}
            <span className="text-xs">{offlineEnabled ? "Offline" : "Online"}</span>
            {pendingCount > 0 && (
              <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none px-1">
                {pendingCount > 99 ? "99+" : pendingCount}
              </span>
            )}
          </Button>
          {/* Ask AI Button - Only show if user has AI permission and network / not offline mode */}
          {canAccessAi && aiAssistantAvailable && (
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

          {/* Mobile Ask AI Button - Only show if user has AI permission and network / not offline mode */}
          {canAccessAi && aiAssistantAvailable && (
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

          {/* Notifications - Dynamic */}
          <Popover>
            <PopoverTrigger asChild data-tour="notifications">
              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('notifications') ?? 'Notifications'} title={t('notifications') ?? 'Notifications'}>
                <div className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none px-1">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </div>
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-96 p-0">
              <div className="p-3 border-b border-border">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{t('notifications')}</div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground text-xs" 
                    onClick={handleMarkAllAsRead}
                    disabled={unreadCount === 0}
                  >
                    {t('markAllAsRead')}
                  </Button>
                </div>
              </div>
              <ScrollArea className="max-h-96">
                {loading ? (
                  <ListSkeleton rows={4} />
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">{t('noNotifications')}</p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {notifications.slice(0, 8).map((n) => {
                      const badge = getCategoryBadge(n.category);
                      return (
                        <li 
                          key={n.id} 
                          className={`p-3 hover:bg-accent/40 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                          onClick={() => handleNotificationClick(n)}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${n.read ? 'bg-muted-foreground/40' : getTypeColor(n.type)}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <Badge variant={badge.variant} className="text-[10px] px-1.5 py-0">
                                  {badge.label}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{n.time}</span>
                              </div>
                              <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </ScrollArea>
              <div className="p-2 border-t border-border">
                <Button variant="secondary" className="w-full" onClick={() => navigate('/dashboard/notifications')}>
                  {t('viewAllNotifications')}
                </Button>
              </div>
            </PopoverContent>
          </Popover>

          {/* Help / Support button */}
          {!isMobile && (
            <Button data-tour="help-button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSupportChoiceOpen(true)} title={t('help') || 'Support'}>
              <HelpCircle className="h-4 w-4" />
            </Button>
          )}
          <SupportChoiceModal
            open={supportChoiceOpen}
            onOpenChange={setSupportChoiceOpen}
            onCreateTicket={() => setReportIssueOpen(true)}
          />
          <ReportIssueModal open={reportIssueOpen} onOpenChange={setReportIssueOpen} />

          {/* Layout toggle */}
          {!isMobile && (
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleLayoutMode} title={layoutMode === 'sidebar' ? t('switchToTopNavigation') : t('switchToSidebar')}>
              {layoutMode === 'sidebar' ? <LayoutGrid className="h-4 w-4" /> : <Sidebar className="h-4 w-4" />}
            </Button>
          )}

          {/* User avatar last — only when sidebar is in topbar mode (sidebar version owns the profile otherwise) */}
          {layoutMode === 'topbar' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild data-tour="user-menu">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full p-0 overflow-hidden">
                <UserAvatar
                  src={user?.profilePictureUrl}
                  name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                  seed={user?.id ?? 'admin'}
                  size="md"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 p-1">
              <div className="px-2.5 py-2">
                <div className="flex items-center gap-2.5">
                  <UserAvatar
                    src={user?.profilePictureUrl}
                    name={`${user?.firstName || ''} ${user?.lastName || ''}`}
                    seed={user?.id ?? 'admin'}
                    size="md"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground leading-tight truncate">{user?.firstName} {user?.lastName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
                <SettingsIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {t('settings')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={startTour} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
                <PlayCircle className="h-3.5 w-3.5 text-muted-foreground" />
                {tOnboarding('tour.replayTour')}
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuLabel className="px-2.5 pt-1 pb-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">{t('theme')}</DropdownMenuLabel>
              <ThemeOptions />
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem onClick={handleSignOut} className="text-xs gap-2 px-2.5 py-1.5 rounded-md text-destructive focus:text-destructive">
                <LogOut className="h-3.5 w-3.5" />
                {t('signOut')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          )}
        </div>
      </div>
      
      {/* AI Assistant Sidebar */}
      {canAccessAi && (
        <AiAssistantSidebar isOpen={aiSidebarOpen} onClose={() => setAiSidebarOpen(false)} />
      )}
    </header>
  );
}
