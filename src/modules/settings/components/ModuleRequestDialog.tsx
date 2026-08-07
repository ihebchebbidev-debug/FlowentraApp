/**
 * ModuleRequestDialog
 * Lets a tenant user request activation (purchase) or deactivation of a module.
 * The request is emailed to the Flowentra contact inbox by the backend.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { moduleRequestsApi, type ModuleRequestAction } from '@/services/api/moduleRequestsApi';
import { getCurrentTenant } from '@/utils/tenant';

export interface ModuleRequestTarget {
  action: ModuleRequestAction;
  moduleCode: string;
  moduleKey: string;
  moduleName: string;
  currentlyEnabled: boolean;
}

interface ModuleRequestDialogProps {
  target: ModuleRequestTarget | null;
  onOpenChange: (open: boolean) => void;
}

export function ModuleRequestDialog({ target, onOpenChange }: ModuleRequestDialogProps) {
  const { t } = useTranslation('settings');
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const MIN_REASON = 10;
  const trimmedReason = reason.trim();
  const reasonError =
    trimmedReason.length === 0
      ? t('subscription.moduleRequest.reasonRequired', 'A message is required.')
      : trimmedReason.length < MIN_REASON
        ? t('subscription.moduleRequest.reasonTooShort', {
            defaultValue: 'Please give us at least {{count}} characters of context.',
            count: MIN_REASON,
          })
        : null;

  const isDeactivate = target?.action === 'deactivate';
  const tenant = getCurrentTenant() ?? '—';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  const close = (open: boolean) => {
    if (!open) {
      setReason('');
      setTouched(false);
    }
    onOpenChange(open);
  };

  const submit = async () => {
    if (!target) return;
    setTouched(true);
    if (reasonError) return;
    setSubmitting(true);
    try {
      const res = await moduleRequestsApi.create({
        action: target.action,
        moduleCode: target.moduleCode,
        moduleKey: target.moduleKey,
        moduleName: target.moduleName,
        currentlyEnabled: target.currentlyEnabled,
        reason: trimmedReason,
      });
      if (!res || res.success !== true) throw new Error(res?.error || 'Request failed');
      toast({
        title: t('subscription.moduleRequest.sentTitle', 'Request sent'),
        description: t('subscription.moduleRequest.sentDesc', {
          defaultValue: 'Our team has been notified and will get back to you shortly.',
        }),
      });
      close(false);
    } catch {
      toast({
        title: t('subscription.error', 'Error'),
        description: t('subscription.moduleRequest.failed', 'Could not send your request. Please try again.'),
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={!!target} onOpenChange={close}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">
            {isDeactivate
              ? t('subscription.moduleRequest.deactivateTitle', 'Request module deactivation')
              : t('subscription.moduleRequest.activateTitle', 'Request module activation')}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isDeactivate
              ? t('subscription.moduleRequest.deactivateDesc', 'We will review your request and disable this module for your workspace.')
              : t('subscription.moduleRequest.activateDesc', 'We will review your request and send you the details to add this module to your subscription.')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-lg border border-border/50 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground truncate">{target?.moduleName}</span>
              <Badge variant={target?.currentlyEnabled ? 'success' : 'secondary'} className="text-xs shrink-0">
                {target?.currentlyEnabled
                  ? t('plugins.statusActive', 'Active')
                  : t('plugins.statusInactive', 'Inactive')}
              </Badge>
            </div>
            <InfoRow label={t('subscription.moduleRequest.moduleCode', 'Module code')} value={target?.moduleCode ?? ''} mono />
            <InfoRow label={t('subscription.moduleRequest.tenant', 'Workspace')} value={tenant} />
            <InfoRow label={t('subscription.moduleRequest.url', 'URL')} value={origin} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="module-request-reason" className="text-xs">
              {t('subscription.moduleRequest.reasonLabel', 'Message to our team')}
              <span className="text-destructive ml-0.5">*</span>
            </Label>
            <Textarea
              id="module-request-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 2000))}
              onBlur={() => setTouched(true)}
              aria-invalid={touched && !!reasonError}
              aria-describedby="module-request-reason-error"
              rows={4}
              className={`text-xs ${touched && reasonError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              placeholder={t('subscription.moduleRequest.reasonPlaceholder', 'Tell us why you need this change…')}
            />
            <div className="flex items-start justify-between gap-3">
              <p id="module-request-reason-error" className="text-px-10 text-destructive">
                {touched && reasonError ? reasonError : ''}
              </p>
              <p className="text-px-10 text-muted-foreground shrink-0">{reason.length}/2000</p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => close(false)} disabled={submitting}>
            {t('confirm.cancel', 'Cancel')}
          </Button>
          <Button size="sm" onClick={submit} disabled={submitting || !!reasonError}>
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {t('subscription.moduleRequest.send', 'Send request')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-xs text-muted-foreground shrink-0">{label}</span>
      <span className={`text-xs text-foreground truncate ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  );
}

export default ModuleRequestDialog;