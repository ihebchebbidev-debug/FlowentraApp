import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Mail, Inbox, Search, RefreshCcw, Loader2, Paperclip, Star, PenSquare, Trash2, CheckSquare, Square, MinusSquare, MailOpen, MailCheck, Settings2 } from 'lucide-react';
import { ProviderIcon } from './ProviderIcon';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';
import type { ConnectedAccount } from '../types';
import type { SyncedEmailDto, SendEmailDto, SendEmailResultDto } from '@/services/api/emailAccountsApi';
import { ComposeEmailDialog, type ComposeEmailData } from './ComposeEmailDialog';
import { EmailDetailDialog } from './EmailDetailDialog';

interface EmailSettingsTabProps {
  accounts: ConnectedAccount[];
  selectedAccountId: string | null;
  onSelectAccount: (id: string) => void;
  // Email sync props
  emails: SyncedEmailDto[];
  emailsTotalCount: number;
  emailsLoading: boolean;
  syncing: boolean;
  onSyncEmails: (accountId: string, maxResults?: number) => Promise<any>;
  onFetchEmails: (accountId: string, page?: number, pageSize?: number, search?: string) => Promise<any>;
  onStartAutoSync: (accountId: string) => void;
  onStopAutoSync: () => void;
  onSendEmail: (accountId: string, dto: SendEmailDto) => Promise<SendEmailResultDto>;
  sendingEmail: boolean;
  onToggleStar: (accountId: string, emailId: string) => Promise<boolean>;
  onToggleRead: (accountId: string, emailId: string) => Promise<boolean>;
  onDeleteEmail: (accountId: string, emailId: string) => Promise<boolean>;
}

