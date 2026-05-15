// RS Record Add/Edit Modal - Professional redesign
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Receipt, Loader2, Building2, User, FileText, Save, ArrowRight, Percent, Minus, Equal, Globe } from 'lucide-react';
import { toast } from 'sonner';
import {
  createRSRecord,
  updateRSRecord,
  type RSRecordDto,
  type CreateRSRecordDto,
  type UpdateRSRecordDto,
} from '@/modules/shared/services/rsApiService';

const RS_TYPES = [
  { code: '10', rate: 10,  label: 'Honoraires / Services professionnels' },
  { code: '05', rate: 0.5, label: 'Services exportés' },
  { code: '03', rate: 3,   label: 'Certains honoraires professionnels' },
  { code: '20', rate: 20,  label: 'Redevances / Intérêts' },
];

function calcRS(amountPaid: number, typeCode: string): number {
  const type = RS_TYPES.find(t => t.code === typeCode);
  if (!type) return 0;
  return Math.round(amountPaid * (type.rate / 100) * 100) / 100;
}

interface RSRecordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entityType: 'offer' | 'sale';
  entityId: string;
  entityNumber?: string;
  entityAmount: number;
  contactName?: string;
  contactTaxId?: string;
  contactAddress?: string;
  editRecord?: RSRecordDto | null;
  onSuccess: () => void;
}

