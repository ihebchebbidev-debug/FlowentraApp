import { useState, useEffect } from 'react';
import { ListSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Send, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TaskCommentsService, TaskComment } from '../services/comments.service';
import { useAuth } from '@/contexts/AuthContext';

interface TaskCommentsProps {
  taskId: string;
}

export function TaskComments({ taskId }: TaskCommentsProps) {
  const { t } = useTranslation('tasks');
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadComments = async () => {
    if (!taskId) return;
    setIsLoading(true);
    try {
      const data = await TaskCommentsService.getComments(taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadComments();
  }, [taskId]);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsSubmitting(true);
    try {
      const authorName = user ? `${user.firstName} ${user.lastName}`.trim() : 'Anonymous';
      const comment = await TaskCommentsService.addComment(
        taskId,
        newComment.trim(),
        user?.id?.toString() || 'unknown',
        authorName || user?.email || 'Anonymous'
      );
      setComments(prev => [...prev, comment]);
      setNewComment('');
      toast({ title: t('daily.toast.commentAdded'), description: t('daily.toast.commentAddedDesc') });
    } catch (error) {
      toast({ title: t('daily.toast.commentError'), description: t('daily.toast.commentAddFailed'), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await TaskCommentsService.deleteComment(taskId, commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
      toast({ title: t('daily.toast.commentDeleted'), description: t('daily.toast.commentDeletedDesc') });
    } catch (error) {
      toast({ title: t('daily.toast.commentError'), description: t('daily.toast.commentDeleteFailed'), variant: "destructive" });
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        {t('daily.comments.title')} ({comments.length})
      </h3>

      {/* Comment Input */}
      <div className="space-y-2">
        <Textarea
          placeholder={t('daily.comments.placeholder')}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[80px] resize-none"
        />
        <div className="flex justify-end">
          <Button 
            onClick={handleAddComment} 
            disabled={!newComment.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            {t('daily.comments.postButton')}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          {t('daily.comments.noComments')}
        </p>
      ) : (
        <div className="space-y-3">
          <Separator />
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 p-3 bg-muted/30 rounded-lg group">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(comment.authorName)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {comment.authorName}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(comment.createdAt)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDeleteComment(comment.id)}
                    >
                      <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1 break-words">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