export function EmailSettingsTab({
  accounts,
  selectedAccountId,
  onSelectAccount,
  emails,
  emailsTotalCount,
  emailsLoading,
  syncing,
  onSyncEmails,
  onFetchEmails,
  onStartAutoSync,
  onStopAutoSync,
  onSendEmail,
  sendingEmail,
  onToggleStar,
  onToggleRead,
  onDeleteEmail,
}: EmailSettingsTabProps) {
  const { t } = useTranslation('email-calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [initialSyncDone, setInitialSyncDone] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<SyncedEmailDto | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActioning, setBulkActioning] = useState(false);
  const [inboxFilter, setInboxFilter] = useState<'all' | 'unread' | 'starred'>('all');

  const selectedAccount = accounts.find(a => a.id === selectedAccountId) || accounts[0];

  // Initial sync + fetch on account selection
  useEffect(() => {
    if (selectedAccount && !initialSyncDone) {
      const doInitialSync = async () => {
        try {
          await onSyncEmails(selectedAccount.id);
        } catch {
          // Sync failed, still try to fetch cached emails
        }
        await onFetchEmails(selectedAccount.id, 1, 25);
        setInitialSyncDone(true);
        onStartAutoSync(selectedAccount.id);
      };
      doInitialSync();
    }
    return () => onStopAutoSync();
  }, [selectedAccount?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch when search or page changes
  useEffect(() => {
    if (selectedAccount && initialSyncDone) {
      const timeout = setTimeout(() => {
        onFetchEmails(selectedAccount.id, currentPage, 25, searchQuery || undefined);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [searchQuery, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleManualSync = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      await onSyncEmails(selectedAccount.id);
      await onFetchEmails(selectedAccount.id, currentPage, 25, searchQuery || undefined);
    } catch {
      // Error handled in hook
    }
  }, [selectedAccount, currentPage, searchQuery, onSyncEmails, onFetchEmails]);

  const handleSendEmail = useCallback(async (data: ComposeEmailData) => {
    if (!selectedAccount) return;
    const result = await onSendEmail(selectedAccount.id, {
      to: data.to,
      cc: data.cc,
      bcc: data.bcc,
      subject: data.subject,
      body: data.body,
      attachments: data.attachments,
    });
    if (result.success) {
      toast({ title: t('compose.successTitle'), description: t('compose.successDescription') });
      setComposeOpen(false);
      setTimeout(() => {
        onSyncEmails(selectedAccount.id).then(() => {
          onFetchEmails(selectedAccount.id, currentPage, 25, searchQuery || undefined);
        }).catch(() => {});
      }, 2000);
    } else {
      toast({ title: t('compose.errorTitle'), description: result.error || t('compose.errorDescription'), variant: 'destructive' });
    }
  }, [selectedAccount, onSendEmail, onSyncEmails, onFetchEmails, currentPage, searchQuery, t]);

  const handleReply = useCallback(async (dto: SendEmailDto) => {
    if (!selectedAccount) return;
    const result = await onSendEmail(selectedAccount.id, dto);
    if (result.success) {
      toast({ title: t('compose.successTitle'), description: t('compose.successDescription') });
      setTimeout(() => {
        onSyncEmails(selectedAccount.id).then(() => {
          onFetchEmails(selectedAccount.id, currentPage, 25, searchQuery || undefined);
        }).catch(() => {});
      }, 2000);
    } else {
      toast({ title: t('compose.errorTitle'), description: result.error || t('compose.errorDescription'), variant: 'destructive' });
    }
  }, [selectedAccount, onSendEmail, onSyncEmails, onFetchEmails, currentPage, searchQuery, t]);

  const handleEmailClick = useCallback((email: SyncedEmailDto) => {
    setSelectedEmail(email);
    setDetailOpen(true);
  }, []);

  const handleToggleStar = useCallback(async (e: React.MouseEvent, email: SyncedEmailDto) => {
    e.stopPropagation();
    if (!selectedAccount) return;
    const success = await onToggleStar(selectedAccount.id, email.id);
    if (success) {
      // Also update selectedEmail if it's the same one
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(prev => prev ? { ...prev, isStarred: !prev.isStarred } : null);
      }
      toast({ title: email.isStarred ? t('emails.actions.unstarred') : t('emails.actions.starred') });
    } else {
      toast({ title: t('emails.actions.starFailed'), variant: 'destructive' });
    }
  }, [selectedAccount, onToggleStar, selectedEmail, t]);

  const handleDeleteEmail = useCallback(async (e: React.MouseEvent, email: SyncedEmailDto) => {
    e.stopPropagation();
    if (!selectedAccount) return;
    const success = await onDeleteEmail(selectedAccount.id, email.id);
    if (success) {
      if (selectedEmail?.id === email.id) {
        setDetailOpen(false);
        setSelectedEmail(null);
      }
      toast({ title: t('emails.actions.deleted') });
    } else {
      toast({ title: t('emails.actions.deleteFailed'), variant: 'destructive' });
    }
  }, [selectedAccount, onDeleteEmail, selectedEmail, t]);

  const handleToggleRead = useCallback(async (e: React.MouseEvent, email: SyncedEmailDto) => {
    e.stopPropagation();
    if (!selectedAccount) return;
    const success = await onToggleRead(selectedAccount.id, email.id);
    if (success) {
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(prev => prev ? { ...prev, isRead: !prev.isRead } : null);
      }
      toast({ title: email.isRead ? t('emails.actions.markedUnread') : t('emails.actions.markedRead') });
    } else {
      toast({ title: t('emails.actions.readFailed'), variant: 'destructive' });
    }
  }, [selectedAccount, onToggleRead, selectedEmail, t]);

  // Group/non-professional email patterns for client-side filtering
  const GROUP_EMAIL_PREFIXES = ['team@', 'support@', 'noreply@', 'no-reply@', 'info@', 'admin@', 'hello@', 'contact@', 'sales@', 'marketing@', 'hr@', 'billing@', 'help@', 'feedback@'];
  const NON_PROFESSIONAL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'live.com', 'aol.com', 'icloud.com', 'mail.com', 'protonmail.com', 'zoho.com'];

  const filteredEmails = useMemo(() => {
    let result = emails;

    // Apply exclude group emails filter
    if (selectedAccount?.emailSettings.excludeGroupEmails) {
      result = result.filter(e => {
        const from = (e.fromEmail || '').toLowerCase();
        return !GROUP_EMAIL_PREFIXES.some(prefix => from.startsWith(prefix));
      });
    }

    // Apply exclude non-professional emails filter
    if (selectedAccount?.emailSettings.excludeNonProfessionalEmails) {
      result = result.filter(e => {
        const from = (e.fromEmail || '').toLowerCase();
        const domain = from.split('@')[1] || '';
        return !NON_PROFESSIONAL_DOMAINS.includes(domain);
      });
    }

    // Apply inbox tab filter
    if (inboxFilter === 'unread') result = result.filter(e => !e.isRead);
    if (inboxFilter === 'starred') result = result.filter(e => e.isStarred);

    return result;
  }, [emails, inboxFilter, selectedAccount?.emailSettings.excludeGroupEmails, selectedAccount?.emailSettings.excludeNonProfessionalEmails]);

  const unreadCount = useMemo(() => emails.filter(e => !e.isRead).length, [emails]);
  const starredCount = useMemo(() => emails.filter(e => e.isStarred).length, [emails]);

  // ─── Bulk Selection ───
  const allSelected = filteredEmails.length > 0 && selectedIds.size === filteredEmails.length;
  const someSelected = selectedIds.size > 0 && selectedIds.size < filteredEmails.length;

  const toggleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredEmails.map(e => e.id)));
    }
  }, [allSelected, filteredEmails]);

  const toggleSelectOne = useCallback((emailId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(emailId)) next.delete(emailId);
      else next.add(emailId);
      return next;
    });
  }, []);

  // Clear selection when page/search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [currentPage, searchQuery]);

  const handleBulkStar = useCallback(async () => {
    if (!selectedAccount || selectedIds.size === 0) return;
    setBulkActioning(true);
    let successCount = 0;
    for (const emailId of selectedIds) {
      const success = await onToggleStar(selectedAccount.id, emailId);
      if (success) successCount++;
    }
    setBulkActioning(false);
    if (successCount > 0) {
      toast({ title: t('emails.actions.bulkStarred', { count: successCount }) });
      setSelectedIds(new Set());
    } else {
      toast({ title: t('emails.actions.bulkStarFailed'), variant: 'destructive' });
    }
  }, [selectedAccount, selectedIds, onToggleStar, t]);

  const handleBulkRead = useCallback(async () => {
    if (!selectedAccount || selectedIds.size === 0) return;
    setBulkActioning(true);
    let successCount = 0;
    for (const emailId of selectedIds) {
      const success = await onToggleRead(selectedAccount.id, emailId);
      if (success) successCount++;
    }
    setBulkActioning(false);
    if (successCount > 0) {
      toast({ title: t('emails.actions.bulkReadToggled', { count: successCount }) });
      setSelectedIds(new Set());
    } else {
      toast({ title: t('emails.actions.bulkReadFailed'), variant: 'destructive' });
    }
  }, [selectedAccount, selectedIds, onToggleRead, t]);

  const handleBulkDelete = useCallback(async () => {
    if (!selectedAccount || selectedIds.size === 0) return;
    setBulkActioning(true);
    let successCount = 0;
    const idsToDelete = Array.from(selectedIds);
    for (const emailId of idsToDelete) {
      const success = await onDeleteEmail(selectedAccount.id, emailId);
      if (success) successCount++;
    }
    setBulkActioning(false);
    if (successCount > 0) {
      toast({ title: t('emails.actions.bulkDeleted', { count: successCount }) });
      setSelectedIds(new Set());
    } else {
      toast({ title: t('emails.actions.bulkDeleteFailed'), variant: 'destructive' });
    }
  }, [selectedAccount, selectedIds, onDeleteEmail, t]);

  const totalPages = Math.ceil(emailsTotalCount / 25);

  const navigate = useNavigate();

  if (accounts.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <div className="p-4 rounded-full bg-muted/50 mb-4">
            <Mail className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-sm font-medium text-foreground mb-1">{t('emails.inbox.noAccountTitle')}</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-4">{t('emails.inbox.noAccountDescription')}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate('/dashboard/settings', { state: { tab: 'integrations' } })}
          >
            <Settings2 className="h-4 w-4" />
            {t('emails.inbox.goToIntegrations')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account selector — always visible */}
      <div className="flex items-center gap-2">
        {accounts.length === 1 ? (
          <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg border border-border/60 bg-background shadow-sm text-sm">
            <div className="h-7 w-7 rounded-md bg-background border border-border/60 flex items-center justify-center shadow-sm">
              <ProviderIcon provider={selectedAccount?.provider || ''} className="h-4 w-4" />
            </div>
            <span className="font-medium text-foreground">{selectedAccount?.handle}</span>
          </div>
        ) : (
          <Select value={selectedAccount?.id} onValueChange={(id) => { onSelectAccount(id); setInitialSyncDone(false); setCurrentPage(1); setSearchQuery(''); }}>
            <SelectTrigger className="w-80 bg-background shadow-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {accounts.map(a => (
                <SelectItem key={a.id} value={a.id}>
                  <div className="flex items-center gap-2.5">
                    <div className="h-6 w-6 rounded-md bg-background border border-border/60 flex items-center justify-center">
                      <ProviderIcon provider={a.provider} className="h-3.5 w-3.5" />
                    </div>
                    <span>{a.handle}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {selectedAccount && (
        <>
          {/* Inbox / Emails List */}
          {!initialSyncDone ? (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="space-y-2">
                      <div className="h-5 w-32 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      <div className="h-3 w-48 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40" />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-56 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                    <div className="h-8 w-24 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                    <div className="h-8 w-20 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-border/30">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-[auto_auto_minmax(120px,1fr)_2fr_auto_auto] gap-3 px-3 py-2.5">
                      <div className="h-4 w-4 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 mt-0.5" />
                      <div className="h-4 w-4 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 mt-0.5" />
                      <div className="h-4 w-24 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-40 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                        <div className="h-3 w-28 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 hidden sm:block" />
                      </div>
                      <div className="h-3 w-16 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      <div className="w-14" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div>
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                      <Inbox className="h-4 w-4 text-primary" />
                      {t('emails.inbox.title')}
                      {emailsTotalCount > 0 && (
                        <Badge variant="secondary" className="text-xs ml-1">{emailsTotalCount}</Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="text-sm">{t('emails.inbox.description')}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative w-56">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder={t('emails.inbox.searchPlaceholder')}
                      className="pl-8 h-8"
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <Button
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={() => setComposeOpen(true)}
                  >
                    <PenSquare className="h-3.5 w-3.5" />
                    {t('compose.compose')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5 h-8"
                    onClick={handleManualSync}
                    disabled={syncing}
                  >
                    {syncing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCcw className="h-3.5 w-3.5" />
                    )}
                    {t('emails.inbox.sync')}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Inbox filter tabs */}
              <div className="flex items-center gap-1 px-3 py-2 border-b border-border/40">
                <Button
                  variant={inboxFilter === 'all' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => { setInboxFilter('all'); setSelectedIds(new Set()); }}
                >
                  <Inbox className="h-3 w-3" />
                  {t('emails.inbox.filterAll', 'All')}
                  {emailsTotalCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">{emailsTotalCount}</Badge>
                  )}
                </Button>
                <Button
                  variant={inboxFilter === 'unread' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => { setInboxFilter('unread'); setSelectedIds(new Set()); }}
                >
                  <Mail className="h-3 w-3" />
                  {t('emails.inbox.filterUnread', 'Unread')}
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">{unreadCount}</Badge>
                  )}
                </Button>
                <Button
                  variant={inboxFilter === 'starred' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => { setInboxFilter('starred'); setSelectedIds(new Set()); }}
                >
                  <Star className="h-3 w-3" />
                  {t('emails.inbox.filterStarred', 'Starred')}
                  {starredCount > 0 && (
                    <Badge variant="secondary" className="text-[10px] h-4 px-1 ml-0.5">{starredCount}</Badge>
                  )}
                </Button>
              </div>

              {/* Bulk action bar */}
              {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-b border-border/40 rounded-t-md">
                  <span className="text-xs font-medium text-foreground">
                    {t('emails.actions.selected', { count: selectedIds.size })}
                  </span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={handleBulkStar}
                      disabled={bulkActioning}
                    >
                      {bulkActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Star className="h-3 w-3" />}
                      {t('emails.actions.star')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 text-xs gap-1.5"
                      onClick={handleBulkRead}
                      disabled={bulkActioning}
                    >
                      {bulkActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <MailOpen className="h-3 w-3" />}
                      {t('emails.actions.markRead')}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1.5 text-destructive hover:text-destructive"
                          disabled={bulkActioning}
                        >
                          {bulkActioning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                          {t('emails.actions.delete')}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>{t('emails.actions.bulkDeleteConfirmTitle', { count: selectedIds.size })}</AlertDialogTitle>
                          <AlertDialogDescription>{t('emails.actions.bulkDeleteConfirmDescription', { count: selectedIds.size })}</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>{t('emails.actions.cancel')}</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={handleBulkDelete}
                          >
                            {t('emails.actions.delete')}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() => setSelectedIds(new Set())}
                    >
                      {t('emails.actions.deselectAll')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Email list header */}
              <div className="grid grid-cols-[auto_auto_minmax(120px,1fr)_2fr_auto_auto] gap-3 px-3 py-2 text-xs font-medium text-muted-foreground border-b border-border/40">
                <Checkbox
                  checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                  onCheckedChange={toggleSelectAll}
                  className="mt-0.5"
                  aria-label={t('emails.actions.selectAll')}
                />
                <span className="w-5" />
                <span>{t('emails.inbox.from')}</span>
                <span>{t('emails.inbox.subject')}</span>
                <span>{t('emails.inbox.date')}</span>
                <span className="w-14" />
              </div>

              {/* Loading skeleton */}
              {(emailsLoading && emails.length === 0) ? (
                <div className="divide-y divide-border/30">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="grid grid-cols-[auto_auto_minmax(120px,1fr)_2fr_auto_auto] gap-3 px-3 py-2.5">
                      <div className="h-4 w-4 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 mt-0.5" />
                      <div className="h-4 w-4 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60 mt-0.5" />
                      <div className="h-4 w-24 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      <div className="flex items-center gap-2">
                        <div className="h-4 w-40 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                        <div className="h-3 w-28 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/40 via-muted/20 to-muted/40 hidden sm:block" />
                      </div>
                      <div className="h-3 w-16 rounded bg-muted/60 animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted/60 via-muted/30 to-muted/60" />
                      <div className="w-14" />
                    </div>
                  ))}
                </div>
              ) : filteredEmails.length === 0 ? (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="p-3 rounded-full bg-muted/50 mb-3">
                    {inboxFilter === 'starred' ? (
                      <Star className="h-6 w-6 text-muted-foreground" />
                    ) : inboxFilter === 'unread' ? (
                      <Mail className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {inboxFilter === 'unread'
                      ? t('emails.inbox.noUnreadEmails', 'No unread emails')
                      : inboxFilter === 'starred'
                        ? t('emails.inbox.noStarredEmails', 'No starred emails')
                        : t('emails.inbox.noEmails')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    {inboxFilter === 'all' ? t('emails.inbox.noEmailsDescription') : t('emails.inbox.filterEmptyDescription', 'Try changing your filter or syncing new emails.')}
                  </p>
                  {inboxFilter === 'all' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4 gap-1.5"
                      onClick={handleManualSync}
                      disabled={syncing}
                    >
                      {syncing ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCcw className="h-3.5 w-3.5" />
                      )}
                      {t('emails.inbox.syncNow')}
                    </Button>
                  )}
                </div>
              ) : (
                /* Email list */
                <div className="divide-y divide-border/30">
                  {filteredEmails.map((email) => (
                    <div
                      key={email.id}
                      onClick={() => handleEmailClick(email)}
                      className={cn(
                        "grid grid-cols-[auto_auto_minmax(120px,1fr)_2fr_auto_auto] gap-3 px-3 py-2.5 hover:bg-foreground/[0.02] transition-colors cursor-pointer group",
                        !email.isRead && "bg-primary/[0.02]",
                        selectedIds.has(email.id) && "bg-primary/[0.04]"
                      )}
                    >
                      {/* Checkbox */}
                      <Checkbox
                        checked={selectedIds.has(email.id)}
                        onCheckedChange={() => toggleSelectOne(email.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-0.5"
                        aria-label={`Select ${email.subject}`}
                      />
                      {/* Star */}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={(e) => handleToggleStar(e, email)}
                            className="flex items-center justify-center w-5 h-5 shrink-0 mt-0.5"
                          >
                            <Star className={cn(
                              "h-3.5 w-3.5 transition-colors",
                              email.isStarred
                                ? "text-warning fill-warning"
                                : "text-muted-foreground/40 hover:text-warning group-hover:text-muted-foreground"
                            )} />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-xs">
                          {email.isStarred ? t('emails.actions.unstar') : t('emails.actions.star')}
                        </TooltipContent>
                      </Tooltip>
                      {/* From */}
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={cn(
                          "text-sm truncate",
                          !email.isRead ? "font-semibold text-foreground" : "text-muted-foreground"
                        )}>
                          {email.fromName || email.fromEmail}
                        </span>
                      </div>
                      {/* Subject + snippet */}
                      <div className="flex items-center gap-2 min-w-0">
                        {email.hasAttachments && <Paperclip className="h-3 w-3 text-muted-foreground shrink-0" />}
                        <span className={cn(
                          "text-sm truncate",
                          !email.isRead ? "font-medium text-foreground" : "text-foreground"
                        )}>
                          {email.subject || t('emails.inbox.noSubject')}
                        </span>
                        {email.snippet && (
                          <span className="text-xs text-muted-foreground truncate hidden sm:inline">
                            — {email.snippet}
                          </span>
                        )}
                      </div>
                      {/* Date */}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {format(new Date(email.receivedAt), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      {/* Actions: Read toggle + Delete */}
                      <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              onClick={(e) => handleToggleRead(e, email)}
                              className="p-1 rounded hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {email.isRead ? <MailOpen className="h-3.5 w-3.5" /> : <MailCheck className="h-3.5 w-3.5" />}
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="text-xs">
                            {email.isRead ? t('emails.actions.markUnread') : t('emails.actions.markRead')}
                          </TooltipContent>
                        </Tooltip>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button
                              onClick={(e) => e.stopPropagation()}
                              className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{t('emails.actions.deleteConfirmTitle')}</AlertDialogTitle>
                              <AlertDialogDescription>{t('emails.actions.deleteConfirmDescription')}</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>{t('emails.actions.cancel')}</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                onClick={(e) => handleDeleteEmail(e, email)}
                              >
                                {t('emails.actions.delete')}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-3 pt-3 border-t border-border/40 mt-2">
                  <span className="text-xs text-muted-foreground">
                    {t('emails.inbox.page')} {currentPage} / {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={currentPage <= 1}
                      onClick={() => setCurrentPage(p => p - 1)}
                    >
                      {t('emails.inbox.previous')}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage(p => p + 1)}
                    >
                      {t('emails.inbox.next')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Auto-sync indicator */}
              {selectedAccount.lastSyncedAt && (
                <div className="px-3 pt-2 text-xs text-muted-foreground flex items-center gap-1">
                  <RefreshCcw className="h-3 w-3" />
                  {t('emails.inbox.autoSync')}
                </div>
              )}
            </CardContent>
          </Card>
          )}
        </>
      )}

      {/* Compose Dialog */}
      {selectedAccount && (
        <ComposeEmailDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          senderHandle={selectedAccount.handle}
          sending={sendingEmail}
          onSend={handleSendEmail}
        />
      )}

      {/* Email Detail Dialog */}
      {selectedAccount && (
        <EmailDetailDialog
          open={detailOpen}
          onOpenChange={setDetailOpen}
          email={selectedEmail}
          senderHandle={selectedAccount.handle}
          accountId={selectedAccount.id}
          sending={sendingEmail}
          onSendReply={handleReply}
          onToggleStar={handleToggleStar}
          onToggleRead={handleToggleRead}
          onDeleteEmail={handleDeleteEmail}
        />
      )}
    </div>
  );
}
