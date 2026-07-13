import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Copy, Key, RefreshCw, Pencil, FlaskConical, Globe, Zap, ArrowDownLeft, SendHorizonal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { externalEndpointsApi } from '../services/externalEndpoints.service';
import { useExternalTranslations } from '../hooks/useExternalTranslations';
import { EndpointLogsTable } from '../components/EndpointLogsTable';
import { TestEndpointModal } from '../components/TestEndpointModal';
import { TenantSelector } from '@/components/TenantSelector';
import { setTargetTenantId, clearTargetTenant } from '@/utils/targetTenant';
import type { ExternalEndpoint } from '../types';
import { toast } from 'sonner';
import { API_URL } from '@/config/api';

export function EndpointDetail() {
  useExternalTranslations();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [endpoint, setEndpoint] = useState<ExternalEndpoint | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRegenDialog, setShowRegenDialog] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [keyVisible, setKeyVisible] = useState(false);
  const [revealedKey, setRevealedKey] = useState<string | null>(null);

  // Backend returns the API key masked on list/get for security.
  // Fetch the plain key on-demand only when the user clicks "reveal".
  // Surface the backend's actual error message (e.g. "API key is hashed and cannot
  // be revealed. Regenerate to obtain a new key.") so users on legacy hashed keys
  // know the recovery path instead of seeing a generic failure.
  // Detect the backend's "KEY_HASHED" 409 response. The server stores keys as
  // SHA-256 hashes — once a key is created it can NEVER be revealed again.
  // The only recovery path is to regenerate (which mints + returns a fresh
  // plaintext key once). Surface that path explicitly instead of a dead-end toast.
  const isHashedKeyError = (err: unknown) => {
    const msg = err instanceof Error ? err.message.toLowerCase() : '';
    return msg.includes('hashed') || msg.includes('key_hashed') || msg.includes('cannot be revealed');
  };

  const showRevealError = (err: unknown) => {
    if (isHashedKeyError(err)) {
      // Offer the only working recovery: regenerate.
      toast.error(
        t('external.toast.keyHashedTitle', 'API key cannot be revealed'),
        {
          description: t(
            'external.toast.keyHashedDesc',
            'For security, the existing key is stored hashed and cannot be shown again. Click "Regenerate" to mint a new one (the old key will stop working).',
          ),
          duration: 10000,
          action: {
            label: t('external.actions.regenerate', 'Regenerate'),
            onClick: () => setShowRegenDialog(true),
          },
        },
      );
      return;
    }
    const message = err instanceof Error && err.message ? err.message : null;
    const fallback = t('external.toast.keyRevealFailed', 'Failed to reveal API key');
    if (message) {
      toast.error(fallback, { description: message, duration: 8000 });
    } else {
      toast.error(fallback);
    }
  };

  const handleToggleKey = async () => {
    if (keyVisible) { setKeyVisible(false); return; }
    if (!revealedKey && id) {
      try {
        const { apiKey } = await externalEndpointsApi.revealKey(Number(id));
        setRevealedKey(apiKey);
      } catch (err) {
        showRevealError(err);
        return;
      }
    }
    setKeyVisible(true);
  };

  const handleCopyKey = async () => {
    let key = revealedKey;
    if (!key && id) {
      try {
        const res = await externalEndpointsApi.revealKey(Number(id));
        key = res.apiKey;
        setRevealedKey(key);
      } catch (err) {
        showRevealError(err);
        return;
      }
    }
    if (key) copyToClipboard(key, 'key');
  };

  const fetchEndpoint = useCallback(async () => {
    if (!id) return;
    try {
      const data = await externalEndpointsApi.getById(Number(id));
      setEndpoint(data);
    } catch {} finally { setLoading(false); }
  }, [id]);

  useEffect(() => { fetchEndpoint(); }, [fetchEndpoint]);

  // Public inbound URL — must point at the BACKEND host (e.g. https://api.flowentra.app),
  // NOT the frontend origin. External callers POST here with X-Api-Key.
  const getPublicUrl = () => `${API_URL.replace(/\/$/, '')}/api/external-receive/${endpoint?.slug}`;

  const copyToClipboard = (text: string, type: 'url' | 'key') => {
    navigator.clipboard.writeText(text);
    if (type === 'url') toast.success(t('external.toast.urlCopied'), { description: t('external.toast.urlCopiedDesc') });
    else toast.success(t('external.toast.keyCopied'), { description: t('external.toast.keyCopiedDesc') });
  };

  const handleRegenerate = async () => {
    if (!id) return;
    // Pin X-Target-Tenant to this row's tenant (default 0) so the mutation
    // never 400s in view-all mode just because no global filter is set.
    const rowTenantId = (endpoint as any)?.tenantId ?? 0;
    setTargetTenantId(rowTenantId);
    try {
      const updated = await externalEndpointsApi.regenerateKey(Number(id));
      setEndpoint(updated);
      // regenerate-key returns the plain key once — cache it so the user can copy.
      if ((updated as any)?.apiKey && !(updated as any).apiKey.includes('•')) {
        setRevealedKey((updated as any).apiKey);
        setKeyVisible(true);
      } else {
        setRevealedKey(null);
        setKeyVisible(false);
      }
      toast.success(t('external.toast.keyRegenerated'), { description: t('external.toast.keyRegeneratedDesc') });
    } catch {} finally {
      clearTargetTenant();
    }
    setShowRegenDialog(false);
  };

  if (loading) return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  if (!endpoint) return <div className="p-6 text-center text-muted-foreground">{t('external.noEndpoints')}</div>;

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/dashboard/external')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-foreground">{endpoint.name}</h1>
              <Badge variant={endpoint.isActive ? 'default' : 'secondary'}>
                {endpoint.isActive ? t('external.detail.active') : t('external.detail.inactive')}
              </Badge>
              <TenantSelector value={(endpoint as any)?.tenantId} onChange={() => {}} readOnly compact />
            </div>
            {endpoint.description && <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowTestModal(true)}><FlaskConical className="h-4 w-4 mr-1" />{t('external.actions.test')}</Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/external/${id}/edit`)}><Pencil className="h-4 w-4 mr-1" />{t('external.actions.edit')}</Button>
        </div>
      </div>

      {/* URL & Key */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Globe className="h-3 w-3" />{t('external.detail.publicUrl')}</div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis">{getPublicUrl()}</code>
              <Button variant="ghost" size="icon-sm" onClick={() => copyToClipboard(getPublicUrl(), 'url')}><Copy className="h-3.5 w-3.5" /></Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1"><Key className="h-3 w-3" />{t('external.detail.apiKey')}</div>
            <div className="flex items-center gap-2">
              <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden text-ellipsis cursor-pointer" onClick={handleToggleKey}>
                {keyVisible ? (revealedKey ?? endpoint.apiKey) : '••••••••••••••••••••••••'}
              </code>
              <Button variant="ghost" size="icon-sm" onClick={handleCopyKey}><Copy className="h-3.5 w-3.5" /></Button>
              <Button variant="ghost" size="icon-sm" onClick={() => setShowRegenDialog(true)}><RefreshCw className="h-3.5 w-3.5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data flow banner */}
      <Card className="overflow-hidden">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Inbound side */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-10 w-10 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <ArrowDownLeft className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground font-medium">{t('external.detail.flowInbound', 'Inbound')}</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-xl font-bold text-foreground">{endpoint.totalReceived}</span>
                  <span className="text-xs text-muted-foreground">{t('external.detail.totalReceived', 'total')}</span>
                  <span className="text-sm font-medium text-emerald-600">+{endpoint.receivedToday}</span>
                  <span className="text-xs text-muted-foreground">{t('external.detail.receivedToday', 'today')}</span>
                </div>
              </div>
            </div>

            {/* Flow arrow */}
            <div className="flex items-center gap-2 text-muted-foreground/40 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5">
                <div className="h-px w-12 bg-muted-foreground/20" />
                <div className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/50">
                  <Zap className="h-3 w-3" /> Flowentra
                </div>
                <div className="h-px w-12 bg-muted-foreground/20" />
              </div>
            </div>

            {/* Outbound side */}
            <div className="flex items-center gap-3 min-w-0">
              {endpoint.webhookForwardUrl ? (
                <>
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                    <SendHorizonal className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground font-medium">{t('external.detail.outboundUrl', 'Forwarding to')}</p>
                    <div className="flex items-baseline gap-2 mt-0.5">
                      <span className="text-xl font-bold text-foreground">{endpoint.totalSent}</span>
                      <span className="text-xs text-muted-foreground">{t('external.detail.totalSent', 'forwarded')}</span>
                      <span className="text-sm font-medium text-blue-600">+{endpoint.sentToday}</span>
                      <span className="text-xs text-muted-foreground">{t('external.detail.sentToday', 'today')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground truncate max-w-[200px] mt-0.5">{endpoint.webhookForwardUrl}</p>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-3 opacity-40">
                  <div className="h-10 w-10 rounded-lg border border-dashed border-muted-foreground/30 flex items-center justify-center shrink-0">
                    <SendHorizonal className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{t('external.detail.flowInbound', 'Outbound')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('external.form.webhookForwardUrlPlaceholder', 'No forwarding configured')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{endpoint.totalReceived}</p>
          <p className="text-xs text-muted-foreground">{t('external.detail.totalReceived')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{endpoint.receivedToday}</p>
          <p className="text-xs text-muted-foreground">{t('external.detail.receivedToday')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{endpoint.totalSent}</p>
          <p className="text-xs text-muted-foreground">{t('external.detail.totalSent', 'Total Forwarded')}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4 text-center">
          <p className="text-sm font-medium text-foreground">{endpoint.lastReceived ? new Date(endpoint.lastReceived).toLocaleString() : '—'}</p>
          <p className="text-xs text-muted-foreground">{t('external.detail.lastReceived')}</p>
        </CardContent></Card>
      </div>

      {/* Tabs: Logs / Settings */}
      <Tabs defaultValue="logs">
        <TabsList variant="underline">
          <TabsTrigger value="logs">{t('external.detail.tabs.logs')}</TabsTrigger>
          <TabsTrigger value="settings">{t('external.detail.tabs.settings')}</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="mt-4">
          <EndpointLogsTable endpointId={Number(id)} />
        </TabsContent>
        <TabsContent value="settings" className="mt-4">
          <Card><CardContent className="p-4 space-y-3 text-sm">
            <div><span className="text-muted-foreground">{t('external.form.allowedMethods')}:</span> <span className="font-medium">{endpoint.allowedMethods}</span></div>
            <div><span className="text-muted-foreground">{t('external.form.allowedOrigins')}:</span> <span className="font-medium">{endpoint.allowedOrigins || '*'}</span></div>
            {endpoint.webhookForwardUrl && <div><span className="text-muted-foreground">{t('external.form.webhookForwardUrl')}:</span> <span className="font-medium">{endpoint.webhookForwardUrl}</span></div>}
            {endpoint.responseTemplate && <div><span className="text-muted-foreground">{t('external.form.responseTemplate')}:</span><pre className="mt-1 bg-muted p-2 rounded text-xs overflow-auto">{endpoint.responseTemplate}</pre></div>}
            <div><span className="text-muted-foreground">{t('external.detail.createdAt')}:</span> <span className="font-medium">{new Date(endpoint.createdAt).toLocaleString()}</span></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Regenerate Key Dialog */}
      <AlertDialog open={showRegenDialog} onOpenChange={setShowRegenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('external.confirm.regenerate')}</AlertDialogTitle>
            <AlertDialogDescription>{t('external.confirm.regenerateDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('external.confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate}>{t('external.confirm.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Test Modal */}
      {showTestModal && (
        <TestEndpointModal
          endpointId={Number(id)}
          publicUrl={getPublicUrl()}
          cachedApiKey={revealedKey}
          expectedSchema={endpoint.expectedSchema}
          onRegenerate={async () => {
            if (!id) return null;
            const rowTenantId = (endpoint as any)?.tenantId ?? 0;
            setTargetTenantId(rowTenantId);
            try {
              const updated = await externalEndpointsApi.regenerateKey(Number(id));
              setEndpoint(updated);
              const fresh = (updated as any)?.apiKey;
              // The backend returns the plaintext key once on regenerate. If it
              // comes back masked (contains bullets), there is no plaintext to use.
              if (fresh && typeof fresh === 'string' && !fresh.includes('•')) {
                setRevealedKey(fresh);
                setKeyVisible(true);
                return fresh;
              }
              return null;
            } finally {
              clearTargetTenant();
            }
          }}
          onClose={() => {
            setShowTestModal(false);
            fetchEndpoint();
          }}
        />
      )}
    </div>
  );
}
