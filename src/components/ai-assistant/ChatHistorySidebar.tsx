import { useState, useCallback, useRef, useEffect } from 'react';
import { ListSkeleton } from '@/components/ui/page-skeleton';
import { useTranslation } from 'react-i18next';
import { isToday, isYesterday, isThisWeek, isThisMonth } from 'date-fns';
import { 
  X, 
  Plus, 
  Search, 
  MessageSquare, 
  Pin, 
  Archive, 
  Trash2, 
  MoreVertical,
  ChevronRight,
  Loader2,
  Pencil,
  Check
} from 'lucide-react';
import { AiLogoIcon } from '@/components/ai-assistant/AiLogoIcon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';

export interface Conversation {
  id: number;
  title: string;
  lastMessageAt: Date | null;
  messageCount: number;
  isPinned: boolean;
  isArchived: boolean;
  createdAt: Date;
}

interface ChatHistorySidebarProps {
  isOpen: boolean;
  onClose: () => void;
  conversations: Conversation[];
  currentConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: number) => void;
  onPinConversation: (id: number, pin: boolean) => void;
  onArchiveConversation: (id: number, archive: boolean) => void;
  onRenameConversation: (id: number, newTitle: string) => Promise<boolean>;
  onClearAllConversations: () => Promise<boolean>;
  isLoading?: boolean;
}

