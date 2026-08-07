import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Download,
  FileSpreadsheet,
  FileCode2,
  Loader2,
  Files,
  FileArchive,
  Check,
  Circle,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import { ReportShell } from '../components/ReportShell';
import { reportingApi, type ReportFilters } from '../services/reportingApi';
import {
  buildSections,
  downloadCsv,
  downloadXlsx,
  type ExportFormat,
  type ExportScope,
} from '../utils/exportReport';
import { buildXlsxI18n } from '../utils/xlsxI18n';

const scopes: ExportScope[] = ['sales', 'service', 'finance', 'hr', 'purchase'];
type Combine = 'single' | 'per-report';

const PREFS_KEY = 'reporting.exportPrefs.v1';
type Prefs = {
  from: string;
  to: string;
  format: ExportFormat;
  combine: Combine;
  selected: Record<ExportScope, boolean>;
};
const defaultPrefs: Prefs = {
  from: '',
  to: '',
  format: 'xlsx',
  combine: 'single',
  selected: { sales: true, service: true, finance: true, hr: true, purchase: true },
};

const loadPrefs = (): Prefs => {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return defaultPrefs;
    const p = JSON.parse(raw);
    return {
      ...defaultPrefs,
      ...p,
      selected: { ...defaultPrefs.selected, ...(p.selected || {}) },
    };
  } catch {
    return defaultPrefs;
  }
};

const fetchByScope = (scope: ExportScope, f: ReportFilters) => {
  switch (scope) {
    case 'sales': return reportingApi.getSalesReport(f);
    case 'service': return reportingApi.getServiceReport(f);
    case 'finance': return reportingApi.getFinanceReport(f);
    case 'hr': return reportingApi.getHrReport(f);
    case 'purchase': return reportingApi.getPurchaseReport(f);
  }
};

type StepStatus = 'pending' | 'active' | 'done' | 'error';
type Step = { id: string; scope: ExportScope; label: string; phase: 'fetch' | 'write'; status: StepStatus };

