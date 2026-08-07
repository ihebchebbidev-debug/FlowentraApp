import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { OnboardingData } from "../pages/Onboarding";
import { Mail, Calendar, ArrowLeft, ArrowRight, Inbox, Bell, RefreshCw, CheckCircle2, Loader2, Link2 } from "lucide-react";
import { useTranslation } from 'react-i18next';
import { useConnectedAccounts } from '@/modules/email-calendar/hooks/useConnectedAccounts';
import { toast } from '@/hooks/use-toast';

interface EmailCalendarStepProps {
  data: OnboardingData;
  onNext: (data: Partial<OnboardingData>) => void;
  onBack: () => void;
  isFirst: boolean;
}

const features = [
  {
    icon: Inbox,
    titleKey: 'onboarding.steps.emailCalendar.features.unifiedInbox',
    descKey: 'onboarding.steps.emailCalendar.features.unifiedInboxDesc',
  },
  {
    icon: Calendar,
    titleKey: 'onboarding.steps.emailCalendar.features.calendarSync',
    descKey: 'onboarding.steps.emailCalendar.features.calendarSyncDesc',
  },
  {
    icon: RefreshCw,
    titleKey: 'onboarding.steps.emailCalendar.features.autoSync',
    descKey: 'onboarding.steps.emailCalendar.features.autoSyncDesc',
  },
  {
    icon: Bell,
    titleKey: 'onboarding.steps.emailCalendar.features.notifications',
    descKey: 'onboarding.steps.emailCalendar.features.notificationsDesc',
  },
];

export function EmailCalendarStep({ data, onNext, onBack }: EmailCalendarStepProps) {
  const { t } = useTranslation();
  const { accounts, connectAccount, loading: accountsLoading } = useConnectedAccounts();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connected, setConnected] = useState(false);

  // Check if already connected
  useEffect(() => {
    if (!accountsLoading && accounts.length > 0) {
      setConnected(true);
    }
  }, [accountsLoading, accounts]);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const account = await connectAccount('google');
      if (account) {
        setConnected(true);
        toast({
          title: t('auth.success', 'Success'),
          description: t('auth.email_auto_connected', 'Email & calendar connected successfully.'),
        });
      }
    } catch (err) {
      console.info('Email connect skipped or cancelled:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleNext = () => {
    onNext({});
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Feature intro */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Calendar className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {t('onboarding.steps.emailCalendar.intro')}
        </p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-md bg-primary/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {t(feature.titleKey)}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                  {t(feature.descKey)}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connect button or connected status */}
      {connected ? (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border-2 border-primary/20 mb-8">
          <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-foreground">
              {t('onboarding.steps.emailCalendar.connected', 'Email & Calendar Connected')}
            </p>
            <p className="text-xs text-muted-foreground">
              {t('onboarding.steps.emailCalendar.connectedDesc', 'Your account is synced and ready to go.')}
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-8">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            variant="outline"
            className="w-full h-12 text-sm font-medium border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            {isConnecting ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Link2 className="h-4 w-4 mr-2" />
            )}
            {isConnecting
              ? t('onboarding.steps.emailCalendar.connecting', 'Connecting...')
              : t('onboarding.steps.emailCalendar.connectGoogle', 'Connect Google Account')
            }
          </Button>
        </div>
      )}

      {/* Setup later note */}
      {!connected && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-muted/50 border border-border mb-8">
          <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {t('onboarding.steps.emailCalendar.setupLater')}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          className="h-9 px-6 text-sm border border-border hover:bg-muted/50 transition-colors rounded-lg"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-2" />
          {t('onboarding.back')}
        </Button>
        <Button
          onClick={handleNext}
          className="h-9 px-8 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors rounded-lg"
        >
          {t('onboarding.continue')}
          <ArrowRight className="h-3.5 w-3.5 ml-2" />
        </Button>
      </div>
    </div>
  );
}
