import { 
  Users, 
  CheckSquare, 
  Home,
  Settings,
  Building,
  Building2,
  ArrowLeft,
  Package,
  Calendar,
  TrendingUp,
  Menu,
  Wrench,
  BarChart3,
  CalendarDays,
  ClipboardList,
  Boxes,
  Database,
  ChevronDown,
  ChevronRight,
  User,
  LogOut,
  HelpCircle,
  Search,
  Plus,
  Bell,
  Sun,
  Moon,
  Languages,
  Clock,
  Folder,
  Sparkles
} from "lucide-react";
import { AiAssistantSidebar } from "@/components/ai-assistant/AiAssistantSidebar";
import { AiLogoIcon } from "@/components/ai-assistant/AiLogoIcon";
import techBackground from "@/assets/tech-background.jpg";
import lightTechBackground from "/files-uploads/acbdf037-abea-46d8-b7e4-78b3c6dec4ca.png";
import { useLayoutModeContext } from '@/hooks/useLayoutMode';
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { preloadDashboard, preloadSupport } from "@/shared/prefetch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import { useState, useEffect, useMemo } from "react";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// Building2 already imported above
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { GlobalSearchModal } from "@/components/search/GlobalSearchModal";
import { QuickCreateModal } from "@/components/ui/QuickCreateModal";
import { loadSidebarConfig, seedSidebarDefaultsIfEmpty, isHrEnabledForCurrentTenant } from '@/modules/dashboard/services/sidebar.service';
import { ICON_REGISTRY, IconName } from '@/modules/dashboard/components/sidebarIcons';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useNotifications } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Loader2, Settings2 } from "lucide-react";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule } from "@/types/permissions";
import { useMobileSidebarConfig, WIDTH_MAP, ANIMATION_DURATIONS, FONT_SIZE_MAP, ICON_SHAPE_MAP, ITEM_STYLE_CLASSES } from "@/hooks/useMobileSidebarConfig";
import { MobileSidebarSettings } from "@/components/navigation/MobileSidebarSettings";
import { useSidebarThemeApply } from "@/hooks/useSidebarThemeApply";
import { TenantSwitcher } from "@/components/TenantSwitcher";
import { GlobalCompanyFilter } from "@/components/CompanyFilter";
import { useOffline } from "@/contexts/OfflineContext";
import { useAiAssistantAvailable } from "@/hooks/useAiAssistantAvailable";
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/user-avatar";

// Map sidebar item titles to permission modules for access control
const SIDEBAR_PERMISSION_MAP: Record<string, PermissionModule> = {
  // Workspace
  'articles': 'articles',
  'contacts': 'contacts',
  'installations': 'installations',
  // CRM
  'offers': 'offers',
  'sales': 'sales',
  'sales-offers': 'sales',
  'time-expenses': 'time_tracking',
  'expenses': 'expenses',
  'deals': 'offers',
  // Service - dispatches and dispatcher depend on service_orders access
  'service orders': 'service_orders',
  'service-orders': 'service_orders',
  'dispatches': 'service_orders',
  'dispatcher': 'service_orders',
  'planner': 'service_orders',
  'field': 'service_orders',
  'inventory-services': 'articles',
  // System
  'settings': 'settings',
  'users': 'users',
  'roles': 'roles',
  'logs': 'audit_logs',
  'system-logs': 'audit_logs',
  'documentation': 'documents',
  'documents': 'documents',
  'dynamic-forms': 'settings',
  // Analytics & Communication
  'analytics': 'sales',
  'communication': 'contacts',
  'calendar': 'contacts',
  'tasks': 'contacts',
  'automation': 'settings',
  'workflow': 'settings',
  'notifications': 'settings',
  'lookups': 'settings',
  'external': 'external_endpoints',
  // Purchases
  'purchases': 'purchases',
  'purchase-orders': 'purchases',
  'goods-receipts': 'purchases',
  'supplier-invoices': 'purchases',
  // HR
  'hr': 'hr',
  'employees': 'hr',
  'attendance': 'hr',
  'payroll': 'hr',
  'leaves': 'hr',
  'reports': 'hr',
  'departments': 'hr',
};

