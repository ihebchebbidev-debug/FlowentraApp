import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { streamChatCompletion } from '@/services/openRouterService';
import aiChatApi, { AiConversation } from '@/services/api/aiChatService';
import { 
  Plus, MessageSquare, Trash2, MoreVertical, CheckCircle2, 
  Loader2, Sparkles, ExternalLink, FileText 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AiThinkingIndicator } from '@/components/ai-assistant/AiThinkingIndicator';
import { toast } from 'sonner';
import {
  detectFormCreationIntent,
  detectFormCreationIntentSmart,
  parseFormCreationFromResponse,
  executeFormCreation,
  PendingFormCreation,
  ParsedFormData,
  getFormCreationPrompt
} from '@/services/ai/aiFormCreationService';
import { FormPreviewCard } from './FormPreviewCard';
import { CleanAiMessageContent } from './CleanAiMessageContent';

interface Message {
  id?: number;
  localId: string;
  from: 'user' | 'gpt';
  text: string;
  pendingForm?: PendingFormCreation;
  formCreated?: boolean;
  formEditUrl?: string;
}

export default function GPTChat() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [creatingForm, setCreatingForm] = useState(false);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const streamingRef = useRef('');
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const response = await aiChatApi.getConversations(1, 50);
      setConversations(response.conversations || []);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      setLoading(true);
      const conversation = await aiChatApi.getConversation(id, true);
      setActiveConversationId(id);
      
      // Convert backend messages to local format
      const loadedMessages: Message[] = (conversation.messages || []).map((msg, idx) => ({
        id: msg.id,
        localId: `loaded-${msg.id || idx}`,
        from: msg.role === 'user' ? 'user' : 'gpt',
        text: msg.content
      }));
      setMessages(loadedMessages);
    } catch (error) {
      // Silent failure: don't surface to users. Logged for diagnostics only.
      console.error('Failed to load conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  const createNewConversation = async (firstMessage?: string) => {
    try {
      const title = firstMessage 
        ? firstMessage.slice(0, 50) + (firstMessage.length > 50 ? '...' : '')
        : 'New Conversation';
      const conversation = await aiChatApi.createConversation(title);
      setConversations(prev => [conversation, ...prev]);
      setActiveConversationId(conversation.id);
      setMessages([]);
      return conversation.id;
    } catch (error) {
      console.error('Failed to create conversation:', error);
      toast.error('Failed to create conversation');
      return null;
    }
  };

  const deleteConversation = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await aiChatApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
    } catch (error) {
      console.error('Failed to delete conversation:', error);
      toast.error('Failed to delete conversation');
    }
  };

  // Handle form creation
  const handleCreateForm = useCallback(async (messageId: string, formData: ParsedFormData) => {
    setCreatingForm(true);
    
    try {
      const { result, formattedMessage } = await executeFormCreation(formData, 'en');
      
      // Update message to show created form
      setMessages(prev => 
        prev.map(msg => 
          msg.localId === messageId
            ? { 
                ...msg, 
                pendingForm: undefined,
                formCreated: true,
                formEditUrl: result.editUrl
              }
            : msg
        )
      );
      
      toast.success(result.success 
        ? `Form "${result.form?.name_en}" created successfully!`
        : `Failed: ${result.error}`
      );
      
    } catch (error) {
      toast.error('Failed to create form');
    } finally {
      setCreatingForm(false);
    }
  }, []);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Detect if this is a form creation request - use smart detection with LLM fallback
    const formIntent = await detectFormCreationIntentSmart(userMessage);
    const isFormRequest = formIntent.hasIntent;
    console.log('[GPTChat] Form intent detection:', formIntent.source, 'confidence:', formIntent.confidence);
    
    // Ensure we have an active conversation
    let conversationId = activeConversationId;
    if (!conversationId) {
      conversationId = await createNewConversation(userMessage);
      if (!conversationId) return;
    }

    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `gpt-${Date.now()}`;

    // Add user message to UI immediately
    setMessages(prev => [...prev, { localId: userMsgId, from: 'user', text: userMessage }]);
    setLoading(true);
    streamingRef.current = '';

    // Save user message to backend
    try {
      await aiChatApi.addMessage(conversationId, 'user', userMessage);
    } catch (error) {
      console.error('Failed to save user message:', error);
    }

    // Add empty assistant message for streaming
    setMessages(prev => [...prev, { localId: assistantMsgId, from: 'gpt', text: '' }]);

    // Build conversation history for context
    const history = messages.map(msg => ({
      role: msg.from === 'user' ? 'user' as const : 'assistant' as const,
      content: msg.text
    }));

    // Add form creation prompt if detected
    const systemMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [];
    if (isFormRequest) {
      systemMessages.push({
        role: 'system',
        content: getFormCreationPrompt(formIntent.language, formIntent.extractedContext)
      });
    }

    await streamChatCompletion(
      [...systemMessages, ...history, { role: 'user', content: userMessage }],
      {
        onToken: (token) => {
          streamingRef.current += token;
          setMessages(prev => {
            const updated = [...prev];
            const lastIdx = updated.findIndex(m => m.localId === assistantMsgId);
            if (lastIdx >= 0) {
              updated[lastIdx] = { ...updated[lastIdx], text: streamingRef.current };
            }
            return updated;
          });
        },
        onComplete: async () => {
          const finalContent = streamingRef.current;
          
          // Save assistant response to backend
          if (conversationId && finalContent) {
            try {
              await aiChatApi.addMessage(conversationId, 'assistant', finalContent);
              loadConversations();
            } catch (error) {
              console.error('Failed to save assistant message:', error);
            }
          }
          
          // Auto-create form if response contains one (with fallback generation)
          if (isFormRequest && finalContent) {
            const pendingForm = parseFormCreationFromResponse(finalContent, userMessage, formIntent.extractedContext);
            if (pendingForm) {
              // Auto-create the form
              try {
                const { result } = await executeFormCreation(pendingForm.data, 'en');
                if (result.success) {
                  setMessages(prev => 
                    prev.map(msg => 
                      msg.localId === assistantMsgId
                        ? { ...msg, formCreated: true, formEditUrl: result.editUrl }
                        : msg
                    )
                  );
                  toast.success(`Form "${result.form?.name_en}" created!`);
                }
              } catch (error) {
                console.error('Failed to auto-create form:', error);
              }
            }
          }
          
          setLoading(false);
        },
        onError: (error) => {
          const errorMessage = `Sorry, I encountered an error: ${error}. Please try again.`;
          setMessages(prev => 
            prev.map(msg => 
              msg.localId === assistantMsgId
                ? { ...msg, text: errorMessage }
                : msg
            )
          );
          setLoading(false);
        }
      }
    );
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4 max-w-6xl mx-auto py-4">
      {/* Conversation Sidebar */}
      <Card className="w-64 flex-shrink-0 flex flex-col">
        <div className="p-3 border-b">
          <Button 
            onClick={() => createNewConversation()} 
            className="w-full gap-2"
            variant="outline"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>
        <ScrollArea className="flex-1">
          <div className="p-2 space-y-1">
            {loadingConversations ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Loading...
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No conversations yet
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  onClick={() => loadConversation(conv.id)}
                  className={`group flex items-center gap-2 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors ${
                    activeConversationId === conv.id ? 'bg-accent' : ''
                  }`}
                >
                  <MessageSquare className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{conv.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDate(conv.lastMessageAt || conv.createdAt)}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                      <DropdownMenuItem 
                        onClick={(e) => deleteConversation(conv.id, e as any)}
                        className="text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col min-w-0">
        <div className="p-3 border-b border-border/60">
          <h2 className="text-base font-semibold text-foreground">AI Assistant</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {activeConversationId 
              ? conversations.find(c => c.id === activeConversationId)?.title || 'Conversation'
              : 'Start a new conversation'}
          </p>
        </div>
        
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4 overflow-hidden">
          <div className="flex flex-col gap-4 w-full max-w-full overflow-hidden">
            {messages.length === 0 && !loading && (
              <div className="text-center text-muted-foreground py-8">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>How can I help you today?</p>
                <p className="text-sm mt-2">Ask me to create forms, manage tasks, or answer questions.</p>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInput('Create a form for vehicle inspection')}
                  >
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    Create inspection form
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setInput('Create a customer satisfaction survey')}
                  >
                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                    Satisfaction survey
                  </Button>
                </div>
              </div>
            )}
            
            {messages.map((msg) => (
              <div key={msg.localId} className="flex flex-col gap-2 w-full min-w-0">
                <div 
                  className={`rounded-xl px-3.5 py-2.5 min-w-0 overflow-hidden text-[13px] leading-relaxed ${
                    msg.from === 'user' 
                      ? 'bg-primary text-primary-foreground ml-auto w-fit max-w-[85%] rounded-br-sm' 
                      : 'bg-muted/60 border border-border/40 mr-auto w-fit max-w-[85%] rounded-bl-sm'
                  }`}
                >
                  <span className="font-medium text-[11px] text-muted-foreground/70 mb-1 block uppercase tracking-wider">
                    {msg.from === 'user' ? 'You' : 'Assistant'}
                  </span>
                  {msg.from === 'user' ? (
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                  ) : (
                    <div className="min-w-0 max-w-full overflow-hidden">
                      <CleanAiMessageContent 
                        content={msg.text || '...'} 
                        hideFormJson={!!msg.pendingForm || msg.formCreated}
                      />
                    </div>
                  )}
                </div>
                
                {/* Form creation card */}
                {msg.from === 'gpt' && msg.pendingForm && !msg.formCreated && (
                  <FormPreviewCard
                    formData={msg.pendingForm.data}
                    onCreateForm={() => handleCreateForm(msg.localId, msg.pendingForm!.data)}
                    isCreating={creatingForm}
                  />
                )}
                
                {/* Form created success */}
                {msg.from === 'gpt' && msg.formCreated && msg.formEditUrl && (
                  <div className="ml-0 p-3 bg-success/10 border border-success/30 rounded-lg max-w-[85%]">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-success" />
                      <span className="text-sm font-medium text-success">Form created successfully!</span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 gap-1.5"
                      onClick={() => navigate(msg.formEditUrl!)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Edit Form
                    </Button>
                  </div>
                )}
              </div>
            ))}
            
            {loading && messages[messages.length - 1]?.text === '' && (
              <AiThinkingIndicator />
            )}
          </div>
        </ScrollArea>

        <form className="p-3 border-t border-border/60 flex gap-2" onSubmit={sendMessage}>
          <Input
            placeholder="Ask me to create a form, answer questions..."
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            autoFocus
            className="flex-1 h-9 text-[13px] rounded-lg border-border/60 focus-visible:border-primary/50"
          />
          <Button type="submit" disabled={loading || !input.trim()} className="h-9 px-4 rounded-lg text-[13px]">
            Send
          </Button>
        </form>
      </Card>
    </div>
  );
}
