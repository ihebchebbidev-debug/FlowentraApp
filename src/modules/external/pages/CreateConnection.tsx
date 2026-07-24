import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Loader2, CheckCircle2, Copy, ExternalLink,
  ChevronDown, ChevronUp, Shield, Plug, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useExternalEndpoints } from '../hooks/useExternalEndpoints';
import { useExternalTranslations } from '../hooks/useExternalTranslations';
import { getConnectorById, CONNECTOR_CATALOG } from '../utils/connectorCatalog';
import type { ConnectorEntityConfig } from '../utils/connectorCatalog';
import type { ExternalEndpoint } from '../types';
import { API_URL } from '@/config/api';

const MODULE_LABELS: Record<string, string> = {
  sales:               'Sales',
  offers:              'Offers',
  contacts:            'Contacts',
  purchases:           'Purchases',
  'inventory-services': 'Inventory',
};

function getPublicUrl(slug: string) {
  return `${API_URL.replace(/\/$/, '')}/api/external-receive/${slug}`;
}

// ─── Success state ────────────────────────────────────────────────────────────

function SuccessPanel({
  connector,
  created,
  onManage,
  onBack,
}: {
  connector: ReturnType<typeof getConnectorById>;
  created: ExternalEndpoint[];
  onManage: (id: number) => void;
  onBack: () => void;
}) {
  const { t } = useTranslation();
  const [showInstructions, setShowInstructions] = useState(true);
  if (!connector) return null;

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="flex items-center gap-4 p-4">
          <CheckCircle2 className="h-8 w-8 text-emerald-500 shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              {t('connection.success', 'Integration Created!')}
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              {t('connection.successDesc', { name: connector.name, defaultValue: `Your webhook endpoint(s) for ${connector.name} are ready. Follow the instructions below to finish the setup.` })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Created endpoints */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            {t('connection.endpointsCreated', { count: created.length, defaultValue: `${created.length} endpoint(s) created` })}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {created.map(ep => (
            <div key={ep.id} className="rounded-lg border bg-muted/30 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium text-sm text-foreground">{ep.name}</p>
                <Button variant="ghost" size="sm" onClick={() => onManage(ep.id)}>
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  {t('hub.manage', 'Manage')}
                </Button>
              </div>

              {/* Webhook URL */}
              <div className="space-y-1">
                <p className="text-px-11 text-muted-foreground font-medium uppercase tracking-wide">
                  {t('external.detail.publicUrl')}
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-background border rounded px-2 py-1.5 truncate">
                    {getPublicUrl(ep.slug)}
                  </code>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    onClick={() => copyText(getPublicUrl(ep.slug), 'Webhook URL')}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* API key hint */}
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded p-2">
                <Shield className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p>{t('connection.apiKeyHint', 'Reveal and copy the API key from the endpoint detail page, then add it as the X-API-Key header in your external system.')}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Setup instructions */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer select-none"
          onClick={() => setShowInstructions(s => !s)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              {t('connection.setupInstructions', 'Setup Instructions')} — {connector.name}
            </CardTitle>
            {showInstructions
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
        </CardHeader>
        {showInstructions && (
          <CardContent>
            <ol className="space-y-2">
              {connector.setupInstructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-none w-5 h-5 rounded-full bg-primary/10 text-primary text-px-11 font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
            {connector.docUrl && (
              <a
                href={connector.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-4"
              >
                <ExternalLink className="h-3 w-3" />
                {t('connection.officialDocs', 'Official documentation')}
              </a>
            )}
          </CardContent>
        )}
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onBack}>{t('hub.backToHub', 'Back to Hub')}</Button>
        {created.length === 1 && (
          <Button onClick={() => onManage(created[0].id)}>
            <ExternalLink className="h-4 w-4 mr-2" />
            {t('connection.viewEndpoint', 'View Endpoint')}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function CreateConnection() {
  useExternalTranslations();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { connectorId } = useParams<{ connectorId: string }>();
  const { createEndpoint } = useExternalEndpoints();

  const connector = connectorId ? getConnectorById(connectorId) : undefined;

  // Which entities the user wants to sync
  const [selectedEntities, setSelectedEntities] = useState<Set<string>>(
    () => new Set(connector?.entities.map(e => e.type) ?? []),
  );
  const [saving, setSaving] = useState(false);
  const [createdEndpoints, setCreatedEndpoints] = useState<ExternalEndpoint[] | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  if (!connector) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center space-y-4">
        <p className="text-lg font-semibold text-foreground">{t('connection.notFound', 'Integration not found')}</p>
        <p className="text-sm text-muted-foreground">{t('connection.notFoundDesc', 'The requested integration connector does not exist.')}</p>
        <Button variant="outline" onClick={() => navigate('/dashboard/external')}>
          <ArrowLeft className="h-4 w-4 mr-2" />{t('hub.backToHub', 'Back to Hub')}
        </Button>
      </div>
    );
  }

  const toggleEntity = (type: string) => {
    setSelectedEntities(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type); else next.add(type);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedEntities.size === connector.entities.length) {
      setSelectedEntities(new Set());
    } else {
      setSelectedEntities(new Set(connector.entities.map(e => e.type)));
    }
  };

  const handleCreate = async () => {
    const toCreate = connector.entities.filter(e => selectedEntities.has(e.type));
    if (toCreate.length === 0) {
      toast.error(t('connection.minOneEntity', 'Please select at least one entity to sync.'));
      return;
    }

    setSaving(true);
    try {
      const results = await Promise.all(
        toCreate.map((entity: ConnectorEntityConfig) =>
          createEndpoint({
            name: `${connector.name} — ${entity.label}`,
            slug: entity.templateSlug,
            description: `connector:${connector.id}:${entity.type} — Auto-created by the ${connector.name} integration.`,
            isActive: true,
            allowedMethods: 'POST',
            allowedOrigins: '*',
            expectedSchema: Object.keys(entity.expectedSchema).length
              ? JSON.stringify(entity.expectedSchema, null, 2)
              : undefined,
            responseTemplate: JSON.stringify(entity.responseTemplate, null, 2),
          }),
        ),
      );
      setCreatedEndpoints(results.filter(Boolean) as ExternalEndpoint[]);
    } catch (e: any) {
      // Individual errors already shown by createEndpoint hook
    } finally {
      setSaving(false);
    }
  };

  // ── After successful creation ──
  if (createdEndpoints) {
    return (
      <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => navigate('/dashboard/external')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{connector.logo}</span>
            <h1 className="text-xl font-bold text-foreground">
              {t('connection.title', { name: connector.name, defaultValue: `Connect ${connector.name}` })}
            </h1>
          </div>
        </div>
        <SuccessPanel
          connector={connector}
          created={createdEndpoints}
          onManage={id => navigate(`/dashboard/external/${id}`)}
          onBack={() => navigate('/dashboard/external')}
        />
      </div>
    );
  }

  // ── Configuration form ──
  const categoryLabel = CONNECTOR_CATALOG.find(c => c.id === connector.id)?.category ?? '';
  const allSelected = selectedEntities.size === connector.entities.length;

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/dashboard/external')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{connector.logo}</span>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {t('connection.title', { name: connector.name, defaultValue: `Connect ${connector.name}` })}
            </h1>
            <p className="text-xs text-muted-foreground">{connector.vendor} · {categoryLabel.toUpperCase()}</p>
          </div>
        </div>
      </div>

      {/* About */}
      <Card style={{ borderLeft: `3px solid ${connector.color}` }}>
        <CardContent className="p-4">
          <p className="text-sm text-foreground/80">{connector.description}</p>
          {connector.signatureHeader && (
            <div className="flex items-center gap-2 mt-3 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded px-2 py-1.5">
              <Shield className="h-3.5 w-3.5 shrink-0" />
              {t('connection.signatureNote', { header: connector.signatureHeader, defaultValue: `This connector supports HMAC signature verification via the ${connector.signatureHeader} header.` })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Entity selection */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              {t('connection.selectEntities', 'Select entities to sync')}
            </CardTitle>
            <Button variant="ghost" size="sm" onClick={toggleAll} className="text-xs h-7">
              {allSelected
                ? t('connection.deselectAll', 'Deselect all')
                : t('connection.selectAll', 'Select all')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {connector.entities.map(entity => (
            <label
              key={entity.type}
              className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/40 cursor-pointer transition-colors"
            >
              <Checkbox
                checked={selectedEntities.has(entity.type)}
                onCheckedChange={() => toggleEntity(entity.type)}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{entity.label}</p>
                <p className="text-xs text-muted-foreground">
                  {entity.erpObjectName} → <Badge variant="outline" className="text-px-10 px-1 py-0">{MODULE_LABELS[entity.targetModule] ?? entity.targetModule}</Badge>
                </p>
              </div>
              {selectedEntities.has(entity.type) && (
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              )}
            </label>
          ))}
        </CardContent>
      </Card>

      {/* What gets created preview */}
      {selectedEntities.size > 0 && (
        <Card className="bg-muted/30">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t('connection.willCreate', 'What will be created')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {connector.entities.filter(e => selectedEntities.has(e.type)).map(e => (
              <div key={e.type} className="flex items-center gap-2 text-sm">
                <Plug className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium">{connector.name} — {e.label}</span>
                <span className="text-muted-foreground text-xs">webhook endpoint</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Setup instructions (collapsed) */}
      <Card>
        <CardHeader
          className="pb-3 cursor-pointer select-none"
          onClick={() => setShowInstructions(s => !s)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Info className="h-4 w-4 text-primary" />
              {t('connection.setupInstructions', 'Setup Instructions')}
            </CardTitle>
            {showInstructions
              ? <ChevronUp className="h-4 w-4 text-muted-foreground" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
          </div>
          {!showInstructions && (
            <p className="text-xs text-muted-foreground">
              {t('connection.setupHint', 'Shown after creation — click to preview now.')}
            </p>
          )}
        </CardHeader>
        {showInstructions && (
          <CardContent>
            <ol className="space-y-2">
              {connector.setupInstructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="flex-none w-5 h-5 rounded-full bg-primary/10 text-primary text-px-11 font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-foreground/80">{step}</span>
                </li>
              ))}
            </ol>
            {connector.docUrl && (
              <a
                href={connector.docUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-4"
              >
                <ExternalLink className="h-3 w-3" />
                {t('connection.officialDocs', 'Official documentation')}
              </a>
            )}
          </CardContent>
        )}
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/dashboard/external')}>
          {t('external.cancel')}
        </Button>
        <Button
          onClick={handleCreate}
          disabled={saving || selectedEntities.size === 0}
          className="gap-2"
        >
          {saving
            ? <><Loader2 className="h-4 w-4 animate-spin" />{t('connection.creating', 'Creating...')}</>
            : <><Plug className="h-4 w-4" />{t('connection.create', 'Create Integration')}</>}
        </Button>
      </div>
    </div>
  );
}