export function TopNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { hasPermission, isMainAdmin, isLoading: permissionsLoading } = usePermissions();
  const { enabled: offlineEnabled, pendingCount, setEnabled: setOfflineEnabled } = useOffline();
  const aiAssistantAvailable = useAiAssistantAvailable();
  const { user, logout } = useAuth();
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User';
  
  
  // Check if user has permission to view a sidebar item
  const canViewItem = (itemTitle: string): boolean => {
    // MainAdmin always has access to everything
    if (isMainAdmin) return true;
    
    // While permissions are loading, show items (will re-render when loaded)
    if (permissionsLoading) return true;
    
    // Map the item title to a permission module
    const normalizedTitle = itemTitle.toLowerCase().replace(/_/g, '-');
    const permissionModule = SIDEBAR_PERMISSION_MAP[normalizedTitle];
    
    // If no mapping exists, allow access (unconfigured items are shown)
    if (!permissionModule) return true;
    
    // HR module: show for everyone EXCEPT krossier tenant (bypass permission check)
    if (permissionModule === 'hr') return true;
    
    // Check if user has read permission for this module
    return hasPermission(permissionModule, 'read');
  };
  
  // Check AI Assistant permission
  const canAccessAi = isMainAdmin || hasPermission('ai_assistant', 'read');
  
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(true);
  const [isCrmOpen, setIsCrmOpen] = useState(true);
  const [isServiceOpen, setIsServiceOpen] = useState(true);
  const [isSystemOpen, setIsSystemOpen] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isQuickCreateModalOpen, setIsQuickCreateModalOpen] = useState(false);
  const [isAiSidebarOpen, setIsAiSidebarOpen] = useState(false);
  const [showSidebarSettings, setShowSidebarSettings] = useState(false);
  const [configuredItems, setConfiguredItems] = useState<import('@/modules/dashboard/services/sidebar.service').SidebarItemConfig[]>([]);
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>({});
  const companyLogo = useCompanyLogo();
  const { config: sidebarConfig, updateConfig: updateSidebarConfig, resetConfig: resetSidebarConfig } = useMobileSidebarConfig();

  // Apply sidebar theme CSS variable overrides
  useSidebarThemeApply(sidebarConfig);

  // Use dynamic notifications with real-time polling
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead, hasNewNotifications, clearNewNotificationsFlag } = useNotifications();

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'info': return 'bg-primary';
      case 'message': return 'bg-secondary';
      default: return 'bg-primary';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'sale': return { label: t('dashboard:sales'), variant: 'default' as const };
      case 'offer': return { label: t('dashboard:offers'), variant: 'secondary' as const };
      case 'service_order': return { label: t('dashboard:services'), variant: 'outline' as const };
      case 'task': return { label: t('tasks'), variant: 'destructive' as const };
      default: return { label: t('system'), variant: 'secondary' as const };
    }
  };

  const handleNotificationClick = (notification: { id: string; link?: string }) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Load sidebar items from service
  useEffect(() => {
    // Clear cache and force reload of all items to pick up updated titles
    localStorage.removeItem('app-sidebar-config');
    seedSidebarDefaultsIfEmpty(); // This will now seed all unified items with updated titles
    const items = loadSidebarConfig() || [];
    setConfiguredItems(items);
  }, []);

  // Keyboard shortcut: Cmd/Ctrl+K opens search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Company logo is now managed by useCompanyLogo hook

  const resolveTitle = (key: string) => {
    if (!key) return key;

    // Handle specific titles with proper translations
    if (key === 'service orders' || key === 'service-orders') return t('service orders');
    if (key === 'sales' || key === 'sales-offers') return t('sales');
    // Keep Projects only as CRM sub-itdem; parent is Tasks
    if (key === 'todo') return t('projects');
    if (key === 'time-expenses') return t('time-expenses');

    const isLikelyRaw = (val: any) => {
      if (typeof val !== 'string') return false;
      const v = val.trim();
      return v === key || v === `${key}.title`;
    };

    const direct = t(key);
    if (typeof direct === 'string' && direct.trim() !== '' && !isLikelyRaw(direct)) return direct;
    if (typeof direct === 'object' && direct && 'title' in direct) {
      // @ts-ignore
      const maybe = direct.title;
      if (typeof maybe === 'string' && maybe.trim() !== '' && !isLikelyRaw(maybe)) return maybe;
    }

    if (key.endsWith('.title')) {
      const base = key.replace(/\.title$/, '');
      const nested = t(`${base}.title`);
      if (typeof nested === 'string' && nested.trim() !== '' && !isLikelyRaw(nested)) return nested;
      const alt = t(base);
      if (typeof alt === 'string' && alt.trim() !== '' && !isLikelyRaw(alt)) return alt;
      if (typeof alt === 'object' && alt && 'title' in alt) {
        // @ts-ignore
        const maybe = alt.title;
        if (typeof maybe === 'string' && maybe.trim() !== '' && !isLikelyRaw(maybe)) return maybe;
      }
    }

    try {
      const nested = t(`${key}.title`);
      if (typeof nested === 'string' && nested.trim() !== '' && !isLikelyRaw(nested)) return nested;
      if (typeof nested === 'object' && nested && 'title' in nested) {
        // @ts-ignore
        const maybe = nested.title;
        if (typeof maybe === 'string' && maybe.trim() !== '' && !isLikelyRaw(maybe)) return maybe;
      }
    } catch (_) {}

    // Capitalize first letter for display
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
  };

  // Sub-item title resolver - matches desktop AppSidebar's resolveSubItemTitle exactly
  const resolveSubItemTitle = (rawTitle: string) => {
    if (!rawTitle) return rawTitle;
    const normalized = rawTitle.trim().toLowerCase();
    const map: Record<string, string> = {
      // Contacts dropdown
      'all contacts': 'contacts.filters.all_contacts',
      'contacts': 'contacts.title',
      'favorites': 'contacts.filters.favorites_only',
      'favourites': 'contacts.filters.favorites_only',
      'person': 'contacts.filters.person',
      'persons': 'contacts.filters.person',
      'individual': 'contacts.filters.person',
      'company': 'contacts.filters.company',
      'companies': 'contacts.filters.company',
      // Dashboard dropdown
      'dashboard builder': 'sidebarSub.dashboardBuilder',
      'dashboard_builder': 'sidebarSub.dashboardBuilder',
      'crm dashboard': 'sidebarSub.crmDashboard',
      'crm_dashboard': 'sidebarSub.crmDashboard',
      'field dashboard': 'sidebarSub.fieldDashboard',
      'field_dashboard': 'sidebarSub.fieldDashboard',
      'reporting': 'sidebarSub.reporting',
      'sales_dashboard': 'sidebarSub.salesDashboard',
      'service_dashboard': 'sidebarSub.serviceDashboard',
      'finance_dashboard': 'sidebarSub.financeDashboard',
      'hr_dashboard': 'sidebarSub.hrDashboard',
      'purchase_dashboard': 'sidebarSub.purchaseDashboard',
      // Sales dropdown
      'offers': 'offers',
      'orders': 'orders',
      // Projects dropdown
      'daily tasks': 'sidebarSub.dailyTasks',
      'projects': 'sidebarSub.projects',
      'reports': 'sidebarSub.reports',
      'departments': 'sidebarSub.departments',
      // Service dropdown
      'service orders': 'sidebarSub.serviceOrders',
      'dispatches': 'sidebarSub.dispatches',
      'installations': 'sidebarSub.installations',
    };

    const key = map[normalized];
    if (key) return t(key);

    const direct = t(normalized);
    if (typeof direct === 'string' && direct !== normalized) return direct;

    const dashed = normalized.replace(/\s+/g, '-');
    const dashedTr = t(dashed);
    if (typeof dashedTr === 'string' && dashedTr !== dashed) return dashedTr;

    return rawTitle;
  };

  const resolveDescription = (key: string, fallback?: string) => {
    if (!key) return fallback ?? '';
    
    const isLikelyRaw = (val: any) => {
      if (typeof val !== 'string') return false;
      const v = val.trim();
      return v === key || v === `${key}.description` || v === `${key}.title`;
    };

    const direct = t(key);
    if (typeof direct === 'object' && direct && 'description' in direct) {
      // @ts-ignore
      const maybe = direct.description;
      if (typeof maybe === 'string' && maybe.trim() !== '' && !isLikelyRaw(maybe)) return maybe;
    }

    try {
      const nested = t(`${key}.description`);
      if (typeof nested === 'string' && nested.trim() !== '' && !isLikelyRaw(nested)) return nested;
    } catch (_) {}

    return fallback ?? '';
  };

  const { isMobile } = useLayoutModeContext();
  const currentPath = location.pathname;

  const isActive = (path: string) => {
    // Exact match
    if (currentPath === path) return true;
    
    // For paths that are prefixes of the current path, only match if no other configured item
    // has a more specific URL that matches. This prevents parent items (like /dashboard/settings)
    // from being active when a child item (like /dashboard/settings/dynamic-forms) is active.
    if (currentPath.startsWith(path + '/')) {
      // Check if any other item has a more specific matching URL
      const moreSpecific = configuredItems.find(item => {
        // Skip the current item being checked
        if (item.url === path) return false;
        // Only check active items
        if (!item.active) return false;
        // Check if this item's URL is more specific and matches
        if (item.url.startsWith(path + '/') && currentPath.startsWith(item.url)) {
          return true;
        }
        // Also check dropdown items
        if (item.dropdown) {
          return item.dropdown.some((sub: { url: string }) => 
            sub.url.startsWith(path + '/') && currentPath.startsWith(sub.url)
          );
        }
        return false;
      });
      return !moreSpecific;
    }
    return false;
  };

  const isDropdownActive = (dropdown: Array<{ url: string }>) => {
    return dropdown.some(item => isActive(item.url));
  };
  
  const { layoutMode } = useLayoutModeContext();

  // Get workspace and system items from configured items - filtered by permissions
  const workspaceItems = useMemo(() => configuredItems
    .filter(i => i.group === 'workspace' && i.active && canViewItem(i.title))
    .map(i => {
      const iconName = i.icon as IconName | undefined;
      let IconComp = iconName && (ICON_REGISTRY as any)[iconName] ? (ICON_REGISTRY as any)[iconName] : Home;
      return { 
        ...i,
        icon: IconComp,
        dropdown: i.dropdown || undefined
      };
    }), [configuredItems, isMainAdmin, permissionsLoading]);

  const crmItems = useMemo(() => configuredItems
    .filter(i => i.group === 'crm' && i.active && canViewItem(i.title))
    .map(i => {
      const iconName = i.icon as IconName | undefined;
      let IconComp = iconName && (ICON_REGISTRY as any)[iconName] ? (ICON_REGISTRY as any)[iconName] : TrendingUp;
      return { 
        ...i,
        icon: IconComp,
        dropdown: i.dropdown || undefined
      };
    }), [configuredItems, isMainAdmin, permissionsLoading]);

  const serviceItems = useMemo(() => configuredItems
    .filter(i => i.group === 'service' && i.active && canViewItem(i.title))
    .map(i => {
      const iconName = i.icon as IconName | undefined;
      let IconComp = iconName && (ICON_REGISTRY as any)[iconName] ? (ICON_REGISTRY as any)[iconName] : Wrench;
      return { 
        ...i,
        icon: IconComp,
        dropdown: i.dropdown || undefined
      };
    }), [configuredItems, isMainAdmin, permissionsLoading]);

  const systemItems = useMemo(() => configuredItems
    .filter(i => i.group === 'system' && i.active && canViewItem(i.title))
    .map(i => {
      const iconName = i.icon as IconName | undefined;
      let IconComp = iconName && (ICON_REGISTRY as any)[iconName] ? (ICON_REGISTRY as any)[iconName] : Settings;
      return { 
        ...i,
        icon: IconComp,
        dropdown: i.dropdown || undefined
      };
    }), [configuredItems, isMainAdmin, permissionsLoading]);

  const toggleDropdown = (itemId: string) => {
    setDropdownStates(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // Render mobile navigation item - matches desktop AppSidebar exactly
  const renderMobileNavigationItem = (item: any) => {
    const hasDropdown = item.dropdown && item.dropdown.length > 0;
    const isDropdownOpen = dropdownStates[item.id] || false;
    const itemIsActive = hasDropdown ? isDropdownActive(item.dropdown) : isActive(item.url);

    // Icon color: use item override or primary brand color (matches desktop)
    const iconColorStyle: React.CSSProperties = item.iconColor
      ? { color: item.iconColor.startsWith('#') ? item.iconColor : `hsl(${item.iconColor})` }
      : { color: 'hsl(var(--sidebar-primary))' };

    if (hasDropdown) {
      return (
        <Collapsible key={item.id || item.title} open={isDropdownOpen} onOpenChange={() => toggleDropdown(item.id)}>
          <CollapsibleTrigger
            className={`group/navitem transition-all duration-150 ease-out h-8 rounded-lg gap-2 px-2 py-1.5 w-full flex items-center text-sm font-bold outline-none ${
              itemIsActive
                ? 'bg-sidebar-accent text-foreground font-bold shadow-sm'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/[0.06] hover:text-foreground'
            }`}
          >
            <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200" style={iconColorStyle} />
            <span className="flex-1 min-w-0 text-left capitalize truncate">
              {resolveTitle(item.title)}
            </span>
            <ChevronRight className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ease-out ${isDropdownOpen ? 'rotate-90' : ''} text-muted-foreground/40`} />
          </CollapsibleTrigger>
          <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
            <div className="mt-0.5 ml-[15px] pl-3 border-l border-sidebar-border/30">
              {item.dropdown.map((subItem: any, idx: number) => {
                const isLast = idx === item.dropdown.length - 1;
                const subActive = isActive(subItem.url);
                return (
                  <div key={subItem.url} className={`relative mb-0 ${isLast ? 'sidebar-tree-last' : ''}`}>
                    <div className={`absolute -left-[15.5px] top-1/2 -translate-y-1/2 w-[10px] h-px transition-colors duration-150 ${subActive ? 'bg-sidebar-primary/50' : 'bg-sidebar-border/30'}`} />
                    <div className={`absolute -left-[15.5px] top-1/2 -translate-y-1/2 translate-x-[9px] w-[3px] h-[3px] rounded-full transition-colors duration-150 ${subActive ? 'bg-sidebar-primary' : 'bg-sidebar-border/50'}`} />
                    <NavLink
                      to={subItem.url}
                      end={subItem.url === "/dashboard" || !subItem.url.includes('?')}
                      onClick={() => setIsMobileSidebarOpen(false)}
                      className={`flex items-center gap-2 h-7 px-2 py-1 transition-all duration-150 ease-out cursor-pointer rounded-md text-sm w-full ${
                        subActive
                          ? 'text-foreground font-bold bg-sidebar-accent/60'
                          : 'text-sidebar-foreground/50 font-bold hover:text-foreground hover:bg-sidebar-foreground/[0.05]'
                      }`}
                    >
                      <span>{resolveSubItemTitle(subItem.title)}</span>
                    </NavLink>
                  </div>
                );
              })}
            </div>
          </CollapsibleContent>
        </Collapsible>
      );
    }

    return (
      <NavLink
        key={item.id || item.title}
        to={item.url}
        end={item.url === "/dashboard"}
        onClick={() => setIsMobileSidebarOpen(false)}
        className={() =>
          `group/navitem flex items-center text-sm gap-2 px-2 py-1.5 outline-none rounded-lg transition-all duration-150 h-8 ${
            isActive(item.url)
              ? 'bg-sidebar-accent text-foreground font-bold shadow-sm'
              : 'font-bold text-sidebar-foreground/70 hover:bg-sidebar-foreground/[0.06] hover:text-foreground'
          }`
        }
      >
        <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200" style={iconColorStyle} />
        <span className="flex-1 min-w-0 text-left capitalize truncate">
          {resolveTitle(item.title)}
        </span>
      </NavLink>
    );
  };

  // Sheet width from config
  const sheetWidth = WIDTH_MAP[sidebarConfig.width];

  if (isMobile) {
    // Mobile view with sidebar opener for all pages
    return (
      <div className="bg-card border-b border-border shadow-sm">
        <div className="px-4 py-3 space-y-3">
          <div className="flex items-center gap-3">
            <Sheet open={isMobileSidebarOpen} onOpenChange={(open) => {
              setIsMobileSidebarOpen(open);
              if (!open) setShowSidebarSettings(false);
            }}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-primary/10"
                  data-tour="mobile-menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent 
                 side="left" 
                 className={`${sheetWidth} p-0 bg-sidebar border-sidebar-border`}
               >
                {showSidebarSettings ? (
                  <MobileSidebarSettings
                    config={sidebarConfig}
                    onUpdate={updateSidebarConfig}
                    onReset={resetSidebarConfig}
                    onClose={() => setShowSidebarSettings(false)}
                  />
                ) : (
                <div className="h-full flex flex-col bg-sidebar">
                   {/* Brand Header - matches desktop exactly */}
                   <div className="flex-shrink-0 h-[52px] px-5 flex items-center border-b border-sidebar-border/40">
                     {companyLogo ? (
                       <img 
                         src={companyLogo} 
                         alt={t('sidebarCompanyLogoAlt')} 
                         className="h-14 object-contain"
                       />
                     ) : (
                       <Building2 className="h-5 w-5 text-foreground/80" />
                     )}
                   </div>

                    {/* User Profile */}
                    <div className="flex-shrink-0 px-5 pt-5 pb-3 border-b border-sidebar-border/40">
                     <div className="flex items-center gap-2.5">
                       <UserAvatar
                         src={user?.profilePictureUrl}
                         name={fullName}
                         seed={user?.id ?? 'user'}
                         size="md"
                       />
                       <div className="min-w-0">
                         <p className="text-[13px] font-medium text-sidebar-foreground leading-tight truncate">
                           {fullName}
                         </p>
                       </div>
                     </div>
                   </div>

                   {/* Tenant Switcher — only visible for MainAdmin with multiple companies */}
                   <div className="px-3 pt-2">
                     <TenantSwitcher />
                   </div>

                   <div className="px-3 pt-3 pb-1">
                     <button
                       onClick={() => { setIsMobileSidebarOpen(false); setIsSearchModalOpen(true); }}
                       className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-sidebar-border/40 bg-sidebar-foreground/[0.02] hover:bg-sidebar-foreground/[0.05] text-muted-foreground/50 hover:text-muted-foreground/70 transition-all duration-150 text-[12px]"
                     >
                       <Search className="h-3.5 w-3.5" />
                       <span className="flex-1 text-left">{t('sidebar.search', 'Search...')}</span>
                     </button>
                   </div>

                   {/* Scrollable Navigation Content - matches desktop structure */}
                   <ScrollArea className="flex-1 h-[calc(100vh-120px)]">
                     <div className="px-3 py-2">
                       {/* Workspace Section */}
                       <Collapsible open={isWorkspaceOpen} onOpenChange={() => setIsWorkspaceOpen(!isWorkspaceOpen)}>
                         <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 mb-1 text-muted-foreground/35 hover:text-muted-foreground/55 transition-all duration-150 ease-out group rounded-md hover:bg-sidebar-foreground/[0.03]">
                           <span className="text-[11px] font-bold uppercase tracking-[0.1em] select-none">{t('workspace')}</span>
                           <ChevronDown className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isWorkspaceOpen ? '' : '-rotate-90'}`} />
                         </CollapsibleTrigger>
                         <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                           <div className="space-y-0.5">
                             {workspaceItems.map(renderMobileNavigationItem)}
                           </div>
                         </CollapsibleContent>
                       </Collapsible>

                       {/* CRM Section */}
                       <Collapsible open={isCrmOpen} onOpenChange={() => setIsCrmOpen(!isCrmOpen)} className="mt-4">
                         <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 mb-1 text-muted-foreground/35 hover:text-muted-foreground/55 transition-all duration-150 ease-out group rounded-md hover:bg-sidebar-foreground/[0.03]">
                           <span className="text-[11px] font-bold uppercase tracking-[0.1em] select-none">{t('crm')}</span>
                           <ChevronDown className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isCrmOpen ? '' : '-rotate-90'}`} />
                         </CollapsibleTrigger>
                         <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                           <div className="space-y-0.5">
                             {crmItems.map(renderMobileNavigationItem)}
                           </div>
                         </CollapsibleContent>
                       </Collapsible>

                       {/* Service Section */}
                       <Collapsible open={isServiceOpen} onOpenChange={() => setIsServiceOpen(!isServiceOpen)} className="mt-4">
                         <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 mb-1 text-muted-foreground/35 hover:text-muted-foreground/55 transition-all duration-150 ease-out group rounded-md hover:bg-sidebar-foreground/[0.03]">
                           <span className="text-[11px] font-bold uppercase tracking-[0.1em] select-none">{t('service')}</span>
                           <ChevronDown className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isServiceOpen ? '' : '-rotate-90'}`} />
                         </CollapsibleTrigger>
                         <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                           <div className="space-y-0.5">
                             {serviceItems.map(renderMobileNavigationItem)}
                           </div>
                         </CollapsibleContent>
                       </Collapsible>

                       {/* System Section */}
                       <Collapsible open={isSystemOpen} onOpenChange={() => setIsSystemOpen(!isSystemOpen)} className="mt-4">
                         <CollapsibleTrigger className="flex items-center justify-between w-full px-2 py-1.5 mb-1 text-muted-foreground/35 hover:text-muted-foreground/55 transition-all duration-150 ease-out group rounded-md hover:bg-sidebar-foreground/[0.03]">
                           <span className="text-[11px] font-bold uppercase tracking-[0.1em] select-none">{t('system')}</span>
                           <ChevronDown className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isSystemOpen ? '' : '-rotate-90'}`} />
                         </CollapsibleTrigger>
                         <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
                           <div className="space-y-0.5">
                             {systemItems.map(renderMobileNavigationItem)}
                           </div>
                         </CollapsibleContent>
                       </Collapsible>
                     </div>
                   </ScrollArea>
                 </div>
                )}
              </SheetContent>
            </Sheet>
            
            {/* Search Input - Opens Global Search Modal */}
            <div 
              className="flex-1 mx-2"
              onClick={() => setIsSearchModalOpen(true)}
            >
              <div className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-muted rounded-lg cursor-pointer transition-colors border border-border/50">
                <Search className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{t('search')}...</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Tenant switcher — visible to MainAdmin when multiple companies exist */}
              <div className="hidden md:block min-w-[180px] max-w-[240px]">
                <TenantSwitcher />
              </div>
              {/* Company filter — appears next to action buttons in view-all mode.
                  Hidden on phones so the topbar cluster never clips at narrow widths;
                  it stays reachable in the hamburger menu (same control, w-full). */}
              <div className="hidden sm:block">
                <GlobalCompanyFilter />
              </div>
              <Button
                variant={offlineEnabled ? "default" : "outline"}
                size="sm"
                className="h-8 text-xs px-2 relative"
                onClick={() => setOfflineEnabled(!offlineEnabled)}
                title="Toggle offline mode"
              >
                {offlineEnabled ? "Offline" : "Online"}
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none px-1">
                    {pendingCount > 99 ? '99+' : pendingCount}
                  </span>
                )}
              </Button>
              {/* AI Assistant, Support, Notifications and User Section - Moved to right */}
              <div className="flex items-center gap-2">
              {/* AI Assistant - Only show if user has AI permission */}
              {canAccessAi && aiAssistantAvailable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-primary/10"
                  onClick={() => setIsAiSidebarOpen(true)}
                  data-tour="mobile-ai-assistant"
                  title={t('aiAssistant:askAiTooltip')}
                >
                  <AiLogoIcon size={18} variant="auto" />
                </Button>
              )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  className="p-2 hover:bg-primary/10 hidden sm:flex"
                  data-tour="mobile-help"
                >
                  <HelpCircle className="h-4 w-4" />
                </Button>
                
                <Popover onOpenChange={(open) => open && clearNewNotificationsFlag()}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`p-2 hover:bg-primary/10 relative ${hasNewNotifications ? 'animate-pulse' : ''}`}
                      data-tour="mobile-notifications"
                    >
                      <Bell className={`h-4 w-4 ${hasNewNotifications ? 'text-primary' : ''}`} />
                      {unreadCount > 0 && (
                        <span className={`absolute -top-1 -right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] leading-none px-1 ${hasNewNotifications ? 'animate-bounce' : ''}`}>
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-80 p-0 bg-background border border-border shadow-xl rounded-xl z-[100]">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm">{t('notifications')}</h3>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-muted-foreground hover:text-foreground text-xs h-auto p-1" 
                          onClick={() => markAllAsRead()}
                          disabled={unreadCount === 0}
                        >
                          {t('markAllAsRead')}
                        </Button>
                      </div>
                    </div>
                    <ScrollArea className="max-h-72">
                      {notificationsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                        </div>
                      ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                          <Bell className="h-8 w-8 mb-2 opacity-50" />
                          <p className="text-sm">{t('noNotifications')}</p>
                        </div>
                      ) : (
                        <ul className="divide-y divide-border">
                          {notifications.slice(0, 6).map((n) => {
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
                      <Button variant="secondary" className="w-full text-sm" onClick={() => navigate('/dashboard/notifications')}>
                        {t('viewAllNotifications')}
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="p-1" data-tour="mobile-user-menu">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src="/placeholder-user.jpg" />
                        <AvatarFallback className="text-xs">U</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border border-border/50 shadow-xl rounded-xl p-2 z-[100]">
                    <DropdownMenuItem onSelect={() => navigate('/dashboard/settings/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>{t('profile')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onSelect={async () => {
                        try { await logout(); } finally { navigate('/login', { replace: true }); }
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{t('dashboard:signOut')}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <GlobalSearchModal 
          isOpen={isSearchModalOpen} 
          onClose={() => setIsSearchModalOpen(false)} 
        />
        
        <QuickCreateModal 
          open={isQuickCreateModalOpen} 
          onOpenChange={setIsQuickCreateModalOpen} 
        />
        
        {canAccessAi && (
          <AiAssistantSidebar 
            isOpen={isAiSidebarOpen} 
            onClose={() => setIsAiSidebarOpen(false)} 
          />
        )}
      </div>
    );
  }

  // Desktop header navigation
  return (
    <div className="bg-card border-b border-border shadow-sm">
      <div className="px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6 min-w-0">
          <nav className="flex items-center gap-0 overflow-x-auto">{/* Reduced gap from gap-1 to gap-0 */}
            {[...workspaceItems, ...crmItems, ...serviceItems].map((item: any) => {
              const active = item.dropdown ? isDropdownActive(item.dropdown) : isActive(item.url);
              if (item.dropdown && item.dropdown.length > 0) {
                return (
                  <DropdownMenu key={item.title}>
                    <DropdownMenuTrigger asChild>
                      <div className={`relative flex items-center gap-2 px-4 py-3 cursor-pointer transition-all ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                        <span className="text-base font-bold">{resolveTitle(item.title)}</span>
                        <ChevronDown className={`h-4 w-4 ${active ? 'text-primary' : 'text-muted-foreground'}`} />
                        {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="min-w-48 py-2 bg-background border border-border">
                      {item.dropdown.map((sub: any, index: number) => (
                        <DropdownMenuItem key={sub.url} asChild>
                          <NavLink
                            to={sub.url}
                            end={sub.url === "/dashboard"}
                            className={({ isActive }) => 
                              `block px-4 py-2.5 text-sm font-bold transition-colors ${
                                isActive 
                                  ? 'text-primary' 
                                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                              }`
                            }
                          >
                            {resolveSubItemTitle(sub.title)}
                          </NavLink>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                );
              }
              return (
                <div key={item.title} className={`relative transition-all ${active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  <NavLink to={item.url} end={item.url === "/dashboard"} className="flex items-center px-4 py-3">
                    <span className="text-base font-bold">{resolveTitle(item.title)}</span>
                  </NavLink>
                  {active && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                </div>
              );
            })}
            {/* System items grouped in a single dropdown */}
            {systemItems.length > 0 && (() => {
              const anySystemActive = systemItems.some((item: any) => 
                item.dropdown ? isDropdownActive(item.dropdown) : isActive(item.url)
              );
              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className={`relative flex items-center gap-2 px-4 py-3 cursor-pointer transition-all ${anySystemActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                      <span className="text-base font-bold">{t('system')}</span>
                      <ChevronDown className={`h-4 w-4 ${anySystemActive ? 'text-primary' : 'text-muted-foreground'}`} />
                      {anySystemActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="min-w-48 py-2 bg-background border border-border z-50">
                    {systemItems.map((item: any) => {
                      if (item.dropdown && item.dropdown.length > 0) {
                        return item.dropdown.map((sub: any) => (
                          <DropdownMenuItem key={sub.url} asChild>
                            <NavLink
                              to={sub.url}
                              end={sub.url === "/dashboard"}
                              className={({ isActive }) => 
                                `block px-4 py-2.5 text-sm font-bold transition-colors ${
                                  isActive 
                                    ? 'text-primary' 
                                    : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                                }`
                              }
                            >
                              {resolveSubItemTitle(sub.title)}
                            </NavLink>
                          </DropdownMenuItem>
                        ));
                      }
                      return (
                        <DropdownMenuItem key={item.url} asChild>
                          <NavLink
                            to={item.url}
                            end={item.url === "/dashboard"}
                            className={({ isActive }) => 
                              `block px-4 py-2.5 text-sm font-bold transition-colors ${
                                isActive 
                                  ? 'text-primary' 
                                  : 'text-foreground/70 hover:text-foreground hover:bg-muted/50'
                              }`
                            }
                          >
                            {resolveTitle(item.title)}
                          </NavLink>
                        </DropdownMenuItem>
                      );
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })()}
          </nav>
        </div>

        {/* Right side: search + actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground w-56 justify-start px-3"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">{t('search.placeholder', 'Search...')}</span>
            <kbd className="ml-auto pointer-events-none text-[10px] text-muted-foreground/60 border border-border rounded px-1.5 py-0.5">⌘K</kbd>
          </Button>
        </div>
      </div>

      <GlobalSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
      />
    </div>
  );
}