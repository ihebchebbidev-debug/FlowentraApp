import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useCompanyLogo } from "@/hooks/useCompanyLogo";
import { useDashboards } from '@/modules/dashboard-builder/hooks/useDashboards';
import { 
  Users, 
  CheckSquare, 
  BarChart3,
  Home,
  Settings,
  Building,
  Building2,
  Package,
  Calendar,
  CalendarDays,
  Wrench,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Clock,
  Folder,
  Database,
  Plus,
  Star,
  Search,
  Command,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/hooks/useTheme";
import { usePermissions } from "@/hooks/usePermissions";
import { PermissionModule } from "@/types/permissions";
import techBackground from "@/assets/tech-background.jpg";
import lightTechBackground from "/files-uploads/acbdf037-abea-46d8-b7e4-78b3c6dec4ca.png";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarGroupAction,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  useSidebar,
} from "@/components/ui/sidebar";
import { useProductTourContext } from "@/contexts/ProductTourContext";
import { Button } from '@/components/ui/button';
import { useAuth } from "@/contexts/AuthContext";
import { UserAvatar } from "@/components/ui/user-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, ChevronsUpDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import SidebarSettingsModal from './SidebarSettingsModal';
import { loadSidebarConfig, seedSidebarDefaultsIfEmpty, resetSidebarConfig, ensureHrDropdownItems, isHrEnabledForCurrentTenant } from '../services/sidebar.service';
import { useToast } from '@/hooks/use-toast';
import { ICON_REGISTRY, IconName } from './sidebarIcons';
import type { SidebarItemConfig } from '../services/sidebar.service';
import { mergeMissingDefaults } from '../services/sidebar.service';
import { usePlugins } from '@/modules/shared/plugins';
import { isSidebarItemEnabled, getSidebarPluginNameI18nKey } from '../utils/sidebarPluginGating';

// ——— Favorites persistence ———
const FAVORITES_KEY = 'sidebar-favorites';
function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveFavorites(favs: string[]) {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

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
  'email-calendar': 'contacts',
  'emails': 'contacts',
  'tasks': 'contacts',
  'automation': 'settings',
  'workflow': 'settings',
  'notifications': 'settings',
  'lookups': 'settings',
  'website-builder': 'settings',
  // HR
  'hr': 'hr',
  'employees': 'hr',
  'attendance': 'hr',
  'payroll': 'hr',
  'reports': 'hr',
  'departments': 'hr',
  'external': 'external_endpoints',
  // Purchases
  'purchases': 'purchases',
  'purchase-orders': 'purchases',
  'goods-receipts': 'purchases',
  'supplier-invoices': 'purchases',
};

