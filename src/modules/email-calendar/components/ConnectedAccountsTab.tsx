import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Mail, RefreshCcw, Trash2, AlertTriangle, CheckCircle2, Loader2, XCircle, Clock, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import type { ConnectedAccount, EmailCalendarProvider, CustomEmailConfig } from '../types';
import { format } from 'date-fns';
import { CustomEmailConfigDialog } from './CustomEmailConfigDialog';
import { customEmailService } from '../services/customEmailService';
import { toast } from '@/hooks/use-toast';

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  );
}

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="1" y="1" width="10" height="10" fill="#F25022"/>
      <rect x="13" y="1" width="10" height="10" fill="#7FBA00"/>
      <rect x="1" y="13" width="10" height="10" fill="#00A4EF"/>
      <rect x="13" y="13" width="10" height="10" fill="#FFB900"/>
    </svg>
  );
}

function CustomSmtpIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2"/>
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2"/>
      <line x1="6" x2="6.01" y1="6" y2="6"/>
      <line x1="6" x2="6.01" y1="18" y2="18"/>
    </svg>
  );
}

interface ConnectedAccountsTabProps {
  accounts: ConnectedAccount[];
  onConnect: (provider: EmailCalendarProvider) => void;
  onDisconnect: (id: string) => void;
  onCustomAccountAdded?: (account: ConnectedAccount) => void;
  onCustomAccountRemoved?: (id: string) => void;
}

export function ConnectedAccountsTab({ accounts, onConnect, onDisconnect, onCustomAccountAdded, onCustomAccountRemoved }: ConnectedAccountsTabProps) {
  const { t } = useTranslation('email-calendar');
  const [customDialogOpen, setCustomDialogOpen] = useState(false);
  const [customAccounts, setCustomAccounts] = useState<ConnectedAccount[]>(() => customEmailService.getAll());

  const getSyncStatusBadge = (account: ConnectedAccount) => {
    if (account.authFailedAt) {
      return (
        <Badge variant="destructive" className="gap-1">
          <AlertTriangle className="h-3 w-3" />
          {t('accounts.authFailed')}
        </Badge>
      );
    }
    switch (account.syncStatus) {
      case 'active':
        return (
          <Badge className="bg-success/10 text-success border-success/20 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {t('accounts.synced')}
          </Badge>
        );
      case 'syncing':
        return (
          <Badge className="bg-primary/10 text-primary border-primary/20 gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            {t('accounts.syncing')}
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="h-3 w-3" />
            {t('accounts.failed')}
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary" className="gap-1">
            {t('accounts.notSynced')}
          </Badge>
        );
    }
  };

  const getProviderInfo = (provider: string) => {
    if (provider === 'google') {
      return { icon: <GoogleIcon className="h-5 w-5" />, label: 'Gmail' };
    }
    if (provider === 'custom') {
      return { icon: <CustomSmtpIcon className="h-5 w-5 text-primary" />, label: 'SMTP/IMAP' };
    }
    return { icon: <MicrosoftIcon className="h-5 w-5" />, label: 'Outlook' };
  };

  const handleCustomConnect = async (config: CustomEmailConfig) => {
    const account = await customEmailService.addAccount(config);
    setCustomAccounts(customEmailService.getAll());
    onCustomAccountAdded?.(account);
    toast({ title: t('customEmail.successTitle'), description: t('customEmail.successDescription') });
  };

  const handleCustomDisconnect = (id: string) => {
    customEmailService.removeAccount(id);
    setCustomAccounts(customEmailService.getAll());
    onCustomAccountRemoved?.(id);
  };

  const allAccounts = [...accounts, ...customAccounts];

  if (allAccounts.length === 0) {
    return (
      <>
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-2">{t('accounts.noAccounts')}</h3>
          <p className="text-xs text-muted-foreground max-w-md mb-8">
            {t('accounts.noAccountsDescription')}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Button variant="outline" className="gap-2 h-9 text-sm" onClick={() => onConnect('google')}>
              <GoogleIcon className="h-4 w-4" />
              {t('accounts.connectGoogle')}
            </Button>
            <Button variant="outline" className="gap-2 h-9 text-sm" onClick={() => onConnect('microsoft')}>
              <MicrosoftIcon className="h-4 w-4" />
              {t('accounts.connectOutlook')}
            </Button>
            <Button variant="outline" className="gap-2 h-9 text-sm" onClick={() => setCustomDialogOpen(true)}>
              <Server className="h-4 w-4" />
              {t('accounts.connectCustom')}
            </Button>
          </div>
        </CardContent>
      </Card>
      <CustomEmailConfigDialog open={customDialogOpen} onOpenChange={setCustomDialogOpen} onConnect={handleCustomConnect} />
      </>
    );
  }

  return (
    <>
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-sm font-medium">{t('accounts.title')}</CardTitle>
              <CardDescription className="text-xs">{t('accounts.description')}</CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onConnect('google')}>
                <GoogleIcon className="h-3.5 w-3.5" />
                {t('accounts.connectGoogle')}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => onConnect('microsoft')}>
                <MicrosoftIcon className="h-3.5 w-3.5" />
                {t('accounts.connectOutlook')}
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setCustomDialogOpen(true)}>
                <Server className="h-3.5 w-3.5" />
                {t('accounts.connectCustom')}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid gap-3">
            {allAccounts.map((account) => {
              const { icon, label } = getProviderInfo(account.provider);
              const isCustom = account.provider === 'custom';
              return (
                <div
                  key={account.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-border/40 hover:bg-foreground/[0.02] transition-colors"
                >
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-muted/50 shrink-0">
                    {icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{account.handle}</p>
                      <span className="text-xs text-muted-foreground font-medium">{label}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {getSyncStatusBadge(account)}
                      {account.lastSyncedAt && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {t('accounts.lastSynced')} {format(account.lastSyncedAt, 'MMM d, HH:mm')}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {t('accounts.connectedOn')} {format(account.createdAt, 'MMM d, yyyy')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {account.authFailedAt && (
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7">
                        <RefreshCcw className="h-3 w-3" />
                        {t('accounts.reconnect')}
                      </Button>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive h-7 w-7 p-0">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('accounts.disconnectConfirm')}</AlertDialogTitle>
                          <AlertDialogDescription>{t('accounts.disconnectDescription')}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('accounts.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => isCustom ? handleCustomDisconnect(account.id) : onDisconnect(account.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {t('accounts.disconnect')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
    <CustomEmailConfigDialog open={customDialogOpen} onOpenChange={setCustomDialogOpen} onConnect={handleCustomConnect} />
    </>
  );
}
