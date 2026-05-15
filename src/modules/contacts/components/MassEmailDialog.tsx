import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Mail, Send, X, Plus, Loader2, AlertCircle, CheckCircle2, XCircle, Users, Megaphone, ClipboardList, PartyPopper, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { emailAccountsApi, type SendEmailDto, type ConnectedEmailAccountDto } from '@/services/api/emailAccountsApi';

interface MassEmailRecipient {
  id: number;
  name: string;
  email: string;
}

interface MassEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: MassEmailRecipient[];
}

type EmailCategory = 'custom' | 'survey' | 'announcement' | 'newsletter' | 'follow_up';

const categoryTemplates: Record<EmailCategory, { icon: any; subjectEn: string; subjectFr: string; bodyEn: string; bodyFr: string }> = {
  custom: {
    icon: Mail,
    subjectEn: '',
    subjectFr: '',
    bodyEn: '',
    bodyFr: '',
  },
  survey: {
    icon: ClipboardList,
    subjectEn: 'We value your feedback - Quick Survey',
    subjectFr: 'Votre avis compte - Enquête rapide',
    bodyEn: 'Dear {name},\n\nWe would love to hear your feedback! Please take a moment to complete our short satisfaction survey.\n\nYour opinion helps us improve our services.\n\nThank you for your time.\n\nBest regards',
    bodyFr: 'Cher(e) {name},\n\nNous aimerions avoir votre avis ! Veuillez prendre un moment pour répondre à notre courte enquête de satisfaction.\n\nVotre opinion nous aide à améliorer nos services.\n\nMerci pour votre temps.\n\nCordialement',
  },
  announcement: {
    icon: Megaphone,
    subjectEn: 'Important Announcement',
    subjectFr: 'Annonce importante',
    bodyEn: 'Dear {name},\n\nWe are pleased to share an important update with you.\n\n[Your announcement here]\n\nPlease don\'t hesitate to reach out if you have any questions.\n\nBest regards',
    bodyFr: 'Cher(e) {name},\n\nNous avons le plaisir de partager une mise à jour importante avec vous.\n\n[Votre annonce ici]\n\nN\'hésitez pas à nous contacter si vous avez des questions.\n\nCordialement',
  },
  newsletter: {
    icon: Info,
    subjectEn: 'Monthly Newsletter',
    subjectFr: 'Newsletter mensuelle',
    bodyEn: 'Dear {name},\n\nHere are the latest updates and news from our team.\n\n[Newsletter content here]\n\nStay tuned for more updates!\n\nBest regards',
    bodyFr: 'Cher(e) {name},\n\nVoici les dernières actualités et nouvelles de notre équipe.\n\n[Contenu de la newsletter ici]\n\nRestez à l\'écoute pour plus de mises à jour !\n\nCordialement',
  },
  follow_up: {
    icon: PartyPopper,
    subjectEn: 'Following up - How can we help?',
    subjectFr: 'Suivi - Comment pouvons-nous vous aider ?',
    bodyEn: 'Dear {name},\n\nWe wanted to follow up and see how everything is going.\n\nIs there anything we can help you with?\n\nLooking forward to hearing from you.\n\nBest regards',
    bodyFr: 'Cher(e) {name},\n\nNous souhaitons prendre de vos nouvelles et voir comment tout se passe.\n\nY a-t-il quelque chose avec lequel nous pouvons vous aider ?\n\nAu plaisir de vous lire.\n\nCordialement',
  },
};

