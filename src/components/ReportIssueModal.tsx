import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { AlertTriangle, Paperclip, X, Upload, Globe, FolderOpen, Shield, Tag, Loader2, Camera, Crop as CropIcon, Check, ExternalLink, Ticket } from 'lucide-react';
import { supportTicketsApi } from '@/services/api/supportTicketsApi';
import TicketLinkSelector from '@/components/tickets/TicketLinkSelector';
import { useAuth } from '@/contexts/AuthContext';
import type { ReportIssuePrefill } from '@/services/incident/incidentTypes';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  prefill?: ReportIssuePrefill;
};

const MAX_FILES = 5;

export default function ReportIssueModal({ open, onOpenChange, prefill }: Props) {
  const { t } = useTranslation('support');
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState('');
  const [category, setCategory] = useState('');
  const [currentPage, setCurrentPage] = useState(location.pathname);
  const [relatedUrl, setRelatedUrl] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [linkedTickets, setLinkedTickets] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open || !prefill) return;
    if (prefill.title) setTitle(prefill.title);
    if (prefill.description) setDescription(prefill.description);
    if (prefill.category) setCategory(prefill.category);
    if (prefill.urgency) setUrgency(prefill.urgency);
    if (prefill.currentPage) setCurrentPage(prefill.currentPage);
    if (prefill.relatedUrl) setRelatedUrl(prefill.relatedUrl);
  }, [open, prefill]);

  // Screenshot state

  const urgencies = [
    { value: 'low', label: t('priorities.low'), color: 'bg-emerald-500' },
    { value: 'medium', label: t('priorities.medium'), color: 'bg-amber-500' },
    { value: 'high', label: t('priorities.high'), color: 'bg-orange-500' },
    { value: 'critical', label: t('priorities.critical'), color: 'bg-destructive' },
  ];

  const categories = [
    { value: 'bug', label: t('ticketCategories.bug') },
    { value: 'technical', label: t('ticketCategories.technical') },
    { value: 'feature', label: t('ticketCategories.feature') },
    { value: 'billing', label: t('ticketCategories.billing') },
    { value: 'account', label: t('ticketCategories.account') },
    { value: 'other', label: t('ticketCategories.other') },
  ];

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files || []);
    if (!dropped.length) return;
    setFiles((prev) => [...prev, ...dropped].slice(0, MAX_FILES));
  }, []);

  const onSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const picked = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
    if (inputRef.current) inputRef.current.value = '';
  };

  const removeFile = (idx: number) => setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onPaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file) {
          const ext = item.type.split('/')[1] || 'png';
          const named = new File([file], `pasted-image-${Date.now()}.${ext}`, { type: item.type });
          imageFiles.push(named);
        }
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      setFiles((prev) => [...prev, ...imageFiles].slice(0, MAX_FILES));
      toast.success(`${imageFiles.length} image(s) pasted from clipboard`);
    }
  }, []);

  const reset = () => {
    setTitle('');
    setDescription('');
    setUrgency('');
    setCategory('');
    setCurrentPage(location.pathname);
    setRelatedUrl('');
    setFiles([]);
    setErrors({});
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, boolean> = {};
    if (!title.trim()) newErrors.title = true;
    if (!description.trim()) newErrors.description = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      return;
    }
    setErrors({});
    setSubmitting(true);

    try {
      const created = await supportTicketsApi.create({
        title: title.trim(),
        description: description.trim(),
        urgency: urgency || undefined,
        category: category || undefined,
        currentPage: currentPage || undefined,
        relatedUrl: relatedUrl || undefined,
        userEmail: user?.email || undefined,
        attachments: files.length > 0 ? files : undefined,
      });
      // If there are linked tickets, create links
      if (linkedTickets && linkedTickets.length) {
        for (const l of linkedTickets) {
          try {
            await supportTicketsApi.addLink(created.id, { targetTicketId: l.targetTicketId, linkType: l.linkType });
          } catch (linkErr) {
            console.warn('Failed to add link', linkErr);
            toast((t('reportIssue.linkWarning', 'Ticket created but one or more links failed')), { icon: '⚠️' });
          }
        }
      }

      toast.success(t('reportIssue.success'));
      reset();
      setLinkedTickets([]);
      onOpenChange(false);
    } catch (err) {
      console.error('Failed to submit support ticket:', err);
      toast.error(t('ticket.error'));
    } finally {
      setSubmitting(false);
    }
  };

  // If we're capturing a screenshot, hide the dialog entirely

  // If we have a screenshot to crop, show the crop dialog instead

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] max-h-[92vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-4 bg-muted/30">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-primary/10">
              <AlertTriangle className="h-4.5 w-4.5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-[15px]">{t('reportIssue.title')}</DialogTitle>
              <DialogDescription className="text-[12px] mt-0.5">
                {t('reportIssue.subtitle')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Separator />

        {/* Scrollable Form */}
        <ScrollArea className="max-h-[calc(92vh-170px)]">
          <form id="report-issue-form" onSubmit={handleSubmit} onPaste={onPaste} className="px-6 py-5 space-y-5">
            
            {/* === Required Section === */}
            <div className="space-y-4">
              {/* Title */}
              <div className="space-y-1.5">
                <Label htmlFor="issue-title" className="text-[13px] font-medium">
                  {t('reportIssue.issueTitle')} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="issue-title"
                  placeholder={t('reportIssue.issueTitlePlaceholder')}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: false })); }}
                  className={errors.title ? 'border-destructive focus-visible:ring-destructive/40' : ''}
                  autoFocus
                />
                {errors.title && (
                  <p className="text-[11px] text-destructive mt-1">{t('reportIssue.required')}</p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="issue-desc" className="text-[13px] font-medium">
                  {t('reportIssue.description')} <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  id="issue-desc"
                  placeholder={t('reportIssue.descriptionPlaceholder')}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); setErrors((p) => ({ ...p, description: false })); }}
                  className={`min-h-[110px] resize-y ${errors.description ? 'border-destructive focus-visible:ring-destructive/40' : ''}`}
                />
                {errors.description && (
                  <p className="text-[11px] text-destructive mt-1">{t('reportIssue.required')}</p>
                )}
              </div>
            </div>

            <Separator className="my-1" />

            {/* === Optional Section === */}
            <div className="space-y-4">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
                {t('reportIssue.optionalDetails', 'Optional details')}
              </p>

              {/* Urgency & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium flex items-center gap-1.5">
                    <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('reportIssue.urgency')}
                  </Label>
                  <Select value={urgency} onValueChange={setUrgency}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('priorities.medium')} />
                    </SelectTrigger>
                    <SelectContent>
                      {urgencies.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          <span className="flex items-center gap-2">
                            <span className={`inline-block h-2 w-2 rounded-full ${u.color}`} />
                            {u.label}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-[13px] font-medium flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('reportIssue.category')}
                  </Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t('ticketCategories.general')} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Current Page & URL side by side */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="current-page" className="text-[13px] font-medium flex items-center gap-1.5">
                    <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('reportIssue.currentPage')}
                  </Label>
                  <Input
                    id="current-page"
                    placeholder={t('reportIssue.currentPagePlaceholder')}
                    value={currentPage}
                    onChange={(e) => setCurrentPage(e.target.value)}
                    className="h-9 text-[12px] font-mono text-muted-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="related-url" className="text-[13px] font-medium flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                    {t('reportIssue.relatedUrl')}
                  </Label>
                  <Input
                    id="related-url"
                    placeholder={t('reportIssue.relatedUrlPlaceholder')}
                    value={relatedUrl}
                    onChange={(e) => setRelatedUrl(e.target.value)}
                    className="h-9"
                  />
                </div>
              </div>

                {/* Link to existing ticket (optional) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-[12px] font-semibold text-muted-foreground flex items-center gap-2">
                      <Ticket className="h-4 w-4" /> {t('reportIssue.linkToExisting', 'Link to existing ticket')}
                    </h4>
                  </div>
                  <div>
                    <TicketLinkSelector existingLinks={linkedTickets} onLinksChange={(ls) => setLinkedTickets(ls as any[])} ticketId={undefined} />
                  </div>
                </div>

                {/* File Upload + Screenshot */}
              <div className="space-y-1.5">
                <Label className="text-[13px] font-medium flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                  {t('reportIssue.attachments')}
                </Label>

                <div className="flex gap-2">
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={onDrop}
                    className={`
                      flex-1 border-dashed border-2 rounded-lg p-5 flex flex-col items-center gap-1.5 cursor-pointer
                      transition-all duration-200 ease-out
                      ${dragOver 
                        ? 'border-primary bg-primary/5 scale-[1.01]' 
                        : 'border-border/60 bg-muted/10 hover:border-primary/30 hover:bg-muted/20'
                      }
                    `}
                    onClick={() => inputRef.current?.click()}
                  >
                    <div className={`p-2 rounded-full transition-colors ${dragOver ? 'bg-primary/10' : 'bg-muted/40'}`}>
                      <Upload className={`h-4 w-4 ${dragOver ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <p className="text-[12px] text-muted-foreground text-center">
                      {t('reportIssue.dragDrop')}{' '}
                      <span className="text-primary font-medium">{t('reportIssue.browse')}</span>
                    </p>
                    <p className="text-[10px] text-muted-foreground/60">
                      {t('reportIssue.maxFiles', { max: MAX_FILES })}
                    </p>
                    <input
                      ref={inputRef}
                      type="file"
                      multiple
                      className="hidden"
                      onChange={onSelectFiles}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </div>
                </div>

                {files.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {files.map((file, idx) => (
                      <Card key={idx} className="p-2 flex items-center justify-between gap-2 shadow-none border-border/40">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {file.type.startsWith('image/') ? (
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className="w-9 h-7 object-cover rounded border border-border/30 flex-shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-7 flex items-center justify-center bg-muted rounded text-[10px] font-mono font-medium text-muted-foreground flex-shrink-0 border border-border/30">
                              {file.name.split('.').pop()?.toUpperCase().slice(0, 4) || 'FILE'}
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-[12px] truncate leading-tight">{file.name}</p>
                            <p className="text-[10px] text-muted-foreground/70">
                              {file.size < 1024 * 1024
                                ? `${(file.size / 1024).toFixed(0)} KB`
                                : `${(file.size / (1024 * 1024)).toFixed(1)} MB`
                              }
                            </p>
                          </div>
                        </div>
                        <Button type="button" size="icon-sm" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => removeFile(idx)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </form>
        </ScrollArea>

        {/* Footer */}
        <Separator />
        <DialogFooter className="px-6 py-3.5 gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            {t('reportIssue.cancel')}
          </Button>
          <Button type="submit" form="report-issue-form" size="sm" disabled={submitting} className="min-w-[120px]">
            {submitting ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t('reportIssue.submit')}
              </span>
            ) : t('reportIssue.submit')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
