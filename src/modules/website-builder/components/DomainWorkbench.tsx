/**
 * Interactive DNS workbench.
 *
 * Given a `SiteConfig` + `HostingPlatform`, renders the exact DNS records the
 * user must add at their registrar, with copy buttons and per-record live
 * verification via Cloudflare DNS-over-HTTPS. Embedded in the export dialog's
 * Domain tab — no backend required.
 */
import { useEffect, useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Check, Copy, Loader2, RefreshCw, ShieldCheck, ShieldAlert, ShieldQuestion,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  previewDnsRecords,
  type SiteConfig,
  type DnsRecord,
} from '../utils/export/domainConfig';
import type { HostingPlatform } from '../utils/export/hostingPresets';
import { resolveMany, clearDohCache } from '../utils/export/dns/dohClient';
import {
  diffRecord, aggregateStatus, toFqdn, toQueryType,
  type RecordVerdict, type AggregateStatus,
} from '../utils/export/dns/recordDiff';

interface DomainWorkbenchProps {
  site: SiteConfig;
  platform: HostingPlatform;
  /** Compact mode drops the aggregate header (used inside the export dialog). */
  compact?: boolean;
}

export function DomainWorkbench({ site, platform, compact = false }: DomainWorkbenchProps) {
  const preview = useMemo(() => previewDnsRecords(site, platform), [site, platform]);
  const [verdicts, setVerdicts] = useState<RecordVerdict[] | null>(null);
  const [busy, setBusy] = useState(false);

  // Reset verdicts whenever the record set changes (domain / platform / handle).
  useEffect(() => { setVerdicts(null); }, [
    preview?.domain, platform, site.providerHandle, site.preferredHost,
  ]);

  const runVerify = useCallback(async () => {
    if (!preview) return;
    setBusy(true);
    try {
      clearDohCache();
      const queries = preview.records.map(r => ({
        name: toFqdn(r.name, preview.domain),
        type: toQueryType(r.type),
      }));
      const results = await resolveMany(queries);
      const next = preview.records.map((r, i) => diffRecord(r, results[i]));
      setVerdicts(next);
    } finally {
      setBusy(false);
    }
  }, [preview]);

  if (!preview) {
    return (
      <div className="p-3 rounded-lg border border-dashed text-xs text-muted-foreground">
        Enter a custom domain above to see DNS records and verify propagation.
      </div>
    );
  }

  const status: AggregateStatus = verdicts ? aggregateStatus(verdicts) : 'not-configured';

  return (
    <div className="space-y-3">
      {!compact && <AggregateBanner status={status} host={preview.primaryHost} />}

      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          Add these at your registrar (Namecheap, Cloudflare DNS, Route 53…).
          {site.providerHandle ? null : (
            <span className="text-amber-600 dark:text-amber-500"> Set the provider handle above so the CNAME target is exact.</span>
          )}
        </p>
        <Button size="sm" variant="outline" onClick={runVerify} disabled={busy} className="shrink-0">
          {busy
            ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            : <RefreshCw className="h-3.5 w-3.5 mr-1.5" />}
          {verdicts ? 'Re-check' : 'Verify DNS'}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border">
        <table className="w-full text-xs">
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-2 py-1.5 font-medium w-14">Type</th>
              <th className="px-2 py-1.5 font-medium w-16">Name</th>
              <th className="px-2 py-1.5 font-medium">Value</th>
              <th className="px-2 py-1.5 font-medium w-24 text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {preview.records.map((r, i) => (
              <RecordRow
                key={`${r.type}-${r.name}-${r.value}-${i}`}
                record={r}
                verdict={verdicts?.[i]}
              />
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-2">
        <RegistrarLink label="Check propagation" href={`https://dnschecker.org/#A/${preview.domain}`} />
        <RegistrarLink label="Cloudflare DNS" href="https://dash.cloudflare.com/?to=/:account/dns" />
        <RegistrarLink label="Namecheap DNS" href="https://ap.www.namecheap.com/domains/list/" />
        <RegistrarLink label="Route 53" href="https://console.aws.amazon.com/route53/v2/hostedzones" />
      </div>
    </div>
  );
}