export function MassEmailDialog({ open, onOpenChange, recipients }: MassEmailDialogProps) {
  const { t, i18n } = useTranslation('contacts');
  const lang = i18n.language;
  const isEn = lang.startsWith('en');

  const [accounts, setAccounts] = useState<ConnectedEmailAccountDto[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [category, setCategory] = useState<EmailCategory>('custom');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({ sent: 0, failed: 0, total: 0 });
  const [deliveryResult, setDeliveryResult] = useState<{ success: boolean; sent: number; failed: number; errors: string[] } | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Fetch connected email accounts
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingAccounts(true);
      try {
        const { data } = await emailAccountsApi.getAll();
        if (data && data.length > 0) {
          setAccounts(data);
          setSelectedAccountId(data[0].id);
        } else {
          setAccounts([]);
        }
      } catch (err) {
        console.error('Failed to load email accounts:', err);
      } finally {
        setLoadingAccounts(false);
      }
    };
    load();
  }, [open]);

  // Apply template when category changes
  useEffect(() => {
    if (!open) return;
    const tmpl = categoryTemplates[category];
    setSubject(isEn ? tmpl.subjectEn : tmpl.subjectFr);
    setBody(isEn ? tmpl.bodyEn : tmpl.bodyFr);
  }, [category, open, isEn]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setCategory('custom');
      setCcEmails([]);
      setCcInput('');
      setShowCc(false);
      setProgress({ sent: 0, failed: 0, total: 0 });
    }
  }, [open]);

  const addCcEmail = useCallback((input: string) => {
    const email = input.trim().toLowerCase();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(isEn ? 'Invalid email address' : 'Adresse e-mail invalide');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (ccEmails.includes(email)) return;
    setCcEmails(prev => [...prev, email]);
    setCcInput('');
  }, [ccEmails, isEn]);

  const handleSend = useCallback(async () => {
    if (!selectedAccountId) {
      setValidationError(isEn ? 'Please select an email account' : 'Veuillez sélectionner un compte e-mail');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (!subject.trim()) {
      setValidationError(isEn ? 'Subject is required' : 'L\'objet est requis');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setSending(true);
    const total = recipients.length;
    let sent = 0;
    let failed = 0;
    const errors: string[] = [];
    setProgress({ sent: 0, failed: 0, total });

    for (const recipient of recipients) {
      try {
        // Personalize body with recipient name
        const personalizedBody = body.replace(/\{name\}/g, recipient.name);
        const bodyHtml = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">${personalizedBody.replace(/\n/g, '<br/>')}</div>`;

        const dto: SendEmailDto = {
          to: [recipient.email],
          cc: ccEmails,
          bcc: [],
          subject,
          body: personalizedBody,
          bodyHtml,
          attachments: [],
        };

        const { data } = await emailAccountsApi.sendEmail(selectedAccountId, dto);
        if (data?.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${recipient.email}: ${data?.error || 'Failed'}`);
        }
      } catch (err: any) {
        failed++;
        errors.push(`${recipient.email}: ${err.message || 'Error'}`);
      }
      setProgress({ sent, failed, total });
    }

    setSending(false);
    setDeliveryResult({ success: failed === 0, sent, failed, errors });
    onOpenChange(false);
  }, [recipients, selectedAccountId, subject, body, ccEmails, isEn, onOpenChange]);

  const validRecipients = recipients.filter(r => r.email);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {isEn ? 'Send Mass Email' : 'Envoyer un e-mail en masse'}
            </DialogTitle>
            <DialogDescription>
              {isEn
                ? `Send an email to ${validRecipients.length} selected contact${validRecipients.length > 1 ? 's' : ''}`
                : `Envoyer un e-mail à ${validRecipients.length} contact${validRecipients.length > 1 ? 's' : ''} sélectionné${validRecipients.length > 1 ? 's' : ''}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {validationError && (
              <div className="flex items-center gap-2 p-2.5 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            {/* Account selector */}
            {loadingAccounts ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isEn ? 'Loading email accounts...' : 'Chargement des comptes...'}
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span>{isEn ? 'No connected email accounts. Please connect one in Settings.' : 'Aucun compte e-mail connecté. Veuillez en connecter un dans les Paramètres.'}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{isEn ? 'Send from' : 'Envoyer depuis'}</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map(a => (
                      <SelectItem key={a.id} value={a.id}>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          {a.handle}
                          <Badge variant="outline" className="text-[10px] capitalize">{a.provider}</Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Recipients summary */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isEn ? 'Recipients' : 'Destinataires'}</Label>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-muted/30 max-h-[100px] overflow-y-auto">
                {validRecipients.slice(0, 10).map(r => (
                  <Badge key={r.id} variant="secondary" className="text-xs gap-1">
                    {r.name} ({r.email})
                  </Badge>
                ))}
                {validRecipients.length > 10 && (
                  <Badge variant="outline" className="text-xs">
                    +{validRecipients.length - 10} {isEn ? 'more' : 'de plus'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Email category / template */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{isEn ? 'Email Type' : 'Type d\'e-mail'}</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as EmailCategory)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="custom">{isEn ? '✏️ Custom Email' : '✏️ E-mail personnalisé'}</SelectItem>
                  <SelectItem value="survey">{isEn ? '📋 Satisfaction Survey' : '📋 Enquête de satisfaction'}</SelectItem>
                  <SelectItem value="announcement">{isEn ? '📢 Announcement' : '📢 Annonce'}</SelectItem>
                  <SelectItem value="newsletter">{isEn ? '📰 Newsletter' : '📰 Newsletter'}</SelectItem>
                  <SelectItem value="follow_up">{isEn ? '🤝 Follow-up' : '🤝 Suivi'}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Cc */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isEn ? 'Subject' : 'Objet'}</Label>
                {!showCc && (
                  <button className="text-[11px] text-primary hover:underline" onClick={() => setShowCc(true)}>+ Cc</button>
                )}
              </div>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-9" placeholder={isEn ? 'Email subject...' : 'Objet de l\'e-mail...'} />
            </div>

            {showCc && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cc</Label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background min-h-[38px]">
                  {ccEmails.map(email => (
                    <Badge key={email} variant="secondary" className="text-xs gap-1 pr-1">
                      {email}
                      <button onClick={() => setCcEmails(prev => prev.filter(e => e !== email))} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  <Input
                    className="flex-1 min-w-[150px] border-0 h-6 p-0 text-sm shadow-none focus-visible:ring-0"
                    placeholder={isEn ? 'Add CC email...' : 'Ajouter un e-mail CC...'}
                    value={ccInput}
                    onChange={e => setCcInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addCcEmail(ccInput); } }}
                    onBlur={() => ccInput && addCcEmail(ccInput)}
                  />
                </div>
              </div>
            )}

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{isEn ? 'Message' : 'Message'}</Label>
                <span className="text-[10px] text-muted-foreground">{isEn ? 'Use {name} for personalization' : 'Utilisez {name} pour personnaliser'}</span>
              </div>
              <Textarea value={body} onChange={e => setBody(e.target.value)} rows={8} className="text-sm resize-none" />
            </div>

            {/* Sending progress */}
            {sending && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{isEn ? 'Sending...' : 'Envoi en cours...'}</span>
                  <span className="font-medium">{progress.sent + progress.failed}/{progress.total}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300 rounded-full"
                    style={{ width: `${((progress.sent + progress.failed) / Math.max(progress.total, 1)) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              {isEn ? 'Cancel' : 'Annuler'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || validRecipients.length === 0 || !selectedAccountId || accounts.length === 0 || !subject.trim()}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEn ? 'Sending...' : 'Envoi...'}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {isEn ? `Send to ${validRecipients.length} contact${validRecipients.length > 1 ? 's' : ''}` : `Envoyer à ${validRecipients.length} contact${validRecipients.length > 1 ? 's' : ''}`}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Result Dialog */}
      <AlertDialog open={deliveryResult !== null} onOpenChange={() => setDeliveryResult(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-3 pt-2">
              {deliveryResult?.failed === 0 ? (
                <div className="p-3 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              )}
              <AlertDialogTitle className="text-center">
                {deliveryResult?.failed === 0
                  ? (isEn ? 'All Emails Sent!' : 'Tous les e-mails ont été envoyés !')
                  : (isEn ? 'Some Emails Failed' : 'Certains e-mails ont échoué')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center space-y-2">
                <span>
                  {isEn
                    ? `Successfully sent: ${deliveryResult?.sent || 0} | Failed: ${deliveryResult?.failed || 0}`
                    : `Envoyés avec succès : ${deliveryResult?.sent || 0} | Échoués : ${deliveryResult?.failed || 0}`}
                </span>
                {deliveryResult?.errors && deliveryResult.errors.length > 0 && (
                  <div className="mt-2 text-left text-xs max-h-[120px] overflow-y-auto space-y-1">
                    {deliveryResult.errors.map((e, i) => (
                      <div key={i} className="text-destructive">{e}</div>
                    ))}
                  </div>
                )}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="justify-center">
            <AlertDialogAction>{isEn ? 'OK' : 'OK'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