export function ChatHistorySidebar({
  isOpen,
  onClose,
  conversations,
  currentConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onPinConversation,
  onArchiveConversation,
  onRenameConversation,
  onClearAllConversations,
  isLoading = false
}: ChatHistorySidebarProps) {
  const { t } = useTranslation('aiAssistant');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Filter conversations
  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesArchived = showArchived ? conv.isArchived : !conv.isArchived;
    return matchesSearch && matchesArchived;
  });

  // Group conversations by date
  const groupedConversations = groupConversationsByDate(filteredConversations, t);

  const handleSelectConversation = useCallback((id: number) => {
    onSelectConversation(id);
    onClose();
  }, [onSelectConversation, onClose]);

  const handleNewConversation = useCallback(() => {
    onNewConversation();
    onClose();
  }, [onNewConversation, onClose]);

  const handleClearAll = useCallback(async () => {
    setIsClearing(true);
    await onClearAllConversations();
    setIsClearing(false);
  }, [onClearAllConversations]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-[51] transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar - Opens from right, same width as AI assistant */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[420px] bg-background z-[52] flex flex-col transition-transform duration-300 ease-out shadow-2xl border-l border-border",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header - Matches AI assistant style */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-background to-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-foreground font-semibold text-sm">{t('history.title')}</span>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Chat Button */}
        <div className="px-4 py-3">
          <Button 
            onClick={handleNewConversation}
            className="w-full justify-start gap-2 h-10 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus className="h-4 w-4" />
            {t('history.newChat')}
          </Button>
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('history.search')}
              className="h-10 pl-10 text-sm bg-muted/50 border-border focus:border-primary focus:ring-primary"
            />
          </div>
        </div>

        {/* Archive Toggle */}
        <div className="px-4 pb-3 flex gap-2">
          <Button
            variant={!showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(false)}
            className={cn(
              "flex-1 h-9 text-sm",
              !showArchived 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-transparent border-border hover:bg-muted"
            )}
          >
            {t('history.recent')}
          </Button>
          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(true)}
            className={cn(
              "flex-1 h-9 text-sm gap-1.5",
              showArchived 
                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                : "bg-transparent border-border hover:bg-muted"
            )}
          >
            <Archive className="h-3.5 w-3.5" />
            {t('history.archived')}
          </Button>
        </div>

        {/* Conversations List */}
        <ScrollArea className="flex-1">
          {isLoading ? (
            <ListSkeleton rows={5} />
          ) : filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <MessageSquare className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? t('history.noResults') : t('history.noConversations')}
              </p>
            </div>
          ) : (
            <div className="px-3 pb-4">
              {Object.entries(groupedConversations).map(([group, convs]) => (
                <div key={group} className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
                    {group}
                  </p>
                  <div className="space-y-1">
                    {convs.map((conv) => (
                      <ConversationItem
                        key={conv.id}
                        conversation={conv}
                        isActive={conv.id === currentConversationId}
                        onSelect={() => handleSelectConversation(conv.id)}
                        onDelete={() => onDeleteConversation(conv.id)}
                        onPin={() => onPinConversation(conv.id, !conv.isPinned)}
                        onArchive={() => onArchiveConversation(conv.id, !conv.isArchived)}
                        onRename={(newTitle) => onRenameConversation(conv.id, newTitle)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Clear All Button */}
        {conversations.length > 0 && (
          <div className="px-4 py-3 border-t border-border">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full h-9 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30"
                  disabled={isClearing}
                >
                  {isClearing ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {t('history.clearAll')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>{t('history.clearAll')}</AlertDialogTitle>
                  <AlertDialogDescription>
                    {t('history.clearAllConfirm')}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('history.cancel')}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleClearAll}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                  >
                    {t('history.confirm')}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    </>
  );
}

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onPin: () => void;
  onArchive: () => void;
  onRename: (newTitle: string) => Promise<boolean>;
  t: (key: string) => string;
}

function ConversationItem({ 
  conversation, 
  isActive, 
  onSelect, 
  onDelete, 
  onPin, 
  onArchive,
  onRename,
  t 
}: ConversationItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(conversation.title);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setEditTitle(conversation.title);
    setIsEditing(true);
  }, [conversation.title]);

  const handleSaveEdit = useCallback(async () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle || trimmedTitle === conversation.title) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    const success = await onRename(trimmedTitle);
    setIsSaving(false);
    
    if (success) {
      setIsEditing(false);
    }
  }, [editTitle, conversation.title, onRename]);

  const handleCancelEdit = useCallback(() => {
    setEditTitle(conversation.title);
    setIsEditing(false);
  }, [conversation.title]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  }, [handleSaveEdit, handleCancelEdit]);

  return (
    <div
      className={cn(
        "group/item flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer transition-all duration-200",
        isActive 
          ? "bg-primary/10 text-foreground border border-primary/20" 
          : "hover:bg-muted text-foreground border border-transparent hover:border-border"
      )}
      onClick={isEditing ? undefined : onSelect}
    >
      {conversation.isPinned && (
        <Pin className="h-3.5 w-3.5 text-primary shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-1">
            <Input
              ref={inputRef}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={handleSaveEdit}
              className="h-7 text-sm py-0 px-2"
              disabled={isSaving}
              onClick={(e) => e.stopPropagation()}
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                handleSaveEdit();
              }}
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Check className="h-3.5 w-3.5 text-primary" />
              )}
            </Button>
          </div>
        ) : (
          <>
            <p 
              className="text-sm font-medium truncate cursor-text hover:text-primary transition-colors"
              onClick={handleStartEdit}
              title={t('history.rename')}
            >
              {conversation.title}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {conversation.messageCount} {t('history.messages')}
            </p>
          </>
        )}
      </div>
      {!isEditing && (
        <div className="flex items-center gap-1 opacity-60 group-hover/item:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 hover:bg-muted"
              >
                <MoreVertical className="h-4 w-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleStartEdit(e as any); }} className="gap-2">
                <Pencil className="h-4 w-4" />
                {t('history.rename')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPin(); }} className="gap-2">
                <Pin className="h-4 w-4" />
                {conversation.isPinned ? t('history.unpin') : t('history.pin')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onArchive(); }} className="gap-2">
                <Archive className="h-4 w-4" />
                {conversation.isArchived ? t('history.unarchive') : t('history.archive')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="gap-2 text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
                {t('history.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

function groupConversationsByDate(conversations: Conversation[], t: (key: string) => string) {
  const groups: Record<string, Conversation[]> = {};

  // First add pinned conversations
  const pinned = conversations.filter(c => c.isPinned);
  if (pinned.length > 0) {
    groups[t('history.pinned')] = pinned;
  }

  // Then group the rest by date
  const unpinned = conversations.filter(c => !c.isPinned);
  
  unpinned.forEach(conv => {
    const date = conv.lastMessageAt ? new Date(conv.lastMessageAt) : new Date(conv.createdAt);
    let group: string;

    if (isToday(date)) {
      group = t('history.today');
    } else if (isYesterday(date)) {
      group = t('history.yesterday');
    } else if (isThisWeek(date)) {
      group = t('history.thisWeek');
    } else if (isThisMonth(date)) {
      group = t('history.thisMonth');
    } else {
      group = t('history.older');
    }

    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(conv);
  });

  return groups;
}