export function RSRecordModal({
  open, onOpenChange, entityType, entityId, entityNumber, entityAmount,
  contactName = '', contactTaxId = '', contactAddress = '', editRecord, onSuccess,
}: RSRecordModalProps) {
  const { t } = useTranslation();

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState(entityAmount);
  const [paymentDate, setPaymentDate] = useState('');
  const [amountPaid, setAmountPaid] = useState(entityAmount);
  const [rsTypeCode, setRsTypeCode] = useState('10');
  const [supplierName, setSupplierName] = useState(contactName);
  const [supplierTaxId, setSupplierTaxId] = useState(contactTaxId);
  const [supplierAddress, setSupplierAddress] = useState(contactAddress);
  const [payerName, setPayerName] = useState('');
  const [payerTaxId, setPayerTaxId] = useState('');
  const [payerAddress, setPayerAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [supplierType, setSupplierType] = useState<'individual' | 'company' | 'non_resident'>('company');
  const [isExemptByTreaty, setIsExemptByTreaty] = useState(false);
  const [treatyCode, setTreatyCode] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editRecord) {
      setInvoiceNumber(editRecord.invoiceNumber);
      setInvoiceDate(editRecord.invoiceDate?.split('T')[0] || '');
      setInvoiceAmount(editRecord.invoiceAmount);
      setPaymentDate(editRecord.paymentDate?.split('T')[0] || '');
      setAmountPaid(editRecord.amountPaid);
      setRsTypeCode(editRecord.rsTypeCode);
      setSupplierName(editRecord.supplierName);
      setSupplierTaxId(editRecord.supplierTaxId);
      setSupplierAddress(editRecord.supplierAddress || '');
      setPayerName(editRecord.payerName);
      setPayerTaxId(editRecord.payerTaxId);
      setPayerAddress(editRecord.payerAddress || '');
      setNotes(editRecord.notes || '');
      setSupplierType((editRecord.supplierType as 'individual' | 'company' | 'non_resident') || 'company');
      setIsExemptByTreaty(editRecord.isExemptByTreaty || false);
      setTreatyCode(editRecord.treatyCode || '');
    } else {
      setInvoiceNumber(entityNumber || '');
      setInvoiceDate(new Date().toISOString().split('T')[0]);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setInvoiceAmount(entityAmount);
      setAmountPaid(entityAmount);
      setSupplierName(contactName);
      setSupplierTaxId(contactTaxId);
      setSupplierAddress(contactAddress);
      setPayerName(''); setPayerTaxId(''); setPayerAddress('');
      setNotes(''); setErrors([]);
      setSupplierType('company');
      setIsExemptByTreaty(false);
      setTreatyCode('');
    }
  }, [editRecord, entityNumber, entityAmount, contactName, contactTaxId, contactAddress, open]);

  const rsRate   = RS_TYPES.find(t => t.code === rsTypeCode)?.rate ?? 0;
  const rsAmount = calcRS(amountPaid, rsTypeCode);
  const netPayment = Math.round((amountPaid - rsAmount) * 100) / 100;

  const handleSubmit = async () => {
    setErrors([]);
    const errs: string[] = [];
    if (!invoiceNumber.trim()) errs.push('Le numéro de facture est requis');
    if (!supplierName.trim())  errs.push('Le nom du bénéficiaire est requis');
    if (!supplierTaxId.trim()) errs.push('Le matricule fiscal du bénéficiaire est requis');
    if (!payerName.trim())     errs.push('La raison sociale du déclarant est requise');
    if (!payerTaxId.trim())    errs.push('Le matricule fiscal du déclarant est requis');
    if (invoiceAmount <= 0)    errs.push('Le montant de la facture doit être positif');
    if (amountPaid <= 0)       errs.push('Le montant payé doit être positif');
    if (errs.length > 0) { setErrors(errs); return; }

    setSaving(true);
    try {
      if (editRecord) {
        const dto: UpdateRSRecordDto = {
          invoiceNumber, invoiceDate: `${invoiceDate}T00:00:00Z`, invoiceAmount,
          paymentDate: `${paymentDate}T00:00:00Z`, amountPaid, rsTypeCode,
          supplierName, supplierTaxId, supplierAddress: supplierAddress || undefined,
          payerName, payerTaxId, payerAddress: payerAddress || undefined,
          notes: notes || undefined,
          supplierType, isExemptByTreaty, treatyCode: treatyCode || undefined,
        };
        await updateRSRecord(editRecord.id, dto);
        toast.success('Enregistrement RS mis à jour');
      } else {
        const dto: CreateRSRecordDto = {
          entityType, entityId: Number(entityId), entityNumber,
          invoiceNumber, invoiceDate: `${invoiceDate}T00:00:00Z`, invoiceAmount,
          paymentDate: `${paymentDate}T00:00:00Z`, amountPaid, rsTypeCode,
          supplierName, supplierTaxId, supplierAddress: supplierAddress || undefined,
          payerName, payerTaxId, payerAddress: payerAddress || undefined,
          notes: notes || undefined,
          supplierType, isExemptByTreaty, treatyCode: treatyCode || undefined,
        };
        await createRSRecord(dto);
        toast.success('Retenue à la source enregistrée avec succès');
      }
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      setErrors([err.message]);
    } finally {
      setSaving(false);
    }
  };

  const selectedType = RS_TYPES.find(t => t.code === rsTypeCode);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* ── Header ── */}
        <div className="px-6 pt-6 pb-4 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-primary/10 shrink-0 mt-0.5">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">
                {editRecord ? 'Modifier la retenue à la source' : 'Nouvelle retenue à la source'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                {entityNumber && (
                  <span className="inline-flex items-center gap-1.5">
                    <span>{entityType === 'offer' ? 'Offre' : 'Vente'}</span>
                    <Badge variant="outline" className="text-xs font-mono px-1.5 py-0">{entityNumber}</Badge>
                  </span>
                )}
                {!entityNumber && 'Calculer et enregistrer la retenue à la source pour ce document'}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="px-6 py-5 space-y-6">

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

          {/* ── Withholding Calculator ── */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            {/* Calculator header */}
            <div className="px-4 py-3 bg-muted/40 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Percent className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">Calcul de la retenue</span>
              </div>
              <Select value={rsTypeCode} onValueChange={setRsTypeCode}>
                <SelectTrigger className="h-8 w-auto min-w-[200px] bg-background text-xs border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RS_TYPES.map(type => (
                    <SelectItem key={type.code} value={type.code} className="text-xs">
                      <span className="font-medium">{type.rate}%</span>
                      <span className="text-muted-foreground ml-2">— {type.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Calculator body */}
            <div className="p-4">
              {/* Type badge */}
              {selectedType && (
                <p className="text-xs text-muted-foreground mb-4 italic">
                  {selectedType.label} — taux de retenue : <span className="font-semibold text-foreground not-italic">{selectedType.rate}%</span>
                </p>
              )}

              {/* Amount input + visual breakdown */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <Label className="text-xs text-muted-foreground mb-1.5 block">Montant brut payé (TND)</Label>
                    <Input
                      type="number" step="0.001" min="0"
                      value={amountPaid}
                      onChange={e => setAmountPaid(Number(e.target.value))}
                      className="text-base font-semibold bg-background h-10"
                    />
                  </div>
                </div>

                {/* Visual formula */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Brut */}
                  <div className="flex-1 min-w-[120px] rounded-lg border border-border bg-muted/30 px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Montant brut</p>
                    <p className="text-xl font-bold text-foreground tabular-nums">{amountPaid.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">TND</p>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 text-muted-foreground shrink-0">
                    <Minus className="h-4 w-4" />
                    <span className="text-[10px]">RS {rsRate}%</span>
                  </div>

                  {/* RS retenu */}
                  <div className="flex-1 min-w-[120px] rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-destructive/70 mb-1">Retenue ({rsRate}%)</p>
                    <p className="text-xl font-bold text-destructive tabular-nums">{rsAmount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</p>
                    <p className="text-[10px] text-destructive/60 mt-0.5">TND</p>
                  </div>

                  <div className="flex flex-col items-center gap-0.5 text-muted-foreground shrink-0">
                    <Equal className="h-4 w-4" />
                  </div>

                  {/* Net */}
                  <div className="flex-1 min-w-[120px] rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-center">
                    <p className="text-[10px] uppercase tracking-widest text-primary/70 mb-1">Net à verser</p>
                    <p className="text-xl font-bold text-primary tabular-nums">{netPayment.toLocaleString('fr-TN', { minimumFractionDigits: 3 })}</p>
                    <p className="text-[10px] text-primary/60 mt-0.5">TND</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Invoice & Payment ── */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 pb-1 border-b border-border/50">
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
              <h4 className="text-sm font-semibold text-foreground">Informations de la facture</h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">N° Facture <span className="text-destructive">*</span></Label>
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-2026-001" className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Montant facture (TND) <span className="text-destructive">*</span></Label>
                <Input type="number" step="0.001" min="0" value={invoiceAmount} onChange={e => setInvoiceAmount(Number(e.target.value))} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date facture <span className="text-destructive">*</span></Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Date de paiement <span className="text-destructive">*</span></Label>
                <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── Parties ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Beneficiary */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Bénéficiaire</p>
                  <p className="text-[10px] text-muted-foreground">Fournisseur / Prestataire</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nom / Raison sociale <span className="text-destructive">*</span></Label>
                  <Input value={supplierName} onChange={e => setSupplierName(e.target.value)} placeholder="Nom du bénéficiaire" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Matricule Fiscal <span className="text-destructive">*</span></Label>
                  <Input value={supplierTaxId} onChange={e => setSupplierTaxId(e.target.value)} placeholder="12345678A/M/000" className="font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Adresse</Label>
                  <Input value={supplierAddress} onChange={e => setSupplierAddress(e.target.value)} placeholder="Adresse complète" />
                </div>
                {/* Compliance Fields */}
                <div className="pt-1 border-t border-border/30 space-y-2.5">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Type de bénéficiaire</Label>
                    <Select value={supplierType} onValueChange={v => setSupplierType(v as 'individual' | 'company' | 'non_resident')}>
                      <SelectTrigger className="bg-background text-sm h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="individual">Personne physique</SelectItem>
                        <SelectItem value="company">Entreprise</SelectItem>
                        <SelectItem value="non_resident">Non résident</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-start gap-2.5 py-1">
                    <Checkbox
                      id="treaty-exempt"
                      checked={isExemptByTreaty}
                      onCheckedChange={(checked) => {
                        setIsExemptByTreaty(Boolean(checked));
                        if (!checked) setTreatyCode('');
                      }}
                      className="mt-1"
                    />
                    <label htmlFor="treaty-exempt" className="cursor-pointer">
                      <p className="text-xs font-medium text-foreground flex items-center gap-1">
                        <Globe className="h-3.5 w-3.5" /> Exempté par traité
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Situation spéciale applicables aux résidents étrangers</p>
                    </label>
                  </div>
                  {isExemptByTreaty && (
                    <div className="space-y-1 ml-7">
                      <Label className="text-xs text-muted-foreground">Code du traité</Label>
                      <Input
                        value={treatyCode}
                        onChange={e => setTreatyCode(e.target.value)}
                        placeholder="Ex: FR, BE, DE..."
                        maxLength={20}
                        className="font-mono text-sm h-8"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Declarant */}
            <div className="rounded-lg border border-border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-3.5 w-3.5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Déclarant</p>
                  <p className="text-[10px] text-muted-foreground">Retenant / Payeur</p>
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Raison sociale <span className="text-destructive">*</span></Label>
                  <Input value={payerName} onChange={e => setPayerName(e.target.value)} placeholder="Votre raison sociale" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Matricule Fiscal <span className="text-destructive">*</span></Label>
                  <Input value={payerTaxId} onChange={e => setPayerTaxId(e.target.value)} placeholder="0009876L/A/M/000" className="font-mono text-sm" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Adresse</Label>
                  <Input value={payerAddress} onChange={e => setPayerAddress(e.target.value)} placeholder="Adresse complète" />
                </div>
              </div>
            </div>
          </div>

          {/* ── Notes ── */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Notes (optionnel)</Label>
            <Textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Remarques ou informations complémentaires..."
              className="resize-none text-sm"
            />
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground hidden sm:block">
            Retenue calculée : <span className="font-semibold text-destructive">{rsAmount.toLocaleString('fr-TN', { minimumFractionDigits: 3 })} TND</span>
            {' '}à {rsRate}%
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Annuler
            </Button>
            <Button onClick={handleSubmit} disabled={saving} className="gap-2 min-w-[140px]">
              {saving ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Enregistrement...</>
              ) : editRecord ? (
                <><Save className="h-4 w-4" /> Mettre à jour</>
              ) : (
                <><ArrowRight className="h-4 w-4" /> Enregistrer RS</>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