function AggregateBanner({ status, host }: { status: AggregateStatus; host: string | null }) {
  const map: Record<AggregateStatus, { label: string; icon: React.ReactNode; cls: string }> = {
    'not-configured': {
      label: 'Not verified yet — click "Verify DNS"',
      icon: <ShieldQuestion className="h-4 w-4" />,
      cls: 'bg-muted text-muted-foreground',
    },
    propagating: {
      label: 'Records not detected — add them at your registrar or wait for propagation',
      icon: <Loader2 className="h-4 w-4" />,
      cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/20',
    },
    partial: {
      label: 'Partially live — some records match, others still need attention',
      icon: <ShieldAlert className="h-4 w-4" />,
      cls: 'bg-amber-500/10 text-amber-700 dark:text-amber-500 border-amber-500/20',
    },
    live: {
      label: `Live — ${host} resolves to your host`,
      icon: <ShieldCheck className="h-4 w-4" />,
      cls: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border-emerald-500/20',
    },
    error: {
      label: 'Verification failed — DNS resolver unreachable from your browser',
      icon: <ShieldAlert className="h-4 w-4" />,
      cls: 'bg-destructive/10 text-destructive border-destructive/20',
    },
  };
  const cfg = map[status];
  return (
    <div className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs ${cfg.cls}`}>
      {cfg.icon}
      <span className="font-medium">{cfg.label}</span>
    </div>
  );
}

function RecordRow({ record, verdict }: { record: DnsRecord; verdict?: RecordVerdict }) {
  return (
    <tr className="border-t hover:bg-muted/30">
      <td className="px-2 py-1.5"><Badge variant="outline" className="text-[10px] font-mono">{record.type}</Badge></td>
      <td className="px-2 py-1.5"><CopyCell value={record.name} mono /></td>
      <td className="px-2 py-1.5">
        <CopyCell value={record.value} mono />
        {record.note && <p className="text-[10px] text-muted-foreground mt-0.5">{record.note}</p>}
      </td>
      <td className="px-2 py-1.5 text-right">
        <StatusPill verdict={verdict} />
      </td>
    </tr>
  );
}

function CopyCell({ value, mono }: { value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      toast.error('Copy failed');
    }
  };
  return (
    <button
      type="button"
      onClick={onCopy}
      className="group inline-flex items-center gap-1.5 max-w-full text-left hover:text-primary"
      title="Click to copy"
    >
      <span className={`truncate ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</span>
      {copied
        ? <Check className="h-3 w-3 text-emerald-500 shrink-0" />
        : <Copy className="h-3 w-3 opacity-0 group-hover:opacity-60 shrink-0" />}
    </button>
  );
}

function StatusPill({ verdict }: { verdict?: RecordVerdict }) {
  if (!verdict) return <span className="text-[10px] text-muted-foreground">—</span>;
  const map: Record<RecordVerdict['status'], { label: string; cls: string }> = {
    match:    { label: 'Live',        cls: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-500' },
    partial:  { label: 'Partial',     cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-500' },
    mismatch: { label: 'Wrong value', cls: 'bg-amber-500/15 text-amber-700 dark:text-amber-500' },
    missing:  { label: 'Not set',     cls: 'bg-muted text-muted-foreground' },
    error:    { label: 'Error',       cls: 'bg-destructive/15 text-destructive' },
    pending:  { label: 'Set handle',  cls: 'bg-muted text-muted-foreground' },
  };
  const s = map[verdict.status];
  return (
    <span title={verdict.message} className={`inline-block text-[10px] px-1.5 py-0.5 rounded font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}

function RegistrarLink({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded border hover:border-primary hover:text-primary text-muted-foreground"
    >
      {label} <ExternalLink className="h-3 w-3" />
    </a>
  );
}