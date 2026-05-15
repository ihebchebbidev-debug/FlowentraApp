import { useState, useEffect, useCallback, useRef } from 'react';
import { aiChatApi, AiConversation, AiMessage } from '@/services/api/aiChatService';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { Conversation } from '@/components/ai-assistant/ChatHistorySidebar';

const LAST_CONVERSATION_KEY = 'ai_chat_last_conversation_id';

export function useAiChatHistory() {
  const { t } = useTranslation('aiAssistant');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<number | null>(() => {
    // Restore last conversation ID from localStorage
    try {
      const saved = localStorage.getItem(LAST_CONVERSATION_KEY);
      return saved ? parseInt(saved, 10) : null;
    } catch {
      return null;
    }
  });
  const [currentMessages, setCurrentMessages] = useState<AiMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Track pending saves to avoid duplicate operations
  const pendingConversationRef = useRef<Promise<number | null> | null>(null);
  const autoSaveEnabledRef = useRef(true);
  const hasRestoredConversation = useRef(false);

  // Transform API response to frontend format
  const transformConversation = (conv: AiConversation): Conversation => ({
    id: conv.id,
    title: conv.title,
    lastMessageAt: conv.lastMessageAt ? new Date(conv.lastMessageAt) : null,
    messageCount: conv.messageCount,
    isPinned: conv.isPinned,
    isArchived: conv.isArchived,
    createdAt: new Date(conv.createdAt),
  });

  // Fetch all conversations
  const fetchConversations = useCallback(async (includeArchived = false) => {
    setIsLoading(true);
    try {
      const response = await aiChatApi.getConversations(1, 50, includeArchived);
      setConversations(response.conversations.map(transformConversation));
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
      // Silently fail - conversations just won't load
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Persist currentConversationId to localStorage
  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem(LAST_CONVERSATION_KEY, currentConversationId.toString());
    } else {
      localStorage.removeItem(LAST_CONVERSATION_KEY);
    }
  }, [currentConversationId]);

  // Create new conversation (with deduplication)
  const createConversation = useCallback(async (title?: string): Promise<number | null> => {
    // If there's already a pending creation, wait for it
    if (pendingConversationRef.current) {
      return pendingConversationRef.current;
    }

    const createPromise = (async () => {
      try {
        const conv = await aiChatApi.createConversation(title);
        setConversations(prev => [transformConversation(conv), ...prev]);
        setCurrentConversationId(conv.id);
        setCurrentMessages([]);
        return conv.id;
      } catch (error) {
        console.error('Failed to create conversation:', error);
        return null;
      } finally {
        pendingConversationRef.current = null;
      }
    })();

    pendingConversationRef.current = createPromise;
    return createPromise;
  }, []);

  // Ensure a conversation exists (create if needed)
  const ensureConversation = useCallback(async (firstMessageContent?: string): Promise<number | null> => {
    if (currentConversationId) {
      return currentConversationId;
    }

    // Generate title from first message
    const title = firstMessageContent 
      ? firstMessageContent.substring(0, 50) + (firstMessageContent.length > 50 ? '...' : '')
      : undefined;
    
    return createConversation(title);
  }, [currentConversationId, createConversation]);

  // Load conversation with messages
  const loadConversation = useCallback(async (id: number) => {
    // Guard against bad/stale ids that would produce 400/404 noise on the backend
    if (!id || !Number.isFinite(id) || id <= 0) {
      console.warn('[useAiChatHistory] loadConversation skipped: invalid id', id);
      try { localStorage.removeItem(LAST_CONVERSATION_KEY); } catch { /* noop */ }
      setCurrentConversationId(null);
      return null;
    }
    setIsLoadingMessages(true);
    try {
      const conv = await aiChatApi.getConversation(id, true);
      setCurrentConversationId(id);
      setCurrentMessages(conv.messages || []);
      return conv;
    } catch (error: any) {
      // Silent failure: don't surface to users. Logged for diagnostics only.
      console.error('Failed to load conversation:', { id, status: error?.status, error });
      // If the conversation is gone (404) or invalid (400), forget the stale id
      if (error?.status === 404 || error?.status === 400) {
        try { localStorage.removeItem(LAST_CONVERSATION_KEY); } catch { /* noop */ }
        setCurrentConversationId(null);
      }
      return null;
    } finally {
      setIsLoadingMessages(false);
    }
  }, []);

  // Restore last conversation messages on mount
  useEffect(() => {
    if (currentConversationId && !hasRestoredConversation.current && currentMessages.length === 0) {
      hasRestoredConversation.current = true;
      loadConversation(currentConversationId).catch(() => {
        // If failed to load, clear the saved ID
        localStorage.removeItem(LAST_CONVERSATION_KEY);
        setCurrentConversationId(null);
      });
    }
  }, [currentConversationId, currentMessages.length, loadConversation]);

  const autoSaveMessage = useCallback(async (
    role: 'user' | 'assistant', 
    content: string,
    conversationId?: number
  ): Promise<AiMessage | null> => {
    if (!autoSaveEnabledRef.current) return null;

    const targetConvId = conversationId || currentConversationId;
    
    if (!targetConvId) {
      console.warn('No conversation ID for auto-save, creating new conversation...');
      const newId = await ensureConversation(role === 'user' ? content : undefined);
      if (!newId) {
        console.error('Failed to create conversation for auto-save');
        return null;
      }
      return autoSaveMessage(role, content, newId);
    }

    setIsSaving(true);
    try {
      const msg = await aiChatApi.addMessage(targetConvId, role, content);
      setCurrentMessages(prev => [...prev, msg]);
      
      // Update conversation in list
      setConversations(prev => prev.map(c => 
        c.id === targetConvId 
          ? { ...c, messageCount: c.messageCount + 1, lastMessageAt: new Date() }
          : c
      ));
      
      return msg;
    } catch (error) {
      console.error('Failed to auto-save message:', error);
      // Don't show toast for auto-save failures - it's background
      return null;
    } finally {
      setIsSaving(false);
    }
  }, [currentConversationId, ensureConversation]);

  // Save message pair (user + assistant) atomically
  const saveMessagePair = useCallback(async (
    userMessage: string,
    assistantMessage: string
  ): Promise<boolean> => {
    if (!autoSaveEnabledRef.current) return false;

    let convId = currentConversationId;
    
    if (!convId) {
      convId = await ensureConversation(userMessage);
      if (!convId) return false;
    }

    setIsSaving(true);
    try {
      const savedMessages = await aiChatApi.addMessages(convId, [
        { role: 'user', content: userMessage },
        { role: 'assistant', content: assistantMessage }
      ]);
      
      setCurrentMessages(prev => [...prev, ...savedMessages]);
      
      // Update conversation in list
      setConversations(prev => prev.map(c => 
        c.id === convId 
          ? { 
              ...c, 
              messageCount: c.messageCount + 2, 
              lastMessageAt: new Date(),
              // Update title if it was the first messages
              title: c.messageCount === 0 
                ? userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '')
                : c.title
            }
          : c
      ));
      
      return true;
    } catch (error) {
      console.error('Failed to save message pair:', error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [currentConversationId, ensureConversation]);

  // Delete conversation
  const deleteConversation = useCallback(async (id: number) => {
    try {
      await aiChatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setCurrentMessages([]);
      }
      
      toast({
        title: t('history.conversationDeleted'),
      });
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast({
        title: t('error'),
        description: t('history.deleteFailed'),
        variant: 'destructive',
      });
    }
  }, [currentConversationId, t]);

  // Rename conversation
  const renameConversation = useCallback(async (id: number, newTitle: string) => {
    try {
      await aiChatApi.renameConversation(id, newTitle);
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, title: newTitle } : c
      ));
      toast({
        title: t('history.conversationRenamed'),
      });
      return true;
    } catch (error) {
      console.error('Failed to rename conversation:', error);
      toast({
        title: t('error'),
        description: t('history.renameFailed'),
        variant: 'destructive',
      });
      return false;
    }
  }, [t]);

  // Delete all conversations and auto-start new chat
  const clearAllConversations = useCallback(async () => {
    try {
      await aiChatApi.deleteAllConversations();
      setConversations([]);
      setCurrentConversationId(null);
      setCurrentMessages([]);
      pendingConversationRef.current = null;
      
      toast({
        title: t('history.clearAllSuccess'),
      });
      
      // Automatically create a new conversation after clearing all
      const newConv = await aiChatApi.createConversation();
      setConversations([transformConversation(newConv)]);
      setCurrentConversationId(newConv.id);
      
      return true;
    } catch (error) {
      console.error('Failed to clear all conversations:', error);
      toast({
        title: t('error'),
        description: t('history.deleteFailed'),
        variant: 'destructive',
      });
      return false;
    }
  }, [t]);

  // Pin/unpin conversation
  const pinConversation = useCallback(async (id: number, pin: boolean) => {
    try {
      await aiChatApi.pinConversation(id, pin);
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, isPinned: pin } : c
      ));
    } catch (error) {
      console.error('Failed to pin conversation:', error);
    }
  }, []);

  // Archive/unarchive conversation
  const archiveConversation = useCallback(async (id: number, archive: boolean) => {
    try {
      await aiChatApi.archiveConversation(id, archive);
      setConversations(prev => prev.map(c => 
        c.id === id ? { ...c, isArchived: archive } : c
      ));
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  }, []);

  // Update message feedback
  const updateFeedback = useCallback(async (messageId: number, feedback: 'liked' | 'disliked' | null) => {
    try {
      await aiChatApi.updateMessageFeedback(messageId, feedback);
      setCurrentMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, feedback: feedback || undefined } : m
      ));
    } catch (error) {
      console.error('Failed to update feedback:', error);
    }
  }, []);

  // Start new conversation (clear current)
  const startNewConversation = useCallback(() => {
    setCurrentConversationId(null);
    setCurrentMessages([]);
    pendingConversationRef.current = null;
  }, []);

  // Toggle auto-save
  const setAutoSaveEnabled = useCallback((enabled: boolean) => {
    autoSaveEnabledRef.current = enabled;
  }, []);

  return {
    // State
    conversations,
    currentConversationId,
    currentMessages,
    isLoading,
    isLoadingMessages,
    isSaving,
    
    // Actions
    fetchConversations,
    createConversation,
    ensureConversation,
    loadConversation,
    autoSaveMessage,
    saveMessagePair,
    deleteConversation,
    renameConversation,
    clearAllConversations,
    pinConversation,
    archiveConversation,
    updateFeedback,
    startNewConversation,
    setCurrentConversationId,
    setAutoSaveEnabled,
  };
}
