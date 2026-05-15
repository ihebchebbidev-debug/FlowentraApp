import { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Send, X, Loader2, Plus, Minus, Paperclip, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { EmailAttachmentDto } from '@/services/api/emailAccountsApi';

export interface ComposeEmailData {
  to: string[];
  cc: string[];
  bcc: string[];
  subject: string;
  body: string;
  attachments?: EmailAttachmentDto[];
}

interface ComposeEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  senderHandle: string;
  sending: boolean;
  onSend: (data: ComposeEmailData) => Promise<void>;
  initialTo?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ComposeEmailDialog({
  open,
  onOpenChange,
  senderHandle,
  sending,
  onSend,
  initialTo,
}: ComposeEmailDialogProps) {
  const { t } = useTranslation('email-calendar');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [to, setTo] = useState('');
  const [toList, setToList] = useState<string[]>([]);
  const [cc, setCc] = useState('');
  const [ccList, setCcList] = useState<string[]>([]);
  const [bcc, setBcc] = useState('');
  const [bccList, setBccList] = useState<string[]>([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [attachments, setAttachments] = useState<{ file: File; base64: string }[]>([]);

  // Pre-fill "to" when initialTo is provided
  useEffect(() => {
    if (open && initialTo && !toList.includes(initialTo)) {
      setToList(prev => prev.includes(initialTo) ? prev : [initialTo, ...prev]);
    }
  }, [open, initialTo]);
  const addEmail = (
    value: string,
    list: string[],
    setList: (l: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    const email = value.trim();
    if (email && email.includes('@') && !list.includes(email)) {
      setList([...list, email]);
      setInput('');
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent,
    value: string,
    list: string[],
    setList: (l: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      addEmail(value, list, setList, setInput);
    }
  };

  const removeFromList = (
    email: string,
    list: string[],
    setList: (l: string[]) => void,
  ) => {
    setList(list.filter((e) => e !== email));
  };

  const handleFilesSelected = useCallback(async (files: FileList | null) => {
    if (!files) return;
    const newAttachments: { file: File; base64: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) continue; // Skip files > 10MB
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1] || '');
        };
        reader.readAsDataURL(file);
      });
      newAttachments.push({ file, base64 });
    }
    setAttachments(prev => [...prev, ...newAttachments]);
  }, []);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  const resetForm = () => {
    setTo('');
    setToList([]);
    setCc('');
    setCcList([]);
    setBcc('');
    setBccList([]);
    setSubject('');
    setBody('');
    setShowCcBcc(false);
    setAttachments([]);
  };

  const handleSend = async () => {
    const finalTo = [...toList];
    if (to.trim() && to.includes('@')) finalTo.push(to.trim());
    const finalCc = [...ccList];
    if (cc.trim() && cc.includes('@')) finalCc.push(cc.trim());
    const finalBcc = [...bccList];
    if (bcc.trim() && bcc.includes('@')) finalBcc.push(bcc.trim());

    if (finalTo.length === 0) return;

    const emailAttachments: EmailAttachmentDto[] = attachments.map(a => ({
      fileName: a.file.name,
      contentType: a.file.type || 'application/octet-stream',
      contentBase64: a.base64,
    }));

    await onSend({
      to: finalTo,
      cc: finalCc,
      bcc: finalBcc,
      subject,
      body,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });
    resetForm();
  };

  const canSend = toList.length > 0 || (to.trim() && to.includes('@'));

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[640px] p-0 gap-0">
        <DialogHeader className="px-5 pt-4 pb-3 border-b border-border/40">
          <DialogTitle className="text-base font-semibold flex items-center gap-2">
            <Send className="h-4 w-4 text-primary" />
            {t('compose.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="px-5 py-4 space-y-3">
          {/* From (read-only) */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground w-12 shrink-0">{t('compose.from')}</Label>
            <span className="text-sm text-foreground">{senderHandle}</span>
          </div>

          {/* To */}
          <div className="flex items-start gap-3">
            <Label className="text-xs text-muted-foreground w-12 shrink-0 mt-2">{t('compose.to')}</Label>
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap gap-1">
                {toList.map((email) => (
                  <Badge key={email} variant="secondary" className="text-xs gap-1 pl-2 pr-1">
                    {email}
                    <button onClick={() => removeFromList(email, toList, setToList)} className="hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <Input
                placeholder={t('compose.toPlaceholder')}
                value={to}
                onChange={(e) => setTo(e.target.value)}
                onKeyDown={(e) => handleKeyDown(e, to, toList, setToList, setTo)}
                onBlur={() => addEmail(to, toList, setToList, setTo)}
                className="h-8"
              />
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              className="mt-1"
              onClick={() => setShowCcBcc(!showCcBcc)}
              title={showCcBcc ? 'Hide Cc/Bcc' : 'Show Cc/Bcc'}
            >
              {showCcBcc ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
            </Button>
          </div>

          {/* Cc / Bcc (expandable) */}
          {showCcBcc && (
            <>
              <div className="flex items-start gap-3">
                <Label className="text-xs text-muted-foreground w-12 shrink-0 mt-2">{t('compose.cc')}</Label>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {ccList.map((email) => (
                      <Badge key={email} variant="secondary" className="text-xs gap-1 pl-2 pr-1">
                        {email}
                        <button onClick={() => removeFromList(email, ccList, setCcList)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder={t('compose.ccPlaceholder')}
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, cc, ccList, setCcList, setCc)}
                    onBlur={() => addEmail(cc, ccList, setCcList, setCc)}
                    className="h-8"
                  />
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Label className="text-xs text-muted-foreground w-12 shrink-0 mt-2">{t('compose.bcc')}</Label>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {bccList.map((email) => (
                      <Badge key={email} variant="secondary" className="text-xs gap-1 pl-2 pr-1">
                        {email}
                        <button onClick={() => removeFromList(email, bccList, setBccList)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder={t('compose.bccPlaceholder')}
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, bcc, bccList, setBccList, setBcc)}
                    onBlur={() => addEmail(bcc, bccList, setBccList, setBcc)}
                    className="h-8"
                  />
                </div>
              </div>
            </>
          )}

          {/* Subject */}
          <div className="flex items-center gap-3">
            <Label className="text-xs text-muted-foreground w-12 shrink-0">{t('compose.subject')}</Label>
            <Input
              placeholder={t('compose.subjectPlaceholder')}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="h-8"
            />
          </div>

          {/* Body */}
          <Textarea
            placeholder={t('compose.bodyPlaceholder')}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className="min-h-[200px] resize-none"
          />

          {/* Attachments list */}
          {attachments.length > 0 && (
            <div className="space-y-1.5">
              {attachments.map((att, i) => (
                <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border/60 bg-muted/20">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <span className="text-xs text-foreground truncate flex-1">{att.file.name}</span>
                  <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(att.file.size)}</span>
                  <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
          />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="sm" onClick={() => { resetForm(); onOpenChange(false); }}>
              {t('compose.discard')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="gap-1.5 text-muted-foreground"
              onClick={() => fileInputRef.current?.click()}
              disabled={sending}
            >
              <Paperclip className="h-3.5 w-3.5" />
              {t('compose.attach', 'Attach')}
              {attachments.length > 0 && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-0.5">{attachments.length}</Badge>
              )}
            </Button>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!canSend || sending}
            onClick={handleSend}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            {t('compose.send')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
