import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr as frLocale, arSA } from 'date-fns/locale';
import { Activity, ArrowRight, Bell, CheckCheck, ExternalLink, Loader2 } from 'lucide-react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useAggregatedActivity } from '@/modules/traceability/hooks/useAggregatedActivity';
import { ALL_SOURCES, type ActivityEvent, type ActivitySource } from '@/modules/traceability/types';
import { SOURCE_TO_MODULE } from '@/modules/traceability/permissions';
import { usePermissions } from '@/hooks/usePermissions';
import type { DynamicNotification } from '@/services/api/notificationsApi';

type PanelTab = 'notifications' | 'activity';

interface NotificationCenterSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  notifications: DynamicNotification[];
  unreadCount: number;
  loading: boolean;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  /** Called every time the drawer opens so the notification list is fresh. */
  onRefreshNotifications?: () => void | Promise<void>;
  /** Which pane to show first. */
  defaultTab?: PanelTab;
}

const ACTIVITY_POLL_MS = 30_000;


function localeFor(lang: string) {
  if (lang?.startsWith('fr')) return frLocale;
  if (lang?.startsWith('ar')) return arSA;
  return enUS;
}

function resolveActorName(actor: { id?: string; name?: string }) {
  const idStr = actor.id != null ? String(actor.id) : '';
  const nameStr = actor.name != null ? String(actor.name) : '';
  if (idStr === '1' || nameStr === '1') return 'MainAdminUser';
  return nameStr || 'System';
}

const LEVEL_DOT: Record<string, string> = {
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-destructive',
  info: 'bg-primary',
};

/** Compact, single-column rendering of a traceability event (the table view is too wide here). */
function ActivityRow({ event, highlighted, onNavigate }: { event: ActivityEvent; highlighted?: boolean; onNavigate: (url?: string) => void }) {
  const { t, i18n } = useTranslation('traceability');
  const dateLocale = localeFor(i18n.language);
  const when = event.performedAt
    ? formatDistanceToNow(new Date(event.performedAt), { addSuffix: true, locale: dateLocale })
    : '';

  return (
    <li
      className={cn(
        'group px-4 py-3 transition-colors',
        event.entityUrl && 'cursor-pointer hover:bg-accent/40',
        highlighted && 'bg-primary/5'
      )}
      onClick={() => onNavigate(event.entityUrl)}
    >
      <div className="flex items-start gap-2.5">
        <span className={cn('mt-1.5 h-2 w-2 rounded-full shrink-0', LEVEL_DOT[event.level] ?? 'bg-primary')} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-medium">
              {t(`tabs.${event.source}`, { defaultValue: event.source })}
            </Badge>
            <span className="text-xs font-semibold text-foreground">{event.actionLabel}</span>
            {event.entityLabel && (
              <span className="text-[11px] text-muted-foreground truncate">{event.entityLabel}</span>
            )}
          </div>
          {event.message && (
            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{event.message}</p>
          )}
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            {(event.oldValue || event.newValue) && (
              <span className="inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="rounded bg-muted px-1 py-px">{event.oldValue || '—'}</span>
                <ArrowRight className="h-2.5 w-2.5" />
                <span className="rounded bg-primary/10 text-primary px-1 py-px">{event.newValue || '—'}</span>
              </span>
            )}
            <span className="text-[10px] text-muted-foreground">
              {resolveActorName(event.actor)} · {when}
            </span>
          </div>
        </div>
        {event.entityUrl && (
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 shrink-0 mt-1" />
        )}
      </div>
    </li>
  );
}

/**
 * Right-side notification/activity drawer.
 * A vertical icon rail on the left of the panel switches between the user's
 * notifications and the cross-workspace traceability feed.
 */
