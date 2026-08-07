import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useExternalEndpoints } from '../hooks/useExternalEndpoints';
import { useExternalTranslations } from '../hooks/useExternalTranslations';
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { TemplatesPicker } from '../components/TemplatesPicker';
import type { EndpointTemplate } from '../utils/endpointTemplates';
import { toast } from 'sonner';

const METHODS = ['GET', 'POST', 'PUT'];
const CONTENT_TYPES = [
  { value: 'json',  label: 'JSON',              hint: 'application/json' },
  { value: 'xml',   label: 'XML',               hint: 'application/xml, text/xml' },
  { value: 'form',  label: 'Form-urlencoded',   hint: 'application/x-www-form-urlencoded' },
] as const;

export function CreateEndpoint() {
  useExternalTranslations();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { createEndpoint } = useExternalEndpoints();
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', slug: '', description: '', isActive: true,
    allowedMethods: 'POST', allowedOrigins: '',
    expectedSchema: '', responseTemplate: '', webhookForwardUrl: '',
    acceptedContentTypes: 'any',
  });

  const selectedMethods = form.allowedMethods.split(',').filter(Boolean);
  const toggleMethod = (method: string) => {
    const methods = selectedMethods.includes(method)
      ? selectedMethods.filter(m => m !== method)
      : [...selectedMethods, method];
    setForm(f => ({ ...f, allowedMethods: methods.join(',') }));
  };

  const selectedContentTypes = form.acceptedContentTypes === 'any' ? [] : form.acceptedContentTypes.split(',').filter(Boolean);
  const toggleContentType = (ct: string) => {
    const next = selectedContentTypes.includes(ct)
      ? selectedContentTypes.filter(c => c !== ct)
      : [...selectedContentTypes, ct];
    setForm(f => ({ ...f, acceptedContentTypes: next.length === 0 ? 'any' : next.join(',') }));
  };
  const acceptAll = form.acceptedContentTypes === 'any' || form.acceptedContentTypes === '';

  // Apply a one-click template. Only overwrites fields the template owns;
  // anything the user already set (e.g. AllowedOrigins for their domain) and
  // is not part of the preset is preserved.
  const applyTemplate = (preset: EndpointTemplate['preset']) => {
    setForm(f => ({
      ...f,
      name: preset.name,
      description: preset.description,
      allowedMethods: preset.allowedMethods,
      // Only overwrite AllowedOrigins if the template explicitly sets one
      // (most templates intentionally leave it blank for the user to fill).
      allowedOrigins: preset.allowedOrigins || f.allowedOrigins,
      expectedSchema: preset.expectedSchema,
      responseTemplate: preset.responseTemplate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    // Guard: at least one HTTP method must be selected. Otherwise the endpoint
    // can never accept traffic and some backends reject the empty value with 400.
    const methods = form.allowedMethods.split(',').map(m => m.trim()).filter(Boolean);
    if (methods.length === 0) {
      toast.error(t('external.toast.error'), { description: 'Select at least one HTTP method' });
      return;
    }

    // Guard: webhook URL must be http/https if provided. Backend SSRF guard
    // throws ArgumentException → 400 for malformed values.
    const webhook = form.webhookForwardUrl.trim();
    if (webhook && !/^https?:\/\//i.test(webhook)) {
      toast.error(t('external.toast.error'), { description: 'Webhook URL must start with http:// or https://' });
      return;
    }

    // In view-all mode the backend rejects mutations without X-Target-Tenant.
    if (isTenantRequired) {
      toast.error(t('external.toast.error'), { description: 'Please select a target company before creating the endpoint.' });
      return;
    }

    setSaving(true);
    try {
      await createEndpoint({
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || undefined,
        isActive: form.isActive,
        allowedMethods: methods.join(','),
        allowedOrigins: form.allowedOrigins.trim() || undefined,
        expectedSchema: form.expectedSchema.trim() || undefined,
        responseTemplate: form.responseTemplate.trim() || undefined,
        webhookForwardUrl: webhook || undefined,
        acceptedContentTypes: form.acceptedContentTypes || 'any',
      });
      navigate('/dashboard/external');
    } catch {
      // Error toast already shown by createEndpoint hook.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate('/dashboard/external')}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-foreground">{t('external.createEndpoint')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <TenantSelector value={targetTenantId} onChange={handleTenantChange} />

        <TemplatesPicker onApply={applyTemplate} />

        
        <Card>
          <CardHeader><CardTitle className="text-base">{t('external.createEndpoint')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('external.form.name')}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder={t('external.form.namePlaceholder')} required />
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.slug')}</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder={t('external.form.slugPlaceholder')} />
              <p className="text-xs text-muted-foreground">{t('external.form.slugHint')}</p>
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.description')}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder={t('external.form.descriptionPlaceholder')} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>{t('external.form.isActive')}</Label>
                <p className="text-xs text-muted-foreground">{t('external.form.isActiveDesc')}</p>
              </div>
              <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('external.form.allowedMethods')}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-4">
              {METHODS.map(m => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={selectedMethods.includes(m)} onCheckedChange={() => toggleMethod(m)} />
                  {m}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('external.form.acceptedContentTypes', 'Accepted Content Types')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <Checkbox
                  checked={acceptAll}
                  onCheckedChange={v => setForm(f => ({ ...f, acceptedContentTypes: v ? 'any' : '' }))}
                />
                {t('external.form.acceptAny', 'Accept any content type')}
              </label>
            </div>
            {!acceptAll && (
              <div className="flex flex-wrap gap-4 pl-1">
                {CONTENT_TYPES.map(ct => (
                  <label key={ct.value} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={selectedContentTypes.includes(ct.value)}
                      onCheckedChange={() => toggleContentType(ct.value)}
                    />
                    <span className="font-medium">{ct.label}</span>
                    <span className="text-xs text-muted-foreground">({ct.hint})</span>
                  </label>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {t('external.form.acceptedContentTypesHint', 'Requests with a non-matching Content-Type will be rejected with HTTP 415. "Accept any" is recommended for maximum compatibility.')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('external.form.allowedOrigins')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={form.allowedOrigins} onChange={e => setForm(f => ({ ...f, allowedOrigins: e.target.value }))} placeholder={t('external.form.allowedOriginsPlaceholder')} />
            <div className="space-y-2">
              <Label>Expected schema (required fields)</Label>
              <Textarea
                value={form.expectedSchema}
                onChange={e => setForm(f => ({ ...f, expectedSchema: e.target.value }))}
                placeholder={'{ "required": ["fullName", "email", "phone"] }'}
                rows={4}
                className="font-mono text-xs"
              />
              <p className="text-xs text-muted-foreground">
                JSON listing required keys. Submissions missing any of them are rejected with HTTP 400. Leave empty to accept any payload.
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.responseTemplate')}</Label>
              <Textarea value={form.responseTemplate} onChange={e => setForm(f => ({ ...f, responseTemplate: e.target.value }))} placeholder={t('external.form.responseTemplatePlaceholder')} rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.webhookForwardUrl')}</Label>
              <Input value={form.webhookForwardUrl} onChange={e => setForm(f => ({ ...f, webhookForwardUrl: e.target.value }))} placeholder={t('external.form.webhookForwardUrlPlaceholder')} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/dashboard/external')}>{t('external.cancel')}</Button>
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? t('external.creating') : t('external.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
