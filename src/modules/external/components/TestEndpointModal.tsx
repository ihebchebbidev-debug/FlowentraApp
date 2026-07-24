import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  endpointId: number;
  publicUrl: string;
  /** Plaintext API key (only known immediately after create/regenerate). null when only the hash is available. */
  cachedApiKey: string | null;
  /** JSON-encoded `{ "required": ["field1", ...] }` declared on the endpoint. Used to seed the body with EXACTLY the fields the receiver validates. */
  expectedSchema?: string | null;
  /** Trigger a regenerate from the parent so we can capture a fresh plaintext key. */
  onRegenerate: () => Promise<string | null>;
  onClose: () => void;
}

const CONTENT_TYPES = [
  { value: 'application/json', label: 'JSON', hint: 'application/json' },
  { value: 'application/xml', label: 'XML', hint: 'application/xml' },
  { value: 'application/x-www-form-urlencoded', label: 'Form', hint: 'application/x-www-form-urlencoded' },
] as const;

function extractRequiredFields(expectedSchema?: string | null): string[] {
  if (!expectedSchema) return [];
  try {
    const parsed = JSON.parse(expectedSchema);
    return Array.isArray(parsed?.required)
      ? parsed.required.filter((k: unknown): k is string => typeof k === 'string' && k.trim() !== '')
      : [];
  } catch {
    return [];
  }
}

function sampleValue(key: string): string {
  const lower = key.toLowerCase();
  if (lower.includes('email')) return 'test@example.com';
  if (lower.includes('phone')) return '+1234567890';
  if (lower.includes('quantity') || lower.includes('qty') || lower.includes('count')) return '1';
  if (lower.includes('price') || lower.includes('amount') || lower.includes('total')) return '100';
  if (lower.includes('date')) return new Date().toISOString();
  if (lower.includes('url')) return 'https://example.com';
  if (lower.includes('id')) return 'test-id';
  return `Test ${key}`;
}

function buildJsonBody(required: string[]): string {
  if (required.length === 0) return '{\n  "name": "Test",\n  "email": "test@example.com"\n}';
  const sample: Record<string, unknown> = {};
  for (const key of required) {
    const lower = key.toLowerCase();
    if (lower.includes('email')) sample[key] = 'test@example.com';
    else if (lower.includes('phone')) sample[key] = '+1234567890';
    else if (lower.includes('quantity') || lower.includes('qty') || lower.includes('count')) sample[key] = 1;
    else if (lower.includes('price') || lower.includes('amount') || lower.includes('total')) sample[key] = 100;
    else if (lower.includes('date')) sample[key] = new Date().toISOString();
    else if (lower.includes('url')) sample[key] = 'https://example.com';
    else if (lower.includes('id')) sample[key] = 'test-id';
    else sample[key] = `Test ${key}`;
  }
  return JSON.stringify(sample, null, 2);
}

function buildXmlBody(required: string[]): string {
  const fields = required.length > 0
    ? required.map(k => `  <${k}>${sampleValue(k)}</${k}>`).join('\n')
    : '  <name>Test</name>\n  <email>test@example.com</email>';
  return `<?xml version="1.0" encoding="UTF-8"?>\n<payload>\n${fields}\n</payload>`;
}

function buildFormBody(required: string[]): string {
  if (required.length === 0) return 'name=Test&email=test%40example.com';
  return required.map(k => `${encodeURIComponent(k)}=${encodeURIComponent(sampleValue(k))}`).join('&');
}

function buildSeedBody(contentType: string, required: string[]): string {
  if (contentType === 'application/xml') return buildXmlBody(required);
  if (contentType === 'application/x-www-form-urlencoded') return buildFormBody(required);
  return buildJsonBody(required);
}

/**
 * Tests an endpoint by POSTing directly to the public ingest URL with the
 * `X-API-Key` header. Supports JSON, XML, and form-urlencoded payloads.
 */