export function AppSidebar() {
  const companyLogo = useCompanyLogo();
  const { state, toggleSidebar } = useSidebar();
  const { t } = useTranslation();
  const { t: tDash } = useTranslation('dashboard');
  const { hasPermission, isMainAdmin, isLoading: permissionsLoading } = usePermissions();
  const { dashboards } = useDashboards();

  // Favorites state
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);
  const toggleFavorite = useCallback((url: string) => {
    setFavorites(prev => {
      const next = prev.includes(url) ? prev.filter(f => f !== url) : [...prev, url];
      saveFavorites(next);
      return next;
    });
  }, []);

  // Keyboard navigation state
  const navContainerRef = useRef<HTMLDivElement>(null);
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Plugin-registry gating (default-on; gated items hide when disabled per tenant)
  const { isEnabled: isPluginEnabled } = usePlugins();

  // Check if user has permission to view a sidebar item
  const canViewItem = (itemTitle: string): boolean => {
    // Plugin gate runs first — if the owning plugin is disabled, hide the item
    if (!isSidebarItemEnabled(itemTitle, isPluginEnabled)) return false;
    if (isMainAdmin) return true;
    if (permissionsLoading) return true;
    const normalizedTitle = itemTitle.toLowerCase().replace(/_/g, '-');
    const permissionModule = SIDEBAR_PERMISSION_MAP[normalizedTitle];
    if (!permissionModule) return true;
    // HR module: show for everyone EXCEPT krossier tenant (bypass permission check)
    if (permissionModule === 'hr') return true;
    return hasPermission(permissionModule, 'read');
  };

  const resolveTitle = (key: string) => {
    if (!key) return key;
    if (key === 'service orders' || key === 'service-orders') return t('services');
    if (key === 'sales' || key === 'sales-offers') return t('sales');
    // Parent shows as Projects
    if (key === 'todo') return t('projects');
    if (key === 'time-expenses') return t('timeExpenses');
    if (key === 'external') {
      const ext = t('external.title');
      if (typeof ext === 'string' && ext !== 'external.title') return ext;
      return 'External APIs';
    }
    const translation = t(key);
    if (typeof translation === 'string' && translation !== key) return translation;
    // i18n fallback via plugin manifest — keeps sidebar labels translated
    // (EN/FR) for plugin-owned items even when no top-level key exists.
    const pluginI18nKey = getSidebarPluginNameI18nKey(key);
    if (pluginI18nKey) {
      const pluginName = t(pluginI18nKey);
      if (typeof pluginName === 'string' && pluginName !== pluginI18nKey) {
        return pluginName;
      }
    }
    return key.charAt(0).toUpperCase() + key.slice(1).replace(/-/g, ' ');
  };

  const resolveSubItemTitle = (rawTitle: string) => {
    if (!rawTitle) return rawTitle;
    const normalized = rawTitle.trim().toLowerCase();
    const map: Record<string, string> = {
      'all contacts': 'contacts.filters.all_contacts',
      'contacts': 'contacts.title',
      'favorites': 'contacts.filters.favorites_only',
      'favourites': 'contacts.filters.favorites_only',
      'person': 'contacts.filters.person',
      'persons': 'contacts.filters.person',
      'individual': 'contacts.filters.person',
      'company': 'contacts.filters.company',
      'companies': 'contacts.filters.company',
      'suppliers': 'suppliers',
      'dashboard builder': 'sidebarSub.dashboardBuilder',
      'dashboard_builder': 'sidebarSub.dashboardBuilder',
      'crm dashboard': 'sidebarSub.crmDashboard',
      'crm_dashboard': 'sidebarSub.crmDashboard',
      'field dashboard': 'sidebarSub.fieldDashboard',
      'field_dashboard': 'sidebarSub.fieldDashboard',
      'offers': 'offers',
      'orders': 'orders',
      'daily tasks': 'sidebarSub.dailyTasks',
      'projects': 'sidebarSub.projectBoard',
      'reports': 'sidebarSub.reports',
      'departments': 'sidebarSub.departments',
      'service orders': 'sidebarSub.serviceOrders',
      'dispatches': 'sidebarSub.dispatches',
      'installations': 'sidebarSub.installations',
      'accounts': 'accounts',
      'email_settings': 'email_settings',
      'calendar_settings': 'calendar_settings',
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
    const descKey = `sidebarDescriptions.${key}`;
    const descTranslation = t(descKey);
    if (typeof descTranslation === 'string' && descTranslation !== descKey) {
      return descTranslation;
    }
    const isLikelyRaw = (val: any) => {
      if (typeof val !== 'string') return false;
      const v = val.trim();
      return v === key || v === `${key}.description` || v === `${key}.title`;
    };
    const direct = t(key);
    if (typeof direct === 'object' && direct && 'description' in direct) {
      const maybe = (direct as any).description;
      if (typeof maybe === 'string' && maybe.trim() !== '' && !isLikelyRaw(maybe)) return maybe;
    }
    try {
      const nested = t(`${key}.description`);
      if (typeof nested === 'string' && nested.trim() !== '' && !isLikelyRaw(nested)) return nested;
    } catch (_) {}
    return fallback ?? '';
  };

  const collapsed = state === "collapsed";
  const location = useLocation();
  const navigate = useNavigate();
  const { theme: _theme } = useTheme();
  const currentPath = location.pathname;
  const currentSearch = location.search;

  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains('dark'));
  
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const initialConfigured: import('../services/sidebar.service').SidebarItemConfig[] = loadSidebarConfig() ?? [];
  const [configuredItems, setConfiguredItems] = useState<import('../services/sidebar.service').SidebarItemConfig[]>(() => {
    const existing = loadSidebarConfig();
    const needsMigration =
      !existing ||
      existing.length === 0 ||
      existing.some((item) =>
        (item.title === 'articles' && item.group !== 'workspace') ||
        (item.title === 'contacts' && item.group !== 'crm') ||
        (item.title === 'todo' && item.group !== 'crm') ||
        item.title === 'calendar' ||
        (item.title === 'contacts' && item.dropdown?.some(d => d.url === '/dashboard/contacts/person')) ||
        (item.title === 'contacts' && item.dropdown && !item.dropdown.some(d => d.title === 'All Contacts')) ||
        (item.title === 'contacts' && item.dropdown?.some(d => d.url === '/dashboard/contacts?type=person')) ||
        (item.url === '/dashboard/website-builder' && item.group !== 'system') ||
        (item.title === 'email-calendar')
      ) ||
      !existing.some(item => item.url === '/dashboard/website-builder') ||
      existing.some(item => item.title === 'emails' && item.active !== false) ||
      !existing.some(item => item.title === 'calendar' && item.url === '/dashboard/calendar') ||
      (existing.some(item => item.title === 'dashboard' && item.dropdown && !item.dropdown.some(d => d.title === 'dashboard_builder'))) ||
      (existing.some(item => item.title === 'dashboard' && item.dropdown && item.dropdown.some(d => d.title === 'crm_dashboard' || d.title === 'field_dashboard'))) ||
      existing.some(item => item.title === 'suppliers') ||
      !existing.some(item => item.title === 'contacts' && item.dropdown?.some(d => d.title === 'suppliers'));
    
    if (needsMigration) {
      resetSidebarConfig();
      seedSidebarDefaultsIfEmpty();
      return loadSidebarConfig() ?? [];
    }
    return existing;
  });

  // HR module: enabled only for the `dev` tenant. Ensure HR sub-items exist on load.
  useEffect(() => {
    if (!isHrEnabledForCurrentTenant()) return;
    ensureHrDropdownItems();
    setConfiguredItems(loadSidebarConfig() ?? []);
  }, []);

  // Non-destructive upgrade path: add missing default items (like new modules) without resetting user config.
  useEffect(() => {
    try {
      const existing = loadSidebarConfig() ?? [];
      let changed = false;

      // HR module — only inject for the `dev` tenant.
      if (isHrEnabledForCurrentTenant()) {
        const hasHr = existing.some(i => i?.url === '/dashboard/hr' || i?.title === 'hr');
        if (!hasHr) {
          const hrDefault: SidebarItemConfig = {
            id: 'hr-1111-1111-1111-111111111111',
            title: 'hr',
            url: '/dashboard/hr',
            description: 'Human resources',
            icon: 'UserCog',
            group: 'workspace',
            active: true,
            dropdown: [
              { title: 'employees', url: '/dashboard/hr/employees', description: 'Employees' },
              { title: 'attendance', url: '/dashboard/hr/attendance', description: 'Attendance' },
              { title: 'leaves', url: '/dashboard/hr/leaves', description: 'Leaves' },
              { title: 'payroll', url: '/dashboard/hr/payroll', description: 'Payroll' },
              { title: 'reports', url: '/dashboard/hr/reports', description: 'Reports' },
              { title: 'departments', url: '/dashboard/hr/departments', description: 'Departments & org chart' },
            ],
          };
          const added = mergeMissingDefaults([hrDefault], '/dashboard/offers');
          if (added.length > 0) changed = true;
        }
      }

      // Deals module — CRM pipeline, sits alongside sales/offers.
      const hasDeals = existing.some(i => i?.url === '/dashboard/deals' || i?.title === 'deals');
      if (!hasDeals) {
        const dealsDefault: SidebarItemConfig = {
          id: 'deals-1111-1111-1111-111111111111',
          title: 'deals',
          url: '/dashboard/deals',
          description: 'Sales pipeline',
          icon: 'Handshake',
          group: 'crm',
          active: true,
        };
        const added = mergeMissingDefaults([dealsDefault], '/dashboard/tasks/projects');
        if (added.length > 0) changed = true;
      }

      const hasExternal = existing.some(i => i?.url === '/dashboard/external' || i?.title === 'external');
      if (!hasExternal) {
        const externalDefault: SidebarItemConfig = {
          id: 'external-1111-1111-1111-111111111111',
          title: 'external',
          url: '/dashboard/external',
          description: 'External API endpoints',
          icon: 'Globe',
          group: 'system',
          active: true,
        };
        const added = mergeMissingDefaults([externalDefault], '/dashboard/settings');
        if (added.length > 0) changed = true;
      }

      if (changed) {
        setConfiguredItems(loadSidebarConfig() ?? []);
      }
    } catch {
      // non-fatal
    }
  }, []);

  // Build dynamic dashboard sub-items from user-created dashboards
  const dashboardSubItems = useMemo(() => {
    return dashboards.map(d => ({
      title: d.name, // already user-facing, not a translation key
      url: `/dashboard/dashboards?id=${d.id}`,
      description: d.description || '',
      _isDynamicDashboard: true, // flag so resolveSubItemTitle can skip translation
    }));
  }, [dashboards]);

  const mapItems = (items: typeof configuredItems, fallbackIcon: any) => 
    items.map(i => {
      const iconName = i.icon as IconName | undefined;
      let IconComp = iconName && (ICON_REGISTRY as any)[iconName] ? (ICON_REGISTRY as any)[iconName] : fallbackIcon;
      // Inject user dashboards into the dashboard dropdown
      let dropdown = i.dropdown || undefined;
      if (i.title === 'dashboard' && dropdown) {
        dropdown = [...dropdown, ...dashboardSubItems];
      }
      return { ...i, icon: IconComp, dropdown };
    });

  const workspaceItems = useMemo(() => 
    mapItems(configuredItems.filter(i => i.group === 'workspace' && i.active && canViewItem(i.title)), Home),
    [configuredItems, isMainAdmin, permissionsLoading, dashboards]);

  const crmItems = useMemo(() => 
    mapItems(configuredItems.filter(i => i.group === 'crm' && i.active && canViewItem(i.title)), Users),
    [configuredItems, isMainAdmin, permissionsLoading]);

  const serviceItems = useMemo(() => 
    mapItems(configuredItems.filter(i => i.group === 'service' && i.active && canViewItem(i.title)), Wrench),
    [configuredItems, isMainAdmin, permissionsLoading]);

  const systemItems = useMemo(() => 
    mapItems(configuredItems.filter(i => i.group === 'system' && i.active && canViewItem(i.title)), Settings),
    [configuredItems, isMainAdmin, permissionsLoading]);

  // Build favorites list from all items
  const favoriteItems = useMemo(() => {
    const all = [...workspaceItems, ...crmItems, ...serviceItems, ...systemItems];
    return favorites.map(url => {
      if (url.includes('/dashboard/todo')) return all.find(i => i.url === '/dashboard/projects') || all.find(i => i.url === url);
      return all.find(i => i.url === url);
    }).filter(Boolean) as typeof workspaceItems;
  }, [favorites, workspaceItems, crmItems, serviceItems, systemItems]);

  const isActive = (path: string, dropdownContext?: Array<{ url: string }>) => {
    const [pathBase, pathSearch] = path.split('?');
    const fullCurrentPath = currentPath + currentSearch;
    if (pathBase === '/dashboard' && !pathSearch) return currentPath === '/dashboard';
    // Exact match (path + query)
    if (fullCurrentPath === path) return true;
    if (pathSearch && currentPath === pathBase && currentSearch === `?${pathSearch}`) return true;
    // If this item has a query parameter, only exact matches count — no startsWith
    if (pathSearch) return false;
    // For items without query params: check if a sibling with a query is currently active
    if (dropdownContext) {
      const siblingWithQueryActive = dropdownContext.some(sibling => {
        const [siblingBase, siblingSearch] = sibling.url.split('?');
        return siblingBase === pathBase && siblingSearch && currentSearch === `?${siblingSearch}`;
      });
      if (siblingWithQueryActive) return false;
    }
    if (currentPath === path && !currentSearch) return true;
    // startsWith matching for detail pages — but only match the MOST specific sibling
    if (currentPath.startsWith(pathBase + '/')) {
      // Check top-level configured items for a more specific match
      const moreSpecificTopLevel = configuredItems.find(item => {
        if (item.url === path || !item.active) return false;
        const itemBase = item.url.split('?')[0];
        return itemBase.startsWith(pathBase + '/') && currentPath.startsWith(itemBase);
      });
      if (moreSpecificTopLevel) return false;
      // Check sibling dropdown items for a more specific match
      if (dropdownContext) {
        const moreSpecificSibling = dropdownContext.some(sibling => {
          const [siblingBase] = sibling.url.split('?');
          return siblingBase !== pathBase && siblingBase.startsWith(pathBase + '/') && currentPath.startsWith(siblingBase);
        });
        if (moreSpecificSibling) return false;
      }
      return true;
    }
    return false;
  };

  const isDropdownActive = (dropdown: Array<{ url: string }>) =>
    dropdown.some(item => isActive(item.url));

  // per-group collapse state (persisted)
  const [workspaceOpen, setWorkspaceOpen] = useState(() => (localStorage.getItem('sidebar-group-workspace') ?? 'open') === 'open');
  const [crmOpen, setCrmOpen] = useState(() => (localStorage.getItem('sidebar-group-crm') ?? 'open') === 'open');
  const [serviceOpen, setServiceOpen] = useState(() => (localStorage.getItem('sidebar-group-service') ?? 'open') === 'open');
  const [systemOpen, setSystemOpen] = useState(() => (localStorage.getItem('sidebar-group-system') ?? 'open') === 'open');

  // dropdown states
  const [dropdownStates, setDropdownStates] = useState<Record<string, boolean>>(() => {
    const initialStates: Record<string, boolean> = {};
    configuredItems.forEach(item => {
      if (item.dropdown && item.dropdown.length > 0) {
        const hasActiveChild = item.dropdown.some(subItem => {
          const [pathBase, pathSearch] = subItem.url.split('?');
          const fullCurrentPath = location.pathname + location.search;
          if (fullCurrentPath === subItem.url) return true;
          if (location.pathname === subItem.url) return true;
          if (pathSearch && location.pathname === pathBase && location.search === `?${pathSearch}`) return true;
          if (location.pathname.startsWith(pathBase + '/')) return true;
          return false;
        });
        if (hasActiveChild) initialStates[item.id!] = true;
      }
    });
    return initialStates;
  });

  useEffect(() => {
    configuredItems.forEach(item => {
      if (item.dropdown && item.dropdown.length > 0) {
        const hasActiveChild = item.dropdown.some(subItem => {
          const [pathBase, pathSearch] = subItem.url.split('?');
          const fullCurrentPath = location.pathname + location.search;
          if (fullCurrentPath === subItem.url) return true;
          if (location.pathname === subItem.url) return true;
          if (pathSearch && location.pathname === pathBase && location.search === `?${pathSearch}`) return true;
          if (location.pathname.startsWith(pathBase + '/')) return true;
          return false;
        });
        if (hasActiveChild && !dropdownStates[item.id!]) {
          setDropdownStates(prev => ({ ...prev, [item.id!]: true }));
        }
      }
    });
  }, [location.pathname, location.search, configuredItems]);

  const toggleGroup = (key: string, setter: React.Dispatch<React.SetStateAction<boolean>>) => {
    setter(v => {
      const next = !v;
      localStorage.setItem(`sidebar-group-${key}`, next ? 'open' : 'closed');
      return next;
    });
  };

  const toggleDropdown = (itemId: string) => {
    setDropdownStates(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  // Keyboard navigation handler
  useEffect(() => {
    if (collapsed) return;
    const container = navContainerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const focusableItems = container.querySelectorAll<HTMLElement>('[data-sidebar-nav-item]');
      if (!focusableItems.length) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.min(prev + 1, focusableItems.length - 1);
          focusableItems[next]?.focus();
          return next;
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = Math.max(prev - 1, 0);
          focusableItems[next]?.focus();
          return next;
        });
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [collapsed]);

  // ——— Render helpers ———

  const renderFavoriteStar = (url: string) => {
    if (collapsed) return null;
    const isFav = favorites.includes(url);
    return (
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(url); }}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); toggleFavorite(url); } }}
        className={`inline-flex items-center justify-center flex-shrink-0 p-0.5 rounded cursor-pointer transition-all duration-200 ${
          isFav 
            ? 'text-warning opacity-100' 
            : 'text-muted-foreground/30 opacity-0 group-hover/navitem:opacity-100 hover:text-warning/70'
        }`}
        title={isFav ? t('sidebar.removeFavorite', 'Remove from favorites') : t('sidebar.addFavorite', 'Add to favorites')}
      >
        <Star className={`h-3 w-3 ${isFav ? 'fill-current' : ''}`} />
      </span>
    );
  };

  const renderNavigationItem = (item: any) => {
    const displayTitle = item.title;
    const hasDropdown = item.dropdown && item.dropdown.length > 0;
    const isDropdownOpen = dropdownStates[item.id] || false;
    const itemIsActive = hasDropdown ? isDropdownActive(item.dropdown) : isActive(item.url);

    // Icon color: use item override or main primary theme color
    const iconColorStyle: React.CSSProperties = item.iconColor
      ? { color: item.iconColor.startsWith('#') ? item.iconColor : `hsl(${item.iconColor})` }
      : { color: 'hsl(var(--primary))' };

    if (hasDropdown) {
      if (collapsed) {
        const targetUrl = item.url || item.dropdown[0]?.url || '/dashboard';
        return (
          <SidebarMenuItem key={displayTitle}>
            <Tooltip>
              <TooltipTrigger asChild>
                <SidebarMenuButton asChild className="transition-all duration-150 !h-8 !w-8 !p-0 mx-auto rounded-md">
                  <NavLink
                    to={targetUrl}
                    end={targetUrl === "/dashboard"}
                    className={({ isActive: active }) =>
                      `flex items-center w-full h-full justify-center rounded-md transition-all duration-150 ${active || itemIsActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-sidebar-foreground/[0.06] hover:text-foreground'}`
                    }
                  >
                    <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200" style={iconColorStyle} />
                  </NavLink>
                </SidebarMenuButton>
              </TooltipTrigger>
              <TooltipContent side="right" className="text-xs">
                {resolveTitle(displayTitle)}
              </TooltipContent>
            </Tooltip>
          </SidebarMenuItem>
        );
      }

      return (
        <Collapsible key={displayTitle} open={isDropdownOpen} onOpenChange={() => toggleDropdown(item.id)}>
          <SidebarMenuItem className="group/navitem">

            <CollapsibleTrigger
              data-sidebar-nav-item
              tabIndex={0}
              className={`group/navitem transition-all duration-150 ease-out h-8 rounded-lg gap-2 px-2 py-1.5 w-full flex items-center text-sm font-bold outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                itemIsActive
                  ? 'bg-sidebar-accent text-foreground font-bold shadow-sm'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/[0.06] hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200" style={iconColorStyle} />
              <span className="flex-1 min-w-0 text-left capitalize truncate">
                {resolveTitle(displayTitle)}
              </span>
              {renderFavoriteStar(item.url)}
              <ChevronRight className={`h-3 w-3 flex-shrink-0 transition-transform duration-200 ease-out ${isDropdownOpen ? 'rotate-90' : ''} text-muted-foreground/40`} />
            </CollapsibleTrigger>
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <SidebarMenuSub className="sidebar-tree-sub mt-0.5 ml-[15px] pl-3 border-l border-sidebar-border/30">
                {item.dropdown.map((subItem: any, idx: number) => {
                  const isLast = idx === item.dropdown.length - 1;
                  const subActive = isActive(subItem.url, item.dropdown);
                  return (
                    <SidebarMenuSubItem key={subItem.url} className={`relative mb-0 ${isLast ? 'sidebar-tree-last' : ''}`}>
                      <div className={`absolute -left-[15.5px] top-1/2 -translate-y-1/2 w-[10px] h-px transition-colors duration-150 ${subActive ? 'bg-sidebar-primary/50' : 'bg-sidebar-border/30'}`} />
                      <div className={`absolute -left-[15.5px] top-1/2 -translate-y-1/2 translate-x-[9px] w-[3px] h-[3px] rounded-full transition-colors duration-150 ${subActive ? 'bg-sidebar-primary' : 'bg-sidebar-border/50'}`} />
                      <SidebarMenuSubButton asChild className={`h-7 px-2 py-1 transition-all duration-150 ease-out border-r-0 cursor-pointer rounded-md text-sm font-bold ${subActive ? 'text-foreground bg-sidebar-accent/60' : 'text-sidebar-foreground/60 hover:text-foreground hover:bg-sidebar-foreground/[0.05]'}`}>
                        <NavLink
                          to={subItem.url}
                          end={subItem.url === "/dashboard" || !subItem.url.includes('?')}
                          className="flex items-center gap-2 border-r-0 w-full"
                          onClick={(e) => { e.stopPropagation(); navigate(subItem.url); }}
                        >
                          <span>{resolveSubItemTitle(subItem.title)}</span>
                        </NavLink>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  );
                })}
              </SidebarMenuSub>
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>
      );
    }

    // Simple nav item (no dropdown)
    if (collapsed) {
      return (
        <SidebarMenuItem key={displayTitle}>
          <Tooltip>
            <TooltipTrigger asChild>
              <SidebarMenuButton asChild className="transition-all duration-150 !h-8 !w-8 !p-0 mx-auto rounded-md">
                <NavLink
                  to={item.url}
                  end={item.url === "/dashboard"}
                  className={({ isActive }) =>
                    `flex items-center w-full h-full justify-center rounded-md transition-all duration-150 ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-sidebar-foreground/[0.06] hover:text-foreground'}`
                  }
                >
                  <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200" style={iconColorStyle} />
                </NavLink>
              </SidebarMenuButton>
            </TooltipTrigger>
            <TooltipContent side="right" className="text-xs">
              {resolveTitle(displayTitle)}
            </TooltipContent>
          </Tooltip>
        </SidebarMenuItem>
      );
    }

    return (
      <SidebarMenuItem
        key={displayTitle}
        className="group/navitem"
      >
        <NavLink
          to={item.url}
          end={item.url === "/dashboard"}
          data-sidebar-nav-item
          tabIndex={0}
          className={`group/navitem transition-all duration-150 ease-out h-8 rounded-lg gap-2 px-2 py-1.5 w-full flex items-center text-sm font-bold outline-none focus-visible:ring-1 focus-visible:ring-ring ${
            isActive(item.url)
              ? 'bg-sidebar-accent text-foreground shadow-sm'
              : 'text-sidebar-foreground/70 hover:bg-sidebar-foreground/[0.06] hover:text-foreground'
          }`}
        >
          <item.icon className="h-4 w-4 flex-shrink-0 transition-transform duration-200" style={iconColorStyle} />
          <span className="flex-1 min-w-0 text-left capitalize truncate">
            {resolveTitle(displayTitle)}
          </span>
          {renderFavoriteStar(item.url)}
        </NavLink>
      </SidebarMenuItem>
    );
  };

  // Group header component
  const GroupHeader = ({ label, isOpen, onToggle, dataTour }: { label: string; isOpen: boolean; onToggle: () => void; dataTour?: string }) => {
    if (collapsed) return null;
    return (
      <CollapsibleTrigger
        className="flex items-center justify-between w-full px-2 py-1.5 mb-1 text-muted-foreground/35 hover:text-muted-foreground/55 transition-all duration-150 ease-out group rounded-md hover:bg-sidebar-foreground/[0.03]"
        data-tour={dataTour}
      >
        <span className="text-[11px] font-bold uppercase tracking-[0.1em] select-none">{label}</span>
        <ChevronDown className={`h-3 w-3 opacity-0 group-hover:opacity-100 transition-all duration-200 ${isOpen ? '' : '-rotate-90'}`} />
      </CollapsibleTrigger>
    );
  };

  return (
    <Sidebar data-tour="sidebar" className="border-r border-sidebar-border/60 bg-sidebar" collapsible="icon">
      <SidebarContent className="bg-sidebar flex flex-col h-full overflow-y-auto sm:overflow-y-visible">
        {/* Brand Header — profile avatar over company-logo background */}
        {!collapsed && (
          <ProfileBrandHeader companyLogo={companyLogo} />
        )}
        {collapsed && (
          <div className="flex-shrink-0 flex flex-col items-center gap-1.5 py-2 border-b border-sidebar-border/40">
            <ProfileAvatarOnly />
            {/* Expand the sidebar again (collapsed mode has no header button). */}
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={t('expand_sidebar', 'Expand sidebar')}
              title={t('expand_sidebar', 'Expand sidebar')}
              className="h-6 w-6 inline-flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition"
            >
              <PanelLeftOpen className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <div ref={navContainerRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-3 py-2">
          {/* Navigation items */}

          {/* ★ Favorites Section */}
          {favoriteItems.length > 0 && (
            <div className={collapsed ? 'mb-3' : 'mb-4'}>
              {!collapsed && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 mb-1">
                  <Star className="h-3 w-3 text-warning/60 fill-warning/60" />
                  <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground/35 select-none">
                    {t('sidebar.favorites', 'Favorites')}
                  </span>
                </div>
              )}
              <SidebarMenu className="space-y-0.5">
                {favoriteItems.map(renderNavigationItem)}
              </SidebarMenu>
              {!collapsed && <div className="mx-2 mt-3 border-b border-sidebar-border/20" />}
            </div>
          )}

          {/* Workspace Section */}
          <Collapsible open={workspaceOpen} onOpenChange={() => toggleGroup('workspace', setWorkspaceOpen)}>
            <GroupHeader label={t('workspace')} isOpen={workspaceOpen} onToggle={() => toggleGroup('workspace', setWorkspaceOpen)} />
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <SidebarMenu className="space-y-0.5">
                {workspaceItems.map(renderNavigationItem)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>

          {/* CRM Section */}
          <Collapsible data-tour="crm-section" open={crmOpen} onOpenChange={() => toggleGroup('crm', setCrmOpen)} className="mt-4">
            <GroupHeader label={t('crm')} isOpen={crmOpen} onToggle={() => toggleGroup('crm', setCrmOpen)} dataTour="crm-section" />
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <SidebarMenu className="space-y-0.5">
                {crmItems.map(renderNavigationItem)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>

          {/* Service Section */}
          <Collapsible data-tour="service-section" open={serviceOpen} onOpenChange={() => toggleGroup('service', setServiceOpen)} className="mt-4">
            <GroupHeader label={t('service')} isOpen={serviceOpen} onToggle={() => toggleGroup('service', setServiceOpen)} dataTour="service-section" />
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <SidebarMenu className="space-y-0.5">
                {serviceItems.map(renderNavigationItem)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>

          {/* System Section */}
          <Collapsible data-tour="system-section" open={systemOpen} onOpenChange={() => toggleGroup('system', setSystemOpen)} className="mt-4">
            <GroupHeader label={t('system')} isOpen={systemOpen} onToggle={() => toggleGroup('system', setSystemOpen)} dataTour="system-section" />
            <CollapsibleContent className="overflow-hidden data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up">
              <SidebarMenu className="space-y-0.5">
                {systemItems.map(renderNavigationItem)}
              </SidebarMenu>
            </CollapsibleContent>
          </Collapsible>
        </div>

      </SidebarContent>
    </Sidebar>
  );
}

// ——————————————————————————————————————————————
// Profile brand header (replaces company logo at top of sidebar)
// Avatar circle in front, company logo as faded background, user name + dropdown.
// ——————————————————————————————————————————————
function ProfileBrandHeader({ companyLogo }: { companyLogo: string | null | undefined }) {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { toggleSidebar } = useSidebar();

  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User';

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast({
        title: t('signOutFailed', 'Sign out failed'),
        description: t('signOutFailedDescription', 'Please try again.'),
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="relative flex-shrink-0 h-[72px] border-b border-sidebar-border/40 overflow-hidden">
      {/* Dynamic company logo as background */}
      {companyLogo ? (
        <img
          src={companyLogo}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-contain opacity-30 pointer-events-none select-none scale-75 blur-[0.5px]"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-sidebar-accent/40 to-sidebar" />
      )}
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/30 to-black/40 pointer-events-none" />

      {/* Collapse button — top right */}
      <button
        type="button"
        onClick={toggleSidebar}
        aria-label={t('collapse_sidebar', 'Collapse sidebar')}
        className="absolute top-1.5 right-1.5 z-20 h-6 w-6 inline-flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white/85 hover:text-white transition"
      >
        <PanelLeftClose className="h-3.5 w-3.5" />
      </button>

      {/* Profile row */}
      <div className="relative z-10 h-full flex items-end gap-2.5 px-3 pt-2 pb-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              title={fullName}
              className="flex items-center gap-2 min-w-0 group focus:outline-none"
            >
              <span className="rounded-full ring-2 ring-white/40 group-hover:ring-white/70 transition-all shadow-md">
                <UserAvatar
                  src={user?.profilePictureUrl}
                  name={fullName}
                  seed={user?.id ?? 'user'}
                  size="md"
                />
              </span>
              <div className="min-w-0 text-left flex items-center gap-1">
                <div className="min-w-1">
                  <p className="text-[13px] font-semibold text-white leading-tight truncate drop-shadow">
                    {fullName}
                  </p>
                </div>
                <ChevronDown className="h-3.5 w-3.5 text-white/70 group-hover:text-white transition flex-shrink-0" />
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="bottom" className="w-52 p-1">
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings/profile')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
              <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
              {t('profile', 'Profile')}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              {t('settings', 'Settings')}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="my-1" />
            <DropdownMenuItem onClick={handleSignOut} className="text-xs gap-2 px-2.5 py-1.5 rounded-md text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5" />
              {t('signOut', 'Sign out')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Collapsed mini variant — just the avatar with the same dropdown
function ProfileAvatarOnly() {
  const { user, logout } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fullName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User';

  const handleSignOut = async () => {
    try {
      await logout();
      navigate('/login');
    } catch {
      toast({
        title: t('signOutFailed', 'Sign out failed'),
        variant: 'destructive',
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-full hover:ring-2 hover:ring-sidebar-ring/40 transition">
          <UserAvatar
            src={user?.profilePictureUrl}
            name={fullName}
            seed={user?.id ?? 'user'}
            size="md"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" side="right" className="w-52 p-1">
        <DropdownMenuItem onClick={() => navigate('/dashboard/settings/profile')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
          <UserIcon className="h-3.5 w-3.5 text-muted-foreground" />
          {t('profile', 'Profile')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate('/dashboard/settings')} className="text-xs gap-2 px-2.5 py-1.5 rounded-md">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
          {t('settings', 'Settings')}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="my-1" />
        <DropdownMenuItem onClick={handleSignOut} className="text-xs gap-2 px-2.5 py-1.5 rounded-md text-destructive focus:text-destructive">
          <LogOut className="h-3.5 w-3.5" />
          {t('signOut', 'Sign out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