export function NotificationCenterSheet({
  open,
  onOpenChange,
  notifications,
  unreadCount,
  loading,
  onMarkAsRead,
  onMarkAllAsRead,
  onRefreshNotifications,
  defaultTab = 'notifications',
}: NotificationCenterSheetProps) {
  const { t, i18n } = useTranslation('dashboard');
  const navigate = useNavigate();
  const [tab, setTab] = useState<PanelTab>(defaultTab);
  const { isMainAdmin, hasAnyPermission, isLoading: permsLoading } = usePermissions();

  const allowedSources = useMemo<ActivitySource[]>(() => {
    if (isMainAdmin) return ALL_SOURCES;
    return ALL_SOURCES.filter((src) =>
      hasAnyPermission(SOURCE_TO_MODULE[src], ['read', 'read_logs', 'view_all', 'view_own'])
    );
  }, [isMainAdmin, hasAnyPermission]);

  // Only poll while the drawer is open on the activity tab — keeps the feed cheap.
  const {
    events,
    loading: activityLoading,
    isRefetching,
    newEventIds,
    refresh,
  } = useAggregatedActivity({
    sources: allowedSources,
    enabled: open && tab === 'activity' && !permsLoading && allowedSources.length > 0,
    pollIntervalMs: ACTIVITY_POLL_MS,
  });

  // Refresh both feeds every time the drawer is opened.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  const refreshNotificationsRef = useRef(onRefreshNotifications);
  refreshNotificationsRef.current = onRefreshNotifications;

  useEffect(() => {
    if (!open) return;
    void refreshNotificationsRef.current?.();
    void refreshRef.current?.();
  }, [open]);

  // Re-pull the activity feed when switching to it while open.
  useEffect(() => {
    if (open && tab === 'activity') void refreshRef.current?.();
  }, [open, tab]);

  const go = (url?: string) => {
    if (!url) return;
    onOpenChange(false);
    navigate(url);
  };

  const handleNotificationClick = (n: DynamicNotification) => {
    onMarkAsRead(n.id);
    if (n.link) {
      onOpenChange(false);
      navigate(n.link);
    }
  };

  const tabs: { key: PanelTab; icon: typeof Bell; label: string; badge?: number }[] = [
    { key: 'notifications', icon: Bell, label: t('notifications'), badge: unreadCount },
    { key: 'activity', icon: Activity, label: t('traceability:title', { defaultValue: 'Activity' }), badge: newEventIds.size },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-row gap-0 h-[100dvh] max-h-[100dvh]"
        dir={i18n.dir?.() === 'rtl' ? 'rtl' : undefined}
      >
        {/* Icon rail */}
        <TooltipProvider delayDuration={150}>
          <nav
            className="w-14 sm:w-12 shrink-0 border-r border-border bg-muted/40 flex flex-col items-center gap-1 py-4"
            style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          >
            {tabs.map(({ key, icon: Icon, label, badge }) => (
              <Tooltip key={key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={label}
                    aria-current={tab === key}
                    onClick={() => setTab(key)}
                    className={cn(
                      'relative h-11 w-11 sm:h-10 sm:w-10 rounded-lg flex items-center justify-center transition-colors',
                      tab === key
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5 sm:h-4 sm:w-4" />

                    {!!badge && badge > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] leading-none text-primary-foreground">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="left">{label}</TooltipContent>
              </Tooltip>
            ))}
          </nav>
        </TooltipProvider>

        {/* Panel */}
        <div className="flex-1 min-w-0 flex flex-col">
          <header className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
            <div className="min-w-0">
              <h2 className="text-sm font-semibold truncate">
                {tab === 'notifications'
                  ? t('notifications')
                  : t('traceability:title', { defaultValue: 'Activity' })}
              </h2>
              <p className="text-[11px] text-muted-foreground truncate">
                {tab === 'notifications'
                  ? t('unreadCount', { count: unreadCount, defaultValue: `${unreadCount} unread` })
                  : t('traceability:subtitle', { defaultValue: 'Everything happening across your workspaces' })}
              </p>
            </div>
            {tab === 'notifications' ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => onMarkAllAsRead()}
                disabled={unreadCount === 0}
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">{t('markAllAsRead')}</span>
              </Button>
            ) : (
              (activityLoading || isRefetching) && (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />
              )
            )}
          </header>

          <ScrollArea className="flex-1 min-h-0 overscroll-contain">
            {tab === 'notifications' ? (
              loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Bell className="h-8 w-8 mb-2 opacity-50" />
                  <p className="text-sm">{t('noNotifications')}</p>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {notifications.map((n) => (
                    <li
                      key={n.id}
                      className={cn(
                        'px-4 py-3 cursor-pointer transition-colors hover:bg-accent/40',
                        !n.read && 'bg-primary/5'
                      )}
                      onClick={() => handleNotificationClick(n)}
                    >
                      <div className="flex items-start gap-2.5">
                        <span
                          className={cn(
                            'mt-1.5 h-2 w-2 rounded-full shrink-0',
                            n.read ? 'bg-muted-foreground/40' : LEVEL_DOT[n.type] ?? 'bg-primary'
                          )}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-foreground truncate">{n.title}</p>
                            <span className="text-[10px] text-muted-foreground shrink-0">{n.time}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.description}</p>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )
            ) : activityLoading && events.length === 0 ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-md bg-muted/30" />
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Activity className="h-8 w-8 mb-2 opacity-50" />
                <p className="text-sm">{t('traceability:empty', { defaultValue: 'No activity yet' })}</p>
              </div>
            ) : (
              <ul className="divide-y divide-border">
                {events.slice(0, 60).map((event) => (
                  <ActivityRow
                    key={event.id}
                    event={event}
                    highlighted={newEventIds.has(event.id)}
                    onNavigate={go}
                  />
                ))}
              </ul>
            )}
          </ScrollArea>

          <footer
            className="p-2 border-t border-border"
            style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
          >

            <Button
              variant="secondary"
              className="w-full text-sm"
              onClick={() => {
                onOpenChange(false);
                navigate(tab === 'notifications' ? '/dashboard/notifications' : '/dashboard/traceability');
              }}
            >
              {tab === 'notifications'
                ? t('viewAllNotifications')
                : t('traceability:title', { defaultValue: 'Activity' })}
            </Button>
          </footer>
        </div>
      </SheetContent>
    </Sheet>
  );
}
