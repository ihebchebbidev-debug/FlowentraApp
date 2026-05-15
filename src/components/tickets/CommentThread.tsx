import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supportTicketsApi, SupportTicketCommentDto, CreateCommentPayload } from '@/services/api/supportTicketsApi';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar } from '@/components/ui/avatar';
import { useUserType } from '@/hooks/useUserType';
import { Paperclip, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  ticketId: number;
}

export default function CommentThread({ ticketId }: Props) {
  const { t } = useTranslation('support');
  const { isMainAdminUser } = useUserType();

  const [comments, setComments] = useState<SupportTicketCommentDto[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchComments = async () => {
    if (!ticketId) return;
    setIsLoading(true);
    try {
      const res = await supportTicketsApi.getComments(ticketId);
      setComments(res);
    } catch (err) {
      console.error('Failed to load comments', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [ticketId]);

  const [text, setText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isInternal, setIsInternal] = useState(false);

  const [adding, setAdding] = useState(false);

  const addComment = async (payload: CreateCommentPayload) => {
    setAdding(true);
    try {
      const res = await supportTicketsApi.addComment(ticketId, payload);
      setComments((prev) => prev ? [...prev, res] : [res]);
      setText('');
      setFiles([]);
    } catch (err) {
      console.error('Add comment failed', err);
      toast.error(t('comments.addError', 'Failed to add comment'));
    } finally {
      setAdding(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles(Array.from(e.target.files));
    e.target.value = '';
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!text.trim() && files.length === 0) return;
    await addComment({ text: text.trim(), isInternal: isInternal && isMainAdminUser, attachments: files });
  };

  return (
    <div className="space-y-3">
      <h4 className="text-[12px] font-semibold text-muted-foreground">{t('comments.title', 'Conversation')}</h4>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {(comments || []).map((c: SupportTicketCommentDto) => (
            <div key={c.id} className={`${c.isInternal ? 'bg-muted/10 border-border/30' : ''} p-3 rounded-md border` }>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                    {c.author?.split(' ').map(s => s[0]).slice(0,2).join('') || c.author?.slice(0,2)}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">{c.author}</div>
                    <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="mt-1 text-sm whitespace-pre-wrap">{c.text}</div>
                  {c.attachments?.length > 0 && (
                    <div className="mt-2 flex gap-2 flex-wrap">
                      {c.attachments.map(a => (
                        <a key={a.id} href={a.filePath || '#'} target="_blank" rel="noreferrer" className="text-xs text-primary underline flex items-center gap-1">
                          <Paperclip className="h-3 w-3" /> {a.fileName}
                        </a>
                      ))}
                    </div>
                  )}
                  {c.isInternal && isMainAdminUser && (
                    <div className="mt-2 text-[11px] inline-flex items-center gap-2 px-2 py-0.5 bg-muted rounded text-muted-foreground">{t('comments.internal', 'Internal')}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add comment form */}
      <form onSubmit={handleSubmit} className="space-y-2">
        <Label className="text-[12px]">{t('comments.add', 'Add a comment')}</Label>
        <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={t('comments.placeholder', 'Write a message...')} />
        <div className="flex items-center gap-3">
          <input type="file" multiple onChange={onFileChange} />
          {isMainAdminUser && (
            <label className="text-sm">
              <input type="checkbox" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} /> {' '}
              {t('comments.markInternal', 'Mark as internal note')}
            </label>
          )}
          <div className="ml-auto">
            <Button type="button" onClick={() => { setText(''); setFiles([]); setIsInternal(false); }} variant="ghost" size="sm">{t('comments.clear', 'Clear')}</Button>
            <Button type="submit" size="sm" className="ml-2">{adding ? t('comments.sending', 'Sending...') : t('comments.send', 'Send')}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
