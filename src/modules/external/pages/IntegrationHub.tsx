import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus, Search, Globe, Zap, BarChart3, Copy, MoreHorizontal,
  Eye, Pencil, Trash2, Plug, CheckCircle2, Clock, ChevronRight,
  ArrowDownLeft, ArrowUpDown, SendHorizonal, ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useExternalEndpoints } from '../hooks/useExternalEndpoints';
import { useExternalTranslations } from '../hooks/useExternalTranslations';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';
import { IntegrationHelpButton } from '../components/onboarding/IntegrationHelpButton';
import {
  CONNECTOR_CATALOG,
  CONNECTOR_CATEGORIES,
  getConnectorFromEndpointName,
  type ConnectorCategory,
  type ConnectorDefinition,
} from '../utils/connectorCatalog';
import type { ConnectorGroup } from '../types';

// ─── Connector card ───────────────────────────────────────────────────────────

function ConnectorCard({ connector, onConnect }: { connector: ConnectorDefinition; onConnect: (id: string) => void }) {
  const { t } = useTranslation();
  const categoryLabel = CONNECTOR_CATEGORIES.find(c => c.value === connector.category)?.label ?? connector.category;

  return (
    <Card
      className="relative flex flex-col overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      style={{ borderTop: `3px solid ${connector.color}` }}
      onClick={() => connector.availability === 'full' && onConnect(connector.id)}
    >
      <CardContent className="flex flex-col flex-1 gap-3 p-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl leading-none select-none">{connector.logo}</span>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className="text-[10px] capitalize">{categoryLabel}</Badge>
            {connector.isPopular && (
              <Badge className="text-[10px] bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-400">
                {t('hub.popular', 'Popular')}
              </Badge>
            )}
          </div>
        </div>

        {/* Name + vendor */}
        <div>
          <p className="font-semibold text-sm text-foreground leading-tight">{connector.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{connector.vendor}</p>
        </div>

        {/* Description */}
        <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{connector.description}</p>

        {/* Entity chips */}
        <div className="flex flex-wrap gap-1">
          {connector.entities.slice(0, 3).map(e => (
            <span key={e.type} className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">
              {e.label}
            </span>
          ))}
          {connector.entities.length > 3 && (
            <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-sm text-muted-foreground">
              +{connector.entities.length - 3}
            </span>
          )}
        </div>

        {/* Data flow direction */}
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <span className="font-medium">{connector.vendor}</span>
          <ArrowRight className="h-2.5 w-2.5 shrink-0" />
          <span className="font-medium text-primary">Flowentra</span>
        </div>

        {/* CTA */}
        {connector.availability === 'full' ? (
          <Button
            size="sm"
            className="w-full mt-auto gap-1.5 group-hover:opacity-90"
            onClick={e => { e.stopPropagation(); onConnect(connector.id); }}
          >
            <Plug className="h-3.5 w-3.5" />
            {t('hub.connect', 'Connect')}
          </Button>
        ) : (
          <Button size="sm" variant="outline" className="w-full mt-auto" disabled>
            <Clock className="h-3.5 w-3.5 mr-1.5" />
            {t('hub.comingSoon', 'Coming Soon')}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Active connection group card ─────────────────────────────────────────────

function ActiveConnectionCard({ group, onManage }: { group: ConnectorGroup; onManage: (id: number) => void }) {
  const { t } = useTranslation();
  const totalReceived = group.endpoints.reduce((sum, ep) => sum + ep.totalReceived, 0);
  const totalSent = group.endpoints.reduce((sum, ep) => sum + ep.totalSent, 0);
  const hasBidirectional = group.endpoints.some(ep => !!ep.webhookForwardUrl);
  const sortedReceived = group.endpoints
    .map(ep => ep.lastReceived)
    .filter(Boolean)
    .sort();
  const lastReceived = sortedReceived[sortedReceived.length - 1];

  return (
    <Card className="overflow-hidden" style={{ borderLeft: `3px solid ${group.color}` }}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-2xl leading-none shrink-0">{group.logo}</span>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-sm text-foreground truncate">{group.connectorName}</p>
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {hasBidirectional ? (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full px-1.5 py-0.5 shrink-0">
                    <ArrowUpDown className="h-2.5 w-2.5" />{t('external.detail.flowBidirectional', 'In + Out')}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-1.5 py-0.5 shrink-0">
                    <ArrowDownLeft className="h-2.5 w-2.5" />{t('external.detail.flowInbound', 'Inbound')}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {group.endpoints.length} {t('hub.endpointsActive', 'webhook(s) active')}
                {' · '}
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">{totalReceived} ↓</span>
                {totalSent > 0 && <span className="text-blue-600 dark:text-blue-400 font-medium"> · {totalSent} ↑</span>}
                {lastReceived && ` · ${t('hub.lastEvent', 'last')} ${new Date(lastReceived).toLocaleDateString()}`}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {group.endpoints.map(ep => (
                  <button
                    key={ep.id}
                    className="text-[10px] bg-muted hover:bg-muted/80 px-1.5 py-0.5 rounded-sm text-muted-foreground transition-colors"
                    onClick={() => onManage(ep.id)}
                  >
                    {ep.name.replace(`${group.connectorName} — `, '')}
                    <ChevronRight className="inline h-2.5 w-2.5 ml-0.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={() => onManage(group.endpoints[0].id)}
          >
            {t('hub.manage', 'Manage')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function IntegrationHub() {
  useExternalTranslations();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Webhooks tab state
  const { endpoints, stats, loading, search, setSearch, statusFilter, setStatusFilter, deleteEndpoint } = useExternalEndpoints();
  const [deleteId, setDeleteId] = useState<number | null>(null);

  // Catalog tab state
  const [catalogSearch, setCatalogSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState<ConnectorCategory | 'all'>('all');

  const getPublicUrl = (slug: string) =>
    `${API_URL.replace(/\/$/, '')}/api/external-receive/${slug}`;

  const copyUrl = (slug: string) => {
    navigator.clipboard.writeText(getPublicUrl(slug));
    toast.success(t('external.toast.urlCopied'), { description: t('external.toast.urlCopiedDesc') });
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteEndpoint(deleteId);
    } catch (e: any) {
      toast.error(t('external.toast.error'), { description: e?.message });
    } finally {
      setDeleteId(null);
    }
  };

  // Group connector-created endpoints
  const connectorGroups = useMemo<ConnectorGroup[]>(() => {
    const map = new Map<string, ConnectorGroup>();
    for (const ep of endpoints) {
      const def = getConnectorFromEndpointName(ep.name);
      if (!def) continue;
      if (!map.has(def.id)) {
        map.set(def.id, { connectorId: def.id, connectorName: def.name, logo: def.logo, color: def.color, endpoints: [] });
      }
      map.get(def.id)!.endpoints.push(ep);
    }
    return Array.from(map.values());
  }, [endpoints]);

  // Webhook-only endpoints (not created by a connector)
  const standaloneEndpoints = useMemo(
    () => endpoints.filter(ep => !getConnectorFromEndpointName(ep.name)),
    [endpoints],
  );

  // Catalog filtering
  const filteredCatalog = useMemo(() => {
    return CONNECTOR_CATALOG.filter(c => {
      const matchesCategory = activeCategory === 'all' || c.category === activeCategory;
      const q = catalogSearch.toLowerCase();
      const matchesSearch = !q || c.name.toLowerCase().includes(q) || c.vendor.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, catalogSearch]);

  const webhookFilters = [
    { value: '',         label: t('external.filters.all') },
    { value: 'active',   label: t('external.filters.active') },
    { value: 'inactive', label: t('external.filters.inactive') },
  ];

  const totalEventsToday = stats.totalReceivedToday;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('hub.title', 'Integration Hub')}</h1>
          <p className="text-sm text-muted-foreground mt-1">{t('hub.description', 'Connect Flowentra to your ERP, CRM, e-commerce, and other business systems.')}</p>
        </div>
        <div className="flex gap-2">
          <IntegrationHelpButton />
          <Button variant="outline" onClick={() => navigate('create')} className="gap-2">
            <Globe className="h-4 w-4" />
            {t('external.createEndpoint')}
          </Button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Plug className="h-3.5 w-3.5" />{t('hub.stats.connections', 'Connections')}</div>
          <p className="text-2xl font-bold text-foreground mt-1">{connectorGroups.length}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium"><Globe className="h-3.5 w-3.5" />{t('external.stats.totalEndpoints')}</div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalEndpoints}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <ArrowDownLeft className="h-3.5 w-3.5 text-emerald-500" />{t('external.stats.totalReceivedToday')}
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{totalEventsToday}</p>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <SendHorizonal className="h-3.5 w-3.5 text-blue-500" />{t('external.stats.totalSentToday', 'Sent Today')}
          </div>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalSentToday}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="connections">
        <TabsList>
          <TabsTrigger value="connections" className="gap-2">
            <Plug className="h-3.5 w-3.5" />
            {t('hub.tabs.connections', 'Connections')}
            {connectorGroups.length > 0 && (
              <Badge className="ml-1 text-[10px] h-4 px-1">{connectorGroups.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="webhooks" className="gap-2">
            <Globe className="h-3.5 w-3.5" />
            {t('hub.tabs.webhooks', 'Webhooks')}
            {standaloneEndpoints.length > 0 && (
              <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1">{standaloneEndpoints.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── CONNECTIONS TAB ── */}
        <TabsContent value="connections" className="space-y-6 mt-4">

          {/* Active connections */}
          {connectorGroups.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">{t('hub.activeConnections', 'Active Connections')}</h2>
              <div className="space-y-2">
                {connectorGroups.map(group => (
                  <ActiveConnectionCard
                    key={group.connectorId}
                    group={group}
                    onManage={id => navigate(`${id}`)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Connector catalog */}
          <section className="space-y-4">
            <h2 className="text-sm font-semibold text-foreground">
              {connectorGroups.length > 0
                ? t('hub.addMore', 'Add Another Integration')
                : t('hub.availableIntegrations', 'Available Integrations')}
            </h2>

            {/* Search + category filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  placeholder={t('hub.search', 'Search integrations...')}
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {CONNECTOR_CATEGORIES.map(cat => (
                  <Button
                    key={cat.value}
                    variant={activeCategory === cat.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveCategory(cat.value)}
                  >
                    {cat.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Connector grid */}
            {filteredCatalog.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">
                {t('hub.noResults', 'No integrations match your search.')}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {filteredCatalog.map(connector => (
                  <ConnectorCard
                    key={connector.id}
                    connector={connector}
                    onConnect={id => navigate(`connect/${id}`)}
                  />
                ))}
              </div>
            )}
          </section>
        </TabsContent>

        {/* ── WEBHOOKS TAB ── */}
        <TabsContent value="webhooks" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              {t('hub.webhooksDesc', 'Custom inbound endpoints — receive data from any HTTP-capable source.')}
            </p>
            <Button onClick={() => navigate('create')} size="sm" className="gap-2 shrink-0">
              <Plus className="h-4 w-4" />
              {t('external.createEndpoint')}
            </Button>
          </div>

          {/* Search + status filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('external.search')} className="pl-9" />
            </div>
            <div className="flex gap-2">
              {webhookFilters.map(f => (
                <Button key={f.value} variant={statusFilter === f.value ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(f.value)}>
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : endpoints.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Globe className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium text-foreground">{t('external.noEndpoints')}</h3>
                <p className="text-sm text-muted-foreground mt-1 max-w-md">{t('external.noEndpointsDesc')}</p>
                <Button onClick={() => navigate('create')} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />{t('external.createEndpoint')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('external.table.name')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('external.table.slug')}</TableHead>
                    <TableHead>{t('external.table.status')}</TableHead>
                    <TableHead className="hidden sm:table-cell">{t('external.table.direction', 'Flow')}</TableHead>
                    <TableHead className="text-center">{t('external.table.received')}</TableHead>
                    <TableHead className="text-center hidden lg:table-cell">{t('external.table.sent', 'Sent')}</TableHead>
                    <TableHead className="hidden md:table-cell">{t('external.table.created')}</TableHead>
                    <TableHead className="w-[50px]">{t('external.table.actions')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {endpoints.map(ep => {
                    const connDef = getConnectorFromEndpointName(ep.name);
                    const isBidirectional = !!ep.webhookForwardUrl;
                    return (
                      <TableRow
                        key={ep.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => navigate(`${ep.id}`)}
                      >
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {connDef && <span className="text-base leading-none">{connDef.logo}</span>}
                            <span>{ep.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{ep.slug}</code>
                        </TableCell>
                        <TableCell>
                          <Badge variant={ep.isActive ? 'default' : 'secondary'}>
                            {ep.isActive ? t('external.detail.active') : t('external.detail.inactive')}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          {isBidirectional ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-full px-2 py-0.5">
                              <ArrowUpDown className="h-3 w-3" />{t('external.detail.flowBidirectional', 'In + Out')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-full px-2 py-0.5">
                              <ArrowDownLeft className="h-3 w-3" />{t('external.detail.flowInbound', 'Inbound')}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">{ep.totalReceived}</TableCell>
                        <TableCell className="text-center hidden lg:table-cell text-muted-foreground">{ep.totalSent > 0 ? ep.totalSent : '—'}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground text-sm">
                          {new Date(ep.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                              <Button variant="ghost" size="icon-sm"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`${ep.id}`); }}>
                                <Eye className="h-4 w-4 mr-2" />{t('external.actions.view')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); navigate(`${ep.id}/edit`); }}>
                                <Pencil className="h-4 w-4 mr-2" />{t('external.actions.edit')}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={e => { e.stopPropagation(); copyUrl(ep.slug); }}>
                                <Copy className="h-4 w-4 mr-2" />{t('external.actions.copyUrl')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={e => { e.stopPropagation(); setDeleteId(ep.id); }}
                              >
                                <Trash2 className="h-4 w-4 mr-2" />{t('external.actions.delete')}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete confirmation */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('external.confirm.delete')}</AlertDialogTitle>
            <AlertDialogDescription>{t('external.confirm.deleteDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('external.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('external.confirm.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