export function TestEndpointModal({ endpointId: _endpointId, publicUrl, cachedApiKey, expectedSchema, onRegenerate, onClose }: Props) {
  const { t } = useTranslation();
  const requiredFields = extractRequiredFields(expectedSchema);

  const [contentType, setContentType] = useState<string>('application/json');
  const [body, setBody] = useState(() => buildJsonBody(requiredFields));
  const [apiKey, setApiKey] = useState<string>(cachedApiKey ?? '');
  const [sending, setSending] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: string } | null>(null);

  const handleContentTypeChange = (ct: string) => {
    setContentType(ct);
    setBody(buildSeedBody(ct, requiredFields));
    setResponse(null);
  };

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const fresh = await onRegenerate();
      if (fresh) {
        setApiKey(fresh);
        toast.success(t('external.toast.keyRegenerated', 'API key regenerated'));
      } else {
        toast.error(t('external.test.noPlainKey', 'Backend did not return a plaintext key.'));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to regenerate key';
      toast.error(msg);
    } finally {
      setRegenerating(false);
    }
  };

  const handleSend = async () => {
    if (!apiKey.trim()) {
      toast.error(t('external.test.error', 'Test failed'), {
        description: t(
          'external.test.missingKey',
          'No API key available. Click "Regenerate & use" to obtain a fresh key, or paste one manually.',
        ),
      });
      return;
    }

    // Validate JSON only when sending JSON
    let sendBody = body;
    if (contentType === 'application/json') {
      let parsed: unknown;
      try {
        parsed = JSON.parse(body);
      } catch {
        toast.error(t('external.test.error', 'Test failed'), {
          description: t('external.test.invalidJson', 'Request body is not valid JSON.'),
        });
        return;
      }
      sendBody = JSON.stringify(parsed);
    }

    setSending(true);
    setResponse(null);
    try {
      const res = await fetch(publicUrl, {
        method: 'POST',
        headers: {
          'Content-Type': contentType,
          'X-API-Key': apiKey.trim(),
        },
        body: sendBody,
      });
      const text = await res.text();
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch { /* keep raw text */ }
      setResponse({ status: res.status, body: pretty });
      if (res.ok) {
        toast.success(t('external.test.success', 'Test request sent'));
      } else {
        toast.error(t('external.test.error', 'Test failed'), { description: `HTTP ${res.status}` });
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error';
      setResponse({ status: 0, body: msg });
      toast.error(t('external.test.error', 'Test failed'), { description: msg });
    } finally {
      setSending(false);
    }
  };

  const noKeyAvailable = !apiKey.trim();
  const ctLabel = CONTENT_TYPES.find(c => c.value === contentType)?.label ?? 'JSON';

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('external.test.title', 'Test Endpoint')}</DialogTitle>
          <p className="text-sm text-muted-foreground">
            {t('external.test.descriptionDirect', 'Sends a real POST to the public URL with the X-API-Key header.')}
          </p>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">
              {t('external.detail.publicUrl', 'Public URL')}
            </Label>
            <code className="block text-xs bg-muted px-2 py-1.5 rounded break-all">{publicUrl}</code>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>{t('external.detail.apiKey', 'API Key')}</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleRegenerate}
                disabled={regenerating || sending}
              >
                {regenerating ? (
                  <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                )}
                {t('external.test.regenerateAndUse', 'Regenerate & use')}
              </Button>
            </div>
            <Input
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={t('external.test.keyPlaceholder', 'Paste plaintext API key…')}
              className="font-mono text-xs"
              autoComplete="off"
            />
            {noKeyAvailable && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <span>
                  {t(
                    'external.test.noKeyHint',
                    'The stored key is hashed and cannot be revealed. Click "Regenerate & use" to mint a fresh one (the old key will stop working).',
                  )}
                </span>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t('external.test.contentType', 'Content Type')}</Label>
            <Select value={contentType} onValueChange={handleContentTypeChange}>
              <SelectTrigger className="text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTENT_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>
                    <span className="font-medium">{ct.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">({ct.hint})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <Label>{t('external.test.body', 'Request Body')} ({ctLabel})</Label>
              {requiredFields.length > 0 && (
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-px-10 uppercase tracking-wide text-muted-foreground">
                    {t('external.test.requiredFields', 'Required')}:
                  </span>
                  {requiredFields.map((f) => (
                    <Badge key={f} variant="secondary" className="text-px-10 font-mono">{f}</Badge>
                  ))}
                </div>
              )}
            </div>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="font-mono text-xs"
              placeholder={t('external.test.bodyPlaceholder', 'Enter request payload')}
            />
            {requiredFields.length > 0 && (
              <p className="text-px-11 text-muted-foreground">
                {t(
                  'external.test.bodySeededFromSchema',
                  "Body pre-filled from this endpoint's expected schema. All listed fields must be present and non-empty.",
                )}
              </p>
            )}
          </div>

          {response && (
            <div className="space-y-2">
              <Label>{t('external.test.response', 'Response')}</Label>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={response.status >= 200 && response.status < 300 ? 'default' : 'destructive'}>
                  {response.status === 0 ? 'Network error' : `HTTP ${response.status}`}
                </Badge>
              </div>
              <pre className="bg-muted p-3 rounded text-xs overflow-auto max-h-40 whitespace-pre-wrap break-all">
                {response.body}
              </pre>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('external.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSend} disabled={sending || regenerating}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {sending ? t('external.test.sending', 'Sending…') : t('external.test.send', 'Send Test Request')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
