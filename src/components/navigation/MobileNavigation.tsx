import { 
  Users, 
  CheckSquare, 
  Home,
  Settings,
  Calendar,
  GitBranch,
  MessageSquare,
  Zap,
  BarChart3,
  Globe,
  Languages,
  Bell,
  Loader2
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { usePermissions } from "@/hooks/usePermissions";
import { useNotifications } from "@/hooks/useNotifications";
import { PermissionModule } from "@/types/permissions";
import { useMemo } from "react";

// Map navigation item titles to permission modules
const NAV_PERMISSION_MAP: Record<string, PermissionModule> = {
  'contacts': 'contacts',
  'deals': 'offers',
  'settings': 'settings',
  'tasks': 'contacts',
  'automation': 'settings',
  'calendar': 'contacts',
  'analytics': 'sales',
  'communication': 'contacts',
};

const navigationItems = [
  { 
    title: "dashboard", 
    url: "/dashboard", 
    icon: Home,
    description: "Overview & insights",
    color: "from-blue-500 to-blue-600"
  },
  { 
    title: "contacts", 
    url: "/dashboard/contacts", 
    icon: Users,
    description: "Customer database",
    color: "from-green-500 to-green-600"
  },
  { 
    title: "deals", 
    url: "/dashboard/deals", 
    icon: GitBranch,
    description: "Pipeline management",
    color: "from-purple-500 to-purple-600"
  },
  { 
    title: "communication", 
    url: "/dashboard/communication", 
    icon: MessageSquare,
    description: "Email & call logs",
    color: "from-orange-500 to-orange-600"
  },
  { 
    title: "tasks", 
    url: "/dashboard/tasks", 
    icon: CheckSquare,
    description: "Tasks management",
    color: "from-teal-500 to-teal-600"
  },
  { 
    title: "automation", 
    url: "/dashboard/automation", 
    icon: Zap,
    description: "Workflow builder",
    color: "from-yellow-500 to-yellow-600"
  },
  { 
    title: "calendar", 
    url: "/dashboard/calendar", 
    icon: Calendar,
    description: "Events & scheduling",
    color: "from-red-500 to-red-600"
  },
  {
    title: "analytics", 
    url: "/dashboard/analytics", 
    icon: BarChart3,
    description: "Reports & insights",
    color: "from-indigo-500 to-indigo-600"
  },
  {
    title: "settings",
    url: "/dashboard/settings",
    icon: Settings,
    description: "System preferences",
    color: "from-gray-500 to-gray-600"
  }
];

export function MobileNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { hasPermission, isMainAdmin, isLoading: permissionsLoading } = usePermissions();
  const { notifications, unreadCount, loading: notificationsLoading, markAsRead, markAllAsRead, hasNewNotifications, clearNewNotificationsFlag } = useNotifications();
  
  // Check if user has permission to view a navigation item
  const canViewItem = (itemTitle: string): boolean => {
    if (isMainAdmin) return true;
    if (permissionsLoading) return true;
    
    const normalizedTitle = itemTitle.toLowerCase();
    const permissionModule = NAV_PERMISSION_MAP[normalizedTitle];
    
    // If no mapping exists, allow access
    if (!permissionModule) return true;
    
    return hasPermission(permissionModule, 'read');
  };
  
  // Filter navigation items by permissions
  const filteredNavigationItems = useMemo(() => 
    navigationItems.filter(item => canViewItem(item.title)),
    [isMainAdmin, permissionsLoading]
  );

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'message': return 'bg-primary';
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

  const handleNotificationClick = (notification: any) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };
  
  const resolveTitle = (key: string) => {
    if (!key) return key;

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

    return key;
  };
  const resolveDescription = (key: string, fallback?: string) => {
    if (!key) return fallback ?? '';
    try {
      const nested = t(`${key}.description`);
      if (typeof nested === 'string' && nested.trim() !== '') return nested;
    } catch (_) {}
    const direct = t(key);
    if (typeof direct === 'object' && direct && 'description' in direct) {
      // @ts-ignore
      const maybe = direct.description;
      if (typeof maybe === 'string' && maybe.trim() !== '') return maybe;
    }
    return fallback ?? '';
  };
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <div className="p-4">
      {/* Top Bar with Language and Notifications */}
      <div className="flex justify-between items-center mb-4">
        {/* Language Selector */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Languages className="h-4 w-4" />
              {i18n.language === 'fr' ? '🇫🇷 FR' : '🇺🇸 EN'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem 
              onClick={() => i18n.changeLanguage('en')}
              className="gap-2"
            >
              🇺🇸 English
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => i18n.changeLanguage('fr')}
              className="gap-2"
            >
              🇫🇷 Français
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notifications Bell */}
        <Popover onOpenChange={(open) => open && clearNewNotificationsFlag()}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`relative ${hasNewNotifications ? 'animate-pulse border-primary' : ''}`}
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
                <div className="space-y-3 p-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-start gap-3 p-2 animate-pulse">
                      <div className="h-8 w-8 rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-4 w-3/4 bg-muted rounded" />
                        <div className="h-3 w-1/2 bg-muted/60 rounded" />
                      </div>
                    </div>
                  ))}
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
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredNavigationItems.map((item) => (
          <NavLink key={item.title} to={item.url} end={item.url === "/dashboard"}>
            <Card className={`hover-lift transition-all duration-300 border-0 shadow-medium overflow-hidden ${
              isActive(item.url) ? 'ring-2 ring-primary ring-offset-2' : ''
            }`}>
              <CardContent className="p-6">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 shadow-lg`}>
                  <item.icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground capitalize mb-1">
                    {resolveTitle(item.title)}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-tight">
                    {resolveDescription(item.title, item.description)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </NavLink>
        ))}
      </div>
    </div>
  );
}