export const ExportReports = () => {
  const { t } = useTranslation('reporting');
  const xlsxI18n = useMemo(() => buildXlsxI18n(t), [t]);
  const initial = useMemo(loadPrefs, []);
  const [from, setFrom] = useState(initial.from);
  const [to, setTo] = useState(initial.to);
  const [format, setFormat] = useState<ExportFormat>(initial.format);
  const [combine, setCombine] = useState<Combine>(initial.combine);
  const [selected, setSelected] = useState<Record<ExportScope, boolean>>(initial.selected);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [recent, setRecent] = useState<{ name: string; at: string }[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ from, to, format, combine, selected }));
    } catch { /* ignore */ }
  }, [from, to, format, combine, selected]);

  const toggle = (k: ExportScope) => setSelected((s) => ({ ...s, [k]: !s[k] }));

  const updateStep = (id: string, status: StepStatus) =>
    setSteps((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s)));

  const donePct = () => {
    if (!steps.length) return 0;
    const done = steps.filter((s) => s.status === 'done').length;
    return Math.round((done / steps.length) * 100);
  };

  const submit = async () => {
    const picked = scopes.filter((s) => selected[s]);
    if (!picked.length) {
      toast({ title: t('export.pickOne', 'Select at least one report'), variant: 'destructive' });
      return;
    }
    setBusy(true);

    try {
      const filters: ReportFilters = {};
      if (from) filters.dateFrom = from;
      if (to) filters.dateTo = to;

      // Phase 1: fetch steps (one per scope).
      const fetchSteps: Step[] = picked.map((s) => ({
        id: `fetch-${s}`,
        scope: s,
        label: t(`${s}.title`, `${s} Dashboard`),
        phase: 'fetch',
        status: 'pending',
      }));
      setSteps(fetchSteps);

      const results: { scope: ExportScope; data: any }[] = [];
      for (const scope of picked) {
        updateStep(`fetch-${scope}`, 'active');
        // eslint-disable-next-line no-await-in-loop
        const data = await fetchByScope(scope, filters);
        results.push({ scope, data });
        updateStep(`fetch-${scope}`, 'done');
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 0));
      }

      // Phase 2: build sections + create write steps per sheet/file.
      const workbookSections = results.map(({ scope, data }) => ({
        scope,
        sections: buildSections(scope, data),
      }));

      const writeSteps: Step[] =
        combine === 'per-report'
          ? workbookSections.map(({ scope }) => ({
              id: `write-${scope}`,
              scope,
              label: `${t(`${scope}.title`, `${scope} Dashboard`)} — ${format.toUpperCase()}`,
              phase: 'write',
              status: 'pending',
            }))
          : workbookSections.flatMap(({ scope, sections }) =>
              sections.map((s) => ({
                id: `write-${scope}-${s.name}`,
                scope,
                label: `${t(`${scope}.title`, scope)} — ${s.name}`,
                phase: 'write' as const,
                status: 'pending' as const,
              })),
            );

      setSteps([...fetchSteps, ...writeSteps]);

      const stamp = new Date().toISOString().slice(0, 10);
      const base = `reports-${stamp}`;
      let filesCreated: string[] = [];

      if (combine === 'per-report') {
        for (const w of workbookSections) {
          const id = `write-${w.scope}`;
          updateStep(id, 'active');
          const name =
            format === 'csv' ? `${w.scope}-report-${stamp}.csv` : `${w.scope}-report-${stamp}.xlsx`;
          // eslint-disable-next-line no-await-in-loop
          if (format === 'csv') await downloadCsv(name, w.sections, undefined, xlsxI18n);
          // eslint-disable-next-line no-await-in-loop
          else await downloadXlsx(name, [w], undefined, xlsxI18n);
          filesCreated.push(name);
          updateStep(id, 'done');
          // eslint-disable-next-line no-await-in-loop
          await new Promise((r) => setTimeout(r, 250));
        }
      } else if (format === 'csv') {
        const fileName = `${base}.csv`;
        const flat = workbookSections.flatMap(({ scope, sections }) =>
          sections.map((s) => ({ ...s, name: `${scope} — ${s.name}` })),
        );
        await downloadCsv(fileName, flat, ({ label }) => {
          const step = writeSteps.find((st) => label.endsWith(st.label.split(' — ')[1] ?? ''));
          if (step) updateStep(step.id, 'active');
        }, xlsxI18n);
        writeSteps.forEach((s) => updateStep(s.id, 'done'));
        filesCreated = [fileName];
      } else {
        const fileName = `${base}.xlsx`;
        await downloadXlsx(fileName, workbookSections, ({ label }) => {
          const [scope, section] = label.split(' — ');
          const step = writeSteps.find((s) => s.id === `write-${scope}-${section}`);
          if (step) updateStep(step.id, 'active');
        }, xlsxI18n);
        writeSteps.forEach((s) => updateStep(s.id, 'done'));
        filesCreated = [fileName];
      }

      const now = new Date().toLocaleString();
      setRecent((r) => [...filesCreated.map((n) => ({ name: n, at: now })), ...r].slice(0, 8));
      toast({
        title: t('export.ready', 'Export ready'),
        description: filesCreated.join(', '),
      });
    } catch (e: any) {
      setSteps((prev) => prev.map((s) => (s.status === 'active' ? { ...s, status: 'error' } : s)));
      toast({
        title: t('export.failed', 'Export failed'),
        description: e?.message || String(e),
        variant: 'destructive',
      });
    } finally {
      setBusy(false);
      setTimeout(() => setSteps([]), 800);
    }
  };

  const pct = donePct();
  const activeStep = steps.find((s) => s.status === 'active');

  return (
    <ReportShell
      icon={Download}
      tone="info"
      title={t('export.title', 'Export Reports')}
      subtitle={t('export.subtitle', 'Download report data in your preferred format')}
    >
      <div className="relative">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">{t('export.settings', 'Export Settings')}</h3>

            <div className="space-y-4">
              <div>
                <Label className="text-px-11 font-semibold uppercase tracking-wide text-muted-foreground">{t('export.dateRange', 'Date Range')}</Label>
                <div className="mt-2 flex gap-2">
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
                </div>
              </div>

              <div>
                <Label className="text-px-11 font-semibold uppercase tracking-wide text-muted-foreground">{t('export.format', 'Format')}</Label>
                <RadioGroup value={format} onValueChange={(v) => setFormat(v as ExportFormat)} className="mt-2 flex gap-4">
                  {[
                    { v: 'xlsx' as const, Icon: FileSpreadsheet, label: 'Excel', cls: 'text-[hsl(142_64%_38%)]' },
                    { v: 'csv' as const, Icon: FileCode2, label: 'CSV', cls: 'text-info' },
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
                <Label className="text-px-11 font-semibold uppercase tracking-wide text-muted-foreground">{t('export.layout', 'File Layout')}</Label>
                <RadioGroup value={combine} onValueChange={(v) => setCombine(v as Combine)} className="mt-2 grid gap-2">
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs hover:bg-muted">
                    <RadioGroupItem value="single" className="mt-0.5" />
                    <FileArchive className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-semibold">{t('export.layoutSingle', 'Single workbook (multi-sheet)')}</div>
                      <div className="text-muted-foreground">{t('export.layoutSingleDesc', 'All selected reports as sheets in one file.')}</div>
                    </div>
                  </label>
                  <label className="flex cursor-pointer items-start gap-2 rounded-md border p-2 text-xs hover:bg-muted">
                    <RadioGroupItem value="per-report" className="mt-0.5" />
                    <Files className="mt-0.5 h-4 w-4 text-primary" />
                    <div>
                      <div className="font-semibold">{t('export.layoutPer', 'One file per report')}</div>
                      <div className="text-muted-foreground">{t('export.layoutPerDesc', 'Separate download for each selected report.')}</div>
                    </div>
                  </label>
                </RadioGroup>
              </div>

              <div>
                <Label className="text-px-11 font-semibold uppercase tracking-wide text-muted-foreground">{t('export.reports', 'Reports to Include')}</Label>
                <div className="mt-2 space-y-2">
                  {scopes.map((s) => (
                    <label key={s} className="flex cursor-pointer items-center gap-2 rounded-md p-1 hover:bg-muted">
                      <Checkbox checked={!!selected[s]} onCheckedChange={() => toggle(s)} />
                      <span className="text-xs font-medium capitalize">{t(`${s}.title`, `${s} Dashboard`)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <Button className="w-full" onClick={submit} disabled={busy}>
                {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                {busy ? t('export.generating', 'Generating…') : t('export.generate', 'Generate Export')}
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-card p-5 shadow-sm">
            <h3 className="mb-4 text-sm font-semibold">{t('export.recent', 'Recent Exports')}</h3>
            {recent.length === 0 ? (
              <div className="rounded-md border border-dashed p-8 text-center">
                <FileSpreadsheet className="mx-auto h-8 w-8 text-muted-foreground/40" />
                <p className="mt-2 text-xs text-muted-foreground">{t('export.noExports', 'No exports yet. Generate one to see it here.')}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-center justify-between rounded-md border p-2 text-xs">
                    <span className="truncate font-medium">{r.name}</span>
                    <span className="text-muted-foreground">{r.at}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {busy && (
          <div
            className="absolute inset-0 z-50 flex items-center justify-center rounded-lg bg-foreground/25 backdrop-blur-sm dark:bg-background/60"
            role="status"
            aria-live="polite"
            aria-busy="true"
          >
            <div className="w-[min(460px,92%)] rounded-xl border bg-card p-5 shadow-xl">
              <div className="flex items-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold">
                    {activeStep
                      ? activeStep.phase === 'fetch'
                        ? t('export.phaseFetching', 'Fetching data')
                        : t('export.phaseWriting', 'Writing file')
                      : t('export.generating', 'Generating…')}
                  </div>
                  {activeStep && (
                    <div className="truncate text-xs text-muted-foreground">{activeStep.label}</div>
                  )}
                </div>
                <div className="text-xs font-semibold tabular-nums text-muted-foreground">{pct}%</div>
              </div>
              <Progress value={pct} className="mt-3 h-2" />

              {steps.length > 0 && (
                <ul className="mt-4 max-h-56 space-y-1 overflow-auto pr-1 text-xs">
                  {steps.map((s) => (
                    <li key={s.id} className="flex items-center gap-2 rounded-md px-2 py-1">
                      {s.status === 'done' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : s.status === 'active' ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      ) : s.status === 'error' ? (
                        <Circle className="h-3.5 w-3.5 text-destructive" />
                      ) : (
                        <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                      )}
                      <span
                        className={
                          s.status === 'done'
                            ? 'text-muted-foreground line-through'
                            : s.status === 'active'
                              ? 'font-medium text-foreground'
                              : 'text-muted-foreground'
                        }
                      >
                        <span className="uppercase tracking-wide opacity-60 mr-1">
                          {s.phase === 'fetch' ? t('export.phaseFetch', 'Fetch') : t('export.phaseWrite', 'Write')}
                        </span>
                        {s.label}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </div>
    </ReportShell>
  );
};
