import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Link2, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ConnectedAccountsTab } from '@/modules/email-calendar/components/ConnectedAccountsTab';
import { CustomEmailConfigDialog } from '@/modules/email-calendar/components/CustomEmailConfigDialog';
import { customEmailService } from '@/modules/email-calendar/services/customEmailService';
import type { CustomEmailConfig } from '@/modules/email-calendar/types';
import { useConnectedAccounts } from '@/modules/email-calendar/hooks/useConnectedAccounts';
import { OpenRouterSettings } from './OpenRouterSettings';
import {
  INTEGRATIONS_CATALOG,
  CATEGORY_META,
  type IntegrationCategory,
  type IntegrationItem,
} from '../data/integrations-catalog';

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as IntegrationCategory[];

export function IntegrationsTabContent() {
  const { t } = useTranslation('settings');
  const {
    accounts,
    connectAccount,
    disconnectAccount,
  } = useConnectedAccounts();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<IntegrationCategory | 'all'>('all');
  const [showConnected, setShowConnected] = useState(false);
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [showOpenRouterSettings, setShowOpenRouterSettings] = useState(false);
  const [openRouterKeyCount, setOpenRouterKeyCount] = useState(0);

  useEffect(() => {
    import('@/services/openRouterModelsService').then(mod => 
      mod.getOpenRouterKeys().then(keys => setOpenRouterKeyCount(keys.length))
    );
  }, [showOpenRouterSettings]);

  const handleCustomConnect = async (config: CustomEmailConfig) => {
    await customEmailService.addAccount(config);
  };




  const catalog = useMemo(() => {
    return INTEGRATIONS_CATALOG.map(item => {
      let status = item.status;
      
      // Only mark as connected if there's a REAL active account from the backend API
      // (not just from OAuth signup — signing up via OAuth doesn't mean email/calendar is integrated)
      if (item.id === 'gmail') {
        const gmailAccount = accounts.find(a => a.provider === 'google');
        status = gmailAccount && gmailAccount.syncStatus !== 'failed' ? 'connected' : item.status;
      }
      if (item.id === 'google-calendar') {
        const googleAccount = accounts.find(a => a.provider === 'google');
        status = googleAccount && googleAccount.calendarSettings?.isSyncEnabled && googleAccount.syncStatus !== 'failed' ? 'connected' : item.status;
      }
      if (item.id === 'outlook') {
        const outlookAccount = accounts.find(a => a.provider === 'microsoft');
        status = outlookAccount && outlookAccount.syncStatus !== 'failed' ? 'connected' : item.status;
      }
      if (item.id === 'outlook-calendar') {
        const msAccount = accounts.find(a => a.provider === 'microsoft');
        status = msAccount && msAccount.calendarSettings?.isSyncEnabled && msAccount.syncStatus !== 'failed' ? 'connected' : item.status;
      }
      if (item.id === 'custom-smtp') {
        status = accounts.some(a => a.provider === 'custom' && a.syncStatus !== 'failed') ? 'connected' : item.status;
      }
      if (item.id === 'openrouter') {
        status = openRouterKeyCount > 0 ? 'connected' : item.status;
      }

      const name = t(`integrations.items.${item.id}.name`, item.name);
      const description = t(`integrations.items.${item.id}.description`, item.description);

      return { ...item, status, name, description };
    });
  }, [accounts, openRouterKeyCount, t]);

  const filtered = useMemo(() => {
    let items = catalog;
    if (selectedCategory !== 'all') {
      items = items.filter(i => i.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      items = items.filter(i =>
        i.name.toLowerCase().includes(q) ||
        i.description.toLowerCase().includes(q) ||
        i.tags?.some(tag => tag.includes(q))
      );
    }
    return items;
  }, [catalog, selectedCategory, search]);

  const grouped = useMemo(() => {
    const map = new Map<IntegrationCategory, IntegrationItem[]>();
    for (const item of filtered) {
      const list = map.get(item.category) || [];
      list.push(item);
      map.set(item.category, list);
    }
    return map;
  }, [filtered]);

  const connectedCount = catalog.filter(i => i.status === 'connected').length;
  const availableCount = catalog.filter(i => i.status === 'available').length;

  const getCategoryLabel = (cat: IntegrationCategory) => t(CATEGORY_META[cat].labelKey);

  return (
    <div className="space-y-4">
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6 pb-3 sm:pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-sm font-medium text-foreground flex items-center gap-2">
                <Link2 className="h-4 w-4 text-primary" />
                {t('tabs.integrations')}
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {t('integrations.totalCount', { count: catalog.length })} · {t('integrations.connectedCount', { count: connectedCount })} · {t('integrations.availableCount', { count: availableCount })}
              </CardDescription>
            </div>
            {connectedCount > 0 && (
              <Button
                variant={showConnected ? 'secondary' : 'outline'}
                size="sm"
                className="text-xs gap-1.5"
                onClick={() => setShowConnected(!showConnected)}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t('integrations.connectedButton', { count: connectedCount })}
              </Button>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-4">
          {showConnected && (
            <div className="border border-border rounded-lg p-4 bg-muted/20">
              <ConnectedAccountsTab
                accounts={accounts}
                onConnect={connectAccount}
                onDisconnect={disconnectAccount}
              />
            </div>
          )}

          {showOpenRouterSettings && (
            <OpenRouterSettings />
          )}

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder={t('integrations.searchPlaceholder')}
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="h-8 pl-8 text-xs bg-background"
              />
            </div>

            <ScrollArea className="w-full">
              <div className="flex gap-1.5 pb-1">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {t('integrations.allCategories')} ({catalog.length})
                </button>
                {ALL_CATEGORIES.map(cat => {
                  const count = catalog.filter(i => i.category === cat).length;
                  if (count === 0) return null;
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      {meta.icon} {getCategoryLabel(cat)} ({count})
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-5">
            {Array.from(grouped.entries()).map(([category, items]) => {
              const meta = CATEGORY_META[category];
              return (
                <div key={category}>
                  {selectedCategory === 'all' && (
                    <h3 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
                      <span>{meta.icon}</span>
                      {getCategoryLabel(category)}
                      <span className="text-muted-foreground/60">({items.length})</span>
                    </h3>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {items.map(item => (
                      <IntegrationCard key={item.id} item={item} t={t} onConnect={connectAccount} onOpenCustomDialog={() => setCustomDialogOpen(true)} onOpenOpenRouter={() => setShowOpenRouterSettings(!showOpenRouterSettings)} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-12">
              <p className="text-xs text-muted-foreground">{t('integrations.noResults', { query: search })}</p>
            </div>
          )}
        </CardContent>
      </Card>
      <CustomEmailConfigDialog open={customDialogOpen} onOpenChange={setCustomDialogOpen} onConnect={handleCustomConnect} />
    </div>
  );
}

function IntegrationCard({ item, t, onConnect, onOpenCustomDialog, onOpenOpenRouter }: { item: IntegrationItem; t: (key: string) => string; onConnect: (provider: any) => void; onOpenCustomDialog: () => void; onOpenOpenRouter: () => void }) {
  const statusConfig = {
    connected: { badge: t('integrations.status.connected'), className: 'bg-success/10 text-success border-success/20', icon: <CheckCircle2 className="h-3 w-3" /> },
    available: { badge: t('integrations.status.available'), className: 'bg-primary/10 text-primary border-primary/20', icon: null },
    coming_soon: { badge: t('integrations.status.coming_soon'), className: 'bg-muted text-muted-foreground border-border', icon: <Clock className="h-3 w-3" /> },
  };

  const { badge, className, icon } = statusConfig[item.status];
  const isClickable = (item.status === 'available' || item.status === 'connected') && item.hasConnectFlow;

  const handleClick = () => {
    if (!item.hasConnectFlow) return;
    if (item.id === 'openrouter') {
      onOpenOpenRouter();
    } else if (item.id === 'custom-smtp') {
      onOpenCustomDialog();
    } else if (item.id === 'gmail' || item.id === 'google-calendar') {
      onConnect('google');
    } else if (item.id === 'outlook' || item.id === 'outlook-calendar') {
      onConnect('microsoft');
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={!isClickable && item.status !== 'connected'}
      className={`group text-left w-full flex items-center gap-3 p-3 rounded-lg border border-border/40 transition-all duration-150
        ${isClickable ? 'hover:bg-accent/50 hover:border-border cursor-pointer' : ''}
        ${item.status === 'connected' ? 'bg-success/[0.03] border-success/20' : ''}
        ${item.status === 'coming_soon' ? 'opacity-60' : ''}
      `}
    >
      {/* Provider icon */}
      <div className="flex items-center justify-center h-10 w-10 rounded-xl shrink-0">
        {item.id === 'gmail' ? (
          <svg viewBox="0 0 48 48" className="h-7 w-7">
            <path fill="#4caf50" d="M45,16.2l-5,2.75l-5,4.75L35,40h7c1.657,0,3-1.343,3-3V16.2z"/>
            <path fill="#1e88e5" d="M3,16.2l3.614,1.71L13,23.7V40H6c-1.657,0-3-1.343-3-3V16.2z"/>
            <polygon fill="#e53935" points="35,11.2 24,19.45 13,11.2 12,17 13,23.7 24,31.95 35,23.7 36,17"/>
            <path fill="#c62828" d="M3,12.298V16.2l10,7.5V11.2L9.876,8.859C9.132,8.301,8.228,8,7.298,8h0C4.924,8,3,9.924,3,12.298z"/>
            <path fill="#fbc02d" d="M45,12.298V16.2l-10,7.5V11.2l3.124-2.341C38.868,8.301,39.772,8,40.702,8h0 C43.076,8,45,9.924,45,12.298z"/>
          </svg>
        ) : item.id === 'outlook' ? (
          <svg viewBox="0 0 48 48" className="h-7 w-7">
            <path fill="#1976d2" d="M28,13h14.533C43.343,13,44,13.657,44,14.467v19.066C44,34.343,43.343,35,42.533,35H28V13z"/>
            <rect width="14" height="22" x="28" y="13" fill="#2196f3"/>
            <polygon fill="#1565c0" points="27,44 4,39.5 4,8.5 27,4"/>
            <ellipse cx="14.5" cy="24" fill="#fff" rx="5.5" ry="6.5"/>
            <ellipse cx="14.5" cy="24" fill="#1565c0" rx="3.5" ry="4.5"/>
            <path fill="#2196f3" d="M28,18h7v2h-7V18z M28,22h7v2h-7V22z M28,26h7v2h-7V26z M28,30h5v2h-5V30z"/>
          </svg>
        ) : item.id === 'custom-smtp' ? (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
            <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"/>
            <path d="M2 7l8.913 5.486a2 2 0 002.174 0L22 7" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"/>
            <circle cx="18" cy="17" r="4" fill="hsl(var(--primary))" opacity="0.15"/>
            <path d="M16.5 17h3M18 15.5v3" stroke="hsl(var(--primary))" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
        ) : item.id === 'openrouter' ? (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
            <path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.08"/>
            <circle cx="12" cy="9" r="2.5" stroke="hsl(var(--primary))" strokeWidth="1.3"/>
            <path d="M12 11.5v2" stroke="hsl(var(--primary))" strokeWidth="1.3"/>
            <circle cx="8" cy="16" r="1.5" stroke="hsl(var(--primary))" strokeWidth="1.1"/>
            <circle cx="16" cy="16" r="1.5" stroke="hsl(var(--primary))" strokeWidth="1.1"/>
            <path d="M10.5 14l-1.5 1M13.5 14l1.5 1" stroke="hsl(var(--primary))" strokeWidth="1.1" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" className="text-muted-foreground"/>
            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.3" className="text-muted-foreground"/>
          </svg>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-foreground truncate">{item.name}</span>
          <Badge variant="outline" className={`text-[10px] h-4 px-1.5 gap-0.5 shrink-0 ${className}`}>
            {icon}
            {badge}
          </Badge>
        </div>
        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{item.description}</p>
      </div>

      {isClickable && (
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}
    </button>
  );
}
