import { useState, useEffect, useCallback, useRef, useMemo, ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogDescription, AlertDialogFooter, AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import {
  Send, Mail, X, Loader2, AlertCircle, CheckCircle2, XCircle,
  FileText, Paperclip, Signature, PenLine, CheckCircle, Settings2, Braces, Save, ChevronDown,
} from 'lucide-react';
import { PDFAnnotationViewer, AnnotationsMap } from '@/components/shared/PDFAnnotationViewer';
import { pdf } from '@react-pdf/renderer';
import { PDFDocument as PDFLibDocument } from 'pdf-lib';
import { emailAccountsApi, type SendEmailDto, type ConnectedEmailAccountDto } from '@/services/api/emailAccountsApi';
import { EmailTemplateSelector } from './EmailTemplateSelector';
import { RichTextEditor } from './RichTextEditor';
import {
  EMAIL_TEMPLATES,
  type DocumentType,
  type EmailTemplateVars,
  getSavedTemplateId,
  generateSubject,
  generateDefaultBody,
  getSavedSignature,
  saveSignature,
  getSignatureEnabled,
  setSignatureEnabled,
} from './emailTemplateDefinitions';
import { Switch } from '@/components/ui/switch';

// ── Smart Placeholders ──────────────────────────────────────────────────
interface PlaceholderDef {
  token: string;
  labelEn: string;
  labelFr: string;
  category: string;
}

const PLACEHOLDERS: PlaceholderDef[] = [
  { token: '{contact.name}',      labelEn: 'Contact Name',     labelFr: 'Nom du contact',       category: 'contact' },
  { token: '{contact.email}',     labelEn: 'Contact Email',    labelFr: 'E-mail du contact',    category: 'contact' },
  { token: '{document.number}',   labelEn: 'Document Number',  labelFr: 'N° du document',       category: 'document' },
  { token: '{document.title}',    labelEn: 'Document Title',   labelFr: 'Titre du document',    category: 'document' },
  { token: '{document.type}',     labelEn: 'Document Type',    labelFr: 'Type de document',     category: 'document' },
  { token: '{document.amount}',   labelEn: 'Total Amount',     labelFr: 'Montant total',        category: 'document' },
  { token: '{company.name}',      labelEn: 'Company Name',     labelFr: "Nom de l'entreprise", category: 'company' },
  { token: '{date.today}',        labelEn: "Today's Date",     labelFr: 'Date du jour',         category: 'other' },
];

const SAVED_BODY_KEY = (type: DocumentType) => `email-body-template-${type}`;

function getSavedBodyTemplate(type: DocumentType): string | null {
  try { return localStorage.getItem(SAVED_BODY_KEY(type)); } catch { return null; }
}

function saveBodyTemplate(type: DocumentType, body: string): void {
  try { localStorage.setItem(SAVED_BODY_KEY(type), body); } catch { /* ignore */ }
}

/** Replace placeholder tokens with actual values */
function resolvePlaceholders(html: string, doc: EmailComposerDocumentInfo, lang: string): string {
  const en = lang.startsWith('en');
  const typeLabels: Record<DocumentType, [string, string]> = {
    offer: ['Quotation', 'Devis'],
    sale: ['Sales Order', 'Bon de commande'],
    serviceOrder: ['Service Order', 'Bon de service'],
    dispatch: ['Dispatch', 'Expédition'],
  };
  const dateStr = new Date().toLocaleDateString(en ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  return html
    .replace(/\{contact\.name\}/g, doc.customerName || '')
    .replace(/\{contact\.email\}/g, doc.customerEmail || '')
    .replace(/\{document\.number\}/g, doc.documentNumber || '')
    .replace(/\{document\.title\}/g, doc.documentTitle || '')
    .replace(/\{document\.type\}/g, en ? typeLabels[doc.type][0] : typeLabels[doc.type][1])
    .replace(/\{document\.amount\}/g, doc.totalAmount || '')
    .replace(/\{company\.name\}/g, doc.companyName || '')
    .replace(/\{date\.today\}/g, dateStr);
}

export interface EmailComposerDocumentInfo {
  type: DocumentType;
  documentNumber: string;
  documentTitle?: string;
  customerName: string;
  customerEmail?: string;
  totalAmount?: string;
  companyName?: string;
  companyLogoUrl?: string;
  summaryLabel: string;
  statusLabel?: string;
  fileName: string;
}

interface EmailComposerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: EmailComposerDocumentInfo;
  generatePdf: () => Promise<Blob>;
  /** The react-pdf document element — required for PDF signing */
  pdfDocElement?: ReactElement;
  onSendSuccess?: () => void;
  title?: string;
  description?: string;
  successMessage?: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function plainToHtml(text: string): string {
  return text
    .split('\n')
    .map(l => l.trim() === '' ? '<br/>' : `<p style="margin:0 0 8px 0;">${l}</p>`)
    .join('');
}

function htmlToPlain(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function EmailComposer({
  open, onOpenChange, document: doc, generatePdf, pdfDocElement, onSendSuccess,
  title, description, successMessage,
}: EmailComposerProps) {
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const en = lang.startsWith('en');

  // Accounts — includes both OAuth and custom SMTP accounts
  const [accounts, setAccounts] = useState<(ConnectedEmailAccountDto & { _isCustom?: boolean; _customConfig?: any })[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(true);

  // Fields
  const [toEmails, setToEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [ccEmails, setCcEmails] = useState<string[]>([]);
  const [ccInput, setCcInput] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [subject, setSubject] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Template
  const [selectedTemplateId, setSelectedTemplateId] = useState(getSavedTemplateId(doc.type));

  // Signature
  const [signatureEnabled, setSignatureEnabledState] = useState(getSignatureEnabled());
  const [signature, setSignatureState] = useState(getSavedSignature());
  const [showSignatureEditor, setShowSignatureEditor] = useState(false);

  const handleSignatureToggle = useCallback((checked: boolean) => {
    setSignatureEnabledState(checked);
    setSignatureEnabled(checked);
  }, []);

  const handleSignatureChange = useCallback((val: string) => {
    setSignatureState(val);
    saveSignature(val);
  }, []);

  // Send
  const [isSending, setIsSending] = useState(false);
  const [deliveryResult, setDeliveryResult] = useState<{ success: boolean; recipients: string[]; error?: string } | null>(null);

  // PDF Signing
  const [isSigningOpen, setIsSigningOpen] = useState(false);
  const [isSigningMode, setIsSigningMode] = useState(false);
  const [pdfAnnotations, setPdfAnnotations] = useState<AnnotationsMap>(new Map());
  const [hasPdfSignature, setHasPdfSignature] = useState(false);

  // Reset signing state when modal closes
  useEffect(() => {
    if (!open) {
      setPdfAnnotations(new Map());
      setHasPdfSignature(false);
      setIsSigningMode(false);
      setIsSigningOpen(false);
    }
  }, [open]);

  // Generate signed PDF blob with embedded annotations
  const generateSignedPdfBlob = useCallback(async (): Promise<Blob> => {
    if (!pdfDocElement || !hasPdfSignature) return generatePdf();

    // Generate fresh PDF blob from document element
    const baseBlob = await pdf(pdfDocElement).toBlob();
    const originalBytes = await baseBlob.arrayBuffer();
    const pdfLibDoc = await PDFLibDocument.load(originalBytes);
    const pages = pdfLibDoc.getPages();

    // We need page dimensions — render pages to get them
    const pdfjsLib = await import('pdfjs-dist');
    const pdfJsDoc = await pdfjsLib.getDocument({ data: new Uint8Array(originalBytes) }).promise;

    for (const [pageIndex, annotation] of pdfAnnotations.entries()) {
      if (annotation.strokes.length === 0) continue;
      if (pageIndex >= pages.length) continue;

      const page = pages[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();

      // Get rendered page dimensions
      const pdfJsPage = await pdfJsDoc.getPage(pageIndex + 1);
      const viewport = pdfJsPage.getViewport({ scale: 2 });

      const exportCanvas = window.document.createElement('canvas');
      exportCanvas.width = viewport.width;
      exportCanvas.height = viewport.height;
      const ctx = exportCanvas.getContext('2d')!;

      // Draw strokes
      for (const stroke of annotation.strokes) {
        if (stroke.points.length < 2) continue;
        ctx.beginPath();
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.width;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
          ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
      }

      const pngDataUrl = exportCanvas.toDataURL('image/png');
      const pngBytes = new Uint8Array(Array.from(atob(pngDataUrl.split(',')[1]), c => c.charCodeAt(0)));
      const pngImage = await pdfLibDoc.embedPng(pngBytes);

      page.drawImage(pngImage, {
        x: 0, y: 0,
        width: pageWidth,
        height: pageHeight,
      });
    }

    const annotatedBytes = await pdfLibDoc.save();
    return new Blob([annotatedBytes.buffer as ArrayBuffer], { type: 'application/pdf' });
  }, [pdfDocElement, hasPdfSignature, pdfAnnotations, generatePdf]);

  // Load accounts (OAuth + custom SMTP)
  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoadingAccounts(true);
      try {
        const allAccounts: (ConnectedEmailAccountDto & { _isCustom?: boolean; _customConfig?: any })[] = [];
        
        // Load OAuth accounts
        const { data } = await emailAccountsApi.getAll();
        if (data && data.length > 0) {
          allAccounts.push(...data);
        }
        
        // Load custom SMTP accounts
        try {
          const { data: customData } = await emailAccountsApi.getCustomAll();
          if (customData && customData.length > 0) {
            for (const custom of customData) {
              // Map custom account to a ConnectedEmailAccountDto-like shape
              allAccounts.push({
                id: custom.connectedAccountId || `custom-${custom.id}`,
                userId: custom.userId || 0,
                handle: custom.email,
                provider: 'google' as any, // Will be overridden by _isCustom flag
                syncStatus: 'active',
                emailVisibility: 'share_everything',
                calendarVisibility: 'share_everything',
                contactAutoCreationPolicy: 'sent_and_received',
                isEmailSyncEnabled: false,
                isCalendarSyncEnabled: false,
                excludeGroupEmails: false,
                excludeNonProfessionalEmails: false,
                isCalendarContactAutoCreationEnabled: false,
                createdAt: custom.createdAt,
                blocklistItems: [],
                _isCustom: true,
                _customConfig: {
                  email: custom.email,
                  displayName: custom.displayName,
                  smtpServer: custom.smtpServer,
                  smtpPort: custom.smtpPort,
                  smtpSecurity: custom.smtpSecurity,
                },
              });
            }
          }
        } catch { /* custom accounts may not be available */ }
        
        if (allAccounts.length > 0) {
          setAccounts(allAccounts);
          setSelectedAccountId(allAccounts[0].id);
        } else { setAccounts([]); }
      } catch { /* ignore */ }
      finally { setLoadingAccounts(false); }
    };
    load();
  }, [open]);

  // Init once
  const initializedRef = useRef(false);
  useEffect(() => { if (!open) initializedRef.current = false; }, [open]);

  useEffect(() => {
    if (!open || initializedRef.current) return;
    initializedRef.current = true;
    setToEmails(doc.customerEmail ? [doc.customerEmail.toLowerCase()] : []);
    setEmailInput('');
    setCcEmails([]);
    setCcInput('');
    setShowCc(false);
    setValidationError(null);
    setSelectedTemplateId(getSavedTemplateId(doc.type));
    setSubject(generateSubject({ type: doc.type, lang, documentNumber: doc.documentNumber, documentTitle: doc.documentTitle }));
    // Use saved body template if it exists, otherwise generate default
    const savedBody = getSavedBodyTemplate(doc.type);
    if (savedBody) {
      // Resolve placeholders in saved template
      const resolved = resolvePlaceholders(savedBody, doc, lang);
      setBodyHtml(resolved);
    } else {
      const defaultPlain = generateDefaultBody({ type: doc.type, lang, documentNumber: doc.documentNumber, documentTitle: doc.documentTitle, customerName: doc.customerName, totalAmount: doc.totalAmount });
      setBodyHtml(plainToHtml(defaultPlain));
    }
  }, [open, doc, lang]);

  // Live HTML for sending — resolve placeholders before rendering template
  const liveHtml = useMemo(() => {
    const tpl = EMAIL_TEMPLATES.find(t => t.id === selectedTemplateId) || EMAIL_TEMPLATES[0];
    const resolvedBody = resolvePlaceholders(bodyHtml, doc, lang);
    const vars: EmailTemplateVars = {
      type: doc.type,
      lang,
      documentNumber: doc.documentNumber,
      documentTitle: doc.documentTitle,
      customerName: doc.customerName,
      companyName: doc.companyName,
      companyLogoUrl: doc.companyLogoUrl,
      bodyText: resolvedBody,
      signature: signatureEnabled ? signature : undefined,
    };
    return tpl.render(vars);
  }, [selectedTemplateId, bodyHtml, doc, lang, signatureEnabled, signature]);

  // Email helpers
  const addEmail = useCallback((list: string[], setList: (v: string[]) => void, input: string, setInput: (v: string) => void) => {
    const email = input.trim().toLowerCase();
    if (!email) return;
    if (!EMAIL_REGEX.test(email)) {
      setValidationError(en ? 'Invalid email address' : 'Adresse e-mail invalide');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (list.includes(email)) {
      setValidationError(en ? 'Email already added' : 'E-mail déjà ajouté');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    setValidationError(null);
    setList([...list, email]);
    setInput('');
  }, [en]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent, list: string[], setList: (v: string[]) => void,
    input: string, setInput: (v: string) => void,
  ) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(list, setList, input, setInput);
    }
  }, [addEmail]);

  // Send
  const handleSend = useCallback(async () => {
    if (toEmails.length === 0) {
      setValidationError(en ? 'Add at least one recipient' : 'Ajoutez au moins un destinataire');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }
    if (!selectedAccountId) {
      setValidationError(en ? 'Select an email account' : 'Sélectionnez un compte e-mail');
      setTimeout(() => setValidationError(null), 3000);
      return;
    }

    setIsSending(true);
    let sendSuccess = false;
    try {
      const blob = await generateSignedPdfBlob();
      const arrayBuffer = await blob.arrayBuffer();
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = '';
      for (let i = 0; i < uint8.length; i++) binary += String.fromCharCode(uint8[i]);
      const base64 = btoa(binary);

      const resolvedBodyHtml = resolvePlaceholders(bodyHtml, doc, lang);
      const plainBody = htmlToPlain(resolvedBodyHtml);
      const dto: SendEmailDto = {
        to: toEmails,
        cc: ccEmails,
        bcc: [],
        subject,
        body: signatureEnabled && signature ? `${plainBody}\n\n--\n${signature}` : plainBody,
        bodyHtml: liveHtml,
        attachments: [{
          fileName: doc.fileName,
          contentType: 'application/pdf',
          contentBase64: base64,
        }],
      };

      // Check if selected account is a custom SMTP account
      const selectedAccount = accounts.find(a => a.id === selectedAccountId);
      if (selectedAccount?._isCustom) {
        // Use direct custom send endpoint (bypasses userId mismatch bug)
        const customPayload = {
          config: selectedAccount._customConfig,
          to: toEmails, cc: ccEmails, bcc: [],
          subject,
          body: signatureEnabled && signature ? `${plainBody}\n\n--\n${signature}` : plainBody,
          bodyHtml: liveHtml,
        };
        const { data: customResult } = await emailAccountsApi.customSend(customPayload);
        if (customResult?.success) {
          sendSuccess = true;
          setDeliveryResult({ success: true, recipients: [...toEmails] });
        } else {
          setDeliveryResult({ success: false, recipients: [...toEmails], error: customResult?.error || (en ? 'Failed to send email' : 'Échec de l\'envoi') });
        }
      } else {
        const { data } = await emailAccountsApi.sendEmail(selectedAccountId, dto);
        if (data?.success) {
          sendSuccess = true;
          setDeliveryResult({ success: true, recipients: [...toEmails] });
        } else {
          setDeliveryResult({ success: false, recipients: [...toEmails], error: data?.error || (en ? 'Failed to send email' : 'Échec de l\'envoi') });
        }
      }
    } catch (err) {
      console.error('Email send failed:', err);
      setDeliveryResult({ success: false, recipients: [...toEmails], error: en ? 'Failed to send email' : 'Échec de l\'envoi' });
    } finally {
      setIsSending(false);
      onOpenChange(false);
      if (sendSuccess) {
        try { onSendSuccess?.(); } catch { /* ignore callback errors */ }
      }
    }
  }, [toEmails, ccEmails, selectedAccountId, subject, bodyHtml, liveHtml, generateSignedPdfBlob, doc.fileName, en, onOpenChange, onSendSuccess, signatureEnabled, signature]);

  const handleClose = () => { if (!isSending) onOpenChange(false); };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-2xl bg-background border border-border max-h-[90vh] flex flex-col">
          <DialogHeader className="space-y-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold">
                  {title || (en ? 'Send Email' : 'Envoyer l\'e-mail')}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  {description || (en ? 'Send document to customer via email' : 'Envoyer le document au client par e-mail')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Document Summary */}
          <div className="bg-muted/50 rounded-lg p-3.5 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-sm">{doc.summaryLabel}</span>
              </div>
              <div className="flex items-center gap-2">
                {doc.statusLabel && <Badge variant="outline" className="text-[10px] capitalize">{doc.statusLabel}</Badge>}
                <Badge variant="outline" className="text-xs">#{doc.documentNumber}</Badge>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Validation error */}
            {validationError && (
              <div className="flex items-center gap-2 p-2.5 rounded-md border border-destructive/30 bg-destructive/5 text-sm text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {validationError}
              </div>
            )}

            {/* Template selector - collapsible */}
            <Collapsible>
              <CollapsibleTrigger asChild>
                <button
                  type="button"
                  className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors w-full group"
                >
                  <Settings2 className="h-3.5 w-3.5" />
                  <span className="font-medium">{en ? 'Template Settings' : 'Configuration du modèle'}</span>
                  <ChevronDown className="h-3 w-3 ml-auto transition-transform group-data-[state=open]:rotate-180" />
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-2">
                <EmailTemplateSelector
                  documentType={doc.type}
                  selectedId={selectedTemplateId}
                  onSelect={setSelectedTemplateId}
                />
              </CollapsibleContent>
            </Collapsible>

            <Separator />

            {/* Account */}
            {loadingAccounts ? (
              <div className="space-y-2 animate-pulse">
                <div className="h-10 w-full bg-muted rounded-md" />
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <span>{en ? 'No connected email accounts. Connect one in Email & Calendar settings.' : 'Aucun compte e-mail connecté. Connectez-en un dans les paramètres.'}</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">{en ? 'Send from' : 'Envoyer depuis'}</Label>
                <Select value={selectedAccountId} onValueChange={setSelectedAccountId}>
                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
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

            {/* To */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  {en ? 'Recipients' : 'Destinataires'}
                </Label>
                {!showCc && (
                  <button className="text-[11px] text-primary hover:underline" onClick={() => setShowCc(true)}>+ Cc</button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background min-h-[38px]">
                {toEmails.map(email => (
                  <Badge key={email} variant="secondary" className="text-xs gap-1 pr-1">
                    {email}
                    <button onClick={() => setToEmails(p => p.filter(e => e !== email))} className="hover:text-destructive" disabled={isSending}><X className="h-3 w-3" /></button>
                  </Badge>
                ))}
                <Input
                  className="flex-1 min-w-[150px] border-0 h-6 p-0 text-sm shadow-none focus-visible:ring-0"
                  placeholder={en ? 'Add email address...' : 'Ajouter une adresse e-mail...'}
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => handleKeyDown(e, toEmails, setToEmails, emailInput, setEmailInput)}
                  onBlur={() => emailInput && addEmail(toEmails, setToEmails, emailInput, setEmailInput)}
                  disabled={isSending}
                />
              </div>
            </div>

            {/* Cc */}
            {showCc && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Cc</Label>
                <div className="flex flex-wrap gap-1.5 p-2 rounded-md border border-input bg-background min-h-[38px]">
                  {ccEmails.map(email => (
                    <Badge key={email} variant="secondary" className="text-xs gap-1 pr-1">
                      {email}
                      <button onClick={() => setCcEmails(p => p.filter(e => e !== email))} className="hover:text-destructive" disabled={isSending}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                  <Input
                    className="flex-1 min-w-[150px] border-0 h-6 p-0 text-sm shadow-none focus-visible:ring-0"
                    placeholder={en ? 'Add email address...' : 'Ajouter une adresse e-mail...'}
                    value={ccInput}
                    onChange={e => setCcInput(e.target.value)}
                    onKeyDown={e => handleKeyDown(e, ccEmails, setCcEmails, ccInput, setCcInput)}
                    onBlur={() => ccInput && addEmail(ccEmails, setCcEmails, ccInput, setCcInput)}
                    disabled={isSending}
                  />
                </div>
              </div>
            )}

            {/* Subject */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">{en ? 'Subject' : 'Objet'}</Label>
              <Input value={subject} onChange={e => setSubject(e.target.value)} className="h-9" disabled={isSending} />
            </div>

            {/* Body - Rich Text Editor with Smart Placeholders */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium">{en ? 'Message' : 'Message'}</Label>
                <div className="flex items-center gap-1">
                  {/* Insert Placeholder */}
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="ghost" size="sm" className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground">
                        <Braces className="h-3 w-3" />
                        {en ? 'Insert Variable' : 'Insérer variable'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56 p-1.5" align="end">
                      <div className="space-y-1">
                        {['contact', 'document', 'company', 'other'].map(cat => {
                          const items = PLACEHOLDERS.filter(p => p.category === cat);
                          if (items.length === 0) return null;
                          return (
                            <div key={cat}>
                              <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 py-1">
                                {cat}
                              </div>
                              {items.map(p => (
                                <button
                                  key={p.token}
                                  type="button"
                                  className="w-full flex items-center justify-between gap-2 px-2 py-1.5 text-xs rounded-md hover:bg-muted transition-colors"
                                  onClick={() => {
                                    setBodyHtml(prev => prev + `<span style="background:#f0f0f0;padding:1px 4px;border-radius:3px;font-family:monospace;font-size:12px;">${p.token}</span>&nbsp;`);
                                  }}
                                >
                                  <span>{en ? p.labelEn : p.labelFr}</span>
                                  <code className="text-[10px] text-muted-foreground font-mono">{p.token}</code>
                                </button>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </PopoverContent>
                  </Popover>

                  {/* Save as default template */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      saveBodyTemplate(doc.type, bodyHtml);
                      // Show brief feedback
                      const btn = document.activeElement as HTMLButtonElement;
                      if (btn) {
                        const original = btn.textContent;
                        btn.textContent = en ? '✓ Saved!' : '✓ Sauvegardé !';
                        setTimeout(() => { btn.textContent = original; }, 1500);
                      }
                    }}
                  >
                    <Save className="h-3 w-3" />
                    {en ? 'Save as Default' : 'Sauvegarder'}
                  </Button>
                </div>
              </div>
              <RichTextEditor
                value={bodyHtml}
                onChange={setBodyHtml}
                disabled={isSending}
                placeholder={en ? 'Compose your message... Use {contact.name} for smart placeholders' : 'Rédigez votre message... Utilisez {contact.name} pour les variables'}
                minHeight="140px"
              />
              <p className="text-[10px] text-muted-foreground">
                {en
                  ? 'Tip: Use variables like {contact.name} to personalize. Click "Save as Default" to reuse this message.'
                  : 'Astuce : Utilisez des variables comme {contact.name} pour personnaliser. Cliquez "Sauvegarder" pour réutiliser ce message.'}
              </p>
            </div>


            {/* Signature */}
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/20 p-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium flex items-center gap-2">
                  <Signature className="h-4 w-4" />
                  {en ? 'Email Signature' : 'Signature e-mail'}
                </Label>
                <div className="flex items-center gap-2">
                  {signatureEnabled && (
                    <button
                      type="button"
                      className="text-[11px] text-primary hover:underline"
                      onClick={() => setShowSignatureEditor(!showSignatureEditor)}
                    >
                      {showSignatureEditor ? (en ? 'Hide' : 'Masquer') : (en ? 'Edit' : 'Modifier')}
                    </button>
                  )}
                  <Switch
                    checked={signatureEnabled}
                    onCheckedChange={handleSignatureToggle}
                    className="scale-75"
                  />
                </div>
              </div>
              {signatureEnabled && !showSignatureEditor && signature && (
                <div className="text-xs text-muted-foreground whitespace-pre-wrap border-t border-border/40 pt-2 mt-1 line-clamp-3">
                  {signature}
                </div>
              )}
              {signatureEnabled && showSignatureEditor && (
                <Textarea
                  value={signature}
                  onChange={e => handleSignatureChange(e.target.value)}
                  rows={4}
                  className="text-xs resize-none mt-1"
                  placeholder={en
                    ? 'John Doe\nSales Manager\nCompany Inc.\n+1 234 567 890'
                    : 'Jean Dupont\nDirecteur Commercial\nEntreprise SA\n+33 1 23 45 67 89'}
                  disabled={isSending}
                />
              )}
              {signatureEnabled && !signature && !showSignatureEditor && (
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowSignatureEditor(true)}
                >
                  {en ? 'Click to add your signature...' : 'Cliquez pour ajouter votre signature...'}
                </button>
              )}
            </div>

            {/* Attachment */}
            <div className="flex items-center gap-2 p-2.5 rounded-md border border-border/60 bg-muted/30">
              <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground truncate">{doc.fileName}</span>
              {hasPdfSignature && (
                <Badge variant="default" className="text-[10px] gap-1 shrink-0">
                  <CheckCircle className="h-3 w-3" />
                  {en ? 'Signed' : 'Signé'}
                </Badge>
              )}
              <Badge variant="outline" className="text-[10px] ml-auto shrink-0">PDF</Badge>
              <div className="flex items-center gap-1.5 shrink-0">
                {hasPdfSignature && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/5"
                    onClick={() => { setPdfAnnotations(new Map()); setHasPdfSignature(false); }}
                    disabled={isSending}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
                {pdfDocElement && (
                  <Button
                    type="button"
                    variant={hasPdfSignature ? 'outline' : 'ghost'}
                    size="sm"
                    className="h-7 text-xs shrink-0 gap-1"
                    onClick={() => { setIsSigningMode(true); setIsSigningOpen(true); }}
                    disabled={isSending}
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    {hasPdfSignature ? (en ? 'Re-sign' : 'Re-signer') : (en ? 'Sign PDF' : 'Signer le PDF')}
                  </Button>
                )}
              </div>
            </div>
          </div>

          <Separator className="shrink-0" />

          <DialogFooter className="gap-2 sm:gap-0 shrink-0">
            <Button variant="outline" onClick={handleClose} disabled={isSending}>
              {en ? 'Cancel' : 'Annuler'}
            </Button>
            <Button
              onClick={handleSend}
              disabled={isSending || toEmails.length === 0 || !selectedAccountId || accounts.length === 0}
              className="gap-2"
            >
              {isSending ? (
                <><Loader2 className="h-4 w-4 animate-spin" />{en ? 'Sending...' : 'Envoi...'}</>
              ) : (
                <><Send className="h-4 w-4" />{en ? 'Send' : 'Envoyer'} ({toEmails.length})</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delivery result */}
      <AlertDialog open={deliveryResult !== null} onOpenChange={() => setDeliveryResult(null)}>
        <AlertDialogContent className="max-w-sm">
          <AlertDialogHeader>
            <div className="flex flex-col items-center gap-3 pt-2">
              {deliveryResult?.success ? (
                <div className="p-3 rounded-full bg-primary/10"><CheckCircle2 className="h-8 w-8 text-primary" /></div>
              ) : (
                <div className="p-3 rounded-full bg-destructive/10"><XCircle className="h-8 w-8 text-destructive" /></div>
              )}
              <AlertDialogTitle className="text-center">
                {deliveryResult?.success
                  ? (successMessage || (en ? 'Email Sent Successfully!' : 'E-mail envoyé avec succès !'))
                  : (en ? 'Failed to Send' : 'Échec de l\'envoi')}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-center space-y-2">
                {deliveryResult?.success ? (
                  <span>{en ? `Sent to ${deliveryResult.recipients.length} recipient(s)` : `Envoyé à ${deliveryResult.recipients.length} destinataire(s)`}</span>
                ) : (
                  <span>{deliveryResult?.error}</span>
                )}
                {deliveryResult?.recipients && deliveryResult.recipients.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                    {deliveryResult.recipients.map(email => (
                      <Badge key={email} variant="secondary" className="text-xs">{email}</Badge>
                    ))}
                  </div>
                )}
              </AlertDialogDescription>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center">
            <AlertDialogAction>OK</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* PDF Signing Dialog */}
      {pdfDocElement && (
        <Dialog open={isSigningOpen} onOpenChange={(v) => { if (!v) setIsSigningOpen(false); }}>
          <DialogContent className="max-w-5xl h-[85vh] flex flex-col">
            <DialogHeader className="shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <PenLine className="h-5 w-5" />
                {en ? 'Sign PDF Before Sending' : 'Signer le PDF avant l\'envoi'}
              </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                {en ? 'Draw your signature anywhere on the document. Click "Apply Signature" when done.' : 'Dessinez votre signature sur le document. Cliquez sur « Appliquer » une fois terminé.'}
              </DialogDescription>
            </DialogHeader>
            <div className="flex-1 min-h-0">
              <PDFAnnotationViewer
                document={pdfDocElement}
                fileName={doc.fileName}
                isSigningMode={isSigningMode}
                onSigningModeChange={setIsSigningMode}
                onAnnotationsChange={setHasPdfSignature}
                annotations={pdfAnnotations}
                onAnnotationsUpdate={setPdfAnnotations}
                showToolbar={true}
              />
            </div>
            <DialogFooter className="shrink-0 gap-2">
              <Button variant="outline" onClick={() => { setPdfAnnotations(new Map()); setHasPdfSignature(false); setIsSigningOpen(false); }}>
                {en ? 'Cancel' : 'Annuler'}
              </Button>
              <Button
                onClick={() => setIsSigningOpen(false)}
                disabled={!hasPdfSignature}
                className="gap-2"
              >
                <CheckCircle className="h-4 w-4" />
                {en ? 'Apply Signature' : 'Appliquer la signature'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
