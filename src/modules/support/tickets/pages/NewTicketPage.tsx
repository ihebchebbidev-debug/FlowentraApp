import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, ArrowLeft, Info, Loader2 } from 'lucide-react';
import FileUploader from '@/modules/support/components/FileUploader';
import TicketLinkSelector from '@/components/tickets/TicketLinkSelector';
import { supportTicketsApi } from '@/services/api/supportTicketsApi';

interface SelectedLink {
  targetTicketId: number;
  linkType: 'related' | 'duplicate' | 'blocks' | 'blocked_by';
  title?: string;
  status?: string;
}

function getCurrentUserEmail(): string | undefined {
  try {
    const raw = localStorage.getItem('user_data') || sessionStorage.getItem('user_data');
    if (!raw) return undefined;
    return (JSON.parse(raw) as { email?: string }).email;
  } catch {
    return undefined;
  }
}

export default function NewTicketPage() {
  const { t } = useTranslation('support');
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const prefillTitle = searchParams.get('title') || '';
  const prefillUrgency = searchParams.get('urgency') || 'medium';
  const prefillModule = searchParams.get('module') || '';
  const prefillCurrentPage = searchParams.get('currentPage') || '';

  const [title, setTitle] = useState(prefillTitle);
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState(prefillUrgency);
  const [category, setCategory] = useState('bug');
  const [attachments, setAttachments] = useState<File[]>([]);
  const [relatedUrl, setRelatedUrl] = useState('');
  const [links, setLinks] = useState<SelectedLink[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const currentPage = useMemo(
    () => prefillCurrentPage || (typeof document !== 'undefined' ? document.referrer || location.pathname : location.pathname),
    [prefillCurrentPage, location.pathname]
  );

  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      const created = await supportTicketsApi.create({
        title: title.trim(),
        description: description.trim(),
        urgency,
        category,
        currentPage,
        relatedUrl: relatedUrl || (typeof window !== 'undefined' ? window.location.href : undefined),
        userEmail: getCurrentUserEmail(),
        attachments,
      });

      // Add links after creation (best-effort)
      let linkFailure = false;
      for (const l of links) {
        try {
          await supportTicketsApi.addLink(created.id, {
            targetTicketId: l.targetTicketId,
            linkType: l.linkType,
          });
        } catch (err) {
          linkFailure = true;
          console.error('Failed to add ticket link', err);
        }
      }

      if (linkFailure) {
        toast.warning(t('reportIssue.linkWarning', 'Ticket created but one or more links failed'));
      } else {
        toast.success(t('ticket.success', 'Ticket created — our team will review it shortly'));
      }

      navigate(`/support/tickets/${created.id}`);
    } catch (err) {
      console.error('Create ticket failed', err);
      toast.error(t('ticket.error', 'Failed to create support request'));
    } finally {
      setSubmitting(false);
    }
  };

  const prefillModuleNote = prefillModule
    ? t('newTicket.prefillModule', 'Reporting from module: {{module}}', { module: prefillModule })
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 p-4 border-b border-border bg-card/50 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t('newTicket.title', 'New ticket')}
            </h1>
            <p className="text-px-11 text-muted-foreground">
              {t('newTicket.subtitle', 'Describe your issue and our team will look into it.')}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => navigate('/support/tickets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('common.cancel', 'Cancel')}
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-6xl mx-auto">
          {/* Left: form */}
          <Card className="lg:col-span-2 p-5 space-y-4 bg-card border-border">
            {prefillModuleNote && (
              <div className="text-xs text-muted-foreground flex items-center gap-2 bg-muted/40 rounded-md px-3 py-2">
                <Info className="h-3.5 w-3.5" />
                {prefillModuleNote}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="ticket-title">{t('reportIssue.issueTitle', 'Title')} *</Label>
              <Input
                id="ticket-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t('reportIssue.issueTitlePlaceholder', 'Brief summary of the issue')}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-desc">{t('reportIssue.description', 'Description')} *</Label>
              <Textarea
                id="ticket-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t('reportIssue.descriptionPlaceholder', 'Describe the issue in detail — steps, expected vs actual...')}
                className="min-h-[160px]"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>{t('reportIssue.urgency', 'Urgency')}</Label>
                <Select value={urgency} onValueChange={setUrgency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="low">{t('priorities.low', 'Low')}</SelectItem>
                    <SelectItem value="medium">{t('priorities.medium', 'Medium')}</SelectItem>
                    <SelectItem value="high">{t('priorities.high', 'High')}</SelectItem>
                    <SelectItem value="critical">{t('priorities.critical', 'Critical')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('reportIssue.category', 'Category')}</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border shadow-md z-50">
                    <SelectItem value="bug">{t('ticketCategories.bug', 'Bug Report')}</SelectItem>
                    <SelectItem value="feature">{t('ticketCategories.feature', 'Feature Request')}</SelectItem>
                    <SelectItem value="billing">{t('ticketCategories.billing', 'Billing')}</SelectItem>
                    <SelectItem value="account">{t('ticketCategories.account', 'Account')}</SelectItem>
                    <SelectItem value="technical">{t('ticketCategories.technical', 'Technical')}</SelectItem>
                    <SelectItem value="general">{t('ticketCategories.general', 'General')}</SelectItem>
                    <SelectItem value="other">{t('ticketCategories.other', 'Other')}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ticket-url">{t('reportIssue.relatedUrl', 'Related URL (optional)')}</Label>
              <Input
                id="ticket-url"
                value={relatedUrl}
                onChange={(e) => setRelatedUrl(e.target.value)}
                placeholder={t('reportIssue.relatedUrlPlaceholder', 'https://...')}
              />
            </div>

            <div className="space-y-1.5">
              <Label>{t('reportIssue.attachments', 'Attachments')}</Label>
              <FileUploader files={attachments} setFiles={setAttachments} />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" onClick={() => navigate('/support/tickets')}>
                {t('common.cancel', 'Cancel')}
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                {t('reportIssue.submit', 'Submit')}
              </Button>
            </div>
          </Card>

          {/* Right: helper + links */}
          <div className="space-y-4">
            <Card className="p-5 bg-card/50 backdrop-blur border-border">
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                {t('newTicket.tipsTitle', 'What to include')}
              </h3>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>{t('newTicket.tips.reproduce', 'Steps to reproduce the issue')}</li>
                <li>{t('newTicket.tips.expected', 'Expected vs actual behavior')}</li>
                <li>{t('newTicket.tips.screenshots', 'Screenshots or short screen recordings')}</li>
                <li>{t('newTicket.tips.errors', 'Any error messages you saw')}</li>
                <li>{t('newTicket.tips.impact', 'How many users are affected')}</li>
              </ul>
            </Card>

            <Card className="p-5 bg-card border-border">
              <h3 className="text-sm font-semibold mb-2">
                {t('reportIssue.linkToExisting', 'Link to existing ticket')}
              </h3>
              <TicketLinkSelector existingLinks={links} onLinksChange={setLinks} />
            </Card>
          </div>
        </form>
      </div>
    </div>
  );
}
