import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, FileSpreadsheet, FileText, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { ReportShell } from '../components/ReportShell';

type ExportFormat = 'xlsx' | 'pdf' | 'csv';
const scopes = ['sales', 'service', 'finance', 'hr', 'purchase'] as const;

export const ExportReports = () => {
  const { t } = useTranslation('reporting');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [format, setFormat] = useState<ExportFormat>('xlsx');
  const [selected, setSelected] = useState<Record<string, boolean>>({ sales: true, service: true });

  const toggle = (k: string) => setSelected((s) => ({ ...s, [k]: !s[k] }));
  const submit = () => {
    const picked = Object.entries(selected).filter(([, v]) => v).map(([k]) => k);
    if (!picked.length) {
      toast({ title: t('export.pickOne', 'Select at least one report'), variant: 'destructive' });
      return;
    }
    toast({
      title: t('export.queued', 'Export queued'),
      description: t('export.queuedDesc', 'Backend export generation is not yet implemented — the UI is ready for wiring.'),
    });
  };

  return (
    <ReportShell
      icon={Download}
      tone="info"
      title={t('export.title', 'Export Reports')}
      subtitle={t('export.subtitle', 'Download report data in your preferred format')}
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">{t('export.settings', 'Export Settings')}</h3>

          <div className="space-y-4">
            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('export.dateRange', 'Date Range')}</Label>
              <div className="mt-2 flex gap-2">
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
              </div>
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('export.format', 'Format')}</Label>
              <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="mt-2 flex gap-4">
                {[
                  { v: 'xlsx', Icon: FileSpreadsheet, label: 'Excel', cls: 'text-[hsl(142_64%_38%)]' },
                  { v: 'pdf', Icon: FileText, label: 'PDF', cls: 'text-destructive' },
                  { v: 'csv', Icon: FileCode2, label: 'CSV', cls: 'text-info' },
                ].map((f) => (
                  <label key={f.v} className="flex cursor-pointer items-center gap-2 text-xs">
                    <RadioGroupItem value={f.v} />
                    <f.Icon className={`h-4 w-4 ${f.cls}`} />
                    <span className="font-medium">{f.label}</span>
                  </label>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{t('export.reports', 'Reports to Include')}</Label>
              <div className="mt-2 space-y-2">
                {scopes.map((s) => (
                  <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md p-1 hover:bg-muted">
                    <Checkbox checked={!!selected[s]} onCheckedChange={() => toggle(s)} />
                    <span className="text-xs font-medium capitalize">{s} Dashboard</span>
                  </label>
                ))}
              </div>
            </div>

            <Button className="w-full" onClick={submit}>
              <Download className="mr-2 h-4 w-4" />
              {t('export.generate', 'Generate Export')}
            </Button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-5 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold">{t('export.recent', 'Recent Exports')}</h3>
          <div className="rounded-md border border-dashed p-8 text-center">
            <FileText className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-xs text-muted-foreground">{t('export.noExports', 'No exports yet. Generate one to see it here.')}</p>
          </div>
        </div>
      </div>
    </ReportShell>
  );
};
