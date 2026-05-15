// TEJ Export Modal - Official DGI Tunisian format (DeclarationRetenueSource)
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { FileDown, AlertCircle, CheckCircle2, Loader2, Building2, CalendarDays, FileCode2, Receipt, Settings2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import {
  exportTEJ,
  fetchRSRecords,
  type TEJExportResponseDto,
} from '@/modules/shared/services/rsApiService';

interface TEJExportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: string;
  entityId: number;
  onExportComplete: () => void;
}

const MONTHS_FR = [
  { label: 'Janvier', value: '1' }, { label: 'Février', value: '2' },
  { label: 'Mars', value: '3' },    { label: 'Avril', value: '4' },
  { label: 'Mai', value: '5' },     { label: 'Juin', value: '6' },
  { label: 'Juillet', value: '7' }, { label: 'Août', value: '8' },
  { label: 'Septembre', value: '9' },{ label: 'Octobre', value: '10' },
  { label: 'Novembre', value: '11' },{ label: 'Décembre', value: '12' },
];

const TYPE_ACTE_OPTIONS = [
  { value: '0', label: '0 — Déclaration initiale', description: 'Première déclaration pour la période' },
  { value: '1', label: '1 — Déclaration rectificative', description: "Correction d'une déclaration existante" },
  { value: '2', label: "2 — Déclaration d'annulation", description: "Annulation d'une déclaration précédente" },
];

const CODE_NATURE_OPTIONS = [
  { value: '01', label: '01 — Honoraires / Services professionnels' },
  { value: '02', label: '02 — Loyers' },
  { value: '03', label: '03 — Commissions' },
  { value: '04', label: '04 — Intérêts' },
  { value: '05', label: '05 — Redevances' },
  { value: '06', label: '06 — Autres revenus' },
];

