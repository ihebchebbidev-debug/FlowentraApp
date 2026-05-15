import { useState, useCallback, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Reply, Forward, Paperclip, Star, Loader2, Send, X, Plus, Minus, Trash2, MailOpen, MailCheck, FileText, Download, Image as ImageIcon, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { SyncedEmailDto, SendEmailDto, EmailAttachmentDto, SyncedEmailAttachmentDto } from '@/services/api/emailAccountsApi';
import { emailAccountsApi } from '@/services/api/emailAccountsApi';
import { toast } from '@/hooks/use-toast';

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface EmailDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: SyncedEmailDto | null;
  senderHandle: string;
  accountId: string;
  sending: boolean;
  onSendReply: (dto: SendEmailDto) => Promise<void>;
  onToggleStar?: (e: React.MouseEvent, email: SyncedEmailDto) => void;
  onToggleRead?: (e: React.MouseEvent, email: SyncedEmailDto) => void;
  onDeleteEmail?: (e: React.MouseEvent, email: SyncedEmailDto) => void;
}

export function EmailDetailDialog({
  open,
  onOpenChange,
  email,
  senderHandle,
  accountId,
  sending,
  onSendReply,
  onToggleStar,
  onToggleRead,
  onDeleteEmail,
}: EmailDetailDialogProps) {
  const { t } = useTranslation('email-calendar');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [replyToList, setReplyToList] = useState<string[]>([]);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [replyCc, setReplyCc] = useState('');
  const [replyCcList, setReplyCcList] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<{ file: File; base64: string }[]>([]);
  const [downloadingAttachment, setDownloadingAttachment] = useState<string | null>(null);
  const [imagePreviewUrls, setImagePreviewUrls] = useState<Record<string, string>>({});
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [lightboxAttId, setLightboxAttId] = useState<string | null>(null);

  const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp', 'image/svg+xml'];

  const isImageAttachment = (contentType: string) =>
    IMAGE_TYPES.some(t => contentType.toLowerCase().startsWith(t));

  // Auto-load image previews when email opens
  useEffect(() => {
    if (!email?.attachments || !accountId) return;
    const imageAtts = email.attachments.filter(a => isImageAttachment(a.contentType));
    if (imageAtts.length === 0) return;

    // Clean up old URLs
    return () => {
      Object.values(imagePreviewUrls).forEach(url => URL.revokeObjectURL(url));
    };
  }, [email?.id]);

  useEffect(() => {
    if (!email?.attachments || !accountId) return;
    const imageAtts = email.attachments.filter(a => isImageAttachment(a.contentType) && !imagePreviewUrls[a.id]);
    if (imageAtts.length === 0) return;

    const loadImages = async () => {
      for (const att of imageAtts) {
        setLoadingImages(prev => new Set(prev).add(att.id));
        try {
          const { data } = await emailAccountsApi.downloadAttachment(accountId, email.id, att.id);
          if (data?.contentBase64) {
            const byteChars = atob(data.contentBase64);
            const byteNumbers = new Array(byteChars.length);
            for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: data.contentType });
            const url = URL.createObjectURL(blob);
            setImagePreviewUrls(prev => ({ ...prev, [att.id]: url }));
          }
        } catch {
          // silently fail for preview
        } finally {
          setLoadingImages(prev => { const s = new Set(prev); s.delete(att.id); return s; });
        }
      }
    };
    loadImages();
  }, [email?.id, accountId]);

  if (!email) return null;

  const receivedDate = new Date(email.receivedAt);
  const toEmails: string[] = email.toEmails ? JSON.parse(email.toEmails) : [];
  const ccEmails: string[] = email.ccEmails ? JSON.parse(email.ccEmails) : [];

  const handleDownloadAttachment = async (att: SyncedEmailAttachmentDto) => {
    if (!email || !accountId) return;
    setDownloadingAttachment(att.id);
    try {
      const { data } = await emailAccountsApi.downloadAttachment(accountId, email.id, att.id);
      if (data?.contentBase64) {
        const byteChars = atob(data.contentBase64);
        const byteNumbers = new Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) byteNumbers[i] = byteChars.charCodeAt(i);
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: data.contentType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = data.fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } else {
        toast({ title: t('emailDetail.attachmentError', 'Failed to download attachment'), variant: 'destructive' });
      }
    } catch {
      toast({ title: t('emailDetail.attachmentError', 'Failed to download attachment'), variant: 'destructive' });
    } finally {
      setDownloadingAttachment(null);
    }
  };

  const handleOpenReply = () => {
    setReplyOpen(true);
    setReplyToList([email.fromEmail]);
    setReplyTo('');
    setReplyCcList(ccEmails);
    setReplyCc('');
    setReplyBody('');
    setAttachments([]);
  };

  const addEmail = (
    value: string,
    list: string[],
    setList: (l: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    const e = value.trim();
    if (e && e.includes('@') && !list.includes(e)) {
      setList([...list, e]);
      setInput('');
    }
  };

  const handleKeyDown = (
    ev: React.KeyboardEvent,
    value: string,
    list: string[],
    setList: (l: string[]) => void,
    setInput: (v: string) => void,
  ) => {
    if (ev.key === 'Enter' || ev.key === ',' || ev.key === 'Tab') {
      ev.preventDefault();
      addEmail(value, list, setList, setInput);
    }
  };

  const removeFromList = (email: string, list: string[], setList: (l: string[]) => void) => {
    setList(list.filter(e => e !== email));
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files) return;
    const newAttachments: { file: File; base64: string }[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 10 * 1024 * 1024) continue;
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
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendReply = async () => {
    const finalTo = [...replyToList];
    if (replyTo.trim() && replyTo.includes('@')) finalTo.push(replyTo.trim());
    const finalCc = [...replyCcList];
    if (replyCc.trim() && replyCc.includes('@')) finalCc.push(replyCc.trim());

    if (finalTo.length === 0) return;

    const emailAttachments: EmailAttachmentDto[] = attachments.map(a => ({
      fileName: a.file.name,
      contentType: a.file.type || 'application/octet-stream',
      contentBase64: a.base64,
    }));

    await onSendReply({
      to: finalTo,
      cc: finalCc,
      bcc: [],
      subject: `Re: ${email.subject}`,
      body: replyBody,
      attachments: emailAttachments.length > 0 ? emailAttachments : undefined,
    });
    setReplyOpen(false);
    setReplyBody('');
    setAttachments([]);
  };

  const canSendReply = replyToList.length > 0 || (replyTo.trim() && replyTo.includes('@'));

  return (
    <>
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px] p-0 gap-0 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 pt-4 pb-3 border-b border-border/40 flex items-center gap-3">
          <Button variant="ghost" size="icon-sm" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className={cn("text-base font-semibold truncate", !email.isRead && "text-foreground")}>
              {email.subject || t('emails.inbox.noSubject')}
            </h2>
          </div>
          <div className="flex items-center gap-1">
            {email.hasAttachments && <Paperclip className="h-4 w-4 text-muted-foreground" />}
            {onToggleStar && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => onToggleStar(e, email)}
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    <Star className={cn(
                      "h-4 w-4 transition-colors",
                      email.isStarred
                        ? "text-warning fill-warning"
                        : "text-muted-foreground hover:text-warning"
                    )} />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {email.isStarred ? t('emails.actions.unstar') : t('emails.actions.star')}
                </TooltipContent>
              </Tooltip>
            )}
            {onToggleRead && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={(e) => onToggleRead(e, email)}
                    className="p-1 rounded hover:bg-muted/50 transition-colors"
                  >
                    {email.isRead
                      ? <MailOpen className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                      : <MailCheck className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                    }
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {email.isRead ? t('emails.actions.markUnread') : t('emails.actions.markRead')}
                </TooltipContent>
              </Tooltip>
            )}
            {onDeleteEmail && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <button className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="h-4 w-4" />
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
                      onClick={(e) => onDeleteEmail(e, email)}
                    >
                      {t('emails.actions.delete')}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Email content */}
        <ScrollArea className="flex-1 min-h-0">
          <div className="px-5 py-4 space-y-4">
            {/* Sender info */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary shrink-0">
                  {(email.fromName || email.fromEmail).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">
                      {email.fromName || email.fromEmail}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">{email.fromEmail}</span>
                  {toEmails.length > 0 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {t('emailDetail.to')}: {toEmails.join(', ')}
                    </div>
                  )}
                  {ccEmails.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      {t('compose.cc')}: {ccEmails.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap shrink-0">
                {format(receivedDate, 'MMM d, yyyy HH:mm')}
              </span>
            </div>

            {/* Labels */}
            {email.labels && (
              <div className="flex flex-wrap gap-1">
                {JSON.parse(email.labels).filter((l: string) => l !== 'UNREAD').map((label: string) => (
                  <Badge key={label} variant="outline" className="text-[10px]">{label}</Badge>
                ))}
              </div>
            )}

            <Separator className="bg-border/40" />

            {/* Body */}
            <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed min-h-[100px]">
              {email.bodyPreview || email.snippet || t('emailDetail.noContent')}
            </div>

            {/* Received Attachments */}
            {email.attachments && email.attachments.length > 0 && (() => {
              const imageAtts = email.attachments!.filter(a => isImageAttachment(a.contentType));
              const fileAtts = email.attachments!.filter(a => !isImageAttachment(a.contentType));

              return (
                <>
                  <Separator className="bg-border/40" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        {t('emailDetail.attachments', 'Attachments')} ({email.attachments!.length})
                      </span>
                    </div>

                    {/* Inline image previews */}
                    {imageAtts.length > 0 && (
                      <div className="grid grid-cols-2 gap-2">
                        {imageAtts.map((att) => (
                          <div key={att.id} className="relative group rounded-md border border-border/60 overflow-hidden bg-muted/10">
                            {imagePreviewUrls[att.id] ? (
                              <img
                                src={imagePreviewUrls[att.id]}
                                alt={att.fileName}
                                className="w-full h-auto max-h-[200px] object-contain bg-muted/5 cursor-pointer"
                                onClick={() => setLightboxAttId(att.id)}
                              />
                            ) : loadingImages.has(att.id) ? (
                              <div className="flex items-center justify-center h-24">
                                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-24">
                                <ImageIcon className="h-5 w-5 text-muted-foreground" />
                              </div>
                            )}
                            <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30">
                              <div className="min-w-0 flex-1">
                                <span className="text-xs text-foreground truncate block">{att.fileName}</span>
                                <span className="text-[10px] text-muted-foreground">{formatFileSize(att.size)}</span>
                              </div>
                              <button
                                onClick={() => handleDownloadAttachment(att)}
                                disabled={downloadingAttachment === att.id}
                                className="p-1 rounded hover:bg-muted/50 transition-colors shrink-0"
                              >
                                {downloadingAttachment === att.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                                ) : (
                                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                                )}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Non-image file attachments */}
                    {fileAtts.length > 0 && (
                      <div className="grid gap-1.5">
                        {fileAtts.map((att) => (
                          <button
                            key={att.id}
                            onClick={() => handleDownloadAttachment(att)}
                            disabled={downloadingAttachment === att.id}
                            className="flex items-center gap-2.5 px-3 py-2 rounded-md border border-border/60 bg-muted/20 hover:bg-muted/40 transition-colors text-left group w-full"
                          >
                            <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm text-foreground truncate block">{att.fileName}</span>
                              <span className="text-xs text-muted-foreground">{formatFileSize(att.size)}</span>
                            </div>
                            {downloadingAttachment === att.id ? (
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground shrink-0" />
                            ) : (
                              <Download className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              );
            })()}
          </div>
        </ScrollArea>

        {/* Reply section */}
        {!replyOpen ? (
          <div className="px-5 py-3 border-t border-border/40 flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5" onClick={handleOpenReply}>
              <Reply className="h-3.5 w-3.5" />
              {t('emailDetail.reply')}
            </Button>
          </div>
        ) : (
          <div className="border-t border-border/40 px-5 py-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{t('emailDetail.replyingTo')}</span>
              <Button variant="ghost" size="icon-sm" onClick={() => { setReplyOpen(false); setAttachments([]); }}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Reply To */}
            <div className="flex items-start gap-3">
              <Label className="text-xs text-muted-foreground w-10 shrink-0 mt-2">{t('compose.to')}</Label>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap gap-1">
                  {replyToList.map((e) => (
                    <Badge key={e} variant="secondary" className="text-xs gap-1 pl-2 pr-1">
                      {e}
                      <button onClick={() => removeFromList(e, replyToList, setReplyToList)} className="hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <Input
                  placeholder={t('compose.toPlaceholder')}
                  value={replyTo}
                  onChange={(ev) => setReplyTo(ev.target.value)}
                  onKeyDown={(ev) => handleKeyDown(ev, replyTo, replyToList, setReplyToList, setReplyTo)}
                  onBlur={() => addEmail(replyTo, replyToList, setReplyToList, setReplyTo)}
                  className="h-7 text-xs"
                />
              </div>
              <Button variant="ghost" size="icon-sm" className="mt-1" onClick={() => setShowCcBcc(!showCcBcc)}>
                {showCcBcc ? <Minus className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
              </Button>
            </div>

            {showCcBcc && (
              <div className="flex items-start gap-3">
                <Label className="text-xs text-muted-foreground w-10 shrink-0 mt-2">{t('compose.cc')}</Label>
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap gap-1">
                    {replyCcList.map((e) => (
                      <Badge key={e} variant="secondary" className="text-xs gap-1 pl-2 pr-1">
                        {e}
                        <button onClick={() => removeFromList(e, replyCcList, setReplyCcList)} className="hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <Input
                    placeholder={t('compose.ccPlaceholder')}
                    value={replyCc}
                    onChange={(ev) => setReplyCc(ev.target.value)}
                    onKeyDown={(ev) => handleKeyDown(ev, replyCc, replyCcList, setReplyCcList, setReplyCc)}
                    onBlur={() => addEmail(replyCc, replyCcList, setReplyCcList, setReplyCc)}
                    className="h-7 text-xs"
                  />
                </div>
              </div>
            )}

            <Textarea
              placeholder={t('emailDetail.replyPlaceholder')}
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              className="min-h-[100px] resize-none text-sm"
            />

            {/* Reply attachments */}
            {attachments.length > 0 && (
              <div className="space-y-1">
                {attachments.map((att, i) => (
                  <div key={i} className="flex items-center gap-2 px-2 py-1 rounded-md border border-border/60 bg-muted/20">
                    <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="text-[11px] text-foreground truncate flex-1">{att.file.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">{formatFileSize(att.file.size)}</span>
                    <button onClick={() => removeAttachment(i)} className="text-muted-foreground hover:text-destructive">
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => { handleFilesSelected(e.target.files); e.target.value = ''; }}
            />

            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground h-7 text-xs"
                onClick={() => fileInputRef.current?.click()}
                disabled={sending}
              >
                <Paperclip className="h-3 w-3" />
                {t('compose.attach', 'Attach')}
                {attachments.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1 py-0">{attachments.length}</Badge>
                )}
              </Button>
              <Button
                size="sm"
                className="gap-1.5"
                disabled={!canSendReply || sending || !replyBody.trim()}
                onClick={handleSendReply}
              >
                {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {t('compose.send')}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>

    {/* Lightbox overlay */}
    {lightboxAttId && imagePreviewUrls[lightboxAttId] && (() => {
      const imageAtts = email.attachments?.filter(a => isImageAttachment(a.contentType)) || [];
      const currentIndex = imageAtts.findIndex(a => a.id === lightboxAttId);
      const currentAtt = imageAtts[currentIndex];
      const hasPrev = currentIndex > 0;
      const hasNext = currentIndex < imageAtts.length - 1;

      return (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxAttId(null)}
        >
          {/* Close */}
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
            onClick={() => setLightboxAttId(null)}
          >
            <X className="h-5 w-5" />
          </button>

          {/* Download */}
          {currentAtt && (
            <button
              className="absolute top-4 right-16 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); handleDownloadAttachment(currentAtt); }}
            >
              <Download className="h-5 w-5" />
            </button>
          )}

          {/* Prev */}
          {hasPrev && (
            <button
              className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxAttId(imageAtts[currentIndex - 1].id); }}
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next */}
          {hasNext && (
            <button
              className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/50 text-white hover:bg-black/70 transition-colors z-10"
              onClick={(e) => { e.stopPropagation(); setLightboxAttId(imageAtts[currentIndex + 1].id); }}
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image */}
          <img
            src={imagePreviewUrls[lightboxAttId]}
            alt={currentAtt?.fileName || ''}
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />

          {/* File name */}
          {currentAtt && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/60 text-white text-sm">
              {currentAtt.fileName} • {formatFileSize(currentAtt.size)}
              {imageAtts.length > 1 && ` • ${currentIndex + 1}/${imageAtts.length}`}
            </div>
          )}
        </div>
      );
    })()}
    </>
  );
}
