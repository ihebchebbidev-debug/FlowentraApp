import { useEffect, useMemo, useState } from "react";
import { ListSkeleton } from "@/components/ui/page-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import { useNotifications, type DynamicNotification } from "@/hooks/useNotifications";
import { Badge } from "@/components/ui/badge";
import { Bell, Loader2, RefreshCw, ShoppingCart, FileText, Wrench, CheckSquare, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { PluginGate } from "@/modules/shared/plugins";

export function NotificationsModule() {
  const { t } = useTranslation('notifications');
  const [tab, setTab] = useState<"all" | "unread" | "tasks" | "sales" | "offers" | "inventory">("all");
  const navigate = useNavigate();
  
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refetch } = useNotifications(false);

  const filtered: DynamicNotification[] = useMemo(() => {
    switch (tab) {
      case "unread":
        return notifications.filter((n) => !n.read);
      case "tasks":
        return notifications.filter((n) => n.category === "task");
      case "sales":
        return notifications.filter((n) => n.category === "sale");
      case "offers":
        return notifications.filter((n) => n.category === "offer" || n.category === "service_order");
      case "inventory":
        // Filter for inventory/stock notifications (system category with stock-related content)
        return notifications.filter((n) => 
          n.category === "system" && 
          (n.title.toLowerCase().includes('stock') || 
           n.description.toLowerCase().includes('stock') ||
           n.title.toLowerCase().includes('inventory') ||
           n.description.toLowerCase().includes('material'))
        );
      default:
        return notifications;
    }
  }, [tab, notifications]);

  useEffect(() => {
    document.title = t('header.pageTitle');
    const desc = t('header.pageDesc');
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "description";
      document.head.appendChild(meta);
    }
    meta.content = desc;

    // Canonical tag
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!link) {
      link = document.createElement("link");
      link.rel = "canonical";
      document.head.appendChild(link);
    }
    link.href = window.location.origin + "/dashboard/notifications";
  }, []);

  const handleMarkAllAsRead = () => {
    markAllAsRead();
    toast({ title: t('actions.allCaughtUpTitle'), description: t('actions.allCaughtUpDesc') });
  };

  const handleNotificationClick = (notification: DynamicNotification) => {
    markAsRead(notification.id);
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'success': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      case 'message': return 'bg-purple-500';
      default: return 'bg-primary';
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'sale': return { label: t('categories.sale'), variant: 'default' as const, icon: ShoppingCart };
      case 'offer': return { label: t('categories.offer'), variant: 'secondary' as const, icon: FileText };
      case 'service_order': return { label: t('categories.service'), variant: 'outline' as const, icon: Wrench };
      case 'task': return { label: t('categories.task'), variant: 'destructive' as const, icon: CheckSquare };
      case 'inventory': return { label: t('categories.inventory'), variant: 'outline' as const, icon: Package };
      default: return { label: t('categories.system'), variant: 'secondary' as const, icon: Bell };
    }
  };

  return (
    <PluginGate code="PL0029NOTIFICATIONS">
      <main className="flex-1 overflow-auto">
        <div className="flex items-center justify-between gap-2 p-3 sm:p-4 border-b border-border bg-card/50 backdrop-blur">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0">
              <Bell className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            </div>
            <div className="min-w-0">
              <h1 className="text-base sm:text-xl font-semibold text-foreground truncate">{t('header.title')}</h1>
              <p className="text-px-10 sm:text-px-11 text-muted-foreground truncate">{t('header.desc')}</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refetch}
            disabled={loading}
            className="flex-shrink-0"
          >
            <RefreshCw className={`h-4 w-4 sm:mr-2 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('actions.refresh')}</span>
          </Button>
        </div>

        <div className="p-4 space-y-4">
          <section className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
              <TabsList className="flex-wrap">
                <TabsTrigger value="all">
                  {t('tabs.all')}
                  <Badge variant="secondary" className="ml-1.5 text-xs">
                    {notifications.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="unread">
                  {t('tabs.unread')}
                  {unreadCount > 0 && (
                    <Badge variant="destructive" className="ml-1.5 text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="tasks">{t('tabs.tasks')}</TabsTrigger>
                <TabsTrigger value="sales">{t('tabs.sales')}</TabsTrigger>
                <TabsTrigger value="offers">{t('tabs.offers')}</TabsTrigger>
                <TabsTrigger value="inventory">{t('tabs.inventory')}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button 
              variant="secondary" 
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={unreadCount === 0}
            >
              {t('actions.markAllRead')}
            </Button>
          </section>

          <section aria-live="polite">
            <ScrollArea className="max-h-[calc(100vh-220px)] rounded-md border border-border bg-card">
            {loading ? (
              <ListSkeleton rows={6} />
            ) : (
              <ul className="divide-y divide-border">
                {filtered.map((n) => {
                  const badge = getCategoryBadge(n.category);
                  const Icon = badge.icon;
                  return (
                    <li 
                      key={n.id} 
                      className={`p-4 hover:bg-accent/50 transition-colors cursor-pointer ${!n.read ? 'bg-primary/5' : ''}`}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <Card className="border-0 shadow-none bg-transparent">
                        <CardContent className="p-0">
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-2 rounded-lg ${!n.read ? 'bg-primary/10' : 'bg-muted'}`}>
                              <Icon className={`h-4 w-4 ${!n.read ? 'text-primary' : 'text-muted-foreground'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant={badge.variant} className="text-xs">
                                  {badge.label}
                                </Badge>
                                <span className={`h-2 w-2 rounded-full ${n.read ? 'bg-muted-foreground/40' : getTypeColor(n.type)}`} />
                              </div>
                              <div className="flex items-center justify-between gap-4">
                                <h2 className="text-sm font-semibold leading-tight">{n.title}</h2>
                                <time className="text-xs text-muted-foreground flex-shrink-0">{n.time}</time>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{n.description}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
                {filtered.length === 0 && (
                  <li className="p-12 text-center">
                    <Bell className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p className="text-muted-foreground">
                      {tab === "unread" 
                        ? t('empty.unread')
                        : t('empty.default')
                      }
                    </p>
                  </li>
                )}
              </ul>
            )}
          </ScrollArea>
          </section>
        </div>
      </main>
      </PluginGate>
  );
}
