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
import { Mail, Send, X, Plus, Loader2, Paperclip, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { pdf } from '@react-pdf/renderer';
import { emailAccountsApi, type SendEmailDto, type ConnectedEmailAccountDto } from '@/services/api/emailAccountsApi';

interface SendReportEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The React element for generating the PDF */
  pdfDocument: React.ReactElement;
  /** File name for the attachment */
  fileName: string;
  /** Report type for email subject/body generation */
  reportType: 'offer' | 'sale' | 'payment';
  /** Report number/ID for the subject */
  reportNumber: string;
  /** Report title */
  reportTitle: string;
  /** Customer name if available */
  customerName?: string;
  /** Total amount if available */
  totalAmount?: string;
  /** Translation namespace */
  translationNs: string;
}

export function SendReportEmailDialog({
  open,
  onOpenChange,
  pdfDocument,
  fileName,
  reportType,
  reportNumber,
  reportTitle,
  customerName,
  totalAmount,
  translationNs,
}: SendReportEmailDialogProps) {
  const { t, i18n } = useTranslation(translationNs);
  const { t: tCommon } = useTranslation('common');
  const lang = i18n.language;

  const [accounts, setAccounts] = useState<ConnectedEmailAccountDto[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{ success: boolean; recipients: string[]; error?: string } | null>(null);

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

  // Generate default subject & body based on language
  useEffect(() => {
    if (!open) return;
    const isEn = lang.startsWith('en');
    
    if (reportType === 'offer') {
      setSubject(isEn 
        ? `Quotation ${reportNumber} - ${reportTitle}`
        : `Devis ${reportNumber} - ${reportTitle}`
      );
      setBody(isEn
        ? `Dear ${customerName || 'Client'},\n\nPlease find attached our quotation ${reportNumber} for "${reportTitle}".\n\n${totalAmount ? `Total amount: ${totalAmount}\n\n` : ''}We remain at your disposal for any questions or clarifications.\n\nBest regards`
        : `Cher(e) ${customerName || 'Client'},\n\nVeuillez trouver ci-joint notre devis ${reportNumber} pour "${reportTitle}".\n\n${totalAmount ? `Montant total : ${totalAmount}\n\n` : ''}Nous restons à votre disposition pour toute question ou précision.\n\nCordialement`
      );
    } else if (reportType === 'payment') {
      setSubject(isEn
        ? `Payment Receipt ${reportNumber}${reportTitle ? ` - ${reportTitle}` : ''}`
        : `Reçu de paiement ${reportNumber}${reportTitle ? ` - ${reportTitle}` : ''}`
      );
      setBody(isEn
        ? `Dear ${customerName || 'Client'},\n\nPlease find attached the payment receipt ${reportNumber}.\n\n${totalAmount ? `Amount paid: ${totalAmount}\n\n` : ''}Thank you for your payment.\n\nBest regards`
        : `Cher(e) ${customerName || 'Client'},\n\nVeuillez trouver ci-joint le reçu de paiement ${reportNumber}.\n\n${totalAmount ? `Montant payé : ${totalAmount}\n\n` : ''}Merci pour votre paiement.\n\nCordialement`
      );
    } else {
      setSubject(isEn
        ? `Sale Order ${reportNumber} - ${reportTitle}`
        : `Bon de commande ${reportNumber} - ${reportTitle}`
      );
      setBody(isEn
        ? `Dear ${customerName || 'Client'},\n\nPlease find attached our sale order ${reportNumber} for "${reportTitle}".\n\n${totalAmount ? `Total amount: ${totalAmount}\n\n` : ''}We remain at your disposal for any questions or clarifications.\n\nBest regards`
        : `Cher(e) ${customerName || 'Client'},\n\nVeuillez trouver ci-joint notre bon de commande ${reportNumber} pour "${reportTitle}".\n\n${totalAmount ? `Montant total : ${totalAmount}\n\n` : ''}Nous restons à votre disposition pour toute question ou précision.\n\nCordialement`
      );
    }
  }, [open, reportType, reportNumber, reportTitle, customerName, totalAmount, lang]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setToEmails([]);
      setEmailInput('');
      setCcEmails([]);
      setCcInput('');
      setShowCc(false);
    }
  }, [open]);

  const [validationError, setValidationError] = useState<string | null>(null);

  const addEmail = useCallback((list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const email = input.trim().toLowerCase();
    if (!email) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setValidationError(t('sendReport.invalidEmail'));
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (list.includes(email)) {
      setValidationError(t('sendReport.emailAlreadyAdded'));
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    setValidationError(null);
    setList([...list, email]);
    setInput('');
  }, [t]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent,
    list: string[],
    setList: (v: string[]) => void,
    input: string,
    setInput: (v: string) => void
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(list, setList, input, setInput);
    }
  }, [addEmail]);

  const handleSend = useCallback(async () => {
    if (toEmails.length === 0) {
      setValidationError(t('sendReport.atLeastOneEmail'));
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (!selectedAccountId) {
      setValidationError(t('sendReport.noAccountSelected'));
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setSending(true);
    try {
      // Generate PDF blob
      const blob = await pdf(pdfDocument).toBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);
      
      // Convert to base64
      let binary = '';
      for (let i = 0; i < uint8Array.length; i++) {
        binary += String.fromCharCode(uint8Array[i]);
      }
      const base64 = btoa(binary);

      // Build HTML body
      const bodyHtml = `<div style="font-family: Arial, sans-serif; font-size: 14px; color: #333; line-height: 1.6;">${body.replace(/\n/g, '<br/>')}</div>`;

      const dto: SendEmailDto = {
        to: toEmails,
        cc: ccEmails,
        bcc: [],
        subject,
        body: body,
        bodyHtml,
        attachments: [{
          fileName,
          contentType: 'application/pdf',
          contentBase64: base64,
        }],
      };

      const { data } = await emailAccountsApi.sendEmail(selectedAccountId, dto);
      
      if (data?.success) {
        setDeliveryResult({ success: true, recipients: [...toEmails] });
        onOpenChange(false);
      } else {
        setDeliveryResult({ success: false, recipients: [...toEmails], error: data?.error || t('sendReport.sendError') });
        onOpenChange(false);
      }
    } catch (err) {
      console.error('Failed to send report email:', err);
      setDeliveryResult({ success: false, recipients: [...toEmails], error: t('sendReport.sendError') });
      onOpenChange(false);
    } finally {
      setSending(false);
    }
  }, [toEmails, ccEmails, selectedAccountId, subject, body, pdfDocument, fileName, t, onOpenChange]);
  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              {t('sendReport.title')}
            </DialogTitle>
            <DialogDescription>{t('sendReport.description')}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Validation error banner */}
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
                {t('sendReport.loadingAccounts')}
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span>{t('sendReport.noAccounts')}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{t('sendReport.sendFrom')}</Label>
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

            {/* To field */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{t('sendReport.to')}</Label>
                {!showCc && (
                  <button className="text-[11px] text-primary hover:underline" onClick={() => setShowCc(true)}>
                    + Cc
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background min-h-[38px]">
                {toEmails.map(email => (
                  <Badge key={email} variant="secondary" className="text-xs gap-1 pr-1">
                    {email}
                    <button onClick={() => setToEmails(prev => prev.filter(e => e !== email))} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  className="flex-1 min-w-[150px] border-0 h-6 p-0 text-sm shadow-none focus-visible:ring-0"
                  placeholder={t('sendReport.addEmailPlaceholder')}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, toEmails, setToEmails, emailInput, setEmailInput)}
                  onBlur={() => emailInput && addEmail(toEmails, setToEmails, emailInput, setEmailInput)}
                />
              </div>
            </div>

            {/* Cc field */}
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
                    placeholder={t('sendReport.addEmailPlaceholder')}
                    value={ccInput}
                    onChange={e => setCcInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ccEmails, setCcEmails, ccInput, setCcInput)}
                    onBlur={() => ccInput && addEmail(ccEmails, setCcEmails, ccInput, setCcInput)}
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('sendReport.subject')}</Label>
              <Input
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="h-9"
              />
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{t('sendReport.message')}</Label>
              <Textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                rows={6}
                className="text-sm resize-none"
              />
            </div>

            {/* Attachment preview */}
            <div className="flex items-center gap-2 p-2.5 rounded-md border border-border/60 bg-muted/30">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{fileName}</span>
              <Badge variant="outline" className="text-[10px] ml-auto shrink-0">PDF</Badge>
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
              {t('sendReport.cancel')}
            </Button>
            <Button
              onClick={handleSend}
              disabled={sending || toEmails.length === 0 || !selectedAccountId || accounts.length === 0}
              className="gap-2"
            >
              {sending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('sendReport.sending')}
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {t('sendReport.sendButton')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery Confirmation Dialog */}
      <AlertDialog open={deliveryResult !== null} onOpenChange={() => setDeliveryResult(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-3 pt-2">
              {deliveryResult?.success ? (
                <div className="p-3 rounded-full bg-primary/10">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
              ) : (
                <div className="p-3 rounded-full bg-destructive/10">
                  <XCircle className="h-8 w-8 text-destructive" />
                </div>
              )}
              <AlertDialogTitle className="text-center">
                {deliveryResult?.success 
                  ? t('sendReport.deliverySuccess') 
                  : t('sendReport.deliveryFailed')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center space-y-2">
                {deliveryResult?.success ? (
                  <span>
                    {t('sendReport.deliverySuccessDesc', { 
                      count: deliveryResult.recipients.length 
                    })}
                  </span>
                ) : (
                  <span>{deliveryResult?.error}</span>
                )}
                {deliveryResult?.recipients && deliveryResult.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {deliveryResult.recipients.map(email => (
                      <Badge key={email} variant="secondary" className="text-xs">
                        {email}
                      </Badge>
                    ))}
                  </div>
                )}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction>{t('sendReport.deliveryOk')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