export function TEJExportModal({ open, onOpenChange, entityType, entityId, onExportComplete }: TEJExportModalProps) {
  const now = new Date();

  const [payerName, setPayerName] = useState('');
  const [payerTaxId, setPayerTaxId] = useState('');
  const [payerAddress, setPayerAddress] = useState('');
  const [month, setMonth] = useState(String(now.getMonth() + 1));
  const [year, setYear] = useState(String(now.getFullYear()));
  const [typeActe, setTypeActe] = useState<'0' | '1' | '2'>('0');
  const [codeNature, setCodeNature] = useState('01');
  const [errors, setErrors] = useState<string[]>([]);
  const [exportResult, setExportResult] = useState<TEJExportResponseDto | null>(null);
  const [exporting, setExporting] = useState(false);
  const [loadingStats, setLoadingStats] = useState(false);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [totalRS, setTotalRS] = useState(0);
  const [overduePenalty, setOverduePenalty] = useState(0);
  const [overdueRecordCount, setOverdueRecordCount] = useState(0);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const result = await fetchRSRecords({
        entityType, entityId,
        month: Number(month), year: Number(year),
        status: 'pending', limit: 100,
      });
      setRecordCount(result.pagination?.total ?? 0);
      setTotalRS(result.records?.reduce((s, r) => s + r.rsAmount, 0) ?? 0);
      const overdue = result.records?.filter(r => r.isOverdue) || [];
      setOverdueRecordCount(overdue.length);
      setOverduePenalty(overdue.reduce((s, r) => s + (r.penaltyAmount || 0), 0) ?? 0);
    } catch {
      setRecordCount(0);
      setOverdueRecordCount(0);
      setOverduePenalty(0);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    if (open) {
      setExportResult(null);
      setErrors([]);
      loadStats();
    }
  }, [open, month, year]);

  const handleExport = async () => {
    setErrors([]);
    setExportResult(null);
    const errs: string[] = [];
    if (!payerName.trim())  errs.push('La raison sociale est requise');
    if (!payerTaxId.trim()) errs.push('Le matricule fiscal est requis');
    if (errs.length) { setErrors(errs); return; }

    setExporting(true);
    try {
      const result = await exportTEJ({
        month: Number(month), year: Number(year),
        declarant: { name: payerName, taxId: payerTaxId, address: payerAddress },
      });
      setExportResult(result);
      if (result.status === 'success') {
        toast.success(`Fichier TEJ généré : ${result.fileName}`);
        onExportComplete();
      } else {
        setErrors([result.errorMessage || "L'export a échoué"]);
      }
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setExporting(false);
    }
  };

  const selectedMonth = MONTHS_FR.find(m => m.value === month);
  const previewFileName = payerTaxId
    ? `${payerTaxId}-${year}-${String(month).padStart(2, '0')}-${typeActe}.xml`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">

        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <FileCode2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Export TEJ XML</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                Format officiel{' '}
                <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded text-foreground">
                  DeclarationRetenueSource
                </code>{' '}
                — DGI Tunisie
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* ── Errors ── */}
          {errors.length > 0 && (
            <Alert variant="destructive" className="py-3">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc pl-4 space-y-0.5 text-sm">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* ── Compliance Warnings ── */}
          {overdueRecordCount > 0 && (
            <Alert variant="destructive" className="py-3 border-destructive/50 bg-destructive/10">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-destructive">⚠️ {overdueRecordCount} enregistrement(s) en retard detecte(s)</p>
                  <p className="text-xs text-destructive/80">
                    Export bloqué. Les certificats de retenue à la source en retard doivent être mis à jour avant d'exporter vers TEJ.
                  </p>
                  {overduePenalty > 0 && (
                    <p className="text-xs text-destructive/80 mt-2">
                      Pénalités cumulées : <span className="font-mono font-semibold">{overduePenalty.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</span>
                    </p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* ── Success ── */}
          {exportResult?.status === 'success' && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
                <p className="text-sm font-semibold text-primary">Export réussi</p>
              </div>
              <div className="pl-7 space-y-1">
                <p className="text-xs text-muted-foreground">
                  Fichier :{' '}
                  <span className="font-mono font-medium text-foreground">{exportResult.fileName}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {exportResult.recordCount} certificat(s) — Retenue totale :{' '}
                  <span className="font-semibold text-destructive">
                    {exportResult.totalRSAmount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND
                  </span>
                </p>
                {exportResult.documentId && (
                  <p className="text-xs text-muted-foreground">
                    Document enregistré (ID : {exportResult.documentId})
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── Period ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/50">
              <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">
                Période —{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;Annee&gt; / &lt;Mois&gt;</code>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Mois</Label>
                <Select value={month} onValueChange={setMonth}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {MONTHS_FR.map(m => (
                      <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Année</Label>
                <Input
                  type="number" value={year}
                  onChange={e => setYear(e.target.value)}
                  min="2020" max="2035"
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* ── Stats for period ── */}
          <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-border/50 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {selectedMonth?.label} {year} — Certificats en attente
              </span>
              {loadingStats && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
            </div>
            <div className="grid grid-cols-2 divide-x divide-border/50">
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <Receipt className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Certificats</p>
                </div>
                {loadingStats ? (
                  <div className="h-7 flex items-center justify-center">
                    <div className="w-10 h-4 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-foreground tabular-nums">{recordCount ?? '—'}</p>
                )}
                {recordCount === 0 && !loadingStats && (
                  <p className="text-[10px] text-muted-foreground mt-1">Aucun en attente</p>
                )}
              </div>
              <div className="px-4 py-4 text-center">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">MontantRetenue total</p>
                </div>
                {loadingStats ? (
                  <div className="h-7 flex items-center justify-center">
                    <div className="w-20 h-4 bg-muted animate-pulse rounded" />
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-destructive tabular-nums">
                    {totalRS.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}
                  </p>
                )}
                <p className="text-[10px] text-muted-foreground mt-0.5">TND</p>
              </div>
            </div>
          </div>

          {recordCount === 0 && !loadingStats && (
            <p className="text-xs text-muted-foreground text-center -mt-2">
              ⚠️ Aucun enregistrement RS en attente pour cette période.
            </p>
          )}

          {/* ── Declaration params ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/50">
              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">Paramètres de la déclaration</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Type d&apos;acte{' '}
                  <code className="text-[10px] bg-muted px-1 rounded">&lt;TypeActe&gt;</code>
                </Label>
                <Select value={typeActe} onValueChange={v => setTypeActe(v as '0' | '1' | '2')}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_ACTE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Nature opération{' '}
                  <code className="text-[10px] bg-muted px-1 rounded">&lt;CodeNatureOperation&gt;</code>
                </Label>
                <Select value={codeNature} onValueChange={setCodeNature}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CODE_NATURE_OPTIONS.map(o => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* ── Declarant ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/50">
              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm font-semibold">
                Déclarant —{' '}
                <code className="text-xs bg-muted px-1 py-0.5 rounded">&lt;Entete&gt;</code>
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Raison sociale <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={payerName}
                  onChange={e => setPayerName(e.target.value)}
                  placeholder="ABC Company"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Matricule Fiscal <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={payerTaxId}
                  onChange={e => setPayerTaxId(e.target.value)}
                  placeholder="1234567/A/M/000"
                  className="font-mono text-sm"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Adresse</Label>
              <Input
                value={payerAddress}
                onChange={e => setPayerAddress(e.target.value)}
                placeholder="12 Rue de Tunis, Tunis"
              />
            </div>

            {/* XML filename preview */}
            {previewFileName && (
              <div className="rounded-lg bg-muted/50 border border-border/50 px-3 py-2">
                <p className="text-[10px] text-muted-foreground mb-0.5">Nom du fichier XML généré :</p>
                <code className="text-xs font-mono text-foreground break-all">{previewFileName}</code>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground hidden sm:block font-mono">
            DeclarationRetenueSource · DGI · TEJ
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={exporting}>
              Fermer
            </Button>
            <Button
              onClick={handleExport}
              disabled={exporting || recordCount === 0 || loadingStats || overdueRecordCount > 0}
              className="gap-2 min-w-[150px]"
            >
              {exporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Genération...</>
              ) : (
                <><FileDown className="h-4 w-4" /> Generer XML TEJ</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
