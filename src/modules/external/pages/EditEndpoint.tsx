import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { externalEndpointsApi } from '../services/externalEndpoints.service';
import { useExternalEndpoints } from '../hooks/useExternalEndpoints';
import { useExternalTranslations } from '../hooks/useExternalTranslations';
import { TenantSelector } from '@/components/TenantSelector';
import { useTargetTenant } from '@/hooks/useTargetTenant';
import { toast } from 'sonner';
import type { ExternalEndpoint } from '../types';
import { TemplatesPicker } from '../components/TemplatesPicker';
import type { EndpointTemplate } from '../utils/endpointTemplates';

const METHODS = ['GET', 'POST', 'PUT'];

export function EditEndpoint() {
  useExternalTranslations();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { updateEndpoint } = useExternalEndpoints();
  // View-all mode requires picking a target tenant before update mutations.
  const { targetTenantId, handleTenantChange, isTenantRequired } = useTargetTenant();
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [endpoint, setEndpoint] = useState<ExternalEndpoint | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', isActive: true,
    allowedMethods: 'POST', allowedOrigins: '',
    expectedSchema: '', responseTemplate: '', webhookForwardUrl: '',
  });

  useEffect(() => {
    if (!id) return;
    externalEndpointsApi.getById(Number(id)).then(ep => {
      setEndpoint(ep);
      setForm({
        name: ep.name, description: ep.description || '', isActive: ep.isActive,
        allowedMethods: ep.allowedMethods, allowedOrigins: ep.allowedOrigins || '',
        expectedSchema: ep.expectedSchema || '', responseTemplate: ep.responseTemplate || '',
        webhookForwardUrl: ep.webhookForwardUrl || '',
      });
      // Pre-seed the target tenant from the endpoint we're editing so the
      // form doesn't force the admin to manually pick a company that's
      // already implied by the record itself.
      const tid = (ep as any)?.tenantId;
      if (typeof tid === 'number') handleTenantChange(tid);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [id]);

  const selectedMethods = form.allowedMethods.split(',').filter(Boolean);
  const toggleMethod = (method: string) => {
    const methods = selectedMethods.includes(method) ? selectedMethods.filter(m => m !== method) : [...selectedMethods, method];
    setForm(f => ({ ...f, allowedMethods: methods.join(',') }));
  };

  // Apply a template: keep current name (if user already named it) and active state,
  // overwrite the schema/methods/origins/response/description with the preset.
  const applyTemplate = (preset: EndpointTemplate['preset']) => {
    setForm(f => ({
      ...f,
      name: f.name?.trim() ? f.name : preset.name,
      description: preset.description,
      allowedMethods: preset.allowedMethods,
      allowedOrigins: preset.allowedOrigins,
      expectedSchema: preset.expectedSchema,
      responseTemplate: preset.responseTemplate,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !form.name.trim()) return;
    if (isTenantRequired) {
      toast.error(t('external.toast.error'), { description: 'Please select a target company before saving changes.' });
      return;
    }
    setSaving(true);
    try {
      await updateEndpoint(Number(id), {
        ...form,
        allowedOrigins: form.allowedOrigins || undefined,
        expectedSchema: form.expectedSchema || undefined,
        responseTemplate: form.responseTemplate || undefined,
        webhookForwardUrl: form.webhookForwardUrl || undefined,
      });
      navigate(`/dashboard/external/${id}`);
    } catch {} finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon-sm" onClick={() => navigate(`/dashboard/external/${id}`)}><ArrowLeft className="h-4 w-4" /></Button>
        <h1 className="text-2xl font-bold text-foreground">{t('external.editEndpoint')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <TenantSelector value={targetTenantId ?? (endpoint as any)?.tenantId} onChange={handleTenantChange} />

        <TemplatesPicker onApply={applyTemplate} />


        <Card>
          <CardHeader><CardTitle className="text-base">{t('external.editEndpoint')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{t('external.form.name')}</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.description')}</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>{t('external.form.isActive')}</Label><p className="text-xs text-muted-foreground">{t('external.form.isActiveDesc')}</p></div>
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
                  <Checkbox checked={selectedMethods.includes(m)} onCheckedChange={() => toggleMethod(m)} />{m}
                </label>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">{t('external.form.allowedOrigins')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Input value={form.allowedOrigins} onChange={e => setForm(f => ({ ...f, allowedOrigins: e.target.value }))} placeholder={t('external.form.allowedOriginsPlaceholder')} />
            <div className="space-y-2">
              <Label>Expected schema (JSON)</Label>
              <Textarea
                value={form.expectedSchema}
                onChange={e => setForm(f => ({ ...f, expectedSchema: e.target.value }))}
                rows={6}
                className="font-mono text-xs"
                placeholder='{"required":["fullName","email","phone"]}'
              />
              <p className="text-xs text-muted-foreground">
                Required keys are enforced server-side. Leave blank to accept any payload.
              </p>
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.responseTemplate')}</Label>
              <Textarea value={form.responseTemplate} onChange={e => setForm(f => ({ ...f, responseTemplate: e.target.value }))} rows={3} className="font-mono text-xs" />
            </div>
            <div className="space-y-2">
              <Label>{t('external.form.webhookForwardUrl')}</Label>
              <Input value={form.webhookForwardUrl} onChange={e => setForm(f => ({ ...f, webhookForwardUrl: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate(`/dashboard/external/${id}`)}>{t('external.cancel')}</Button>
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {saving ? t('external.updating') : t('external.save')}
          </Button>
        </div>
      </form>
    </div>
  );
}
