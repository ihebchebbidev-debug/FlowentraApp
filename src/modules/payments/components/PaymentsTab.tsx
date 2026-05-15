import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Checkbox } from '@/components/ui/checkbox';
import {
  CreditCard,
  Plus,
  CalendarPlus,
  FileText,
  Trash2,
  Banknote,
  Building,
  CheckSquare,
  Wallet,
  AlertTriangle,
  CheckCircle,
  Clock,
  Receipt,
  Mail,
  Bell,
  Send,
  Download,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { useCurrency } from '@/shared/hooks/useCurrency';
import { paymentsApi } from '@/services/api/paymentsApi';
import { pdf } from '@react-pdf/renderer';
import { PaymentReceiptPDF } from './PaymentReceiptPDF';
import { PaymentReceiptPreviewModal } from './PaymentReceiptPreviewModal';
import { SendReportEmailDialog } from '@/components/shared/SendReportEmailDialog';
import { PdfSettingsService } from '@/modules/offers/services/pdfSettings.service';
import type {
  EntityType,
  Payment,
  PaymentPlan,
  PaymentSummary,
  PaymentMethod,
  CreatePaymentData,
  CreatePaymentPlanData,
} from '@/modules/payments/types';
import { format } from 'date-fns';

// ── i18n bootstrap ────────────────────────────────────
import i18n from 'i18next';
import en from '@/modules/payments/locale/en.json';
import fr from '@/modules/payments/locale/fr.json';
if (!i18n.hasResourceBundle('en', 'payments')) {
  i18n.addResourceBundle('en', 'payments', en.payments, true, true);
  i18n.addResourceBundle('fr', 'payments', fr.payments, true, true);
}

// ── Props ─────────────────────────────────────────────
interface PaymentsTabProps {
  entityType: EntityType;
  entityId: string;
  entityNumber?: string;
  totalAmount: number;
  currency: string;
  items?: { id: string; itemName: string; totalPrice: number }[];
  /** Full offer/sale data object for generating payment receipt PDFs */
  entityData?: any;
}

// ── Method icon helper ────────────────────────────────
const MethodIcon = ({ method }: { method: PaymentMethod }) => {
  switch (method) {
    case 'cash': return <Banknote className="h-4 w-4" />;
    case 'bank_transfer': return <Building className="h-4 w-4" />;
    case 'check': return <CheckSquare className="h-4 w-4" />;
    case 'card': return <CreditCard className="h-4 w-4" />;
    default: return <Wallet className="h-4 w-4" />;
  }
};

const statusColor = (status: string) => {
  switch (status) {
    case 'fully_paid':
    case 'paid':
    case 'completed': return 'bg-emerald-500/10 text-emerald-700 border-emerald-500/20';
    case 'partially_paid': return 'bg-amber-500/10 text-amber-700 border-amber-500/20';
    case 'overdue': return 'bg-destructive/10 text-destructive border-destructive/20';
    case 'pending': return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    default: return 'bg-muted text-muted-foreground border-border';
  }
};

// ═══════════════════════════════════════════════════════
// Main PaymentsTab Component
// ═══════════════════════════════════════════════════════
export function PaymentsTab({ entityType, entityId, entityNumber, totalAmount, currency, items = [], entityData }: PaymentsTabProps) {
  const { t } = useTranslation('payments');
  const { format: formatCurrency, current: currencyInfo } = useCurrency();

  // Always show real numbers in payments (never '-' for zero)
  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return `0 ${currencyInfo.code}`;
    try {
      const formatted = new Intl.NumberFormat('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(Math.round(amount));
      return `${formatted} ${currencyInfo.code}`;
    } catch {
      return String(amount);
    }
  };

  const [payments, setPayments] = useState<Payment[]>([]);
  const [plans, setPlans] = useState<PaymentPlan[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [showStatement, setShowStatement] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<Payment | null>(null);
  const [emailPayment, setEmailPayment] = useState<Payment | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [paymentsRes, plansRes, summaryRes] = await Promise.all([
        paymentsApi.getPayments(entityType, entityId).catch(() => [] as Payment[]),
        paymentsApi.getPlans(entityType, entityId).catch(() => [] as PaymentPlan[]),
        paymentsApi.getSummary(entityType, entityId).catch(() => null),
      ]);
      setPayments(paymentsRes);
      setPlans(plansRes);
      let computedPaid = 0;
      for (const p of paymentsRes) {
        if (p.status === 'completed') computedPaid += p.amount;
      }
      // Always use the prop totalAmount as source of truth (backend summary may have stale/zero value)
      const actualTotal = totalAmount || summaryRes?.totalAmount || 0;
      const actualPaid = summaryRes?.paidAmount ?? computedPaid;
      setSummary({
        totalAmount: actualTotal,
        paidAmount: actualPaid,
        remainingAmount: actualTotal - actualPaid,
        paymentStatus: summaryRes?.paymentStatus ?? (paymentsRes.length === 0 ? 'unpaid' : 'partially_paid') as PaymentSummary['paymentStatus'],
        paymentCount: summaryRes?.paymentCount ?? paymentsRes.length,
        lastPaymentDate: summaryRes?.lastPaymentDate ?? (paymentsRes.length > 0 ? paymentsRes[0].paymentDate : undefined),
        currency,
      });
    } catch (e) {
      console.error('Failed to load payment data', e);
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId, totalAmount, currency]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Download Payment Receipt PDF ──
  const handleDownloadReceipt = useCallback(async (payment: Payment) => {
    if (!entityData) {
      toast.error('Entity data not available for PDF generation');
      return;
    }
    try {
      toast.info('Generating receipt PDF...');
      const pdfSettings = PdfSettingsService.loadSettings();
      const formatAmt = (amount: number) => {
        try {
          return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))} ${currencyInfo.code}`;
        } catch { return String(amount); }
      };
      const doc = (
        <PaymentReceiptPDF
          offer={entityData}
          payment={payment}
          payments={payments}
          formatCurrency={formatAmt}
          settings={pdfSettings}
          currencyCode={currencyInfo.code}
        />
      );
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `receipt-${payment.paymentReference || payment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Receipt downloaded');
    } catch (error) {
      console.error('Failed to generate receipt PDF:', error);
      toast.error('Failed to generate receipt');
    }
  }, [entityData, payments, currencyInfo.code]);

  const paidPct = summary ? Math.min(100, (summary.paidAmount / Math.max(summary.totalAmount, 1)) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-muted/60 rounded-lg" />
        <div className="h-40 bg-muted/40 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Summary Card ───────────────────────────────── */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Receipt className="h-4 w-4 text-primary" />
              {t('summary')}
            </CardTitle>
            <Badge className={`${statusColor(summary?.paymentStatus ?? 'unpaid')} border text-xs`}>
              {t(summary?.paymentStatus ?? 'unpaid')}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">{t('totalAmount')}</p>
              <p className="text-sm font-semibold text-foreground">{formatAmount(summary?.totalAmount ?? totalAmount)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('paidAmount')}</p>
              <p className="text-sm font-semibold text-success">{formatAmount(summary?.paidAmount ?? 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t('remainingAmount')}</p>
              <p className="text-sm font-semibold text-warning">{formatAmount(summary?.remainingAmount ?? totalAmount)}</p>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{Math.round(paidPct)}%</span>
              <span>{formatAmount(summary?.paidAmount ?? 0)} {t('of')} {formatAmount(summary?.totalAmount ?? totalAmount)}</span>
            </div>
            <Progress value={paidPct} className="h-2" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" onClick={() => setShowAddPayment(true)} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" />
              {t('addPayment')}
            </Button>
            <Button size="sm" variant="outline" onClick={() => setShowCreatePlan(true)} className="gap-1.5">
              <CalendarPlus className="h-3.5 w-3.5" />
              {t('createPlan')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Installment Plans ──────────────────────────── */}
      {plans.length > 0 && plans.map((plan) => {
        const planPaid = plan.installments.reduce((s, i) => s + i.paidAmount, 0);
        const planPct = Math.min(100, (planPaid / Math.max(plan.totalAmount, 1)) * 100);
        return (
          <Card key={plan.id} className="border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <CalendarPlus className="h-4 w-4 text-primary" />
                  {plan.name}
                </CardTitle>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {formatAmount(planPaid)} / {formatAmount(plan.totalAmount)}
                  </span>
                  <Badge className={`${statusColor(plan.status)} border text-xs`}>
                    {t(plan.status)}
                  </Badge>
                </div>
              </div>
              {plan.description && (
                <p className="text-xs text-muted-foreground mt-1">{plan.description}</p>
              )}
              <Progress value={planPct} className="h-1.5 mt-2" />
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">#</TableHead>
                    <TableHead>{t('dueDate')}</TableHead>
                    <TableHead className="text-right">{t('amount')}</TableHead>
                    <TableHead className="text-right">{t('paidAmount')}</TableHead>
                    <TableHead className="text-right">{t('remainingAmount')}</TableHead>
                    <TableHead>{t('status')}</TableHead>
                    <TableHead className="w-[100px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.installments.map((inst) => {
                    const isOverdue = inst.status === 'pending' && new Date(inst.dueDate) < new Date();
                    const actualStatus = isOverdue ? 'overdue' : inst.status;
                    const instRemaining = inst.amount - inst.paidAmount;
                    return (
                      <TableRow key={inst.id}>
                        <TableCell className="text-sm text-muted-foreground">{inst.installmentNumber}</TableCell>
                        <TableCell className="text-sm">{format(new Date(inst.dueDate), 'dd/MM/yyyy')}</TableCell>
                        <TableCell className="text-sm text-right">{formatAmount(inst.amount)}</TableCell>
                        <TableCell className="text-sm text-right">{formatAmount(inst.paidAmount)}</TableCell>
                        <TableCell className="text-sm text-right">{formatAmount(instRemaining > 0 ? instRemaining : 0)}</TableCell>
                        <TableCell>
                          <Badge className={`${statusColor(actualStatus)} border text-xs`}>
                            {t(actualStatus)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {inst.status !== 'paid' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 gap-1 text-xs text-muted-foreground hover:text-primary"
                              onClick={async () => {
                                try {
                                  const res = await paymentsApi.sendInstallmentReminder(entityType, entityId, inst.id);
                                  if (res.success) {
                                    const parts: string[] = [];
                                    if (res.emailSent) parts.push(t('emailSent'));
                                    if (res.notificationCreated) parts.push(t('notificationSent'));
                                    toast.success(parts.join(' & ') || t('reminderSent'));
                                  } else {
                                    toast.warning(res.error || t('reminderPartial'));
                                  }
                                } catch (err: any) {
                                  const status = err?.status || '';
                                  toast.error(`${t('reminderError')}${status ? ` (HTTP ${status})` : ''}`);
                                }
                              }}
                            >
                              <Mail className="h-3 w-3" />
                              {t('sendReminder')}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* ── Payment History ─────────────────────────────── */}
      <Card className="border-border">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-primary" />
            {t('paymentHistory')}
            {payments.length > 0 && (
              <span className="text-xs text-muted-foreground font-normal ml-1">({payments.length})</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className={payments.length > 0 ? "p-0" : undefined}>
          {payments.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">{t('noPayments')}</p>
              <p className="text-xs mt-1">{t('noPaymentsDesc')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="h-8">
                  <TableHead className="text-xs py-1.5">{t('reference')}</TableHead>
                  <TableHead className="text-xs py-1.5">{t('date')}</TableHead>
                  <TableHead className="text-xs py-1.5">{t('method')}</TableHead>
                  <TableHead className="text-xs py-1.5 text-right">{t('amount')}</TableHead>
                  <TableHead className="text-xs py-1.5">{t('status')}</TableHead>
                  <TableHead className="text-xs py-1.5 w-[90px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id} className="h-9 group">
                    <TableCell className="text-xs py-1.5 font-medium">
                      {payment.paymentReference || payment.receiptNumber || '—'}
                    </TableCell>
                    <TableCell className="text-xs py-1.5 text-muted-foreground">
                      {format(new Date(payment.paymentDate), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="text-xs py-1.5">
                      <div className="flex items-center gap-1.5">
                        <MethodIcon method={payment.paymentMethod} />
                        <span className="text-muted-foreground">{t(payment.paymentMethod)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs py-1.5 text-right font-semibold">
                      {formatAmount(payment.amount)}
                    </TableCell>
                    <TableCell className="py-1.5">
                      <Badge className={`${statusColor(payment.status)} border text-[10px] px-1.5 py-0`}>
                        {t(payment.status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-1.5">
                      <div className="flex items-center gap-0.5">
                        {entityData && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-6 w-6 text-muted-foreground hover:text-primary"
                            title={t('downloadReceipt', 'View Receipt')}
                            onClick={() => setReceiptPayment(payment)}
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-primary"
                          title={t('sendReceipt')}
                          onClick={() => setEmailPayment(payment)}
                        >
                          <Send className="h-3 w-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-muted-foreground hover:text-destructive"
                          onClick={async () => {
                            try {
                              await paymentsApi.deletePayment(entityType, entityId, payment.id);
                              toast.success(t('paymentDeleted'));
                              fetchData();
                            } catch (err: any) {
                              console.error('[PaymentsTab] Delete failed:', err);
                              const status = err?.status || err?.response?.status || '';
                              toast.error(`${t('paymentError')}${status ? ` (HTTP ${status})` : ''}: ${err?.message || 'Unknown error'}`);
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payment Receipt Preview Modal */}
      {receiptPayment && entityData && (
        <PaymentReceiptPreviewModal
          isOpen={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
          entityData={entityData}
          payment={receiptPayment}
          payments={payments}
          formatCurrency={(amount: number) => {
            try {
              return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))} ${currencyInfo.code}`;
            } catch { return String(amount); }
          }}
          currencyCode={currencyInfo.code}
        />
      )}

      {/* Send Payment Receipt Email Dialog */}
      {emailPayment && (
        <SendReportEmailDialog
          open={!!emailPayment}
          onOpenChange={(open) => { if (!open) setEmailPayment(null); }}
          pdfDocument={
            <PaymentReceiptPDF
              offer={entityData || {}}
              payment={emailPayment}
              payments={payments}
              formatCurrency={(amount: number) => {
                try {
                  return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))} ${currencyInfo.code}`;
                } catch { return String(amount); }
              }}
              settings={undefined}
              currencyCode={currencyInfo.code}
            />
          }
          fileName={`receipt-${emailPayment.paymentReference || emailPayment.id}.pdf`}
          reportType="payment"
          reportNumber={emailPayment.paymentReference || emailPayment.receiptNumber || String(emailPayment.id)}
          reportTitle={entityData?.title || ''}
          customerName={entityData?.contactName || entityData?.contactCompany}
          totalAmount={(() => {
            try {
              return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(emailPayment.amount))} ${currencyInfo.code}`;
            } catch { return String(emailPayment.amount); }
          })()}
          translationNs="offers"
        />
      )}

      <AddPaymentModal
        open={showAddPayment}
        onOpenChange={setShowAddPayment}
        entityType={entityType}
        entityId={entityId}
        entityNumber={entityNumber}
        currency={currency}
        remainingAmount={summary?.remainingAmount ?? totalAmount}
        items={items}
        plans={plans}
        existingCount={payments.length}
        onSuccess={fetchData}
      />

      {/* ── Create Plan Modal ──────────────────────────── */}
      <CreatePlanModal
        open={showCreatePlan}
        onOpenChange={setShowCreatePlan}
        entityType={entityType}
        entityId={entityId}
        totalAmount={summary?.remainingAmount ?? totalAmount}
        currency={currency}
        onSuccess={fetchData}
      />

      {/* ── Statement Modal ────────────────────────────── */}
      <StatementModal
        open={showStatement}
        onOpenChange={setShowStatement}
        entityType={entityType}
        entityId={entityId}
        payments={payments}
        summary={summary}
        totalAmount={totalAmount}
        currency={currency}
        items={items}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════
// Add Payment Modal
// ═══════════════════════════════════════════════════════
function AddPaymentModal({
  open, onOpenChange, entityType, entityId, entityNumber, currency, remainingAmount, items, plans, existingCount, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: EntityType;
  entityId: string;
  entityNumber?: string;
  currency: string;
  remainingAmount: number;
  items: { id: string; itemName: string; totalPrice: number }[];
  plans: PaymentPlan[];
  existingCount: number;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('payments');
  const { current: currencyInfo } = useCurrency();
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return `0 ${currencyInfo.code}`;
    try {
      return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))} ${currencyInfo.code}`;
    } catch { return String(amount); }
  };
  const [amountMode, setAmountMode] = useState<'percentage' | 'fixed'>('percentage');
  const [amount, setAmount] = useState('100');
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [dateStr, setDateStr] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [allocateItems, setAllocateItems] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState('');
  const [itemAllocations, setItemAllocations] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setAmountMode('percentage');
      setAmount('100');
      setMethod('cash');
      const nextNum = String(existingCount + 1).padStart(2, '0');
      const prefix = entityNumber || entityId.slice(0, 6).toUpperCase();
      setReference(`${prefix}/${nextNum}`);
      setNotes('');
      setDateStr(format(new Date(), 'yyyy-MM-dd'));
      setAllocateItems(false);
      setSelectedInstallment('');
      setItemAllocations({});
    }
  }, [open, remainingAmount]);

  const handleSave = async () => {
    const raw = parseFloat(amount);
    if (isNaN(raw) || raw <= 0) {
      toast.error(t('paymentError'));
      console.warn('[PaymentsTab] Invalid amount:', amount, 'raw:', raw);
      return;
    }
    const amt = amountMode === 'percentage'
      ? Math.round((raw / 100) * (remainingAmount || 0) * 100) / 100
      : raw;
    if (amt <= 0) {
      toast.error(t('paymentError'));
      console.warn('[PaymentsTab] Computed amount is 0. remainingAmount:', remainingAmount, 'mode:', amountMode, 'raw:', raw);
      return;
    }
    setSaving(true);
    try {
      const data: CreatePaymentData = {
        entityType,
        entityId,
        amount: amt,
        currency,
        paymentMethod: method,
        paymentReference: reference || undefined,
        paymentDate: new Date(dateStr),
        notes: notes || undefined,
        installmentId: selectedInstallment || undefined,
        itemAllocations: allocateItems
          ? Object.entries(itemAllocations)
              .filter(([, v]) => v > 0)
              .map(([itemId, allocatedAmount]) => {
                const item = items.find((i) => i.id === itemId);
                return {
                  itemId,
                  itemName: item?.itemName ?? '',
                  allocatedAmount,
                  itemTotal: item?.totalPrice ?? 0,
                };
              })
          : undefined,
      };
      console.log('[PaymentsTab] Creating payment:', JSON.stringify(data));
      await paymentsApi.createPayment(data);
      toast.success(t('paymentAdded'));
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('[PaymentsTab] Payment creation failed:', err);
      const status = err?.status || err?.response?.status || '';
      toast.error(`${t('paymentError')}${status ? ` (HTTP ${status})` : ''}: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  // Get pending installments from active plans
  const pendingInstallments = plans
    .filter((p) => p.status === 'active')
    .flatMap((p) => p.installments.filter((i) => i.status !== 'paid'));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('addPaymentTitle')}
          </DialogTitle>
          <DialogDescription>{t('addPaymentDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          {/* Amount */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label>{t('amount')}</Label>
              <div className="flex items-center gap-1 rounded-md border p-0.5">
                <button
                  type="button"
                  className={`px-2 py-0.5 text-xs rounded ${amountMode === 'percentage' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => {
                    setAmountMode('percentage');
                    setAmount('100');
                  }}
                >
                  %
                </button>
                <button
                  type="button"
                  className={`px-2 py-0.5 text-xs rounded ${amountMode === 'fixed' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                  onClick={() => {
                    setAmountMode('fixed');
                    setAmount(remainingAmount.toString());
                  }}
                >
                  {currency}
                </button>
              </div>
            </div>
            <Input
              type="number"
              step={amountMode === 'percentage' ? '1' : '0.01'}
              min="0"
              max={amountMode === 'percentage' ? '100' : undefined}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={amountMode === 'percentage' ? '100' : '0.00'}
            />
            <p className="text-xs text-muted-foreground">
              {amountMode === 'percentage'
                ? (() => {
                    const pctVal = parseFloat(amount) || 0;
                    const computed = Math.round(pctVal / 100 * (remainingAmount || 0) * 100) / 100;
                    return `= ${formatCurrency(computed)} — ${t('remainingAmount')}: ${formatCurrency(remainingAmount || 0)}`;
                  })()
                : `${t('remainingAmount')}: ${formatCurrency(remainingAmount || 0)}`}
            </p>
          </div>
          {/* Method */}
          <div className="space-y-1.5">
            <Label>{t('paymentMethod')}</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['cash', 'bank_transfer', 'check', 'card', 'other'] as PaymentMethod[]).map((m) => (
                  <SelectItem key={m} value={m}>{t(m)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Date */}
          <div className="space-y-1.5">
            <Label>{t('paymentDate')}</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !dateStr && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateStr ? format(new Date(dateStr), 'dd/MM/yyyy') : t('paymentDate')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dateStr ? new Date(dateStr) : undefined}
                  onSelect={(d) => d && setDateStr(format(d, 'yyyy-MM-dd'))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
          {/* Reference (auto-generated) */}
          <div className="space-y-1.5">
            <Label>{t('paymentReference')}</Label>
            <Input value={reference} readOnly className="bg-muted/50" />
          </div>
          {/* Link to installment */}
          {pendingInstallments.length > 0 && (
            <div className="space-y-1.5">
              <Label>{t('installment')}</Label>
              <Select value={selectedInstallment} onValueChange={setSelectedInstallment}>
                <SelectTrigger>
                  <SelectValue placeholder="—" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">—</SelectItem>
                  {pendingInstallments.map((inst) => (
                    <SelectItem key={inst.id} value={inst.id}>
                      #{inst.installmentNumber} — {formatCurrency(inst.amount)} ({format(new Date(inst.dueDate), 'dd/MM/yyyy')})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {/* Item allocation toggle */}
          {items.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={allocateItems} onCheckedChange={setAllocateItems} />
                <Label className="text-sm">{t('allocateToItems')}</Label>
              </div>
              {allocateItems && (
                <div className="space-y-2 pl-2 border-l-2 border-primary/20">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-foreground truncate flex-1">{item.itemName}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{formatCurrency(item.totalPrice)}</span>
                      <Input
                        type="number"
                        step="0.01"
                        className="w-28"
                        placeholder="0.00"
                        value={itemAllocations[item.id] ?? ''}
                        onChange={(e) => setItemAllocations((prev) => ({ ...prev, [item.id]: parseFloat(e.target.value) || 0 }))}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {/* Notes */}
          <div className="space-y-1.5">
            <Label>{t('notes')}</Label>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// Create Plan Modal
// ═══════════════════════════════════════════════════════
function CreatePlanModal({
  open, onOpenChange, entityType, entityId, totalAmount, currency, onSuccess,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: EntityType;
  entityId: string;
  totalAmount: number;
  currency: string;
  onSuccess: () => void;
}) {
  const { t } = useTranslation('payments');
  const { current: currencyInfo } = useCurrency();
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return `0 ${currencyInfo.code}`;
    try {
      return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))} ${currencyInfo.code}`;
    } catch { return String(amount); }
  };
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [count, setCount] = useState(2);
  const [installments, setInstallments] = useState<{ amount: number; dueDate: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const splitEqually = () => {
    const perInstallment = Math.round((totalAmount / count) * 100) / 100;
    const today = new Date();
    const newInst = Array.from({ length: count }, (_, i) => {
      const d = new Date(today);
      d.setMonth(d.getMonth() + i + 1);
      return { amount: i === count - 1 ? totalAmount - perInstallment * (count - 1) : perInstallment, dueDate: format(d, 'yyyy-MM-dd') };
    });
    setInstallments(newInst);
  };

  useEffect(() => {
    if (open) {
      setName('');
      setDescription('');
      setCount(2);
      setInstallments([]);
    }
  }, [open]);

  useEffect(() => { if (open) splitEqually(); }, [count, totalAmount, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const data: CreatePaymentPlanData = {
        entityType,
        entityId,
        name,
        description: description || undefined,
        totalAmount,
        currency,
        installments: installments.map((i) => ({ amount: i.amount, dueDate: new Date(i.dueDate) })),
      };
      await paymentsApi.createPlan(data);
      toast.success(t('planCreated'));
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      console.error('[PaymentsTab] Plan creation failed:', err);
      const status = err?.status || err?.response?.status || '';
      toast.error(`${t('planError')}${status ? ` (HTTP ${status})` : ''}: ${err?.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            {t('createPlanTitle')}
          </DialogTitle>
          <DialogDescription>{t('createPlanDesc')}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>{t('planName')}</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>{t('planDescription')}</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {/* Total amount display */}
          <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">{t('totalAmount')}</span>
              <span className="text-lg font-bold text-primary">{formatCurrency(totalAmount)}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="space-y-1.5 flex-1">
              <Label>{t('numberOfInstallments')}</Label>
              <Input type="number" min={2} max={24} value={count} onChange={(e) => setCount(Math.max(2, parseInt(e.target.value) || 2))} />
            </div>
            <Button variant="outline" size="sm" className="mt-5" onClick={splitEqually}>
              {t('splitEqually')}
            </Button>
          </div>
          <Separator />
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {installments.map((inst, i) => (
              <div key={i} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg border border-border/50">
                <span className="text-sm font-medium text-muted-foreground w-8">#{i + 1}</span>
                <Input
                  type="number"
                  step="0.01"
                  className="w-32"
                  value={inst.amount}
                  onChange={(e) => {
                    const updated = [...installments];
                    updated[i] = { ...updated[i], amount: parseFloat(e.target.value) || 0 };
                    setInstallments(updated);
                  }}
                />
                <Input
                  type="date"
                  value={inst.dueDate}
                  onChange={(e) => {
                    const updated = [...installments];
                    updated[i] = { ...updated[i], dueDate: e.target.value };
                    setInstallments(updated);
                  }}
                />
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('totalAmount')}: {formatCurrency(installments.reduce((s, i) => s + i.amount, 0))} / {formatCurrency(totalAmount)}
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>{t('save')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ═══════════════════════════════════════════════════════
// Statement Modal
// ═══════════════════════════════════════════════════════
function StatementModal({
  open, onOpenChange, entityType, entityId, payments, summary, totalAmount, currency, items,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityType: EntityType;
  entityId: string;
  payments: Payment[];
  summary: PaymentSummary | null;
  totalAmount: number;
  currency: string;
  items: { id: string; itemName: string; totalPrice: number }[];
}) {
  const { t } = useTranslation('payments');
  const { current: currencyInfo } = useCurrency();
  const formatCurrency = (amount?: number) => {
    if (amount === undefined || amount === null) return `0 ${currencyInfo.code}`;
    try {
      return `${new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(Math.round(amount))} ${currencyInfo.code}`;
    } catch { return String(amount); }
  };

  // Calculate per-item paid amounts from allocations
  const itemPaidMap: Record<string, number> = {};
  payments.forEach((p) => {
    p.itemAllocations?.forEach((a) => {
      itemPaidMap[a.itemId] = (itemPaidMap[a.itemId] ?? 0) + a.allocatedAmount;
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t('statementTitle')}
          </DialogTitle>
          <DialogDescription>{t('statementDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2" id="payment-statement">
          {/* Summary header */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border border-border/50">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t('documentTotal')}</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalAmount)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t('totalPaid')}</p>
              <p className="text-lg font-bold text-success">{formatCurrency(summary?.paidAmount ?? 0)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{t('balance')}</p>
              <p className="text-lg font-bold text-warning">{formatCurrency(summary?.remainingAmount ?? totalAmount)}</p>
            </div>
          </div>

          {/* Item breakdown */}
          {items.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-foreground mb-2">{t('itemBreakdown')}</h4>
              <div className="border border-border rounded-lg overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                  <span>{t('itemName')}</span>
                  <span className="text-right">{t('itemTotal')}</span>
                  <span className="text-right">{t('itemPaid')}</span>
                  <span className="text-right">{t('itemRemaining')}</span>
                </div>
                {items.map((item) => {
                  const paid = itemPaidMap[item.id] ?? 0;
                  const remaining = item.totalPrice - paid;
                  return (
                    <div key={item.id} className="grid grid-cols-4 gap-2 p-2 border-t border-border/50 text-sm">
                      <span className="truncate text-foreground">{item.itemName}</span>
                      <span className="text-right text-foreground">{formatCurrency(item.totalPrice)}</span>
                      <span className="text-right text-success">{formatCurrency(paid)}</span>
                      <span className="text-right text-warning">{formatCurrency(remaining)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Full payment list */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-2">{t('paymentDetails')}</h4>
            <div className="border border-border rounded-lg overflow-hidden">
              <div className="grid grid-cols-5 gap-2 p-2 bg-muted/50 text-xs font-medium text-muted-foreground">
                <span>{t('date')}</span>
                <span>{t('method')}</span>
                <span className="text-right">{t('amount')}</span>
                <span>{t('reference')}</span>
                <span>{t('status')}</span>
              </div>
              {payments.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">{t('noPayments')}</div>
              ) : (
                payments.map((p) => (
                  <div key={p.id} className="grid grid-cols-5 gap-2 p-2 border-t border-border/50 text-sm">
                    <span className="text-foreground">{format(new Date(p.paymentDate), 'dd/MM/yyyy')}</span>
                    <span className="text-foreground">{t(p.paymentMethod)}</span>
                    <span className="text-right font-medium text-foreground">{formatCurrency(p.amount)}</span>
                    <span className="text-muted-foreground truncate">{p.paymentReference || '—'}</span>
                    <Badge className={`${statusColor(p.status)} border text-xs w-fit`}>{t(p.status)}</Badge>
                  </div>
                ))
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-right">
            {t('generatedOn')}: {format(new Date(), 'dd/MM/yyyy HH:mm')}
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('close')}</Button>
          <Button
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              const el = document.getElementById('payment-statement');
              if (el) {
                const w = window.open('', '_blank');
                if (w) {
                  w.document.write(`<html><head><title>${t('statementTitle')}</title><style>body{font-family:sans-serif;padding:40px;color:#222}table{width:100%;border-collapse:collapse}td,th{padding:8px;border:1px solid #ddd;text-align:left}</style></head><body>${el.innerHTML}</body></html>`);
                  w.document.close();
                  w.print();
                }
              }
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            {t('printStatement')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
