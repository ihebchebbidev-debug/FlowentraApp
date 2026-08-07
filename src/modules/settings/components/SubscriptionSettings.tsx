import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Check } from 'lucide-react';
import { ActivatedModulesSection } from './ActivatedModulesSection';
import {
  subscriptionApi,
  type Subscription,
  type SubscriptionPlan,
  type BillingInvoice,
  type PlanKey,
} from '@/services/api/subscriptionApi';

const STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  trialing: 'secondary',
  past_due: 'destructive',
  canceled: 'destructive',
  incomplete: 'outline',
};

const INVOICE_STATUS_VARIANTS: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  paid: 'default',
  pending: 'secondary',
  failed: 'destructive',
  void: 'outline',
};

export function SubscriptionSettings() {
  const { t } = useTranslation('settings');
  const { toast } = useToast();

  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [plansDialogOpen, setPlansDialogOpen] = useState(false);
  const [switchPlanDialog, setSwitchPlanDialog] = useState<PlanKey | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [subRes, plansRes, invoicesRes] = await Promise.all([
        subscriptionApi.getCurrentSubscription(),
        subscriptionApi.getPlans(),
        subscriptionApi.getInvoices(),
      ]);
      setSubscription(subRes.data);
      setPlans(plansRes.data);
      setInvoices(invoicesRes.data);
    } catch (err) {
      console.error('Failed to load subscription data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentPlan = useMemo(
    () => plans.find(p => p.planKey === subscription?.planKey),
    [plans, subscription],
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric',
    });

  const formatPrice = (amount: number) => {
    if (amount === 0) return t('subscription.free');
    return `${amount.toLocaleString()} TND`;
  };

  const handleSwitchPlan = async (planKey: PlanKey) => {
    setActionLoading(true);
    try {
      const res = await subscriptionApi.switchPlan(planKey);
      setSubscription(res.data);
      setSwitchPlanDialog(null);
      setPlansDialogOpen(false);
      toast({ title: t('subscription.planSwitched'), description: t('subscription.planSwitchedDesc') });
      loadData();
    } catch {
      toast({ title: t('subscription.error'), description: t('subscription.switchFailed'), variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleSwitchInterval = async () => {
    if (!subscription) return;
    setActionLoading(true);
    const newInterval = subscription.interval === 'monthly' ? 'yearly' : 'monthly';
    try {
      const res = await subscriptionApi.switchInterval(newInterval as any);
      setSubscription(res.data);
      toast({ title: t('subscription.intervalSwitched'), description: t('subscription.intervalSwitchedDesc') });
    } catch {
      toast({ title: t('subscription.error'), description: t('subscription.switchFailed'), variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    setActionLoading(true);
    try {
      await subscriptionApi.cancel();
      setCancelDialogOpen(false);
      toast({ title: t('subscription.canceled'), description: t('subscription.canceledDesc') });
      loadData();
    } catch {
      toast({ title: t('subscription.error'), description: t('subscription.cancelFailed'), variant: 'destructive' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleBillingPortal = async () => {
    try {
      const res = await subscriptionApi.getBillingPortalUrl();
      if (res.data.url && res.data.url !== '#billing-portal') {
        window.open(res.data.url, '_blank');
      } else {
        toast({ title: t('subscription.billingPortal'), description: t('subscription.billingPortalMock') });
      }
    } catch {
      toast({ title: t('subscription.error'), description: t('subscription.billingPortalFailed'), variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!subscription || !currentPlan) {
    return (
      <div className="space-y-4">
        <ActivatedModulesSection />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Plan & Billing */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-foreground">
              {t('subscription.currentPlan')}
            </CardTitle>
            <Badge variant={STATUS_VARIANTS[subscription.status] || 'outline'}>
              {t(`subscription.status.${subscription.status}`)}
            </Badge>
          </div>
          <CardDescription className="text-xs">{t('subscription.currentPlanDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">{currentPlan.name}</p>
              <p className="text-xs text-muted-foreground">{currentPlan.description}</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-semibold text-foreground">
                {formatPrice(subscription.pricePerSeat)}
              </span>
              {subscription.pricePerSeat > 0 && (
                <span className="text-xs text-muted-foreground block">
                  / {t('subscription.perSeat')} / {t(`subscription.interval.${subscription.interval}`)}
                </span>
              )}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <DetailRow label={t('subscription.billingInterval')} value={t(`subscription.interval.${subscription.interval}`)} />
            <DetailRow label={t('subscription.seats')} value={String(subscription.seats)} />
            <DetailRow label={t('subscription.renewalDate')} value={formatDate(subscription.currentPeriodEnd)} />
          </div>

          <Separator />

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleSwitchInterval} disabled={actionLoading}>
              {subscription.interval === 'monthly'
                ? t('subscription.switchToYearly')
                : t('subscription.switchToMonthly')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleBillingPortal}>
              {t('subscription.manageBilling')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPlansDialogOpen(true)}>
              {t('subscription.viewPlans')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card className="shadow-card border-0 bg-card">
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-sm font-medium text-foreground">
            {t('subscription.invoicesTitle')}
          </CardTitle>
          <CardDescription className="text-xs">{t('subscription.invoicesDesc')}</CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {invoices.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center py-6">{t('subscription.noInvoices')}</p>
          ) : (
            <div className="space-y-0.5">
              {invoices.map(inv => (
                <div
                  key={inv.id}
                  className="flex items-center justify-between py-2.5 px-2 hover:bg-muted/30 rounded transition-colors"
                >
                  <div>
                    <p className="text-sm text-foreground">{inv.description}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(inv.invoiceDate)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-foreground">
                      {inv.amount.toLocaleString()} TND
                    </span>
                    <Badge variant={INVOICE_STATUS_VARIANTS[inv.status] || 'outline'} className="text-xs">
                      {t(`subscription.invoiceStatus.${inv.status}`)}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activated Modules (shared with Plugins page) */}
      <ActivatedModulesSection />

      {/* Cancel */}
      {subscription.status !== 'canceled' && (
        <Card className="shadow-card border-0 bg-card">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-sm font-medium text-destructive">
              {t('subscription.cancelTitle')}
            </CardTitle>
            <CardDescription className="text-xs">{t('subscription.cancelDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setCancelDialogOpen(true)}
            >
              {t('subscription.cancelPlan')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Plans Dialog */}
      <Dialog open={plansDialogOpen} onOpenChange={setPlansDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">{t('subscription.plansTitle')}</DialogTitle>
            <DialogDescription className="text-xs">{t('subscription.plansDesc')}</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {plans.filter(p => p.isActive).map(plan => {
              const isCurrent = plan.planKey === subscription.planKey;
              const isUpgrade = plan.sortOrder > (currentPlan?.sortOrder ?? 0);
              const price = subscription.interval === 'yearly' ? plan.yearlyPricePerSeat : plan.monthlyPricePerSeat;

              return (
                <div
                  key={plan.planKey}
                  className={`rounded-lg border p-4 space-y-2.5 ${
                    isCurrent
                      ? 'border-primary bg-primary/5'
                      : 'border-border/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">{plan.name}</span>
                    {isCurrent && (
                      <Badge variant="default" className="text-xs h-5">{t('subscription.current')}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{plan.description}</p>
                  <div>
                    <span className="text-sm font-semibold text-foreground">
                      {formatPrice(price)}
                    </span>
                    {price > 0 && (
                      <span className="text-xs text-muted-foreground ml-1">
                        / {t('subscription.perSeat')} / {t(`subscription.interval.${subscription.interval}`)}
                      </span>
                    )}
                  </div>
                  <ul className="space-y-1 pt-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <Check className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  {!isCurrent && (
                    <Button
                      size="sm"
                      variant={isUpgrade ? 'default' : 'outline'}
                      className="w-full text-xs mt-1"
                      onClick={() => setSwitchPlanDialog(plan.planKey)}
                    >
                      {isUpgrade ? t('subscription.upgrade') : t('subscription.downgrade')}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('subscription.cancelConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>{t('subscription.cancelConfirmDesc')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {t('subscription.cancelPlan')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Switch Plan Dialog */}
      <AlertDialog open={!!switchPlanDialog} onOpenChange={() => setSwitchPlanDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('subscription.switchConfirmTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('subscription.switchConfirmDesc', {
                plan: plans.find(p => p.planKey === switchPlanDialog)?.name || '',
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('confirm.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => switchPlanDialog && handleSwitchPlan(switchPlanDialog)}
              disabled={actionLoading}
            >
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin mr-1.5" />}
              {t('confirm.save')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm text-foreground">{value}</span>
    </div>
  );
}
